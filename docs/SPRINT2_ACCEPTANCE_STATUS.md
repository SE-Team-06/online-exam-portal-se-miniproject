# Sprint 2 acceptance status — final follow-up, 30 October 2026

## Verified baseline

- Canonical repository: [SE-Team-06/online-exam-portal-se-miniproject](https://github.com/SE-Team-06/online-exam-portal-se-miniproject).
- PR #63 merged to `main` as `2db1c9d83281601c99a81dd0b018ebe0ec2f5713`.
- Its push Actions run [41099637545](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/41099637545) completed successfully: clean locked dependency install, server tests **168/168**, client tests **17/17**, server syntax checks and Vite production build passed.
- The feature branch for this final pass is based on that `main`. Changes described below are not part of the successful run until a new PR check completes.

## Issue #1 — registration and recovery

| Acceptance area | Implementation and test evidence | Status |
| --- | --- | --- |
| Registration, unique email, password validation/hash, unverified-login rejection | `server/src/app.js`, `server/src/security/password.js`; `server/test/auth-lifecycle.test.js` | **VERIFIED IN MERGED MAIN** by the successful CI run; candidate adds fail-closed production-origin checks, pending CI |
| Verification link hash, single use, 24-hour expiry | Email action token model and verification route; lifecycle integration tests cover success, invalid, expired and reused links | **VERIFIED IN MERGED MAIN** |
| Generic password reset, hashed single-use 30-minute token, password policy and session revocation | Reset routes; lifecycle tests cover generic known/unknown response, expiry, reuse and session invalidation | **VERIFIED IN MERGED MAIN** |
| SMTP configuration and encrypted transport | `server/src/security/email.js` requires STARTTLS for `smtp://`, implicit TLS for `smtps://`, and rejects TLS/certificate-validation disable flags; `server/test/email-config.test.js` covers secure and rejected URL cases. | **IMPLEMENTED**; local configuration tests pass 2/2 |
| Actual message delivery | Fake transport tests exercise message creation and safe failure. Staging mail credentials/service are not configured here. | **IMPLEMENTED BUT NOT EXTERNALLY VERIFIED**; real delivery is **BLOCKED** |
| Registration, verification, forgot/reset UI states | `client/src/AuthPanel.jsx` | **IMPLEMENTED**; browser walkthrough against a deployed API/mail service remains unverified |

No credentials, passwords, or verification/reset tokens are recorded. To verify delivery, an operator must inject `APP_ORIGIN`, `SMTP_URL`, and `MAIL_FROM` through the staging secret store, use a disposable test mailbox, submit registration and reset requests, confirm both messages and links arrive, exercise verification/reset once, then confirm expired/reused links fail. Keep secrets out of shell transcripts and source control.

## Issue #3 — administrator users and audit

| Acceptance area | Implementation and test evidence | Status |
| --- | --- | --- |
| Create/list/edit/activate/deactivate/role changes | `/api/admin/users`, `client/src/AdminUsersPanel.jsx`, `server/test/admin-users.test.js` | **VERIFIED IN MERGED MAIN** by successful CI |
| RBAC, CSRF, self-demotion and last-admin protection, session revocation | `server/src/middleware/auth.js`, admin route; admin-user and security tests | **VERIFIED IN MERGED MAIN** by successful CI |
| Login, publication, submission, result access and user-change audit events with actor/time/IP | `writeAudit`, authentication/admin routes and submission finalization; workflow/admin tests | **VERIFIED IN MERGED MAIN**; new direct-socket spoof assertions and actor-field assertion await candidate CI |
| Audit UI, administrator-only access, filters, pagination, safe redaction | `client/src/AdminUsersPanel.jsx`, `/api/admin/audit-logs`, `server/test/operations.test.js` | **VERIFIED IN MERGED MAIN** by successful CI |
| Submission IP survives automatic finalization and retry; null if no request IP; unique event/idempotency | Attempt fields, `finishAttempt`/`persistSubmissionAudit`, partial unique index and workflow recovery tests | **VERIFIED IN MERGED MAIN**; candidate corrects all direct-Supertest IP expectations and awaits CI |
| Retention | `docs/OPERATIONS.md` specifies indefinite audit retention; operations test inspects actual MongoDB TTL indexes | **VERIFIED IN MERGED MAIN** by successful CI; external database backup/retention procedures remain deployment work |
| Audit tampering prevention | Application exposes read-only audit review; no audit update/delete route. Candidate adds explicit API negative tests. | **PARTIAL** until candidate CI; database operators still require least-privilege controls outside this application |

The candidate also binds the API entrypoints to loopback by default (`HOST=127.0.0.1`) so a caller cannot bypass the documented one-hop reverse proxy and spoof forwarded IP headers. Non-loopback deployment requires a private interface and a firewall-enforced proxy boundary. Local client tests pass 17/17, production Vite build passes, server syntax checks pass, and SMTP URL tests pass 2/2. Mongo-backed tests on this Windows machine fail before assertions because its cached MongoDB archive fails published MD5 verification. Candidate changes have no Actions result yet.

## Current acceptance decision

- **#1: NOT READY TO CLOSE.** Core behavior and CI are verified in merged `main`; real verification/reset SMTP delivery and deployed browser/link acceptance are outstanding.
- **#3: NOT READY TO CLOSE YET.** Core implementation and merged-main CI are verified. Candidate security/test changes need a new passing PR check and independent review. Production least-privilege database controls are not deployed or evidenced.
- Do not close either issue solely because PR #63 merged. No Sprint 2 points are newly counted by this report.

## Remaining actions

1. Run and review CI for the final-pass PR, including the new origin, proxy-spoof, and read-only audit tests.
2. Request independent repository-owner review; do not merge automatically.
3. Perform staging SMTP delivery and deployed account-link walkthrough for #1.
4. Record staging/deployment network controls for trusted proxy and database audit permissions for #3.
5. Keep #1 and #3 open until their acceptance evidence is attached and reviewed.
