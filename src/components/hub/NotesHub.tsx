import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { getJSON, setJSON } from '../../lib/storage';
import {
  NOTES_KEY,
  exportJSON,
  exportMarkdown,
  importJSON,
  importMarkdown,
  mergeStores,
  normalizeStore,
  setNote,
  type NotesStore,
} from '../protocol/lib/notes';
import { excerpt, noteTitle, searchRows, toRows, type NoteSort, type ScopeInfo } from './lib/notes-hub';

interface Props {
  scopes: Record<string, ScopeInfo>;
  titles: Record<string, string>;
}

const NOTES_EVENT = 'atlas:notes';
const readStore = (): NotesStore => normalizeStore(getJSON<unknown>(NOTES_KEY, {}));

function download(filename: string, text: string, type: string) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Every note from the shared atlas:notes store (written by each protocol
 * page's NotesPanel) in one list: search, filter, edit, delete, export and
 * import as Markdown or JSON. Nothing leaves the browser.
 */
export default function NotesHub({ scopes, titles }: Props) {
  const [store, setStore] = useState<NotesStore>({});
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState('');
  const [sort, setSort] = useState<NoteSort>('updated');
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const refresh = () => setStore(readStore());
    refresh();
    document.addEventListener(NOTES_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      document.removeEventListener(NOTES_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const rows = useMemo(() => toRows(store, scopes, titles), [store, scopes, titles]);
  const shown = useMemo(() => searchRows(rows, query, scope, sort), [rows, query, scope, sort]);
  const scopeOptions = useMemo(() => [...new Set(rows.map((r) => r.scope))].sort(), [rows]);

  const persist = (next: NotesStore, message: string) => {
    setJSON(NOTES_KEY, next);
    setStore(next);
    setStatus(message);
    document.dispatchEvent(new CustomEvent(NOTES_EVENT));
  };

  const doExport = (format: 'json' | 'md', onlyShown: boolean) => {
    const all = readStore();
    const data: NotesStore = onlyShown ? Object.fromEntries(shown.map((r) => [r.key, all[r.key]!]).filter(([, v]) => v)) : all;
    const now = new Date().toISOString();
    const base = onlyShown ? 'atlas-notes-filtered' : 'atlas-notes';
    if (format === 'json') download(`${base}.json`, exportJSON(data, now), 'application/json');
    else download(`${base}.md`, exportMarkdown(data, now, (k) => noteTitle(k, scopes, titles)), 'text/markdown');
    setStatus(`Exported ${Object.keys(data).length} notes as ${format === 'json' ? 'JSON' : 'Markdown'}.`);
  };

  const onImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    try {
      const raw = await file.text();
      const incoming = /\.json$/i.test(file.name) || raw.trim().startsWith('{') ? importJSON(raw) : importMarkdown(raw);
      const count = Object.keys(incoming).length;
      if (!count) {
        setStatus('No notes found in that file.');
        return;
      }
      persist(mergeStores(readStore(), incoming), `Imported ${count} notes. Newer notes win when keys match.`);
    } catch {
      setStatus('That file could not be read as Atlas notes.');
    }
  };

  const save = (key: string) => {
    persist(setNote(readStore(), key, draft, new Date().toISOString()), draft.trim() ? 'Note saved.' : 'Empty note removed.');
    setEditing(null);
  };

  const remove = (key: string) => {
    persist(setNote(readStore(), key, '', new Date().toISOString()), 'Note deleted.');
    setConfirming(null);
  };

  return (
    <div className="notes-hub" data-no-copy-link="">
      <div className="notes-hub__bar">
        <label>
          <span>Search notes</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.currentTarget.value)} placeholder="Words in the note or section" />
        </label>
        <label>
          <span>Page</span>
          <select value={scope} onChange={(e) => setScope(e.currentTarget.value)}>
            <option value="">All pages</option>
            {scopeOptions.map((s) => (
              <option key={s} value={s}>
                {scopes[s]?.name ?? s}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Sort</span>
          <select value={sort} onChange={(e) => setSort(e.currentTarget.value as NoteSort)}>
            <option value="updated">Last edited first</option>
            <option value="scope">By page and section</option>
          </select>
        </label>
        <div className="notes-hub__actions">
          <button type="button" className="btn" onClick={() => doExport('md', false)}>
            Export Markdown
          </button>
          <button type="button" className="btn" onClick={() => doExport('json', false)}>
            Export JSON
          </button>
          {(query || scope) && (
            <button type="button" className="btn btn--ghost" onClick={() => doExport('md', true)}>
              Export shown as Markdown
            </button>
          )}
          <button type="button" className="btn btn--ghost" onClick={() => fileRef.current?.click()}>
            Import
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.md,.markdown,application/json,text/markdown,text/plain"
            className="sr-only"
            tabIndex={-1}
            aria-label="Import notes file"
            onChange={onImport}
          />
        </div>
      </div>
      <p className="notes-hub__status" role="status">
        {status || (rows.length ? `${shown.length} of ${rows.length} notes shown.` : '')}
      </p>

      {rows.length === 0 ? (
        <p className="notes-hub__empty">
          No notes yet. Every protocol page ends with a notes panel (section T); notes you write there, and issues you flag from the footer, appear
          here. You can also import a Markdown or JSON export.
        </p>
      ) : (
        <ul className="notes-hub__list">
          {shown.map((r) => (
            <li key={r.key} className="note-row">
              <div className="note-row__head">
                <span className="note-row__title">
                  {r.href ? <a href={r.href}>{`${r.scopeName}: ${r.sectionTitle}`}</a> : `${r.scopeName}: ${r.sectionTitle}`}
                </span>
                {r.updated && (
                  <time className="note-row__date" dateTime={r.updated}>
                    {r.updated.slice(0, 10)}
                  </time>
                )}
              </div>
              {editing === r.key ? (
                <>
                  <label className="sr-only" htmlFor={`edit-${r.key}`}>
                    Edit note for {r.scopeName}: {r.sectionTitle}
                  </label>
                  <textarea id={`edit-${r.key}`} rows={6} value={draft} onChange={(e) => setDraft(e.currentTarget.value)} />
                  <div className="note-row__tools">
                    <button type="button" className="btn" onClick={() => save(r.key)}>
                      Save
                    </button>
                    <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="note-row__text">{query ? excerpt(r.text, query, 240) : r.text}</p>
                  <div className="note-row__tools">
                    <button
                      type="button"
                      className="btn btn--ghost"
                      onClick={() => {
                        setEditing(r.key);
                        setDraft(r.text);
                        setConfirming(null);
                      }}
                    >
                      Edit<span className="sr-only"> note for {r.scopeName}: {r.sectionTitle}</span>
                    </button>
                    {confirming === r.key ? (
                      <>
                        <button type="button" className="btn" onClick={() => remove(r.key)}>
                          Confirm delete
                        </button>
                        <button type="button" className="btn btn--ghost" onClick={() => setConfirming(null)}>
                          Keep it
                        </button>
                      </>
                    ) : (
                      <button type="button" className="btn btn--ghost" onClick={() => setConfirming(r.key)}>
                        Delete<span className="sr-only"> note for {r.scopeName}: {r.sectionTitle}</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="hub-small">Notes stay in this browser under one storage key. Export them to keep a copy or move them to another device.</p>
    </div>
  );
}
