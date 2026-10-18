/**
 * Static JSON of the command palette index: src/generated/search-index.json,
 * written by scripts/build-search-index.ts before astro build. Serving it as a
 * file keeps the index out of the island's JavaScript; the palette fetches it
 * once, the first time it opens, and the service worker precaches it like
 * /data/glossary.json. A missing file (astro dev on a fresh checkout) gives an
 * empty index; a corrupt one fails the build.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { APIRoute } from 'astro';

export const prerender = true;

const INDEX_PATH = resolve(process.cwd(), 'src/generated/search-index.json');
const EMPTY = { version: 1, counts: {}, entries: [] };

export const GET: APIRoute = () => {
  // Re-serialized compactly: the committed file is indented for readable diffs.
  const index: unknown = existsSync(INDEX_PATH) ? JSON.parse(readFileSync(INDEX_PATH, 'utf8')) : EMPTY;
  return new Response(JSON.stringify(index), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
