/**
 * Shared helpers for the build-time data fetchers (ATLAS_PROMPT.md Section 11,
 * ARCHITECTURE.md §9). Every fetcher returns a FetchResult and never throws to
 * the caller; failures keep the previous snapshot in place.
 *
 * Snapshots: src/data/snapshots/<source>/<YYYY-MM-DD>.json (one per day, the
 * last run of the day wins) and a copy of the latest at
 * src/generated/<source>/latest.json. The date is the UTC date of the system
 * clock (`today()` in scripts/lib/io.ts, the one clock of the build scripts).
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { ROOT, today } from '../lib/io.ts';

export { ROOT, isMain, today } from '../lib/io.ts';
export { fetchJson, sleep, type JsonResponse } from '../lib/net.ts';
export const SNAPSHOT_DIR = join(ROOT, 'src', 'data', 'snapshots');
export const GENERATED_DIR = join(ROOT, 'src', 'generated');

export type SourceName = 'github' | 'npm' | 'pypi' | 'bazaar' | 'agent0';

export interface FetchResult<T = unknown> {
  ok: boolean;
  source: SourceName;
  /** Why the fetch failed, or what degraded (partial failures keep ok true). */
  error?: string;
  warnings?: string[];
  /** The snapshot payload when ok. */
  data?: T;
  /** Where the snapshot was written. */
  snapshotPath?: string;
  durationMs?: number;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function readJsonFile<T>(path: string): T | null {
  try {
    if (!existsSync(path)) return null;
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch {
    return null;
  }
}

export function writeJsonFile(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

/** The newest dated snapshot for a source, or null. */
export function readLatestSnapshot<T>(source: SourceName): { date: string; data: T } | null {
  const dir = join(SNAPSHOT_DIR, source);
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort();
  const last = files[files.length - 1];
  if (!last) return null;
  const data = readJsonFile<T>(join(dir, last));
  return data ? { date: last.replace(/\.json$/, ''), data } : null;
}

/**
 * Writes the dated snapshot and copies it to src/generated/<source>/latest.json.
 * Extra files (for example one JSON per GitHub repository) go through `extras`.
 */
export function writeSnapshot(
  source: SourceName,
  data: unknown,
  extras: Record<string, unknown> = {},
  date: string = today(),
): string {
  const snapshotPath = join(SNAPSHOT_DIR, source, `${date}.json`);
  writeJsonFile(snapshotPath, data);
  writeJsonFile(join(GENERATED_DIR, source, 'latest.json'), data);
  for (const [name, value] of Object.entries(extras)) {
    writeJsonFile(join(GENERATED_DIR, source, name), value);
  }
  return snapshotPath;
}

export function log(source: SourceName, message: string): void {
  console.log(`[data:${source}] ${message}`);
}

export function warn(source: SourceName, message: string): void {
  console.warn(`[data:${source}] warning: ${message}`);
}

export function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/** Counts values of a key across records, sorted by count descending. */
export function countBy<T>(items: T[], pick: (item: T) => string | string[] | undefined): Record<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const v = pick(item);
    const values = v === undefined ? [] : Array.isArray(v) ? v : [v];
    for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return Object.fromEntries([...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}
