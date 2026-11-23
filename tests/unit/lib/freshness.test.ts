import { describe, expect, it } from 'vitest';
import { daysBetween, freshness, freshnessTitle } from '@/lib/freshness';

describe('freshness', () => {
  it('buckets days since verification', () => {
    expect(freshness('2026-11-21', '2026-11-22')).toEqual({ level: 'green', days: 1 });
    expect(freshness('2026-10-01', '2026-11-22').level).toBe('amber');
    expect(freshness('2026-01-01', '2026-11-22').level).toBe('red');
    expect(daysBetween('2026-11-22', '2026-11-21')).toBe(0);
  });

  it('writes a singular day in the tooltip', () => {
    expect(freshnessTitle(0, '2026-11-22')).toBe('0 days before the build date 2026-11-22');
    expect(freshnessTitle(1, '2026-11-22')).toBe('1 day before the build date 2026-11-22');
    expect(freshnessTitle(8, '2026-11-22')).toBe('8 days before the build date 2026-11-22');
  });
});
