# System Validation Report

- **Project:** Online Exam Portal — Software Engineering Mini-Project
- **Owner:** Chhavi Siddarth Wadhwa (`chhavi2308-s`)
- **Historical validation period:** 2–6 November 2026
- **Codex-sandbox diagnostics:** 9 November 2026
- **User-run manual browser validation:** 9–10 November 2026
- **Repository:** `SE-Team-06/online-exam-portal-se-miniproject`
- **Original manual-validation source:** `main` at `95dbeb5d2fc7e56f93f9d156c7880849aa9b6121` (historical attempt; not repeated on that commit)
- **Latest main baseline reviewed for this follow-up:** `8727d94aa7ac88bcd723de98b77283a7ffe21143`
- **Report change branch:** `docs/p1-system-validation-2026-11-09`

## Objective and scope

This report preserves the 2–6 November historical attempt, the 9 November Codex-sandbox diagnostics, and the user's later manual Chrome validation on 9–10 November. The manual evidence was supplied as 13 original screenshots plus a validation summary and manifest. It is distinct from the automated tests and from the inaccessible sandbox attempt.

No production or real student data was used. The demo's generated credentials were not retained in this report or in screenshots.

## Environment and setup

| Item | Observed value |
|---|---|
| OS / shell | Windows, PowerShell |
| Node.js | v26.13.0 (meets the README minimum of 22.12) |
| npm | 11.20.0 |
| Browser / app URL | User-supplied manual evidence from Windows Chrome at `127.0.0.1:5173`; screenshots dated 9–10 November, including Chrome device emulation at 360×578 |
| Demo data | Screenshots show synthetic `example.test` instructor/student accounts and temporary demo exams; screenshots from 9 and 10 November are separate observed states, not proof of one continuous in-memory database session |
| Source freshness | Fetched `origin/main` at the SHA above. No changes to `server`, `client`, or root dependency manifests/lockfile exist between the PR #65 code baseline (`5cbd275`) and this `main`; PRs #66 and #68 add documentation. |

The setup commands were based on the root README (`npm.cmd run demo`). The first attempt used the existing `.cache/mongodb-binaries` and failed MongoDB Memory Server's MD5 check: downloaded binary MD5 `d16c23a3590abc8cb66e33e39692e75b` differed from the published checkfile value `b794b99d839b73b3862972d2e170018f`. No integrity check was bypassed and the original cache was left intact.

A second attempt used a separate ignored directory, `.cache/system-validation-mongodb`. MongoDB 8.2.6 downloaded (781.1 MB) and proceeded past the checksum stage, but `mongod` exited during startup with `StdoutInstanceError: Mongod internal error (fassert() failure)`. The API therefore did not become available. A Vite-only browser attempt also timed out connecting to the local server. The demo never reached account seeding or login.

## Scenario results

The table below preserves the original 2–6 November scenario results. The 9 November follow-up records sandbox-only diagnostics. The user-run 9–10 November outcomes are in the separate manual-validation table below; historical results are not represented as rerun.

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

## Manual browser validation — 9–10 November 2026

These outcomes are based on the user's supplied summary, manifest, and 13 screenshots from normal Windows Chrome. The originals are stored without image edits in the dated evidence folders; see the [manual evidence manifest](evidence/system-validation-p1-manual-manifest.csv). “PASS” is limited to the behavior shown or explicitly reported and does not mean the complete SRS or full STP passed.

