// Shared types and labels for the ACP playground. Field names follow the JSON Schema and OpenAPI files
// in research/vendor/acp/spec/2025-09-29 and research/vendor/acp/spec/2026-04-17.

export type SpecVersion = '2025-09-29' | '2026-04-17';
export const SPEC_VERSIONS: readonly SpecVersion[] = ['2025-09-29', '2026-04-17'];
export const LATEST: SpecVersion = '2026-04-17';

export const SIMPLIFICATION_LABEL = 'Teaching simplification';
export function exampleLabel(v: SpecVersion): string {
  return `Illustrative example, spec version ${v}`;
}

/** CheckoutSessionBase.status enum, per version (schema.agentic_checkout.json). */
export const STATUSES: Record<SpecVersion, readonly string[]> = {
  '2025-09-29': ['not_ready_for_payment', 'ready_for_payment', 'completed', 'canceled', 'in_progress'],
  '2026-04-17': [
    'incomplete',
    'not_ready_for_payment',
    'requires_escalation',
    'authentication_required',
    'ready_for_payment',
    'pending_approval',
    'complete_in_progress',
    'completed',
    'canceled',
    'in_progress',
    'expired',
  ],
};

export type Status =
  | 'incomplete'
  | 'not_ready_for_payment'
  | 'requires_escalation'
  | 'authentication_required'
  | 'ready_for_payment'
  | 'pending_approval'
  | 'complete_in_progress'
  | 'completed'
  | 'canceled'
  | 'in_progress'
  | 'expired';

export const TERMINAL: readonly Status[] = ['completed', 'canceled', 'expired'];

/** HTTP-level Error object (flat, no envelope). `code` is a free string in the checkout spec. */
export interface ApiError {
  type: string;
  code: string;
  message: string;
  param?: string;
  supported_versions?: string[];
}

/** One request and response pair in the log. Status '4XX' means the OpenAPI file names only a status class. */
export interface Exchange {
  method: 'GET' | 'POST';
  path: string;
  requestHeaders: Record<string, string>;
  requestBody?: unknown;
  status: number | '4XX';
  responseHeaders: Record<string, string>;
  responseBody?: unknown;
  note?: string;
}

export const pretty = (v: unknown): string => JSON.stringify(v, null, 2);
