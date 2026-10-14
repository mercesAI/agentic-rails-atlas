// Idempotency-Key handling, following rfcs/rfc.agentic_checkout.md section 6 (2026-04-17):
// scoped to authenticated identity + endpoint path; equivalence is semantic JSON equality of the body only;
// replay returns the original status and body with Idempotent-Replayed: true; a changed body is 422
// idempotency_conflict; an in-flight duplicate is 409 idempotency_in_flight with Retry-After; 5xx is never
// cached; keys are kept at least 24 hours.

import type { ApiError, SpecVersion } from './types';

export const RETENTION_MS = 24 * 60 * 60 * 1000;
export const RETRY_AFTER_SECONDS = 2;

/** Canonical JSON: object keys sorted, arrays keep order, null stays distinct from absent (undefined is dropped). */
export function canonicalJson(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return `[${v.map((x) => canonicalJson(x === undefined ? null : x)).join(',')}]`;
  const o = v as Record<string, unknown>;
  const keys = Object.keys(o)
    .filter((k) => o[k] !== undefined)
    .sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonicalJson(o[k])}`).join(',')}}`;
}

export function sameBody(a: unknown, b: unknown): boolean {
  return canonicalJson(a) === canonicalJson(b);
}

export interface StoredResponse {
  status: number | '4XX';
  headers: Record<string, string>;
  body: unknown;
}

export interface IdemRecord {
  canonicalBody: string;
  storedAt: number;
  inFlight: boolean;
  response?: StoredResponse;
}

export type IdemStore = Record<string, IdemRecord>;

export const scopeKey = (identity: string, endpoint: string, key: string): string => `${identity}|${endpoint}|${key}`;

export type IdemOutcome =
  | { kind: 'unkeyed' }
  | { kind: 'new' }
  | { kind: 'replay'; response: StoredResponse }
  | { kind: 'error'; status: 400 | 409 | 422; error: ApiError; headers: Record<string, string> };

export interface IdemInput {
  identity: string;
  endpoint: string;
  key: string | undefined;
  body: unknown;
  version: SpecVersion;
  now: number;
  /** Delegate Payment requires the key in both versions; Checkout requires it from 2026-04-17. */
  keyRequired: boolean;
}

export function checkIdempotency(store: IdemStore, input: IdemInput): IdemOutcome {
  const { key } = input;
  if (!key) {
    if (!input.keyRequired) return { kind: 'unkeyed' };
    return {
      kind: 'error',
      status: 400,
      headers: {},
      error: { type: 'invalid_request', code: 'idempotency_key_required', message: 'Idempotency-Key header is required' },
    };
  }
  const rec = store[scopeKey(input.identity, input.endpoint, key)];
  if (!rec || input.now - rec.storedAt >= RETENTION_MS) return { kind: 'new' };
  if (rec.canonicalBody !== canonicalJson(input.body)) {
    return {
      kind: 'error',
      status: 422,
      headers: {},
      error: {
        type: 'invalid_request',
        code: 'idempotency_conflict',
        message: 'Idempotency-Key has already been used with a different request body',
      },
    };
  }
  if (rec.inFlight || !rec.response) {
    return {
      kind: 'error',
      status: 409,
      headers: { 'Retry-After': String(RETRY_AFTER_SECONDS) },
      error: {
        type: 'invalid_request',
        code: 'idempotency_in_flight',
        message: 'A request with this Idempotency-Key is currently being processed',
      },
    };
  }
  return { kind: 'replay', response: rec.response };
}

/** Record the response under the key. 5xx responses are not cached (section 6.5). Returns the new store. */
export function recordResponse(
  store: IdemStore,
  input: Pick<IdemInput, 'identity' | 'endpoint' | 'key' | 'body' | 'now'>,
  response: StoredResponse,
): IdemStore {
  if (!input.key) return store;
  if (typeof response.status === 'number' && response.status >= 500) return store;
  return {
    ...store,
    [scopeKey(input.identity, input.endpoint, input.key)]: {
      canonicalBody: canonicalJson(input.body),
      storedAt: input.now,
      inFlight: false,
      response,
    },
  };
}

/** Mark a key as in flight (the first request has not finished), used by the "duplicate while running" demo. */
export function markInFlight(
  store: IdemStore,
  input: Pick<IdemInput, 'identity' | 'endpoint' | 'key' | 'body' | 'now'>,
): IdemStore {
  if (!input.key) return store;
  return {
    ...store,
    [scopeKey(input.identity, input.endpoint, input.key)]: {
      canonicalBody: canonicalJson(input.body),
      storedAt: input.now,
      inFlight: true,
    },
  };
}
