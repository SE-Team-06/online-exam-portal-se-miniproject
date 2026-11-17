# Implementation and requirement gap register

## Current acceptance snapshot — 10 November 2026

Latest verified `main` is `b2ec87d7234780d595e617f10fd1fe73b9edd7dd`, merging P1 evidence PR #73 after the earlier account/audit and P1 PRs. The latest post-merge Actions run [42769438348](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/42769438348) succeeded on that SHA, including dependency installation, automated tests, syntax checks, and production build. The run summary does not expose the test count; earlier recorded executions report 172 server and 17 client tests.

- **Assigned issues #1, #2, #3, #4, #5, #18:** current source and automated test coverage for their stated application behaviors are present. The current Actions run succeeded. The code and test evidence are summarized in `docs/SPRINT2_ACCEPTANCE_STATUS.md`; P1 manual evidence is in `docs/SYSTEM_VALIDATION_REPORT.md`.
- **#1:** registration, verification/reset token rules, password policy, and session revocation are implemented and automated-tested with a synthetic transport. Host-browser evidence records an HTTP 503 during registration and a generic reset acknowledgement only. Real staging SMTP delivery, successful activation via delivered link, and completed reset remain unverified. SMTP provisioning is an external/shared dependency; the issue does not establish Chhavi as its individual owner.
- **#2:** login/logout, salted password storage, role checks, CSRF, session handling, cookie controls, and route authorization have automated test coverage. P1 screenshots additionally evidence generic invalid-login rejection (401), one student-to-instructor denial (403), and post-logout rejection (401).
- **#3:** administrator create/list, name/password/role updates, activation/deactivation, safeguards, audit filters/pagination/redaction and application-level indefinite retention have source/test coverage. Email is read-only in the UI; SRS FR-OE-006 does not specify that editing must include an email-address change. No insecure email-change path is added. Production proxy, database privilege, backup, and retention operations remain unverified.
- **#4/#5:** question validation/ownership, exam configuration, publication/assignment, and post-attempt configuration locking are implemented and integration-tested. P1 evidence shows relevant controls and resulting published/assigned states, but the full instructor action sequence is only partially evidenced. Shuffling (#15) and negative marking (#16) remain separate scope.
- **#18:** server-side deadline finalization, saved/empty answer handling, concurrency, idempotency, late-request rejection and retry/recovery have integration tests. No manual timer-zero or production scheduler/load demonstration is recorded.
- **P1:** all 19 supplied screenshots and the qualified manual scenario matrix are merged through PRs #72 and #73. The report keeps BLOCKED/PARTIAL/NOT VERIFIED statuses and does not claim complete SRS/STP acceptance.
- **Local verification in this audit:** the client suite passed 17/17 and `npm run build` passed, including server syntax checks. `npm ci` was blocked by Windows `EPERM` unlinking a Vite native binding. The full server suite could not complete because MongoDB Memory Server's valid downloaded 8.2.6 binary exits with `fassert()` in this execution environment. Integrity checks were not bypassed. This local blocker does not override the green current-main CI run.
- **Shared issue #67 remains open:** staging email, TC-OE-010 load/availability, deployment controls, current Project board reconciliation, video content review and team-level acceptance follow-up remain shared/external work. Do not attribute these to Chhavi without explicit assignment.

## Historical acceptance snapshot — 30 October 2026 (superseded)

The following status was accurate only at its dated checkpoint. Its candidate-branch statements and “do not close” recommendations are historical and are superseded by the 10 November snapshot above; they are retained as a record of the earlier review.

PR #63 was recorded as merged into canonical `main` at `2db1c9d83281601c99a81dd0b018ebe0ec2f5713`. Its verified Actions run [41099637545](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/41099637545) passed clean locked install, 168 server tests, 17 client tests, syntax checks, and production build. A candidate branch was then awaiting separate CI/review.

- **#1 at that checkpoint:** registration/recovery was implemented; staging SMTP delivery was blocked pending secure configuration and disposable-mailbox evidence.
- **#3 at that checkpoint:** account lifecycle and audit UI/API were implemented; production database least-privilege and immutable storage were not deployed or evidenced.
- The local MongoDB cache then had a checksum mismatch. This dated observation is not the result of the later audit run, which downloaded the pinned binary with integrity verification and then encountered the MongoDB process startup failure described above.

