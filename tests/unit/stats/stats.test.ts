import { existsSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createClient, edgeQuery, hasField, rumTopQuery, StatsError, type Client, type DatasetSettings, type Fetcher } from '../../../scripts/stats/cloudflare';
import { loadStatsEnv, readConfig } from '../../../scripts/stats/config';
import { buildReport } from '../../../scripts/stats/index';
import { change, formatReport, summarizePeople } from '../../../scripts/stats/report';
import { readSnapshots, sumPeople, writeSnapshot } from '../../../scripts/stats/snapshots';
import { DAY_MS, chunk, completeDays, dayWindow, isoSeconds, previous, rolling } from '../../../scripts/stats/windows';

const ZONE = 'a'.repeat(32);
const ACCOUNT = 'b'.repeat(32);
const TOKEN = 'secret-token-value';
const HOST = 'atlas.merces.ai';

const temps: string[] = [];
function tempDir(): string {
  const d = mkdtempSync(join(tmpdir(), 'atlas-stats-'));
  temps.push(d);
  return d;
}
afterEach(() => {
  for (const d of temps.splice(0)) rmSync(d, { recursive: true, force: true });
});

describe('windows', () => {
  const end = new Date('2026-11-15T06:00:00Z');

  it('builds rolling windows and the window before', () => {
    const w = rolling(end, 7);
    expect(isoSeconds(w.start)).toBe('2026-11-08T06:00:00Z');
    expect(isoSeconds(previous(w).start)).toBe('2026-11-01T06:00:00Z');
    expect(previous(w).end).toEqual(w.start);
  });

  it('splits a long window into pieces no longer than the dataset allows', () => {
    const pieces = chunk(rolling(end, 30), 7 * DAY_MS);
    expect(pieces).toHaveLength(5);
    expect(pieces[0]?.start).toEqual(rolling(end, 30).start);
    expect(pieces.at(-1)?.end).toEqual(end);
    expect(pieces.every((p) => p.end.getTime() - p.start.getTime() <= 7 * DAY_MS)).toBe(true);
  });

  it('lists complete UTC days, newest first, within retention', () => {
    expect(completeDays(end, 3)).toEqual(['2026-11-14', '2026-11-13', '2026-11-12']);
    expect(completeDays(end, 30, new Date('2026-11-12T12:00:00Z'))).toEqual(['2026-11-14', '2026-11-13']);
    expect(() => dayWindow('2026-02-30')).toThrow();
  });
});

