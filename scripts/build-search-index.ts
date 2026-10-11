/**
 * build-search-index.ts (ARCHITECTURE.md §1, §9). Writes
 * src/generated/search-index.json for the command palette: site pages,
 * protocol pages and their sections, glossary terms, resources, publications,
 * scenarios, orbit entries and personas. Works with empty content. The output
 * has no timestamp so an unchanged repository produces identical bytes.
 */
import { join } from 'node:path';
import { PROTOCOL_SLUGS, SECTION_IDS, SECTION_TITLES } from '../src/lib/schemas.ts';
import { ROOT, isMain, parseArgs, rel, writeJsonIfChanged } from './lib/io.ts';
import { loadGlobal, loadProtocol } from './lib/content.ts';
import { FALLBACK_PROTOCOL_NAMES } from './lib/protocols.ts';

export type SearchKind = 'page' | 'protocol' | 'section' | 'term' | 'resource' | 'publication' | 'scenario' | 'orbit' | 'persona';

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  title: string;
  url: string;
  /** Short text shown under the title and searched with a lower weight. */
  text?: string;
  protocol?: string;
  keywords?: string[];
  external?: boolean;
}

export interface SearchIndex {
  version: 1;
  counts: Record<SearchKind, number>;
  entries: SearchEntry[];
}

/** Static routes from ARCHITECTURE.md §4. */
export const STATIC_PAGES: { url: string; title: string; text: string }[] = [
  { url: '/', title: 'Home', text: 'The bubble universe of the eight protocols' },
  { url: '/compare/', title: 'Compare', text: 'Comparison matrix, pick-two diff and radar' },
  { url: '/stack/', title: 'Stack', text: 'Layers of the agentic commerce stack' },
  { url: '/controls/', title: 'Controls', text: 'Controls map across protocols' },
  { url: '/scenarios/', title: 'Scenarios', text: 'End-to-end walkthroughs across protocols' },
  { url: '/timeline/', title: 'Timeline', text: 'Standards, policy, market and prehistory lanes' },
  { url: '/glossary/', title: 'Glossary', text: 'Terms with plain and STE definitions' },
  { url: '/library/', title: 'Library', text: 'Resources and scientific publications' },
  { url: '/personas/', title: 'Personas', text: 'Who builds, uses and governs agent payments' },
  { url: '/orbit/', title: 'Orbit', text: 'Related protocols and standards' },
  { url: '/learn/', title: 'Learn', text: 'Self-tests and flashcards' },
  { url: '/notes/', title: 'My notes', text: 'Notes stored in this browser' },
  { url: '/whats-new/', title: "What's new", text: 'Recent releases and timeline events' },
  { url: '/methodology/', title: 'Methodology', text: 'Sources, confidence levels and coverage' },
];

const clip = (s: string, n = 160): string => {
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};

export function buildSearchIndex(root: string = ROOT): { index: SearchIndex; warnings: string[] } {
  const content = join(root, 'src', 'content');
  const warnings: string[] = [];
  const entries: SearchEntry[] = [];

  for (const p of STATIC_PAGES) entries.push({ id: `page:${p.url}`, kind: 'page', title: p.title, url: p.url, text: p.text });

  for (const slug of PROTOCOL_SLUGS) {
    const b = loadProtocol(content, slug);
    if (!b.exists) continue;
    const meta = b.index.data;
    if (b.index.error) warnings.push(`${rel(root, b.index.path)}: ${b.index.error}`);
    const name = meta?.name ?? FALLBACK_PROTOCOL_NAMES[slug];
    const url = `/p/${slug}/`;
    entries.push({
      id: `protocol:${slug}`,
      kind: 'protocol',
      title: name,
      url,
      text: meta ? clip(meta.tagline) : undefined,
      protocol: slug,
      keywords: meta ? [meta.bubbleLabel, meta.monogram, ...(meta.disambiguation ?? []).map((d) => clip(d, 60))] : [slug],
    });
    SECTION_IDS.forEach((id, i) => {
      const letter = String.fromCharCode(65 + i);
      entries.push({
        id: `section:${slug}:${id}`,
        kind: 'section',
        title: `${name}: ${letter}. ${SECTION_TITLES[id]}`,
        url: `${url}#${id}`,
        protocol: slug,
      });
    });
    const res = b.sidecars.resources;
    if (res.error) warnings.push(`${rel(root, res.path)}: ${res.error}`);
    for (const r of res.data?.resources ?? []) {
      entries.push({
        id: `resource:${r.id}`,
        kind: 'resource',
        title: r.title,
        url: r.url,
        text: clip(`${r.publisher}. ${r.note}`),
        protocol: slug,
        keywords: [r.type, r.badge],
        external: true,
      });
    }
  }

  const g = loadGlobal(content);
  for (const t of g.glossary.data ?? []) {
    if (t.stub) continue;
    entries.push({ id: `term:${t.id}`, kind: 'term', title: t.term, url: `/glossary/#${t.id}`, text: clip(t.plain), keywords: t.aliases });
  }
  for (const p of g.publications.data ?? []) {
    entries.push({
      id: `publication:${p.id}`,
      kind: 'publication',
      title: p.title,
      url: `/library/#${p.id}`,
      text: clip(`${p.authors.slice(0, 3).join(', ')}${p.authors.length > 3 ? ' et al.' : ''} (${p.year}). ${p.summary}`),
      keywords: [...p.themes, ...(p.arxiv ? [p.arxiv] : []), ...(p.doi ? [p.doi] : [])],
    });
  }
  for (const s of g.scenarios) {
    if (!s.data) continue;
    entries.push({ id: `scenario:${s.data.slug}`, kind: 'scenario', title: s.data.title, url: `/scenarios/${s.data.slug}/`, text: clip(s.data.summary) });
  }
  for (const o of g.orbit) {
    if (!o.data) continue;
    entries.push({ id: `orbit:${o.data.slug}`, kind: 'orbit', title: o.data.name, url: `/orbit/${o.data.slug}/`, text: clip(o.data.oneLiner) });
  }
  for (const p of g.personas) {
    if (!p.data) continue;
    entries.push({ id: `persona:${p.data.id}`, kind: 'persona', title: p.data.name, url: `/personas/${p.data.id}/`, text: clip(p.data.oneLine) });
  }
  for (const l of [g.glossary, g.publications]) if (l.error) warnings.push(`${rel(root, l.path)}: ${l.error}`);

  const seen = new Set<string>();
  const unique = entries.filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
  const counts = { page: 0, protocol: 0, section: 0, term: 0, resource: 0, publication: 0, scenario: 0, orbit: 0, persona: 0 } as Record<SearchKind, number>;
  for (const e of unique) counts[e.kind]++;
  return { index: { version: 1, counts, entries: unique }, warnings };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const root = args.values.get('root') ?? ROOT;
  try {
    const { index, warnings } = buildSearchIndex(root);
    for (const w of warnings) console.warn(`warning: ${w}`);
    const out = join(root, 'src', 'generated', 'search-index.json');
    const changed = writeJsonIfChanged(out, index);
    const summary = Object.entries(index.counts)
      .map(([k, v]) => `${k} ${v}`)
      .join(', ');
    console.log(`search index: ${index.entries.length} entries (${summary}); ${changed ? 'written' : 'unchanged'} ${rel(root, out)}`);
  } catch (err) {
    console.error(`build-search-index failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`);
    process.exit(1);
  }
}
