# Online Exam Portal — Team Handover

**As of:** 13 October 2026
**Course:** Software Engineering (UE24CS341A), PES University
**Team:** 6
**Confirmed Product Owner/team lead:** Chhavi Siddarth Wadhwa

This handover describes the current local implementation and project setup. The submitted SRS remains the source of truth. The working demo is an MVP slice; it does not mean the full SRS is complete.

## Project and repository

The project is a browser-based multiple-choice online examination portal with student, instructor, and administrator roles, as specified in the SRS. The repository is [online-exam-portal-se-miniproject](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject).

The implementation uses React and Vite for the web client, Node.js/Express for the API, MongoDB/Mongoose for data, and npm workspaces. The local branch is `feature/mvp-exam-workflow`, based on the original `main` history at `a83639eed69e604d3b13413b131075b489c7569c`. There have been no pushes or merges. Use `main` for reviewed stable code and focused `feature/`, `fix/`, or `docs/` branches for work.

## What exists now

### Implemented in the local source

- Provisioned-account login, password hashing, server sessions, role checks, CSRF/origin controls, and login throttling/lockout.
- Instructor APIs to create MCQs and create, publish, and assign exams.
- Student assigned-exam listing, one-attempt start/resume, answer saving/flagging, manual submission, server-side scoring, expiry auto-submit, and student-owned result lookup.
- Focus-loss event endpoint with persisted timestamps and selected audit records.
- React login, student exam flow/result view, and an instructor exam-list view. There is not a complete instructor authoring UI.
- Temporary demo with disposable MongoDB, seeded instructor/student accounts, and one short sample exam.

### What was observed

- **User-reported manual check:** Chhavi opened the local demo, logged in as the instructor, and saw a subject. No additional manual feature verification is implied.
- **Locally verified smoke check on 13 October 2026:** `npm run demo` started the API and Vite; `/api/health` returned HTTP 200 with `{"status":"ok"}` and `/` returned HTTP 200. The service was stopped afterward.
- The local automated tests and build results are in [test-execution.md](test-execution.md). The updated RTM is [RTM_Online_Exam_Portal.xlsx](../SRS/RTM_Online_Exam_Portal.xlsx); its `Implementation Evidence` sheet records 53 requirement statuses with local evidence/gaps. No complete SRS requirement is marked complete merely because a partial path exists.

## Windows setup and commands

Requirements: Windows PowerShell, Node.js 22.12 or newer, and npm.

```powershell
git clone https://github.com/chhavi2308-s/online-exam-portal-se-miniproject.git
cd online-exam-portal-se-miniproject
npm ci
npm test
npm run build
```

To start the disposable demo (no persistent MongoDB setup required):

```powershell
npm run demo
```

Open <http://localhost:5173>. The API listens at <http://localhost:4000>. The demo prints a freshly generated password for `instructor@example.test` and `student@example.test` to the local terminal; both seeded accounts use that run's generated password. Retrieve it from that terminal only. Do not copy it into this document, screenshots, chat, commits, or shared logs. Stop with Ctrl+C; all demo data is discarded.

For persistent local development, install/run MongoDB Community Server, copy `.env.example` to `.env`, set a local `MONGODB_URI` and other needed local values, then run:

```powershell
Copy-Item .env.example .env
npm ci
npm run dev
```

The `.env` file is ignored. Do not put credentials, real student data, or live exam content in it or the repository. Tests use a temporary MongoDB process; the first test run may download a MongoDB binary if it is not cached. `npm ci --offline` may fail if the package cache is incomplete.

## Requirements and feature status

Status meanings: `Complete` means the full requirement is implemented and verified; `Partial` means only a portion is supported or evidence is incomplete; `Not started` means no implementation was identified; `Blocked` means the evidence/action cannot currently be completed. The current repository has no full-SRS `Complete` claim.

