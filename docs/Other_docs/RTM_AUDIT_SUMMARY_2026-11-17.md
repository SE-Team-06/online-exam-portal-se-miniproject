# RTM reconciliation summary — 17 November 2026

## Baseline and delivery state

- Latest repository `main` checked for this follow-up: `d334e706ea47b4602082f985462091df2d3a469f` (17 November 2026).
- Application source reviewed: `ed3805cc2790795c44aede7387fc448909ea24ae`. Comparison through current `main` found later documentation/supporting-file changes but no application source changes; source-level findings remain based on this snapshot.
- PR #75 (deviations) merged as `ccdf970b2150cef8b13cd13269a76f8868a4e243`. PR #76 (RTM) merged as `02369a5518060b299a822e9fcf46b55811d81511`.
- Submitted review lists for PRs #75 and #76 contain no review submissions. Both are merged, but no independent approval is evidenced; do not describe either as approved by Gagan or another teammate.
- PR #75 checks: run #119 / ID `44089957641`, successful. PR #76 checks: run #121 / ID `44092967605`, successful for PR head `0e4109bc999def723ba0eb1bb6e9b430e8fa92dd`. Latest verified main run: #120 / ID `44090998452`, successful on earlier main `ccdf970b2150cef8b13cd13269a76f8868a4e243`. Available Actions metadata did not expose a run or status for current main `d334e706ea47b4602082f985462091df2d3a469f`; run #120 is not a post-merge check for the newer main commits.
- The original PR #76 updated `README.md`, `SRS/RTM_Online_Exam_Portal.xlsx`, and this summary. Later commits reorganized supporting documents under `docs/Other_docs`; this follow-up repairs links and baselines affected by that reorganization and refines evidence statuses. It does not change application code or the historical requirement descriptions.

## Workbook integrity and totals

All 53 requirement IDs are unique and present. Requirement descriptions and the original traceability fields in columns A–G match the pre-update workbook exactly. The original RTM, Use Cases, Security Objectives and Implementation Evidence sheets remain; a Status Legend sheet explains the added status vocabulary. The October 13 implementation snapshot is retained as historical data. Implementation and test-execution statuses are separate.

| Dimension | Status | Count |
|---|---|---:|
| Implementation | DONE | 38 |
| Implementation | PARTIAL | 7 |
| Implementation | NOT VERIFIED | 6 |
| Implementation | NOT IMPLEMENTED | 2 |
| Test execution | PASS | 22 |
| Test execution | PARTIAL | 25 |
| Test execution | FAIL | 1 |
| Test execution | NOT RUN | 5 |

The single test-status **FAIL** is SEC-OE-009. It is a requirement-conformance failure: code rejects at `endsAt` without the SRS five-second grace. The boundary test itself passes by confirming the current strict-cutoff behavior; CI is not failing. `FR-OE-019` is implementation DONE but test PARTIAL because screenshot 14 shows the all-answered confirmation dialog, not a positive unanswered-count case or a completed confirmation click. `FR-OE-026` is implementation PARTIAL (in-app notices only) and test NOT RUN because no notification-generation/delivery test or P1 notification observation was found. NFR-OE-002/003/004 test statuses are PARTIAL: ordinary workflow/utility checks exist, but target load, latency and monthly availability measurements do not. These are evidence classifications, not a project-completion percentage.

## Evidence sources and execution limits

- Recorded test reports document 172/172 server tests and 17/17 client tests from separate executions on source `a841a6d` during 2–6 November. Those historical tests were not rerun for this RTM follow-up. The run summaries do not expose per-suite counts.
- The P1 System Validation Report and 19 genuine screenshots document host-browser executions on 9–10 November. Registration returned HTTP 503. Successful email delivery/verification, completed email-based password reset, and real staging SMTP delivery remain unverified.
- Current supporting reports now reside in `docs/Other_docs/`. README and workbook references were reconciled to those current paths. The workbook keeps the SAD catalogue reference separate from the implementation route and records design deviations rather than treating the names as equivalent.
- Jira was not available for an independent live re-query; GitHub issue/PR links are traceability references only, not proof of current Jira state.

## SAD API and implementation reconciliation

The RTM preserves original SAD API references and records actual routes separately. Verified differences include `/api` rather than `/api/v1` (D-04), exam creation/publication/assignment in one call without a persisted draft state (D-06), per-answer `PUT` rather than batched `PATCH` (D-07), `/focus-loss` rather than `/focus-events` (D-11), and aggregate instructor result/CSV routes instead of SAD API-17/API-18 per-exam routes (D-12). Application routes are in `server/src/app.js`.

The instructor UI exposes shuffle controls, but `examInput` does not accept those flags, `Exam` stores only `shuffleQuestions`, and source search found no question/option permutation logic. A later user report describes observing both behaviors, but no reproducible evidence was attached and it conflicts with the inspected implementation. The RTM keeps FR-OE-009 NOT IMPLEMENTED based on source; a repeatable test and code reconciliation are needed before changing that status.

## Current material gaps

- **Must / SEC-OE-009:** decide whether to implement the SRS five-second grace or change the requirement through the team's formal approval process; neither change is silently made here.
- **FR-OE-009:** question and option shuffling is not implemented in the reviewed source; investigate the conflicting user observation and implement/test if required.
- **FR-OE-026:** email assignment/result notifications are missing; in-app notices are partial coverage.
- **SEC-OE-012:** application-level encryption at rest for personal data and backups is not implemented or evidenced.
- **Email acceptance:** staging SMTP, successful delivered verification mail, account activation, and a completed delivered-link password reset remain unverified. The 503 evidence does not establish root cause.
- **Quantitative NFRs:** no controlled TC-OE-010 load/capacity run, 99.5% exam-window availability history, required data-volume run, or measured two-second timer drift is recorded.
- **Operations/security:** production TLS/proxy, configured scheduled backups and restore drill, production retention/access controls, monitoring/alerts and deployed security checks require environment evidence.
- **Accessibility:** reported scoped checks and tested 360 px views do not cover Edge, earlier major versions, screen-reader/user testing or the whole application.

## Review and next decisions

1. An independent reviewer should inspect the merged RTM and deviations updates; GitHub currently shows no submitted reviews for PRs #75/#76.
2. The team should confirm the issue mapping and decide the SEC-OE-009, shuffle, notification and encryption follow-ups without changing submitted requirements silently.
3. Keep SMTP, deployment, load/availability and other environment-owned checks with the team/environment until individual ownership is explicitly agreed.

The updated RTM and deviations register improve traceability and accurately document known evidence. They do not establish full SRS/STP acceptance or production readiness.
