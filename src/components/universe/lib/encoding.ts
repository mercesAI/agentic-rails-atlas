/**
 * Visual encoding rules for the bubble universe (ATLAS_PROMPT.md 4.3 and 13).
 * Fill hue = family, ring style = rails, size = equal base plus a small boost per layer covered.
 */
import { LAYERS, type Layer, type Rail, type RelationType } from '../../../lib/schemas';
import type { PersonaMap, Relevance, UniverseRelation } from './types';

export { ORBIT_CATEGORY_LABELS, ORBIT_CATEGORY_SHORT_LABELS, RAIL_LABELS, RELATION_LABELS, STATUS_LABELS } from '../../../lib/labels';

export type RingStyle = 'solid' | 'dashed' | 'double' | 'dotted';

const RAIL_RING: Record<Rail, RingStyle> = {
  card: 'solid',
  crypto: 'dashed',
  bank: 'dotted',
  'rail-agnostic': 'double',
  'multi-rail': 'double',
};

/**
 * Ring style from the primary (first listed) rail. A protocol that lists
 * rail-agnostic or multi-rail first gets the double ring.
 */
export function ringStyle(rails: readonly Rail[]): RingStyle {
  const first = rails[0];
  return first ? RAIL_RING[first] : 'double';
}

export const RING_LABELS: Record<RingStyle, string> = {
  solid: 'Card network',
  dashed: 'Crypto-native',
  double: 'Rail-agnostic or multi-rail',
  dotted: 'Bank rails',
};

/** SVG stroke-dasharray per relation type, so line style (not color) tells types apart. */
export const RELATION_DASH: Record<RelationType, string> = {
  embeds: '',
  'uses-as-rail': '10 4',
  complements: '2 4',
  'competes-with': '8 4 2 4',
  'compatible-with': '5 5',
  'same-steward': '1 7',
  lineage: '14 6',
};

/** Distinct layers a protocol covers (primary plus secondary). */
export interface LayerSpan {
  layerPrimary: Layer;
  layersSecondary: readonly Layer[];
}

export function layersCovered(p: LayerSpan): number {
  return new Set<Layer>([p.layerPrimary, ...p.layersSecondary]).size;
}

export const BASE_RADIUS = 54;
export const RADIUS_BOOST = 3;
export const MAX_BOOST_LAYERS = 6;

/** Equal base size plus a small boost per extra layer covered (never by adoption). */
export function bubbleRadius(p: LayerSpan, base = BASE_RADIUS): number {
  const extra = Math.min(layersCovered(p), MAX_BOOST_LAYERS) - 1;
  return base + (base / BASE_RADIUS) * RADIUS_BOOST * extra;
}

const RAIL_X: Record<Rail, number> = {
  crypto: 0,
  'multi-rail': 0.5,
  'rail-agnostic': 0.5,
  bank: 0.75,
  card: 1,
};

/** Position on the crypto-native (0) to card-network (1) axis: the mean over listed rails. */
export function railScore(rails: readonly Rail[]): number {
  if (rails.length === 0) return 0.5;
  return rails.reduce((sum, r) => sum + RAIL_X[r], 0) / rails.length;
}

export function layerIndex(layer: Layer): number {
  return LAYERS.indexOf(layer);
}

/** Relation types that read the same in both directions. */
export const SYMMETRIC_RELATIONS: ReadonlySet<RelationType> = new Set<RelationType>([
  'complements',
  'competes-with',
  'compatible-with',
  'same-steward',
]);

/**
 * Relations that touch a protocol, limited to pairs where both ends are on the
 * canvas. A symmetric relation recorded in both directions is kept once.
 */
export function relationsFor(
  slug: string,
  relations: readonly UniverseRelation[],
  present: ReadonlySet<string>,
): UniverseRelation[] {
  const seen = new Set<string>();
  return relations.filter((r) => {
    if (!(r.from === slug || r.to === slug) || !present.has(r.from) || !present.has(r.to) || r.from === r.to) return false;
    const key = SYMMETRIC_RELATIONS.has(r.type) ? `${[r.from, r.to].sort().join('|')}|${r.type}` : `${r.from}|${r.to}|${r.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Relevance of a protocol to a persona; no persona selected means every protocol is high. */
export function relevanceOf(map: PersonaMap, persona: string | null, slug: string): Relevance {
  if (!persona) return 'high';
  return map[persona]?.[slug] ?? 'low';
}
