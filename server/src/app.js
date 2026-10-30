import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { Attempt, AuditLog, EmailActionToken, Exam, Notification, Question, Session, User } from './models/index.js';
import { authenticate, requireCsrf, requireRole, sendError, writeAudit } from './middleware/auth.js';
import { hashPassword, passwordIsCompliant, verifyPassword } from './security/password.js';
import { newOpaqueToken, hashToken, INACTIVITY_MS, sessionCookie } from './security/session.js';
import { httpsRequired, requireHttps } from './security/transport.js';
import { sendAccountActionEmail } from './security/email.js';
import { calculateScore } from './domain/scoring.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(requireHttps);
app.use(helmet());
app.use(express.json({ limit: '32kb' }));
const loginLimit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });
const authActionLimit = rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: true, legacyHeaders: false });
const FINALIZATION_LEASE_MS = 60_000;
const bad = (res, issues) => sendError(res, 400, 'VALIDATION_ERROR', issues[0]?.message ?? 'Invalid request.');
const asPublicUser = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role });
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier.');

app.get('/api/health', async (_req, res) => {
  let database = 'down';
  try { if (mongoose.connection.readyState === 1) { await mongoose.connection.db.admin().ping(); database = 'up'; } } catch { database = 'down'; }
  res.status(database === 'up' ? 200 : 503).json({ status: database === 'up' ? 'ok' : 'degraded', database, time: new Date() });
});
const registrationInput = z.object({ name: z.string().trim().min(1).max(100), email: z.string().trim().email().max(254), password: z.string().min(8).max(128).refine(passwordIsCompliant, 'Password must contain upper-case, lower-case, and numeric characters.') });
const tokenInput = z.object({ token: z.string().min(20).max(100) });
const resetInput = z.object({ token: z.string().min(20).max(100), password: z.string().min(8).max(128).refine(passwordIsCompliant, 'Password must contain upper-case, lower-case, and numeric characters.') });
async function createEmailActionToken(userId, purpose, lifetimeMs) {
  await EmailActionToken.deleteMany({ userId, purpose });
  const token = newOpaqueToken();
  await EmailActionToken.create({ tokenHash: hashToken(token), userId, purpose, expiresAt: new Date(Date.now() + lifetimeMs) });
  return token;
}
function accountActionUrl(parameter, token) {
  const url = new URL('/', process.env.APP_ORIGIN ?? 'http://localhost:5173');
  url.searchParams.set(parameter, token);
  return url.toString();
}

app.post('/api/auth/register', authActionLimit, async (req, res, next) => {
  try {
    const parsed = registrationInput.safeParse(req.body);
    if (!parsed.success) return bad(res, parsed.error.issues);
    const email = parsed.data.email.toLowerCase();
    if (await User.exists({ email })) return sendError(res, 409, 'EMAIL_IN_USE', 'An account with that email already exists.');
    const user = await User.create({ name: parsed.data.name, email, passwordHash: await hashPassword(parsed.data.password), role: 'Student', emailVerified: false, active: true });
    const token = await createEmailActionToken(user._id, 'VERIFY_EMAIL', 24 * 60 * 60_000);
    try {
      await sendAccountActionEmail({ to: email, subject: 'Verify your Online Exam Portal account', text: `Verify your email within 24 hours: ${accountActionUrl('verifyEmail', token)}` });
    } catch {
      await Promise.all([EmailActionToken.deleteMany({ userId: user._id, purpose: 'VERIFY_EMAIL' }), user.deleteOne()]);
      return sendError(res, 503, 'EMAIL_UNAVAILABLE', 'Registration email could not be sent. Please try again later.');
    }
    await AuditLog.create({ action: 'ACCOUNT_REGISTERED', userId: user._id, ip: req.ip });
    res.status(202).json({ message: 'Registration received. Check your email for a verification link valid for 24 hours.' });
  } catch (error) { if (error.code === 11000) return sendError(res, 409, 'EMAIL_IN_USE', 'An account with that email already exists.'); next(error); }
});
app.post('/api/auth/verify-email', authActionLimit, async (req, res, next) => {
  try {
    const parsed = tokenInput.safeParse(req.body);
    if (!parsed.success) return bad(res, parsed.error.issues);
    const action = await EmailActionToken.findOneAndDelete({ tokenHash: hashToken(parsed.data.token), purpose: 'VERIFY_EMAIL', expiresAt: { $gt: new Date() } });
    if (!action) return sendError(res, 400, 'INVALID_OR_EXPIRED_TOKEN', 'This verification link is invalid, expired, or already used.');
    const user = await User.findById(action.userId);
    if (!user || !user.active) return sendError(res, 400, 'INVALID_OR_EXPIRED_TOKEN', 'This verification link is invalid, expired, or already used.');
    user.emailVerified = true; await user.save();
    await AuditLog.create({ action: 'EMAIL_VERIFIED', userId: user._id, ip: req.ip });
    res.json({ message: 'Email verified. You can now sign in.' });
  } catch (error) { next(error); }
});
app.post('/api/auth/password-reset', authActionLimit, async (req, res, next) => {
  try {
    const parsed = z.object({ email: z.string().trim().email().max(254) }).safeParse(req.body);
    if (!parsed.success) return bad(res, parsed.error.issues);
    const user = await User.findOne({ email: parsed.data.email.toLowerCase(), active: true, emailVerified: true });
    let delivery;
    if (user) {
      const token = await createEmailActionToken(user._id, 'RESET_PASSWORD', 30 * 60_000);
      delivery = sendAccountActionEmail({ to: user.email, subject: 'Reset your Online Exam Portal password', text: `Reset your password within 30 minutes: ${accountActionUrl('resetPassword', token)}` });
    }
    res.status(202).json({ message: 'If an active verified account matches that address, password reset instructions have been sent.' });
    if (delivery) {
      try { await delivery; }
      catch { await EmailActionToken.deleteMany({ userId: user._id, purpose: 'RESET_PASSWORD' }); }
    }
  } catch (error) { next(error); }
});
app.post('/api/auth/password-reset/complete', authActionLimit, async (req, res, next) => {
  try {
    const parsed = resetInput.safeParse(req.body);
    if (!parsed.success) return bad(res, parsed.error.issues);
    const action = await EmailActionToken.findOneAndDelete({ tokenHash: hashToken(parsed.data.token), purpose: 'RESET_PASSWORD', expiresAt: { $gt: new Date() } });
    if (!action) return sendError(res, 400, 'INVALID_OR_EXPIRED_TOKEN', 'This reset link is invalid, expired, or already used.');
    const user = await User.findById(action.userId);
    if (!user || !user.active || !user.emailVerified) return sendError(res, 400, 'INVALID_OR_EXPIRED_TOKEN', 'This reset link is invalid, expired, or already used.');
    user.passwordHash = await hashPassword(parsed.data.password); user.failedLogins = 0; user.lockedUntil = null; await user.save();
    await Promise.all([Session.deleteMany({ userId: user._id }), EmailActionToken.deleteMany({ userId: user._id, purpose: 'RESET_PASSWORD' })]);
    await AuditLog.create({ action: 'PASSWORD_RESET', userId: user._id, ip: req.ip });
    res.json({ message: 'Password reset. Sign in with your new password.' });
  } catch (error) { next(error); }
});
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
    res.setHeader('Set-Cookie', sessionCookie(token, { secure: httpsRequired() }));
    await AuditLog.create({ action: 'LOGIN_SUCCESS', userId: user._id, ip: req.ip });
    res.json({ user: asPublicUser(user), csrfToken });
  } catch (error) { next(error); }
});
app.post('/api/auth/logout', authenticate, requireCsrf, async (req, res, next) => {
  try { await req.sessionRecord.deleteOne(); await writeAudit(req, 'LOGOUT'); res.setHeader('Set-Cookie', sessionCookie('', { clear: true, secure: httpsRequired() })); res.status(204).end(); } catch (e) { next(e); }
});
app.get('/api/auth/me', authenticate, (req, res) => res.json({ user: asPublicUser(req.user), csrfToken: req.sessionRecord.csrfToken }));

