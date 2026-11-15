/**
 * Turns Cloudflare rows into the `pnpm stats` report and formats it. Pure: no network, no files.
 */
import { AI_CLASSES, CLASS_LABELS, NON_AI_BOT_CLASSES, TRAFFIC_CLASSES, classify, type TrafficClass } from './classify';
import type { EdgeResult, RumRow, TopItem } from './cloudflare';
import type { WindowKey } from './windows';

export interface ClassTotals {
  requests: number;
  /** Requests answered with HTML (pages), or null when the content-type field is not available. */
  pages: number | null;
  /** Requests whose user agent names a known bot without a Cloudflare verified-bot category. */
  claimed: number | null;
}

export interface AgentTotals extends ClassTotals {
  agent: string;
  operator: string;
  cls: TrafficClass;
}

export interface EdgeSummary {
  total: number;
  /** false when the dataset has no userAgent field: then no class can be counted. */
  classifiable: boolean;
  /** Requests in rows that were classified. */
  classified: number;
  /** Requests beyond the row limit, which could not be classified (0 when the limit was not hit). */
  notClassified: number;
  rowLimitHit: boolean;
  classes: Record<TrafficClass, ClassTotals>;
  agents: AgentTotals[];
}

export interface PeopleSummary {
  pageViews: number;
  visits: number | null;
  /** Page loads the beacon flagged as likely bots, or null when the flag is not available. */
  botFlaggedPageViews: number | null;
}

export interface Headline {
  people: { pageViews: number | null; visits: number | null };
  aiBots: { requests: number | null; pages: number | null };
  otherBots: { requests: number | null; pages: number | null };
  browserLike: { requests: number | null; pages: number | null };
}

export interface WindowReport {
  key: WindowKey | `previous ${WindowKey}` | 'day';
  start: string;
  end: string;
  people: PeopleSummary | null;
  edge: EdgeSummary | null;
  headline: Headline;
  errors: string[];
}

const HTML = /html/i;

function emptyTotals(withPages: boolean, withClaims: boolean): ClassTotals {
  return { requests: 0, pages: withPages ? 0 : null, claimed: withClaims ? 0 : null };
}

function add(t: ClassTotals, count: number, isPage: boolean | null, claimed: boolean | null): void {
  t.requests += count;
  if (t.pages !== null && isPage) t.pages += count;
  if (t.claimed !== null && claimed) t.claimed += count;
}

/** Combines the results of one window (several when the window was split into chunks). */
export function summarizeEdge(results: EdgeResult[], fields: { userAgent: boolean; category: boolean; contentType: boolean }): EdgeSummary {
  const classes = Object.fromEntries(TRAFFIC_CLASSES.map((c) => [c, emptyTotals(fields.contentType, fields.category)])) as Record<TrafficClass, ClassTotals>;
  const agents = new Map<string, AgentTotals>();
  let total = 0;
  let classified = 0;
  let rowLimitHit = false;
  for (const r of results) {
    total += r.total;
    rowLimitHit ||= r.rowLimitHit;
    for (const row of r.rows) {
      const c = classify(row.userAgent, fields.category ? (row.category ?? '') : undefined);
      const isPage = fields.contentType ? HTML.test(row.contentType ?? '') : null;
      const claimed = c.verified === false && c.agent !== null;
      classified += row.count;
      add(classes[c.cls], row.count, isPage, fields.category ? claimed : null);
      if (c.agent && c.operator) {
        const a = agents.get(c.agent) ?? { agent: c.agent, operator: c.operator, cls: c.cls, ...emptyTotals(fields.contentType, fields.category) };
        add(a, row.count, isPage, fields.category ? claimed : null);
        agents.set(c.agent, a);
      }
    }
  }
  return {
    total,
    classifiable: fields.userAgent,
    classified,
    // Without the userAgent field nothing is classified; with it, only rows past the limit are missed.
    notClassified: !fields.userAgent ? total : rowLimitHit ? Math.max(0, total - classified) : 0,
    rowLimitHit,
    classes,
    agents: [...agents.values()].sort((a, b) => b.requests - a.requests || a.agent.localeCompare(b.agent)),
  };
}

