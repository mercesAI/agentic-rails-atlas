import { useEffect, useMemo, useState } from 'react';
import { ConfBadge } from '../ui/ConfBadge';
import { toggleInSet } from '../../lib/set-toggle';
import {
  CONFIDENCE_LABELS,
  KIND_LABELS,
  ZOOM_PRESETS,
  bucketing,
  buildMarkers,
  filterEvents,
  groupByYear,
  position,
  resolveRange,
  yearBounds,
  yearTicks,
  type Confidence,
  type HubEvent,
  type Lane,
  type Marker,
} from './lib/timeline';

interface Props {
  lanes: (Lane & { family?: string })[];
  events: HubEvent[];
  kinds: string[];
  /** Initial zoom preset id. */
  initialZoom?: string;
}

const CONFIDENCES: Confidence[] = ['verified', 'reported', 'unverified'];

function EventBody({ e, laneLabel }: { e: HubEvent; laneLabel: string }) {
  return (
    <>
      <div className="tl-event__head">
        <time dateTime={e.date} className="tl-event__date">
          {e.date}
        </time>
        <span className="tl-event__lane">{laneLabel}</span>
        <span className="tl-event__kind">{KIND_LABELS[e.kind] ?? e.kind}</span>
        <ConfBadge confidence={e.confidence} />
      </div>
      <p className="tl-event__title">{e.title}</p>
      {e.detail && <p className="tl-event__detail">{e.detail}</p>}
      <p className="tl-event__sources">
        <span>Sources: </span>
        {e.sources.map((s, i) => (
          <span key={s.id}>
            {i > 0 && ', '}
            <a href={`#src-${s.n}`} data-cite={s.id} title={s.title}>
              [{s.n}]<span className="sr-only"> {s.title}</span>
            </a>
          </span>
        ))}
      </p>
    </>
  );
}

/**
 * Multi-lane timeline with filters (lane, kind, confidence, text), zoom by
 * year range, a lane view with bucketed markers and an accessible list view.
 * Marker shape encodes the weakest confidence in its bucket (filled, half,
 * dashed ring) and every marker has a text label, so color is never needed.
 */
