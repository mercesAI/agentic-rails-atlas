// Delegate Payment (POST /agentic_commerce/delegate_payment) and allowance enforcement.
// Field names: schema.delegate_payment.json (2025-09-29 and 2026-04-17, same Allowance shape).
// Spec text (rfc.delegate_payment.md section 2.5): the token MUST ONLY be usable within the Allowance
// (reason, max_amount, currency, expiry) and MUST become invalid at or after allowance.expires_at.
// The spec defines NO error code or HTTP status for a charge that breaks the allowance: the Error enum for the
// delegate endpoint only covers request validation (invalid_card, duplicate_request, idempotency_*, too_many_requests).

import { NETWORK_TOKEN_FIXTURE } from './fixtures';
import type { ApiError } from './types';

export interface Allowance {
  reason: 'one_time';
  max_amount: number;
  currency: string;
  checkout_session_id: string;
  merchant_id: string;
  expires_at: string;
}

export interface DelegatePaymentRequest {
  payment_method: {
    type: 'card';
    card_number_type: 'fpan' | 'network_token';
    number: string;
    display_card_funding_type: 'credit' | 'debit' | 'prepaid';
    metadata: Record<string, string>;
    [k: string]: unknown;
  };
  allowance: Allowance;
  risk_signals: { type: 'card_testing'; score: number; action: 'blocked' | 'manual_review' | 'authorized' }[];
  metadata: Record<string, string>;
  billing_address?: Record<string, string>;
}

export interface DelegatePaymentResponse {
  id: string;
  created: string;
  metadata: Record<string, string>;
}

export interface TokenRecord {
  id: string;
  allowance: Allowance;
  created: string;
  used: boolean;
}

export const toIso = (ms: number): string => new Date(ms).toISOString().replace('.000Z', 'Z');

export function buildDelegateRequest(opts: {
  maxAmount: number;
  currency: string;
  checkoutSessionId: string;
  merchantId: string;
  expiresAtMs: number;
}): DelegatePaymentRequest {
  return {
    payment_method: {
      type: 'card',
      card_number_type: 'network_token',
      // A fixture string, never a card number.
      number: NETWORK_TOKEN_FIXTURE,
      display_card_funding_type: 'credit',
      metadata: {},
    },
    allowance: {
      reason: 'one_time',
      max_amount: opts.maxAmount,
      currency: opts.currency,
      checkout_session_id: opts.checkoutSessionId,
      merchant_id: opts.merchantId,
      expires_at: toIso(opts.expiresAtMs),
    },
    risk_signals: [],
    metadata: {},
  };
}

const CURRENCY = /^[a-z]{3}$/;
const RFC3339 = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/;

/** Request validation. Returns the spec's Error object (type invalid_request) with its HTTP status, or null. */
export interface DelegateRejection {
  /** 400 for a missing field, 422 for a semantic error, as in openapi.delegate_payment.yaml. */
  status: 400 | 422;
  error: ApiError;
}

