/**
 * Radar chart on six axes as small multiples (one chart per protocol, one
 * shared scale 0 to 5, no overlays and no second axis). Each point shows its
 * justification on hover or keyboard focus; the same data is in the table
 * rendered beside it (RadarTable.astro) with citations.
 */
import { useState } from 'react';
import { C_RADAR_AXES } from './lib/constants';
import { axisAngle, gridRings, pathFrom, polar, RADAR_AXIS_LABELS, RADAR_MAX, radarPoints, type RadarEntry } from './lib/radar';
import type { ProtocolInfo } from './lib/protocols';
import { InProgressTag } from './parts';

export interface RadarChartProps {
  protocols: ProtocolInfo[];
  entries: RadarEntry[];
}

/** Shorter labels inside the chart so they fit narrow cards; the table uses the full names. */
const CHART_LABELS: Partial<Record<string, string>> = { 'human-not-present': 'Human not present' };

const W = 340;
const H = 270;
const CX = W / 2;
const CY = H / 2 + 4;
const R = 88;

function Radar({ p, entries }: { p: ProtocolInfo; entries: RadarEntry[] }) {
  const [tip, setTip] = useState<RadarEntry | null>(null);
  const pts = radarPoints(entries, CX, CY, R);
  const n = C_RADAR_AXES.length;
  const summary = pts
    .map((pt) => `${RADAR_AXIS_LABELS[pt.axis]} ${pt.entry ? `${pt.entry.value} of ${RADAR_MAX}` : 'not rated'}`)
    .join(', ');
  return (
    <div className="cc-radar-card" data-family={p.family ?? undefined}>
      <h3>{p.short}</h3>
      <svg className="cc-radar-svg" viewBox={`0 0 ${W} ${H}`} role="group" aria-label={`${p.short} radar: ${summary}`}>
        {gridRings(CX, CY, R).map((d, i, all) => (
          <path key={d} d={d} className={i === all.length - 1 ? 'cc-radar-ring cc-radar-ring--outer' : 'cc-radar-ring'} />
        ))}
        {C_RADAR_AXES.map((axis, i) => {
          const a = axisAngle(i, n);
          const [x, y] = polar(CX, CY, R, a);
          const [lx, ly] = polar(CX, CY, R + 14, a);
          const cos = Math.cos(a);
          const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
          const dy = Math.sin(a) < -0.5 ? -2 : Math.sin(a) > 0.5 ? 10 : 4;
          return (
            <g key={axis} aria-hidden="true">
              <line x1={CX} y1={CY} x2={x} y2={y} className="cc-radar-spoke" />
              <text x={lx} y={ly + dy} textAnchor={anchor} className="cc-radar-label">
                {CHART_LABELS[axis] ?? RADAR_AXIS_LABELS[axis]}
              </text>
            </g>
          );
        })}
        <path d={pathFrom(pts)} className="cc-radar-shape" aria-hidden="true" />
        {pts.map((pt) =>
          pt.entry ? (
            <g key={pt.axis}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={14}
                className="cc-radar-hit"
                aria-hidden="true"
                onMouseEnter={() => setTip(pt.entry)}
                onMouseLeave={() => setTip(null)}
              />
              <circle
                cx={pt.x}
                cy={pt.y}
                r={5}
                className="cc-radar-point"
                tabIndex={0}
                role="img"
                aria-label={`${RADAR_AXIS_LABELS[pt.axis]}: ${pt.entry.value} of ${RADAR_MAX}. ${pt.entry.justification}`}
                onMouseEnter={() => setTip(pt.entry)}
                onMouseLeave={() => setTip(null)}
                onFocus={() => setTip(pt.entry)}
                onBlur={() => setTip(null)}
              />
            </g>
          ) : null,
        )}
      </svg>
      {tip && (
        <div className="cc-radar-tip" aria-hidden="true">
          <strong>
            {RADAR_AXIS_LABELS[tip.axis]}: {tip.value} of {RADAR_MAX}
          </strong>
          {tip.justification}
        </div>
      )}
    </div>
  );
}

export default function RadarChart({ protocols, entries }: RadarChartProps) {
  const by = new Map<string, RadarEntry[]>();
  for (const e of entries) by.set(e.protocol, [...(by.get(e.protocol) ?? []), e]);
  return (
    <div className="cc-radar-grid">
      {protocols.map((p) => {
        const list = by.get(p.slug);
        if (!list || list.length === 0)
          return (
            <div key={p.slug} className="cc-radar-card" data-family={p.family ?? undefined}>
              <h3>{p.short}</h3>
              <p className="cc-radar-empty">
                <InProgressTag /> No radar values yet.
              </p>
            </div>
          );
        return <Radar key={p.slug} p={p} entries={list} />;
      })}
    </div>
  );
}
