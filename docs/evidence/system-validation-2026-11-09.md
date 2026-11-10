# System validation execution evidence — 9 November 2026

Repository baseline: `8727d94aa7ac88bcd723de98b77283a7ffe21143` (`main`).

This record covers the 9 November sandbox checks and the user's separate manual browser validation dated 9–10 November 2026. It is separate from the historical validation attempt dated 2–6 November 2026. No application code, package manifest, lockfile, SMTP configuration, firewall rule, or security setting was changed.

## Environment

- Windows 10 Home Single Language, Version 25H2 (build 26200), PowerShell
- Node.js v26.13.0; npm 11.20.0
- MongoDB Memory Server binary: MongoDB 8.2.6; integrity verification remained enabled
- No staging SMTP variables or disposable mailbox were configured
- Browser automation target: local demo at `http://127.0.0.1:5173`

## Dependency installation

`npm.cmd ci` was attempted at the repository root and failed with Windows `EPERM` while creating the npm workspace symlink `server -> node_modules\\@online-exam-portal\\server`. The lockfile and package manifests were not changed. To continue independent checks, dependencies were installed within `server`, `client`, and the root development dependency set with `--no-save --package-lock=false --workspaces=false`, each using an isolated cache under the ignored `.cache` directory. Therefore the successful test/build results below are not evidence that the standard clean `npm ci` path succeeds on this host.

## Automated tests and build

Command: `npm.cmd test`

- Server: 172 tests, 172 passed, 0 failed, 0 cancelled, 0 skipped.
- Client: 17 tests, 17 passed, 0 failed, 0 cancelled, 0 skipped.
- The root script ran the server and client suites sequentially; they were separate test executions.

Command: `npm.cmd run build`

- Server syntax checks (`node --check` for `src/index.js`, `src/app.js`, and `src/ops/cli.js`): passed.
- Vite production build: passed (20 modules transformed).

The test output was captured in the ignored local file `.cache/p1-npm-test-final.log`; build output was captured in `.cache/p1-build.log`. The committed summary here excludes local caches and credentials.

The subsequent PR #72 CI run [#112](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/42765015665) passed on PR head `2dc9756e3fbf7faf9f98347fafc102a197f8fad8`. The post-merge `main` run [42765267696](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/42765267696) also passed on merge commit `886df98c607a92cbb74a0a107a400219a14bb3fa`, including locked dependency installation, automated tests, API syntax and frontend build. These runs predate the additional 10 November screenshots in this local follow-up.

## Demo and browser attempt

### Same-shell launch and socket diagnostics — Codex sandbox, 9 November

- Before launch, no listeners were found on TCP ports 4000, 5173, or 27017; no port conflict was observed.
- With process-local `TEMP`/`TMP` moved out of the Windows sandbox temp path, Vite logged `ready` on `127.0.0.1:5173`.
- In the same PowerShell execution session, the API failed while connecting Mongoose to the temporary MongoDB loopback port: `MongooseServerSelectionError: connect EACCES 127.0.0.1:63110`; the workspace demo lifecycle exited with code 1. The concurrent demo launcher then terminated Vite.
- The same-shell `netstat` probe found no TCP listeners for 4000, 5173, or 27017. Curl requests to `127.0.0.1`, `localhost`, and `[::1]` on the frontend/API ports all returned HTTP `000` and curl exit code 7 (connection refused).
- The in-app browser separately returned `ERR_CONNECTION_TIMED_OUT` for `127.0.0.1:5173`.
- A read of the host firewall profile returned no profile data; the available `netsh` command did not expose the `advfirewall` subcommand. Host firewall behavior therefore could not be verified. No firewall setting was changed.
- The computer-use host blocked launching Windows PowerShell, and Git CMD launch approval timed out. A normal persistent interactive desktop terminal/browser session was unavailable.

These results show that the Codex execution environment denies or cannot retain local loopback sockets. The prior log-only observation of “Demo API”/Vite startup was insufficient to establish reachability and is superseded by this bounded same-shell probe. No browser workflow was completed in the sandbox; this does not contradict the separate Windows-host screenshots below.

## User-run manual browser evidence — 9–10 November 2026

The first evidence ZIP passed CRC validation and contributed screenshots 01–13. The additional ZIP contained six PNGs, a manifest and a short handoff note; all six images opened, were visually inspected and were copied byte-for-byte into the 10 November folder. The consolidated repository-relative [evidence manifest](system-validation-p1-manual-manifest.csv) now indexes all 19 screenshots with expected and actual outcomes, status, STP case and limitations.

### 9 November desktop browser evidence

