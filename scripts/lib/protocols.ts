/**
 * Protocol display names used by scripts when an index.mdx frontmatter is not
 * available yet. The frontmatter `name` wins when it exists.
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { PROTOCOL_SLUGS, type ProtocolSlug } from '../../src/lib/schemas.ts';

export const FALLBACK_PROTOCOL_NAMES: Record<ProtocolSlug, string> = {
  'erc-8004': 'ERC-8004',
  x402: 'x402',
  'visa-tap': 'Visa Trusted Agent Protocol',
  'openai-acp': 'Agentic Commerce Protocol',
  ucp: 'Universal Commerce Protocol',
  'stripe-mpp': 'Machine Payments Protocol',
  ap2: 'Agent Payments Protocol',
  'mastercard-agent-pay': 'Mastercard Agent Pay',
};

export function isProtocolSlug(value: string): value is ProtocolSlug {
  return (PROTOCOL_SLUGS as readonly string[]).includes(value);
}

/** Reads `name:` from the frontmatter of protocols/<slug>/index.mdx without a YAML parser. */
export function protocolName(contentDir: string, slug: string): string {
  const path = join(contentDir, 'protocols', slug, 'index.mdx');
  if (existsSync(path)) {
    const text = readFileSync(path, 'utf8');
    const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text)?.[1] ?? '';
    const m = /^name:\s*(.+)$/m.exec(fm);
    if (m?.[1]) return m[1].trim().replace(/^['"]|['"]$/g, '');
  }
  return isProtocolSlug(slug) ? FALLBACK_PROTOCOL_NAMES[slug] : slug;
}
