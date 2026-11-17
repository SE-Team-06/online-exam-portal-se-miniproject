# RTM reconciliation summary — 17 November 2026

**Repository baseline reviewed:** `main` at `ed3805cc2790795c44aede7387fc448909ea24ae` (verified 17 Nov 2026).

**Scope:** all 53 requirement rows in `SRS/RTM_Online_Exam_Portal.xlsx`; the submitted requirement IDs and descriptions were retained verbatim.

## Workbook changes

- Kept the existing RTM, Use Cases, Security Objectives, and Implementation Evidence sheets. Added a Status Legend sheet.
- Preserved all 53 requirement IDs and requirement descriptions. The October 13 Implementation Evidence status, evidence and gap columns remain as historical values, relabeled as a historical snapshot.
- Added separate current implementation and test-execution statuses, source/API references, automated test references, manual evidence, issue/PR traceability, gaps and STP v1.2 mappings.
- Kept the existing SAD design/API cells unchanged. Actual implementation paths are recorded separately, including known API and lifecycle deviations.
- The workbook contained no formulas, Excel tables, hyperlinks or validation rules before this update; the updated file retains that finding and adds no formula dependencies.

## Status totals

| Status dimension | Status | Count |
| --- | --- | ---:|
| Implementation | DONE | 38 |
| Implementation | PARTIAL | 7 |
| Implementation | NOT VERIFIED | 6 |
| Implementation | NOT IMPLEMENTED | 2 |
| Test execution | PASS | 23 |
| Test execution | PARTIAL | 22 |
| Test execution | FAIL | 1 |
| Test execution | NOT RUN | 7 |

These are row classifications, not story points or a project-completion percentage. `FAIL` is SEC-OE-009: the current strict deadline behavior contradicts the SRS five-second grace requirement. FR-OE-009 (question/option shuffling) and SEC-OE-012 (at-rest encryption) are marked NOT IMPLEMENTED. Quantitative NFRs without representative measurements are NOT VERIFIED or NOT RUN, rather than presumed complete. NFR-OE-006 and NFR-OE-014 are marked implementation DONE because backup/retention/deletion behavior exists in code; their testing remains PARTIAL pending target-environment operation evidence.

## Evidence baseline and limitations

- Latest main Actions run: [run ID 44074576817](https://github.com/SE-Team-06/online-exam-portal-se-miniproject/actions/runs/44074576817), workflow run #118, successful on the reviewed main SHA. The exposed run summary does not show a per-suite test count.
- The committed Unit Test Report and coverage records give **172/172 server** and **17/17 client** tests, run as separate suites on source `a841a6d` during 2–6 November. These are historical recorded results; they were not rerun for this RTM update.
- The P1 System Validation Report contains 19 genuine screenshots from host-browser executions dated 9–10 November. Each row links only the evidence relevant to that requirement. Registration returned 503; successful email delivery, activation, completed password reset and SMTP staging delivery remain unverified.
- Jira was not independently accessible for a live re-query. The workbook records GitHub issue/PR references as scope traceability, and does not claim current Jira status.
- At-rest encryption for personal data/backups is absent. Deployment TLS, scheduled backup/restore operations, production retention/access controls, load/capacity, availability and broad cross-browser checks lack target-environment evidence.

## API/design reconciliation

The workbook retains the SAD references and separately records the actual code paths. Main differences include the `/api` prefix rather than SAD `/api/v1` (D-04); create/publish/assign in one exam call and no draft lifecycle (D-06); per-answer `PUT` rather than planned batched `PATCH` (D-07); `/focus-loss` rather than `/focus-events` (D-11); and aggregate instructor results/CSV routes rather than SAD per-exam API-17/API-18 (D-12). The implementation currently lacks functioning question/option shuffle despite controls appearing in the instructor form.

## Review items for teammates

1. Confirm the issue references recorded in the workbook against the current agreed GitHub/Jira mapping; Jira could not be queried in this audit.
2. Agree how to resolve the SRS five-second submission grace (SEC-OE-009) without silently changing the approved SRS.
3. Decide whether the unimplemented shuffle and at-rest encryption requirements are in scope for the submission or require a formally approved deviation.
4. Keep staging SMTP, deployment/operations, accessibility scope extensions and TC-OE-010 performance evidence explicitly assigned at team/environment level unless an individual owner is agreed.
