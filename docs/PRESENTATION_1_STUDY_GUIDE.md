# Presentation 1 Study Guide — Online Exam Portal

**Purpose:** Use this guide to prepare for the Software Engineering mini-project checkpoint. It follows the instructor’s announcement in the supplied screenshot. The screenshot numbers items 1–5, then 7–8; it has no item 6, so this guide does not invent one.

**Project:** Online Exam Portal · Team 6 · UE24CS341A  
**Team Lead / Product Owner:** Chhavi Siddarth Wadhwa (confirmed by the team lead)                                                                                                                                                                                                                                                                                                                                                                  
**Team members named in the assignment:** Dhanya S Prasad, Gagan P, and Harsha K. Their GitHub accounts and collaborator acceptance have not been verified.

## 1. Quick status for the checkpoint

| Checkpoint point | Current status | What to show |
|---|---|---|
| 1. Organisation on Git | **Needs confirmation.** The repository is under the personal GitHub account `chhavi2308-s`; an official course/team organization has not been verified. | Repository page and owner. Ask the instructor whether a GitHub organization is mandatory before claiming this item is complete. |
| 2. Repo on Git | **Verified.** The repository exists and contains the project. PR #13 was merged into `main`. | Repository, `main`, and merged PR. |
| 3. Project enabled | **Partly verified across tools.** Jira project OEPSE exists. A private GitHub Project exists, but its board is empty. | Jira board/backlog and GitHub Project. Explain Jira is the proposed authoritative backlog; do not present the empty GitHub board as populated. |
| 4. Team members as collaborators | **Not verified.** No verified usernames or accepted invitations are recorded. | Repository access settings only if useful; do not claim invitations are complete. The owner must invite confirmed GitHub accounts and verify acceptance. |
| 5. First set of deliverables (Part 1) | **Present, with review still needed.** SRS, SAD, test plan, RTM, STRIDE table, and diagrams are in the repository. Implementation and verification do not establish full SRS compliance. | Open the documents listed below and briefly explain their purpose and how they relate. |
| 7. Backlogs ready (partial is fine) | **Ready in Jira.** OEPSE has 29 issues: 5 epics, 23 stories, and 1 task. Two proposed sprints contain 17 issues total; 12 issues remain in the backlog. Estimates are provisional; work items are unassigned. | Jira backlog, then each sprint. Mention the three Must requirements kept outside the proposed sprints. |
| 8. Started sprint (optional) | **Not started.** Sprint dates are in the future and no sprint has been started. | Show the planned sprint dates only. Do not press **Start sprint** for this checkpoint. |

## 2. Clickable presentation links

Open these in separate tabs before presenting. The links below are direct routes; the account must already be signed in to see private pages.

### GitHub code and collaboration

