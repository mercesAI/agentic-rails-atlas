import { describe, expect, it } from 'vitest';
import {
  BASE_RADIUS,
  bubbleRadius,
  layersCovered,
  railScore,
  relationsFor,
  relevanceOf,
  ringStyle,
} from '../../../src/components/universe/lib/encoding';
import { nextInDirection } from '../../../src/components/universe/lib/nav';
import { groupByCategory, labelArc, orbitLayout } from '../../../src/components/universe/lib/orbit';
import type { UniverseOrbit, UniverseRelation } from '../../../src/components/universe/lib/types';

describe('ringStyle', () => {
  it('maps the primary rail to a ring style', () => {
    expect(ringStyle(['card'])).toBe('solid');
    expect(ringStyle(['crypto', 'rail-agnostic'])).toBe('dashed');
    expect(ringStyle(['bank'])).toBe('dotted');
    expect(ringStyle(['rail-agnostic', 'card'])).toBe('double');
    expect(ringStyle(['multi-rail', 'crypto', 'card'])).toBe('double');
    expect(ringStyle([])).toBe('double');
  });
});

describe('bubbleRadius', () => {
  it('is the base for one layer and grows a little per extra layer', () => {
    const one = { layerPrimary: 'identity-trust', layersSecondary: [] } as const;
    const three = { layerPrimary: 'identity-trust', layersSecondary: ['discovery', 'reputation-feedback'] } as const;
    expect(bubbleRadius(one)).toBe(BASE_RADIUS);
    expect(bubbleRadius(three)).toBeGreaterThan(BASE_RADIUS);
    expect(bubbleRadius(three)).toBeLessThan(BASE_RADIUS * 1.2);
  });
  it('ignores a secondary layer equal to the primary and caps the boost', () => {
    expect(layersCovered({ layerPrimary: 'discovery', layersSecondary: ['discovery'] })).toBe(1);
    const all = {
      layerPrimary: 'discovery',
      layersSecondary: ['identity-trust', 'intent-authorization', 'checkout-orders', 'payment-credential', 'settlement-rails', 'post-purchase-disputes', 'reputation-feedback'],
    } as const;
    expect(bubbleRadius(all)).toBe(bubbleRadius({ ...all, layersSecondary: all.layersSecondary.slice(0, 5) }));
  });
  it('scales with a custom base', () => {
    expect(bubbleRadius({ layerPrimary: 'discovery', layersSecondary: [] }, 27)).toBe(27);
  });
});

describe('railScore', () => {
  it('runs from crypto-native (0) to card network (1)', () => {
    expect(railScore(['crypto'])).toBe(0);
    expect(railScore(['card'])).toBe(1);
    expect(railScore(['crypto', 'card'])).toBe(0.5);
    expect(railScore([])).toBe(0.5);
  });
});

describe('relations and relevance', () => {
  const rels: UniverseRelation[] = [
    { from: 'a', to: 'b', type: 'embeds', note: '' },
    { from: 'c', to: 'a', type: 'complements', note: '' },
    { from: 'a', to: 'zz', type: 'complements', note: '' },
    { from: 'b', to: 'c', type: 'complements', note: '' },
  ];
  it('relationsFor keeps both directions and drops absent ends', () => {
    expect(relationsFor('a', rels, new Set(['a', 'b', 'c'])).map((r) => `${r.from}-${r.to}`)).toEqual(['a-b', 'c-a']);
  });
  it('relationsFor keeps a symmetric relation once but both directions of a directed one', () => {
    const both: UniverseRelation[] = [
      { from: 'a', to: 'b', type: 'compatible-with', note: '' },
      { from: 'b', to: 'a', type: 'compatible-with', note: '' },
      { from: 'a', to: 'b', type: 'embeds', note: '' },
      { from: 'b', to: 'a', type: 'embeds', note: '' },
    ];
    expect(relationsFor('a', both, new Set(['a', 'b']))).toHaveLength(3);
  });
  it('relevanceOf defaults to high with no persona and low when unmapped', () => {
    expect(relevanceOf({}, null, 'a')).toBe('high');
    expect(relevanceOf({ p: { a: 'medium' } }, 'p', 'a')).toBe('medium');
    expect(relevanceOf({ p: { a: 'medium' } }, 'p', 'b')).toBe('low');
  });
});

