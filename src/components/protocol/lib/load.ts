/**
 * Loads everything one protocol page needs (Astro build time only: imports
 * astro:content through src/lib/content.ts). The page calls
 * `loadProtocolPage(slug)`, then `setPageSources(ctx.order, ...)`.
 */
import { getCollection, render } from 'astro:content';
import {
  collectRefs,
  getClaimsMap,
  getDiagramMeta,
  getFlow,
  getPageSources,
  getPersonas,
  getProtocol,
  getProtocols,
  getPublications,
  getRelations,
  getSourcesMap,
  getStateMachine,
  scanCiteIds,
  type LoadedProtocol,
} from '../../../lib/content';
import { claimIdsToSourceIds, dedupe } from '../../../lib/citations';
import type {
  Claim,
  CompareCell,
  DiagramMeta,
  Flow,
  Persona,
  ProtocolMeta,
  Publication,
  Relation,
  SectionId,
  Source,
  StateMachine,
} from '../../../lib/schemas';
import { citeIdsIn, splitBodySource } from './split-body';

type MdxModule = { default: (props: Record<string, unknown>) => unknown };

/** Optional `src/content/protocols/<slug>/compare.mdx` (alternative to the marker; see docs/integration-notes/template.md). */
const COMPARE_MODULES = import.meta.glob<MdxModule>('/src/content/protocols/*/compare.mdx');
const COMPARE_RAW = import.meta.glob<string>('/src/content/protocols/*/compare.mdx', { query: '?raw', import: 'default' });
const GITHUB = import.meta.glob<unknown>('/src/generated/github/*.json', { eager: true, import: 'default' });

export interface GithubMeta {
  stars?: number;
  lastCommit?: string;
  latestTag?: string;
}

/** Reads the snapshot written by scripts/data (shape tolerant: several key spellings). */
export function githubMeta(repo: string | undefined): GithubMeta | null {
  if (!repo) return null;
  const file = GITHUB[`/src/generated/github/${repo.replace('/', '__')}.json`];
  if (!file || typeof file !== 'object') return null;
  const r = file as Record<string, unknown>;
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = k.split('.').reduce<unknown>((o, p) => (o && typeof o === 'object' ? (o as Record<string, unknown>)[p] : undefined), r);
      if (v !== undefined && v !== null && v !== '') return v;
    }
    return undefined;
  };
  const stars = pick('stars', 'stargazers_count', 'stargazerCount', 'repo.stargazers_count');
  const lastCommit = pick('lastCommit', 'lastCommitDate', 'pushed_at', 'pushedAt', 'lastCommit.date', 'repo.pushed_at');
  const latestTag = pick('latestTag', 'latestRelease.tag_name', 'latestRelease.tag', 'latestRelease', 'release.tag_name');
  return {
    stars: typeof stars === 'number' ? stars : undefined,
    lastCommit: typeof lastCommit === 'string' ? lastCommit.slice(0, 10) : undefined,
    latestTag: typeof latestTag === 'string' ? latestTag : undefined,
  };
}

export interface ProtocolPageContext {
  slug: string;
  page: string;
  loaded: LoadedProtocol;
  meta: ProtocolMeta;
  protocols: ProtocolMeta[];
  sources: Map<string, Source>;
  claims: Map<string, Claim>;
  order: string[];
  flow: Flow | null;
  machine: StateMachine | null;
  diagrams: { id: string; meta: DiagramMeta | null }[];
  trustDiagram: { id: string; meta: DiagramMeta | null; inSectionC: boolean } | null;
  publications: Publication[];
  personas: Map<string, Persona>;
  relations: Relation[];
  compareCells: CompareCell[];
  compareDimensions: Map<string, string>;
  compareMdx: MdxModule['default'] | null;
  steContent: Awaited<ReturnType<typeof render>>['Content'] | null;
  /** Per-section source ids (already expanded from claims) for the right rail. */
  sectionSources: Record<SectionId, string[]>;
  contentPath: string;
}

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    console.warn('[protocol page]', (err as Error).message);
    return fallback;
  }
}