### Historical audit snapshot — 25 October 2026 (superseded)

Source of requirement IDs: submitted SRS v1.2 and `SRS/ID_Cheat_Sheet.md`. GitHub status and local branch statements below reflect the dated audit, not the current remote state. This register describes the MVP slice only. A partial implementation is not acceptance of the complete SRS requirement.

## Evidence reviewed

- Express/Mongoose API and React/Vite client in `server/src/` and `client/src/`.
- Automated tests in `server/test/`; latest local run is recorded in [`test-execution.md`](test-execution.md).
- Local demo startup smoke check (API health returned 200; Vite returned 200).
- User-reported manual check: the user opened the local demo, signed in as the instructor, and saw a subject. This is not independent verification of additional instructor functions.

## Implemented partially

| SRS IDs | Evidence in current implementation | Remaining gap |
|---|---|---|
| FR-OE-003, FR-OE-004 | Login for pre-provisioned verified accounts, logout/session handling, role middleware; automated authentication/role tests | No self-service provisioning; full conformance and browser flows not established |
| SEC-OE-001, SEC-OE-002 | `server/src/security/password.js` uses bcrypt cost 12 and password compliance helper | No complete account creation/reset workflow; broader password-policy test evidence needed |
| SEC-OE-003 | Five-failure account lockout with `lockedUntil`; integration test verifies lockout state | Exact 15-minute duration/recovery behavior needs explicit test |
| SEC-OE-004, SEC-OE-006 | Server-side role/session checks and inactivity configuration; protected-write test | Cookie/session hardening and 30-minute behavior need full verification; production HTTPS is absent |
| SEC-OE-007 | Attempt question payload omits correct-option identifiers; test checks response shape | Result release and answer-review policy is incomplete |
| SEC-OE-008 | Request validation, CSRF token and origin checks are present; tests cover malformed question and missing CSRF | Full OWASP coverage, sanitization and systematic injection/XSS testing remain |
| SEC-OE-009 | Attempt and result access are scoped to the authenticated student; tests cover unassigned start and cross-user result denial | Full boundary/grace-period matrix and concurrent edge cases remain |
| SEC-OE-010 | Login limiter configured for 10 requests per IP per 60 seconds | Automated 429/window/IP behavior test is still needed; password-reset route does not exist |
| FR-OE-007, FR-OE-008, FR-OE-011 | PR #32 (question management) and PR #34 (exam configuration/locking) are visible as merged in authenticated GitHub. PR #34 merge commit is `58b988be87a174127c9201a5e3696281a1bcb553`, containing source commit `e00844256cf35969c80255d6d86bc16d78468dec`. Local automated tests cover ownership, validation, assignment and post-attempt locks. | No browser acceptance walkthrough. `git fetch` failed, so local `origin/main` remains stale at `f2ed5186eda44197104a30ae44cf2e6e3fd2e2e9`; live GitHub main was verified in browser. Exam deletion and a separate draft/publish lifecycle are not implemented. Issue #4/#5 are closed on GitHub, but closure is not browser acceptance. |
| FR-OE-013, FR-OE-014 | Assigned exam list and one-attempt start constraints; integration test | All status/time-window cases and UI usability are not fully tested |
| FR-OE-015, FR-OE-017, FR-OE-018 | Answer/flag persistence, server-side save and resume path in API | Autosave timing/30-second interval and interrupted-browser behavior need verification |
| FR-OE-016, NFR-OE-010 | Server derives attempt end time and expiry worker auto-submits expired attempts | Displayed timer drift (≤2 seconds), clock skew and browser lifecycle remain unverified |
| FR-OE-019, FR-OE-020 | Manual submit API and expired-attempt auto-submit path; timeout integration test | UI confirmation/unanswered count is incomplete; expiry scheduling and load behavior need further validation |
| FR-OE-021 | Focus-loss endpoint persists timestamps and writes an audit event; test verifies persisted event | Browser focus tracking and instructor-visible count/times are not implemented |
| FR-OE-022 | Server-side score calculation and scoring unit/integration tests | Full scoring matrix and release behavior need broader evidence |
| FR-OE-023 | Student-owned result API/UI | Instructor-controlled question-wise correct-answer release is incomplete |
| FR-OE-027 (partial) | Audit event model/writer plus Administrator-only filtered, paginated and redacted review endpoint at `/api/admin/audit-logs`; indexed action/user/timestamp queries and integration coverage | Full required event coverage and a deployed 12-month retention report still require production evidence |

