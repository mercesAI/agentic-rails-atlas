/**
 * After `astro build`: walks dist/, writes dist/sw.js (precache + runtime caching) and
 * dist/manifest.webmanifest (docs/ARCHITECTURE.md section 9).
 *
 * Precache: HTML, CSS, JS, SVG, fonts, the web manifest and Pagefind, in that
 * priority order, until PRECACHE_CAP_BYTES is reached (files over the cap are left out
 * and fall back to the runtime strategies below). The install fetches INSTALL_CONCURRENCY
 * files at a time and fails when a page, asset or font cannot be fetched, so the browser
 * keeps the previous worker and retries on the next update check; Pagefind files and the
 * manifest are best effort. A response that followed a redirect is never stored: the host
 * answers 307 for /404.html under auto-trailing-slash, and a redirected response cannot be
 * served to a navigation.
 * Pagefind (kinds 'pagefind' and 'pagefind-data'): the runtime directly under pagefind/
 * (pagefind.js, its worker, wasm.*.pagefind, pagefind-entry.json, pagefind.*.pf_meta) and the
 * per-query chunks in the index/, fragment/ and filter/ folders are all precached, last in
 * priority, so search works offline for any term and every chunk comes from the same build
 * as the index that names it. The chunks are content-hashed and immutable, so the fetch
 * handler serves them cache-first. Leaving them to runtime caching saved 2 MB but broke
 * search: Pagefind remembers a failed chunk load for the life of the page, so one offline
 * miss kept results empty after the connection came back, and after a deploy an old worker
 * served its old index while the chunk names it lists were gone from the host. The stock
 * Pagefind UI bundles and the highlight script (PAGEFIND_UNUSED) are never requested: the
 * palette imports pagefind.js directly. They stay deployed but out of the worker; a file a
 * later Pagefind version adds is precached until it is listed there.
 * Runtime: network-first for HTML with a cache fallback, cache-first for hashed /_astro/
 * assets and the Pagefind chunks, stale-while-revalidate for everything else on the same origin.
 * Runtime copies are stored under the pathname, as lookups ignore the query string; Pagefind
 * requests pagefind-entry.json with a fresh ?ts= on every start, which would otherwise add one
 * cache entry per search.
 * The cache name carries a hash of the precached content, so a new build installs a new
 * cache and the activate step deletes the old ones. The new worker does not skip waiting:
 * it takes over once every page of the old build is closed (src/lib/client/sw.ts asks for
 * update checks), so an open page never loads island chunks from two builds.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { ROOT, isMain } from './lib/io.ts';

const DIST = join(ROOT, 'dist');
const TOKENS_CSS = join(ROOT, 'src', 'styles', 'tokens.css');
/** Total size of precached files (uncompressed bytes). */
export const PRECACHE_CAP_BYTES = 80 * 1024 * 1024;
export const CACHE_PREFIX = 'atlas-';
/** Precache fetches in flight at once during install. */
export const INSTALL_CONCURRENCY = 8;
/** Kinds whose failed precache fails the install; the others are fetched at runtime instead. */
export const REQUIRED_KINDS: readonly Entry['kind'][] = ['html', 'asset', 'font'];
/**
 * Pagefind folders of per-query data (index chunks, fragments, filter chunks), relative to
 * dist; precached after the runtime and served cache-first.
 */
export const PAGEFIND_DATA_DIRS: readonly string[] = ['pagefind/index/', 'pagefind/fragment/', 'pagefind/filter/'];
/**
 * URL prefixes the worker serves cache-first: content-hashed, immutable files (the Vite bundles and
 * diagram drawings, Pagefind's chunks, and the /data/ files, whose names carry a hash of their content).
 */
export const CACHE_FIRST_PREFIXES: readonly string[] = ['/_astro/', ...PAGEFIND_DATA_DIRS.map((dir) => `/${dir}`), '/data/'];
/**
 * The fixed-name data files earlier builds used, written once more for their pages (see
 * src/pages/data/[file].json.ts). Not precached: this build's pages never ask for them.
 */
export const LEGACY_DATA = new Set(['data/glossary.json', 'data/search-index.json']);
/**
 * Files Pagefind writes that the site never loads: the stock search UIs and the result
 * highlighter. Listed by name rather than allowing a fixed runtime set, so that a runtime
 * file a Pagefind upgrade adds is precached by default instead of silently missing offline.
 */
export const PAGEFIND_UNUSED = /^pagefind\/pagefind-(?:ui|modular-ui|component-ui|highlight)\.(?:js|css)$/;

export interface Entry {
  url: string;
  bytes: number;
  kind: 'html' | 'asset' | 'font' | 'pagefind' | 'pagefind-data' | 'manifest';
  hash: string;
}

/** Files under a folder (absolute paths). Dotfiles such as .DS_Store are skipped. */
export function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.')) continue;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** Path of a file relative to dist, with forward slashes. */
function relPath(dist: string, file: string): string {
  return relative(dist, file).split(sep).join('/');
}

