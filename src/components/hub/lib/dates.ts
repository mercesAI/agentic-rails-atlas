/** Small date helpers for YYYY-MM-DD strings (UTC, no time zone drift). Pure, unit tested. */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Days since 1970-01-01 for a YYYY-MM-DD string; NaN when the string is not a date. */
export function dayNumber(date: string): number {
  const m = ISO.exec(date);
  if (!m) return Number.NaN;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / 86_400_000;
}

/** The YYYY-MM-DD date `days` days before (negative: after) `date`. */
export function shiftDays(date: string, days: number): string {
  const n = dayNumber(date);
  if (Number.isNaN(n)) return date;
  return new Date((n - days) * 86_400_000).toISOString().slice(0, 10);
}

export const yearOf = (date: string): number => Number(date.slice(0, 4));
export const monthOf = (date: string): string => date.slice(0, 7);