- [Repository](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject)
- [Main branch commits](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/commits/main)
- [Merged pull request #13](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/pull/13)
- [GitHub Actions](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/actions)
- [Repository access / collaborators settings](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/settings/access)
- [Branches](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/branches)

### GitHub Project

- [Online Exam Portal GitHub Project](https://github.com/users/chhavi2308-s/projects/1)
- [Project view](https://github.com/users/chhavi2308-s/projects/1/views/1)

The Project is private and currently empty. It exists, but Jira carries the detailed backlog. Avoid copying all Jira issues into GitHub as duplicate work items unless the course specifically requires a populated GitHub Project.

### Jira

- [Jira OEPSE project summary](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/summary)
- [Jira Scrum board](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70)
- [Jira backlog and sprint planning](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog)

Jira account/site: [chhavis0823.atlassian.net](https://chhavis0823.atlassian.net). This is the personal Jira site used for the project; verify with the instructor/team if a shared university site is required.

### Part 1 documents and project records

- [SRS — PDF](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/blob/main/SRS/SRS_Online_Exam_Portal.pdf) · [editable DOCX](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/blob/main/SRS/SRS_Online_Exam_Portal.docx)
- [Software Architecture and Design Specification (SAD)](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/blob/main/SAD_Online_Exam_Portal_v1.4.docx)
- [Software Test Plan (STP) — PDF](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/blob/main/STP/Online_Exam_Portal_Software_Test_Plan_v1.1.pdf) · [editable DOCX](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/blob/main/STP/Online_Exam_Portal_Software_Test_Plan_v1.1.docx)
- [Requirements Traceability Matrix (RTM)](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/blob/main/SRS/RTM_Online_Exam_Portal.xlsx)
- [Security / STRIDE traceability table](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/blob/main/Architecture/Traceability%20to%20Requirements%20%26%20Security%20Architecture%20%E2%80%93%20STRIDE%20Table.xlsx)
- [Design diagrams folder](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/tree/main/Design/diagrams)
- [Team handover](TEAM_HANDOVER.md) · [test execution record](test-execution.md) · [implementation gap register](implementation-gap-register.md)

## 3. A short opening you can say

> “We are Team 6, and our project is an Online Exam Portal for creating and taking multiple-choice exams with evaluation. I’m Chhavi, the team lead and Product Owner. We have a React and Vite client, a Node.js and Express API, and MongoDB with Mongoose. Our code is in GitHub, and our Jira project holds the detailed requirements-based backlog. Today I’ll show the repository and project setup, our Part 1 documents, the current working workflow and test evidence, and the work still planned.”

Keep the last clause: it makes clear this is a checkpoint, not a claim that every SRS requirement is finished.

## 4. Walkthrough for every item in the screenshot

### Item 1 — Organisation on Git

**Click:** [Repository](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject). Look at the owner shown beside the repository name.

**Explain:** “The repository currently belongs to the personal GitHub account `chhavi2308-s`. We have not verified that it belongs to an official course/team organization. I will confirm with the instructor whether the checkpoint requires an organization before treating this point as complete.”

**Do not:** say the university organization is configured, or create/move a repository during the presentation. Moving a repository can affect access and links and needs an agreed destination.

### Item 2 — Repo on Git

**Click:** [Repository](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject), then [merged PR #13](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/pull/13), and if asked [main commits](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/commits/main).

**Explain:** “The project has an existing GitHub repository and shared commit history. The feature branch was delivered through PR #13, which is merged into `main`. We use focused feature branches and pull requests so changes can be reviewed.”

**Explain the normal team flow:** start from updated `main` → create `feature/...`, `fix/...`, or `docs/...` branch → make a focused change → run checks → commit → open a pull request linked to the Jira issue → request review → merge after review/checks.

### Item 3 — Project enabled

Show both systems so the distinction is clear:

1. **Click:** [Jira OEPSE board/backlog](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog).
2. **Then click:** [GitHub Project](https://github.com/users/chhavi2308-s/projects/1/views/1).

**Explain:** “The Jira Software project OEPSE is configured for planning. The GitHub Project is also created, but it is private and empty. To avoid duplicate tickets, Jira is our detailed backlog, while GitHub is where we keep code, pull requests, and CI.”

**Important limitation:** If the instructor expects the GitHub Project itself to contain work items, that requirement needs clarification and a deliberate linking/import approach. Do not imply the empty board is a populated backlog.

### Item 4 — Team members as collaborators

**Click:** [Repository access settings](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/settings/access).

**Explain:** “The assignment names our four Team 6 members. I am the confirmed team lead/Product Owner. The other members’ GitHub usernames and accepted collaborator invitations have not been verified, so I cannot claim access is complete.”

**Action after the checkpoint:** get each member’s exact GitHub username, invite them using repository access settings, select the least privilege role accepted by the course, and check that each person accepts. Do not guess accounts based on names.

### Item 5 — First set of deliverables (Part 1)

Open the [Part 1 documents](#part-1-documents-and-project-records) using the links above. You do not need to read every page aloud. Briefly say what each document is for:

- **SRS:** defines what the system must do and its quality requirements. It is the primary requirements source.
- **SAD:** explains the planned architecture and design; compare it to the implemented client, API, and database.
- **STP:** describes planned test approach and cases. A plan is not proof that every case ran.
- **RTM:** maps requirements to design, implementation, and tests; use it to show coverage and gaps.
- **STRIDE table:** records security threats and mitigations in a structured way.
- **Diagrams:** communicate architecture and supported workflows; they should be updated if they disagree with the implementation.

**Explain accurately:** “The Part 1 document set is present in the repository. We have implementation evidence and a test execution record, but the project is not fully compliant with every SRS requirement yet. Some document-version and coverage consistency checks remain.”

### Item 7 — Backlog ready

**Click:** [Jira backlog](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog). Point to the two sprint sections and the product backlog section. If asked, open [project summary](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/summary).

**Verified planning snapshot:**

- **29 issues:** 5 epics, 23 stories, and 1 task.
- **Sprint 1:** 19–23 October 2026; 9 issues; **33 provisional points**.
- **Sprint 2:** 26–30 October 2026; 8 issues; **45 provisional points**.
- **Product backlog:** 12 issues; **30 provisional points**.
- Issues remain To Do and unassigned. Estimates are planning estimates only; team capacity and velocity have not been agreed.

**Must-priority work deliberately outside the two proposed sprints:**

- **FR-OE-024 — OEPSE-20:** review exam attempts and statistics (5 points).
- **NFR-OE-004 — OEPSE-26:** availability, backup, and retention targets (8 points).
- **NFR-OE-009 — OEPSE-27:** accessibility and browser support (5 points).

**Explain:** “We mapped the backlog to SRS requirement IDs. These Must items remain in the backlog because fitting them into the proposed sprint scope without team capacity and dependency confirmation would be misleading. The team should discuss whether to extend scope, reduce other work, or schedule these later.”

**Product ownership:** “I’m the confirmed Team 6 lead and Product Owner. I maintain priority with the team; contributors take agreed stories, link their code and test evidence, and use pull requests for review. Other assignees are intentionally blank until we agree responsibilities and confirm accounts.”

### Item 8 — Started sprint (optional)

**Click:** [Jira backlog](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog) and show the planned sprint date labels.

**Explain:** “The sprints are planned for October 19–23 and October 26–30, 2026. They have not been started. Starting a sprint is optional for this checkpoint, and we have not confirmed team capacity or readiness.”

Do not click **Start sprint** during this checkpoint unless the whole team has agreed and the instructor expects it.

## 5. Explain the product and current implementation

### Stack and architecture

- **Frontend:** React and Vite.
- **Backend:** Node.js and Express.
- **Data layer:** MongoDB using Mongoose.
- **Package setup:** npm workspaces.

**Plain-language explanation:** “The browser presents the exam interface. It sends requests to the Express API. The API applies authentication, authorization, validation, timing, and scoring rules, then uses MongoDB for persistent records. The server is responsible for trusted scoring and exam access decisions; the browser is not trusted to set a score or grant itself a role.”

### What we have evidence for

- The automated server test suite ran successfully: **12 tests passed, 0 failed**. It covers scoring and API workflow behavior such as authentication, lockout, role and CSRF checks, question validation, assigned exam access, saving answers, single submission, server scoring, answer-key protection, and expired-attempt handling.
- The production build ran successfully: server syntax checks passed and Vite produced a production client build.
- Dependency installation completed with `npm ci`; npm reported **0 vulnerabilities** in that audit.
- The user reported logging in to the local demo as the instructor and seeing a subject. This was user-observed; it is not evidence that every instructor or student screen was tested end to end.
- Do not say the full SRS is implemented. See [implementation gap register](implementation-gap-register.md) for incomplete and partial items.

### What remains incomplete or needs more verification

- A complete student browser walkthrough has not been freshly verified for this checkpoint.
- The test plan contains broader test obligations than the 12 automated tests. Do not say all STP cases passed.
- Full instructor question/exam authoring and the full SRS feature set require further verification/implementation; consult the gap register and RTM rather than promising features from memory.
- Production-level security, load/performance, availability/backup, accessibility, and cross-browser evidence is not established by the current unit/integration test run.
- Team collaborator acceptance and whether an official GitHub organization is required are unresolved.

## 6. Run the local demo and describe what you see

Use the existing project checkout; do not make a fresh repository. In Windows PowerShell:

```powershell
Set-Location "C:\Users\hp\Documents\Codex\2026-10-13\master-prompt-end-to-end-software\work\repo"
npm.cmd ci
npm.cmd run demo
```

PowerShell may block `npm.ps1` due to its script execution policy. Use `npm.cmd` exactly as above; do not change the machine-wide execution policy.

Then open:

- [Local portal](http://localhost:5173)
- [Local API health check](http://localhost:4000/api/health)

Use only the temporary demo accounts shown by the application/demo instructions. The known demo account identifiers are `instructor@example.test` and `student@example.test`; use the temporary password printed by the local demo in your own terminal. Never paste that password into this document, screenshots, Jira, or chat. Demo data is disposable; do not use real student or exam information.

**Suggested honest walkthrough:**

1. Show the portal landing/login page.
2. Sign in as the instructor using the temporary local demo credentials. The instructor login and a subject were reported as working by the project owner.
3. Show only screens that load correctly in this run. Describe an exam or subject only to the extent that it is visible and verified.
4. If you have time, sign out and attempt the student demo yourself. Do not claim the student workflow is verified until you have completed it in the browser.
5. If a screen fails, say so, capture the non-sensitive error, and use the automated tests as separate evidence—not as proof that the UI path worked.

Stop the demo with **Ctrl+C** in its terminal. Do not display terminal output containing generated passwords or private environment values to the class.

## 7. Likely questions and clear answers

**What is the project?**  
“A web-based multiple-choice exam portal that supports exam access and evaluation. The exact required behavior is defined by our SRS.”

**How do you prevent a student from viewing another exam or changing a score?**  
“The API enforces authentication and role/access checks, and the server computes the result from saved answers. Automated tests cover assigned-exam restrictions, authorization, and server-side scoring. We still need broader security and end-to-end evidence before claiming complete security compliance.”

**How do you know it works?**  
“We ran 12 automated backend tests with 12 passing, then ran the production build successfully. I personally observed the instructor login and subject in the local demo. The full student UI path and every SRS requirement have not all been verified.”

**Why are some Must requirements outside the sprints?**  
“We did not have agreed team capacity or velocity. We kept them visible in the backlog rather than overcommitting: exam-attempt statistics, availability/backup/retention, and accessibility/browser support. The team and Product Owner need to decide their schedule against capacity and dependencies.”

**Why use Jira and GitHub Projects?**  
“Jira currently holds the detailed requirements-based issues and sprint plan. GitHub is our code, pull-request, and CI home. The GitHub Project exists but is empty, so we are avoiding duplicate tickets until the course confirms a populated GitHub board is required.”

**Are all team members collaborators?**  
“That is not verified yet. We need the exact GitHub usernames and accepted invitations. We will confirm access before claiming completion.”

**Is the project fully complete?**  
“No. We have a working baseline and passing automated checks, but the RTM and gap register identify work and verification still needed. We are not claiming full SRS compliance.”

## 8. Quick rehearsal plan (about 5 minutes)

| Time | Show | Say |
|---|---|---|
| 0:00–0:30 | Project introduction | Purpose, Team 6, your confirmed Product Owner role, stack. |
| 0:30–1:00 | [GitHub repository](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject) and [PR #13](https://github.com/chhavi2308-s/online-exam-portal-se-miniproject/pull/13) | Repository exists; PR is merged; explain branch/review workflow. State owner is personal account; organization requirement is still to confirm. |
| 1:00–1:40 | Part 1 documents using the links above | Explain SRS, SAD, STP, RTM, STRIDE, diagrams in one sentence each. Mention they exist and coverage is still being reconciled. |
| 1:40–2:40 | Local app at [localhost:5173](http://localhost:5173) | Show the instructor login and only the verified page(s). State which actions you personally tested today. |
| 2:40–3:15 | Test/build evidence | Report exact automated results: 12/12 tests; build passed. Distinguish these from unrun manual/STP cases. |
| 3:15–4:20 | [Jira backlog](https://chhavis0823.atlassian.net/jira/software/projects/OEPSE/boards/70/backlog) | Show 29 issue totals, both sprint dates/points, 12 backlog issues, provisional estimates, and three Must items outside the sprints. |
| 4:20–4:40 | [GitHub Project](https://github.com/users/chhavi2308-s/projects/1/views/1) | Be candid that it exists but is empty; Jira is the detailed backlog for now. |
| 4:40–5:00 | Close | State collaborator and organization confirmation, student UI rehearsal, and future sprint work still needed. |

If time is shorter, prioritize: repository + merged PR, one real application flow, actual test results, Jira backlog, and honest blockers.

## 9. Checklist before the presentation

- [ ] Confirm with the instructor whether “Organisation on Git” means an official GitHub organization, or whether the existing personal-owner repository is acceptable.
- [ ] Ask each teammate for their exact GitHub username; invite only verified accounts and check invitation acceptance if team access is required.
- [ ] Confirm all four teammates can attend, as the checkpoint announcement requests the full team.
- [ ] Open the repository, PR #13, Part 1 docs, local demo, Jira backlog, and GitHub Project before screen sharing.
- [ ] Rehearse the local instructor login. Test the student path yourself if time permits; report only what you observed.
- [ ] Keep generated demo passwords and personal data out of screen shares, screenshots, and notes.
- [ ] Do not click **Start sprint** just to make the board look active; sprint start is optional and requires team agreement.
- [ ] Keep the SRS and gap register ready for questions about scope and incomplete requirements.

## 10. Your Product Owner responsibilities for this checkpoint

**Already done and evidenced:** the Jira project and structured backlog are in place, requirement IDs are mapped in the drafts/work items, two proposed sprint date ranges are planned, and you are recorded as Team Lead/Product Owner by your confirmation. The actual Jira issues are unassigned; this avoids inventing accounts or responsibilities.

**Your next PO decisions:**

1. Confirm whether the course expects an official GitHub organization and, if so, identify the correct organization with the instructor/team.
2. Verify teammate GitHub accounts and collaborator access.
3. Discuss the provisional points and actual team availability; agree assignments as a team.
4. Decide with the team how to schedule **OEPSE-20**, **OEPSE-26**, and **OEPSE-27**, which are Must-priority and outside the proposed sprints.
5. Confirm whether the GitHub Project must be populated or whether Jira remains the sole issue backlog. Avoid duplicating all issues without course direction.
6. Keep Jira acceptance criteria and progress current; ask contributors to link commits/PRs and test evidence to the relevant Jira issues.

## 11. Final reminder

This is a checkpoint guide, not a certificate of completion. Show actual pages, state actual test results, and call out items that are still pending. If a page or demo step does not work live, explain what is verified by automated tests separately from what is visible in the browser.
