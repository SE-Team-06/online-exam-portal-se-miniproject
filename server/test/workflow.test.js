import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { fileURLToPath } from 'node:url';
import app, { submitExpiredAttempts } from '../src/app.js';
import { User, Question, Exam, Attempt, AuditLog } from '../src/models/index.js';
import { hashPassword, verifyPassword } from '../src/security/password.js';

let mongo; let instructor; let student; let stranger; let otherInstructor; let instructorAgent; let studentAgent; let strangerAgent; let otherInstructorAgent; let csrfInstructor; let csrfStudent; let csrfStranger; let csrfOtherInstructor; let examId; let questionId; let attemptId; let loginAddress = 0;
const login = async (agent, email) => { loginAddress += 1; const response = await agent.post('/api/auth/login').set('x-forwarded-for', `203.0.113.${loginAddress}`).send({ email, password: 'TestPass123' }).expect(200); return response.body.csrfToken; };
const withDirectRequestIp = async (work) => {
  const priorTrustProxy = app.get('trust proxy');
  app.set('trust proxy', false);
  try { return await work(); } finally { app.set('trust proxy', priorTrustProxy); }
};
const examPayload = (overrides = {}) => ({
  title: 'Lifecycle test', durationMinutes: 10,
  startAt: new Date(Date.now() - 60_000).toISOString(), endAt: new Date(Date.now() + 600_000).toISOString(),
  passMark: 1, negativeMark: 0, questionIds: [questionId], assignedStudentIds: [String(student._id)], reviewEnabled: false,
  ...overrides,
});
before(async () => {
  process.env.MONGOMS_DOWNLOAD_DIR ??= fileURLToPath(new URL('../../.cache/mongodb-binaries', import.meta.url));
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const passwordHash = await hashPassword('TestPass123');
  [instructor, student, stranger, otherInstructor] = await Promise.all([
    User.create({ name: 'Instructor', email: 'i@example.test', passwordHash, role: 'Instructor', emailVerified: true }),
    User.create({ name: 'Student', email: 's@example.test', passwordHash, role: 'Student', emailVerified: true }),
    User.create({ name: 'Other Student', email: 'x@example.test', passwordHash, role: 'Student', emailVerified: true }),
    User.create({ name: 'Other Instructor', email: 'other-i@example.test', passwordHash, role: 'Instructor', emailVerified: true }),
  ]);
  instructorAgent = request.agent(app); studentAgent = request.agent(app); strangerAgent = request.agent(app); otherInstructorAgent = request.agent(app);
  csrfInstructor = await login(instructorAgent, instructor.email); csrfStudent = await login(studentAgent, student.email); csrfStranger = await login(strangerAgent, stranger.email); csrfOtherInstructor = await login(otherInstructorAgent, otherInstructor.email);
  const q = await instructorAgent.post('/api/questions').set('x-csrf-token', csrfInstructor).send({ text: 'One plus one?', options: [{ id: 'a', text: '2' }, { id: 'b', text: '3' }], correctOptionId: 'a', marks: 2 }).expect(201);
  questionId = q.body.id;
  const exam = await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send({ title: 'Arithmetic', durationMinutes: 5, startAt: new Date(Date.now() - 60_000).toISOString(), endAt: new Date(Date.now() + 600_000).toISOString(), passMark: 2, questionIds: [questionId], assignedStudentIds: [String(student._id)] }).expect(201);
  examId = exam.body.id;
});
after(async () => { await mongoose.disconnect(); await mongo?.stop(); });

