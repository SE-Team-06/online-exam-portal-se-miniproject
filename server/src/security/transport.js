import { sendError } from '../middleware/auth.js';

export function httpsRequired(env = process.env) {
  if (env.REQUIRE_HTTPS != null && env.REQUIRE_HTTPS !== '') return env.REQUIRE_HTTPS === 'true';
  return env.NODE_ENV === 'production';
}

export function requireHttps(req, res, next) {
  if (!httpsRequired() || req.secure || req.path === '/api/health') return next();
  return sendError(res, 403, 'HTTPS_REQUIRED', 'This service only accepts HTTPS requests.');
}
