# Online Exam Portal

Student Software Engineering mini-project for an MCQ examination system. The submitted SRS v1.2 specifies a MERN stack; this repository now contains a starter implementation using React, Express, and MongoDB. The documents remain the requirements source of truth.

## Local setup

Requirements: Node.js 22.12 or newer and npm. For persistent local development, install MongoDB Community Server and run it locally.

```powershell
Copy-Item .env.example .env
npm.cmd ci
npm.cmd run dev
```

The API starts on `http://localhost:4000` bound to loopback by default; Vite serves the web app on `http://localhost:5173`. The API requires `MONGODB_URI`. Registration and password reset send mail through `SMTP_URL` and `MAIL_FROM`; use implicit TLS (`smtps://`) or STARTTLS (`smtp://`, enforced by the mail transport), and set `APP_ORIGIN` to the correct application origin. Without SMTP configuration, registration cannot send a verification link and password-reset requests do not send mail. The `.env` file is ignored by Git. Do not put credentials, real student data, or exam answers in the repository.

## Linux deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for reproducible Linux server steps, required services, environment variables, and a reverse-proxy setup. The documented deployment targets a standard Linux server with Node.js and MongoDB; the project does not currently include a Docker image or Compose file.

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
npm.cmd run coverage
npm.cmd run build
```

The latest local execution record is in [`docs/test-execution.md`](docs/test-execution.md). Automated test/build success verifies this implementation snapshot, not full SRS or browser acceptance.

Administrator audit review and repeatable scale measurements are documented in [`docs/OPERATIONS.md`](docs/OPERATIONS.md).

## Troubleshooting

- If the persistent API cannot connect, confirm MongoDB is running and that `MONGODB_URI` in your local `.env` points to it.
- If the demo cannot start its temporary MongoDB on the first run, allow its MongoDB test binary to download and retry when network access is available.
- If port 4000 or 5173 is already in use, stop the other local process or configure a free port before starting the app.
- In PowerShell, use `npm.cmd` if `npm` selects `npm.ps1` and execution policy blocks scripts. This avoids changing the machine execution policy.
- If `npm.cmd ci` reports Windows `EPERM` replacing a native module, close terminals running this checkout and retry. If the lock error persists, restart Windows before reopening the project. Do not manually delete the locked native module or project source/lockfiles.

For team status, setup handover, requirement coverage and proposed next steps, see [`docs/TEAM_HANDOVER.md`](docs/TEAM_HANDOVER.md). The [`presentation checklist`](docs/PRESENTATION_CHECKLIST.md) covers the verified demo and project-management claims.

Integration tests use a temporary MongoDB process. Its first run may need network access to download a MongoDB binary into the local tool cache. No global MongoDB installation or Docker is required for tests.

## Current implementation boundary

The current `main` includes student registration, email verification, password reset, administrator account management, and administrator audit review alongside the exam workflows. Account-action tokens are stored as hashes, single-use and time-limited. Audit events cover authentication, exam publication, attempt submission, result access, and user changes. Production links require an explicit valid `APP_ORIGIN`; the API binds to loopback by default and trusts one reverse-proxy hop only under the documented private-network deployment model.

The API also exposes recipient-scoped notifications at `/api/notifications`, instructor result statistics at `/api/instructor/results`, and CSV export at `/api/instructor/results.csv`. These endpoints require an authenticated session; notification read status requires the session CSRF token.

Not yet externally verified: real SMTP delivery and deployed account-link flows, production TLS/proxy configuration, operational retention/backup controls, and instructor/browser acceptance. Broader SRS gaps remain, including question/option shuffling, full timer/recovery acceptance, deployment-scale targets, accessibility/browser evidence, and complete alignment to every SRS/SAD requirement. See `docs/implementation-gap-register.md` and `docs/SPRINT2_ACCEPTANCE_STATUS.md`; passing tests do not mean the full SRS is implemented.

## Project collaboration

Use focused `feature/`, `fix/`, and `docs/` branches, link work to an approved issue, and open a pull request for review. See [CONTRIBUTING.md](CONTRIBUTING.md). Local files do not enforce GitHub branch protection. No secrets or real exam data should be committed.
