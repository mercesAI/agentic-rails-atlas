/**
 * Layout math for the four universe modes (ATLAS_PROMPT.md 4.3). Pure and
 * deterministic: the same input always yields the same coordinates, so the
 * server-rendered HTML matches the hydrated island. Coordinates live in a
 * fixed frame (FRAME_W by the mode height) that the island scales to fit.
 */
import { FAMILIES, LAYER_LABELS, LAYERS, type Family, type Layer } from '../../../lib/schemas';
import { FAMILY_SHORT } from './labels';
import { bubbleRadius, layerIndex, railScore } from './encoding';
import { relax, round } from './relax';
import type { LayoutGuides, LayoutMode, LayoutResult, PlacedNode, UniverseProtocol } from './types';

export const FRAME_W = 1200;
export const FRAME_H = 720;

/** Room under a full bubble for the tagline and the status line. */
const TEXT_ROOM_FULL = 44;
/** Room under a compact bubble for the status line. */
const TEXT_ROOM_COMPACT = 22;

function emptyGuides(): LayoutGuides {
  return { rings: [], labels: [], hlines: [], vlines: [], spans: [] };
}

function byOrder(a: UniverseProtocol, b: UniverseProtocol): number {
  return a.order - b.order || a.slug.localeCompare(b.slug);
}

/** Cluster centers for the four families, on an ellipse around the frame center. */
export function familyCenters(width = FRAME_W, height = FRAME_H): Record<Family, { x: number; y: number }> {
  const cx = width / 2;
  const cy = height / 2;
  const rx = width * 0.23;
  const ry = height * 0.24;
  const angles: Record<Family, number> = {
    'identity-trust': -150,
    'authorization-intent': -30,
    'checkout-orders': 35,
    'payment-execution': 150,
  };
  const out = {} as Record<Family, { x: number; y: number }>;
  for (const f of FAMILIES) {
    const a = (angles[f] * Math.PI) / 180;
    out[f] = { x: round(cx + rx * Math.cos(a)), y: round(cy + ry * Math.sin(a)) };
  }
  return out;
}

export function constellationLayout(protocols: readonly UniverseProtocol[]): LayoutResult {
  const width = FRAME_W;
  const height = FRAME_H;
  const centers = familyCenters(width, height);
  const sorted = [...protocols].sort(byOrder);
  const radii = new Map(sorted.map((p) => [p.slug, bubbleRadius(p)]));
  const inFamily = new Map<Family, number>();
  const placed = relax(
    sorted.map((p) => {
      const k = inFamily.get(p.family) ?? 0;
      inFamily.set(p.family, k + 1);
      const c = centers[p.family];
      // Spread family members on a small arc so the relaxation starts untangled.
      const a = (k * 2 * Math.PI) / 3 + (p.family === 'payment-execution' ? Math.PI / 2 : 0);
      return {
        id: p.slug,
        tx: c.x + (k === 0 && countFamily(sorted, p.family) === 1 ? 0 : Math.cos(a) * 70),
        ty: c.y + (k === 0 && countFamily(sorted, p.family) === 1 ? 0 : Math.sin(a) * 40),
        cr: (radii.get(p.slug) ?? 54) + TEXT_ROOM_FULL / 2 + 14,
      };
    }),
    { strengthX: 0.08, strengthY: 0.1, ticks: 320, bounds: { x0: 40, y0: 30, x1: width - 40, y1: height - 30 } },
  );
  const nodes: Record<string, PlacedNode> = {};
  for (const p of sorted) {
    const pos = placed[p.slug] ?? centers[p.family];
    nodes[p.slug] = { x: pos.x, y: pos.y, r: radii.get(p.slug) ?? 54 };
  }
  const guides = emptyGuides();
  const cx = width / 2;
  const cy = height / 2;
  guides.rings = [0.16, 0.3, 0.44].map((f) => ({ cx, cy, rx: round(width * f), ry: round(height * f * 0.95) }));
  for (const f of FAMILIES) {
    const members = sorted.filter((p) => p.family === f);
    if (members.length === 0) continue;
    const xs = members.map((p) => nodes[p.slug]!.x);
    const top = Math.min(...members.map((p) => nodes[p.slug]!.y - nodes[p.slug]!.r));
    const bottom = Math.max(...members.map((p) => nodes[p.slug]!.y + nodes[p.slug]!.r));
    const upper = centers[f].y < cy;
    guides.labels.push({
      x: round(xs.reduce((s, v) => s + v, 0) / xs.length),
      y: round(upper ? top - 16 : bottom + TEXT_ROOM_FULL + 22),
      text: FAMILY_SHORT[f],
      anchor: 'middle',
      kind: 'family',
    });
  }
  return { mode: 'constellation', width, height, compact: false, nodes, guides };
}

