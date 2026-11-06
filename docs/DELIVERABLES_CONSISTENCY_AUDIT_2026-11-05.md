# Deliverables Consistency Audit â€” 6 November 2026

## Verified GitHub state

- Canonical repository: [SE-Team-06/online-exam-portal-se-miniproject](https://github.com/SE-Team-06/online-exam-portal-se-miniproject).
- Current `main` head: `43b05d425fa146d34e4895b252041ed1e15c6f51` (PR #71 squash merge).
- PR #66, PR #68 and PR #71 are merged. PR #71 added the Code Coverage and Branch Coverage reports.
- Latest recorded successful main CI run before the documentation-only PR #71 merge: [Actions run #97](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/42204073835), on application-code commit `a841a6dc78a45946c0a60944b65d47a80fbd8fda`.
- PR #69 remains the deliverables consistency audit update. PR #70 contains the proposed System Validation Report. PR #69 and PR #70 should be reviewed independently before merging.
- Issue #67 was previously identified as the open Part 3 acceptance-evidence tracking issue assigned to `chhavi2308-s`. Confirm its current status before closing or changing it.
- The connected account `chhavi2308-s` was previously verified as having repository admin access. GitHub reported the account `codex` had read permission. No collaborator permissions were changed.

## Part 1 â€” Requirements and design artifacts

| Deliverable | Evidence | Status / gap |
|---|---|---|
| SRS | SRS v1.2 PDF/DOCX includes functional, nonfunctional, use-case, and security sections; it reports 27 FRs, 14 NFRs, 12 security requirements, 13 use cases, and 5 security objectives. | PRESENT. Do not alter the frozen requirements without team approval. |
| RTM | Workbook maps requirements to test cases and architecture components. | PRESENT; verify workbook mappings against the latest STP/SAD whenever either baseline changes. |
| SAD | SAD v1.4 PDF/DOCX plus three sequence diagrams and requirement/security architecture workbooks. | PRESENT. Keep implementation deviations in DEVIATIONS.md. |
| STP | STP v1.2 retains ten detailed test cases, TC-OE-001 to TC-OE-010, and updates testing scenarios and Part 3 reporting requirements. | PRESENT. The updated test cases are included in STP v1.2; execution outcomes are recorded separately in the testing reports and execution evidence. |
| Team proposal required by Project Guidelines | No single team proposal PDF with member SRNs, contribution plan, and clear product ownership was identified in the repository file inventory. | NOT VERIFIED / likely separate submission. Confirm the team's submission location. |

The ATM content in the supplied STP and SAD templates is sample material, not Online Exam Portal requirements.

## Part 2 â€” Planning and sprint evidence

| Requirement | Evidence | Status / gap |
|---|---|---|
| GitHub Project linked to repository; backlog, story points, assignments, and two sprint plans | Read-only inspection of organization Project View 7 showed #1, #3, and #18 as Done in Sprint 2 with their expected merged PRs. | PARTIAL: those rows and linked PRs were verified; full repository linkage, backlog/estimate completeness, and all sprint fields were not verified. |
| PR and CI workflow | Earlier PR and CI evidence includes successful checks for merged PRs. The latest recorded successful main CI run before PR #71 was Actions run #97 on `a841a6d`. | VERIFIED for the cited PR/CI evidence. Repository-owner review records should be checked separately before claiming independent review. |
| Sprint demonstration videos | `SE miniproject.mp4` and `Sprint2_Demo.mp4` exist; MP4 metadata reports 74.63s and 115.04s, respectively. | DURATIONS VERIFIED; video contents and required workflow coverage still need human review. |
| Sprint schedule and freeze | Part 2 schedules Sprint 1 for 19â€“23 Oct and Sprint 2 for 26â€“30 Oct 2026, then requires documentation completion and development freeze. | Dates have elapsed. Do not report current sprint work or velocity without a Jira/Project readback. |

## Part 3 â€” Test evidence

| Deliverable | Verified evidence | Status / remaining evidence |
|---|---|---|
| Updated test cases | STP v1.2 retains and updates TC-OE-001 to TC-OE-010. It includes the Part 3 testing period and report deliverables. | UPDATED. STP v1.2 is the current test-case baseline. |
| Unit Test Report | `docs/UNIT_TEST_REPORT.md` records 172/172 server tests and 17/17 client tests. These were separate executions, giving 189 recorded passing test results; they were not one combined execution. | PRESENT. The server suite and client suite are reported separately. |
| Code Coverage Report | `docs/CODE_COVERAGE_REPORT.md` records server line coverage 94.08%, branch coverage 79.96%, and function coverage 96.45%; client line coverage 100.00%, branch coverage 97.44%, and function coverage 100.00%. | PRESENT. Measurements were run on application-code commit `a841a6d` on 6 November 2026. |
| Branch Coverage Report | `docs/BRANCH_COVERAGE_REPORT.md` records the measured server and client branch coverage and per-file results. | PRESENT. Measurements were run on application-code commit `a841a6d` on 6 November 2026. |
| System Validation Report | Chhavi's proposed `docs/SYSTEM_VALIDATION_REPORT.md` is in PR #70. It records blocked application startup, partial browser checks, and unverified SMTP delivery. | PR #70 remains subject to review. Do not describe this report as merged into `main` until that PR is merged. |
| Browser and accessibility | Earlier local Chrome checks passed axe/responsive checks on the login screen at 1280px and 360px, then timed out waiting for the instructor dashboard. | PARTIAL; student dashboard, exam, and submission-dialog workflows did not run in that check. |
| SMTP | Automated tests validate secure SMTP configuration and controlled mail behavior. | REAL STAGING DELIVERY NOT VERIFIED; needs staging configuration and disposable mailboxes. |
| Performance, availability, deployment, at-rest protection | No 500-user load run, measurement window, production deployment rehearsal, or environment inspection was evidenced in the reviewed material. | NOT VERIFIED; retain documented deviations and do not claim SRS targets passed. |

### Test execution and coverage baseline

- Latest recorded server test execution: 172 tests passed, 0 failed.
- Client test execution: 17 tests passed, 0 failed.
- These were separate executions; 189 is the total of the two recorded results.
- The server and client coverage commands were also run separately on 6 November 2026 against application-code commit `a841a6dc78a45946c0a60944b65d47a80fbd8fda`.
- The coverage documentation was subsequently added to `main` by PR #71, producing documentation merge commit `43b05d4`. The coverage source commit remains `a841a6d`; do not misrepresent the measurements as having been rerun on `43b05d4`.
- The successful Actions run #97 is also on `a841a6d`. It should be cited as the latest recorded successful CI run for that application-code baseline, not as a new test run on the later documentation-only merge.

## Chhavi's remaining follow-up

Issue #67 was previously assigned to `chhavi2308-s` and tracked staging mail, browser acceptance, load/availability, deployment controls, Project board reconciliation, video review, and updated test evidence. Confirm its current status and remaining scope before closing or changing it. Keep existing closed implementation issues closed unless a reproducible implementation defect is found. Do not add or change collaborators without an exact account and agreed access level.

## Post-merge follow-up â€” 6 November 2026

- Current `main` is `43b05d425fa146d34e4895b252041ed1e15c6f51`. This includes the PR #71 documentation merge.
- Latest recorded successful main CI run before that documentation merge is [run #97](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/42204073835), on `a841a6dc78a45946c0a60944b65d47a80fbd8fda`.
- The STP v1.2 update is present in `main`; it is the current baseline for the ten test cases, TC-OE-001 to TC-OE-010.
- `docs/UNIT_TEST_REPORT.md` records 172/172 server tests and 17/17 client tests from separate executions.
- `docs/CODE_COVERAGE_REPORT.md` and `docs/BRANCH_COVERAGE_REPORT.md` are present following PR #71. Their measurements were run on `a841a6d` on 6 November 2026.
- Coverage results: server 94.08% line, 79.96% branch, 96.45% function; client 100.00% line, 97.44% branch, 100.00% function.
- PR #70 contains the proposed System Validation Report. Its recorded manual validation attempt used an earlier baseline and could not start the application because MongoDB Memory Server failed during startup. That attempt must not be represented as a successful browser system-validation run on current `main`.
- The earlier local full `npm test` attempt documented by Chhavi did not complete because MongoDB Memory Server reported an MD5 mismatch, and the isolated-cache retry did not complete startup. Integrity verification was retained. This is a separate attempt from the later recorded server and client test executions.
- Project View 7 visibly showed the #1 row with PRs #60/#63/#64/#65, the #3 row with PRs #60/#63/#64/#65, and the #18 row with PR #35; all three rows were Done in Sprint 2. Whole-board/repository-linkage reconciliation remains unverified.
- Sprint video container metadata: `SE miniproject.mp4` 74.63 seconds; `Sprint2_Demo.mp4` 115.04 seconds. Their actual content has not been reviewed.
- Still blocked/unverified: real staging SMTP delivery, full student/instructor browser walkthrough, load/availability measurements or approved deviation, target deployment security/backup review, and video content review. Retain these gaps until supported by new evidence.
