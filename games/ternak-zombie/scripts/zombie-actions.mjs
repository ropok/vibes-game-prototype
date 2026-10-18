export async function status(page) {
  return page.locator('#game-status').evaluate(element => ({ ...element.dataset }));
}

/** Drive using actual key or touch events; never write simulation state. */
export async function hold(page, direction, milliseconds, { touch = false } = {}) {
  if (touch) {
    const box = await page.locator(`[data-move="${direction}"]`).boundingBox();
    if (!box) throw new Error(`Missing touch control: ${direction}`);
    const session = await page.context().newCDPSession(page);
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    try { await page.waitForTimeout(milliseconds); }
    finally {
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await session.detach();
    }
  } else {
    const key = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[direction];
    await page.keyboard.down(key);
    try { await page.waitForTimeout(milliseconds); }
    finally { await page.keyboard.up(key); }
  }
}

export async function driveTo(page, x, y, options = {}) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const state = await status(page);
    const dx = x - Number(state.playerX), dy = y - Number(state.playerY);
    if (Math.hypot(dx, dy) < 20) return;
    const horizontal = Math.abs(dx) > Math.abs(dy);
    const delta = horizontal ? dx : dy;
    await hold(page, horizontal ? (delta > 0 ? 'right' : 'left') : (delta > 0 ? 'down' : 'up'), Math.min(180, Math.max(35, Math.abs(delta) * 4)), options);
  }
  throw new Error(`Real-input route blocked before ${x},${y}: ${JSON.stringify(await status(page))}`);
}
