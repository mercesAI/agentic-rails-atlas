/**
 * npm fetcher (ATLAS_PROMPT.md 11): last-month downloads from
 * api.npmjs.org/downloads/point/last-month/<pkg> and the latest version and
 * modified date from the registry, for every package in scripts/data/packages.json.
 * Never throws; failed packages keep their previous record (marked stale).
 */
import { join } from 'node:path';
import { type FetchResult, ROOT, errorMessage, fetchJson, isMain, log, nowIso, readJsonFile, readLatestSnapshot, sleep, warn, writeSnapshot } from './lib.ts';

export interface NpmRecord {
  name: string;
  downloadsLastMonth: number | null;
  period: { start: string; end: string } | null;
  latestVersion: string | null;
  modified: string | null;
  url: string;
  fetchedAt: string;
  stale?: boolean;
  error?: string;
}

export interface NpmSnapshot {
  fetchedAt: string;
  packages: Record<string, NpmRecord>;
}

export async function fetchNpm(): Promise<FetchResult<NpmSnapshot>> {
  const started = Date.now();
  try {
    const names = readJsonFile<{ npm?: string[] }>(join(ROOT, 'scripts', 'data', 'packages.json'))?.npm ?? [];
    const previous = readLatestSnapshot<NpmSnapshot>('npm')?.data;
    const out: Record<string, NpmRecord> = {};
    const warnings: string[] = [];
    let fresh = 0;
    for (const name of names) {
      try {
        const dl = await fetchJson<{ downloads: number; start: string; end: string; error?: string }>(
          `https://api.npmjs.org/downloads/point/last-month/${name}`,
        );
        const meta = await fetchJson<{ 'dist-tags'?: { latest?: string }; modified?: string; error?: string }>(
          `https://registry.npmjs.org/${name.replace('/', '%2F')}`,
          { headers: { accept: 'application/vnd.npm.install-v1+json' } },
        );
        if (dl.status === 404 && meta.status === 404) throw new Error('package not found on npm');
        if (!dl.ok && !meta.ok) throw new Error(`HTTP ${dl.status} and ${meta.status}`);
        out[name] = {
          name,
          downloadsLastMonth: dl.ok && dl.json ? dl.json.downloads : null,
          period: dl.ok && dl.json ? { start: dl.json.start, end: dl.json.end } : null,
          latestVersion: meta.json?.['dist-tags']?.latest ?? null,
          modified: meta.json?.modified ?? null,
          url: `https://www.npmjs.com/package/${name}`,
          fetchedAt: nowIso(),
        };
        fresh++;
      } catch (err) {
        const prev = previous?.packages[name];
        const msg = `${name}: ${errorMessage(err)}${prev ? '; kept previous record' : ''}`;
        warnings.push(msg);
        warn('npm', msg);
        if (prev) out[name] = { ...prev, stale: true, error: errorMessage(err) };
      }
      await sleep(200);
    }
    if (!fresh) return { ok: false, source: 'npm', error: 'no package could be fetched; previous snapshot kept', warnings, durationMs: Date.now() - started };
    const data: NpmSnapshot = { fetchedAt: nowIso(), packages: out };
    const snapshotPath = writeSnapshot('npm', data);
    log('npm', `${fresh} of ${names.length} packages fetched`);
    return { ok: true, source: 'npm', data, warnings, snapshotPath, durationMs: Date.now() - started };
  } catch (err) {
    return { ok: false, source: 'npm', error: errorMessage(err), durationMs: Date.now() - started };
  }
}

if (isMain(import.meta.url)) {
  void fetchNpm().then((r) => {
    if (!r.ok) warn('npm', r.error ?? 'failed');
  });
}
