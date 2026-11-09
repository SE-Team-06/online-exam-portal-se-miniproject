# System validation execution evidence — 9 November 2026

Repository baseline: `8727d94aa7ac88bcd723de98b77283a7ffe21143` (`main`).

This record covers the follow-up execution performed on 9 November 2026. It is separate from the historical manual validation attempt dated 2–6 November 2026. No application code, package manifest, lockfile, SMTP configuration, or security setting was changed.

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

The demo was run with process-local `TEMP` and `TMP` directed to an ignored workspace cache path, avoiding the Windows sandbox temp path that previously caused `mongod` startup errors. Its console reported demo API startup and Vite readiness. Demo account output was redirected/withheld; no passwords or tokens are included here.

Independent HTTP requests to `127.0.0.1:4000` and `127.0.0.1:5173`, and the in-app browser request to the frontend, timed out. No registration, login, instructor, student, exam, result, logout, access-control, or responsive workflow completed in a browser. No successful-workflow screenshots were captured. Because the service could not be reached from the browser/tool context, this run does not establish whether the timeout is caused by the app or the isolated execution environment.

## External verification

- Real verification/reset email delivery: **BLOCKED**; no staging SMTP service or disposable mailbox was configured.
- Manual browser acceptance and screenshots: **BLOCKED / NOT VERIFIED**; no app workflow was reachable.
- Full SRS acceptance: **NOT VERIFIED**; automated suite success is not a substitute for manual acceptance.
