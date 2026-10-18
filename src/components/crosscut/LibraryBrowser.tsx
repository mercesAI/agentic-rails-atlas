/**
 * Library (ATLAS_PROMPT.md 4.5): every resource and publication with filters
 * (protocol, type, theme, year, badge), search and client-side exports of the
 * current selection as BibTeX, RIS or CSV. Grey literature is marked.
 *
 * The page hands over the first page of entries and the filter options, not
 * the whole list: the default view needs nothing more, and the full list
 * (`dataUrl`, a static JSON file the service worker precaches) loads on the
 * first filter, search, "Show more" or export. If it cannot load, filters and
 * exports work on the first page and say so.
 */
import { useId, useMemo, useRef, useState } from 'react';
import { downloadText } from '../../lib/client/download';
import {
  BADGE_LABELS,
  EMPTY_FILTER,
  LIBRARY_PAGE as PAGE,
  filterLibrary,
  toBibTeX,
  toCSV,
  toRIS,
  TYPE_LABELS,
  type Facets,
  type LibraryFilter,
  type LibraryItem,
} from './lib/library';

export interface LibraryBrowserProps {
  /** The first entries of the list, in order; the server renders them. */
  initial: LibraryItem[];
  /** Number of entries in the whole library. */
  total: number;
  /** Filter options over the whole library, computed at build time. */
  facets: Facets;
  /** The whole list as JSON (LibraryItem[]), a content-hashed file of this build. */
  dataUrl: string;
  protocolNames: Record<string, string>;
  accessed: string;
}

const isEmptyFilter = (f: LibraryFilter): boolean => Object.values(f).every((v) => v === '');

export default function LibraryBrowser({ initial, total, facets, dataUrl, protocolNames, accessed }: LibraryBrowserProps) {
  const uid = useId();
  const [all, setAll] = useState<LibraryItem[] | null>(null);
  const [failed, setFailed] = useState(false);
  const pending = useRef<Promise<LibraryItem[]> | null>(null);
  const [f, setF] = useState<LibraryFilter>(EMPTY_FILTER);
  const [limit, setLimit] = useState(PAGE);
  const [status, setStatus] = useState('');
  /** The whole list, fetched once; the first page when it cannot load. */
  const loadAll = (): Promise<LibraryItem[]> => {
    if (all) return Promise.resolve(all);
    pending.current ??= fetch(dataUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<LibraryItem[]>;
      })
      .then((items) => {
        setAll(items);
        setFailed(false);
        return items;
      })
      .catch(() => {
        pending.current = null;
        setFailed(true);
        return initial;
      });
    return pending.current;
  };
  const known = all ?? (failed ? initial : null);
  const matched = useMemo(() => (known ? filterLibrary(known, f) : null), [known, f]);
  // Without filters the first page and the total are known before the list loads; with filters they wait for it.
  const shown = matched ?? (isEmptyFilter(f) ? initial : null);
  const count = matched ? matched.length : isEmptyFilter(f) ? total : null;
  const set = (k: keyof LibraryFilter) => (v: string) => {
    setF({ ...f, [k]: v });
    setLimit(PAGE);
    void loadAll();
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

  const exportAs = async (kind: 'bib' | 'ris' | 'csv') => {
    const result = filterLibrary(await loadAll(), f);
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
        <button
          type="button"
          className="btn"
          onClick={() => {
            setF(EMPTY_FILTER);
            setLimit(PAGE);
          }}
        >
          Reset
        </button>
      </div>
      <div className="cc-actions" style={{ justifyContent: 'space-between' }}>
        <p className="cc-count" aria-live="polite">
          {count === null ? 'Loading the full library to apply the filters.' : `${count} of ${total} entries match.`}
          {failed && !all && ` The full library could not load, so only the first ${initial.length} entries are searched.`}
        </p>
        <div className="cc-actions" role="group" aria-label="Export the matching entries">
          <button type="button" className="btn" disabled={count === 0} onClick={() => void exportAs('bib')}>
            Export BibTeX
          </button>
          <button type="button" className="btn" disabled={count === 0} onClick={() => void exportAs('ris')}>
            Export RIS
          </button>
          <button type="button" className="btn" disabled={count === 0} onClick={() => void exportAs('csv')}>
            Export CSV
          </button>
        </div>
      </div>
      <p className="sr-only" role="status">
        {status}
      </p>
      <h2 className="sr-only">Matching entries</h2>
      {count === 0 ? (
        <p className="cc-empty">No entries match these filters. Clear the search text or choose Reset to see all {total} entries.</p>
      ) : null}
      <ul className="cc-lib-list" aria-busy={shown === null}>
        {(shown ?? initial).slice(0, limit).map((i) => (
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
      {count !== null && count > limit && (
        <p style={{ marginTop: '1rem' }}>
          <button
            type="button"
            className="btn"
            onClick={() => {
              setLimit(limit + PAGE);
              void loadAll();
            }}
          >
            Show {Math.min(PAGE, count - limit)} more ({count - limit} hidden)
          </button>
        </p>
      )}
    </div>
  );
}