const adminUserInput = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128).refine(passwordIsCompliant, 'Password must contain upper-case, lower-case, and numeric characters.'),
  role: z.enum(['Student', 'Instructor', 'Administrator']),
});
const adminUserPatch = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  password: z.string().min(8).max(128).refine(passwordIsCompliant, 'Password must contain upper-case, lower-case, and numeric characters.').optional(),
  role: z.enum(['Student', 'Instructor', 'Administrator']).optional(),
  active: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, 'Provide at least one account field to change.');
const adminUserView = (user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, active: user.active, emailVerified: user.emailVerified, createdAt: user.createdAt, updatedAt: user.updatedAt });

app.get('/api/admin/users', authenticate, requireRole('Administrator'), async (req, res, next) => {
  try {
    const users = await User.find({}).sort({ name: 1, _id: 1 }).limit(500);
    res.json({ users: users.map(adminUserView) });
  } catch (e) { next(e); }
});
app.post('/api/admin/users', authenticate, requireRole('Administrator'), requireCsrf, async (req, res, next) => {
  try {
    const parsed = adminUserInput.safeParse(req.body);
    if (!parsed.success) return bad(res, parsed.error.issues);
    const data = parsed.data;
    const email = data.email.toLowerCase();
    if (await User.exists({ email })) return sendError(res, 409, 'EMAIL_IN_USE', 'An account with that email already exists.');
    const user = await User.create({ name: data.name, email, passwordHash: await hashPassword(data.password), role: data.role, emailVerified: true, active: true });
    await writeAudit(req, 'USER_CREATED', { targetUserId: String(user._id), role: user.role });
    res.status(201).json({ user: adminUserView(user) });
  } catch (e) { next(e); }
});
app.patch('/api/admin/users/:userId', authenticate, requireRole('Administrator'), requireCsrf, async (req, res, next) => {
  try {
    if (!objectId.safeParse(req.params.userId).success) return sendError(res, 400, 'INVALID_ID', 'Invalid user identifier.');
    const parsed = adminUserPatch.safeParse(req.body);
    if (!parsed.success) return bad(res, parsed.error.issues);
    const user = await User.findById(req.params.userId);
    if (!user) return sendError(res, 404, 'USER_NOT_FOUND', 'User not found.');
    const updates = parsed.data;
    const isSelf = String(user._id) === String(req.user._id);
    if (isSelf && (updates.active === false || (updates.role && updates.role !== 'Administrator'))) {
      return sendError(res, 409, 'SELF_DEMOTION_FORBIDDEN', 'Administrators cannot deactivate or demote their own account.');
    }
    const wasAdmin = user.role === 'Administrator' && user.active;
    const willBeAdmin = (updates.role ?? user.role) === 'Administrator' && (updates.active ?? user.active);
    if (wasAdmin && !willBeAdmin && await User.countDocuments({ role: 'Administrator', active: true }) <= 1) {
      return sendError(res, 409, 'LAST_ADMIN', 'At least one active administrator account must remain.');
    }
    for (const [key, value] of Object.entries(updates)) {
      if (key === 'password') user.passwordHash = await hashPassword(value);
      else user[key] = value;
    }
    await user.save();
    if (updates.active === false || updates.role || updates.password) await Session.deleteMany({ userId: user._id });
    await writeAudit(req, 'USER_UPDATED', { targetUserId: String(user._id), changedFields: Object.keys(updates).filter((key) => key !== 'password') });
    res.json({ user: adminUserView(user) });
  } catch (e) { next(e); }
});
app.get('/api/notifications', authenticate, async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json({ notifications: notifications.map((notification) => ({
      id: notification.id, type: notification.type, title: notification.title,
      message: notification.message, readAt: notification.readAt, createdAt: notification.createdAt,
    })) });
  } catch (e) { next(e); }
});
app.patch('/api/notifications/:notificationId/read', authenticate, requireCsrf, async (req, res, next) => {
  try {
    if (!objectId.safeParse(req.params.notificationId).success) return sendError(res, 400, 'INVALID_ID', 'Invalid notification identifier.');
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.notificationId, recipientId: req.user._id },
      { $set: { readAt: new Date() } },
      { returnDocument: 'after' },
    );
    if (!notification) return sendError(res, 404, 'NOTIFICATION_NOT_FOUND', 'Notification not found.');
    res.json({ id: notification.id, readAt: notification.readAt });
  } catch (e) { next(e); }
});

