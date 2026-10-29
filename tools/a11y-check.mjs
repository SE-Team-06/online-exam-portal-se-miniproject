// Accessibility and browser check for the exam pages (issue #24, NFR-OE-008, NFR-OE-009).
// Usage: start `npm run demo`, then
//   DEMO_PASSWORD=<password printed by the demo> npm run check:a11y [-- chromium firefox webkit chrome msedge]
// Browsers: `npx playwright install chromium firefox webkit`. `chrome` / `msedge` use the installed browser.
import { chromium, firefox, webkit } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:5173/';
const password = process.env.DEMO_PASSWORD;
if (!password) { console.error('Set DEMO_PASSWORD to the password printed by `npm run demo`.'); process.exit(2); }
const launchers = {
  chromium: () => chromium.launch(), firefox: () => firefox.launch(), webkit: () => webkit.launch(),
  chrome: () => chromium.launch({ channel: 'chrome' }), msedge: () => chromium.launch({ channel: 'msedge' }),
};
const selected = process.argv.slice(2).length ? process.argv.slice(2) : ['chromium', 'firefox', 'webkit'];
const WIDTHS = [1280, 360];
let failures = 0;

async function check(page, label) {
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const problems = axe.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
  if (overflow > 0) problems.push(`horizontal overflow ${overflow}px`);
  failures += problems.length;
  console.log(`${problems.length ? 'FAIL' : 'PASS'} ${label}${problems.length ? `\n  ${problems.join('\n  ')}` : ''}`);
}
async function signIn(page, email) {
  await page.goto(baseUrl);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign in' }).click();
}
async function atWidths(page, label) {
  for (const width of WIDTHS) { await page.setViewportSize({ width, height: 800 }); await check(page, `${label} @${width}px`); }
}

for (const name of selected) {
  const browser = await launchers[name]();
  const tag = `${name} ${browser.version()}`;
  try {
    const page = await (await browser.newContext()).newPage();
    await page.goto(baseUrl); await atWidths(page, `${tag} | login`);
    await signIn(page, 'instructor@example.test'); await page.getByText('Your exams').waitFor();
    await atWidths(page, `${tag} | instructor dashboard`);
    await page.getByRole('button', { name: 'Sign out' }).click();
    await signIn(page, 'student@example.test'); await page.getByText('Previous results').waitFor();
    await atWidths(page, `${tag} | student dashboard`);
    const start = page.getByRole('button', { name: /Start exam|Continue exam/ });
    if (await start.count()) {
      await start.click(); await page.getByRole('timer').waitFor();
      await atWidths(page, `${tag} | exam page`);
      await page.getByRole('button', { name: 'Submit exam' }).focus(); await page.keyboard.press('Enter');
      await page.getByRole('dialog').waitFor();
      await atWidths(page, `${tag} | submit dialog`);
      const focusInDialog = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));
      await page.keyboard.press('Tab'); await page.keyboard.press('Tab');
      const stillInDialog = await page.evaluate(() => Boolean(document.activeElement?.closest('[role="dialog"]')));
      await page.keyboard.press('Escape');
      const closed = (await page.getByRole('dialog').count()) === 0;
      const ok = focusInDialog && stillInDialog && closed;
      if (!ok) failures += 1;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${tag} | keyboard: dialog takes focus, Tab stays inside, Esc closes`);
    } else console.log(`SKIP ${tag} | no open exam to check (restart the demo)`);
  } catch (error) { failures += 1; console.log(`FAIL ${tag} | ${error.message.split('\n')[0]}`); }
  await browser.close();
}
console.log(failures ? `\n${failures} problem(s) found` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