## Not started or not verified

### #1 / #3 status as recorded in the 25 October snapshot

- **#1 / OEPSE-7:** registration, unique email, password policy, hashed single-use verification/reset links, expiry and synthetic mail-transport behavior have implementation and automated test coverage in the repository. The relevant Mongo-backed tests were not executed successfully in this environment. Staging SMTP verification/reset delivery is not configured and remains blocked. Do not close.
- **#3 / OEPSE-8:** administrator create/edit/activate/deactivate/role-change, CSRF/RBAC, self-demotion protection, session revocation and audit filtering/redaction have implementation and existing coverage. Added audit-IP/result-access and actual TTL-index coverage remains unverified until the Mongo-backed suite runs. Production retention evidence is also not established here. Do not close.
- **Sprint 2:** partial implementation and documentation work only; no points are counted complete from this local branch. PR #60 is merged, but this follow-up is not yet pushed/reviewed/merged. Preserve the open acceptance work as carryover until CI and owner review succeed.

- FR-OE-001, FR-OE-002: registration and email verification.
- FR-OE-005: one-time password reset flow.
- FR-OE-006: administrator user lifecycle and role management.
- FR-OE-009 / OEPSE-12 / GitHub #15: question/option shuffling is not implemented. The model has a `shuffleQuestions` field, but no UI/API behavior consumes it, no option-shuffle setting exists, and tests do not verify randomized ordering or scoring. GitHub issue #15 is closed despite its acceptance criteria requiring these behaviors; team should review/reopen it rather than treating closure as evidence.
- FR-OE-010 (OEPSE-13 / Issue #16): negative marking is represented in the exam schema and validated API; the instructor form exposes a non-negative value; scoring tests cover positive deduction, zero floor and unanswered answers; an integration test checks persistence. Issue #16 is still open. Full acceptance is incomplete/unverified: there is no explicit enable/disable control beyond setting the value to zero; exams are created directly as Published, so the pre-publication and fixed-after-publication lifecycle criteria are not demonstrated; no end-to-end test connects configuration through scoring for enabled and disabled cases.
- FR-OE-012: PR #34 merges freezing schedule, assignments, question selection, duration, scoring, and review settings after an attempt starts; tests cover changes rejected after the first attempt. Broader browser acceptance is unverified.
- FR-OE-024: instructor attempt analytics and summary statistics.
- FR-OE-025: CSV results export.
- FR-OE-026: assignment/result notifications.
- NFR-OE-001 to NFR-OE-014: repeatable OEPSE-25 load and MongoDB storage measurement commands now exist under `server/src/ops/scale.js`, with configurable p95/error thresholds; production-scale results, availability, accessibility, compatibility, coverage, portability, and retention evidence still require execution against the agreed representative deployment/dataset.
- SEC-OE-005 and SEC-OE-012: production TLS/rejection of HTTP and encryption at rest for personal data/backups.
- SEC-OE-011: complete audit event fields, retention, and access requirements.
- Production deployment, monitoring, durable backup/recovery, and operational secrets management.

## Assignment-document alignment and risks

- **Fetched Git history verified 24 October:** PR #28 is included at `88c21bcf2d887fcc9f5381e509523592167142bb`; PR #30's correct-answer fix is included at `17cdedda37b70f6f3b93f4b3c9a5b868505b2f8d`; PR #31 is at `62b817f0151ab68e63a66055ae3ccdfcc2a0d6a9`. A later successful fetch updated `origin/main` to `f2ed5186eda44197104a30ae44cf2e6e3fd2e2e9` (PR #33 merge); the Issue #4 commit `5da5127bb9857e306aa893ff5314884c7537eb11` is its ancestor. Automated tests cover question-list/exam payload answer-key redaction, instructor authorization and ownership, exam persistence, and student assignment. Passing tests/build do not establish browser usability or full SRS acceptance.

- The repository contains the SRS v1.2, SAD v1.4, STP v1.1, RTM workbook, STRIDE workbook, and three sequence diagrams. The implementation is a MERN slice; API/design conformance has not been established end to end.
- The test execution log below reports only tests actually run against this MVP, not completed execution of the submitted STP. Test-to-requirement mappings are corrected to match what each test exercises.
- SRS v1.2 and SAD v1.4 show a related-document version mismatch. The SAD API-07/API-08 presentation also needs review against implemented routes. Preserve the approved documents until the team decides whether to revise them.
- Temporary demo data and generated passwords are disposable. Do not use real identities or credentials.


## Live issue and merge reconciliation — 25 October 2026

- GitHub browser readback showed PR #34 merged to `main` at `58b988be87a174127c9201a5e3696281a1bcb553`; source commit `e008442` is included. PR #34 showed 1/1 check passing. The current issue index showed 16 open and 8 closed. Local `git fetch` failed with `SEC_E_NO_CREDENTIALS`; cached `origin/main` is stale and must not be presented as the live main head.
- Open issues observed: #1, #3, #6, #8, #9, #10, #12, #16, and #18–#25. Closed issues observed: #2, #4, #5, #7, #11, #15, #17, #26. The list is a live snapshot, not an assertion of current Jira state.
- Closed #15 is inconsistent with source: shuffle acceptance is not implemented. Closed #17's issue body asks for restoration after refresh/interruption, a server-derived deadline, per-student restoration, and tests for refresh/retry/duplicate saves/expiry. APIs can return an existing in-progress attempt and an authenticated student can fetch their own attempt, but the UI restoration route and those regression cases are not covered by the test suite. The issue should be re-audited with the assignee/team; do not assume its closed status proves acceptance.
- Issue #3's description includes administrator audit acceptance while explicitly separating that area from account lifecycle; open #21 separately covers OEPSE-23 audit review. Clarify #3's scope to prevent duplicate acceptance/point counting. #9 and #10 both refer to OEPSE-17 and their bodies say count the 5-point Jira item once; preserve that reconciliation.
- Issue #6 is open although current code creates/publishes exams and assigns verified students; workflow tests cover publication and assignment. It is a candidate for manual closure after a short browser check against its actual description. Issues #8–#10 also have relevant implementation/tests, but acceptance details and any remaining UI/manual expectations must be checked before closure.

## Follow-up validation evidence — 25 October 2026 (historical local tests)

- PRs #30–#34 are shown merged in GitHub's current main history. Question edit/delete commit `5da5127bb9857e306aa893ff5314884c7537eb11` and exam configuration/locking commit `e008442` are present in the browser-verified history. Local tests are recorded in `test-execution.md`; authenticated GitHub issue states and PR #34 were inspected in browser, but no product browser walkthrough was performed.
- The official Part 2 PDF was not found in the repository, and the provided local PDF path was unavailable in this session. No new Part 2 completion claim is made from that document.

## Issue #5 implementation work — 25 October 2026

- The 25 October fetch attempt failed with `SEC_E_NO_CREDENTIALS`; a browser-authenticated GitHub inspection later verified PR #34 merged and Issue #5 closed. The Issue #5 body says the scope is creating and locking exam configuration, with question authoring and negative marking separate.
- Commit `e00844256cf35969c80255d6d86bc16d78468dec` contains exam creation/configuration, owner-scoped editing, question/student reference validation, and locks sensitive settings after attempts start. PR #34 merged it as `58b988be87a174127c9201a5e3696281a1bcb553`. Local automated tests passed; browser product acceptance remains unverified. Draft/publish recovery work is not in this commit.
- Exam deletion was not implemented: the repository SRS does not require deletion, and deleting exams with attempts would need a separate retention/product decision. The live issue description must be checked before deciding closure.
- Browser product walkthrough is unverified. PR #34 showed one passing check; no separate current Actions details were retrieved.