const questionInput = z.object({ text: z.string().trim().min(1).max(2000), options: z.array(z.object({ id: z.string().min(1).max(50), text: z.string().trim().min(1).max(500) })).min(2).max(6), correctOptionId: z.string().min(1).max(50), marks: z.number().int().min(1).max(100) }).refine((q) => q.options.some((o) => o.id === q.correctOptionId) && new Set(q.options.map((o) => o.id)).size === q.options.length, 'Options must have unique IDs and include exactly one correct option.');
app.post('/api/questions', authenticate, requireRole('Instructor', 'Administrator'), requireCsrf, async (req, res, next) => {
  try { const p = questionInput.safeParse(req.body); if (!p.success) return bad(res, p.error.issues); const question = await Question.create({ ...p.data, options: p.data.options.map(({ id, text }) => ({ _id: id, text })), ownerId: req.user._id }); await writeAudit(req, 'QUESTION_CREATED', { questionId: question.id }); res.status(201).json({ id: question.id, text: question.text, options: question.options.map((o) => ({ id: o._id, text: o.text })), marks: question.marks }); } catch (e) { next(e); }
});
app.get('/api/questions', authenticate, requireRole('Instructor', 'Administrator'), async (req, res, next) => {
  try {
    const questions = await Question.find({ ownerId: req.user._id }).select('+correctOptionId').sort({ createdAt: -1 });
    res.json({ questions: questions.map((q) => ({ id: q.id, text: q.text, options: q.options.map((o) => ({ id: o._id, text: o.text })), correctOptionId: q.correctOptionId, marks: q.marks })) });
  } catch (e) { next(e); }
});
app.put('/api/questions/:questionId', authenticate, requireRole('Instructor', 'Administrator'), requireCsrf, async (req, res, next) => {
  try {
    if (!objectId.safeParse(req.params.questionId).success) return sendError(res, 400, 'INVALID_ID', 'Invalid question identifier.');
    const p = questionInput.safeParse(req.body); if (!p.success) return bad(res, p.error.issues);
    const question = await Question.findOne({ _id: req.params.questionId, ownerId: req.user._id });
    if (!question) return sendError(res, 404, 'QUESTION_NOT_FOUND', 'Question not found.');
    if (await Exam.exists({ questionIds: question._id })) return sendError(res, 409, 'QUESTION_IN_USE', 'Questions used by an exam cannot be edited.');
    question.text = p.data.text;
    question.options = p.data.options.map(({ id, text }) => ({ _id: id, text }));
    question.correctOptionId = p.data.correctOptionId;
    question.marks = p.data.marks;
    await question.save();
    await writeAudit(req, 'QUESTION_UPDATED', { questionId: question.id });
    res.json({ id: question.id, text: question.text, options: question.options.map((o) => ({ id: o._id, text: o.text })), correctOptionId: question.correctOptionId, marks: question.marks });
  } catch (e) { next(e); }
});
app.delete('/api/questions/:questionId', authenticate, requireRole('Instructor', 'Administrator'), requireCsrf, async (req, res, next) => {
  try {
    if (!objectId.safeParse(req.params.questionId).success) return sendError(res, 400, 'INVALID_ID', 'Invalid question identifier.');
    const question = await Question.findOne({ _id: req.params.questionId, ownerId: req.user._id });
    if (!question) return sendError(res, 404, 'QUESTION_NOT_FOUND', 'Question not found.');
    if (await Exam.exists({ questionIds: question._id })) return sendError(res, 409, 'QUESTION_IN_USE', 'Questions used by an exam cannot be deleted.');
    await question.deleteOne();
    await writeAudit(req, 'QUESTION_DELETED', { questionId: req.params.questionId });
    res.status(204).end();
  } catch (e) { next(e); }
});
app.get('/api/students', authenticate, requireRole('Instructor', 'Administrator'), async (_req, res, next) => {
  try {
    const students = await User.find({ role: 'Student', active: true, emailVerified: true }).sort({ name: 1 });
    res.json({ students: students.map((student) => ({ id: student.id, name: student.name, email: student.email })) });
  } catch (e) { next(e); }
});
const examInput = z.object({ title: z.string().trim().min(1).max(160), durationMinutes: z.number().int().min(1).max(600), startAt: z.string().datetime(), endAt: z.string().datetime(), passMark: z.number().min(0), negativeMark: z.number().min(0).max(100).default(0), questionIds: z.array(objectId).min(1), assignedStudentIds: z.array(objectId).default([]), reviewEnabled: z.boolean().default(false) })
  .refine((e) => new Date(e.endAt) > new Date(e.startAt), 'Exam end must be after start.')
  .refine((e) => new Set(e.questionIds).size === e.questionIds.length, 'Exam questions must be unique.')
  .refine((e) => new Set(e.assignedStudentIds).size === e.assignedStudentIds.length, 'Student assignments must be unique.');