export async function loadProtocolPage(slug: string, page: string): Promise<ProtocolPageContext | null> {
  const loaded = await getProtocol(slug);
  if (!loaded) return null;
  const { meta, sidecars } = loaded;
  const [protocols, sources, claims, baseOrder, publicationsAll, personasAll, relationsAll] = await Promise.all([
    getProtocols(),
    getSourcesMap(),
    getClaimsMap(slug),
    getPageSources(slug),
    getPublications(),
    getPersonas(),
    getRelations(),
  ]);
  const flow = await safe(() => getFlow(meta.mainFlow), null);
  const machine = await safe(() => getStateMachine(meta.stateMachine), null);
  const diagrams = await Promise.all(meta.diagrams.map(async (id) => ({ id, meta: await safe(() => getDiagramMeta(id), null) })));
  const trustId = sidecars.security?.trustBoundaryDiagram;
  const trustDiagram = trustId
    ? { id: trustId, meta: await safe(() => getDiagramMeta(trustId), null), inSectionC: meta.diagrams.includes(trustId) }
    : null;

  const compare = await safe(async () => (await getCollection('compare'))[0]?.data ?? null, null);
  const compareCells = (compare?.cells ?? []).filter((c) => c.protocol === slug);
  const compareDimensions = new Map((compare?.dimensions ?? []).map((d) => [d.id, d.label]));
  const relations = relationsAll.filter((r) => r.from === slug || r.to === slug);
  const publications = publicationsAll.filter((p) => p.protocols.includes(slug));

  const compareKey = `/src/content/protocols/${slug}/compare.mdx`;
  const compareLoader = COMPARE_MODULES[compareKey];
  const compareMdx = compareLoader ? (await compareLoader()).default : null;
  const compareRaw = COMPARE_RAW[compareKey] ? await COMPARE_RAW[compareKey]() : '';

  const steContent = loaded.ste ? (await safe(() => render(loaded.ste!), null))?.Content ?? null : null;

  const bodySplit = splitBodySource(loaded.entry.body);
  const expand = (ids: string[]) => claimIdsToSourceIds(ids, claims);
  const refs = (v: unknown) => expand(collectRefs(v));
  const sectionSources: Record<SectionId, string[]> = {
    'a-tldr': expand([...meta.keyFacts.flatMap((k) => k.claimIds), ...collectRefs(sidecars.facts)]),
    'b-explanation': expand(citeIdsIn(bodySplit.before)),
    'c-diagrams': dedupe([
      ...(flow?.sources ?? []),
      ...(machine?.sources ?? []),
      ...diagrams.flatMap((d) => d.meta?.sources ?? []),
    ]).filter((id) => id.startsWith('src-')),
    'd-ste': expand(scanCiteIds(loaded.ste?.body)),
    'e-personas': refs(sidecars.protocolPersonas),
    'f-resources': refs(sidecars.resources),
    'g-publications': [],
    'h-security': refs(sidecars.security),
    'i-controls': refs(sidecars.controls),
    'j-compliance': refs(sidecars.compliance),
    'k-observability': refs(sidecars.observability),
    'l-ecosystem': refs(sidecars.ecosystem),
    'm-timeline': refs(sidecars.timeline),
    'n-code': refs(sidecars.code),
    'o-playground': [],
    'p-compare': expand([
      ...citeIdsIn(bodySplit.after),
      ...citeIdsIn(compareRaw),
      ...relations.flatMap((r) => r.sources),
      ...compareCells.flatMap((c) => c.sources),
    ]),
    'q-faq': refs(sidecars.faq),
    'r-open-questions': refs(sidecars.openQuestions),
    's-self-test': refs([sidecars.quiz, sidecars.flashcards]),
    't-notes': [],
  };

  // Footer order: getPageSources first (the contract), then anything only the template shows.
  const order = dedupe([...baseOrder, ...Object.values(sectionSources).flat()]).filter((id) => id.startsWith('src-'));

  return {
    slug,
    page,
    loaded,
    meta,
    protocols,
    sources,
    claims,
    order,
    flow,
    machine,
    diagrams,
    trustDiagram,
    publications,
    personas: new Map(personasAll.map((p) => [p.id, p])),
    relations,
    compareCells,
    compareDimensions,
    compareMdx,
    steContent,
    sectionSources,
    contentPath: `src/content/protocols/${slug}/`,
  };
}
