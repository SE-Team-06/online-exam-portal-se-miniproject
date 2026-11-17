# Authentication & Transport Security

Covers issue #20 (Jira OEPSE-24) and SRS SEC-OE-001 to SEC-OE-006. Design reference: SAD v1.4 §3.9 and §4.3.1.

## Controls in the code

| Requirement | Control | Where | Automated evidence |
|---|---|---|---|
| SEC-OE-001 password storage | bcrypt, cost 12; `passwordHash` is `select: false` and never returned | `server/src/security/password.js`, `models/index.js` | `security.test.js`: stored hash is bcrypt and differs from the password; workflow tests |
| SEC-OE-001 no secrets in logs | Login writes only the email to the audit log; the error handler logs only `err.message` | `server/src/app.js` | `security.test.js`: password, wrong password and session token absent from console output and `auditlogs` |
| SEC-OE-002 password rules | Min 8 chars, upper, lower, digit | `passwordIsCompliant()` | Applies once self-registration exists (issue #1) |
| SEC-OE-003 lockout | 5 failures → locked 15 min | login route | `workflow.test.js` lockout test |
| SEC-OE-004 RBAC | `authenticate` + `requireRole(...)` on every protected route; 403 `FORBIDDEN` otherwise | `server/src/middleware/auth.js` | `security.test.js`: every protected route checked for 401 (no session), 403 (each wrong role) and pass-through (each allowed role). A coverage test fails if a new route is not added to the matrix |
| SEC-OE-005 HTTPS only | `requireHttps` rejects plain HTTP with 403 `HTTPS_REQUIRED` (except `/api/health`); Helmet sends `Strict-Transport-Security` | `server/src/security/transport.js` | `security.test.js`: plain HTTP rejected, `X-Forwarded-Proto: https` accepted with HSTS header |
| SEC-OE-006 sessions | Random 256-bit opaque token; only its SHA-256 hash is stored; cookie `HttpOnly; SameSite=Strict; Max-Age=1800`, plus `Secure` when HTTPS is required; 30-min inactivity expiry | `server/src/security/session.js`, `middleware/auth.js` | `security.test.js`: cookie flags, stored hash ≠ cookie token, expiry after 31 min idle |
| SEC-OE-008 CSRF | Per-session CSRF token header + `Origin` allow-list on state-changing routes | `requireCsrf` | workflow tests |
| SEC-OE-010 rate limit | 10 login requests / min / IP → 429 | login route | `workflow.test.js` 429 test |

## When HTTPS is enforced

`REQUIRE_HTTPS` decides; if unset, it follows `NODE_ENV`:

| Setting | HTTPS enforced | Cookie `Secure` |
|---|---|---|
| `REQUIRE_HTTPS=true` | yes | yes |
| `REQUIRE_HTTPS=false` | no (local development) | no |
| unset, `NODE_ENV=production` | yes | yes |
| unset, any other `NODE_ENV` | no | no |

`npm run demo` and `npm run dev` stay on plain HTTP for local work.

## Production deployment requirements

TLS is terminated by a reverse proxy (nginx, Caddy or a cloud load balancer) in front of Node. The app trusts **one** proxy hop (`trust proxy = 1`) and uses `X-Forwarded-Proto` to tell HTTPS from HTTP.

1. Proxy accepts **TLS 1.2 and 1.3 only**, with a valid certificate (e.g. Let's Encrypt).
2. Port 80 only redirects to HTTPS; it never forwards traffic to Node.
3. Proxy sets `X-Forwarded-Proto` and `X-Forwarded-For`; Node binds to `127.0.0.1` by default (`HOST`) or a private network interface only. A public direct path to Node would let a caller spoof the proxy headers and is unsupported.
4. Environment: `NODE_ENV=production`, `REQUIRE_HTTPS=true`, `APP_ORIGIN=https://<your-domain>`, `MONGODB_URI` pointing to an authenticated MongoDB that is not exposed publicly.
5. Secrets live only in the server environment, never in Git (`.env` is ignored).

Minimal nginx example:

```nginx
server {
  listen 80;
  server_name exam.example.edu;
  return 301 https://$host$request_uri;
}
server {
  listen 443 ssl;
  server_name exam.example.edu;
  ssl_certificate     /etc/letsencrypt/live/exam.example.edu/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/exam.example.edu/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
  location / { root /srv/online-exam-portal/client/dist; try_files $uri /index.html; }
}
```

## How to verify a deployment

| Check | Command | Expected |
|---|---|---|
| TLS versions | `testssl.sh --protocols https://<host>` or `openssl s_client -connect <host>:443 -tls1_1` | TLS 1.0/1.1 refused; 1.2/1.3 offered |
| HTTP redirect | `curl -sI http://<host>/` | `301` to `https://` |
| HSTS | `curl -sI https://<host>/api/health` | `Strict-Transport-Security` present |
| Cookie flags | log in via browser DevTools → Application → Cookies | `oep_session` is HttpOnly, Secure, SameSite=Strict |
| Direct plain HTTP to Node blocked | from the server: `curl -s -X POST http://127.0.0.1:4000/api/auth/login` | `403 HTTPS_REQUIRED` |

## Status

- Controls above are implemented and covered by automated tests (`npm test`).
- **No production deployment exists yet**, so TLS version, certificate and redirect checks have **not** been run. Record their results here, with date and host, once the app is deployed. Until then, SEC-OE-005 is verified only at the application level.
