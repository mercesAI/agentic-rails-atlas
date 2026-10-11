/**
 * Typed loaders over astro:content (ARCHITECTURE.md Section 3).
 * Every helper tolerates empty collections and missing sidecar files: a
 * missing sidecar is `null`, and the page renders an "in progress" placeholder.
 */
import { getCollection, render, type CollectionEntry, type CollectionKey } from 'astro:content';
import type { Claim, ProtocolMeta, ProtocolSlug, Source } from './schemas';
import { dedupe } from './citations';

export const SIDECAR_COLLECTIONS = [
  'facts',
  'claims',
  'protocolPersonas',
  'resources',
  'security',
  'controls',
  'compliance',
  'observability',
  'ecosystem',
  'timeline',
  'code',
  'faq',
  'openQuestions',
  'quiz',
  'flashcards',
] as const;
export type SidecarCollection = (typeof SIDECAR_COLLECTIONS)[number];

export type Sidecars = { [K in SidecarCollection]: CollectionEntry<K>['data'] | null };

type RenderResult = Awaited<ReturnType<typeof render>>;

export interface LoadedProtocol {
  meta: ProtocolMeta;
  entry: CollectionEntry<'protocols'>;
  Content: RenderResult['Content'];
  headings: RenderResult['headings'];
  sidecars: Sidecars;
  ste: CollectionEntry<'ste'> | null;
}

/** getCollection that never throws (an empty or misconfigured collection yields []). */
async function safeCollection<C extends CollectionKey>(name: C): Promise<CollectionEntry<C>[]> {
  try {
    return (await getCollection(name)) as CollectionEntry<C>[];
  } catch (err) {
    console.warn(`[content] collection "${String(name)}" unavailable:`, (err as Error).message);
    return [];
  }
}

function belongsTo(entry: { id: string; data: unknown }, slug: string): boolean {
  if (entry.id === slug || entry.id.startsWith(`${slug}/`)) return true;
  const data = entry.data as { protocol?: unknown } | null;
  return Boolean(data && typeof data === 'object' && data.protocol === slug);
}

export async function getProtocols(): Promise<ProtocolMeta[]> {
  const entries = await safeCollection('protocols');
  return entries.map((e) => e.data).sort((a, b) => a.order - b.order);
}

export async function getProtocolEntries(): Promise<CollectionEntry<'protocols'>[]> {
  const entries = await safeCollection('protocols');
  return entries.sort((a, b) => a.data.order - b.data.order);
}

export async function getSidecar<K extends SidecarCollection>(
  name: K,
  slug: string,
): Promise<CollectionEntry<K>['data'] | null> {
  const entries = await safeCollection(name);
  const hit = entries.find((e) => belongsTo(e, slug));
  return hit ? (hit.data as CollectionEntry<K>['data']) : null;
}

export async function getSidecars(slug: string): Promise<Sidecars> {
  const pairs = await Promise.all(
    SIDECAR_COLLECTIONS.map(async (name) => [name, await getSidecar(name, slug)] as const),
  );
  return Object.fromEntries(pairs) as Sidecars;
}

export async function getProtocol(slug: string): Promise<LoadedProtocol | null> {
  const entries = await safeCollection('protocols');
  const entry = entries.find((e) => e.data.slug === slug);
  if (!entry) return null;
  const { Content, headings } = await render(entry);
  const steEntries = await safeCollection('ste');
  const ste = steEntries.find((e) => e.data.protocol === slug) ?? null;
  return { meta: entry.data, entry, Content, headings, sidecars: await getSidecars(slug), ste };
}

export async function getSourcesMap(): Promise<Map<string, Source>> {
  const entries = await safeCollection('sources');
  return new Map(entries.map((e) => [e.data.id, e.data]));
}

