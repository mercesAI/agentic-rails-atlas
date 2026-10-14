// Fixture merchant, catalog, handlers and tokens. Every identifier here is made up; field names come from
// the 2025-09-29 and 2026-04-17 JSON Schema and OpenAPI files in research/vendor/acp/spec.

export const MERCHANT_ORIGIN = 'https://juniper-goods.example';
export const API_BASE_URL = 'https://juniper-goods.example/acp';
export const MERCHANT_ID = 'merchant_fixture_juniper';
export const OTHER_MERCHANT_ID = 'merchant_fixture_other';
export const API_KEY_FIXTURE = 'api_key_fixture_123';
export const USER_AGENT_FIXTURE = 'AgentFixture/1.0';

/** 2026-10-11T12:00:00Z, the simulated clock start. */
export const T0 = Date.UTC(2026, 9, 11, 12, 0, 0);
/** Fixture session lifetime used to fill `expires_at` (2026-04-17 only). */
export const SESSION_TTL_MS = 30 * 60 * 1000;
/** Fixture allowance lifetime used to fill `allowance.expires_at`. */
export const ALLOWANCE_TTL_MS = 15 * 60 * 1000;

export interface CatalogItem {
  id: string;
  name: string;
  unit_amount: number;
}

export const CATALOG: readonly CatalogItem[] = [
  { id: 'item_trail_mug', name: 'Trail mug', unit_amount: 1800 },
  { id: 'item_wool_socks', name: 'Wool socks', unit_amount: 1200 },
  { id: 'item_sold_out_print', name: 'Sold-out print', unit_amount: 4000 },
];
/** Fixture rule: this item is out of stock, so a session holding it gets an out_of_stock error message. */
export const SOLD_OUT_ITEM_ID = 'item_sold_out_print';

export const SHIPPING = { id: 'ship_standard', title: 'Standard shipping', amount: 500 };
export const TAX_RATE = 0.08;

export const BUYER = {
  first_name: 'Sam',
  last_name: 'Rivera',
  email: 'sam@buyer.example',
};

export const ADDRESS = {
  name: 'Sam Rivera',
  line_one: '1 Example Way',
  city: 'Springfield',
  state: 'CA',
  country: 'US',
  postal_code: '90000',
};

export type Address = typeof ADDRESS;

/** Fixture credential tokens. Never a card number. */
export const SPT_FIXTURE = 'spt_fixture_0001';
export const VAULT_TOKEN_FIXTURE = 'vt_fixture_0001';
export const NETWORK_TOKEN_FIXTURE = 'fixture_network_token_not_a_card';

/** PaymentHandler objects (2026-04-17). Names use the reverse-DNS names seen in the ACP repository, plus one vendor fixture. */
export interface PaymentHandler {
  id: string;
  name: string;
  display_name?: string;
  version: string;
  spec: string;
  requires_delegate_payment: boolean;
  requires_pci_compliance: boolean;
  psp: string;
  config_schema: string;
  instrument_schemas: string[];
  config: Record<string, unknown>;
  display_order?: number;
}

export const HANDLERS: readonly PaymentHandler[] = [
  {
    id: 'card_tokenized',
    name: 'dev.acp.tokenized.card',
    display_name: 'Card',
    version: '2026-01-22',
    spec: 'https://handlers.example/tokenized.card',
    requires_delegate_payment: true,
    requires_pci_compliance: false,
    psp: 'psp_fixture',
    config_schema: 'https://handlers.example/tokenized.card/config.json',
    instrument_schemas: ['https://handlers.example/tokenized.card/instrument.json'],
    config: { merchant_id: MERCHANT_ID, accepted_brands: ['visa', 'mastercard'] },
    display_order: 1,
  },
  {
    id: 'seller_saved_card',
    name: 'dev.acp.seller_backed.saved_card',
    display_name: 'Saved card ending 0005',
    version: '2026-02-05',
    spec: 'https://handlers.example/seller_backed/saved_card',
    requires_delegate_payment: true,
    requires_pci_compliance: false,
    psp: 'seller_managed',
    config_schema: 'https://handlers.example/seller_backed/saved_card/config.json',
    instrument_schemas: ['https://handlers.example/seller_backed/saved_card/instrument.json'],
    config: { merchant_id: MERCHANT_ID, payment_method_id: 'pm_fixture_saved' },
    display_order: 0,
  },
  {
    id: 'bank_fixture',
    name: 'com.example.bank_transfer',
    display_name: 'Bank transfer',
    version: '2026-03-01',
    spec: 'https://handlers.example/bank_transfer',
    requires_delegate_payment: false,
    requires_pci_compliance: false,
    psp: 'psp_fixture',
    config_schema: 'https://handlers.example/bank_transfer/config.json',
    instrument_schemas: ['https://handlers.example/bank_transfer/instrument.json'],
    config: {},
    display_order: 2,
  },
];

/** DiscoveryResponse served at /.well-known/acp.json (2026-04-17). */
export interface DiscoveryDoc {
  protocol: { name: 'acp'; version: string; supported_versions: string[]; documentation_url?: string };
  api_base_url: string;
  transports: ('rest' | 'mcp')[];
  capabilities: {
    services: ('checkout' | 'orders' | 'delegate_payment' | 'carts')[];
    intervention_types?: ('3ds' | 'biometric' | 'address_verification')[];
    supported_currencies?: string[];
    supported_locales?: string[];
  };
}

export const DISCOVERY: DiscoveryDoc = {
  protocol: { name: 'acp', version: '2026-04-17', supported_versions: ['2025-09-29', '2026-01-30', '2026-04-17'] },
  api_base_url: API_BASE_URL,
  transports: ['rest'],
  capabilities: {
    services: ['checkout', 'orders', 'delegate_payment'],
    intervention_types: ['3ds', 'address_verification'],
    supported_currencies: ['usd'],
    supported_locales: ['en-US'],
  },
};

export function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}
