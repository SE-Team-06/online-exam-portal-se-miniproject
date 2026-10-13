# Implementation and requirement gap register

Assessment date: 13 October 2026. Source of requirement IDs: submitted SRS v1.2 and `SRS/ID_Cheat_Sheet.md`. This register describes the local MVP slice only. A partial implementation is not acceptance of the complete SRS requirement.

## Evidence reviewed

- Express/Mongoose API and React/Vite client in `server/src/` and `client/src/`.
- Automated tests in `server/test/`; latest local run is recorded in [`test-execution.md`](test-execution.md).
- Local demo startup smoke check (API health returned 200; Vite returned 200).
- User-reported manual check: the user opened the local demo, signed in as the instructor, and saw a subject. This is not independent verification of additional instructor functions.

## Implemented partially

| SRS IDs | Evidence in current implementation | Remaining gap |
|---|---|---|
| FR-OE-003, FR-OE-004 | Login for pre-provisioned verified accounts, logout/session handling, role middleware; automated authentication/role tests | No self-service provisioning; full conformance and browser flows not established |
| SEC-OE-001, SEC-OE-002 | `server/src/security/password.js` uses bcrypt cost 12 and password compliance helper | No complete account creation/reset workflow; broader password-policy test evidence needed |
| SEC-OE-003 | Five-failure account lockout with `lockedUntil`; integration test verifies lockout state | Exact 15-minute duration/recovery behavior needs explicit test |
| SEC-OE-004, SEC-OE-006 | Server-side role/session checks and inactivity configuration; protected-write test | Cookie/session hardening and 30-minute behavior need full verification; production HTTPS is absent |
| SEC-OE-007 | Attempt question payload omits correct-option identifiers; test checks response shape | Result release and answer-review policy is incomplete |
| SEC-OE-008 | Request validation, CSRF token and origin checks are present; tests cover malformed question and missing CSRF | Full OWASP coverage, sanitization and systematic injection/XSS testing remain |
| SEC-OE-009 | Attempt and result access are scoped to the authenticated student; tests cover unassigned start and cross-user result denial | Full boundary/grace-period matrix and concurrent edge cases remain |
| SEC-OE-010 | Login limiter configured for 10 requests per IP per 60 seconds | Automated 429/window/IP behavior test is still needed; password-reset route does not exist |
| FR-OE-007, FR-OE-008, FR-OE-011 | Instructor question creation and exam creation/publishing/assignment APIs | No complete instructor authoring UI; question editing/deletion and lifecycle controls are incomplete |
| FR-OE-013, FR-OE-014 | Assigned exam list and one-attempt start constraints; integration test | All status/time-window cases and UI usability are not fully tested |
| FR-OE-015, FR-OE-017, FR-OE-018 | Answer/flag persistence, server-side save and resume path in API | Autosave timing/30-second interval and interrupted-browser behavior need verification |
| FR-OE-016, NFR-OE-010 | Server derives attempt end time and expiry worker auto-submits expired attempts | Displayed timer drift (≤2 seconds), clock skew and browser lifecycle remain unverified |
| FR-OE-019, FR-OE-020 | Manual submit API and expired-attempt auto-submit path; timeout integration test | UI confirmation/unanswered count is incomplete; expiry scheduling and load behavior need further validation |
| FR-OE-021 | Focus-loss endpoint persists timestamps and writes an audit event; test verifies persisted event | Browser focus tracking and instructor-visible count/times are not implemented |
| FR-OE-022 | Server-side score calculation and scoring unit/integration tests | Full scoring matrix and release behavior need broader evidence |
| FR-OE-023 | Student-owned result API/UI | Instructor-controlled question-wise correct-answer release is incomplete |
| FR-OE-027 (partial) | Audit event model/writer used by selected actions | Admin filtering/view, full required event coverage, IP and 12-month retention are not implemented |

## Not started or not verified

- FR-OE-001, FR-OE-002: registration and email verification.
- FR-OE-005: one-time password reset flow.
- FR-OE-006: administrator user lifecycle and role management.
- FR-OE-009: question/option shuffling.
- FR-OE-010: optional negative-marking exam configuration (the scoring function has unit coverage for a negative-score floor, but the configuration workflow is not delivered).
- FR-OE-012: freeze edits after first attempt.
- FR-OE-024: instructor attempt analytics and summary statistics.
- FR-OE-025: CSV results export.
- FR-OE-026: assignment/result notifications.
- NFR-OE-001 to NFR-OE-014: no complete acceptance evidence for the specified performance, availability, recovery, accessibility, compatibility, scalability, coverage, portability, and retention targets. Local tests are not load, availability, or accessibility evidence.
- SEC-OE-005 and SEC-OE-012: production TLS/rejection of HTTP and encryption at rest for personal data/backups.
- SEC-OE-011: complete audit event fields, retention, and access requirements.
- Production deployment, monitoring, durable backup/recovery, and operational secrets management.

## Assignment-document alignment and risks

- The repository contains the SRS v1.2, SAD v1.4, STP v1.1, RTM workbook, STRIDE workbook, and three sequence diagrams. The implementation is a MERN slice; API/design conformance has not been established end to end.
- The test execution log below reports only tests actually run against this MVP, not completed execution of the submitted STP. Test-to-requirement mappings are corrected to match what each test exercises.
- SRS v1.2 and SAD v1.4 show a related-document version mismatch. The SAD API-07/API-08 presentation also needs review against implemented routes. Preserve the approved documents until the team decides whether to revise them.
- Temporary demo data and generated passwords are disposable. Do not use real identities or credentials.
