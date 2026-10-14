/**
 * Controls map (ATLAS_PROMPT.md 4.5): rows are the 14 controls, columns the
 * protocols. Each cell reads native, partial, external or none with a distinct
 * mark shape and the word (never color alone). Selecting a cell shows its note
 * and sources; the last column says where an independent controls layer fits.
 */
import { useId, useMemo, useState } from 'react';
import type { ControlCell } from '../../lib/schemas';
import { cellVisible, controlKey, indexControlCells, SUPPORT_HELP, SUPPORT_ORDER, SUPPORT_TEXT, type Support } from './lib/controls';
import type { ProtocolInfo, SourceNumbers } from './lib/protocols';
import { CiteMarker, InProgressTag, ProtocolLabel, SupportMark } from './parts';

export interface ControlsMapProps {
  controls: { id: string; label: string; description: string }[];
  protocols: ProtocolInfo[];
  cells: ControlCell[];
  numbers: SourceNumbers;
  /** Per control: the independent-layer note (from controls-map.json, or derived). */
  layerNotes: Record<string, { note: string; derived: boolean }>;
}

export default function ControlsMap({ controls, protocols, cells, numbers, layerNotes }: ControlsMapProps) {
  const uid = useId();
  const idx = useMemo(() => indexControlCells(cells), [cells]);
  const covered = useMemo(() => new Set(cells.map((c) => c.protocol)), [cells]);
  const [supports, setSupports] = useState<Set<Support>>(new Set());
  const [protoSel, setProtoSel] = useState<Set<string>>(new Set(protocols.map((p) => p.slug)));
  const [showNotes, setShowNotes] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const visible = protocols.filter((p) => protoSel.has(p.slug));
  const sel = selected ? idx.get(selected) : undefined;
  const selProtocol = sel ? protocols.find((p) => p.slug === sel.protocol) : undefined;
  const selControl = sel ? controls.find((c) => c.id === sel.control) : undefined;

  const toggleSupport = (s: Support) => {
    const next = new Set(supports);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setSupports(next);
  };
  const toggleProto = (s: string) => {
    const next = new Set(protoSel);
    if (next.has(s)) next.delete(s);
    else next.add(s);
    setProtoSel(next);
  };

  return (
    <div>
      <div className="cc-filters" role="group" aria-label="Controls map filters">
        <fieldset>
          <legend>Highlight support level</legend>
          <div className="cc-checks">
            {SUPPORT_ORDER.map((s) => (
              <label key={s} className="cc-check">
                <input type="checkbox" checked={supports.has(s)} onChange={() => toggleSupport(s)} />
                {SUPPORT_TEXT[s]}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Protocols</legend>
          <div className="cc-checks">
            {protocols.map((p) => (
              <label key={p.slug} className="cc-check">
                <input type="checkbox" checked={protoSel.has(p.slug)} onChange={() => toggleProto(p.slug)} />
                {p.short}
                {!covered.has(p.slug) && <span className="sr-only"> (in progress)</span>}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="cc-check">
          <input type="checkbox" checked={showNotes} onChange={() => setShowNotes(!showNotes)} />
          Show notes in cells
        </label>
      </div>
      <ul className="cc-legend" aria-label="Support levels">
        {SUPPORT_ORDER.map((s) => (
          <li key={s}>
            <SupportMark support={s} />
            <span>{SUPPORT_HELP[s]}</span>
          </li>
        ))}
      </ul>
      <p className="cc-note">The table scrolls sideways and down inside its frame. The last column is where an independent controls layer fits.</p>
      {/* Focusable so keyboard users can scroll the wide table (WCAG 2.1.1). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="cc-frame" role="region" aria-labelledby={`${uid}-cap`} tabIndex={0}>
        <table className="cc-table">
          <caption id={`${uid}-cap`}>
            Controls by protocol. Select a cell to read its note and sources. Highlighting dims cells at other support levels.
          </caption>
          <thead>
            <tr>
              <th scope="col">Control</th>
              {visible.map((p) => (
                <th key={p.slug} scope="col" className="cc-ctrl-cell">
                  <ProtocolLabel p={p} />
                  {!covered.has(p.slug) && (
                    <div>
                      <InProgressTag />
                    </div>
                  )}
                </th>
              ))}
              <th scope="col" className="cc-ctrl-layer">
                Where an independent controls layer fits
              </th>
            </tr>
          </thead>
          <tbody>
            {controls.map((ctrl) => {
              const ln = layerNotes[ctrl.id];
              return (
                <tr key={ctrl.id} id={`ctrl-${ctrl.id}`}>
                  <th scope="row">
                    {ctrl.label}
                    <div className="cc-cell__detail">{ctrl.description}</div>
                  </th>
                  {visible.map((p) => {
                    const key = controlKey(p.slug, ctrl.id);
                    const c = idx.get(key);
                    if (!c)
                      return (
                        <td key={p.slug} className="cc-ctrl-cell cc-cell--empty">
                          {covered.has(p.slug) ? 'No entry yet' : <InProgressTag />}
                        </td>
                      );
                    return (
                      <td key={p.slug} className="cc-ctrl-cell" data-dim={cellVisible(c, supports) ? undefined : 'true'}>
                        <button
                          type="button"
                          className="cc-ctrl-btn"
                          aria-pressed={selected === key}
                          aria-controls={`${uid}-detail`}
                          aria-label={`${p.short}, ${ctrl.label}: ${SUPPORT_TEXT[c.support]}. Show note and sources.`}
                          onClick={() => setSelected(selected === key ? null : key)}
                        >
                          <SupportMark support={c.support} />
                          {showNotes && <span className="cc-ctrl-note">{c.note}</span>}
                        </button>
                      </td>
                    );
                  })}
                  <td className="cc-ctrl-layer">
                    {ln ? (
                      <>
                        {ln.derived && <strong>Derived from the cells: </strong>}
                        {ln.note}
                      </>
                    ) : (
                      'No note yet.'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div id={`${uid}-detail`} className="cc-detail cc-detail--sticky" aria-live="polite">
        {sel && selProtocol && selControl ? (
          <>
            <h3>
              {selProtocol.short}: {selControl.label}
            </h3>
            <p>
              <SupportMark support={sel.support} />
            </p>
            <p>
              {sel.note} <CiteMarker sources={sel.sources} numbers={numbers} />
            </p>
            {selProtocol.hasPage && (
              <p className="cc-note">
                <a href={`/p/${selProtocol.slug}/#i-controls`}>Open the {selProtocol.short} controls section</a>
              </p>
            )}
          </>
        ) : (
          <p className="cc-note">Select a cell to read the note and sources behind it.</p>
        )}
      </div>
    </div>
  );
}
