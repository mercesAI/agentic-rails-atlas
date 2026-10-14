/**
 * verify-citations.ts (ARCHITECTURE.md §9, ATLAS_PROMPT.md 14.1). Re-verifies
 * every entry in src/content/publications/publications.json:
 *   - DOI: Crossref, then DataCite, then DOI content negotiation (CSL JSON)
 *   - arXiv id: DataCite (10.48550/arXiv.<id>), then the arXiv export API
 * Checks the title (normalized, at least 85 percent token overlap) and the
 * first author's family name. One request at a time with a 300 ms pause.
 *
 * `--offline` skips the network and checks shape only (schema, id pattern,
 * year in id, identifier formats, BibTeX present). Exits 1 on a schema error,
 * a mismatch or a record that no registry knows. Registries that cannot be
 * reached produce warnings, not failures. Writes src/generated/citation-report.json
 * (online runs only).
 */
import { join } from 'node:path';
import { z } from 'zod';
import { Publication } from '../../src/lib/schemas.ts';
import { ROOT, isMain, parseArgs, rel, writeJsonIfChanged } from '../lib/io.ts';
import { loadJson } from '../lib/content.ts';
import { fetchJson, sleep } from '../data/lib.ts';

type PublicationT = z.infer<typeof Publication>;

export const TITLE_THRESHOLD = 0.85;
const DELAY_MS = 300;
const UA = 'agentic-rails-atlas-citation-check (build-time verifier)';

export function normalizeTitle(t: string): string[] {
  return t
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/<[^>]+>/g, ' ')
    .replace(/[{}$\\]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

/** Share of tokens in common, relative to the longer title (multiset). */
export function titleOverlap(a: string, b: string): number {
  const ta = normalizeTitle(a);
  const tb = normalizeTitle(b);
  if (!ta.length || !tb.length) return 0;
  const counts = new Map<string, number>();
  for (const t of tb) counts.set(t, (counts.get(t) ?? 0) + 1);
  let common = 0;
  for (const t of ta) {
    const n = counts.get(t) ?? 0;
    if (n > 0) {
      common++;
      counts.set(t, n - 1);
    }
  }
  return common / Math.max(ta.length, tb.length);
}

const fold = (s: string): string =>
  s
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, ' ')
    .trim();

/** True when the registry family name appears in our first-author string (accent and case insensitive). */
export function authorMatches(ours: string, registryFamily: string): boolean {
  const o = ` ${fold(ours)} `;
  const parts = fold(registryFamily).split(' ').filter((p) => p.length > 1);
  if (!parts.length) return false;
  return parts.some((p) => o.includes(` ${p} `));
}

interface RegistryRecord {
  via: 'crossref' | 'datacite' | 'doi-negotiation' | 'arxiv';
  title: string;
  firstFamily: string;
}

type Lookup = { record?: RegistryRecord; notFound?: boolean; error?: string };

async function crossref(doi: string): Promise<Lookup> {
  const r = await fetchJson<{ message?: { title?: string[]; author?: { family?: string; name?: string }[] } }>(
    `https://api.crossref.org/works/${encodeURIComponent(doi)}`,
    { headers: { 'user-agent': UA } },
  );
  if (r.status === 404) return { notFound: true };
  if (!r.ok || !r.json?.message) return { error: `crossref HTTP ${r.status}` };
  const m = r.json.message;
  return { record: { via: 'crossref', title: m.title?.[0] ?? '', firstFamily: m.author?.[0]?.family ?? m.author?.[0]?.name ?? '' } };
}

async function datacite(doi: string): Promise<Lookup> {
  const r = await fetchJson<{
    data?: { attributes?: { titles?: { title: string }[]; creators?: { familyName?: string; name?: string }[] } };
  }>(`https://api.datacite.org/dois/${encodeURIComponent(doi)}`, { headers: { 'user-agent': UA } });
  if (r.status === 404) return { notFound: true };
  if (!r.ok || !r.json?.data?.attributes) return { error: `datacite HTTP ${r.status}` };
  const a = r.json.data.attributes;
  const c = a.creators?.[0];
  return {
    record: { via: 'datacite', title: a.titles?.[0]?.title ?? '', firstFamily: c?.familyName ?? (c?.name ?? '').split(',')[0] ?? '' },
  };
}

