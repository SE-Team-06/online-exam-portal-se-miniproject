import express from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { Attempt, AuditLog, Exam, Question, Session, User } from './models/index.js';
import { authenticate, requireCsrf, requireRole, sendError, writeAudit } from './middleware/auth.js';
import { verifyPassword } from './security/password.js';
import { COOKIE_NAME, newOpaqueToken, hashToken, INACTIVITY_MS } from './security/session.js';
import { calculateScore } from './domain/scoring.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '32kb' }));
const loginLimit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });
const bad = (res, issues) => sendError(res, 400, 'VALIDATION_ERROR', issues[0]?.message ?? 'Invalid request.');
const asPublicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier.');

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
app.post('/api/auth/login', loginLimit, async (req, res, next) => {
  try {
    const parsed = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(128) }).safeParse(req.body);
    if (!parsed.success) return bad(res, parsed.error.issues);
    const email = parsed.data.email.trim().toLowerCase();
    const user = await User.findOne({ email }).select('+passwordHash');
    const now = new Date();
    if (!user || !user.active || !user.emailVerified || (user.lockedUntil && user.lockedUntil > now) || !(await verifyPassword(parsed.data.password, user?.passwordHash ?? ''))) {
      if (user && user.active && (!user.lockedUntil || user.lockedUntil <= now)) {
        user.failedLogins += 1;
        if (user.failedLogins >= 5) { user.failedLogins = 0; user.lockedUntil = new Date(now.getTime() + 15 * 60_000); }
        await user.save();
      }
      await AuditLog.create({ action: 'LOGIN_FAILED', ip: req.ip, details: { email } });
      return sendError(res, 401, 'LOGIN_FAILED', 'Email or password is incorrect, or the account cannot sign in.');
    }
    user.failedLogins = 0; user.lockedUntil = null; await user.save();
    const token = newOpaqueToken(); const csrfToken = newOpaqueToken();
    await Session.create({ tokenHash: hashToken(token), csrfToken, userId: user._id, lastActivity: now, expiresAt: new Date(now.getTime() + INACTIVITY_MS) });
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${INACTIVITY_MS / 1000}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    await AuditLog.create({ action: 'LOGIN_SUCCESS', userId: user._id, ip: req.ip });
    res.json({ user: asPublicUser(user), csrfToken });
  } catch (error) { next(error); }
});
app.post('/api/auth/logout', authenticate, requireCsrf, async (req, res, next) => {
  try { await req.sessionRecord.deleteOne(); await writeAudit(req, 'LOGOUT'); res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0`); res.status(204).end(); } catch (e) { next(e); }
});
app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: asPublicUser(req.user), csrfToken: req.sessionRecord.csrfToken }));

const questionInput = z.object({ text: z.string().trim().min(1).max(2000), options: z.array(z.object({ id: z.string().min(1).max(50), text: z.string().trim().min(1).max(500) })).min(2).max(6), correctOptionId: z.string().min(1).max(50), marks: z.number().int().min(1).max(100) }).refine((q) => q.options.some((o) => o.id === q.correctOptionId) && new Set(q.options.map((o) => o.id)).size === q.options.length, 'Options must have unique IDs and include exactly one correct option.');
app.post('/api/questions', authenticate, requireRole('Instructor', 'Administrator'), requireCsrf, async (req, res, next) => {
  try { const p = questionInput.safeParse(req.body); if (!p.success) return bad(res, p.error.issues); const question = await Question.create({ ...p.data, options: p.data.options.map(({ id, text }) => ({ _id: id, text })), ownerId: req.user._id }); await writeAudit(req, 'QUESTION_CREATED', { questionId: question.id }); res.status(201).json({ id: question.id, text: question.text, options: question.options.map((o) => ({ id: o._id, text: o.text })), marks: question.marks }); } catch (e) { next(e); }
});
const examInput = z.object({ title: z.string().trim().min(1).max(160), durationMinutes: z.number().int().min(1).max(600), startAt: z.string().datetime(), endAt: z.string().datetime(), passMark: z.number().min(0), negativeMark: z.number().min(0).max(100).default(0), questionIds: z.array(objectId).min(1), assignedStudentIds: z.array(objectId).default([]), reviewEnabled: z.boolean().default(false) }).refine((e) => new Date(e.endAt) > new Date(e.startAt), 'Exam end must be after start.');
app.post('/api/exams', authenticate, requireRole('Instructor', 'Administrator'), requireCsrf, async (req, res, next) => {
  try {
    const p = examInput.safeParse(req.body); if (!p.success) return bad(res, p.error.issues);
    const { questionIds, assignedStudentIds, ...fields } = p.data;
    const questions = await Question.find({ _id: { $in: questionIds }, ownerId: req.user._id });
    if (questions.length !== questionIds.length) return sendError(res, 400, 'INVALID_QUESTIONS', 'Every question must exist and belong to you.');
    const students = assignedStudentIds.length ? await User.find({ _id: { $in: assignedStudentIds }, role: 'Student', active: true }) : [];
    if (students.length !== assignedStudentIds.length) return sendError(res, 400, 'INVALID_STUDENTS', 'Assignments must refer to active student accounts.');
    if (fields.passMark > questions.reduce((s, q) => s + q.marks, 0)) return sendError(res, 400, 'INVALID_PASS_MARK', 'Pass mark cannot exceed the maximum score.');
    const exam = await Exam.create({ ...fields, ownerId: req.user._id, questionIds, assignedStudentIds, status: 'Published' });
    await writeAudit(req, 'EXAM_PUBLISHED', { examId: exam.id });
    res.status(201).json({ id: exam.id, title: exam.title, status: exam.status });
  } catch (e) { next(e); }
});
app.get('/api/exams', authenticate, async (req, res, next) => {
  try {
    const filter = req.user.role === 'Student' ? { status: 'Published', assignedStudentIds: req.user._id } : { ownerId: req.user._id };
    const exams = await Exam.find(filter).sort({ startAt: 1 });
    res.json({ exams: exams.map((e) => ({ id: e.id, title: e.title, startAt: e.startAt, endAt: e.endAt, durationMinutes: e.durationMinutes, status: e.status })) });
  } catch (e) { next(e); }
});
app.post('/api/exams/:examId/attempts', authenticate, requireRole('Student'), requireCsrf, async (req, res, next) => {
  try {
    if (!objectId.safeParse(req.params.examId).success) return sendError(res, 400, 'INVALID_ID', 'Invalid exam identifier.');
    const exam = await Exam.findOne({ _id: req.params.examId, status: 'Published', assignedStudentIds: req.user._id });
    if (!exam) return sendError(res, 404, 'EXAM_NOT_FOUND', 'Exam is unavailable.');
    const now = new Date(); if (now < exam.startAt || now >= exam.endAt) return sendError(res, 409, 'EXAM_CLOSED', 'The exam is not currently open.');
    const endsAt = new Date(Math.min(now.getTime() + exam.durationMinutes * 60_000, exam.endAt.getTime()));
    let attempt;
    const existing = await Attempt.findOne({ examId: exam._id, studentId: req.user._id });
    if (existing?.status === 'IN_PROGRESS' && existing.endsAt > now) {
      return res.json({ attempt: { id: existing.id, examId: exam.id, endsAt: existing.endsAt, status: existing.status, answers: existing.answers }, questions: await safeQuestions(exam.questionIds) });
    }
    if (existing) return sendError(res, 409, 'ATTEMPT_EXISTS', 'An attempt already exists for this exam.');
    try { attempt = await Attempt.create({ examId: exam._id, studentId: req.user._id, startedAt: now, endsAt, answers: exam.questionIds.map((questionId) => ({ questionId })) }); }
    catch (e) { if (e.code === 11000) return sendError(res, 409, 'ATTEMPT_EXISTS', 'An attempt already exists for this exam.'); throw e; }
    await writeAudit(req, 'ATTEMPT_STARTED', { examId: exam.id, attemptId: attempt.id });
    return res.status(201).json({ attempt: { id: attempt.id, examId: exam.id, endsAt: attempt.endsAt, status: attempt.status, answers: attempt.answers }, questions: await safeQuestions(exam.questionIds) });
  } catch (e) { next(e); }
});
app.get('/api/attempts/:attemptId', authenticate, requireRole('Student'), async (req, res, next) => {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.attemptId, studentId: req.user._id });
    if (!attempt) return sendError(res, 404, 'ATTEMPT_NOT_FOUND', 'Attempt not found.');
    const exam = await Exam.findById(attempt.examId);
    if (attempt.status === 'IN_PROGRESS' && new Date() >= attempt.endsAt) await finishAttempt(attempt, exam, req);
    if (attempt.status === 'SUBMITTED') return res.json({ attempt: resultView(attempt, exam) });
    res.json({ attempt: { id: attempt.id, status: attempt.status, endsAt: attempt.endsAt, answers: attempt.answers }, questions: await safeQuestions(exam.questionIds) });
  } catch (e) { next(e); }
});
app.put('/api/attempts/:attemptId/answers/:questionId', authenticate, requireRole('Student'), requireCsrf, async (req, res, next) => {
  try {
    const p = z.object({ selectedOptionId: z.string().max(50).nullable(), flagged: z.boolean().optional() }).safeParse(req.body);
    if (!p.success) return bad(res, p.error.issues);
    const attempt = await Attempt.findOne({ _id: req.params.attemptId, studentId: req.user._id, status: 'IN_PROGRESS' });
    if (!attempt) return sendError(res, 404, 'ATTEMPT_NOT_FOUND', 'Active attempt not found.');
    if (new Date() >= attempt.endsAt) { await finishAttempt(attempt, await Exam.findById(attempt.examId), req); return sendError(res, 409, 'ATTEMPT_ENDED', 'The attempt has ended.'); }
    const answer = attempt.answers.find((a) => String(a.questionId) === req.params.questionId);
    if (!answer) return sendError(res, 404, 'QUESTION_NOT_IN_ATTEMPT', 'Question is not part of this attempt.');
    if (p.data.selectedOptionId !== null) {
      const question = await Question.findById(answer.questionId).select('+correctOptionId');
      if (!question?.options.some((option) => option._id === p.data.selectedOptionId)) return sendError(res, 400, 'INVALID_OPTION', 'Select an option for this question.');
    }
    answer.selectedOptionId = p.data.selectedOptionId;
    if (p.data.flagged !== undefined) answer.flagged = p.data.flagged;
    await attempt.save(); res.json({ saved: true });
  } catch (e) { next(e); }
});
app.post('/api/attempts/:attemptId/focus-loss', authenticate, requireRole('Student'), requireCsrf, async (req, res, next) => {
  try { const attempt = await Attempt.findOne({ _id: req.params.attemptId, studentId: req.user._id, status: 'IN_PROGRESS' }); if (!attempt) return sendError(res, 404, 'ATTEMPT_NOT_FOUND', 'Active attempt not found.'); attempt.focusEvents.push(new Date()); await attempt.save(); await writeAudit(req, 'FOCUS_LOST', { attemptId: attempt.id }); res.status(204).end(); } catch (e) { next(e); }
});
app.post('/api/attempts/:attemptId/submit', authenticate, requireRole('Student'), requireCsrf, async (req, res, next) => {
  try { const attempt = await Attempt.findOne({ _id: req.params.attemptId, studentId: req.user._id, status: 'IN_PROGRESS' }); if (!attempt) return sendError(res, 404, 'ATTEMPT_NOT_FOUND', 'Active attempt not found.'); const exam = await Exam.findById(attempt.examId); await finishAttempt(attempt, exam, req); res.json({ attempt: resultView(attempt, exam) }); } catch (e) { next(e); }
});
app.get('/api/attempts/:attemptId/result', authenticate, async (req, res, next) => {
  try {
    let attempt;
    if (req.user.role === 'Student') attempt = await Attempt.findOne({ _id: req.params.attemptId, studentId: req.user._id });
    else if (req.user.role === 'Administrator') attempt = await Attempt.findById(req.params.attemptId);
    else if (req.user.role === 'Instructor') {
      const candidate = await Attempt.findById(req.params.attemptId);
      const exam = candidate ? await Exam.findOne({ _id: candidate.examId, ownerId: req.user._id }) : null;
      if (exam) attempt = candidate;
    }
    if (!attempt) return sendError(res, 404, 'ATTEMPT_NOT_FOUND', 'Result not found.');
    if (attempt.status !== 'SUBMITTED') return sendError(res, 409, 'RESULT_PENDING', 'The attempt has not been submitted.');
    const exam = await Exam.findById(attempt.examId);
    res.json({ attempt: resultView(attempt, exam) });
  } catch (e) { next(e); }
});
app.use((_req, res) => sendError(res, 404, 'NOT_FOUND', 'The requested resource was not found.'));
app.use((err, _req, res, _next) => { console.error('Request failed:', err.message); if (res.headersSent) return; sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected server error occurred.'); });

async function safeQuestions(ids) {
  const docs = await Question.find({ _id: { $in: ids } });
  return ids.map((id) => { const q = docs.find((d) => String(d._id) === String(id)); return { id: String(id), text: q.text, options: q.options.map((o) => ({ id: o._id, text: o.text })), marks: q.marks }; });
}
async function finishAttempt(attempt, exam, req = null) {
  if (attempt.status === 'SUBMITTED') return attempt;
  const questions = await Question.find({ _id: { $in: exam.questionIds } }).select('+correctOptionId');
  const scored = calculateScore(questions, attempt.answers, exam.negativeMark, exam.passMark);
  Object.assign(attempt, scored, { status: 'SUBMITTED', submittedAt: new Date() }); await attempt.save();
  await AuditLog.create({ action: 'ATTEMPT_SUBMITTED', userId: attempt.studentId, details: { examId: exam.id, attemptId: attempt.id, automatic: req === null } });
  return attempt;
}
function resultView(attempt, exam) { return { id: attempt.id, status: attempt.status, score: attempt.score, maximumScore: attempt.maximumScore, passed: attempt.passed, correctCount: attempt.correctCount, wrongCount: attempt.wrongCount, unansweredCount: attempt.unansweredCount, submittedAt: attempt.submittedAt, reviewAvailable: Boolean(exam.reviewEnabled && new Date() >= exam.endAt) }; }

export default app;

export async function submitExpiredAttempts() {
  const now = new Date();
  const expired = await Attempt.find({ status: 'IN_PROGRESS', endsAt: { $lte: now } }).limit(100);
  for (const attempt of expired) {
    const exam = await Exam.findById(attempt.examId);
    if (exam) await finishAttempt(attempt, exam);
  }
}
