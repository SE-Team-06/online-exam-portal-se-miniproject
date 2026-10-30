import { AuditLog, Session, User } from '../models/index.js';
import { COOKIE_NAME, hashToken, readCookie, sessionCookie, tokensMatch, INACTIVITY_MS } from '../security/session.js';
import { httpsRequired } from '../security/transport.js';
import { isIP } from 'node:net';

export function sendError(res, status, code, message) {
  return res.status(status).json({ error: { code, message } });
}

export async function authenticate(req, res, next) {
  try {
    const rawToken = readCookie(req.headers.cookie, COOKIE_NAME);
    if (!rawToken) return sendError(res, 401, 'UNAUTHENTICATED', 'Sign in is required.');
    const session = await Session.findOne({ tokenHash: hashToken(rawToken) });
    if (!session) return sendError(res, 401, 'UNAUTHENTICATED', 'The session has expired.');
    const now = new Date();
    if (now.getTime() - session.lastActivity.getTime() >= INACTIVITY_MS || session.expiresAt <= now) {
      await session.deleteOne();
      res.setHeader('Set-Cookie', sessionCookie('', { clear: true, secure: httpsRequired() }));
      return sendError(res, 401, 'UNAUTHENTICATED', 'The session has expired.');
    }
    const user = await User.findById(session.userId);
    if (!user?.active) {
      await session.deleteOne();
      return sendError(res, 401, 'UNAUTHENTICATED', 'The account is inactive.');
    }
    session.lastActivity = now;
    session.expiresAt = new Date(now.getTime() + INACTIVITY_MS);
    await session.save();
    req.user = user;
    req.sessionRecord = session;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return sendError(res, 403, 'FORBIDDEN', 'Your role is not allowed to perform this action.');
    }
    next();
  };
}

export function requireCsrf(req, res, next) {
  const origin = req.get('origin');
  const allowedOrigins = (process.env.APP_ORIGIN ?? 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (origin && !allowedOrigins.includes(origin)) {
    return sendError(res, 403, 'CSRF_INVALID', 'Request origin is not allowed.');
  }
  if (!tokensMatch(req.get('x-csrf-token'), req.sessionRecord?.csrfToken)) {
    return sendError(res, 403, 'CSRF_INVALID', 'A valid CSRF token is required.');
  }
  next();
}

export async function writeAudit(req, action, details = {}) {
  const ip = typeof req.ip === 'string' && isIP(req.ip) ? req.ip : null;
  await AuditLog.create({ action, userId: req.user?._id ?? null, ip, details });
}
