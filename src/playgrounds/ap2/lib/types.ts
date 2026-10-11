/**
 * AP2 types. v0.2 names come from the JSON Schemas in `code/sdk/schemas/ap2/` at tag v0.2.0;
 * v0.1 names come from `src/ap2/types/mandate.py` and `payment_request.py` at tag v0.1.0.
 */
import type { Ap2Jwk } from './jws';

// ------------------------------------------------------------------ v0.2 identifiers

/** `vct` const values, including the numeric version suffix the verifier must match exactly. */
export const VCT = {
  checkout: 'mandate.checkout.1',
  checkoutOpen: 'mandate.checkout.open.1',
  payment: 'mandate.payment.1',
  paymentOpen: 'mandate.payment.open.1',
} as const;
export type Vct = (typeof VCT)[keyof typeof VCT];

/** Error codes from `docs/ap2/agent_authorization.md`, section "Errors". */
export const ERROR_CODES = ['invalid_credential', 'unresolved_constraint', 'invalid_mandate', 'mandates_not_supported'] as const;
export type Ap2ErrorCode = (typeof ERROR_CODES)[number];

/** Constraint `type` values defined in `open_checkout_mandate.json` and `open_payment_mandate.json`. */
export const CHECKOUT_CONSTRAINT_TYPES = ['checkout.allowed_merchants', 'checkout.line_items'] as const;
export const PAYMENT_CONSTRAINT_TYPES = [
  'payment.agent_recurrence',
  'payment.allowed_payees',
  'payment.allowed_payment_instruments',
  'payment.allowed_pisps',
  'payment.amount_range',
  'payment.budget',
  'payment.execution_date',
  'payment.reference',
] as const;

