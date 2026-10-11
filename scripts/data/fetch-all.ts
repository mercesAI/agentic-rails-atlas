/**
 * fetch-all.ts (`pnpm data`). Runs every build-time data fetcher in sequence
 * and prints one line per source. Never fails the build: it always exits 0,
 * and a failed source keeps its previous snapshot. Pass source names to run a
 * subset, for example `pnpm data github npm`.
 */
import { fetchAgent0 } from './agent0.ts';
import { fetchBazaar } from './bazaar.ts';
import { fetchGithub } from './github.ts';
import { type FetchResult, type SourceName, errorMessage, isMain, readLatestSnapshot } from './lib.ts';
import { fetchNpm } from './npm.ts';
import { fetchPypi } from './pypi.ts';

const FETCHERS: Record<SourceName, () => Promise<FetchResult>> = {
  github: fetchGithub,
  npm: fetchNpm,
  pypi: fetchPypi,
  bazaar: fetchBazaar,
  agent0: fetchAgent0,
};

export async function fetchAll(only: string[] = []): Promise<FetchResult[]> {
  const names = (Object.keys(FETCHERS) as SourceName[]).filter((n) => !only.length || only.includes(n));
  const results: FetchResult[] = [];
  for (const name of names) {
    try {
      results.push(await FETCHERS[name]());
    } catch (err) {
      results.push({ ok: false, source: name, error: `unexpected: ${errorMessage(err)}` });
    }
  }
  return results;
}

if (isMain(import.meta.url)) {
  fetchAll(process.argv.slice(2))
    .then((results) => {
      console.log('\ndata summary');
      for (const r of results) {
        const prev = r.ok ? null : readLatestSnapshot(r.source);
        const status = r.ok
          ? `ok (${((r.durationMs ?? 0) / 1000).toFixed(1)} s)${r.warnings?.length ? `, ${r.warnings.length} warnings` : ''}`
          : `failed: ${r.error}${prev ? `; serving snapshot from ${prev.date}` : '; no snapshot yet'}`;
        console.log(`  ${r.source.padEnd(7)} ${status}`);
      }
    })
    .catch((err: unknown) => console.error(`data: unexpected error: ${errorMessage(err)}`))
    .finally(() => process.exit(0));
}
