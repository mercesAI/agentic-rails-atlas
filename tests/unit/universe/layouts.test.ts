import { describe, expect, it } from 'vitest';
import {
  assignLanes,
  computeLayout,
  layerRowY,
  quarterTicks,
  railsX,
  railsY,
} from '../../../src/components/universe/lib/layouts';
import { LAYOUT_MODES, type LayoutResult } from '../../../src/components/universe/lib/types';
import { PROTOCOLS } from './fixtures';

function overlaps(l: LayoutResult): string[] {
  const ids = Object.keys(l.nodes);
  const bad: string[] = [];
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = l.nodes[ids[i]!]!;
      const b = l.nodes[ids[j]!]!;
      if (Math.hypot(a.x - b.x, a.y - b.y) < a.r + b.r) bad.push(`${ids[i]}/${ids[j]}`);
    }
  }
  return bad;
}

describe('computeLayout', () => {
  for (const mode of LAYOUT_MODES) {
    it(`${mode}: places every protocol inside the frame without overlaps`, () => {
      const l = computeLayout(mode, PROTOCOLS);
      expect(Object.keys(l.nodes).sort()).toEqual(PROTOCOLS.map((p) => p.slug).sort());
      for (const n of Object.values(l.nodes)) {
        expect(n.x - n.r).toBeGreaterThanOrEqual(0);
        expect(n.x + n.r).toBeLessThanOrEqual(l.width);
        expect(n.y - n.r).toBeGreaterThanOrEqual(0);
        expect(n.y + n.r).toBeLessThanOrEqual(l.height);
      }
      expect(overlaps(l)).toEqual([]);
    });

    it(`${mode}: is deterministic`, () => {
      expect(computeLayout(mode, PROTOCOLS)).toEqual(computeLayout(mode, [...PROTOCOLS].reverse()));
    });

    it(`${mode}: works with any subset`, () => {
      for (const n of [0, 1, 3, 5]) {
        const l = computeLayout(mode, PROTOCOLS.slice(0, n));
        expect(Object.keys(l.nodes)).toHaveLength(n);
      }
    });
  }

  it('constellation keeps family members closer to each other than to other families', () => {
    const l = computeLayout('constellation', PROTOCOLS);
    const d = (a: string, b: string) => Math.hypot(l.nodes[a]!.x - l.nodes[b]!.x, l.nodes[a]!.y - l.nodes[b]!.y);
    expect(d('erc-8004', 'visa-tap')).toBeLessThan(d('erc-8004', 'ucp'));
    expect(d('openai-acp', 'ucp')).toBeLessThan(d('openai-acp', 'x402'));
    expect(l.compact).toBe(false);
  });

  it('layers puts each bubble in its primary row and spans its secondary rows', () => {
    const l = computeLayout('layers', PROTOCOLS);
    expect(l.nodes['ap2']!.y).toBe(layerRowY('intent-authorization'));
    expect(l.nodes['x402']!.y).toBe(layerRowY('settlement-rails'));
    const span = l.guides.spans.find((s) => s.slug === 'erc-8004')!;
    expect(span.marks).toEqual([layerRowY('discovery'), layerRowY('reputation-feedback')]);
    expect(span.y1).toBe(layerRowY('discovery'));
    expect(span.y2).toBe(layerRowY('reputation-feedback'));
    expect(l.guides.labels.filter((g) => g.kind === 'row')).toHaveLength(8);
    // One column per bubble, so spans never cross another bubble.
    const xs = Object.values(l.nodes).map((n) => n.x);
    expect(new Set(xs).size).toBe(xs.length);
  });

  it('rails map orders crypto-native left of card network and identity above settlement', () => {
    const l = computeLayout('rails', PROTOCOLS);
    expect(l.nodes['x402']!.x).toBeLessThan(l.nodes['visa-tap']!.x);
    expect(l.nodes['erc-8004']!.y).toBeLessThan(l.nodes['x402']!.y);
    expect(railsX(0)).toBeLessThan(railsX(1));
    expect(railsY('discovery')).toBe(railsY('identity-trust'));
    expect(railsY('reputation-feedback')).toBe(railsY('settlement-rails'));
  });

  it('timeline orders bubbles by first announcement', () => {
    const l = computeLayout('timeline', PROTOCOLS);
    const order = [...PROTOCOLS].sort((a, b) => a.firstAnnounced.localeCompare(b.firstAnnounced)).map((p) => p.slug);
    const xs = order.map((s) => l.nodes[s]!.x);
    expect(xs).toEqual([...xs].sort((a, b) => a - b));
    expect(order[0]).toBe('mastercard-agent-pay');
    expect(order.at(-1)).toBe('stripe-mpp');
    expect(l.guides.labels.some((g) => g.kind === 'tick' && g.text === '2025 Q3')).toBe(true);
  });
});

describe('timeline helpers', () => {
  it('assignLanes reuses a lane once there is room', () => {
    expect(assignLanes([0, 10, 200, 210], 100, 3)).toEqual([0, 1, 0, 1]);
  });
  it('assignLanes falls back to the lane used longest ago', () => {
    expect(assignLanes([0, 10, 20], 100, 2)).toEqual([0, 1, 0]);
  });
  it('quarterTicks lists quarter starts inside the range', () => {
    const t = quarterTicks(new Date('2025-02-10T00:00:00Z'), new Date('2025-10-01T00:00:00Z'));
    expect(t.map((x) => x.label)).toEqual(['2025 Q2', '2025 Q3', '2025 Q4']);
  });
});
