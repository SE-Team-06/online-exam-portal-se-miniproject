import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export const INACTIVITY_MS = Number(process.env.SESSION_INACTIVITY_MINUTES ?? 30) * 60 * 1000;
export const COOKIE_NAME = 'oep_session';

export function newOpaqueToken() {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function tokensMatch(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string') return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function readCookie(header, name) {
  if (!header) return null;
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name) return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return null;
}

export function sessionCookie(token, { clear = false } = {}) {
  const maxAge = clear ? 0 : INACTIVITY_MS;
  const value = clear ? '' : encodeURIComponent(token);
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.floor(maxAge / 1000)}`;
}
