# Local test execution record

## PR #63 CI follow-up — 30 October 2026

- The failing Actions run reported `passwordHash is not defined` in the administrator test and two audit-IP assertions that expected values from caller-supplied `X-Forwarded-For` headers. The administrator test's setup variable was scoped to the `before` callback; the second synthetic administrator now receives a hash from the existing `hashPassword` helper.
- The IP tests run over direct Supertest sockets, not through the application's configured one-hop reverse proxy. They now temporarily disable proxy trust for those test requests, include spoofed forwarding headers, assert those values are ignored, and compare the final submission audit IP to the same attempt's observed start-request audit IP. Production trust-proxy configuration and submission code are unchanged.
- Submission remains idempotent, automatic finalization and audit retry retain the captured IP, and no captured IP remains `null`; only the incorrect test assumptions changed.
- Verification on this Windows host: the client suite passed **17/17** and the client Vite production build passed. Server integration tests could not initialize MongoDB Memory Server because the downloaded archive failed its published MD5 check; no server pass is claimed. `node --check` and `git diff --check` passed for the changed files. The new PR-branch Actions result is pending because the branch push has not yet succeeded.

## Sprint 2 acceptance follow-up — 30 October 2026

- Verified baseline: fetched `main` at PR #60 merge `4d599af441ab352829007a1d6a61e49dba068895`; work is on `fix/sprint2-account-acceptance-audit`.
- `npm.cmd ci`: unavailable because `npm.cmd` is not on PATH. Root `npm ci` invoked with the available npm 12.2.1 CLI failed with Windows `EPERM` creating the npm workspace symlink. Server and client dependencies were installed independently with workspaces disabled; manifests and lockfile were unchanged.
- `node --check` passed for the modified server source and tests. `node --test client/test/*.test.js`: **17 passed, 0 failed**. Vite production build passed from `client`.
- Focused server integration command (`node --test --test-concurrency=1 test/auth-lifecycle.test.js test/admin-users.test.js test/operations.test.js test/workflow.test.js` from `server`) did not reach test assertions. MongoDB Memory Server downloaded an archive whose MD5 did not match its published checksum and refused startup. Treat all Mongo-backed acceptance cases as **unverified**, not passed. The integrity check was not bypassed.
- `npm test` through the available npm CLI failed because its workspace script invokes the `npm` executable recursively, which is absent from PATH. `npm run build` was not runnable through the same script chain; equivalent server `node --check` checks and direct client Vite build passed.
- No staging SMTP variables/service were configured; real email delivery is **BLOCKED**. No real delivery, credential, or account evidence is claimed.
- `git diff --check` passed. No GitHub CI result exists yet for this follow-up branch.

## Account lifecycle continuation — 30 October 2026

- Branch: `feature/oepse-1-3-account-lifecycle`, based on fetched `origin/main` at `c124fec354ee91fe746cf989b32ae6b1f07bacd9`.
- Server syntax checks passed for `server/src/app.js`, `server/src/models/index.js`, `server/src/security/email.js`, `server/test/admin-users.test.js`, and `server/test/auth-lifecycle.test.js`. The pure scoring suite passed 6/6.
- Client tests passed **17/17** (`node --test test/*.test.js` in `client`). Vite production build passed (`node node_modules/vite/bin/vite.js build`).
- The new Mongo-backed server integration tests were not completed: MongoDB Memory Server attempted to download MongoDB 8.2.6 for Windows (781 MB), and the binary was not cached. No test result is claimed for the new account lifecycle routes.
- `npm ci --dry-run --ignore-scripts --no-audit --no-fund` passed and resolved the updated root lockfile, including the mail dependency. An actual root workspace install remains blocked by Windows symlink permissions.
- Real SMTP delivery, link arrival, browser flow, and expiry against a configured deployment remain unverified. Tests use a fake mail transport only.
- Root `npm ci` was attempted and failed with Windows `EPERM` creating the npm workspace symlink. Server/client dependencies were installed independently; the tracked root lockfile was not changed by those installs.

## Issue #18 single-scorer follow-up — 25 October 2026

