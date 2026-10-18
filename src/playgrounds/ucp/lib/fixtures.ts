// Fixture business, agent (platform) profiles, payment handlers and catalog. All hosts use the reserved
// `.example` TLD; no real business, credential provider or endpoint is involved.
import { SPEC_VERSION, type Entity, type Profile } from './types';

const V = SPEC_VERSION;
const OLD = '2026-04-08';

export const BUSINESS_HOST = 'juniper.example';
export const BUSINESS_PROFILE_URL = `https://${BUSINESS_HOST}/.well-known/ucp`;
export const LEAF_PROFILE_URL = `https://${BUSINESS_HOST}/.well-known/ucp/${OLD}`;
export const PLATFORM_PROFILE_URL = 'https://agent.example/.well-known/ucp';
export const REST_ENDPOINT = `https://${BUSINESS_HOST}/ucp/v1`;
export const MCP_ENDPOINT = `https://${BUSINESS_HOST}/ucp/mcp`;
export const A2A_ENDPOINT = `https://${BUSINESS_HOST}/.well-known/agent-card.json`;
/** UCP A2A extension URI pattern from the A2A binding: https://ucp.dev/{version}/specification/reference */
export const A2A_EXTENSION_URI = `https://ucp.dev/${V}/specification/reference`;

/** Documentation path (under /specification/) and schema path (under /schemas/) per release, from the docs tree. */
const PATHS: Record<string, Record<string, [string, string]>> = {
  [V]: {
    'dev.ucp.shopping.checkout': ['shopping/checkout', 'shopping/checkout.json'],
    'dev.ucp.shopping.cart': ['shopping/cart', 'shopping/cart.json'],
    'dev.ucp.shopping.order': ['shopping/order', 'shopping/order.json'],
    'dev.ucp.shopping.fulfillment': ['shopping/extensions/fulfillment', 'shopping/fulfillment.json'],
    'dev.ucp.shopping.discount': ['shopping/extensions/discount', 'shopping/discount.json'],
    'dev.ucp.common.loyalty': ['common/extensions/loyalty', 'common/loyalty.json'],
    'dev.ucp.common.payment.split_payments': ['payment/extensions/split-payments', 'common/payment_split_payments.json'],
    'dev.ucp.common.payment.ap2_mandate': ['payment/extensions/ap2-mandates', 'common/payment_ap2_mandate.json'],
  },
  [OLD]: {
    'dev.ucp.shopping.checkout': ['checkout', 'shopping/checkout.json'],
    'dev.ucp.shopping.order': ['order', 'shopping/order.json'],
    'dev.ucp.shopping.fulfillment': ['fulfillment', 'shopping/fulfillment.json'],
    'dev.ucp.shopping.ap2_mandate': ['ap2-mandates', 'shopping/ap2_mandate.json'],
  },
};

function core(name: string, extra: Partial<Entity> = {}, version = V): Entity {
  const paths = PATHS[version]?.[name];
  if (!paths) throw new Error(`No fixture paths for ${name} at ${version}`);
  return {
    version,
    spec: `https://ucp.dev/${version}/specification/${paths[0]}`,
    schema: `https://ucp.dev/${version}/schemas/${paths[1]}`,
    ...extra,
  };
}

