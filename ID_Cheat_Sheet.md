# Online Exam Portal – Requirement ID Cheat Sheet (from P1)

Frozen IDs for P2, P3, P4. Do not change an ID without telling the group. Full wording is in the SRS; the RTM spreadsheet has columns for your test case / component / design references.

## Use cases

- **UC-01** Register Account → FR-OE-001, FR-OE-002
- **UC-02** Login / Logout → FR-OE-003, FR-OE-004
- **UC-03** Reset Password → FR-OE-005
- **UC-04** Manage Users → FR-OE-006
- **UC-05** Manage Question Bank → FR-OE-007
- **UC-06** Create & Configure Exam → FR-OE-008, FR-OE-009, FR-OE-010, FR-OE-012
- **UC-07** Publish & Assign Exam → FR-OE-011, FR-OE-026
- **UC-08** View Assigned Exams → FR-OE-013
- **UC-09** Attempt Exam → FR-OE-014 to FR-OE-018, FR-OE-021
- **UC-10** Submit Exam → FR-OE-019, FR-OE-020, FR-OE-022
- **UC-11** View Result → FR-OE-023
- **UC-12** View Results & Analytics → FR-OE-024, FR-OE-025, FR-OE-021
- **UC-13** View Audit Logs → FR-OE-027

## Functional requirements (FR-OE)


**Account & Access**
- FR-OE-001 [Must, UC-01] – The system shall allow a visitor to register a Student account by providing full name, a unique email address and a password.
- FR-OE-002 [Must, UC-01] – The system shall verify a new account by sending a verification link to the registered email address; the link shall remain valid for 24 hours.
- FR-OE-003 [Must, UC-02] – The system shall authenticate users by email and password and shall grant access only to the features permitted for the user's role (Student, Instructor or Administrator).
- FR-OE-004 [Must, UC-02] – The system shall allow a logged-in user to log out, which shall invalidate the current session immediately.
- FR-OE-005 [Must, UC-03] – The system shall allow a user to reset a forgotten password through a one-time link sent by email, valid for 30 minutes.
- FR-OE-006 [Must, UC-04] – The system shall allow an Administrator to create, edit, activate, deactivate and assign roles to user accounts.

**Exam Setup**
- FR-OE-007 [Must, UC-05] – The system shall allow an Instructor to create, edit and delete multiple-choice questions, each with a question text, 2 to 6 options, exactly one correct option and a mark value.
- FR-OE-008 [Must, UC-06] – The system shall allow an Instructor to create an exam by specifying title, duration in minutes, start date-time, end date-time, pass mark and the set of questions selected from the question bank.
- FR-OE-009 [Should, UC-06] – The system shall allow an Instructor to enable or disable shuffling of question order and option order for an exam.
- FR-OE-010 [Could, UC-06] – The system shall allow an Instructor to configure optional negative marking (a deduction value per wrong answer) for an exam.
- FR-OE-011 [Must, UC-07] – The system shall allow an Instructor to publish an exam and assign it to selected Students, after which the exam appears on those Students' dashboards.
- FR-OE-012 [Must, UC-06] – The system shall prevent editing of questions, marks and duration of an exam after the first Student has started an attempt.

**Exam Taking**
- FR-OE-013 [Must, UC-08] – The system shall list to each Student the exams assigned to them with title, duration, time window and status (Upcoming, Open, Attempted, Missed).
- FR-OE-014 [Must, UC-09] – The system shall allow a Student to start an assigned exam only between its start and end date-times and only once.
- FR-OE-015 [Must, UC-09] – The system shall present questions to the Student, allow selecting or changing one option per question, navigating freely between questions and flagging a question for review.
- FR-OE-016 [Must, UC-09] – The system shall display a countdown timer with the remaining time, calculated from the server clock, throughout the attempt.
- FR-OE-017 [Must, UC-09] – The system shall automatically save the Student's answers to the server every 30 seconds and whenever an answer is changed.
- FR-OE-018 [Should, UC-09] – The system shall allow a Student to resume an interrupted attempt, with the timer continuing from the original end time of the attempt.
- FR-OE-019 [Must, UC-10] – The system shall allow a Student to submit the exam manually after a confirmation prompt that shows the number of unanswered questions.
- FR-OE-020 [Must, UC-10] – The system shall automatically submit the Student's saved answers when the timer reaches zero.
- FR-OE-021 [Should, UC-09] – The system shall record every event in which the exam window loses focus or the browser tab is switched, with a timestamp, and make the count and times visible to the Instructor.

**Evaluation & Results**
- FR-OE-022 [Must, UC-10] – The system shall automatically evaluate each submitted attempt by comparing answers with the stored correct options and computing the total score using the question marks and any negative marking.
- FR-OE-023 [Must, UC-11] – The system shall allow a Student to view their score, pass/fail status and, if enabled by the Instructor, a question-wise review with correct answers.
- FR-OE-024 [Must, UC-12] – The system shall allow an Instructor to view, for each exam, the list of attempts with scores and summary statistics (average, highest, lowest score and pass percentage).
- FR-OE-025 [Should, UC-12] – The system shall allow an Instructor to export the results of an exam as a CSV file.
- FR-OE-026 [Should, UC-07] – The system shall send an in-app notification and an email to Students when an exam is assigned to them and when their result is available.
- FR-OE-027 [Should, UC-13] – The system shall allow an Administrator to view an audit log of login events, exam creation, publication, submissions and user-management actions, filterable by date and user.

