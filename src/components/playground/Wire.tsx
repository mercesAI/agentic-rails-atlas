import { useId, useState, type ReactNode } from 'react';
import { pretty } from '@/lib/playground/util';
import { cx } from './cx';
import './kit.css';

export interface WireProps {
  title: ReactNode;
  /** The wire form: headers, a token, an HTTP message. */
  text: string;
  /** Decoded view behind the toggle: a string is shown as is, anything else is pretty-printed JSON. */
  decoded?: unknown;
  /** A line between the title and the text, for example an example label. */
  note?: ReactNode;
  decodeLabel?: string;
  encodedLabel?: string;
  /** Show the decoded view in a second block under the wire form instead of replacing it. */
  stacked?: boolean;
  /** Render the title as a heading, a plain paragraph or a small muted caption. */
  titleAs?: 'h4' | 'p' | 'caption';
  /** Accessible name of the text block; defaults to the title when it is a string. */
  label?: string;
  className?: string;
  /** "soft" wraps long tokens (base64 blobs); "none" keeps the text on one line per source line and scrolls sideways (JSON, HTTP). */
  wrap?: 'soft' | 'none';
}

/** A wire-format artifact with an optional decode toggle. The scrollable block is keyboard focusable. */
export function Wire({ title, text, decoded, note, decodeLabel = 'Decode', encodedLabel = 'Show encoded', stacked = false, titleAs = 'h4', label, className, wrap = 'soft' }: WireProps) {
  const [showDecoded, setShowDecoded] = useState(false);
  const id = useId();
  const name = label ?? (typeof title === 'string' ? title : 'Wire format');
  const hasDecoded = decoded !== undefined;
  const decodedText = typeof decoded === 'string' ? decoded : pretty(decoded);
  const Title = titleAs === 'h4' ? 'h4' : 'p';
  const titleClass = titleAs === 'h4' ? 'pg-wire__title' : titleAs === 'caption' ? 'pg-wire__caption' : 'pg-wire__text';
  const toggle = hasDecoded ? (
    <button
      type="button"
      className="btn btn--ghost pg-wire__toggle"
      aria-pressed={stacked ? undefined : showDecoded}
      aria-expanded={stacked ? showDecoded : undefined}
      aria-controls={stacked ? `${id}-decoded` : undefined}
      onClick={() => setShowDecoded((v) => !v)}
    >
      {showDecoded ? encodedLabel : decodeLabel}
    </button>
  ) : null;
  return (
    <div className={cx('pg-wire', className)}>
      <div className="pg-wire__head">
        <Title className={titleClass}>{title}</Title>
        {!stacked && toggle}
      </div>
      {note}
      {/* Scrollable code must be keyboard focusable (axe scrollable-region-focusable). */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <pre className={`pg-pre${wrap === 'none' ? ' pg-pre--nowrap' : ''}`} tabIndex={0} aria-label={hasDecoded && !stacked ? `${name}, ${showDecoded ? 'decoded' : 'encoded'}` : name}>
        {!stacked && showDecoded ? decodedText : text}
      </pre>
      {stacked && toggle}
      {stacked && showDecoded && (
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        <pre id={`${id}-decoded`} className="pg-pre" tabIndex={0} aria-label={`${name}, decoded`}>
          {decodedText}
        </pre>
      )}
    </div>
  );
}
