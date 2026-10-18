import path from 'node:path';
import { browserHarness, watchErrors, artifacts } from './browser-harness.mjs';
import { status, driveTo } from './courier-actions.mjs';
import { ROAD_X, ROAD_Y, GARAGE } from '../src/data.js';

const nearest = (values, value) => values.reduce((best, item) => Math.abs(item - value) < Math.abs(best - value) ? item : best);
async function route(page, x, y, options = {}) {
  const state = await status(page);
  const roadY = nearest(ROAD_Y, Number(state.playerY));
  const nextY = nearest(ROAD_Y, y);
  const roadX = nearest(ROAD_X, x);
  await driveTo(page, Number(state.playerX), roadY, options);
  await driveTo(page, roadX, roadY, options);
  await driveTo(page, roadX, nextY, options);
  await driveTo(page, x, nextY, options);
  await driveTo(page, x, y, options);
}
await browserHarness(async ({ browser, server, assert }) => {
  for (const [name, width, height] of [['desktop', 1366, 900], ['mobile', 390, 844], ['narrow', 320, 640], ['landscape', 844, 390]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
    const page = await context.newPage();
    const errors = watchErrors(page, server.origin);
    await page.goto(server.url);
    await page.locator('#start-button').click();
    await page.waitForTimeout(300);
    let state = await status(page);
    assert.ok(Number(state.cameraWidth) < Number(state.worldWidth), 'camera shows a limited portion of the town');
    assert.ok(Number(state.cameraHeight) < Number(state.worldHeight), 'world extends beyond the camera');
    assert.ok(await page.locator('#joystick').isVisible(), 'touch joystick visible');
    assert.ok(await page.locator('#minimap').isVisible(), 'minimap visible');
    assert.ok(await page.locator('#direction-arrow').isVisible(), 'destination arrow visible');
    const mission = await page.locator('.mission').boundingBox();
    assert.ok(mission && mission.x >= 0 && mission.y >= 0 && mission.x + mission.width <= width + 1 && mission.y + mission.height <= height + 1, `${name}: mission HUD stays wholly inside viewport`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no horizontal document overflow');
    await page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: true });
    if (name === 'desktop' || name === 'mobile') {
      const touch = name === 'mobile';
      await page.locator('#interact-button').click();
      state = await status(page);
      const initialCash = Number(state.cash);
      await route(page, Number(state.targetX), Number(state.targetY) + 25, { touch });
      await page.locator('#interact-button').click();
      await page.waitForTimeout(100);
      state = await status(page);
      assert.equal(Number(state.deliveries), 1, 'real input completes delivery');
      assert.ok(Number(state.cash) > initialCash, 'delivery pays cash');
      await route(page, GARAGE.x, GARAGE.y, { touch });
      await page.locator('#interact-button').click();
      await page.locator('[data-upgrade="speed"]').click();
      state = await status(page);
      assert.equal(JSON.parse(state.upgrade).speed, 1, 'earned cash buys upgrade');
      await page.reload();
      await page.waitForFunction(() => document.querySelector('#game-status')?.dataset.phase === 'playing');
      state = await status(page);
      assert.equal(Number(state.deliveries), 1, 'delivery saved after reload');
      assert.equal(JSON.parse(state.upgrade).speed, 1, 'upgrade saved after reload');
      await page.locator('#pause-button').click();
      const before = await status(page);
      await page.keyboard.down('ArrowRight');
      await page.waitForTimeout(400);
      await page.keyboard.up('ArrowRight');
      const after = await status(page);
      assert.equal(after.playerX, before.playerX, 'pause prevents movement drift');
      assert.equal(after.playerY, before.playerY, 'pause prevents movement drift');
      await page.locator('#reset-button').click();
      await page.locator('#reset-confirm').click();
      assert.equal(Number((await status(page)).deliveries), 0, 'reset clears progress');
    }
    assert.deepEqual(errors, [], `${name}: browser and network errors`);
    await context.close();
  }
  const context = await browser.newContext();
  await context.addInitScript(() => {
    Object.defineProperty(Storage.prototype, 'getItem', { value() { throw new Error('storage blocked'); } });
    Object.defineProperty(Storage.prototype, 'setItem', { value() { throw new Error('storage blocked'); } });
  });
  const page = await context.newPage();
  await page.goto(server.url);
  await page.locator('#start-button').click();
  assert.equal((await status(page)).phase, 'playing', 'blocked storage still permits play');
  await page.locator('#interact-button').click();
  assert.equal((await status(page)).storage, 'unavailable', 'blocked storage status is honest');
  await context.close();
  console.log('Production browser smoke passed: four viewports, keyboard/touch delivery, upgrade, save, pause, reset and blocked storage.');
});
