import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { StateMachine } from '../../../src/lib/schemas';
import { computeLayers, layoutStateMachine } from '../../../src/components/protocol/lib/state-layout';

const machine = StateMachine.parse(
  JSON.parse(readFileSync(new URL('../../fixtures/states/tricky-state.json', import.meta.url), 'utf8')),
);

describe('state machine layered layout', () => {
  it('assigns layers by distance from the initial state', () => {
    const layers = computeLayers(machine);
    expect(layers.get('not-ready')).toBe(0);
    expect(layers.get('ready')).toBe(1);
    expect(layers.get('canceled')).toBe(1);
    expect(layers.get('completed')).toBe(2);
  });

  it('places unreachable states after the deepest layer', () => {
    const layers = computeLayers({
      states: [{ id: 'a', label: 'a', initial: true }, { id: 'b', label: 'b' }, { id: 'orphan', label: 'o' }],
      transitions: [{ from: 'a', to: 'b', trigger: 't' }],
    });
    expect(layers.get('orphan')).toBe(2);
  });

  it('lays out nodes without overlap and classifies edges', () => {
    const l = layoutStateMachine({
      ...machine,
      transitions: [...machine.transitions, { from: 'ready', to: 'not-ready', trigger: 'edit' }, { from: 'ready', to: 'ready', trigger: 'update' }],
    });
    const seen = new Set(l.nodes.map((n) => `${n.x},${n.y}`));
    expect(seen.size).toBe(l.nodes.length);
    expect(l.edges.map((e) => e.kind)).toEqual(['forward', 'forward', 'same-layer', 'forward', 'back', 'self']);
    for (const e of l.edges) expect(e.path).toMatch(/^M /);
    expect(l.width).toBeGreaterThan(0);
    expect(l.height).toBeGreaterThan(0);
  });

  it('keeps every edge and label inside the canvas, including same-layer bulges in the last layer', () => {
    const l = layoutStateMachine({
      states: [{ id: 'a', label: 'a', initial: true }, { id: 'b', label: 'b' }, { id: 'c', label: 'c' }],
      transitions: [{ from: 'a', to: 'b', trigger: 't' }, { from: 'a', to: 'c', trigger: 't' }, { from: 'b', to: 'c', trigger: 'bulge' }, { from: 'c', to: 'b', trigger: 'bulge back' }],
    });
    const sameLayer = l.edges.filter((e) => e.kind === 'same-layer');
    expect(sameLayer.length).toBe(2);
    for (const e of l.edges) {
      const xs = [...e.path.matchAll(/(-?[\d.]+) (-?[\d.]+)/g)].map((m) => Number(m[1]));
      for (const x of xs) expect(x).toBeLessThanOrEqual(l.width);
      expect(e.labelX + 9).toBeLessThanOrEqual(l.width);
      expect(e.labelY).toBeLessThanOrEqual(l.height);
    }
  });
});
