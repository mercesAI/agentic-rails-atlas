// One checkout operation rendered three ways, following the v2026-08-25 bindings:
// REST (services/shopping/rest.openapi.json, shopping/checkout/rest.md), MCP (services/shopping/mcp.openrpc.json,
// shopping/checkout/mcp.md) and A2A (shopping/checkout/a2a.md).
import {
  A2A_ENDPOINT,
  A2A_EXTENSION_URI,
  CATALOG,
  MCP_ENDPOINT,
  REST_ENDPOINT,
  type InstrumentOption,
} from './fixtures';
import { computeTotals, type CheckoutData, type CheckoutSession } from './checkout';
import { ucpAgentHeader } from './negotiate';
import { instrumentEcho, instrumentPayload } from './payment';
import { type JsonObject, type JsonValue } from './types';

export type Operation = 'create' | 'get' | 'update' | 'complete' | 'cancel';
export type WireTransport = 'rest' | 'mcp' | 'a2a';

export interface OperationSpec {
  label: string;
  rest: { method: 'GET' | 'POST' | 'PUT'; path: string; status: number; statusText: string };
  mcpTool: string;
  /** Structured A2A action from the binding's examples; undefined means a natural-language turn. */
  a2aAction?: string;
  a2aText?: string;
}

export const OPERATIONS: Record<Operation, OperationSpec> = {
  create: {
    label: 'Create Checkout',
    rest: { method: 'POST', path: '/checkout-sessions', status: 201, statusText: 'Created' },
    mcpTool: 'create_checkout',
    a2aAction: 'add_to_checkout',
  },
  get: {
    label: 'Get Checkout',
    rest: { method: 'GET', path: '/checkout-sessions/{id}', status: 200, statusText: 'OK' },
    mcpTool: 'get_checkout',
    a2aText: 'Show me my current checkout',
  },
  update: {
    label: 'Update Checkout',
    rest: { method: 'PUT', path: '/checkout-sessions/{id}', status: 200, statusText: 'OK' },
    mcpTool: 'update_checkout',
    a2aText: 'Update my checkout with the details in this message',
  },
  complete: {
    label: 'Complete Checkout',
    rest: { method: 'POST', path: '/checkout-sessions/{id}/complete', status: 200, statusText: 'OK' },
    mcpTool: 'complete_checkout',
    a2aAction: 'complete_checkout',
  },
  cancel: {
    label: 'Cancel Checkout',
    rest: { method: 'POST', path: '/checkout-sessions/{id}/cancel', status: 200, statusText: 'OK' },
    mcpTool: 'cancel_checkout',
    a2aText: 'Cancel my checkout',
  },
};

export const OPERATION_ORDER: readonly Operation[] = ['create', 'get', 'update', 'complete', 'cancel'];

/** Fixture signals; 203.0.113.0/24 is a documentation range. */
export const FIXTURE_SIGNALS: JsonObject = {
  'dev.ucp.buyer_ip': '203.0.113.42',
  'dev.ucp.user_agent': 'Mozilla/5.0 (fixture)',
};

/** Envelope for the `ucp` member of a checkout response. */
export interface Envelope {
  version: string;
  capabilities: Record<string, { version: string }[]>;
  payment_handlers: Record<string, Record<string, unknown>[]>;
}

export interface WireContext {
  session: CheckoutSession | null;
  /** Data the request carries (create and update). */
  data: CheckoutData;
  instruments: InstrumentOption[];
  ap2Locked: boolean;
  checkoutMandate: boolean;
  envelope: Envelope;
  platformProfileUrl: string;
  idempotencyKey: string;
  requestId: string;
  rpcId: number;
  contextId: string;
  messageId: string;
}

function b64url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Fixture detached JWS (`<header>..<signature>`); the header is real base64url, the signature is a placeholder. */
export function fixtureMerchantAuthorization(kid: string): string {
  return `${b64url(JSON.stringify({ alg: 'ES256', kid }))}..${b64url('fixture-signature-not-computed')}`;
}