/**
 * Combines Web Analytics rows of one window. With the bot flag, people are the unflagged loads.
 * Whether a value is known depends on the dataset's fields, not on rows: a quiet window is 0.
 */
export function summarizePeople(rowSets: RumRow[][], fields: { bot: boolean; visits: boolean }): PeopleSummary {
  const rows = rowSets.flat();
  const people = fields.bot ? rows.filter((r) => r.bot === 0) : rows;
  return {
    pageViews: people.reduce((s, r) => s + r.count, 0),
    visits: fields.visits ? people.reduce((s, r) => s + (r.visits ?? 0), 0) : null,
    botFlaggedPageViews: fields.bot ? rows.filter((r) => r.bot === 1).reduce((s, r) => s + r.count, 0) : null,
  };
}

function sumClasses(edge: EdgeSummary, list: readonly TrafficClass[], field: 'requests' | 'pages'): number | null {
  if (!edge.classifiable) return null;
  let sum = 0;
  for (const c of list) {
    const v = edge.classes[c][field];
    if (v === null) return null;
    sum += v;
  }
  return sum;
}

export function headlineOf(people: PeopleSummary | null, edge: EdgeSummary | null): Headline {
  return {
    people: { pageViews: people?.pageViews ?? null, visits: people?.visits ?? null },
    aiBots: { requests: edge ? sumClasses(edge, AI_CLASSES, 'requests') : null, pages: edge ? sumClasses(edge, AI_CLASSES, 'pages') : null },
    otherBots: {
      requests: edge ? sumClasses(edge, NON_AI_BOT_CLASSES, 'requests') : null,
      pages: edge ? sumClasses(edge, NON_AI_BOT_CLASSES, 'pages') : null,
    },
    browserLike: {
      requests: edge?.classifiable ? edge.classes.browserLike.requests : null,
      pages: edge?.classifiable ? edge.classes.browserLike.pages : null,
    },
  };
}

/** Percent change from `prev` to `cur`, one decimal; null when either is unknown or prev is 0. */
export function change(cur: number | null, prev: number | null): number | null {
  if (cur === null || prev === null || prev === 0) return null;
  return Math.round(((cur - prev) / prev) * 1000) / 10;
}

export interface Changes {
  peoplePageViews: number | null;
  aiBotRequests: number | null;
  otherBotRequests: number | null;
}

export function changesOf(cur: Headline, prev: Headline): Changes {
  return {
    peoplePageViews: change(cur.people.pageViews, prev.people.pageViews),
    aiBotRequests: change(cur.aiBots.requests, prev.aiBots.requests),
    otherBotRequests: change(cur.otherBots.requests, prev.otherBots.requests),
  };
}

export interface StatsReport {
  host: string;
  generatedAt: string;
  windows: Partial<Record<WindowKey, WindowReport>>;
  previous: Partial<Record<WindowKey, WindowReport>>;
  changes: Partial<Record<WindowKey, Changes>>;
  topAiAgents7d: AgentTotals[];
  topPages7d: TopItem[];
  topReferrers7d: TopItem[];
  snapshots: { dir: string; days: number; written: string[]; oldest: string | null };
  /** true when no configured dataset could be used (token, permissions or ids): a setup problem. */
  setupFailed: boolean;
  fields: Record<string, boolean>;
  notes: string[];
  errors: string[];
}

const n = (v: number | null): string => (v === null ? 'n/a' : v.toLocaleString('en-US'));
const pct = (v: number | null): string => (v === null ? 'n/a' : `${v > 0 ? '+' : ''}${v}%`);
const pad = (s: string, w: number): string => (s.length >= w ? s : ' '.repeat(w - s.length) + s);
const padEnd = (s: string, w: number): string => (s.length >= w ? s : s + ' '.repeat(w - s.length));

