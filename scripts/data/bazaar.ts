/**
 * x402 Bazaar fetcher (ATLAS_PROMPT.md 11). Reads the public discovery list
 * GET https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources
 * (response shape per x402 specification v2, section 8.1: items[] with
 * resource, type, x402Version, accepts[], lastUpdated; pagination.total).
 * Records the total and counts by type, network, scheme and x402 version over
 * the pages it reads (at most MAX_PAGES of 100, 1 s apart). Never throws.
 * Override the endpoint with BAZAAR_DISCOVERY_URL.
 */
import { type FetchResult, countBy, errorMessage, fetchJson, isMain, log, nowIso, sleep, warn, writeSnapshot } from './lib.ts';

const DEFAULT_URL = 'https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources';
const PAGE = 100;
const MAX_PAGES = 10;

interface DiscoveryItem {
  resource?: string;
  type?: string;
  x402Version?: number;
  accepts?: { scheme?: string; network?: string }[];
  lastUpdated?: string;
}

export interface BazaarSnapshot {
  fetchedAt: string;
  endpoint: string;
  total: number | null;
  sampled: number;
  sampleNote: string;
  byType: Record<string, number>;
  byNetwork: Record<string, number>;
  byScheme: Record<string, number>;
  byX402Version: Record<string, number>;
  byHost: Record<string, number>;
  newestUpdate: string | null;
}

export async function fetchBazaar(): Promise<FetchResult<BazaarSnapshot>> {
  const started = Date.now();
  const endpoint = process.env.BAZAAR_DISCOVERY_URL ?? DEFAULT_URL;
  try {
    const items: DiscoveryItem[] = [];
    let total: number | null = null;
    const warnings: string[] = [];
    for (let page = 0; page < MAX_PAGES; page++) {
      const r = await fetchJson<{ items?: DiscoveryItem[]; pagination?: { total?: number } }>(`${endpoint}?limit=${PAGE}&offset=${page * PAGE}`);
      if (!r.ok || !r.json) {
        if (page === 0) return { ok: false, source: 'bazaar', error: `HTTP ${r.status}: ${r.text.slice(0, 160)}; previous snapshot kept`, durationMs: Date.now() - started };
        warnings.push(`page ${page + 1}: HTTP ${r.status}; stopped paging`);
        break;
      }
      const batch = r.json.items ?? [];
      total = r.json.pagination?.total ?? total;
      items.push(...batch);
      if (batch.length < PAGE || (total !== null && items.length >= total)) break;
      await sleep(1000);
    }
    const host = (u?: string): string | undefined => {
      try {
        return u ? new URL(u).hostname : undefined;
      } catch {
        return undefined;
      }
    };
    const top = (rec: Record<string, number>, n = 25): Record<string, number> => Object.fromEntries(Object.entries(rec).slice(0, n));
    const data: BazaarSnapshot = {
      fetchedAt: nowIso(),
      endpoint,
      total,
      sampled: items.length,
      sampleNote: total !== null && items.length < total ? `counts cover the first ${items.length} of ${total} listed resources` : 'counts cover every listed resource',
      byType: countBy(items, (i) => i.type),
      byNetwork: countBy(items, (i) => [...new Set((i.accepts ?? []).map((a) => a.network).filter((n): n is string => !!n))]),
      byScheme: countBy(items, (i) => [...new Set((i.accepts ?? []).map((a) => a.scheme).filter((n): n is string => !!n))]),
      byX402Version: countBy(items, (i) => (i.x402Version === undefined ? undefined : String(i.x402Version))),
      byHost: top(countBy(items, (i) => host(i.resource))),
      newestUpdate: items.map((i) => i.lastUpdated).filter((d): d is string => !!d).sort().pop() ?? null,
    };
    const snapshotPath = writeSnapshot('bazaar', data);
    log('bazaar', `total ${total ?? 'unknown'}, sampled ${items.length}`);
    return { ok: true, source: 'bazaar', data, warnings, snapshotPath, durationMs: Date.now() - started };
  } catch (err) {
    return { ok: false, source: 'bazaar', error: errorMessage(err), durationMs: Date.now() - started };
  }
}

if (isMain(import.meta.url)) {
  void fetchBazaar().then((r) => {
    if (!r.ok) warn('bazaar', r.error ?? 'failed');
  });
}
