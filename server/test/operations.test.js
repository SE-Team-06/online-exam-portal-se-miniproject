import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { fileURLToPath } from 'node:url';
import app from '../src/app.js';
import { Attempt, AuditLog, Exam, Notification, Question, Session, User } from '../src/models/index.js';
import { hashPassword } from '../src/security/password.js';
import { createBackup, listBackups, restoreBackup } from '../src/ops/backup.js';
import { availabilityByMonth } from '../src/ops/availability.js';

// Issue #23 / OEPSE-26: NFR-OE-004, NFR-OE-006, NFR-OE-014
let mongo; let backupDir; let admin; let csrfAdmin;
before(async () => {
  process.env.MONGOMS_DOWNLOAD_DIR ??= fileURLToPath(new URL('../../.cache/mongodb-binaries', import.meta.url));
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  backupDir = await mkdtemp(path.join(tmpdir(), 'oep-backups-'));
  const passwordHash = await hashPassword('AdminPass123');
  await User.create({ name: 'Admin', email: 'admin@ops.test', passwordHash, role: 'Administrator', emailVerified: true });
  admin = request.agent(app);
  csrfAdmin = (await admin.post('/api/auth/login').set('x-forwarded-for', '192.0.2.10').send({ email: 'admin@ops.test', password: 'AdminPass123' }).expect(200)).body.csrfToken;
});
after(async () => { await rm(backupDir, { recursive: true, force: true }); if (mongoose.connection.readyState) await mongoose.disconnect(); await mongo?.stop(); });

describe('daily backups (NFR-OE-006)', () => {
  it('writes every collection to one compressed file and restores it exactly', async () => {
    const owner = await User.create({ name: 'Backup Instructor', email: 'backup-i@ops.test', passwordHash: 'x', role: 'Instructor', emailVerified: true });
    const question = await Question.create({ ownerId: owner._id, text: 'Backed up?', options: [{ _id: 'a', text: 'Yes' }, { _id: 'b', text: 'No' }], correctOptionId: 'a', marks: 1 });
    const result = await createBackup(backupDir);
    assert.ok(result.file.endsWith('.json.gz'));
    assert.ok(result.collections.users >= 2 && result.collections.questions === 1);

    await Question.deleteMany({}); await User.deleteOne({ _id: owner._id });
    const restored = await restoreBackup(result.file);
    assert.equal(restored.questions, 1);
    const back = await Question.findById(question._id).select('+correctOptionId');
    assert.equal(back.text, 'Backed up?');
    assert.equal(back.correctOptionId, 'a');
    assert.ok(await User.exists({ _id: owner._id }));
  });

  it('keeps only the latest seven backups', async () => {
    const start = Date.parse('2026-10-01T02:00:00Z');
    for (let day = 0; day < 9; day += 1) await createBackup(backupDir, { now: new Date(start + day * 86_400_000), retain: 7 });
    const files = (await listBackups(backupDir)).map((file) => path.basename(file));
    assert.equal(files.length, 7);
    assert.ok(!files.some((file) => file.includes('2026-10-01') || file.includes('2026-10-02')));
    assert.ok(files.some((file) => file.includes('2026-10-09')));
    assert.equal((await readdir(backupDir)).length, 7);
  });
});

describe('availability during exam windows (NFR-OE-004)', () => {
  const windows = [{ startAt: '2026-10-10T04:00:00Z', endAt: '2026-10-10T06:00:00Z' }, { startAt: '2026-11-02T04:00:00Z', endAt: '2026-11-02T05:00:00Z' }];
  const minute = (iso, offset) => new Date(Date.parse(iso) + offset * 60_000).toISOString();
  it('counts only samples inside exam windows and reports each month against 99.5%', () => {
    const samples = [
      ...Array.from({ length: 120 }, (_, i) => ({ at: minute('2026-10-10T04:00:00Z', i), up: i !== 5 })),
      ...Array.from({ length: 60 }, (_, i) => ({ at: minute('2026-11-02T04:00:00Z', i), up: true })),
      { at: '2026-10-10T08:00:00Z', up: false },
    ];
    assert.deepEqual(availabilityByMonth(samples, windows), [
      { month: '2026-10', samples: 120, up: 119, availability: 99.17, meetsTarget: false },
      { month: '2026-11', samples: 60, up: 60, availability: 100, meetsTarget: true },
    ]);
  });
  it('returns nothing when no sample falls inside an exam window', () => {
    assert.deepEqual(availabilityByMonth([{ at: '2026-10-11T00:00:00Z', up: false }], windows), []);
  });
});