app.post('/api/exams', authenticate, requireRole('Instructor', 'Administrator'), requireCsrf, async (req, res, next) => {
  try {
    const p = examInput.safeParse(req.body); if (!p.success) return bad(res, p.error.issues);
    const { questionIds, assignedStudentIds, ...fields } = p.data;
    const questions = await Question.find({ _id: { $in: questionIds }, ownerId: req.user._id });
    if (questions.length !== questionIds.length) return sendError(res, 400, 'INVALID_QUESTIONS', 'Every question must exist and belong to you.');
    const students = assignedStudentIds.length ? await User.find({ _id: { $in: assignedStudentIds }, role: 'Student', active: true, emailVerified: true }) : [];
    if (students.length !== assignedStudentIds.length) return sendError(res, 400, 'INVALID_STUDENTS', 'Assignments must refer to active, verified student accounts.');
    if (fields.passMark > questions.reduce((s, q) => s + q.marks, 0)) return sendError(res, 400, 'INVALID_PASS_MARK', 'Pass mark cannot exceed the maximum score.');
    const exam = await Exam.create({ ...fields, ownerId: req.user._id, questionIds, assignedStudentIds, status: 'Published' });
    await writeAudit(req, 'EXAM_PUBLISHED', { examId: exam.id });
    await notifyAssignedStudents(exam);
    res.status(201).json(examView(exam, true));
  } catch (e) { next(e); }
});
app.put('/api/exams/:examId', authenticate, requireRole('Instructor', 'Administrator'), requireCsrf, async (req, res, next) => {
  try {
    if (!objectId.safeParse(req.params.examId).success) return sendError(res, 400, 'INVALID_ID', 'Invalid exam identifier.');
    const p = examInput.safeParse(req.body); if (!p.success) return bad(res, p.error.issues);
    const exam = await Exam.findOne({ _id: req.params.examId, ownerId: req.user._id });
    if (!exam) return sendError(res, 404, 'EXAM_NOT_FOUND', 'Exam not found.');
    const { questionIds, assignedStudentIds, ...fields } = p.data;
    const questions = await Question.find({ _id: { $in: questionIds }, ownerId: req.user._id });
    if (questions.length !== questionIds.length) return sendError(res, 400, 'INVALID_QUESTIONS', 'Every question must exist and belong to you.');
    const students = assignedStudentIds.length ? await User.find({ _id: { $in: assignedStudentIds }, role: 'Student', active: true, emailVerified: true }) : [];
    if (students.length !== assignedStudentIds.length) return sendError(res, 400, 'INVALID_STUDENTS', 'Assignments must refer to active, verified student accounts.');
    if (fields.passMark > questions.reduce((s, q) => s + q.marks, 0)) return sendError(res, 400, 'INVALID_PASS_MARK', 'Pass mark cannot exceed the maximum score.');
    const hasAttempts = await Attempt.exists({ examId: exam._id });
    const scheduleChanged = new Date(fields.startAt).getTime() !== exam.startAt.getTime()
      || new Date(fields.endAt).getTime() !== exam.endAt.getTime();
    const assignmentsChanged = !sameIdSet(assignedStudentIds, exam.assignedStudentIds);
    if (hasAttempts && (fields.durationMinutes !== exam.durationMinutes || !sameIds(questionIds, exam.questionIds)
      || fields.passMark !== exam.passMark || fields.negativeMark !== exam.negativeMark
      || scheduleChanged || assignmentsChanged || fields.reviewEnabled !== exam.reviewEnabled)) {
      return sendError(res, 409, 'EXAM_LOCKED', 'Schedule, assignments, question selection, duration, scoring, and review settings cannot be changed after a student starts an attempt.');
    }
    Object.assign(exam, fields, { questionIds, assignedStudentIds });
    await exam.save();
    await writeAudit(req, 'EXAM_UPDATED', { examId: exam.id });
    await notifyAssignedStudents(exam);
    res.json(examView(exam, true));
  } catch (e) { next(e); }
});

