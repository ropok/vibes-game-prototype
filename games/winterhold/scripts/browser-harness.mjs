import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { startProductionServer } from './production-server.mjs';

export async function browserHarness(run) {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
  const server = await startProductionServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE || undefined });
    await mkdir('artifacts', { recursive: true });
    await run({ browser, server, assert });
  } finally {
    await browser?.close();
    await server.close();
  }
}

export function watchErrors(page, origin) {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push(`${request.failure()?.errorText} ${request.url()}`));
  page.on('response', response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  page.on('request', request => { if (/^https?:/.test(request.url()) && new URL(request.url()).origin !== origin) errors.push(`External runtime request: ${request.url()}`); });
  return errors;
}

// Read the keeper's cream dot from the visible map, rather than exposing game state.
export async function keeperPosition(map) {
  return map.evaluate(canvas => {
    const { data, width, height } = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
    let x = 0, y = 0, total = 0;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] > 248 && data[i + 1] > 245 && data[i + 2] > 215) {
        x += (i / 4) % width; y += Math.floor(i / 4 / width); total++;
      }
    }
    if (!total) throw new Error('Keeper dot is missing from the visible minimap');
    return { x: x / total / width * 2600, y: y / total / height * 2000 };
  });
}

export async function walkTo(page, x, y) {
  const map = page.locator('#minimap');
  for (const [axis, target, negative, positive] of [['x', x, 'ArrowLeft', 'ArrowRight'], ['y', y, 'ArrowUp', 'ArrowDown']]) {
    const deadline = Date.now() + 15000;
    let key;
    try {
      while (true) {
        const position = await keeperPosition(map);
        const remaining = target - position[axis];
        if (Math.abs(remaining) < 25) break;
        if (Date.now() > deadline) throw new Error(`Movement stalled on ${axis}: keeper=${JSON.stringify(position)}, target=${target}`);
        const next = remaining < 0 ? negative : positive;
        if (key !== next) { if (key) await page.keyboard.up(key); await page.keyboard.down(next); key = next; }
        await page.waitForTimeout(40);
      }
    } finally { if (key) await page.keyboard.up(key); }
  }
  await page.waitForTimeout(180);
}
