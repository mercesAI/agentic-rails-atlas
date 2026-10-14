import { describe, expect, it } from 'vitest';
import {
  buildPersonaMap,
  daysBefore,
  protocolRelations,
  recentEvents,
  resolveOrbit,
  type OrbitSeed,
} from '../../../src/components/universe/lib/data';

describe('recentEvents', () => {
  const events = [
    { date: '2026-08-11', lane: 'x', title: 'Too old' },
    { date: '2026-08-12', lane: 'x', title: 'Edge' },
    { date: '2026-10-01', lane: 'y', title: 'New' },
    { date: '2026-10-01', lane: 'z', title: 'new' },
    { date: '2026-10-12', lane: 'x', title: 'Future' },
    { date: '2026-09-01', lane: 'x', title: 'Old idea', kind: 'prehistory' },
  ];
  it('keeps events from the last 60 days, newest first, without duplicates', () => {
    expect(daysBefore('2026-10-11', 60)).toBe('2026-08-12');
    expect(recentEvents(events, '2026-10-11').map((e) => e.title)).toEqual(['New', 'Edge']);
  });
});

describe('buildPersonaMap', () => {
  it('marks profiled personas high and responsibility-only columns medium', () => {
    const map = buildPersonaMap(
      [
        { slug: 'x402', personas: ['agent-dev'] },
        { slug: 'ap2', personas: ['consumer'] },
      ],
      [{ protocol: 'x402', personas: [{ persona: 'api-seller' }], responsibilities: { columns: ['api-seller', 'psp'] } }],
    );
    expect(map['agent-dev']).toEqual({ x402: 'high' });
    expect(map['api-seller']).toEqual({ x402: 'high' });
    expect(map['psp']).toEqual({ x402: 'medium' });
    expect(map['consumer']).toEqual({ ap2: 'high' });
  });
});

describe('protocolRelations', () => {
  it('drops relations to absent protocols and duplicates', () => {
    const rels = protocolRelations(
      [
        { from: 'a', to: 'b', type: 'embeds', note: '1' },
        { from: 'a', to: 'b', type: 'embeds', note: '2' },
        { from: 'a', to: 'mcp', type: 'complements', note: '' },
      ],
      new Set(['a', 'b']),
    );
    expect(rels).toHaveLength(1);
  });
});

describe('orbit satellites', () => {
  const seeds: OrbitSeed[] = [
    { slug: 'a', name: 'A', category: 'agent-communication', oneLiner: 'One.', primaryLink: 'https://example.org/a' },
    { slug: 'b', name: 'B', category: 'agent-identity', oneLiner: 'Two.', primaryLink: 'https://example.org/b' },
  ];
  it('link to the orbit page only when it exists', () => {
    const out = resolveOrbit(seeds, new Set(['a']));
    expect(out[0]).toMatchObject({ href: '/orbit/a/', external: false });
    expect(out[1]).toMatchObject({ href: 'https://example.org/b', external: true });
  });
});
