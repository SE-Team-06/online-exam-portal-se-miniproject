# Online Exam Portal

Student Software Engineering mini-project for an MCQ examination system. The submitted SRS v1.2 specifies a MERN stack; this repository now contains a starter implementation using React, Express, and MongoDB. The documents remain the requirements source of truth.

## Local setup

Requirements: Node.js 22.12 or newer and npm. For persistent local development, install MongoDB Community Server and run it locally.

```powershell
Copy-Item .env.example .env
npm.cmd ci
npm.cmd run dev
```

The API starts on `http://localhost:4000`; Vite serves the web app on `http://localhost:5173`. The API requires `MONGODB_URI`. The `.env` file is ignored by Git. Do not put credentials, real student data, or exam answers in the repository.

## Temporary demo (no persistent database required)

```powershell
npm.cmd ci
npm.cmd run demo
```

The demo starts a temporary MongoDB process and seeds one instructor, one student, and one short sample exam. It prints a newly generated password for both dummy accounts to the local terminal. Open `http://localhost:5173` and sign in as `student@example.test` to complete the timed MCQ flow. Stop with Ctrl+C; demo data is discarded. Keep the generated password out of screenshots, commits, and shared logs. The demo is for local evaluation only.

For the instructor demo, sign in as `instructor@example.test` using the password printed for that demo run. Demo accounts and data are disposable; a new random password is generated each run.

## Checks

```powershell
npm.cmd test
npm.cmd run build
```

The latest local execution record is in [`docs/test-execution.md`](docs/test-execution.md). Automated test/build success verifies this implementation snapshot, not full SRS or browser acceptance.

## Troubleshooting

- If the persistent API cannot connect, confirm MongoDB is running and that `MONGODB_URI` in your local `.env` points to it.
- If the demo cannot start its temporary MongoDB on the first run, allow its MongoDB test binary to download and retry when network access is available.
- If port 4000 or 5173 is already in use, stop the other local process or configure a free port before starting the app.
- In PowerShell, use `npm.cmd` if `npm` selects `npm.ps1` and execution policy blocks scripts. This avoids changing the machine execution policy.
- If `npm.cmd ci` reports Windows `EPERM` replacing a native module, close terminals running this checkout and retry. If the lock error persists, restart Windows before reopening the project. Do not manually delete the locked native module or project source/lockfiles.

For team status, setup handover, requirement coverage and proposed next steps, see [`docs/TEAM_HANDOVER.md`](docs/TEAM_HANDOVER.md). The [`presentation checklist`](docs/PRESENTATION_CHECKLIST.md) covers the verified demo and project-management claims.

Integration tests use a temporary MongoDB process. Its first run may need network access to download a MongoDB binary into the local tool cache. No global MongoDB installation or Docker is required for tests.

## Current implementation boundary

Implemented in this starter: login for provisioned/verified accounts; inactivity-expiring server sessions; role checks, CSRF and origin checks for state changes; instructor-owned MCQ create/edit/delete with validation and exam-reference protection; exam creation/configuration, owner-scoped edits and configuration locking after the first attempt; assigned exam listing; one timed student attempt with server-side saved answers, a resume endpoint/UI path, timed auto-submit and scoring; result ownership checks; basic audit events; local dummy-data demo. Exam configuration and locking were merged by PR #34 (merge commit `58b988be87a174127c9201a5e3696281a1bcb553`), as verified in the authenticated GitHub browser on 25 October 2026.

The API also exposes recipient-scoped notifications at `/api/notifications`, instructor result statistics at `/api/instructor/results`, and CSV export at `/api/instructor/results.csv`. These endpoints require an authenticated session; notification read status requires the session CSRF token.

Not yet implemented or fully verified: self-service registration/email verification, password reset, administrator account-management UI, exam deletion, a separate draft/publish lifecycle, question/option shuffling, reporting/analytics, notifications, complete timer/recovery acceptance (including refresh/retry tests), comprehensive accessibility/usability checks, performance/load targets, production deployment/TLS, operational backup/recovery, and complete alignment to every SRS/SAD requirement. Optional negative-marking fields and scoring exist, but Issue #16's complete acceptance (including pre-publication visibility/fixed published settings and end-to-end coverage) remains unverified. See `docs/implementation-gap-register.md`. This code must not be represented as meeting the full SRS.

## Project collaboration

Use focused `feature/`, `fix/`, and `docs/` branches, link work to an approved issue, and open a pull request for review. See [CONTRIBUTING.md](CONTRIBUTING.md). Local files do not enforce GitHub branch protection. No secrets or real exam data should be committed.
