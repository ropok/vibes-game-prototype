import path from 'node:path';
import { browserHarness, watchErrors, artifacts } from './browser-harness.mjs';
import { arenaAction, assertArenaUI, closeDiscovery, readXP } from './arena-actions.mjs';

await browserHarness(async ({ browser, server, assert }) => {
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['touch', { width: 390, height: 844 }], ['narrow', { width: 320, height: 568 }], ['landscape', { width: 844, height: 390 }]]) {
    const touch = name !== 'desktop';
    const context = await browser.newContext({ viewport, hasTouch: touch, isMobile: touch, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = watchErrors(page, server.origin);
    await page.goto(`${server.origin}/embed.html`, { waitUntil: 'networkidle' });
    const frame = page.frameLocator('iframe');
    await frame.locator('#game').waitFor();
    const activate = (locator, options) => touch ? locator.tap(options) : locator.click(options);
    await assertArenaUI(frame, assert);
    assert.match(await frame.locator('#resume-label').innerText(), /1\/12 bentuk · 0 serapan/);
    let actions = 0, attackObserved = false, consumeObserved = false;
    while (Number(await frame.locator('#absorbed-count').innerText()) < (touch ? 1 : 4)) {
      assert.ok(actions++ < 60, 'first automatic evolution uses a bounded real action count');
      const action = await arenaAction(page, frame, activate, { observe: true, requireMovement: !attackObserved, assert });
      if (action === 'alive') attackObserved = true;
      if (action === 'knocked') consumeObserved = true;
    }
    assert.ok(attackObserved && consumeObserved, 'real approach/attack and consume animations observed');
    if (!touch) {
      await frame.locator('#discovery-dialog[open]').waitFor();
      assert.equal(await frame.locator('#form-name').getAttribute('data-form-index'), '1', 'fourth absorption automatically evolves');
      assert.equal(await readXP(frame), 0, 'automatic evolution spends forty XP');
      await closeDiscovery(frame, activate);
      assert.match(await frame.locator('#resume-label').innerText(), /2\/12 bentuk · 4 serapan/);
      assert.doesNotMatch(await frame.locator('#action-status').innerText(), /saatnya berevolusi|tekan.*berevolusi/i);
    }
    const xp = await readXP(frame), form = await frame.locator('#form-name').getAttribute('data-form-index');
    const absorbed = await frame.locator('#absorbed-count').innerText();
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await readXP(frame), xp, 'reload does not duplicate XP');
    assert.equal(await frame.locator('#form-name').getAttribute('data-form-index'), form);
    assert.equal(await frame.locator('#absorbed-count').innerText(), absorbed);
    await activate(frame.locator('#collection-button'));
    assert.equal(await frame.locator('#collection-detail h3').innerText(), await frame.locator('#form-name').innerText());
    assert.ok((await frame.locator('#collection-detail .lore').innerText()).length > 20);
    await page.keyboard.press('Escape');
    assert.equal(await frame.locator('html').evaluate(root => root.scrollWidth > window.innerWidth), false, `${name} horizontal overflow`);
    await page.screenshot({ path: path.join(artifacts, `${name}-quick-final.png`), fullPage: true });
    assert.deepEqual(errors, [], `${name} runtime errors`);
    await context.close();
    console.log(`${name}: quick arena regression passed`);
  }
});
