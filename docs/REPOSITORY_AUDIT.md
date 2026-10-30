# Repository and Deliverable 2 audit

**Audit date:** 30 October 2026
**Repository:** [SE-Team-06/online-exam-portal-se-miniproject](https://github.com/SE-Team-06/online-exam-portal-se-miniproject)
**Local feature branch:** `feature/oepse-1-3-account-lifecycle`, based on `origin/main` at `c124fec354ee91fe746cf989b32ae6b1f07bacd9`.

This audit distinguishes live remote evidence from local verification and historical notes. The Part 1/Part 2 PDFs and the supplied template DOCX files were not present in this checkout, so the official assignment wording still needs a final cross-check against the submitted PDFs. Existing SRS, SAD, STP, RTM, and architecture/security documents remain the requirements sources of truth; no requirement was changed here.

## Repository state

- `origin` is the organization repository: `https://github.com/SE-Team-06/online-exam-portal-se-miniproject.git`.
- The checkout was refreshed from the canonical remote without deleting the earlier worktree or its changes. The original local audit edits were stashed intact on the prior branch before creating this review branch.
- The initial review branch was clean before audit edits; latest fetched `main` is merge commit `c124fec` (PR #59, 30 October). The local feature branch contains implementation and documentation changes for issues #1 and #3; it has not yet been pushed.
- Runtime available: Node v24.22.1. `npm` is absent from PATH; npm 12.2.1 was run from its official CLI package. Workspace-wide `npm ci` fails on Windows when creating npm's workspace symlink, so server and client dependencies were installed independently without changing the root lockfile.

## GitHub Project and issues

- The authenticated GitHub organization page now shows one project, **Online Exam Portal — Software Engineering**, at [SE-Team-06/projects/1](https://github.com/orgs/SE-Team-06/projects/1). It is organization-owned and private. The project exists, correcting the older 22 October screenshot that showed no organization or repository projects.
- This browser readback established project visibility to the signed-in Chhavi account, but the board itself could not be opened for a fresh item-level audit in this session. Do not infer that the backlog, views, assignments, dates, or repo linkage are correct from the project listing alone. A 25 October handover claimed it was repository-linked but had an empty backlog; that claim is historical until rechecked on the board.
- Current GitHub issue search showed two open issues, #1 (registration) and #3 (administrator management); most prior implementation backlog issues are closed. Issue closure is not by itself acceptance evidence. The remaining open scopes should be reviewed against SRS acceptance criteria and current code before being treated as sprint outcomes.
- Team login identities in older live issue records include `chhavi2308-s`, `DhanyaSPrasad`, `gagan-p` and `harshak5`; collaborator permission reads returned 403, so effective access for each person was not verifiable. No assignments or access changes were made.
- PR #59 was merged to `main`. The GitHub reviews endpoint returned no submitted review for that PR; its merge is verified, but the assignment's owner-review evidence is not. PR #14 and PR #13 are also merged. Do not claim owner review without a review record.

## CI and application

- `.github/workflows/ci.yml` runs on pushes and pull requests targeting `main`, uses Node 22, `npm ci`, `npm test`, and `npm run build`, and grants only `contents: read`.
- Recent Actions runs on 29–30 October include successful PR and push runs, including the latest `main` run for PR #59. One earlier 29 October `main` push run failed; a subsequent run passed. The workflow is active and current latest success is verified, but the failed run's cause has not been documented here.
- The application uses React/Vite, Express, MongoDB/Mongoose, and npm workspaces. Package scripts include `test`, `build`, `coverage`, and `check:a11y`. Source presence is not proof of complete workflows or SRS compliance.
- The current checkout contains `SE miniproject.mp4` (17,745,589 bytes; MP4 metadata duration 74.63 seconds) and `Sprint2_Demo.mp4` (1,595,079 bytes; metadata duration 115.04 seconds). This is consistent with approximately one- and two-minute videos. Playback, upload/availability to the instructor, and whether each demonstrates the required product behavior have not yet been validated.

## Jira and schedule

- No Jira connector is available in this session, so the current OEPSE-1 through OEPSE-29 records, story points, assignees, sprint membership, and mapping to GitHub items could not be refreshed. Prior Jira figures in handover documents are historical only, not current status.
- Sprint 1 dates were 19–23 October 2026; Sprint 2 dates are 26–30 October 2026. Today is the final scheduled Sprint 2 day. No sprint completion is inferred from issue closures or current date.
- Do not fabricate team contributions, PR reviews, sprint outcomes, or demo evidence. Record actual status and deviations after tracker and product review.

## Assigned issue work continued locally

- Issues #1 and #3 are currently assigned to `chhavi2308-s`; both remain open.
- Local, unmerged work for #3 adds administrator user listing, creation, profile/role/password updates, activation/deactivation, CSRF and role guards, session revocation, a management panel, and an audit-log view. Email changes are read-only until a verified email-change flow exists.
- Local, unmerged work for #1 adds student registration, hashed 24-hour email-verification tokens, one-time hashed 30-minute password-reset tokens, rate limiting, configurable SMTP delivery, and account forms. Tests use an injected mail transport; real SMTP delivery has not been verified.
- The Mongo-backed integration files could not run locally because MongoDB Memory Server requested an uncached 781 MB Windows binary. Server syntax checks pass. Client unit tests pass 17/17 and the Vite production build passes. Full server tests and workspace CI remain to be verified by GitHub Actions.
- Neither issue is ready to close until the PR is reviewed and merged and required evidence is complete. Issue #1 needs SMTP delivery validation; issue #3 needs remaining audit-event/retention review.

## Remaining verification

1. Open the organization project board and verify its linked repository, item count, estimates, priorities, views, sprint periods, assignees, and visibility.
2. Reconcile each Jira item with existing GitHub issues and SRS IDs; preserve existing Jira structure and do not duplicate issues.
3. Confirm all team logins and effective repository/project access before making assignments or changing permissions.
4. Verify full server integration tests and workspace build in GitHub Actions; validate SMTP delivery and expiry links in a controlled environment; review the admin workflows in a browser with disposable data.
5. Validate both MP4 durations and content; record additional evidence only if actual behavior can be demonstrated.
6. Cross-check Part 1/Part 2 requirements against the submitted PDFs, which are not present in this workspace.
