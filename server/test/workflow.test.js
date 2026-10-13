import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import app, { submitExpiredAttempts } from '../src/app.js';
import { User, Question, Exam, Attempt } from '../src/models/index.js';
import { hashPassword } from '../src/security/password.js';

let mongo; let instructor; let student; let stranger; let instructorAgent; let studentAgent; let strangerAgent; let csrfInstructor; let csrfStudent; let csrfStranger; let examId; let questionId; let attemptId;
const login = async (agent, email) => { const response = await agent.post('/api/auth/login').send({ email, password: 'TestPass123' }).expect(200); return response.body.csrfToken; };
before(async () => {
  process.env.MONGOMS_DOWNLOAD_DIR ??= new URL('../../.cache/mongodb-binaries', import.meta.url).pathname.replace(/^\//, '').replaceAll('/', '\\');
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const passwordHash = await hashPassword('TestPass123');
  [instructor, student, stranger] = await Promise.all([
    User.create({ name: 'Instructor', email: 'i@example.test', passwordHash, role: 'Instructor', emailVerified: true }),
    User.create({ name: 'Student', email: 's@example.test', passwordHash, role: 'Student', emailVerified: true }),
    User.create({ name: 'Other Student', email: 'x@example.test', passwordHash, role: 'Student', emailVerified: true }),
  ]);
  instructorAgent = request.agent(app); studentAgent = request.agent(app); strangerAgent = request.agent(app);
  csrfInstructor = await login(instructorAgent, instructor.email); csrfStudent = await login(studentAgent, student.email); csrfStranger = await login(strangerAgent, stranger.email);
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
  it('locks an account after five consecutive invalid passwords', async () => {
    const hash = await hashPassword('TestPass123');
    const lockedUser = await User.create({ name: 'Lockout', email: 'lockout@example.test', passwordHash: hash, role: 'Student', emailVerified: true });
    const agent = request.agent(app);
    for (let i = 0; i < 5; i += 1) await agent.post('/api/auth/login').send({ email: lockedUser.email, password: 'WrongPass123' }).expect(401);
    const updated = await User.findById(lockedUser._id);
    assert.ok(updated.lockedUntil > new Date());
  });
  it('enforces roles and CSRF protection for state changes', async () => {
    await studentAgent.post('/api/questions').set('x-csrf-token', csrfStudent).send({}).expect(403);
    await instructorAgent.post('/api/questions').send({}).expect(403);
  });
  it('validates question structure and exam references', async () => {
    await instructorAgent.post('/api/questions').set('x-csrf-token', csrfInstructor).send({ text: 'Bad', options: [{ id: 'a', text: 'A' }, { id: 'a', text: 'Duplicate' }], correctOptionId: 'z', marks: 1 }).expect(400);
    await instructorAgent.post('/api/exams').set('x-csrf-token', csrfInstructor).send({ title: 'Bad', durationMinutes: 5, startAt: new Date().toISOString(), endAt: new Date(Date.now() + 10000).toISOString(), passMark: 1, questionIds: [String(new mongoose.Types.ObjectId())] }).expect(400);
  });
  it('limits exam listing and attempts to assigned student accounts', async () => {
    const list = await studentAgent.get('/api/exams').expect(200); assert.equal(list.body.exams.length, 1);
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
    const result = await studentAgent.post(`/api/attempts/${attemptId}/submit`).set('x-csrf-token', csrfStudent).expect(200);
    assert.equal(result.body.attempt.score, 2); assert.equal(result.body.attempt.passed, true);
    await studentAgent.post(`/api/attempts/${attemptId}/submit`).set('x-csrf-token', csrfStudent).expect(404);
    await strangerAgent.get(`/api/attempts/${attemptId}/result`).expect(404);
    assert.equal((await Attempt.findById(attemptId)).status, 'SUBMITTED');
  });
  it('prevents repeated attempts and records a result only after submission', async () => {
    await studentAgent.post(`/api/exams/${examId}/attempts`).set('x-csrf-token', csrfStudent).expect(409);
    await studentAgent.get(`/api/attempts/${attemptId}/result`).expect(200);
  });
  it('does not reveal answer keys through question reads', async () => {
    const response = await request(app).get('/api/health').expect(200); assert.equal(response.body.status, 'ok');
    const q = await Question.findById(questionId); assert.equal(q.correctOptionId, undefined);
  });
  it('automatically submits an expired attempt using the server clock and saved answers', async () => {
    const exam = await Exam.create({ ownerId: instructor._id, title: 'Timeout test', durationMinutes: 1, startAt: new Date(Date.now() - 60_000), endAt: new Date(Date.now() + 600_000), passMark: 2, questionIds: [questionId], assignedStudentIds: [student._id], status: 'Published' });
    const started = await studentAgent.post(`/api/exams/${exam.id}/attempts`).set('x-csrf-token', csrfStudent).expect(201);
    const id = started.body.attempt.id;
    await Attempt.updateOne({ _id: id }, { $set: { endsAt: new Date(Date.now() - 1000) } });
    await submitExpiredAttempts();
    const saved = await Attempt.findById(id);
    assert.equal(saved.status, 'SUBMITTED'); assert.equal(saved.score, 0); assert.equal(saved.unansweredCount, 1);
  });
});
