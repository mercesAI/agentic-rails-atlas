/**
 * `pnpm stats`: read-only traffic numbers for atlas.merces.ai from Cloudflare.
 *
 *   pnpm stats            table: people, bots and AI bots for 24h, 7d and 30d
 *   pnpm stats --json     the same as JSON (for the daily brief in Claude Code)
 *   pnpm stats --check    checks the token, the ids and the dataset fields, then stops
 *   pnpm stats --no-snapshots   skips the daily files in work/stats/daily/
 *   pnpm stats --host <name>    another host in the zone
 *
 * The settings go in .env (keys in .env.example; see config.ts). Exit codes: 0 fine; 1 setup problem
 * (missing settings, or no configured dataset usable with this token); 2 some numbers could not
 * be fetched (the rest are still printed).
 */
import { join } from 'node:path';
import { ROOT, isMain, parseArgs, rel } from '../lib/io';
import { AI_CLASSES } from './classify';
import {
  createClient,
  edgeFields,
  edgeSettings,
  fetchEdge,
  fetchRum,
  fetchRumTop,
  rumFields,
  rumSettings,
  StatsError,
  type Client,
  type DatasetSettings,
  type EdgeFields,
  type RumFields,
} from './cloudflare';
import { loadStatsEnv, readConfig, type StatsConfig } from './config';
import { changesOf, formatReport, headlineOf, summarizeEdge, summarizePeople, type EdgeSummary, type PeopleSummary, type StatsReport, type WindowReport } from './report';
import { readSnapshots, sumEdge, sumPeople, writeSnapshot, type DailySnapshot } from './snapshots';
import { DAY_MS, chunk, completeDays, dayWindow, isoSeconds, previous, rolling, windowEnd, type TimeWindow, type WindowKey } from './windows';

export const SNAPSHOT_DIR = join(ROOT, 'work', 'stats', 'daily');
const DEFAULT_MAX_SECONDS = 30 * 86_400;
const DEFAULT_PAGE_SIZE = 10_000;

const message = (e: unknown): string => (e instanceof Error ? e.message : String(e));

interface Datasets {
  edge: DatasetSettings | null;
  rum: DatasetSettings | null;
  ef: EdgeFields;
  rf: RumFields;
}

class Fetchers {
  constructor(
    private client: Client,
    private config: StatsConfig,
    private ds: Datasets,
    private now: Date,
  ) {}

  edgeOldest(): Date | null {
    const s = this.ds.edge?.notOlderThan;
    return s ? new Date(this.now.getTime() - s * 1000 + 60_000) : null;
  }

  rumOldest(): Date | null {
    const s = this.ds.rum?.notOlderThan;
    return s ? new Date(this.now.getTime() - s * 1000 + 60_000) : null;
  }

  async edge(w: TimeWindow): Promise<EdgeSummary | null> {
    const zone = this.config.zoneId;
    if (!zone || !this.ds.edge?.enabled) return null;
    const maxMs = (this.ds.edge.maxDuration || DEFAULT_MAX_SECONDS) * 1000;
    const limit = Math.min(this.ds.edge.maxPageSize || DEFAULT_PAGE_SIZE, DEFAULT_PAGE_SIZE);
    const results = [];
    for (const piece of chunk(w, maxMs)) results.push(await fetchEdge(this.client, zone, this.config.host, piece, limit, this.ds.ef));
    return summarizeEdge(results, this.ds.ef);
  }

  /** true when every configured part can be fetched: snapshots are written only then. */
  usable(): { ok: boolean; why: string[] } {
    const why: string[] = [];
    if (this.config.zoneId && !this.ds.edge?.enabled) why.push('the edge dataset is unavailable');
    if (this.config.accountId && !this.ds.rum?.enabled) why.push('the Web Analytics dataset is unavailable');
    return { ok: why.length === 0, why };
  }

  async people(w: TimeWindow): Promise<PeopleSummary | null> {
    const account = this.config.accountId;
    if (!account || !this.ds.rum?.enabled) return null;
    const maxMs = (this.ds.rum.maxDuration || DEFAULT_MAX_SECONDS) * 1000;
    const rows = [];
    for (const piece of chunk(w, maxMs)) rows.push(await fetchRum(this.client, account, this.config.host, this.config.siteTag ?? undefined, piece, this.ds.rf));
    return summarizePeople(rows, this.ds.rf);
  }
}

/** Moves a window's start up to the dataset's retention edge, and says so. */
function clampStart(w: TimeWindow, oldest: Date | null, label: string, notes: string[]): TimeWindow {
  if (!oldest || w.start >= oldest) return w;
  const days = Math.round(((w.end.getTime() - oldest.getTime()) / DAY_MS) * 10) / 10;
  notes.push(`${label} covers only the last ${days} days that the dataset keeps.`);
  return { start: oldest, end: w.end };
}

