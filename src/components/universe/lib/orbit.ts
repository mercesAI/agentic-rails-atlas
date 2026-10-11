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

export interface OrbitLayout {
  nodes: Record<string, PlacedNode>;
  labels: GuideLabel[];
  ring: { cx: number; cy: number; rx: number; ry: number } | null;
  /** Extra height the band adds under the chart (0 in Constellation). */
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
  if (groups.length === 0) return { nodes, labels, ring: null, extraHeight: 0 };

  if (mode === 'constellation') {
    const cx = frame.width / 2;
    const cy = frame.height / 2;
    const rx = frame.width * 0.475;
    const ry = frame.height * 0.465;
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
      const inward = 0.86;
      labels.push({
        x: round(cx + rx * inward * Math.cos(mid)),
        y: round(cy + ry * inward * Math.sin(mid) + 4),
        text: ORBIT_CATEGORY_LABELS[cat],
        anchor: Math.cos(mid) > 0.35 ? 'end' : Math.cos(mid) < -0.35 ? 'start' : 'middle',
        kind: 'category',
      });
      a += gapSlots * step;
    }
    return { nodes, labels, ring: { cx, cy, rx: round(rx), ry: round(ry) }, extraHeight: 0 };
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
  return { nodes, labels, ring: null, extraHeight: ORBIT_BAND_H };
}
