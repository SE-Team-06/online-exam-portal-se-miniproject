import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { fileURLToPath } from 'node:url';
import app from '../src/app.js';
import { AuditLog, Session, User } from '../src/models/index.js';
import { hashPassword } from '../src/security/password.js';

let mongo;
let admin;
let student;
let csrfAdmin;
let csrfStudent;

before(async () => {
  process.env.MONGOMS_DOWNLOAD_DIR ??= fileURLToPath(new URL('../../.cache/mongodb-binaries', import.meta.url));
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  const passwordHash = await hashPassword('AdminPass123');
  await User.create([
    { name: 'Administrator', email: 'admin@users.test', passwordHash, role: 'Administrator', emailVerified: true },
    { name: 'Student', email: 'student@users.test', passwordHash, role: 'Student', emailVerified: true },
  ]);
  admin = request.agent(app);
  student = request.agent(app);
  csrfAdmin = (await admin.post('/api/auth/login').send({ email: 'admin@users.test', password: 'AdminPass123' }).expect(200)).body.csrfToken;
  csrfStudent = (await student.post('/api/auth/login').send({ email: 'student@users.test', password: 'AdminPass123' }).expect(200)).body.csrfToken;
});

after(async () => {
  if (mongoose.connection.readyState) await mongoose.disconnect();
  await mongo?.stop();
});

describe('administrator account lifecycle (OEPSE-8)', () => {
  it('creates, lists, edits, deactivates and role changes accounts with safe access and audit', async () => {
    await student.get('/api/admin/users').expect(403);
    await student.post('/api/admin/users').set('x-csrf-token', csrfStudent).send({}).expect(403);

    await admin.post('/api/admin/users').send({}).expect(403);
    await admin.post('/api/admin/users').set('x-csrf-token', csrfAdmin).send({ name: 'Bad', email: 'bad@example.test', password: 'weak', role: 'Student' }).expect(400);

    const created = await admin.post('/api/admin/users').set('x-csrf-token', csrfAdmin).send({
      name: 'New Instructor', email: 'NEW@users.test', password: 'InstructorPass123', role: 'Instructor',
    }).expect(201);
    const userId = created.body.user.id;
    assert.equal(created.body.user.email, 'new@users.test');
    assert.equal(created.body.user.role, 'Instructor');
    assert.equal(created.body.user.emailVerified, true);
    assert.equal(created.body.user.passwordHash, undefined);
    const createdAgent = request.agent(app);
    await createdAgent.post('/api/auth/login').send({ email: 'new@users.test', password: 'InstructorPass123' }).expect(200);
    await admin.post('/api/admin/users').set('x-csrf-token', csrfAdmin).send({ name: 'Duplicate', email: 'new@users.test', password: 'InstructorPass123', role: 'Student' }).expect(409);

    const listing = await admin.get('/api/admin/users').expect(200);
    assert.ok(listing.body.users.some((user) => user.id === userId));
    assert.ok(listing.body.users.every((user) => user.passwordHash === undefined));

    const changed = await admin.patch(`/api/admin/users/${userId}`).set('x-csrf-token', csrfAdmin).send({ name: 'Updated Instructor', role: 'Administrator' }).expect(200);
    assert.equal(changed.body.user.name, 'Updated Instructor');
    assert.equal(changed.body.user.role, 'Administrator');
    const roleAudit = await AuditLog.findOne({ action: 'USER_UPDATED', 'details.targetUserId': userId });
    assert.deepEqual(roleAudit.details.roleChange, { from: 'Instructor', to: 'Administrator' });
    await createdAgent.get('/api/auth/me').expect(401);
    await createdAgent.post('/api/auth/login').send({ email: 'new@users.test', password: 'InstructorPass123' }).expect(200);

    await admin.patch(`/api/admin/users/${userId}`).set('x-csrf-token', csrfAdmin).send({ active: false }).expect(200);
    assert.equal(await Session.countDocuments({ userId }), 0);
    assert.equal((await User.findById(userId)).active, false);
    await createdAgent.get('/api/auth/me').expect(401);
    await admin.patch(`/api/admin/users/${userId}`).set('x-csrf-token', csrfAdmin).send({ active: true }).expect(200);
    const reactivated = await User.findById(userId);
    assert.equal(reactivated.active, true);
    assert.equal(reactivated.email, 'new@users.test');

    const selfId = String((await User.findOne({ email: 'admin@users.test' }))._id);
    await admin.patch(`/api/admin/users/${selfId}`).set('x-csrf-token', csrfAdmin).send({ active: false }).expect(409);
    await admin.patch(`/api/admin/users/${selfId}`).set('x-csrf-token', csrfAdmin).send({ role: 'Student' }).expect(409);

    const secondAdmin = await User.create({ name: 'Second Admin', email: 'second-admin@users.test', passwordHash, role: 'Administrator', emailVerified: true });
    const secondAdminId = String(secondAdmin._id);
    await admin.patch(`/api/admin/users/${secondAdminId}`).set('x-csrf-token', csrfAdmin).send({ role: 'Instructor' }).expect(200);
    assert.deepEqual((await AuditLog.findOne({ action: 'USER_UPDATED', 'details.targetUserId': secondAdminId })).details.roleChange,
      { from: 'Administrator', to: 'Instructor' });

    assert.ok(await AuditLog.exists({ action: 'USER_CREATED', 'details.targetUserId': userId }));
    assert.ok(await AuditLog.exists({ action: 'USER_UPDATED', 'details.targetUserId': userId }));
    const logs = await admin.get('/api/admin/audit-logs?action=USER_UPDATED').expect(200);
    assert.ok(logs.body.total >= 2);
  });
});
