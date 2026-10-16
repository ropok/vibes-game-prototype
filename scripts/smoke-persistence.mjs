import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { evaluateOperator, OPERATORS } from '../src/game/engine.js';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const baseURL = process.env.SMOKE_URL || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE || undefined });
const saveKey = 'mathventures-save-v1';
const resultKey = 'mathventures-result-v1';
async function saved(page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key))?.state, saveKey); }
async function ready(page) { await page.waitForFunction(() => document.querySelector('#result')?.open || document.querySelector('[data-operator]:enabled')); }
async function submit(page, correct) {
  await ready(page);
  const numbers = (await page.locator('#equation').getAttribute('aria-label')).match(/\d+/g).map(Number);
  const answer = OPERATORS.find(operator => evaluateOperator(numbers[0], numbers[1], operator) === numbers[2]);
  assert.ok(answer);
  await page.locator(`[data-operator="${correct ? answer : OPERATORS.find(operator => operator !== answer)}"]`).click();
  assert.equal(await page.locator('[data-operator]:enabled').count(), 0);
}
async function checkState(page, expected) {
  assert.equal(await page.getByRole('progressbar', { name: 'Your health', exact: true }).getAttribute('aria-valuenow'), String(expected.playerHp));
  assert.equal(await page.getByRole('progressbar', { name: 'Guardian health', exact: true }).getAttribute('aria-valuenow'), String(expected.enemyHp));
  assert.equal(Number(await page.locator('#stat-correct').innerText()), expected.correct);
  assert.equal(Number(await page.locator('#stat-best').innerText()), expected.bestStreak);
  assert.equal(Number(await page.locator('#streak span').innerText()), expected.streak);
  assert.equal(Number(await page.locator('#potion-count').innerText()), expected.potions);
  const puzzle = expected.puzzle;
  assert.equal(await page.locator('#equation').getAttribute('aria-label'), `${puzzle.left}, missing operator, ${puzzle.right}, equals ${puzzle.result}`);
  assert.deepEqual(await saved(page), expected, 'Resume must preserve the full accepted save without replaying a turn');
}
async function resume(page, expected) {
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#continue-button').isVisible(), true);
  assert.deepEqual(await saved(page), expected, 'Loading title must not replace the active save');
  await page.locator('#continue-button').click();
  await ready(page);
  await checkState(page, expected);
}
try {
  await mkdir('artifacts', { recursive: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.locator('#begin').click();
  for (const correct of [true, false]) {
    const previous = await saved(page);
    await submit(page, correct);
    const expected = await saved(page);
    assert.equal(expected.attempts, previous.attempts + 1, 'Accepted turn must persist synchronously during feedback');
    assert.equal(expected.correct, previous.correct + Number(correct));
    assert.equal(await page.locator('[data-operator]:enabled').count(), 0, 'Reload must occur before feedback completes');
    await resume(page, expected);
  }
  assert.equal(await page.locator('#potion').isEnabled(), true);
  await page.locator('#potion').click();
  const healed = await saved(page);
  assert.equal(healed.potions, 0);
  await resume(page, healed);
  assert.equal(await page.locator('#potion').isDisabled(), true);
  await page.screenshot({ path: 'artifacts/desktop-resumed.png', fullPage: true });
  // Merely selecting a new trail on the title must not overwrite the run.
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('input[name="mode"][value="relaxed"]').check();
  assert.deepEqual(await saved(page), healed);
  await page.locator('#begin').click();
  const replacement = await saved(page);
  assert.equal(replacement.mode, 'relaxed');
  assert.equal(replacement.attempts, 0);
  assert.equal(replacement.playerHp, 100);
  assert.equal(replacement.potions, 1);
  for (let index = 0; index < 50 && !await page.locator('#result').evaluate(element => element.open); index += 1) { await submit(page, true); await ready(page); }
  assert.equal(await page.locator('#result').evaluate(element => element.open), true);
  assert.equal(await page.locator('#result-title').innerText(), 'You brought the light.');
  const result = await page.evaluate(key => JSON.parse(localStorage.getItem(key))?.result, resultKey);
  assert.equal(result.status, 'victory');
  assert.equal(await page.evaluate(key => localStorage.getItem(key), saveKey), null, 'Terminal run must clear active save');
  await page.reload({ waitUntil: 'networkidle' });
  assert.equal(await page.locator('#continue-button').isVisible(), false);
  assert.equal(await page.locator('#last-journey').isVisible(), true);
  assert.match(await page.locator('#last-journey').innerText(), /Relaxed · 4 of 4 guardians freed · 100% accuracy/);
  await page.locator('input[name="mode"][value="relaxed"]').check();
  assert.equal(await page.locator('#personal-best').isVisible(), true);
  assert.match(await page.locator('#personal-best').innerText(), /Relaxed · 4 of 4 guardians freed · 100% accuracy/);
  await page.screenshot({ path: 'artifacts/desktop-last-result.png', fullPage: true });
  assert.deepEqual(errors, []);
  await context.close();
  for (const mode of ['corrupt', 'denied']) {
    const fallback = await browser.newContext();
    await fallback.addInitScript(({ mode, saveKey, resultKey }) => {
      if (mode === 'corrupt') { localStorage.setItem(saveKey, '{broken'); localStorage.setItem(resultKey, '{broken'); }
      else Object.defineProperty(window, 'localStorage', { configurable: true, get() { throw new DOMException('Storage denied', 'SecurityError'); } });
    }, { mode, saveKey, resultKey });
    const fallbackPage = await fallback.newPage();
    const failures = [];
    fallbackPage.on('pageerror', error => failures.push(error.message));
    await fallbackPage.goto(baseURL, { waitUntil: 'networkidle' });
    assert.equal(await fallbackPage.locator('#continue-button').isVisible(), false);
    await fallbackPage.locator('#begin').click();
    await submit(fallbackPage, true);
    await ready(fallbackPage);
    assert.deepEqual(failures, [], `${mode} storage must not crash gameplay`);
    await fallback.close();
  }
  console.log('Persistence: accepted correct/wrong turns survive immediate reload, potion persists, explicit replacement, last result, corrupt/denied storage passed');
} finally { await browser.close(); }