export async function getClaimsMap(slug?: string): Promise<Map<string, Claim>> {
  const entries = await safeCollection('claims');
  const map = new Map<string, Claim>();
  for (const e of entries) {
    if (slug && !belongsTo(e, slug)) continue;
    for (const c of e.data.claims) map.set(c.id, c);
  }
  return map;
}

async function byId<C extends 'flows' | 'states' | 'diagrams'>(name: C, id: string) {
  const entries = await safeCollection(name);
  return entries.find((e) => e.id === id || (e.data as { id?: string }).id === id)?.data ?? null;
}

export const getFlow = (id: string) => byId('flows', id);
export const getStateMachine = (id: string) => byId('states', id);
export const getDiagramMeta = (id: string) => byId('diagrams', id);

export const getGlossary = async () => (await safeCollection('glossary')).map((e) => e.data);
export const getPublications = async () => (await safeCollection('publications')).map((e) => e.data);
export const getPersonas = async () => (await safeCollection('personas')).map((e) => e.data);
export const getRelations = async () => (await safeCollection('relations')).map((e) => e.data);
export const getTimelineGlobal = async () => (await safeCollection('timelineGlobal')).map((e) => e.data);
export const getOrbitEntries = async () => safeCollection('orbit');
export const getScenarioEntries = async () => safeCollection('scenarios');

const CITE_RE = /<Cite\s+[^>]*?ids\s*=\s*(?:"([^"]*)"|'([^']*)'|\{\s*["'`]([^"'`]*)["'`]\s*\})/g;

/** Ids found in `<Cite ids="..."/>` markers of an MDX body, in order. */
export function scanCiteIds(body: string | undefined): string[] {
  if (!body) return [];
  const out: string[] = [];
  for (const m of body.matchAll(CITE_RE)) {
    const raw = m[1] ?? m[2] ?? m[3] ?? '';
    out.push(...raw.split(/[\s,]+/).filter(Boolean));
  }
  return out;
}

/** Collects every value under `sources` and `claimIds` keys, depth-first, in document order. */
export function collectRefs(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const v of value) collectRefs(v, out);
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if ((k === 'sources' || k === 'claimIds') && Array.isArray(v)) {
        for (const id of v) if (typeof id === 'string') out.push(id);
      } else {
        collectRefs(v, out);
      }
    }
  }
  return out;
}

/** Sidecars in page section order (A, E to S); claims.json is the pool, not a section. */
const SECTION_ORDER: SidecarCollection[] = [
  'facts',
  'protocolPersonas',
  'resources',
  'security',
  'controls',
  'compliance',
  'observability',
  'ecosystem',
  'timeline',
  'code',
  'faq',
  'openQuestions',
  'quiz',
  'flashcards',
];

/**
 * Ordered, de-duplicated source ids for a protocol page: key facts, facts,
 * MDX body cites, STE cites, then every sidecar in section order. Claim ids
 * expand to their sources.
 */
export async function getPageSources(slug: ProtocolSlug | string): Promise<string[]> {
  const entries = await safeCollection('protocols');
  const entry = entries.find((e) => e.data.slug === slug);
  if (!entry) return [];
  const claims = await getClaimsMap(slug);
  const sidecars = await getSidecars(slug);
  const steEntries = await safeCollection('ste');
  const ste = steEntries.find((e) => e.data.protocol === slug);

  const refs: string[] = [];
  for (const kf of entry.data.keyFacts) refs.push(...kf.claimIds);
  refs.push(...collectRefs(sidecars.facts));
  refs.push(...scanCiteIds(entry.body));
  refs.push(...scanCiteIds(ste?.body));
  for (const name of SECTION_ORDER.slice(1)) refs.push(...collectRefs(sidecars[name]));

  const sourceIds: string[] = [];
  for (const id of refs) {
    if (id.startsWith('clm-')) sourceIds.push(...(claims.get(id)?.sources ?? []));
    else sourceIds.push(id);
  }
  return dedupe(sourceIds.filter((id) => id.startsWith('src-')));
}