/** Business profile served at /.well-known/ucp (current release). */
export const BUSINESS_PROFILE: Profile = {
  ucp: {
    version: V,
    supported_versions: { [OLD]: LEAF_PROFILE_URL },
    services: {
      'dev.ucp.shopping': [
        {
          version: V,
          spec: `https://ucp.dev/${V}/specification/overview/`,
          transport: 'rest',
          endpoint: REST_ENDPOINT,
          schema: `https://ucp.dev/${V}/services/shopping/rest.openapi.json`,
        },
        {
          version: V,
          spec: `https://ucp.dev/${V}/specification/overview/`,
          transport: 'mcp',
          endpoint: MCP_ENDPOINT,
          schema: `https://ucp.dev/${V}/services/shopping/mcp.openrpc.json`,
        },
        { version: V, spec: `https://ucp.dev/${V}/specification/overview/`, transport: 'a2a', endpoint: A2A_ENDPOINT },
      ],
    },
    capabilities: {
      'dev.ucp.shopping.checkout': [core('dev.ucp.shopping.checkout')],
      'dev.ucp.shopping.cart': [core('dev.ucp.shopping.cart')],
      'dev.ucp.shopping.order': [core('dev.ucp.shopping.order')],
      'dev.ucp.shopping.fulfillment': [
        core('dev.ucp.shopping.fulfillment', { extends: 'dev.ucp.shopping.checkout' }),
      ],
      'dev.ucp.shopping.discount': [
        core('dev.ucp.shopping.discount', {
          extends: ['dev.ucp.shopping.checkout', 'dev.ucp.shopping.cart'],
        }),
      ],
      'dev.ucp.common.loyalty': [
        core('dev.ucp.common.loyalty', {
          extends: ['dev.ucp.shopping.cart', 'dev.ucp.shopping.checkout'],
        }),
      ],
      'dev.ucp.common.payment.split_payments': [
        core('dev.ucp.common.payment.split_payments', {
          extends: 'dev.ucp.shopping.checkout',
          config: { allowed_combinations: [[{ types: ['card'], min: 1, max: 1 }, { types: ['gift_card'], max: 1 }]] },
        }),
      ],
      'dev.ucp.common.payment.ap2_mandate': [
        core('dev.ucp.common.payment.ap2_mandate', {
          extends: 'dev.ucp.shopping.checkout',
          config: { vp_formats_supported: { 'dc+sd-jwt': {} } },
        }),
      ],
      // Third-party extension: versions independently of ucp.version, two published versions.
      'example.juniper.shopping.gift_wrap': [
        {
          version: '2026-06-01',
          spec: 'https://juniper.example/ucp/specs/gift-wrap',
          schema: 'https://juniper.example/ucp/schemas/gift_wrap.json',
          extends: 'dev.ucp.shopping.fulfillment',
        },
        {
          version: '2026-09-15',
          spec: 'https://juniper.example/ucp/specs/gift-wrap',
          schema: 'https://juniper.example/ucp/schemas/gift_wrap.json',
          extends: 'dev.ucp.shopping.fulfillment',
        },
      ],
    },
    payment_handlers: {
      'com.example.processor_tokenizer': [
        {
          id: 'processor_tokenizer',
          version: '2026-07-01',
          spec: 'https://example.com/specs/payments/processor_tokenizer',
          schema: 'https://example.com/specs/payments/processor_tokenizer.json',
          available_instruments: [
            { type: 'card', constraints: { properties: { brand: { enum: ['visa', 'mastercard', 'amex'] } } } },
          ],
          config: { environment: 'sandbox', publishable_key: 'pk_fixture_juniper' },
        },
      ],
      'com.example.wallet': [
        {
          id: 'wallet_1',
          version: '2026-05-20',
          spec: 'https://example.com/specs/payments/wallet',
          schema: 'https://example.com/specs/payments/wallet.json',
          available_instruments: [{ type: 'card' }],
        },
      ],
      'com.example.installments': [
        {
          id: 'installments_1',
          version: '2026-03-02',
          spec: 'https://example.com/specs/payments/installments',
          schema: 'https://example.com/specs/payments/installments.json',
          available_instruments: [{ type: 'installments' }],
        },
      ],
      'com.example.gift_card': [
        {
          id: 'gift_card_1',
          version: '2026-02-10',
          spec: 'https://example.com/specs/payments/gift_card',
          schema: 'https://example.com/specs/payments/gift_card.json',
          available_instruments: [{ type: 'gift_card' }],
        },
      ],
    },
  },
  keys: [
    {
      kid: 'juniper_2026',
      kty: 'EC',
      crv: 'P-256',
      x: 'fixture-x-coordinate-not-a-real-key',
      y: 'fixture-y-coordinate-not-a-real-key',
      use: 'sig',
      alg: 'ES256',
    },
  ],
};

