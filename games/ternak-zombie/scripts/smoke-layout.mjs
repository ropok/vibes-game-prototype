import path from 'node:path';
import { browserHarness, watchErrors, artifacts } from './browser-harness.mjs';
import { status, hold, driveTo } from './zombie-actions.mjs';

await browserHarness(async ({ browser, server, assert }) => {
  for (const [name, width, height] of [['desktop', 1366, 900], ['mobile', 390, 844], ['narrow', 320, 640], ['landscape', 844, 390]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: true });
    const page = await context.newPage();
    const errors = watchErrors(page, server.origin);
    await page.goto(server.url);
    await page.locator('#start-button').click();
    await page.waitForTimeout(150);
    for (const selector of ['#minimap', '#pause-button', '#lure-button', '#generator-button']) {
      const box = await page.locator(selector).boundingBox();
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= width + 1 && box.y + box.height <= height + 1, `${name}: ${selector} inside viewport`);
    }
    assert.ok(await page.locator('#game canvas').first().isVisible(), `${name}: game canvas visible`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: no horizontal overflow`);
    const before = await status(page);
    const zones = JSON.parse(before.upgradeZones);
    assert.equal(zones.length, 4, `${name}: four world upgrade pads`);
    for (const zone of zones) {
      assert.ok(Number.isFinite(zone.x) && Number.isFinite(zone.y) && zone.size > 0 && zone.duration > 0, `${name}: ${zone.kind} has a ground pad and timer`);
      assert.ok(zone.x - zone.size / 2 >= 0 && zone.y - zone.size / 2 >= 0 && zone.x + zone.size / 2 <= Number(before.worldWidth) && zone.y + zone.size / 2 <= Number(before.worldHeight), `${name}: ${zone.kind} pad stays in the world`);
    }
    await hold(page, 'right', 150, { touch: name !== 'desktop' });
    assert.notEqual((await status(page)).playerX, before.playerX, `${name}: input moves Raya`);
    const cage = zones.find(zone => zone.kind === 'cage');
    await driveTo(page, cage.x, 940, { touch: name !== 'desktop' });
    await driveTo(page, cage.x, cage.y, { touch: name !== 'desktop' });
    await page.waitForTimeout(300);
    assert.equal((await status(page)).constructionKind, 'cage', `${name}: pad starts automatically`);
    const progress = await page.locator('#construction-status').boundingBox();
    assert.ok(progress && progress.x >= 0 && progress.y >= 0 && progress.x + progress.width <= width + 1 && progress.y + progress.height <= height + 1, `${name}: active progress stays in viewport`);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${name}: active progress causes no horizontal overflow`);
    await page.screenshot({ path: path.join(artifacts, `${name}.png`), fullPage: true });
    assert.deepEqual(errors, [], `${name}: browser/network errors`);
    await context.close();
  }
  console.log('Layout smoke passed: four viewports, HUD bounds, minimap, overflow, keyboard/touch movement.');
});
