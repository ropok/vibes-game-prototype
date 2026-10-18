import path from 'node:path';
import { browserHarness, watchErrors, artifacts } from './browser-harness.mjs';
import { arenaAction, assertArenaUI, closeDiscovery, readXP, targetSelector } from './arena-actions.mjs';

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
    let actions = 0, observedAttack = false, observedConsume = false;
    const captured = new Set();
    while (true) {
      const index = Number(await frame.locator('#form-name').getAttribute('data-form-index'));
      if (!captured.has(index)) {
        await page.screenshot({ path: path.join(artifacts, `${name}-form-${String(index + 1).padStart(2, '0')}.png`), fullPage: true });
        captured.add(index);
      }
      await closeDiscovery(frame, activate);
      if (name === 'desktop' ? index === 11 : Number(await frame.locator('#absorbed-count').innerText()) >= 1) break;
      assert.ok(actions++ < 1200, 'campaign reaches final form within action budget');
      const consume = await frame.locator(`${targetSelector}[data-state="knocked"]`).count() > 0;
      const observe = consume ? !observedConsume : !observedAttack;
      const action = await arenaAction(page, frame, activate, { observe, requireMovement: !observedAttack, assert });
      if (observe && action === 'alive') observedAttack = true;
      if (observe && action === 'knocked') observedConsume = true;
    }
    assert.ok(observedAttack && observedConsume, 'approach and consume observed');
    const savedXP = await readXP(frame), savedForm = await frame.locator('#form-name').getAttribute('data-form-index');
    const count = await frame.locator('#absorbed-count').innerText();
    if (name === 'desktop') {
      assert.equal(captured.size, 12);
      assert.equal(savedXP, 1000);
      assert.equal(count, '100');
    }
    await page.reload({ waitUntil: 'networkidle' });
    assert.equal(await readXP(frame), savedXP, 'reload does not duplicate XP');
    assert.equal(await frame.locator('#form-name').getAttribute('data-form-index'), savedForm);
    assert.equal(await frame.locator('#absorbed-count').innerText(), count);
    const canceled = await frame.locator(`${targetSelector}[data-state="alive"]`).first().evaluate(button => {
      button.focus();
      const event = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', repeat: true, bubbles: true, cancelable: true });
      button.dispatchEvent(event);
      return event.defaultPrevented;
    });
    assert.ok(canceled, 'held Enter repeat default is canceled on arena target');
    assert.equal(await readXP(frame), savedXP);
    await activate(frame.locator('#collection-button'));
    assert.equal(await frame.locator('.collection-entry').count(), 12);
    if (name !== 'desktop') assert.match(await frame.locator('.collection-entry[data-form-index="11"]').innerText(), /belum|terkunci|\?/i);
    await page.keyboard.press('Escape');
    await activate(frame.locator('#pause-button'));
    const paused = await frame.locator(targetSelector).evaluateAll(nodes => nodes.map(node => node.outerHTML).join(''));
    await page.waitForTimeout(1100);
    assert.equal(await frame.locator(targetSelector).evaluateAll(nodes => nodes.map(node => node.outerHTML).join('')), paused, 'pause freezes arena targets');
    await activate(frame.locator('#pause-button'));
    await activate(frame.locator('#reset-button'));
    await activate(frame.locator('#cancel-reset'));
    assert.equal(await frame.locator('#absorbed-count').innerText(), count, 'cancel reset keeps progress');
    assert.equal(await frame.locator('html').evaluate(root => root.scrollWidth > window.innerWidth), false, 'no horizontal overflow');
    await page.screenshot({ path: path.join(artifacts, `${name}-nested-iframe.png`), fullPage: true });
    await activate(frame.locator('#reset-button'));
    await activate(frame.locator('#confirm-reset'));
    assert.equal(await frame.locator('#form-name').getAttribute('data-form-index'), '0');
    assert.equal(await frame.locator('#absorbed-count').innerText(), '0');
    assert.deepEqual(errors, [], `${name} runtime errors`);
    await context.close();
    console.log(`${name}: arena production interaction passed`);
  }
  for (const mode of ['corrupt', 'unavailable']) {
    const context = await browser.newContext();
    await context.addInitScript(mode => {
      if (mode === 'corrupt') localStorage.setItem('mbg-evolution-save-v1', '{broken JSON');
      else for (const method of ['getItem', 'setItem', 'removeItem']) Object.defineProperty(Storage.prototype, method, { value() { throw new DOMException('Storage disabled', 'SecurityError'); } });
    }, mode);
    const page = await context.newPage(), errors = watchErrors(page, server.origin);
    await page.goto(server.url, { waitUntil: 'networkidle' });
    await page.locator('#game').waitFor();
    assert.equal(await page.locator('#form-name').getAttribute('data-form-index'), '0');
    await arenaAction(page, page, (locator, options) => locator.click(options), { assert });
    assert.deepEqual(errors, [], `${mode} storage fallback`);
    await context.close();
  }
});
