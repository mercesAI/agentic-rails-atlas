/**
 * Home bubble universe (ATLAS_PROMPT.md 4.3, ARCHITECTURE.md Section 6).
 * React island, hydrated with client:visible. Bubbles are HTML links laid
 * over an SVG guide layer, so focus, Enter, the ClientRouter and the view
 * transition morph (bubble-<slug> into the protocol header) all work natively.
 * Layout math is in ./lib and runs the same on the server and the client.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { select, zoom, zoomIdentity, type ZoomBehavior } from 'd3';
import { FAMILIES, FAMILY_LABELS, LAYER_LABELS, type RelationType, type Status } from '../../lib/schemas';
import {
  RAIL_LABELS,
  RELATION_DASH,
  RELATION_LABELS,
  RELEVANCE_OPACITY,
  RING_LABELS,
  ORBIT_CATEGORY_LABELS,
  STATUS_LABELS,
  relationsFor,
  relevanceOf,
  ringStyle,
  type RingStyle,
} from './lib/encoding';
import { computeLayout } from './lib/layouts';
import { KEY_DIRECTIONS, nextInDirection } from './lib/nav';
import { orbitLayout } from './lib/orbit';
import {
  LAYOUT_LABELS,
  LAYOUT_MODES,
  type LayoutMode,
  type PersonaMap,
  type PlacedNode,
  type UniverseOrbit,
  type UniversePersona,
  type UniverseProtocol,
  type UniverseRelation,
} from './lib/types';
import './universe.css';

export interface BubbleUniverseProps {
  protocols: UniverseProtocol[];
  relations: UniverseRelation[];
  orbit: UniverseOrbit[];
  personas: UniversePersona[];
  personaMap: PersonaMap;
  initialMode?: LayoutMode;
}

const STATUS_ORDER: Status[] = ['draft', 'beta', 'pilot', 'live', 'mixed'];
const RING_ORDER: RingStyle[] = ['solid', 'dashed', 'double', 'dotted'];
const MOBILE_QUERY = '(max-width: 639.98px)';

function pct(v: number, total: number): string {
  return `${((v / total) * 100).toFixed(3)}%`;
}

function ExternalGlyph() {
  return (
    <svg className="u-ext" viewBox="0 0 12 12" width="0.7em" height="0.7em" aria-hidden="true" focusable="false">
      <path d="M4.5 2.5h5v5M9.5 2.5 3 9" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function edgePath(a: PlacedNode, b: PlacedNode, pad = 4): { x1: number; y1: number; x2: number; y2: number } {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  return {
    x1: a.x + ux * (a.r + pad),
    y1: a.y + uy * (a.r + pad),
    x2: b.x - ux * (b.r + pad),
    y2: b.y - uy * (b.r + pad),
  };
}

const DIRECTED: ReadonlySet<RelationType> = new Set<RelationType>(['embeds', 'uses-as-rail', 'lineage']);

export default function BubbleUniverse({
  protocols,
  relations,
  orbit,
  personas,
  personaMap,
  initialMode = 'constellation',
}: BubbleUniverseProps) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [mode, setMode] = useState<LayoutMode>(initialMode);
  const [showOrbit, setShowOrbit] = useState(false);
  const [persona, setPersona] = useState<string>('');
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [open, setOpen] = useState(false);
  const [announce, setAnnounce] = useState('');
  const bubbleRefs = useRef(new Map<string, HTMLAnchorElement>());
  const dialogRef = useRef<HTMLDialogElement>(null);

  const sorted = useMemo(() => [...protocols].sort((a, b) => a.order - b.order), [protocols]);
  const bySlug = useMemo(() => new Map(sorted.map((p) => [p.slug, p])), [sorted]);
  const present = useMemo(() => new Set(sorted.map((p) => p.slug)), [sorted]);
  const order = useMemo(() => sorted.map((p) => p.slug), [sorted]);

  const layout = useMemo(() => computeLayout(mode, sorted), [mode, sorted]);
  const orbitPlaced = useMemo(
    () => (showOrbit ? orbitLayout(orbit, mode, { width: layout.width, height: layout.height }) : null),
    [showOrbit, orbit, mode, layout.width, layout.height],
  );
  const W = layout.width;
  const H = layout.height + (orbitPlaced?.extraHeight ?? 0);

  const active = hovered ?? focused;
  const activeProtocol = active ? bySlug.get(active) ?? null : null;
  const activeEdges = useMemo(
    () => (active ? relationsFor(active, relations, present) : []),
    [active, relations, present],
  );
  const allEdges = useMemo(
    () => relations.filter((r) => present.has(r.from) && present.has(r.to) && r.from !== r.to),
    [relations, present],
  );
  const edgeTypes = useMemo(() => [...new Set(allEdges.map((r) => r.type))], [allEdges]);
  const neighbors = useMemo(() => {
    const s = new Set<string>();
    for (const r of activeEdges) s.add(r.from === active ? r.to : r.from);
    return s;
  }, [activeEdges, active]);

  const personaName = personas.find((p) => p.id === persona)?.name ?? '';

  // Under 640 px the canvas lives in a dialog behind the "View universe" button.
  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const d = dialogRef.current;
    if (!d) return;
    if (open && isMobile && !d.open) d.showModal();
    if ((!open || !isMobile) && d.open) d.close();
  }, [open, isMobile]);

  const changeMode = (m: LayoutMode) => {
    setMode(m);
    setAnnounce(`Layout: ${LAYOUT_LABELS[m]}.`);
  };

  const changePersona = (id: string) => {
    setPersona(id);
    if (!id) {
      setAnnounce('Persona filter cleared. All protocols shown at full strength.');
      return;
    }
    const name = personas.find((p) => p.id === id)?.name ?? id;
    const n = sorted.filter((p) => relevanceOf(personaMap, id, p.slug) !== 'low').length;
    setAnnounce(`${n} of ${sorted.length} protocols are relevant to ${name}. The rest are dimmed.`);
  };

  const onBubbleKey = useCallback(
    (e: KeyboardEvent<HTMLAnchorElement>, slug: string) => {
      let target: string | null = null;
      const dir = KEY_DIRECTIONS[e.key];
      if (dir) target = nextInDirection(layout.nodes, order, slug, dir);
      else if (e.key === 'Home') target = order[0] ?? null;
      else if (e.key === 'End') target = order[order.length - 1] ?? null;
      else if (e.key === 'Escape') {
        setFocused(null);
        setHovered(null);
        return;
      }
      if (target) {
        e.preventDefault();
        bubbleRefs.current.get(target)?.focus();
      }
    },
    [layout.nodes, order],
  );

  const stage = (
    <Stage
      uid={uid}
      mode={mode}
      W={W}
      H={H}
      layout={layout}
      orbitPlaced={orbitPlaced}
      orbit={orbit}
      sorted={sorted}
      bySlug={bySlug}
      edgeTypes={edgeTypes}
      active={active}
      activeProtocol={activeProtocol}
      activeEdges={activeEdges}
      neighbors={neighbors}
      persona={persona}
      personaName={personaName}
      personaMap={personaMap}
      personas={personas}
      showOrbit={showOrbit}
      zoomable={isMobile && open}
      onMode={changeMode}
      onOrbit={() => {
        setShowOrbit((v) => !v);
        setAnnounce(showOrbit ? 'Orbit hidden.' : `Orbit shown: ${orbit.length} related standards around the eight protocols.`);
      }}
      onPersona={changePersona}
      onHover={setHovered}
      onFocusBubble={setFocused}
      onBubbleKey={onBubbleKey}
      bubbleRefs={bubbleRefs.current}
    />
  );

  return (
    <div className="universe" data-mobile={isMobile ? 'true' : 'false'}>
      <p className="sr-only" aria-live="polite">{announce}</p>
      <div className="universe__mobile">
        <p className="universe__mobile-note">The universe is a wide chart. The protocol list below has the same content.</p>
        <button type="button" className="btn" onClick={() => setOpen(true)}>
          View universe
        </button>
      </div>
      {isMobile ? (
        <dialog
          ref={dialogRef}
          className="universe__dialog"
          aria-labelledby={`${uid}-dialog-title`}
          onClose={() => setOpen(false)}
        >
          <div className="universe__dialog-bar">
            <h2 id={`${uid}-dialog-title`} className="universe__dialog-title">Protocol universe</h2>
            <button type="button" className="btn" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
          {open ? stage : null}
        </dialog>
      ) : (
        <div className="universe__inline">{stage}</div>
      )}
    </div>
  );
}

interface StageProps {
  uid: string;
  mode: LayoutMode;
  W: number;
  H: number;
  layout: ReturnType<typeof computeLayout>;
  orbitPlaced: ReturnType<typeof orbitLayout> | null;
  orbit: UniverseOrbit[];
  sorted: UniverseProtocol[];
  bySlug: Map<string, UniverseProtocol>;
  edgeTypes: RelationType[];
  active: string | null;
  activeProtocol: UniverseProtocol | null;
  activeEdges: UniverseRelation[];
  neighbors: Set<string>;
  persona: string;
  personaName: string;
  personaMap: PersonaMap;
  personas: UniversePersona[];
  showOrbit: boolean;
  zoomable: boolean;
  onMode: (m: LayoutMode) => void;
  onOrbit: () => void;
  onPersona: (id: string) => void;
  onHover: (slug: string | null) => void;
  onFocusBubble: (slug: string | null) => void;
  onBubbleKey: (e: KeyboardEvent<HTMLAnchorElement>, slug: string) => void;
  bubbleRefs: Map<string, HTMLAnchorElement>;
}

function Stage(props: StageProps) {
  const {
    uid,
    mode,
    W,
    H,
    layout,
    orbitPlaced,
    orbit,
    sorted,
    bySlug,
    edgeTypes,
    active,
    activeProtocol,
    activeEdges,
    neighbors,
    persona,
    personaName,
    personaMap,
    personas,
    showOrbit,
    zoomable,
  } = props;
  const viewportRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<ZoomBehavior<HTMLDivElement, unknown> | null>(null);
  const cardId = `${uid}-card`;
  const markerId = `${uid}-arrow`;

  // Pan and zoom (dialog under 640 px only). Buttons give a non-drag alternative.
  useEffect(() => {
    const vp = viewportRef.current;
    const canvas = canvasRef.current;
    if (!zoomable || !vp || !canvas) return;
    const z = zoom<HTMLDivElement, unknown>()
      .scaleExtent([0.25, 3])
      .on('zoom', (ev: { transform: { x: number; y: number; k: number } }) => {
        const t = ev.transform;
        // CSS needs units (d3's toString() is SVG syntax).
        canvas.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.k})`;
      });
    zoomRef.current = z;
    const sel = select(vp);
    sel.call(z);
    // The dialog opens after this effect runs, so measure on the next frame.
    const raf = requestAnimationFrame(() => {
      // Start readable: at the fit scale on a phone the labels are about 4 px, so open at 0.8 centered
      // and let "Fit" show the whole canvas.
      const vpw = vp.clientWidth || window.innerWidth;
      const cw = canvas.offsetWidth || 1000;
      const k = Math.max(vpw / cw, 0.8);
      sel.call(z.transform, zoomIdentity.translate(Math.min(0, (vpw - cw * k) / 2), 8).scale(k));
    });
    return () => {
      cancelAnimationFrame(raf);
      sel.on('.zoom', null);
      canvas.style.transform = '';
      zoomRef.current = null;
    };
  }, [zoomable]);

  const zoomBy = (k: number) => {
    const vp = viewportRef.current;
    if (vp && zoomRef.current) select(vp).call(zoomRef.current.scaleBy, k);
  };
  const zoomReset = () => {
    const vp = viewportRef.current;
    const canvas = canvasRef.current;
    if (vp && canvas && zoomRef.current) {
      const fit = (vp.clientWidth || window.innerWidth) / (canvas.offsetWidth || 1000);
      select(vp).call(zoomRef.current.transform, zoomIdentity.translate(0, 8).scale(fit));
    }
  };

  return (
    <div className="universe__stage" data-mode={mode}>
      <div className="universe__toolbar">
        <div className="u-seg" role="group" aria-label="Layout">
          {LAYOUT_MODES.map((m) => (
            <button
              key={m}
              type="button"
              className="u-seg__btn"
              aria-pressed={mode === m}
              data-mode-button={m}
              onClick={() => props.onMode(m)}
            >
              {LAYOUT_LABELS[m]}
            </button>
          ))}
        </div>
        <button type="button" className="u-toggle" aria-pressed={showOrbit} onClick={props.onOrbit} disabled={orbit.length === 0}>
          <span className="u-toggle__track" aria-hidden="true"><span className="u-toggle__thumb" /></span>
          Orbit
        </button>
        <details className="u-persona">
          <summary>
            Persona: <span className="u-persona__current">{persona ? personaName : 'All personas'}</span>
          </summary>
          <fieldset className="u-persona__panel">
            <legend className="sr-only">Dim protocols by relevance to a persona</legend>
            {[{ id: '', name: 'All personas' }, ...personas].map((p) => (
              <label key={p.id || 'all'} className="u-persona__option">
                <input
                  type="radio"
                  name={`${uid}-persona`}
                  value={p.id}
                  checked={persona === p.id}
                  onChange={(e) => {
                    props.onPersona(p.id);
                    // Close the panel after a choice so it does not cover the bubbles.
                    e.currentTarget.closest('details')?.removeAttribute('open');
                  }}
                />
                {p.name}
              </label>
            ))}
          </fieldset>
        </details>
        {zoomable ? (
          <div className="u-zoom" role="group" aria-label="Zoom">
            <button type="button" className="u-seg__btn" onClick={() => zoomBy(1.3)} aria-label="Zoom in">+</button>
            <button type="button" className="u-seg__btn" onClick={() => zoomBy(1 / 1.3)} aria-label="Zoom out">-</button>
            <button type="button" className="u-seg__btn" onClick={zoomReset}>Fit</button>
          </div>
        ) : null}
      </div>

      <p className="universe__hint">
        Hover or focus a protocol to see its card and relations. Arrow keys move between protocols; Enter opens one.
        {persona ? ` Dimmed bubbles are less relevant to ${personaName}.` : ''}
      </p>

      <div className="universe__body">
      <div className="universe__viewport" ref={viewportRef}>
        <div
          className="universe__canvas"
          ref={canvasRef}
          style={{ aspectRatio: `${W} / ${H}` }}
          onMouseLeave={() => props.onHover(null)}
        >
          <svg className="universe__svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
            <defs>
              <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M0 1 9 5 0 9z" className="u-arrow" />
              </marker>
            </defs>
            <g className="u-guides">
              {layout.guides.rings.map((r, i) => (
                <ellipse key={`ring-${i}`} className="u-ring" cx={r.cx} cy={r.cy} rx={r.rx} ry={r.ry} />
              ))}
              {orbitPlaced?.ring ? (
                <ellipse className="u-ring u-ring--orbit" cx={orbitPlaced.ring.cx} cy={orbitPlaced.ring.cy} rx={orbitPlaced.ring.rx} ry={orbitPlaced.ring.ry} />
              ) : null}
              {layout.guides.hlines.map((l, i) => (
                <line key={`h-${i}`} className="u-grid" x1={l.x1} x2={l.x2} y1={l.y} y2={l.y} />
              ))}
              {layout.guides.vlines.map((l, i) => (
                <line key={`v-${i}`} className="u-grid u-grid--v" x1={l.x} x2={l.x} y1={l.y1} y2={l.y2} />
              ))}
              {layout.guides.spans.map((s) => {
                const p = bySlug.get(s.slug);
                return (
                  <g key={`span-${s.slug}`} className="u-span" data-family={p?.family} data-active={active === s.slug ? 'true' : undefined}>
                    <line x1={s.x} x2={s.x} y1={s.y1} y2={s.y2} />
                    {s.marks.map((y) => (
                      <rect key={y} x={s.x - 9} y={y - 3} width={18} height={6} rx={3} />
                    ))}
                  </g>
                );
              })}
              {(orbitPlaced?.arcs ?? []).map((arc) => (
                <g key={`arc-${arc.key}`}>
                  <path id={`${uid}-arc-${arc.key}`} d={arc.d} fill="none" stroke="none" />
                  <text className="u-label u-label--category">
                    <textPath href={`#${uid}-arc-${arc.key}`} startOffset="50%" textAnchor="middle">
                      {arc.text}
                    </textPath>
                  </text>
                </g>
              ))}
              {[...layout.guides.labels, ...(orbitPlaced?.labels ?? [])].map((g, i) => (
                <text key={`lbl-${i}`} className={`u-label u-label--${g.kind}`} x={g.x} y={g.y} textAnchor={g.anchor}>
                  {g.text}
                </text>
              ))}
            </g>
            <g className="u-edges u-edges--active">
              {activeEdges.map((r, i) => {
                const a = layout.nodes[r.from];
                const b = layout.nodes[r.to];
                if (!a || !b) return null;
                const e = edgePath(a, b, 6);
                return (
                  <g key={`a-${r.from}-${r.to}-${r.type}-${i}`} data-type={r.type}>
                    <line
                      {...e}
                      strokeDasharray={RELATION_DASH[r.type] || undefined}
                      markerEnd={DIRECTED.has(r.type) ? `url(#${markerId})` : undefined}
                    />
                  </g>
                );
              })}
            </g>
          </svg>

          {sorted.map((p, i) => {
            const n = layout.nodes[p.slug];
            if (!n) return null;
            const rel = relevanceOf(personaMap, persona || null, p.slug);
            const ring = ringStyle(p.rails);
            const style = {
              left: pct(n.x - n.r, W),
              top: pct(n.y - n.r, H),
              width: pct(n.r * 2, W),
              '--i': i,
              '--dim': RELEVANCE_OPACITY[rel],
            } as CSSProperties;
            return (
              <a
                key={p.slug}
                href={`/p/${p.slug}/`}
                className="ub"
                data-slug={p.slug}
                data-family={p.family}
                data-ring={ring}
                data-relevance={rel}
                data-active={active === p.slug ? 'true' : undefined}
                data-neighbor={neighbors.has(p.slug) ? 'true' : undefined}
                data-compact={layout.compact ? 'true' : undefined}
                aria-describedby={active === p.slug ? cardId : undefined}
                style={style}
                ref={(el) => {
                  if (el) props.bubbleRefs.set(p.slug, el);
                  else props.bubbleRefs.delete(p.slug);
                }}
                onMouseEnter={() => props.onHover(p.slug)}
                onFocus={() => props.onFocusBubble(p.slug)}
                onBlur={() => props.onFocusBubble(null)}
                onKeyDown={(e) => props.onBubbleKey(e, p.slug)}
              >
                <span className="ub__disc" style={{ viewTransitionName: `bubble-${p.slug}` }}>
                  <span className="ub__label">{p.bubbleLabel}</span>
                </span>
                <span className="ub__below">
                  {layout.compact ? null : <span className="ub__tagline">{p.tagline}</span>}
                  <span className="ub__status" data-status={p.status}>
                    <span className="ub__dot" aria-hidden="true" />
                    <span className="sr-only">Status: </span>
                    {STATUS_LABELS[p.status]}
                  </span>
                  {mode === 'timeline' ? (
                    <span className="ub__date">
                      <span className="sr-only">First announced </span>
                      <time dateTime={p.firstAnnounced}>{p.firstAnnounced}</time>
                    </span>
                  ) : null}
                  {rel === 'low' ? <span className="ub__rel">Less relevant</span> : null}
                </span>
              </a>
            );
          })}

          {orbitPlaced
            ? orbit.map((o) => {
                const n = orbitPlaced.nodes[o.slug];
                if (!n) return null;
                return (
                  <a
                    key={o.slug}
                    href={o.href}
                    className="usat"
                    data-category={o.category}
                    rel={o.external ? 'noopener noreferrer external' : undefined}
                    aria-label={`${o.name}, ${ORBIT_CATEGORY_LABELS[o.category]}${o.external ? ' (external link)' : ''}`}
                    style={{ left: pct(n.x, W), top: pct(n.y, H) } as CSSProperties}
                  >
                    <span className="usat__dot" aria-hidden="true" />
                    <span className="usat__tip">
                      <span className="usat__name">
                        {o.name}
                        {o.external ? <ExternalGlyph /> : null}
                      </span>
                      <span className="usat__meta">{ORBIT_CATEGORY_LABELS[o.category]}</span>
                      <span className="usat__one">{o.oneLiner}</span>
                    </span>
                  </a>
                );
              })
            : null}

        </div>
      </div>
      <aside className="universe__aside" aria-label="Protocol details">
        {activeProtocol ? (
          <div className="ucard" id={cardId} data-family={activeProtocol.family}>
            <p className="ucard__eyebrow">{FAMILY_LABELS[activeProtocol.family]}</p>
            <p className="ucard__name">{activeProtocol.name}</p>
            <p className="ucard__intro">{activeProtocol.intro}</p>
            <dl className="ucard__facts">
              <div>
                <dt>Stewards</dt>
                <dd>{activeProtocol.stewards.join('; ')}</dd>
              </div>
              <div>
                <dt>First announced</dt>
                <dd>{activeProtocol.firstAnnounced}</dd>
              </div>
              <div>
                <dt>Latest version</dt>
                <dd>
                  {activeProtocol.latestVersion.label}, {activeProtocol.latestVersion.date}
                </dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd>
                  <span className="ub__status" data-status={activeProtocol.status}>
                    <span className="ub__dot" aria-hidden="true" />
                    {STATUS_LABELS[activeProtocol.status]}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Rails</dt>
                <dd>{activeProtocol.rails.map((r) => RAIL_LABELS[r]).join(', ')}</dd>
              </div>
              <div>
                <dt>Layer</dt>
                <dd>
                  {LAYER_LABELS[activeProtocol.layerPrimary]}
                  {activeProtocol.layersSecondary.length > 0
                    ? ` (also ${activeProtocol.layersSecondary.map((l) => LAYER_LABELS[l].toLowerCase()).join(', ')})`
                    : ''}
                </dd>
              </div>
            </dl>
            {activeProtocol.composesWith.length > 0 ? (
              <div className="ucard__composes">
                <p className="ucard__sub">Composes with</p>
                <ul>
                  {activeProtocol.composesWith.map((s) => {
                    const q = bySlug.get(s);
                    return (
                      <li key={s} className="ucard__chip" data-family={q?.family}>
                        {q?.bubbleLabel ?? s}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}
            {activeEdges.length > 0 ? (
              <div className="ucard__relations">
                <p className="ucard__sub">Relations drawn on the chart</p>
                <ul>
                  {activeEdges.map((r, i) => (
                    <li key={`${r.from}-${r.type}-${r.to}-${i}`}>
                      <svg className="ulegend__line" viewBox="0 0 28 8" width="28" height="8" aria-hidden="true" focusable="false">
                        <line x1="1" y1="4" x2="27" y2="4" strokeDasharray={RELATION_DASH[r.type] || undefined} />
                      </svg>
                      <span>
                        {bySlug.get(r.from)?.bubbleLabel ?? r.from} <em>{RELATION_LABELS[r.type].toLowerCase()}</em>{' '}
                        {bySlug.get(r.to)?.bubbleLabel ?? r.to}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="ucard__hint">Enter or click opens the page.</p>
          </div>
        ) : (
          <div className="ucard ucard--empty">
            <p className="ucard__name">Eight protocols, one chart</p>
            <p className="ucard__intro">
              Hover over or focus a bubble to see its summary, stewards, dates, status, rails, layers and the protocols it relates to.
            </p>
          </div>
        )}
      </aside>
      </div>

      <Legend edgeTypes={edgeTypes} showOrbit={showOrbit} />
    </div>
  );
}

function Legend({ edgeTypes, showOrbit }: { edgeTypes: RelationType[]; showOrbit: boolean }) {
  return (
    <div className="ulegend" aria-label="Legend" role="group">
      <div className="ulegend__group">
        <p className="ulegend__title">Fill: layer family</p>
        <ul>
          {FAMILIES.map((f) => (
            <li key={f} data-family={f}>
              <span className="ulegend__swatch" aria-hidden="true" />
              {FAMILY_LABELS[f]}
            </li>
          ))}
        </ul>
      </div>
      <div className="ulegend__group">
        <p className="ulegend__title">Ring: rails</p>
        <ul>
          {RING_ORDER.map((r) => (
            <li key={r}>
              <span className="ulegend__ring" data-ring={r} aria-hidden="true" />
              {RING_LABELS[r]}
            </li>
          ))}
        </ul>
      </div>
      <div className="ulegend__group">
        <p className="ulegend__title">Status</p>
        <ul>
          {STATUS_ORDER.map((s) => (
            <li key={s}>
              <span className="ub__status" data-status={s}>
                <span className="ub__dot" aria-hidden="true" />
                {STATUS_LABELS[s]}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="ulegend__group">
        <p className="ulegend__title">Relation lines (on hover or focus)</p>
        <ul>
          {edgeTypes.map((t) => (
            <li key={t}>
              <svg className="ulegend__line" viewBox="0 0 36 8" width="36" height="8" aria-hidden="true" focusable="false">
                <line x1="1" y1="4" x2="35" y2="4" strokeDasharray={RELATION_DASH[t] || undefined} />
              </svg>
              {RELATION_LABELS[t]}
            </li>
          ))}
        </ul>
      </div>
      <div className="ulegend__group">
        <p className="ulegend__title">Size</p>
        <p className="ulegend__note">Equal base size, a little larger for each extra layer covered. Not sized by adoption.</p>
        {showOrbit ? <p className="ulegend__note"><span className="usat__dot usat__dot--legend" aria-hidden="true" /> Orbit: related standards, grouped by category.</p> : null}
      </div>
    </div>
  );
}
