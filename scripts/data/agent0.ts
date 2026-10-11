/**
 * Agent0 subgraph fetcher (ATLAS_PROMPT.md 11: ERC-8004 agents by chain).
 * Read-only GraphQL queries against the endpoints in scripts/data/agent0.json
 * (or AGENT0_SUBGRAPH_URLS as a JSON map of chain id to URL). Per chain it
 * records the indexed block (_meta), the root query fields the subgraph
 * exposes (introspection), and the newest agent ids (`agents`, the entity the
 * Agent0 SDK queries). It does not count all agents: paging through hundreds
 * of thousands of entities is not polite; use 8004scan figures in
 * manual-metrics.json for totals. Never throws.
 */
import { join } from 'node:path';
import { type FetchResult, ROOT, errorMessage, fetchJson, isMain, log, nowIso, readJsonFile, readLatestSnapshot, sleep, warn, writeSnapshot } from './lib.ts';

interface Endpoint {
  chainId: number;
  chain: string;
  url: string;
}

export interface ChainRecord {
  chainId: number;
  chain: string;
  block: { number: number; timestamp: number | null } | null;
  hasIndexingErrors: boolean | null;
  rootFields: string[];
  newestAgentIds: string[];
  /**
   * Rows of the subgraph's `protocols` and `protocol*Stats_collection` entities,
   * with every scalar field (field names read by introspection, not assumed).
   */
  protocolStats: Record<string, Record<string, unknown>[]>;
  fetchedAt: string;
  stale?: boolean;
  error?: string;
}

export interface Agent0Snapshot {
  fetchedAt: string;
  source: string;
  chains: Record<string, ChainRecord>;
}

async function gql<T>(url: string, query: string): Promise<{ data?: T; error?: string }> {
  const r = await fetchJson<{ data?: T; errors?: { message: string }[] }>(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!r.ok || !r.json) return { error: `HTTP ${r.status}: ${r.text.slice(0, 120)}` };
  if (r.json.errors?.length) return { data: r.json.data, error: r.json.errors.map((e) => e.message).join('; ').slice(0, 200) };
  return { data: r.json.data };
}

interface TypeRef {
  kind: string;
  name: string | null;
  ofType?: TypeRef | null;
}
const unwrap = (t: TypeRef | null | undefined): TypeRef | null | undefined => (t && (t.kind === 'NON_NULL' || t.kind === 'LIST') ? unwrap(t.ofType) : t);

/**
 * Reads the scalar fields of a root list field by introspection, then queries
 * a few rows. Timeseries aggregations (fields with an `interval` argument) are
 * read per day, newest first, for the last 30 days.
 */
async function scalarRows(url: string, field: string, warnings: string[], chain: string): Promise<Record<string, unknown>[]> {
  const TYPE = 'kind name ofType { kind name ofType { kind name ofType { kind name } } }';
  const q = await gql<{ __schema?: { queryType?: { fields?: { name: string; args: { name: string }[]; type: TypeRef }[] } } }>(
    url,
    `{ __schema { queryType { fields { name args { name } type { ${TYPE} } } } } }`,
  );
  const def = q.data?.__schema?.queryType?.fields?.find((f) => f.name === field);
  const typeName = unwrap(def?.type)?.name;
  const timeseries = !!def?.args.some((a) => a.name === 'interval');
  if (!typeName) return [];
  await sleep(300);
  const t = await gql<{ __type?: { fields?: { name: string; type: TypeRef }[] } }>(url, `{ __type(name: "${typeName}") { fields { name type { ${TYPE} } } } }`);
  const scalars = (t.data?.__type?.fields ?? []).filter((f) => unwrap(f.type)?.kind === 'SCALAR' && !/^(?:LIST)$/.test(f.type.kind)).map((f) => f.name);
  if (!scalars.length) return [];
  await sleep(300);
  const args = timeseries ? 'first: 30, interval: day' : 'first: 5';
  const r = await gql<Record<string, Record<string, unknown>[]>>(url, `{ ${field}(${args}) { ${scalars.join(' ')} } }`);
  if (r.error) warnings.push(`${chain}: ${field} query: ${r.error}`);
  return r.data?.[field] ?? [];
}

