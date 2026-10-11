import { useEffect, useState } from 'react';
import { getJSON, keysWithPrefix } from '../../lib/storage';

interface Props {
  /** Protocol slugs to count; empty means every stored atlas:read:* key. */
  slugs?: string[];
  /** Sections per protocol (20 for A to T). */
  sectionsPer?: number;
  size?: number;
  label?: string;
}

function countRead(slugs: string[]): number {
  const keys = slugs.length ? slugs.map((s) => `atlas:read:${s}`) : keysWithPrefix('atlas:read:');
  return keys.reduce((n, k) => {
    const v = getJSON<unknown>(k, []);
    return n + (Array.isArray(v) ? new Set(v.filter((x) => typeof x === 'string')).size : 0);
  }, 0);
}

/** Sections read over sections total, from atlas:read:<slug> arrays. */
export default function ProgressRing({ slugs = [], sectionsPer = 20, size = 56, label = 'Sections read' }: Props) {
  const [read, setRead] = useState(0);
  const total = Math.max(slugs.length * sectionsPer, 0);
  const slugKey = slugs.join(',');

  useEffect(() => {
    const list = slugKey ? slugKey.split(',') : [];
    const update = () => setRead(countRead(list));
    update();
    window.addEventListener('storage', update);
    document.addEventListener('atlas:read', update);
    return () => {
      window.removeEventListener('storage', update);
      document.removeEventListener('atlas:read', update);
    };
  }, [slugKey]);

  const ratio = total > 0 ? Math.min(read / total, 1) : 0;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const text = total > 0 ? `${read} of ${total}` : `${read}`;

  return (
    <figure className="progress-ring" aria-label={`${label}: ${text}`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" focusable="false">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${c * ratio} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <figcaption>
        <span className="progress-ring__value">{text}</span>
        <span className="progress-ring__label">{label}</span>
      </figcaption>
    </figure>
  );
}
