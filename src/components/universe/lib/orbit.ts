/**
 * Orbit satellites: small bubbles for related standards (ATLAS_PROMPT.md 6),
 * grouped by category. In Constellation they sit on an outer ellipse in one
 * arc per category; in the other modes they sit in a band under the chart.
 */
import { ORBIT_CATEGORY_LABELS } from './encoding';
import { round } from './relax';
import { ORBIT_CATEGORIES, type GuideLabel, type LayoutMode, type OrbitCategoryId, type PlacedNode, type UniverseOrbit } from './types';

export const SATELLITE_R = 7;
export const ORBIT_BAND_H = 190;
export const ORBIT_RING_EXTRA = 90;

export interface OrbitLayout {
  nodes: Record<string, PlacedNode>;
  labels: GuideLabel[];
  ring: { cx: number; cy: number; rx: number; ry: number } | null;
  /** Constellation: category names set along the ring (SVG path data for a textPath). */
  arcs: { key: string; text: string; d: string }[];
  /** Extra height the ring or the band adds under the chart. */
  extraHeight: number;
}

export function groupByCategory(items: readonly UniverseOrbit[]): [OrbitCategoryId, UniverseOrbit[]][] {
  const groups: [OrbitCategoryId, UniverseOrbit[]][] = [];
  for (const c of ORBIT_CATEGORIES) {
    const list = items.filter((i) => i.category === c).sort((a, b) => a.name.localeCompare(b.name));
    if (list.length > 0) groups.push([c, list]);
  }
  return groups;
}

export function orbitLayout(
  items: readonly UniverseOrbit[],
  mode: LayoutMode,
  frame: { width: number; height: number },
): OrbitLayout {
  const groups = groupByCategory(items);
  const nodes: Record<string, PlacedNode> = {};
  const labels: GuideLabel[] = [];
  const arcs: OrbitLayout['arcs'] = [];
  if (groups.length === 0) return { nodes, labels, ring: null, arcs, extraHeight: 0 };

  if (mode === 'constellation') {
    // The ring grows the canvas a little so satellites clear the text under the bubbles.
    const extra = ORBIT_RING_EXTRA;
    const cx = frame.width / 2;
    const cy = (frame.height + extra) / 2;
    const rx = frame.width * 0.475;
    const ry = (frame.height + extra) / 2 - 20;
    const total = groups.reduce((n, [, list]) => n + list.length, 0);
    const gapSlots = 2.2;
    const slots = total + gapSlots * groups.length;
    const step = (2 * Math.PI) / slots;
    // Start at the top, go clockwise.
    let a = -Math.PI / 2 + (gapSlots * step) / 2;
    for (const [cat, list] of groups) {
      const start = a;
      for (const item of list) {
        nodes[item.slug] = { x: round(cx + rx * Math.cos(a)), y: round(cy + ry * Math.sin(a)), r: SATELLITE_R };
        a += step;
      }
      const mid = (start + a - step) / 2;
      const half = Math.max((a - start) / 2, 0.34);
      arcs.push({ key: cat, text: ORBIT_CATEGORY_LABELS[cat], d: labelArc(cx, cy, rx, ry, mid, half) });
      a += gapSlots * step;
    }
    return { nodes, labels, ring: { cx, cy, rx: round(rx), ry: round(ry) }, arcs, extraHeight: extra };
  }

  const top = frame.height + 20;
  const x0 = 40;
  const colW = (frame.width - 2 * x0) / groups.length;
  const perRow = Math.max(3, Math.floor((colW - 24) / 30));
  groups.forEach(([cat, list], gi) => {
    const left = x0 + gi * colW;
    labels.push({ x: round(left), y: top + 14, text: ORBIT_CATEGORY_LABELS[cat], anchor: 'start', kind: 'category' });
    list.forEach((item, i) => {
      nodes[item.slug] = {
        x: round(left + SATELLITE_R + (i % perRow) * 30),
        y: round(top + 44 + Math.floor(i / perRow) * 30),
        r: SATELLITE_R,
      };
    });
  });
  return { nodes, labels, ring: null, arcs, extraHeight: ORBIT_BAND_H };
}

/**
 * Path for a category name set just inside the ring, centered on angle `mid`.
 * The path always runs left to right on screen so the text is never upside down:
 * clockwise on the upper half, counterclockwise on the lower half (where the
 * glyphs face the center, so the path sits closer to the ring).
 */
export function labelArc(cx: number, cy: number, rx: number, ry: number, mid: number, half: number): string {
  const lower = Math.sin(mid) > 0;
  const inset = lower ? 17 : 27;
  const ex = rx - inset;
  const ey = ry - inset;
  const pt = (t: number) => `${round(cx + ex * Math.cos(t))} ${round(cy + ey * Math.sin(t))}`;
  const [from, to, sweep] = lower ? [mid + half, mid - half, 0] : [mid - half, mid + half, 1];
  return `M ${pt(from)} A ${round(ex)} ${round(ey)} 0 0 ${sweep} ${pt(to)}`;
}
