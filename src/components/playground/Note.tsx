import type { ReactNode } from 'react';
import { cx } from './cx';
import './kit.css';

export type NoteKind = 'simplification' | 'quirk' | 'example';

const TAGS: Record<NoteKind, string> = {
  simplification: 'Teaching simplification',
  quirk: 'Spec quirk',
  example: 'Example',
};

export interface NoteProps {
  kind: NoteKind;
  children: ReactNode;
  /** Replace the tag text, or pass false for no tag. */
  tag?: string | false;
  className?: string;
}

/** A tagged aside: a teaching simplification, a spec quirk or an example label. */
export function Note({ kind, children, tag, className }: NoteProps) {
  const text = tag === undefined ? TAGS[kind] : tag;
  return (
    <p className={cx('pg-note', `pg-note--${kind}`, className)}>
      {text ? (
        <>
          <strong className="pg-note__tag">{text}:</strong>{' '}
        </>
      ) : null}
      {children}
    </p>
  );
}