function cell(edge: EdgeSummary | null | undefined, c: TrafficClass): string {
  const t = edge?.classifiable ? edge.classes[c] : undefined;
  if (!t) return 'n/a';
  return t.pages === null ? n(t.requests) : `${n(t.requests)} / ${n(t.pages)}`;
}

/** The plain-text table `pnpm stats` prints. */
export function formatReport(r: StatsReport): string {
  const keys = (['24h', '7d', '30d'] as const).filter((k) => r.windows[k]);
  const lines: string[] = [];
  lines.push(`${r.host}: traffic for rolling windows ending ${r.generatedAt.replace('T', ' ').replace(/:\d{2}(\.\d+)?Z$/, ' UTC')}`);
  lines.push('');
  const label = 40;
  const col = 18;
  const header = padEnd('', label) + keys.map((k) => pad(k, col)).join('');
  lines.push('People (Web Analytics beacon, bot-flagged loads left out; a lower bound)');
  lines.push(header);
  lines.push(padEnd('  Page views', label) + keys.map((k) => pad(n(r.windows[k]?.people?.pageViews ?? null), col)).join(''));
  lines.push(padEnd('  Visits', label) + keys.map((k) => pad(n(r.windows[k]?.people?.visits ?? null), col)).join(''));
  lines.push('');
  lines.push("Requests at Cloudflare's edge by class (requests / HTML pages)");
  lines.push(header);
  for (const c of TRAFFIC_CLASSES) {
    lines.push(padEnd(`  ${CLASS_LABELS[c]}`, label) + keys.map((k) => pad(cell(r.windows[k]?.edge, c), col)).join(''));
  }
  lines.push(padEnd('  Not classified (beyond the row limit)', label) + keys.map((k) => pad(n(r.windows[k]?.edge?.notClassified ?? null), col)).join(''));
  lines.push(padEnd('  All requests', label) + keys.map((k) => pad(n(r.windows[k]?.edge?.total ?? null), col)).join(''));
  lines.push('');
  const changeLines = (Object.entries(r.changes) as [WindowKey, Changes][]).map(
    ([k, c]) => `  ${k} against the ${k} before: people ${pct(c.peoplePageViews)}, AI bots ${pct(c.aiBotRequests)}, other bots ${pct(c.otherBotRequests)}`,
  );
  if (changeLines.length) {
    lines.push('Change');
    lines.push(...changeLines);
    lines.push('');
  }
  if (r.topAiAgents7d.length) {
    lines.push('AI agents by requests, 7d');
    for (const a of r.topAiAgents7d.slice(0, 10)) {
      const claimed = a.claimed ? `, ${n(a.claimed)} without a verified-bot category` : '';
      lines.push(`  ${padEnd(`${a.agent} (${a.operator})`, label - 2)}${pad(n(a.requests), 10)}${claimed}`);
    }
    lines.push('');
  }
  if (r.topPages7d.length) {
    lines.push('Top pages for people, 7d');
    for (const p of r.topPages7d) lines.push(`  ${padEnd(p.name, label - 2)}${pad(n(p.count), 10)}`);
    lines.push('');
  }
  if (r.topReferrers7d.length) {
    lines.push('Top referrers for people, 7d');
    for (const p of r.topReferrers7d) lines.push(`  ${padEnd(p.name, label - 2)}${pad(n(p.count), 10)}`);
    lines.push('');
  }
  lines.push(`Daily snapshots: ${r.snapshots.days} days in ${r.snapshots.dir}${r.snapshots.oldest ? ` (oldest ${r.snapshots.oldest})` : ''}${r.snapshots.written.length ? `; written now: ${r.snapshots.written.join(', ')}` : ''}`);
  for (const note of r.notes) lines.push(`Note: ${note}`);
  for (const error of r.errors) lines.push(`Error: ${error}`);
  return lines.join('\n');
}