async function negotiate(doi: string): Promise<Lookup> {
  const r = await fetchJson<{ title?: string | string[]; author?: { family?: string; literal?: string }[] }>(`https://doi.org/${doi}`, {
    headers: { accept: 'application/vnd.citationstyles.csl+json', 'user-agent': UA },
  });
  if (r.status === 404) return { notFound: true };
  if (!r.ok || !r.json) return { error: `doi.org HTTP ${r.status}` };
  const title = Array.isArray(r.json.title) ? (r.json.title[0] ?? '') : (r.json.title ?? '');
  return { record: { via: 'doi-negotiation', title, firstFamily: r.json.author?.[0]?.family ?? r.json.author?.[0]?.literal ?? '' } };
}

async function arxivApi(id: string): Promise<Lookup> {
  const r = await fetchJson(`https://export.arxiv.org/api/query?id_list=${encodeURIComponent(id)}`, {
    headers: { accept: 'application/atom+xml', 'user-agent': UA },
  });
  if (!r.ok) return { error: `arxiv HTTP ${r.status}` };
  const entry = /<entry>([\s\S]*?)<\/entry>/.exec(r.text)?.[1];
  if (!entry) return { notFound: true };
  const title = /<title[^>]*>([\s\S]*?)<\/title>/.exec(entry)?.[1]?.replace(/\s+/g, ' ').trim() ?? '';
  const name = /<author>\s*<name>([\s\S]*?)<\/name>/.exec(entry)?.[1]?.trim() ?? '';
  if (!title || /^error$/i.test(title)) return { notFound: true };
  return { record: { via: 'arxiv', title, firstFamily: name.split(/\s+/).pop() ?? '' } };
}

/** Tries each lookup in order with the polite delay; stops at the first record. */
async function firstRecord(lookups: (() => Promise<Lookup>)[]): Promise<{ record?: RegistryRecord; notes: string[]; allNotFound: boolean }> {
  const notes: string[] = [];
  let allNotFound = true;
  for (const run of lookups) {
    const r = await run();
    await sleep(DELAY_MS);
    if (r.record) return { record: r.record, notes, allNotFound: false };
    if (r.error) {
      allNotFound = false;
      notes.push(r.error);
    }
  }
  return { notes, allNotFound };
}

export interface CitationResult {
  id: string;
  status: 'ok' | 'mismatch' | 'not-found' | 'unreachable' | 'shape-error' | 'skipped';
  via?: string;
  overlap?: number;
  message?: string;
}