- Instructor login/workspace: [02](system-validation-2026-11-09/screenshots/02-instructor-dashboard.png) — Instructor role shown.
- Instructor question/exam UI: [03](system-validation-2026-11-09/screenshots/03-instructor-question-bank-and-exam-form.png) — question bank and exam/assignment controls; the actual save clicks are not shown.
- Student login and assignment visibility: [04](system-validation-2026-11-09/screenshots/04-student-dashboard-assigned-exams.png) — synthetic Student sees `Demo: HTTP Basics` and `Question test` assignments.
- Exam start and timer display: [05](system-validation-2026-11-09/screenshots/05-student-active-exam-timer.png) — 04:50 shown; no answer selected in this capture and no timer continuity proof.
- Submitted result: [06](system-validation-2026-11-09/screenshots/06-student-submitted-fail-result.png) — 0/1, Not passed.
- Instructor result visibility: [07](system-validation-2026-11-09/screenshots/07-instructor-attempt-statistics.png) — published `Question test`, one 0/1 attempt, and two tab switches shown.
- Failed-login message: [01](system-validation-2026-11-09/screenshots/01-login-failed-attempt.png) — generic message visible; underlying failure cause is unknown.

### 10 November mobile and validation evidence

- Login at 360×578: [08](system-validation-2026-11-10/screenshots/08-mobile-login-360px.png) — form visible; DevTools shows unauthenticated `/api/auth/me` 401 requests.
- Student dashboard at 360 px: [09](system-validation-2026-11-10/screenshots/09-mobile-student-dashboard-360px.png).
- Assigned exam at 360 px: [10](system-validation-2026-11-10/screenshots/10-mobile-student-assigned-exam-360px.png).
- Restored answer at 360 px: [11](system-validation-2026-11-10/screenshots/11-mobile-restored-answer-360px.png) — answer 200 is selected; user reports it remained selected after refresh.
- Passed result at 360 px: [12](system-validation-2026-11-10/screenshots/12-mobile-submitted-pass-result-360px.png) — 1/1 Passed.
- Registration required-field prompt at 360 px: [13](system-validation-2026-11-10/screenshots/13-mobile-registration-required-field.png).
- Submission confirmation: [14](system-validation-2026-11-10/screenshots/14-submit-confirmation.png) — the warning that answers cannot be changed, Go back and Submit exam choices, selected answer and timer are visible. This shows the dialog, not that the final Submit exam option was clicked.
- Student role restriction: [15](system-validation-2026-11-10/screenshots/15-student-role-restriction-403.png) — while signed in as Demo Student, `GET /api/questions` returned 403.
- Logout/session invalidation: [16](system-validation-2026-11-10/screenshots/16-logout-session-401.png) — sign-in page shown after sign-out and `/api/auth/me` returned 401.
- Invalid login: [17](system-validation-2026-11-10/screenshots/17-invalid-login-401.png) — synthetic Student login returned 401 and the generic authentication error; password is masked.
- Password-reset request: [18](system-validation-2026-11-10/screenshots/18-password-reset-request.png) — generic acknowledgement shown at 360 px. This does not prove mail delivery or successful reset.
- Registration submission error: [19](system-validation-2026-11-10/screenshots/19-registration-email-503.png) — synthetic registration POST returned 503 and the UI displayed its email-send error. No specific cause is established by this screenshot.

### User-reported console outcomes and limitations

- The user reports testing timer continuity through a refresh and checking additional active-exam controls and Instructor views at approximately 360 px without horizontal scrolling. These are user-reported observations; no paired timer captures or dedicated Instructor-mobile screenshot were included.
- The 9 November 0/1 and 10 November 1/1 results are different runs; the demo's in-memory data must not be presented as one continuous session.
- The screenshots show tested portions, not an exhaustive full-page overflow, keyboard, screen-reader, browser compatibility or performance audit.
- Successful registration/email verification, real SMTP delivery, completed password reset and TC-OE-010 performance/availability targets remain unverified. Keep SMTP BLOCKED. The observed registration 503 does not by itself identify whether SMTP credentials, service reachability, or another cause failed.

The screenshots contain synthetic `example.test` accounts; all visible password fields are masked. No token, cookie, real student record, or staging credential is included. The images include ordinary browser tab titles but no visible private messages. Screenshots are originals, not edited or composited. Their repo-relative paths and individual observations are listed in the [manual evidence manifest](system-validation-p1-manual-manifest.csv).

## External verification

- Real verification/reset email delivery: **BLOCKED**; no staging SMTP service or disposable mailbox was configured.
- User-run manual browser checks: **PARTIAL**; 19 screenshots and qualified user observations evidence the scenarios above. The sandbox itself still could not reach the app, and the evidence does not establish every end-to-end acceptance criterion.
- Full SRS acceptance: **NOT VERIFIED**; automated suite success is not a substitute for manual acceptance.

The following remain **BLOCKED or NOT VERIFIED**: successful registration/email verification (the observed registration request returned 503), actual staging SMTP delivery, completed password reset/token expiry/reuse checks, full keyboard interaction with the submission dialog, exhaustive accessibility/device/browser checks, and STP TC-OE-010 performance/availability targets. Timer continuity and some 360 px views are user-reported without paired screenshots. The 403, post-logout 401, invalid-login 401 and submit-dialog appearance are screenshot-backed. These limitations are also itemized in `docs/SYSTEM_VALIDATION_REPORT.md`.
