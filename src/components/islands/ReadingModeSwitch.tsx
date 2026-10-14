import { useEffect, useState, type KeyboardEvent } from 'react';
import type { ReadingMode } from '../../lib/schemas';
import { READING_MODES, READING_MODE_LABELS, readReadingMode, saveReadingMode, syncFromStorageEvent } from '../../lib/reading-mode';

const HINTS: Record<ReadingMode, string> = {
  eli5: 'Plain explanation for newcomers',
  practitioner: 'Full practitioner text',
  spec: 'Practitioner text plus field tables and wire formats',
  ste: 'Simplified Technical English version',
};

interface Props {
  /** Shorter visual labels for tight spaces; accessible names stay full. */
  compact?: boolean;
}

/** Four segmented buttons. Sets data-reading-mode on <html> and stores atlas:reading-mode. */
export default function ReadingModeSwitch({ compact = false }: Props) {
  const [mode, setMode] = useState<ReadingMode>('practitioner');

  useEffect(() => {
    setMode(readReadingMode());
    // Every instance listens, so the nav and header switches always show the same radio.
    const onChange = (e: Event) => setMode((e as CustomEvent<ReadingMode>).detail);
    const onStorage = (e: StorageEvent) => {
      const m = syncFromStorageEvent(e);
      if (m) setMode(m);
    };
    // After a View Transitions swap the new <html> is bootstrapped from storage; re-read it for this island.
    const onSwap = () => setMode(readReadingMode());
    // Anything else that changes the attribute (devtools, scripts) is mirrored too.
    const mo = new MutationObserver(() => {
      const v = document.documentElement.dataset.readingMode;
      if (v && (READING_MODES as readonly string[]).includes(v)) setMode(v as ReadingMode);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-reading-mode'] });
    document.addEventListener('atlas:reading-mode', onChange);
    document.addEventListener('astro:after-swap', onSwap);
    window.addEventListener('storage', onStorage);
    return () => {
      mo.disconnect();
      document.removeEventListener('atlas:reading-mode', onChange);
      document.removeEventListener('astro:after-swap', onSwap);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const choose = (next: ReadingMode) => {
    saveReadingMode(next);
    setMode(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = READING_MODES.indexOf(mode);
    const n = READING_MODES.length;
    const next = READING_MODES[(i + (e.key === 'ArrowRight' ? 1 : n - 1)) % n] ?? 'practitioner';
    choose(next);
    e.currentTarget.querySelector<HTMLButtonElement>(`[data-value="${next}"]`)?.focus();
  };

  return (
    // Roving tabindex: the radios inside are the focus targets; arrow keys move the selection.
    // eslint-disable-next-line jsx-a11y/interactive-supports-focus
    <div className="segmented" role="radiogroup" aria-label="Reading mode" onKeyDown={onKeyDown}>
      {READING_MODES.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          tabIndex={mode === m ? 0 : -1}
          data-value={m}
          title={HINTS[m]}
          className="segmented__btn"
          onClick={() => choose(m)}
        >
          {compact && m === 'practitioner' ? (
            <>
              <span aria-hidden="true">Pro</span>
              <span className="sr-only">Practitioner</span>
            </>
          ) : (
            READING_MODE_LABELS[m]
          )}
        </button>
      ))}
    </div>
  );
}
