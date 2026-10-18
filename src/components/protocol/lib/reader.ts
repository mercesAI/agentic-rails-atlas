/**
 * Client script for protocol pages (loaded by layouts/Protocol.astro).
 * - Section in view: aria-current on the TOC link and jump chip, right-rail sources list.
 * - Read progress: a section counts as read once its end has been on screen;
 *   stored as an array of section ids in atlas:read:<slug>; fires `atlas:read`.
 * - "Flag an issue": appends a prefilled note to atlas:notes and fires `atlas:notes`.
 * - BibTeX copy buttons ([data-copy-target]).
 * - STE mode opens the side-by-side comparison in section D.
 * Safe to call on every astro:page-load; returns a cleanup function.
 */
import { getJSON, setJSON } from '../../../lib/storage';
import { NOTES_EVENT, NOTES_KEY, appendFlag, flagTemplate, normalizeStore, readKey as readKeyFor } from './notes';

function announce(text: string): void {
  const live = document.getElementById('proto-live');
  if (live) live.textContent = text;
}

export function initProtocolReader(): () => void {
  const root = document.querySelector<HTMLElement>('[data-protocol-page]');
  if (!root) return () => {};
  const slug = root.dataset.protocolPage ?? '';
  const readKey = readKeyFor(slug);
  const sections = Array.from(root.querySelectorAll<HTMLElement>('[data-section]'));
  const total = sections.length;
  const tocLinks = new Map(
    Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-toc-link]')).map((a) => [a.dataset.tocLink ?? '', a]),
  );
  const jumpLinks = new Map(
    Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-jump]')).map((a) => [a.dataset.jump ?? '', a]),
  );
  const sourceLists = new Map(
    Array.from(root.querySelectorAll<HTMLElement>('[data-section-sources]')).map((el) => [el.dataset.sectionSources ?? '', el]),
  );
  const fill = root.querySelector<HTMLElement>('[data-toc-fill]');
  const count = root.querySelector<HTMLElement>('[data-toc-count]');
  const cleanups: (() => void)[] = [];

  const stored = getJSON<unknown>(readKey, []);
  const read = new Set<string>(Array.isArray(stored) ? stored.filter((x): x is string => typeof x === 'string') : []);

  const paintRead = () => {
    for (const [id, a] of tocLinks) {
      const isRead = read.has(id);
      a.toggleAttribute('data-read', isRead);
      const label = a.querySelector<HTMLElement>('[data-read-label]');
      if (label) label.textContent = isRead ? ' (read)' : '';
    }
    const n = sections.filter((s) => read.has(s.id)).length;
    if (fill) fill.style.width = `${total ? (n / total) * 100 : 0}%`;
    if (count) count.textContent = `${n} of ${total} sections read`;
  };
  paintRead();

  const markRead = (id: string) => {
    if (read.has(id)) return;
    read.add(id);
    setJSON(readKey, [...read]);
    paintRead();
    document.dispatchEvent(new CustomEvent('atlas:read', { detail: { slug, section: id } }));
  };

  let current = '';
  const setCurrent = (id: string) => {
    if (!id || id === current) return;
    current = id;
    root.dataset.currentSection = id;
    for (const [sid, a] of tocLinks) {
      if (sid === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
    for (const [sid, a] of jumpLinks) {
      if (sid === id) a.setAttribute('aria-current', 'location');
      else a.removeAttribute('aria-current');
    }
    for (const [sid, el] of sourceLists) el.hidden = sid !== id;
  };

  let frame = 0;
  const evaluate = () => {
    frame = 0;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const probe = vh * 0.3;
    // Visual order, not DOM order: STE mode moves section D above C with CSS order, so the
    // section in view is the visible one whose top is closest to the probe from above.
    let active = '';
    let activeTop = -Infinity;
    let first = '';
    let firstTop = Infinity;
    for (const s of sections) {
      const r = s.getBoundingClientRect();
      if (r.height === 0) continue; // hidden by the reading mode
      if (r.top <= probe && r.top > activeTop) {
        activeTop = r.top;
        active = s.id;
      }
      if (r.top < firstTop) {
        firstTop = r.top;
        first = s.id;
      }
      if (r.top < vh && r.bottom <= vh * 0.95 && r.bottom > 0) markRead(s.id);
    }
    setCurrent(active || first);
  };
  const schedule = () => {
    if (!frame) frame = window.requestAnimationFrame(evaluate);
  };
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  cleanups.push(() => {
    window.removeEventListener('scroll', schedule);
    window.removeEventListener('resize', schedule);
    if (frame) window.cancelAnimationFrame(frame);
  });
  evaluate();

  const reset = root.querySelector<HTMLButtonElement>('[data-toc-reset]');
  const onReset = () => {
    read.clear();
    setJSON(readKey, []);
    paintRead();
    document.dispatchEvent(new CustomEvent('atlas:read', { detail: { slug } }));
    announce('Read marks cleared.');
  };
  reset?.addEventListener('click', onReset);
  cleanups.push(() => reset?.removeEventListener('click', onReset));

  const onClick = async (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const flag = target?.closest<HTMLElement>('[data-flag-issue]');
    if (flag) {
      const now = new Date().toISOString();
      const text = flagTemplate({
        slug,
        name: flag.dataset.name ?? slug,
        url: `${location.pathname}${current ? `#${current}` : ''}`,
        section: current ? current.charAt(0).toUpperCase() : undefined,
        date: now.slice(0, 10),
      });
      const next = appendFlag(normalizeStore(getJSON<unknown>(NOTES_KEY, {})), slug, text, now);
      setJSON(NOTES_KEY, next);
      root.dataset.notesFocus = `${slug}/flags`; // picked up by the NotesPanel island if it hydrates later
      document.dispatchEvent(new CustomEvent(NOTES_EVENT, { detail: { key: `${slug}/flags` } }));
      announce('A prefilled note was added under Flagged issues in Notes.');
      document.getElementById('t-notes')?.scrollIntoView({ block: 'start' });
      return;
    }
    const copyBtn = target?.closest<HTMLElement>('[data-copy-target]');
    if (copyBtn) {
      const src = document.getElementById(copyBtn.dataset.copyTarget ?? '');
      const text = src?.textContent ?? '';
      try {
        await navigator.clipboard.writeText(text);
        announce('BibTeX copied.');
      } catch {
        const details = src?.closest('details');
        if (details) details.open = true;
        announce('Copy is blocked here. The BibTeX is shown so you can select it.');
      }
    }
  };
  root.addEventListener('click', onClick);
  cleanups.push(() => root.removeEventListener('click', onClick));

  const steCompare = root.querySelector<HTMLDetailsElement>('[data-ste-compare]');
  const onMode = () => {
    if (steCompare && document.documentElement.dataset.readingMode === 'ste') steCompare.open = true;
    schedule();
  };
  onMode();
  document.addEventListener('atlas:reading-mode', onMode);
  cleanups.push(() => document.removeEventListener('atlas:reading-mode', onMode));

  return () => cleanups.forEach((fn) => fn());
}
