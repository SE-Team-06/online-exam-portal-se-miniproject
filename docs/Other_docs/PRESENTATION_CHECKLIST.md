# Online Exam Portal — sprint review checklist

> **Current refresh — 30 October 2026:** PR #60 is verified merged to canonical `main` at `4d599af`. The organization Projects listing shows **Online Exam Portal — Software Engineering** at `https://github.com/orgs/SE-Team-06/projects/1`; item-level board contents were not rechecked. The repository contains `SE miniproject.mp4` (74.63 seconds) and `Sprint2_Demo.mp4` (115.04 seconds), consistent with the approximate required durations. Playback, upload availability, and demonstrated behaviors have not been validated. On this Windows environment, root `npm ci` failed at workspace symlink creation (`EPERM`); client tests/build passed directly, while Mongo-backed server integration tests were blocked by a MongoDB Memory Server archive MD5 mismatch. See [REPOSITORY_AUDIT.md](REPOSITORY_AUDIT.md) and [SPRINT2_ACCEPTANCE_STATUS.md](SPRINT2_ACCEPTANCE_STATUS.md) for evidence limits.

**Updated:** 25 October 2026
**Repository:** [SE-Team-06/online-exam-portal-se-miniproject](https://github.com/SE-Team-06/online-exam-portal-se-miniproject)
**Evidence scope:** local automated checks and authenticated GitHub browser readback. No fresh product browser walkthrough or video recording was made in this audit.

## Current evidence

- PR #34, `feat: implement exam configuration and locking`, is merged to `main` at `58b988be87a174127c9201a5e3696281a1bcb553`. GitHub showed one passing check. The local `origin/main` cache is older (`f2ed518`) because fetch failed with `SEC_E_NO_CREDENTIALS`; use GitHub for current merge state until a successful fetch.
- `npm.cmd test`: 32 passed, 0 failed, 0 skipped. `npm.cmd run build`: server syntax checks and Vite production build passed. See [`test-execution.md`](test-execution.md). These are automated checks; they do not establish full SRS compliance or UI acceptance.
- GitHub Issues page showed 16 open and 8 closed (24 total). Key closed issues include #2, #4, #5, #7, #11 and #26. Issues #15 (shuffling) and #17 (timer/recovery) are also closed, but their visible acceptance criteria have gaps against current source/tests; review those closures with the team.
- The organization-owned [SE-Team-06 Project](https://github.com/orgs/SE-Team-06/projects/1) loads. Its Prioritized backlog view had a saved Sprint 1 filter and showed zero matching items; do not interpret that as backlog completion. The personal Project remains a backup.
- The official Part 2 PDF was not available in the repository during this audit. Dates and two-minute/one-minute recording requirements below are sourced from existing handover/checklist records and need confirmation against the submitted PDF if exact assignment wording is required.

## Sprint 1 closeout

The historical planned Sprint 1 set was nine Jira work items / 33 provisional points, corresponding to GitHub issues #2, #4, #5, #6, #7, #8, #9/#10 (OEPSE-17 counted once), #11 and #26. The live GitHub state now shows #2, #4, #5, #7, #11 and #26 closed; #6, #8, #9 and #10 remain open. Local tests and merged PRs provide implementation evidence, but closure state alone is not browser acceptance.

- [ ] Confirm current Jira sprint membership, points, and status; prior Jira readback is dated 13 October.
- [ ] Rehearse instructor creation/configuration, publication/assignment, student start/save/submit, and result viewing with disposable demo data.
- [ ] Review #6, #8, #9 and #10 against the live issue descriptions and close only when their own scope is demonstrated. Keep the OEPSE-17 five-point estimate counted once across #9/#10; keep OEPSE-18 deadline-triggered submission separate.
- [ ] Confirm the required Sprint 1 one-minute recording exists outside this checkout; the repository search found no video file. If absent, record the real product and upload it to the repository.
- [ ] Verify the actual Actions run and required teammate PR/reviewer evidence from GitHub; PR #34 showed one check passed, but this audit did not inspect the full Actions history or review identities.

## Sprint 2 preparation

The existing issue bodies describe an eight-story, 45-provisional-point Sprint 2 proposal for 26–30 October 2026. Jira was not refreshed, so treat membership, dates, points and capacity as unconfirmed until read back in Jira. Proposed scope and dependencies:

| Issue | Jira mapping in issue body | Work / dependency to confirm |
|---|---|---|
| #1 | OEPSE-7, 5 points | Registration, verification, reset; requires email delivery and secure token-expiry tests. |
| #3 | OEPSE-8, 3 points; body also mentions OEPSE-23 | Admin account lifecycle. Separate the OEPSE-23 audit scope into #21 to avoid duplicate acceptance/points. |
| #17 | OEPSE-16, 8 points; marked closed | Timer and answer recovery. Closed issue body still says planned work; compare refresh/retry criteria to code, then have the team decide whether to reopen/carry over. |
| #18 | OEPSE-18, 3 points | Deadline auto-submit. Depends on attempts/saved answers; add saved-answer expiry and concurrent manual-submit coverage. |
| #20 | OEPSE-24, 8 points | Auth/transport security. Server auth tests exist; deployment/TLS evidence remains. |
| #21 | OEPSE-23, 5 points | Administrator-only audit filtering, pagination, IP display and sensitive-detail redaction are implemented and tested; complete event/retention evidence remains a deployment task. |
| #22 | OEPSE-25, 8 points | Repeatable load and MongoDB storage measurement commands are implemented; run them against the agreed representative deployment and record target results. |
| #25 | OEPSE-28, 5 points | Coverage reporting and Linux/container setup time; coverage and 60-minute setup target are unmeasured. |

These eight mappings sum to the historical 45 points only if OEPSE-23 is counted once and the closed #17 work is included as a planned item. Do not treat them as current Jira status or assigned work. Confirm carryover, estimates, ownership, capacity and dates with the team before committing.

### Sprint 2 demo and freeze

- [ ] Before work: confirm story owners, acceptance criteria, dependencies and environment; do not infer owners from GitHub issue creators.
- [ ] During sprint: link focused PRs to existing issues; run tests/build and review CI evidence for each merged slice.
- [ ] Two-minute demo outline: instructor publishes/assigns an exam; student starts and saves answers; demonstrate only verified recovery/expiry behavior; submit and show the student-owned result; state limitations honestly.
- [ ] Record the real two-minute Sprint 2 demo only after its shown functions pass in the running app; upload it to the repository.
- [ ] Freeze development only after the final tests, documentation, required demo upload and review evidence are complete.

## Manual GitHub issue reconciliation

Read each live issue description, linked PR and timeline before editing. Use the issue page's **Close issue** control only after the scope is merged and acceptance is demonstrated; add a short comment citing the PR and evidence. To revisit an incorrectly closed item, use **Reopen issue** after team agreement. Do not create a duplicate issue for Jira work that already maps to an open or closed card.

Suggested review sequence: #6, #8, #9, #10 for Sprint 1; then validate #15 and #17 closed-state discrepancies; clarify the #3/#21 overlap; then plan the remaining Sprint 2 issues in Jira. The current open list and evidence notes are in [`TEAM_HANDOVER.md`](TEAM_HANDOVER.md).
