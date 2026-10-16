// Optional local browser smoke: start npm run preview separately, then run this.
// Set PLAYWRIGHT_MODULE to an absolute Playwright index.mjs if not installed locally.
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { evaluateOperator, OPERATORS } from '../src/game/engine.js';

const modulePath = process.env.PLAYWRIGHT_MODULE;
const { chromium } = await import(modulePath ? pathToFileURL(modulePath).href : 'playwright');
const baseURL = process.env.SMOKE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE || undefined });
await mkdir('artifacts', { recursive: true });
async function ready(page) {
  await page.waitForFunction(() => document.querySelector('#result')?.open || [...document.querySelectorAll('[data-operator]')].some(button => !button.disabled));
}
async function activate(page, selector) {
  const control = page.locator(selector);
  if (page.smokeTouch) await control.tap();
  else await control.click();
}
async function turn(page, correct, keyboard = false, helpDuringFeedback = false) {
  await ready(page);
  assert.equal(await page.locator('#result').evaluate(element => element.open), false, 'Battle ended before expected turn');
  // The spoken equation separates adjacent number spans unambiguously.
  const text = await page.locator('#equation').getAttribute('aria-label');
  const numbers = text.match(/-?\d+/g)?.map(Number);
  assert.equal(numbers?.length, 3, `Cannot parse arithmetic question: ${text}`);
  const [left, right, result] = numbers;
  const answer = OPERATORS.find(operator => evaluateOperator(left, right, operator) === result);
  assert.ok(answer, `No valid answer: ${text}`);
  const choice = correct ? answer : OPERATORS.find(operator => operator !== answer);
  if (keyboard === 'enter') {
    await page.locator(`[data-operator="${choice}"]`).focus();
    await page.keyboard.press('Enter');
  } else if (keyboard) await page.keyboard.press(String(OPERATORS.indexOf(choice) + 1));
  else await activate(page, `[data-operator="${choice}"]`);
  assert.equal(await page.locator('[data-operator]:enabled').count(), 0, 'Answer controls must lock during feedback');
  assert.ok(await page.locator(correct ? '#feedback.success' : '#feedback.mistake').isVisible(), 'Expected feedback missing');
  if (helpDuringFeedback) {
    await activate(page, '#help');
    await page.locator('#close-guide').focus();
  }
  // Wait for the completed feedback transition, never read the revealed old question.
  await ready(page);
  if (keyboard === 'enter' && !helpDuringFeedback) {
    assert.equal(await page.evaluate(() => document.activeElement?.matches('[data-operator]:enabled')), true, 'Keyboard focus must return to an operator after feedback');
    for (const key of ['Enter', ' ']) {
      const repeated = await page.evaluate(key => {
        const event = new KeyboardEvent('keydown', { key, repeat: true, bubbles: true, cancelable: true });
        const accepted = document.activeElement.dispatchEvent(event);
        return { accepted, prevented: event.defaultPrevented };
      }, key);
      assert.deepEqual(repeated, { accepted: false, prevented: true }, `Held ${JSON.stringify(key)} must suppress native operator activation`);
    }
    assert.equal(await page.locator('[data-operator]:enabled').count(), 4, 'Held activation keys must not submit a second answer');
  }
  if (helpDuringFeedback) {
    assert.equal(await page.locator('#guide').evaluate(element => element.open), true);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'close-guide', 'Feedback completion must not steal focus from help');
    await activate(page, '#close-guide');
  }
}
async function checkLayout(page, label) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  assert.equal(overflow, false, `${label}: horizontal page overflow`);
}
try {
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 320, height: 568 }]]) {
    const context = await browser.newContext({ viewport, isMobile: name === 'mobile', hasTouch: name === 'mobile', reducedMotion: 'reduce' });
    const page = await context.newPage();
    page.smokeTouch = name === 'mobile';
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    page.on('requestfailed', request => errors.push(`${request.failure()?.errorText} ${request.url()}`));
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    await checkLayout(page, `${name} title`);
    await page.screenshot({ path: `artifacts/${name}-title.png`, fullPage: true });
    if (name === 'desktop') await page.locator('input[name="mode"][value="relaxed"]').check();
    await activate(page, '#begin');
    await page.locator('canvas').waitFor();
    assert.equal(await page.locator('#potion').isDisabled(), true, 'Potion must be disabled at full health');
    if (name === 'mobile') {
      const boxes = await page.locator('[data-operator]').evaluateAll(buttons => buttons.map(button => { const box = button.getBoundingClientRect(); return { top: box.top, bottom: box.bottom, left: box.left, right: box.right }; }));
      assert.equal(boxes.length, 4);
      for (const box of boxes) assert.ok(box.top >= 0 && box.bottom <= viewport.height && box.left >= 0 && box.right <= viewport.width, 'All operator buttons must fit in the initial mobile viewport');
    }
    for (let index = 0; index < 3; index += 1) await turn(page, true);
    if (name === 'desktop') {
      await turn(page, true, 'enter');
      await turn(page, true, 'enter', true);
    }
    await activate(page, '#help');
    const beforeHelp = await page.locator('#equation').getAttribute('aria-label');
    await page.keyboard.press('1');
    assert.equal(await page.locator('#equation').getAttribute('aria-label'), beforeHelp, 'Help dialog must block answer shortcuts');
    assert.equal(await page.locator('[data-operator]:enabled').count(), 4);
    await activate(page, '#close-guide');
    await turn(page, true, true);
    const sound = page.locator('#sound');
    assert.equal(await sound.getAttribute('aria-pressed'), 'false');
    await activate(page, '#sound');
    assert.equal(await sound.getAttribute('aria-pressed'), 'true');
    await activate(page, '#sound');
    assert.equal(await sound.getAttribute('aria-pressed'), 'false');
    await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })));
    assert.equal(await page.locator('canvas').count(), 1, 'Persisted pagehide must retain the scene');
    await turn(page, true);
    await checkLayout(page, `${name} battle`);
    await page.screenshot({ path: `artifacts/${name}-battle.png`, fullPage: true });
    if (name === 'desktop') {
      const intent = await page.locator('#enemy-intent').innerText();
      const damage = Number(intent.match(/\d+/)?.[0]);
      assert.ok(damage > 0 && damage < 16, 'Relaxed guardian intent should show reduced damage');
      const hpBefore = Number(await page.getByRole('progressbar', { name: 'Your health', exact: true }).getAttribute('aria-valuenow'));
      await turn(page, false);
      assert.equal(Number(await page.getByRole('progressbar', { name: 'Your health', exact: true }).getAttribute('aria-valuenow')), hpBefore - damage, 'Enemy intent must match actual damage');
      const snapshot = await page.locator('#equation').getAttribute('aria-label');
      const streak = await page.locator('#streak').innerText();
      const correct = await page.locator('#stat-correct').innerText();
      assert.equal(await page.locator('#potion').isEnabled(), true);
      await activate(page, '#potion');
      assert.equal(await page.locator('#equation').getAttribute('aria-label'), snapshot, 'Potion must preserve the question');
      assert.equal(await page.locator('#streak').innerText(), streak, 'Potion must preserve the streak');
      assert.equal(await page.locator('#stat-correct').innerText(), correct);
      assert.equal(await page.locator('#potion-count').innerText(), '0');
      assert.equal(await page.locator('#potion').isDisabled(), true);
      assert.equal(await page.getByRole('progressbar', { name: 'Your health', exact: true }).getAttribute('aria-valuenow'), '100');
      for (let index = 0; index < 50 && !await page.locator('#result').evaluate(element => element.open); index += 1) await turn(page, true);
      assert.equal(await page.locator('#result').evaluate(element => element.open), true, 'Victory dialog did not open');
      assert.equal(await page.locator('#result-title').innerText(), 'You brought the light.');
      const spells = Number(await page.locator('#result-spells').innerText());
      assert.equal(await page.locator('#result-accuracy').innerText(), `${Math.round(spells / (spells + 1) * 100)}%`, 'Potion must not count as an attempt');
      assert.match(await page.locator('#result-summary').innerText(), /^Relaxed trail/);
      await page.screenshot({ path: 'artifacts/desktop-victory.png', fullPage: true });
      await activate(page, '#play-again');
      assert.equal(await page.locator('#enemy-intent').innerText(), 'If wrong: −8 HP', 'Retry must preserve Relaxed mode');
      for (let index = 0; index < 30 && !await page.locator('#result').evaluate(element => element.open); index += 1) await turn(page, false);
      assert.equal(await page.locator('#result').evaluate(element => element.open), true, 'Defeat dialog did not open');
      assert.equal(await page.locator('#result-title').innerText(), 'Rest your lantern.');
      assert.equal(await page.locator('#result-accuracy').innerText(), '0%');
      await page.screenshot({ path: 'artifacts/desktop-defeat.png', fullPage: true });
      await page.locator('#play-again').click();
      await ready(page);
      assert.equal(await page.locator('#result').evaluate(element => element.open), false);
      assert.equal(await page.getByRole('progressbar', { name: 'Your health', exact: true }).getAttribute('aria-valuenow'), '100');
      assert.equal(await page.locator('#stat-correct').innerText(), '00');
      await turn(page, true);
    }
    if (errors.length) throw new Error(`${name}: ${errors.join('; ')}`);
    if (name === 'mobile') {
      await page.setViewportSize({ width: 568, height: 320 });
      await checkLayout(page, 'mobile landscape resize');
      await page.screenshot({ path: 'artifacts/mobile-landscape.png', fullPage: true });
    }
    console.log(`${name}: ${name === 'desktop' ? 'victory, defeat, retry' : 'three correct answers'}, layout and runtime checks passed`);
    await context.close();
  }
} finally {
  await browser.close();
}