/** Leaf profile for the older release; leaf profiles describe one version and carry no supported_versions. */
export const LEAF_PROFILE_2026_04_08: Profile = {
  ucp: {
    version: OLD,
    services: {
      'dev.ucp.shopping': [
        {
          version: OLD,
          spec: `https://ucp.dev/${OLD}/specification/overview/`,
          transport: 'rest',
          endpoint: REST_ENDPOINT,
          schema: `https://ucp.dev/${OLD}/services/shopping/rest.openapi.json`,
        },
      ],
    },
    capabilities: {
      'dev.ucp.shopping.checkout': [core('dev.ucp.shopping.checkout', {}, OLD)],
      'dev.ucp.shopping.order': [core('dev.ucp.shopping.order', {}, OLD)],
      'dev.ucp.shopping.fulfillment': [
        core('dev.ucp.shopping.fulfillment', { extends: 'dev.ucp.shopping.checkout' }, OLD),
      ],
      // Before v2026-08-25 the AP2 extension lived under the shopping namespace.
      'dev.ucp.shopping.ap2_mandate': [
        core('dev.ucp.shopping.ap2_mandate', { extends: 'dev.ucp.shopping.checkout' }, OLD),
      ],
    },
    payment_handlers: BUSINESS_PROFILE.ucp.payment_handlers,
  },
};

/** Leaf profiles the simulated platform can "fetch", keyed by URI. */
export const LEAF_PROFILES: Record<string, Profile> = { [LEAF_PROFILE_URL]: LEAF_PROFILE_2026_04_08 };

/** Agent (platform) profile published at the URI it sends in UCP-Agent. */
export const PLATFORM_PROFILE: Profile = {
  ucp: {
    version: V,
    services: {
      'dev.ucp.shopping': [
        {
          version: V,
          spec: `https://ucp.dev/${V}/specification/overview/`,
          transport: 'rest',
          schema: `https://ucp.dev/${V}/services/shopping/rest.openapi.json`,
          endpoint: 'https://agent.example/ucp/v1',
        },
      ],
    },
    capabilities: {
      'dev.ucp.shopping.checkout': [core('dev.ucp.shopping.checkout')],
      'dev.ucp.shopping.order': [
        core('dev.ucp.shopping.order', {
          config: { webhook_url: 'https://agent.example/webhooks/ucp/orders' },
        }),
      ],
      'dev.ucp.shopping.fulfillment': [
        core('dev.ucp.shopping.fulfillment', { extends: 'dev.ucp.shopping.checkout' }),
      ],
      'dev.ucp.shopping.discount': [
        core('dev.ucp.shopping.discount', {
          extends: ['dev.ucp.shopping.checkout', 'dev.ucp.shopping.cart'],
        }),
      ],
      'dev.ucp.common.payment.split_payments': [
        core('dev.ucp.common.payment.split_payments', {
          extends: 'dev.ucp.shopping.checkout',
        }),
      ],
      'example.juniper.shopping.gift_wrap': [
        {
          version: '2026-06-01',
          spec: 'https://juniper.example/ucp/specs/gift-wrap',
          schema: 'https://juniper.example/ucp/schemas/gift_wrap.json',
          extends: 'dev.ucp.shopping.fulfillment',
        },
      ],
    },
    payment_handlers: {
      'com.example.processor_tokenizer': [
        {
          id: 'processor_tokenizer',
          version: '2026-07-01',
          spec: 'https://example.com/specs/payments/processor_tokenizer',
          schema: 'https://example.com/specs/payments/processor_tokenizer.json',
          available_instruments: [
            {
              type: 'card',
              constraints: { properties: { brand: { enum: ['visa', 'mastercard', 'amex', 'discover'] } } },
            },
          ],
        },
      ],
      'com.example.wallet': [
        {
          id: 'wallet_1',
          version: '2026-05-20',
          spec: 'https://example.com/specs/payments/wallet',
          schema: 'https://example.com/specs/payments/wallet.json',
          available_instruments: [{ type: 'card' }],
        },
      ],
      'com.example.installments': [
        {
          id: 'installments_1',
          version: '2026-03-02',
          spec: 'https://example.com/specs/payments/installments',
          schema: 'https://example.com/specs/payments/installments.json',
          available_instruments: [{ type: 'installments' }],
        },
      ],
      'com.example.gift_card': [
        {
          id: 'gift_card_1',
          version: '2026-02-10',
          spec: 'https://example.com/specs/payments/gift_card',
          schema: 'https://example.com/specs/payments/gift_card.json',
          available_instruments: [{ type: 'gift_card' }],
        },
      ],
    },
  },
  keys: [
    {
      kid: 'agent_2026',
      kty: 'EC',
      crv: 'P-256',
      x: 'fixture-x-coordinate-not-a-real-key',
      y: 'fixture-y-coordinate-not-a-real-key',
      use: 'sig',
      alg: 'ES256',
    },
  ],
};

