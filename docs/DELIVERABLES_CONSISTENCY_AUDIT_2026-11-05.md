# Deliverables Consistency Audit — 5 November 2026

## Verified GitHub state

- Canonical repository: [SE-Team-06/online-exam-portal-se-miniproject](https://github.com/SE-Team-06/online-exam-portal-se-miniproject).
- Current main head: `9b4bd506d74d01183e88693be86e52c15f57ccd8`.
- PR #66 is merged. Its head was created by `chhavi2308-s`; PR workflow run #89 completed successfully for locked install, automated tests, syntax checks, and build. No post-merge Actions run was returned for the current main commit.
- GitHub issue search returned no open issues before this audit. Issue #67 is now the only open issue and is assigned to `chhavi2308-s`; it tracks remaining Part 3 acceptance evidence. Issues #1–#5 and #18 remain closed.
- The connected account `chhavi2308-s` has repository admin access. GitHub reports the account `codex` has read permission. No collaborator permissions were changed.

## Part 1 — Requirements and design artifacts

| Deliverable | Evidence | Status / gap |
|---|---|---|
| SRS | SRS v1.2 PDF/DOCX includes functional, nonfunctional, use-case, and security sections; it reports 27 FRs, 14 NFRs, 12 security requirements, 13 use cases, and 5 security objectives. | PRESENT. Do not alter the frozen requirements without team approval. |
| RTM | Workbook maps the requirements to test cases and architecture components. | PRESENT; verify workbook mappings against the latest STP/SAD whenever either baseline changes. |
| SAD | SAD v1.4 PDF/DOCX plus three sequence diagrams and requirement/security architecture workbooks. | PRESENT. Keep implementation deviations in DEVIATIONS.md. |
| STP | STP v1.1 defines ten detailed test cases, security validation, test strategy, and RTM traceability. | PRESENT, but actual Part 3 results have not been incorporated into a newly rendered STP version. The execution log and Part 3 report record results separately. |
| Team proposal required by Project Guidelines | No single team proposal PDF with member SRNs, contribution plan, and clear product ownership was identified in the repository file inventory. | NOT VERIFIED / likely separate submission. Confirm the team’s submission location. |

The ATM content in the supplied STP and SAD templates is sample material, not Online Exam Portal requirements.

## Part 2 — Planning and sprint evidence

| Requirement | Evidence | Status / gap |
|---|---|---|
| GitHub Project linked to repository; backlog, story points, assignments, and two sprint plans | GitHub issue search and repository tools do not expose current Projects v2 views/fields. | UNVERIFIED. Check the organization Project directly for repo linkage, backlog, estimates, assignees, sprint dates/status, Done states, and linked PRs. |
| PR and CI workflow | CI run #89 passed for PR #66; the PR is merged. | VERIFIED for that PR. Repository-owner review records should be checked separately before claiming independent review. |
| Sprint demonstration videos | `SE miniproject.mp4` and `Sprint2_Demo.mp4` exist in the repository. Earlier handover metadata records durations near 1:15 and 1:55. | FILES PRESENT; playback/content and coverage of the required working flows were not verified in this audit. |
| Sprint schedule and freeze | Part 2 schedules Sprint 1 for 19–23 Oct and Sprint 2 for 26–30 Oct 2026, then requires documentation completion and development freeze. | Dates have elapsed. Do not report current sprint work or velocity without a Jira/Project readback. |

## Part 3 — Test evidence

| Deliverable | Verified evidence | Status / remaining evidence |
|---|---|---|
| Updated test cases | STP v1.1 has ten detailed cases covering the SRS; the test execution log records additional automated cases. | PARTIAL: no new rendered STP revision with execution results is in the repo. |
| Unit/integration/system checks | Full root suite: 188/188 passed (171 server, 17 client); server syntax checks and production build passed. Run #89 passed the CI checks. | VERIFIED for automated checks on the recorded source tree. This is not a complete manual system-validation run. |
| Code coverage | Server: 94.08% line, 79.96% branch, 96.45% function. Client: 100.00% line, 97.44% branch, 100.00% function. | VERIFIED for the executed suites and configured files. |
| Browser and accessibility | Local Chrome check passed axe/responsive checks on the login screen at 1280px and 360px, then timed out waiting for the instructor dashboard. | PARTIAL; student dashboard, exam, and submission-dialog workflows did not run in that check. |
| SMTP | Automated tests validate secure SMTP configuration and controlled mail behavior. | REAL STAGING DELIVERY NOT VERIFIED; needs staging config and disposable mailboxes. |
| Performance, availability, deployment, at-rest protection | No 500-user load run, measurement window, production deployment rehearsal, or environment inspection was evidenced here. | NOT VERIFIED; retain documented deviations and do not claim SRS targets passed. |

## Chhavi’s remaining follow-up

Issue #67 is assigned to `chhavi2308-s` and tracks staging mail, browser acceptance, load/availability, deployment controls, Project board reconciliation, video review, and updated test evidence. Keep the existing closed implementation issues closed unless a reproducible implementation defect is found. Do not add or change collaborators without an exact account and agreed access level.