# Online Exam Portal — Team Handover

**As of:** 13 October 2026
**Course:** Software Engineering (UE24CS341A), PES University
**Team:** 6
**Confirmed Product Owner/team lead:** Chhavi Siddarth Wadhwa

This handover describes the current local implementation and project setup. The submitted SRS remains the source of truth. The working demo is an MVP slice; it does not mean the full SRS is complete.

## Project and repository

The project is a browser-based multiple-choice online examination portal with student, instructor, and administrator roles, as specified in the SRS. The canonical repository is [SE-Team-06/online-exam-portal-se-miniproject](https://github.com/SE-Team-06/online-exam-portal-se-miniproject).

The implementation uses React and Vite for the web client, Node.js/Express for the API, MongoDB/Mongoose for data, and npm workspaces. PR #28 merged Chhavi's Sprint 1 work into `main`; the fetched merge commit is `88c21bcf2d887fcc9f5381e509523592167142bb`, whose second parent is feature tip `9973c2df08a493ecfa2115723da4fa410796b797`. The follow-up optional-answer validation fix is on a separate local branch and is not pushed or reviewed. These Git facts were verified from fetched refs on 24 October 2026. Use focused feature branches and owner-reviewed PRs for integration.

## What exists now

### Implemented in the local source

- Provisioned-account login, password hashing, server sessions, role checks, CSRF/origin controls, and login throttling/lockout.
- Instructor APIs to create MCQs and create, publish, and assign exams.
- Student assigned-exam listing, one-attempt start/resume, answer saving/flagging, manual submission, server-side scoring, expiry auto-submit, and student-owned result lookup.
- Focus-loss event endpoint with persisted timestamps and selected audit records.
- React login, student exam flow/result view, instructor question-bank create/list view, and instructor exam configure/publish/assign view. Question/exam editing and deletion are not implemented. PR #28 is merged; the merged UI has not had a separately verified authenticated browser acceptance walkthrough.
- Temporary demo with disposable MongoDB, seeded instructor/student accounts, and one short sample exam.

### What was observed

- **User-reported manual check:** Chhavi opened the local demo, logged in as the instructor, and saw a subject. No additional manual feature verification is implied.
- **Automated verification on 24 October:** after PR #28 merged, `npm.cmd test` passed 22/22; the default build command hit an EPERM while writing a temporary config file through a shared dependency junction, but the server check and Vite build passed using the native config loader; details are in [test execution](test-execution.md). These results do not replace an authenticated browser acceptance walkthrough. The follow-up fix is not pushed.
- **Locally verified smoke check on 13 October 2026:** `npm run demo` started the API and Vite; `/api/health` returned HTTP 200 with `{"status":"ok"}` and `/` returned HTTP 200. The service was stopped afterward.
- The local automated tests and build results are in [test-execution.md](test-execution.md). The updated RTM is [RTM_Online_Exam_Portal.xlsx](../SRS/RTM_Online_Exam_Portal.xlsx); its `Implementation Evidence` sheet records 53 requirement statuses with local evidence/gaps. No complete SRS requirement is marked complete merely because a partial path exists.

## Windows setup and commands

Requirements: Windows PowerShell, Node.js 22.12 or newer, and npm.

```powershell
git clone https://github.com/SE-Team-06/online-exam-portal-se-miniproject.git
cd online-exam-portal-se-miniproject
npm.cmd ci
npm.cmd test
npm.cmd run build
```

To start the disposable demo (no persistent MongoDB setup required):

```powershell
npm.cmd run demo
```

Open <http://localhost:5173>. The API listens at <http://localhost:4000>. The demo prints a freshly generated password for `instructor@example.test` and `student@example.test` to the local terminal; both seeded accounts use that run's generated password. Retrieve it from that terminal only. Do not copy it into this document, screenshots, chat, commits, or shared logs. Stop with Ctrl+C; all demo data is discarded.

For persistent local development, install/run MongoDB Community Server, copy `.env.example` to `.env`, set a local `MONGODB_URI` and other needed local values, then run:

```powershell
Copy-Item .env.example .env
npm.cmd ci
npm.cmd run dev
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

### Presentation-readiness verification — 13 October 2026 (latest)

- User-reported `npm.cmd ci` completed in this checkout (184 packages added, 187 audited, 0 vulnerabilities). The PowerShell `npm` command selected blocked `npm.ps1`; using `npm.cmd` worked without changing execution policy.
- Independently reran `npm.cmd test` and `npm.cmd run build` from this repository on `feature/mvp-exam-workflow`: **12/12 tests passed** (9 workflow integration and 3 scoring; 0 failed/skipped); server syntax checks passed; Vite production build passed (15 modules; JS 227.05 kB / 71.03 kB gzip, CSS 5.13 kB / 1.71 kB gzip).
- The earlier Windows `EPERM` while unlinking the Rolldown binary was resolved by the user’s later successful `npm.cmd ci`. No native binary was manually deleted and no machine-wide execution policy was changed.
- The demo was not freshly started after dependency repair. Earlier `/api/health` and `/` smoke checks returned HTTP 200, and Chhavi separately reported logging in to the instructor and seeing a subject. A fresh student browser workflow remains unverified today; automated API workflow tests are not proof of the full live UI path.
- Live Jira readback on 13 October confirms 29 issues (5 epics, 23 stories, 1 task). Board 70 has Sprint 1 (9 issues / 33 provisional points) and Sprint 2 (8 issues / 45 provisional points); both are future and have 0 completed issues. The remaining 12 issues are in backlog (30 provisional points). All items remain unassigned. **FR-OE-024, NFR-OE-004, and NFR-OE-009 remain Must items outside the proposed sprints.** Do not call them done or silently remove them.
- The authenticated GitHub Project main view was opened and showed **0 matching items** across its workflow columns. It is empty. Jira remains the authoritative item backlog; do not mirror the 29 Jira issues as 29 new GitHub issues. A safe approach is to keep the project board empty until the team agrees on one GitHub summary/tracking item linking the Jira project, or to use the project README/description for the Jira link and leave individual Jira work in Jira.
- `rg --files` found no `.mp4`, `.webm`, `.mov`, `.mkv`, or `.gif` demo recording files in this repository. This only verifies the local repository contents; it cannot determine whether a video exists elsewhere. The assignment-required one-minute Sprint 1 and two-minute Sprint 2 videos still need to be recorded from the real product and uploaded by the team.

### Earlier pre-submission verification details — 13 October 2026

- From a clean temporary archive of branch commit `fd54d97`, `npm ci` completed with 184 packages; `npm test` passed **12/12** (9 workflow integration tests and 3 scoring tests); `npm run build` passed (server syntax checks and Vite production build). This validates the committed source and lockfile with a clean dependency installation.
- In the current `work/repo` checkout, `npm test` failed because the existing ignored `node_modules` tree is incomplete: 3 scoring tests passed, but the workflow test could not import `mongoose` because `node_modules/mongoose/index.js` is missing. `npm run build` passed server syntax checks but failed because the Vite executable is missing.
- An earlier non-saving npm dependency repair attempt failed with Windows `EPERM` writing to the user-level npm cache and `ENOENT`/`ENOTEMPTY` errors in the dependency tree. No tracked package manifest or lockfile changed. This was superseded by the later successful `npm.cmd ci`, tests, and build recorded above.
- The verification table below records the earlier successful run. The current-checkout results in the presentation-readiness rerun above supersede it for present status.

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

## Current Git verification — 24 October 2026

- Fetched `origin/main` is `88c21bcf2d887fcc9f5381e509523592167142bb`, the PR #28 merge commit. The merged feature tip and implementation commit are ancestors of this ref. The local follow-up branch `fix/question-correct-option-selection` is based on that ref and is not published.
- A fresh GitHub Actions run, current Jira statuses, and current Project board fields/access were not independently checked in this verification. The Jira and Project details below are dated historical snapshots and must not be treated as current without a live readback.
- The official Part 2 PDF was not present in the repository file listing; the supplied local PDF path was unavailable to this session. Assignment requirements beyond the repository's own documentation therefore remain unverified here.

## Project management status

### GitHub

- The local repo and feature branch preserve the original `main` history. The implementation and supporting documents are committed locally on `feature/mvp-exam-workflow`; see `git log` for exact hashes. No push, PR, merge, or remote configuration change has occurred.
- A repository-linked GitHub Project exists and is private: [Online Exam Portal — Software Engineering](https://github.com/users/chhavi2308-s/projects/1); repository association: [repository Projects tab](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/projects). Its configured fields include Status = Backlog, Ready, In Progress, In Review, Done; Priority = P0–P3; numeric Story Points; Sprint iterations; and custom Epic. The authenticated project main view was checked on 13 October and showed 0 matching items across all columns. Do not create duplicate issue records in GitHub; Jira is the authoritative backlog. Keep GitHub Project membership unchanged unless the owner explicitly approves invitations.
- The GitHub connector currently resolves to a different account: it lists no repositories for `chhavi2308-s` and exposes an unrelated repository under another owner. Do not use it for this project until reconnected to the correct account. The browser-authenticated Chhavi account remains able to view the project and repository.
- The local CI workflow is `.github/workflows/ci.yml` (`Node CI`), runs on PRs and pushes to `main`, installs with `npm ci`, runs tests and build, and grants `contents: read`. It has not run remotely.

### Jira — configured and verified 13 October 2026

- Project: [Online Exam Portal — Software Engineering (OEPSE)](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/summary). It is a Jira Software team-managed project on the confirmed personal site. Board: [OEPSE board (ID 70)](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70); backlog: [OEPSE backlog](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog). Live lookup confirms project key OEPSE, Chhavi S as lead, board linked, and zero matching issues before setup. The personal site was treated as the intended team site per the project lead’s instruction; no separate university site was verified.
- Created and read back 29 work items: 5 epics, 23 stories, 1 task. Issues OEPSE-1 through OEPSE-29 are present. All stories have an epic parent, requirement mapping, SRS priority, acceptance criteria, a provisional estimate, planned test references, and dependency notes. 32 `Blocks` links represent draft dependencies. All issues remain unassigned; Chhavi is confirmed Product Owner/team lead but is not assigned implementation tickets.
- The project board’s supported issue types include Epic, Story, Task, and Subtask. Story points use Jira’s “Story point estimate” field. SRS MoSCoW priorities are captured in descriptions and `srs-must`, `srs-should`, or `srs-could` labels; Jira’s native Priority remains its default Medium and should not be mistaken for MoSCoW. Existing board workflow columns are To Do, In Progress, and Done. No workflow was changed.
- Sprint 1: [board/backlog view](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog), `OEPSE Sprint 1`, 19–23 October 2026, 09:00–18:00 IST (chosen working-day boundaries because the assignment gives dates only), 9 items / 33 provisional points. Includes OE-01, OE-04, OE-05, OE-06, OE-09, OE-10, OE-12, OE-14, and T-01.
- Sprint 2: `OEPSE Sprint 2`, 26–30 October 2026, 09:00–18:00 IST, 8 stories / 45 provisional points: OE-02, OE-03, OE-11, OE-13, OE-18, OE-19, OE-20, and OE-23. Both sprints are future/not started; no capacity or velocity has been confirmed.
- Product backlog: OE-07, OE-08, OE-15, OE-16, OE-17, OE-21, and OE-22, totaling 30 provisional points. Must requirements deliberately outside the two proposed sprints: **FR-OE-024** (OE-15 / OEPSE-20, 5 points), **NFR-OE-004** (OE-21 / OEPSE-26, within an 8-point availability/backup/retention story), and **NFR-OE-009** (OE-22 / OEPSE-27, within a 5-point accessibility/browser story). At team planning, the Product Owner and team must decide whether capacity can be reserved, other scope reduced, or an instructor-approved deviation recorded. Do not silently drop these requirements.
- Verified issue counts and estimate totals by JQL and board sprint reads: 29 total; Sprint 1 33 points; Sprint 2 45 points; product backlog 30 points; 108 overall. The original CSV (outputs/jira-backlog-draft.csv) was preserved unchanged in the Codex workspace outside this repository. The proposal (outputs/jira-planning-proposal.md) also remains in that workspace and its execution update supersedes its earlier “not created” snapshot.
- Jira site/project access for the other three teammates has not been verified or granted. Add actual accounts through Jira’s project/site people controls after confirming identities and access policy. No teammate usernames were inferred. The project board is not proof that every teammate can see it.
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
- GitHub Project setup is verified, remains private, and has no backlog work items or additional project members. Jira OEPSE is now the authoritative backlog. Do not add people to the private GitHub Project without explicit approval; repo access does not automatically grant project access.
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
2. Rehearse the instructor and student demo flows using the disposable accounts; automated API tests pass, but the browser demo has not been freshly verified after dependency repair.
3. Confirm proposed task division and estimates with the four-person team; keep assignees empty until agreement and verified tracker identities.
4. Keep Jira OEPSE authoritative. The private GitHub Project is empty and unshared; do not add people without explicit approval. Link code commits and PRs to Jira keys.
5. Confirm all four teammates can access Jira OEPSE, then agree on issue ownership and capacity before assigning work or treating estimates as sprint commitments.
6. Dependency installation and automated tests/build now pass locally using `npm.cmd` (see the latest verification above). Use `npm.cmd run demo` and do not expose its temporary password.
7. Review and commit local feature-branch changes. Request separate approval before any push/PR/merge.
8. Record Sprint 1 and Sprint 2 demos from the actual running product; upload only the real recordings as assignment requires.

## Verified links and current manual actions

- [GitHub repository](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject) — code/PR/CI location; no push or PR was made in this setup.
- Jira [project](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/summary), [board](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70), and [backlog](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog). Jira issue keys OEPSE-1 through OEPSE-29 were read back. Board sprint IDs 70 and 71 are future sprints with the dates above.
- [GitHub Project](https://github.com/users/chhavi2308-s/projects/1) and its [main view](https://github.com/users/chhavi2308-s/projects/1/views/1) are verified and remain private. Jira is the authoritative backlog to avoid duplicate issues. No people were added to the private project.
- Source deliverables: [SRS PDF](../SRS/SRS_Online_Exam_Portal.pdf), [SAD](../SAD_Online_Exam_Portal_v1.4.docx), [STP PDF](../STP/Online_Exam_Portal_Software_Test_Plan_v1.1.pdf), [STRIDE table](../Architecture/Traceability%20to%20Requirements%20%26%20Security%20Architecture%20%E2%80%93%20STRIDE%20Table.xlsx), [design diagrams](../Design/diagrams/README.md).