app.get('/api/exams', authenticate, async (req, res, next) => {
  try {
    const now = new Date();

    const filter = req.user.role === 'Student'
      ? {
          status: 'Published',
          assignedStudentIds: req.user._id,
        }
      : { ownerId: req.user._id };

    const exams = await Exam.find(filter).sort({ startAt: 1 });
    if (req.user.role !== 'Student') {
      return res.json({
        exams: exams.map((e) => examView(e, true)),
      });
    }

    const attempts = await Attempt.find({
      studentId: req.user._id,
      examId: { $in: exams.map((e) => e._id) },
    });

    const attemptsByExam = new Map(
      attempts.map((a) => [String(a.examId), a])
    );

    res.json({
      exams: exams.map((e) => {
        const attempt = attemptsByExam.get(String(e._id));

        let studentStatus;

        if (attempt?.status === 'IN_PROGRESS' && attempt.endsAt > now) {
          studentStatus = 'Open';
        } else if (attempt) {
          studentStatus = 'Attempted';
        } else if (now < e.startAt) {
          studentStatus = 'Upcoming';
        } else if (now < e.endAt) {
          studentStatus = 'Open';
        } else {
          studentStatus = 'Missed';
        }

        return {
          id: e.id,
          title: e.title,
          startAt: e.startAt,
          endAt: e.endAt,
          durationMinutes: e.durationMinutes,
          status: e.status,
          studentStatus,
          canResume: attempt?.status === 'IN_PROGRESS'
            && attempt.endsAt > now
            && now < e.endAt,
        };
      }),
    });
  } catch (e) {
    next(e);
  }
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
      return res.json({ attempt: { id: existing.id, examId: exam.id, endsAt: existing.endsAt, status: existing.status, answers: existing.answers }, questions: await safeQuestions(exam.questionIds), serverTime: new Date() });
    }
    if (existing) return sendError(res, 409, 'ATTEMPT_EXISTS', 'An attempt already exists for this exam.');
    try { attempt = await Attempt.create({ examId: exam._id, studentId: req.user._id, startedAt: now, endsAt, answers: exam.questionIds.map((questionId) => ({ questionId })) }); }
    catch (e) { if (e.code === 11000) return sendError(res, 409, 'ATTEMPT_EXISTS', 'An attempt already exists for this exam.'); throw e; }
    await writeAudit(req, 'ATTEMPT_STARTED', { examId: exam.id, attemptId: attempt.id });
    return res.status(201).json({ attempt: { id: attempt.id, examId: exam.id, endsAt: attempt.endsAt, status: attempt.status, answers: attempt.answers }, questions: await safeQuestions(exam.questionIds), serverTime: new Date() });
  } catch (e) { next(e); }
});
app.get('/api/attempts/mine', authenticate, requireRole('Student'), async (req, res, next) => {
  try {
    const attempts = await Attempt.find({
      studentId: req.user._id,
      status: 'SUBMITTED',
    }).sort({ submittedAt: -1 });

    const results = await Promise.all(
      attempts.map(async (attempt) => {
        const exam = await Exam.findById(attempt.examId);

        if (!exam) return null;

        return {
          ...resultView(attempt, exam),
          examId: exam.id,
          examTitle: exam.title,
        };
      })
    );

    res.json({ results: results.filter(Boolean) });
  } catch (e) {
    next(e);
  }
});
app.get('/api/instructor/results', authenticate, requireRole('Instructor', 'Administrator'), async (req, res, next) => {
  try {
    const exams = await Exam.find({ ownerId: req.user._id }).select('_id title passMark');
    const examById = new Map(exams.map((exam) => [String(exam._id), exam]));
    const attempts = await Attempt.find({ examId: { $in: exams.map((exam) => exam._id) }, status: 'SUBMITTED' })
      .populate('studentId', 'name email').sort({ submittedAt: -1 });
    const rows = attempts.map((attempt) => ({
      attemptId: attempt.id, examId: attempt.examId, examTitle: examById.get(String(attempt.examId))?.title,
      studentId: attempt.studentId?.id, studentName: attempt.studentId?.name, studentEmail: attempt.studentId?.email,
      score: attempt.score, maximumScore: attempt.maximumScore, passed: attempt.passed,
      correctCount: attempt.correctCount, wrongCount: attempt.wrongCount, unansweredCount: attempt.unansweredCount,
      submittedAt: attempt.submittedAt,
      focusLossCount: attempt.focusEvents.length, focusLossTimes: attempt.focusEvents,
    }));
    const summarize = (subset) => {
      const scores = subset.map((row) => row.score);
      return {
        totalAttempts: subset.length,
        averageScore: subset.length ? scores.reduce((sum, score) => sum + score, 0) / subset.length : 0,
        highestScore: subset.length ? Math.max(...scores) : 0,
        lowestScore: subset.length ? Math.min(...scores) : 0,
        passRate: subset.length ? subset.filter((row) => row.passed).length / subset.length : 0,
      };
    };
    res.json({ results: rows, statistics: summarize(rows), examStatistics: exams.map((exam) => ({
      examId: exam.id, examTitle: exam.title, ...summarize(rows.filter((row) => String(row.examId) === exam.id)),
    })) });
  } catch (e) { next(e); }
});
app.get('/api/instructor/results.csv', authenticate, requireRole('Instructor', 'Administrator'), async (req, res, next) => {
  try {
    const exams = await Exam.find({ ownerId: req.user._id }).select('_id title');
    const attempts = await Attempt.find({ examId: { $in: exams.map((exam) => exam._id) }, status: 'SUBMITTED' })
      .populate('studentId', 'name email').sort({ submittedAt: -1 });
    const examById = new Map(exams.map((exam) => [String(exam._id), exam.title]));
    const fields = ['exam', 'student', 'email', 'score', 'maximumScore', 'passed', 'submittedAt', 'focusLossCount'];
    const escape = (value) => { const text = String(value ?? ''); return `"${(/^[=+\-@]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`; };
    const lines = [fields.join(','), ...attempts.map((attempt) => [
      examById.get(String(attempt.examId)), attempt.studentId?.name, attempt.studentId?.email,
      attempt.score, attempt.maximumScore, attempt.passed, attempt.submittedAt?.toISOString(), attempt.focusEvents.length,
    ].map(escape).join(','))];
    res.type('text/csv').set('Content-Disposition', 'attachment; filename="exam-results.csv"').send(lines.join('\r\n'));
  } catch (e) { next(e); }
});
app.get('/api/attempts/:attemptId', authenticate, requireRole('Student'), async (req, res, next) => {
  try {
    let attempt = await Attempt.findOne({ _id: req.params.attemptId, studentId: req.user._id });
    if (!attempt) return sendError(res, 404, 'ATTEMPT_NOT_FOUND', 'Attempt not found.');
    const exam = await Exam.findById(attempt.examId);
    if (attempt.status === 'IN_PROGRESS' && new Date() >= attempt.endsAt) {
      attempt = await finishAttempt(attempt, exam, req);
      if (attempt.status !== 'SUBMITTED') return finalizationRetry(res);
    }
    if (attempt.status === 'SUBMITTED') return res.json({ attempt: resultView(attempt, exam) });
    res.json({ attempt: { id: attempt.id, status: attempt.status, endsAt: attempt.endsAt, answers: attempt.answers }, questions: await safeQuestions(exam.questionIds), serverTime: new Date() });
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
    const answerUpdate = { 'answers.$[answer].selectedOptionId': p.data.selectedOptionId };
    if (p.data.flagged !== undefined) answerUpdate['answers.$[answer].flagged'] = p.data.flagged;
    const saved = await Attempt.updateOne(
      {
        _id: attempt._id,
        studentId: req.user._id,
        status: 'IN_PROGRESS',
        finalizationClaimToken: null,
        answers: { $elemMatch: { questionId: answer.questionId } },
        $expr: { $gt: ['$endsAt', '$$NOW'] },
      },
      { $set: answerUpdate },
      { arrayFilters: [{ 'answer.questionId': answer.questionId }] },
    );
    if (saved.matchedCount !== 1) {
      const current = await Attempt.findOne({ _id: attempt._id, studentId: req.user._id });
      if (!current) return sendError(res, 404, 'ATTEMPT_NOT_FOUND', 'Active attempt not found.');
      if (current.status === 'IN_PROGRESS' && new Date() >= current.endsAt) {
        await finishAttempt(current, await Exam.findById(current.examId), req);
      }
      return sendError(res, 409, 'ATTEMPT_ENDED', 'The attempt has ended.');
    }
    res.json({ saved: true, serverTime: new Date() });
  } catch (e) { next(e); }
});
app.post('/api/attempts/:attemptId/focus-loss', authenticate, requireRole('Student'), requireCsrf, async (req, res, next) => {
  try { const attempt = await Attempt.findOne({ _id: req.params.attemptId, studentId: req.user._id, status: 'IN_PROGRESS' }); if (!attempt) return sendError(res, 404, 'ATTEMPT_NOT_FOUND', 'Active attempt not found.'); attempt.focusEvents.push(new Date()); await attempt.save(); await writeAudit(req, 'FOCUS_LOST', { attemptId: attempt.id }); res.status(204).end(); } catch (e) { next(e); }
});
app.post('/api/attempts/:attemptId/submit', authenticate, requireRole('Student'), requireCsrf, async (req, res, next) => {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.attemptId, studentId: req.user._id });
    if (!attempt) return sendError(res, 404, 'ATTEMPT_NOT_FOUND', 'Active attempt not found.');
    const exam = await Exam.findById(attempt.examId);
    const submitted = await finishAttempt(attempt, exam, req);
    if (submitted.status !== 'SUBMITTED') return finalizationRetry(res);
    res.json({ attempt: resultView(submitted, exam) });
  } catch (e) { next(e); }
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

