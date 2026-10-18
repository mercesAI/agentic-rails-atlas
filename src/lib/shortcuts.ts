/**
 * Keyboard shortcuts (ATLAS_PROMPT.md 4.6): `/` or Cmd/Ctrl+K search, `g h` home,
 * `g c` compare, `g s` stack, `j` and `k` next and previous section, `?` help.
 */

export type ShortcutAction =
  | { type: 'search' }
  | { type: 'go'; href: string }
  | { type: 'section'; dir: 1 | -1 }
  | { type: 'help' };

export interface Shortcut {
  keys: string[];
  label: string;
  action: ShortcutAction;
}

export const SHORTCUTS: Shortcut[] = [
  { keys: ['/'], label: 'Search', action: { type: 'search' } },
  { keys: ['Ctrl', 'K'], label: 'Search (Cmd+K on macOS)', action: { type: 'search' } },
  { keys: ['g', 'h'], label: 'Go to home', action: { type: 'go', href: '/' } },
  { keys: ['g', 'c'], label: 'Go to compare', action: { type: 'go', href: '/compare/' } },
  { keys: ['g', 's'], label: 'Go to stack', action: { type: 'go', href: '/stack/' } },
  { keys: ['j'], label: 'Next section', action: { type: 'section', dir: 1 } },
  { keys: ['k'], label: 'Previous section', action: { type: 'section', dir: -1 } },
  { keys: ['?'], label: 'Show shortcuts', action: { type: 'help' } },
];

const GO_TARGETS: Record<string, string> = { h: '/', c: '/compare/', s: '/stack/' };
const SEQUENCE_TIMEOUT_MS = 1200;

/** True when the event target accepts text, so single-key shortcuts must not fire. */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).tagName !== 'string') return false;
  const el = target as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  return el.isContentEditable === true;
}

interface KeyLike {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  target: EventTarget | null;
}

/** Returns a stateful matcher that handles the two-key `g` sequences. */
export function createShortcutMatcher(now: () => number = () => Date.now()) {
  let pendingG: number | null = null;
  return (e: KeyLike): ShortcutAction | null => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') return { type: 'search' };
    if (e.metaKey || e.ctrlKey || e.altKey) return null;
    if (isTypingTarget(e.target)) return null;
    if (pendingG !== null && now() - pendingG < SEQUENCE_TIMEOUT_MS) {
      pendingG = null;
      const href = GO_TARGETS[e.key.toLowerCase()];
      return href ? { type: 'go', href } : null;
    }
    pendingG = null;
    switch (e.key) {
      case '/':
        return { type: 'search' };
      case '?':
        return { type: 'help' };
      case 'j':
        return { type: 'section', dir: 1 };
      case 'k':
        return { type: 'section', dir: -1 };
      case 'g':
        pendingG = now();
        return null;
      default:
        return null;
    }
  };
}

/**
 * Distance from the viewport top where `scrollIntoView` places a target: the root's
 * `scroll-padding-top` plus the target's own `scroll-margin-top`. Reading both keeps
 * the comparison below consistent with where the browser actually lands.
 */
export function scrollOffsetFor(target: Element, doc: Document = document): number {
  const view = doc.defaultView;
  if (!view) return 0;
  const px = (v: string) => (Number.isFinite(parseFloat(v)) ? parseFloat(v) : 0);
  return px(view.getComputedStyle(doc.documentElement).scrollPaddingTop) + px(view.getComputedStyle(target).scrollMarginTop);
}

/** Scrolls to the next or previous section (`[data-section]`, falling back to `h2[id]`). */
export function jumpSection(dir: 1 | -1, doc: Document = document): void {
  let targets = Array.from(doc.querySelectorAll<HTMLElement>('[data-section]'));
  if (targets.length === 0) targets = Array.from(doc.querySelectorAll<HTMLElement>('main h2[id]'));
  if (targets.length === 0) return;
  // Distance of each section top from the place a jump would put it (negative: already above).
  // Hidden sections (display: none in a reading mode) are skipped and the rest are taken in
  // visual order, which differs from DOM order when CSS reorders sections.
  const items = targets
    .map((t) => {
      const r = t.getBoundingClientRect();
      return { t, top: r.top - scrollOffsetFor(t, doc), visible: r.height > 0 };
    })
    .filter((i) => i.visible)
    .sort((a, b) => a.top - b.top);
  const target = dir === 1 ? items.find((i) => i.top > 4)?.t : [...items].reverse().find((i) => i.top < -4)?.t;
  if (!target) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  settleOn(target, doc);
}

let settleToken = 0;

/**
 * Lazy diagrams above the target can change its height after the jump, which leaves the
 * target far from the offset. After the scroll ends, re-align while the target keeps moving
 * in document coordinates. A viewport the user moved is left alone: only a layout shift
 * counts, and any wheel, touch or key input cancels the loop.
 */
function settleOn(target: HTMLElement, doc: Document): void {
  const token = ++settleToken;
  let tries = 0;
  let docY = target.getBoundingClientRect().top + window.scrollY;
  // One controller removes all three input listeners as soon as the loop ends or any of them fires.
  const inputs = new AbortController();
  const cancel = () => {
    if (token === settleToken) settleToken += 1;
    inputs.abort();
  };
  for (const type of ['wheel', 'touchstart', 'keydown']) doc.addEventListener(type, cancel, { passive: true, signal: inputs.signal });
  // Checks at fixed delays: a smooth scroll may still be running at the first one, and a lazy
  // diagram revealed near the target (800 px root margin) can shift it after the second.
  const DELAYS_MS = [450, 900, 1400];
  const check = () => {
    tries += 1;
    if (token !== settleToken || !target.isConnected) return inputs.abort();
    const y = target.getBoundingClientRect().top + window.scrollY;
    if (y !== docY) {
      docY = y;
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    }
    if (tries >= DELAYS_MS.length) inputs.abort();
  };
  for (const d of DELAYS_MS) window.setTimeout(check, d);
}
