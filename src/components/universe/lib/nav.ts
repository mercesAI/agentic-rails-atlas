/** Keyboard navigation between bubbles: arrow keys move to the nearest bubble in that direction. */
import type { Point } from './types';

export type Direction = 'left' | 'right' | 'up' | 'down';

export const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowLeft: 'left',
  ArrowRight: 'right',
  ArrowUp: 'up',
  ArrowDown: 'down',
};

/**
 * The nearest node whose center lies in the given direction (within a 60 degree
 * half-cone is preferred; off-axis distance is penalized). Falls back to the
 * next or previous node in `order` so every arrow press moves somewhere.
 */
export function nextInDirection(
  nodes: Readonly<Record<string, Point>>,
  order: readonly string[],
  from: string,
  dir: Direction,
): string | null {
  const here = nodes[from];
  if (!here || order.length < 2) return null;
  let best: string | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  for (const id of order) {
    if (id === from) continue;
    const p = nodes[id];
    if (!p) continue;
    const dx = p.x - here.x;
    const dy = p.y - here.y;
    const along = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy;
    const across = dir === 'left' || dir === 'right' ? Math.abs(dy) : Math.abs(dx);
    if (along <= 0.5) continue;
    const score = along + across * 2.2;
    if (score < bestScore) {
      bestScore = score;
      best = id;
    }
  }
  if (best) return best;
  const i = order.indexOf(from);
  const forward = dir === 'right' || dir === 'down';
  const j = (i + (forward ? 1 : -1) + order.length) % order.length;
  return order[j] ?? null;
}
