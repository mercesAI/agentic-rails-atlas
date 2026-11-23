/**
 * Read-only access to Cloudflare's GraphQL Analytics API for `pnpm stats`.
 *
 * Datasets (see Cloudflare's GraphQL Analytics API documentation):
 * - httpRequestsAdaptiveGroups (zone): every request Cloudflare's edge served, on all plans,
 *   kept at least 31 days, up to 30 days per query. Used for the bot and AI-bot classes.
 * - rumPageloadEventsAdaptiveGroups (account): Web Analytics page loads from the beacon. Used
 *   for people. Its field names are reported, not documented, so every optional field is read
 *   from the dataset's settings node (availableFields) before a query uses it.
 *
 * Values are written into the query as literals after strict validation (ids are 32 hex
 * characters, hosts are plain host names, times are ISO 8601), so no variable types are needed.
 * The token only ever goes into the Authorization header; no error message repeats it.
 */
import { fetchJson, sleep, type JsonResponse } from '../lib/net';
import { isoSeconds, type TimeWindow } from './windows';

export const GRAPHQL_ENDPOINT = 'https://api.cloudflare.com/client/v4/graphql';
export const EDGE_DATASET = 'httpRequestsAdaptiveGroups';
export const RUM_DATASET = 'rumPageloadEventsAdaptiveGroups';

export class StatsError extends Error {}

export type Fetcher = (url: string, init: RequestInit, timeoutMs: number) => Promise<JsonResponse<unknown>>;

interface GqlResponse<T> {
  data?: T | null;
  errors?: { message?: string }[] | null;
}

export interface Client {
  query<T>(query: string): Promise<T>;
}

function firstLine(text: string): string {
  return (text.split('\n')[0] ?? '').slice(0, 200);
}

function statusHint(status: number): string {
  if (status === 401 || status === 403) {
    return ' (check ATLAS_STATS_CF_TOKEN: it needs Account Analytics Read and zone Analytics Read for this account and zone)';
  }
  if (status === 0) return ' (network error)';
  return '';
}

/** Answers worth one retry: the rate limit (429) and "too many queries in progress" (503). */
const RETRY = new Set([429, 503]);

export function createClient(token: string, fetcher: Fetcher = fetchJson, waitMs = 5_000): Client {
  // Belt and braces: no message that leaves this client may contain the token.
  const redact = (text: string): string => (token ? text.split(token).join('[token]') : text);
  return {
    async query<T>(query: string): Promise<T> {
      for (let attempt = 0; attempt < 2; attempt++) {
        const res = await fetcher(
          GRAPHQL_ENDPOINT,
          {
            method: 'POST',
            headers: {
              authorization: `Bearer ${token}`,
              'content-type': 'application/json',
              'user-agent': 'agentic-rails-atlas-stats (read-only analytics)',
            },
            body: JSON.stringify({ query }),
          },
          30_000,
        );
        if (RETRY.has(res.status)) {
          if (attempt === 0) {
            await sleep(waitMs);
            continue;
          }
          throw new StatsError(
            res.status === 429
              ? 'Cloudflare GraphQL rate limit (HTTP 429) twice in a row; the limit is 300 queries per 5 minutes'
              : 'Cloudflare GraphQL was busy (HTTP 503) twice in a row; try again in a few minutes',
          );
        }
        if (!res.ok) throw new StatsError(redact(`Cloudflare GraphQL answered HTTP ${res.status}${statusHint(res.status)}: ${firstLine(res.text)}`));
        const body = res.json as GqlResponse<T> | null;
        const errors = body?.errors ?? [];
        // GraphQL reports errors with HTTP 200, so the errors array is checked on every answer.
        if (errors.length > 0) throw new StatsError(redact(`Cloudflare GraphQL error: ${errors.map((e) => e.message ?? 'unknown').join('; ')}`));
        if (!body?.data) throw new StatsError('Cloudflare GraphQL returned no data');
        return body.data;
      }
      throw new StatsError('Cloudflare GraphQL did not answer');
    },
  };
}

/** A GraphQL string literal. JSON string syntax is valid GraphQL string syntax. */
function lit(value: string): string {
  return JSON.stringify(value);
}

export function assertTag(name: string, value: string): string {
  if (!/^[0-9a-f]{32}$/.test(value)) throw new StatsError(`${name} must be 32 lowercase hex characters (copy it from the Cloudflare dashboard)`);
  return value;
}

