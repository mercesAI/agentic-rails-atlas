// Payment handler negotiation and submission checks, following the UCP overview "Payment Handlers" section
// and the Payment Handler Guide "Resolving available_instruments" at v2026-08-25.
import { HANDLER_CART_RULES, type InstrumentOption } from './fixtures';
import { checkAuthorityBinding } from './negotiate';
import { type AvailableInstrument, type ConstraintExpression, type Entity, type UcpMessage } from './types';

export interface CartContext {
  hasSubscription: boolean;
}

export interface ResolvedHandler {
  name: string;
  id: string;
  version: string;
  /** Undefined means "no restriction" (the field is optional and absence means every instrument type). */
  available_instruments?: AvailableInstrument[];
  config?: Record<string, unknown>;
}

export type HandlerExclusion =
  | 'authority_binding_failed'
  | 'platform_cannot_execute'
  | 'filtered_by_cart_context'
  | 'no_common_instrument';

export interface ExcludedHandler {
  name: string;
  id: string;
  reason: HandlerExclusion;
  detail: string;
  simplification?: boolean;
}

function mergeConstraints(
  a: ConstraintExpression | undefined,
  b: ConstraintExpression | undefined,
): ConstraintExpression | null | undefined {
  if (!a) return b;
  if (!b) return a;
  const props: Record<string, { enum?: string[] }> = {};
  const keys = new Set([...Object.keys(a.properties ?? {}), ...Object.keys(b.properties ?? {})]);
  for (const key of keys) {
    const ea = a.properties?.[key]?.enum;
    const eb = b.properties?.[key]?.enum;
    if (ea && eb) {
      const both = ea.filter((v) => eb.includes(v));
      if (both.length === 0) return null;
      props[key] = { enum: both };
    } else {
      const only = ea ?? eb;
      props[key] = only ? { enum: only } : {};
    }
  }
  return { properties: props };
}

/**
 * Intersect the business declaration with the platform declaration. The business list order is kept
 * (it signals presentation preference). Returns null when nothing is left.
 */
export function resolveInstruments(
  business: AvailableInstrument[] | undefined,
  platform: AvailableInstrument[] | undefined,
): AvailableInstrument[] | undefined | null {
  if (!business && !platform) return undefined;
  if (!business) return platform;
  if (!platform) return business;
  const out: AvailableInstrument[] = [];
  for (const bi of business) {
    const match = platform.find((pi) => pi.type === bi.type);
    if (!match) continue;
    const merged = mergeConstraints(bi.constraints, match.constraints);
    if (merged === null) continue;
    out.push(merged ? { type: bi.type, constraints: merged } : { type: bi.type });
  }
  return out.length > 0 ? out : null;
}

/** Business-side resolution of the handlers it returns in `ucp.payment_handlers` for one checkout. */
export function resolveHandlers(
  businessHandlers: Record<string, Entity[]>,
  platformHandlers: Record<string, Entity[]>,
  cart: CartContext,
): { active: ResolvedHandler[]; excluded: ExcludedHandler[] } {
  const active: ResolvedHandler[] = [];
  const excluded: ExcludedHandler[] = [];
  for (const [name, instances] of Object.entries(businessHandlers)) {
    for (const h of instances) {
      const id = h.id ?? name;
      if (h.schema) {
        const binding = checkAuthorityBinding(name, h.schema);
        if (!binding.ok) {
          excluded.push({ name, id, reason: 'authority_binding_failed', detail: binding.reason });
          continue;
        }
      }
      const platformSide = platformHandlers[name]?.[0];
      if (!platformSide) {
        excluded.push({
          name,
          id,
          reason: 'platform_cannot_execute',
          detail: 'The agent profile does not declare this handler, so it cannot acquire a credential with it',
          simplification: true,
        });
        continue;
      }
      if (cart.hasSubscription && HANDLER_CART_RULES[name]?.excludeForSubscription) {
        excluded.push({
          name,
          id,
          reason: 'filtered_by_cart_context',
          detail: 'The business filters this handler out when the cart holds a subscription item',
        });
        continue;
      }
      const resolved = resolveInstruments(h.available_instruments, platformSide.available_instruments);
      if (resolved === null) {
        excluded.push({ name, id, reason: 'no_common_instrument', detail: 'No instrument type and constraint in common' });
        continue;
      }
      active.push({
        name,
        id,
        version: h.version,
        ...(resolved ? { available_instruments: resolved } : {}),
        ...(h.config ? { config: h.config } : {}),
      });
    }
  }
  return { active, excluded };
}

/** Wire shape of `ucp.payment_handlers` in a checkout response. */
export function handlersForResponse(handlers: ResolvedHandler[]): Record<string, Record<string, unknown>[]> {
  const out: Record<string, Record<string, unknown>[]> = {};
  for (const h of handlers) {
    const entry: Record<string, unknown> = { id: h.id, version: h.version };
    if (h.available_instruments) entry.available_instruments = h.available_instruments;
    if (h.config) entry.config = h.config;
    (out[h.name] ??= []).push(entry);
  }
  return out;
}

function allowedBy(handler: ResolvedHandler, option: InstrumentOption): string | null {
  if (!handler.available_instruments) return null;
  const entry = handler.available_instruments.find((ai) => ai.type === option.type);
  if (!entry) return `type "${option.type}" is not in the resolved available_instruments`;
  const brands = entry.constraints?.properties?.brand?.enum;
  if (brands && option.brand && !brands.includes(option.brand)) {
    return `brand "${option.brand}" is outside the resolved constraint (${brands.join(', ')})`;
  }
  return null;
}

/**
 * Check a Complete Checkout submission: exactly one instrument unless split payments is active, and each
 * instrument must come from an active handler within its resolved constraints. Violations are `payment_failed`.
 */
export function validateSubmission(
  options: InstrumentOption[],
  handlers: ResolvedHandler[],
  splitPayments: boolean,
): UcpMessage[] {
  const messages: UcpMessage[] = [];
  if (!splitPayments && options.length !== 1) {
    messages.push({
      type: 'error',
      code: 'payment_failed',
      severity: 'recoverable',
      path: '$.payment.instruments',
      content: `Submit exactly one instrument (got ${options.length}); split payments is not active`,
    });
  } else if (options.length === 0) {
    messages.push({
      type: 'error',
      code: 'payment_failed',
      severity: 'recoverable',
      path: '$.payment.instruments',
      content: 'Submit at least one instrument',
    });
  }
  options.forEach((option, i) => {
    const handler = handlers.find((h) => h.id === option.handlerId);
    const problem = handler
      ? allowedBy(handler, option)
      : `handler_id "${option.handlerId}" is not offered for this checkout`;
    if (problem) {
      messages.push({
        type: 'error',
        code: 'payment_failed',
        severity: 'recoverable',
        path: `$.payment.instruments[${i}]`,
        content: `Instrument rejected: ${problem}`,
      });
    }
  });
  return messages;
}

/** Instrument as submitted on Complete Checkout; the opaque credential flows platform to business only. */
export function instrumentPayload(option: InstrumentOption, index: number): Record<string, unknown> {
  return {
    id: `instr_${index + 1}`,
    handler_id: option.handlerId,
    type: option.type,
    selected: true,
    ...(option.brand ? { display: { brand: option.brand, last_digits: '4242' } } : {}),
    credential: { type: option.credentialType, token: `tok_fixture_${option.key}_${index + 1}` },
  };
}

/** Instrument as a business echoes it back: display data only, never the credential. */
export function instrumentEcho(option: InstrumentOption, index: number): Record<string, unknown> {
  const { credential: _omit, ...rest } = instrumentPayload(option, index);
  return rest;
}