## Non-functional requirements (NFR-OE)

- NFR-OE-001 [Performance, Must] – The system shall respond to 95% of page requests within 2 seconds under a load of 500 concurrent users.
- NFR-OE-002 [Performance, Must] – The system shall complete an answer auto-save request in 1 second or less for 95% of requests at 500 concurrent users.
- NFR-OE-003 [Performance, Must] – The system shall evaluate a submitted attempt and make the score available within 5 seconds of submission, for up to 500 simultaneous submissions.
- NFR-OE-004 [Availability, Must] – The system shall be available at least 99.5% of the time during scheduled exam windows, measured per calendar month.
- NFR-OE-005 [Reliability, Must] – The system shall not lose more than 30 seconds of a Student's answers in the event of a client or server failure (recovery point objective of 30 seconds).
- NFR-OE-006 [Reliability, Should] – The system shall take an automated backup of all data at least once every 24 hours and retain the last 7 backups.
- NFR-OE-007 [Usability, Must] – A first-time Student shall be able to locate and start an assigned exam within 3 clicks from the dashboard and without training.
- NFR-OE-008 [Usability, Should] – The user interface shall conform to WCAG 2.1 Level AA for colour contrast and keyboard navigation on the exam-taking pages.
- NFR-OE-009 [Compatibility, Must] – The system shall work correctly on the latest two major versions of Google Chrome, Mozilla Firefox and Microsoft Edge, and shall render usably at screen widths from 360 px upwards.
- NFR-OE-010 [Timing accuracy, Must] – The exam timer and all time-window checks shall use the server clock, with a maximum deviation of 2 seconds between displayed and server time.
- NFR-OE-011 [Scalability, Should] – The system shall store at least 10,000 questions, 1,000 users and 200 exams without degradation of the response-time targets in NFR-OE-001.
- NFR-OE-012 [Maintainability, Should] – The source code shall be modular, with automated unit tests achieving at least 70% line coverage of business logic.
- NFR-OE-013 [Portability, Could] – The system shall be deployable on a standard Linux server or container using documented steps that a new team member can complete in 60 minutes or less.
- NFR-OE-014 [Data retention, Should] – The system shall retain exam attempts and results for at least 1 year and shall allow an Administrator to delete data of a deactivated user on request.

## Security objectives (SO-OE)

- SO-OE-001 Confidentiality
- SO-OE-002 Integrity
- SO-OE-003 Authentication & Authorisation
- SO-OE-004 Availability
- SO-OE-005 Accountability & Non-repudiation

## Security requirements (SEC-OE)

- SEC-OE-001 [SO-OE-003, Must] – The system shall store passwords only as salted hashes using bcrypt or Argon2; plain-text passwords shall never be stored or logged.
- SEC-OE-002 [SO-OE-003, Must] – The system shall require passwords of at least 8 characters containing upper-case, lower-case and a digit.
- SEC-OE-003 [SO-OE-003, Must] – The system shall lock an account for 15 minutes after 5 consecutive failed login attempts.
- SEC-OE-004 [SO-OE-003, Must] – The system shall enforce role-based access control on the server for every request; a request outside the user's role shall return HTTP 403.
- SEC-OE-005 [SO-OE-001, Must] – The system shall transmit all data over HTTPS using TLS 1.2 or higher and shall reject plain HTTP.
- SEC-OE-006 [SO-OE-003, Must] – The system shall expire a session after 30 minutes of inactivity, and session tokens shall be marked HttpOnly and Secure.
- SEC-OE-007 [SO-OE-001, Must] – The system shall never send the correct answers of an exam to the client before the attempt has been submitted and results released.
- SEC-OE-008 [SO-OE-002, Must] – The system shall validate and sanitise all user input and protect against NoSQL/query injection, cross-site scripting and CSRF as listed in the OWASP Top 10.
- SEC-OE-009 [SO-OE-002, Must] – The system shall accept an answer submission only from the authenticated owner of the attempt and only before the attempt end time (plus a 5-second grace period).
- SEC-OE-010 [SO-OE-004, Should] – The system shall limit login and password-reset requests to 10 per minute per IP address and return HTTP 429 beyond that limit.
- SEC-OE-011 [SO-OE-005, Must] – The system shall log login successes and failures, role changes, exam publication and result access with user ID, timestamp and IP address, and retain these logs for at least 12 months.
- SEC-OE-012 [SO-OE-001, Should] – The system shall encrypt personal data (email, name) and backups at rest.

## Hand-offs
- **P2:** write each test case with the Req ID(s) it verifies; send me the TC IDs (TC-OE-001…) so I fill the RTM. Security tests should cover SEC-OE-001..012; NFR tests: NFR-OE-001, -004, -005, -010 are good candidates.
- **P3:** map every Req ID to a component and give me the component name; STRIDE table can reuse SEC-OE IDs.
- **P4:** sequence diagrams should cover UC-09 Attempt Exam / UC-10 Submit Exam and UC-02 Login; API endpoints should reference FR-OE-003, FR-OE-017, FR-OE-019/020.