import { useEffect, useRef, useState, type ReactNode } from 'react';
import { clampNumber, numberToText, parseNumberText } from '@/lib/playground/number-input';
import { cx } from './cx';
import './kit.css';

export interface NumberFieldProps {
  label: ReactNode;
  value: number | null | undefined;
  /** Called with the parsed number on every edit, or null while the field is empty. */
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number | 'any';
  disabled?: boolean;
  /** Put the label text after the input. */
  labelAfter?: boolean;
  className?: string;
}

/**
 * A controlled number input that keeps the typed text in local state, so clearing "60" to type "3" gives
 * "3" and not "603" even when the parent substitutes a default for null. min and max are clamped on blur.
 */
export function NumberField({ label, value, onChange, min, max, step = 1, disabled, labelAfter = false, className }: NumberFieldProps) {
  const [raw, setRaw] = useState(() => numberToText(value));
  const focused = useRef(false);
  useEffect(() => {
    if (!focused.current) setRaw(numberToText(value));
  }, [value]);
  const input = (
    <input
      type="number"
      step={step}
      min={min}
      max={max}
      disabled={disabled}
      value={raw}
      onFocus={() => {
        focused.current = true;
      }}
      onChange={(e) => {
        setRaw(e.target.value);
        onChange(parseNumberText(e.target.value));
      }}
      onBlur={() => {
        focused.current = false;
        const n = parseNumberText(raw);
        if (n === null) {
          setRaw(numberToText(value));
          return;
        }
        const clamped = clampNumber(n, min, max);
        if (clamped !== n) onChange(clamped);
        setRaw(numberToText(clamped));
      }}
    />
  );
  const text = <span className="pg-field__label">{label}</span>;
  return (
    <label className={cx('pg-field', className)}>
      {labelAfter ? input : text}
      {labelAfter ? text : input}
    </label>
  );
}