export default function TimelineExplorer({ lanes, events, kinds, initialZoom = 'now' }: Props) {
  const bounds = useMemo(() => yearBounds(events), [events]);
  const years = useMemo(() => {
    const out: number[] = [];
    for (let y = bounds[0]; y <= bounds[1]; y += 1) out.push(y);
    return out;
  }, [bounds]);
  const preset = ZOOM_PRESETS.find((z) => z.id === initialZoom) ?? ZOOM_PRESETS[0]!;

  const [view, setView] = useState<'lanes' | 'list'>('lanes');
  const [laneSel, setLaneSel] = useState<Set<string>>(new Set());
  const [kindSel, setKindSel] = useState<Set<string>>(new Set());
  const [confSel, setConfSel] = useState<Set<Confidence>>(new Set());
  const [from, setFrom] = useState<number | null>(preset.from);
  const [to, setTo] = useState<number | null>(preset.to);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [jumpLane, setJumpLane] = useState<string | null>(null);

  // Deep link: #lane-<id> preselects one lane (used by the learning path).
  useEffect(() => {
    const m = /^#lane-(.+)$/.exec(window.location.hash);
    if (m) {
      const id = decodeURIComponent(m[1] ?? '');
      if (lanes.some((l) => l.id === id)) {
        setLaneSel(new Set([id]));
        setFrom(null);
        setTo(null);
        setJumpLane(id);
      }
    }
  }, [lanes]);

  // After the deep-linked lane renders, bring it into view (the controls sit above it).
  useEffect(() => {
    if (!jumpLane) return;
    const row = document.getElementById(`lane-${jumpLane}`);
    if (!row) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    setJumpLane(null);
  }, [jumpLane, laneSel]);

  // The range is resolved first so a "from" later than "to" filters with the swapped pair the status line shows.
  const range = resolveRange(from, to, bounds);
  const filtered = useMemo(
    () => filterEvents(events, { lanes: laneSel, kinds: kindSel, confidences: confSel, from: range.from, to: range.to, query }),
    [events, laneSel, kindSel, confSel, range.from, range.to, query],
  );
  const mode = bucketing(range);
  const markers = useMemo(() => buildMarkers(filtered, mode), [filtered, mode]);
  const visibleLanes = lanes.filter((l) => (laneSel.size === 0 || laneSel.has(l.id)) && filtered.some((e) => e.lane === l.id));
  const laneLabel = (id: string) => lanes.find((l) => l.id === id)?.label ?? id;
  const current: Marker | undefined = markers.find((m) => m.key === selected);
  const zoomId = ZOOM_PRESETS.find((z) => z.from === from && z.to === to)?.id ?? 'custom';

  const reset = () => {
    setLaneSel(new Set());
    setKindSel(new Set());
    setConfSel(new Set());
    setFrom(preset.from);
    setTo(preset.to);
    setQuery('');
    setSelected(null);
  };

  return (
    <div className="tl" data-no-copy-link="">
      <div className="tl__controls">
        <fieldset className="tl__group">
          <legend>View</legend>
          <div className="seg" role="group" aria-label="View">
            <button type="button" aria-pressed={view === 'lanes'} onClick={() => setView('lanes')}>
              Lanes
            </button>
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>
              List
            </button>
          </div>
        </fieldset>
        <fieldset className="tl__group">
          <legend>Zoom</legend>
          <div className="tl__zoom">
          <div className="seg" role="group" aria-label="Zoom presets">
            {ZOOM_PRESETS.map((z) => (
              <button
                key={z.id}
                type="button"
                aria-pressed={zoomId === z.id}
                onClick={() => {
                  setFrom(z.from);
                  setTo(z.to);
                  setSelected(null);
                }}
              >
                {z.label}
              </button>
            ))}
          </div>
          <div className="tl__years">
            <label>
              <span>From</span>
              <select value={from ?? ''} onChange={(e) => setFrom(e.currentTarget.value ? Number(e.currentTarget.value) : null)}>
                <option value="">Earliest</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>To</span>
              <select value={to ?? ''} onChange={(e) => setTo(e.currentTarget.value ? Number(e.currentTarget.value) : null)}>
                <option value="">Latest</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
          </div>
        </fieldset>
        <label className="tl__search">
          <span>Search events</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.currentTarget.value)} placeholder="Title or detail" />
        </label>
        <details className="tl__filters">
          <summary>
            Filter lanes, kinds and confidence
            {laneSel.size + kindSel.size + confSel.size > 0 && ` (${laneSel.size + kindSel.size + confSel.size} active)`}
          </summary>
          <fieldset className="tl__checks">
            <legend>Lanes</legend>
            {lanes.map((l) => (
              <label key={l.id} className="tl__check" data-family={l.family}>
                <input type="checkbox" checked={laneSel.has(l.id)} onChange={() => setLaneSel(toggleInSet(laneSel, l.id))} />
                <span className="tl__swatch" data-group={l.group} aria-hidden="true" />
                {l.label}
              </label>
            ))}
          </fieldset>
          <fieldset className="tl__checks">
            <legend>Kinds</legend>
            {kinds.map((k) => (
              <label key={k} className="tl__check">
                <input type="checkbox" checked={kindSel.has(k)} onChange={() => setKindSel(toggleInSet(kindSel, k))} />
                {KIND_LABELS[k] ?? k}
              </label>
            ))}
          </fieldset>
          <fieldset className="tl__checks">
            <legend>Confidence</legend>
            {CONFIDENCES.map((c) => (
              <label key={c} className="tl__check">
                <input type="checkbox" checked={confSel.has(c)} onChange={() => setConfSel(toggleInSet(confSel, c))} />
                <ConfBadge confidence={c} />
              </label>
            ))}
          </fieldset>
          <p className="tl__hint">No box ticked in a group means every value in that group is shown.</p>
        </details>
        <button type="button" className="btn btn--ghost" onClick={reset}>
          Reset
        </button>
      </div>

      <p className="tl__count" role="status">
        {filtered.length} of {events.length} events, {range.from} to {range.to}
        {view === 'lanes' && `, grouped by ${mode}`}.
      </p>

      {view === 'lanes' ? (
        <>
          {/* Scrollable region must be focusable so keyboard users can scroll it (WCAG 2.1.1). */}
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
          <div className="tl-lanes" role="region" aria-label="Timeline lanes" tabIndex={0}>
            <div className="tl-lanes__inner" style={{ minWidth: `max(44rem, calc(11rem + ${(range.to - range.from + 1) * (mode === 'month' ? 12 : 1) * 2}rem))` }}>
              <div className="tl-lanes__axis" aria-hidden="true">
                <span className="tl-lanes__label" />
                <div className="tl-lanes__track">
                  {yearTicks(range).map((y) => (
                    <span key={y} className="tl-lanes__tick" style={{ left: `${position(`${y}-01-01`, range)}%` }}>
                      {y}
                    </span>
                  ))}
                </div>
              </div>
              {visibleLanes.length === 0 && <p className="tl__empty">No events match these filters.</p>}
              {visibleLanes.map((l) => (
                <div key={l.id} className="tl-lanes__row" id={`lane-${l.id}`} data-family={l.family} data-group={l.group}>
                  {l.group === 'protocol' ? (
                    <a className="tl-lanes__label" href={`/p/${l.id}/`}>
                      {l.label}
                    </a>
                  ) : (
                    <span className="tl-lanes__label">{l.label}</span>
                  )}
                  <div className="tl-lanes__track">
                    {markers
                      .filter((m) => m.lane === l.id)
                      .map((m) => (
                        <button
                          key={m.key}
                          type="button"
                          className="tl-marker"
                          data-confidence={m.confidence}
                          aria-pressed={selected === m.key}
                          style={{ left: `${position(m.date, range)}%` }}
                          aria-label={`${l.label}, ${m.period}: ${m.events.length} ${m.events.length === 1 ? 'event' : 'events'}, lowest confidence ${CONFIDENCE_LABELS[m.confidence].toLowerCase()}`}
                          title={`${m.period}: ${m.events.map((e) => e.title).join('; ')}`}
                          onClick={() => setSelected(selected === m.key ? null : m.key)}
                        >
                          {m.events.length > 1 && <span className="tl-marker__n">{m.events.length}</span>}
                        </button>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="tl-legend" aria-hidden="true">
            <span><span className="tl-marker tl-marker--static" data-confidence="verified" /> Verified</span>
            <span><span className="tl-marker tl-marker--static" data-confidence="reported" /> Reported</span>
            <span><span className="tl-marker tl-marker--static" data-confidence="unverified" /> Unverified</span>
            <span>A number on a marker counts the events in that {mode}.</span>
          </div>
          <div className="tl-detail" aria-live="polite">
            {current ? (
              <>
                <h3 className="tl-detail__title">
                  {laneLabel(current.lane)}, {current.period}
                </h3>
                <ol className="tl-detail__list">
                  {current.events.map((e) => (
                    <li key={e.id} className="tl-event">
                      <EventBody e={e} laneLabel={laneLabel(e.lane)} />
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <p className="tl-detail__hint">Select a marker to read its events and sources, or switch to the list view.</p>
            )}
          </div>
        </>
      ) : (
        <div className="tl-list">
          {filtered.length === 0 && <p className="tl__empty">No events match these filters.</p>}
          {groupByYear(filtered).map(([year, list]) => (
            <section key={year} className="tl-list__year" aria-labelledby={`tl-y-${year}`}>
              <h3 id={`tl-y-${year}`}>{year}</h3>
              <ol>
                {list.map((e) => (
                  <li key={e.id} className="tl-event" data-family={lanes.find((l) => l.id === e.lane)?.family}>
                    <EventBody e={e} laneLabel={laneLabel(e.lane)} />
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
