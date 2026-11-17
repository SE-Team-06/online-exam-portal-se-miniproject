
# Online Exam Portal

A student Software Engineering mini-project implementing an online multiple-choice examination portal.

The submitted Software Requirements Specification (SRS v1.2) defines the requirements and specifies a MERN-stack solution. This repository contains a starter implementation built with React, Express and MongoDB. The SRS and supporting project documents remain the requirements source of truth; the implementation should not be assumed to satisfy every specified requirement.

## Table of contents

- [Project overview](#project-overview)
- [Technology stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Temporary demo](#temporary-demo)
- [Running checks](#running-checks)
- [Linux deployment](#linux-deployment)
- [Troubleshooting](#troubleshooting)
- [Implementation overview](#implementation-overview)
- [Known gaps and verification status](#known-gaps-and-verification-status)
- [Project documentation](#project-documentation)
- [Project collaboration](#project-collaboration)
- [Security and data handling](#security-and-data-handling)

## Project overview

The Online Exam Portal is intended to support the administration and execution of timed MCQ examinations.

The project covers three principal roles:

- **Administrator:** user management and administrative audit review.
- **Instructor:** question and examination authoring, examination management, and result review.
- **Student:** examination access, answering and saving questions, resuming attempts, and submitting examinations.

The project includes account-related workflows, examination attempts, scoring, result reporting and in-app notifications.

## Technology stack

| Layer | Technology |
|---|---|
| Front end | React, Vite |
| Back end | Node.js, Express |
| Database | MongoDB |
| Testing | Automated server and client test suites |
| Build | npm scripts and Vite |

The project uses a React client and an Express API backed by MongoDB. Refer to the project source and deployment documentation for implementation and configuration details.

## Prerequisites

For local development:

- Node.js 22.12 or newer
- npm
- MongoDB Community Server for persistent local development

The temporary demo and integration tests use a temporary MongoDB process and do not require a globally installed MongoDB server.

## Local setup

Clone the repository and open its root directory.

Create the environment file:

```powershell
Copy-Item .env.example .env
```

Install dependencies:

```powershell
npm.cmd ci
```

Configure the required environment variables in `.env`, especially:

- `MONGODB_URI` — MongoDB connection string.
- `SMTP_URL` — SMTP transport URL for email-dependent workflows.
- `MAIL_FROM` — sender address used by the mail transport.
- `APP_ORIGIN` — application origin used when generating account-action links.

For SMTP, use implicit TLS (`smtps://`) or STARTTLS (`smtp://`). The mail transport enforces secure transport. Without SMTP configuration, registration cannot send a verification link and password-reset requests do not send email.

Start the development application:

```powershell
npm.cmd run dev
```

By default:

| Service | Address |
|---|---|
| React/Vite web application | http://localhost:5173 |
| Express API | http://localhost:4000 |

The API binds to loopback by default. The API requires a valid `MONGODB_URI` and a running MongoDB service.

The `.env` file is ignored by Git. Never commit environment files containing credentials.

## Temporary demo

A temporary demo is available for local evaluation without configuring a persistent MongoDB installation.

Install dependencies if not already installed:

```powershell
npm.cmd ci
```

Start the demo:

```powershell
npm.cmd run demo
```

The demo starts a temporary MongoDB process and seeds:

- One instructor account
- One student account
- One short sample examination

New random passwords for both demonstration accounts are printed in the local terminal each time the demo starts.

Open http://localhost:5173 and sign in using:

| Role | Demo account |
|---|---|
| Student | `student@example.test` |
| Instructor | `instructor@example.test` |

Use the password printed for the corresponding account during that demo run.

The student account can be used to complete the timed MCQ examination flow. The instructor account can be used to explore the instructor-facing demonstration.

Press `Ctrl+C` to stop the demo. The temporary demo data is discarded.

**Important:** These accounts and passwords are disposable. Do not include generated passwords in screenshots, commits, shared logs or project documentation. The demo is intended for local evaluation, not production use.

## Running checks

Run the automated test suites:

```powershell
npm.cmd test
```

Run coverage:

```powershell
npm.cmd run coverage
```

Build the application:

```powershell
npm.cmd run build
```

The execution history is maintained in [`docs/test-execution.md`](docs/test-execution.md).

Automated test success and a successful build establish evidence for the tested implementation snapshot. They do not establish complete SRS compliance, browser acceptance or production readiness.

Integration tests use a temporary MongoDB process. The first execution may need network access to download a MongoDB test binary into the local tool cache. A global MongoDB installation or Docker is not required for these tests.

## Linux deployment

Refer to [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the documented Linux deployment procedure, including:

- Required services and runtime dependencies
- Environment variables
- MongoDB configuration
- Reverse-proxy setup
- TLS and deployment considerations

The documented target is a standard Linux server running Node.js and MongoDB.

The repository does not currently include a Docker image or Docker Compose configuration.

For administrator audit review and operational measurements, see [`docs/OPERATIONS.md`](docs/OPERATIONS.md).

## Troubleshooting

**The persistent API cannot connect to MongoDB**

Confirm that MongoDB is running and that `MONGODB_URI` in `.env` points to the correct database.

**The temporary demo cannot start MongoDB**

The temporary MongoDB binary may need to be downloaded on its first run. Allow network access and retry.

**Ports 4000 or 5173 are already in use**

Stop the other process using the port or configure an available port before starting the application.

**PowerShell blocks npm scripts**

Use `npm.cmd` instead of `npm` when PowerShell selects `npm.ps1` and the execution policy blocks it. This avoids changing the machine's execution policy.

**`npm.cmd ci` reports Windows `EPERM` while replacing a native module**

Close terminals running this checkout and retry. If the lock persists, restart Windows before reopening the project. Do not manually delete the locked native module, project source files or lockfiles.

**Registration or password-reset email is not received**

Check `SMTP_URL`, `MAIL_FROM` and `APP_ORIGIN`. Verify that the configured SMTP provider permits the connection and that the application is using secure SMTP transport. Local code or automated tests do not establish successful staging email delivery.

## Implementation overview

The current application code includes the following functionality:

- Student registration and account verification
- Password-reset workflow
- Session authentication and logout
- Role-based access checks
- Administrator user management and audit review
- Instructor question and examination authoring
- Student examination attempts
- Answer saving and attempt resumption
- Automatic and manual examination submission
- Examination scoring
- Instructor result review and CSV export
- In-app notifications

Account-action tokens are hashed, single-use and time-limited.

The default API bind is loopback. The documented deployment model relies on a reverse proxy and TLS configuration.

This is an implementation overview, not a claim that every corresponding SRS acceptance criterion has been fully demonstrated.

## Known gaps and verification status

The following items describe known implementation gaps, unresolved deviations or requirements for which sufficient verification evidence is not currently recorded.

A visible UI control, a successful general CI run or an automated workflow test should not be treated as proof of complete requirement acceptance.

### Functional requirements

**Question and option shuffling — FR-OE-009**

The instructor interface exposes both question-order and answer-option shuffle settings. The user reports observing both behaviours in the student examination flow. This is recorded as a user-reported manual PASS.

However, source-level inspection raises a discrepancy concerning persistence and server-side application of both settings. The reported observation is not independent implementation evidence. Keep the implementation status disputed until the source discrepancy is reconciled.

**Email-dependent workflows**

Account verification and password reset use a mail transport in the application. However, successful staging SMTP delivery and complete browser-based activation/reset have not been verified.

A recorded P1 registration attempt returned HTTP 503; the underlying cause was not established. Do not interpret this observation as proof of a specific SMTP failure.

**Notifications — FR-OE-026**

In-app notifications are present. Exam assignment and result email notifications are not implemented.

**Deadline grace — SEC-OE-009**

The server rejects submissions at `endsAt`, while the SRS specifies a five-second grace period. This remains an unresolved design deviation pending an approved requirement change or an implementation fix.

### Non-functional requirements

**Performance and scalability**

The SRS specifies quantitative performance targets, including:

- 95% of page requests within two seconds under 500 concurrent users.
- 95% of auto-save requests within one second under 500 concurrent users.
- Examination scoring within five seconds for up to 500 simultaneous submissions.

No controlled quantitative load-test results demonstrating these targets are currently recorded.

**Availability**

The SRS specifies 99.5% availability during scheduled examination windows. No corresponding production availability history is recorded.

**Data-volume and clock-drift requirements**

The required 10,000/1,000/200 data-volume tests and two-second clock-drift measurements have not been demonstrated in the recorded evidence.

Operational tools and health probes do not substitute for controlled measurements.

### Security and operational requirements

**Encryption at rest — SEC-OE-012**

Application-level encryption of database records and backup files is not demonstrated. Whether the underlying database, storage volume or backup provider supplies encryption at rest has not been independently verified.

**Deployment and operations**

Deployment TLS, scheduled backup and restore operations, production retention policies and access controls require deployment evidence. The documented deployment model describes reverse-proxy/TLS configuration; this is not proof of a verified production deployment.

**Email security**

The application uses secure SMTP transport configuration. Successful delivery and end-to-end account workflows in a deployed environment remain unverified.

### Accessibility and browser compatibility

The 26 October report records 44/44 scoped automated checks and a keyboard walkthrough across Chrome/Chromium/Firefox/WebKit. P1 records 360 px host-browser views.

The following remain outside the demonstrated evidence:

- Edge browser coverage
- Previous major browser versions
- Screen-reader and user testing
- Exhaustive application-wide accessibility coverage

### Requirements and design alignment

Implemented route names and API shapes differ from parts of SAD v1.4. Refer to [`docs/DEVIATIONS.md`](docs/DEVIATIONS.md) and the RTM's separate actual-source/API evidence.

Do not assume that a design reference, UI control or documented requirement is equivalent to implemented and verified behaviour.

## Project documentation

The following documents provide detailed requirements, design, implementation and validation information.

| Document | Purpose |
|---|---|
| SRS v1.2 | Software requirements and acceptance criteria |
| SAD | Software architecture and design |
| Test Plan | Testing scope, strategy and planned verification |
| `docs/test-execution.md` | Historical test execution record |
| `docs/DEVIATIONS.md` | Requirements deviations and implementation limitations |
| `docs/RTM_AUDIT_SUMMARY_2026-11-17.md` | Requirements traceability audit and evidence summary |
| `docs/implementation-gap-register.md` | Implementation gaps and open items |
| `docs/SPRINT2_ACCEPTANCE_STATUS.md` | Sprint acceptance status |
| `docs/SYSTEM_VALIDATION_REPORT.md` | System validation evidence and limitations |
| `docs/TEAM_HANDOVER.md` | Team status, setup handover and proposed next steps |
| `docs/DEPLOYMENT.md` | Linux deployment instructions |
| `docs/OPERATIONS.md` | Operational procedures and measurements |
| `docs/PRESENTATION_CHECKLIST.md` | Demo and project-management claim checklist |

The RTM workbook at `SRS/RTM_Online_Exam_Portal.xlsx` separates implementation status from test-execution status, retains the October 13 evidence as a labeled historical snapshot, and records the current evidence baseline.

Historical test counts must be interpreted against their corresponding source revisions and execution records. In particular, the reported 172 server tests and 17 client tests came from separate executions on source `a841a6d`; they were not rerun for the documentation update.

The `main` revision checked for this README was `ed3805cc2790795c44aede7387fc448909ea24ae`, dated 17 November 2026. GitHub Actions workflow run [#118](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/44074576817) completed successfully for that revision. The exposed Actions summary does not state a test count.

A successful CI run is evidence about the checks executed by that workflow. It is not evidence that every SRS requirement is implemented, tested or accepted.

## Project collaboration

Use focused branches for project work:

- `feature/` for new functionality
- `fix/` for defect corrections
- `docs/` for documentation changes

Link work to an approved issue and open a pull request for review.

Refer to [`CONTRIBUTING.md`](CONTRIBUTING.md) for contribution guidance.

Local files do not enforce GitHub branch protection or repository-level review policies.

## Security and data handling

- Never commit `.env` files or credentials.
- Do not commit real student personal data.
- Do not commit real examination answers or confidential examination material.
- Keep generated demo passwords out of screenshots and shared logs.
- Use disposable demonstration accounts and data only for local evaluation.
- Review configuration and deployment security before using the application in any shared or production environment.
