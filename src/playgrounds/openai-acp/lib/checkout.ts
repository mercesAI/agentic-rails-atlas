// Checkout session model and the status transition table. The table mirrors
// src/content/states/openai-acp-checkout-session.json (tests compare the two). Statuses and field names come from
// schema.agentic_checkout.json in spec folders 2025-09-29 and 2026-04-17.

import { ADDRESS, BUYER, CATALOG, HANDLERS, SESSION_TTL_MS, SHIPPING, SOLD_OUT_ITEM_ID, TAX_RATE, MERCHANT_ORIGIN } from './fixtures';
import { STATUSES, type SpecVersion, type Status } from './types';

export type TransitionKind = 'update' | 'complete' | 'cancel' | 'event' | 'clock';
/** spec: stated by the RFC or OpenAPI; implied: follows from RFC text without being stated; inferred: guessed from the status name or schema alone. */
export type Basis = 'spec' | 'implied' | 'inferred';

export interface Transition {
  from: Status;
  to: Status;
  kind: TransitionKind;
  trigger: string;
  api: string;
  basis: Basis;
}

const T = (from: Status, to: Status, kind: TransitionKind, trigger: string, api: string, basis: Basis): Transition => ({
  from,
  to,
  kind,
  trigger,
  api,
  basis,
});

/** All transitions in the 2026-04-17 state file, plus the same ready_for_payment to in_progress edge labeled inferred. */
export const TRANSITIONS: readonly Transition[] = [
  T('not_ready_for_payment', 'ready_for_payment', 'update', 'Buyer data and fulfillment choice complete', 'POST /checkout_sessions/{id}', 'implied'),
  T('incomplete', 'not_ready_for_payment', 'update', 'Required data added', 'POST /checkout_sessions/{id}', 'inferred'),
  T('ready_for_payment', 'not_ready_for_payment', 'update', 'Update invalidates the cart, for example out of stock', 'POST /checkout_sessions/{id}', 'implied'),
  T('ready_for_payment', 'authentication_required', 'event', 'Merchant requires 3DS', 'session response', 'spec'),
  T('authentication_required', 'completed', 'complete', 'Complete with authentication_result', 'POST /checkout_sessions/{id}/complete', 'spec'),
  T('ready_for_payment', 'requires_escalation', 'event', 'Merchant needs buyer action outside the agent', 'session response', 'inferred'),
  T('ready_for_payment', 'pending_approval', 'complete', 'Approval required, for example B2B', 'POST /checkout_sessions/{id}/complete', 'inferred'),
  T('ready_for_payment', 'complete_in_progress', 'complete', 'Complete accepted, payment still processing', 'POST /checkout_sessions/{id}/complete', 'inferred'),
  T('complete_in_progress', 'completed', 'event', 'Payment confirmed, order created', 'GET /checkout_sessions/{id}', 'inferred'),
  T('ready_for_payment', 'in_progress', 'complete', 'Processing, meaning not detailed', 'POST /checkout_sessions/{id}/complete', 'inferred'),
  T('in_progress', 'completed', 'event', 'Order created', 'POST /checkout_sessions/{id}/complete', 'spec'),
  T('ready_for_payment', 'completed', 'complete', 'Complete succeeds; response carries an order', 'POST /checkout_sessions/{id}/complete', 'spec'),
  T('not_ready_for_payment', 'canceled', 'cancel', 'Agent cancels, optional intent_trace', 'POST /checkout_sessions/{id}/cancel', 'spec'),
  T('ready_for_payment', 'canceled', 'cancel', 'Agent cancels, optional intent_trace', 'POST /checkout_sessions/{id}/cancel', 'spec'),
  T('ready_for_payment', 'expired', 'clock', 'expires_at passes', 'none', 'inferred'),
  T('not_ready_for_payment', 'expired', 'clock', 'expires_at passes', 'none', 'inferred'),
];

export function transitionsFor(version: SpecVersion, from: Status): Transition[] {
  const ok = STATUSES[version];
  return TRANSITIONS.filter((t) => t.from === from && ok.includes(t.from) && ok.includes(t.to));
}

export const isTerminal = (s: Status): boolean => s === 'completed' || s === 'canceled' || s === 'expired';

export interface Session {
  id: string;
  version: SpecVersion;
  status: Status;
  currency: string;
  items: { id: string; quantity: number }[];
  buyer?: { first_name: string; last_name: string; email: string };
  address?: typeof ADDRESS;
  optionId?: string;
  createdAt: number;
  expiresAt?: number;
  order?: Record<string, unknown>;
  /** Extra session messages from the merchant (for example a failed charge). */
  messages: Record<string, unknown>[];
  /** Cached for 'requires_escalation' (continue_url is a fixture). */
  escalated?: boolean;
}

export const CURRENCY = 'usd';

export interface Totals {
  subtotal: number;
  fulfillment: number;
  tax: number;
  total: number;
}

export function priceOf(itemId: string): number {
  return CATALOG.find((c) => c.id === itemId)?.unit_amount ?? 0;
}

export function computeTotals(s: Pick<Session, 'items' | 'optionId'>): Totals {
  const subtotal = s.items.reduce((n, i) => n + priceOf(i.id) * i.quantity, 0);
  const fulfillment = s.optionId ? SHIPPING.amount : 0;
  const tax = Math.round((subtotal + fulfillment) * TAX_RATE);
  return { subtotal, fulfillment, tax, total: subtotal + fulfillment + tax };
}

export const hasSoldOut = (s: Pick<Session, 'items'>): boolean => s.items.some((i) => i.id === SOLD_OUT_ITEM_ID);

