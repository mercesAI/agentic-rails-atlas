/**
 * x402 message builders for V1 and V2. Field names follow:
 * - V2: specs/x402-specification-v2.md sections 5.1 to 5.4 and 7, specs/transports-v2/http.md
 * - V1: specs/x402-specification-v1.md sections 5.1 to 5.3 and 7, specs/transports-v1/http.md
 * - upto extra.facilitatorAddress: specs/schemes/upto/scheme_upto_evm.md
 */
import { encodeHeader, toJson } from './base64';
import {
  FIXTURE_FACILITATOR,
  FIXTURE_HOST,
  FIXTURE_PATH,
  FIXTURE_RESOURCE,
  FIXTURE_TOKEN,
  MAX_TIMEOUT_SECONDS,
  networkFor,
  type PaymentFlow,
  type Scheme,
  type Version,
} from './fixtures';

export interface ResourceInfo {
  url: string;
  description?: string;
  mimeType?: string;
}

export interface RequirementsV2 {
  scheme: string;
  network: string;
  amount: string;
  asset: string;
  payTo: string;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

export interface RequirementsV1 {
  scheme: string;
  network: string;
  maxAmountRequired: string;
  asset: string;
  payTo: string;
  resource: string;
  description: string;
  mimeType?: string;
  outputSchema?: null;
  maxTimeoutSeconds: number;
  extra?: Record<string, unknown>;
}

export type Requirements = RequirementsV1 | RequirementsV2;

export interface PaymentRequiredV2 {
  x402Version: 2;
  error?: string;
  resource: ResourceInfo;
  accepts: RequirementsV2[];
  extensions?: Record<string, unknown>;
}

export interface PaymentRequiredV1 {
  x402Version: 1;
  error: string;
  accepts: RequirementsV1[];
}

export type PaymentRequired = PaymentRequiredV1 | PaymentRequiredV2;

export interface PaymentPayloadV2 {
  x402Version: 2;
  resource?: ResourceInfo;
  accepted: RequirementsV2;
  payload: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

export interface PaymentPayloadV1 {
  x402Version: 1;
  scheme: string;
  network: string;
  payload: Record<string, unknown>;
}

export type PaymentPayload = PaymentPayloadV1 | PaymentPayloadV2;

export interface VerifyResponse {
  isValid: boolean;
  invalidReason?: string;
  payer?: string;
}

export interface SettleResponse {
  success: boolean;
  errorReason?: string;
  payer?: string;
  transaction: string;
  network: string;
  amount?: string;
}

/** Header names per version (transports-v2/http.md "Header Summary"; transports-v1/http.md). */
export const HEADERS = {
  2: { required: 'PAYMENT-REQUIRED', signature: 'PAYMENT-SIGNATURE', response: 'PAYMENT-RESPONSE' },
  1: { required: null, signature: 'X-PAYMENT', response: 'X-PAYMENT-RESPONSE' },
} as const;

/** Default `error` text of the first 402 (spec v2 section 5.1.1 and spec v1 section 5.1.1 examples). */
export function missingHeaderError(version: Version): string {
  return `${HEADERS[version].signature} header is required`;
}

/** The amount field: `amount` in V2, `maxAmountRequired` in V1. */
export function amountOf(req: Requirements): string {
  return 'maxAmountRequired' in req ? req.maxAmountRequired : req.amount;
}

export interface RequirementOptions {
  version: Version;
  scheme: Scheme;
  flow: PaymentFlow;
  amount: string;
  payTo: string;
}

/** Build one accepts[] entry. */
export function buildRequirements(o: RequirementOptions): Requirements {
  const extra: Record<string, unknown> = { name: FIXTURE_TOKEN.name, version: FIXTURE_TOKEN.version };
  if (o.version === 1) {
    return {
      scheme: 'exact',
      network: networkFor(1),
      maxAmountRequired: o.amount,
      asset: FIXTURE_TOKEN.address,
      payTo: o.payTo,
      resource: FIXTURE_RESOURCE.url,
      description: FIXTURE_RESOURCE.description,
      mimeType: FIXTURE_RESOURCE.mimeType,
      outputSchema: null,
      maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
      extra,
    };
  }
  if (o.scheme === 'upto') extra.facilitatorAddress = FIXTURE_FACILITATOR;
  // Section 6.1: paymentFlow MUST be present when the resolved flow is not authorization.
  if (o.flow !== 'authorization') extra.paymentFlow = o.flow;
  return {
    scheme: o.scheme,
    network: networkFor(2),
    amount: o.amount,
    asset: FIXTURE_TOKEN.address,
    payTo: o.payTo,
    maxTimeoutSeconds: MAX_TIMEOUT_SECONDS,
    extra,
  };
}

export function buildPaymentRequired(req: Requirements, error?: string): PaymentRequired {
  if ('maxAmountRequired' in req) {
    return { x402Version: 1, error: error ?? missingHeaderError(1), accepts: [req] };
  }
  return {
    x402Version: 2,
    error: error ?? missingHeaderError(2),
    resource: { ...FIXTURE_RESOURCE },
    accepts: [req],
    extensions: {},
  };
}

export function buildPaymentPayload(req: Requirements, schemePayload: Record<string, unknown>): PaymentPayload {
  if ('maxAmountRequired' in req) {
    return { x402Version: 1, scheme: req.scheme, network: req.network, payload: schemePayload };
  }
  return { x402Version: 2, resource: { ...FIXTURE_RESOURCE }, accepted: req, payload: schemePayload, extensions: {} };
}

/** Body of POST /verify and POST /settle (spec section 7.1; settle uses the same structure). */
export function buildFacilitatorRequest(payload: PaymentPayload, requirements: Requirements) {
  return { x402Version: payload.x402Version, paymentPayload: payload, paymentRequirements: requirements };
}

const STATUS_TEXT: Record<number, string> = {
  200: 'OK',
  400: 'Bad Request',
  402: 'Payment Required',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
};

export function renderHttpRequest(opts: {
  method?: string;
  path?: string;
  headers?: [string, string][];
}): string {
  const lines = [`${opts.method ?? 'GET'} ${opts.path ?? FIXTURE_PATH} HTTP/1.1`, `Host: ${FIXTURE_HOST}`];
  for (const [k, v] of opts.headers ?? []) lines.push(`${k}: ${v}`);
  return lines.join('\n');
}

export function renderHttpResponse(opts: { status: number; headers?: [string, string][]; body?: unknown }): string {
  const lines = [`HTTP/1.1 ${opts.status} ${STATUS_TEXT[opts.status] ?? ''}`.trimEnd()];
  for (const [k, v] of opts.headers ?? []) lines.push(`${k}: ${v}`);
  if (opts.body !== undefined) {
    lines.push('', typeof opts.body === 'string' ? opts.body : toJson(opts.body, 2));
  }
  return lines.join('\n');
}

export function renderFacilitatorCall(endpoint: '/verify' | '/settle', body: unknown): string {
  return [`POST ${endpoint} HTTP/1.1`, 'Host: facilitator.example', 'Content-Type: application/json', '', toJson(body, 2)].join(
    '\n',
  );
}

/** The 402 response for a version: V2 puts PaymentRequired in a base64 header, V1 in the JSON body. */
export function render402(pr: PaymentRequired): { text: string; header?: { name: string; value: string; decoded: unknown } } {
  if (pr.x402Version === 1) {
    return { text: renderHttpResponse({ status: 402, headers: [['Content-Type', 'application/json']], body: pr }) };
  }
  const value = encodeHeader(pr);
  return {
    text: renderHttpResponse({
      status: 402,
      headers: [
        ['Content-Type', 'application/json'],
        ['PAYMENT-REQUIRED', value],
      ],
      body: '{}',
    }),
    header: { name: 'PAYMENT-REQUIRED', value, decoded: pr },
  };
}

/** Retry request carrying the payment header. */
export function renderPaidRequest(payload: PaymentPayload): { text: string; header: { name: string; value: string; decoded: unknown } } {
  const name = HEADERS[payload.x402Version].signature;
  const value = encodeHeader(payload);
  return { text: renderHttpRequest({ headers: [[name, value]] }), header: { name, value, decoded: payload } };
}

/** Final response carrying the settlement result header. */
export function renderSettledResponse(
  version: Version,
  status: number,
  settle: SettleResponse,
  body: unknown,
): { text: string; header: { name: string; value: string; decoded: unknown } } {
  const name = HEADERS[version].response;
  const value = encodeHeader(settle);
  return {
    text: renderHttpResponse({
      status,
      headers: [
        ['Content-Type', 'application/json'],
        [name, value],
      ],
      body,
    }),
    header: { name, value, decoded: settle },
  };
}