- Tested on `fix/issue-18-single-scorer`, based on the locally available `origin/main` commit `1f8eda1382dff7e277e61759b40ddbec65ac999e`. A fresh fetch was attempted but could not authenticate (`SEC_E_NO_CREDENTIALS`), so the remote ref may have advanced.
- `npm.cmd test`: **42 passed, 0 failed, 0 skipped** (34 server tests and 8 client tests). The deterministic finalization tests prove one question read while a competing request receives retryable `409 FINALIZATION_IN_PROGRESS`, stale-lease takeover, and fencing of the superseded scorer.
- `npm.cmd run build`: passed; server syntax checks and Vite production build passed. `git diff --check`: passed.
- Finalization claims are acquired atomically before scoring with a 60-second lease. A result can be persisted only by the current unexpired claim token. Expired claims can be reclaimed, and the existing pending-audit recovery plus unique audit index preserves one persisted submission event.
- **Recovery limitation:** if a process crashes after calculating a score but before persisting it, the expired claim can be retried and the pure scoring calculation may execute again. A worker that continues running beyond its lease may overlap a takeover, but its expired token cannot persist a result. The design guarantees one winning persisted result and audit event; it does not claim exactly-once calculation across arbitrary crashes or pauses.
- No browser walkthrough, deployed-environment, production HTTPS, accessibility, or load verification was performed.

## Sprint wrap-up rerun — 25 October 2026

- Commit tested: `e00844256cf35969c80255d6d86bc16d78468dec` on `feature/issue-5-exam-lifecycle`. The tests and build were run after the documentation edits; no application code was changed.
- `npm.cmd test`: **32 passed, 0 failed, 0 skipped** (24 server tests: 21 workflow and 3 scoring; 8 client tests).
- `npm.cmd run build`: passed; server `node --check` checks passed and Vite production build completed (16 modules; JS 238.42 kB / 73.68 kB gzip; CSS 7.28 kB / 2.23 kB gzip).
- These checks verify automated tests and build only. No product browser walkthrough was performed. Authenticated GitHub browser inspection later verified PR #34 merged, its merge commit, one passing PR check, and the issue-index snapshot; this was not a full Actions-history review. Live Jira status remains unverified.
- The local `origin/main` cache remains `f2ed5186eda44197104a30ae44cf2e6e3fd2e2e9`; it is stale relative to the browser-verified GitHub merge of PR #34 at `58b988be87a174127c9201a5e3696281a1bcb553`. A fetch attempted during the 25 October audit failed with `SEC_E_NO_CREDENTIALS`, so do not infer current ancestry from the cached ref.

## Issue #5 focused configuration checks — 24 October 2026 (latest rerun)

- Branch: `feature/issue-5-exam-lifecycle`, based on local `5da5127bb9857e306aa893ff5314884c7537eb11` (parent `62b817f0151ab68e63a66055ae3ccdfcc2a0d6a9`). The worktree contains uncommitted changes; no push or PR was made. The initial fetch attempt failed with `SEC_E_NO_CREDENTIALS` at that time; the later successful fetch is recorded below.
- `npm.cmd test`: **32 passed, 0 failed, 0 skipped** (24 server tests: 21 workflow and 3 scoring; 8 client tests).
- `npm.cmd run build`: passed; server syntax checks and Vite production build passed using installed dependencies.
- `git diff --check`: passed. Git emitted only LF-to-CRLF working-copy warnings for modified text files.
- Focused tests cover exam creation/configuration persistence, owner-only editing, foreign-question and student-assignment validation, schedule boundaries, and configuration locks after an attempt starts. Draft/publish lifecycle and malformed publish-ID coverage are preserved in the pre-scope-split recovery patch, outside this focused diff. No browser walkthrough was performed; live GitHub Actions status remains unverified.

### Preserved separate work

- The pre-scope-split recovery patch at `C:\Users\hp\Documents\Codex\2026-10-13\th\issue-5-pre-scope-split.patch` preserves the previous combined local state, including draft/publish lifecycle code and its tests. It is a recovery snapshot, not part of the focused Issue #5 diff.

### Later Git verification — 24 October 2026

