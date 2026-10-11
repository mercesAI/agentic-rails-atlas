/**
 * PyPI fetcher (ATLAS_PROMPT.md 11): latest version, upload date and project
 * links from pypi.org/pypi/<name>/json, last-month downloads from
 * pypistats.org, and whether the project links to the expected repository
 * (to flag squatted names). Never throws; failures keep previous records.
 */
import { join } from 'node:path';
import { type FetchResult, ROOT, errorMessage, fetchJson, isMain, log, nowIso, readJsonFile, readLatestSnapshot, sleep, warn, writeSnapshot } from './lib.ts';

interface PypiConfig {
  name: string;
  protocol: string;
  expectedRepo?: string;
  note?: string;
}

export interface PypiRecord {
  name: string;
  protocol: string;
  exists: boolean;
  latestVersion: string | null;
  uploadedAt: string | null;
  summary: string | null;
  author: string | null;
  projectUrls: Record<string, string>;
  expectedRepo: string | null;
  linksToExpectedRepo: boolean | null;
  downloadsLastMonth: number | null;
  note?: string;
  url: string;
  fetchedAt: string;
  stale?: boolean;
  error?: string;
}

export interface PypiSnapshot {
  fetchedAt: string;
  packages: Record<string, PypiRecord>;
}

export async function fetchPypi(): Promise<FetchResult<PypiSnapshot>> {
  const started = Date.now();
  try {
    const list = readJsonFile<{ pypi?: PypiConfig[] }>(join(ROOT, 'scripts', 'data', 'packages.json'))?.pypi ?? [];
    const previous = readLatestSnapshot<PypiSnapshot>('pypi')?.data;
    const out: Record<string, PypiRecord> = {};
    const warnings: string[] = [];
    let fresh = 0;
    for (const cfg of list) {
      try {
        const r = await fetchJson<{
          info: { version: string; summary: string | null; author: string | null; home_page: string | null; project_urls: Record<string, string> | null };
          urls: { upload_time_iso_8601?: string }[];
        }>(`https://pypi.org/pypi/${encodeURIComponent(cfg.name)}/json`);
        if (r.status !== 404 && (!r.ok || !r.json)) throw new Error(`HTTP ${r.status}`);
        const exists = r.status !== 404;
        const info = r.json?.info;
        const urls: Record<string, string> = { ...(info?.project_urls ?? {}) };
        if (info?.home_page) urls.Homepage ??= info.home_page;
        const linked = cfg.expectedRepo && exists
          ? Object.values(urls).some((u) => u.toLowerCase().includes(`github.com/${cfg.expectedRepo!.toLowerCase()}`))
          : null;
        let downloads: number | null = null;
        if (exists) {
          const s = await fetchJson<{ data?: { last_month?: number } }>(`https://pypistats.org/api/packages/${encodeURIComponent(cfg.name.toLowerCase())}/recent`);
          if (s.ok) downloads = s.json?.data?.last_month ?? null;
          else warnings.push(`${cfg.name}: pypistats HTTP ${s.status}`);
        }
        out[cfg.name] = {
          name: cfg.name,
          protocol: cfg.protocol,
          exists,
          latestVersion: info?.version ?? null,
          uploadedAt: r.json?.urls?.[0]?.upload_time_iso_8601 ?? null,
          summary: info?.summary ?? null,
          author: info?.author ?? null,
          projectUrls: urls,
          expectedRepo: cfg.expectedRepo ?? null,
          linksToExpectedRepo: linked,
          downloadsLastMonth: downloads,
          ...(cfg.note ? { note: cfg.note } : {}),
          url: `https://pypi.org/project/${cfg.name}/`,
          fetchedAt: nowIso(),
        };
        fresh++;
      } catch (err) {
        const prev = previous?.packages[cfg.name];
        const msg = `${cfg.name}: ${errorMessage(err)}${prev ? '; kept previous record' : ''}`;
        warnings.push(msg);
        warn('pypi', msg);
        if (prev) out[cfg.name] = { ...prev, stale: true, error: errorMessage(err) };
      }
      await sleep(500);
    }
    if (!fresh) return { ok: false, source: 'pypi', error: 'no package could be fetched; previous snapshot kept', warnings, durationMs: Date.now() - started };
    const data: PypiSnapshot = { fetchedAt: nowIso(), packages: out };
    const snapshotPath = writeSnapshot('pypi', data);
    log('pypi', `${fresh} of ${list.length} packages fetched`);
    return { ok: true, source: 'pypi', data, warnings, snapshotPath, durationMs: Date.now() - started };
  } catch (err) {
    return { ok: false, source: 'pypi', error: errorMessage(err), durationMs: Date.now() - started };
  }
}

if (isMain(import.meta.url)) {
  void fetchPypi().then((r) => {
    if (!r.ok) warn('pypi', r.error ?? 'failed');
  });
}