function countFamily(list: readonly UniverseProtocol[], f: Family): number {
  return list.filter((p) => p.family === f).length;
}

export const LAYERS_TOP = 46;
export const LAYERS_ROW = 82;
export const LAYERS_LABEL_X = 24;
export const LAYERS_X0 = 300;
export const LAYERS_X1 = 1140;

export function layerRowY(layer: Layer): number {
  return LAYERS_TOP + layerIndex(layer) * LAYERS_ROW + LAYERS_ROW / 2;
}

export function layersLayout(protocols: readonly UniverseProtocol[]): LayoutResult {
  const width = FRAME_W;
  const height = LAYERS_TOP + LAYERS.length * LAYERS_ROW + 24;
  const sorted = [...protocols].sort(
    (a, b) => layerIndex(a.layerPrimary) - layerIndex(b.layerPrimary) || byOrder(a, b),
  );
  const n = sorted.length;
  const step = n > 1 ? (LAYERS_X1 - LAYERS_X0) / (n - 1) : 0;
  const nodes: Record<string, PlacedNode> = {};
  const guides = emptyGuides();
  sorted.forEach((p, i) => {
    const x = round(n > 1 ? LAYERS_X0 + i * step : (LAYERS_X0 + LAYERS_X1) / 2);
    const y = layerRowY(p.layerPrimary);
    nodes[p.slug] = { x, y, r: round(bubbleRadius(p, 27)) };
    const secondary = [...new Set(p.layersSecondary)].filter((l) => l !== p.layerPrimary).map(layerRowY);
    if (secondary.length > 0) {
      const all = [y, ...secondary];
      guides.spans.push({ slug: p.slug, x, y1: Math.min(...all), y2: Math.max(...all), marks: secondary.sort((a, b) => a - b) });
    }
  });
  LAYERS.forEach((l, i) => {
    const yTop = LAYERS_TOP + i * LAYERS_ROW;
    guides.hlines.push({ x1: LAYERS_LABEL_X, x2: width - 24, y: yTop });
    guides.labels.push({ x: LAYERS_LABEL_X, y: yTop + LAYERS_ROW / 2 + 4, text: LAYER_LABELS[l], anchor: 'start', kind: 'row' });
  });
  guides.hlines.push({ x1: LAYERS_LABEL_X, x2: width - 24, y: LAYERS_TOP + LAYERS.length * LAYERS_ROW });
  return { mode: 'layers', width, height, compact: true, nodes, guides };
}

/** Rails map rows: identity at the top, settlement at the bottom. */
export const RAILS_LAYERS: readonly Layer[] = [
  'identity-trust',
  'intent-authorization',
  'checkout-orders',
  'payment-credential',
  'settlement-rails',
];
export const RAILS_X0 = 300;
export const RAILS_X1 = 1110;
export const RAILS_Y0 = 90;
export const RAILS_ROW = 118;

export function railsY(layer: Layer): number {
  const i = RAILS_LAYERS.indexOf(layer);
  // Layers outside the identity-to-settlement span snap to the nearest end.
  const idx = i >= 0 ? i : layerIndex(layer) < layerIndex('identity-trust') ? 0 : RAILS_LAYERS.length - 1;
  return RAILS_Y0 + idx * RAILS_ROW;
}

export function railsX(score: number): number {
  return round(RAILS_X0 + Math.min(1, Math.max(0, score)) * (RAILS_X1 - RAILS_X0));
}

export function railsLayout(protocols: readonly UniverseProtocol[]): LayoutResult {
  const width = FRAME_W;
  const height = FRAME_H;
  const sorted = [...protocols].sort(byOrder);
  const radii = new Map(sorted.map((p) => [p.slug, round(bubbleRadius(p, 36))]));
  const placed = relax(
    sorted.map((p) => ({
      id: p.slug,
      tx: railsX(railScore(p.rails)),
      ty: railsY(p.layerPrimary),
      cr: (radii.get(p.slug) ?? 36) + TEXT_ROOM_COMPACT / 2 + 12,
    })),
    { strengthX: 0.35, strengthY: 0.5, ticks: 300, bounds: { x0: 230, y0: 30, x1: width - 20, y1: height - 70 } },
  );
  const nodes: Record<string, PlacedNode> = {};
  for (const p of sorted) {
    const pos = placed[p.slug]!;
    nodes[p.slug] = { x: pos.x, y: pos.y, r: radii.get(p.slug) ?? 36 };
  }
  const guides = emptyGuides();
  RAILS_LAYERS.forEach((l) => {
    const y = railsY(l);
    guides.hlines.push({ x1: 230, x2: width - 20, y });
    guides.labels.push({ x: 24, y: y + 4, text: LAYER_LABELS[l], anchor: 'start', kind: 'row' });
  });
  const axisY = height - 34;
  for (const [score, text, anchor] of [
    [0, 'Crypto-native', 'middle'],
    [0.5, 'Rail-agnostic or multi-rail', 'middle'],
    [1, 'Card network', 'middle'],
  ] as const) {
    guides.vlines.push({ x: railsX(score), y1: 30, y2: axisY - 18 });
    guides.labels.push({ x: railsX(score), y: axisY, text, anchor, kind: 'axis' });
  }
  return { mode: 'rails', width, height, compact: true, nodes, guides };
}