export interface CatalogItem {
  id: string;
  title: string;
  /** Unit price in minor units (USD cents). */
  price: number;
  /** Fixture flag used for handler filtering (installments are not offered on subscriptions). */
  subscription?: boolean;
}

export const CATALOG: readonly CatalogItem[] = [
  { id: 'sku_trail_mug', title: 'Enamel trail mug', price: 1800 },
  { id: 'sku_canvas_tote', title: 'Waxed canvas tote', price: 6400 },
  { id: 'sku_camp_stove', title: 'Titanium camp stove', price: 42000 },
  { id: 'sku_coffee_club', title: 'Coffee club, monthly subscription', price: 2200, subscription: true },
];

/** Fixture tax rate (basis points) applied by the simulated business. */
export const TAX_BPS = 800;
/** Default checkout TTL from checkout.json: 6 hours from creation. */
export const DEFAULT_TTL_MS = 6 * 60 * 60 * 1000;

/** Fixture rules the simulated business applies when it filters handlers by cart context. */
export const HANDLER_CART_RULES: Record<string, { excludeForSubscription?: boolean }> = {
  'com.example.installments': { excludeForSubscription: true },
};

/** Instruments the simulated agent can submit (credential types are defined by the fixture handlers). */
export interface InstrumentOption {
  key: string;
  label: string;
  handlerName: string;
  handlerId: string;
  type: string;
  brand?: string;
  credentialType: string;
}

export const INSTRUMENT_OPTIONS: readonly InstrumentOption[] = [
  {
    key: 'visa',
    label: 'Visa card, tokenized by processor_tokenizer',
    handlerName: 'com.example.processor_tokenizer',
    handlerId: 'processor_tokenizer',
    type: 'card',
    brand: 'visa',
    credentialType: 'processor_token',
  },
  {
    key: 'discover',
    label: 'Discover card, tokenized by processor_tokenizer',
    handlerName: 'com.example.processor_tokenizer',
    handlerId: 'processor_tokenizer',
    type: 'card',
    brand: 'discover',
    credentialType: 'processor_token',
  },
  {
    key: 'wallet',
    label: 'Card from the fixture wallet',
    handlerName: 'com.example.wallet',
    handlerId: 'wallet_1',
    type: 'card',
    brand: 'mastercard',
    credentialType: 'wallet_token',
  },
  {
    key: 'installments',
    label: 'Installment plan',
    handlerName: 'com.example.installments',
    handlerId: 'installments_1',
    type: 'installments',
    credentialType: 'installments_token',
  },
  {
    key: 'gift_card',
    label: 'Gift card',
    handlerName: 'com.example.gift_card',
    handlerId: 'gift_card_1',
    type: 'gift_card',
    credentialType: 'gift_card_token',
  },
];
