import { describe, expect, it } from 'vitest';
import type { CompareCell } from '../../../src/lib/schemas';
import {
  diffProtocols,
  diffSummary,
  filterDimensions,
  groupOf,
  groupsFor,
  indexCells,
  protocolsWithCells,
} from '../../../src/components/crosscut/lib/compare';
import { buildProtocolInfos, citeLabel } from '../../../src/components/crosscut/lib/protocols';

const dims: { id: string; label: string }[] = [
  { id: 'primary-job', label: 'Primary job' },
  { id: 'transports', label: 'Transports' },
  { id: 'who-pays', label: 'Who pays (short)' },
  { id: 'brand-new', label: 'Brand new dimension' },
];
const cell = (protocol: CompareCell['protocol'], dimension: string, value: string): CompareCell => ({
  protocol,
  dimension,
  value,
  sources: ['src-a'],
  confidence: 'verified',
});
const cells = [
  cell('x402', 'primary-job', 'HTTP 402 payments'),
  cell('ap2', 'primary-job', 'Mandates for agent payments'),
  cell('x402', 'transports', 'HTTP, MCP, A2A'),
  cell('ap2', 'transports', 'http,  MCP, A2A'),
  cell('x402', 'who-pays', 'Payer pays gas'),
];
const idx = indexCells(cells);

describe('compare grouping', () => {
  it('maps known dimensions and falls back to Other', () => {
    expect(groupOf(dims[0]!).id).toBe('overview');
    expect(groupOf(dims[2]!).id).toBe('economics');
    expect(groupOf(dims[3]!).id).toBe('other');
    expect(groupOf({ id: 'x', label: 'X', group: 'mechanics' }).id).toBe('mechanics');
  });
  it('lists groups in display order', () => {
    expect(groupsFor(dims).map((g) => g.id)).toEqual(['overview', 'mechanics', 'economics', 'other']);
  });
});

describe('compare filtering', () => {
  const all = new Set(['x402', 'ap2']);
  it('filters by group', () => {
    const out = filterDimensions(dims, idx, { groups: new Set(['mechanics']), protocols: all, query: '' });
    expect(out.map((d) => d.id)).toEqual(['transports']);
  });
  it('searches labels and visible cell values', () => {
    expect(filterDimensions(dims, idx, { groups: new Set(), protocols: all, query: 'mandates' }).map((d) => d.id)).toEqual([
      'primary-job',
    ]);
    expect(filterDimensions(dims, idx, { groups: new Set(), protocols: new Set(['x402']), query: 'mandates' })).toEqual([]);
    expect(filterDimensions(dims, idx, { groups: new Set(), protocols: all, query: 'WHO PAYS' }).map((d) => d.id)).toEqual([
      'who-pays',
    ]);
  });
});

describe('pick two diff', () => {
  it('marks same, different and missing', () => {
    const rows = diffProtocols(dims, idx, 'x402', 'ap2');
    expect(rows.map((r) => r.status)).toEqual(['different', 'same', 'missing', 'missing']);
    expect(diffSummary(rows)).toEqual({ same: 1, different: 1, missing: 2 });
  });
  it('knows which protocols have cells', () => {
    expect([...protocolsWithCells(cells)].sort()).toEqual(['ap2', 'x402']);
  });
});

describe('protocol infos and cite labels', () => {
  it('fills all eight with fallbacks', () => {
    const infos = buildProtocolInfos([]);
    expect(infos).toHaveLength(8);
    expect(infos.every((p) => !p.hasPage)).toBe(true);
    expect(infos[1]?.short).toBe('x402');
  });
  it('sorts and de-duplicates footer numbers', () => {
    expect(citeLabel(['src-b', 'src-a', 'src-b'], { 'src-a': 3, 'src-b': 1 })).toBe('[1, 3]');
    expect(citeLabel(['src-z'], {})).toBe('[?]');
  });
});
