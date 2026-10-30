# Online Exam Portal — Team Handover

## Current state refresh — 30 October 2026

- Canonical organization repository: `SE-Team-06/online-exam-portal-se-miniproject`. PR #60 is merged; fetched `main` is `4d599af441ab352829007a1d6a61e49dba068895`. Follow-up work is on `fix/sprint2-account-acceptance-audit`, based on that commit. No merge or issue closure is claimed.
- GitHub organization Projects listing shows **Online Exam Portal — Software Engineering** at `https://github.com/orgs/SE-Team-06/projects/1`. A fresh item-level board check was not completed, so linkage, backlog contents, views, fields, dates, and assignments still need confirmation.
- GitHub Actions is configured for pushes and PRs to `main`, with `npm ci`, tests, and build. Recent runs include successful PR and push checks through the PR #59 merge. A 29 October failure also exists; inspect it before describing the workflow as consistently green.
- The checkout contains `SE miniproject.mp4` (MP4 metadata 74.63 seconds) and `Sprint2_Demo.mp4` (115.04 seconds), consistent with approximately one- and two-minute durations. Playback and actual demonstrated behavior are not yet validated.
- Node 24 is present; npm is absent from PATH. Root `npm ci` through available npm 12.2.1 failed with Windows `EPERM` creating the workspace symlink. Independent server/client dependency installs succeeded. Server source/test syntax checks pass; client tests pass 17/17 and the production build passes. Focused server suites could not start because the downloaded MongoDB Memory Server archive failed its MD5 integrity check. Do not disable this check or weaken Windows security.
- Follow-up work adds attempt submission IP capture and retry preservation, explicit `null` when no request IP is available, audit write IP validation, result-access audit events, role-change audit detail, and a live MongoDB TTL-index assertion. Tests were added for each. The Mongo-backed tests have not passed yet because of the binary integrity failure. Real SMTP delivery is blocked until staging configuration is available. Issues #1 and #3 remain open pending passing CI, independent owner review, SMTP evidence for #1, and acceptance review for #3.
- The submitted assignment PDFs and template files were not available in this checkout. The existing SRS/SAD/STP and historical evidence remain authoritative pending a final cross-check against those PDFs. Jira could not be refreshed in this session; older Jira totals and sprint records are historical, not current.
- Team member GitHub logins are visible in issue history, but effective access could not be verified. Do not make new assignments or permission changes based on inferred identities.
- See [REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md) for a current evidence-based status and remaining verification.

**As of:** 25 October 2026
**Course:** Software Engineering (UE24CS341A), PES University
**Team:** 6
**Confirmed Product Owner/team lead:** Chhavi Siddarth Wadhwa

This handover describes the current local implementation and project setup. The submitted SRS remains the source of truth. The working demo is an MVP slice; it does not mean the full SRS is complete.

## Project and repository

