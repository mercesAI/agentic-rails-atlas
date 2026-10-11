/** Small shared pieces for the cross-cutting islands. */
import type { Confidence } from '../../lib/schemas';
import { citeLabel, type ProtocolInfo, type SourceNumbers } from './lib/protocols';
import { SUPPORT_TEXT, type Support } from './lib/controls';

/** Citation marker the global CitationDrawer opens on click (it listens for [data-cite]). */
export function CiteMarker({ sources, numbers }: { sources: string[]; numbers: SourceNumbers }) {
  if (sources.length === 0) return null;
  const label = citeLabel(sources, numbers);
  const first = sources.map((s) => numbers[s]).find((n) => typeof n === 'number');
  return (
    <sup className="cite">
      <a href={first ? `#src-${first}` : '#sources'} data-cite={sources.join(' ')} data-missing={first ? undefined : sources.join(' ')}>
        <span className="sr-only">Sources </span>
        {label}
      </a>
    </sup>
  );
}

const CONF_LABELS: Record<Confidence, string> = { verified: 'Verified', reported: 'Reported', unverified: 'Unverified' };

/** Confidence: a mark whose fill changes (full, half, dashed hollow) plus the word. */
export function ConfBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span className="cc-conf" data-confidence={confidence}>
      <span className="cc-conf__mark" aria-hidden="true" />
      {CONF_LABELS[confidence]}
    </span>
  );
}

/** Control support level: text plus a distinct mark shape. */
export function SupportMark({ support }: { support: Support }) {
  return (
    <span className="cc-support" data-support={support}>
      <span className="cc-support__mark" aria-hidden="true" />
      {SUPPORT_TEXT[support]}
    </span>
  );
}

export function InProgressTag({ label = 'In progress' }: { label?: string }) {
  return <span className="cc-progress">{label}</span>;
}

export function ProtocolLabel({ p, link = true }: { p: ProtocolInfo; link?: boolean }) {
  const mono = (
    <span className="cc-mono" data-family={p.family ?? undefined} aria-hidden="true">
      {p.monogram}
    </span>
  );
  return (
    <span className="cc-plabel">
      {mono}
      {link && p.hasPage ? <a href={`/p/${p.slug}/`}>{p.short}</a> : <span>{p.short}</span>}
    </span>
  );
}
