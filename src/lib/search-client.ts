/**
 * Client-side search helpers for the command palette. The build-time index
 * (src/generated/search-index.json, written by scripts/build-search-index.ts)
 * is normalized tolerantly so small shape changes never break the palette.
 */

export interface SearchItem {
  title: string;
  url: string;
  kind: string;
  text?: string;
  context?: string;
  keywords?: string[];
}

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

/** Same-origin internal links only; anything else opens as a normal link. */
export function isInternalUrl(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//');
}

export function stripTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