export function assertHost(value: string): string {
  if (!/^(?=.{1,253}$)[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(value)) {
    throw new StatsError(`not a host name: ${value}`);
  }
  return value;
}

export function assertSiteTag(value: string): string {
  if (!/^[0-9a-zA-Z_-]{8,64}$/.test(value)) throw new StatsError('ATLAS_STATS_SITE_TAG has an unexpected form');
  return value;
}

export interface DatasetSettings {
  enabled: boolean;
  availableFields: string[];
  maxPageSize: number;
  maxNumberOfFields: number;
  /** Seconds. */
  notOlderThan: number;
  /** Seconds. */
  maxDuration: number;
}

const SETTINGS_FIELDS = 'enabled availableFields maxPageSize maxNumberOfFields notOlderThan maxDuration';

export async function edgeSettings(client: Client, zoneTag: string): Promise<DatasetSettings | null> {
  const data = await client.query<{ viewer: { zones: { settings: Record<string, DatasetSettings | null> }[] } }>(
    `{ viewer { zones(filter: { zoneTag: ${lit(assertTag('ATLAS_STATS_CF_ZONE_ID', zoneTag))} }) { settings { ${EDGE_DATASET} { ${SETTINGS_FIELDS} } } } } }`,
  );
  const zone = data.viewer.zones[0];
  if (!zone) throw new StatsError('zone not found: check ATLAS_STATS_CF_ZONE_ID and that the token covers this zone');
  return zone.settings[EDGE_DATASET] ?? null;
}

export async function rumSettings(client: Client, accountTag: string): Promise<DatasetSettings | null> {
  const data = await client.query<{ viewer: { accounts: { settings: Record<string, DatasetSettings | null> }[] } }>(
    `{ viewer { accounts(filter: { accountTag: ${lit(assertTag('ATLAS_STATS_CF_ACCOUNT_ID', accountTag))} }) { settings { ${RUM_DATASET} { ${SETTINGS_FIELDS} } } } } }`,
  );
  const account = data.viewer.accounts[0];
  if (!account) throw new StatsError('account not found: check ATLAS_STATS_CF_ACCOUNT_ID and that the token covers this account');
  return account.settings[RUM_DATASET] ?? null;
}

/**
 * Whether a dataset lists a field. The settings node names nested fields by their path with an
 * underscore ("dimensions_userAgent", "sum_visits"; Cloudflare's settings page), top-level fields
 * bare ("count"). A dotted path is accepted too.
 */
export function hasField(settings: DatasetSettings | null, name: string): boolean {
  if (!settings) return false;
  return settings.availableFields.some((f) => f === name || f.replace(/^[a-z]+[._]/, '') === name);
}

export interface EdgeFields {
  userAgent: boolean;
  category: boolean;
  contentType: boolean;
  host: boolean;
}

export function edgeFields(settings: DatasetSettings | null): EdgeFields {
  return {
    userAgent: hasField(settings, 'userAgent'),
    category: hasField(settings, 'verifiedBotCategory'),
    contentType: hasField(settings, 'edgeResponseContentTypeName'),
    host: hasField(settings, 'clientRequestHTTPHost'),
  };
}

function edgeFilter(host: string, w: TimeWindow, f: EdgeFields): string {
  const parts = [`datetime_geq: ${lit(isoSeconds(w.start))}`, `datetime_lt: ${lit(isoSeconds(w.end))}`, 'requestSource: "eyeball"'];
  if (f.host) parts.push(`clientRequestHTTPHost: ${lit(assertHost(host))}`);
  return parts.join(', ');
}

export function edgeQuery(zoneTag: string, host: string, w: TimeWindow, limit: number, f: EdgeFields): string {
  const filter = edgeFilter(host, w, f);
  const dims = ['userAgent', f.category ? 'verifiedBotCategory' : '', f.contentType ? 'edgeResponseContentTypeName' : ''].filter(Boolean).join(' ');
  const rows = f.userAgent
    ? `rows: ${EDGE_DATASET}(limit: ${Math.max(1, Math.floor(limit))}, orderBy: [count_DESC], filter: { ${filter} }) { count dimensions { ${dims} } }`
    : '';
  return `{ viewer { zones(filter: { zoneTag: ${lit(assertTag('ATLAS_STATS_CF_ZONE_ID', zoneTag))} }) { total: ${EDGE_DATASET}(limit: 1, filter: { ${filter} }) { count } ${rows} } } }`;
}

export interface EdgeRow {
  count: number;
  userAgent: string;
  /** undefined when the field is not available. */
  category?: string;
  /** undefined when the field is not available. */
  contentType?: string;
}

export interface EdgeResult {
  total: number;
  rows: EdgeRow[];
  /** true when the row query came back full, so smaller user agents may be missing. */
  rowLimitHit: boolean;
}

interface EdgeData {
  viewer: {
    zones: {
      total?: { count: number }[];
      rows?: { count: number; dimensions: { userAgent?: string; verifiedBotCategory?: string; edgeResponseContentTypeName?: string } }[];
    }[];
  };
}

export async function fetchEdge(client: Client, zoneTag: string, host: string, w: TimeWindow, limit: number, f: EdgeFields): Promise<EdgeResult> {
  const data = await client.query<EdgeData>(edgeQuery(zoneTag, host, w, limit, f));
  const zone = data.viewer.zones[0];
  if (!zone) throw new StatsError('zone not found: check ATLAS_STATS_CF_ZONE_ID and that the token covers this zone');
  const rows = (zone.rows ?? []).map((r) => {
    const row: EdgeRow = { count: r.count, userAgent: r.dimensions.userAgent ?? '' };
    if (f.category) row.category = r.dimensions.verifiedBotCategory ?? '';
    if (f.contentType) row.contentType = r.dimensions.edgeResponseContentTypeName ?? '';
    return row;
  });
  return { total: zone.total?.[0]?.count ?? 0, rows, rowLimitHit: f.userAgent && rows.length >= Math.floor(limit) };
}

export interface RumFields {
  bot: boolean;
  host: boolean;
  path: boolean;
  referer: boolean;
  visits: boolean;
}

export function rumFields(settings: DatasetSettings | null): RumFields {
  return {
    bot: hasField(settings, 'bot'),
    host: hasField(settings, 'requestHost'),
    path: hasField(settings, 'requestPath'),
    referer: hasField(settings, 'refererHost'),
    visits: hasField(settings, 'visits'),
  };
}

function rumFilter(host: string, siteTag: string | undefined, w: TimeWindow, f: RumFields, peopleOnly: boolean): string {
  const parts = [`datetime_geq: ${lit(isoSeconds(w.start))}`, `datetime_lt: ${lit(isoSeconds(w.end))}`];
  if (f.host) parts.push(`requestHost: ${lit(assertHost(host))}`);
  if (siteTag) parts.push(`siteTag: ${lit(assertSiteTag(siteTag))}`);
  if (peopleOnly && f.bot) parts.push('bot: 0');
  return parts.join(', ');
}

export function rumQuery(accountTag: string, host: string, siteTag: string | undefined, w: TimeWindow, f: RumFields): string {
  const fields = ['count', f.visits ? 'sum { visits }' : '', f.bot ? 'dimensions { bot }' : ''].filter(Boolean).join(' ');
  return `{ viewer { accounts(filter: { accountTag: ${lit(assertTag('ATLAS_STATS_CF_ACCOUNT_ID', accountTag))} }) { byBot: ${RUM_DATASET}(limit: 10, filter: { ${rumFilter(host, siteTag, w, f, false)} }) { ${fields} } } } }`;
}

export function rumTopQuery(accountTag: string, host: string, siteTag: string | undefined, w: TimeWindow, f: RumFields, limit = 10): string | null {
  const filter = rumFilter(host, siteTag, w, f, true);
  // Under same-origin, moving between the site's own pages reports the site as the referrer.
  const external = f.host ? `, refererHost_neq: ${lit(assertHost(host))}` : '';
  const parts: string[] = [];
  if (f.path) parts.push(`pages: ${RUM_DATASET}(limit: ${limit}, orderBy: [count_DESC], filter: { ${filter} }) { count dimensions { requestPath } }`);
  if (f.referer) parts.push(`referrers: ${RUM_DATASET}(limit: ${limit}, orderBy: [count_DESC], filter: { ${filter}${external} }) { count dimensions { refererHost } }`);
  if (parts.length === 0) return null;
  return `{ viewer { accounts(filter: { accountTag: ${lit(assertTag('ATLAS_STATS_CF_ACCOUNT_ID', accountTag))} }) { ${parts.join(' ')} } } }`;
}

export interface RumRow {
  count: number;
  visits: number | null;
  /** 1 when the beacon flagged the page load as a likely bot, 0 when not, null when unknown. */
  bot: number | null;
}

interface RumData {
  viewer: { accounts: { byBot?: { count: number; sum?: { visits?: number }; dimensions?: { bot?: number } }[] }[] };
}

export async function fetchRum(client: Client, accountTag: string, host: string, siteTag: string | undefined, w: TimeWindow, f: RumFields): Promise<RumRow[]> {
  const data = await client.query<RumData>(rumQuery(accountTag, host, siteTag, w, f));
  const account = data.viewer.accounts[0];
  if (!account) throw new StatsError('account not found: check ATLAS_STATS_CF_ACCOUNT_ID and that the token covers this account');
  return (account.byBot ?? []).map((r) => ({ count: r.count, visits: r.sum?.visits ?? null, bot: r.dimensions?.bot ?? null }));
}

export interface TopItem {
  name: string;
  count: number;
}

interface RumTopData {
  viewer: {
    accounts: {
      pages?: { count: number; dimensions: { requestPath?: string } }[];
      referrers?: { count: number; dimensions: { refererHost?: string } }[];
    }[];
  };
}

export async function fetchRumTop(
  client: Client,
  accountTag: string,
  host: string,
  siteTag: string | undefined,
  w: TimeWindow,
  f: RumFields,
): Promise<{ pages: TopItem[]; referrers: TopItem[] }> {
  const query = rumTopQuery(accountTag, host, siteTag, w, f);
  if (!query) return { pages: [], referrers: [] };
  const data = await client.query<RumTopData>(query);
  const account = data.viewer.accounts[0];
  if (!account) throw new StatsError('account not found: check ATLAS_STATS_CF_ACCOUNT_ID and that the token covers this account');
  return {
    pages: (account.pages ?? []).map((r) => ({ name: r.dimensions.requestPath ?? '', count: r.count })),
    referrers: (account.referrers ?? []).map((r) => ({ name: r.dimensions.refererHost || '(direct or no referrer)', count: r.count })),
  };
}
