import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['Student', 'Instructor', 'Administrator'], required: true },
  emailVerified: { type: Boolean, default: false },
  active: { type: Boolean, default: true },
  failedLogins: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
}, { timestamps: true });

const sessionSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  csrfToken: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  lastActivity: { type: Date, required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true });

const questionSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  options: [{ _id: { type: String, required: true }, text: { type: String, required: true, trim: true, maxlength: 500 } }],
  correctOptionId: { type: String, required: true, select: false },
  marks: { type: Number, required: true, min: 1, max: 100 },
}, { timestamps: true });

const examSchema = new Schema({
  ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  durationMinutes: { type: Number, required: true, min: 1, max: 600 },
  startAt: { type: Date, required: true },
  endAt: { type: Date, required: true },
  passMark: { type: Number, required: true, min: 0 },
  questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question', required: true }],
  assignedStudentIds: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
  locked: { type: Boolean, default: false },
  negativeMark: { type: Number, default: 0, min: 0, max: 100 },
  shuffleQuestions: { type: Boolean, default: false },
  reviewEnabled: { type: Boolean, default: false },
}, { timestamps: true });

const answerSchema = new Schema({
  questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
  selectedOptionId: { type: String, default: null },
  flagged: { type: Boolean, default: false },
}, { _id: false });

const attemptSchema = new Schema({
  examId: { type: Schema.Types.ObjectId, ref: 'Exam', required: true },
  studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startedAt: { type: Date, required: true },
  endsAt: { type: Date, required: true },
  status: { type: String, enum: ['IN_PROGRESS', 'SUBMITTED'], default: 'IN_PROGRESS' },
  answers: [answerSchema],
  focusEvents: [{ type: Date }],
  submittedAt: { type: Date, default: null },
  submissionAuditPending: { type: Boolean, default: false },
  submissionAutomatic: { type: Boolean, default: false },
  finalizationClaimToken: { type: String, default: null, select: false },
  finalizationClaimUntil: { type: Date, default: null, select: false },
  score: { type: Number, default: null },
  maximumScore: { type: Number, default: null },
  passed: { type: Boolean, default: null },
  correctCount: { type: Number, default: null },
  wrongCount: { type: Number, default: null },
  unansweredCount: { type: Number, default: null },
}, { timestamps: true });
attemptSchema.index({ examId: 1, studentId: 1 }, { unique: true });

const auditLogSchema = new Schema({
  action: { type: String, required: true, maxlength: 80 },
  userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  ip: { type: String, default: null, maxlength: 64 },
  timestamp: { type: Date, required: true, default: Date.now, index: true },
  details: { type: Schema.Types.Mixed, default: {} },
}, { versionKey: false });
auditLogSchema.index(
  { action: 1, 'details.attemptId': 1 },
  {
    unique: true,
    partialFilterExpression: { action: 'ATTEMPT_SUBMITTED' },
    name: 'unique_attempt_submission_audit',
  },
);
auditLogSchema.index({ action: 1, timestamp: -1 });
auditLogSchema.index({ userId: 1, timestamp: -1 });

const emailActionTokenSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  purpose: { type: String, enum: ['VERIFY_EMAIL', 'RESET_PASSWORD'], required: true },
  expiresAt: { type: Date, required: true, index: { expires: 0 } },
}, { timestamps: true, versionKey: false });

const notificationSchema = new Schema({
  recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['EXAM_ASSIGNED', 'RESULT_RELEASED'], required: true },
  referenceId: { type: Schema.Types.ObjectId, required: true },
  title: { type: String, required: true, maxlength: 160 },
  message: { type: String, required: true, maxlength: 500 },
  readAt: { type: Date, default: null },
}, { timestamps: true });
notificationSchema.index({ recipientId: 1, type: 1, referenceId: 1 }, { unique: true });

export const User = model('User', userSchema);
export const Session = model('Session', sessionSchema);
export const Question = model('Question', questionSchema);
export const Exam = model('Exam', examSchema);
export const Attempt = model('Attempt', attemptSchema);
export const AuditLog = model('AuditLog', auditLogSchema);
export const Notification = model('Notification', notificationSchema);
export const EmailActionToken = model('EmailActionToken', emailActionTokenSchema);
