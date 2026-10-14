/**
 * Protocol descriptors shared by the cross-cutting islands. Islands receive
 * plain serializable objects (never Astro content entries).
 */
import type { Family, Layer, ProtocolSlug } from '../../../lib/schemas';
import { C_PROTOCOL_SLUGS as PROTOCOL_SLUGS } from './constants';

export interface ProtocolInfo {
  slug: ProtocolSlug;
  name: string;
  short: string;
  monogram: string;
  family: Family | null;
  layerPrimary: Layer | null;
  layersSecondary: Layer[];
  lastVerified: string | null;
  /** True when the protocol page exists in the content collection. */
  hasPage: boolean;
}

/** Display names used when a protocol page is not merged yet. */
export const FALLBACK_NAMES: Record<ProtocolSlug, { name: string; short: string; monogram: string }> = {
  'erc-8004': { name: 'ERC-8004: Trustless Agents', short: 'ERC-8004', monogram: '8004' },
  x402: { name: 'x402', short: 'x402', monogram: 'x402' },
  'visa-tap': { name: 'Visa Trusted Agent Protocol', short: 'Visa TAP', monogram: 'TAP' },
  'openai-acp': { name: 'OpenAI ACP: Agentic Commerce Protocol', short: 'OpenAI ACP', monogram: 'ACP' },
  ucp: { name: 'UCP: Universal Commerce Protocol', short: 'UCP', monogram: 'UCP' },
  'stripe-mpp': { name: 'Stripe MPP: Machine Payments Protocol', short: 'Stripe MPP', monogram: 'MPP' },
  ap2: { name: 'AP2: Agent Payments Protocol', short: 'AP2', monogram: 'AP2' },
  'mastercard-agent-pay': { name: 'Mastercard Agent Pay', short: 'Mastercard Agent Pay', monogram: 'MAP' },
};

export interface ProtocolMetaLike {
  slug: ProtocolSlug;
  name: string;
  bubbleLabel?: string;
  monogram: string;
  family: Family;
  layerPrimary: Layer;
  layersSecondary: Layer[];
  lastVerified: string;
  order?: number;
}

/** All eight protocols in canonical order, filled from metadata where it exists. */
export function buildProtocolInfos(metas: ProtocolMetaLike[]): ProtocolInfo[] {
  const bySlug = new Map(metas.map((m) => [m.slug, m]));
  return PROTOCOL_SLUGS.map((slug) => {
    const m = bySlug.get(slug);
    const fb = FALLBACK_NAMES[slug];
    return {
      slug,
      name: m?.name ?? fb.name,
      short: fb.short,
      monogram: m?.monogram ?? fb.monogram,
      family: m?.family ?? null,
      layerPrimary: m?.layerPrimary ?? null,
      layersSecondary: m?.layersSecondary ?? [],
      lastVerified: m?.lastVerified ?? null,
      hasPage: Boolean(m),
    };
  });
}

/** Number lookup for citation markers: source id to footer number (1-based). */
export type SourceNumbers = Record<string, number>;

export function citeLabel(sources: string[], numbers: SourceNumbers): string {
  const ns = [...new Set(sources.map((s) => numbers[s]).filter((n): n is number => typeof n === 'number'))].sort(
    (a, b) => a - b,
  );
  return ns.length ? `[${ns.join(', ')}]` : '[?]';
}
