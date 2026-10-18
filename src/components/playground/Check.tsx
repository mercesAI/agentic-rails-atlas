import type { ReactNode } from 'react';
import { cx } from './cx';
import './kit.css';

export interface CheckProps {
  label: ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Check({ label, checked, onChange, disabled, className }: CheckProps) {
  return (
    <label className={cx('pg-check', className)}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
