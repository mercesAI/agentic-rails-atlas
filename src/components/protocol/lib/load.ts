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

/*
 * Typed wrappers: content.ts `getFlow`, `getStateMachine` and `getDiagramMeta`
 * share one generic helper whose return type is the union of all three
 * collections (noted in docs/integration-notes/template.md).
 */
export const flowById = async (id: string) => ((await getFlow(id)) as Flow | null) ?? null;
export const machineById = async (id: string) => ((await getStateMachine(id)) as StateMachine | null) ?? null;
export const diagramMetaById = async (id: string) => ((await getDiagramMeta(id)) as DiagramMeta | null) ?? null;

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

/**
 * An id listed in `meta.diagrams` (or `trustBoundaryDiagram`): a hand-written
 * diagram (DiagramMeta), or, when no DiagramMeta exists, a flow or state
 * machine of that id whose generated Mermaid is shown instead.
 */
export interface ResolvedDiagram {
  id: string;
  kind: 'diagram' | 'flow' | 'state' | 'missing';
  meta: DiagramMeta | null;
  flow?: Flow;
  machine?: StateMachine;
}

const MERMAID_INDEX = import.meta.glob<{ diagrams?: { id: string; description?: string }[] }>(
  '/src/generated/mermaid/index.json',
  { eager: true, import: 'default' },
);

/** Accessible description written by scripts/flow-to-mermaid.ts, when present. */
export function generatedDescription(id: string): string | undefined {
  const idx = Object.values(MERMAID_INDEX)[0];
  return idx?.diagrams?.find((d) => d.id === id)?.description || undefined;
}

export async function resolveDiagram(id: string): Promise<ResolvedDiagram> {
  const meta = await safe(() => diagramMetaById(id), null);
  if (meta) return { id, kind: 'diagram', meta };
  const flow = await safe(() => flowById(id), null);
  if (flow) return { id, kind: 'flow', meta: null, flow };
  const machine = await safe(() => machineById(id), null);
  if (machine) return { id, kind: 'state', meta: null, machine };
  return { id, kind: 'missing', meta: null };
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
  diagrams: ResolvedDiagram[];
  trustDiagram: (ResolvedDiagram & { inSectionC: boolean }) | null;
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
  const flow = await safe(() => flowById(meta.mainFlow), null);
  const machine = await safe(() => machineById(meta.stateMachine), null);
  const diagrams = await Promise.all(meta.diagrams.map((id) => resolveDiagram(id)));
  const trustId = sidecars.security?.trustBoundaryDiagram;
  const trustDiagram = trustId
    ? {
        ...(await resolveDiagram(trustId)),
        inSectionC: meta.diagrams.includes(trustId) || trustId === meta.mainFlow || trustId === meta.stateMachine,
      }
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
      ...diagrams.flatMap((d) => d.meta?.sources ?? d.flow?.sources ?? d.machine?.sources ?? []),
    ]).filter((id) => id.startsWith('src-')),
    // The STE text is a rewrite of section B and rarely carries its own markers; fall back to B's sources.
    'd-ste': (() => {
      const own = expand(scanCiteIds(loaded.ste?.body));
      return own.length ? own : expand(citeIdsIn(bodySplit.before));
    })(),
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
