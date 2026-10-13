# Repository audit

Audit date: 13 October 2026. This report describes the existing clone and current local work on `feature/mvp-exam-workflow`; it does not claim remote changes.

## Git state

- Existing repository: `https://github.com/chhavi2308-s/online-exam-portal-se-miniproject.git`; clone retained in the workspace and original history preserved.
- Feature branch was created from original `main` at `a83639eed69e604d3b13413b131075b489c7569c` (`Update test plan and test cases`); original `main`/`origin/main` were not changed.
- Authorized implementation/documentation work is committed locally on the feature branch. No push, PR, merge, history rewrite, or remote-setting change has been performed.
- Original SRS, SAD, STP, RTM, STRIDE, and design files were preserved. RTM workbook was intentionally updated to carry evidence-based implementation statuses and an `Implementation Evidence` sheet.

## Stack and source

- MERN-compatible stack specified by SRS: React/Vite client, Node.js/Express API, MongoDB/Mongoose persistence; npm workspaces and lockfile.
- Entry points: `client/src/main.jsx`, `server/src/index.js`, `server/src/app.js`; disposable demo: `server/src/demo.js`.
- `.env.example` holds local placeholders only; `.env`, dependencies, build output, test cache and generated logs are ignored.
- Local CI: `.github/workflows/ci.yml` runs locked install, tests, and build with read-only contents permission on PRs and pushes to `main`.

## Implementation and verification

- Implemented slice: provisioned-account authentication and sessions, role/CSRF/origin controls, question/exam APIs, assignment, timed attempt/answer persistence/resume, manual/automatic submission, scoring, student-owned results, selected audit events, and a student-focused UI.
- Instructor authoring UI, registration/verification/reset, full administrator workflows, analytics/export/notifications, question shuffle/edit lock, production operations, and several other requirements are incomplete or absent. Detailed evidence is in `implementation-gap-register.md` and the RTM evidence sheet.
- User reported a manual local check: instructor login succeeded and a subject was visible. The locally verified smoke test is limited to API health HTTP 200 and web root HTTP 200.
- On 13 October 2026, `npm test` passed 12/12 (9 API integration and 3 scoring tests); `npm run build` passed server syntax checks and Vite production build.
- `npm ci --offline --dry-run` passed. The latest actual offline reinstall failed with Windows EPERM unlinking a native Rolldown module; an earlier actual offline install succeeded. Workflow YAML parsed, but no remote Actions run occurred.
- The latest focus-event test verifies persisted timestamp. SEC-OE-010 rate limit is configured as 10 requests/IP/minute; 429/window behavior remains untested.

## Requirements/documentation

- The submitted SRS contains 27 FR, 14 NFR and 12 SEC requirements (53 unique IDs). SRS remains primary. No requirement is marked fully complete based solely on partial code; see `SRS/RTM_Online_Exam_Portal.xlsx` > `Implementation Evidence`.
- Test execution documents local implementation tests, not completion of the approved STP. Submitted SRS/SAD/STP and diagrams were preserved; SRS v1.2/SAD v1.4 related-document version mismatch and API/design conformance remain review items.
- Official assignment requires a repository-linked GitHub Project, two official sprint dates (19–23 Oct and 26–30 Oct 2026), CI, and real Sprint 1/2 demo videos. The GitHub connector must be connected before existing project search or board setup can be verified.

## GitHub/Jira status and blockers

- GitHub auth and read access were verified earlier against the existing remote; the existing repo was cloned with history. No code was pushed.
- Atlassian read-only search found four visible projects, four boards and 24 issues, with no Online Exam Portal/Team 6 match. Site available: `https://chhavis0823.atlassian.net`. This does not establish that it is the intended shared course site. Project-key `OEP` availability/project-create permission could not be confirmed through the available project-creation operation; no Jira write was made.
- Draft planning files remain at workspace `outputs/jira-planning-proposal.md` and `outputs/jira-backlog-draft.csv`. Verified totals: 5 epics, 23 stories, 1 task, 108 provisional points; Sprint 1 33, Sprint 2 45, backlog 30. FR-OE-024, NFR-OE-004, and NFR-OE-009 remain Must items outside the proposed sprints.
- Team 6 names are Chhavi Siddarth Wadhwa, Dhanya S Prasad, Gagan P, and Harsha K. Chhavi is the confirmed Team Lead/Product Owner. Other individual assignments and tracker identities remain unconfirmed.

## Risks and next work

1. Connect GitHub in Codex, search for an existing repo-linked Project, then configure/create only if destination and no-duplicate status are verified.
2. Confirm the intended Jira site and obtain a verifiable Jira project creation path/permission before making Jira items.
3. Rerun `npm ci` after ensuring no process holds the native Rolldown file; rerun tests/build afterward.
4. Team review of estimates and Must backlog; implement remaining prioritized requirements and expand test coverage.
5. Confirm user/team task allocation; record actual demo videos; do not claim full SRS completion until evidence supports it.
