import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Flow } from '../../../src/lib/schemas';
import {
  announceStep,
  arrowGeometry,
  clampIndex,
  initialPlayerState,
  keyToAction,
  orderSteps,
  playerReducer,
  stepDelay,
  type PlayerState,
} from '../../../src/components/protocol/lib/flow-player';

const flow = Flow.parse(JSON.parse(readFileSync(new URL('../../fixtures/flows/tricky-flow.json', import.meta.url), 'utf8')));
const steps = orderSteps(flow.steps);
const len = steps.length;
const run = (s: PlayerState, ...types: Parameters<typeof playerReducer>[1][]) =>
  types.reduce((acc, a) => playerReducer(acc, a, len), s);

describe('flow player step logic', () => {
  it('orders steps by n without mutating the input', () => {
    const shuffled = [...flow.steps].reverse();
    expect(orderSteps(shuffled).map((s) => s.n)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(shuffled[0]?.n).toBe(6);
  });

  it('clamps indexes', () => {
    expect(clampIndex(-3, 6)).toBe(0);
    expect(clampIndex(9, 6)).toBe(5);
    expect(clampIndex(2.7, 6)).toBe(2);
    expect(clampIndex(Number.NaN, 6)).toBe(0);
    expect(clampIndex(4, 0)).toBe(0);
  });

  it('steps forward and back, pausing playback', () => {
    let s = run(initialPlayerState, { type: 'play' });
    expect(s.playing).toBe(true);
    s = run(s, { type: 'next' });
    expect(s).toMatchObject({ index: 1, playing: false });
    s = run(s, { type: 'prev' }, { type: 'prev' });
    expect(s.index).toBe(0);
    s = run(s, { type: 'last' });
    expect(s.index).toBe(5);
    s = run(s, { type: 'next' });
    expect(s.index).toBe(5);
    s = run(s, { type: 'goto', index: 2 });
    expect(s.index).toBe(2);
  });

  it('ticks through the flow and stops at the last step', () => {
    let s = run(initialPlayerState, { type: 'play' });
    for (let i = 0; i < 10; i += 1) s = run(s, { type: 'tick' });
    expect(s).toMatchObject({ index: 5, playing: false });
    s = run(s, { type: 'tick' });
    expect(s.index).toBe(5);
  });

  it('restarts from the first step when play is pressed at the end', () => {
    const s = run({ ...initialPlayerState, index: 5 }, { type: 'play' });
    expect(s).toMatchObject({ index: 0, playing: true });
  });

  it('ignores ticks while paused and toggles with space', () => {
    let s = run(initialPlayerState, { type: 'tick' });
    expect(s.index).toBe(0);
    s = playerReducer(s, keyToAction(' ')!, len);
    expect(s.playing).toBe(true);
    s = playerReducer(s, keyToAction(' ')!, len);
    expect(s.playing).toBe(false);
  });

  it('accepts only known speeds and scales the delay', () => {
    expect(run(initialPlayerState, { type: 'speed', speed: 2 }).speed).toBe(2);
    expect(run(initialPlayerState, { type: 'speed', speed: 7 }).speed).toBe(1);
    expect(stepDelay(2)).toBe(stepDelay(1) / 2);
    expect(stepDelay(42)).toBe(stepDelay(1));
  });

  it('maps keys to actions', () => {
    expect(keyToAction('ArrowRight')).toEqual({ type: 'next' });
    expect(keyToAction('ArrowLeft')).toEqual({ type: 'prev' });
    expect(keyToAction('Home')).toEqual({ type: 'first' });
    expect(keyToAction('End')).toEqual({ type: 'last' });
    expect(keyToAction('a')).toBeNull();
  });

  it('computes arrow geometry across lanes', () => {
    const ids = flow.actors.map((a) => a.id);
    expect(arrowGeometry(steps[0]!, ids)).toEqual({ from: 0, to: 1, dir: 'right', span: 1 });
    expect(arrowGeometry(steps[1]!, ids)).toMatchObject({ dir: 'left' });
    expect(arrowGeometry({ from: 'end', to: 'end' }, ids).dir).toBe('self');
  });

  it('announces the step with the trust-boundary note', () => {
    const label = (id: string) => flow.actors.find((a) => a.id === id)?.label ?? id;
    const text = announceStep(steps[1], len, label);
    expect(text).toContain('Step 2 of 6');
    expect(text).toContain('Crosses a trust boundary.');
    expect(announceStep(undefined, len, label)).toBe('');
  });

  it('handles a one-step flow without playing', () => {
    expect(playerReducer(initialPlayerState, { type: 'play' }, 1).playing).toBe(false);
  });
});
