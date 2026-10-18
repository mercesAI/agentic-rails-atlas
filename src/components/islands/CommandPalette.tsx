import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import Fuse from 'fuse.js';
import { navigate } from 'astro:transitions/client';
import { createShortcutMatcher, jumpSection, SHORTCUTS } from '../../lib/shortcuts';
import { fetchSearchIndex, isInternalUrl, stripTags, type SearchItem } from '../../lib/search-client';

/**
 * The index is a static file (/data/search-index.json, served by
 * src/pages/data/search-index.json.ts) fetched once per page load, the first
 * time the palette opens. A failed fetch gives [] (the palette then reports an
 * empty index) and is not kept, so a later mount can try again.
 */
let indexPromise: Promise<SearchItem[]> | null = null;

function loadIndex(): Promise<SearchItem[]> {
  if (!indexPromise) {
    indexPromise = fetchSearchIndex().catch(() => {
      indexPromise = null;
      return [];
    });
  }
  return indexPromise;
}

interface PagefindResult {
  data: () => Promise<{ url: string; excerpt?: string; meta?: { title?: string } }>;
}
interface PagefindApi {
  search: (q: string) => Promise<{ results: PagefindResult[] }>;
}

let pagefindPromise: Promise<PagefindApi | null> | null = null;
function loadPagefind(): Promise<PagefindApi | null> {
  if (!pagefindPromise) {
    const url = '/pagefind/pagefind.js';
    pagefindPromise = import(/* @vite-ignore */ url).then(
      (m: PagefindApi) => m,
      () => null,
    );
  }
  return pagefindPromise;
}

type Mode = 'search' | 'help';

export default function CommandPalette() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>('search');
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<SearchItem[] | null>(null);
  const [fullText, setFullText] = useState<SearchItem[]>([]);
  const [active, setActive] = useState(0);

  const fuse = useMemo(
    () =>
      new Fuse(items ?? [], {
        keys: [
          { name: 'title', weight: 3 },
          { name: 'text', weight: 1 },
          { name: 'context', weight: 0.5 },
          { name: 'keywords', weight: 1 },
        ],
        threshold: 0.35,
        ignoreLocation: true,
      }),
    [items],
  );

  const open = useCallback((next: Mode) => {
    setMode(next);
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
    if (next === 'search') {
      if (items === null) void loadIndex().then(setItems);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [items]);

  const close = useCallback(() => dialogRef.current?.close(), []);

  useEffect(() => {
    const match = createShortcutMatcher();
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (dialogRef.current?.open) return;
      // Another modal (citation drawer, diagram view) owns the keyboard while it is open.
      if (document.querySelector('dialog[open]')) return;
      const action = match(e);
      if (!action) return;
      e.preventDefault();
      if (action.type === 'search') open('search');
      else if (action.type === 'help') open('help');
      else if (action.type === 'go') void navigate(action.href);
      else jumpSection(action.dir);
    };
    const onOpen = (e: Event) => open((e as CustomEvent<Mode | undefined>).detail ?? 'search');
    document.addEventListener('keydown', onKey);
    document.addEventListener('atlas:open-palette', onOpen);
    // Marks the dialog once the shortcuts listen. Astro drops the island's ssr attribute before
    // React runs this effect, so the end-to-end tests wait for this marker before pressing j or k.
    const dialog = dialogRef.current;
    dialog?.setAttribute('data-shortcuts', 'ready');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('atlas:open-palette', onOpen);
      dialog?.removeAttribute('data-shortcuts');
    };
  }, [open]);

  useEffect(() => {
    const q = query.trim();
    setActive(0);
    if (q.length < 2) {
      setFullText([]);
      return;
    }
    let cancelled = false;
    const t = window.setTimeout(async () => {
      const pf = await loadPagefind();
      if (!pf || cancelled) return;
      try {
        const res = await pf.search(q);
        const data = await Promise.all(res.results.slice(0, 5).map((r) => r.data()));
        if (cancelled) return;
        setFullText(
          data.map((d) => ({
            title: d.meta?.title ?? d.url,
            url: d.url,
            kind: 'full text',
            text: d.excerpt ? stripTags(d.excerpt) : undefined,
          })),
        );
      } catch {
        if (!cancelled) setFullText([]);
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return (items ?? []).filter((i) => i.kind === 'page').slice(0, 8);
    const fuzzy = fuse.search(q, { limit: 8 }).map((r) => r.item);
    const seen = new Set(fuzzy.map((r) => r.url));
    return [...fuzzy, ...fullText.filter((r) => !seen.has(r.url))];
  }, [query, fuse, fullText, items]);

  const go = (item: SearchItem | undefined) => {
    if (!item) return;
    close();
    if (isInternalUrl(item.url)) void navigate(item.url);
    else window.location.assign(item.url);
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      go(results[active]);
    }
  };

  const listId = 'palette-results';
  const optionId = (i: number) => `palette-opt-${i}`;

  return (
    // Backdrop click closes; Escape is handled natively by <dialog>.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      className="palette command-palette"
      aria-label={mode === 'help' ? 'Keyboard shortcuts' : 'Search the atlas'}
      onClick={(e) => {
        if (e.target === dialogRef.current) close();
      }}
      onClose={() => {
        setQuery('');
        setActive(0);
      }}
    >
      {mode === 'help' ? (
        <div className="palette__body">
          <h2 className="palette__heading">Keyboard shortcuts</h2>
          <dl className="palette__keys">
            {SHORTCUTS.map((s) => (
              <div key={s.label} className="palette__key-row">
                <dt>
                  {s.keys.map((k) => (
                    <kbd key={k}>{k}</kbd>
                  ))}
                </dt>
                <dd>{s.label}</dd>
              </div>
            ))}
          </dl>
          <div className="palette__foot">
            <button type="button" className="btn" onClick={() => open('search')}>Search instead</button>
            <button type="button" className="btn" onClick={close}>Close</button>
          </div>
        </div>
      ) : (
        <div className="palette__body">
          <label htmlFor="palette-input" className="sr-only">Search pages, sections, terms, resources and papers</label>
          <input
            ref={inputRef}
            id="palette-input"
            className="palette__input"
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls={listId}
            aria-activedescendant={results[active] ? optionId(active) : undefined}
            aria-autocomplete="list"
            placeholder="Search pages, sections, terms, resources and papers"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
          />
          <ul id={listId} role="listbox" className="palette__list" aria-label="Results">
            {results.map((r, i) => (
              // Keyboard selection happens on the combobox input (aria-activedescendant).
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={`${r.url}-${i}`}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                className="palette__item"
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
              >
                <span className="palette__kind">{r.kind}</span>
                <span className="palette__title">{r.title}</span>
                {r.text && <span className="palette__text">{r.text.slice(0, 140)}</span>}
              </li>
            ))}
          </ul>
          <p className="palette__status" aria-live="polite">
            {items === null
              ? 'Loading the index.'
              : query.trim() && results.length === 0
                ? 'No results.'
                : items.length === 0 && !query.trim()
                  ? 'The search index is empty in this build.'
                  : ''}
          </p>
          <p className="palette__hint">
            <kbd>Enter</kbd> open <kbd>Esc</kbd> close <kbd>?</kbd> shortcuts
          </p>
        </div>
      )}
    </dialog>
  );
}
