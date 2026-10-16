import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { startProductionServer } from './production-server.mjs';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
const server = await startProductionServer();
let browser;
try {
  browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE || undefined });
  await mkdir('artifacts', { recursive: true });
  for (const [name, viewport] of [['desktop', { width: 1440, height: 1000 }], ['mobile', { width: 320, height: 568 }]]) {
    const context = await browser.newContext({ viewport, reducedMotion: 'reduce', isMobile: name === 'mobile', hasTouch: name === 'mobile' });
    const errors = [];
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    page.on('requestfailed', request => errors.push(`${request.failure()?.errorText} ${request.url()}`));
    page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
    page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== server.origin) errors.push(`External runtime request: ${request.url()}`); });
    await page.goto(`${server.origin}/embed.html`, { waitUntil: 'networkidle' });
    const frame = page.frameLocator('iframe');
    await frame.locator('canvas').waitFor();
    if (name === 'mobile') await frame.locator('#begin').tap();
    else await frame.locator('#begin').click();
    assert.equal(await frame.locator('[data-operator]:enabled').count(), 4);
    await page.screenshot({ path: `artifacts/${name}-nested-iframe.png`, fullPage: true });
    assert.deepEqual(errors, [], `${name} iframe runtime errors`);
    await context.close();
    console.log(`${name}: production bundle starts under nested path inside iframe with no external requests`);
  }
} finally {
  await browser?.close();
  await server.close();
}