/** Fixture SD-JWT with key binding shape (`<jwt>~<disclosures>~<kb-jwt>`); not a real credential. */
export function fixtureCheckoutMandate(): string {
  const header = b64url(JSON.stringify({ alg: 'ES256', typ: 'dc+sd-jwt' }));
  return `${header}.${b64url('{"fixture":true}')}.${b64url('sig')}~${b64url('["salt","disclosure"]')}~${b64url('kb')}`;
}

function lineItemsRequest(data: CheckoutData, withIds: boolean): JsonValue[] {
  return data.lineItems.map((li, i) => ({
    ...(withIds ? { id: `li_${i + 1}` } : {}),
    item: { id: li.itemId },
    quantity: li.quantity,
  }));
}

/** Request body per operation (fields marked `ucp_request: omit` are left out). */
export function requestBody(op: Operation, ctx: WireContext): JsonObject | null {
  const buyer: JsonObject = ctx.data.buyerEmail ? { buyer: { email: ctx.data.buyerEmail } } : {};
  switch (op) {
    case 'create':
      return { line_items: lineItemsRequest(ctx.data, false), ...buyer };
    case 'update':
      return { line_items: lineItemsRequest(ctx.data, true), ...buyer };
    case 'complete':
      return {
        payment: { instruments: ctx.instruments.map((o, i) => instrumentPayload(o, i) as JsonObject) },
        signals: FIXTURE_SIGNALS,
        ...(ctx.ap2Locked && ctx.checkoutMandate ? { ap2: { checkout_mandate: fixtureCheckoutMandate() } } : {}),
      };
    case 'cancel':
      return {};
    case 'get':
      return null;
  }
}

/** The checkout resource a business returns, built from the simulated session. */
export function checkoutResource(session: CheckoutSession, envelope: Envelope, ap2Locked: boolean): JsonObject {
  const totals = computeTotals(session.data.lineItems);
  const out: JsonObject = {
    ucp: envelope as unknown as JsonObject,
    id: session.id,
    status: session.status,
    currency: session.currency,
    line_items: session.data.lineItems.map((li, i) => {
      const item = CATALOG.find((c) => c.id === li.itemId);
      const amount = (item?.price ?? 0) * li.quantity;
      return {
        id: `li_${i + 1}`,
        item: { id: li.itemId, title: item?.title ?? li.itemId, price: item?.price ?? 0 },
        quantity: li.quantity,
        totals: [
          { type: 'subtotal', amount },
          { type: 'total', amount },
        ],
      };
    }),
    totals: [
      { type: 'subtotal', amount: totals.subtotal },
      { type: 'tax', amount: totals.tax },
      { type: 'total', amount: totals.total },
    ],
    links: [
      { type: 'privacy_policy', url: 'https://juniper.example/privacy' },
      { type: 'terms_of_service', url: 'https://juniper.example/terms' },
    ],
    expires_at: new Date(session.expiresAt).toISOString(),
  };
  if (session.data.buyerEmail) out.buyer = { email: session.data.buyerEmail };
  if (session.messages.length > 0) out.messages = session.messages as unknown as JsonValue[];
  if (session.continueUrl) out.continue_url = session.continueUrl;
  if (session.submitted && session.submitted.length > 0) {
    out.payment = { instruments: session.submitted.map((o, i) => instrumentEcho(o, i) as JsonObject) };
  }
  if (session.order) out.order = session.order;
  if (ap2Locked) out.ap2 = { merchant_authorization: fixtureMerchantAuthorization('juniper_2026') };
  return out;
}

