/**
 * File-system loaders for src/content used by the build scripts. They mirror
 * src/content.config.ts with plain Zod parsing (no astro:* imports) and never
 * throw on missing files: a missing file is reported as absent.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { z } from 'zod';
import {
  ClaimsFile,
  CodeFile,
  ComplianceFile,
  ControlsFile,
  DiagramMeta,
  EcosystemFile,
  FactsFile,
  FaqFile,
  FlashcardsFile,
  Flow,
  GlossaryTerm,
  ObservabilityFile,
  OpenQuestionsFile,
  OrbitMeta,
  Persona,
  PersonasFile,
  ProtocolMeta,
  Publication,
  QuizFile,
  Relation,
  ResourcesFile,
  ScenarioMeta,
  SecurityFile,
  Source,
  StateMachine,
  TimelineEvent,
  TimelineFile,
  CompareFile,
  ControlsMapFile,
} from '../../src/lib/schemas.ts';
import { JsonReadError, listDir, readJson, zodMessage } from './io.ts';

/** Per-protocol JSON sidecars that the page template renders, keyed by file stem. */
export const PAGE_SIDECARS = {
  claims: ClaimsFile,
  facts: FactsFile,
  personas: PersonasFile,
  resources: ResourcesFile,
  security: SecurityFile,
  controls: ControlsFile,
  compliance: ComplianceFile,
  observability: ObservabilityFile,
  ecosystem: EcosystemFile,
  timeline: TimelineFile,
  code: CodeFile,
  faq: FaqFile,
  'open-questions': OpenQuestionsFile,
  quiz: QuizFile,
  flashcards: FlashcardsFile,
} as const;
export type PageSidecarName = keyof typeof PAGE_SIDECARS;
export const PAGE_SIDECAR_NAMES = Object.keys(PAGE_SIDECARS) as PageSidecarName[];

/** Writer inputs to merge-content.ts (validated here so writers see errors early). */
export const MERGE_SIDECARS = {
  sources: z.array(Source),
  'compare-cells': z.object({
    cells: z.array(z.unknown()).optional(),
    radar: z.array(z.unknown()).optional(),
    controlsCells: z.array(z.unknown()).optional(),
  }),
  'publication-tags': z.array(z.object({ id: z.string(), whyItMatters: z.string().optional() })),
  'glossary-additions': z.array(GlossaryTerm),
  relations: z.array(Relation),
} as const;

export const SteMeta = z.object({ protocol: ProtocolMeta.shape.slug, title: z.string(), lastVerified: z.string() });

export interface Loaded<T> {
  path: string;
  exists: boolean;
  data?: T;
  error?: string;
}

export function loadJson<S extends z.ZodTypeAny>(path: string, schema: S): Loaded<z.infer<S>> {
  let raw: unknown;
  try {
    raw = readJson(path);
  } catch (err) {
    return { path, exists: true, error: err instanceof JsonReadError ? `invalid JSON: ${err.message}` : String(err) };
  }
  if (raw === undefined) return { path, exists: false };
  const r = schema.safeParse(raw);
  return r.success ? { path, exists: true, data: r.data } : { path, exists: true, error: zodMessage(r.error) };
}

export interface MdxFile<T> extends Loaded<T> {
  body: string;
  /** 1-based line of the first body line in the file. */
  bodyLine: number;
}

export function loadMdx<S extends z.ZodTypeAny>(path: string, schema: S): MdxFile<z.infer<S>> {
  if (!existsSync(path)) return { path, exists: false, body: '', bodyLine: 1 };
  const text = readFileSync(path, 'utf8');
  let fm: Record<string, unknown> = {};
  let body = text;
  let bodyLine = 1;
  try {
    const parsed = parseFrontmatter(text, { frontmatter: 'empty-with-lines' });
    fm = parsed.frontmatter;
    body = parsed.content;
    bodyLine = 1;
  } catch (err) {
    return { path, exists: true, body: text, bodyLine: 1, error: `frontmatter: ${err instanceof Error ? err.message : String(err)}` };
  }
  const r = schema.safeParse(fm);
  return r.success
    ? { path, exists: true, data: r.data, body, bodyLine }
    : { path, exists: true, body, bodyLine, error: zodMessage(r.error) };
}

export interface ProtocolBundle {
  slug: string;
  dir: string;
  exists: boolean;
  index: MdxFile<z.infer<typeof ProtocolMeta>>;
  ste: MdxFile<z.infer<typeof SteMeta>>;
  sidecars: { [K in PageSidecarName]: Loaded<z.infer<(typeof PAGE_SIDECARS)[K]>> };
  mergeInputs: { [K in keyof typeof MERGE_SIDECARS]: Loaded<z.infer<(typeof MERGE_SIDECARS)[K]>> };
}

export function loadProtocol(contentDir: string, slug: string): ProtocolBundle {
  const dir = join(contentDir, 'protocols', slug);
  const sidecars = {} as ProtocolBundle['sidecars'];
  for (const name of PAGE_SIDECAR_NAMES) {
    (sidecars as Record<string, Loaded<unknown>>)[name] = loadJson(join(dir, `${name}.json`), PAGE_SIDECARS[name]);
  }
  const mergeInputs = {} as ProtocolBundle['mergeInputs'];
  for (const name of Object.keys(MERGE_SIDECARS) as (keyof typeof MERGE_SIDECARS)[]) {
    (mergeInputs as Record<string, Loaded<unknown>>)[name] = loadJson(join(dir, `${name}.json`), MERGE_SIDECARS[name]);
  }
  return {
    slug,
    dir,
    exists: listDir(dir).length > 0,
    index: loadMdx(join(dir, 'index.mdx'), ProtocolMeta),
    ste: loadMdx(join(dir, 'ste.mdx'), SteMeta),
    sidecars,
    mergeInputs,
  };
}

