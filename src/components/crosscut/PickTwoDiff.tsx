/**
 * "Pick two" side-by-side diff of two protocols across every compare dimension.
 * The page hands over only the cells of the default pair, which the server
 * renders; the matrix above already carries every cell, so the page would
 * otherwise hold them twice. Picking another protocol loads all cells from
 * `dataUrl` (a static JSON file the service worker precaches).
 */
import { useId, useMemo, useRef, useState } from 'react';
import type { CompareCell } from '../../lib/schemas';
import { diffProtocols, diffSummary, indexCells, type DiffStatus, type Dimension } from './lib/compare';
import type { ProtocolInfo, SourceNumbers } from './lib/protocols';
import { CiteMarker, ConfBadge, InProgressTag } from './parts';

export interface PickTwoDiffProps {
  protocols: ProtocolInfo[];
  dimensions: Dimension[];
  /** Slugs of the protocols that have compare cells, in protocol order; the first two are the default pair. */
  covered: string[];
  /** Cells of the default pair. */
  cells: CompareCell[];
  /** Every compare cell as JSON (CompareCell[]), a content-hashed file of this build. */
  dataUrl: string;
  numbers: SourceNumbers;
}

const STATUS_TEXT: Record<DiffStatus, { glyph: string; text: string }> = {
  different: { glyph: '≠', text: 'Differs' },
  same: { glyph: '=', text: 'Same' },
  missing: { glyph: '?', text: 'One side missing' },
};

export default function PickTwoDiff({ protocols, dimensions, covered, cells, dataUrl, numbers }: PickTwoDiffProps) {
  const uid = useId();
  const [all, setAll] = useState<CompareCell[] | null>(null);
  const [failed, setFailed] = useState(false);
  const pending = useRef<Promise<void> | null>(null);
  const idx = useMemo(() => indexCells(all ?? cells), [all, cells]);
  const [a, setA] = useState(covered[0] ?? '');
  const [b, setB] = useState(covered[1] ?? covered[0] ?? '');
  const [onlyDiff, setOnlyDiff] = useState(false);

  if (covered.length < 2) {
    return <p className="cc-note">The diff needs two protocols with compare data. More protocols are in progress.</p>;
  }

  const loadAll = () => {
    if (all || pending.current) return;
    pending.current = fetch(dataUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<CompareCell[]>;
      })
      .then((list) => setAll(list))
      .catch(() => {
        pending.current = null;
        setFailed(true);
      });
  };
  const pick = (set: (v: string) => void) => (v: string) => {
    set(v);
    loadAll();
  };
  // The default pair's cells come with the page; any other protocol waits for the full list.
  const has = (slug: string) => all !== null || slug === covered[0] || slug === covered[1];
  const ready = has(a) && has(b);
  const rows = ready ? diffProtocols(dimensions, idx, a, b) : [];
  const sum = diffSummary(rows);
  const shown = onlyDiff ? rows.filter((r) => r.status === 'different') : rows;
  const pa = protocols.find((p) => p.slug === a);
  const pb = protocols.find((p) => p.slug === b);

  const select = (id: string, label: string, value: string, set: (v: string) => void) => (
    <div className="cc-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="cc-select" value={value} onChange={(e) => set(e.target.value)}>
        {protocols.map((p) => {
          const ok = covered.includes(p.slug);
          return (
            <option key={p.slug} value={p.slug} disabled={!ok}>
              {p.short}
              {ok ? '' : ' (in progress)'}
            </option>
          );
        })}
      </select>
    </div>
  );

  const cellView = (c: CompareCell | null) =>
    c ? (
      <>
        <div className="cc-cell__value">{c.value}</div>
        {c.detail && <div className="cc-cell__detail">{c.detail}</div>}
        <div className="cc-cell__meta">
          <ConfBadge confidence={c.confidence} />
          <CiteMarker sources={c.sources} numbers={numbers} />
        </div>
      </>
    ) : (
      <InProgressTag label="No entry" />
    );

  return (
    <div>
      <div className="cc-filters" role="group" aria-label="Pick two protocols">
        {select(`${uid}-a`, 'First protocol', a, pick(setA))}
        {select(`${uid}-b`, 'Second protocol', b, pick(setB))}
        <label className="cc-check">
          <input type="checkbox" checked={onlyDiff} onChange={() => setOnlyDiff(!onlyDiff)} />
          Only show differences
        </label>
      </div>
      <p className="cc-count" aria-live="polite">
        {a === b
          ? 'Pick two different protocols to see differences.'
          : !ready
            ? failed
              ? 'The comparison data could not load. Reload the page to try again.'
              : 'Loading the comparison.'
            : `${sum.different} dimensions differ, ${sum.same} read the same, ${sum.missing} have an entry on one side only. Values are compared as text, so read the details before you draw a conclusion.`}
      </p>
      {/* Focusable so keyboard users can scroll the wide table (WCAG 2.1.1). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="cc-frame" role="region" aria-labelledby={`${uid}-cap`} tabIndex={0}>
        <table className="cc-table cc-diff-table">
          <caption id={`${uid}-cap`}>
            {pa?.short} compared with {pb?.short}. Rows that differ carry a not-equal mark and a bar on the left.
          </caption>
          <thead>
            <tr>
              <th scope="col">Dimension</th>
              <th scope="col">Status</th>
              <th scope="col">{pa?.short}</th>
              <th scope="col">{pb?.short}</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.dimension.id} className="cc-diff-row" data-status={r.status}>
                <th scope="row">{r.dimension.label}</th>
                <td>
                  <span className="cc-diff-status">
                    <span className="cc-diff-glyph" aria-hidden="true">
                      {STATUS_TEXT[r.status].glyph}
                    </span>
                    {STATUS_TEXT[r.status].text}
                  </span>
                </td>
                <td className="cc-cell">{cellView(r.a)}</td>
                <td className="cc-cell">{cellView(r.b)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