app.get('/api/attempts/:attemptId/review', authenticate, requireRole('Student'), async (req, res, next) => {
  try {
    if (!objectId.safeParse(req.params.attemptId).success) {
      return sendError(res, 400, 'INVALID_ID', 'Invalid attempt identifier.');
    }

    const attempt = await Attempt.findOne({
      _id: req.params.attemptId,
      studentId: req.user._id,
      status: 'SUBMITTED',
    });

    if (!attempt) {
      return sendError(res, 404, 'ATTEMPT_NOT_FOUND', 'Submitted attempt not found.');
    }

    const exam = await Exam.findById(attempt.examId);

    if (!exam || !exam.reviewEnabled || new Date() < exam.endAt) {
      return sendError(res, 403, 'REVIEW_NOT_AVAILABLE', 'Answer review is not available.');
    }

    const questions = await Question.find({
      _id: { $in: exam.questionIds },
    }).select('+correctOptionId');

    const review = exam.questionIds.map((questionId) => {
      const question = questions.find(
        (item) => String(item._id) === String(questionId)
      );

      if (!question) return null;

      const answer = attempt.answers.find(
        (item) => String(item.questionId) === String(questionId)
      );

      return {
        questionId: String(question._id),
        text: question.text,
        marks: question.marks,
        options: question.options.map((option) => ({
          id: option._id,
          text: option.text,
        })),
        selectedOptionId: answer?.selectedOptionId ?? null,
        correctOptionId: question.correctOptionId,
      };
    });

    res.json({ review: review.filter(Boolean) });
  } catch (e) {
    next(e);
  }
});

