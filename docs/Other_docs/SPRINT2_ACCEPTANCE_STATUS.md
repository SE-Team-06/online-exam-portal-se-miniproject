# Sprint 2 acceptance status — final follow-up, 30 October 2026

> **Historical snapshot:** The status below records the 30 October follow-up and its then-pending candidate. The current post-merge status is appended at the end and supersedes its candidate/CI statements; the original dated record is retained for history.

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

## Current post-merge acceptance update — 10 November 2026

This update was checked against `main` at `b2ec87d7234780d595e617f10fd1fe73b9edd7dd`. PRs #60, #63, #64, and #65 are present in `main`. The latest post-merge Actions run [42769438348](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/42769438348) succeeded on that SHA, including dependency installation, automated tests, syntax checks, and production build. Its exposed job summary does not show individual test counts; the recorded 172 server and 17 client counts are from the prior documented executions. These CI results verify automation, not staging or production behavior.

### Issue #1 — registration and recovery

- Registration validation, unique email enforcement, compliant password hashing, unverified-login rejection, 24-hour single-use verification tokens, and 30-minute single-use password-reset tokens are implemented. `server/test/auth-lifecycle.test.js` covers duplicates, token validation/expiry/reuse, generic reset responses, password changes, and session revocation; mocked mail-transport tests are not real SMTP delivery.
- User-supplied P1 browser evidence shows required-field validation and the generic password-reset acknowledgement. A registration submission returned HTTP 503 with a mail-send error. The screenshot does not identify the cause. Successful activation, completed reset, and real staging email delivery remain blocked or unverified.
- Staging mail service provisioning is an environment dependency. The issue assignment does not establish that Chhavi owns that provisioning; do not represent it as an individual code defect or claim delivery success.

### Issue #3 — administrator users and audit

- Admin create/list, name/password/role edits, activation/deactivation, role changes, RBAC/CSRF, self-demotion safeguards, session revocation, audit review/filtering/pagination/redaction, and application-level indefinite audit retention are implemented and covered by `server/test/admin-users.test.js`, `server/test/operations.test.js`, and `server/test/security.test.js`.
- The admin interface keeps email read-only until an email-change verification flow exists (`client/src/AdminUsersPanel.jsx`). SRS FR-OE-006 requires account editing but does not specify email-address editing. This is a documented design limitation, not evidence that a secure email-change acceptance criterion is missing; do not add an unverified email-change mechanism solely to broaden scope.
- Production proxy/IP trust, database operator permissions, backup safeguards, and operational retention still require target-environment evidence. Application-level TTL/index tests do not establish production operations.

### Remaining evidence and ownership boundary

- The P1 manual report and 19 screenshots are merged through PR #73; see [`SYSTEM_VALIDATION_REPORT.md`](SYSTEM_VALIDATION_REPORT.md). It distinguishes screenshot-backed results from user-reported actions, and keeps registration success, SMTP delivery, completed password reset, and STP TC-OE-010 performance/availability unverified.
- Issues #2, #4, #5, and #18 remain supported by the current automated authentication, question/exam workflow, and deadline-finalization tests. P1 browser evidence is partial for the instructor create/publish/assign action sequence, and there is no manual timer-zero demonstration; these do not negate the passing automated evidence.
- Shared issue #67 remains open for staging, load/availability, deployment controls, project-board recheck, video-content review, and team acceptance reconciliation. Do not assign those shared/environment tasks to Chhavi without an explicit ownership decision.
- Question/option shuffling and negative marking are tracked separately in issues #15 and #16 and are not absorbed into issues #4 or #5 here.

**Current decision:** the assigned application implementation for #1, #2, #3, #4, #5, and #18 is present and automated checks pass. External staging/deployment evidence and some practical P1 scenarios remain incomplete; this is not a claim that the full SRS/STP or shared issue #67 is accepted.