/** `frequency` enum of `payment.agent_recurrence`. */
export const FREQUENCIES = ['ON_DEMAND', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'] as const;
export type Frequency = (typeof FREQUENCIES)[number];

// ------------------------------------------------------------------ shared types (types/*.json)

export interface Merchant {
  id: string;
  name: string;
  website?: string;
}
export interface Amount {
  /** Integer minor units (ISO 4217). */
  amount: number;
  currency: string;
}
export interface PaymentInstrument {
  id: string;
  type: string;
  description?: string;
}
export interface Pisp {
  legal_name: string;
  brand_name: string;
  domain_name: string;
}
export interface Item {
  id: string;
  title: string;
  /** Unit price, integer minor units. */
  price: number;
  image_url?: string;
}
export type SdPlaceholder = { '...': string };

// ------------------------------------------------------------------ constraints

export interface AllowedMerchantsConstraint {
  type: 'checkout.allowed_merchants';
  allowed: (Merchant | SdPlaceholder)[];
}
export interface LineItemRequirement {
  id: string;
  acceptable_items: ({ id: string; title: string } | SdPlaceholder)[];
  quantity: number;
}
export interface LineItemsConstraint {
  type: 'checkout.line_items';
  items: LineItemRequirement[];
}
export interface AgentRecurrenceConstraint {
  type: 'payment.agent_recurrence';
  frequency: Frequency;
  max_occurrences?: number;
}
export interface AllowedPayeesConstraint {
  type: 'payment.allowed_payees';
  allowed: (Merchant | SdPlaceholder)[];
}
export interface AllowedPaymentInstrumentsConstraint {
  type: 'payment.allowed_payment_instruments';
  allowed: (PaymentInstrument | SdPlaceholder)[];
}
export interface AllowedPispsConstraint {
  type: 'payment.allowed_pisps';
  allowed: Pisp[];
}
export interface AmountRangeConstraint {
  type: 'payment.amount_range';
  currency: string;
  /** Schema: integer, minor units. The doc example writes 100.50. */
  max: number;
  min?: number;
}
export interface BudgetConstraint {
  type: 'payment.budget';
  /** Schema: number, unit not stated. The doc example writes 1000.00. */
  max: number;
  currency: string;
}
export interface ExecutionDateConstraint {
  type: 'payment.execution_date';
  not_before?: string;
  not_after?: string;
}
export interface PaymentReferenceConstraint {
  type: 'payment.reference';
  conditional_transaction_id: string;
}
/** Anything with a `type` the verifier does not know. */
export interface UnknownConstraint {
  type: string;
  [key: string]: unknown;
}

export type CheckoutConstraint = AllowedMerchantsConstraint | LineItemsConstraint;
export type PaymentConstraint =
  | AgentRecurrenceConstraint
  | AllowedPayeesConstraint
  | AllowedPaymentInstrumentsConstraint
  | AllowedPispsConstraint
  | AmountRangeConstraint
  | BudgetConstraint
  | ExecutionDateConstraint
  | PaymentReferenceConstraint;
export type AnyConstraint = CheckoutConstraint | PaymentConstraint | UnknownConstraint;

// ------------------------------------------------------------------ mandates (v0.2)

export interface Cnf {
  jwk: Ap2Jwk;
}

export interface OpenCheckoutMandate {
  vct: string;
  constraints: AnyConstraint[];
  cnf: Cnf;
  iat?: number;
  exp?: number;
}

export interface OpenPaymentMandate {
  vct: string;
  constraints: AnyConstraint[];
  cnf: Cnf;
  payee?: Merchant;
  payment_amount?: Amount;
  payment_instrument?: PaymentInstrument;
  pisp?: Pisp;
  execution_date?: string;
  risk_data?: Record<string, unknown>;
  iat?: number;
  exp?: number;
}

export interface CheckoutMandate {
  vct: string;
  checkout_jwt: string;
  checkout_hash: string;
  iat?: number;
  exp?: number;
}

export interface PaymentMandate {
  vct: string;
  transaction_id: string;
  payee: Merchant;
  pisp?: Pisp;
  payment_amount: Amount;
  payment_instrument: PaymentInstrument;
  execution_date?: string;
  risk_data?: Record<string, unknown>;
  iat?: number;
  exp?: number;
}

export type ReceiptStatus = 'Success' | 'Error';

export interface CheckoutReceipt {
  status: ReceiptStatus;
  iss: string;
  iat: number;
  reference: string;
  order_id?: string;
  error?: string;
  error_description?: string;
}

export interface PaymentReceipt {
  status: ReceiptStatus;
  iss: string;
  iat: number;
  reference: string;
  payment_id: string;
  psp_confirmation_id?: string;
  network_confirmation_id?: string;
  error?: string;
  error_description?: string;
}

/** Mandate Receipt as written in the prose of `agent_authorization.md` (note `result`, lower case). */
export interface ProseMandateReceipt {
  iss: string;
  result: 'success' | 'error';
  reference: string;
  error?: string;
  error_description?: string;
}

// ------------------------------------------------------------------ checkout object (illustrative)

/**
 * AP2 leaves the Checkout payload to the commerce protocol (a UCP Checkout object when used with UCP).
 * This shape follows the decoded `checkout_jwt` in the `checkout_mandate.md` example.
 */
export interface CheckoutLine {
  id: string;
  item: Item;
  quantity: number;
  totals: { type: 'subtotal' | 'total'; amount: number }[];
}
export interface Checkout {
  id: string;
  merchant: Merchant;
  line_items: CheckoutLine[];
  status: string;
  currency: string;
  totals: { type: 'subtotal' | 'total'; amount: number }[];
}

// ------------------------------------------------------------------ v0.1 (Pydantic models at v0.1.0)

export interface IntentMandateV01 {
  user_cart_confirmation_required: boolean;
  natural_language_description: string;
  merchants?: string[] | null;
  skus?: string[] | null;
  requires_refundability?: boolean | null;
  intent_expiry: string;
}
export interface PaymentCurrencyAmountV01 {
  currency: string;
  /** A float in major units (W3C Payment Request), unlike v0.2 integer minor units. */
  value: number;
}
export interface PaymentItemV01 {
  label: string;
  amount: PaymentCurrencyAmountV01;
  pending?: boolean | null;
  refund_period: number;
}
export interface PaymentRequestV01 {
  method_data: { supported_methods: string; data?: Record<string, unknown> }[];
  details: { id: string; display_items: PaymentItemV01[]; total: PaymentItemV01 };
}
export interface CartContentsV01 {
  id: string;
  user_cart_confirmation_required: boolean;
  payment_request: PaymentRequestV01;
  cart_expiry: string;
  merchant_name: string;
}
export interface CartMandateV01 {
  contents: CartContentsV01;
  merchant_authorization?: string | null;
}
export interface PaymentResponseV01 {
  request_id: string;
  method_name: string;
  details?: Record<string, unknown> | null;
}
export interface PaymentMandateContentsV01 {
  payment_mandate_id: string;
  payment_details_id: string;
  payment_details_total: PaymentItemV01;
  payment_response: PaymentResponseV01;
  merchant_agent: string;
  timestamp: string;
}
export interface PaymentMandateV01 {
  payment_mandate_contents: PaymentMandateContentsV01;
  user_authorization?: string | null;
}

/** Data keys used to carry v0.1 mandates in A2A messages. */
export const V01_DATA_KEYS = {
  intent: 'ap2.mandates.IntentMandate',
  cart: 'ap2.mandates.CartMandate',
  payment: 'ap2.mandates.PaymentMandate',
} as const;
