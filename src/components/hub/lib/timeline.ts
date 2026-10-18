/**
 * Multi-lane timeline model for /timeline/ (pure, unit tested).
 * Lanes: one per protocol (from each timeline.json), then Standards, Policy,
 * Market and Prehistory (from timeline-global.json). Filters by lane, kind,
 * confidence and a year range (the zoom). Markers bucket events per lane by
 * month for short ranges and by year for long ones so dots never pile up.
 */
import { dayNumber, monthOf, yearOf } from './dates';

export type Confidence = 'verified' | 'reported' | 'unverified';

export interface HubSourceRef {
  /** Footer number on the page (links to #src-N). */
  n: number;
  id: string;
  title: string;
}

export interface HubEvent {
  id: string;
  date: string;
  lane: string;
  title: string;
  detail?: string;
  kind: string;
  confidence: Confidence;
  sources: HubSourceRef[];
}

export interface Lane {
  id: string;
  label: string;
  group: 'protocol' | 'global';
}

export const GLOBAL_LANES = ['Standards', 'Policy', 'Market', 'Prehistory'] as const;

export const KIND_LABELS: Record<string, string> = {
  announce: 'Announcement',
  release: 'Release',
  governance: 'Governance',
  launch: 'Launch',
  pilot: 'Pilot',
  security: 'Security',
  policy: 'Policy',
  market: 'Market',
  prehistory: 'Prehistory',
};

export { CONFIDENCE_LABELS } from '../../../lib/labels';

export interface ZoomPreset {
  id: string;
  label: string;
  from: number | null;
  to: number | null;
}

export const ZOOM_PRESETS: ZoomPreset[] = [
  { id: 'all', label: 'All years', from: null, to: null },
  { id: 'prehistory', label: 'Before 2020', from: null, to: 2019 },
  { id: 'recent', label: '2020 onward', from: 2020, to: null },
  { id: 'now', label: '2025 onward', from: 2025, to: null },
];

/** Protocol lanes in the given order, then the four global lanes. Unknown global lanes are appended. */
export function buildLanes(protocols: { slug: string; name: string }[], events: HubEvent[]): Lane[] {
  const lanes: Lane[] = protocols.map((p) => ({ id: p.slug, label: p.name, group: 'protocol' }));
  const known = new Set(lanes.map((l) => l.id));
  for (const g of GLOBAL_LANES) {
    lanes.push({ id: g, label: g, group: 'global' });
    known.add(g);
  }
  for (const e of events) {
    if (!known.has(e.lane)) {
      lanes.push({ id: e.lane, label: e.lane, group: 'global' });
      known.add(e.lane);
    }
  }
  return lanes;
}

export function yearBounds(events: HubEvent[]): [number, number] {
  if (events.length === 0) return [2025, 2026];
  let min = Infinity;
  let max = -Infinity;
  for (const e of events) {
    const y = yearOf(e.date);
    if (y < min) min = y;
    if (y > max) max = y;
  }
  return [min, max];
}

export interface TimelineFilter {
  lanes: Set<string>;
  kinds: Set<string>;
  confidences: Set<Confidence>;
  from: number | null;
  to: number | null;
  query?: string;
}

/** Events that pass every filter, sorted by date then lane. An empty set means "no restriction". */
export function filterEvents(events: HubEvent[], f: TimelineFilter): HubEvent[] {
  const q = f.query?.trim().toLowerCase() ?? '';
  return events
    .filter((e) => {
      if (f.lanes.size > 0 && !f.lanes.has(e.lane)) return false;
      if (f.kinds.size > 0 && !f.kinds.has(e.kind)) return false;
      if (f.confidences.size > 0 && !f.confidences.has(e.confidence)) return false;
      const y = yearOf(e.date);
      if (f.from !== null && y < f.from) return false;
      if (f.to !== null && y > f.to) return false;
      if (q && !`${e.title} ${e.detail ?? ''} ${e.lane}`.toLowerCase().includes(q)) return false;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date) || a.lane.localeCompare(b.lane) || a.title.localeCompare(b.title));
}

export interface Range {
  from: number;
  to: number;
}

/** Resolves the zoom to concrete years using the data bounds. */
export function resolveRange(from: number | null, to: number | null, bounds: [number, number]): Range {
  const lo = from ?? bounds[0];
  const hi = to ?? bounds[1];
  return lo <= hi ? { from: lo, to: hi } : { from: hi, to: lo };
}

/** Percent (0 to 100) of a date along a year range, clamped. */
export function position(date: string, range: Range): number {
  const start = dayNumber(`${range.from}-01-01`);
  const end = dayNumber(`${range.to + 1}-01-01`);
  const d = dayNumber(date);
  if (Number.isNaN(d) || end <= start) return 0;
  return Math.min(100, Math.max(0, ((d - start) / (end - start)) * 100));
}

export type Bucketing = 'month' | 'year';

/** Month buckets for ranges of five years or fewer, year buckets otherwise. */
export function bucketing(range: Range): Bucketing {
  return range.to - range.from + 1 <= 5 ? 'month' : 'year';
}

export interface Marker {
  key: string;
  lane: string;
  /** YYYY-MM or YYYY. */
  period: string;
  /** Position anchor (the middle of the period). */
  date: string;
  events: HubEvent[];
  /** Lowest confidence in the bucket, so a marker never looks more certain than its weakest event. */
  confidence: Confidence;
}

const CONF_ORDER: Record<Confidence, number> = { unverified: 0, reported: 1, verified: 2 };

export function weakest(events: HubEvent[]): Confidence {
  let c: Confidence = 'verified';
  for (const e of events) if (CONF_ORDER[e.confidence] < CONF_ORDER[c]) c = e.confidence;
  return c;
}

/** Position anchor for a bucket: mid-month or mid-year, so neighbors sit one full period apart. */
export function periodCenter(period: string): string {
  return period.length === 7 ? `${period}-15` : `${period}-07-01`;
}

/** Groups filtered events into per-lane markers. */
export function buildMarkers(events: HubEvent[], mode: Bucketing): Marker[] {
  const map = new Map<string, Marker>();
  for (const e of events) {
    const period = mode === 'month' ? monthOf(e.date) : String(yearOf(e.date));
    const key = `${e.lane}::${period}`;
    const m = map.get(key);
    if (m) m.events.push(e);
    else map.set(key, { key, lane: e.lane, period, date: periodCenter(period), events: [e], confidence: e.confidence });
  }
  for (const m of map.values()) m.confidence = weakest(m.events);
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

/** Year ticks for the axis; thins out to keep at most about 12 labels. */
export function yearTicks(range: Range): number[] {
  const span = range.to - range.from + 1;
  const step = span <= 12 ? 1 : span <= 24 ? 2 : span <= 60 ? 5 : 10;
  const out: number[] = [];
  for (let y = range.from; y <= range.to; y += 1) if ((y - range.from) % step === 0) out.push(y);
  return out;
}

/** Events grouped by year, newest year last (list view). */
export function groupByYear(events: HubEvent[]): [number, HubEvent[]][] {
  const map = new Map<number, HubEvent[]>();
  for (const e of events) {
    const y = yearOf(e.date);
    const list = map.get(y);
    if (list) list.push(e);
    else map.set(y, [e]);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
}

export function countBy<T>(items: T[], key: (t: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const i of items) {
    const k = key(i);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}
