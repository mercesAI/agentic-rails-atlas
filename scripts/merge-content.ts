/**
 * merge-content.ts (ARCHITECTURE.md §13). Assembles the shared content files
 * from research outputs and per-protocol writer sidecars so that no two agents
 * edit one shared file. Idempotent and deterministic: the merged files are
 * rebuilt from their inputs on every run and written only when bytes change.
 *
 * Inputs (all optional; missing files and folders are fine):
 *   research/protocols/<slug>.sources.json, research/orbit.*.sources.json,
 *   research/orbit.*.json, research/ste.sources.json, research/policy.json,
 *   research/market.json, research/fees.json, research/prehistory.json,
 *   research/glossary.draft.json, research/publications.*.json,
 *   src/content/protocols/<slug>/{sources,compare-cells,publication-tags,
 *   glossary-additions,relations}.json, src/content/scenarios/*.sources.json
 *
 * Outputs (each validated with the Zod schemas; a schema error exits 1):
 *   src/content/sources/sources.json, src/generated/source-aliases.json,
 *   src/content/publications/publications.json, src/content/glossary/terms.json,
 *   src/content/relations.json, src/content/timeline-global.json,
 *   src/content/compare.json, src/content/controls-map.json,
 *   src/data/manual-metrics.json
 *
 * Invalid input records are skipped with a warning (partial research files
 * must not stop the build). `--strict` turns input warnings into a failure.
 */
import { join } from 'node:path';
import { z } from 'zod';
import {
  CompareCell,
  CompareFile,
  ControlCell,
  ControlsMapFile,
  GlossaryTerm,
  ManualMetricsFile,
  Metric,
  PROTOCOL_SLUGS,
  ProtocolSlug,
  Publication,
  RADAR_AXES,
  Relation,
  Source,
  TimelineEvent,
} from '../src/lib/schemas.ts';
import {
  JsonReadError,
  ROOT,
  canonicalJson,
  isMain,
  listDir,
  normalizeUrl,
  parseArgs,
  readJson,
  rel,
  writeJsonIfChanged,
  zodMessage,
} from './lib/io.ts';
import { protocolName } from './lib/protocols.ts';

type SourceT = z.infer<typeof Source>;
type PublicationT = z.infer<typeof Publication>;
type GlossaryTermT = z.infer<typeof GlossaryTerm> & { stub?: boolean };
type RelationT = z.infer<typeof Relation>;
type TimelineEventT = z.infer<typeof TimelineEvent>;
type CompareFileT = z.infer<typeof CompareFile>;
type ControlsMapFileT = z.infer<typeof ControlsMapFile>;
type ManualMetricsT = z.infer<typeof ManualMetricsFile>;
type ManualMetricT = ManualMetricsT['metrics'][number];

export interface MergeOptions {
  root?: string;
  strict?: boolean;
  quiet?: boolean;
  /** Validate and report without writing files. */
  dryRun?: boolean;
}

export interface MergeSummary {
  sources: number;
  sourceAliases: number;
  publications: number;
  publicationsSkipped: number;
  glossaryTerms: number;
  glossaryStubs: number;
  relations: number;
  timelineEvents: number;
  compareCells: number;
  radar: number;
  controlCells: number;
  manualMetrics: number;
  /** Research source records replaced by a scenario or protocol sidecar (the designed precedence, so not a warning). */
  sidecarOverrides: number;
  protocolFolders: string[];
  changed: string[];
  warnings: string[];
  errors: string[];
}

const RadarEntry = CompareFile.shape.radar.element;

const CompareCellsSidecar = z.object({
  cells: z.array(z.unknown()).optional(),
  radar: z.array(z.unknown()).optional(),
  controlsCells: z.array(z.unknown()).optional(),
});

const PublicationTag = z.object({ id: z.string(), whyItMatters: z.string().optional() });

/** Lane used for research timeline events that do not name one. */
const DEFAULT_LANES: Record<string, string> = {
  policy: 'Policy',
  market: 'Market',
  prehistory: 'Prehistory',
  fees: 'Market',
  orbit: 'Standards',
};