describe('SRS-aligned exam workflow', () => {
  it('rejects unauthenticated requests and invalid credentials', async () => {
    await request(app).get('/api/exams').expect(401);
    await request(app).post('/api/auth/login').send({ email: 'i@example.test', password: 'incorrect' }).expect(401);
  });
  it('stores a salted password hash and never selects it by default', async () => {
    const hidden = await User.findById(student._id);
    const stored = await User.findById(student._id).select('+passwordHash');
    assert.equal(hidden.passwordHash, undefined);
    assert.notEqual(stored.passwordHash, 'TestPass123');
    assert.equal(await verifyPassword('TestPass123', stored.passwordHash), true);
    assert.notEqual(await hashPassword('TestPass123'), stored.passwordHash);
  });
  it('returns the signed-in role and invalidates the session on logout', async () => {
    const agent = request.agent(app);
    const csrf = await login(agent, instructor.email);
    const current = await agent.get('/api/auth/me').expect(200);
    assert.equal(current.body.user.role, 'Instructor');
    await agent.post('/api/auth/logout').set('x-csrf-token', csrf).expect(204);
    await agent.get('/api/auth/me').expect(401);
  });
  it('locks an account after five consecutive invalid passwords', async () => {
    const hash = await hashPassword('TestPass123');
    const lockedUser = await User.create({ name: 'Lockout', email: 'lockout@example.test', passwordHash: hash, role: 'Student', emailVerified: true });
    const agent = request.agent(app);
    for (let i = 0; i < 4; i += 1) await agent.post('/api/auth/login').send({ email: lockedUser.email, password: 'WrongPass123' }).expect(401);
    const beforeFifthFailure = Date.now();
    await agent.post('/api/auth/login').send({ email: lockedUser.email, password: 'WrongPass123' }).expect(401);
    const afterFifthFailure = Date.now();
    const updated = await User.findById(lockedUser._id);
    assert.ok(updated.lockedUntil.getTime() >= beforeFifthFailure + 15 * 60_000);
    assert.ok(updated.lockedUntil.getTime() <= afterFifthFailure + 15 * 60_000);
    await agent.post('/api/auth/login').send({ email: lockedUser.email, password: 'TestPass123' }).expect(401);
    assert.equal((await User.findById(lockedUser._id)).lockedUntil.getTime(), updated.lockedUntil.getTime());
  });
  it('enforces roles and CSRF protection for state changes', async () => {
    await studentAgent.post('/api/questions').set('x-csrf-token', csrfStudent).send({}).expect(403);
    await instructorAgent.post('/api/questions').send({}).expect(403);
    await studentAgent.get('/api/questions').expect(403);
    await studentAgent.get('/api/students').expect(403);
  });
  it('lists only instructor-owned questions without exposing answer keys', async () => {
    const listed = await instructorAgent.get('/api/questions').expect(200);
    assert.equal(listed.body.questions.length, 1);
    assert.equal(listed.body.questions[0].id, questionId);
    assert.equal(listed.body.questions[0].correctOptionId, 'a');
    assert.deepEqual(listed.body.questions[0].options.map((option) => option.id), ['a', 'b']);
    const students = await instructorAgent.get('/api/students').expect(200);
    assert.deepEqual(students.body.students.map((entry) => entry.email).sort(), ['lockout@example.test', 's@example.test', 'x@example.test']);
    assert.ok(students.body.students.every((entry) => entry.passwordHash === undefined));
  });
  it('validates question structure and exam references', async () => {
    await instructorAgent.post('/api/questions').set('x-csrf-token', csrfInstructor).send({ text: 'Bad', options: [{ id: 'a', text: 'A' }, { id: 'a', text: 'Duplicate' }], correctOptionId: 'z', marks: 1 }).expect(400);
    await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send({ title: 'Bad', durationMinutes: 5, startAt: new Date().toISOString(), endAt: new Date(Date.now() + 10000).toISOString(), passMark: 1, questionIds: [String(new mongoose.Types.ObjectId())] }).expect(400);
  });
  it('supports owner-scoped question editing and deletion with safe validation', async () => {
    const created = await instructorAgent.post('/api/questions').set('x-csrf-token', csrfInstructor).send({
      text: 'Temporary question', options: [{ id: 'first', text: 'First' }, { id: 'second', text: 'Second' }], correctOptionId: 'second', marks: 1,
    }).expect(201);
    const id = created.body.id;
    await studentAgent.put(`/api/questions/${id}`).set('x-csrf-token', csrfStudent).send({}).expect(403);
    await studentAgent.delete(`/api/questions/${id}`).set('x-csrf-token', csrfStudent).expect(403);
    await otherInstructorAgent.put(`/api/questions/${id}`).set('x-csrf-token', csrfOtherInstructor).send({ text: 'No', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionId: 'a', marks: 1 }).expect(404);
    await otherInstructorAgent.delete(`/api/questions/${id}`).set('x-csrf-token', csrfOtherInstructor).expect(404);
    await instructorAgent.put('/api/questions/not-an-id').set('x-csrf-token', csrfInstructor).send({}).expect(400);
    await instructorAgent.put(`/api/questions/${new mongoose.Types.ObjectId()}`).set('x-csrf-token', csrfInstructor).send({}).expect(400);
    await instructorAgent.put(`/api/questions/${id}`).set('x-csrf-token', csrfInstructor).send({ text: 'Changed', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionId: 'missing', marks: 1 }).expect(400);
    await instructorAgent.put(`/api/questions/${id}`).set('x-csrf-token', csrfInstructor).send({ text: 'Changed', options: [{ id: 'a', text: 'A' }, { id: 'b', text: '   ' }], correctOptionId: 'a', marks: 1 }).expect(400);
    await instructorAgent.put(`/api/questions/${new mongoose.Types.ObjectId()}`).set('x-csrf-token', csrfInstructor).send({ text: 'Changed', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionId: 'a', marks: 1 }).expect(404);

    const updated = await instructorAgent.put(`/api/questions/${id}`).set('x-csrf-token', csrfInstructor).send({
      text: 'Updated temporary question', options: [{ id: 'first', text: 'Updated first' }, { id: 'second', text: 'Updated second' }], correctOptionId: 'first', marks: 3,
    }).expect(200);
    assert.equal(updated.body.text, 'Updated temporary question');
    assert.equal(updated.body.correctOptionId, 'first');
    assert.equal((await Question.findById(id).select('+correctOptionId')).correctOptionId, 'first');
    await instructorAgent.delete(`/api/questions/${id}`).set('x-csrf-token', csrfInstructor).expect(204);
    await instructorAgent.delete(`/api/questions/${id}`).set('x-csrf-token', csrfInstructor).expect(404);
  });
  it('returns a safe validation response for malformed JSON', async () => {
    const response = await request(app).post('/api/questions').set('Content-Type', 'application/json').send('{"text":');
    assert.equal(response.status, 400);
    assert.equal(response.body.error.code, 'INVALID_JSON');
    assert.equal(response.body.error.message, 'Request body must be valid JSON.');
  });
  it('prevents editing or deleting a question already referenced by an exam', async () => {
    const body = { text: 'Changed', options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correctOptionId: 'a', marks: 2 };
    await instructorAgent.put(`/api/questions/${questionId}`).set('x-csrf-token', csrfInstructor).send(body).expect(409);
    await instructorAgent.delete(`/api/questions/${questionId}`).set('x-csrf-token', csrfInstructor).expect(409);
  });
  it('rejects invalid schedules and duplicate question selections', async () => {
    const startAt = new Date(Date.now() + 60_000).toISOString();
    const endAt = new Date(Date.now() + 30_000).toISOString();
    await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send({
      title: 'Invalid schedule', durationMinutes: 5, startAt, endAt, passMark: 1, questionIds: [questionId],
    }).expect(400);
    await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send({
      title: 'Duplicate question', durationMinutes: 5, startAt, endAt: new Date(Date.now() + 120_000).toISOString(),
      passMark: 1, questionIds: [questionId, questionId],
    }).expect(400);
  });
  it('rejects another instructor’s question and duplicate student assignments', async () => {
    const created = await otherInstructorAgent.post('/api/questions').set('x-csrf-token', csrfOtherInstructor).send({
      text: 'Other instructor question', options: [{ id: 'yes', text: 'Yes' }, { id: 'no', text: 'No' }], correctOptionId: 'yes', marks: 1,
    }).expect(201);
    await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send(examPayload({ questionIds: [created.body.id] }))
      .expect(400).expect(({ body }) => assert.equal(body.error.code, 'INVALID_QUESTIONS'));
    await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send(examPayload({ assignedStudentIds: [String(student._id), String(student._id)] })).expect(400);
  });
  it('does not assign exams to active but unverified student accounts', async () => {
    const passwordHash = await hashPassword('TestPass123');
    const unverified = await User.create({ name: 'Unverified Student', email: 'unverified@example.test', passwordHash, role: 'Student', emailVerified: false });
    await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send({
      title: 'Unverified assignment', durationMinutes: 5,
      startAt: new Date(Date.now() - 60_000).toISOString(), endAt: new Date(Date.now() + 600_000).toISOString(),
      passMark: 1, questionIds: [questionId], assignedStudentIds: [String(unverified._id)],
    }).expect(400).expect(({ body }) => assert.equal(body.error.code, 'INVALID_STUDENTS'));
  });
  it('allows the owner to edit an exam before attempts and denies other instructors', async () => {
    const secondQuestion = await instructorAgent.post('/api/questions').set('x-csrf-token', csrfInstructor).send({
      text: 'Second question', options: [{ id: 'yes', text: 'Yes' }, { id: 'no', text: 'No' }], correctOptionId: 'yes', marks: 1,
    }).expect(201);
    const exam = await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send(examPayload()).expect(201);
    const update = examPayload({ title: 'Updated exam', durationMinutes: 20, questionIds: [questionId, secondQuestion.body.id] });
    const changed = await instructorAgent.put(`/api/exams/${exam.body.id}`).set('x-csrf-token', csrfInstructor).send(update).expect(200);
    assert.equal(changed.body.title, 'Updated exam');
    assert.equal(changed.body.durationMinutes, 20);
    assert.deepEqual(changed.body.questionIds, [questionId, secondQuestion.body.id]);
    assert.ok(!(await otherInstructorAgent.get('/api/exams').expect(200)).body.exams.some((item) => item.id === exam.body.id));
    await otherInstructorAgent.put(`/api/exams/${exam.body.id}`).set('x-csrf-token', csrfOtherInstructor).send(update).expect(404);
  });
  it('locks attempt-sensitive exam settings after the first attempt starts', async () => {
    const exam = await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send(examPayload()).expect(201);
    await studentAgent.post(`/api/exams/${exam.body.id}/attempts`).set('x-csrf-token', csrfStudent).expect(201);
    const changedDuration = examPayload({ durationMinutes: 20 });
    await instructorAgent.put(`/api/exams/${exam.body.id}`).set('x-csrf-token', csrfInstructor).send(changedDuration)
      .expect(409).expect(({ body }) => assert.equal(body.error.code, 'EXAM_LOCKED'));
    await instructorAgent.put(`/api/exams/${exam.body.id}`).set('x-csrf-token', csrfInstructor).send(examPayload({ passMark: 2 }))
      .expect(409).expect(({ body }) => assert.equal(body.error.code, 'EXAM_LOCKED'));
    await instructorAgent.put(`/api/exams/${exam.body.id}`).set('x-csrf-token', csrfInstructor)
      .send(examPayload({ startAt: new Date(Date.now() - 30_000).toISOString() }))
      .expect(409).expect(({ body }) => assert.equal(body.error.code, 'EXAM_LOCKED'));
    await instructorAgent.put(`/api/exams/${exam.body.id}`).set('x-csrf-token', csrfInstructor)
      .send(examPayload({ endAt: new Date(Date.now() + 900_000).toISOString() }))
      .expect(409).expect(({ body }) => assert.equal(body.error.code, 'EXAM_LOCKED'));
    await instructorAgent.put(`/api/exams/${exam.body.id}`).set('x-csrf-token', csrfInstructor)
      .send(examPayload({ assignedStudentIds: [String(stranger._id)] }))
      .expect(409).expect(({ body }) => assert.equal(body.error.code, 'EXAM_LOCKED'));
    await instructorAgent.put(`/api/exams/${exam.body.id}`).set('x-csrf-token', csrfInstructor)
      .send(examPayload({ reviewEnabled: true }))
      .expect(409).expect(({ body }) => assert.equal(body.error.code, 'EXAM_LOCKED'));
    await otherInstructorAgent.put(`/api/exams/${exam.body.id}`).set('x-csrf-token', csrfOtherInstructor).send(changedDuration).expect(404);
  });
  it('rejects student starts before and after an exam’s scheduled window', async () => {
    const startAt = new Date(Date.now() + 60_000).toISOString();
    const endAt = new Date(Date.now() + 120_000).toISOString();
    const exam = await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send(examPayload({ startAt, endAt })).expect(201);
    await studentAgent.post(`/api/exams/${exam.body.id}/attempts`).set('x-csrf-token', csrfStudent)
      .expect(409).expect(({ body }) => assert.equal(body.error.code, 'EXAM_CLOSED'));
    await Exam.findByIdAndUpdate(exam.body.id, { startAt: new Date(Date.now() - 120_000), endAt: new Date(Date.now() - 60_000) });
    await studentAgent.post(`/api/exams/${exam.body.id}/attempts`).set('x-csrf-token', csrfStudent)
      .expect(409).expect(({ body }) => assert.equal(body.error.code, 'EXAM_CLOSED'));
  });
  it('publishes an exam with its selected schedule, scoring, questions, and student assignments', async () => {
    const configured = await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send({
      title: 'Configured exam', durationMinutes: 45,
      startAt: new Date(Date.now() - 60_000).toISOString(), endAt: new Date(Date.now() + 3_600_000).toISOString(),
      passMark: 1, negativeMark: 0.25, questionIds: [questionId], assignedStudentIds: [String(student._id)], reviewEnabled: true,
    }).expect(201);
    const stored = await Exam.findById(configured.body.id);
    assert.equal(stored.durationMinutes, 45);
    assert.equal(stored.negativeMark, 0.25);
    assert.equal(stored.reviewEnabled, true);
    assert.equal(stored.status, 'Published');
    assert.deepEqual(stored.questionIds.map(String), [questionId]);
    assert.deepEqual(stored.assignedStudentIds.map(String), [String(student._id)]);
  });
  it('limits exam listing and attempts to assigned student accounts', async () => {
    const list = await studentAgent.get('/api/exams').expect(200); assert.ok(list.body.exams.length >= 1);
    assert.ok(list.body.exams.some((exam) => exam.id === examId));
    assert.equal((await strangerAgent.get('/api/exams').expect(200)).body.exams.length, 0);
    const started = await studentAgent.post(`/api/exams/${examId}/attempts`).set('x-csrf-token', csrfStudent).expect(201);
    attemptId = started.body.attempt.id;
    assert.equal(started.body.questions[0].correctOptionId, undefined);
    await strangerAgent.post(`/api/exams/${examId}/attempts`).set('x-csrf-token', csrfStranger).expect(404);
  });
  it('saves answers and submits a server-scored result once', async () => {
    const beforeFocus = await Attempt.findById(attemptId);
    assert.equal(beforeFocus.focusEvents.length, 0);
    await studentAgent.post(`/api/attempts/${attemptId}/focus-loss`).set('x-csrf-token', csrfStudent).expect(204);
    const afterFocus = await Attempt.findById(attemptId);
    assert.equal(afterFocus.focusEvents.length, 1);
    assert.ok(afterFocus.focusEvents[0] instanceof Date);
    await studentAgent.put(`/api/attempts/${attemptId}/answers/${questionId}`).set('x-csrf-token', csrfStudent).send({ selectedOptionId: 'a', flagged: false }).expect(200);
    await studentAgent.put(`/api/attempts/${attemptId}/answers/${questionId}`).set('x-csrf-token', csrfStudent).send({ selectedOptionId: 'not-an-option' }).expect(400);
    const result = await withDirectRequestIp(() => studentAgent.post(`/api/attempts/${attemptId}/submit`).set('x-csrf-token', csrfStudent).set('x-forwarded-for', '198.51.100.44').expect(200));
    assert.equal(result.body.attempt.score, 2); assert.equal(result.body.attempt.passed, true);
    const repeated = await studentAgent.post(`/api/attempts/${attemptId}/submit`).set('x-csrf-token', csrfStudent).expect(200);
    assert.deepEqual(repeated.body.attempt, result.body.attempt);
    await strangerAgent.get(`/api/attempts/${attemptId}/result`).expect(404);
    const submissionAudit = await AuditLog.findOne({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': attemptId });
    assert.ok(submissionAudit.ip);
    assert.notEqual(submissionAudit.ip, '198.51.100.44', 'direct clients cannot choose their audit IP with X-Forwarded-For');
    assert.equal((await Attempt.findById(attemptId)).status, 'SUBMITTED');
  });
  it('prevents repeated attempts and records a result only after submission', async () => {
    await studentAgent.post(`/api/exams/${examId}/attempts`).set('x-csrf-token', csrfStudent).expect(409);
    await withDirectRequestIp(() => studentAgent.get(`/api/attempts/${attemptId}/result`).set('x-forwarded-for', '198.51.100.47').expect(200));
    const resultAudit = await AuditLog.findOne({ action: 'RESULT_ACCESSED', 'details.attemptId': attemptId });
    const submissionAudit = await AuditLog.findOne({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': attemptId });
    assert.ok(resultAudit.ip);
    assert.notEqual(resultAudit.ip, '198.51.100.47', 'direct clients cannot choose their audit IP with X-Forwarded-For');
    assert.equal(resultAudit.ip, submissionAudit.ip);
  });
  it('does not reveal answer keys through question reads', async () => {
    const response = await request(app).get('/api/health').expect(200); assert.equal(response.body.status, 'ok');
    const q = await Question.findById(questionId); assert.equal(q.correctOptionId, undefined);
  });
  it('auto-submits an expired attempt with no answers and records its final status and score', async () => {
    const exam = await Exam.create({ ownerId: instructor._id, title: 'Timeout test', durationMinutes: 1, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 600_000), passMark: 2, questionIds: [questionId], assignedStudentIds: [student._id], status: 'Published' });
    await withDirectRequestIp(async () => {
      const started = await studentAgent.post(`/api/exams/${exam.id}/attempts`).set('x-csrf-token', csrfStudent).set('x-forwarded-for', '198.51.100.45').expect(201);
      const id = started.body.attempt.id;
      const startAudit = await AuditLog.findOne({ action: 'ATTEMPT_STARTED', 'details.attemptId': id });
      assert.ok(startAudit.ip);
      assert.notEqual(startAudit.ip, '198.51.100.45', 'direct clients cannot choose their audit IP with X-Forwarded-For');
      const expiredAt = new Date(Date.now() - 1000);
      await Attempt.updateOne({ _id: id }, { $set: { endsAt: expiredAt } });
      await submitExpiredAttempts();
      const saved = await Attempt.findById(id);
      assert.equal(saved.status, 'SUBMITTED');
      assert.equal(saved.score, 0);
      assert.equal(saved.correctCount, 0);
      assert.equal(saved.wrongCount, 0);
      assert.equal(saved.unansweredCount, 1);
      assert.equal(saved.endsAt.getTime(), expiredAt.getTime());
      assert.ok(saved.submittedAt instanceof Date);
      const audit = await AuditLog.findOne({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': id });
      assert.equal(audit.ip, startAudit.ip);
      assert.equal(audit.details.automatic, true);
    });
  });
  it('returns the finalized result when reading an attempt after its deadline', async () => {
    const exam = await Exam.create({ ownerId: instructor._id, title: 'Expired attempt read', durationMinutes: 1, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 600_000), passMark: 2, questionIds: [questionId], assignedStudentIds: [student._id], status: 'Published' });
    await withDirectRequestIp(async () => {
      const started = await studentAgent.post(`/api/exams/${exam.id}/attempts`).set('x-csrf-token', csrfStudent).set('x-forwarded-for', '198.51.100.46').expect(201);
      const id = started.body.attempt.id;
      const startAudit = await AuditLog.findOne({ action: 'ATTEMPT_STARTED', 'details.attemptId': id });
      assert.notEqual(startAudit.ip, '198.51.100.46', 'direct clients cannot choose their audit IP with X-Forwarded-For');
      const expiredAt = new Date(Date.now() - 1000);
      await Attempt.updateOne({ _id: id }, { $set: { endsAt: expiredAt } });

      const response = await studentAgent.get(`/api/attempts/${id}`).expect(200);

      assert.equal(response.body.attempt.status, 'SUBMITTED');
      assert.equal(response.body.attempt.score, 0);
      assert.equal(response.body.attempt.unansweredCount, 1);
      assert.equal(response.body.questions, undefined);
      const saved = await Attempt.findById(id);
      assert.equal(saved.endsAt.getTime(), expiredAt.getTime());
      const submissionAudit = await AuditLog.findOne({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': id });
      assert.equal(submissionAudit.ip, startAudit.ip);
    });
  });
  it('includes answers saved before the deadline when the expiry worker scores the attempt', async () => {
    const exam = await Exam.create({ ownerId: instructor._id, title: 'Saved answer timeout', durationMinutes: 1, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 600_000), passMark: 2, questionIds: [questionId], assignedStudentIds: [student._id], status: 'Published' });
    const started = await studentAgent.post(`/api/exams/${exam.id}/attempts`).set('x-csrf-token', csrfStudent).expect(201);
    const id = started.body.attempt.id;
    await studentAgent.put(`/api/attempts/${id}/answers/${questionId}`).set('x-csrf-token', csrfStudent)
      .send({ selectedOptionId: 'a' }).expect(200);
    const expiredAt = new Date(Date.now() - 1000);
    await Attempt.updateOne({ _id: id }, { $set: { endsAt: expiredAt } });

    await submitExpiredAttempts();

    const saved = await Attempt.findById(id);
    assert.equal(saved.status, 'SUBMITTED');
    assert.equal(saved.score, 2);
    assert.equal(saved.maximumScore, 2);
    assert.equal(saved.correctCount, 1);
    assert.equal(saved.wrongCount, 0);
    assert.equal(saved.unansweredCount, 0);
    assert.equal(saved.answers[0].selectedOptionId, 'a');
    assert.equal(saved.endsAt.getTime(), expiredAt.getTime());
  });
  it('returns the existing result when its owner submits after expiry processing', async () => {
    const exam = await Exam.create({ ownerId: instructor._id, title: 'Idempotent submit', durationMinutes: 1, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 600_000), passMark: 2, questionIds: [questionId], assignedStudentIds: [student._id], status: 'Published' });
    // Supertest connects directly to Express; there is no trusted reverse proxy here.
    // Ignore the spoofed forwarding header and compare against this request's observed peer IP.
    const priorTrustProxy = app.get('trust proxy');
    app.set('trust proxy', false);
    try {
    const started = await studentAgent.post(`/api/exams/${exam.id}/attempts`).set('x-csrf-token', csrfStudent).set('x-forwarded-for', '198.51.100.46').expect(201);
    const id = started.body.attempt.id;
    const startAudit = await AuditLog.findOne({ action: 'ATTEMPT_STARTED', 'details.attemptId': id });
    assert.ok(startAudit?.ip);
    assert.notEqual(startAudit.ip, '198.51.100.46', 'a direct client cannot set its audit IP through X-Forwarded-For');
    await studentAgent.put(`/api/attempts/${id}/answers/${questionId}`).set('x-csrf-token', csrfStudent)
      .send({ selectedOptionId: 'a' }).expect(200);
    await Attempt.updateOne({ _id: id }, { $set: { endsAt: new Date(Date.now() - 1000) } });

    await submitExpiredAttempts();
    const persisted = await Attempt.findById(id);
    const persistedResult = {
      id: persisted.id,
      status: persisted.status,
      score: persisted.score,
      maximumScore: persisted.maximumScore,
      passed: persisted.passed,
      correctCount: persisted.correctCount,
      wrongCount: persisted.wrongCount,
      unansweredCount: persisted.unansweredCount,
      submittedAt: persisted.submittedAt.toISOString(),
    };
    assert.equal(await AuditLog.countDocuments({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': id }), 1);
    assert.equal((await AuditLog.findOne({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': id })).ip, startAudit.ip);

    const response = await studentAgent.post(`/api/attempts/${id}/submit`)
      .set('x-csrf-token', csrfStudent).expect(200);
    assert.deepEqual({
      id: response.body.attempt.id,
      status: response.body.attempt.status,
      score: response.body.attempt.score,
      maximumScore: response.body.attempt.maximumScore,
      passed: response.body.attempt.passed,
      correctCount: response.body.attempt.correctCount,
      wrongCount: response.body.attempt.wrongCount,
      unansweredCount: response.body.attempt.unansweredCount,
      submittedAt: response.body.attempt.submittedAt,
    }, persistedResult);
    assert.equal(await AuditLog.countDocuments({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': id }), 1);
    await strangerAgent.post(`/api/attempts/${id}/submit`).set('x-csrf-token', csrfStranger).expect(404);
    await strangerAgent.get(`/api/attempts/${id}/result`).expect(404);
    const missingId = new mongoose.Types.ObjectId();
    await studentAgent.post(`/api/attempts/${missingId}/submit`).set('x-csrf-token', csrfStudent)
      .expect(404).expect(({ body }) => assert.equal(body.error.code, 'ATTEMPT_NOT_FOUND'));
    } finally {
      app.set('trust proxy', priorTrustProxy);
    }
  });
  it('records null rather than inventing an IP when an automatic submission has no captured request IP', async () => {
    const exam = await Exam.create({ ownerId: instructor._id, title: 'No request IP', durationMinutes: 1, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 600_000), passMark: 2, questionIds: [questionId], assignedStudentIds: [student._id], status: 'Published' });
    const attempt = await Attempt.create({ examId: exam._id, studentId: student._id, startedAt: new Date(Date.now() - 120_000), endsAt: new Date(Date.now() - 1000), answers: [{ questionId }] });
    await submitExpiredAttempts();
    const audit = await AuditLog.findOne({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': String(attempt._id) });
    assert.ok(audit);
    assert.equal(audit.ip, null);
    assert.equal(audit.details.automatic, true);
  });
  it('recovers a finalized attempt audit after a transient audit-store failure', async () => {
    const exam = await Exam.create({ ownerId: instructor._id, title: 'Audit recovery', durationMinutes: 1, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 600_000), passMark: 2, questionIds: [questionId], assignedStudentIds: [student._id], status: 'Published' });
    // As above, use the direct socket peer in this no-proxy test and reject spoofed XFF.
    const priorTrustProxy = app.get('trust proxy');
    app.set('trust proxy', false);
    try {
    const started = await studentAgent.post(`/api/exams/${exam.id}/attempts`).set('x-csrf-token', csrfStudent).set('x-forwarded-for', '198.51.100.48').expect(201);
    const id = started.body.attempt.id;
    const startAudit = await AuditLog.findOne({ action: 'ATTEMPT_STARTED', 'details.attemptId': id });
    assert.ok(startAudit?.ip);
    assert.notEqual(startAudit.ip, '198.51.100.48', 'a direct client cannot set its audit IP through X-Forwarded-For');
    await studentAgent.put(`/api/attempts/${id}/answers/${questionId}`).set('x-csrf-token', csrfStudent)
      .send({ selectedOptionId: 'a' }).expect(200);
    await Attempt.updateOne({ _id: id }, { $set: { endsAt: new Date(Date.now() - 1000) } });

    const originalCreate = AuditLog.create;
    let failOnce = true;
    AuditLog.create = function (...args) {
      if (failOnce && args[0]?.action === 'ATTEMPT_SUBMITTED') {
        failOnce = false;
        return Promise.reject(new Error('injected audit-store failure'));
      }
      return originalCreate.apply(this, args);
    };
    try {
      await assert.rejects(submitExpiredAttempts(), /injected audit-store failure/);
    } finally {
      AuditLog.create = originalCreate;
    }

    const firstFinalization = await Attempt.findById(id);
    assert.equal(firstFinalization.status, 'SUBMITTED');
    assert.equal(firstFinalization.score, 2);
    assert.equal(firstFinalization.submissionAuditPending, true);
    assert.equal(await AuditLog.countDocuments({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': id }), 0);

    await submitExpiredAttempts();

    const recovered = await Attempt.findById(id);
    assert.equal(recovered.status, 'SUBMITTED');
    assert.equal(recovered.score, firstFinalization.score);
    assert.equal(recovered.submittedAt.getTime(), firstFinalization.submittedAt.getTime());
    assert.equal(recovered.submissionAuditPending, false);
    assert.equal(await AuditLog.countDocuments({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': id }), 1);
    assert.equal((await AuditLog.findOne({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': id })).ip, startAudit.ip);

    // Simulate a crash after the audit insert but before clearing the outbox marker.
    await Attempt.updateOne({ _id: id }, { $set: { submissionAuditPending: true } });
    await submitExpiredAttempts();
    assert.equal((await Attempt.findById(id)).submissionAuditPending, false);
    assert.equal(await AuditLog.countDocuments({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': id }), 1);
    } finally {
      app.set('trust proxy', priorTrustProxy);
    }
  });
  it('finalizes an expired attempt before rejecting a late answer change', async () => {
    const exam = await Exam.create({ ownerId: instructor._id, title: 'Late answer timeout', durationMinutes: 1, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 600_000), passMark: 2, questionIds: [questionId], assignedStudentIds: [student._id], status: 'Published' });
    const started = await studentAgent.post(`/api/exams/${exam.id}/attempts`).set('x-csrf-token', csrfStudent).expect(201);
    const id = started.body.attempt.id;
    await studentAgent.put(`/api/attempts/${id}/answers/${questionId}`).set('x-csrf-token', csrfStudent)
      .send({ selectedOptionId: 'a' }).expect(200);
    const expiredAt = new Date(Date.now() - 1000);
    await Attempt.updateOne({ _id: id }, { $set: { endsAt: expiredAt } });

    await studentAgent.put(`/api/attempts/${id}/answers/${questionId}`).set('x-csrf-token', csrfStudent)
      .send({ selectedOptionId: 'b' }).expect(409)
      .expect(({ body }) => assert.equal(body.error.code, 'ATTEMPT_ENDED'));

    const saved = await Attempt.findById(id);
    assert.equal(saved.status, 'SUBMITTED');
    assert.equal(saved.score, 2);
    assert.equal(saved.answers[0].selectedOptionId, 'a');
    assert.equal(saved.endsAt.getTime(), expiredAt.getTime());
  });
  it('does not save an answer request that passed validation before expiry but reaches storage after finalization', { timeout: 10_000 }, async () => {
    const exam = await Exam.create({ ownerId: instructor._id, title: 'Answer save race', durationMinutes: 1, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 600_000), passMark: 2, questionIds: [questionId], assignedStudentIds: [student._id], status: 'Published' });
    const started = await studentAgent.post(`/api/exams/${exam.id}/attempts`).set('x-csrf-token', csrfStudent).expect(201);
    const id = started.body.attempt.id;
    await studentAgent.put(`/api/attempts/${id}/answers/${questionId}`).set('x-csrf-token', csrfStudent)
      .send({ selectedOptionId: 'a' }).expect(200);

    const originalFindById = Question.findById;
    let releaseQuestionRead;
    let notifyQuestionRead;
    const questionReadStarted = new Promise((resolve) => { notifyQuestionRead = resolve; });
    const releaseQuestionValidation = new Promise((resolve) => { releaseQuestionRead = resolve; });
    Question.findById = function (...args) {
      const query = originalFindById.apply(this, args);
      if (String(args[0]) !== String(questionId)) return query;
      notifyQuestionRead();
      const originalExec = query.exec.bind(query);
      query.exec = async (...execArgs) => {
        const question = await originalExec(...execArgs);
        await releaseQuestionValidation;
        return question;
      };
      return query;
    };

    let pendingAnswerRequest;
    try {
      pendingAnswerRequest = studentAgent.put(`/api/attempts/${id}/answers/${questionId}`)
        .set('x-csrf-token', csrfStudent).send({ selectedOptionId: 'b' }).then((response) => response);
      await questionReadStarted;
      const expiredAt = new Date(Date.now() - 1000);
      await Attempt.updateOne({ _id: id }, { $set: { endsAt: expiredAt } });
      await submitExpiredAttempts();
      releaseQuestionRead();
      const lateResponse = await pendingAnswerRequest;
      assert.equal(lateResponse.status, 409);
      assert.equal(lateResponse.body.error.code, 'ATTEMPT_ENDED');

      const saved = await Attempt.findById(id);
      assert.equal(saved.status, 'SUBMITTED');
      assert.equal(saved.score, 2);
      assert.equal(saved.answers[0].selectedOptionId, 'a');
      assert.equal(saved.endsAt.getTime(), expiredAt.getTime());
      assert.equal(await AuditLog.countDocuments({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': id }), 1);
    } finally {
      releaseQuestionRead();
      Question.findById = originalFindById;
    }
  });
  it('allows only one scorer when manual submission overlaps expiry processing', async () => {
    const exam = await Exam.create({ ownerId: instructor._id, title: 'Concurrent timeout', durationMinutes: 1, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 600_000), passMark: 2, questionIds: [questionId], assignedStudentIds: [student._id], status: 'Published' });
    const started = await studentAgent.post(`/api/exams/${exam.id}/attempts`).set('x-csrf-token', csrfStudent).expect(201);
    const id = started.body.attempt.id;
    await studentAgent.put(`/api/attempts/${id}/answers/${questionId}`).set('x-csrf-token', csrfStudent)
      .send({ selectedOptionId: 'a' }).expect(200);
    await Attempt.updateOne({ _id: id }, { $set: { endsAt: new Date(Date.now() - 1000) } });

    const originalFind = Question.find;
    let scoringReads = 0;
    let releaseScoring;
    let notifyScoringStarted;
    const scoringStarted = new Promise((resolve) => { notifyScoringStarted = resolve; });
    const scoringGate = new Promise((resolve) => { releaseScoring = resolve; });
    Question.find = function (...args) {
      const query = originalFind.apply(this, args);
      const questionIds = args[0]?._id?.$in;
      if (!questionIds?.some((candidate) => String(candidate) === String(questionId))) return query;

      const originalExec = query.exec.bind(query);
      query.exec = async (...execArgs) => {
        const questions = await originalExec(...execArgs);
        scoringReads += 1;
        if (scoringReads === 1) {
          notifyScoringStarted();
          await scoringGate;
        }
        return questions;
      };
      return query;
    };

    let expiryWork;
    try {
      expiryWork = submitExpiredAttempts();
      await scoringStarted;
      const competingResponse = await studentAgent.post(`/api/attempts/${id}/submit`)
        .set('x-csrf-token', csrfStudent).expect(409);
      assert.equal(competingResponse.body.error.code, 'FINALIZATION_IN_PROGRESS');
      assert.equal(competingResponse.headers['retry-after'], '1');
      assert.equal(scoringReads, 1);
      releaseScoring();
      await expiryWork;
      const retryResponse = await studentAgent.post(`/api/attempts/${id}/submit`)
        .set('x-csrf-token', csrfStudent).expect(200);
      const saved = await Attempt.findById(id);
      const submissionLogs = await AuditLog.countDocuments({
        action: 'ATTEMPT_SUBMITTED',
        'details.attemptId': id,
      });
      assert.equal(scoringReads, 1);
      assert.equal(retryResponse.body.attempt.status, 'SUBMITTED');
      assert.equal(retryResponse.body.attempt.score, 2);
      assert.equal(saved.status, 'SUBMITTED');
      assert.equal(saved.score, 2);
      assert.equal(saved.correctCount, 1);
      assert.equal(saved.answers[0].selectedOptionId, 'a');
      assert.equal(submissionLogs, 1);
    } finally {
      releaseScoring();
      if (expiryWork) await expiryWork.catch(() => {});
      Question.find = originalFind;
    }
  });
  it('recovers a stale finalization claim and fences out the superseded scorer', { timeout: 10_000 }, async () => {
    const exam = await Exam.create({ ownerId: instructor._id, title: 'Stale claim recovery', durationMinutes: 1, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 600_000), passMark: 2, questionIds: [questionId], assignedStudentIds: [student._id], status: 'Published' });
    const started = await studentAgent.post(`/api/exams/${exam.id}/attempts`).set('x-csrf-token', csrfStudent).expect(201);
    const id = started.body.attempt.id;
    const originalQuestion = await Question.findById(questionId).select('+correctOptionId');
    await studentAgent.put(`/api/attempts/${id}/answers/${questionId}`).set('x-csrf-token', csrfStudent)
      .send({ selectedOptionId: 'a' }).expect(200);
    await Attempt.updateOne({ _id: id }, { $set: { endsAt: new Date(Date.now() - 1000), finalizationClaimToken: 'expired-worker', finalizationClaimUntil: new Date(Date.now() - 1000) } });

    const originalFind = Question.find;
    let scoringReads = 0;
    let releaseFirstScorer;
    let notifyFirstScorer;
    const firstScorerStarted = new Promise((resolve) => { notifyFirstScorer = resolve; });
    const firstScorerGate = new Promise((resolve) => { releaseFirstScorer = resolve; });
    Question.find = function (...args) {
      const query = originalFind.apply(this, args);
      const questionIds = args[0]?._id?.$in;
      if (!questionIds?.some((candidate) => String(candidate) === String(questionId))) return query;
      const originalExec = query.exec.bind(query);
      query.exec = async (...execArgs) => {
        const questions = await originalExec(...execArgs);
        scoringReads += 1;
        if (scoringReads === 1) {
          notifyFirstScorer();
          await firstScorerGate;
        }
        return questions;
      };
      return query;
    };

    let staleWork;
    try {
      staleWork = submitExpiredAttempts();
      await firstScorerStarted;
      await Attempt.updateOne({ _id: id }, { $set: { finalizationClaimUntil: new Date(Date.now() - 1000) } });
      await Question.updateOne({ _id: questionId }, { $set: { correctOptionId: 'b' } });
      await submitExpiredAttempts();
      releaseFirstScorer();
      await staleWork;

      const saved = await Attempt.findById(id).select('+finalizationClaimToken +finalizationClaimUntil');
      assert.equal(scoringReads, 2);
      assert.equal(saved.status, 'SUBMITTED');
      assert.equal(saved.score, 0);
      assert.equal(saved.submissionAuditPending, false);
      assert.equal(saved.finalizationClaimToken, null);
      assert.equal(saved.finalizationClaimUntil, null);
      assert.equal(await AuditLog.countDocuments({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': id }), 1);
    } finally {
      releaseFirstScorer();
      if (staleWork) await staleWork.catch(() => {});
      Question.find = originalFind;
      await Question.updateOne({ _id: questionId }, { $set: { correctOptionId: originalQuestion.correctOptionId } });
    }
  });
  it('returns 429 after ten login attempts from the same IP in one minute', async () => {
    // Simulate the configured trusted proxy so this test gets its own client IP.
    for (let i = 0; i < 10; i += 1) {
      await request(app).post('/api/auth/login')
        .set('x-forwarded-for', '192.0.2.99')
        .send({ email: 'rate-limit@example.test', password: 'InvalidPass123' })
        .expect(401);
    }
    await request(app).post('/api/auth/login')
      .set('x-forwarded-for', '192.0.2.99')
      .send({ email: 'rate-limit@example.test', password: 'InvalidPass123' })
      .expect(429);
  });
});

describe('negative marking (FR-OE-010)', () => {
  let extraQuestionIds;
  const answer = (attempt, question, selectedOptionId) => studentAgent.put(`/api/attempts/${attempt}/answers/${question}`).set('x-csrf-token', csrfStudent).send({ selectedOptionId, flagged: false }).expect(200);
  const startAttempt = async (exam) => (await studentAgent.post(`/api/exams/${exam}/attempts`).set('x-csrf-token', csrfStudent).expect(201)).body.attempt.id;
  before(async () => {
    extraQuestionIds = [];
    for (const marks of [3, 1]) {
      const q = await instructorAgent.post('/api/questions').set('x-csrf-token', csrfInstructor).send({ text: `Negative marking question worth ${marks}`, options: [{ id: 'a', text: 'Right' }, { id: 'b', text: 'Wrong' }], correctOptionId: 'a', marks }).expect(201);
      extraQuestionIds.push(q.body.id);
    }
  });
  it('deducts the configured mark for wrong answers only, end to end', async () => {
    const exam = await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send(examPayload({ title: 'Negative marking on', negativeMark: 1, questionIds: [questionId, ...extraQuestionIds] })).expect(201);
    const attempt = await startAttempt(exam.body.id);
    await answer(attempt, questionId, 'a');
    await answer(attempt, extraQuestionIds[0], 'b');
    const result = await studentAgent.post(`/api/attempts/${attempt}/submit`).set('x-csrf-token', csrfStudent).expect(200);
    assert.equal(result.body.attempt.score, 1);
    assert.equal(result.body.attempt.passed, true);
  });
  it('awards marks without deductions when negative marking is disabled', async () => {
    const exam = await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send(examPayload({ title: 'Negative marking off', negativeMark: 0, questionIds: [questionId, ...extraQuestionIds] })).expect(201);
    const attempt = await startAttempt(exam.body.id);
    await answer(attempt, questionId, 'a');
    await answer(attempt, extraQuestionIds[0], 'b');
    const result = await studentAgent.post(`/api/attempts/${attempt}/submit`).set('x-csrf-token', csrfStudent).expect(200);
    assert.equal(result.body.attempt.score, 2);
  });
  it('shows the rule to the instructor and lets it change only until a student starts', async () => {
    const exam = await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send(examPayload({ title: 'Negative marking lock', negativeMark: 0.5 })).expect(201);
    const listed = (await instructorAgent.get('/api/exams').expect(200)).body.exams.find((item) => item.id === exam.body.id);
    assert.equal(listed.negativeMark, 0.5);
    await instructorAgent.put(`/api/exams/${exam.body.id}`).set('x-csrf-token', csrfInstructor).send(examPayload({ title: 'Negative marking lock', negativeMark: 0.25, startAt: exam.body.startAt, endAt: exam.body.endAt })).expect(200);
    await startAttempt(exam.body.id);
    await instructorAgent.put(`/api/exams/${exam.body.id}`).set('x-csrf-token', csrfInstructor).send(examPayload({ title: 'Negative marking lock', negativeMark: 1, startAt: exam.body.startAt, endAt: exam.body.endAt }))
      .expect(409).expect(({ body }) => assert.equal(body.error.code, 'EXAM_LOCKED'));
    assert.equal((await Exam.findById(exam.body.id)).negativeMark, 0.25);
  });
});

describe('exam page: server time, flags and focus-loss reporting (FR-OE-015, FR-OE-021, FR-OE-024, NFR-OE-010)', () => {
  it('returns server time, keeps flags across resume and reports focus losses to the instructor', async () => {
    const exam = await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send(examPayload({ title: '=Focus report' })).expect(201);
    const before = Date.now();
    const started = await studentAgent.post(`/api/exams/${exam.body.id}/attempts`).set('x-csrf-token', csrfStudent).expect(201);
    const attempt = started.body.attempt.id;
    assert.ok(Math.abs(new Date(started.body.serverTime).getTime() - before) < 5_000);

    const saved = await studentAgent.put(`/api/attempts/${attempt}/answers/${questionId}`).set('x-csrf-token', csrfStudent).send({ selectedOptionId: null, flagged: true }).expect(200);
    assert.ok(saved.body.serverTime);
    const resumed = await studentAgent.post(`/api/exams/${exam.body.id}/attempts`).set('x-csrf-token', csrfStudent).expect(200);
    assert.equal(resumed.body.attempt.answers.find((answer) => String(answer.questionId) === questionId).flagged, true);
    assert.ok(resumed.body.serverTime);

    await studentAgent.post(`/api/attempts/${attempt}/focus-loss`).set('x-csrf-token', csrfStudent).expect(204);
    await studentAgent.post(`/api/attempts/${attempt}/focus-loss`).set('x-csrf-token', csrfStudent).expect(204);
    await studentAgent.put(`/api/attempts/${attempt}/answers/${questionId}`).set('x-csrf-token', csrfStudent).send({ selectedOptionId: 'a', flagged: false }).expect(200);
    await studentAgent.post(`/api/attempts/${attempt}/submit`).set('x-csrf-token', csrfStudent).expect(200);

    const report = await instructorAgent.get('/api/instructor/results').expect(200);
    const row = report.body.results.find((item) => item.attemptId === attempt);
    assert.equal(row.focusLossCount, 2);
    assert.equal(row.focusLossTimes.length, 2);
    const stats = report.body.examStatistics.find((item) => item.examId === exam.body.id);
    assert.deepEqual([stats.totalAttempts, stats.highestScore, stats.lowestScore, stats.averageScore, stats.passRate], [1, 2, 2, 2, 1]);
    for (const key of ['highestScore', 'lowestScore']) assert.ok(key in report.body.statistics);

    const csv = await instructorAgent.get('/api/instructor/results.csv').expect(200);
    const [header, ...lines] = csv.text.split('\r\n');
    assert.match(header, /focusLossCount$/);
    const line = lines.find((item) => item.includes('Focus report'));
    assert.ok(line.startsWith(`"'=Focus report"`), 'formula-like cells are neutralised');
    assert.ok(line.endsWith('"2"'));
  });
});
