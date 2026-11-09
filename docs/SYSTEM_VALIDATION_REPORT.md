# System Validation Report

- **Project:** Online Exam Portal — Software Engineering Mini-Project
- **Owner:** Chhavi Siddarth Wadhwa (`chhavi2308-s`)
- **Historical validation period:** 2–6 November 2026
- **Follow-up execution:** 9 November 2026
- **Repository:** `SE-Team-06/online-exam-portal-se-miniproject`
- **Original manual-validation source:** `main` at `95dbeb5d2fc7e56f93f9d156c7880849aa9b6121` (historical attempt; not repeated on that commit)
- **Latest main baseline reviewed for this follow-up:** `8727d94aa7ac88bcd723de98b77283a7ffe21143`
- **Report change branch:** `docs/p1-system-validation-2026-11-09`

## Objective and scope

This report records end-user validation of registration and login, role-based access, instructor exam preparation, student exam participation, result viewing, logout, and desktop/mobile presentation. The local application walkthrough was attempted using the disposable demo described in the README. Results below distinguish direct UI execution from automated test evidence already recorded for the same application code.

No production or real student data was used. The demo's generated credentials were not retained in this report or in screenshots.

## Environment and setup

| Item | Observed value |
|---|---|
| OS / shell | Windows, PowerShell |
| Node.js | v26.13.0 (meets the README minimum of 22.12) |
| npm | 11.20.0 |
| Browser / app URL | The local UI could not be reached during this run; no user workflow was completed in a browser |
| Demo data | Intended to use the temporary seeded instructor, student, question, and exam in `npm run demo` |
| Source freshness | Fetched `origin/main` at the SHA above. No changes to `server`, `client`, or root dependency manifests/lockfile exist between the PR #65 code baseline (`5cbd275`) and this `main`; PRs #66 and #68 add documentation. |

The setup commands were based on the root README (`npm.cmd run demo`). The first attempt used the existing `.cache/mongodb-binaries` and failed MongoDB Memory Server's MD5 check: downloaded binary MD5 `d16c23a3590abc8cb66e33e39692e75b` differed from the published checkfile value `b794b99d839b73b3862972d2e170018f`. No integrity check was bypassed and the original cache was left intact.

A second attempt used a separate ignored directory, `.cache/system-validation-mongodb`. MongoDB 8.2.6 downloaded (781.1 MB) and proceeded past the checksum stage, but `mongod` exited during startup with `StdoutInstanceError: Mongod internal error (fassert() failure)`. The API therefore did not become available. A Vite-only browser attempt also timed out connecting to the local server. The demo never reached account seeding or login.

## Scenario results

The table below preserves the original 2–6 November scenario results. The separate 9 November follow-up table records what was newly verified and what remained blocked; no historical browser result is represented as rerun.

| ID | Scenario | Expected result | Actual result and evidence | Status |
|---|---|---|---|---|
| SV-01 | Open registration page and inspect client-side fields (STP v1.2: TC-OE-001) | Registration form is available and validates required fields | Not reached: the local demo/API could not start. Registration code and test coverage are present in `client/src/AuthPanel.jsx` and `server/test/auth-lifecycle.test.js`; this is implementation/test evidence, not an end-user run. | BLOCKED |
| SV-02 | Register a synthetic student and verify mail/account activation (STP v1.2: TC-OE-001) | A unique account is created, verification mail is sent, and the link activates the account | Not run. Demo startup failed before the UI was available; no controlled SMTP transport or staging mailbox was configured. Automated lifecycle tests are recorded as passing in the Part 3 test report. | BLOCKED |
| SV-03 | Log in as instructor and inspect role workspace (STP v1.2: TC-OE-001, TC-OE-003) | Valid seeded instructor reaches instructor workspace | Not reached because the demo database did not start. Existing automated authentication and route/RBAC evidence is in `server/test/security.test.js`; no current browser login is claimed. | BLOCKED |
| SV-04 | Create a question; configure, publish, and assign an exam (STP v1.2: TC-OE-004, TC-OE-005) | Instructor can author a question, publish an exam, and assign it to the student | Not run: no application session was available. Relevant API and workflow tests are in `server/test/workflow.test.js`; these do not substitute for this UI walkthrough. | BLOCKED |
| SV-05 | Log in as student, view assigned exam, start it, answer, and submit (STP v1.2: TC-OE-005, TC-OE-006, TC-OE-007, TC-OE-008) | Student sees only assigned work; timer, answer saving, confirmation, and submission operate | Not run: no application session was available. Relevant automated cases are included in `server/test/workflow.test.js` and `client/test/*.test.js`. | BLOCKED |
| SV-06 | View submitted result as student and instructor (STP v1.2: TC-OE-008, TC-OE-009) | Student sees their result; instructor sees the submitted attempt/statistics | Not run in the browser. Automated result ownership and workflow checks are recorded in the full server suite. | BLOCKED |
| SV-07 | Log out and request protected data without a session (STP v1.2: TC-OE-001, TC-OE-003) | Logout ends the session; unauthenticated protected requests are denied | Not manually run. Authentication, session, and authorization cases are covered by `server/test/security.test.js`; the full suite passed in the recorded CI evidence below. | IMPLEMENTED; UI CHECK BLOCKED |
| SV-08 | Check narrow/mobile and desktop layouts (STP v1.2: TC-OE-005, TC-OE-006) | Core pages render at desktop and 360 px without horizontal overflow | On 4 November, the recorded browser smoke passed login-page accessibility and responsive checks at 1280 px and 360 px, then timed out waiting for the instructor dashboard. No current screenshots were produced; dashboard/exam responsive checks remain unverified. See `docs/PART3_TEST_REPORTS_2026-11-04.md`. | PARTIAL |
| SV-09 | Confirm SMTP delivery and account links (STP v1.2: TC-OE-001, TC-OE-002) | Verification/reset messages arrive and links work in a staging environment | No staging service or disposable mailbox was configured. Mocked/automated mail tests do not establish real delivery. | BLOCKED / NOT VERIFIED |