| Requirement group | Status | Evidence / remaining work |
|---|---|---|
| FR-OE-003/004 authentication and logout | Partial | Provisioned users and session flows exist; no user self-service lifecycle; full criteria need more tests. |
| FR-OE-007/008/011 question/exam setup and assignment | Partial | API paths and validation tests exist; instructor authoring UI and full lifecycle are missing. |
| FR-OE-013–020 assigned exam/attempt/save/submit | Partial | Core server paths exist; complete timer, autosave, confirmation and recovery acceptance remains. |
| FR-OE-021 focus monitoring | Partial | API persists focus-loss timestamps; browser tracking and instructor report are absent. |
| FR-OE-022/023 evaluation and result | Partial | Representative server scoring and student result path exist; release/review behavior is incomplete. |
| FR-OE-001/002/005/006 registration, verification, reset, admin | Not started | No supported implementation identified. |
| FR-OE-009/010/012 exam options/edit lock | Partial | Negative-score floor is unit-tested, but exam configuration is absent; shuffling and edit lock are not implemented. |
| FR-OE-024/025/026/027 analytics, export, notices, audit UI | Partial | Selected audit events exist; analytics/export/notifications/admin audit UI are not implemented. |
| NFR-OE-001–009, 011, 013–014 | Not started | No complete performance, availability, recovery, accessibility, compatibility, scale, portability, or retention acceptance evidence. |
| NFR-OE-010, NFR-OE-012 | Partial | Server time is used for attempt deadlines, but displayed-clock tolerance is not measured; modular source and tests exist, but 70% business-logic coverage is not measured. |
| SEC-OE-001–012 | Partial | Some password, session, role, CSRF, answer-confidentiality, ownership, and rate-limit controls exist; the full evidence and operating requirements are incomplete. See RTM evidence sheet. |

Detailed gaps and risks are in [implementation-gap-register.md](implementation-gap-register.md). The submitted SRS, SAD, STP, STRIDE table, and diagrams are preserved. The RTM has been updated with evidence/status and is not an approval to revise the approved SRS/SAD/STP.

## Verification record

Local checks actually completed on **13 October 2026**:

| Check | Result |
|---|---|
| `npm test` | Passed: 12 tests, 0 failed, 0 skipped (9 API integration and 3 scoring tests). |
| `npm run build` | Passed: server syntax checks and Vite production build. |
| `npm ci --offline` | A prior run passed from the local cache. The most recent repeat failed with Windows `EPERM` while unlinking the native Rolldown module (`rolldown-binding.win32-x64-msvc.node`); dependency directory may be in use. This is not a test or build failure. |
| `npm ci --offline --dry-run` | Passed after the EPERM; confirms the lockfile resolves against the local cache, but does not replace a real clean install. |
| CI YAML | Parsed with a YAML parser; no GitHub Actions run has occurred because no push/PR was made. |
| `npm run demo` smoke | Passed as described above; app processes were stopped after check. |

The exact test mapping and execution limitations are in [test-execution.md](test-execution.md). These tests are implementation tests, not retroactive execution of the submitted STP. No load, accessibility, browser-matrix, production TLS, or backup tests are claimed.

## Project management status

### GitHub

