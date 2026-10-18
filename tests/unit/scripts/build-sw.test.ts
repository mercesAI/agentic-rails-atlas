import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { INSTALL_CONCURRENCY, buildWorkerText, collectEntries, planPrecache, type Entry } from '../../../scripts/build-sw';

/** A small dist folder: pages, hashed assets, a font, the manifest, pagefind, server files and stray dotfiles. */
const FILES: Record<string, string> = {
  'index.html': '<!doctype html><title>Home</title>',
  '404.html': '<!doctype html><title>Not found</title>',
  'compare/index.html': '<!doctype html><title>Compare</title>',
  '_astro/app.abc123.js': 'console.log(1)',
  '_astro/app.abc123.css': 'body{}',
  'fonts/body.woff2': 'font bytes',
  'manifest.webmanifest': '{}',
  'pagefind/pagefind.js': 'pf',
  'pagefind/index/a.pf_index': 'idx',
  'sw.js': 'old worker',
  '_headers': '/*\n  X-Test: 1',
  'robots.txt': 'User-agent: *',
  'og/default.png': 'png',
  '.DS_Store': 'junk',
  '_astro/.DS_Store': 'junk',
  '.well-known/hidden.json': '{}',
};

const CACHEABLE = [
  '/',
  '/404.html',
  '/_astro/app.abc123.css',
  '/_astro/app.abc123.js',
  '/compare/',
  '/fonts/body.woff2',
  '/manifest.webmanifest',
  '/pagefind/index/a.pf_index',
  '/pagefind/pagefind.js',
];

let dist: string;
beforeAll(() => {
  dist = mkdtempSync(join(tmpdir(), 'atlas-sw-'));
  for (const [rel, text] of Object.entries(FILES)) {
    const p = join(dist, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, text);
  }
});
afterAll(() => rmSync(dist, { recursive: true, force: true }));

type Handler = (event: Record<string, unknown>) => void;
interface Harness {
  handlers: Record<string, Handler>;
  puts: { key: unknown; res: Response }[];
}

/** Evaluates the worker text in a bare context with fake service worker globals. */
function loadWorker(text: string, fetchImpl: (url: string) => Promise<Response>): Harness {
  const handlers: Record<string, Handler> = {};
  const puts: Harness['puts'] = [];
  const cache = {
    put: async (key: unknown, res: Response) => {
      puts.push({ key, res });
    },
    match: async () => undefined,
    keys: async () => [],
  };
  class FakeRequest {
    url: string;
    constructor(url: string, init?: Record<string, unknown>) {
      this.url = url;
      Object.assign(this, init);
    }
  }
  const sandbox = {
    self: {
      addEventListener: (name: string, fn: Handler) => {
        handlers[name] = fn;
      },
      clients: { claim: async () => undefined },
      location: { origin: 'https://atlas.test' },
      skipWaiting: () => {
        throw new Error('skipWaiting must not be called');
      },
    },
    caches: { open: async () => cache, keys: async () => [], delete: async () => true },
    fetch: (req: string | { url: string }) => fetchImpl(typeof req === 'string' ? req : req.url),
    Request: FakeRequest,
    Response,
    Headers,
    Blob,
    URL,
    setTimeout,
    clearTimeout,
    console,
  };
  runInNewContext(text, sandbox);
  return { handlers, puts };
}

