import path from 'node:path';
import { browserHarness, watchErrors, artifacts } from './browser-harness.mjs';
import { status } from './courier-actions.mjs';

await browserHarness(async ({ browser, server, assert }) => {
  for (const [name, width, height] of [['desktop', 1366, 900], ['mobile', 390, 844], ['narrow', 320, 640], ['landscape', 844, 390]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
    const page = await context.newPage();
    const errors = watchErrors(page, server.origin);
    await page.goto(server.url);
    await page.locator('#start-button').click();
    await page.waitForTimeout(300);
    const state = await status(page);
    assert.ok(Number(state.cameraWidth) < Number(state.worldWidth) && Number(state.cameraHeight) < Number(state.worldHeight), `${name}: limited camera viewport`);
    for (const selector of ['.mission', '.wallet', '.map-card', '#interact-button']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1, `${name}: ${selector} inside viewport`);
    }
    assert.ok(await page.locator('#minimap').isVisible(), `${name}: minimap visible`);
    assert.ok(await page.locator('#direction-arrow').isVisible(), `${name}: arrow visible`);
    assert.ok(await page.locator('#game canvas').isVisible(), `${name}: town canvas visible`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: no horizontal overflow`);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');
    assert.ok(Number((await status(page)).playerX) > Number(state.playerX), `${name}: real input moves courier`);
    await page.locator('#pause-button').click();
    const paused = await status(page);
    await page.keyboard.down('ArrowRight');
    await page.waitForTimeout(200);
    await page.keyboard.up('ArrowRight');
    assert.equal((await status(page)).playerX, paused.playerX, `${name}: pause freezes movement`);
    await page.locator('#modal-close').click();
    await page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: true });
    assert.deepEqual(errors, [], `${name}: browser/network errors`);
    await context.close();
  }
  console.log('Final layout smoke passed: four viewports, HUD bounds, minimap, arrow, real input and pause.');
});
