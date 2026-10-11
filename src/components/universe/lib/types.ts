/**
 * Data shapes for the bubble universe island (ARCHITECTURE.md Section 6).
 * The home page builds these at build time and passes them as serialized props.
 */
import type { Family, Layer, Rail, RelationType, Status } from '../../../lib/schemas';

export const LAYOUT_MODES = ['constellation', 'layers', 'rails', 'timeline'] as const;
export type LayoutMode = (typeof LAYOUT_MODES)[number];

export const LAYOUT_LABELS: Record<LayoutMode, string> = {
  constellation: 'Constellation',
  layers: 'Layers',
  rails: 'Rails map',
  timeline: 'Timeline',
};

/** The subset of ProtocolMeta the island needs (keeps the serialized props small). */
export interface UniverseProtocol {
  slug: string;
  order: number;
  name: string;
  bubbleLabel: string;
  monogram: string;
  tagline: string;
  intro: string;
  family: Family;
  layerPrimary: Layer;
  layersSecondary: Layer[];
  rails: Rail[];
  stewards: string[];
  status: Status;
  statusNote?: string;
  firstAnnounced: string;
  latestVersion: { label: string; date: string };
  composesWith: string[];
}

export interface UniverseRelation {
  from: string;
  to: string;
  type: RelationType;
  note: string;
}

export const ORBIT_CATEGORIES = [
  'agent-communication',
  'agent-identity',
  'wallet-permissions',
  'machine-payments',
  'card-wallet-commerce',
  'legal-policy',
] as const;
export type OrbitCategoryId = (typeof ORBIT_CATEGORIES)[number];

export interface UniverseOrbit {
  slug: string;
  name: string;
  category: OrbitCategoryId;
  oneLiner: string;
  href: string;
  /** True when href leaves the site (no orbit mini page yet). */
  external: boolean;
}

export interface UniversePersona {
  id: string;
  name: string;
}

export type Relevance = 'high' | 'medium' | 'low';
/** personaId -> protocol slug -> relevance (missing means low). */
export type PersonaMap = Record<string, Record<string, Relevance>>;

export interface Point {
  x: number;
  y: number;
}

export interface PlacedNode extends Point {
  r: number;
}

export interface GuideLabel extends Point {
  text: string;
  anchor: 'start' | 'middle' | 'end';
  kind: 'family' | 'row' | 'axis' | 'tick' | 'category' | 'date';
}

export interface LayoutGuides {
  rings: { cx: number; cy: number; rx: number; ry: number }[];
  labels: GuideLabel[];
  hlines: { x1: number; x2: number; y: number }[];
  vlines: { x: number; y1: number; y2: number }[];
  /** Layers mode: faint span from the primary row across the secondary rows. */
  spans: { slug: string; x: number; y1: number; y2: number; marks: number[] }[];
}

export interface LayoutResult {
  mode: LayoutMode;
  width: number;
  height: number;
  /** True when bubbles are compact (label and status only; the card carries the rest). */
  compact: boolean;
  nodes: Record<string, PlacedNode>;
  guides: LayoutGuides;
}
