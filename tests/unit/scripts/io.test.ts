import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { canonicalJson, checkedAtFor, today } from '../../../scripts/lib/io';
import { today as dataToday } from '../../../scripts/data/lib';

describe('today', () => {
  it('is the UTC date, whatever the local zone', () => {
    expect(today(new Date('2026-03-01T23:30:00-05:00'))).toBe('2026-03-02');
    expect(today(new Date('2026-03-01T00:30:00+02:00'))).toBe('2026-02-28');
    expect(today()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('is the same clock for the data fetchers', () => {
    expect(dataToday).toBe(today);
  });
});

describe('canonicalJson', () => {
  it('ignores key order at every level and keeps array order', () => {
    expect(canonicalJson({ b: 1, a: { d: [3, { y: 1, x: 2 }], c: 2 } })).toBe(canonicalJson({ a: { c: 2, d: [3, { x: 2, y: 1 }] }, b: 1 }));
    expect(canonicalJson([1, 2])).not.toBe(canonicalJson([2, 1]));
    expect(canonicalJson({ a: 1 })).not.toBe(canonicalJson({ a: 2 }));
  });
});

describe('checkedAtFor', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'atlas-io-'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it('keeps the previous stamp when the results are identical and moves it otherwise', () => {
    const path = join(dir, 'report.json');
    const results = [{ url: 'https://example.org', outcome: 'ok' }];
    expect(checkedAtFor(path, results)).toBe(today());
    writeFileSync(path, JSON.stringify({ checkedAt: '2026-01-01', results }));
    expect(checkedAtFor(path, results)).toBe('2026-01-01');
    expect(checkedAtFor(path, [{ url: 'https://example.org', outcome: 'fail' }])).toBe(today());
    writeFileSync(path, '{ not json');
    expect(checkedAtFor(path, results)).toBe(today());
  });
});