export const TIMELINE_X0 = 110;
export const TIMELINE_X1 = 1110;
export const TIMELINE_LANES = [140, 300, 460, 220, 380] as const;
const DAY = 86_400_000;

export function parseDate(d: string): Date {
  return new Date(`${d}T00:00:00Z`);
}

/** Greedy lane assignment: the first lane whose last bubble is far enough to the left. */
export function assignLanes(xs: readonly number[], minGap: number, laneCount: number): number[] {
  const lastX: number[] = Array.from({ length: laneCount }, () => Number.NEGATIVE_INFINITY);
  return xs.map((x) => {
    let lane = lastX.findIndex((lx) => x - lx >= minGap);
    if (lane < 0) lane = lastX.indexOf(Math.min(...lastX));
    lastX[lane] = x;
    return lane;
  });
}

export function quarterTicks(from: Date, to: Date): { date: Date; label: string }[] {
  const out: { date: Date; label: string }[] = [];
  let y = from.getUTCFullYear();
  let q = Math.floor(from.getUTCMonth() / 3);
  for (;;) {
    const d = new Date(Date.UTC(y, q * 3, 1));
    if (d > to) break;
    if (d >= from) out.push({ date: d, label: `${y} Q${q + 1}` });
    q += 1;
    if (q === 4) {
      q = 0;
      y += 1;
    }
  }
  return out;
}

/** Linear date-to-x mapping (a tiny stand-in for d3-scale's scaleUtc, which would add the time-format modules). */
export function linearTime(domain: [Date, Date], range: [number, number]): (d: Date) => number {
  const t0 = domain[0].getTime();
  const span = domain[1].getTime() - t0 || 1;
  return (d) => range[0] + ((d.getTime() - t0) / span) * (range[1] - range[0]);
}

export function timelineLayout(protocols: readonly UniverseProtocol[]): LayoutResult {
  const width = FRAME_W;
  const height = FRAME_H;
  const sorted = [...protocols].sort((a, b) => a.firstAnnounced.localeCompare(b.firstAnnounced) || byOrder(a, b));
  const guides = emptyGuides();
  const nodes: Record<string, PlacedNode> = {};
  if (sorted.length === 0) return { mode: 'timeline', width, height, compact: true, nodes, guides };
  const first = parseDate(sorted[0]!.firstAnnounced).getTime();
  const last = parseDate(sorted[sorted.length - 1]!.firstAnnounced).getTime();
  const pad = Math.max(30 * DAY, (last - first) * 0.06);
  const domain: [Date, Date] = [new Date(first - pad), new Date(last + pad)];
  const x = linearTime(domain, [TIMELINE_X0, TIMELINE_X1]);
  const xs = sorted.map((p) => round(x(parseDate(p.firstAnnounced))));
  const radius = 34;
  const lanes = assignLanes(xs, radius * 2 + 64, TIMELINE_LANES.length);
  const axisY = height - 70;
  sorted.forEach((p, i) => {
    const r = round(bubbleRadius(p, radius));
    const y = TIMELINE_LANES[lanes[i] ?? 0] ?? TIMELINE_LANES[0];
    nodes[p.slug] = { x: xs[i]!, y, r };
    // Stem from under the status and date lines down to the axis.
    guides.vlines.push({ x: xs[i]!, y1: y + r + TEXT_ROOM_COMPACT + 30, y2: axisY });
  });
  guides.hlines.push({ x1: TIMELINE_X0 - 30, x2: TIMELINE_X1 + 30, y: axisY });
  for (const t of quarterTicks(domain[0], domain[1])) {
    guides.labels.push({ x: round(x(t.date)), y: axisY + 24, text: t.label, anchor: 'middle', kind: 'tick' });
  }
  return { mode: 'timeline', width, height, compact: true, nodes, guides };
}

export function computeLayout(mode: LayoutMode, protocols: readonly UniverseProtocol[]): LayoutResult {
  switch (mode) {
    case 'layers':
      return layersLayout(protocols);
    case 'rails':
      return railsLayout(protocols);
    case 'timeline':
      return timelineLayout(protocols);
    default:
      return constellationLayout(protocols);
  }
}

