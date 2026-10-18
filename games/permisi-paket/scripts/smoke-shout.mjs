import path from 'node:path';
import { browserHarness, watchErrors, artifacts } from './browser-harness.mjs';
import { status, driveTo } from './courier-actions.mjs';
import { ROAD_X, ROAD_Y } from '../src/data.js';

const nearest = (values, value) => values.reduce((best, item) => Math.abs(item - value) < Math.abs(best - value) ? item : best);
await browserHarness(async ({ browser, server, assert }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  // Replace the optional browser speech API only; game state and movement remain untouched.
  await context.addInitScript(() => {
    window.__spoken = [];
    window.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: {
      speak(utterance) { window.__spoken.push({ text: utterance.text, lang: utterance.lang }); },
      cancel() {}, getVoices() { return []; },
    } });
  });
  const page = await context.newPage();
  const errors = watchErrors(page, server.origin);
  await page.goto(server.url);
  await page.locator('#start-button').click();
  assert.equal(await page.locator('#sound-button').getAttribute('aria-pressed'), 'false', 'sound defaults to muted');
  assert.deepEqual(await page.evaluate(() => window.__spoken), [], 'muted start does not speak');
  await page.locator('#interact-button').click();
  const before = await status(page);
  const targetX = Number(before.targetX), targetY = Number(before.targetY) + 25;
  const roadY = nearest(ROAD_Y, Number(before.playerY));
  const nextY = nearest(ROAD_Y, targetY), roadX = nearest(ROAD_X, targetX);
  for (const [x, y] of [[Number(before.playerX), roadY], [roadX, roadY], [roadX, nextY], [targetX, nextY], [targetX, targetY]]) await driveTo(page, x, y);
  assert.deepEqual(await page.evaluate(() => window.__spoken), [], 'muted pickup and journey do not speak');
  await page.locator('#sound-button').click();
  await page.locator('#interact-button').click();
  await page.waitForFunction(() => Number(document.querySelector('#game-status')?.dataset.deliveries) === 1);
  const bubble = page.locator('#delivery-shout');
  assert.equal(await bubble.innerText(), 'MISI PAKET!', 'delivery shows exact courier shout');
  assert.ok(await bubble.isVisible(), 'courier shout visible');
  await page.screenshot({ path: path.join(artifacts, 'delivery-shout.png'), fullPage: true });
  assert.equal(await bubble.evaluate(element => getComputedStyle(element).pointerEvents), 'none', 'shout does not intercept input');
  assert.deepEqual(await page.evaluate(() => window.__spoken), [{ text: 'MISI PAKET!', lang: 'id-ID' }], 'enabled delivery speaks Indonesian once');
  const paid = await status(page);
  assert.ok(Number(paid.cash) > Number(before.cash), 'delivery pays once');
  await page.locator('#interact-button').click();
  assert.equal((await status(page)).cash, paid.cash, 'repeat interaction cannot pay twice');
  assert.equal(Number((await status(page)).deliveries), 1, 'repeat interaction cannot deliver twice');
  const position = Number((await status(page)).playerX);
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(150);
  await page.keyboard.up('ArrowRight');
  assert.ok(Number((await status(page)).playerX) > position, 'shout leaves movement available');
  await page.waitForTimeout(2200);
  assert.equal(await bubble.isVisible(), false, 'shout expires after its brief display');
  assert.deepEqual(errors, [], 'browser and network errors');
  await context.close();
  console.log('Delivery shout smoke passed: real delivery, exact bubble, optional Indonesian voice, one payment, nonblocking timeout.');
});