- The local repo and feature branch preserve the original `main` history. The implementation and supporting documents are committed locally on `feature/mvp-exam-workflow`; see `git log` for exact hashes. No push, PR, merge, or remote configuration change has occurred.
- A repository-linked GitHub Project was created after verifying the authenticated account owns the private repository and the repository Projects page had no existing project. Project: [Online Exam Portal — Software Engineering](https://github.com/users/chhavi2308-s/projects/1); repository association: [repository Projects tab](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/projects). It is private. Settings verified: Status = Backlog, Ready, In Progress, In Review, Done; Priority = P0–P3; numeric Story Points; Sprint iterations with official dates; custom Epic single-select with the five draft epics; repository is the default project repository. Project README and description were populated with the SRS-driven planning notes.
- The GitHub connector currently resolves to a different account: it lists no repositories for `chhavi2308-s` and exposes an unrelated repository under another owner. Do not use it for this project until reconnected to the correct account. The browser-authenticated Chhavi account remains able to view the project and repository.
- The local CI workflow is `.github/workflows/ci.yml` (`Node CI`), runs on PRs and pushes to `main`, installs with `npm ci`, runs tests and build, and grants `contents: read`. It has not run remotely.

### Jira

- Accessible site: [Chhavi's Atlassian site](https://chhavis0823.atlassian.net). The available Jira search found four visible projects, four boards, and 24 visible issues; no Online Exam Portal/Team 6 project or matching backlog was found. This search does not prove that no university/team Jira site exists.
- No Jira project, board, issue, or sprint has been created. Project key `OEP` availability and Jira project-creation permission could not be confirmed through the available project-creation operation. Because the site may be personal and the course specifically requires GitHub Projects, no Jira writes were made.
- Preserved planning drafts: [jira-planning-proposal.md](../../outputs/jira-planning-proposal.md) and [jira-backlog-draft.csv](../../outputs/jira-backlog-draft.csv). Verified draft contents: 5 epics, 23 stories, 1 task, 108 provisional points; Sprint 1 has 33 points, Sprint 2 has 45, and 30 points are proposed for product backlog. These are estimates, not approved capacity/velocity.
- Proposed Jira destination if the team confirms this site: project **Online Exam Portal — Software Engineering**, key **OEP**, with a Scrum board; five epics (**Identity and User Access**, **Question Bank and Exam Setup**, **Student Exam Experience**, **Evaluation, Results, and Operations**, **Security, Reliability, and Delivery Quality**), 23 stories, and one setup/CI task. The 53 SRS IDs are covered in the draft. This is only the verified local proposal, not an existing Jira project or completed Jira operation.
- Proposed sprint contents are the draft references shown below. Draft roles/IDs are not Jira keys. Keep all teammates unassigned until allocation is agreed; Chhavi's PO responsibility is confirmed.
- Draft item references are proposal references, not Jira issue keys. Existing draft has confirmed story acceptance criteria and requirements mapped across the SRS, but before import the team should review sizing/scope and maintain unassigned members unless agreed.

## Proposed two-sprint plan (draft estimates)

Official dates from the assignment:

- **Sprint 1: 19–23 October 2026.** Goal: one integrated working baseline for instructor setup/publish/assignment, student attempt/submission, and server-scored result, with tests and CI. Draft items: `T-01`, `OE-01`, `OE-04`, `OE-05`, `OE-06`, `OE-09`, `OE-10`, `OE-12`, `OE-14` — 33 provisional points. Dependency chain in the preserved plan: setup → authentication → question/exam configuration → assignment → attempt → submit/result. Definition of Done: integrated working slice; relevant tests recorded; checks pass; reviewed PR; documented dummy-data demo. Fallback: keep the single end-to-end workflow; defer disconnected screens.
- **Sprint 2: 26–30 October 2026.** Goal: extend the slice with remaining prioritized account, recovery, security, audit, and quality requirements. Draft items: `OE-02`, `OE-03`, `OE-11`, `OE-13`, `OE-18`, `OE-19`, `OE-20`, `OE-23` — 45 provisional points. Depends on a stable Sprint 1 slice. DoD: regression/security cases and actual results, review, updated docs, demo. Capacity is unknown, so this is not a commitment.
- **Proposed product backlog:** `OE-07`, `OE-08`, `OE-15`, `OE-16`, `OE-17`, `OE-21`, `OE-22` — 30 provisional points. Three **Must** items remain outside the proposed sprints: `OE-15` / FR-OE-024 analytics, `OE-21` / NFR-OE-004 99.5% availability, and `OE-22` / NFR-OE-009 supported browser/screen-width compatibility. Do not claim full SRS completion until the Product Owner and team decide how these Musts will be addressed. If needed, re-estimate, add capacity/scope after team review, or record an explicit instructor-approved deviation; do not silently drop them.

The only confirmed responsibility is Chhavi as Product Owner/team lead. No other role or individual task assignment has been approved. The following is a **proposed balanced division for team discussion**, not an assignment:

| Teammate | Proposed focus (not approved) | Deliverable / acceptance idea | Dependency |
|---|---|---|---|
| Chhavi Siddarth Wadhwa — confirmed Team Lead/Product Owner | Prioritize backlog, resolve scope, integrate demo, review acceptance | Approved priorities and integrated demo satisfy agreed acceptance criteria; decide how Must backlog is handled | Team agreement and issue board access |
| Dhanya S Prasad — proposed | Student workflow and usability/accessibility checks | Student assigned-exam, attempt, and result path verified against stories; document keyboard/mobile findings | Stable API and test accounts |
| Gagan P — proposed | Backend exam lifecycle, validation, scoring and access controls | Focused API changes with positive/negative automated tests and linked requirement IDs | Agreed story/API contract |
| Harsha K — proposed | Test execution, RTM evidence, CI and documentation quality | Test evidence accurately records actual results; RTM/gap entries link to implemented behavior | Merged/reviewable features and shared environment |

Confirm or change this proposal as a team before assigning people in a tracker. Do not use names as Jira/GitHub identities until the actual accounts and agreement are verified.

## Remaining work and known limitations

- Finish the instructor UI and remaining account lifecycle/administration features only as prioritized from the SRS.
- Implement and test remaining Must requirements; notably FR-OE-024, NFR-OE-004 and NFR-OE-009 are outside the draft sprints.
- Complete the test plan execution matrix and add missing positive/negative, timer-boundary, authorization, and NFR evidence. Keep unexecuted statuses blocked/not run.
- Review the SAD API references against actual routes and resolve the SRS v1.2/SAD v1.4 related-document version mismatch with team approval; do not silently edit submitted documents.
- Confirm login rate-limit behavior via a 429 test, lockout duration, timer drift, autosave cadence, and broader security cases.
- Decide a safe shared environment, durable database/deployment, HTTPS, backup, monitoring and operational secrets approach before any production claim.
- GitHub Project setup is verified, but it currently has no backlog work items and has zero additional project members. Do not treat the board metadata as an imported backlog. Sharing with teammates requires an explicit access decision; repository contributors are not automatically project members. Jira site/project creation remains blocked pending intended-site/permission confirmation.
- Sprint 1 one-minute and Sprint 2 two-minute demo recordings are assignment deliverables. No recording has been generated or uploaded. After Sprint 2, update docs and freeze development as instructed.

## How the team should collaborate

1. Product Owner prioritizes/clarifies the story; contributor checks acceptance criteria and dependencies before starting.
2. Create a focused branch from the latest `main`, for example `feature/<short-name>`, `fix/<short-name>`, or `docs/<short-name>`.
3. Link commits and pull requests to the agreed GitHub issue/project item. Use descriptive commits such as `feat: save exam answers` or `test: cover timeout submission`.
4. Run relevant tests and `npm run build`; put actual command output/results and environment in the issue/PR. Never mark a planned test passed before running it.
5. Open a PR, request the confirmed reviewer, address comments, and merge only after required review/checks. The local workflow file does not configure branch protection.
6. Keep secrets, `.env`, real identities, credentials and real exam data out of Git and screenshots. Use dummy data only.

## Priority checklist

1. Review the local implementation, corrected test mapping, and RTM evidence sheet; agree which Must requirements can fit the two official sprint windows.
2. Confirm proposed task division and estimates with the four-person team; keep assignees empty until agreement and verified tracker identities.
3. Review the private GitHub Project configuration; decide whether to add the three teammates to project access, then populate it only after agreeing on the authoritative issue tracker to avoid duplicate backlog items.
4. Decide whether the accessible personal Jira site is acceptable or identify the official shared site; confirm `OEP` key availability and project-create permission before any Jira write.
5. Resolve the Windows `npm ci --offline` EPERM after ensuring no process is holding Rolldown's native module, then rerun clean install, tests and build.
6. Review and commit the local feature-branch changes. Request separate approval before any push/PR/merge.
7. Record Sprint 1 and Sprint 2 demos from the actual running product; upload only the real recordings as assignment requires.

## Verified and blocked links

- [GitHub repository](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject)
- [Accessible Jira site](https://chhavis0823.atlassian.net) — no OEP project URL exists yet.
- [GitHub Project](https://github.com/users/chhavi2308-s/projects/1) and its [main view](https://github.com/users/chhavi2308-s/projects/1/views/1) are verified. No Jira project, board, backlog, or sprint URL exists because no Jira data has been created.
- Source deliverables: [SRS PDF](../SRS/SRS_Online_Exam_Portal.pdf), [SAD](../SAD_Online_Exam_Portal_v1.4.docx), [STP PDF](../STP/Online_Exam_Portal_Software_Test_Plan_v1.1.pdf), [STRIDE table](../Architecture/Traceability%20to%20Requirements%20%26%20Security%20Architecture%20%E2%80%93%20STRIDE%20Table.xlsx), [design diagrams](../Design/diagrams/README.md).
