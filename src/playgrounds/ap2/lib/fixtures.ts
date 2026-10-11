/**
 * Fixture merchants, catalog, instruments and PISP. All names are invented, all domains use the
 * reserved `.example` TLD, and no instrument refers to a real account.
 */
import type { Checkout, CheckoutLine, Item, Merchant, PaymentInstrument, Pisp } from './types';

export const CURRENCY = 'USD';
/** ISO 4217 minor-unit exponent for the fixture currency. */
export const CURRENCY_EXPONENT = 2;

export const MERCHANTS: Merchant[] = [
  { id: 'merchant_trailhead', name: 'Trailhead Outfitters', website: 'https://trailhead.example' },
  { id: 'merchant_harbor', name: 'Harbor Books', website: 'https://harbor-books.example' },
  { id: 'merchant_lumen', name: 'Lumen Electronics', website: 'https://lumen.example' },
];

/** Catalog per merchant id. Prices are integer minor units. */
export const CATALOG: Record<string, Item[]> = {
  merchant_trailhead: [
    { id: 'sku_trail_shoe_red_9', title: 'Trail runner, red, size 9', price: 12900 },
    { id: 'sku_trail_shoe_blue_9', title: 'Trail runner, blue, size 9', price: 13900 },
    { id: 'sku_wool_socks', title: 'Merino socks', price: 1800 },
    { id: 'sku_carbon_shoe_9', title: 'Carbon race shoe, size 9', price: 27500 },
  ],
  merchant_harbor: [
    { id: 'sku_atlas_book', title: 'Hardcover sea atlas', price: 4500 },
    { id: 'sku_trail_shoe_red_9', title: 'Trail runner, red, size 9 (resale)', price: 9900 },
  ],
  merchant_lumen: [
    { id: 'sku_headphones', title: 'Wireless headphones', price: 19900 },
    { id: 'sku_trail_shoe_red_9', title: 'Trail runner, red, size 9 (marketplace)', price: 11900 },
  ],
};

export const INSTRUMENTS: PaymentInstrument[] = [
  { id: 'pi_fixture_card_0000', type: 'card', description: 'Test card ending 0000' },
  { id: 'pi_fixture_upi_demo', type: 'UPI', description: 'Test UPI handle' },
];

export const PISPS: Pisp[] = [{ legal_name: 'Example Initiation Ltd', brand_name: 'ExampleInit', domain_name: 'pisp.example' }];

export const ISSUERS = {
  trustedSurface: 'https://agent-provider.example',
  merchantPaymentProcessor: 'https://mpp.example',
  credentialProvider: 'https://wallet.example',
} as const;

export function merchantById(id: string): Merchant | undefined {
  return MERCHANTS.find((m) => m.id === id);
}

export function itemFor(merchantId: string, sku: string): Item | undefined {
  return CATALOG[merchantId]?.find((i) => i.id === sku);
}

export interface CartLine {
  sku: string;
  quantity: number;
}

/** Build the illustrative Checkout object a merchant would sign (shape from the `checkout_mandate.md` example). */
export function buildCheckout(merchant: Merchant, lines: CartLine[], id: string): Checkout {
  const lineItems: CheckoutLine[] = [];
  lines.forEach((line, i) => {
    const item = itemFor(merchant.id, line.sku);
    if (!item || line.quantity <= 0) return;
    const amount = item.price * line.quantity;
    lineItems.push({
      id: `li_${i}`,
      item: { id: item.id, title: item.title, price: item.price },
      quantity: line.quantity,
      totals: [
        { type: 'subtotal', amount },
        { type: 'total', amount },
      ],
    });
  });
  const total = lineItems.reduce((s, l) => s + l.item.price * l.quantity, 0);
  return {
    id,
    merchant: { ...merchant },
    line_items: lineItems,
    status: 'incomplete',
    currency: CURRENCY,
    totals: [
      { type: 'subtotal', amount: total },
      { type: 'total', amount: total },
    ],
  };
}

export function checkoutTotal(checkout: Checkout): number {
  return checkout.totals.find((t) => t.type === 'total')?.amount ?? 0;
}

/** Format integer minor units for display, for example 12900 as "USD 129.00". */
export function formatMinor(amount: number, currency = CURRENCY, exponent = CURRENCY_EXPONENT): string {
  if (!Number.isFinite(amount)) return `${currency} ?`;
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const factor = 10 ** exponent;
  const major = Math.floor(abs / factor);
  const minor = Math.round(abs % factor);
  return `${currency} ${sign}${major}.${String(minor).padStart(exponent, '0')}`;
}