async function windowReport(key: WindowReport['key'], w: TimeWindow, f: Fetchers, notes: string[]): Promise<WindowReport> {
  const errors: string[] = [];
  let edge: EdgeSummary | null = null;
  let people: PeopleSummary | null = null;
  try {
    edge = await f.edge(clampStart(w, f.edgeOldest(), `The ${key} edge window`, notes));
  } catch (e) {
    errors.push(`edge ${key}: ${message(e)}`);
  }
  try {
    people = await f.people(clampStart(w, f.rumOldest(), `The ${key} people window`, notes));
  } catch (e) {
    errors.push(`people ${key}: ${message(e)}`);
  }
  return { key, start: isoSeconds(w.start), end: isoSeconds(w.end), people, edge, headline: headlineOf(people, edge), errors };
}

async function loadDatasets(client: Client, config: StatsConfig, errors: string[]): Promise<Datasets> {
  let edge: DatasetSettings | null = null;
  let rum: DatasetSettings | null = null;
  if (config.zoneId) {
    try {
      edge = await edgeSettings(client, config.zoneId);
      if (!edge?.enabled) errors.push('the edge dataset httpRequestsAdaptiveGroups is not enabled for this zone and token');
    } catch (e) {
      errors.push(`edge settings: ${message(e)}`);
    }
  }
  if (config.accountId) {
    try {
      rum = await rumSettings(client, config.accountId);
      if (!rum?.enabled) errors.push('the Web Analytics dataset rumPageloadEventsAdaptiveGroups is not enabled for this account and token');
    } catch (e) {
      errors.push(`people settings: ${message(e)}`);
    }
  }
  return { edge, rum, ef: edgeFields(edge), rf: rumFields(rum) };
}

function fieldNotes(config: StatsConfig, ds: Datasets): string[] {
  const notes = [
    'People are page loads that ran the Cloudflare beacon; blockers and the EU exclusion (when enabled) stop it, so read them as a lower bound.',
    'Edge numbers count requests, not people. HTML pages include the service worker fetching every page once per new reader and per deploy.',
  ];
  if (config.zoneId && ds.edge && !ds.ef.userAgent) notes.push('No userAgent field in the edge dataset: requests cannot be classified, so the bot classes show n/a.');
  if (config.zoneId && ds.edge && !ds.ef.host) notes.push('The edge dataset offers no host field here, so edge numbers cover every host in the zone.');
  if (config.zoneId && ds.edge && !ds.ef.category) notes.push('No verified-bot category field: bot user agents are counted but not checked against Cloudflare verification.');
  if (config.zoneId && ds.edge && !ds.ef.contentType) notes.push('No content-type field: HTML page counts are not available.');
  if (config.accountId && ds.rum && !ds.rf.host && !config.siteTag) notes.push('Web Analytics has no host field and no ATLAS_STATS_SITE_TAG is set, so people numbers cover every site in the account.');
  if (config.accountId && ds.rum && !ds.rf.bot) notes.push('No bot flag in Web Analytics: people page views include loads the beacon would flag as bots.');
  if (!config.zoneId) notes.push('ATLAS_STATS_CF_ZONE_ID is not set: no bot or AI-bot numbers.');
  if (!config.accountId) notes.push('ATLAS_STATS_CF_ACCOUNT_ID is not set: no people numbers.');
  return notes;
}

async function updateSnapshots(
  f: Fetchers,
  config: StatsConfig,
  now: Date,
  existing: Map<string, DailySnapshot>,
  dir: string,
  errors: string[],
): Promise<string[]> {
  const written: string[] = [];
  const usable = f.usable();
  if (!usable.ok) {
    // Writing now would freeze empty parts into files that are never fetched again.
    errors.push(`snapshots not written: ${usable.why.join(' and ')}`);
    return written;
  }
  const rumOldest = f.rumOldest();
  const complete = (s: DailySnapshot): boolean =>
    (!config.zoneId || s.edge !== null) && (!config.accountId || s.people !== null || Boolean(rumOldest && dayWindow(s.day).start < rumOldest));
  for (const day of completeDays(now, 30, f.edgeOldest() ?? undefined)) {
    const have = existing.get(day);
    if (have && complete(have)) continue;
    const w = dayWindow(day);
    try {
      const edge = await f.edge(w);
      const people = rumOldest && w.start < rumOldest ? null : await f.people(w);
      const snap: DailySnapshot = { schema: 1, day, host: config.host, fetchedAt: now.toISOString(), people, edge };
      writeSnapshot(dir, snap);
      existing.set(day, snap);
      written.push(day);
    } catch (e) {
      errors.push(`snapshot ${day}: ${message(e)}`);
    }
  }
  return written.sort();
}

