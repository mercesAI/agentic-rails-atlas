/**
 * Citation numbering and resolution (ARCHITECTURE.md Sections 3 and 6).
 *
 * A page calls `setPageSources(list, { page, sources, claims })` in its
 * frontmatter before rendering content. `<Cite ids="..." />` then calls
 * `resolveCite(ids, page)` to get the footer numbers. State is keyed by page
 * pathname so concurrent or sequential page builds never leak numbering.
 */
import type { Claim, Confidence, Source } from './schemas';

export interface CitationContext {
  /** Ordered, de-duplicated source ids; index + 1 is the footer number. */
  order: string[];
  sources: Map<string, Source>;
  claims: Map<string, Claim>;
}

export interface ResolvedCite {
  id: string;
  kind: 'claim' | 'source' | 'unknown';
  sourceIds: string[];
  numbers: number[];
  claim?: Claim;
  confidence?: Confidence;
}

export interface CitationPayload {
  sources: (Pick<Source, 'id' | 'url' | 'title' | 'publisher' | 'type' | 'primary' | 'accessed'> &
    Partial<Pick<Source, 'published' | 'archiveUrl' | 'notes'>> & { n: number })[];
  claims: Pick<Claim, 'id' | 'text' | 'confidence' | 'sources' | 'asOf'>[];
}

const DEFAULT_PAGE = '__default__';
const contexts = new Map<string, CitationContext>();

type MapLike<T> = Map<string, T> | Record<string, T> | T[] | undefined;

function toMap<T extends { id: string }>(input: MapLike<T>): Map<string, T> {
  if (!input) return new Map();
  if (input instanceof Map) return new Map(input);
  if (Array.isArray(input)) return new Map(input.map((x) => [x.id, x]));
  return new Map(Object.entries(input));
}

/** De-duplicates while keeping first-seen order. */
export function dedupe(ids: Iterable<string>): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    const t = id.trim();
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

/** Splits a `<Cite ids>` string ("clm-x402-001 src-foo") into ids. */
export function parseIds(ids: string | string[]): string[] {
  const list = Array.isArray(ids) ? ids : ids.split(/[\s,]+/);
  return dedupe(list);
}

export function isClaimId(id: string): boolean {
  return id.startsWith('clm-');
}

export function isSourceId(id: string): boolean {
  return id.startsWith('src-');
}

/** Expands claim ids to their source ids, keeps source ids, drops unknown claims. */
export function claimIdsToSourceIds(ids: Iterable<string>, claims: Map<string, Claim>): string[] {
  const out: string[] = [];
  for (const id of ids) {
    if (isClaimId(id)) out.push(...(claims.get(id)?.sources ?? []));
    else if (isSourceId(id)) out.push(id);
  }
  return dedupe(out);
}

export function setPageSources(
  list: string[],
  opts: { page?: string; sources?: MapLike<Source>; claims?: MapLike<Claim> } = {},
): CitationContext {
  const ctx: CitationContext = {
    order: dedupe(list),
    sources: toMap(opts.sources),
    claims: toMap(opts.claims),
  };
  contexts.set(opts.page ?? DEFAULT_PAGE, ctx);
  return ctx;
}

export function getPageContext(page?: string): CitationContext | undefined {
  return contexts.get(page ?? DEFAULT_PAGE);
}

/** Number for a source id on a page; unknown source ids are appended so they still get a number. */
export function numberFor(sourceId: string, ctx: CitationContext): number {
  let idx = ctx.order.indexOf(sourceId);
  if (idx === -1) {
    ctx.order.push(sourceId);
    idx = ctx.order.length - 1;
  }
  return idx + 1;
}

export function resolveCite(ids: string | string[], page?: string): ResolvedCite[] {
  let ctx = getPageContext(page);
  if (!ctx) ctx = setPageSources([], { page });
  const c = ctx;
  return parseIds(ids).map((id): ResolvedCite => {
    if (isClaimId(id)) {
      const claim = c.claims.get(id);
      const sourceIds = claim ? dedupe(claim.sources) : [];
      return {
        id,
        kind: claim ? 'claim' : 'unknown',
        sourceIds,
        numbers: sourceIds.map((s) => numberFor(s, c)),
        claim,
        confidence: claim?.confidence,
      };
    }
    if (isSourceId(id)) return { id, kind: 'source', sourceIds: [id], numbers: [numberFor(id, c)] };
    return { id, kind: 'unknown', sourceIds: [], numbers: [] };
  });
}

/**
 * Data the CitationDrawer reads from `script#atlas-citations`. Carries every claim of the page
 * context; the build then drops the claims the page never mentions (src/lib/build/prune-citations.ts).
 */
export function getCitationPayload(page?: string): CitationPayload {
  const ctx = getPageContext(page);
  if (!ctx) return { sources: [], claims: [] };
  const sources: CitationPayload['sources'] = [];
  ctx.order.forEach((id, i) => {
    const s = ctx.sources.get(id);
    if (!s) return;
    sources.push({
      n: i + 1,
      id: s.id,
      url: s.url,
      title: s.title,
      publisher: s.publisher,
      type: s.type,
      primary: s.primary,
      accessed: s.accessed,
      published: s.published,
      archiveUrl: s.archiveUrl,
      notes: s.notes,
    });
  });
  const claims = [...ctx.claims.values()].map((c) => ({
    id: c.id,
    text: c.text,
    confidence: c.confidence,
    sources: c.sources,
    asOf: c.asOf,
  }));
  return { sources, claims };
}

/** JSON safe to embed inside a <script type="application/json">. */
export function serializeForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
