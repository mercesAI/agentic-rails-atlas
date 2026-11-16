/**
 * A local stand-in for Cloudflare in front of dist/, for tests that need what `astro preview`
 * lacks:
 * - the headers in dist/_headers, the Content-Security-Policy among them;
 * - wrangler.toml's html_handling "auto-trailing-slash" and not_found_handling "404-page" for
 *   the paths the tests use: a directory without its slash, a page's index.html name and a
 *   file's .html name redirect with 307 to the clean URL, /404 serves 404.html, and an unknown
 *   path gets 404.html with status 404 (other paths may differ from Cloudflare);
 * - Web Analytics as atlas.merces.ai answered curl on 2026-11-15: HTML asked for with text/html
 *   in Accept gets the beacon tag (a module script with data-cf-beacon) before </body> and no
 *   ETag; HTML asked for otherwise has no tag and an ETag; a matching If-None-Match gets 304
 *   whatever the Accept header says.
 * The beacon is a stub at a fixed URL that counts its runs in window.__beaconRuns. Every request
 * but the beacon's is logged when it is answered, and `delay(path, ms)` makes later answers
 * for a path slow.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { extname, join, sep } from 'node:path';

const BEACON_PATH = '/__edge/beacon.js';
const BEACON_TAG = `<script type="module" src="${BEACON_PATH}" data-cf-beacon='{"token":"test","spa":2}'></script>`;
const BEACON_JS = 'window.__beaconRuns = (window.__beaconRuns || 0) + 1;';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.wasm': 'application/wasm',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
};

interface HeaderRule {
  pattern: RegExp;
  headers: [string, string][];
}

/** Parses a Cloudflare _headers file: a path pattern line, then indented `Name: value` lines. */
function parseHeadersFile(text: string): HeaderRule[] {
  const rules: HeaderRule[] = [];
  let current: HeaderRule | undefined;
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      const source = trimmed.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
      current = { pattern: new RegExp(`^${source}$`), headers: [] };
      rules.push(current);
    } else if (current) {
      const colon = trimmed.indexOf(':');
      if (colon > 0) current.headers.push([trimmed.slice(0, colon).trim().toLowerCase(), trimmed.slice(colon + 1).trim()]);
    }
  }
  return rules;
}

export interface EdgeRequest {
  path: string;
  accept: string;
  /** The request carried If-None-Match. */
  conditional: boolean;
  referer: string;
  status: number;
}

export interface EdgeServer {
  url: string;
  requests: EdgeRequest[];
  delay(path: string, ms: number): void;
  close(): Promise<void>;
}

export async function startEdgeServer(dist: string): Promise<EdgeServer> {
  const rules = parseHeadersFile(readFileSync(join(dist, '_headers'), 'utf8'));
  const delays = new Map<string, number>();
  const requests: EdgeRequest[] = [];

  const resolveFile = (path: string): { file?: string; redirect?: string } => {
    if (path.endsWith('/index.html')) return { redirect: path.slice(0, -'index.html'.length) };
    if (path.endsWith('.html')) {
      const clean = path.slice(0, -'.html'.length);
      return { redirect: existsSync(join(dist, ...clean.split('/').filter(Boolean), 'index.html')) ? `${clean}/` : clean };
    }
    const base = join(dist, ...path.split('/').filter(Boolean));
    if (base !== dist && !base.startsWith(dist + sep)) return {};
    if (path.endsWith('/')) return existsSync(join(base, 'index.html')) ? { file: join(base, 'index.html') } : {};
    if (existsSync(base) && statSync(base).isFile()) return { file: base };
    if (existsSync(join(base, 'index.html'))) return { redirect: `${path}/` };
    if (existsSync(`${base}.html`)) return { file: `${base}.html` };
    return {};
  };

  const handle = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', 'http://edge.test');
    const path = decodeURIComponent(url.pathname);
    const accept = String(req.headers.accept ?? '');
    const record = (status: number) =>
      requests.push({ path, accept, conditional: Boolean(req.headers['if-none-match']), referer: String(req.headers.referer ?? ''), status });
    if (path === BEACON_PATH) {
      res.writeHead(200, { 'content-type': TYPES['.js']!, 'cache-control': 'no-store' }).end(BEACON_JS);
      return;
    }
    const wait = delays.get(path);
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));

    const found = resolveFile(path);
    if (found.redirect) {
      record(307);
      res.writeHead(307, { location: `${found.redirect}${url.search}` }).end();
      return;
    }
    const status = found.file ? 200 : 404;
    const file = found.file ?? join(dist, '404.html');
    const body = readFileSync(file);
    const headers: Record<string, string> = { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' };
    for (const rule of rules) if (rule.pattern.test(path)) for (const [name, value] of rule.headers) headers[name] = value;
    headers['cache-control'] ??= 'public, max-age=0, must-revalidate';
    const etag = `"${createHash('sha256').update(body).digest('hex').slice(0, 32)}"`;

    if (status === 200 && req.headers['if-none-match'] === etag) {
      record(304);
      res.writeHead(304, { etag, 'cache-control': headers['cache-control'] }).end();
      return;
    }
    record(status);
    if (extname(file) === '.html' && accept.includes('text/html')) {
      const text = body.toString('utf8');
      const end = text.lastIndexOf('</body>');
      res.writeHead(status, headers).end(end < 0 ? text + BEACON_TAG : text.slice(0, end) + BEACON_TAG + text.slice(end));
      return;
    }
    res.writeHead(status, { ...headers, etag }).end(body);
  };

  const server = createServer((req, res) => {
    handle(req, res).catch((err: unknown) => {
      if (!res.headersSent) res.writeHead(500);
      res.end(String(err));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    // 127.0.0.1 is a secure context, so the service worker registers over plain HTTP.
    url: `http://127.0.0.1:${port}`,
    requests,
    delay: (path, ms) => {
      if (ms > 0) delays.set(path, ms);
      else delays.delete(path);
    },
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections();
        server.close(() => resolve());
      }),
  };
}
