/** Freshness buckets for FreshnessBadge (ATLAS_PROMPT.md 4.6). */
export type FreshnessLevel = 'green' | 'amber' | 'red';

export const FRESHNESS_LABELS: Record<FreshnessLevel, string> = {
  green: 'verified under 30 days ago',
  amber: 'verified 30 to 90 days ago',
  red: 'verified over 90 days ago',
};

const DAY = 86_400_000;

export function daysBetween(from: string, to: string): number {
  const a = Date.parse(`${from}T00:00:00Z`);
  const b = Date.parse(`${to}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.round((b - a) / DAY));
}

export function freshness(date: string, buildDate: string): { level: FreshnessLevel; days: number } {
  const days = daysBetween(date, buildDate);
  const level: FreshnessLevel = days < 30 ? 'green' : days <= 90 ? 'amber' : 'red';
  return { level, days };
}
