import { describe, expect, it } from 'vitest';
import {
  buildLevels,
  formatMinutes,
  gatePassed,
  levelMinutes,
  levelStatus,
  normalizeProgress,
  quizBest,
  toggleItem,
} from '../../../src/components/hub/lib/learn';

const levels = buildLevels({
  protocols: [
    { slug: 'x402', name: 'x402', family: 'payment-execution' },
    { slug: 'ap2', name: 'AP2', family: 'authorization-intent' },
  ],
  families: [
    { id: 'identity-trust', label: 'Identity and trust' },
    { id: 'payment-execution', label: 'Payment execution and credentials' },
  ],
  quizSlugs: new Set(['x402']),
  openQuestions: [{ slug: 'x402', count: 6, first: 'Q?' }, { slug: 'ap2', count: 0 }],
  scenarios: [],
  glossaryIds: new Set(['http-402']),
});

describe('learn path', () => {
  it('builds five levels in order', () => {
    expect(levels.map((l) => l.n)).toEqual([1, 2, 3, 4, 5]);
    expect(levels[0]?.items[0]?.href).toBe('/glossary/#http-402');
    expect(levels[0]?.items.find((i) => i.id === 'f-tokens')?.href).toBe('/glossary/');
    expect(levels[1]?.items[1]?.label).toBe('Payment execution and credentials: x402');
    expect(levels[2]?.gates.map((g) => g.slug)).toEqual(['x402']);
    expect(levels[2]?.pending).toContain('AP2');
    expect(levels[3]?.items[0]?.href).toBe('/scenarios/');
    expect(levels[4]?.items.map((i) => i.id)).toEqual(['r-x402', 'r-library']);
  });

  it('normalizes and toggles progress', () => {
    expect(normalizeProgress(null)).toEqual({ checked: [] });
    expect(normalizeProgress({ checked: ['a', 'a', 3] }).checked).toEqual(['a']);
    const p = toggleItem({ checked: [] }, 'f-http-402', 'now');
    expect(p.checked).toEqual(['f-http-402']);
    expect(toggleItem(p, 'f-http-402', 'now').checked).toEqual([]);
  });

  it('reads quiz results and evaluates gates', () => {
    expect(quizBest({ best: 8 })).toBe(8);
    expect(quizBest({ submitted: true, score: 6 })).toBe(6);
    expect(quizBest({ submitted: false, score: 6 })).toBeUndefined();
    const gate = levels[2]!.gates[0]!;
    expect(gatePassed(gate, 7)).toBe(true);
    expect(gatePassed(gate, 6)).toBe(false);
    expect(gatePassed(gate, undefined)).toBe(false);
  });

  it('computes level status and time', () => {
    const level = levels[2]!;
    const none = levelStatus(level, { checked: [] }, {});
    expect(none).toMatchObject({ done: 0, total: 4, gatesPassed: 0, gatesTotal: 1, complete: false, percent: 0 });
    const all = levelStatus(level, { checked: level.items.map((i) => i.id) }, { x402: 9 });
    expect(all.complete).toBe(true);
    expect(all.percent).toBe(100);
    expect(levelMinutes(level)).toBe(25 + 10 + 25 + 10 + 10);
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(120)).toBe('2 h');
    expect(formatMinutes(95)).toBe('1 h 35 min');
  });
});
