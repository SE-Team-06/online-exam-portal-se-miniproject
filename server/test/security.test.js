import { after, afterEach, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import app from '../src/app.js';
import { AuditLog, Session, User } from '../src/models/index.js';
import { hashPassword } from '../src/security/password.js';
import { hashToken } from '../src/security/session.js';

// SEC-OE-001, SEC-OE-004, SEC-OE-005, SEC-OE-006 (issue #20 / OEPSE-24)
const PASSWORD = 'SecurityPass123';
const DUMMY_ID = '0123456789abcdef01234567';
const ANY = ['Student', 'Instructor', 'Administrator'];
const STAFF = ['Instructor', 'Administrator'];
const STUDENT = ['Student'];
const ADMIN = ['Administrator'];

// Every protected API route with the roles allowed to call it. The coverage test below fails
// when a route is added to app.js without being listed here.
const PROTECTED_ROUTES = [
  ['get', '/api/auth/me', ANY],
  ['get', '/api/notifications', ANY],
  ['patch', `/api/notifications/${DUMMY_ID}/read`, ANY],
  ['post', '/api/questions', STAFF],
  ['get', '/api/questions', STAFF],
  ['put', `/api/questions/${DUMMY_ID}`, STAFF],
  ['delete', `/api/questions/${DUMMY_ID}`, STAFF],
  ['get', '/api/students', STAFF],
  ['post', '/api/exams', STAFF],
  ['put', `/api/exams/${DUMMY_ID}`, STAFF],
  ['get', '/api/exams', ANY],
  ['post', `/api/exams/${DUMMY_ID}/attempts`, STUDENT],
  ['get', '/api/attempts/mine', STUDENT],
  ['get', '/api/instructor/results', STAFF],
  ['get', '/api/instructor/results.csv', STAFF],
  ['get', `/api/attempts/${DUMMY_ID}`, STUDENT],
  ['put', `/api/attempts/${DUMMY_ID}/answers/${DUMMY_ID}`, STUDENT],
  ['post', `/api/attempts/${DUMMY_ID}/focus-loss`, STUDENT],
  ['post', `/api/attempts/${DUMMY_ID}/submit`, STUDENT],
  ['get', `/api/attempts/${DUMMY_ID}/result`, ANY],
  ['get', `/api/attempts/${DUMMY_ID}/review`, STUDENT],
  ['delete', `/api/admin/users/${DUMMY_ID}/data`, ADMIN],
];
const PUBLIC_ROUTES = ['GET /api/health', 'POST /api/auth/login', 'POST /api/auth/logout'];

let mongo; let loginAddress = 0;
const sessions = {};
const login = (agent, email, password = PASSWORD) => {
  loginAddress += 1;
  return agent.post('/api/auth/login').set('x-forwarded-for', `198.51.100.${loginAddress}`).send({ email, password });
};
const routeTemplate = (path) => path.replaceAll(DUMMY_ID, ':id').replace(/:id\/answers\/:id/, ':id/answers/:questionId');
const send = (agent, method, path, csrf) => {
  const call = agent[method](path);
  if (csrf) call.set('x-csrf-token', csrf);
  return ['get', 'delete'].includes(method) ? call : call.send({});
};

before(async () => {
  process.env.MONGOMS_DOWNLOAD_DIR ??= new URL('../../.cache/mongodb-binaries', import.meta.url).pathname.replace(/^\//, '').replaceAll('/', '\\');
  mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri());
  const passwordHash = await hashPassword(PASSWORD);
  for (const role of ANY) {
    const email = `${role.toLowerCase()}@security.test`;
    await User.create({ name: `${role} account`, email, passwordHash, role, emailVerified: true });
    const agent = request.agent(app);
    const response = await login(agent, email).expect(200);
    sessions[role] = { agent, csrf: response.body.csrfToken };
  }
});
after(async () => { await mongoose.disconnect(); await mongo?.stop(); });

describe('server-side authentication and role checks on every protected route', () => {
  it('lists every registered API route in the access matrix', () => {
    const registered = app.router.stack
      .filter((layer) => layer.route?.path?.startsWith('/api/'))
      .flatMap((layer) => Object.keys(layer.route.methods).map((method) => `${method.toUpperCase()} ${layer.route.path}`));
    const covered = [...PUBLIC_ROUTES, ...PROTECTED_ROUTES.map(([method, path]) => `${method.toUpperCase()} ${routeTemplate(path)}`)]
      .map((route) => route.replace(/:\w+/g, ':param'));
    const missing = registered.filter((route) => !covered.includes(route.replace(/:\w+/g, ':param')));
    assert.deepEqual(missing, []);
  });

  for (const [method, path, allowed] of PROTECTED_ROUTES) {
    const label = `${method.toUpperCase()} ${routeTemplate(path)}`;
    it(`${label} rejects unauthenticated requests with 401`, async () => {
      const response = await send(request(app), method, path).expect(401);
      assert.equal(response.body.error.code, 'UNAUTHENTICATED');
    });
    for (const role of ANY.filter((candidate) => !allowed.includes(candidate))) {
      it(`${label} rejects the ${role} role with 403`, async () => {
        const { agent, csrf } = sessions[role];
        const response = await send(agent, method, path, csrf).expect(403);
        assert.equal(response.body.error.code, 'FORBIDDEN');
      });
    }
    for (const role of allowed) {
      it(`${label} lets the ${role} role through authorization`, async () => {
        const { agent, csrf } = sessions[role];
        const response = await send(agent, method, path, csrf);
        assert.ok(![401, 403, 500].includes(response.status), `unexpected ${response.status} ${JSON.stringify(response.body)}`);
      });
    }
  }
});

describe('credentials are never stored or logged in plain text', () => {
  it('stores only a hash of the session token and never the password', async () => {
    const agent = request.agent(app);
    const response = await login(agent, 'student@security.test').expect(200);
    const token = /oep_session=([^;]+)/.exec(response.headers['set-cookie'][0])[1];
    assert.equal(await Session.exists({ tokenHash: token }), null);
    assert.ok(await Session.exists({ tokenHash: hashToken(token) }));
    const stored = await User.findOne({ email: 'student@security.test' }).select('+passwordHash');
    assert.notEqual(stored.passwordHash, PASSWORD);
    assert.match(stored.passwordHash, /^\$2[aby]\$\d{2}\$/);
  });

  it('keeps passwords and session tokens out of console output and audit records', async () => {
    const wrongPassword = 'WrongSecret987';
    const captured = [];
    const originals = { log: console.log, error: console.error, warn: console.warn, info: console.info };
    for (const name of Object.keys(originals)) console[name] = (...args) => { captured.push(args.map(String).join(' ')); };
    let token;
    try {
      await login(request.agent(app), 'instructor@security.test', wrongPassword).expect(401);
      const response = await login(request.agent(app), 'instructor@security.test').expect(200);
      token = /oep_session=([^;]+)/.exec(response.headers['set-cookie'][0])[1];
      await request(app).get('/api/auth/me').set('Cookie', `oep_session=${token}`).expect(200);
    } finally {
      Object.assign(console, originals);
    }
    const audit = JSON.stringify(await AuditLog.find().lean());
    for (const secret of [PASSWORD, wrongPassword, token]) {
      assert.ok(!captured.some((line) => line.includes(secret)), 'secret written to console');
      assert.ok(!audit.includes(secret), 'secret written to the audit log');
    }
  });
});

describe('session cookie and inactivity expiry (SEC-OE-006)', () => {
  it('issues an HttpOnly, SameSite=Strict session cookie', async () => {
    const response = await login(request.agent(app), 'administrator@security.test').expect(200);
    const cookie = response.headers['set-cookie'][0];
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Strict/);
    assert.match(cookie, /Max-Age=1800/);
  });

  it('expires a session after 30 minutes of inactivity', async () => {
    const agent = request.agent(app);
    const response = await login(agent, 'student@security.test').expect(200);
    const token = /oep_session=([^;]+)/.exec(response.headers['set-cookie'][0])[1];
    await Session.updateOne({ tokenHash: hashToken(token) }, { lastActivity: new Date(Date.now() - 31 * 60_000) });
    const expired = await agent.get('/api/auth/me').expect(401);
    assert.equal(expired.body.error.code, 'UNAUTHENTICATED');
    assert.equal(await Session.exists({ tokenHash: hashToken(token) }), null);
  });
});

describe('HTTPS-only transport when required (SEC-OE-005)', () => {
  afterEach(() => { delete process.env.REQUIRE_HTTPS; });

  it('rejects plain HTTP requests and accepts HTTPS requests forwarded by the TLS proxy', async () => {
    process.env.REQUIRE_HTTPS = 'true';
    const plain = await request(app).post('/api/auth/login').send({ email: 'student@security.test', password: PASSWORD }).expect(403);
    assert.equal(plain.body.error.code, 'HTTPS_REQUIRED');
    const secure = await login(request.agent(app).set('x-forwarded-proto', 'https'), 'student@security.test').expect(200);
    assert.match(secure.headers['set-cookie'][0], /; Secure/);
    assert.match(secure.headers['strict-transport-security'], /max-age=\d+/);
  });

  it('keeps the health check reachable for load-balancer probes', async () => {
    process.env.REQUIRE_HTTPS = 'true';
    await request(app).get('/api/health').expect(200);
  });

  it('allows plain HTTP for local development when HTTPS is not required', async () => {
    process.env.REQUIRE_HTTPS = 'false';
    const response = await login(request.agent(app), 'student@security.test').expect(200);
    assert.doesNotMatch(response.headers['set-cookie'][0], /; Secure/);
  });
});
