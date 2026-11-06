# Code Coverage Report

**Project:** Online Exam Portal (MERN)
**Execution date:** 6 November 2026
**Source commit:** `a841a6dc78a45946c0a60944b65d47a80fbd8fda`
**Coverage tool:** Node.js built-in test coverage (`--experimental-test-coverage`)
**Execution:** Server and client coverage were run separately.

## 1. Objective

This report records line and function coverage for the server and client source files based on the local coverage executions performed on 6 November 2026.

## 2. Execution summary

| Component | Tests passed | Failed | Result |
|---|---:|---:|---|
| Server | 172 | 0 | PASS |
| Client | 17 | 0 | PASS |

The server and client test suites were executed separately. The counts above should not be interpreted as one combined test invocation.

## 3. Server coverage

| Source file | Line coverage | Function coverage |
|---|---:|---:|
| `src/app.js` | 93.09% | 97.00% |
| `src/domain/scoring.js` | 100.00% | 100.00% |
| `src/middleware/auth.js` | 89.23% | 100.00% |
| `src/models/index.js` | 100.00% | 100.00% |
| `src/ops/availability.js` | 100.00% | 100.00% |
| `src/ops/backup.js` | 89.29% | 80.00% |
| `src/security/email.js` | 97.37% | 100.00% |
| `src/security/password.js` | 100.00% | 100.00% |
| `src/security/session.js` | 97.22% | 100.00% |
| `src/security/transport.js` | 100.00% | 100.00% |
| **All server files** | **94.08%** | **96.45%** |

## 4. Client coverage

| Source file | Line coverage | Function coverage |
|---|---:|---:|
| `src/exam-form.js` | 100.00% | 100.00% |
| `src/exam-session.js` | 100.00% | 100.00% |
| `src/question-form.js` | 100.00% | 100.00% |
| **All client files** | **100.00%** | **100.00%** |

## 5. Coverage interpretation

- Server line coverage is 94.08%; server function coverage is 96.45%.
- Client line and function coverage are both 100.00%.
- Branch coverage is reported separately in `BRANCH_COVERAGE_REPORT.md`.
- Coverage percentages indicate execution coverage, not proof that every possible input, integration, browser workflow, or production scenario has been validated.

## 6. Reproducibility and evidence

The source commit recorded for this run is `a841a6dc78a45946c0a60944b65d47a80fbd8fda`. The following workspace scripts were used:

**Server**
```powershell
npm run coverage --workspace server
```

**Client**
```powershell
npm run coverage --workspace client
```

The server run completed with 172 tests passed and 0 failed. The client run completed with 17 tests passed and 0 failed. Each command emitted per-file coverage rows and an aggregate summary.

## 7. Limitations

- These are local test-coverage results for the source files included by the configured coverage commands.
- Coverage does not establish completion of manual browser/system validation, SMTP delivery verification, load testing, or deployment checks.
- The results are tied to the source commit stated above; any later code changes require a new coverage run before these figures are presented as current.
