# Branch Coverage Report

**Project:** Online Exam Portal (MERN)
**Execution date:** 6 November 2026
**Source commit:** `a841a6dc78a45946c0a60944b65d47a80fbd8fda`
**Coverage tool:** Node.js built-in test coverage (`--experimental-test-coverage`)
**Execution:** Server and client coverage were run separately.

## 1. Objective

This report records branch coverage for individual server and client source files based on the local coverage executions performed on 6 November 2026.

## 2. Execution summary

| Component | Tests passed | Failed | Result |
|---|---:|---:|---|
| Server | 172 | 0 | PASS |
| Client | 17 | 0 | PASS |

The server and client test suites were executed separately.

## 3. Server branch coverage

| Source file | Branch coverage |
|---|---:|
| `src/app.js` | 77.32% |
| `src/domain/scoring.js` | 90.91% |
| `src/middleware/auth.js` | 77.78% |
| `src/models/index.js` | 100.00% |
| `src/ops/availability.js` | 100.00% |
| `src/ops/backup.js` | 92.31% |
| `src/security/email.js` | 79.17% |
| `src/security/password.js` | 100.00% |
| `src/security/session.js` | 89.47% |
| `src/security/transport.js` | 100.00% |
| **All server files** | **79.96%** |

## 4. Client branch coverage

| Source file | Branch coverage |
|---|---:|
| `src/exam-form.js` | 100.00% |
| `src/exam-session.js` | 91.67% |
| `src/question-form.js` | 100.00% |
| **All client files** | **97.44%** |

## 5. Areas with uncovered branches

The coverage output identifies these source files as having less than 100% branch coverage:

- Server `src/app.js`: 77.32%.
- Server `src/middleware/auth.js`: 77.78%.
- Server `src/security/email.js`: 79.17%.
- Server `src/security/session.js`: 89.47%.
- Server `src/domain/scoring.js`: 90.91%.
- Server `src/ops/backup.js`: 92.31%.
- Client `src/exam-session.js`: 91.67%.

The remaining listed source files reported 100.00% branch coverage.

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

The server coverage execution completed with 172 tests passed and 0 failed. The client coverage execution completed with 17 tests passed and 0 failed. Each command emitted individual file-level branch coverage and an aggregate summary.

## 7. Limitations

- Branch coverage measures the branches instrumented by the configured test-coverage command; it does not establish that all business scenarios or input combinations have been tested.
- These results are tied to the source commit stated above. Later code changes require a new coverage run.
- Manual browser/system validation, SMTP delivery verification, load testing, and deployment checks are outside the scope of this branch-coverage measurement.
