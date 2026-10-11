// Shared types for the UCP playground. Field names follow the UCP JSON Schemas at tag v2026-08-25
// (source/schemas/profile.json, ucp.json, capability.json, payment_handler.json, shopping/checkout.json).

/** Release the simulation follows. Core `dev.ucp.*` entries carry this date as their version. */
export const SPEC_VERSION = '2026-08-25';
/** Label shown above every payload. */
export const EXAMPLE_LABEL = 'Illustrative example, spec version v2026-08-25';
export const SIMPLIFICATION_LABEL = 'teaching simplification';

export type Transport = 'rest' | 'mcp' | 'a2a' | 'embedded';

/** Constraint Expression, reduced to the `properties.<name>.enum` shape the spec examples use. */
export interface ConstraintExpression {
  properties?: Record<string, { enum?: string[] }>;
}

export interface AvailableInstrument {
  type: string;
  constraints?: ConstraintExpression;
}

/** `ucp.json#/$defs/entity` plus the fields capability, service and handler entries add. */
export interface Entity {
  version: string;
  spec?: string;
  schema?: string;
  id?: string;
  config?: Record<string, unknown>;
  /** Capability entries only (capability.json). */
  extends?: string | string[];
  /** Payment handler entries only (payment_handler.json). */
  available_instruments?: AvailableInstrument[];
  /** Service entries only (service.json). */
  transport?: Transport;
  endpoint?: string;
}

export interface ProfileUcp {
  version: string;
  services: Record<string, Entity[]>;
  capabilities?: Record<string, Entity[]>;
  payment_handlers: Record<string, Entity[]>;
  /** Business profiles only; maps an older release to a leaf profile URI. */
  supported_versions?: Record<string, string>;
}

/** Public JWK as published in the top-level `keys[]` set (outside `ucp`). */
export interface PublicJwk {
  kid: string;
  kty: string;
  crv?: string;
  x?: string;
  y?: string;
  alg?: string;
  use?: string;
  [member: string]: unknown;
}

export interface Profile {
  ucp: ProfileUcp;
  keys?: PublicJwk[];
}

export type Severity = 'recoverable' | 'requires_buyer_input' | 'requires_buyer_review' | 'unrecoverable';

/** `common/types/message.json` (error, warning or info). */
export interface UcpMessage {
  type: 'error' | 'warning' | 'info';
  code: string;
  content: string;
  severity?: Severity;
  path?: string;
}

export type CheckoutStatus =
  | 'incomplete'
  | 'requires_escalation'
  | 'ready_for_complete'
  | 'complete_in_progress'
  | 'completed'
  | 'canceled';

export const CHECKOUT_STATUSES: readonly CheckoutStatus[] = [
  'incomplete',
  'requires_escalation',
  'ready_for_complete',
  'complete_in_progress',
  'completed',
  'canceled',
];

export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };
