/**
 * Stack map (ATLAS_PROMPT.md 4.5): layer rows by protocol columns, drawn with
 * @xyflow/react. Each protocol is a span over its primary layer (solid, tinted)
 * and secondary layers (dashed), joined by a vertical line. Blocks are links to
 * the protocol page. The page also renders a static table with the same data.
 */
import { useMemo } from 'react';
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import '@xyflow/react/dist/base.css';
import { C_FAMILY_LABELS } from './lib/constants';
import { DEFAULT_GEOMETRY, layerRows, layoutStack, spanLinks } from './lib/stack';
import type { ProtocolInfo } from './lib/protocols';

export interface StackMapProps {
  protocols: ProtocolInfo[];
}

type LaneData = { label: string };
type HeadData = { p: ProtocolInfo };
type BlockData = { p: ProtocolInfo; layerLabel: string; coverage: 'primary' | 'secondary' };

const hidden = { opacity: 0, pointerEvents: 'none' as const, width: 1, height: 1, minWidth: 0, minHeight: 0, border: 0 };

function LaneNode({ data }: NodeProps<Node<LaneData>>) {
  return <div className="cc-stack-lane">{data.label}</div>;
}

function HeadNode({ data }: NodeProps<Node<HeadData>>) {
  const p = data.p;
  return (
    <div className="cc-stack-head">
      <span className="cc-mono" data-family={p.family ?? undefined} title={p.name}>
        {p.monogram}
      </span>
    </div>
  );
}

function BlockNode({ data }: NodeProps<Node<BlockData>>) {
  const { p, layerLabel, coverage } = data;
  const label = `${p.short}: ${coverage} layer ${layerLabel}${p.family ? ` (family: ${C_FAMILY_LABELS[p.family]})` : ''}`;
  const body = (
    <>
      <Handle type="target" position={Position.Top} style={hidden} isConnectable={false} />
      <span className="cc-stack-block__name">{p.short}</span>
      <span className="cc-stack-block__cov">{coverage === 'primary' ? 'Primary' : 'Secondary'}</span>
      <Handle type="source" position={Position.Bottom} style={hidden} isConnectable={false} />
    </>
  );
  return p.hasPage ? (
    <a className="cc-stack-block nodrag nopan" href={`/p/${p.slug}/`} data-family={p.family ?? undefined} data-coverage={coverage} aria-label={label}>
      {body}
    </a>
  ) : (
    <span className="cc-stack-block cc-stack-block--off" data-family={p.family ?? undefined} data-coverage={coverage} aria-label={`${label}, page in progress`}>
      {body}
    </span>
  );
}

const nodeTypes = { lane: LaneNode, head: HeadNode, block: BlockNode };

export default function StackMap({ protocols }: StackMapProps) {
  const g = DEFAULT_GEOMETRY;
  const headH = 48;
  const { nodes, edges } = useMemo(() => {
    const placed = protocols.filter((p) => p.layerPrimary);
    const rows = layerRows();
    const width = g.laneLabelWidth + placed.length * g.colWidth;
    const n: Node[] = [];
    rows.forEach((r, i) =>
      n.push({
        id: `lane-${r.id}`,
        type: 'lane',
        position: { x: 0, y: headH + i * g.rowHeight },
        data: { label: r.label },
        width,
        height: g.rowHeight,
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: 0,
      }),
    );
    placed.forEach((p, col) =>
      n.push({
        id: `head-${p.slug}`,
        type: 'head',
        position: { x: g.laneLabelWidth + col * g.colWidth, y: 0 },
        data: { p },
        width: g.colWidth,
        height: headH,
        draggable: false,
        selectable: false,
        focusable: false,
      }),
    );
    const blocks = layoutStack(placed, g);
    const bySlug = new Map(placed.map((p) => [p.slug, p]));
    const labels = new Map(rows.map((r) => [r.id, r.label]));
    for (const b of blocks) {
      n.push({
        id: b.id,
        type: 'block',
        position: { x: b.x, y: headH + b.y },
        data: { p: bySlug.get(b.protocol as ProtocolInfo['slug']), layerLabel: labels.get(b.layer) ?? b.layer, coverage: b.coverage },
        width: b.width,
        height: b.height,
        draggable: false,
        selectable: false,
        focusable: false,
        zIndex: 2,
      });
    }
    const e: Edge[] = spanLinks(blocks).map(([a, b]) => ({
      id: `${a.id}->${b.id}`,
      source: a.id,
      target: b.id,
      type: 'straight',
      focusable: false,
      selectable: false,
      style: { strokeWidth: 2, strokeDasharray: b.rowIndex - a.rowIndex > 1 ? '4 4' : undefined },
      zIndex: 1,
    }));
    return { nodes: n, edges: e };
  }, [protocols, g]);

  return (
    <div className="cc-stack">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.04, minZoom: 0.5 }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        zoomOnScroll={false}
        preventScrolling={false}
        panOnScroll={false}
        minZoom={0.5}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        aria-label="Stack map: layers as rows, protocols as columns"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="var(--border)" />
        <Controls showInteractive={false} position="bottom-right" />
      </ReactFlow>
    </div>
  );
}