/** Loads every file of a folder collection (JSON or MDX). */
export function loadFolder<S extends z.ZodTypeAny>(dir: string, ext: '.json' | '.mdx', schema: S, skip?: RegExp): Loaded<z.infer<S>>[] | MdxFile<z.infer<S>>[] {
  const files = listDir(dir).filter((f) => f.endsWith(ext) && !(skip && skip.test(f)));
  return ext === '.json' ? files.map((f) => loadJson(join(dir, f), schema)) : files.map((f) => loadMdx(join(dir, f), schema));
}

export interface GlobalContent {
  flows: Loaded<z.infer<typeof Flow>>[];
  states: Loaded<z.infer<typeof StateMachine>>[];
  diagrams: Loaded<z.infer<typeof DiagramMeta>>[];
  personas: Loaded<z.infer<typeof Persona>>[];
  scenarios: MdxFile<z.infer<typeof ScenarioMeta>>[];
  orbit: MdxFile<z.infer<typeof OrbitMeta>>[];
  sources: Loaded<z.infer<typeof Source>[]>;
  publications: Loaded<z.infer<typeof Publication>[]>;
  glossary: Loaded<(z.infer<typeof GlossaryTerm> & { stub?: boolean })[]>;
  relations: Loaded<z.infer<typeof Relation>[]>;
  timelineGlobal: Loaded<z.infer<typeof TimelineEvent>[]>;
  compare: Loaded<z.infer<typeof CompareFile>>;
  controlsMap: Loaded<z.infer<typeof ControlsMapFile>>;
}

export function loadGlobal(contentDir: string): GlobalContent {
  return {
    flows: loadFolder(join(contentDir, 'flows'), '.json', Flow) as Loaded<z.infer<typeof Flow>>[],
    states: loadFolder(join(contentDir, 'states'), '.json', StateMachine) as Loaded<z.infer<typeof StateMachine>>[],
    diagrams: loadFolder(join(contentDir, 'diagrams'), '.json', DiagramMeta) as Loaded<z.infer<typeof DiagramMeta>>[],
    personas: loadFolder(join(contentDir, 'personas'), '.json', Persona) as Loaded<z.infer<typeof Persona>>[],
    scenarios: loadFolder(join(contentDir, 'scenarios'), '.mdx', ScenarioMeta) as MdxFile<z.infer<typeof ScenarioMeta>>[],
    orbit: loadFolder(join(contentDir, 'orbit'), '.mdx', OrbitMeta) as MdxFile<z.infer<typeof OrbitMeta>>[],
    sources: loadJson(join(contentDir, 'sources', 'sources.json'), z.array(Source)),
    publications: loadJson(join(contentDir, 'publications', 'publications.json'), z.array(Publication)),
    glossary: loadJson(
      join(contentDir, 'glossary', 'terms.json'),
      z.array(GlossaryTerm.extend({ stub: z.boolean().optional() })),
    ),
    relations: loadJson(join(contentDir, 'relations.json'), z.array(Relation)),
    timelineGlobal: loadJson(join(contentDir, 'timeline-global.json'), z.array(TimelineEvent)),
    compare: loadJson(join(contentDir, 'compare.json'), CompareFile),
    controlsMap: loadJson(join(contentDir, 'controls-map.json'), ControlsMapFile),
  };
}

// ---------------------------------------------------------------------------
// MDX text helpers
// ---------------------------------------------------------------------------

export interface ModeBlock {
  modes: string[];
  inner: string;
  start: number;
  end: number;
}

/** Finds top-level <Mode ...>...</Mode> blocks (nesting of Mode inside Mode is not supported). */
export function findModeBlocks(body: string): ModeBlock[] {
  const out: ModeBlock[] = [];
  const re = /<Mode\b([^>]*)>([\s\S]*?)<\/Mode>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) {
    const attrs = m[1] ?? '';
    const modes = ['eli5', 'spec', 'practitioner', 'ste'].filter((k) =>
      new RegExp(`(^|\\s)${k}(\\s|=\\{?\\s*true|$|/)`).test(attrs),
    );
    out.push({ modes, inner: m[2] ?? '', start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/** Body text with every <Mode> block removed (the practitioner text). */
export function outsideModeBlocks(body: string): string {
  let out = '';
  let last = 0;
  for (const b of findModeBlocks(body)) {
    out += body.slice(last, b.start);
    // Keep line count stable for line reporting.
    out += '\n'.repeat((body.slice(b.start, b.end).match(/\n/g) ?? []).length);
    last = b.end;
  }
  return out + body.slice(last);
}

/** Converts MDX to plain prose: drops imports, code fences, JSX tags, HTML comments and Markdown syntax. */
export function mdxToPlainText(mdx: string): string {
  return mdx
    .replace(/^(import|export)\s.*$/gm, '')
    .replace(/```[\s\S]*?```/g, (m) => '\n'.repeat((m.match(/\n/g) ?? []).length))
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[A-Za-z][^>]*\/>/g, ' ')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*\|.*\|\s*$/gm, (m) => m.replace(/[|:-]+/g, ' '))
    .replace(/[*_~]{1,3}/g, '');
}

export function countWords(text: string): number {
  const words = text.match(/[\p{L}\p{N}][\p{L}\p{N}'’.\-/]*/gu);
  return words ? words.length : 0;
}

/** Finds `<Cite ids="...">` markers and returns the ids. */
export function citeIds(mdx: string): string[] {
  const ids: string[] = [];
  for (const m of mdx.matchAll(/<Cite\s+[^>]*ids=["'{]+([^"'}]+)["'}]+/g)) ids.push(...(m[1] ?? '').split(/[\s,]+/).filter(Boolean));
  return ids;
}
