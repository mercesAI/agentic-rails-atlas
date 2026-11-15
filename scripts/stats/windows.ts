/**
 * Time windows for `pnpm stats`. All times are UTC. Pure: no network, no file access.
 */

export const HOUR_MS = 3_600_000;
export const DAY_MS = 86_400_000;

export interface TimeWindow {
  /** Inclusive start. */
  start: Date;
  /** Exclusive end. */
  end: Date;
}

export const WINDOW_KEYS = ['24h', '7d', '30d'] as const;
export type WindowKey = (typeof WINDOW_KEYS)[number];
export const WINDOW_DAYS: Record<WindowKey, number> = { '24h': 1, '7d': 7, '30d': 30 };

/** The end of every live window: now, rounded down to the whole minute. */
export function windowEnd(now: Date): Date {
  return new Date(Math.floor(now.getTime() / 60_000) * 60_000);
}

/** The rolling window that ends at `end` and spans `days` days. */
export function rolling(end: Date, days: number): TimeWindow {
  return { start: new Date(end.getTime() - days * DAY_MS), end };
}

/** The window of the same length that ends where `w` starts. */
export function previous(w: TimeWindow): TimeWindow {
  const len = w.end.getTime() - w.start.getTime();
  return { start: new Date(w.start.getTime() - len), end: w.start };
}

/**
 * Splits a window into pieces no longer than `maxMs` (the dataset's maxDuration), oldest first,
 * so a 30-day window still works on a plan or dataset that allows shorter queries.
 */
export function chunk(w: TimeWindow, maxMs: number): TimeWindow[] {
  if (!(maxMs > 0)) throw new Error('maxMs must be positive');
  const pieces: TimeWindow[] = [];
  let start = w.start.getTime();
  const end = w.end.getTime();
  while (start < end) {
    const stop = Math.min(end, start + maxMs);
    pieces.push({ start: new Date(start), end: new Date(stop) });
    start = stop;
  }
  return pieces;
}

/** YYYY-MM-DD of a date in UTC. */
export function utcDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** The window of one UTC day. */
export function dayWindow(day: string): TimeWindow {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new Error(`not a YYYY-MM-DD day: ${day}`);
  const start = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || utcDay(start) !== day) throw new Error(`not a calendar day: ${day}`);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/**
 * The last `count` complete UTC days before `now`, newest first. Days that start before
 * `oldestAllowed` (the dataset's retention edge) are left out.
 */
export function completeDays(now: Date, count: number, oldestAllowed?: Date): string[] {
  const today = new Date(`${utcDay(now)}T00:00:00Z`).getTime();
  const days: string[] = [];
  for (let i = 1; i <= count; i++) {
    const start = today - i * DAY_MS;
    if (oldestAllowed && start < oldestAllowed.getTime()) break;
    days.push(utcDay(new Date(start)));
  }
  return days;
}

/** ISO 8601 without milliseconds, the form the GraphQL time filters are written in. */
export function isoSeconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
}
