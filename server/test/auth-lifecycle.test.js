import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { fileURLToPath } from 'node:url';
import app from '../src/app.js';
import { AuditLog, EmailActionToken, Session, User } from '../src/models/index.js';
import { hashPassword, verifyPassword } from '../src/security/password.js';
import { hashToken } from '../src/security/session.js';
import { setEmailTransport } from '../src/security/email.js';

let mongo;
const sent = [];
let requestIp = 0;
const call = (req) => req.set('x-forwarded-for', `198.51.100.${(++requestIp % 250) + 1}`);

before(async () => {
  process.env.MONGOMS_DOWNLOAD_DIR ??= fileURLToPath(new URL('../../.cache/mongodb-binaries', import.meta.url));
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  setEmailTransport({ sendMail: async (message) => { sent.push(message); return { accepted: [message.to] }; } });
  const passwordHash = await hashPassword('ExistingPass123');
  await User.create({ name: 'Existing Student', email: 'existing@auth.test', passwordHash, role: 'Student', emailVerified: true });
});

after(async () => {
  setEmailTransport(null);
  if (mongoose.connection.readyState) await mongoose.disconnect();
  await mongo?.stop();
});

describe('registration, verification, and password reset (FR-OE-001, FR-OE-002, FR-OE-005)', () => {
  it('registers verified-by-email students and enforces one-time 24-hour verification links', async () => {
    await call(request(app).post('/api/auth/register').send({ name: 'Bad', email: 'bad@auth.test', password: 'weak' })).expect(400);
    await call(request(app).post('/api/auth/register').send({ name: 'New Student', email: 'NEW@auth.test', password: 'StudentPass123' })).expect(202);
    const user = await User.findOne({ email: 'new@auth.test' });
    assert.equal(user.role, 'Student');
    assert.equal(user.emailVerified, false);
    await call(request(app).post('/api/auth/login').send({ email: 'new@auth.test', password: 'StudentPass123' })).expect(401);
    const mail = sent.at(-1);
    assert.equal(mail.to, 'new@auth.test');
    const verifyUrl = new URL(mail.text.match(/https?:[^\s]+/)[0]);
    assert.match(mail.text, /24 hours/);
    const token = verifyUrl.searchParams.get('verifyEmail');
    const record = await EmailActionToken.findOne({ userId: user._id, purpose: 'VERIFY_EMAIL' });
    assert.notEqual(record.tokenHash, token);
    assert.ok(record.expiresAt.getTime() - Date.now() > 23 * 60 * 60_000);
    await call(request(app).post('/api/auth/verify-email').send({ token: `${token}x` })).expect(400);
    await call(request(app).post('/api/auth/verify-email').send({ token })).expect(200);
    assert.equal((await User.findById(user._id)).emailVerified, true);
    await call(request(app).post('/api/auth/verify-email').send({ token })).expect(400);
    await call(request(app).post('/api/auth/register').send({ name: 'Duplicate', email: 'new@auth.test', password: 'StudentPass123' })).expect(409);
    assert.ok(await AuditLog.exists({ action: 'EMAIL_VERIFIED', userId: user._id }));

    await call(request(app).post('/api/auth/register').send({ name: 'Expired Student', email: 'expired@auth.test', password: 'StudentPass123' })).expect(202);
    const expiredMailUrl = new URL(sent.at(-1).text.match(/https?:[^\s]+/)[0]);
    const expiredToken = expiredMailUrl.searchParams.get('verifyEmail');
    await EmailActionToken.updateOne({ tokenHash: hashToken(expiredToken) }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    await call(request(app).post('/api/auth/verify-email').send({ token: expiredToken })).expect(400);
  });

  it('uses a generic reset response, one-time 30-minute tokens, and revokes sessions', async () => {
    const unknown = await call(request(app).post('/api/auth/password-reset').send({ email: 'unknown@auth.test' })).expect(202);
    const beforeKnown = sent.length;
    const known = await call(request(app).post('/api/auth/password-reset').send({ email: 'existing@auth.test' })).expect(202);
    assert.deepEqual(unknown.body, known.body);
    assert.equal(sent.length, beforeKnown + 1);
    const resetUrl = new URL(sent.at(-1).text.match(/https?:[^\s]+/)[0]);
    assert.match(sent.at(-1).text, /30 minutes/);
    const token = resetUrl.searchParams.get('resetPassword');
    const user = await User.findOne({ email: 'existing@auth.test' });
    const action = await EmailActionToken.findOne({ userId: user._id, purpose: 'RESET_PASSWORD' });
    assert.notEqual(action.tokenHash, token);
    assert.ok(action.expiresAt.getTime() - Date.now() > 29 * 60_000);

    const agent = request.agent(app);
    await call(agent.post('/api/auth/login').send({ email: user.email, password: 'ExistingPass123' })).expect(200);
    assert.ok(await Session.countDocuments({ userId: user._id }));
    await call(request(app).post('/api/auth/password-reset/complete').send({ token, password: 'short' })).expect(400);
    await call(request(app).post('/api/auth/password-reset/complete').send({ token, password: 'ChangedPass123' })).expect(200);
    assert.equal(await Session.countDocuments({ userId: user._id }), 0);
    assert.equal(await verifyPassword('ChangedPass123', (await User.findById(user._id).select('+passwordHash')).passwordHash), true);
    await call(agent.get('/api/auth/me')).expect(401);
    await call(request(app).post('/api/auth/password-reset/complete').send({ token, password: 'ChangedPass123' })).expect(400);
    assert.ok(await AuditLog.exists({ action: 'PASSWORD_RESET', userId: user._id }));
  });

  it('rejects an expired reset token', async () => {
    await call(request(app).post('/api/auth/password-reset').send({ email: 'existing@auth.test' })).expect(202);
    const user = await User.findOne({ email: 'existing@auth.test' });
    const action = await EmailActionToken.findOne({ userId: user._id, purpose: 'RESET_PASSWORD' });
    const token = sent.at(-1).text.match(/resetPassword=([^\s]+)/)[1];
    await EmailActionToken.updateOne({ _id: action._id }, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    await call(request(app).post('/api/auth/password-reset/complete').send({ token, password: 'ChangedAgain123' })).expect(400);
  });

  it('does not leave a registered account unverified when sending verification mail fails', async () => {
    setEmailTransport({ sendMail: async () => { throw new Error('mail relay unavailable'); } });
    await call(request(app).post('/api/auth/register').send({ name: 'Mail Failure', email: 'mail-fail@auth.test', password: 'StudentPass123' })).expect(503);
    assert.equal(await User.exists({ email: 'mail-fail@auth.test' }), null);
    const tokens = await EmailActionToken.find({ purpose: 'VERIFY_EMAIL' });
    assert.ok((await Promise.all(tokens.map((token) => User.exists({ _id: token.userId })))).every(Boolean));
    setEmailTransport({ sendMail: async (message) => { sent.push(message); return { accepted: [message.to] }; } });
  });
});
