import path from 'node:path';
import { browserHarness, watchErrors, artifacts } from './browser-harness.mjs';
import { status } from './courier-actions.mjs';

await browserHarness(async ({ browser, server, assert }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
  const page = await context.newPage();
  const errors = watchErrors(page, server.origin);
  await page.goto(server.url);
  await page.locator('#start-button').click();
  await page.waitForTimeout(300);
  const textures = new Set();
  for (const [direction, key, axis, sign] of [['right', 'ArrowRight', 'playerX', 1], ['left', 'ArrowLeft', 'playerX', -1], ['up', 'ArrowUp', 'playerY', -1], ['down', 'ArrowDown', 'playerY', 1]]) {
    const before = await status(page);
    await page.keyboard.down(key);
    await page.waitForTimeout(140);
    await page.keyboard.up(key);
    await page.waitForFunction(expected => document.querySelector('#game')?.dataset.facing === expected, direction);
    await page.waitForTimeout(120);
    const after = await status(page);
    assert.ok((Number(after[axis]) - Number(before[axis])) * sign > 0, `${direction}: real input moves courier`);
    const rendered = await page.locator('#game').evaluate(element => ({ ...element.dataset }));
    assert.equal(rendered.facing, direction, `${direction}: facing retained while idle`);
    assert.ok(rendered.sprite, `${direction}: rendered texture is exposed`);
    textures.add(rendered.sprite);
    // Public world/camera coordinates locate a close view of the rendered courier.
    const canvas = await page.locator('#game canvas').boundingBox();
    assert.ok(canvas, 'rendered game canvas exists');
    const px = canvas.x + (Number(after.playerX) - Number(after.cameraX)) * canvas.width / Number(after.cameraWidth);
    const py = canvas.y + (Number(after.playerY) - Number(after.cameraY)) * canvas.height / Number(after.cameraHeight);
    const x = Math.max(0, Math.min(390 - 160, px - 80));
    const y = Math.max(0, Math.min(844 - 180, py - 110));
    await page.screenshot({ path: path.join(artifacts, `courier-${direction}.png`), clip: { x, y, width: 160, height: 180 } });
  }
  assert.equal(textures.size, 4, 'each direction selects a distinct rendered texture');
  assert.deepEqual(errors, [], 'browser and network errors');
  await context.close();
  console.log('Directional sprite smoke passed: real four-way movement, idle facing, four textures and rendered screenshots.');
});
