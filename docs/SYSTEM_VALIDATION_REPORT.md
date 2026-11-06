# System Validation Report

- **Project:** Online Exam Portal — Software Engineering Mini-Project
- **Owner:** Chhavi Siddarth Wadhwa (`chhavi2308-s`)
- **Validation period:** 2–6 November 2026
- **Repository:** `SE-Team-06/online-exam-portal-se-miniproject`
- **Source reviewed:** `main` at `95dbeb5d2fc7e56f93f9d156c7880849aa9b6121`
- **Report branch:** `docs/chhavi-system-validation`

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

| ID | Scenario | Expected result | Actual result and evidence | Status |
|---|---|---|---|---|
| SV-01 | Open registration page and inspect client-side fields | Registration form is available and validates required fields | Not reached: the local demo/API could not start. Registration code and test coverage are present in `client/src/AuthPanel.jsx` and `server/test/auth-lifecycle.test.js`; this is implementation/test evidence, not an end-user run. | BLOCKED |
| SV-02 | Register a synthetic student and verify mail/account activation | A unique account is created, verification mail is sent, and the link activates the account | Not run. Demo startup failed before the UI was available; no controlled SMTP transport or staging mailbox was configured. Automated lifecycle tests are recorded as passing in the Part 3 test report. | BLOCKED |
| SV-03 | Log in as instructor and inspect role workspace | Valid seeded instructor reaches instructor workspace | Not reached because the demo database did not start. Existing automated authentication and route/RBAC evidence is in `server/test/security.test.js`; no current browser login is claimed. | BLOCKED |
| SV-04 | Create a question; configure, publish, and assign an exam | Instructor can author a question, publish an exam, and assign it to the student | Not run: no application session was available. Relevant API and workflow tests are in `server/test/workflow.test.js`; these do not substitute for this UI walkthrough. | BLOCKED |
| SV-05 | Log in as student, view assigned exam, start it, answer, and submit | Student sees only assigned work; timer, answer saving, confirmation, and submission operate | Not run: no application session was available. Relevant automated cases are included in `server/test/workflow.test.js` and `client/test/*.test.js`. | BLOCKED |
| SV-06 | View submitted result as student and instructor | Student sees their result; instructor sees the submitted attempt/statistics | Not run in the browser. Automated result ownership and workflow checks are recorded in the full server suite. | BLOCKED |
| SV-07 | Log out and request protected data without a session | Logout ends the session; unauthenticated protected requests are denied | Not manually run. Authentication, session, and authorization cases are covered by `server/test/security.test.js`; the full suite passed in the recorded CI evidence below. | IMPLEMENTED; UI CHECK BLOCKED |
| SV-08 | Check narrow/mobile and desktop layouts | Core pages render at desktop and 360 px without horizontal overflow | On 4 November, the recorded browser smoke passed login-page accessibility and responsive checks at 1280 px and 360 px, then timed out waiting for the instructor dashboard. No current screenshots were produced; dashboard/exam responsive checks remain unverified. See `docs/PART3_TEST_REPORTS_2026-11-04.md`. | PARTIAL |
| SV-09 | Confirm SMTP delivery and account links | Verification/reset messages arrive and links work in a staging environment | No staging service or disposable mailbox was configured. Mocked/automated mail tests do not establish real delivery. | BLOCKED / NOT VERIFIED |

## Automated evidence reviewed

The Part 3 test report records a full run against the same server/client code now on `main` (the later PRs did not change those code paths):

- Server tests: **171 passed, 0 failed, 0 skipped**.
- Client tests: **17 passed, 0 failed, 0 skipped**.
- Production build and server syntax checks: **passed**.
- GitHub Actions run [#88](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/41464890786): recorded as successful for the matching source tree.
- Automated coverage includes account lifecycle, authentication/RBAC, question/exam workflows, deadline submission, result access, and client form/timer behavior. Exact test-file mapping is in `docs/PART3_TEST_REPORTS_2026-11-04.md`.

These results establish automated test evidence only. They do not establish that a human completed the instructor or student UI flows, that staging SMTP delivered mail, or that the current Windows demo can start.

## Screenshots and evidence

No screenshots of a working end-user workflow were captured for this report because the application did not start. Do not present login mockups, source code, or the failed startup as a successful product demonstration. The earlier login-only smoke result and its limitations are documented in `docs/PART3_TEST_REPORTS_2026-11-04.md`; broader historical browser/accessibility evidence is in `docs/ACCESSIBILITY_BROWSER_REPORT.md` and is dated 26 October, outside this report's validation period.

## Defects, limitations, and follow-up

The immediate blocker is local MongoDB Memory Server startup on this Windows host: the pre-existing archive fails MD5 verification, while a separate freshly downloaded archive reaches `mongod` startup but fails with an internal `fassert()` error. The failure occurs before the application API can initialize, so it is an environment/runtime blocker rather than evidence of a product workflow defect. The integrity verification was not disabled.

To complete the blocked UI evidence, run the demo on a machine/environment where the official MongoDB 8.2.6 binary starts successfully (or use an approved persistent MongoDB instance with disposable data), then record actual results and screenshots for each blocked scenario. Use only a synthetic student and instructor. Keep SMTP delivery marked unverified until a staging service and disposable mailbox are tested.

## Conclusion

**PARTIAL.** The repository contains automated test evidence for the core workflows, but this run could not complete the assigned end-user system walkthrough because the local MongoDB process failed before the application started. No UI workflow screenshots or successful manual login are claimed. Registration delivery, broader browser workflows, and real staging SMTP remain unverified.
