import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MapStore } from './store.js';
import { createMap } from '../shared/map-ops.js';
import { toOpml, toSvg } from '../shared/exporters.js';
import type { MindMap } from '../shared/types.js';

const store = new MapStore();
const port = Number(process.env.PORT ?? 4318);
const host = '127.0.0.1';
const moduleDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(moduleDir, '../../dist/web');

function json(response: import('node:http').ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function body<T>(request: import('node:http').IncomingMessage): Promise<T> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const next = Buffer.from(chunk);
    size += next.length;
    if (size > 2_000_000) throw new Error('Request body exceeds 2 MB.');
    chunks.push(next);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as T;
}

async function serveStatic(urlPath: string, response: import('node:http').ServerResponse): Promise<void> {
  const requested = urlPath === '/' ? 'index.html' : urlPath.replace(/^\//, '');
  const safe = path.normalize(requested).replace(/^(\.\.(\/|\\|$))+/, '');
  let target = path.join(webRoot, safe);
  try {
    if (!(await stat(target)).isFile()) target = path.join(webRoot, 'index.html');
  } catch {
    target = path.join(webRoot, 'index.html');
  }
  const extension = path.extname(target);
  const types: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
  const content = await readFile(target);
  response.writeHead(200, { 'content-type': types[extension] ?? 'application/octet-stream' });
  response.end(content);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? host}`);
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments[0] !== 'api') return await serveStatic(url.pathname, response);

    if (request.method === 'GET' && url.pathname === '/api/health') return json(response, 200, { ok: true, service: 'maproom' });
    if (request.method === 'GET' && url.pathname === '/api/maps') return json(response, 200, await store.list());
    if (request.method === 'POST' && url.pathname === '/api/maps') {
      const input = await body<{ title?: string; layout?: MindMap['layout'] }>(request);
      return json(response, 201, await store.save(createMap(input.title?.trim() || 'Untitled map', input.layout)));
    }
    if (segments[1] === 'maps' && segments[2]) {
      const id = decodeURIComponent(segments[2]);
      if (request.method === 'GET' && segments.length === 3) return json(response, 200, await store.get(id));
      if (request.method === 'PUT' && segments.length === 3) return json(response, 200, await store.save(await body<MindMap>(request)));
      if (request.method === 'DELETE' && segments.length === 3) {
        await store.delete(id);
        response.writeHead(204).end();
        return;
      }
      if (request.method === 'GET' && segments[3] === 'opml') {
        const map = await store.get(id);
        response.writeHead(200, { 'content-type': 'text/x-opml; charset=utf-8', 'content-disposition': `attachment; filename="${id}.opml"` });
        response.end(toOpml(map));
        return;
      }
      if (request.method === 'GET' && segments[3] === 'svg') {
        const map = await store.get(id);
        response.writeHead(200, { 'content-type': 'image/svg+xml; charset=utf-8', 'content-disposition': `attachment; filename="${id}.svg"` });
        response.end(toSvg(map));
        return;
      }
    }
    return json(response, 404, { error: 'Not found' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    return json(response, message.startsWith('Map not found') ? 404 : 400, { error: message });
  }
});

server.listen(port, host, () => {
  console.error(`Maproom available at http://${host}:${port}`);
});