describe('Cloudflare client', () => {
  function fetcherFrom(...answers: { status: number; json: unknown; text?: string }[]): { fetcher: Fetcher; calls: RequestInit[] } {
    const calls: RequestInit[] = [];
    const fetcher: Fetcher = async (_url, init) => {
      calls.push(init);
      const a = answers.shift() ?? { status: 500, json: null };
      return { status: a.status, ok: a.status >= 200 && a.status < 300, headers: new Headers(), json: a.json, text: a.text ?? JSON.stringify(a.json) };
    };
    return { fetcher, calls };
  }

  it('posts the query with a bearer token', async () => {
    const { fetcher, calls } = fetcherFrom({ status: 200, json: { data: { ok: 1 }, errors: null } });
    await expect(createClient(TOKEN, fetcher).query('{ x }')).resolves.toEqual({ ok: 1 });
    expect(calls[0]?.method).toBe('POST');
    expect(new Headers(calls[0]?.headers).get('authorization')).toBe(`Bearer ${TOKEN}`);
    expect(JSON.parse(String(calls[0]?.body))).toEqual({ query: '{ x }' });
  });

  it('treats GraphQL errors in a 200 answer as failures', async () => {
    const { fetcher } = fetcherFrom({ status: 200, json: { data: null, errors: [{ message: 'query time range is too large' }] } });
    const err = await createClient(TOKEN, fetcher).query('{ x }').catch((e: unknown) => e);
    expect(err).toBeInstanceOf(StatsError);
    expect(String(err)).toContain('query time range is too large');
  });

  it('never repeats the token, even when an answer quotes it', async () => {
    const { fetcher } = fetcherFrom({ status: 0, json: null, text: `Invalid header value: Bearer ${TOKEN}` });
    const err = await createClient(TOKEN, fetcher).query('{ x }').catch((e: unknown) => e);
    expect(String(err)).not.toContain(TOKEN);
    expect(String(err)).toContain('[token]');
  });

  it('explains authentication failures and retries once on 429 and 503', async () => {
    const denied = fetcherFrom({ status: 403, json: { errors: [{ message: 'forbidden' }] } });
    await expect(createClient(TOKEN, denied.fetcher).query('{ x }')).rejects.toThrow(/Account Analytics Read/);
    const limited = fetcherFrom({ status: 429, json: null }, { status: 200, json: { data: { ok: 2 } } });
    await expect(createClient(TOKEN, limited.fetcher, 0).query('{ x }')).resolves.toEqual({ ok: 2 });
    const busy = fetcherFrom({ status: 503, json: null }, { status: 503, json: null });
    await expect(createClient(TOKEN, busy.fetcher, 0).query('{ x }')).rejects.toThrow(/busy \(HTTP 503\) twice/);
    const twice = fetcherFrom({ status: 429, json: null }, { status: 429, json: null });
    await expect(createClient(TOKEN, twice.fetcher, 0).query('{ x }')).rejects.toThrow(/300 queries per 5 minutes/);
  });

  it('writes validated literals into the queries', () => {
    const w = rolling(new Date('2026-11-15T06:00:00Z'), 1);
    const q = edgeQuery(ZONE, HOST, w, 100, { userAgent: true, category: true, contentType: false, host: true });
    expect(q).toContain(`zoneTag: "${ZONE}"`);
    expect(q).toContain('requestSource: "eyeball"');
    expect(q).toContain(`clientRequestHTTPHost: "${HOST}"`);
    expect(q).toContain('datetime_geq: "2026-11-14T06:00:00Z"');
    expect(q).toContain('dimensions { userAgent verifiedBotCategory }');
    const top = rumTopQuery(ACCOUNT, HOST, undefined, w, { bot: true, host: true, path: true, referer: true, visits: true }) ?? '';
    expect(top).toContain(`refererHost_neq: "${HOST}"`);
    expect(top).toContain('bot: 0');
    const flags = { userAgent: true, category: false, contentType: false, host: true };
    expect(() => edgeQuery('not-a-zone', HOST, w, 1, flags)).toThrow(StatsError);
    expect(() => edgeQuery(ZONE, 'evil" } }', w, 1, flags)).toThrow(StatsError);
  });

  it('reads field names in the settings form, with an underscore path', () => {
    const s: DatasetSettings = {
      enabled: true,
      availableFields: ['count', 'avg_sampleInterval', 'dimensions_userAgent', 'dimensions_botScore', 'sum_visits'],
      maxPageSize: 1,
      maxNumberOfFields: 1,
      notOlderThan: 1,
      maxDuration: 1,
    };
    expect(hasField(s, 'userAgent')).toBe(true);
    expect(hasField(s, 'visits')).toBe(true);
    expect(hasField(s, 'count')).toBe(true);
    expect(hasField(s, 'bot')).toBe(false);
    expect(hasField({ ...s, availableFields: ['dimensions.userAgent'] }, 'userAgent')).toBe(true);
    expect(hasField(null, 'userAgent')).toBe(false);
  });
});

