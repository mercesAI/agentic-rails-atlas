/** Radar geometry: six axes, values 0 to 5, one polygon per protocol (small multiples). */
import { C_RADAR_AXES as RADAR_AXES } from './constants';

export type RadarAxisId = (typeof RADAR_AXES)[number];

export const RADAR_AXIS_LABELS: Record<RadarAxisId, string> = {
  openness: 'Openness',
  decentralization: 'Decentralization',
  maturity: 'Maturity',
  'adoption-evidence': 'Adoption evidence',
  'human-not-present': 'Human-not-present support',
  'dispute-support': 'Dispute support',
};

export const RADAR_MAX = 5;

export interface RadarEntry {
  protocol: string;
  axis: RadarAxisId;
  value: number;
  justification: string;
  sources: string[];
}

/** Angle in radians for axis i of n, starting at 12 o'clock and going clockwise. */
export function axisAngle(i: number, n: number): number {
  return -Math.PI / 2 + (2 * Math.PI * i) / n;
}

export function polar(cx: number, cy: number, r: number, angle: number): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

/** Points for one protocol; a missing axis is null so the caller can show a gap. */
export function radarPoints(
  entries: RadarEntry[],
  cx: number,
  cy: number,
  radius: number,
): { axis: RadarAxisId; entry: RadarEntry | null; x: number; y: number }[] {
  const n = RADAR_AXES.length;
  return RADAR_AXES.map((axis, i) => {
    const entry = entries.find((e) => e.axis === axis) ?? null;
    const v = entry ? Math.max(0, Math.min(RADAR_MAX, entry.value)) : 0;
    const [x, y] = polar(cx, cy, (radius * v) / RADAR_MAX, axisAngle(i, n));
    return { axis, entry, x, y };
  });
}

export function pathFrom(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  return `${points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')} Z`;
}

/** Concentric ring polygons for the grid (levels 1..max). */
export function gridRings(cx: number, cy: number, radius: number, levels = RADAR_MAX): string[] {
  const n = RADAR_AXES.length;
  const out: string[] = [];
  for (let l = 1; l <= levels; l++) {
    const pts = RADAR_AXES.map((_, i) => {
      const [x, y] = polar(cx, cy, (radius * l) / levels, axisAngle(i, n));
      return { x, y };
    });
    out.push(pathFrom(pts));
  }
  return out;
}
