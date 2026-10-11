import { useEffect, useRef, useState } from 'react';
import type { CitationPayload } from '../../lib/citations';
import { parseIds } from '../../lib/citations';

type PayloadSource = CitationPayload['sources'][number];
type PayloadClaim = CitationPayload['claims'][number];

interface DrawerState {
  ids: string;
  claims: PayloadClaim[];
  sources: PayloadSource[];
  missing: string[];
}

function readPayload(): CitationPayload {
  try {
    const el = document.getElementById('atlas-citations');
    if (!el?.textContent) return { sources: [], claims: [] };
    return JSON.parse(el.textContent) as CitationPayload;
  } catch {
    return { sources: [], claims: [] };
  }
}

function resolve(ids: string): DrawerState {
  const payload = readPayload();
  const claimsById = new Map(payload.claims.map((c) => [c.id, c]));
  const sourcesById = new Map(payload.sources.map((s) => [s.id, s]));
  const claims: PayloadClaim[] = [];
  const sourceIds: string[] = [];
  const missing: string[] = [];
  for (const id of parseIds(ids)) {
    const claim = claimsById.get(id);
    if (claim) {
      claims.push(claim);
      sourceIds.push(...claim.sources);
    } else if (sourcesById.has(id)) sourceIds.push(id);
    else missing.push(id);
  }
  const sources = [...new Set(sourceIds)].flatMap((id) => {
    const s = sourcesById.get(id);
    if (!s) missing.push(id);
    return s ? [s] : [];
  });
  return { ids, claims, sources, missing };
}

const TYPE_LABELS: Record<string, string> = {
  spec: 'Specification', repo: 'Repository', docs: 'Documentation', announcement: 'Announcement',
  standard: 'Standard', paper: 'Paper', news: 'News', analysis: 'Analysis', dataset: 'Dataset',
  video: 'Video', other: 'Other',
};

/** Opens on click of any [data-cite] marker and shows the source records behind it. */
export default function CitationDrawer() {
  const ref = useRef<HTMLDialogElement>(null);
  const [state, setState] = useState<DrawerState | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const target = (e.target as Element | null)?.closest?.('[data-cite]');
      if (!target) return;
      const ids = target.getAttribute('data-cite') ?? '';
      e.preventDefault();
      setState(resolve(ids));
      const d = ref.current;
      if (d && !d.open) d.showModal();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const close = () => ref.current?.close();

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="drawer-title"
      onClick={(e) => {
        if (e.target === ref.current) close();
      }}
    >
      <div className="drawer__inner">
        <header className="drawer__head">
          <h2 id="drawer-title" className="drawer__title">Source details</h2>
          <button type="button" className="btn btn--ghost" onClick={close}>
            Close
          </button>
        </header>
        {state && (
          <div className="drawer__body">
            {state.claims.map((c) => (
              <section key={c.id} className="drawer__claim" aria-label={`Claim ${c.id}`}>
                <p className="drawer__claim-text">{c.text}</p>
                <p className="drawer__meta">
                  <span className="conf-inline" data-confidence={c.confidence}>
                    Confidence: {c.confidence}
                  </span>
                  {c.asOf && <span>As of {c.asOf}</span>}
                  <code>{c.id}</code>
                </p>
              </section>
            ))}
            {state.sources.length > 0 ? (
              <ol className="drawer__sources">
                {state.sources.map((s) => (
                  <li key={s.id} value={s.n}>
                    <a href={s.url} rel="noopener noreferrer external" className="drawer__source-title">
                      {s.title}
                    </a>
                    <dl className="drawer__facts">
                      <div><dt>Publisher</dt><dd>{s.publisher}</dd></div>
                      <div><dt>Type</dt><dd>{TYPE_LABELS[s.type] ?? s.type}{s.primary ? ', primary source' : ', secondary source'}</dd></div>
                      {s.published && <div><dt>Published</dt><dd>{s.published}</dd></div>}
                      <div><dt>Accessed</dt><dd>{s.accessed}</dd></div>
                    </dl>
                    {s.notes && <p className="drawer__notes">{s.notes}</p>}
                    <p className="drawer__links">
                      {s.archiveUrl && (
                        <a href={s.archiveUrl} rel="noopener noreferrer external">Archived copy</a>
                      )}
                      <a href={`#src-${s.n}`} onClick={close}>Jump to source {s.n}</a>
                    </p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="drawer__empty">Source details for this marker are not on this page yet.</p>
            )}
            {state.missing.length > 0 && (
              <p className="drawer__missing">
                Unresolved ids: <code>{state.missing.join(' ')}</code>
              </p>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}
