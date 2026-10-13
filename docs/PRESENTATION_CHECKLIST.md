# Online Exam Portal — presentation checklist

**Prepared:** 13 October 2026

**Repository branch:** `feature/mvp-exam-workflow`

**Presentation status:** Use only the verified claims below. The local dependency repair is blocked, so do not promise a live demo until the steps marked **Needs attention** are completed.

## Before presenting

- [ ] Close any terminals running this repository, then run `npm ci`, `npm test`, and `npm run build` in the repository root. See [test-execution.md](test-execution.md) for the Windows `EPERM` and exact safe retry. Do not remove the locked Rolldown file manually.
- [ ] Start `npm run demo` and check that `http://localhost:5173` opens and the API health check at `http://localhost:4000/api/health` returns `{"status":"ok"}`.
- [ ] Use only the freshly generated disposable demo credentials shown in that local terminal. Never put the password in slides, chat, screenshots, or committed files.
- [ ] If possible, rehearse the instructor and student flow using dummy data. Report only actions you personally observed; this audit did not freshly verify either browser workflow today.
- [ ] Open Jira [OEPSE](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/summary) and the [backlog](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog). The project has 29 issues; both proposed sprints are future and every issue remains To Do/unassigned.
- [ ] Open the private [GitHub Project](https://github.com/users/chhavi2308-s/projects/1/views/1). The main view showed zero matching items on 13 October. Explain that Jira is the authoritative backlog; do not imply the GitHub board contains Jira stories.
- [ ] Confirm screen sharing works and avoid showing local credential output or secret files.

## Suggested presentation sequence

1. **Purpose (15–20 seconds):** Explain that the system supports online MCQ exams and evaluation for the course project.
2. **Technology and scope (15–20 seconds):** React/Vite client, Node/Express API, MongoDB/Mongoose, npm workspaces. Describe this as an MVP slice, not full SRS compliance.
3. **Working product (60–90 seconds, only after fresh rehearsal):** Show the login screen, instructor subject/exam list, then log out and show student assigned exam, answer/save, submission, and result only if those exact actions work in the rehearsal. Use disposable generated accounts and demo data.
4. **Quality evidence (20–30 seconds):** State the latest actual-checkout results precisely: three scoring tests passed; workflow test loading failed because `mongoose` is missing; server syntax checks passed; production build failed because Vite is missing. Earlier clean-source run had 12 tests and build pass, but that is historical evidence, not the latest checkout result.
5. **Project management (20–30 seconds):** Show the 29-item Jira backlog and future sprint dates. Show the GitHub Project's configured board and clearly say it is empty.
6. **Limitations and next work (20–30 seconds):** Mention incomplete instructor authoring, account-management, analytics/export/notifications, accessibility/performance/reliability evidence, and the three Must requirements outside the proposed sprints: FR-OE-024, NFR-OE-004, NFR-OE-009.
7. **Close:** State the next team decisions: resolve the local Windows lock, rerun checks and demo, agree assignments/capacity, decide how to handle the three Must backlog items.

## Verified facts to use

- Local branch: `feature/mvp-exam-workflow`, eight commits ahead of `origin/main`; no push or pull request has been made.
- Latest current-checkout test/build results and the previous clean-source results are recorded separately in [test-execution.md](test-execution.md).
- Live Jira readback: 5 epics, 23 stories, 1 task (29 total); Sprint 1 has 9 issues / 33 provisional points; Sprint 2 has 8 / 45; backlog has 12 / 30; totals are provisional, and all items are unassigned.
- GitHub Project is private and configured, but empty in the verified main view. Jira remains the detailed backlog.
- The feature table and evidence are in [TEAM_HANDOVER.md](TEAM_HANDOVER.md) and [implementation-gap-register.md](implementation-gap-register.md). The project is not fully SRS-compliant.

## Known limitations / honest wording

- This audit could not reinstall dependencies or start a fresh demo because Windows returned `EPERM` unlinking the native Rolldown binary. Several Node processes could not be identified due to Windows access restrictions; none were terminated.
- The last live app smoke check was earlier on 13 October and checked only the app page and health endpoint. Chhavi previously reported instructor login and a subject display. A fresh student browser demonstration is not verified by this audit.
- The 12/12 automated test and production-build pass came from a clean temporary archive of committed source on an earlier run. The latest actual checkout did not pass those commands.
- Full registration, account recovery/administration, complete instructor authoring, analytics, export, notification, audit UI, and several quality requirements remain incomplete or unverified. See the traceability evidence before answering requirement-compliance questions.
- No demo video file was found in this repository. The assignment requires a one-minute Sprint 1 video and a two-minute Sprint 2 video. Record both from the actual working product and upload them to the repository yourself; neither exists here as a verified recording.
