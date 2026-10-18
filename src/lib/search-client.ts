/**
 * Client-side search helpers for the command palette. The build-time index
 * (src/generated/search-index.json, written by scripts/build-search-index.ts)
 * is served as a content-hashed static file (/data/search-index.<hash>.json, written by
 * src/pages/data/[file].json.ts) and normalized tolerantly here so small
 * shape changes never break the palette.
 */

export interface SearchItem {
  title: string;
  url: string;
  kind: string;
  text?: string;
  context?: string;
  keywords?: string[];
}

/** Where the build serves the index (same origin, precached by the service worker). */
/**
 * Where the index lives: Base.astro passes the content-hashed /data/search-index.<hash>.json of the
 * build (lib/site-data-files.ts) to the palette; this fixed name is only the default of fetchSearchIndex.
 */
export const SEARCH_INDEX_URL = '/data/search-index.json';

type Raw = Record<string, unknown>;

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() ? v : undefined);

export function normalizeSearchIndex(input: unknown): SearchItem[] {
  let list: unknown[] = [];
  if (Array.isArray(input)) list = input;
  else if (input && typeof input === 'object') {
    const obj = input as Raw;
    if (Array.isArray(obj.entries)) list = obj.entries;
    else if (Array.isArray(obj.items)) list = obj.items;
  }
  const out: SearchItem[] = [];
  for (const entry of list) {
    if (!entry || typeof entry !== 'object') continue;
    const r = entry as Raw;
    const title = str(r.title) ?? str(r.label) ?? str(r.term) ?? str(r.name);
    const url = str(r.url) ?? str(r.href);
    if (!title || !url) continue;
    out.push({
      title,
      url,
      kind: str(r.kind) ?? str(r.type) ?? 'page',
      text: str(r.text) ?? str(r.summary) ?? str(r.description) ?? str(r.plain),
      context: str(r.context) ?? str(r.protocol) ?? str(r.section) ?? str(r.page),
      keywords: Array.isArray(r.keywords) ? r.keywords.filter((k): k is string => typeof k === 'string') : undefined,
    });
  }
  return out;
}

/**
 * Fetches the index from the same origin and normalizes it. Rejects on a
 * network error or a non-ok status, so the caller decides what an unavailable
 * index means (the palette shows an empty list).
 */
export async function fetchSearchIndex(fetchFn: typeof fetch = globalThis.fetch, url: string = SEARCH_INDEX_URL): Promise<SearchItem[]> {
  const res = await fetchFn(url);
  if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}`);
  return normalizeSearchIndex(await res.json());
}

/** Same-origin internal links only; anything else opens as a normal link. */
export function isInternalUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