describe('nextInDirection', () => {
  const nodes = { a: { x: 0, y: 0 }, b: { x: 100, y: 0 }, c: { x: 100, y: 100 }, d: { x: 0, y: 100 } };
  const order = ['a', 'b', 'c', 'd'];
  it('moves to the nearest node in the arrow direction', () => {
    expect(nextInDirection(nodes, order, 'a', 'right')).toBe('b');
    expect(nextInDirection(nodes, order, 'a', 'down')).toBe('d');
    expect(nextInDirection(nodes, order, 'c', 'left')).toBe('d');
    expect(nextInDirection(nodes, order, 'c', 'up')).toBe('b');
  });
  it('falls back to the reading order at an edge', () => {
    expect(nextInDirection(nodes, order, 'b', 'right')).toBe('c');
    expect(nextInDirection(nodes, order, 'a', 'left')).toBe('d');
  });
  it('returns null for unknown or single nodes', () => {
    expect(nextInDirection(nodes, order, 'zz', 'right')).toBeNull();
    expect(nextInDirection({ a: { x: 0, y: 0 } }, ['a'], 'a', 'right')).toBeNull();
  });
});

describe('orbitLayout', () => {
  const items: UniverseOrbit[] = [
    { slug: 'mcp', name: 'MCP', category: 'agent-communication', oneLiner: '', href: '#', external: true },
    { slug: 'a2a', name: 'A2A', category: 'agent-communication', oneLiner: '', href: '#', external: true },
    { slug: 'l402', name: 'L402', category: 'machine-payments', oneLiner: '', href: '#', external: true },
    { slug: 'case', name: 'Case', category: 'legal-policy', oneLiner: '', href: '#', external: true },
  ];
  it('groups by category in category order and sorts by name', () => {
    expect(groupByCategory(items).map(([c, l]) => [c, l.map((i) => i.slug)])).toEqual([
      ['agent-communication', ['a2a', 'mcp']],
      ['machine-payments', ['l402']],
      ['legal-policy', ['case']],
    ]);
  });
  it('puts satellites on the outer ellipse in Constellation', () => {
    const o = orbitLayout(items, 'constellation', { width: 1200, height: 720 });
    expect(o.ring).not.toBeNull();
    expect(o.extraHeight).toBeGreaterThan(0);
    const { cx, cy, rx, ry } = o.ring!;
    expect(cy + ry).toBeLessThanOrEqual(720 + o.extraHeight);
    for (const n of Object.values(o.nodes)) {
      const v = ((n.x - cx) / rx) ** 2 + ((n.y - cy) / ry) ** 2;
      expect(v).toBeCloseTo(1, 2);
    }
    expect(o.arcs.map((x) => x.key)).toEqual(['agent-communication', 'machine-payments', 'legal-policy']);
    for (const arc of o.arcs) expect(arc.d).toMatch(/^M [\d.-]+ [\d.-]+ A /);
  });
  it('puts satellites in a band under the chart in the other modes', () => {
    const o = orbitLayout(items, 'layers', { width: 1200, height: 700 });
    expect(o.extraHeight).toBeGreaterThan(0);
    for (const n of Object.values(o.nodes)) expect(n.y).toBeGreaterThan(700);
  });
  it('labelArc runs left to right on both halves', () => {
    const coords = (d: string) => d.match(/-?[\d.]+/g)!.map(Number);
    const top = coords(labelArc(600, 400, 500, 300, -Math.PI / 2, 0.3));
    const bottom = coords(labelArc(600, 400, 500, 300, Math.PI / 2, 0.3));
    expect(top[0]!).toBeLessThan(top[top.length - 2]!);
    expect(bottom[0]!).toBeLessThan(bottom[bottom.length - 2]!);
  });
  it('handles no items', () => {
    expect(orbitLayout([], 'constellation', { width: 1200, height: 720 }).nodes).toEqual({});
  });
});
