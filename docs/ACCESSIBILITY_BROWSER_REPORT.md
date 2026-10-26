# Accessibility & Browser Support Report

Issue #24 (Jira OEPSE-27) · SRS **NFR-OE-008** (WCAG 2.1 AA colour contrast and keyboard navigation on exam pages) and **NFR-OE-009** (latest two major versions of Chrome, Firefox and Edge; usable from 360 px).

**Run date:** 26 Oct 2026 · **Build:** branch `feature/issue-24-accessibility-browsers` · **Environment:** macOS, `npm run demo` (local, disposable data)

## How to re-run

```bash
npm run demo                       # prints the temporary password
npx playwright install chromium firefox webkit
DEMO_PASSWORD=<password> npm run check:a11y -- chromium firefox webkit chrome   # add msedge where Edge is installed
```

For each browser, `tools/a11y-check.mjs` loads the login, instructor dashboard, student dashboard, exam page and submit dialog at **1280 px and 360 px**. On each one it runs axe-core with the WCAG 2.0/2.1 A and AA rules and checks for horizontal scrolling. It then checks keyboard handling of the submit dialog. It exits non-zero on any problem.

## Results (after fixes)

| Browser (engine) | Version | Screens × widths | WCAG A/AA violations | Horizontal overflow at 360 px | Dialog keyboard check |
|---|---|---|---|---|---|
| Google Chrome (installed) | 156.0.8078.47 | 5 × 2 | 0 | none | pass |
| Chromium (Playwright) | 156.0.8078.4 | 5 × 2 | 0 | none | pass |
| Firefox (Playwright) | 157.0 | 5 × 2 | 0 | none | pass |
| WebKit / Safari engine (Playwright) | 27.2 | 5 × 2 | 0 | none | pass |

44/44 checks passed. Raw output is in the PR description.

### Manual keyboard walkthrough (Chromium)

Completed with the keyboard only:
1. Tab → email → Tab → password → Enter signs in.
2. Tab order on the dashboard: brand link → Sign out → notification card (Enter marks it read) → Start/Continue exam.
3. On the exam page: Tab reaches "Flag for review" (Enter toggles it), then the answer options (Space selects), then Submit.
4. Enter on Submit opens the dialog with focus on "Go back". Tab cycles only between the dialog's two buttons. Esc closes it.
5. Every focused control shows a 3 px blue focus ring.

## Problems found and fixed

| Problem (axe rule) | Where | Before | Fix |
|---|---|---|---|
| Text contrast below 4.5:1 (`color-contrast`, serious) | 14 text styles on every screen: section labels, subtitles, footers, user role, Sign out, exam details, timer label, question count, empty states | 2.29:1 to 4.08:1 | Muted text now `#53667d` (5.5:1 on the page background) and labels `#4f6f8a` (4.9:1) |
| `aria-label` on an element with no role (`aria-prohibited-attr`) | Unread notification dot | invalid | `role="img"` added |
| Clickable notification card not reachable by keyboard | Student notifications | mouse only | `role="button"`, `tabIndex=0`, Enter/Space handler |
| Focus could leave the open dialog | Submit dialog | Tab moved to the page behind | Tab and Shift+Tab cycle inside the dialog; Esc closes |
| No visible focus ring on some controls | Buttons, links, radios | browser default or none | Global `:focus-visible` outline and highlighted option row |

Already present from PR #49: timer `role="timer"`, screen-reader announcements at 5 and 1 minutes, flag button with `aria-pressed`, radio group labels, `role="dialog"` with `aria-modal`.

## Not covered (be explicit in the demo)

- **Microsoft Edge was not tested:** it isn't installed on the test machine. Edge uses the same Chromium engine as Chrome 156, which passed. Run `npm run check:a11y -- msedge` on a machine with Edge to close this.
- **Only the latest version of each browser was tested.** NFR-OE-009 asks for the latest two major versions; the previous versions were not available.
- **Automated tools find only part of WCAG issues.** No screen-reader session (NVDA, VoiceOver) and no test with users who rely on assistive technology.
- **Instructor results table** was scanned only in its empty state (no submitted attempts in the fresh demo data).
- Scope is the exam-taking pages required by NFR-OE-008, plus login and dashboards. The question-bank and exam-setup forms were not audited separately.