function endpoints(): { list: Endpoint[]; source: string } {
  const env = process.env.AGENT0_SUBGRAPH_URLS;
  if (env) {
    try {
      const map = JSON.parse(env) as Record<string, string>;
      return { list: Object.entries(map).map(([id, url]) => ({ chainId: Number(id), chain: `chain ${id}`, url })), source: 'AGENT0_SUBGRAPH_URLS' };
    } catch {
      warn('agent0', 'AGENT0_SUBGRAPH_URLS is not valid JSON; using scripts/data/agent0.json');
    }
  }
  const cfg = readJsonFile<{ source?: string; endpoints?: Endpoint[] }>(join(ROOT, 'scripts', 'data', 'agent0.json'));
  const key = process.env.GRAPH_API_KEY;
  if (!key) {
    warn('agent0', 'GRAPH_API_KEY and AGENT0_SUBGRAPH_URLS are unset; skipping Agent0 and keeping the previous snapshot');
    return { list: [], source: 'none' };
  }
  const list = (cfg?.endpoints ?? []).map((e) => ({ ...e, url: e.url.replace('{GRAPH_API_KEY}', key) }));
  return { list, source: cfg?.source ?? 'scripts/data/agent0.json' };
}

export async function fetchAgent0(): Promise<FetchResult<Agent0Snapshot>> {
  const started = Date.now();
  try {
    const { list, source } = endpoints();
    if (!list.length) return { ok: false, source: 'agent0', error: 'no subgraph endpoint configured; previous snapshot kept', durationMs: Date.now() - started };
    const previous = readLatestSnapshot<Agent0Snapshot>('agent0')?.data;
    const chains: Record<string, ChainRecord> = {};
    const warnings: string[] = [];
    let fresh = 0;
    for (const e of list) {
      const key = String(e.chainId);
      try {
        const meta = await gql<{ _meta?: { block: { number: number; timestamp?: number | null }; hasIndexingErrors: boolean } }>(
          e.url,
          '{ _meta { block { number timestamp } hasIndexingErrors } }',
        );
        if (!meta.data?._meta) throw new Error(meta.error ?? 'no _meta in response');
        await sleep(300);
        const intro = await gql<{ __schema?: { queryType?: { fields?: { name: string }[] } } }>(e.url, '{ __schema { queryType { fields { name } } } }');
        const rootFields = (intro.data?.__schema?.queryType?.fields ?? []).map((f) => f.name).filter((n) => !n.startsWith('_')).sort();
        let newest: string[] = [];
        if (rootFields.includes('agents')) {
          await sleep(300);
          const a = await gql<{ agents?: { id: string }[] }>(e.url, '{ agents(first: 5, orderBy: id, orderDirection: desc) { id } }');
          newest = (a.data?.agents ?? []).map((x) => x.id);
          if (a.error) warnings.push(`${e.chain}: agents query: ${a.error}`);
        }
        const protocolStats: Record<string, Record<string, unknown>[]> = {};
        for (const field of rootFields.filter((f) => f === 'protocols' || /^protocol\w*Stats_collection$/.test(f))) {
          await sleep(300);
          protocolStats[field] = await scalarRows(e.url, field, warnings, e.chain);
        }
        chains[key] = {
          chainId: e.chainId,
          chain: e.chain,
          block: { number: meta.data._meta.block.number, timestamp: meta.data._meta.block.timestamp ?? null },
          hasIndexingErrors: meta.data._meta.hasIndexingErrors,
          rootFields,
          newestAgentIds: newest,
          protocolStats,
          fetchedAt: nowIso(),
        };
        fresh++;
      } catch (err) {
        const prev = previous?.chains[key];
        const msg = `${e.chain}: ${errorMessage(err)}${prev ? '; kept previous record' : ''}`;
        warnings.push(msg);
        warn('agent0', msg);
        if (prev) chains[key] = { ...prev, stale: true, error: errorMessage(err) };
      }
      await sleep(500);
    }
    if (!fresh) return { ok: false, source: 'agent0', error: 'no subgraph answered; previous snapshot kept', warnings, durationMs: Date.now() - started };
    // Never store gateway keys in snapshots.
    const data: Agent0Snapshot = { fetchedAt: nowIso(), source: source.replace(/\/api\/[^/]+\//, '/api/<key>/'), chains };
    const snapshotPath = writeSnapshot('agent0', data);
    log('agent0', `${fresh} of ${list.length} chains fetched`);
    return { ok: true, source: 'agent0', data, warnings, snapshotPath, durationMs: Date.now() - started };
  } catch (err) {
    return { ok: false, source: 'agent0', error: errorMessage(err), durationMs: Date.now() - started };
  }
}

if (isMain(import.meta.url)) {
  void fetchAgent0().then((r) => {
    if (!r.ok) warn('agent0', r.error ?? 'failed');
  });
}
