/**
 * Deterministic collision relaxation with d3-force: nodes are pulled toward
 * their targets and pushed apart by radius. The simulation never runs on a
 * timer; it is ticked a fixed number of times so server and client agree.
 */
import { forceCollide, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3';

export interface RelaxInput {
  id: string;
  tx: number;
  ty: number;
  /** Collision radius (bubble radius plus room for the text under it). */
  cr: number;
}

export interface RelaxOptions {
  strengthX?: number;
  strengthY?: number;
  charge?: number;
  ticks?: number;
  bounds?: { x0: number; y0: number; x1: number; y1: number };
}

interface SimNode extends SimulationNodeDatum {
  id: string;
  tx: number;
  ty: number;
  cr: number;
}

export function relax(input: readonly RelaxInput[], opts: RelaxOptions = {}): Record<string, { x: number; y: number }> {
  const { strengthX = 0.3, strengthY = 0.3, charge = 0, ticks = 300, bounds } = opts;
  const nodes: SimNode[] = input.map((n, i) => ({
    ...n,
    // Tiny deterministic offset so coincident targets separate along a stable axis.
    x: n.tx + ((i % 3) - 1) * 0.5,
    y: n.ty + ((Math.floor(i / 3) % 3) - 1) * 0.5,
  }));
  const sim = forceSimulation<SimNode>(nodes)
    .force('x', forceX<SimNode>((d) => d.tx).strength(strengthX))
    .force('y', forceY<SimNode>((d) => d.ty).strength(strengthY))
    .force('collide', forceCollide<SimNode>((d) => d.cr).iterations(3))
    .stop();
  if (charge !== 0) sim.force('charge', forceManyBody<SimNode>().strength(charge));
  for (let i = 0; i < ticks; i++) {
    sim.tick();
    if (bounds) {
      for (const n of nodes) {
        n.x = Math.min(bounds.x1 - n.cr, Math.max(bounds.x0 + n.cr, n.x ?? n.tx));
        n.y = Math.min(bounds.y1 - n.cr, Math.max(bounds.y0 + n.cr, n.y ?? n.ty));
      }
    }
  }
  const out: Record<string, { x: number; y: number }> = {};
  for (const n of nodes) out[n.id] = { x: round(n.x ?? n.tx), y: round(n.y ?? n.ty) };
  return out;
}

export function round(v: number): number {
  return Math.round(v * 10) / 10;
}