export function toUrl(dist: string, file: string): string {
  const rel = relPath(dist, file);
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return `/${rel.slice(0, -'index.html'.length)}`;
  return `/${rel}`;
}

/** Reads `--bg` from the first `:root` block of tokens.css (the default theme). */
function tokenColor(cssPath: string, name: string, fallback: string): string {
  try {
    const css = readFileSync(cssPath, 'utf8');
    const root = css.slice(css.indexOf(':root'));
    const m = root.match(new RegExp(`${name}:\\s*(#[0-9a-fA-F]{3,8})`));
    return m?.[1] ?? fallback;
  } catch {
    return fallback;
  }
}

export function classify(rel: string): Entry['kind'] | null {
  if (rel === 'sw.js' || rel === '_headers' || rel === '_redirects' || rel === 'robots.txt') return null;
  if (rel === 'manifest.webmanifest') return 'manifest';
  if (PAGEFIND_UNUSED.test(rel) || LEGACY_DATA.has(rel)) return null;
  if (PAGEFIND_DATA_DIRS.some((dir) => rel.startsWith(dir))) return 'pagefind-data';
  if (rel.startsWith('pagefind/')) return 'pagefind';
  if (/\.(woff2?|ttf|otf)$/.test(rel)) return 'font';
  if (/\.html$/.test(rel)) return 'html';
  if (/\.(css|js|mjs|svg|json|wasm)$/.test(rel)) return 'asset';
  return null;
}

/** Every cacheable file under dist with its size and content hash, in path order. */
export function collectEntries(dist: string): Entry[] {
  const entries: Entry[] = [];
  for (const file of walk(dist).sort()) {
    const kind = classify(relPath(dist, file));
    if (!kind) continue;
    const buf = readFileSync(file);
    entries.push({
      url: toUrl(dist, file),
      bytes: buf.length,
      kind,
      hash: createHash('sha256').update(buf).digest('hex').slice(0, 16),
    });
  }
  return entries;
}

/** Splits the entries into the precache list and the files left to runtime caching by the size cap. */
export function planPrecache(entries: Entry[], cap: number = PRECACHE_CAP_BYTES): { precache: Entry[]; skipped: Entry[]; total: number } {
  // Priority: shell assets first, then pages (smallest first so the cap drops the largest), then search.
  const order: Entry['kind'][] = ['manifest', 'asset', 'font', 'html', 'pagefind', 'pagefind-data'];
  const sorted = order.flatMap((k) => entries.filter((e) => e.kind === k).sort((a, b) => a.bytes - b.bytes || a.url.localeCompare(b.url)));
  const precache: Entry[] = [];
  const skipped: Entry[] = [];
  let total = 0;
  for (const e of sorted) {
    if (total + e.bytes > cap) skipped.push(e);
    else {
      precache.push(e);
      total += e.bytes;
    }
  }
  return { precache, skipped, total };
}

