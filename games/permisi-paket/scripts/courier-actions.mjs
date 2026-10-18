import assert from 'node:assert/strict';

/** Reads the public accessibility/status surface; never mutates game state. */
export async function status(page) {
  return page.locator('#game-status').evaluate(element => ({ ...element.dataset }));
}

/** Drive a visible road waypoint with real held keyboard or touchscreen input. */
export async function driveTo(page, x, y, { touch = false, tolerance = 32 } = {}) {
  for (let attempt = 0; attempt < 160; attempt++) {
    const state = await status(page);
    const dx = x - Number(state.playerX);
    const dy = y - Number(state.playerY);
    if (Math.hypot(dx, dy) <= tolerance) return;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const direction = horizontal ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
    const duration = Math.max(25, Math.min(160, (horizontal ? Math.abs(dx) : Math.abs(dy)) * 2));
    if (touch) {
      const control = await page.locator('#joystick').boundingBox();
      assert.ok(control, `visible touch control: ${direction}`);
      const client = await page.context().newCDPSession(page);
      const center = { x: control.x + control.width / 2, y: control.y + control.height / 2 };
      const point = { x: center.x + (direction === 'right' ? 40 : direction === 'left' ? -40 : 0), y: center.y + (direction === 'down' ? 40 : direction === 'up' ? -40 : 0) };
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [center] });
      await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [point] });
      await page.waitForTimeout(duration);
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await client.detach();
    } else {
      const key = `Arrow${direction[0].toUpperCase()}${direction.slice(1)}`;
      await page.keyboard.down(key);
      await page.waitForTimeout(duration);
      await page.keyboard.up(key);
    }
  }
  const final = await status(page);
  throw new Error(`Could not reach ${x},${y}; visible player ${final.playerX},${final.playerY}`);
}
