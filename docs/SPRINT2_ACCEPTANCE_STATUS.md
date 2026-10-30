# Sprint 2 acceptance status — 30 October 2026

## Verified baseline

- Canonical repository: [SE-Team-06/online-exam-portal-se-miniproject](https://github.com/SE-Team-06/online-exam-portal-se-miniproject).
- PR #60 is merged to `main` at `4d599af441ab352829007a1d6a61e49dba068895`.
- Acceptance follow-up branch: `fix/sprint2-account-acceptance-audit`, based on that `main` commit.
- No review or merge of this follow-up is claimed. No issues are closed by this work.

## #1 — Registration and account recovery

Existing implementation includes student registration, unique email, password policy, email verification, one-time expiring verification/reset tokens, generic reset response, session revocation, configurable mail delivery and a synthetic test transport. Tests cover invalid/duplicate registration, verification success/expiry/reuse, reset success/expiry/reuse, weak passwords, and synthetic delivery failure/success paths.

**Status: PARTIAL / verification pending.** Focused Mongo-backed tests did not reach test execution because MongoDB Memory Server rejected the downloaded archive's MD5. Actual SMTP delivery is **BLOCKED** until staging credentials are securely configured in the local environment. No credential, token or password is recorded here.

## #3 — Administrator lifecycle and audit

Existing implementation includes administrator account listing/creation/editing, activation/deactivation, role changes, CSRF/RBAC, self-demotion protection, session revocation, and filtered, paginated, redacted audit review. This branch adds validated IP capture, student submission-IP persistence through automatic finalization and audit retry, explicit null IP where unavailable, result-access events, role-change audit details, and live MongoDB TTL-index verification. `docs/OPERATIONS.md` records indefinite audit retention; production policy/deployment evidence remains external.

**Status: PARTIAL / verification pending.** Focused Mongo-backed tests failed during database binary integrity validation, before assertion execution. Review full issue acceptance and obtain successful CI evidence before closure.

## Local checks

| Check | Result |
| --- | --- |
| Root `npm ci` | Blocked: Windows `EPERM` creating the npm workspace symlink. |
| Server source/test syntax checks | Passed. |
| Client tests | Passed, 17/17. |
| Client production build | Passed. |
| Focused server integration tests | Not verified: MongoDB Memory Server archive MD5 mismatch prevented startup. |
| SMTP delivery | Blocked: no staging SMTP configuration supplied. |
| PR #60 CI | Previously verified successful in remote audit; follow-up branch has no CI run yet. |

## Remaining actions and carryover

1. Push the focused branch and open a PR against `main`; request independent repository-owner review.
2. Run CI on the PR and resolve all failures. Do not close #1 or #3 based on source presence alone.
3. Supply staging SMTP configuration securely outside source control; verify both verification and password-reset delivery, expiry and reuse.
4. Review issue #3's administrator/audit acceptance, including result access, filters, pagination, access control, redaction, role-change audit, and retention evidence.
5. Keep Sprint 2 completion and points partial until the team confirms the sprint record and accepted work. Do not count this unreviewed branch as completed points.
