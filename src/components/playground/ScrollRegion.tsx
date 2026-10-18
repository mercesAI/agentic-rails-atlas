import type { ReactNode } from 'react';

/**
 * Sideways-scrolling wrapper for a table wider than a phone column. Focusable and named, like
 * the site's .table-wrap, so keyboard users can scroll to the hidden columns and screen readers
 * announce what the region holds.
 */
export function ScrollRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className="pg-scroll" role="region" tabIndex={0} aria-label={label}>
      {children}
    </div>
  );
}
