/**
 * Layered layout for the StateMachineExplorer (no graph library).
 * Layer = shortest distance from an initial state (breadth first); states not
 * reachable from an initial state go after the deepest layer. Pure, unit tested.
 */
import type { StateMachine } from '../../../lib/schemas';

export interface LaidOutNode {
  id: string;
  layer: number;
  row: number;
  x: number;
  y: number;
}

export interface LaidOutEdge {
  index: number;
  from: string;
  to: string;
  kind: 'forward' | 'back' | 'same-layer' | 'self';
  path: string;
  labelX: number;
  labelY: number;
}

export interface Layout {
  nodes: LaidOutNode[];
  edges: LaidOutEdge[];
  width: number;
  height: number;
  nodeW: number;
  nodeH: number;
}

export interface LayoutOptions {
  nodeW?: number;
  nodeH?: number;
  colGap?: number;
  rowGap?: number;
  pad?: number;
}

export function computeLayers(machine: Pick<StateMachine, 'states' | 'transitions'>): Map<string, number> {
  const layers = new Map<string, number>();
  const out = new Map<string, string[]>();
  for (const t of machine.transitions) out.set(t.from, [...(out.get(t.from) ?? []), t.to]);
  const initials = machine.states.filter((s) => s.initial).map((s) => s.id);
  const start = initials.length ? initials : machine.states.slice(0, 1).map((s) => s.id);
  const queue = [...start];
  for (const id of start) layers.set(id, 0);
  while (queue.length) {
    const id = queue.shift() as string;
    const d = layers.get(id) ?? 0;
    for (const to of out.get(id) ?? []) {
      if (!layers.has(to)) {
        layers.set(to, d + 1);
        queue.push(to);
      }
    }
  }
  let max = Math.max(0, ...layers.values());
  for (const s of machine.states) {
    if (!layers.has(s.id)) layers.set(s.id, ++max);
  }
  return layers;
}

export function layoutStateMachine(
  machine: Pick<StateMachine, 'states' | 'transitions'>,
  opts: LayoutOptions = {},
): Layout {
  const nodeW = opts.nodeW ?? 160;
  const nodeH = opts.nodeH ?? 48;
  const colGap = opts.colGap ?? 80;
  const rowGap = opts.rowGap ?? 36;
  const pad = opts.pad ?? 28;
  const layers = computeLayers(machine);
  const rowsPerLayer = new Map<number, number>();
  const nodes: LaidOutNode[] = machine.states.map((s) => {
    const layer = layers.get(s.id) ?? 0;
    const row = rowsPerLayer.get(layer) ?? 0;
    rowsPerLayer.set(layer, row + 1);
    return { id: s.id, layer, row, x: pad + layer * (nodeW + colGap), y: pad + row * (nodeH + rowGap) };
  });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const maxLayer = Math.max(0, ...nodes.map((n) => n.layer));
  const maxRows = Math.max(1, ...rowsPerLayer.values());
  const contentW = pad * 2 + (maxLayer + 1) * nodeW + maxLayer * colGap;
  const contentH = maxRows * nodeH + (maxRows - 1) * rowGap;
  const height = pad * 2 + contentH + 56;

  const edges: LaidOutEdge[] = machine.transitions.map((t, index) => {
    const a = byId.get(t.from);
    const b = byId.get(t.to);
    if (!a || !b) return { index, from: t.from, to: t.to, kind: 'forward', path: '', labelX: 0, labelY: 0 };
    const ay = a.y + nodeH / 2;
    const by = b.y + nodeH / 2;
    if (a.id === b.id) {
      const x = a.x + nodeW / 2;
      const y = a.y + nodeH;
      return {
        index,
        from: t.from,
        to: t.to,
        kind: 'self',
        path: `M ${x - 18} ${y} C ${x - 30} ${y + 34}, ${x + 30} ${y + 34}, ${x + 18} ${y}`,
        labelX: x,
        labelY: y + 30,
      };
    }
    if (b.layer > a.layer) {
      const x1 = a.x + nodeW;
      const x2 = b.x;
      const mx = (x1 + x2) / 2;
      return {
        index,
        from: t.from,
        to: t.to,
        kind: 'forward',
        path: `M ${x1} ${ay} C ${mx} ${ay}, ${mx} ${by}, ${x2} ${by}`,
        labelX: mx,
        labelY: (ay + by) / 2,
      };
    }
    if (b.layer === a.layer) {
      const x = a.x + nodeW;
      const bulge = x + 40;
      return {
        index,
        from: t.from,
        to: t.to,
        kind: 'same-layer',
        path: `M ${x} ${ay} C ${bulge} ${ay}, ${bulge} ${by}, ${x} ${by}`,
        labelX: bulge,
        labelY: (ay + by) / 2,
      };
    }
    // Back edge: loop under the drawing.
    const x1 = a.x + nodeW / 2;
    const x2 = b.x + nodeW / 2;
    const y1 = a.y + nodeH;
    const y2 = b.y + nodeH;
    const low = pad + contentH + 40 + (index % 3) * 6;
    return {
      index,
      from: t.from,
      to: t.to,
      kind: 'back',
      path: `M ${x1} ${y1} C ${x1} ${low}, ${x2} ${low}, ${x2} ${y2}`,
      labelX: (x1 + x2) / 2,
      labelY: low - 4,
    };
  });

  // Same-layer edges bulge past the last column and carry a label dot (radius 9); keep both inside the canvas.
  const LABEL_R = 9;
  const width = Math.max(contentW, ...edges.map((e) => e.labelX + LABEL_R + 4));
  return { nodes, edges, width, height, nodeW, nodeH };
}
