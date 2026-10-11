/**
 * verify-sources.ts (ARCHITECTURE.md §9, ATLAS_PROMPT.md 14.1).
 *   error: a claim cites a source id that is not in src/content/sources/sources.json
 *   error: any `sources` or `disputeSources` array anywhere under src/content
 *          (sidecars, flows, states, diagrams, shared files) or in
 *          src/data/manual-metrics.json names an unknown source id
 *   error: a <Cite ids="src-..."> marker names an unknown source id
 *   error: a source has no `accessed` date, or two sources share an id
 *   warning: orphan sources (never referenced anywhere)
 * Exits 1 on any error. `--verbose` lists every orphan.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ISO_DATE } from '../../src/lib/schemas.ts';
import { JsonReadError, ROOT, isMain, parseArgs, readJson, rel, walkFiles } from '../lib/io.ts';
import { citeIds } from '../lib/content.ts';

export interface SourceCheck {
  sources: number;
  references: number;
  errors: string[];
  orphans: string[];
}

interface RawSource {
  id?: unknown;
  accessed?: unknown;
}

export function verifySources(root: string = ROOT): SourceCheck {
  const content = join(root, 'src', 'content');
  const registryPath = join(content, 'sources', 'sources.json');
  const errors: string[] = [];
  let registry: RawSource[] = [];
  try {
    const raw = readJson<unknown>(registryPath);
    if (raw === undefined) errors.push(`${rel(root, registryPath)} is missing`);
    else if (!Array.isArray(raw)) errors.push(`${rel(root, registryPath)} is not an array`);
    else registry = raw as RawSource[];
  } catch (err) {
    errors.push(err instanceof JsonReadError ? err.message : String(err));
  }
  const ids = new Set<string>();
  registry.forEach((s, i) => {
    const id = typeof s.id === 'string' ? s.id : `#${i}`;
    if (ids.has(id)) errors.push(`duplicate source id ${id}`);
    ids.add(id);
    if (typeof s.accessed !== 'string' || !ISO_DATE.test(s.accessed)) errors.push(`source ${id} has no accessed date (YYYY-MM-DD)`);
  });

  const referenced = new Set<string>();
  let references = 0;
  const unknown = (file: string, where: string, id: string): void => {
    errors.push(`${rel(root, file)}: ${where} cites unknown source ${id}`);
  };

  // Walks a JSON value. Arrays under keys named sources/disputeSources are
  // source references; any other string that looks like a source id counts as
  // a reference for orphan detection only.
  const visit = (file: string, value: unknown, path: string): void => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => visit(file, v, `${path}[${i}]`));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        const p = path ? `${path}.${k}` : k;
        if ((k === 'sources' || k === 'disputeSources') && Array.isArray(v)) {
          v.forEach((id, i) => {
            if (typeof id !== 'string') return;
            references++;
            referenced.add(id);
            if (!ids.has(id)) unknown(file, `${p}[${i}]`, id);
          });
        } else visit(file, v, p);
      }
      return;
    }
    if (typeof value === 'string' && /^src-[a-z0-9-]+$/.test(value)) referenced.add(value);
  };

  const jsonFiles = [
    ...walkFiles(content, (p) => p.endsWith('.json') && p !== registryPath),
    join(root, 'src', 'data', 'manual-metrics.json'),
  ];
  for (const file of jsonFiles) {
    // Writer merge inputs (protocols/<slug>/sources.json) define sources rather than cite them.
    if (/[\\/]protocols[\\/][^\\/]+[\\/]sources\.json$/.test(file) || /\.sources\.json$/.test(file)) continue;
    let data: unknown;
    try {
      data = readJson(file);
    } catch (err) {
      errors.push(err instanceof JsonReadError ? err.message : String(err));
      continue;
    }
    if (data !== undefined) visit(file, data, '');
  }
  for (const file of walkFiles(content, (p) => /\.mdx?$/.test(p))) {
    const text = readFileSync(file, 'utf8');
    for (const id of citeIds(text)) {
      if (!id.startsWith('src-')) continue;
      references++;
      referenced.add(id);
      if (!ids.has(id)) unknown(file, 'Cite marker', id);
    }
    // Frontmatter source lists (orbit pages) and any src- id in frontmatter.
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
    for (const m of fm.matchAll(/\bsrc-[a-z0-9-]+/g)) {
      references++;
      referenced.add(m[0]);
      if (!ids.has(m[0])) unknown(file, 'frontmatter', m[0]);
    }
  }
  const orphans = [...ids].filter((id) => !referenced.has(id) && !id.startsWith('#')).sort();
  return { sources: ids.size, references, errors, orphans };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const r = verifySources(args.values.get('root') ?? ROOT);
  for (const e of r.errors) console.error(`error: ${e}`);
  if (r.orphans.length) {
    const shown = args.flags.has('verbose') ? r.orphans : r.orphans.slice(0, 10);
    console.warn(`warning: ${r.orphans.length} orphan sources (not cited anywhere)${shown.length < r.orphans.length ? '; first 10, use --verbose for all' : ''}:`);
    for (const o of shown) console.warn(`  ${o}`);
  }
  console.log(`verify-sources: ${r.sources} sources, ${r.references} references, ${r.errors.length} errors, ${r.orphans.length} orphans`);
  process.exit(r.errors.length ? 1 : 0);
}
