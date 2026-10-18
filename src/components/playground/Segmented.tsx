import { useId, useRef, type KeyboardEvent } from 'react';
import { nextRadioValue } from '@/lib/client/roving-radio';
import { cx } from './cx';
import './kit.css';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: readonly SegmentedOption<T>[];
  onChange: (value: T) => void;
  /** Show the label as text above the group instead of an aria-label only. */
  showLabel?: boolean;
  className?: string;
}

/** Radiogroup with roving focus: arrows, Home and End move the selection and the focus together. */
export function Segmented<T extends string>({ label, value, options, onChange, showLabel = false, className }: SegmentedProps<T>) {
  const labelId = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const next = nextRadioValue(
      options.map((o) => o.value),
      value,
      e.key,
    );
    if (next === null) return;
    e.preventDefault();
    onChange(next);
    refs.current[options.findIndex((o) => o.value === next)]?.focus();
  };
  const group = (
    <div className={cx('segmented', className)} role="radiogroup" aria-label={showLabel ? undefined : label} aria-labelledby={showLabel ? labelId : undefined}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          tabIndex={value === o.value ? 0 : -1}
          className="segmented__btn"
          onClick={() => onChange(o.value)}
          onKeyDown={onKey}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
  if (!showLabel) return group;
  return (
    <div className="pg-group">
      <span className="pg-group__label" id={labelId}>
        {label}
      </span>
      {group}
    </div>
  );
}