function pretty(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

function restPath(op: Operation, id: string): string {
  const base = new URL(REST_ENDPOINT).pathname.replace(/\/$/, '');
  return base + OPERATIONS[op].rest.path.replace('{id}', id);
}

export interface WireMessage {
  /** Where the message goes (endpoint or Agent Card URL). */
  target: string;
  text: string;
  /** Parts of this rendering that are a teaching simplification. */
  simplifications: string[];
}

export function renderRequest(op: Operation, transport: WireTransport, ctx: WireContext): WireMessage {
  const id = ctx.session?.id ?? 'chk_pending';
  const body = requestBody(op, ctx);
  const spec = OPERATIONS[op];
  if (transport === 'rest') {
    const host = new URL(REST_ENDPOINT).host;
    const headers = [
      `${spec.rest.method} ${restPath(op, id)} HTTP/1.1`,
      `Host: ${host}`,
      `UCP-Agent: ${ucpAgentHeader(ctx.platformProfileUrl)}`,
      `Request-Id: ${ctx.requestId}`,
      ...(spec.rest.method === 'GET' ? [] : [`Idempotency-Key: ${ctx.idempotencyKey}`]),
      ...(body ? ['Content-Type: application/json'] : []),
    ];
    return {
      target: REST_ENDPOINT,
      text: body ? `${headers.join('\n')}\n\n${pretty(body)}` : headers.join('\n'),
      simplifications: ['Authentication and RFC 9421 signature headers are left out'],
    };
  }
  if (transport === 'mcp') {
    const meta: JsonObject = { 'ucp-agent': { profile: ctx.platformProfileUrl } };
    if (op === 'complete' || op === 'cancel') meta['idempotency-key'] = ctx.idempotencyKey;
    const args: JsonObject = { meta };
    if (op !== 'create') args.id = id;
    if (body && op !== 'cancel') args.checkout = body;
    return {
      target: MCP_ENDPOINT,
      text: pretty({ jsonrpc: '2.0', id: ctx.rpcId, method: 'tools/call', params: { name: spec.mcpTool, arguments: args } }),
      simplifications: ['MCP session setup (initialize, tools/list) is left out'],
    };
  }
  const parts: JsonValue[] = [];
  const simplifications = ['A2A task handling is left out; this shows a single Message turn'];
  if (op === 'create') {
    for (const li of ctx.data.lineItems) {
      parts.push({ kind: 'data', data: { action: 'add_to_checkout', product_id: li.itemId, quantity: li.quantity } });
    }
  } else if (op === 'complete') {
    parts.push({ kind: 'data', data: { action: 'complete_checkout' } });
    const data: JsonObject = {
      'a2a.ucp.checkout.payment': body?.payment ?? {},
      'a2a.ucp.checkout.signals': FIXTURE_SIGNALS,
    };
    if (ctx.ap2Locked && ctx.checkoutMandate) data.ap2 = { checkout_mandate: fixtureCheckoutMandate() };
    parts.push({ kind: 'data', data });
  } else {
    parts.push({ kind: 'text', text: spec.a2aText ?? spec.label });
    if (op === 'update' && body) parts.push({ kind: 'data', data: { 'a2a.ucp.checkout': body } });
    simplifications.push(
      'The A2A binding gives structured actions only for adding items and completing; this turn uses natural language',
    );
  }
  const envelope = {
    jsonrpc: '2.0',
    id: ctx.rpcId,
    method: 'message/send',
    params: { message: { role: 'user', parts, messageId: ctx.messageId, kind: 'message', contextId: ctx.contextId } },
  };
  const headers = [`UCP-Agent: ${ucpAgentHeader(ctx.platformProfileUrl)}`, `X-A2A-Extensions: ${A2A_EXTENSION_URI}`];
  return { target: A2A_ENDPOINT, text: `${headers.join('\n')}\n\n${pretty(envelope)}`, simplifications };
}

export function renderResponse(
  op: Operation,
  transport: WireTransport,
  ctx: WireContext,
  resource: JsonObject,
): WireMessage {
  const spec = OPERATIONS[op];
  if (transport === 'rest') {
    return {
      target: REST_ENDPOINT,
      text: `HTTP/1.1 ${spec.rest.status} ${spec.rest.statusText}\nContent-Type: application/json\n\n${pretty(resource)}`,
      simplifications: [],
    };
  }
  if (transport === 'mcp') {
    return {
      target: MCP_ENDPOINT,
      text: pretty({
        jsonrpc: '2.0',
        id: ctx.rpcId,
        result: { structuredContent: resource, content: [{ type: 'text', text: JSON.stringify(resource) }] },
      }),
      simplifications: [],
    };
  }
  return {
    target: A2A_ENDPOINT,
    text: pretty({
      jsonrpc: '2.0',
      id: ctx.rpcId,
      result: {
        contextId: ctx.contextId,
        kind: 'message',
        messageId: `${ctx.messageId}-reply`,
        parts: [{ kind: 'data', data: { 'a2a.ucp.checkout': resource } }],
        role: 'agent',
      },
    }),
    simplifications: [],
  };
}