describe('retention and data deletion on request (NFR-OE-014)', () => {
  it('only deletes data of a deactivated account, keeps audit history, and refuses content owners', async () => {
    const student = await User.create({ name: 'Leaving Student', email: 'leaving@ops.test', passwordHash: 'x', role: 'Student', emailVerified: true });
    const owner = await User.create({ name: 'Owner', email: 'owner@ops.test', passwordHash: 'x', role: 'Instructor', emailVerified: true, active: false });
    const question = await Question.create({ ownerId: owner._id, text: 'Kept?', options: [{ _id: 'a', text: 'Yes' }, { _id: 'b', text: 'No' }], correctOptionId: 'a', marks: 1 });
    const exam = await Exam.create({ ownerId: owner._id, title: 'Retention', durationMinutes: 5, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 60_000), passMark: 1, questionIds: [question._id], assignedStudentIds: [student._id], status: 'Published' });
    await Attempt.create({ examId: exam._id, studentId: student._id, startedAt: new Date(), endsAt: new Date(Date.now() + 60_000), answers: [{ questionId: question._id }] });
    await Notification.create({ recipientId: student._id, type: 'EXAM_ASSIGNED', referenceId: exam._id, title: 'Assigned', message: 'Assigned' });
    await AuditLog.create({ action: 'LOGIN_SUCCESS', userId: student._id });

    const del = (id) => admin.delete(`/api/admin/users/${id}/data`).set('x-csrf-token', csrfAdmin);
    assert.equal((await del(student.id).expect(409)).body.error.code, 'USER_ACTIVE');
    await User.updateOne({ _id: student._id }, { active: false });
    const response = await del(student.id).expect(200);
    assert.deepEqual(response.body.deleted, { attempts: 1, notifications: 1, sessions: 0, user: 1 });
    assert.equal(await User.exists({ _id: student._id }), null);
    assert.equal(await Attempt.exists({ studentId: student._id }), null);
    assert.deepEqual((await Exam.findById(exam._id)).assignedStudentIds, []);
    assert.ok(await AuditLog.exists({ action: 'LOGIN_SUCCESS', userId: student._id }), 'audit history is retained');
    assert.ok(await AuditLog.exists({ action: 'USER_DATA_DELETED', 'details.deletedUserId': student.id }));

    assert.equal((await del(owner.id).expect(409)).body.error.code, 'USER_OWNS_CONTENT');
    await del(student.id).expect(404);
  });

  it('has no automatic expiry on attempts, results or audit records', async () => {
    const expiring = ([, options]) => options.expireAfterSeconds !== undefined || options.expires !== undefined;
    for (const model of [Attempt, AuditLog, Exam, User]) assert.ok(!model.schema.indexes().some(expiring), `${model.modelName} must not expire`);
    assert.ok(Session.schema.indexes().some(expiring), 'only sessions expire');
    await Promise.all([Attempt.init(), AuditLog.init(), Exam.init(), User.init(), Session.init()]);
    for (const model of [Attempt, AuditLog, Exam, User]) {
      const indexes = await model.collection.indexes();
      assert.ok(!indexes.some((index) => index.expireAfterSeconds !== undefined), `${model.collection.collectionName} must have no MongoDB TTL index`);
    }
    const sessionIndexes = await Session.collection.indexes();
    assert.ok(sessionIndexes.some((index) => index.expireAfterSeconds === 0 && index.key.expiresAt === 1), 'sessions use the expiresAt TTL index');
  });
});

describe('administrator audit review (OEPSE-23)', () => {
  it('filters audit records and redacts sensitive detail fields', async () => {
    await AuditLog.create({
      action: 'REVIEW_TEST',
      userId: admin.userId,
      ip: '192.0.2.20',
      details: { attemptId: 'attempt-1', email: 'private@example.test', csrfToken: 'secret-token' },
    });
    const response = await admin.get('/api/admin/audit-logs?action=REVIEW_TEST&limit=10').expect(200);
    assert.equal(response.body.total, 1);
    assert.equal(response.body.logs.length, 1);
    assert.deepEqual(response.body.logs[0].details, { attemptId: 'attempt-1' });
    assert.equal(response.body.logs[0].ip, '192.0.2.20');
    await admin.get('/api/admin/audit-logs?from=2026-11-02&to=2026-11-01').expect(400);
  });

  it('applies user/date filters and paginates audit records for administrators only', async () => {
    const auditUser = await User.findOne({ email: 'admin@ops.test' });
    const base = new Date('2026-10-20T12:00:00.000Z');
    await AuditLog.create([0, 1, 2].map((offset) => ({
      action: 'REVIEW_PAGE_TEST', userId: auditUser._id, ip: `192.0.2.${30 + offset}`,
      timestamp: new Date(base.getTime() + offset * 60_000), details: { item: offset },
    })));
    const query = `action=REVIEW_PAGE_TEST&userId=${auditUser.id}&from=2026-10-20T12%3A00%3A00.000Z&to=2026-10-20T12%3A02%3A00.000Z&limit=1`;
    const first = await admin.get(`/api/admin/audit-logs?${query}&page=1`).expect(200);
    const second = await admin.get(`/api/admin/audit-logs?${query}&page=2`).expect(200);
    assert.equal(first.body.total, 3);
    assert.equal(second.body.total, 3);
    assert.equal(first.body.logs.length, 1);
    assert.equal(second.body.logs.length, 1);
    assert.notEqual(first.body.logs[0].id, second.body.logs[0].id);

    const student = await User.create({ name: 'Audit Reader Denied', email: 'audit-reader-denied@ops.test', passwordHash: await hashPassword('StudentPass123'), role: 'Student', emailVerified: true });
    const studentAgent = request.agent(app);
    const studentCsrf = (await studentAgent.post('/api/auth/login').send({ email: student.email, password: 'StudentPass123' }).expect(200)).body.csrfToken;
    await studentAgent.get('/api/admin/audit-logs').expect(403);
    await studentAgent.get('/api/admin/audit-logs').set('x-csrf-token', studentCsrf).expect(403);

    // Audit review is read-only through the application API, including for admins.
    await admin.post('/api/admin/audit-logs').set('x-csrf-token', csrfAdmin).send({ action: 'FORGED' }).expect(404);
    await admin.patch('/api/admin/audit-logs').set('x-csrf-token', csrfAdmin).send({ action: 'FORGED' }).expect(404);
    await admin.delete('/api/admin/audit-logs').set('x-csrf-token', csrfAdmin).expect(404);
  });
});

describe('health check reflects the database (NFR-OE-004)', () => {
  it('returns 200 when the database answers and 503 when it does not', async () => {
    const up = await request(app).get('/api/health').expect(200);
    assert.deepEqual([up.body.status, up.body.database], ['ok', 'up']);
    await mongoose.disconnect();
    const down = await request(app).get('/api/health').expect(503);
    assert.deepEqual([down.body.status, down.body.database], ['degraded', 'down']);
  });
});
