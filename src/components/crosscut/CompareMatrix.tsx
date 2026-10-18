/**
 * Compare matrix (ATLAS_PROMPT.md 4.5, Appendix A): dimensions as rows,
 * protocols as columns, sticky headers, filters by dimension group, protocol
 * and text. Every cell shows its value, confidence and a citation marker that
 * opens the global citation drawer. Protocols without cells read "in progress".
 */
import { useId, useMemo, useState } from 'react';
import type { CompareCell } from '../../lib/schemas';
import { cellKey, filterDimensions, groupOf, groupsFor, indexCells, protocolsWithCells, type Dimension } from './lib/compare';
import type { ProtocolInfo, SourceNumbers } from './lib/protocols';
import { CiteMarker, ConfBadge, InProgressTag, ProtocolLabel } from './parts';
import { toggleInSet } from '../../lib/set-toggle';

export interface CompareMatrixProps {
  protocols: ProtocolInfo[];
  dimensions: Dimension[];
  cells: CompareCell[];
  numbers: SourceNumbers;
}

export default function CompareMatrix({ protocols, dimensions, cells, numbers }: CompareMatrixProps) {
  const uid = useId();
  const idx = useMemo(() => indexCells(cells), [cells]);
  const covered = useMemo(() => protocolsWithCells(cells), [cells]);
  const groups = useMemo(() => groupsFor(dimensions), [dimensions]);
  const [groupSel, setGroupSel] = useState<Set<string>>(new Set());
  const [protoSel, setProtoSel] = useState<Set<string>>(new Set(protocols.map((p) => p.slug)));
  const [query, setQuery] = useState('');
  const [showDetail, setShowDetail] = useState(true);

  const visibleProtocols = protocols.filter((p) => protoSel.has(p.slug));
  const rows = filterDimensions(dimensions, idx, { groups: groupSel, protocols: protoSel, query });

  const toggle = (set: Set<string>, value: string, update: (s: Set<string>) => void) => update(toggleInSet(set, value));

  // Rows grouped for group header rows, in display order.
  const grouped = groups
    .map((g) => ({ ...g, dims: rows.filter((d) => groupOf(d).id === g.id) }))
    .filter((g) => g.dims.length > 0);

  return (
    <div className="cc-compare">
      <div className="cc-filters" role="group" aria-label="Compare matrix filters">
        <fieldset>
          <legend>Dimension groups</legend>
          <div className="cc-checks">
            {groups.map((g) => (
              <label key={g.id} className="cc-check">
                <input type="checkbox" checked={groupSel.has(g.id)} onChange={() => toggle(groupSel, g.id, setGroupSel)} />
                {g.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Protocols</legend>
          <div className="cc-checks">
            {protocols.map((p) => (
              <label key={p.slug} className="cc-check">
                <input type="checkbox" checked={protoSel.has(p.slug)} onChange={() => toggle(protoSel, p.slug, setProtoSel)} />
                {p.short}
                {!covered.has(p.slug) && <span className="sr-only"> (in progress)</span>}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="cc-field">
          <label htmlFor={`${uid}-q`}>Search cells</label>
          <input
            id={`${uid}-q`}
            className="cc-input"
            type="search"
            value={query}
            placeholder="For example: SD-JWT, refunds"
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="cc-actions">
          <label className="cc-check">
            <input type="checkbox" checked={showDetail} onChange={() => setShowDetail(!showDetail)} />
            Show details
          </label>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setGroupSel(new Set());
              setProtoSel(new Set(protocols.map((p) => p.slug)));
              setQuery('');
            }}
          >
            Reset filters
          </button>
        </div>
      </div>
      <p className="cc-count" aria-live="polite">
        Showing {rows.length} of {dimensions.length} dimensions for {visibleProtocols.length} of {protocols.length} protocols.
        {groupSel.size === 0 ? ' No group filter applied.' : ''}
      </p>
      {/* Focusable so keyboard users can scroll the wide table (WCAG 2.1.1). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="cc-frame" role="region" aria-labelledby={`${uid}-cap`} tabIndex={0}>
        <table className="cc-table">
          <caption id={`${uid}-cap`}>
            Compare matrix: one row per dimension, one column per protocol. Each cell gives the value, its confidence and its
            sources.
          </caption>
          <thead>
            <tr>
              <th scope="col">Dimension</th>
              {visibleProtocols.map((p) => (
                <th key={p.slug} scope="col" className="cc-cell">
                  <ProtocolLabel p={p} />
                  {!covered.has(p.slug) && (
                    <div>
                      <InProgressTag />
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grouped.length === 0 && (
              <tr>
                <td colSpan={visibleProtocols.length + 1} className="cc-cell--empty">
                  No dimension matches these filters. Clear the search text or choose Reset filters.
                </td>
              </tr>
            )}
            {grouped.map((g) => [
              <tr key={`g-${g.id}`} className="cc-group">
                <th scope="colgroup" colSpan={visibleProtocols.length + 1}>
                  {g.label}
                </th>
              </tr>,
              ...g.dims.map((d) => (
                <tr key={d.id} id={`dim-${d.id}`}>
                  <th scope="row">{d.label}</th>
                  {visibleProtocols.map((p) => {
                    const c = idx.get(cellKey(p.slug, d.id));
                    if (!c)
                      return (
                        <td key={p.slug} className="cc-cell cc-cell--empty">
                          {covered.has(p.slug) ? 'No entry yet' : <InProgressTag />}
                        </td>
                      );
                    return (
                      <td key={p.slug} className="cc-cell">
                        <div className="cc-cell__value">{c.value}</div>
                        {showDetail && c.detail && <div className="cc-cell__detail">{c.detail}</div>}
                        <div className="cc-cell__meta">
                          <ConfBadge confidence={c.confidence} />
                          <CiteMarker sources={c.sources} numbers={numbers} />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              )),
            ])}
          </tbody>
        </table>
      </div>
    </div>
  );
}
