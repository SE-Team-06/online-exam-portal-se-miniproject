# Unit Test Report – Online Exam Portal

**Project:** Online Exam Portal  
**Technology Stack:** MERN (MongoDB, Express.js, React.js, Node.js)  
**Testing Period:** 2–6 November 2026  
**Prepared by:** Dhanya (P2)  
**Source of Evidence:** `docs/test-execution.md` and `docs/PART3_TEST_REPORTS_2026-11-04.md`

## 1. Objective

The objective of unit testing is to verify that individual application components and functions behave as expected. Testing focuses on application logic, validation, security-related utilities and client-side functionality.

## 2. Test Scope

The recorded automated tests cover the following areas:

- Authentication and account-related functionality.
- Password and email configuration security.
- Exam configuration and question validation.
- Exam timer and submission-related logic.
- Question selection and evaluation.
- Client-side application behaviour.

## 3. Test Execution Summary

| Test suite | Tests passed | Result |
|---|---:|---|
| Server test suite | 171/171 | PASS |
| Client test suite | 17/17 | PASS |
| **Combined automated test suite** | **188/188** | **PASS** |

The server test suite includes unit-level and application integration coverage. The client test suite verifies the recorded client-side test cases.

## 4. Unit-Level Areas Verified

The recorded test evidence includes unit-level verification of:

- SMTP URL security configuration and rejection of insecure configurations.
- Exam scoring logic.
- Exam form configuration.
- Timer functionality.
- Submission summary generation.
- Question selection and validation.

The evidence records eight passing server-side pure unit/configuration tests, alongside the broader server test suite.

## 5. Test Environment and Execution

Testing was performed using the project's automated test setup. The final recorded verification used a successfully configured MongoDB test environment.

The final verification also included:

- Server-side test execution.
- Client-side test execution.
- Server syntax checks.
- Vite production build verification.

The production build and server syntax checks completed successfully.

## 6. Result

<badge color="success">Automated test suites passed</badge>

The recorded final automated test execution completed with 188 out of 188 tests passing:

- Server: 171 passed.
- Client: 17 passed.

The results demonstrate that the tested application components and automated workflows passed the recorded test assertions.

## 7. Limitations

The automated test results do not establish that every system-level acceptance scenario has been completed.

The following remain unverified or incomplete in the available evidence:

- Actual SMTP delivery through a staging mail service.
- Complete deployed-browser walkthrough of instructor and student workflows.
- Full browser validation of exam execution and submission-dialog keyboard interactions.

These activities require separate system or acceptance validation and should not be treated as passed based solely on the automated test results.

## 8. Conclusion

The recorded automated test suites completed successfully, with 171 server tests and 17 client tests passing. The tested application logic and client-side functionality showed the expected behaviour under the recorded test conditions.

Outstanding staging and browser validation activities are documented separately in the System Validation Report and test execution evidence.