| Scenario | Expected result | Actual result and evidence | STP v1.2 | Status |
|---|---|---|---|---|
| Registration required-field validation | Empty required fields prevent submission and identify a required value | At 360×578, Chrome displayed “Please fill out this field” on the blank registration form. [Screenshot 13](evidence/system-validation-2026-11-10/screenshots/13-mobile-registration-required-field.png). | TC-OE-001 | PASS for browser-side required-field validation only |
| New account registration, email verification, and activation | A synthetic account registers, receives a real verification email, and activates | Only the required-field browser prompt was tested. No completed registration/verification or staging mail delivery is evidenced. | TC-OE-001 | NOT VERIFIED; SMTP BLOCKED |
| Invalid login response | Invalid credentials are rejected without disclosing account state | The login page showed a generic error for `instructor@example.test`; the screenshot does not establish why that attempt failed. [Screenshot 01](evidence/system-validation-2026-11-09/screenshots/01-login-failed-attempt.png). | TC-OE-001 | PARTIAL; rejection message observed, credential cause unverified |
| Instructor authentication/workspace | Seeded Instructor signs in and sees Instructor workspace | Instructor role and dashboard are visible. [Screenshot 02](evidence/system-validation-2026-11-09/screenshots/02-instructor-dashboard.png). | TC-OE-001, TC-OE-003 | PASS for successful sign-in/workspace |
| Student authentication/workspace | Seeded Student signs in and sees Student workspace | Student role, notifications, previous-results section, and assignments are visible. [Screenshot 04](evidence/system-validation-2026-11-09/screenshots/04-student-dashboard-assigned-exams.png). | TC-OE-001, TC-OE-003 | PASS for successful sign-in/workspace |
| Question, exam, publication, and assignment | Instructor can prepare a question/exam, publish it, and assign the student | Screenshot 03 shows the question bank and exam form. Screenshot 07 shows a published `Question test` exam; screenshot 04 shows it assigned to the Student. The user reports creating/publishing it, but the exact save/assignment actions are not captured. [03](evidence/system-validation-2026-11-09/screenshots/03-instructor-question-bank-and-exam-form.png), [07](evidence/system-validation-2026-11-09/screenshots/07-instructor-attempt-statistics.png), [04](evidence/system-validation-2026-11-09/screenshots/04-student-dashboard-assigned-exams.png). | TC-OE-004, TC-OE-005 | PASS for visible published/assigned end state; action sequence not independently captured |
| Student assignment visibility | Assigned exam is visible to the assigned Student | Desktop screenshot 04 shows two assignments; mobile screenshot 10 shows `Demo: HTTP Basics` and a Start exam button. [04](evidence/system-validation-2026-11-09/screenshots/04-student-dashboard-assigned-exams.png), [10](evidence/system-validation-2026-11-10/screenshots/10-mobile-student-assigned-exam-360px.png). | TC-OE-005 | PASS for visible assignment |
| Start exam and timer display | Student starts an assigned exam and sees remaining time | The active `Demo: HTTP Basics` attempt and 04:50 countdown are visible in screenshot 05. No before/after timing evidence verifies countdown continuity. [05](evidence/system-validation-2026-11-09/screenshots/05-student-active-exam-timer.png). | TC-OE-006 | PASS for start/timer display; timer continuity NOT VERIFIED |
| Answer save/restoration | Selected answer remains available after refresh/recovery | Screenshot 11 shows option `200` selected; the user reports this selection remained after refresh. [11](evidence/system-validation-2026-11-10/screenshots/11-mobile-restored-answer-360px.png). | TC-OE-007 | PASS based on screenshot plus user-reported refresh observation |
| Submit confirmation and scoring | Student confirms submission and receives a calculated result | The user reports seeing the confirmation dialog; no dialog screenshot was supplied. Separate screenshots show a 0/1 failed result on 9 Nov and a 1/1 passed result on 10 Nov. These are distinct evidence sessions, not one continuous attempt. [06](evidence/system-validation-2026-11-09/screenshots/06-student-submitted-fail-result.png), [12](evidence/system-validation-2026-11-10/screenshots/12-mobile-submitted-pass-result-360px.png). | TC-OE-008, TC-OE-009 | PASS for submitted result/scoring; confirmation dialog user-reported only |
| Instructor result visibility | Instructor can see submitted attempt/results | Instructor statistics show the Student's 0/1 attempt, “Not passed,” and two tab switches. [Screenshot 07](evidence/system-validation-2026-11-09/screenshots/07-instructor-attempt-statistics.png). | TC-OE-009 | PASS for displayed attempt/statistics |
| Student role restriction | Student cannot call instructor-only question endpoint | Supplied handoff reports the browser console returned HTTP 403 for `GET /api/questions` as Student. No screenshot of that console output is in the ZIP. | TC-OE-003 | PASS per user-supplied console text; screenshot unavailable |
| Logout/session restriction | Logout ends session; protected identity endpoint rejects the unauthenticated request | Supplied handoff reports HTTP 401 from `GET /api/auth/me` and `{authenticated:false,role:null}` after sign-out. No screenshot of that command/output is in the ZIP. Screenshot 08 also shows unauthenticated `/api/auth/me` 401 console entries on the login page. [Screenshot 08](evidence/system-validation-2026-11-10/screenshots/08-mobile-login-360px.png). | TC-OE-001, TC-OE-003 | PASS per user-supplied console text; direct command screenshot unavailable |
| Desktop presentation | Desktop pages display usable content without obvious clipping | Screenshots 02–07 show the instructor, student, exam, result, and setup views at desktop size. This is visual evidence of the shown portions, not a complete full-page or cross-browser audit. | TC-OE-005, TC-OE-006 | PARTIAL |
| Mobile presentation at 360 px | Core pages fit and controls are usable at narrow width | Chrome device emulation is set to 360×578. Screenshots 08–13 show login, dashboard, assignment, active answer, result, and registration-required prompt; no obvious horizontal overflow is visible in the captured portions. Full-page overflow, all routes, keyboard and assistive technology were not exhaustively checked. | TC-OE-005, TC-OE-006 | PASS for visible sections only; full accessibility/responsiveness PARTIAL |
| Password reset, real SMTP, performance/load/availability | Reset and delivery links work; measured targets are met | No password-reset workflow, staging mailbox/delivery, load/availability measurement, or deployed-environment check is evidenced. | TC-OE-002, TC-OE-010 | NOT VERIFIED; SMTP BLOCKED |

