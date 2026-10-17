import { createGame } from '../src/engine.js';
import { browserHarness, watchErrors, walkTo } from './browser-harness.mjs';

// The canonical map is only a route guide. Browser resources, units, health,
// time and outcomes are never injected or changed outside visible controls.
const map = createGame({ seed: 4271 });
await browserHarness(async ({ browser, server, assert }) => {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = watchErrors(page, server.origin);
  const count = async id => Number((await page.locator(id).innerText()).match(/\d+/)?.[0]);
  await page.goto(server.url, { waitUntil: 'networkidle' });
  await page.locator('#game-world canvas').waitFor();
  await page.locator('#start-game').click();

  for (const [type, center, goal] of [
    ['wood', { x: 1000, y: 1260 }, 144],
    ['stone', { x: 1610, y: 1210 }, 86],
    ['food', { x: 1120, y: 720 }, 92],
  ]) {
    const nodes = map.nodes.filter(node => node.type === type)
      .sort((a, b) => Math.hypot(a.x - center.x, a.y - center.y) - Math.hypot(b.x - center.x, b.y - center.y))
      .filter(node => Math.hypot(node.x - center.x, node.y - center.y) < 120);
    for (const node of nodes) {
      if (await count(`#${type}-count`) >= goal) break;
      await walkTo(page, node.x, node.y);
      // Depleted nodes may have no remaining neighbor. Continue to the next
      // visible map destination instead of assuming that each hold grants loot.
      if (!(await page.locator('#action-label').innerText()).startsWith(`Gather ${type}`)) continue;
      await page.keyboard.down('Space');
      try { await page.waitForTimeout(2200); }
      finally { await page.keyboard.up('Space'); }
    }
    assert.ok(await count(`#${type}-count`) >= goal, `${type} gathered through normal movement and interaction`);
    console.log(`${type}: ${await count(`#${type}-count`)} gathered; winter timer ${await page.locator('#winter-timer').innerText()}`);
  }

  await walkTo(page, 1300, 1000);
  for (const kind of ['shelter', 'barracks', 'watchtower', 'watchtower', 'barricade']) {
    const before = await count('#wood-count');
    assert.equal(await page.locator(`#build-${kind}`).isDisabled(), false, `${kind} is affordable at hearth`);
    await page.locator(`#build-${kind}`).click();
    assert.ok(await count('#wood-count') < before, `${kind} consumes real gathered resources`);
  }
  await walkTo(page, 800, 990);
  assert.match(await page.locator('#action-label').innerText(), /Welcome settler/);
  for (let i = 0; i < 3; i++) {
    const before = await count('#settler-count');
    await page.locator('#action-button').click();
    assert.equal(await count('#settler-count'), before + 1, 'one camp click welcomes one settler');
  }
  await walkTo(page, 1300, 1000);
  for (let i = 0; i < 5; i++) await page.locator('#train-button').click();
  assert.equal(await count('#guard-count'), 5, 'five guards trained using the gathered food and wood');
  assert.match(await page.locator('#season-label').innerText(), /WINTER ARRIVES IN/, 'preparation finishes before winter');
  await page.screenshot({ path: 'artifacts/winter-prepared.png', fullPage: true });

  let winterStarted = false, battleScreenshot = false, winterSeenAt = 0;
  const deadline = Date.now() + 360000;
  while (Date.now() < deadline && !(await page.locator('#restart-game').isVisible())) {
    if ((await page.locator('#season-label').innerText()).includes('HOLD THE HEARTH')) {
      if (!winterStarted) { winterStarted = true; winterSeenAt = Date.now(); console.log('Winter wave has begun.'); }
      if (!battleScreenshot && Date.now() - winterSeenAt > 14000) {
        await page.screenshot({ path: 'artifacts/winter-battle.png', fullPage: true });
        battleScreenshot = true;
      }
    }
    const hearth = (await page.locator('#hearth-health').innerText()).match(/\d+/g).map(Number);
    if (hearth[0] < hearth[1] - 65 && !(await page.locator('#repair-button').isDisabled())) await page.locator('#repair-button').click();
    if (await count('#player-health') < 60 && !(await page.locator('#eat-button').isDisabled())) await page.locator('#eat-button').click();
    await page.waitForTimeout(500);
  }
  assert.ok(winterStarted, 'winter starts after the normal countdown');
  assert.equal(await page.locator('#restart-game').isVisible(), true, 'session reaches an ending');
  assert.equal(await page.locator('#modal-title').innerText(), 'A hearth that held.', 'prepared settlement wins the full browser session');
  assert.equal(await count('#winter-timer'), 0, 'no invaders remain');
  assert.ok(await count('#hearth-health') > 0 && await count('#player-health') > 0, 'hearth and keeper survive');
  await page.screenshot({ path: 'artifacts/winter-victory.png', fullPage: true });
  const endedTimer = await page.locator('#winter-timer').innerText();
  await page.waitForTimeout(1200);
  assert.equal(await page.locator('#winter-timer').innerText(), endedTimer, 'victory remains complete');

  await page.locator('#restart-game').click();
  assert.equal(await count('#wood-count'), 24);
  assert.equal(await count('#stone-count'), 14);
  assert.equal(await count('#food-count'), 20);
  assert.equal(await count('#settler-count'), 2);
  assert.equal(await count('#guard-count'), 0);
  assert.equal(await page.locator('#modal').isVisible(), false, 'restart returns to the game');
  assert.deepEqual(errors, [], 'full winter browser runtime errors');
  await context.close();
  console.log('Full browser winter: real gathering, building, recruitment, training, combat, victory, and clean restart verified.');
});
