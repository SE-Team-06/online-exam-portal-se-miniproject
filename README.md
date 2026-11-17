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

This summary was checked against `main` at `ed3805cc2790795c44aede7387fc448909ea24ae` on 17 November 2026. That main revision has a successful GitHub Actions run ([run ID 44074576817](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/44074576817), workflow run #118). The report documents 172 server and 17 client tests from separate executions on source `a841a6d`; those suites were not rerun for the current documentation update, and the exposed Actions summary does not state a test count.

Current application code includes student registration and account verification, password reset, session authentication/logout, role checks, administrator user management and audit review, instructor question/exam authoring, student attempts, answer saving and resume, automatic/manual submission, scoring, instructor results/CSV, and in-app notifications. Account-action tokens are hashed, single-use and time-limited. The default API bind is loopback; deployment relies on the documented reverse-proxy/TLS model.

The following SRS acceptance requirements remain incomplete or unverified; a visible form control or a passing general CI run is not proof of its behavior:

- **Question and option shuffling (FR-OE-009):** the UI sends shuffle settings, but the server schema/model do not persist both settings and the current server code does not apply a question/option permutation. Treat the feature as not implemented.
- **Email-dependent workflows:** account verification and password reset use a mail transport in code and tests, but staging SMTP delivery and successful browser activation/reset are not verified. The P1 registration attempt returned HTTP 503; its underlying cause was not established.
- **Notifications (FR-OE-026):** in-app notifications exist; exam assignment/result email notifications are not implemented.
- **Deadline grace (SEC-OE-009):** the server rejects at `endsAt`; SRS requires a five-second grace. Preserve this as an unresolved design deviation until the team approves a requirement change or implementation fix.
- **Quantitative NFRs:** no controlled 500-user load/capacity run, 99.5% exam-window availability history, 10,000/1,000/200 data-volume test, or two-second clock-drift measurement is recorded. Tools and health probes do not substitute for those measurements.
- **Operations/security:** deployment TLS, scheduled backup/restore operations, production retention/access controls, and encryption at rest for personal data/backups lack deployment evidence; at-rest encryption is not implemented in the application configuration.
- **Accessibility/browser scope:** the 26 October report records 44/44 scoped automated checks and a keyboard walkthrough across Chrome/Chromium/Firefox/WebKit, and P1 records 360 px host-browser views. Edge, previous major browser versions, screen-reader/user testing and exhaustive application coverage remain unverified.
- **Requirements/design alignment:** implemented route names and API shapes differ from parts of SAD v1.4; see `docs/DEVIATIONS.md` and the RTM's separate actual-source/API evidence. Do not silently equate these references.

The updated `SRS/RTM_Online_Exam_Portal.xlsx` separates implementation status from test-execution status, retains the October 13 evidence as a labeled historical snapshot, and records the current evidence baseline. See `docs/RTM_AUDIT_SUMMARY_2026-11-17.md`, `docs/implementation-gap-register.md`, `docs/SPRINT2_ACCEPTANCE_STATUS.md`, and `docs/SYSTEM_VALIDATION_REPORT.md` for scope and limitations. Test success is not a claim that the complete SRS is implemented or accepted.

## Project collaboration

Use focused `feature/`, `fix/`, and `docs/` branches, link work to an approved issue, and open a pull request for review. See [CONTRIBUTING.md](CONTRIBUTING.md). Local files do not enforce GitHub branch protection. No secrets or real exam data should be committed.
