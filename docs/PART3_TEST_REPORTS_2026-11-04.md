
# Part 3 Test Reports — 4 November 2026

Verified source tree: 3a718e0719c0f7695ab42b21cf2bf6d50940ac26. GitHub main is 5cbd275ae0510bdc0dde17704a54ffda43359f37; local origin/main remains at 6ecd2f13b291eac1db479390dfc91cae89b9405d because the fetch attempt could not reach github.com, but its tree hash matches the live main commit.
Execution host: Windows; Node.js v26.13.0; npm 11.20.0.
Data: synthetic automated test data only.

## Unit Test Report

| Scope | Command / source | Result |
|---|---|---|
| Client unit tests | `npm --workspace client test` | **PASS** — 17 passed, 0 failed, 0 cancelled, 0 skipped (4 suites). |
| Server pure unit/config tests | `node --test --test-concurrency=1 test/email-config.test.js test/scoring.test.js` from `server` | **PASS** — 8 passed, 0 failed, 0 cancelled, 0 skipped. |
| Server integration suite | Local npm test with a fresh MONGOMS_DOWNLOAD_DIR; GitHub Actions run #88 on the identical source tree | **PASS** — server 171/171 and client 17/17 locally; no failures, cancellations, or skips. The first local attempt used the old cache and failed its MD5 check. A fresh MongoDB 8.2.6 download passed its integrity check; no checksum bypass was used. |

The pure server tests cover SMTP URL security (TLS required and insecure settings rejected) and scoring cases (correct/wrong/unanswered, negative-marking enabled/disabled, and zero-floor behavior). Client tests cover exam form scoring configuration, server-time timer behavior, submit summary, and question answer selection/validation.

## System Validation Report

| Area | Evidence | Result |
|---|---|---|
| Server syntax | `npm --workspace server run check` | **PASS** — checks `src/index.js`, `src/app.js`, and `src/ops/cli.js`. |
| Production build | `npm run build` | **PASS** — server checks passed; Vite transformed 20 modules and completed the production build. |
| Client behavior | Full client test command above | **PASS** — 17/17. |
| API/database integration | Full server integration suite; automated synthetic accounts and database | **PASS** — all 171 server tests passed, including registration/reset, administrator/RBAC, audit/retention, security, exam and deadline-submission cases. |
| Actual SMTP delivery | No staging SMTP delivery performed; only configuration tests ran | **NOT VERIFIED** — requires staging `APP_ORIGIN`, `SMTP_URL`, `MAIL_FROM`, and a disposable mailbox supplied through the secret store. |
| Local browser/accessibility smoke | `tools/a11y-check.mjs chrome` against the documented local demo | **PARTIAL / FAILED** — axe and responsive checks passed on the login page at 1280px and 360px. The script timed out waiting for the instructor dashboard text `Your exams`; student, exam, dialog-keyboard, and dashboard checks did not run. No successful workflow walkthrough is claimed. |
| Deployed/browser walkthrough | Not performed | **NOT VERIFIED** — no deployed environment was configured for this run. |
| GitHub Actions | No new branch run exists for this local report | **NOT VERIFIED**. |

## Code Coverage Report

Coverage was generated with the repository's Node test-runner coverage scripts. Full suite coverage was generated with the verified temporary MongoDB binary. See the suite results below.

| Scope | Line coverage | Function coverage | Status |
|---|---:|---:|---|
| Client | 100.00% | 100.00% | **PASS** for included `client/src` modules. |
| Server | 94.08% | 96.45% | **PASS** — full 171-test suite ran with verified MongoDB binary; configured 70% line threshold passed. |

## Branch Coverage Report

| Scope | Branch coverage | Status |
|---|---:|---|
| Client | 97.44% | **PASS** for included `client/src` modules. |
| Server | 79.96% | **PASS** — full 171-test suite ran; coverage includes branch measurement. |

## Updated test-case matrix

| Test case / requirement area | Automated source | Outcome this run |
|---|---|---|
| Registration, unique email, verification link expiry/reuse, reset expiry/reuse, session revocation | `server/test/auth-lifecycle.test.js` | **PASS** — executed in the complete 171-test server run. |
| Administrator create/list/edit/activation/role/RBAC/audit | `server/test/admin-users.test.js` | **PASS** — executed in the complete 171-test server run. |
| Audit filtering, pagination, retention indexes, backups and operations | `server/test/operations.test.js` | **PASS** — executed in the complete 171-test server run. |
| API authorization, CSRF, authentication and transport security | `server/test/security.test.js` | **PASS** — executed in the complete 171-test server run. |
| Exam workflow, deadline submission, audit retry/idempotency, rate limiting | `server/test/workflow.test.js` | **PASS** — executed in the complete 171-test server run. |
| SMTP URL validation | `server/test/email-config.test.js` | **PASS** — 2 tests. Does not prove external SMTP delivery. |
| Scoring and negative-marking calculations | `server/test/scoring.test.js` | **PASS** — 6 tests. |
| Exam form validation, timer math, submit summary and question form behavior | `client/test/*.test.js` | **PASS** — 17 tests across 4 suites. |

## Acceptance and follow-up

The full local root test suite and server coverage passed; see exact counts above. The matching live-main GitHub Actions run #88 passed install, all tests, syntax checks and build. Outstanding evidence is actual staging SMTP delivery and deployed/browser accessibility validation. The local optional Chrome smoke check passed login-page axe/responsive checks, then timed out waiting for the instructor dashboard; remaining workflow checks did not run. No checksum or security check was bypassed.

