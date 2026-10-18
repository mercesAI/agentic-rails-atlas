import type { Confidence } from '../../lib/schemas';
import { CONFIDENCE_LABELS } from '../../lib/labels';

/** Claim confidence as a mark whose fill changes (full, half, dashed hollow) plus the word; never color alone. React twin of ConfidenceBadge.astro, same CSS (site.css). */
export function ConfBadge({ confidence }: { confidence: Confidence }) {
  return (
    <span className="conf-badge" data-confidence={confidence}>
      <span className="conf-badge__mark" aria-hidden="true" />
      {CONFIDENCE_LABELS[confidence]}
    </span>
  );
}