The project is a browser-based multiple-choice online examination portal with student, instructor, and administrator roles, as specified in the SRS. The canonical repository is [SE-Team-06/online-exam-portal-se-miniproject](https://github.com/SE-Team-06/online-exam-portal-se-miniproject).

The implementation uses React and Vite for the web client, Node.js/Express for the API, MongoDB/Mongoose for data, and npm workspaces. Authenticated GitHub browser inspection on 25 October verified PR #34 merged into `main` at `58b988be87a174127c9201a5e3696281a1bcb553`; its source commit is `e00844256cf35969c80255d6d86bc16d78468dec`. GitHub's `main` commit list showed that merge at the top. Local `origin/main` remains cached at `f2ed5186eda44197104a30ae44cf2e6e3fd2e2e9` because `git fetch` failed with `SEC_E_NO_CREDENTIALS`; do not treat that cache as current. PR #34 displayed one passing check. This establishes merge/check state, not manual product acceptance. The project remains an MVP, not full SRS compliance.

## What exists now

### Implemented in the local source

- Provisioned-account login, password hashing, server sessions, role checks, CSRF/origin controls, and login throttling/lockout.
- Instructor APIs to create MCQs and create, publish, and assign exams.
- Student assigned-exam listing, one-attempt start/resume, answer saving/flagging, manual submission, server-side scoring, expiry auto-submit, and student-owned result lookup.
- Focus-loss event endpoint with persisted timestamps and selected audit records.
- React login, student exam flow/result view, instructor question-bank create/edit/delete, and instructor exam configure/publish/assign/edit views are represented in the current GitHub `main` history by PRs #28–#34. The authenticated browser confirms #34 merged at `58b988b`; its source commit `e008442` adds owner-scoped exam edits, question/student reference validation, and locks settings after attempts start. Automated tests cover these server paths. No browser acceptance walkthrough has been performed.
- Temporary demo with disposable MongoDB, seeded instructor/student accounts, and one short sample exam.

### What was observed

- **User-reported manual check:** Chhavi opened the local demo, logged in as the instructor, and saw a subject. No additional manual feature verification is implied.
- **Automated verification on 25 October:** on `feature/issue-5-exam-lifecycle` at `e008442`, `npm.cmd test` passed 32/32; `npm.cmd run build` passed server syntax checks and the Vite production build. PR #34 was subsequently verified merged in the signed-in browser. Tests do not replace browser acceptance.
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
| FR-OE-007/008/011 question/exam setup and assignment | Partial | Question management and exam configuration/locking are merged through PRs #32 and #34; automated tests cover ownership, validation, assignment and locking. Browser acceptance remains unverified. There is no separate draft/publish lifecycle. |
| FR-OE-013–020 assigned exam/attempt/save/submit | Partial | Core server paths exist; complete timer, autosave, confirmation and recovery acceptance remains. |
| FR-OE-021 focus monitoring | Partial | API persists focus-loss timestamps; browser tracking and instructor report are absent. |
| FR-OE-022/023 evaluation and result | Partial | Representative server scoring and student result path exist; release/review behavior is incomplete. |
| FR-OE-001/002/005/006 registration, verification, reset, admin | Not started | No supported implementation identified. |
| FR-OE-009/010/012 exam options/edit lock | Partial | Exam configuration lock is merged in PR #34 and tested. Shuffling is not implemented despite closed Issue #15. Negative-marking schema/API/UI and scoring logic exist, but Issue #16 remains open and its pre-publication/fixed-published-setting and end-to-end criteria are not all verified. |
| FR-OE-024/025/026/027 analytics, export, notices, audit UI | Partial | Selected audit events exist; analytics/export/notifications/admin audit UI are not implemented. |
| NFR-OE-001–009, 011, 013–014 | Not started | No complete performance, availability, recovery, accessibility, compatibility, scale, portability, or retention acceptance evidence. |
| NFR-OE-010, NFR-OE-012 | Partial | Server time is used for attempt deadlines, but displayed-clock tolerance is not measured; modular source and tests exist, but 70% business-logic coverage is not measured. |
| SEC-OE-001–012 | Partial | Some password, session, role, CSRF, answer-confidentiality, ownership, and rate-limit controls exist; the full evidence and operating requirements are incomplete. See RTM evidence sheet. |

Detailed gaps and risks are in [implementation-gap-register.md](implementation-gap-register.md). The submitted SRS, SAD, STP, STRIDE table, and diagrams are preserved. The RTM has been updated with evidence/status and is not an approval to revise the approved SRS/SAD/STP.

## Verification record

### Presentation-readiness verification — 13 October 2026 (historical baseline)

- User-reported `npm.cmd ci` completed in this checkout (184 packages added, 187 audited, 0 vulnerabilities). The PowerShell `npm` command selected blocked `npm.ps1`; using `npm.cmd` worked without changing execution policy.
- Independently reran `npm.cmd test` and `npm.cmd run build` from this repository on `feature/mvp-exam-workflow`: **12/12 tests passed** (9 workflow integration and 3 scoring; 0 failed/skipped); server syntax checks passed; Vite production build passed (15 modules; JS 227.05 kB / 71.03 kB gzip, CSS 5.13 kB / 1.71 kB gzip).
- The earlier Windows `EPERM` while unlinking the Rolldown binary was resolved by the user’s later successful `npm.cmd ci`. No native binary was manually deleted and no machine-wide execution policy was changed.
- The demo was not freshly started after dependency repair. Earlier `/api/health` and `/` smoke checks returned HTTP 200, and Chhavi separately reported logging in to the instructor and seeing a subject. A fresh student browser workflow remains unverified today; automated API workflow tests are not proof of the full live UI path.
- Historical Jira readback on 13 October recorded 29 items (5 epics, 23 stories, 1 task): proposed Sprint 1 (9 items / 33 provisional points), Sprint 2 (8 stories / 45 provisional points), and backlog (12 items / 30 provisional points). That readback said the items were unassigned and both sprints had not started at that time. These are historical planning facts, not current Jira statuses or confirmed current totals. **FR-OE-024, NFR-OE-004, and NFR-OE-009 were recorded as Must items outside the proposed sprints.** Refresh Jira before reporting present sprint completion, points, assignments, or blockers.
- The authenticated GitHub Project main view showed **0 matching items** at that historical inspection. A later 25 October browser inspection found the organization-owned Project and its views/workflows load; the Prioritized backlog view's saved Sprint 1 filter showed zero matches. Neither observation establishes that the whole board is empty or that all work is complete. Jira remains the authoritative detailed backlog; avoid duplicating Jira stories as GitHub issues.
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

## GitHub and local Git verification — 25 October 2026

- Local branch at audit start: clean `feature/issue-5-exam-lifecycle` at `e00844256cf35969c80255d6d86bc16d78468dec`; cached tracking branch matched. `origin/main` cache was `f2ed5186eda44197104a30ae44cf2e6e3fd2e2e9`. Fetch failed with `SEC_E_NO_CREDENTIALS`; no local ref was updated.
- Authenticated browser verification: PR #34 is merged into `main` at `58b988be87a174127c9201a5e3696281a1bcb553`; GitHub's main commits page shows `e008442` followed by merge `58b988b`. PR #34 shows 1/1 check passed and closes #5. This supersedes the stale cached `origin/main` ancestry result.
- Live GitHub Issues page on 25 October showed 16 open and 8 closed (24 total), differing from the earlier user-supplied snapshot of 26. Live Jira was not accessible; its status/points/iteration state below remains historical. No browser product walkthrough was performed.
- The official Part 2 PDF was not present in the repository file listing; the supplied local PDF path was unavailable to this session. Assignment requirements beyond the repository's own documentation therefore remain unverified here.

## Project management status

### GitHub — browser readback 25 October 2026

- Live repository issue page: 16 open, 8 closed. Closed items include #2, #4, #5, #7, #11, #15, #17 and #26; open items are #1, #3, #6, #8, #9, #10, #12, #16, #18–#25. See the issue review below; a closed state alone is not proof of acceptance.
- Organization project [Online Exam Portal — Software Engineering](https://github.com/orgs/SE-Team-06/projects/1) is accessible under SE-Team-06. Its views and workflows load. The Prioritized backlog view has a saved Sprint 1 filter and showed 0 matching items during this inspection; this is not evidence that all issues are done. The personal project remains a separate backup. Do not infer Jira state or change project data from this view.
- PR #34 is merged; its page showed one passing check. The local `.github/workflows/ci.yml` runs on PRs and pushes to `main`, installs with `npm ci`, tests/builds, grants `contents: read`, and does not deploy or auto-merge. Current Actions run details beyond PR #34's summary were not reviewed.

### Jira — historical readback, 13 October 2026 (not refreshed)

- Project: [Online Exam Portal — Software Engineering (OEPSE)](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/summary). It is a Jira Software team-managed project on the confirmed personal site. Board: [OEPSE board (ID 70)](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70); backlog: [OEPSE backlog](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog). Live lookup confirms project key OEPSE, Chhavi S as lead, board linked, and zero matching issues before setup. The personal site was treated as the intended team site per the project lead’s instruction; no separate university site was verified.
- Created and read back 29 work items: 5 epics, 23 stories, 1 task. Issues OEPSE-1 through OEPSE-29 are present. All stories have an epic parent, requirement mapping, SRS priority, acceptance criteria, a provisional estimate, planned test references, and dependency notes. 32 `Blocks` links represent draft dependencies. All issues remain unassigned; Chhavi is confirmed Product Owner/team lead but is not assigned implementation tickets.
- The project board’s supported issue types include Epic, Story, Task, and Subtask. Story points use Jira’s “Story point estimate” field. SRS MoSCoW priorities are captured in descriptions and `srs-must`, `srs-should`, or `srs-could` labels; Jira’s native Priority remains its default Medium and should not be mistaken for MoSCoW. Existing board workflow columns are To Do, In Progress, and Done. No workflow was changed.
- Sprint 1: [board/backlog view](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog), `OEPSE Sprint 1`, 19–23 October 2026, 09:00–18:00 IST (chosen working-day boundaries because the assignment gives dates only), 9 items / 33 provisional points. Includes OE-01, OE-04, OE-05, OE-06, OE-09, OE-10, OE-12, OE-14, and T-01.
- Sprint 2: `OEPSE Sprint 2`, 26–30 October 2026, 09:00–18:00 IST, 8 stories / 45 provisional points: OE-02, OE-03, OE-11, OE-13, OE-18, OE-19, OE-20, and OE-23. Both sprints are future/not started; no capacity or velocity has been confirmed.
- Product backlog: OE-07, OE-08, OE-15, OE-16, OE-17, OE-21, and OE-22, totaling 30 provisional points. Must requirements deliberately outside the two proposed sprints: **FR-OE-024** (OE-15 / OEPSE-20, 5 points), **NFR-OE-004** (OE-21 / OEPSE-26, within an 8-point availability/backup/retention story), and **NFR-OE-009** (OE-22 / OEPSE-27, within a 5-point accessibility/browser story). At team planning, the Product Owner and team must decide whether capacity can be reserved, other scope reduced, or an instructor-approved deviation recorded. Do not silently drop these requirements.
- Verified issue counts and estimate totals by JQL and board sprint reads: 29 total; Sprint 1 33 points; Sprint 2 45 points; product backlog 30 points; 108 overall. The original CSV (outputs/jira-backlog-draft.csv) was preserved unchanged in the Codex workspace outside this repository. The proposal (outputs/jira-planning-proposal.md) also remains in that workspace and its execution update supersedes its earlier “not created” snapshot.
- Jira site/project access for the other three teammates has not been verified or granted. Add actual accounts through Jira’s project/site people controls after confirming identities and access policy. No teammate usernames were inferred. The project board is not proof that every teammate can see it.
## Proposed two-sprint plan (historical proposal; refresh before execution)

Official dates from the assignment:

- **Sprint 1: planned 19–23 October 2026.** Historical proposal: `T-01`, `OE-01`, `OE-04`, `OE-05`, `OE-06`, `OE-09`, `OE-10`, `OE-12`, `OE-14` — 33 provisional points. The proposed dependency chain was setup → authentication → question/exam configuration → assignment → attempt → submit/result. The date range has passed; whether the sprint started, completed, or changed is unverified because Jira was not accessible during the 25 October audit.
- **Sprint 2: planned 26–30 October 2026.** Historical proposal: `OE-02`, `OE-03`, `OE-11`, `OE-13`, `OE-18`, `OE-19`, `OE-20`, `OE-23` — 45 provisional points. The plan depends on an integrated Sprint 1 baseline. Treat membership, estimates, dates, dependencies, and capacity as unconfirmed until read back from Jira and agreed by the team.
- **Historical product backlog proposal:** `OE-07`, `OE-08`, `OE-15`, `OE-16`, `OE-17`, `OE-21`, and `OE-22` (30 provisional points). The earlier plan recorded Must requirements outside those two sprints: **FR-OE-024** (OE-15 / OEPSE-20), **NFR-OE-004** (OE-21 / OEPSE-26), and **NFR-OE-009** (OE-22 / OEPSE-27). Recheck the current backlog and team decision; do not treat these old estimates or placements as current.

The only confirmed responsibility is Chhavi as Product Owner/team lead. No other role or individual task assignment has been approved. The following is a **proposed balanced division for team discussion**, not an assignment:

| Teammate | Proposed focus (not approved) | Deliverable / acceptance idea | Dependency |
|---|---|---|---|
| Chhavi Siddarth Wadhwa — confirmed Team Lead/Product Owner | Prioritize backlog, resolve scope, integrate demo, review acceptance | Approved priorities and integrated demo satisfy agreed acceptance criteria; decide how Must backlog is handled | Team agreement and issue board access |
| Dhanya S Prasad — proposed | Student workflow and usability/accessibility checks | Student assigned-exam, attempt, and result path verified against stories; document keyboard/mobile findings | Stable API and test accounts |
| Gagan P — proposed | Backend exam lifecycle, validation, scoring and access controls | Focused API changes with positive/negative automated tests and linked requirement IDs | Agreed story/API contract |
| Harsha K — proposed | Test execution, RTM evidence, CI and documentation quality | Test evidence accurately records actual results; RTM/gap entries link to implemented behavior | Merged/reviewable features and shared environment |

Confirm or change this proposal as a team before assigning people in a tracker. Do not use names as Jira/GitHub identities until the actual accounts and agreement are verified.

## Remaining work and known limitations

### Sprint 1 wrap-up and Sprint 2 readiness — 25 October 2026

The Jira item identifiers above are from the historical proposal; their live acceptance criteria and current issue states were unavailable. The classifications below assess local evidence only, not GitHub/Jira closure:

| Sprint 1 work area | Local assessment | Evidence and remaining action |
|---|---|---|
| Authentication and role checks | Implemented; automated behavior locally verified; manual acceptance incomplete | Server workflow tests passed. Complete a real instructor/student browser walkthrough and check exact story criteria. |
| Instructor question bank | Merged; automated tests passed; manual acceptance incomplete | PR #32 and the Issue #4 closure are browser-verified. Question CRUD and owner/reference safeguards have automated coverage. A product browser walkthrough remains outstanding. |
| Exam creation/configuration and post-attempt locking | Merged; automated tests passed; manual acceptance incomplete | PR #34 merged `e008442` to `main` at `58b988be87a174127c9201a5e3696281a1bcb553`; GitHub showed one passing check and Issue #5 closed. The local `origin/main` cache is stale because fetch failed; do not use it to assess current ancestry. |
| Student assigned exams, attempt, submit, scoring, and results | Merged; automated coverage; browser acceptance incomplete | PRs #29 and #33 are browser-verified merged; workflow tests cover core API paths. Rehearse the actual product flow and confirm each story's acceptance evidence. |
| CI and team-member PR/review requirements | Partially verified | PR #34 showed one passing check. Full Actions history, teammate authorship/assignment, and required reviewer identity were not checked. |
| Required Sprint 1 video | Incomplete in this repository | No `.mp4`, `.webm`, `.mov`, `.mkv`, or `.gif` was found locally on 25 October. Team must record and upload the real one-minute demo if it is not already stored elsewhere. |

**Minimum Sprint 1 closeout:** refresh Jira sprint membership, estimates, owners, and statuses; perform the product browser walkthrough; verify required teammate PR/reviewer evidence and relevant Actions runs; locate or record the actual Sprint 1 video. PR #34's merge and closed Issue #5 are already confirmed in GitHub, but they do not replace product acceptance evidence.

**Sprint 2 preparation:** first verify current Jira Sprint 2 membership, estimates, owners, and dependencies; then agree capacity and carryovers with the team. The historical eight-story/45-point proposal is not a current Jira readback. The 25 October GitHub issue snapshot suggests a provisional crosswalk: #1 (OEPSE-7, 5), #3 account-lifecycle scope (OEPSE-8, 3), #17 (OEPSE-16, 8), #18 (OEPSE-18, 3), #20 (OEPSE-24, 8), #21 (OEPSE-23, 5), #22 (OEPSE-25, 8), and #25 (OEPSE-28, 5). This sums to 45 only if the closed #17 is accepted as planned work, OEPSE-23 is counted once despite overlap in #3, and historical estimates still hold. Confirm all of that in Jira with the team before treating this as Sprint 2 scope. Question/option shuffling is unimplemented despite closed #15; negative marking is partially evidenced while #16 remains open; timer/recovery, audit, account, accessibility, availability, and analytics requirements also need acceptance-level evidence.

- Finish the instructor UI and remaining account lifecycle/administration features only as prioritized from the SRS.
- Implement and test remaining Must requirements; notably FR-OE-024, NFR-OE-004 and NFR-OE-009 are outside the draft sprints.
- Complete the test plan execution matrix and add missing positive/negative, timer-boundary, authorization, and NFR evidence. Keep unexecuted statuses blocked/not run.
- Review the SAD API references against actual routes and resolve the SRS v1.2/SAD v1.4 related-document version mismatch with team approval; do not silently edit submitted documents.
- Confirm login rate-limit behavior via a 429 test, lockout duration, timer drift, autosave cadence, and broader security cases.
- Decide a safe shared environment, durable database/deployment, HTTPS, backup, monitoring and operational secrets approach before any production claim.
- The organization-owned GitHub Project at `https://github.com/orgs/SE-Team-06/projects/1` was accessible in the 25 October browser check; the prioritized backlog view's Sprint 1 filter showed zero matches. Project access for every teammate and total board completeness were not verified. Jira OEPSE remains the detailed backlog; repository access does not automatically grant Project access.
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
4. Keep Jira OEPSE authoritative for detailed backlog. The organization-owned Project is accessible, but its complete contents and each teammate's access were not verified; confirm both before relying on it for team tracking. Link code commits and PRs to Jira keys.
5. Confirm all four teammates can access Jira OEPSE, then agree on issue ownership and capacity before assigning work or treating estimates as sprint commitments.
6. Dependency installation and automated tests/build now pass locally using `npm.cmd` (see the latest verification above). Use `npm.cmd run demo` and do not expose its temporary password.
7. Review and commit local feature-branch changes. Request separate approval before any push/PR/merge.
8. Record Sprint 1 and Sprint 2 demos from the actual running product; upload only the real recordings as assignment requires.

## Verified links and current manual actions

- [GitHub repository](https://github.com/SE-Team-06/online-exam-portal-se-miniproject) — canonical organization repository; PRs #29–#34 are browser-verified merged as summarized above.
- Jira [project](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/summary), [board](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70), and [backlog](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog). Jira issue keys OEPSE-1 through OEPSE-29 were read back. Board sprint IDs 70 and 71 are future sprints with the dates above.
- Organization-owned [GitHub Project](https://github.com/orgs/SE-Team-06/projects/1) — accessible in the 25 October browser check. The personal [Project backup](https://github.com/users/chhavi2308-s/projects/1) remains separate. Jira is still the authoritative detailed backlog; full board contents and per-member Project access were not verified.
- Source deliverables: [SRS PDF](../SRS/SRS_Online_Exam_Portal.pdf), [SAD](../SAD_Online_Exam_Portal_v1.4.docx), [STP PDF](../STP/Online_Exam_Portal_Software_Test_Plan_v1.1.pdf), [STRIDE table](../Architecture/Traceability%20to%20Requirements%20%26%20Security%20Architecture%20%E2%80%93%20STRIDE%20Table.xlsx), [design diagrams](../Design/diagrams/README.md).