- A later authenticated fetch succeeded and updated `origin/main` to `f2ed5186eda44197104a30ae44cf2e6e3fd2e2e9` (merge commit for PR #33). The Issue #4 question-management commit `5da5127bb9857e306aa893ff5314884c7537eb11` is an ancestor of this fetched `origin/main` (the ancestry check returned exit code 0).
- This later fetch does not change the earlier test-run note above: that fetch attempt had failed at the time. The issue description supplied for this review says the card covers exam configuration creation and locking; no additional criteria are inferred. The live GitHub page and browser acceptance remain unverified.

## Earlier fetched implementation verification — 24 October 2026 (PR #31 ref)

- Fetched refs show PR #28 merged to `main` at `88c21bcf2d887fcc9f5381e509523592167142bb`, PR #30 at `17cdedda37b70f6f3b93f4b3c9a5b868505b2f8d`, and PR #31 at `62b817f0151ab68e63a66055ae3ccdfcc2a0d6a9`.
- At that point, local commit `5da5127bb9857e306aa893ff5314884c7537eb11` added question edit/delete UI and owner-scoped API routes. A later fetch recorded above verified this commit as an ancestor of `origin/main` at `f2ed5186eda44197104a30ae44cf2e6e3fd2e2e9`.
- `npm.cmd test`: **28 passed, 0 failed, 0 skipped** (17 API workflow tests, 3 scoring tests, and 8 client tests). Note: the final run took about 250 seconds because the login lockout test performs repeated password hashing.
- `npm.cmd --workspace server run check`: passed. The Vite production build with `--configLoader native` passed; Vite transformed 16 modules and produced JS 234.59 kB (72.90 kB gzip) and CSS 6.65 kB (2.05 kB gzip).
- `git diff --check`: passed. No authenticated browser walkthrough or fresh Actions run was verified at that point.

## Earlier local verification — 24 October 2026 (before PR #28 merge was verified)

- `feature/chhavi-sprint1-issues` was pushed and later merged as PR #28; see the current verification above. The original statements that the branch was pending/unpushed are superseded by the fetched merge commit evidence.
- At that earlier point, `npm.cmd test` passed 15 tests and `npm.cmd run build` passed. Those results are historical and are superseded by the later runs recorded above.

## Presentation-readiness verification — 13 October 2026 (historical baseline)

- The user ran `npm.cmd ci` in this checkout; their terminal output reported 184 packages added, 187 audited, and 0 vulnerabilities. The PowerShell `npm` alias to `npm.ps1` was blocked by execution policy, so the `.cmd` entry point was used without changing policy.
- Independently reran `npm.cmd test` and `npm.cmd run build` from the actual `work/repo` checkout on `feature/mvp-exam-workflow` with Node.js v22.21.0 and npm 10.9.4. Tests passed **12/12** (9 API workflow tests and 3 scoring tests; 0 failed/skipped). Server syntax checks passed. Vite production build passed, transforming 15 modules; emitted JS was 227.05 kB (71.03 kB gzip), CSS 5.13 kB (1.71 kB gzip).
- An earlier same-day `npm ci` attempt failed with `EPERM` unlinking `node_modules/@rolldown/binding-win32-x64-msvc/rolldown-binding.win32-x64-msvc.node`; the user’s later `npm.cmd ci` completed successfully. Do not manually delete the native binary or change the machine execution policy.
- No demo server was listening on ports 4000 or 5173 at the earlier process check. A fresh app/browser demonstration was not run after dependency repair; prior `/api/health` and `/` smoke checks are historical and do not verify current instructor/student UI workflows.

## Earlier failed checkout attempt — 13 October 2026

- Exact committed source at `fd54d97`, extracted to an isolated temporary directory: `npm ci` passed (184 packages), `npm test` passed 12/12 (9 workflow integration and 3 scoring tests), and `npm run build` passed (server syntax checks and Vite production build).
- Current repository checkout: `npm test` failed at workflow-test module loading because `mongoose/index.js` is missing from the incomplete ignored `node_modules` tree; the three scoring tests passed. `npm run build` passed API syntax checks but failed because the Vite executable is absent.
- An earlier `npm install --ignore-scripts --no-audit --no-fund --no-save` attempt failed with Windows `EPERM` writing to the user npm cache and `ENOENT`/`ENOTEMPTY` errors while handling packages. No tracked package manifest or lockfile was changed. The later user-run `npm.cmd ci` and successful current-checkout tests/build are recorded above.
- The successful isolated archive run verifies the committed source with clean locked dependencies; it does not turn the current checkout failure into a pass.

## Details of earlier clean-source verification (historical)

Date: 13 October 2026. Environment: Node.js v22.21.0, npm 10.9.4, Windows; integration tests used `mongodb-memory-server-core` with an ephemeral local MongoDB process. All account names, email addresses, passwords and exam data used in tests are synthetic. No external exam data was used.

Command: `npm test`

Result: **12 passed, 0 failed, 0 skipped** (9 API integration cases and 3 scoring unit cases). The first run was blocked by the default MongoDB binary cache path and then exposed one test-fixture omission (CSRF header). The cache was redirected into the ignored local `.cache` directory, the test fixture was corrected, and the final run passed. The first binary download was local test setup, not an application test result. The focus-loss integration case now also verifies that the timestamp persisted.

Startup smoke check: `npm run demo` launched the API and Vite UI; `GET /api/health` returned `{"status":"ok"}` and `GET /` returned HTTP 200. The temporary service was stopped and its generated dummy credentials were not retained. The workflow file was parsed with a YAML parser. An earlier `npm ci --offline` completed from cache; the final repeat after build failed with Windows `EPERM` while unlinking the Vite/Rolldown native module, likely because the file was held by another process. The package lock was not modified by that attempt. A clean-install retry remains.

| Test ID | Requirement trace | Objective and data | Preconditions / steps | Expected result | Actual result |
|---|---|---|---|---|---|
| TC-LOCAL-001 | FR-OE-003 | Reject an anonymous request and bad dummy credentials. | Ephemeral DB; no cookie; synthetic invalid password. GET exam list, then POST invalid login. | 401 responses; no protected data. | Passed: both 401. |
| TC-LOCAL-002 | SEC-OE-003 | Check consecutive invalid-login lockout. | Synthetic verified student exists. Submit five incorrect passwords. | Account is temporarily locked and login remains generic. | Passed: `lockedUntil` set after five failures; exact 15-minute duration not asserted. |
| TC-LOCAL-003 | SEC-OE-004, SEC-OE-008 | Check role and CSRF barriers. | Instructor and student test sessions. Student tries instructor question creation; instructor write omits CSRF token. | Requests are denied. | Passed: 403 responses. |
| TC-LOCAL-004 | FR-OE-007, FR-OE-008, SEC-OE-008 | Reject invalid question structure and unknown question references. | Authenticated instructor and CSRF token. Submit duplicate option IDs and nonexistent question ID. | Validation errors; no invalid exam is created. | Passed: 400 responses. |
| TC-LOCAL-005 | FR-OE-013, FR-OE-014 | Limit exam visibility/start to assigned students. | Published exam assigned to one synthetic student. List/start as assigned and unassigned students. | Assigned user sees and starts; other user cannot see or start. | Passed: one exam for assigned account, zero for other; start denied for other. |
| TC-LOCAL-006 | FR-OE-015, SEC-OE-007 | Ensure question payload does not include the correct answer. | Assigned student's active attempt. Inspect question payload. | Correct option ID is not present. | Passed: answer key absent from response. |
| TC-LOCAL-007 | FR-OE-017, FR-OE-022 | Save answer and calculate a passing result server-side. | Active synthetic attempt with one two-mark MCQ. Save the correct choice and submit. | Server returns score 2/2 and pass; invalid option is rejected. | Passed: 2/2, passed; invalid option 400. |
| TC-LOCAL-008 | FR-OE-014, FR-OE-023, SEC-OE-009 | Prevent a repeated attempt and cross-student result access. | Previously submitted attempt. Try to start again and retrieve as another student. | Reattempt denied; other student cannot read result. | Passed: 409 on repeated start, 404 on other user's result lookup. |
| TC-LOCAL-009 | FR-OE-021 | Record a synthetic focus-loss event. | Authenticated active attempt and valid CSRF token. POST focus-loss and read the persisted attempt. | Event accepted and timestamp persisted to attempt. | Passed: 204 response; test confirms one timestamp persisted. Instructor visibility is not tested. |
| TC-LOCAL-010 | FR-OE-020 | Auto-submit an expired attempt from server-saved answers. | Second synthetic attempt; set server-side `endsAt` in the past; run expiry worker. | Attempt submitted with zero score and one unanswered item. | Passed: persisted status `SUBMITTED`, score 0, unanswered 1. |
| TC-LOCAL-011 | FR-OE-022 | Verify correct answers receive configured marks and threshold pass. | Pure scoring unit test with two synthetic questions. | Score 5/5, two correct, pass. | Passed. |
| TC-LOCAL-012 | FR-OE-022 | Verify negative scoring floors at zero and unanswered items do not earn marks. | Pure scoring unit tests with synthetic answer selections. | Wrong score does not become negative; unanswered count is correct. | Passed: floor 0 and unanswered count 2. |

These are added implementation tests, not retroactive actual-results fields in the approved STP. The original STP still has its own ten planned test cases; do not mark its cases as passed based only on this local mapping. Requirements beyond the tested slice remain unverified. The login rate limiter is configured for 10 requests per IP per minute to match SEC-OE-010, but a 429/window behavior test has not yet been added.
