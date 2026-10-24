# Local test execution record

## Current verification — 24 October 2026

- Fetched refs show PR #28 merged to `main` at `88c21bcf2d887fcc9f5381e509523592167142bb`, PR #30 at `17cdedda37b70f6f3b93f4b3c9a5b868505b2f8d`, and PR #31 at `62b817f0151ab68e63a66055ae3ccdfcc2a0d6a9`.
- On local branch `feature/issue-4-question-management` based on PR #31's merge commit, the instructor question bank has edit/delete UI and owner-scoped API routes. Edits require a valid MCQ; questions referenced by an exam cannot be changed or deleted. Malformed JSON receives a safe 400 response.
- `npm.cmd test`: **28 passed, 0 failed, 0 skipped** (17 API workflow tests, 3 scoring tests, and 8 client tests). Note: the final run took about 250 seconds because the login lockout test performs repeated password hashing.
- `npm.cmd --workspace server run check`: passed. The Vite production build with `--configLoader native` passed; Vite transformed 16 modules and produced JS 234.59 kB (72.90 kB gzip) and CSS 6.65 kB (2.05 kB gzip).
- `git diff --check`: passed. No authenticated browser walkthrough or fresh Actions run was verified. The question-management follow-up is not yet merged.

## Earlier local verification — 24 October 2026 (before PR #28 merge was verified)

- `feature/chhavi-sprint1-issues` was pushed and later merged as PR #28; see the current verification above. The original statements that the branch was pending/unpushed are superseded by the fetched merge commit evidence.
- At that earlier point, `npm.cmd test` passed 15 tests and `npm.cmd run build` passed. Those results are historical and are superseded by the current 22-test run above.

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
