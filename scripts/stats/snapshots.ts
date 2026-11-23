/**
 * One JSON file per complete UTC day in work/stats/daily/<host>/ (git ignores work/). The
 * edge dataset keeps 31 days, so these files are the only record of anything older, and they
 * give the 30-day comparison its previous period. A day is written only when every configured
 * part of it was fetched without error, so a failed day is fetched again on the next run.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { TRAFFIC_CLASSES } from './classify';
import type { AgentTotals, ClassTotals, EdgeSummary, PeopleSummary } from './report';

export interface DailySnapshot {
  schema: 1;
  day: string;
  host: string;
  fetchedAt: string;
  people: PeopleSummary | null;
  edge: EdgeSummary | null;
}

const DAY_FILE = /^(\d{4}-\d{2}-\d{2})\.json$/;

export function readSnapshots(dir: string, host: string): Map<string, DailySnapshot> {
  const out = new Map<string, DailySnapshot>();
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    const m = DAY_FILE.exec(name);
    if (!m?.[1]) continue;
    try {
      const snap = JSON.parse(readFileSync(join(dir, name), 'utf8')) as DailySnapshot;
      if (snap.schema === 1 && snap.day === m[1] && snap.host === host) out.set(snap.day, snap);
    } catch {
      // A damaged file is fetched again on the next run.
    }
  }
  return out;
}

export function writeSnapshot(dir: string, snap: DailySnapshot): void {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, `${snap.day}.json`), `${JSON.stringify(snap, null, 2)}\n`);
}

function addTotals(a: ClassTotals, b: ClassTotals): ClassTotals {
  return {
    requests: a.requests + b.requests,
    pages: a.pages === null || b.pages === null ? null : a.pages + b.pages,
    claimed: a.claimed === null || b.claimed === null ? null : a.claimed + b.claimed,
  };
}

/** Adds daily edge summaries; null when any day has no edge part. */
export function sumEdge(list: (EdgeSummary | null)[]): EdgeSummary | null {
  if (list.length === 0 || list.some((e) => e === null)) return null;
  const days = list as EdgeSummary[];
  const first = days[0];
  if (!first) return null;
  const agents = new Map<string, AgentTotals>();
  const classes = Object.fromEntries(TRAFFIC_CLASSES.map((c) => [c, { ...first.classes[c] }])) as EdgeSummary['classes'];
  for (const a of first.agents) agents.set(a.agent, { ...a });
  let total = first.total;
  let classified = first.classified;
  let notClassified = first.notClassified;
  let rowLimitHit = first.rowLimitHit;
  for (const d of days.slice(1)) {
    total += d.total;
    classified += d.classified;
    notClassified += d.notClassified;
    rowLimitHit ||= d.rowLimitHit;
    for (const c of TRAFFIC_CLASSES) classes[c] = addTotals(classes[c], d.classes[c]);
    for (const a of d.agents) {
      const prev = agents.get(a.agent);
      agents.set(a.agent, prev ? { ...prev, ...addTotals(prev, a) } : { ...a });
    }
  }
  return {
    total,
    classifiable: days.every((d) => d.classifiable),
    classified,
    notClassified,
    rowLimitHit,
    classes,
    agents: [...agents.values()].sort((a, b) => b.requests - a.requests || a.agent.localeCompare(b.agent)),
  };
}

/** Adds daily people summaries; null when any day has no people part. */
export function sumPeople(list: (PeopleSummary | null)[]): PeopleSummary | null {
  if (list.length === 0 || list.some((p) => p === null)) return null;
  const days = list as PeopleSummary[];
  return {
    pageViews: days.reduce((s, d) => s + d.pageViews, 0),
    visits: days.some((d) => d.visits === null) ? null : days.reduce((s, d) => s + (d.visits ?? 0), 0),
    botFlaggedPageViews: days.some((d) => d.botFlaggedPageViews === null) ? null : days.reduce((s, d) => s + (d.botFlaggedPageViews ?? 0), 0),
  };
}
