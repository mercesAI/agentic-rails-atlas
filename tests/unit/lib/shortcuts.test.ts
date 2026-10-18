import { afterEach, describe, expect, it, vi } from 'vitest';
import { createShortcutMatcher, isTypingTarget, jumpSection } from '../../../src/lib/shortcuts';

const key = (k: string, target: EventTarget | null = null) => ({ key: k, metaKey: false, ctrlKey: false, altKey: false, target });

describe('createShortcutMatcher', () => {
  it('maps single keys and the g sequences', () => {
    let now = 0;
    const match = createShortcutMatcher(() => now);
    expect(match(key('/'))).toEqual({ type: 'search' });
    expect(match(key('j'))).toEqual({ type: 'section', dir: 1 });
    expect(match(key('k'))).toEqual({ type: 'section', dir: -1 });
    expect(match(key('g'))).toBeNull();
    now = 100;
    expect(match(key('c'))).toEqual({ type: 'go', href: '/compare/' });
    expect(match(key('g'))).toBeNull();
    now = 2000;
    expect(match(key('h'))).toBeNull(); // the sequence timed out
  });
  it('ignores keys typed into fields and modifier chords except Ctrl or Cmd K', () => {
    const match = createShortcutMatcher();
    expect(match(key('j', { tagName: 'INPUT' } as unknown as EventTarget))).toBeNull();
    expect(match({ key: 'k', metaKey: true, ctrlKey: false, altKey: false, target: null })).toEqual({ type: 'search' });
    expect(match({ key: 'j', metaKey: false, ctrlKey: false, altKey: true, target: null })).toBeNull();
  });
});

describe('isTypingTarget', () => {
  it('recognizes inputs, textareas, selects and contenteditable elements', () => {
    expect(isTypingTarget({ tagName: 'TEXTAREA' } as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget({ tagName: 'DIV', isContentEditable: true } as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget({ tagName: 'BUTTON', isContentEditable: false } as unknown as EventTarget)).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
  });
});

/** A section stub with a fixed viewport-relative top; hidden ones have no height (display: none). */
function section(id: string, top: number, height = 400) {
  return {
    id,
    scrolledTo: 0,
    getBoundingClientRect: () => ({ top, height }),
    scrollIntoView() {
      this.scrolledTo += 1;
    },
  };
}

describe('jumpSection', () => {
  const fakeWindow = { matchMedia: () => ({ matches: true }), scrollY: 0, setTimeout: () => 0 };
  const makeDoc = (sections: ReturnType<typeof section>[]) =>
    ({
      querySelectorAll: () => sections,
      addEventListener: () => undefined,
      documentElement: {},
      defaultView: { getComputedStyle: () => ({ scrollPaddingTop: '0px', scrollMarginTop: '0px' }) },
    }) as unknown as Document;

  afterEach(() => vi.unstubAllGlobals());

  it('moves through sections in visual order and skips hidden ones', () => {
    vi.stubGlobal('window', fakeWindow);
    // DOM order a, b, c, d; CSS reorders d above c and hides b (as STE mode does on protocol pages).
    const a = section('a', -800);
    const b = section('b', 0, 0);
    const c = section('c', 900);
    const d = section('d', 100);
    jumpSection(1, makeDoc([a, b, c, d]));
    expect(d.scrolledTo).toBe(1);
    expect(c.scrolledTo).toBe(0);
    expect(b.scrolledTo).toBe(0);
    jumpSection(-1, makeDoc([a, b, c, d]));
    expect(a.scrolledTo).toBe(1);
  });

  it('does nothing when there is no section in the requested direction', () => {
    vi.stubGlobal('window', fakeWindow);
    const only = section('only', 0);
    jumpSection(-1, makeDoc([only]));
    jumpSection(1, makeDoc([only]));
    expect(only.scrolledTo).toBe(0);
  });
});
