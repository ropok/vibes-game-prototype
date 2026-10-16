import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { zipSync } from 'fflate';
import { init, parse } from 'es-module-lexer';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const files = new Map();
async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Symlink is not allowed: ${absolute}`);
    if (entry.isDirectory()) await walk(absolute);
    else if (entry.isFile()) files.set(path.relative(dist, absolute).split(path.sep).join('/'), await readFile(absolute));
  }
}

function validateReference(source, reference) {
  if (!reference || reference.startsWith('#') || /^(data:|blob:)/i.test(reference)) return;
  if (/^(?:[a-z][a-z\d+.-]*:|\/)/i.test(reference)) throw new Error(`${source}: runtime asset must be relative: ${reference}`);
  const clean = decodeURIComponent(reference.split(/[?#]/)[0]);
  if (!clean) return;
  const target = path.posix.normalize(path.posix.join(path.posix.dirname(source), clean));
  if (!files.has(target)) throw new Error(`${source}: missing asset (case-sensitive): ${reference}`);
}

await init;
await walk(dist);
if (!files.has('index.html')) throw new Error('Build first: dist/index.html is required.');
if (files.size > 1000) throw new Error('itch HTML5 archive exceeds 1,000 files.');
let total = 0;
for (const [name, bytes] of files) {
  total += bytes.length;
  if (name.length > 240 || bytes.length > 200 * 1024 * 1024) throw new Error(`itch HTML5 file limit exceeded: ${name}`);
  const text = bytes.toString('utf8');
  if (/\.html?$/i.test(name)) {
    for (const match of text.matchAll(/<(?:script|img|audio|video|source|iframe|link)\b[^>]*?\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)) validateReference(name, match[1]);
  }
  if (/\.(?:css|html?)$/i.test(name)) {
    for (const match of text.matchAll(/url\(\s*["']?([^\s"')]+)["']?\s*\)/gi)) validateReference(name, match[1]);
    for (const match of text.matchAll(/@import\s+["']([^"']+)["']/gi)) validateReference(name, match[1]);
  }
  if (/\.(?:m?js)$/i.test(name)) {
    // A lexer skips string/comment contents in minified engine bundles.
    // import.meta and computed dynamic imports have no literal specifier.
    const [imports] = parse(text, name);
    for (const imported of imports) {
      if (imported.n === undefined) continue;
      if (!/^\.\.?\//.test(imported.n)) throw new Error(`${name}: module dependency must be relative: ${imported.n}`);
      validateReference(name, imported.n);
    }
    // Bundled engine source can contain documentation URLs. Only reject URLs
    // passed to common runtime network APIs, rather than every URL string.
    if (/\b(?:fetch|WebSocket|EventSource|importScripts)\s*\(\s*["'](?:https?:)?\/\//i.test(text)) throw new Error(`${name}: external runtime network dependency`);
  }
}
if (total > 500 * 1024 * 1024) throw new Error('itch HTML5 extracted size exceeds 500 MB.');
const archive = zipSync(Object.fromEntries(files), { level: 6 });
await mkdir(path.join(root, 'artifacts'), { recursive: true });
await writeFile(path.join(root, 'artifacts/mathventures-web.zip'), archive);
console.log(`Packaged ${files.size} files (${archive.length} bytes) to artifacts/mathventures-web.zip`);