function snapshotChanges(now: Date, snaps: Map<string, DailySnapshot>, report: StatsReport): void {
  const days = completeDays(now, 60);
  const recent = days.slice(0, 30).map((d) => snaps.get(d));
  const before = days.slice(30).map((d) => snaps.get(d));
  const missing = [...recent, ...before].filter((s) => !s).length;
  if (missing > 0) {
    report.notes.push(`The 30d change needs 60 complete days of snapshots; ${missing} are missing (one is added per day).`);
    return;
  }
  const cur = headlineOf(sumPeople(recent.map((s) => s?.people ?? null)), sumEdge(recent.map((s) => s?.edge ?? null)));
  const prev = headlineOf(sumPeople(before.map((s) => s?.people ?? null)), sumEdge(before.map((s) => s?.edge ?? null)));
  report.changes['30d'] = changesOf(cur, prev);
  report.notes.push('The 30d change compares the last 30 complete UTC days with the 30 days before, from snapshots.');
}

export async function buildReport(
  client: Client,
  config: StatsConfig,
  now: Date,
  options: { snapshots: boolean; dir?: string },
): Promise<StatsReport> {
  const dir = join(options.dir ?? SNAPSHOT_DIR, config.host);
  const errors: string[] = [];
  const ds = await loadDatasets(client, config, errors);
  const f = new Fetchers(client, config, ds, now);
  const notes = fieldNotes(config, ds);
  const end = windowEnd(now);
  const report: StatsReport = {
    host: config.host,
    generatedAt: isoSeconds(end),
    windows: {},
    previous: {},
    changes: {},
    topAiAgents7d: [],
    topPages7d: [],
    topReferrers7d: [],
    snapshots: { dir: rel(ROOT, dir), days: 0, written: [], oldest: null },
    setupFailed: !f.usable().ok && (!config.zoneId || !ds.edge?.enabled) && (!config.accountId || !ds.rum?.enabled),
    fields: {
      edgeUserAgent: ds.ef.userAgent,
      edgeVerifiedBotCategory: ds.ef.category,
      edgeContentType: ds.ef.contentType,
      edgeHost: ds.ef.host,
      rumBotFlag: ds.rf.bot,
      rumHost: ds.rf.host,
      rumPath: ds.rf.path,
      rumReferer: ds.rf.referer,
      rumVisits: ds.rf.visits,
    },
    notes,
    errors,
  };
  for (const key of ['24h', '7d', '30d'] as const satisfies readonly WindowKey[]) {
    const days = key === '24h' ? 1 : key === '7d' ? 7 : 30;
    const w = rolling(end, days);
    const cur = await windowReport(key, w, f, notes);
    report.windows[key] = cur;
    errors.push(...cur.errors);
    if (key !== '30d') {
      const prev = await windowReport(`previous ${key}`, previous(w), f, notes);
      report.previous[key] = prev;
      errors.push(...prev.errors);
      report.changes[key] = changesOf(cur.headline, prev.headline);
    }
  }
  const week = report.windows['7d'];
  report.topAiAgents7d = (week?.edge?.agents ?? []).filter((a) => AI_CLASSES.includes(a.cls));
  if (config.accountId && ds.rum?.enabled) {
    const w = rolling(end, 7);
    const maxSeconds = ds.rum.maxDuration || DEFAULT_MAX_SECONDS;
    if (maxSeconds * 1000 >= w.end.getTime() - w.start.getTime()) {
      try {
        const top = await fetchRumTop(client, config.accountId, config.host, config.siteTag ?? undefined, w, ds.rf);
        report.topPages7d = top.pages;
        report.topReferrers7d = top.referrers;
      } catch (e) {
        errors.push(`top pages and referrers: ${message(e)}`);
      }
    }
  }
  const snaps = readSnapshots(dir, config.host);
  if (options.snapshots) report.snapshots.written = await updateSnapshots(f, config, now, snaps, dir, errors);
  const sorted = [...snaps.keys()].sort();
  report.snapshots.days = sorted.length;
  report.snapshots.oldest = sorted[0] ?? null;
  snapshotChanges(now, snaps, report);
  report.notes = [...new Set(report.notes)];
  return report;
}

