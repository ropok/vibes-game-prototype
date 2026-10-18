export const targetSelector = '.arena-food-target';
export const readXP = async frame => Number((await frame.locator('#energy-value').innerText()).match(/\d+/)?.[0]);
export async function waitForAction(page, frame) {
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline) {
    if (await frame.locator('#discovery-dialog[open]').count()) return;
    if (await frame.locator('#arena-frame').getAttribute('data-action') === 'idle') return;
    await page.waitForTimeout(35);
  }
  throw new Error('Arena action did not settle within eight seconds');
}
export async function closeDiscovery(frame, activate) {
  if (await frame.locator('#discovery-dialog[open]').count()) await activate(frame.locator('#continue-button'));
}
export async function arenaAction(page, frame, activate, { observe = false, requireMovement = false, assert } = {}) {
  await waitForAction(page, frame);
  const knocked = frame.locator(`${targetSelector}[data-state="knocked"]`).first();
  const alive = frame.locator(`${targetSelector}[data-state="alive"]`).first();
  let target = await knocked.count() ? knocked : alive;
  if (requireMovement && !await knocked.count()) {
    const heroX = Number(await frame.locator('#arena-frame').getAttribute('data-hero-x'));
    const heroY = Number(await frame.locator('#arena-frame').getAttribute('data-hero-y'));
    const id = await frame.locator(`${targetSelector}[data-state="alive"]`).evaluateAll((nodes, hero) => nodes.map(node => ({ id: node.dataset.foodId, distance: Math.hypot(parseFloat(node.style.left) * 9 - hero.x, parseFloat(node.style.top) * 5.6 - hero.y) })).sort((a, b) => b.distance - a.distance)[0]?.id, { x: heroX, y: heroY });
    if (id) target = frame.locator(`${targetSelector}[data-food-id="${id}"]`);
  }
  if (!await target.count()) { await page.waitForTimeout(100); return; }
  const state = await target.getAttribute('data-state');
  const before = await readXP(frame);
  const arena = frame.locator('#arena-frame');
  const position = async () => `${await arena.getAttribute('data-hero-x')},${await arena.getAttribute('data-hero-y')}`;
  const start = await position();
  // Arena targets move continuously. Force skips the stability wait while still
  // delivering a real pointer/touch at the current visible target position.
  await activate(target, { force: true });
  if (observe) {
    let moved = false, consumed = false;
    const deadline = Date.now() + 8000;
    while (Date.now() < deadline) {
      const action = await arena.getAttribute('data-action');
      if (await position() !== start) moved = true;
      if (action === 'consume' && !consumed) {
        consumed = true;
        assert.equal(await readXP(frame), before, 'consume animation precedes XP grant');
      }
      if (action === 'idle' || await frame.locator('#discovery-dialog[open]').count()) break;
      await page.waitForTimeout(35);
    }
    if (state === 'alive' && requireMovement) assert.ok(moved, 'player visibly approaches target before striking');
    if (state === 'knocked') assert.ok(consumed, 'knocked target plays consume animation');
  }
  await waitForAction(page, frame);
  if (state === 'alive') {
    if (assert) assert.equal(await readXP(frame), before, 'live-food attack grants no XP');
  }
  return state;
}
export async function assertArenaUI(frame, assert) {
  assert.equal(await frame.locator('#evolve-button, #selected-action, .target-panel, .notebook').count(), 0, 'obsolete controls and sidebar are removed');
  assert.equal(await frame.locator('#arena-frame #collection-button').count(), 1, 'book is inside arena');
  assert.equal(await frame.locator(targetSelector).count(), 6, 'six accessible arena targets');
  const size = Number(await frame.locator('#arena-frame').getAttribute('data-hero-size'));
  assert.ok(size > 0 && size <= 150, 'ompreng is compact within arena');
}
