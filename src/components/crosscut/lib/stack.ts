/** Stack map layout: layer rows by protocol columns, primary and secondary spans. */
import type { Layer } from '../../../lib/schemas';
import { C_LAYERS as LAYERS, C_LAYER_LABELS as LAYER_LABELS } from './constants';
import type { ProtocolInfo } from './protocols';

export type Coverage = 'primary' | 'secondary' | null;

export function coverageOf(p: Pick<ProtocolInfo, 'layerPrimary' | 'layersSecondary'>, layer: Layer): Coverage {
  if (p.layerPrimary === layer) return 'primary';
  if (p.layersSecondary.includes(layer)) return 'secondary';
  return null;
}

export interface StackGeometry {
  laneLabelWidth: number;
  colWidth: number;
  rowHeight: number;
  gap: number;
}

export const DEFAULT_GEOMETRY: StackGeometry = { laneLabelWidth: 200, colWidth: 132, rowHeight: 64, gap: 10 };

export interface SpanBlock {
  id: string;
  protocol: string;
  layer: Layer;
  coverage: Exclude<Coverage, null>;
  x: number;
  y: number;
  width: number;
  height: number;
  rowIndex: number;
}

/** One block per covered layer; consecutive covered rows of a protocol are later joined by edges. */
export function layoutStack(protocols: ProtocolInfo[], g: StackGeometry = DEFAULT_GEOMETRY): SpanBlock[] {
  const blocks: SpanBlock[] = [];
  protocols.forEach((p, col) => {
    LAYERS.forEach((layer, row) => {
      const cov = coverageOf(p, layer);
      if (!cov) return;
      blocks.push({
        id: `${p.slug}--${layer}`,
        protocol: p.slug,
        layer,
        coverage: cov,
        x: g.laneLabelWidth + col * g.colWidth + g.gap / 2,
        y: row * g.rowHeight + g.gap / 2,
        width: g.colWidth - g.gap,
        height: g.rowHeight - g.gap,
        rowIndex: row,
      });
    });
  });
  return blocks;
}

/** Pairs of blocks of the same protocol in layer order (the visual span). */
export function spanLinks(blocks: SpanBlock[]): [SpanBlock, SpanBlock][] {
  const byP = new Map<string, SpanBlock[]>();
  for (const b of blocks) byP.set(b.protocol, [...(byP.get(b.protocol) ?? []), b]);
  const out: [SpanBlock, SpanBlock][] = [];
  for (const list of byP.values()) {
    const sorted = [...list].sort((a, b) => a.rowIndex - b.rowIndex);
    for (let i = 1; i < sorted.length; i++) out.push([sorted[i - 1], sorted[i]]);
  }
  return out;
}

export const layerRows = () => LAYERS.map((id) => ({ id, label: LAYER_LABELS[id] }));