describe('config', () => {
  it('reads only ATLAS_STATS_ keys, in file order, without overriding the environment', () => {
    const root = tempDir();
    writeFileSync(join(root, '.env.local'), `ATLAS_STATS_CF_TOKEN=from-local\nCLOUDFLARE_API_TOKEN=deploy-token\n`);
    writeFileSync(join(root, '.env'), `ATLAS_STATS_CF_TOKEN=from-env\nATLAS_STATS_CF_ZONE_ID=${ZONE}\n`);
    const env: Record<string, string | undefined> = { ATLAS_STATS_CF_ACCOUNT_ID: ACCOUNT };
    expect(loadStatsEnv(root, env)).toEqual(['.env.local', '.env']);
    expect(env.ATLAS_STATS_CF_TOKEN).toBe('from-local');
    expect(env.ATLAS_STATS_CF_ZONE_ID).toBe(ZONE);
    expect(env.CLOUDFLARE_API_TOKEN).toBeUndefined();
    expect(readConfig(env).config).toMatchObject({ token: 'from-local', zoneId: ZONE, accountId: ACCOUNT, host: HOST });
  });

  it('reports what is missing or malformed, including a token broken over lines', () => {
    expect(readConfig({}).problems).toContain('ATLAS_STATS_CF_TOKEN is not set');
    expect(readConfig({ ATLAS_STATS_CF_TOKEN: 't', ATLAS_STATS_CF_ZONE_ID: 'xyz' }).problems).toContain('ATLAS_STATS_CF_ZONE_ID must be 32 hex characters');
    expect(readConfig({ ATLAS_STATS_CF_TOKEN: 'abc\ndef', ATLAS_STATS_CF_ZONE_ID: ZONE }).problems[0]).toMatch(/one line/);
  });
});

describe('report helpers', () => {
  it('computes percent change only against a known, non-zero previous value', () => {
    expect(change(150, 100)).toBe(50);
    expect(change(5, 0)).toBeNull();
    expect(change(null, 10)).toBeNull();
  });

  it('reads a quiet window as zero, not as unknown', () => {
    expect(summarizePeople([[]], { bot: true, visits: true })).toEqual({ pageViews: 0, visits: 0, botFlaggedPageViews: 0 });
    expect(summarizePeople([[]], { bot: false, visits: false })).toEqual({ pageViews: 0, visits: null, botFlaggedPageViews: null });
  });

  it('adds people across days and keeps unknown parts unknown', () => {
    expect(sumPeople([{ pageViews: 2, visits: 1, botFlaggedPageViews: 0 }, { pageViews: 3, visits: 2, botFlaggedPageViews: 1 }])).toEqual({ pageViews: 5, visits: 3, botFlaggedPageViews: 1 });
    expect(sumPeople([{ pageViews: 2, visits: null, botFlaggedPageViews: null }, null])).toBeNull();
  });
});

interface FakeOptions {
  edgeFields?: string[];
  rumFields?: string[];
  maxDuration?: number;
  maxPageSize?: number;
  edgeTotal?: number;
  failEdgeSettings?: boolean;
  failRumSettings?: boolean;
}

const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const EDGE_ROWS = [
  { count: 300, dimensions: { userAgent: 'Mozilla/5.0 (compatible; GPTBot/1.2)', verifiedBotCategory: 'AI Crawler', edgeResponseContentTypeName: 'html' } },
  { count: 50, dimensions: { userAgent: 'Mozilla/5.0 (compatible; ClaudeBot/1.0)', verifiedBotCategory: '', edgeResponseContentTypeName: 'html' } },
  { count: 200, dimensions: { userAgent: CHROME, verifiedBotCategory: '', edgeResponseContentTypeName: 'html' } },
  { count: 400, dimensions: { userAgent: CHROME, verifiedBotCategory: '', edgeResponseContentTypeName: 'css' } },
  { count: 50, dimensions: { userAgent: 'curl/8.7.1', verifiedBotCategory: '', edgeResponseContentTypeName: 'html' } },
];