export function shapeChecks(p: PublicationT): string[] {
  const problems: string[] = [];
  const m = /^pub-([a-z0-9]+)-(\d{4})-[a-z0-9-]+$/.exec(p.id);
  if (!m) problems.push('id does not follow pub-<firstauthor>-<year>-<word>');
  else if (Number(m[2]) !== p.year) problems.push(`year in id (${m[2]}) differs from year ${p.year}`);
  if (p.arxiv && !/^(\d{4}\.\d{4,5}|[a-z-]+(\.[A-Z]{2})?\/\d{7})(v\d+)?$/.test(p.arxiv)) problems.push(`arxiv id "${p.arxiv}" has an unexpected format`);
  if (p.doi && !/^10\.\d{4,9}\/\S+$/i.test(p.doi)) problems.push(`doi "${p.doi}" has an unexpected format`);
  if (!/^@\w+\s*\{/.test(p.bibtex.trim())) problems.push('bibtex does not start with an @type{ entry');
  // Grey literature verified on the publisher page may lack a DOI or arXiv id;
  // it is re-checked by fetching its URL instead (see verifyCitations).
  if (!p.arxiv && !p.doi && p.verifiedVia !== 'publisher') problems.push('no DOI or arXiv id to re-verify against');
  return problems;
}

export async function verifyCitations(options: { root?: string; offline?: boolean; only?: string } = {}): Promise<{ results: CitationResult[]; fatal?: string }> {
  const root = options.root ?? ROOT;
  const path = join(root, 'src', 'content', 'publications', 'publications.json');
  const loaded = loadJson(path, z.array(Publication));
  if (loaded.error) return { results: [], fatal: `${rel(root, path)}: ${loaded.error}` };
  const pubs = (loaded.data ?? []).filter((p) => !options.only || p.id === options.only);
  const results: CitationResult[] = [];
  for (const p of pubs) {
    const shape = shapeChecks(p);
    if (shape.length) {
      results.push({ id: p.id, status: 'shape-error', message: shape.join('; ') });
      continue;
    }
    if (options.offline) {
      results.push({ id: p.id, status: 'skipped', message: 'offline' });
      continue;
    }
    if (!p.doi && !p.arxiv) {
      // Publisher-verified entry: confirm the page still resolves; a block or timeout only warns.
      let status: number;
      try {
        const r = await fetch(p.url, { method: 'GET', redirect: 'follow', headers: { 'user-agent': UA } });
        status = r.status;
      } catch {
        status = 0;
      }
      results.push(
        status >= 200 && status < 400
          ? { id: p.id, status: 'ok', message: `publisher page HTTP ${status}` }
          : status === 404 || status === 410
            ? { id: p.id, status: 'not-found', message: `publisher page HTTP ${status}` }
            : { id: p.id, status: 'unreachable', message: `publisher page ${status ? `HTTP ${status}` : 'unreachable'}` },
      );
      continue;
    }
    const lookups: (() => Promise<Lookup>)[] = [];
    if (p.doi) lookups.push(() => crossref(p.doi!), () => datacite(p.doi!), () => negotiate(p.doi!));
    if (p.arxiv) {
      const bare = p.arxiv.replace(/v\d+$/, '');
      lookups.push(() => datacite(`10.48550/arXiv.${bare}`), () => arxivApi(bare));
    }
    const { record, notes, allNotFound } = await firstRecord(lookups);
    if (!record) {
      results.push({ id: p.id, status: allNotFound ? 'not-found' : 'unreachable', message: notes.join('; ') || 'no registry knows this identifier' });
      continue;
    }
    const overlap = Math.round(titleOverlap(p.title, record.title) * 100) / 100;
    const author = authorMatches(p.authors[0] ?? '', record.firstFamily);
    const problems: string[] = [];
    if (overlap < TITLE_THRESHOLD) problems.push(`title overlap ${overlap} (registry: "${record.title.slice(0, 90)}")`);
    if (!author) problems.push(`first author "${p.authors[0]}" vs registry "${record.firstFamily}"`);
    results.push({ id: p.id, status: problems.length ? 'mismatch' : 'ok', via: record.via, overlap, ...(problems.length ? { message: problems.join('; ') } : {}) });
  }
  return { results };
}

if (isMain(import.meta.url)) {
  const args = parseArgs(process.argv.slice(2));
  const root = args.values.get('root') ?? ROOT;
  const offline = args.flags.has('offline');
  verifyCitations({ root, offline, only: args.values.get('only') })
    .then(({ results, fatal }) => {
      if (fatal) {
        console.error(`error: ${fatal}`);
        process.exit(1);
      }
      const count = (s: CitationResult['status']): number => results.filter((r) => r.status === s).length;
      for (const r of results) {
        if (r.status === 'ok' || r.status === 'skipped') continue;
        const line = `${r.id}: ${r.status}${r.message ? `: ${r.message}` : ''}`;
        if (r.status === 'unreachable') console.warn(`warning: ${line}`);
        else console.error(`error: ${line}`);
      }
      if (!offline) {
        writeJsonIfChanged(join(root, 'src', 'generated', 'citation-report.json'), {
          checkedAt: new Date().toISOString().slice(0, 10),
          results,
        });
      }
      const failures = count('mismatch') + count('not-found') + count('shape-error');
      console.log(
        `verify-citations${offline ? ' (offline)' : ''}: ${results.length} publications; ${count('ok')} ok, ${count('skipped')} shape-only, ${count('mismatch')} mismatch, ${count('not-found')} not found, ${count('unreachable')} unreachable, ${count('shape-error')} shape errors`,
      );
      process.exit(failures ? 1 : 0);
    })
    .catch((err: unknown) => {
      console.error(`verify-citations failed: ${err instanceof Error ? err.message : String(err)}`);
      process.exit(1);
    });
}
