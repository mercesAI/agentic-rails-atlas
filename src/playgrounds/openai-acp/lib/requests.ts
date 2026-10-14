// Client-side request builders: headers and bodies as the schemas define them for each spec version.

import { API_KEY_FIXTURE, USER_AGENT_FIXTURE } from './fixtures';
import type { Address } from './fixtures';
import type { SpecVersion } from './types';

export interface Req {
  method: 'GET' | 'POST';
  path: string;
  headers: Record<string, string>;
  body?: unknown;
}

export type Op = 'create' | 'update' | 'get' | 'complete' | 'cancel' | 'delegate';

export const DELEGATE_PATH = '/agentic_commerce/delegate_payment';

/** Header names come from the OpenAPI parameter lists (Authorization, Content-Type, User-Agent, Idempotency-Key, Request-Id, API-Version). */
export function headersFor(version: SpecVersion, opts: { method: 'GET' | 'POST'; key?: string; requestId?: string }): Record<string, string> {
  const h: Record<string, string> = { Authorization: `Bearer ${API_KEY_FIXTURE}` };
  if (opts.method === 'POST') h['Content-Type'] = 'application/json';
  h['User-Agent'] = USER_AGENT_FIXTURE;
  h['API-Version'] = version;
  if (opts.key) h['Idempotency-Key'] = opts.key;
  if (opts.requestId) h['Request-Id'] = opts.requestId;
  return h;
}

export interface CartLine {
  id: string;
  quantity: number;
}

export function createBody(version: SpecVersion, items: CartLine[], extra?: { buyer?: Record<string, string>; address?: Address }): Record<string, unknown> {
  if (version === '2025-09-29') {
    const b: Record<string, unknown> = { items: items.map((i) => ({ id: i.id, quantity: i.quantity })) };
    if (extra?.buyer) b.buyer = extra.buyer;
    if (extra?.address) b.fulfillment_address = extra.address;
    return b;
  }
  // 2026-04-17: line_items holds Item objects, which have no quantity property in the schema.
  const b: Record<string, unknown> = {
    currency: 'usd',
    line_items: items.map((i) => ({ id: i.id })),
    capabilities: { interventions: { supported: ['3ds'] } },
  };
  if (extra?.buyer) b.buyer = extra.buyer;
  if (extra?.address) b.fulfillment_details = { name: extra.address.name, address: extra.address };
  return b;
}

export interface UpdatePatch {
  items?: CartLine[];
  buyer?: Record<string, string>;
  address?: Address;
  optionId?: string;
}

export function updateBody(version: SpecVersion, p: UpdatePatch): Record<string, unknown> {
  const b: Record<string, unknown> = {};
  if (p.buyer) b.buyer = p.buyer;
  if (version === '2025-09-29') {
    if (p.items) b.items = p.items.map((i) => ({ id: i.id, quantity: i.quantity }));
    if (p.address) b.fulfillment_address = p.address;
    if (p.optionId) b.fulfillment_option_id = p.optionId;
    return b;
  }
  if (p.items) b.line_items = p.items.map((i) => ({ id: i.id }));
  if (p.address) b.fulfillment_details = { name: p.address.name, address: p.address };
  if (p.optionId) b.selected_fulfillment_options = [{ type: 'shipping', option_id: p.optionId, item_ids: ['li_1'] }];
  return b;
}

export function completeBody(
  version: SpecVersion,
  opts: { token: string; handlerId?: string; authOutcome?: string },
): Record<string, unknown> {
  if (version === '2025-09-29') return { payment_data: { token: opts.token, provider: 'stripe' } };
  const b: Record<string, unknown> = {
    payment_data: {
      handler_id: opts.handlerId ?? 'card_tokenized',
      instrument: { type: 'card', credential: { type: 'spt', token: opts.token } },
    },
  };
  if (opts.authOutcome) b.authentication_result = { outcome: opts.authOutcome };
  return b;
}

/** CancelSessionRequest exists in 2026-04-17 only; its only property is intent_trace. */
export function cancelBody(version: SpecVersion, reasonCode?: string): Record<string, unknown> | undefined {
  if (version === '2025-09-29' || !reasonCode) return undefined;
  return { intent_trace: { reason_code: reasonCode } };
}

export function buildRequest(
  version: SpecVersion,
  op: Op,
  o: { sessionId?: string; key?: string; requestId?: string; body?: unknown },
): Req {
  const base = '/checkout_sessions';
  const id = o.sessionId ?? 'cs_missing';
  switch (op) {
    case 'create':
      return { method: 'POST', path: base, headers: headersFor(version, { method: 'POST', key: o.key, requestId: o.requestId }), body: o.body };
    case 'update':
      return { method: 'POST', path: `${base}/${id}`, headers: headersFor(version, { method: 'POST', key: o.key, requestId: o.requestId }), body: o.body };
    case 'get':
      return { method: 'GET', path: `${base}/${id}`, headers: headersFor(version, { method: 'GET', requestId: o.requestId }) };
    case 'complete':
      return { method: 'POST', path: `${base}/${id}/complete`, headers: headersFor(version, { method: 'POST', key: o.key, requestId: o.requestId }), body: o.body };
    case 'cancel':
      return { method: 'POST', path: `${base}/${id}/cancel`, headers: headersFor(version, { method: 'POST', key: o.key, requestId: o.requestId }), body: o.body };
    case 'delegate':
      return { method: 'POST', path: DELEGATE_PATH, headers: headersFor(version, { method: 'POST', key: o.key, requestId: o.requestId }), body: o.body };
  }
}