/** A fake Cloudflare that answers by query shape, in the settings node's documented field form. */
function fakeClient(log: string[], o: FakeOptions = {}): Client {
  const settings = (fields: string[]): DatasetSettings => ({
    enabled: true,
    availableFields: fields,
    maxPageSize: o.maxPageSize ?? 10_000,
    maxNumberOfFields: 30,
    notOlderThan: 31 * 86_400,
    maxDuration: o.maxDuration ?? 30 * 86_400,
  });
  const edgeFields = o.edgeFields ?? ['count', 'dimensions_userAgent', 'dimensions_verifiedBotCategory', 'dimensions_edgeResponseContentTypeName', 'dimensions_clientRequestHTTPHost'];
  const rumFields = o.rumFields ?? ['count', 'sum_visits', 'dimensions_bot', 'dimensions_requestHost', 'dimensions_requestPath', 'dimensions_refererHost'];
  return {
    async query<T>(q: string): Promise<T> {
      log.push(q);
      if (q.includes('settings') && q.includes('zones')) {
        if (o.failEdgeSettings) throw new StatsError('Cloudflare GraphQL answered HTTP 403');
        return { viewer: { zones: [{ settings: { httpRequestsAdaptiveGroups: settings(edgeFields) } }] } } as T;
      }
      if (q.includes('settings') && q.includes('accounts')) {
        if (o.failRumSettings) throw new StatsError('Cloudflare GraphQL answered HTTP 403');
        return { viewer: { accounts: [{ settings: { rumPageloadEventsAdaptiveGroups: settings(rumFields) } }] } } as T;
      }
      if (q.includes('total: httpRequestsAdaptiveGroups')) {
        const limit = Number(/rows: httpRequestsAdaptiveGroups\(limit: (\d+)/.exec(q)?.[1] ?? '0');
        const rows = q.includes('rows:') ? EDGE_ROWS.slice(0, limit) : undefined;
        return { viewer: { zones: [{ total: [{ count: o.edgeTotal ?? 1000 }], ...(rows ? { rows } : {}) }] } } as T;
      }
      if (q.includes('byBot:')) {
        return { viewer: { accounts: [{ byBot: [{ count: 120, sum: { visits: 100 }, dimensions: { bot: 0 } }, { count: 5, sum: { visits: 5 }, dimensions: { bot: 1 } }] }] } } as T;
      }
      if (q.includes('pages:')) {
        return { viewer: { accounts: [{ pages: [{ count: 40, dimensions: { requestPath: '/p/x402/' } }], referrers: [{ count: 9, dimensions: { refererHost: 'chatgpt.com' } }] }] } } as T;
      }
      throw new Error(`unexpected query: ${q}`);
    },
  };
}

describe('buildReport', () => {
  const config = { token: TOKEN, zoneId: ZONE, accountId: ACCOUNT, siteTag: null, host: HOST };
  const now = new Date('2026-11-15T06:00:30Z');

  it('splits people, AI bots, other bots and browser-like traffic for each window', async () => {
    const log: string[] = [];
    const r = await buildReport(fakeClient(log), config, now, { snapshots: false, dir: tempDir() });
    const day = r.windows['24h'];
    expect(r.errors).toEqual([]);
    expect(r.setupFailed).toBe(false);
    expect(day?.people).toEqual({ pageViews: 120, visits: 100, botFlaggedPageViews: 5 });
    expect(day?.edge?.classes.aiTraining).toEqual({ requests: 350, pages: 350, claimed: 50 });
    expect(day?.edge?.classes.browserLike).toEqual({ requests: 600, pages: 200, claimed: 0 });
    expect(day?.edge?.classes.unknownAutomated.requests).toBe(50);
    expect(day?.headline.aiBots.requests).toBe(350);
    expect(day?.edge?.notClassified).toBe(0);
    expect(r.changes['24h']).toEqual({ peoplePageViews: 0, aiBotRequests: 0, otherBotRequests: 0 });
    expect(r.topAiAgents7d.map((a) => a.agent)).toEqual(['GPTBot', 'ClaudeBot']);
    expect(r.topReferrers7d).toEqual([{ name: 'chatgpt.com', count: 9 }]);
    expect(log.some((q) => q.includes(`clientRequestHTTPHost: "${HOST}"`) && q.includes('requestSource: "eyeball"'))).toBe(true);
    const text = formatReport(r);
    expect(text).toContain('AI training crawlers');
    expect(text).toContain('GPTBot (OpenAI)');
    expect(text).not.toContain(TOKEN);
  });

  it('adds up a window that the dataset makes it split into several queries', async () => {
    const r = await buildReport(fakeClient([], { maxDuration: 7 * 86_400 }), config, now, { snapshots: false, dir: tempDir() });
    expect(r.windows['30d']?.edge?.total).toBe(5000);
    expect(r.windows['30d']?.edge?.classes.aiTraining.requests).toBe(1750);
    expect(r.windows['24h']?.edge?.total).toBe(1000);
  });

  it('counts requests beyond the row limit as not classified', async () => {
    const r = await buildReport(fakeClient([], { maxPageSize: 4, edgeTotal: 1200 }), config, now, { snapshots: false, dir: tempDir() });
    expect(r.windows['24h']?.edge?.rowLimitHit).toBe(true);
    expect(r.windows['24h']?.edge?.notClassified).toBe(250);
  });

  it('shows n/a, not zero, when the edge dataset has no userAgent field', async () => {
    const r = await buildReport(fakeClient([], { edgeFields: ['count', 'dimensions_clientRequestHTTPHost'] }), config, now, { snapshots: false, dir: tempDir() });
    const day = r.windows['24h'];
    expect(day?.edge?.classifiable).toBe(false);
    expect(day?.edge?.notClassified).toBe(1000);
    expect(day?.headline.aiBots.requests).toBeNull();
    expect(r.notes.some((n) => n.includes('No userAgent field'))).toBe(true);
    expect(formatReport(r)).toMatch(/AI training crawlers\s+n\/a/);
  });

  it('writes one snapshot per complete day, per host, and fills each day only once', async () => {
    const base = tempDir();
    const r = await buildReport(fakeClient([]), config, now, { snapshots: true, dir: base });
    expect(r.snapshots.written).toHaveLength(30);
    expect(r.snapshots.written.at(-1)).toBe('2026-11-14');
    expect(readdirSync(join(base, HOST))).toHaveLength(30);
    expect(readSnapshots(join(base, HOST), HOST).get('2026-11-14')?.edge?.total).toBe(1000);
    expect(r.notes.some((n) => n.includes('60 complete days'))).toBe(true);
    const again = await buildReport(fakeClient([]), config, now, { snapshots: true, dir: base });
    expect(again.snapshots.written).toEqual([]);
    const other = await buildReport(fakeClient([]), { ...config, host: 'merces.ai' }, now, { snapshots: true, dir: base });
    expect(other.snapshots.written).toHaveLength(30);
    expect(readdirSync(join(base, HOST))).toHaveLength(30);
    expect(existsSync(join(base, 'merces.ai', '2026-10-16.json'))).toBe(true);
  });

  it('writes no snapshot while a configured dataset is unavailable, and says so', async () => {
    const base = tempDir();
    const partial = await buildReport(fakeClient([], { failRumSettings: true }), config, now, { snapshots: true, dir: base });
    expect(partial.snapshots.written).toEqual([]);
    expect(existsSync(join(base, HOST))).toBe(false);
    expect(partial.setupFailed).toBe(false);
    expect(partial.errors.some((e) => e.startsWith('snapshots not written'))).toBe(true);
    const none = await buildReport(fakeClient([], { failEdgeSettings: true, failRumSettings: true }), config, now, { snapshots: true, dir: base });
    expect(none.setupFailed).toBe(true);
  });

  it('compares the last 30 complete days with the 30 before once 60 days are saved', async () => {
    const base = tempDir();
    const dir = join(base, HOST);
    const recent = await buildReport(fakeClient([]), config, now, { snapshots: true, dir: base });
    expect(recent.changes['30d']).toBeUndefined();
    for (const day of completeDays(now, 60).slice(30)) {
      writeSnapshot(dir, { schema: 1, day, host: HOST, fetchedAt: now.toISOString(), people: { pageViews: 60, visits: 50, botFlaggedPageViews: 0 }, edge: readSnapshots(dir, HOST).get('2026-11-14')?.edge ?? null });
    }
    const r = await buildReport(fakeClient([]), config, now, { snapshots: true, dir: base });
    expect(r.changes['30d']).toEqual({ peoplePageViews: 100, aiBotRequests: 0, otherBotRequests: 0 });
  });
});