/** Status a fresh or updated session settles on (RFC 4.2, implied): ready only with items, buyer, address and a fulfillment choice. */
export function readiness(s: Pick<Session, 'items' | 'buyer' | 'address' | 'optionId'>): 'ready_for_payment' | 'not_ready_for_payment' {
  const ready = s.items.length > 0 && !hasSoldOut(s) && !!s.buyer?.email && !!s.address && !!s.optionId;
  return ready ? 'ready_for_payment' : 'not_ready_for_payment';
}

export const BUYER_FIXTURE = { first_name: BUYER.first_name, last_name: BUYER.last_name, email: BUYER.email };
export { ADDRESS };

const money = (type: string, text: string, amount: number) => ({ type, display_text: text, amount });

export function messagesFor(s: Session): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  if (hasSoldOut(s)) {
    out.push({
      type: 'error',
      code: 'out_of_stock',
      param: '$.line_items[0]',
      content_type: 'plain',
      content: 'Sold-out print is out of stock.',
    });
  }
  if (s.status === 'requires_escalation') {
    out.push({
      type: 'info',
      content_type: 'plain',
      content: 'The buyer must finish this step outside the agent.',
      resolution: 'requires_buyer_input',
    });
  }
  return [...out, ...s.messages];
}

/** Wire form of a session. 2025-09-29 and 2026-04-17 differ in required fields and in several names. */
export function toWire(s: Session): Record<string, unknown> {
  const t = computeTotals(s);
  const messages = messagesFor(s);
  const links = [{ type: 'terms_of_use', url: `${MERCHANT_ORIGIN}/terms` }];
  if (s.version === '2025-09-29') {
    const wire: Record<string, unknown> = {
      id: s.id,
      payment_provider: { provider: 'stripe', supported_payment_methods: ['card'] },
      status: s.status,
      currency: s.currency,
      line_items: s.items.map((i, n) => {
        const base = priceOf(i.id) * i.quantity;
        const tax = Math.round(base * TAX_RATE);
        return { id: `li_${n + 1}`, item: { id: i.id, quantity: i.quantity }, base_amount: base, discount: 0, subtotal: base, tax, total: base + tax };
      }),
      fulfillment_options: [
        {
          type: 'shipping',
          id: SHIPPING.id,
          title: SHIPPING.title,
          subtotal: SHIPPING.amount,
          tax: Math.round(SHIPPING.amount * TAX_RATE),
          total: SHIPPING.amount + Math.round(SHIPPING.amount * TAX_RATE),
        },
      ],
      totals: [
        money('items_base_amount', 'Items', t.subtotal),
        money('subtotal', 'Subtotal', t.subtotal + t.fulfillment),
        ...(s.optionId ? [money('fulfillment', SHIPPING.title, t.fulfillment)] : []),
        money('tax', 'Tax', t.tax),
        money('total', 'Total', t.total),
      ],
      messages,
      links,
    };
    if (s.buyer) wire.buyer = s.buyer;
    if (s.address) wire.fulfillment_address = s.address;
    if (s.optionId) wire.fulfillment_option_id = s.optionId;
    if (s.order) wire.order = s.order;
    return wire;
  }
  const wire: Record<string, unknown> = {
    id: s.id,
    status: s.status,
    currency: s.currency,
    capabilities: {
      payment: { handlers: HANDLERS.map((h) => ({ ...h })) },
      interventions: { supported: ['3ds'], required: [], enforcement: 'conditional' },
    },
    line_items: s.items.map((i, n) => {
      const base = priceOf(i.id) * i.quantity;
      return {
        id: `li_${n + 1}`,
        item: { id: i.id, name: CATALOG.find((c) => c.id === i.id)?.name, unit_amount: priceOf(i.id) },
        quantity: i.quantity,
        totals: [money('subtotal', 'Subtotal', base), money('total', 'Total', base)],
      };
    }),
    fulfillment_options: [
      { type: 'shipping', id: SHIPPING.id, title: SHIPPING.title, totals: [money('total', SHIPPING.title, SHIPPING.amount)] },
    ],
    totals: [
      money('subtotal', 'Subtotal', t.subtotal),
      ...(s.optionId ? [money('fulfillment', SHIPPING.title, t.fulfillment)] : []),
      money('tax', 'Tax', t.tax),
      money('total', 'Total', t.total),
    ],
    messages,
    links,
    created_at: new Date(s.createdAt).toISOString(),
    expires_at: new Date(s.expiresAt ?? s.createdAt + SESSION_TTL_MS).toISOString(),
  };
  if (s.buyer) wire.buyer = s.buyer;
  if (s.address) wire.fulfillment_details = { name: s.address.name, email: s.buyer?.email, address: s.address };
  if (s.optionId) wire.selected_fulfillment_options = [{ type: 'shipping', option_id: s.optionId, item_ids: s.items.map((_, n) => `li_${n + 1}`) }];
  if (s.status === 'authentication_required') {
    wire.authentication_metadata = {
      acquirer_details: { acquirer_bin: '000000', acquirer_country: 'US', acquirer_merchant_id: 'fixture_acquirer_merchant', merchant_name: 'Juniper Goods' },
      directory_server: 'visa',
    };
  }
  if (s.status === 'requires_escalation') wire.continue_url = `${MERCHANT_ORIGIN}/continue/${s.id}`;
  if (s.order) wire.order = s.order;
  return JSON.parse(JSON.stringify(wire)) as Record<string, unknown>;
}

/** Expiry exists in 2026-04-17 only; per the state file the transition is inferred (no API call). */
export function expireIfDue(s: Session, nowMs: number): Session {
  if (s.version !== '2026-04-17' || s.expiresAt === undefined) return s;
  if ((s.status === 'ready_for_payment' || s.status === 'not_ready_for_payment') && nowMs >= s.expiresAt) {
    return { ...s, status: 'expired' };
  }
  return s;
}