export function validateDelegateRequest(req: unknown): DelegateRejection | null {
  const bad = (code: string, message: string, param: string): DelegateRejection => ({
    status: message.endsWith('is required') || message.startsWith('Request body') ? 400 : 422,
    error: { type: 'invalid_request', code, message, param },
  });
  if (!req || typeof req !== 'object') return bad('invalid_card', 'Request body must be a JSON object', '$');
  const r = req as Record<string, unknown>;
  for (const k of ['payment_method', 'allowance', 'risk_signals', 'metadata']) {
    if (r[k] === undefined) return bad('invalid_card', `${k} is required`, `$.${k}`);
  }
  const pm = r.payment_method as Record<string, unknown>;
  for (const k of ['type', 'card_number_type', 'number', 'display_card_funding_type', 'metadata']) {
    if (pm?.[k] === undefined) return bad('invalid_card', `payment_method.${k} is required`, `$.payment_method.${k}`);
  }
  const a = r.allowance as Record<string, unknown>;
  for (const k of ['reason', 'max_amount', 'currency', 'checkout_session_id', 'merchant_id', 'expires_at']) {
    if (a?.[k] === undefined) return bad('invalid_card', `allowance.${k} is required`, `$.allowance.${k}`);
  }
  if (a.reason !== 'one_time') return bad('invalid_card', 'allowance.reason must be one_time', '$.allowance.reason');
  if (!Number.isInteger(a.max_amount)) return bad('invalid_card', 'allowance.max_amount must be an integer in minor units', '$.allowance.max_amount');
  if (typeof a.currency !== 'string' || !CURRENCY.test(a.currency)) return bad('invalid_card', 'allowance.currency must match ^[a-z]{3}$', '$.allowance.currency');
  if (typeof a.merchant_id !== 'string' || a.merchant_id.length > 256) return bad('invalid_card', 'allowance.merchant_id must be at most 256 characters', '$.allowance.merchant_id');
  if (typeof a.expires_at !== 'string' || !RFC3339.test(a.expires_at)) return bad('invalid_card', 'allowance.expires_at must be RFC 3339', '$.allowance.expires_at');
  return null;
}

export function issueToken(req: DelegatePaymentRequest, id: string, nowMs: number, idempotencyKey: string | undefined): {
  record: TokenRecord;
  response: DelegatePaymentResponse;
} {
  const created = toIso(nowMs);
  const metadata: Record<string, string> = { ...req.metadata, source: 'agent_checkout', merchant_id: req.allowance.merchant_id };
  if (idempotencyKey) metadata.idempotency_key = idempotencyKey;
  return { record: { id, allowance: req.allowance, created, used: false }, response: { id, created, metadata } };
}

export type ViolationKind = 'max_amount' | 'currency' | 'expired' | 'merchant' | 'session' | 'reused';

export interface Violation {
  kind: ViolationKind;
  /** What the spec requires, in plain words. */
  rule: string;
  /** The field that was broken. */
  field: string;
  /** Does the spec name an error code or HTTP status for this case? Always false for allowance breaks. */
  specDefinesCode: false;
}

export interface Charge {
  amount: number;
  currency: string;
  merchantId: string;
  checkoutSessionId: string;
}

const RULES: Record<ViolationKind, { rule: string; field: string }> = {
  max_amount: { rule: 'The charge must not exceed allowance.max_amount.', field: 'allowance.max_amount' },
  currency: { rule: 'The charge currency must match allowance.currency.', field: 'allowance.currency' },
  expired: { rule: 'The token MUST become invalid at or after allowance.expires_at.', field: 'allowance.expires_at' },
  merchant: { rule: 'Only the merchant named in allowance.merchant_id may use the token.', field: 'allowance.merchant_id' },
  session: { rule: 'The token belongs to the session named in allowance.checkout_session_id.', field: 'allowance.checkout_session_id' },
  reused: { rule: 'allowance.reason is one_time, so a second use is outside the allowance.', field: 'allowance.reason' },
};

/** Check a charge against the allowance. Every broken rule is returned, in a fixed order. */
export function evaluateAllowance(token: TokenRecord, charge: Charge, nowMs: number): Violation[] {
  const a = token.allowance;
  const out: ViolationKind[] = [];
  if (nowMs >= Date.parse(a.expires_at)) out.push('expired');
  if (charge.merchantId !== a.merchant_id) out.push('merchant');
  if (charge.checkoutSessionId !== a.checkout_session_id) out.push('session');
  if (charge.currency !== a.currency) out.push('currency');
  if (charge.amount > a.max_amount) out.push('max_amount');
  if (token.used) out.push('reused');
  return out.map((kind) => ({ kind, ...RULES[kind], specDefinesCode: false as const }));
}

export const NO_CODE_NOTE =
  'The spec says the token must only work within the allowance but names no error code and no HTTP status for a charge that breaks it. ' +
  'The Error enum on the delegate endpoint covers request validation only. This simulation answers with the existing session message code payment_declined, a teaching choice.';