async function runCheck(client: Client, config: StatsConfig, loadedFrom: string[]): Promise<number> {
  const errors: string[] = [];
  const ds = await loadDatasets(client, config, errors);
  const yes = (b: boolean): string => (b ? 'yes' : 'no');
  const days = (s: number | undefined): string => (s ? `${Math.round((s / 86_400) * 10) / 10} days` : 'n/a');
  const out = [
    `Settings read from: ${loadedFrom.length ? loadedFrom.join(', ') : 'the environment only'}`,
    `Host: ${config.host}`,
    `Token: set`,
    `Zone id: ${config.zoneId ? 'set' : 'not set (no bot numbers)'}`,
    `Account id: ${config.accountId ? 'set' : 'not set (no people numbers)'}`,
    `Web Analytics site tag: ${config.siteTag ? 'set' : 'not set (filtering by host instead, if the field exists)'}`,
  ];
  if (config.zoneId) {
    out.push(
      `Edge dataset: enabled ${yes(Boolean(ds.edge?.enabled))}, keeps ${days(ds.edge?.notOlderThan)}, up to ${days(ds.edge?.maxDuration)} per query, ${ds.edge?.maxPageSize ?? 'n/a'} rows per page`,
      `  fields: userAgent ${yes(ds.ef.userAgent)}, verifiedBotCategory ${yes(ds.ef.category)}, edgeResponseContentTypeName ${yes(ds.ef.contentType)}, clientRequestHTTPHost ${yes(ds.ef.host)}`,
    );
  }
  if (config.accountId) {
    out.push(
      `Web Analytics dataset: enabled ${yes(Boolean(ds.rum?.enabled))}, keeps ${days(ds.rum?.notOlderThan)}, up to ${days(ds.rum?.maxDuration)} per query`,
      `  fields: bot ${yes(ds.rf.bot)}, requestHost ${yes(ds.rf.host)}, requestPath ${yes(ds.rf.path)}, refererHost ${yes(ds.rf.referer)}, visits ${yes(ds.rf.visits)}`,
    );
  }
  const f = new Fetchers(client, config, ds, new Date());
  const w = rolling(windowEnd(new Date()), 1);
  try {
    const edge = await f.edge(w);
    if (edge) out.push(`Test query, edge, last 24h: ${edge.total.toLocaleString('en-US')} requests, ${edge.agents.length} known bot tokens seen`);
  } catch (e) {
    errors.push(`edge test query: ${message(e)}`);
  }
  try {
    const people = await f.people(w);
    if (people) out.push(`Test query, people, last 24h: ${people.pageViews.toLocaleString('en-US')} page views`);
  } catch (e) {
    errors.push(`people test query: ${message(e)}`);
  }
  if (config.zoneId && ds.edge?.enabled && !ds.ef.userAgent) errors.push('the edge dataset has no userAgent field, so bots cannot be classified');
  const warnings: string[] = [];
  if (config.zoneId && ds.edge?.enabled && !ds.ef.host) warnings.push('no clientRequestHTTPHost field: edge numbers will cover every host in the zone');
  if (config.accountId && ds.rum?.enabled && !ds.rf.host && !config.siteTag) warnings.push('no requestHost field and no site tag: people numbers will cover every Web Analytics site in the account');
  for (const e of errors) out.push(`Problem: ${e}`);
  for (const w of warnings) out.push(`Warning: ${w}`);
  out.push(
    errors.length
      ? 'Result: fix the problems above. The settings go in .env (keys in .env.example); the token needs Account Analytics Read and zone Analytics Read.'
      : warnings.length
        ? 'Result: ready, with the warnings above. Run pnpm stats.'
        : 'Result: ready. Run pnpm stats.',
  );
  console.log(out.join('\n'));
  const unusable = (!config.zoneId || !ds.edge?.enabled) && (!config.accountId || !ds.rum?.enabled);
  return unusable ? 1 : errors.length ? 2 : 0;
}

async function main(): Promise<void> {
  const { flags, values } = parseArgs(process.argv.slice(2));
  const loadedFrom = loadStatsEnv(ROOT);
  const { config, problems } = readConfig(process.env, values.get('host'));
  if (!config) {
    console.error(['pnpm stats is not set up yet:', ...problems.map((p) => `- ${p}`), 'Put ATLAS_STATS_CF_TOKEN and ATLAS_STATS_CF_ZONE_ID and/or ATLAS_STATS_CF_ACCOUNT_ID in .env (keys in .env.example; the token needs Account Analytics Read and zone Analytics Read), then run pnpm stats --check.'].join('\n'));
    process.exitCode = 1;
    return;
  }
  const client = createClient(config.token);
  if (flags.has('check')) {
    process.exitCode = await runCheck(client, config, loadedFrom);
    return;
  }
  const report = await buildReport(client, config, new Date(), { snapshots: !flags.has('no-snapshots') });
  console.log(flags.has('json') ? JSON.stringify(report, null, 2) : formatReport(report));
  if (report.setupFailed) process.exitCode = 1;
  else if (report.errors.length) process.exitCode = 2;
}

if (isMain(import.meta.url)) {
  main().catch((e: unknown) => {
    console.error(e instanceof StatsError ? `pnpm stats: ${e.message}` : e);
    process.exitCode = 2;
  });
}
