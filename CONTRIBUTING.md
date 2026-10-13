# Contributing

The team lead retains Product Owner responsibility: they maintain priorities and accept the scope of backlog items. Team members should only be assigned work after the team agrees. Do not infer roles from this workflow document.

## Change workflow

1. Update local `main` from `origin/main`.
2. Create a focused `feature/<short-description>`, `fix/<short-description>`, or `docs/<short-description>` branch.
3. Link the change to an approved GitHub issue and implement only that scope.
4. Run `npm test` and `npm run build`; include the actual result in the pull request.
5. Commit with a clear message such as `feat: add timed exam submission` or `test: cover exam ownership`.
6. Push the topic branch and open a pull request; request review from the repository owner or assigned reviewer.
7. Address feedback and merge only after the required checks and review are satisfied.

Do not push directly to `main`. Do not include credentials, student personal information, real exam questions/answers, generated database files, or local `.env` files. Use safe dummy data only.

## Definition of Done

- Acceptance criteria are met and trace to an SRS requirement or are explicitly identified as enabling work.
- Authorization and invalid-input behavior are covered where relevant.
- Automated checks pass, or a blocker is recorded honestly.
- Documentation is updated to describe supported behavior and limitations.
- A reviewer has approved the pull request. Remote protection settings still require an authorized repository maintainer to configure.
