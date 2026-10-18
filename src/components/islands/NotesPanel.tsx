import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { getJSON, setJSON } from '../../lib/storage';
import { FLAG_SECTION, NOTES_EVENT, NOTES_KEY, exportJSON, exportMarkdown, importJSON, importMarkdown, mergeStores, normalizeStore, noteKey, notesForScope, setNote, splitKey, type NotesStore } from '../protocol/lib/notes';

interface SectionRef {
  id: string;
  title: string;
}

interface Props {
  /** Protocol slug. */
  scope: string;
  /** Protocol display name for exports. */
  name: string;
  sections: SectionRef[];
}

function readStore(): NotesStore {
  return normalizeStore(getJSON<unknown>(NOTES_KEY, {}));
}

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
 * Per-section Markdown notes for one protocol, stored in atlas:notes keyed by
 * `<slug>/<sectionId>`. Export and import JSON and Markdown. The footer
 * "flag an issue" button writes `<slug>/flags` and fires `atlas:notes`.
 */
export default function NotesPanel({ scope, name, sections }: Props) {
  const allSections: SectionRef[] = [...sections, { id: FLAG_SECTION, title: 'Flagged issues' }];
  const [store, setStore] = useState<NotesStore>({});
  const [section, setSection] = useState<string>(sections[0]?.id ?? FLAG_SECTION);
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const titleOf = (id: string) => allSections.find((s) => s.id === id)?.title ?? id;

  useEffect(() => {
    const refresh = (e?: Event) => {
      setStore(readStore());
      const detail = (e as CustomEvent<{ key?: string }> | undefined)?.detail;
      if (detail?.key) {
        const { scope: sc, section: sec } = splitKey(detail.key);
        if (sc === scope) setSection(sec);
      }
    };
    refresh();
    // "Flag an issue" may fire before this island hydrates; the page leaves the target section on the root element.
    const root = document.querySelector<HTMLElement>('[data-protocol-page]');
    const pending = root?.dataset.notesFocus;
    if (pending) {
      delete root.dataset.notesFocus;
      const { scope: sc, section: sec } = splitKey(pending);
      if (sc === scope) setSection(sec);
    }
    document.addEventListener(NOTES_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      document.removeEventListener(NOTES_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [scope]);

  const key = noteKey(scope, section);
  const text = store[key]?.text ?? '';
  const mine = notesForScope(store, scope);

  const onEdit = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const next = setNote(readStore(), key, e.currentTarget.value, new Date().toISOString());
    setStore(next);
    setJSON(NOTES_KEY, next);
    setStatus('Saved in this browser.');
  };

  const titleForKey = (k: string) => {
    const { scope: sc, section: sec } = splitKey(k);
    return sc === scope ? `${name}: ${titleOf(sec)}` : k;
  };

  const doExport = (format: 'json' | 'md', everything: boolean) => {
    const now = new Date().toISOString();
    const data = everything ? readStore() : notesForScope(readStore(), scope);
    const base = everything ? 'atlas-notes' : `atlas-notes-${scope}`;
    if (format === 'json') download(`${base}.json`, exportJSON(data, now), 'application/json');
    else download(`${base}.md`, exportMarkdown(data, now, titleForKey), 'text/markdown');
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
      const next = mergeStores(readStore(), incoming);
      setJSON(NOTES_KEY, next);
      setStore(next);
      setStatus(`Imported ${count} notes. Newer notes win when keys match.`);
    } catch {
      setStatus('That file could not be read as Atlas notes.');
    }
  };

  return (
    <div className="notes-panel">
      <div className="notes-panel__row">
        <label className="notes-panel__field">
          <span>Section</span>
          <select value={section} onChange={(e) => setSection(e.currentTarget.value)}>
            {allSections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
                {store[noteKey(scope, s.id)] ? ' (has a note)' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="notes-panel__field notes-panel__field--grow">
        <span>Note for {titleOf(section)} (Markdown)</span>
        <textarea value={text} onChange={onEdit} rows={8} spellCheck />
      </label>
      <p className="notes-panel__status" role="status">
        {status}
      </p>
      <div className="notes-panel__actions">
        <button type="button" className="btn" onClick={() => doExport('md', false)}>
          Export Markdown
        </button>
        <button type="button" className="btn" onClick={() => doExport('json', false)}>
          Export JSON
        </button>
        <button type="button" className="btn btn--ghost" onClick={() => doExport('json', true)}>
          Export all notes
        </button>
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
      {Object.keys(mine).length > 0 && (
        <div className="notes-panel__list">
          <p className="notes-panel__list-title">Your notes on {name}</p>
          <ul>
            {Object.entries(mine).map(([k, n]) => {
              const sec = splitKey(k).section;
              return (
                <li key={k}>
                  <button type="button" className="link-btn" onClick={() => setSection(sec)}>
                    {titleOf(sec)}
                  </button>{' '}
                  <span className="notes-panel__excerpt">
                    {n.text.length > 90 ? `${n.text.slice(0, 89)}...` : n.text}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p className="notes-panel__privacy">Notes stay in this browser. Nothing is sent anywhere.</p>
    </div>
  );
}
