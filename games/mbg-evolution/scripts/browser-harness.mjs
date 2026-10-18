import { mkdir } from 'node:fs/promises';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';
import assert from 'node:assert/strict';
import { startProductionServer } from './production-server.mjs';

export const artifacts = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../artifacts');
export async function browserHarness(run) {
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : 'playwright');
  const server = await startProductionServer();
  let browser;
  try {
    browser = await chromium.launch({ headless: true, executablePath: process.env.PLAYWRIGHT_EXECUTABLE || undefined });
    await mkdir(artifacts, { recursive: true });
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
