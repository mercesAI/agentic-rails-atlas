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
  let pendingG = 0;
  return (e: KeyLike): ShortcutAction | null => {
    if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === 'k') return { type: 'search' };
    if (e.metaKey || e.ctrlKey || e.altKey) return null;
    if (isTypingTarget(e.target)) return null;
    if (pendingG && now() - pendingG < SEQUENCE_TIMEOUT_MS) {
      pendingG = 0;
      const href = GO_TARGETS[e.key.toLowerCase()];
      return href ? { type: 'go', href } : null;
    }
    pendingG = 0;
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

/** Scrolls to the next or previous section (`[data-section]`, falling back to `h2[id]`). */
export function jumpSection(dir: 1 | -1, doc: Document = document): void {
  let targets = Array.from(doc.querySelectorAll<HTMLElement>('[data-section]'));
  if (targets.length === 0) targets = Array.from(doc.querySelectorAll<HTMLElement>('main h2[id]'));
  if (targets.length === 0) return;
  const offset = 96;
  const tops = targets.map((t) => t.getBoundingClientRect().top - offset);
  let index: number;
  if (dir === 1) {
    index = tops.findIndex((top) => top > 4);
  } else {
    index = -1;
    tops.forEach((top, i) => {
      if (top < -4) index = i;
    });
  }
  const target = index >= 0 ? targets[index] : undefined;
  if (!target) return;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}
