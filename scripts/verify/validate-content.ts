/**
 * validate-content.ts (ARCHITECTURE.md §9). Parses every content file with the
 * same Zod schemas Astro uses and reports the first error per file with its
 * path. Exits non-zero on any error. Missing optional files are not errors
 * (the coverage checker reports gaps).
 */
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { z } from 'zod';
import { ClaimsFile, CoverageWaiversFile, ManualMetricsFile, PROTOCOL_SLUGS, Source } from '../../src/lib/schemas.ts';
import { ROOT, isMain, listDir, parseArgs, rel } from '../lib/io.ts';
import { type Loaded, PAGE_SIDECAR_NAMES, MERGE_SIDECARS, loadGlobal, loadJson, loadProtocol } from '../lib/content.ts';

export interface ValidationResult {
  files: number;
  errors: { file: string; message: string }[];
  warnings: { file: string; message: string }[];
}

export function validateContent(root: string = ROOT): ValidationResult {
  const content = join(root, 'src', 'content');
  const res: ValidationResult = { files: 0, errors: [], warnings: [] };
  const check = (l: Loaded<unknown> | undefined): void => {
    if (!l || !l.exists) return;
    res.files++;
    if (l.error) res.errors.push({ file: rel(root, l.path), message: l.error });
  };
  const err = (path: string, message: string): void => {
    res.errors.push({ file: rel(root, path), message });
  };

  const known = new Set<string>([
    'index.mdx',
    'ste.mdx',
    ...PAGE_SIDECAR_NAMES.map((n) => `${n}.json`),
    ...Object.keys(MERGE_SIDECARS).map((n) => `${n}.json`),
  ]);
  // Ids that src/lib/content.ts merges across files into one map or list.
  const claimFiles: { path: string; ids: string[] }[] = [];
  const resourceFiles: { path: string; ids: string[] }[] = [];
  for (const dir of listDir(join(content, 'protocols'))) {
    if (dir.startsWith('.')) continue;
    if (!(PROTOCOL_SLUGS as readonly string[]).includes(dir)) {
      err(join(content, 'protocols', dir), `folder name is not a protocol slug (${PROTOCOL_SLUGS.join(', ')})`);
      continue;
    }
    const b = loadProtocol(content, dir);
    check(b.index);
    check(b.ste);
    if (b.index.data && b.index.data.slug !== dir) err(b.index.path, `slug "${b.index.data.slug}" does not match folder "${dir}"`);
    if (b.ste.data && b.ste.data.protocol !== dir) err(b.ste.path, `protocol "${b.ste.data.protocol}" does not match folder "${dir}"`);
    for (const name of PAGE_SIDECAR_NAMES) {
      const l = b.sidecars[name];
      check(l);
      const proto = (l.data as { protocol?: string } | undefined)?.protocol;
      if (proto && proto !== dir) err(l.path, `protocol "${proto}" does not match folder "${dir}"`);
    }
    for (const l of Object.values(b.mergeInputs)) check(l);
    claimFiles.push({ path: b.sidecars.claims.path, ids: (b.sidecars.claims.data?.claims ?? []).map((c) => c.id) });
    resourceFiles.push({ path: b.sidecars.resources.path, ids: (b.sidecars.resources.data?.resources ?? []).map((r) => r.id) });
    for (const f of listDir(b.dir)) {
      if (!known.has(f) && !f.startsWith('.')) res.warnings.push({ file: rel(root, join(b.dir, f)), message: 'unexpected file in protocol folder' });
    }
  }

  const g = loadGlobal(content);
  const idMatches = (items: Loaded<{ id: string }>[], what: string): void => {
    for (const l of items) {
      check(l);
      if (l.data && l.data.id !== basename(l.path, '.json')) err(l.path, `${what} id "${l.data.id}" does not match the file name`);
    }
  };
  idMatches(g.flows, 'flow');
  idMatches(g.states, 'state machine');
  idMatches(g.diagrams, 'diagram');
  for (const l of g.diagrams) {
    if (l.data && !existsSync(join(content, 'diagrams', `${l.data.id}.mmd`))) err(l.path, `missing ${l.data.id}.mmd next to the metadata`);
  }
  for (const f of listDir(join(content, 'diagrams')).filter((f) => f.endsWith('.mmd'))) {
    if (!existsSync(join(content, 'diagrams', f.replace(/\.mmd$/, '.json')))) {
      err(join(content, 'diagrams', f), 'missing DiagramMeta JSON next to the .mmd');
    }
  }
  for (const l of g.personas) {
    check(l);
    if (l.data && l.data.id !== basename(l.path, '.json')) err(l.path, `persona id "${l.data.id}" does not match the file name`);
  }
  for (const l of g.scenarios) {
    check(l);
    if (l.data && l.data.slug !== basename(l.path, '.mdx')) err(l.path, `slug "${l.data.slug}" does not match the file name`);
  }
  for (const f of listDir(join(content, 'scenarios'))) {
    if (f.endsWith('.claims.json')) {
      const l = loadJson(join(content, 'scenarios', f), ClaimsFile);
      check(l);
      claimFiles.push({ path: l.path, ids: (l.data?.claims ?? []).map((c) => c.id) });
    }
    if (f.endsWith('.sources.json')) check(loadJson(join(content, 'scenarios', f), z.array(Source)));
  }
  for (const l of g.orbit) {
    check(l);
    if (l.data && l.data.slug !== basename(l.path, '.mdx')) err(l.path, `slug "${l.data.slug}" does not match the file name`);
  }
  for (const l of [g.sources, g.publications, g.glossary, g.relations, g.timelineGlobal, g.compare, g.controlsMap]) check(l);

  // Duplicate ids in the shared registries.
  const dupes = (path: string, ids: string[], what: string): void => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) err(path, `duplicate ${what} id ${id}`);
      seen.add(id);
    }
  };
  dupes(g.sources.path, (g.sources.data ?? []).map((s) => s.id), 'source');
  dupes(g.publications.path, (g.publications.data ?? []).map((p) => p.id), 'publication');
  dupes(g.glossary.path, (g.glossary.data ?? []).map((t) => t.id), 'glossary');

  // Duplicate ids across files: a claim id repeated in two claims files, or a
  // resource id repeated in two resources files, would silently overwrite in the
  // merged maps of src/lib/content.ts.
  const dupesAcross = (files: { path: string; ids: string[] }[], what: string): void => {
    const firstSeen = new Map<string, string>();
    for (const f of files) {
      const local = new Set<string>();
      for (const id of f.ids) {
        const first = firstSeen.get(id);
        if (first && first !== f.path) err(f.path, `duplicate ${what} id ${id} (also in ${rel(root, first)})`);
        else if (local.has(id)) err(f.path, `duplicate ${what} id ${id}`);
        local.add(id);
        if (!first) firstSeen.set(id, f.path);
      }
    }
  };
  dupesAcross(claimFiles, 'claim');
  dupesAcross(resourceFiles, 'resource');

  check(loadJson(join(root, 'src', 'data', 'manual-metrics.json'), ManualMetricsFile));
  check(loadJson(join(root, 'coverage-waivers.json'), CoverageWaiversFile));
  return res;
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const root = args.values.get('root') ?? ROOT;
  const r = validateContent(root);
  for (const w of r.warnings) console.warn(`warning: ${w.file}: ${w.message}`);
  for (const e of r.errors) console.error(`error: ${e.file}: ${e.message}`);
  console.log(`validate-content: ${r.files} files parsed, ${r.errors.length} errors, ${r.warnings.length} warnings`);
  process.exit(r.errors.length ? 1 : 0);
}
