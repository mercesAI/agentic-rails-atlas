/** "Pick two" side-by-side diff of two protocols across every compare dimension. */
import { useId, useMemo, useState } from 'react';
import type { CompareCell } from '../../lib/schemas';
import { diffProtocols, diffSummary, indexCells, type DiffStatus, type Dimension } from './lib/compare';
import type { ProtocolInfo, SourceNumbers } from './lib/protocols';
import { CiteMarker, ConfBadge, InProgressTag } from './parts';

export interface PickTwoDiffProps {
  protocols: ProtocolInfo[];
  dimensions: Dimension[];
  cells: CompareCell[];
  numbers: SourceNumbers;
}

const STATUS_TEXT: Record<DiffStatus, { glyph: string; text: string }> = {
  different: { glyph: '≠', text: 'Differs' },
  same: { glyph: '=', text: 'Same' },
  missing: { glyph: '?', text: 'One side missing' },
};

export default function PickTwoDiff({ protocols, dimensions, cells, numbers }: PickTwoDiffProps) {
  const uid = useId();
  const idx = useMemo(() => indexCells(cells), [cells]);
  const covered = protocols.filter((p) => cells.some((c) => c.protocol === p.slug));
  const [a, setA] = useState(covered[0]?.slug ?? '');
  const [b, setB] = useState(covered[1]?.slug ?? covered[0]?.slug ?? '');
  const [onlyDiff, setOnlyDiff] = useState(false);

  if (covered.length < 2) {
    return <p className="cc-note">The diff needs two protocols with compare data. More protocols are in progress.</p>;
  }

  const rows = diffProtocols(dimensions, idx, a, b);
  const sum = diffSummary(rows);
  const shown = onlyDiff ? rows.filter((r) => r.status === 'different') : rows;
  const pa = protocols.find((p) => p.slug === a);
  const pb = protocols.find((p) => p.slug === b);

  const select = (id: string, label: string, value: string, set: (v: string) => void) => (
    <div className="cc-field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className="cc-select" value={value} onChange={(e) => set(e.target.value)}>
        {protocols.map((p) => {
          const ok = covered.some((c) => c.slug === p.slug);
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
        {select(`${uid}-a`, 'First protocol', a, setA)}
        {select(`${uid}-b`, 'Second protocol', b, setB)}
        <label className="cc-check">
          <input type="checkbox" checked={onlyDiff} onChange={() => setOnlyDiff(!onlyDiff)} />
          Only show differences
        </label>
      </div>
      <p className="cc-count" aria-live="polite">
        {a === b
          ? 'Pick two different protocols to see differences.'
          : `${sum.different} dimensions differ, ${sum.same} read the same, ${sum.missing} have an entry on one side only. Values are compared as text, so read the details before you draw a conclusion.`}
      </p>
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
