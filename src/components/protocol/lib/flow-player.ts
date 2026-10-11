/**
 * Step logic for the FlowPlayer island (pure, unit tested).
 * The island keeps a PlayerState and feeds it PlayerActions; timers call `tick`.
 */
import type { Flow } from '../../../lib/schemas';

export type FlowStep = Flow['steps'][number];

export const SPEEDS = [0.5, 1, 1.5, 2] as const;
export type Speed = (typeof SPEEDS)[number];

/** Milliseconds a step stays on screen at speed 1. */
export const BASE_STEP_MS = 2400;

export interface PlayerState {
  index: number;
  playing: boolean;
  speed: Speed;
}

export type PlayerAction =
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'toggle' }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'first' }
  | { type: 'last' }
  | { type: 'tick' }
  | { type: 'goto'; index: number }
  | { type: 'speed'; speed: number };

export const initialPlayerState: PlayerState = { index: 0, playing: false, speed: 1 };

/** Steps in ascending `n` order (flows are authored in order, but never trust it). */
export function orderSteps(steps: readonly FlowStep[]): FlowStep[] {
  return [...steps].sort((a, b) => a.n - b.n);
}

export function clampIndex(index: number, length: number): number {
  if (length <= 0) return 0;
  if (!Number.isFinite(index)) return 0;
  return Math.min(Math.max(Math.trunc(index), 0), length - 1);
}

export function isSpeed(v: number): v is Speed {
  return (SPEEDS as readonly number[]).includes(v);
}

/** Delay before the next automatic step. */
export function stepDelay(speed: number): number {
  const s = isSpeed(speed) ? speed : 1;
  return Math.round(BASE_STEP_MS / s);
}

/**
 * Reducer. Playing past the last step stops; pressing play on the last step
 * restarts from the first. Manual stepping pauses playback.
 */
export function playerReducer(state: PlayerState, action: PlayerAction, length: number): PlayerState {
  const last = Math.max(length - 1, 0);
  switch (action.type) {
    case 'play':
      if (length <= 1) return { ...state, playing: false };
      return { ...state, playing: true, index: state.index >= last ? 0 : state.index };
    case 'pause':
      return { ...state, playing: false };
    case 'toggle':
      return playerReducer(state, { type: state.playing ? 'pause' : 'play' }, length);
    case 'next':
      return { ...state, playing: false, index: clampIndex(state.index + 1, length) };
    case 'prev':
      return { ...state, playing: false, index: clampIndex(state.index - 1, length) };
    case 'first':
      return { ...state, playing: false, index: 0 };
    case 'last':
      return { ...state, playing: false, index: last };
    case 'goto':
      return { ...state, playing: false, index: clampIndex(action.index, length) };
    case 'tick': {
      if (!state.playing) return state;
      if (state.index >= last) return { ...state, playing: false };
      const index = state.index + 1;
      return { ...state, index, playing: index < last };
    }
    case 'speed':
      return isSpeed(action.speed) ? { ...state, speed: action.speed } : state;
    default:
      return state;
  }
}

/** Keyboard mapping for the player region: arrows step, space toggles, Home and End jump. */
export function keyToAction(key: string): PlayerAction | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return { type: 'next' };
    case 'ArrowLeft':
    case 'ArrowUp':
      return { type: 'prev' };
    case ' ':
    case 'Spacebar':
      return { type: 'toggle' };
    case 'Home':
      return { type: 'first' };
    case 'End':
      return { type: 'last' };
    default:
      return null;
  }
}

/** Lane positions for the arrow of a step: from and to column indexes, direction and span. */
export function arrowGeometry(
  step: Pick<FlowStep, 'from' | 'to'>,
  actorIds: readonly string[],
): { from: number; to: number; dir: 'right' | 'left' | 'self'; span: number } {
  const from = Math.max(actorIds.indexOf(step.from), 0);
  const to = Math.max(actorIds.indexOf(step.to), 0);
  const dir = from === to ? 'self' : to > from ? 'right' : 'left';
  return { from, to, dir, span: Math.abs(to - from) };
}

/** Text for the aria-live region announcing the current step. */
export function announceStep(step: FlowStep | undefined, total: number, actorLabel: (id: string) => string): string {
  if (!step) return '';
  const boundary = step.crossesTrustBoundary ? ' Crosses a trust boundary.' : '';
  return `Step ${step.n} of ${total}: ${actorLabel(step.from)} to ${actorLabel(step.to)}. ${step.label}.${boundary}`.replace(
    /\.\./g,
    '.',
  );
}