## Screenshots and evidence

The user supplied 13 genuine screenshots from later manual runs. They show the visible outcomes linked in the manual-validation table above. The 9 November sandbox probe itself still produced no reachable browser session; the later normal-Windows Chrome evidence is a separate run and does not retroactively change that result. The earlier login-only smoke result and its limitations are documented in `docs/PART3_TEST_REPORTS_2026-11-04.md`; broader historical browser/accessibility evidence is in `docs/ACCESSIBILITY_BROWSER_REPORT.md` and is dated 26 October, outside this report's validation period.

## Defects, limitations, and follow-up

The historical blocker was MongoDB Memory Server startup on this Windows host: the pre-existing archive failed MD5 verification, while a separate freshly downloaded archive reached `mongod` startup but failed with an internal `fassert()` error. On 9 November, the Codex sandbox's MongoDB-to-API loopback returned `EACCES`; the API exited and no frontend listener remained. The user later supplied genuine manual Chrome evidence from a normal Windows session dated 9–10 November, so the browser workflows listed as observed are no longer blocked. Remaining gaps are successful registration/verification and reset mail, the exact submission dialog capture, timer continuity, screenshot-backed 403/401 checks, and exhaustive responsive/accessibility/performance checks.

To complete the blocked UI evidence, run the demo on a machine/environment where the official MongoDB 8.2.6 binary starts successfully (or use an approved persistent MongoDB instance with disposable data), then record actual results and screenshots for each blocked scenario. Use only a synthetic student and instructor. Keep SMTP delivery marked unverified until a staging service and disposable mailbox are tested.

## Conclusion

**PARTIAL.** The historical 2–6 November attempt and the 9 November Codex-sandbox reachability failure remain documented unchanged. The user-supplied 9–10 November manual evidence now verifies login/workspaces, visible exam publication/assignment, exam start/timer display, reported answer restoration, submission/results, instructor result visibility, registration required-field validation, logout/RBAC console responses, and visible desktop/mobile sections, with the limitations in the table above. Full account registration/verification, real SMTP, password reset, timer continuity, exact submit-dialog evidence, screenshot-backed 403/401 checks, complete accessibility/responsive evaluation, and TC-OE-010 remain unverified. Full Part 1/SRS acceptance is not established.