## Automated evidence reviewed

The Part 3 test report records a full run against the same server/client code now on `main` (the later PRs did not change those code paths):

- Server tests: **172 passed, 0 failed, 0 skipped**.
- Client tests: **17 passed, 0 failed, 0 skipped**.
- Production build and server syntax checks: **passed**.
- Latest verified GitHub Actions run [#108](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/42392165413): completed successfully on the current `main` SHA `8727d94aa7ac88bcd723de98b77283a7ffe21143`. Its `checks` job passed locked dependency installation, automated tests, API syntax checks, and the frontend production build. This CI result is separate from the 9 November local test run below.
- Automated coverage includes account lifecycle, authentication/RBAC, question/exam workflows, deadline submission, result access, and client form/timer behavior. Exact test-file mapping is in `docs/PART3_TEST_REPORTS_2026-11-04.md`.

These results establish automated test evidence only. They do not establish that a human completed the instructor or student UI flows or that staging SMTP delivered mail. The successful CI dependency installation also does not resolve the Windows-local `npm ci` workspace symlink error recorded in the 9 November follow-up.

## Follow-up execution — 9 November 2026

This follow-up used a clean clone of the then-current `main` at `8727d94aa7ac88bcd723de98b77283a7ffe21143`, on Node.js v26.13.0 and npm 11.20.0. It does not change or backdate the 2–6 November manual-validation record above.

| Check | Observed result | Status |
|---|---|---|
| Clean lockfile install (`npm.cmd ci`) | Failed on Windows with `EPERM` while npm attempted to create the `server` workspace symlink under root `node_modules`. No lockfile, manifest, or security setting was changed. Dependencies were then installed separately in each workspace without writing lockfiles so checks could continue. | BLOCKED (standard clean install) |
| Complete automated tests (`npm.cmd test`) | Server suite: 172/172 passed; client suite: 17/17 passed. The root script ran the server and client suites sequentially as separate executions. The exact commands, install workaround, and results are recorded in [`evidence/system-validation-2026-11-09.md`](evidence/system-validation-2026-11-09.md). | PASS (local automated tests) |
| Server syntax and production frontend build (`npm.cmd run build`) | Server `node --check` checks passed; Vite production build passed. | PASS |
| MongoDB/API/frontend startup | A fresh same-shell probe with process-local `TEMP`/`TMP` set to a normal workspace path reported Vite ready. The API then exited with `MongooseServerSelectionError: connect EACCES 127.0.0.1:63110` while connecting to the temporary MongoDB port (npm lifecycle exit code 1); the demo launcher terminated Vite. No TCP listeners remained. Same-shell requests to frontend/API via `127.0.0.1`, `localhost`, and `[::1]` failed with curl exit 7 (connection refused). Before the probe, there were no listeners on 4000, 5173, or 27017. | BLOCKED by execution environment |
| End-user browser scenarios and screenshots | No registration, login, instructor, student, result, logout, desktop/mobile, or protected-route workflow was completed in the browser. The in-app browser separately returned `ERR_CONNECTION_TIMED_OUT`; launching an interactive terminal through the computer-use host was blocked/timed out. No successful-workflow screenshots were captured. | BLOCKED / NOT VERIFIED |
| SMTP delivery | No staging SMTP configuration or disposable mailbox was available. | BLOCKED / NOT VERIFIED |
| Performance, load, availability, and deployment targets (STP v1.2: TC-OE-010) | No controlled load/availability or deployed-environment measurements were run as part of this system-validation follow-up. | NOT VERIFIED |

The automated tests and build ran against the latest-main clone after the workspace-local install workaround; they were not reruns of the earlier 2–6 November browser checks. The test suites do not substitute for end-user system validation. The same-shell `EACCES` and refused connections are consistent with loopback socket restrictions in the Codex execution sandbox. The Windows firewall state could not be read from this environment, so a host firewall restriction cannot be independently ruled out. No firewall or security settings were changed, and no application code was changed to mask the environment failure.

## Manual completion procedure

Run the following in a normal interactive Windows PowerShell session on the laptop (outside the Codex execution sandbox), from this PR branch checkout. If the demo starts and reports Vite ready, leave this terminal open and use Chrome on the same Windows host at `http://127.0.0.1:5173/`:

```powershell
Set-Location "C:\Users\Chhavi\Documents\Codex\2026-10-22\https-github-com-se-team-06\oep-system-validation-p1"
git status --short --branch
$env:TEMP = Join-Path $PWD ".cache\p1-mongo-process-tmp"
$env:TMP = $env:TEMP
$env:MONGOMS_DOWNLOAD_DIR = Join-Path $PWD ".cache\p1-mongodb-binaries"
New-Item -ItemType Directory -Force -Path $env:TEMP, $env:MONGOMS_DOWNLOAD_DIR | Out-Null
$listeners = Get-NetTCPConnection -State Listen -LocalPort 4000,5173 -ErrorAction SilentlyContinue
if ($listeners) { $listeners | Select-Object LocalAddress,LocalPort,OwningProcess }
npm.cmd run demo
```

The demo prints a newly generated password for both synthetic seeded accounts. Use it only on the local laptop; do not include it in screenshots or shared logs. Open Chrome at `http://127.0.0.1:5173/` (the API and Vite default to IPv4 loopback). Keep the terminal open while testing; press Ctrl+C afterward to discard the temporary database. Do not disable Windows Firewall. If the API still reports `EACCES`, capture the redacted error and stop; do not change firewall policy or bypass MongoDB integrity checks.

After the demo is reachable, record each scenario separately with date/time, browser viewport, observed result, STP case, and a genuine screenshot with no password/token visible:

1. **TC-OE-001:** inspect registration required-field validation and sign in with each seeded role; test an invalid password; sign out and verify a protected API route rejects the unauthenticated session. Successful email verification requires staging SMTP and remains NOT VERIFIED without it.
2. **TC-OE-003:** confirm Student cannot access instructor-only operations; sign back in as Instructor and confirm instructor workspace access. The demo does not seed an Administrator.
3. **TC-OE-004/005:** create a multiple-choice question, configure an exam with future close time and selected question, assign the seeded verified student, and publish it.
4. **TC-OE-005/006/007/008:** sign in as Student, confirm the assignment appears, start it, select an answer (the UI saves answers as selected), verify the timer, and submit through the confirmation dialog.
5. **TC-OE-008/009:** verify the student result, sign out, sign in as Instructor, and verify the submitted attempt/statistics.
6. **TC-OE-005/006:** inspect the same reachable login and exam pages at desktop width and approximately 360 px; note overflow, clipped controls, and browser console/network errors.

Mark only observed interactions PASS. Leave scenarios BLOCKED or NOT VERIFIED if the UI, SMTP, or required environment was unavailable. Store screenshots under `docs/evidence/system-validation-2026-11-09/` or the applicable new-date folder; do not use screenshots from the earlier report as evidence of a new run.

## Screenshots and evidence

No screenshots of a working end-user workflow were captured for this report. Although Vite printed a ready message, the fresh same-shell probe found no listener; the API failed its MongoDB loopback connection with `EACCES`, and HTTP requests were refused. The local browser could not reach the isolated execution environment. Do not present login mockups, source code, or startup messages as a successful product demonstration. The earlier login-only smoke result and its limitations are documented in `docs/PART3_TEST_REPORTS_2026-11-04.md`; broader historical browser/accessibility evidence is in `docs/ACCESSIBILITY_BROWSER_REPORT.md` and is dated 26 October, outside this report's validation period.

## Defects, limitations, and follow-up

The historical blocker was MongoDB Memory Server startup on this Windows host: the pre-existing archive failed MD5 verification, while a separate freshly downloaded archive reached `mongod` startup but failed with an internal `fassert()` error. On 9 November, moving temporary files away from the sandbox `#!sandbox` path let Vite report ready, but MongoDB-to-API loopback returned `EACCES`; the API exited and no frontend listener remained. IPv4, `localhost`, and IPv6 requests from the same shell were refused, and the separate in-app browser timed out. These observations point to execution-environment loopback restrictions; host firewall state was not readable here. Actual Windows-host browser acceptance remains unverified.

To complete the blocked UI evidence, run the demo on a machine/environment where the official MongoDB 8.2.6 binary starts successfully (or use an approved persistent MongoDB instance with disposable data), then record actual results and screenshots for each blocked scenario. Use only a synthetic student and instructor. Keep SMTP delivery marked unverified until a staging service and disposable mailbox are tested.

## Conclusion

**PARTIAL.** On 9 November, all 172 server tests and 17 client tests passed, and server syntax checks plus the production build passed. In the bounded same-shell demo probe, MongoDB-to-API loopback failed with `EACCES`, no HTTP listeners remained, and the isolated browser could not reach the app; zero browser workflows and zero successful-workflow screenshots were recorded. The standard `npm ci` workspace-symlink failure, host-side browser reachability, staging SMTP, and manual acceptance remain unresolved. Follow the PowerShell procedure above on the laptop's normal interactive desktop and append evidence only after observing actual results. Historical 2–6 November results remain unchanged and are not represented as rerun on the latest baseline.