/** Runs the install handler and reports how its waitUntil promise settled. */
async function install(h: Harness): Promise<{ ok: boolean; error?: string }> {
  let pending: unknown;
  h.handlers.install!({
    waitUntil: (p: unknown) => {
      pending = p;
    },
  });
  try {
    await Promise.resolve(pending);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

const ok = (body = 'ok'): Response => new Response(body, { status: 200 });
/** A response as fetch returns it after following a redirect. */
const redirected = (body: string): Response => {
  const res = new Response(body, { status: 200 });
  Object.defineProperty(res, 'redirected', { value: true });
  return res;
};
const workerFor = (entries: Entry[] = planPrecache(collectEntries(dist)).precache): string => buildWorkerText(entries).text;

describe('build-sw', () => {
  it('collects pages, assets, fonts, the manifest and pagefind files and skips dotfiles and server files', () => {
    const entries = collectEntries(dist);
    expect(entries.map((e) => e.url).sort()).toEqual(CACHEABLE);
    expect(entries.find((e) => e.url === '/fonts/body.woff2')?.kind).toBe('font');
    expect(entries.find((e) => e.url === '/compare/')?.kind).toBe('html');
    expect(entries.find((e) => e.url === '/_astro/app.abc123.js')?.kind).toBe('asset');
    expect(entries.find((e) => e.url === '/pagefind/pagefind.js')?.kind).toBe('pagefind');
    expect(entries.find((e) => e.url === '/manifest.webmanifest')?.kind).toBe('manifest');
  });

  it('puts shell assets first and leaves the largest files to runtime caching when the cap is reached', () => {
    const entries = collectEntries(dist);
    const all = planPrecache(entries);
    expect(all.skipped).toEqual([]);
    expect(all.precache[0]?.kind).toBe('manifest');
    const capped = planPrecache(entries, 60);
    expect(capped.total).toBeLessThanOrEqual(60);
    expect(capped.skipped.length).toBeGreaterThan(0);
    expect(capped.precache.length + capped.skipped.length).toBe(entries.length);
  });

  it('writes a deterministic worker that cleans every stored response, never skips waiting and ignores only-if-cached requests', () => {
    const { text, version } = buildWorkerText(planPrecache(collectEntries(dist)).precache);
    expect(version).toMatch(/^[0-9a-f]{12}$/);
    expect(text).toContain('async function clean(res)');
    const puts = text.split('\n').filter((line) => line.includes('.put('));
    expect(puts).toHaveLength(1);
    expect(puts[0]).toContain('await clean(');
    // store() wraps the put and is used by the install and the three runtime strategies.
    expect((text.match(/\bstore\(/g) ?? []).length).toBeGreaterThanOrEqual(5);
    expect(text).not.toMatch(/skipWaiting\s*\(/);
    expect(text).toContain('self.clients.claim()');
    expect(text).toContain("request.cache === 'only-if-cached' && request.mode !== 'same-origin'");
    expect(text).not.toContain('.DS_Store');
    expect(text).not.toContain('hidden.json');
    expect(buildWorkerText(planPrecache(collectEntries(dist)).precache).text).toBe(text);
  });

  it('marks pagefind chunks and the manifest optional and everything else required', () => {
    const text = workerFor();
    const optional = JSON.parse(/const OPTIONAL = new Set\((\[.*?\])\);/.exec(text)?.[1] ?? '[]') as string[];
    expect(optional.sort()).toEqual(['/manifest.webmanifest', '/pagefind/index/a.pf_index', '/pagefind/pagefind.js']);
  });

  describe('install', () => {
    it('succeeds when only optional files fail and stores the rest', async () => {
      const h = loadWorker(workerFor(), async (url) => (url.startsWith('/pagefind/') ? new Response('', { status: 404 }) : ok()));
      expect(await install(h)).toEqual({ ok: true });
      expect(h.puts.map((p) => p.key).sort()).toEqual(CACHEABLE.filter((u) => !u.startsWith('/pagefind/')));
    });

    it('rejects when a page, an asset or a font cannot be fetched', async () => {
      for (const bad of ['/compare/', '/_astro/app.abc123.js', '/fonts/body.woff2']) {
        const h = loadWorker(workerFor(), async (url) => {
          if (url === bad) throw new TypeError('fetch failed');
          return ok();
        });
        const r = await install(h);
        expect(r.ok).toBe(false);
        expect(r.error).toContain(bad);
      }
      const h = loadWorker(workerFor(), async (url) => (url === '/' ? new Response('', { status: 503 }) : ok()));
      expect((await install(h)).ok).toBe(false);
    });

    it('stores a redirected response as a fresh one', async () => {
      const h = loadWorker(workerFor(), async (url) => (url === '/404.html' ? redirected('not found page') : ok()));
      expect(await install(h)).toEqual({ ok: true });
      const put = h.puts.find((p) => p.key === '/404.html');
      expect(put?.res.redirected).toBe(false);
      expect(put?.res.status).toBe(200);
      expect(await put?.res.text()).toBe('not found page');
    });

    it('fetches at most INSTALL_CONCURRENCY files at a time', async () => {
      const entries: Entry[] = Array.from({ length: 40 }, (_, i) => ({ url: `/page-${i}/`, bytes: 10, kind: 'html', hash: i.toString(16).padStart(16, '0') }));
      let inFlight = 0;
      let max = 0;
      const h = loadWorker(workerFor(entries), async () => {
        inFlight++;
        max = Math.max(max, inFlight);
        await new Promise((r) => setTimeout(r, 1));
        inFlight--;
        return ok();
      });
      expect(await install(h)).toEqual({ ok: true });
      expect(h.puts).toHaveLength(40);
      expect(max).toBe(INSTALL_CONCURRENCY);
    });
  });

  describe('fetch', () => {
    it('leaves only-if-cached requests from another origin to the browser', () => {
      const h = loadWorker(workerFor([]), async () => ok());
      let answered = false;
      h.handlers.fetch!({
        request: { method: 'GET', cache: 'only-if-cached', mode: 'no-cors', url: 'https://atlas.test/x.js', headers: new Headers() },
        respondWith: () => {
          answered = true;
        },
      });
      expect(answered).toBe(false);
    });

    it('serves a navigation from the network and refreshes the cache with a clean copy', async () => {
      const h = loadWorker(workerFor([]), async () => redirected('<h1>Compare</h1>'));
      let response: unknown;
      const pending: unknown[] = [];
      h.handlers.fetch!({
        request: { method: 'GET', cache: 'default', mode: 'navigate', url: 'https://atlas.test/compare', headers: new Headers() },
        respondWith: (p: unknown) => {
          response = p;
        },
        waitUntil: (p: unknown) => {
          pending.push(p);
        },
      });
      const res = (await Promise.resolve(response)) as Response;
      expect(await res.text()).toBe('<h1>Compare</h1>');
      await Promise.all(pending.map((p) => Promise.resolve(p)));
      expect(h.puts).toHaveLength(1);
      expect(h.puts[0]?.key).toBe('/compare');
      expect(h.puts[0]?.res.redirected).toBe(false);
    });
  });
});