// NFR-OE-014: an Administrator can delete the data of a deactivated account on request.
// Audit records are kept (SEC-OE-011 requires 12-month retention); they hold only the user ID.
app.delete('/api/admin/users/:userId/data', authenticate, requireRole('Administrator'), requireCsrf, async (req, res, next) => {
  try {
    if (!objectId.safeParse(req.params.userId).success) return sendError(res, 400, 'INVALID_ID', 'Invalid user identifier.');
    const user = await User.findById(req.params.userId);
    if (!user) return sendError(res, 404, 'USER_NOT_FOUND', 'User not found.');
    if (user.active) return sendError(res, 409, 'USER_ACTIVE', 'Deactivate the account before deleting its data.');
    if (await Exam.exists({ ownerId: user._id }) || await Question.exists({ ownerId: user._id })) {
      return sendError(res, 409, 'USER_OWNS_CONTENT', 'Reassign or remove this account\'s questions and exams first.');
    }
    const [attempts, notifications, sessions] = await Promise.all([
      Attempt.deleteMany({ studentId: user._id }), Notification.deleteMany({ recipientId: user._id }), Session.deleteMany({ userId: user._id }),
    ]);
    await Exam.updateMany({ assignedStudentIds: user._id }, { $pull: { assignedStudentIds: user._id } });
    await user.deleteOne();
    const deleted = { attempts: attempts.deletedCount, notifications: notifications.deletedCount, sessions: sessions.deletedCount, user: 1 };
    await writeAudit(req, 'USER_DATA_DELETED', { deletedUserId: req.params.userId, ...deleted });
    res.json({ deleted });
  } catch (e) { next(e); }
});

app.get('/api/admin/audit-logs', authenticate, requireRole('Administrator'), async (req, res, next) => {
  try {
    const parsed = z.object({
      action: z.string().trim().min(1).max(80).optional(),
      userId: objectId.optional(),
      from: z.coerce.date().optional(),
      to: z.coerce.date().optional(),
      page: z.coerce.number().int().min(1).max(10_000).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(50),
    }).safeParse(req.query);
    if (!parsed.success) return bad(res, parsed.error.issues);
    const { action, userId, from, to, page, limit } = parsed.data;
    if (from && to && from > to) return sendError(res, 400, 'INVALID_RANGE', 'The from date must be before the to date.');
    const filter = {};
    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (from || to) filter.timestamp = { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) };
    const [total, logs] = await Promise.all([
      AuditLog.countDocuments(filter),
      AuditLog.find(filter).sort({ timestamp: -1, _id: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    ]);
    res.json({
      page,
      limit,
      total,
      logs: logs.map((log) => ({
        id: String(log._id),
        action: log.action,
        userId: log.userId ? String(log.userId) : null,
        ip: log.ip,
        timestamp: log.timestamp,
        details: redactAuditDetails(log.details),
      })),
    });
  } catch (e) { next(e); }
});

app.use((_req, res) => sendError(res, 404, 'NOT_FOUND', 'The requested resource was not found.'));
app.use((err, _req, res, _next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) return sendError(res, 400, 'INVALID_JSON', 'Request body must be valid JSON.');
  console.error('Request failed:', err.message); if (res.headersSent) return; sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected server error occurred.');
});

