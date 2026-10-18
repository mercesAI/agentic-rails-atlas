import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { nextRadioValue } from '@/lib/client/roving-radio';
import { cx } from './cx';
import './kit.css';

export interface TabItem<T extends string> {
  id: T;
  label: string;
}

export interface TabListProps<T extends string> {
  /** Accessible name of the tablist. */
  label: string;
  /** Prefix of the tab and panel element ids, for example "ucp" gives ucp-tab-x and ucp-panel-x. */
  idPrefix: string;
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

export const tabId = (idPrefix: string, id: string): string => `${idPrefix}-tab-${id}`;
export const panelId = (idPrefix: string, id: string): string => `${idPrefix}-panel-${id}`;

/** The tab strip alone: arrows, Home and End move the selection and the focus together. Panels are the caller's. */
export function TabList<T extends string>({ label, idPrefix, tabs, value, onChange, className }: TabListProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const next = nextRadioValue(
      tabs.map((t) => t.id),
      value,
      e.key,
    );
    if (next === null) return;
    e.preventDefault();
    onChange(next);
    refs.current[tabs.findIndex((t) => t.id === next)]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className={cx('pg-tabs', className)}>
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[i] = el;
          }}
          id={tabId(idPrefix, t.id)}
          type="button"
          role="tab"
          className="pg-tab"
          aria-selected={value === t.id}
          aria-controls={panelId(idPrefix, t.id)}
          tabIndex={value === t.id ? 0 : -1}
          onKeyDown={onKey}
          onClick={() => onChange(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

export interface TabPanelItem<T extends string> extends TabItem<T> {
  content: ReactNode;
}

export interface TabsProps<T extends string> extends Omit<TabListProps<T>, 'tabs'> {
  tabs: readonly TabPanelItem<T>[];
  panelClassName?: string;
}

/** Tab strip plus panels. Every panel stays mounted (its state survives a switch); the inactive ones are hidden. */
export function Tabs<T extends string>({ tabs, panelClassName, ...list }: TabsProps<T>) {
  return (
    <>
      <TabList {...list} tabs={tabs} />
      {tabs.map((t) => (
        <section
          key={t.id}
          id={panelId(list.idPrefix, t.id)}
          role="tabpanel"
          aria-labelledby={tabId(list.idPrefix, t.id)}
          className={cx('pg-panel', panelClassName)}
          hidden={list.value !== t.id}
        >
          {t.content}
        </section>
      ))}
    </>
  );
}
