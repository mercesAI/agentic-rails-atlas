/**
 * Glossary tooltips for `<button class="term" data-term="id">` (inserted at build
 * time by lib/glossary/rehype-glossary.ts). Hover or focus shows the plain
 * definition; click pins it with a link to /glossary/#id. Definitions load once
 * from /data/glossary.json (same origin, cached by the service worker).
 */
import type { TooltipTerm } from '../glossary/lookup';

let termsPromise: Promise<Map<string, TooltipTerm>> | null = null;

function loadTerms(): Promise<Map<string, TooltipTerm>> {
  if (!termsPromise) {
    termsPromise = fetch('/data/glossary.json')
      .then((r) => (r.ok ? (r.json() as Promise<TooltipTerm[]>) : []))
      .then((list) => new Map(list.map((t) => [t.id, t])))
      .catch(() => new Map());
  }
  return termsPromise;
}

let current: HTMLElement | null = null;
let pinned = false;
let bound = false;

function tooltip(): HTMLElement | null {
  return document.getElementById('term-tooltip');
}

function hide(): void {
  const tip = tooltip();
  if (tip) {
    tip.hidden = true;
    tip.setAttribute('role', 'tooltip');
  }
  current = null;
  pinned = false;
}

function position(tip: HTMLElement, anchor: HTMLElement): void {
  const r = anchor.getBoundingClientRect();
  const width = Math.min(320, window.innerWidth - 32);
  tip.style.width = `${width}px`;
  const left = Math.max(16, Math.min(r.left + window.scrollX, window.scrollX + window.innerWidth - width - 16));
  tip.style.left = `${left}px`;
  tip.style.top = `${r.bottom + window.scrollY + 8}px`;
}

/** Renders the plain definition as text, turning `code` spans into <code> instead of showing the backticks. */
function fillPlain(el: HTMLElement, text: string): void {
  text.split('`').forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 1) {
      const code = document.createElement('code');
      code.textContent = part;
      el.append(code);
    } else {
      el.append(part);
    }
  });
}

async function show(anchor: HTMLElement, pin: boolean): Promise<void> {
  const tip = tooltip();
  const id = anchor.dataset.term;
  if (!tip || !id) return;
  const term = (await loadTerms()).get(id);
  current = anchor;
  pinned = pin;
  tip.replaceChildren();
  const title = document.createElement('p');
  title.className = 'term-tooltip__term';
  title.textContent = term?.term ?? anchor.textContent ?? id;
  const body = document.createElement('p');
  fillPlain(body, term?.plain ?? 'Definition not available offline yet.');
  tip.append(title, body);
  if (pin) {
    const link = document.createElement('a');
    link.href = `/glossary/#${id}`;
    link.textContent = 'Open in glossary';
    tip.append(link);
    tip.setAttribute('role', 'dialog');
    tip.setAttribute('aria-label', `Definition: ${title.textContent}`);
  } else {
    const hint = document.createElement('p');
    hint.className = 'term-tooltip__hint';
    hint.textContent = 'Select the term to pin this and open the glossary entry.';
    tip.append(hint);
    tip.setAttribute('role', 'tooltip');
    tip.removeAttribute('aria-label');
  }
  tip.hidden = false;
  position(tip, anchor);
  if (pin) tip.querySelector('a')?.focus();
}

export function initGlossaryTooltips(): void {
  const terms = document.querySelectorAll<HTMLElement>('button.term[data-term]');
  terms.forEach((t) => t.setAttribute('aria-describedby', 'term-tooltip'));
  hide();
  if (bound) return;
  bound = true;

  const termFrom = (e: Event) => (e.target as Element | null)?.closest?.<HTMLElement>('button.term[data-term]') ?? null;

  document.addEventListener('mouseover', (e) => {
    const t = termFrom(e);
    if (t && !pinned) void show(t, false);
  });
  document.addEventListener('mouseout', (e) => {
    const t = termFrom(e);
    if (t && !pinned && t === current) hide();
  });
  document.addEventListener('focusin', (e) => {
    const t = termFrom(e);
    if (t && !pinned) void show(t, false);
    else if (!pinned && current && !tooltip()?.contains(e.target as Node)) hide();
  });
  document.addEventListener('click', (e) => {
    const t = termFrom(e);
    if (t) {
      e.preventDefault();
      if (pinned && current === t) hide();
      else void show(t, true);
      return;
    }
    if (pinned && !tooltip()?.contains(e.target as Node)) hide();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && current) {
      const anchor = current;
      hide();
      anchor.focus();
    }
  });
}