async function safeQuestions(ids) {
  const docs = await Question.find({ _id: { $in: ids } });
  return ids.map((id) => { const q = docs.find((d) => String(d._id) === String(id)); return { id: String(id), text: q.text, options: q.options.map((o) => ({ id: o._id, text: o.text })), marks: q.marks }; });
}
function redactAuditDetails(details) {
  if (!details || typeof details !== 'object' || Array.isArray(details)) return {};
  return Object.fromEntries(Object.entries(details)
    .filter(([key]) => !/(password|token|secret|email)/i.test(key))
    .map(([key, value]) => [key, value && typeof value === 'object' && !Array.isArray(value) ? redactAuditDetails(value) : value]));
}
async function finishAttempt(attempt, exam, req = null) {
  if (attempt.status === 'SUBMITTED') return persistSubmissionAudit(attempt);
  const now = new Date();
  const claimToken = newOpaqueToken();
  const claimed = await Attempt.findOneAndUpdate(
    {
      _id: attempt._id,
      status: 'IN_PROGRESS',
      $or: [
        { finalizationClaimUntil: null },
        { finalizationClaimUntil: { $lte: now } },
      ],
    },
    { $set: { finalizationClaimToken: claimToken, finalizationClaimUntil: new Date(now.getTime() + FINALIZATION_LEASE_MS) } },
    { returnDocument: 'after' },
  );
  if (!claimed) {
    const current = await Attempt.findById(attempt._id);
    return current?.status === 'SUBMITTED' ? persistSubmissionAudit(current) : current ?? attempt;
  }

  try {
    if (!exam) throw new Error('Cannot finalize an attempt without its exam configuration.');
    const questions = await Question.find({ _id: { $in: exam.questionIds } }).select('+correctOptionId');
    const scored = calculateScore(questions, claimed.answers, exam.negativeMark, exam.passMark);
    const submitted = await Attempt.findOneAndUpdate(
      {
        _id: claimed._id,
        status: 'IN_PROGRESS',
        finalizationClaimToken: claimToken,
        $expr: { $gt: ['$finalizationClaimUntil', '$$NOW'] },
      },
      {
        $set: { ...scored, status: 'SUBMITTED', submittedAt: new Date(), submissionAuditPending: true, submissionAutomatic: req === null },
        $unset: { finalizationClaimToken: 1, finalizationClaimUntil: 1 },
      },
      { returnDocument: 'after' },
    );
    if (!submitted) {
      const current = await Attempt.findById(claimed._id);
      return current?.status === 'SUBMITTED' ? persistSubmissionAudit(current) : current ?? claimed;
    }
    const finalized = await persistSubmissionAudit(submitted);
    await Notification.updateOne(
      { recipientId: finalized.studentId, type: 'RESULT_RELEASED', referenceId: finalized._id },
      { $setOnInsert: {
        recipientId: finalized.studentId,
        type: 'RESULT_RELEASED',
        referenceId: finalized._id,
        title: 'Exam result released',
        message: `Your result for "${exam.title}" is now available.`,
      } },
      { upsert: true },
    );
    return finalized;
  } catch (error) {
    await Attempt.updateOne(
      { _id: claimed._id, status: 'IN_PROGRESS', finalizationClaimToken: claimToken },
      { $set: { finalizationClaimToken: null, finalizationClaimUntil: null } },
    );
    throw error;
  }
}
function finalizationRetry(res) {
  res.setHeader('Retry-After', '1');
  return sendError(res, 409, 'FINALIZATION_IN_PROGRESS', 'Attempt finalization is in progress. Retry shortly.');
}
async function persistSubmissionAudit(attempt) {
  if (!attempt.submissionAuditPending) return attempt;
  try {
    await AuditLog.create({
      action: 'ATTEMPT_SUBMITTED',
      userId: attempt.studentId,
      details: { examId: attempt.examId, attemptId: attempt.id, automatic: attempt.submissionAutomatic },
    });
  } catch (error) {
    if (error.code !== 11000) throw error;
    const existing = await AuditLog.exists({ action: 'ATTEMPT_SUBMITTED', 'details.attemptId': attempt.id });
    if (!existing) throw error;
  }
  return (await Attempt.findOneAndUpdate(
    { _id: attempt._id, status: 'SUBMITTED', submissionAuditPending: true },
    { $set: { submissionAuditPending: false } },
    { returnDocument: 'after' },
  )) ?? (await Attempt.findById(attempt._id)) ?? attempt;
}
function resultView(attempt, exam) { return { id: attempt.id, status: attempt.status, score: attempt.score, maximumScore: attempt.maximumScore, passed: attempt.passed, correctCount: attempt.correctCount, wrongCount: attempt.wrongCount, unansweredCount: attempt.unansweredCount, submittedAt: attempt.submittedAt, reviewAvailable: Boolean(exam.reviewEnabled && new Date() >= exam.endAt) }; }

async function notifyAssignedStudents(exam) {
  await Promise.all(exam.assignedStudentIds.map((recipientId) => Notification.updateOne(
    { recipientId, type: 'EXAM_ASSIGNED', referenceId: exam._id },
    { $setOnInsert: { recipientId, type: 'EXAM_ASSIGNED', referenceId: exam._id, title: 'New exam assigned', message: `You have been assigned "${exam.title}".` } },
    { upsert: true },
  )));
}

function sameIds(left, right) {
  return left.length === right.length && left.every((id, index) => String(id) === String(right[index]));
}

function sameIdSet(left, right) {
  const leftIds = left.map(String).sort();
  const rightIds = right.map(String).sort();
  return sameIds(leftIds, rightIds);
}

function examView(exam, includeConfiguration = false) {
  const view = { id: exam.id, title: exam.title, startAt: exam.startAt, endAt: exam.endAt, durationMinutes: exam.durationMinutes, status: exam.status };
  if (!includeConfiguration) return view;
  return {
    ...view,
    passMark: exam.passMark,
    negativeMark: exam.negativeMark,
    reviewEnabled: exam.reviewEnabled,
    questionIds: exam.questionIds.map(String),
    assignedStudentIds: exam.assignedStudentIds.map(String),
  };
}

export default app;

export async function submitExpiredAttempts() {
  const pendingAudits = await Attempt.find({ status: 'SUBMITTED', submissionAuditPending: true }).limit(100);
  for (const attempt of pendingAudits) await persistSubmissionAudit(attempt);

  const now = new Date();
  const expired = await Attempt.find({ status: 'IN_PROGRESS', endsAt: { $lte: now } }).limit(100);
  for (const attempt of expired) {
    const exam = await Exam.findById(attempt.examId);
    if (exam) await finishAttempt(attempt, exam);
  }
}
