# System validation execution evidence — 9 November 2026

Repository baseline: `8727d94aa7ac88bcd723de98b77283a7ffe21143` (`main`).

This record covers the follow-up execution performed on 9 November 2026. It is separate from the historical manual validation attempt dated 2–6 November 2026. No application code, package manifest, lockfile, SMTP configuration, firewall rule, or security setting was changed.

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

## Demo and browser attempt

### Same-shell launch and socket diagnostics

- Before launch, no listeners were found on TCP ports 4000, 5173, or 27017; no port conflict was observed.
- With process-local `TEMP`/`TMP` moved out of the Windows sandbox temp path, Vite logged `ready` on `127.0.0.1:5173`.
- In the same PowerShell execution session, the API failed while connecting Mongoose to the temporary MongoDB loopback port: `MongooseServerSelectionError: connect EACCES 127.0.0.1:63110`; the workspace demo lifecycle exited with code 1. The concurrent demo launcher then terminated Vite.
- The same-shell `netstat` probe found no TCP listeners for 4000, 5173, or 27017. Curl requests to `127.0.0.1`, `localhost`, and `[::1]` on the frontend/API ports all returned HTTP `000` and curl exit code 7 (connection refused).
- The in-app browser separately returned `ERR_CONNECTION_TIMED_OUT` for `127.0.0.1:5173`.
- A read of the host firewall profile returned no profile data; the available `netsh` command did not expose the `advfirewall` subcommand. Host firewall behavior therefore could not be verified. No firewall setting was changed.
- The computer-use host blocked launching Windows PowerShell, and Git CMD launch approval timed out. A normal persistent interactive desktop terminal/browser session was unavailable.

These results show that the Codex execution environment denies or cannot retain local loopback sockets. The prior log-only observation of “Demo API”/Vite startup was insufficient to establish reachability and is superseded by this bounded same-shell probe. No registration, login, instructor, student, exam, result, logout, access-control, or responsive workflow completed in a browser. No successful-workflow screenshots were captured. The evidence does not establish a product defect; it establishes that this runner cannot provide the requested host-side browser acceptance.

## Laptop-side manual procedure

Run in a normal Windows PowerShell session outside the Codex sandbox, keeping the terminal open:

```powershell
Set-Location "C:\Users\Chhavi\Documents\Codex\2026-10-22\https-github-com-se-team-06\oep-system-validation-p1"
git status --short --branch
$env:TEMP = Join-Path $PWD ".cache\p1-mongo-process-tmp"
$env:TMP = $env:TEMP
$env:MONGOMS_DOWNLOAD_DIR = Join-Path $PWD ".cache\p1-mongodb-binaries"
New-Item -ItemType Directory -Force -Path $env:TEMP, $env:MONGOMS_DOWNLOAD_DIR | Out-Null
Get-NetTCPConnection -State Listen -LocalPort 4000,5173 -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess
npm.cmd run demo
```

Use Chrome on the same Windows machine at `http://127.0.0.1:5173/`. The demo prints generated disposable account credentials for local instructor/student use. Do not include the password in screenshots or logs. Press Ctrl+C after testing. If MongoDB still reports loopback `EACCES`, capture that error and stop; do not disable the firewall or integrity checks.

Manual scenarios to record against the STP:

1. TC-OE-001: registration required-field validation; registration/verification only passes with real staging SMTP; login with each seeded role; invalid password; logout.
2. TC-OE-003: Student rejection from an instructor-only API/action and Instructor access to instructor workspace. No Administrator is seeded by this demo.
3. TC-OE-004/005: create a synthetic MCQ, configure and publish an exam, assign it to the seeded verified Student, then verify the Student sees it.
4. TC-OE-005/006/007/008: start the assigned exam, select an answer, verify it is saved, check the visible timer, submit through the confirmation dialog.
5. TC-OE-008/009: verify the Student result and the Instructor attempt/statistics view.
6. TC-OE-005/006: inspect reachable login/exam screens at desktop and approximately 360 px; record layout, console, and network observations.

Capture genuine screenshots only after observing each result. Never capture the terminal credential output, and keep SMTP marked NOT VERIFIED until real staging delivery is exercised.

## External verification

- Real verification/reset email delivery: **BLOCKED**; no staging SMTP service or disposable mailbox was configured.
- Manual browser acceptance and screenshots: **BLOCKED / NOT VERIFIED**; no app workflow was reachable.
- Full SRS acceptance: **NOT VERIFIED**; automated suite success is not a substitute for manual acceptance.
