# Deviations from the Submitted Documents

Compares the running implementation with the submitted **SRS v1.2**, **SAD v1.4** and **STP v1.1**, as required for the final demo.

- **Baseline:** `main` at `a60f3d5` (26 Oct 2026) plus open PRs **#49, #50, #51** (merge in that order). Rows marked *Resolved* are fixed by those PRs or by the already-merged #43 / #44.
- **History:** first version 26 Oct (PR #45, end of Sprint 1); updated the same day after the Sprint 2 fixes.
- **Owner:** Gagan (P4, design). Update this file when a deviation is fixed or a new one is introduced.
- The requirement-by-requirement status is in [implementation-gap-register.md](implementation-gap-register.md). This file explains **what differs from the documents and why**.

## 1. Design deviations (SAD v1.4)

Deliberate implementation choices that differ from the design. None reduces a requirement except where "Impact" says so.

| # | SAD reference | Documented | Implemented | Reason | Impact / action |
|---|---|---|---|---|---|
| D-01 | §3.6 Tech stack; SD-01 | JWT in an HttpOnly cookie, bound to a server session | Random 256-bit **opaque session token** in an HttpOnly cookie; only its SHA-256 hash is stored in `sessions` | Server-side sessions can be revoked instantly on logout or inactivity (FR-OE-004, SEC-OE-006) with no token-signing key to manage | None. Meets the same requirements more simply. Update SAD §3.6 |
| D-02 | §3.6 | `bcrypt` / Argon2 | `bcryptjs` (pure-JS bcrypt), cost 12 | No native build step on Windows/macOS/CI | None. Same algorithm and hash format (SEC-OE-001) |
| D-03 | §4.3.1 | Joi / express-validator | **zod** schemas per route | Single schema library for parsing and validation | None |
| D-04 | §4.3.1–4.3.2 | Base path `/api/v1` | Base path `/api` (no version prefix) | Single client, no external API consumers yet | Low. Add `/v1` if the API is opened to other clients |
| D-05 | §4.1 data entities | Separate `answers`, `assignments`, `focusEvents` collections | Answers and focus timestamps **embedded in the `attempts` document**; assignments are `exams.assignedStudentIds` | One document per attempt makes save/submit atomic and keeps the "one attempt" rule on a unique `(examId, studentId)` index | None for current scale (NFR-OE-011 untested) |
| D-06 | §4.3.2 API-09, API-10 | Create exam, then publish/assign as a separate step | `POST /api/exams` **creates, publishes and assigns in one call**; status is always `Published` | Simpler instructor flow for the MVP | FR-OE-011 met. No draft stage, so "visible before publication" is only in the form. Consider a draft state in Sprint 2 |
| D-07 | §4.3.3 API-13; SD-02 | Batched auto-save `PATCH /attempts/:id/answers` every 30 s and on change, with `clientSeq` | `PUT /api/attempts/:id/answers/:questionId` **sent immediately on every answer change**; no periodic timer | Saving every change is at least as safe as a 30 s batch: nothing unsaved is left to batch | FR-OE-017 and NFR-OE-005 met by design (data loss ≤ one in-flight request). No `clientSeq` ordering |
| D-08 | SD-02; NFR-OE-010 | Client timer corrected by a server-time offset returned on every response | Countdown uses the **browser clock** against the server-issued `endsAt`; the server enforces the deadline (rejects late saves, auto-submits) | Server enforcement was prioritised | **Resolved (#49):** responses include `serverTime`; the countdown applies the offset |
| D-09 | §4.3.3 API-13, API-15; SEC-OE-009 | Answers accepted until `endsAt` + **5 s grace** | Answers rejected from `endsAt` exactly (409 `ATTEMPT_ENDED`); no grace period | Stricter than documented | Low. A save sent in the last second may be refused. Action: decide whether to add the 5 s grace or update the SRS |
| D-10 | SD-03 | Auto-Submit Job every **10 s** | Expiry worker every **5 s** (`server/src/index.js`) | Faster finalisation | None (improvement) |
| D-11 | §4.3.2 API-14 | `POST /attempts/:id/focus-events`, sent by the browser on blur/tab switch | Endpoint is `POST /api/attempts/:id/focus-loss` and stores timestamps, but **the React client never calls it** | Client wiring not done | **Resolved (#49):** the browser records tab/window switches; instructors see the count and times. Path stays `/focus-loss` |
| D-12 | §4.3.2 API-17, API-18 | Per-exam results `GET /exams/:id/results` (+ `/export`) with average, highest, lowest and pass % | `GET /api/instructor/results` and `/results.csv` across **all** the instructor's exams; statistics are total, average and pass rate | Single results page for the MVP | **Resolved (#49):** per-exam statistics (average, highest, lowest, pass rate) and an instructor results screen. Still one endpoint for all exams instead of `/exams/:id/results` |
| D-13 | §4.4.1 error catalogue | `INVALID_CREDENTIALS` (401), `ACCOUNT_LOCKED` (423), `EXAM_NOT_OPEN`, `ATTEMPT_CLOSED`, `EXAM_LOCKED` | `LOGIN_FAILED` (401, also when locked), `EXAM_CLOSED`, `ATTEMPT_ENDED`, `EXAM_LOCKED`; unassigned exam/attempt returns **404** instead of 403 | Locked accounts get the same generic 401 so attackers cannot tell a locked account apart; 404 avoids revealing that another student's attempt exists | Low. STP test cases using the SAD codes must use the implemented codes |
| D-14 | §4.4.1 error envelope | `{ error: { code, message, details, requestId } }` + `X-Request-Id` header | `{ error: { code, message } }`; no request ID | Not built | Low. Harder to trace a user's error in logs |
| D-15 | §4.4.2–4.4.3 | Structured JSON logging (pino/winston) with redaction; Prometheus metrics M-01…M-08, Grafana, alerts | `console` logging of error messages only; `GET /api/health` returns a fixed `ok` (no DB check); **no metrics or alerting** | Out of Sprint 1 scope | **Partly resolved (#51):** health check pings MongoDB (200/503), and an external probe plus monthly report measure availability in exam windows (replaces M-04). Still no Prometheus metrics, latency dashboards or structured logs (M-01…M-03, M-05…M-07); performance is #22 |
| D-16 | §3.4 Notification Service; FR-OE-026 | In-app **and email** (SMTP) notifications | **In-app only** (`notifications` collection) | No SMTP service configured | **Partial:** FR-OE-026 email part missing |
| D-17 | §4.5 UX: submit dialog | Confirmation showing unanswered and flagged counts | Submit button submitted **without a confirmation** | Not built in Sprint 1 | **Resolved (#49):** dialog shows unanswered and flagged counts; flag-for-review added (FR-OE-015) |
| D-18 | SEC-OE-005 | HTTPS only, plain HTTP rejected | `REQUIRE_HTTPS` / `NODE_ENV=production` rejects plain HTTP with 403 `HTTPS_REQUIRED` (merged, #44); TLS terminated by a reverse proxy | TLS belongs at the proxy, not in Node | No deployment yet, so TLS itself is unverified. See [SECURITY_DEPLOYMENT.md](SECURITY_DEPLOYMENT.md) |
| D-19 | §4.4.3 M-08; NFR-OE-006 | Backup job monitored as a metric | Backup is a gzip'd Extended-JSON export of all collections written by the API (`BACKUP_DIR`) or `npm run backup`, keeping the newest 7; restore command included (#51) | Works without installing MongoDB Database Tools (`mongodump`) on every machine | Backups are not encrypted (SEC-OE-012); store them on an encrypted volume. No alert on failure, only a log line |
| D-20 | §4.3.2 (not in SAD) | — | New `DELETE /api/admin/users/:userId/data` for deactivated accounts; audit entries kept (#51) | NFR-OE-014 needed an endpoint the SAD did not list | Add to SAD API catalogue. No UI until user management (#3) |

## 2. Scope deviations (SRS v1.2)

Requirements not yet delivered, or delivered only in part. Must items cannot be dropped without the Product Owner's and instructor's agreement.

| Requirement | Priority | Status | Tracking |
|---|---|---|---|
| FR-OE-001, 002 registration and email verification | Must | Not started. Accounts are pre-provisioned (seed/demo) | #1 |
| FR-OE-005 password reset | Must | Not started | #1 / backlog |
| FR-OE-006 admin user and role management | Must | Not started | #3 |
| FR-OE-009 question/option shuffling | Should | Not implemented (`shuffleQuestions` field exists, unused). Issue #15 is closed but its criteria are not met | Reopen #15 |
| FR-OE-010 negative marking | Could | Done (#43) | #16 closed |
| FR-OE-017 auto-save | Must | Done, by a different mechanism (D-07) | — |
| FR-OE-015 flag for review | Must | Done (#49) | #46 |
| FR-OE-019 manual submit with confirmation | Must | Done (#49) | #46 |
| FR-OE-021 focus-loss logging | Should | Done (#49) | #47 |
| FR-OE-024 instructor statistics | Must | Done (#49): per-exam average, highest, lowest, pass rate | #47 |
| FR-OE-026 notifications | Should | In-app only (D-16) | — |
| FR-OE-027 audit log view | Should | Events recorded; no admin view or filters | #21 |
| NFR-OE-001…003, 011 performance and scale | Must/Should | Not measured; no load tests | #22 |
| NFR-OE-004 availability | Must | Measurable (#51: DB health check, probe, monthly report); no deployment yet, so no real figure | #23 |
| NFR-OE-006 daily backup, keep 7 | Should | Done (#51); not yet scheduled on a server | #23 |
| NFR-OE-014 retention and deletion on request | Should | Done (#51): nothing retained expires (test-enforced); admin deletion API | #23 |
| NFR-OE-008, 009 accessibility and browsers | Should/Must | Verified (#50): WCAG 2.1 A/AA automated checks and keyboard walkthrough pass in Chrome 156, Firefox 157 and WebKit 27 at 1280 and 360 px. **Edge and previous browser versions not tested** | #24 |
| NFR-OE-010 timer accuracy | Must | Done (#49): server-time offset; ≤ 2 s drift not yet measured on real devices | #48 |
| SEC-OE-002 password rules | Must | Rule exists (`passwordIsCompliant`), applies once registration (#1) exists | #1 |
| SEC-OE-005 HTTPS | Must | App-level enforcement (#44); no deployment | #20 closed |
| SEC-OE-009 5 s grace | Must | Stricter: no grace (D-09) | decide |
| SEC-OE-011 audit fields and retention | Must | Events have user, IP and time; no 12-month retention policy or result-access events | #21 |
| SEC-OE-012 encryption at rest | Should | Not implemented (database or backups) | backlog |

Agreed change already recorded in SRS v1.2 §2.6 and SAD v1.4: the score is shown immediately after submit; question-wise review with correct answers is available only after the exam end time and only if enabled (`GET /api/attempts/:id/review`). Implemented as documented.

## 3. Test plan deviations (STP v1.1)

| STP item | Planned | Actual |
|---|---|---|
| §5 levels and tools | Unit, integration, system and acceptance testing with Selenium, Postman, JMeter/k6 | Automated **unit and API integration tests** (`node:test` + supertest + in-memory MongoDB) run in GitHub Actions on every PR and push. No Selenium UI automation or load tests yet |
| §13 TC-OE-001…010 | 10 planned test cases mapped to requirements | The STP cases have not been executed as written. The automated tests exercise parts of their scope: login/logout/credential storage (TC-OE-001), lockout and 429 (TC-OE-002, no password reset), RBAC (TC-OE-003, no audit view), question bank and exam setup (TC-OE-004), attempt, save and submit authorisation (TC-OE-006/007) and scoring (TC-OE-008). Results and CSV (#49) and backup/retention (#51) now have tests, covering part of TC-OE-009. **No automated tests yet** for notifications (TC-OE-005) or load (TC-OE-010). Run records are in [test-execution.md](test-execution.md) |
| Error codes in API test cases | SAD §4.4.1 codes | Use the implemented codes (D-13) |
| Usability / accessibility (NFR-OE-007…009) | Manual checks | Automated `npm run check:a11y` (axe-core WCAG A/AA, 360 px, keyboard dialog) in 4 browsers plus a manual keyboard walkthrough (#50). Results in [ACCESSIBILITY_BROWSER_REPORT.md](ACCESSIBILITY_BROWSER_REPORT.md) |
| Reliability (NFR-OE-005, 006) | Recovery testing | Backup/restore round trip and retention automated (#51). No server-crash recovery test |
| §5.1 security validation | TLS scan, penetration testing | Application-level security tests (#44: 401/403/role on every route, credential handling, cookies, HTTPS mode). TLS scan pending a deployment |

## 4. For the final demo

When presenting, group the deviations as:

1. **Improvements on the design:** D-01 (revocable sessions), D-05 (atomic attempt document), D-07 (save on every change), D-10 (faster auto-submit), D-13 (generic lockout message), D-19 (backups with no extra tools).
2. **Simplifications for the MVP:** D-04, D-06, D-12, D-14, D-16.
3. **Fixed during Sprint 2:** D-08, D-11, D-12, D-17 (#49), accessibility (#50), availability/backup/retention (#51).
4. **Still open:** D-09 (5 s grace), D-15 metrics, D-16 email, and the rows still marked not started in Section 2 (registration, password reset, admin users, shuffling, audit view, performance, encryption at rest).
