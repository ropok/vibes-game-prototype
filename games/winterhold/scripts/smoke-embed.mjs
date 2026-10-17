import { browserHarness, watchErrors } from './browser-harness.mjs';

await browserHarness(async ({ browser, server, assert }) => {
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 390, height: 844 }], ['mobile-small', { width: 320, height: 568 }], ['mobile-landscape', { width: 844, height: 390 }]]) {
    const touch = name.startsWith('mobile');
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', isMobile: touch, hasTouch: touch });
    const page = await context.newPage();
    const errors = watchErrors(page, server.origin);
    await page.goto(`${server.origin}/embed.html`, { waitUntil: 'networkidle' });
    const frame = page.frameLocator('iframe');
    await frame.locator('#game-world canvas').waitFor();
    const activate = locator => touch ? locator.tap() : locator.click();
    await activate(frame.locator('#start-game'));
    assert.ok(await frame.locator('#winter-timer').isVisible(), 'winter HUD visible');
    await activate(frame.locator('#build-barracks'));
    await activate(frame.locator('#train-button'));
    assert.match(await frame.locator('#guard-count').innerText(), /1/, 'guard count visible');
    await activate(frame.locator('#pause-button'));
    const timer = await frame.locator('#winter-timer').innerText();
    await page.waitForTimeout(1200);
    assert.equal(await frame.locator('#winter-timer').innerText(), timer);
    await activate(frame.locator('#resume-game'));
    if (touch) {
      // A touch on open terrain must not create a lasting mouse-style walk target.
      const canvas = frame.locator('#game-world canvas');
      const terrainPoint = await canvas.evaluate(canvas => {
        const box = canvas.getBoundingClientRect();
        for (let y = 20; y < box.height - 20; y += 20) {
          for (let x = 20; x < box.width - 20; x += 20) {
            if (document.elementFromPoint(box.x + x, box.y + y) === canvas) return { x, y };
          }
        }
        return null;
      });
      assert.ok(terrainPoint, 'mobile layout leaves exposed terrain for touch interaction');
      await canvas.tap({ position: terrainPoint });
      await page.waitForTimeout(180);
      const mapBefore = await frame.locator('#minimap').evaluate(canvas => canvas.toDataURL());
      await page.waitForTimeout(1000);
      const mapAfter = await frame.locator('#minimap').evaluate(canvas => canvas.toDataURL());
      assert.equal(mapAfter, mapBefore, 'touching terrain does not leave persistent walking input');
      const joystick = await frame.locator('#joystick').boundingBox();
      assert.ok(joystick, 'touch joystick is visible');
      const dock = await frame.locator('.build-dock').boundingBox();
      assert.ok(dock);
      assert.ok(joystick.y + joystick.height <= dock.y || joystick.x + joystick.width <= dock.x || joystick.x >= dock.x + dock.width, 'joystick does not overlap build dock');
      const overflow = await frame.locator('html').evaluate(root => root.scrollWidth > window.innerWidth || root.scrollHeight > window.innerHeight);
      assert.equal(overflow, false, 'mobile game has no page overflow');
      const cdp = await context.newCDPSession(page);
      const point = { x: joystick.x + joystick.width / 2, y: joystick.y + joystick.height / 2, id: 7 };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...point, x: point.x + 36 }] });
      await page.waitForTimeout(1000);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(200);
      const movedMap = await frame.locator('#minimap').evaluate(canvas => canvas.toDataURL());
      assert.notEqual(movedMap, mapAfter, 'dragging the touch joystick moves the keeper');
      await page.waitForTimeout(850);
      assert.equal(await frame.locator('#minimap').evaluate(canvas => canvas.toDataURL()), movedMap, 'releasing touch joystick stops movement');
      await cdp.detach();
    }
    await page.screenshot({ path: `artifacts/${name}-nested-iframe.png`, fullPage: true });
    assert.deepEqual(errors, [], `${name} iframe runtime errors`);
    await context.close();
    console.log(`${name}: nested iframe starts, visible build/train controls and pause work without external requests.`);
  }
});
