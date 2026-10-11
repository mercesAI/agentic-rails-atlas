import { describe, expect, it } from 'vitest';
import {
  buildLanes,
  buildMarkers,
  bucketing,
  filterEvents,
  groupByYear,
  position,
  resolveRange,
  weakest,
  yearBounds,
  yearTicks,
  type HubEvent,
} from '../../../src/components/hub/lib/timeline';
import { dayNumber, shiftDays } from '../../../src/components/hub/lib/dates';

const ev = (date: string, lane: string, kind = 'release', confidence: HubEvent['confidence'] = 'verified', title = `${lane} ${date}`): HubEvent => ({
  id: `${lane}-${date}-${title}`,
  date,
  lane,
  title,
  kind,
  confidence,
  sources: [{ n: 1, id: 'src-a', title: 'A' }],
});

const events = [
  ev('1997-01-01', 'Prehistory', 'prehistory'),
  ev('2025-05-06', 'x402', 'announce'),
  ev('2025-05-20', 'x402', 'release', 'reported'),
  ev('2026-03-09', 'Policy', 'policy', 'unverified'),
  ev('2026-08-04', 'Policy', 'policy'),
];

describe('dates', () => {
  it('computes day numbers and shifts', () => {
    expect(dayNumber('1970-01-02')).toBe(1);
    expect(Number.isNaN(dayNumber('2026-1-1'))).toBe(true);
    expect(shiftDays('2026-10-11', 90)).toBe('2026-07-13');
  });
});

describe('timeline model', () => {
  it('orders protocol lanes first, then the four global lanes, then strays', () => {
    const lanes = buildLanes([{ slug: 'x402', name: 'x402' }], [...events, ev('2026-01-01', 'Other')]);
    expect(lanes.map((l) => l.id)).toEqual(['x402', 'Standards', 'Policy', 'Market', 'Prehistory', 'Other']);
  });

  it('filters by lane, kind, confidence, year range and query', () => {
    const base = { lanes: new Set<string>(), kinds: new Set<string>(), confidences: new Set<HubEvent['confidence']>(), from: null, to: null };
    expect(filterEvents(events, base)).toHaveLength(5);
    expect(filterEvents(events, { ...base, lanes: new Set(['x402']) })).toHaveLength(2);
    expect(filterEvents(events, { ...base, kinds: new Set(['policy']) })).toHaveLength(2);
    expect(filterEvents(events, { ...base, confidences: new Set(['unverified']) as Set<HubEvent['confidence']> })).toHaveLength(1);
    expect(filterEvents(events, { ...base, from: 2026 })).toHaveLength(2);
    expect(filterEvents(events, { ...base, to: 2019 })).toHaveLength(1);
    expect(filterEvents(events, { ...base, query: 'no such thing' })).toHaveLength(0);
    expect(filterEvents(events, { ...base, query: 'prehistory' })).toHaveLength(1);
  });

  it('resolves ranges, positions and ticks', () => {
    expect(yearBounds(events)).toEqual([1997, 2026]);
    expect(yearBounds([])).toEqual([2025, 2026]);
    const r = resolveRange(2025, null, [1997, 2026]);
    expect(r).toEqual({ from: 2025, to: 2026 });
    expect(resolveRange(2026, 2020, [0, 0])).toEqual({ from: 2020, to: 2026 });
    expect(position('2025-01-01', r)).toBe(0);
    expect(position('2026-01-01', r)).toBeCloseTo(50, 0);
    expect(position('2030-01-01', r)).toBe(100);
    expect(yearTicks({ from: 1983, to: 2027 })).toEqual([1983, 1988, 1993, 1998, 2003, 2008, 2013, 2018, 2023]);
    expect(yearTicks({ from: 2025, to: 2026 })).toEqual([2025, 2026]);
  });

  it('buckets by month for short ranges and by year for long ones', () => {
    expect(bucketing({ from: 2025, to: 2026 })).toBe('month');
    expect(bucketing({ from: 1990, to: 2026 })).toBe('year');
    const monthly = buildMarkers(events, 'month');
    expect(monthly.find((m) => m.lane === 'x402')?.events).toHaveLength(2);
    expect(monthly.find((m) => m.lane === 'x402')?.confidence).toBe('reported');
    const yearly = buildMarkers(events, 'year');
    expect(yearly.filter((m) => m.lane === 'Policy')).toHaveLength(1);
    expect(yearly.find((m) => m.lane === 'Policy')?.confidence).toBe('unverified');
  });

  it('reports the weakest confidence and groups by year', () => {
    expect(weakest([events[1]!, events[2]!])).toBe('reported');
    expect(groupByYear(events).map(([y, list]) => [y, list.length])).toEqual([
      [1997, 1],
      [2025, 2],
      [2026, 2],
    ]);
  });
});
