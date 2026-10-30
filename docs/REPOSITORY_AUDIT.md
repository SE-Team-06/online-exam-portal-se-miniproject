# Repository and Deliverable 2 audit

**Audit date:** 30 October 2026
**Repository:** [SE-Team-06/online-exam-portal-se-miniproject](https://github.com/SE-Team-06/online-exam-portal-se-miniproject)
**Verified `main`:** `4d599af441ab352829007a1d6a61e49dba068895` (PR #60 merged). **Follow-up branch:** `fix/sprint2-account-acceptance-audit`, based on that fetched commit.

This audit distinguishes live remote evidence from local verification and historical notes. The Part 1/Part 2 PDFs and the supplied template DOCX files were not present in this checkout, so the official assignment wording still needs a final cross-check against the submitted PDFs. Existing SRS, SAD, STP, RTM, and architecture/security documents remain the requirements sources of truth; no requirement was changed here.

## Repository state

- `origin` is the organization repository: `https://github.com/SE-Team-06/online-exam-portal-se-miniproject.git`.
- PR #60 is verified merged to `main` at `4d599af`; this supersedes the older PR #59 / `c124fec` snapshot below. Existing branches and history were preserved.
- Runtime available: Node v24.22.1. `npm` is absent from PATH. Root `npm ci` invoked through the locally available npm 12.2.1 CLI failed with Windows `EPERM` while creating the npm workspace symlink. Server and client dependencies were then installed independently without changing package manifests or lockfiles.

## GitHub Project and issues

- The authenticated GitHub organization page now shows one project, **Online Exam Portal — Software Engineering**, at [SE-Team-06/projects/1](https://github.com/orgs/SE-Team-06/projects/1). It is organization-owned and private. The project exists, correcting the older 22 October screenshot that showed no organization or repository projects.
- This browser readback established project visibility to the signed-in Chhavi account, but the board itself could not be opened for a fresh item-level audit in this session. Do not infer that the backlog, views, assignments, dates, or repo linkage are correct from the project listing alone. A 25 October handover claimed it was repository-linked but had an empty backlog; that claim is historical until rechecked on the board.
- Current GitHub issue search showed two open issues, #1 (registration) and #3 (administrator management); most prior implementation backlog issues are closed. Issue closure is not by itself acceptance evidence. The remaining open scopes should be reviewed against SRS acceptance criteria and current code before being treated as sprint outcomes.
- Team login identities in older live issue records include `chhavi2308-s`, `DhanyaSPrasad`, `gagan-p` and `harshak5`; collaborator permission reads returned 403, so effective access for each person was not verifiable. No assignments or access changes were made.
- PR #59 was merged to `main`. The GitHub reviews endpoint returned no submitted review for that PR; its merge is verified, but the assignment's owner-review evidence is not. PR #14 and PR #13 are also merged. Do not claim owner review without a review record.

## CI and application

- `.github/workflows/ci.yml` runs on pushes and pull requests targeting `main`, uses Node 22, `npm ci`, `npm test`, and `npm run build`, and grants only `contents: read`.
- The workflow is configured for pushes and pull requests to `main`. PR #60's checks were reported successful in the prior remote audit; no check result is claimed for this unpushed follow-up branch.
- The application uses React/Vite, Express, MongoDB/Mongoose, and npm workspaces. Package scripts include `test`, `build`, `coverage`, and `check:a11y`. Source presence is not proof of complete workflows or SRS compliance.
- The current checkout contains `SE miniproject.mp4` (17,745,589 bytes; MP4 metadata duration 74.63 seconds) and `Sprint2_Demo.mp4` (1,595,079 bytes; metadata duration 115.04 seconds). This is consistent with approximately one- and two-minute videos. Playback, upload/availability to the instructor, and whether each demonstrates the required product behavior have not yet been validated.

## Jira and schedule

- No Jira connector is available in this session, so the current OEPSE-1 through OEPSE-29 records, story points, assignees, sprint membership, and mapping to GitHub items could not be refreshed. Prior Jira figures in handover documents are historical only, not current status.
- Sprint 1 dates were 19–23 October 2026; Sprint 2 dates are 26–30 October 2026. Today is the final scheduled Sprint 2 day. No sprint completion is inferred from issue closures or current date.
- Do not fabricate team contributions, PR reviews, sprint outcomes, or demo evidence. Record actual status and deviations after tracker and product review.

## Sprint 2 acceptance follow-up — 30 October 2026

- Issues #1 and #3 are currently assigned to `chhavi2308-s`; both remain open.
- The follow-up branch adds trusted request-IP capture to attempt submission and pending-audit recovery, preserves `null` when no student request IP exists, validates IPs for audit writes, and logs result access. It also enriches admin role-change audit details and tests live MongoDB TTL indexes instead of schema declarations alone.
- Focused test coverage was added for manual/automatic submission IP, retry recovery, unavailable IP, result-access audit, role-change audit, and database TTL indexes. The Mongo-backed suites could not start: the MongoDB Memory Server archive failed its published MD5 check. This is an environment/integrity failure; those tests are unverified, not passed.
- Verified locally: Node syntax checks pass for the changed server source and tests; client tests pass 17/17; Vite production build passes. Root `npm ci` remains blocked by workspace symlink `EPERM`. No staging SMTP credentials/service were configured; **SMTP delivery is blocked**. The test transport is synthetic and does not prove external delivery.
- Issues #1 and #3 remain open. Do not close until the follow-up PR is pushed, independent owner review is recorded, and server tests pass in CI. #1 additionally needs controlled SMTP delivery evidence; #3 needs review of its full issue acceptance, including admin/audit filters and production retention evidence.

## Remaining verification

1. Open the organization project board and verify its linked repository, item count, estimates, priorities, views, sprint periods, assignees, and visibility.
2. Reconcile each Jira item with existing GitHub issues and SRS IDs; preserve existing Jira structure and do not duplicate issues.
3. Confirm all team logins and effective repository/project access before making assignments or changing permissions.
4. Verify full server integration tests and workspace build in GitHub Actions; validate SMTP delivery and expiry links in a controlled environment; review the admin workflows in a browser with disposable data.
5. Validate both MP4 durations and content; record additional evidence only if actual behavior can be demonstrated.
6. Cross-check Part 1/Part 2 requirements against the submitted PDFs, which are not present in this workspace.
