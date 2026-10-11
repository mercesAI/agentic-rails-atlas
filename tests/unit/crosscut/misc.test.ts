import { describe, expect, it } from 'vitest';
import type { ControlCell, GlossaryTerm } from '../../../src/lib/schemas';
import { isFullTerm, letterOf, openStubs, sortTerms, termMatches } from '../../../src/components/crosscut/lib/glossary';
import { cellVisible, controlsWithoutNative, indexControlCells, supportCounts } from '../../../src/components/crosscut/lib/controls';
import { gridRings, pathFrom, radarPoints } from '../../../src/components/crosscut/lib/radar';
import { coverageOf, layoutStack, spanLinks } from '../../../src/components/crosscut/lib/stack';
import { buildProtocolInfos } from '../../../src/components/crosscut/lib/protocols';

const term = (id: string, name: string, protocols: string[] = []): GlossaryTerm => ({
  id,
  term: name,
  aliases: [],
  plain: `${name} plain`,
  ste: `${name} ste`,
  protocols,
  sources: ['src-a'],
});

describe('glossary', () => {
  it('sorts case-insensitively and numerically', () => {
    expect(sortTerms([term('b', 'beta'), term('a', 'Alpha'), term('e2', 'ERC-20'), term('e1', 'ERC-8004')]).map((t) => t.id)).toEqual([
      'a',
      'b',
      'e2',
      'e1',
    ]);
  });
  it('separates full terms and open stubs', () => {
    expect(isFullTerm({ ...term('a', 'A'), ste: '' })).toBe(false);
    const stubs = [
      { id: 'a', term: 'A', aliases: [], protocols: [] },
      { id: 'zz', term: 'Zed', aliases: [], protocols: [] },
    ];
    expect(openStubs(stubs, [term('a', 'A')]).map((s) => s.id)).toEqual(['zz']);
  });
  it('filters by protocol and query and buckets letters', () => {
    const t = term('x', 'Facilitator', ['x402']);
    expect(termMatches(t, 'facil', 'x402')).toBe(true);
    expect(termMatches(t, '', 'ap2')).toBe(false);
    expect(letterOf('3-D Secure')).toBe('#');
    expect(letterOf('mandate')).toBe('M');
  });
});

describe('controls', () => {
  const c = (protocol: ControlCell['protocol'], control: ControlCell['control'], support: ControlCell['support']): ControlCell => ({
    protocol,
    control,
    support,
    note: '',
    sources: ['src-a'],
  });
  const cells = [c('x402', 'revocation', 'none'), c('ap2', 'revocation', 'partial'), c('ap2', 'spending-caps', 'native')];
  it('counts and indexes', () => {
    expect(supportCounts(cells)).toEqual({ native: 1, partial: 1, external: 0, none: 1 });
    expect(indexControlCells(cells).get('ap2::spending-caps')?.support).toBe('native');
  });
  it('finds controls without a native implementation', () => {
    expect(controlsWithoutNative(cells, ['revocation', 'spending-caps', 'kill-switch'])).toEqual(['revocation']);
  });
  it('filters cells by support', () => {
    expect(cellVisible(cells[0], new Set())).toBe(true);
    expect(cellVisible(cells[0], new Set(['native']))).toBe(false);
    expect(cellVisible(undefined, new Set(['none']))).toBe(false);
  });
});

describe('radar geometry', () => {
  it('places a full value on the rim and missing axes at the center', () => {
    const pts = radarPoints([{ protocol: 'x', axis: 'openness', value: 5, justification: '', sources: [] }], 100, 100, 50);
    expect(pts).toHaveLength(6);
    expect(pts[0].x).toBeCloseTo(100);
    expect(pts[0].y).toBeCloseTo(50);
    expect(pts[1].entry).toBeNull();
    expect(pts[1].x).toBeCloseTo(100);
    expect(pathFrom(pts).endsWith('Z')).toBe(true);
    expect(gridRings(0, 0, 10)).toHaveLength(5);
  });
});

describe('stack layout', () => {
  const [p] = buildProtocolInfos([
    {
      slug: 'erc-8004',
      name: 'ERC-8004',
      monogram: '8004',
      family: 'identity-trust',
      layerPrimary: 'identity-trust',
      layersSecondary: ['discovery', 'reputation-feedback'],
      lastVerified: '2026-10-11',
    },
  ]);
  it('marks primary and secondary coverage', () => {
    expect(coverageOf(p, 'identity-trust')).toBe('primary');
    expect(coverageOf(p, 'discovery')).toBe('secondary');
    expect(coverageOf(p, 'settlement-rails')).toBeNull();
  });
  it('lays out one block per covered layer and links them in order', () => {
    const blocks = layoutStack([p]);
    expect(blocks.map((b) => b.layer)).toEqual(['discovery', 'identity-trust', 'reputation-feedback']);
    expect(spanLinks(blocks)).toHaveLength(2);
  });
});
