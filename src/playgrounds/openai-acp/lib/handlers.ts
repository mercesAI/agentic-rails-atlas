// Discovery (/.well-known/acp.json) and payment handler selection. Both exist only in 2026-04-17:
// the 2025-09-29 schema has no DiscoveryResponse and no capabilities.payment.handlers.

import { clone } from '@/lib/playground/util';
import { DISCOVERY, HANDLERS, type DiscoveryDoc, type PaymentHandler } from './fixtures';
import type { SpecVersion } from './types';

export const DISCOVERY_PATH = '/.well-known/acp.json';

/** The discovery document, or null where the spec version defines none. */
export function discoveryFor(version: SpecVersion): DiscoveryDoc | null {
  return version === '2026-04-17' ? clone(DISCOVERY) : null;
}

/** Required keys of DiscoveryResponse and its nested objects (schema.agentic_checkout.json, 2026-04-17). */
export function validateDiscovery(doc: unknown): string[] {
  const problems: string[] = [];
  const d = doc as Record<string, unknown> | null;
  if (!d || typeof d !== 'object') return ['Document must be a JSON object.'];
  for (const k of ['protocol', 'api_base_url', 'transports', 'capabilities']) if (d[k] === undefined) problems.push(`Missing required key ${k}.`);
  const p = d.protocol as Record<string, unknown> | undefined;
  if (p) for (const k of ['name', 'version', 'supported_versions']) if (p[k] === undefined) problems.push(`Missing required key protocol.${k}.`);
  const c = d.capabilities as Record<string, unknown> | undefined;
  if (c && c.services === undefined) problems.push('Missing required key capabilities.services.');
  return problems;
}

export interface HandlerSelection {
  /** Handlers the seller lists in its session response, sorted by display_order. */
  offered: PaymentHandler[];
  /** Seller handlers the agent also declared (matched by name). */
  usable: PaymentHandler[];
  /** Seller handlers the agent did not declare. */
  skipped: { handler: PaymentHandler; reason: string }[];
}

/**
 * Teaching simplification: the spec says handlers are negotiated inline through capabilities.payment.handlers
 * but states no matching algorithm. This match compares the reverse-DNS `name` only.
 */
export function selectHandlers(agentNames: readonly string[], sellerHandlers: readonly PaymentHandler[] = HANDLERS): HandlerSelection {
  const offered = [...sellerHandlers].sort((a, b) => (a.display_order ?? 99) - (b.display_order ?? 99));
  const usable: PaymentHandler[] = [];
  const skipped: { handler: PaymentHandler; reason: string }[] = [];
  for (const h of offered) {
    if (agentNames.includes(h.name)) usable.push(h);
    else skipped.push({ handler: h, reason: 'The agent did not declare this handler name.' });
  }
  return { offered, usable, skipped };
}

export type HandlerCheck =
  | { ok: true; handler: PaymentHandler; needsDelegateToken: boolean }
  | { ok: false; code: 'invalid'; param: string; message: string };

/** Check payment_data.handler_id against the handlers listed on the session. */
export function checkHandlerChoice(sessionHandlers: readonly PaymentHandler[], handlerId: unknown): HandlerCheck {
  const h = sessionHandlers.find((x) => x.id === handlerId);
  if (!h) {
    return {
      ok: false,
      code: 'invalid',
      param: '$.payment_data.handler_id',
      message: 'handler_id is not one of the handlers on the session.',
    };
  }
  return { ok: true, handler: h, needsDelegateToken: h.requires_delegate_payment };
}
