/**
 * Library (ATLAS_PROMPT.md 4.5): every resource and publication with filters
 * (protocol, type, theme, year, badge), search and client-side exports of the
 * current selection as BibTeX, RIS or CSV. Grey literature is marked.
 */
import { useId, useMemo, useState } from 'react';
import { downloadText } from '../../lib/client/download';
import {
  BADGE_LABELS,
  EMPTY_FILTER,
  facetsOf,
  filterLibrary,
  toBibTeX,
  toCSV,
  toRIS,
  TYPE_LABELS,
  type LibraryFilter,
  type LibraryItem,
} from './lib/library';

export interface LibraryBrowserProps {
  items: LibraryItem[];
  protocolNames: Record<string, string>;
  accessed: string;
}

const PAGE = 60;

export default function LibraryBrowser({ items, protocolNames, accessed }: LibraryBrowserProps) {
  const uid = useId();
  const facets = useMemo(() => facetsOf(items), [items]);
  const [f, setF] = useState<LibraryFilter>(EMPTY_FILTER);
  const [limit, setLimit] = useState(PAGE);
  const [status, setStatus] = useState('');
  const result = useMemo(() => filterLibrary(items, f), [items, f]);
  const set = (k: keyof LibraryFilter) => (v: string) => {
    setF({ ...f, [k]: v });
    setLimit(PAGE);
  };

  const sel = (k: keyof LibraryFilter, label: string, values: string[], fmt: (v: string) => string, all: string) => (
    <div className="cc-field">
      <label htmlFor={`${uid}-${k}`}>{label}</label>
      <select id={`${uid}-${k}`} className="cc-select" value={f[k]} onChange={(e) => set(k)(e.target.value)}>
        <option value="">{all}</option>
        {values.map((v) => (
          <option key={v} value={v}>
            {fmt(v)}
          </option>
        ))}
      </select>
    </div>
  );

  const exportAs = (kind: 'bib' | 'ris' | 'csv') => {
    const stamp = accessed;
    if (kind === 'bib') downloadText(`agentic-rails-library-${stamp}.bib`, toBibTeX(result, accessed), 'application/x-bibtex');
    if (kind === 'ris') downloadText(`agentic-rails-library-${stamp}.ris`, toRIS(result, accessed), 'application/x-research-info-systems');
    if (kind === 'csv') downloadText(`agentic-rails-library-${stamp}.csv`, toCSV(result), 'text/csv');
    setStatus(`Exported ${result.length} entries as ${kind === 'bib' ? 'BibTeX' : kind.toUpperCase()}.`);
  };

  return (
    <div>
      <div className="cc-filters" role="search" aria-label="Filter the library">
        <div className="cc-field" style={{ flex: '1 1 16rem' }}>
          <label htmlFor={`${uid}-q`}>Search</label>
          <input
            id={`${uid}-q`}
            className="cc-input"
            type="search"
            value={f.query}
            placeholder="Title, author, publisher, theme, DOI"
            onChange={(e) => set('query')(e.target.value)}
          />
        </div>
        {sel('kind', 'Kind', ['resource', 'publication'], (v) => (v === 'resource' ? 'Resources' : 'Publications'), 'Everything')}
        {sel('protocol', 'Protocol', facets.protocols, (v) => protocolNames[v] ?? v, 'All protocols')}
        {sel('type', 'Type', facets.types, (v) => TYPE_LABELS[v] ?? v, 'All types')}
        {sel('theme', 'Theme', facets.themes, (v) => v.replace(/-/g, ' '), 'All themes')}
        {sel('year', 'Year', facets.years, (v) => v, 'All years')}
        {sel('badge', 'Badge', facets.badges, (v) => BADGE_LABELS[v] ?? v, 'All badges')}
        <button type="button" className="btn" onClick={() => setF(EMPTY_FILTER)}>
          Reset
        </button>
      </div>
      <div className="cc-actions" style={{ justifyContent: 'space-between' }}>
        <p className="cc-count" aria-live="polite">
          {result.length} of {items.length} entries match.
        </p>
        <div className="cc-actions" role="group" aria-label="Export the matching entries">
          <button type="button" className="btn" disabled={result.length === 0} onClick={() => exportAs('bib')}>
            Export BibTeX
          </button>
          <button type="button" className="btn" disabled={result.length === 0} onClick={() => exportAs('ris')}>
            Export RIS
          </button>
          <button type="button" className="btn" disabled={result.length === 0} onClick={() => exportAs('csv')}>
            Export CSV
          </button>
        </div>
      </div>
      <p className="sr-only" role="status">
        {status}
      </p>
      <h2 className="sr-only">Matching entries</h2>
      {result.length === 0 ? (
        <p className="cc-empty">No entries match these filters. Clear the search text or choose Reset to see all {items.length} entries.</p>
      ) : null}
      <ul className="cc-lib-list">
        {result.slice(0, limit).map((i) => (
          <li key={i.id} className="cc-lib-item" id={i.id}>
            <h3>
              <a href={i.url} rel="noopener noreferrer external">
                {i.title}
                <span className="sr-only"> (external link)</span>
              </a>
            </h3>
            <p className="cc-lib-byline">
              {i.authors.length > 0 ? `${i.authors.slice(0, 4).join(', ')}${i.authors.length > 4 ? ' and others' : ''}. ` : ''}
              {i.kind === 'resource' ? i.publisher : i.venue ?? (i.type === 'preprint' ? 'Preprint' : '')}
              {i.year ? `, ${i.date ?? i.year}` : ''}
              {i.doi ? `. DOI ${i.doi}` : i.arxiv ? `. arXiv:${i.arxiv}` : ''}
            </p>
            {i.note && <p className="cc-lib-note">{i.note}</p>}
            <div className="cc-lib-tags">
              {i.grey && <span className="cc-tag cc-tag--grey">Grey literature</span>}
              <span className="cc-tag">{TYPE_LABELS[i.type] ?? i.type}</span>
              <span className="cc-tag">{BADGE_LABELS[i.badge] ?? i.badge}</span>
              {i.protocols.map((p) => (
                <span key={p} className="cc-tag">
                  {protocolNames[p] ?? p}
                </span>
              ))}
              {i.themes.slice(0, 5).map((t) => (
                <span key={t} className="cc-tag">
                  {t.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ul>
      {result.length > limit && (
        <p style={{ marginTop: '1rem' }}>
          <button type="button" className="btn" onClick={() => setLimit(limit + PAGE)}>
            Show {Math.min(PAGE, result.length - limit)} more ({result.length - limit} hidden)
          </button>
        </p>
      )}
    </div>
  );
}