export function mergeContent(options: MergeOptions = {}): MergeSummary {
  const root = options.root ?? ROOT;
  const research = join(root, 'research');
  const content = join(root, 'src', 'content');
  const warnings: string[] = [];
  const errors: string[] = [];
  const changed: string[] = [];
  const warn = (msg: string): void => {
    warnings.push(msg);
  };

  /** Reads a JSON input; parse errors become warnings and return undefined. */
  const readInput = <T = unknown>(path: string): T | undefined => {
    try {
      return readJson<T>(path);
    } catch (err) {
      warn(err instanceof JsonReadError ? `unreadable JSON, skipped: ${rel(root, err.path)}: ${err.message}` : String(err));
      return undefined;
    }
  };

  /** Pulls an array out of a file that is either an array or an object with one of the keys. */
  const arrayFrom = (data: unknown, keys: string[]): unknown[] => {
    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object') {
      for (const k of keys) {
        const v = (data as Record<string, unknown>)[k];
        if (Array.isArray(v)) return v;
      }
    }
    return [];
  };

  const parseEach = <S extends z.ZodType>(schema: S, items: unknown[], where: string, label: string): z.infer<S>[] => {
    const out: z.infer<S>[] = [];
    items.forEach((item, i) => {
      const r = schema.safeParse(item);
      if (r.success) out.push(r.data as z.infer<S>);
      else {
        const id = item && typeof item === 'object' && 'id' in item ? ` ${String((item as { id: unknown }).id)}` : '';
        warn(`${where}: ${label}[${i}]${id} skipped: ${zodMessage(r.error)}`);
      }
    });
    return out;
  };

  const researchFiles = listDir(research).filter((f) => f.endsWith('.json'));
  const protocolDirs = listDir(join(content, 'protocols')).filter((d) => (PROTOCOL_SLUGS as readonly string[]).includes(d));
  const unknownDirs = listDir(join(content, 'protocols')).filter(
    (d) => !(PROTOCOL_SLUGS as readonly string[]).includes(d) && !d.startsWith('.'),
  );
  for (const d of unknownDirs) warn(`src/content/protocols/${d} is not one of the eight protocol slugs; ignored`);
  const sidecar = (slug: string, name: string): string => join(content, 'protocols', slug, name);

  // -------------------------------------------------------------------------
  // Sources: research first (alphabetical), then scenario and protocol sidecars,
  // which win on id conflicts.
  // -------------------------------------------------------------------------
  const sources = new Map<string, { source: SourceT; origin: string }>();
  let sidecarOverrides = 0;
  const addSources = (items: unknown[], origin: string, wins: boolean): void => {
    for (const s of parseEach(Source, items, origin, 'sources')) {
      const prev = sources.get(s.id);
      if (prev) {
        if (canonicalJson(prev.source) !== canonicalJson(s)) {
          if (wins) {
            if (prev.origin.startsWith('research/')) sidecarOverrides++;
            else warn(`source ${s.id}: ${origin} overrides the record from ${prev.origin}`);
            sources.set(s.id, { source: s, origin });
          } else {
            warn(`source ${s.id}: conflicting record in ${origin}; kept the one from ${prev.origin}`);
          }
        }
        continue;
      }
      sources.set(s.id, { source: s, origin });
    }
  };

  const researchSourceFiles: string[] = [];
  for (const f of listDir(join(research, 'protocols')).filter((f) => f.endsWith('.sources.json'))) {
    researchSourceFiles.push(join(research, 'protocols', f));
  }
  for (const f of researchFiles) {
    if (
      /^orbit\..+\.json$/.test(f) ||
      f === 'ste.sources.json' ||
      /^(policy|market|fees|prehistory|glossary\.draft)(\..+)?\.json$/.test(f) ||
      /\.sources\.json$/.test(f)
    ) {
      researchSourceFiles.push(join(research, f));
    }
  }
  for (const path of [...new Set(researchSourceFiles)].sort()) {
    const data = readInput(path);
    if (data === undefined) continue;
    // A top-level array is a Source[] only in *.sources.json files; other files
    // (for example orbit.b.timeline.json) carry sources under a `sources` key.
    const items = path.endsWith('.sources.json') ? arrayFrom(data, ['sources']) : Array.isArray(data) ? [] : arrayFrom(data, ['sources']);
    addSources(items, rel(root, path), false);
  }
  for (const f of listDir(join(content, 'scenarios')).filter((f) => f.endsWith('.sources.json'))) {
    const path = join(content, 'scenarios', f);
    const data = readInput(path);
    if (data !== undefined) addSources(arrayFrom(data, ['sources']), rel(root, path), true);
  }
  for (const slug of protocolDirs) {
    const path = sidecar(slug, 'sources.json');
    const data = readInput(path);
    if (data !== undefined) addSources(arrayFrom(data, ['sources']), rel(root, path), true);
  }

  // URL duplicates: every record stays (claims may cite either id); later ids
  // are recorded as aliases of the first id in sorted order.
  const sortedSources = [...sources.values()].map((v) => v.source).sort((a, b) => a.id.localeCompare(b.id));
  const byUrl = new Map<string, string>();
  const aliases: Record<string, string> = {};
  for (const s of sortedSources) {
    const key = normalizeUrl(s.url);
    const first = byUrl.get(key);
    if (first) aliases[s.id] = first;
    else byUrl.set(key, s.id);
  }

  // -------------------------------------------------------------------------
  // Publications: verified entries from research/publications.*.json, then tags.
  // -------------------------------------------------------------------------
  const normDoi = (d?: string): string | undefined =>
    d ? d.trim().toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, '').replace(/^doi:/, '') : undefined;
  const normArxiv = (a?: string): string | undefined =>
    a ? a.trim().toLowerCase().replace(/^arxiv:/, '').replace(/^https?:\/\/arxiv\.org\/abs\//, '').replace(/v\d+$/, '') : undefined;

  const publications: PublicationT[] = [];
  const pubIds = new Set<string>();
  const pubArxiv = new Map<string, string>();
  const pubDoi = new Map<string, string>();
  let publicationsSkipped = 0;
  for (const f of researchFiles.filter((f) => /^publications\..+\.json$/.test(f))) {
    const path = join(research, f);
    const data = readInput(path);
    if (data === undefined) continue;
    const items = arrayFrom(data, ['entries', 'publications']);
    items.forEach((item, i) => {
      const r = Publication.safeParse(item);
      if (!r.success) {
        publicationsSkipped++;
        warn(`${rel(root, path)}: publication[${i}] not merged (not verified or invalid): ${zodMessage(r.error)}`);
        return;
      }
      const p = r.data;
      const ax = normArxiv(p.arxiv);
      const doi = normDoi(p.doi);
      const dupOf = pubIds.has(p.id) ? p.id : (ax && pubArxiv.get(ax)) || (doi && pubDoi.get(doi)) || undefined;
      if (dupOf) {
        publicationsSkipped++;
        if (dupOf !== p.id || JSON.stringify(publications.find((x) => x.id === p.id)) !== JSON.stringify(p)) {
          warn(`${rel(root, path)}: publication ${p.id} duplicates ${dupOf}; first entry kept`);
        }
        return;
      }
      publications.push(p);
      pubIds.add(p.id);
      if (ax) pubArxiv.set(ax, p.id);
      if (doi) pubDoi.set(doi, p.id);
    });
  }
  const pubById = new Map(publications.map((p) => [p.id, p]));
  for (const slug of protocolDirs) {
    const path = sidecar(slug, 'publication-tags.json');
    const data = readInput(path);
    if (data === undefined) continue;
    const name = protocolName(content, slug);
    for (const tag of parseEach(PublicationTag, arrayFrom(data, ['tags', 'publications']), rel(root, path), 'tags')) {
      const p = pubById.get(tag.id);
      if (!p) {
        warn(`${rel(root, path)}: publication ${tag.id} is not in the verified publications; tag ignored`);
        continue;
      }
      if (!p.protocols.includes(slug)) p.protocols = [...p.protocols, slug];
      if (tag.whyItMatters) {
        const line = `${name}: ${tag.whyItMatters.trim()}`;
        if (!p.whyItMatters.includes(line)) p.whyItMatters = p.whyItMatters ? `${p.whyItMatters} ${line}` : line;
      }
    }
  }
  for (const p of publications) p.protocols = sortProtocols(p.protocols);
  publications.sort((a, b) => a.id.localeCompare(b.id));

  // -------------------------------------------------------------------------
  // Glossary: research/glossary.draft.json, then per-protocol additions.
  // -------------------------------------------------------------------------
  const terms = new Map<string, GlossaryTermT>();
  const termOrigin = new Map<string, string>();
  let glossaryStubs = 0;
  const draftPath = join(research, 'glossary.draft.json');
  const draft = readInput(draftPath);
  if (draft !== undefined) {
    arrayFrom(draft, ['terms', 'entries']).forEach((item, i) => {
      const isStub = !!item && typeof item === 'object' && (item as { stub?: unknown }).stub === true;
      const r = GlossaryTerm.safeParse(item);
      if (!r.success) {
        if (!isStub) warn(`research/glossary.draft.json: term[${i}] skipped: ${zodMessage(r.error)}`);
        else glossaryStubs++;
        return;
      }
      if (terms.has(r.data.id)) {
        warn(`research/glossary.draft.json: duplicate term id ${r.data.id}; first kept`);
        return;
      }
      terms.set(r.data.id, isStub ? { ...r.data, stub: true } : r.data);
      termOrigin.set(r.data.id, rel(root, draftPath));
    });
  }
  /** The definition without the fields that are merged (protocols) or derived (stub), for conflict detection. */
  const definition = ({ protocols: _protocols, stub: _stub, ...rest }: GlossaryTermT): string => canonicalJson(rest);
  for (const slug of protocolDirs) {
    const path = sidecar(slug, 'glossary-additions.json');
    const data = readInput(path);
    if (data === undefined) continue;
    const where = rel(root, path);
    for (const t of parseEach(GlossaryTerm, arrayFrom(data, ['terms']), where, 'terms')) {
      const prev = terms.get(t.id);
      if (prev) {
        const protos = new Set([...prev.protocols, ...t.protocols, slug]);
        if (prev.stub) {
          // A full definition from a writer replaces a stub.
          terms.set(t.id, { ...t, protocols: [...protos] });
          termOrigin.set(t.id, where);
        } else {
          // The first full definition wins; a different one from a writer is reported, not merged silently.
          prev.protocols = [...protos];
          if (definition(prev) !== definition(t)) {
            warn(`glossary term ${t.id}: conflicting definition in ${where}; kept the one from ${termOrigin.get(t.id) ?? 'an earlier file'}`);
          }
        }
      } else {
        terms.set(t.id, { ...t, protocols: [...new Set([...t.protocols, slug])] });
        termOrigin.set(t.id, where);
      }
    }
  }
  const glossary = [...terms.values()]
    .map((t) => ({ ...t, protocols: sortProtocols(t.protocols) }))
    .sort((a, b) => a.id.localeCompare(b.id));

  // -------------------------------------------------------------------------
  // Relations: union by (from, to, type).
  // -------------------------------------------------------------------------
  const relations = new Map<string, RelationT>();
  for (const slug of protocolDirs) {
    const path = sidecar(slug, 'relations.json');
    const data = readInput(path);
    if (data === undefined) continue;
    for (const r of parseEach(Relation, arrayFrom(data, ['relations']), rel(root, path), 'relations')) {
      const key = `${r.from}|${r.to}|${r.type}`;
      if (!relations.has(key)) relations.set(key, r);
    }
  }
  const relationList = [...relations.values()].sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || a.type.localeCompare(b.type),
  );

  // -------------------------------------------------------------------------
  // Global timeline: policy, market, prehistory, fees and orbit research files.
  // -------------------------------------------------------------------------
  const events = new Map<string, TimelineEventT>();
  for (const f of researchFiles) {
    const m = /^(policy|market|prehistory|fees|orbit)(\..+)?\.json$/.exec(f);
    if (!m?.[1] || f.endsWith('.sources.json')) continue;
    const path = join(research, f);
    const data = readInput(path);
    if (data === undefined) continue;
    const lane = DEFAULT_LANES[m[1]] ?? 'Standards';
    // A top-level array is a timeline only when the file name says so.
    const raw = Array.isArray(data) ? (/timeline|events/.test(f) ? data : []) : arrayFrom(data, ['timeline', 'events']);
    const items = raw.map((e) =>
      e && typeof e === 'object' && !('lane' in e) ? { ...e, lane } : e,
    );
    for (const e of parseEach(TimelineEvent, items, rel(root, path), 'timeline')) {
      const key = `${e.date}|${e.lane}|${e.title.toLowerCase()}`;
      if (!events.has(key)) events.set(key, e);
    }
  }
  const timeline = [...events.values()].sort(
    (a, b) => a.date.localeCompare(b.date) || a.lane.localeCompare(b.lane) || a.title.localeCompare(b.title),
  );

  // -------------------------------------------------------------------------
  // Compare matrix and controls map: replace the rows of protocols with a sidecar.
  // -------------------------------------------------------------------------
  const comparePath = join(content, 'compare.json');
  const controlsPath = join(content, 'controls-map.json');
  let compare: CompareFileT | undefined;
  let controlsMap: ControlsMapFileT | undefined;
  try {
    const raw = readJson(comparePath);
    if (raw !== undefined) {
      const r = CompareFile.safeParse(raw);
      if (r.success) compare = r.data;
      else errors.push(`src/content/compare.json is invalid: ${zodMessage(r.error)}`);
    }
  } catch (err) {
    errors.push(String(err instanceof Error ? err.message : err));
  }
  try {
    const raw = readJson(controlsPath);
    if (raw !== undefined) {
      const r = ControlsMapFile.safeParse(raw);
      if (r.success) controlsMap = r.data;
      else errors.push(`src/content/controls-map.json is invalid: ${zodMessage(r.error)}`);
    }
  } catch (err) {
    errors.push(String(err instanceof Error ? err.message : err));
  }
  const dimensionIds = new Set(compare?.dimensions.map((d) => d.id) ?? []);
  const dimensionOrder = new Map(compare?.dimensions.map((d, i) => [d.id, i]) ?? []);
  const controlOrder = new Map(controlsMap?.controls.map((c, i) => [c.id, i]) ?? []);
  for (const slug of protocolDirs) {
    const path = sidecar(slug, 'compare-cells.json');
    const data = readInput(path);
    if (data === undefined) continue;
    const where = rel(root, path);
    const shape = CompareCellsSidecar.safeParse(data);
    if (!shape.success) {
      warn(`${where}: skipped: ${zodMessage(shape.error)}`);
      continue;
    }
    const forSlug = <T extends { protocol: string }>(items: T[], label: string): T[] =>
      items.filter((c) => {
        if (c.protocol === slug) return true;
        warn(`${where}: ${label} for protocol ${c.protocol} ignored (folder is ${slug})`);
        return false;
      });
    if (compare && shape.data.cells) {
      const cells = forSlug(parseEach(CompareCell, shape.data.cells, where, 'cells'), 'cell').filter((c) => {
        if (dimensionIds.has(c.dimension)) return true;
        warn(`${where}: unknown dimension ${c.dimension}; cell ignored`);
        return false;
      });
      const seen = new Set<string>();
      const unique = cells.filter((c) => (seen.has(c.dimension) ? false : (seen.add(c.dimension), true)));
      compare.cells = [...compare.cells.filter((c) => c.protocol !== slug), ...unique];
      const missing = [...dimensionIds].filter((d) => !seen.has(d));
      if (missing.length) warn(`${where}: ${missing.length} of ${dimensionIds.size} compare dimensions have no cell`);
    }
    if (compare && shape.data.radar) {
      const radar = forSlug(parseEach(RadarEntry, shape.data.radar, where, 'radar'), 'radar entry');
      const seen = new Set<string>();
      compare.radar = [
        ...compare.radar.filter((r) => r.protocol !== slug),
        ...radar.filter((r) => (seen.has(r.axis) ? false : (seen.add(r.axis), true))),
      ];
    }
    if (controlsMap && shape.data.controlsCells) {
      const cells = forSlug(parseEach(ControlCell, shape.data.controlsCells, where, 'controlsCells'), 'control cell');
      const seen = new Set<string>();
      controlsMap.cells = [
        ...controlsMap.cells.filter((c) => c.protocol !== slug),
        ...cells.filter((c) => (seen.has(c.control) ? false : (seen.add(c.control), true))),
      ];
    }
  }
  const protoIdx = (p: string): number => (PROTOCOL_SLUGS as readonly string[]).indexOf(p);
  if (compare) {
    compare.cells.sort(
      (a, b) => protoIdx(a.protocol) - protoIdx(b.protocol) || (dimensionOrder.get(a.dimension) ?? 999) - (dimensionOrder.get(b.dimension) ?? 999),
    );
    compare.radar.sort(
      (a, b) => protoIdx(a.protocol) - protoIdx(b.protocol) || RADAR_AXES.indexOf(a.axis) - RADAR_AXES.indexOf(b.axis),
    );
  }
  if (controlsMap) {
    controlsMap.cells.sort(
      (a, b) => protoIdx(a.protocol) - protoIdx(b.protocol) || (controlOrder.get(a.control) ?? 999) - (controlOrder.get(b.control) ?? 999),
    );
  }

  // -------------------------------------------------------------------------
  // Manual metrics: hand-recorded entries stay; research/market.json metrics
  // are added or replace entries with the same id.
  // -------------------------------------------------------------------------
  const metricsPath = join(root, 'src', 'data', 'manual-metrics.json');
  let manual: ManualMetricsT = { generatedAt: '1970-01-01', metrics: [] };
  try {
    const raw = readJson(metricsPath);
    if (raw !== undefined) {
      const r = ManualMetricsFile.safeParse(raw);
      if (r.success) manual = r.data;
      else errors.push(`src/data/manual-metrics.json is invalid: ${zodMessage(r.error)}`);
    }
  } catch (err) {
    errors.push(String(err instanceof Error ? err.message : err));
  }
  const ManualMetric = Metric.extend({ protocol: z.union([ProtocolSlug, z.literal('market')]) });
  const marketPath = join(research, 'market.json');
  const market = readInput<{ generatedAt?: string }>(marketPath);
  if (market !== undefined) {
    const items = arrayFrom(market, ['metrics']).map((m) =>
      m && typeof m === 'object' && !('protocol' in m) ? { ...m, protocol: 'market' } : m,
    );
    const metrics = parseEach(ManualMetric, items, 'research/market.json', 'metrics') as ManualMetricT[];
    const byId = new Map(manual.metrics.map((m) => [m.id, m]));
    for (const m of metrics) byId.set(m.id, m);
    const next = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
    if (JSON.stringify(next) !== JSON.stringify(manual.metrics)) {
      manual = {
        generatedAt:
          typeof market.generatedAt === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(market.generatedAt) && market.generatedAt > manual.generatedAt
            ? market.generatedAt
            : manual.generatedAt,
        metrics: next,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Validate every output, then write.
  // -------------------------------------------------------------------------
  const outputs: { path: string; schema: z.ZodType; value: unknown }[] = [
    { path: join(content, 'sources', 'sources.json'), schema: z.array(Source), value: sortedSources },
    { path: join(root, 'src', 'generated', 'source-aliases.json'), schema: z.record(z.string(), z.string()), value: aliases },
    { path: join(content, 'publications', 'publications.json'), schema: z.array(Publication), value: publications },
    {
      path: join(content, 'glossary', 'terms.json'),
      schema: z.array(GlossaryTerm.extend({ stub: z.boolean().optional() })),
      value: glossary,
    },
    { path: join(content, 'relations.json'), schema: z.array(Relation), value: relationList },
    { path: join(content, 'timeline-global.json'), schema: z.array(TimelineEvent), value: timeline },
    { path: metricsPath, schema: ManualMetricsFile, value: manual },
  ];
  if (compare) outputs.push({ path: comparePath, schema: CompareFile, value: compare });
  if (controlsMap) outputs.push({ path: controlsPath, schema: ControlsMapFile, value: controlsMap });

  for (const o of outputs) {
    const r = o.schema.safeParse(o.value);
    if (!r.success) errors.push(`${rel(root, o.path)} failed validation: ${zodMessage(r.error)}`);
  }
  if (options.strict && warnings.length) errors.push(`--strict: ${warnings.length} input warning(s)`);
  if (!errors.length && !options.dryRun) {
    for (const o of outputs) if (writeJsonIfChanged(o.path, o.value)) changed.push(rel(root, o.path));
  }

  return {
    sources: sortedSources.length,
    sourceAliases: Object.keys(aliases).length,
    publications: publications.length,
    publicationsSkipped,
    glossaryTerms: glossary.filter((t) => !t.stub).length,
    glossaryStubs: glossaryStubs + glossary.filter((t) => t.stub).length,
    relations: relationList.length,
    timelineEvents: timeline.length,
    compareCells: compare?.cells.length ?? 0,
    radar: compare?.radar.length ?? 0,
    controlCells: controlsMap?.cells.length ?? 0,
    manualMetrics: manual.metrics.length,
    sidecarOverrides,
    protocolFolders: protocolDirs,
    changed,
    warnings,
    errors,
  };
}

function sortProtocols(list: string[]): string[] {
  const idx = (p: string): number => {
    const i = (PROTOCOL_SLUGS as readonly string[]).indexOf(p);
    return i === -1 ? 100 : i;
  };
  return [...new Set(list)].sort((a, b) => idx(a) - idx(b) || a.localeCompare(b));
}

function printSummary(s: MergeSummary): void {
  for (const w of s.warnings) console.warn(`warning: ${w}`);
  for (const e of s.errors) console.error(`error: ${e}`);
  console.log('merge-content summary');
  console.log(`  protocol folders: ${s.protocolFolders.length ? s.protocolFolders.join(', ') : 'none'}`);
  console.log(`  sources: ${s.sources} (${s.sourceAliases} URL aliases; ${s.sidecarOverrides} research records updated by sidecars)`);
  console.log(`  publications: ${s.publications} merged, ${s.publicationsSkipped} skipped`);
  console.log(`  glossary terms: ${s.glossaryTerms} full, ${s.glossaryStubs} stubs`);
  console.log(`  relations: ${s.relations}`);
  console.log(`  global timeline events: ${s.timelineEvents}`);
  console.log(`  compare cells: ${s.compareCells}, radar entries: ${s.radar}, control cells: ${s.controlCells}`);
  console.log(`  manual metrics: ${s.manualMetrics}`);
  console.log(`  files changed: ${s.changed.length ? s.changed.join(', ') : 'none'}`);
  console.log(`  warnings: ${s.warnings.length}, errors: ${s.errors.length}`);
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const summary = mergeContent({
    root: args.values.get('root'),
    strict: args.flags.has('strict'),
    dryRun: args.flags.has('dry-run'),
  });
  printSummary(summary);
  process.exit(summary.errors.length ? 1 : 0);
}

