import http from 'node:http';
import path from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist');
const mount = '/games/mathventures/';
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg' };

/** Local QA server with a nested deployment path and same-origin iframe shell. */
export async function startProductionServer() {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      if (pathname === '/embed.html') {
        response.writeHead(200, { 'Content-Type': 'text/html', 'Cache-Control': 'no-store' });
        response.end(`<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Local itch-style embed</title><style>html,body{margin:0;width:100%;height:100%;background:#142d2a}iframe{display:block;border:0;width:100%;height:100%}</style></head><body><iframe title="Mathventures" src="${mount}" allow="autoplay; fullscreen" allowfullscreen></iframe></body></html>`);
        return;
      }
      if (!pathname.startsWith(mount)) { response.writeHead(404); response.end('Not found'); return; }
      const relative = pathname.slice(mount.length) || 'index.html';
      const target = path.resolve(dist, relative);
      if (!target.startsWith(dist + path.sep)) { response.writeHead(403); response.end('Forbidden'); return; }
      if (!(await stat(target)).isFile()) { response.writeHead(404); response.end('Not found'); return; }
      response.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      response.end(await readFile(target));
    } catch { response.writeHead(404); response.end('Not found'); }
  });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  return { origin, url: `${origin}${mount}`, close: () => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())) };
}
