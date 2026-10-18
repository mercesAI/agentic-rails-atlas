import { useEffect, useState, type KeyboardEvent } from 'react';
import type { ReadingMode } from '../../lib/schemas';
import { READING_MODES, READING_MODE_LABELS, readReadingMode, saveReadingMode, syncFromStorageEvent } from '../../lib/reading-mode';
import { nextRadioValue } from '../../lib/client/roving-radio';

const HINTS: Record<ReadingMode, string> = {
  eli5: 'Plain explanation for newcomers',
  practitioner: 'Full practitioner text',
  spec: 'Practitioner text plus field tables and wire formats',
  ste: 'Simplified Technical English version',
};

/**
 * Four segmented radios. Sets data-reading-mode on <html> and stores atlas:reading-mode.
 * Islands are unmounted on every ClientRouter swap, so the mount effect reads the stored
 * mode once; the custom event and the storage event keep several instances in step.
 */
export default function ReadingModeSwitch() {
  const [mode, setMode] = useState<ReadingMode>('practitioner');

  useEffect(() => {
    setMode(readReadingMode());
    const onChange = (e: Event) => setMode((e as CustomEvent<ReadingMode>).detail);
    const onStorage = (e: StorageEvent) => {
      const m = syncFromStorageEvent(e);
      if (m) setMode(m);
    };
    document.addEventListener('atlas:reading-mode', onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      document.removeEventListener('atlas:reading-mode', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const choose = (next: ReadingMode) => {
    saveReadingMode(next);
    setMode(next);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const next = nextRadioValue(READING_MODES, mode, e.key);
    if (!next) return;
    e.preventDefault();
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
          {READING_MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