/** The service worker source for a precache list. Pure: the same entries give the same text. */
export function buildWorkerText(precache: Entry[], options: { cachePrefix?: string } = {}): { text: string; version: string } {
  const prefix = options.cachePrefix ?? CACHE_PREFIX;
  const version = createHash('sha256')
    .update(precache.map((e) => `${e.url}:${e.hash}`).sort().join('\n'))
    .digest('hex')
    .slice(0, 12);
  const urls = precache.map((e) => e.url).sort();
  const optional = precache.filter((e) => !REQUIRED_KINDS.includes(e.kind)).map((e) => e.url).sort();

  const text = `// Generated by scripts/build-sw.ts. Do not edit.
const CACHE = ${JSON.stringify(`${prefix}${version}`)};
const PREFIX = ${JSON.stringify(prefix)};
const PRECACHE = ${JSON.stringify(urls)};
// Precache entries that may fail without failing the install (fetched at runtime instead).
const OPTIONAL = new Set(${JSON.stringify(optional)});
const NETWORK_TIMEOUT_MS = 4000;
const INSTALL_CONCURRENCY = ${INSTALL_CONCURRENCY};
// Content-hashed, immutable files served cache-first: the /_astro/ bundles and the Pagefind
// index chunks, fragments and filter chunks, which are not precached but cached the first
// time a query loads them.
const CACHE_FIRST_PREFIXES = ${JSON.stringify(CACHE_FIRST_PREFIXES)};

// A response that followed a redirect cannot be served to a navigation request from the
// cache (the host answers 307 for /404.html under auto-trailing-slash), so the body is
// copied into a fresh response before it is stored.
async function clean(res) {
  if (!res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

// Every cache write goes through here: successful responses only, never a redirected one.
async function store(cache, key, res) {
  if (!res.ok) return;
  await cache.put(key, await clean(res));
}

// Fetches the precache list INSTALL_CONCURRENCY files at a time. A failed page, asset or
// font fails the install (the browser keeps the old worker and retries on the next update
// check); a failed optional file is fetched at runtime instead.
async function precache(cache) {
  const queue = PRECACHE.slice();
  const failed = [];
  const run = async () => {
    for (let url = queue.shift(); url !== undefined; url = queue.shift()) {
      try {
        const res = await fetch(new Request(url, { cache: 'reload' }));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        await store(cache, url, res);
      } catch {
        failed.push(url);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(INSTALL_CONCURRENCY, queue.length) }, run));
  const required = failed.filter((url) => !OPTIONAL.has(url));
  if (required.length) {
    throw new Error('precache failed for ' + required.length + ' required file(s): ' + required.slice(0, 5).join(', '));
  }
}

self.addEventListener('install', (event) => {
  // The worker does not skip waiting: it takes over once every page of the old build is
  // closed, so an open page never mixes lazily loaded island chunks from two builds.
  event.waitUntil(caches.open(CACHE).then(precache));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

function isHtmlRequest(request, url) {
  if (request.mode === 'navigate') return true;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html') || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
}

async function fromCache(request, url) {
  const cache = await caches.open(CACHE);
  const hit = (await cache.match(request, { ignoreSearch: true })) || (await cache.match(url.pathname, { ignoreSearch: true }));
  if (hit) return hit;
  if (!url.pathname.endsWith('/') && !url.pathname.includes('.')) {
    const withSlash = await cache.match(url.pathname + '/', { ignoreSearch: true });
    if (withSlash) return withSlash;
  }
  return undefined;
}

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

async function networkFirst(event, request, url) {
  const cache = await caches.open(CACHE);
  const cached = await fromCache(request, url);
  const network = fetch(request);
  // The cache is refreshed whenever the network answers, even after the race below gave up on it.
  const refresh = network.then((res) => store(cache, url.pathname, res.clone())).catch(() => undefined);
  event.waitUntil(refresh);
  try {
    return cached ? await Promise.race([network, timeout(NETWORK_TIMEOUT_MS)]) : await network;
  } catch (err) {
    if (cached) return cached;
    const offline = (await cache.match('/404.html')) || (await cache.match('/'));
    if (offline) return offline;
    throw err;
  }
}

async function cacheFirst(event, request, url) {
  const cached = await fromCache(request, url);
  if (cached) return cached;
  const res = await fetch(request);
  // Cloned before the response is returned: the page starts reading the body as soon as
  // respondWith settles, and a clone taken after that throws, so nothing would be stored.
  const copy = res.clone();
  event.waitUntil(caches.open(CACHE).then((cache) => store(cache, url.pathname, copy)).catch(() => undefined));
  return res;
}

// Runtime copies are keyed by pathname: lookups ignore the query string, and Pagefind asks for
// pagefind-entry.json?ts=<now> on every start, so a full-URL key would add an entry per search.
async function staleWhileRevalidate(event, request, url) {
  const cached = await fromCache(request, url);
  const refresh = fetch(request)
    .then(async (res) => {
      await store(await caches.open(CACHE), url.pathname, res.clone());
      return res;
    })
    .catch(() => undefined);
  event.waitUntil(refresh);
  return cached || (await refresh) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  // DevTools "only-if-cached" requests from another origin cannot be answered by a worker.
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.pathname === '/sw.js') return;
  if (isHtmlRequest(request, url)) event.respondWith(networkFirst(event, request, url));
  else if (CACHE_FIRST_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))) event.respondWith(cacheFirst(event, request, url));
  else event.respondWith(staleWhileRevalidate(event, request, url));
});
`;
  return { text, version };
}

export function buildManifest(cssPath: string = TOKENS_CSS): Record<string, unknown> {
  return {
    id: '/',
    name: 'Agentic Rails Atlas',
    short_name: 'Atlas',
    description: 'An interactive, offline-capable atlas of eight agent identity, checkout and payment protocols.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: tokenColor(cssPath, '--bg', '#0a0d14'),
    theme_color: tokenColor(cssPath, '--bg', '#0a0d14'),
    icons: [{ src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  };
}

function main(): void {
  if (!existsSync(DIST)) mkdirSync(DIST);
  // The manifest is written first so that it is part of the precache list.
  writeFileSync(join(DIST, 'manifest.webmanifest'), `${JSON.stringify(buildManifest(), null, 2)}\n`);

  const { precache, skipped, total } = planPrecache(collectEntries(DIST));
  const { text, version } = buildWorkerText(precache);
  writeFileSync(join(DIST, 'sw.js'), text);

  const mb = (n: number) => (n / 1024 / 1024).toFixed(2);
  const byKind = (k: Entry['kind']) => precache.filter((e) => e.kind === k).length;
  console.log(
    `build-sw: wrote dist/sw.js (cache ${CACHE_PREFIX}${version}) and dist/manifest.webmanifest; precaching ${precache.length} files, ${mb(total)} MB of the ${mb(PRECACHE_CAP_BYTES)} MB cap ` +
      `(${byKind('html')} html, ${byKind('asset')} css/js/svg/json, ${byKind('font')} fonts, ${byKind('pagefind')} pagefind runtime, ${byKind('pagefind-data')} pagefind chunks)` +
      (skipped.length ? `; ${skipped.length} files over the cap left to runtime caching` : ''),
  );
}

if (isMain(import.meta.url)) main();
