# OpenAI ACP (Agentic Commerce Protocol) research dossier

Slug: `openai-acp`. Research date (accessed date for everything below): 2026-10-11. US spelling. Dates are YYYY-MM-DD.

Repositories read (all under `research/vendor/`):

| Repo | Remote | Commit read | Version read |
| --- | --- | --- | --- |
| `acp` | https://github.com/agentic-commerce-protocol/agentic-commerce-protocol | `7fdd78df677a94dce04c770644b0fbbb1401272b` (2026-07-17 21:51:51 -0700, "SEP: Optional product URL on checkout Item (#281)"; shallow clone, 1 commit) | spec folders `2025-09-29`, `2025-12-12`, `2026-01-16`, `2026-01-30`, `2026-04-17` (latest dated snapshot), `unreleased` |

Source ids in brackets refer to `openai-acp.sources.json`. This is the Agentic Commerce Protocol from OpenAI and Stripe. It is not the IBM Agent Communication Protocol, not the Virtuals Agent Commerce Protocol and not the Agent Client Protocol (see "Disambiguation" under Criticisms).

## Identity and governance

- **What it is.** The repository README describes ACP as "an interaction model and open standard" that connects buyers, their AI agents and businesses to complete purchases. The README says the specification is maintained by OpenAI and Stripe and is in `beta`; the status badge reads "Beta" [src-openai-acp-readme]. The core RFCs carry `**Status:** Draft` (`rfc.agentic_checkout.md`, `rfc.delegate_payment.md`, `rfc.payment_handlers.md`, `rfc.extensions.md`, `rfc.orders.md`, `rfc.delegate_authentication.md`, `rfc.discount_extension.md`, `rfc.seller_backed_payment_handler.md`); newer RFCs carry `**Status:** Proposal` (`rfc.capability_negotiation.md`, `rfc.cart.md`, `rfc.discovery.md`, `rfc.product_feeds.md`, `rfc.intent_traces.md`, `rfc.affiliate_attribution.md`, `rfc.marketing_consent.md`) [src-openai-acp-rfc-checkout] [src-openai-acp-rfcs-dir].
- **Who.** The README badge reads "Maintained by OpenAI & Stripe". `MAINTAINERS.md` lists three lead maintainers: OpenAI, Stripe and Meta (Meta was added by PR #236, "ADMIN: Add Meta as TSC member", committed 2026-04-24) [src-openai-acp-maintainers] [src-openai-acp-gh-commits].
- **Repository.** GitHub `agentic-commerce-protocol/agentic-commerce-protocol`, created 2025-09-29T04:09:29Z, the same day as the "Initial commit" and the ChatGPT Instant Checkout launch. Homepage `https://agenticcommerce.dev`. On 2026-10-11 the repository had 1,570 stars and 253 forks; the last push was 2026-07-18T04:51:51Z (commit `7fdd78d`, 2026-07-17 Pacific time) [src-openai-acp-gh-repo].
- **No GitHub releases or tags.** The GitHub API returns zero releases and zero tags. Versions are dated folders under `spec/` and changelog files, not Git tags. "Latest release" therefore means the newest dated folder, `spec/2026-04-17/`, promoted by PR #227 "RELEASE: 2026-04-17" (commit 2026-04-17) [src-openai-acp-gh-commits] [src-openai-acp-changelog-20260417].
- **License.** `LICENSE` is Apache License 2.0. `NOTICE` reads "Copyright 2025 OpenAI" and "Copyright 2025 Stripe" [src-openai-acp-license].
- **CLA and legal basis.** Contributions require a CLA. `legal/cla/SIGNATORIES.md` cites Section 2.4 of a "Collaboration and Governance Agreement dated November 21, 2025" and was last updated 2026-06-03. Corporate signatories with signing dates: Stripe, Inc. (2025-11-21), OpenAI LLC (2025-11-21), Adyen N.V. (2026-01-28), Wix.com Ltd. (2026-02-19), commercetools Inc. (2026-02-19), OpenCommerce Network Inc. (2026-02-26; its authorized users include a `nekuda-ai` account), Affirm Inc. (2026-03-09), Meta Platforms, Inc. (2026-03-19), Agentic Commerce Inc. (Catalog) (2026-03-30), PayPal, Inc. (2026-04-16) [src-openai-acp-cla-signatories]. The seed listed "nekuda"; the file names the corporation "OpenCommerce Network Inc.", so nekuda's link is through a GitHub user name only.
- **Governance model.** `docs/governance.md` was first added by PR #43 (2025-12-02) and replaced by PR #173 "ADMIN: Revised governance model" on 2026-03-10 [src-openai-acp-governance] [src-openai-acp-gh-commits]. It defines:
  - a Technical Steering Committee (TSC) of up to 7 seats, one organization per seat, appointed by the Founding Maintainers (OpenAI and Stripe) on criteria of shared vision, contributions and time commitment, reviewed quarterly;
  - current TSC: seat 1 OpenAI (`aravindrao-openai`), seat 2 Stripe (`prasad-stripe`), seat 3 Meta (`lhwa`);
  - Specification Enhancement Proposals (SEPs) for major and process changes: a TSC sponsor, a mandatory 7-business-day public review spanning at least one weekly meeting, and a simple majority (50%+1) TSC vote; standard PRs need two TSC approvals (one may come from a recognized Domain Working Group member);
  - Domain Working Groups (DWGs), recognized by TSC simple majority when members come from at least two organizations;
  - a Founding Maintainers' reserve veto, limited to SEPs, usable only to block (never to force) a change, with a written explanation;
  - a stated long-term goal of moving to a neutral foundation "similar to" the Linux Foundation or OpenJS Foundation, with four preconditions. No foundation exists today.
- **No membership fees.** The governance FAQ says there are no fees for the TSC or DWGs [src-openai-acp-governance].
- **Operating model.** `docs/operating-model.md`: a weekly 30-minute Thursday TSC meeting, a weekly triage rotation by seat order with a 2-business-day initial response target, Discord and GitHub as channels [src-openai-acp-operating-model].
- **Mission.** `docs/principles-mission.md` lists principles including trust, security and compliance; real-world use; and being open and neutral (agnostic to agents, PSPs, sellers, transports and payment methods) [src-openai-acp-principles].
- **Launch.** OpenAI announced Instant Checkout in ChatGPT and the open-sourced ACP on 2025-09-29 ("Buy it in ChatGPT") [src-openai-buy-it]. Stripe announced the same day that it co-developed ACP and launched Shared Payment Tokens [src-stripe-acp-launch].

## Versions and changelog

ACP uses date-based versions (`YYYY-MM-DD`). The client sends the version in the `API-Version` request header (REQUIRED), and the server validates it [src-openai-acp-readme] [src-openai-acp-rfc-checkout]. Each dated folder under `spec/` is a full snapshot; `spec/unreleased/` holds work in progress. There are no Git tags or GitHub releases [src-openai-acp-gh-repo].

| Version | Promoted | Main content (from the changelog file) | Source |
| --- | --- | --- | --- |
| `2025-09-29` | "Initial commit" 2025-09-29 | Initial release: Agentic Checkout (RFC, OpenAPI, JSON Schema) and Delegate Payment; examples | [src-openai-acp-changelog-20250929] |
| `2025-12-12` | folder created by PR #81 "setup yyyy-mm-dd versioning", 2026-01-22 | Breaking: `fulfillment_address` renamed to `fulfillment_details`; `fulfillment_option_id` replaced by `selected_fulfillment_options[]`; `subtotal` and `tax` optional on fulfillment options. Added `Total.description`, `return_policy` link type, line item display fields, intent traces on cancel, affiliate attribution. Based on "learnings from URBN and Etsy adapter implementations". `2025-09-29` marked deprecated | [src-openai-acp-changelog-20251212] |
| `2026-01-16` | changelog committed 2026-02-06 (PR #80, SEP #79) | Authentication provider model (merchant names its 3DS provider): `AuthenticationProvider`, `authentication_provider` on the session, required `merchant_id` on `PaymentProvider`, `adyen` added to provider enums | [src-openai-acp-changelog-20260116] |
| `2026-01-30` | PR #94 "[admin] Release 2026-01-30", 2026-01-31 | Capability negotiation (`capabilities` object, intersection semantics); Payment Handlers framework (breaking: `payment_provider.supported_payment_methods` replaced by `capabilities.payment.handlers`; new `payment_data` shape); Extensions framework; Discount extension. Says "Previous version `2026-01-22` deprecated", a version that has no folder | [src-openai-acp-changelog-20260130] |
| `2026-04-17` | PR #227 "RELEASE: 2026-04-17", 2026-04-17 | Promotes all unreleased changes since 2026-01-30: Cart, Feed API (push), Delegate Authentication (3DS2), discovery at `/.well-known/acp.json`, MCP binding (5 tools, OpenRPC), mandatory `Idempotency-Key` on all POSTs with `Idempotent-Replayed`, `supported_versions` on version errors, `resolution` on messages, native Orders (line items, fulfillments, adjustments), marketing consent, seller-backed handlers, payment handler `display_order` and `display_name`, CommonMark rules for markdown content, `iin` max length 8, empty `risk_signals` allowed, webhook `Merchant-Signature` format with 300-second tolerance. `2026-01-30` marked deprecated | [src-openai-acp-changelog-20260417] |
| `unreleased` | open | After 2026-04-17: Meta TSC seat; Order schema post-checkout alignment (SEP, PR #232, 2026-05-01); suggested pricing on create (SEP #197); `fulfillment_details` on complete (SEP #196); feed `feed_update_id` (SEP #259); optional product `url` on checkout `Item` (SEP #280, PR #281, 2026-07-17); several example and description fixes | [src-openai-acp-unreleased-dir] [src-openai-acp-gh-commits] |

- **Last activity.** The last commit on `main` is `7fdd78d` "SEP: Optional product URL on checkout Item (#281)", committed 2026-07-18T04:51:51Z (2026-07-17 local time). Between the 2026-04-17 release and that commit, 18 commits were merged (2026-04-24 to 2026-07-18). No commit landed between 2026-07-18 and 2026-10-11, so the repository was quiet for almost three months when this dossier was written [src-openai-acp-gh-commits].
- **Released snapshots are edited after release.** The folder `spec/2026-01-30/json-schema/schema.agentic_checkout.json` changed six times after its release commit (2026-02-05 to 2026-02-13), and `spec/2026-04-17/` changed on 2026-05-01 (PR #232, order schema) and 2026-06-15 (PR #266, error examples). A dated version is therefore not frozen [src-openai-acp-gh-commits].
- **Decimal quantity oddity.** The 2026-04-17 changelog describes a breaking change of `Item.quantity` from `integer` to `number` "to support B2B commerce" and says it was applied to `spec/2025-09-29/`. At commit 7fdd78d, only the 2025-09-29 JSON Schema types `Item.quantity` as `number` with `exclusiveMinimum`; 2025-12-12 and 2026-01-16 keep `integer` (minimum 1), and from 2026-01-30 on `Item` has no `quantity` field at all [src-openai-acp-changelog-20260417] [src-openai-acp-schema-checkout-20250929] [src-openai-acp-schema-checkout-20260417].
- **RFC version labels lag.** `rfc.agentic_checkout.md` still says `**Version:** 2026-01-16` and uses `API-Version: 2026-01-16` in its header list; `rfc.payment_handlers.md` says `2026-01-22`; `rfc.discovery.md` and `rfc.product_feeds.md` say `unreleased`, although the features shipped in 2026-04-17 [src-openai-acp-rfc-checkout] [src-openai-acp-rfc-payment-handlers] [src-openai-acp-rfc-discovery] [src-openai-acp-rfc-product-feeds].
- **Package version.** `package.json` names the package `@agentic-commerce-protocol/specification` at version `0.1.0`, with only validation scripts (ajv). It is not published on npm (registry returns 404 on 2026-10-11) [src-openai-acp-package-json] [src-openai-acp-npm-404].

## Actors and roles

| Role | Who in the files | Responsibilities | Source |
| --- | --- | --- | --- |
| Buyer | The person shopping in an AI surface | Confirms each step; selects or adds a payment credential; grants permission to start checkout | [src-stripe-acp-blog] [src-openai-buy-it] |
| Agent (client, "application") | ChatGPT in the RFC text ("sent by ChatGPT unless noted"); generally any AI surface | Calls the merchant's checkout endpoints, renders the authoritative cart, collects buyer, fulfillment and payment data, calls Delegate Payment, hosts the order webhook receiver (`/agentic_checkout/webhooks/order_events`) and, since 2026-04-17, hosts the Feed API | [src-openai-acp-rfc-checkout] [src-openai-acp-openapi-webhook-20260417] [src-openai-acp-openapi-feed-20260417] |
| Merchant (seller, business) | Hosts the REST API (`/checkout_sessions...`), optional cart endpoints and `/.well-known/acp.json` | System of record for orders, payments, taxes and compliance; merchant of record; accepts or declines each order; charges through its own PSP; handles refunds and chargebacks; emits signed order webhooks | [src-openai-acp-rfc-checkout] [src-openai-commerce-docs] |
| PSP or vault (Delegate Payment server) | Stripe (first compatible implementation), other PSPs, or a PCI DSS Level 1 merchant with its own vault | Hosts `POST /agentic_commerce/delegate_payment`, stores the credential, returns a vault token usable only within the Allowance | [src-openai-acp-rfc-delegate-payment] [src-openai-commerce-docs] [src-openai-apps-monetization] |
| Authentication provider | A merchant-specified 3DS provider (`authentication_provider`, from 2026-01-16; `adyen` added to the enum) | Hosts `/delegate_authentication` endpoints for 3DS2 fingerprint and challenge flows | [src-openai-acp-changelog-20260116] [src-openai-acp-rfc-delegate-auth] |
| Seller platform | For example `https://acp.stripe.com` in the discovery RFC example | Hosts ACP endpoints and the discovery document on behalf of many sellers | [src-openai-acp-rfc-discovery] |
| Affiliate provider | `affiliate_attribution.provider` (example `impact.com`) | Receives first-touch or last-touch attribution data passed by the agent | [src-openai-acp-openapi-checkout-20260417] |

- **OpenAI is not the merchant of record.** OpenAI's docs say neither OpenAI nor the PSPs are the merchant of record; customers see the merchant's name on the card statement, and the merchant handles refunds and chargebacks [src-openai-commerce-docs]. The ACP README tells agents they can embed commerce "without being the merchant of record" [src-openai-acp-readme]. Stripe's blog says the business "is the merchant of record" [src-stripe-acp-blog].
- **Stripe's SPT is not part of the spec.** The spec defines a generic Delegate Payment endpoint and a credential `type` string; `spt` appears only as an example credential type. Stripe's Shared Payment Token is described by OpenAI as "the first Delegated Payment Spec-compatible implementation" [src-openai-commerce-docs] [src-openai-acp-schema-checkout-20260417].

## Core objects with exact field names

All tables below are generated from the 2026-04-17 JSON Schema files at commit 7fdd78d (field names copied from the schema, meanings paraphrased). Abbreviations for the "File" column: **AC** = `spec/2026-04-17/json-schema/schema.agentic_checkout.json` [src-openai-acp-schema-checkout-20260417]; **DP** = `spec/2026-04-17/json-schema/schema.delegate_payment.json` [src-openai-acp-schema-delegate-payment-20260417]; **CA** = `schema.cart.json` [src-openai-acp-schema-cart-20260417]; **FE** = `schema.feed.json` [src-openai-acp-schema-feed-20260417]; **DA** = `schema.delegate_authentication.json` [src-openai-acp-schema-delegate-auth-20260417]. All money amounts are integers in minor units.

### CheckoutSession (`CheckoutSessionBase`, AC)

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `id` | string | yes | Session id |
| `protocol` | `ProtocolVersion` (`version`) | no | Protocol version metadata |
| `capabilities` | `Capabilities` | yes | Negotiated capabilities (`payment.handlers`, `interventions`, `extensions`) |
| `buyer` | `Buyer` | no | Buyer info; `email` is the only required field of `Buyer` |
| `status` | enum (11 values, see State machines) | yes | Session state |
| `currency` | string | yes | ISO 4217 settlement currency |
| `presentment_currency`, `exchange_rate`, `exchange_rate_timestamp` | string, number, string | no | Presentment currency data |
| `locale`, `timezone` | string | no | Localization |
| `line_items` | `LineItem[]` | yes | Authoritative lines |
| `fulfillment_details` | `FulfillmentDetails` (`name`, `phone_number`, `email`, `address`) | no | Contact and address |
| `fulfillment_options` | array of `FulfillmentOptionShipping`, `FulfillmentOptionDigital`, `FulfillmentOptionPickup`, `FulfillmentOptionLocalDelivery` | yes | Options offered |
| `selected_fulfillment_options` | `SelectedFulfillmentOption[]` (`type`, `option_id`, `item_ids`) | no | Buyer's choices |
| `fulfillment_groups` | `FulfillmentGroup[]` | no | Line items grouped by fulfillment |
| `totals` | `Total[]` | yes | Cart-level totals |
| `messages` | array of `MessageInfo`, `MessageWarning`, `MessageError` | yes | Messages to show |
| `links` | `Link[]` | yes | Policy and support links |
| `authentication_metadata` | `AuthenticationMetadata` (`acquirer_details`, `directory_server` enum `american_express`, `mastercard`, `visa`, `flow_preference`) | no | 3DS data; required in the response when status is `authentication_required` (RFC section 8) |
| `created_at`, `updated_at`, `expires_at` | string (RFC 3339) | no | Timestamps |
| `continue_url` | string | no | Resume URL |
| `metadata` | object | no | Merchant metadata |
| `quote_id`, `quote_expires_at` | string | no | Quote reference |
| `discounts` | `DiscountsResponse` | no | Discount extension output |
| `marketing_consent_options` | `MarketingConsentOption[]` | no | Consent channels on offer |
| `order` | `Order` | no (required in `CheckoutSessionWithOrder`) | Order created on completion |

### Requests (AC)

| Object | Fields (required in bold) |
| --- | --- |
| `CheckoutSessionCreateRequest` | **`line_items`** (`Item[]`, min 1), **`currency`**, **`capabilities`**, `buyer`, `fulfillment_details`, `fulfillment_groups`, `affiliate_attribution`, `coupons` (deprecated), `discounts`, `locale`, `timezone`, `quote_id`, `metadata`, `order_notes` |
| `CheckoutSessionUpdateRequest` | `buyer`, `line_items`, `fulfillment_details`, `fulfillment_groups`, `selected_fulfillment_options`, `coupons` (deprecated), `discounts`, `order_notes` (nothing required) |
| `CheckoutSessionCompleteRequest` | **`payment_data`**, `buyer`, `authentication_result`, `affiliate_attribution`, `risk_signals`, `marketing_consents`, `order_notes` |
| `CancelSessionRequest` | `intent_trace` (`IntentTrace`: **`reason_code`**, `trace_summary`, `metadata`) |
| `Item` | **`id`**, `name`, `unit_amount` (no `quantity` field; see Conflicts) |

### LineItem (AC, selected fields)

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `id` | string | yes | Line id |
| `item` | `Item` | yes | The item |
| `quantity` | integer | yes | Units |
| `totals` | `Total[]` | yes | Line totals |
| `name`, `description`, `images`, `unit_amount` | string, string, string[], integer | no | Display fields (added 2025-12-12) |
| `disclosures`, `custom_attributes`, `marketplace_seller_details` | arrays, object | no | Legal text, attributes, marketplace seller name |
| `product_id`, `sku`, `variant_id`, `category`, `tags` | string(s) | no | Catalog identifiers |
| `availability_status` | enum `in_stock`, `low_stock`, `out_of_stock`, `backorder`, `pre_order` | no | Stock state |
| `max_quantity_per_order`, `available_quantity`, `fulfillable_on`, `parent_id`, `tax_exempt` | various | no | Limits, bundles, tax |

### Total (AC)

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `type` | enum `items_base_amount`, `items_discount`, `subtotal`, `discount`, `fulfillment`, `tax`, `fee`, `gift_wrap`, `tip`, `store_credit`, `total`, `amount_refunded` | yes | Kind of total (2025-09-29 had the first eight; `gift_wrap`, `tip`, `store_credit` by 2026-01-30; `amount_refunded` in 2026-04-17) |
| `display_text` | string | yes | Localized label |
| `amount` | integer | yes | Minor units |
| `presentment_amount` | integer | no | Presentment currency amount |
| `description` | string | no | Extra text, for fees |
| `breakdown` | `TaxBreakdownItem[]` | no | Tax by jurisdiction |

### PaymentHandler and PaymentData (AC)

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `PaymentHandler.id` | string | yes | Seller-defined handler id, referenced by `payment_data.handler_id` |
| `PaymentHandler.name` | string | yes | Reverse-DNS handler name, for example `dev.acp.tokenized.card` |
| `PaymentHandler.display_name` | string | no | UI label (2026-04-17) |
| `PaymentHandler.version` | string | yes | `YYYY-MM-DD` |
| `PaymentHandler.spec`, `config_schema`, `instrument_schemas` | string, string, string[] | yes | URLs to handler spec and schemas |
| `PaymentHandler.requires_delegate_payment` | boolean | yes | Credential must go through Delegate Payment |
| `PaymentHandler.requires_pci_compliance` | boolean | yes | Handler routes PCI DSS sensitive data |
| `PaymentHandler.psp` | string | yes | PSP identifier |
| `PaymentHandler.config` | object | yes | Handler config |
| `PaymentHandler.display_order` | integer | no | Suggested order (lower first), advisory only |
| `PaymentData.handler_id` | string | no | Chosen handler |
| `PaymentData.instrument` | object: **`type`**, **`credential`** { **`type`** (for example `spt`), **`token`** } | no | Credential reference |
| `PaymentData.billing_address` | `Address` | no | Billing address |
| `PaymentData.purchase_order_number`, `payment_terms` (`immediate`, `net_15`, `net_30`, `net_60`, `net_90`), `due_date`, `approval_required` | various | no | B2B fields |

Handler names seen in the repository: `dev.acp.tokenized.card`, the seller-backed family `dev.acp.seller_backed.saved_card`, `dev.acp.seller_backed.gift_card`, `dev.acp.seller_backed.points`, `dev.acp.seller_backed.store_credit`, and an illustrative `com.stripe.link` in the payment handlers RFC [src-openai-acp-rfc-payment-handlers] [src-openai-acp-rfc-seller-backed].

### Messages and errors (AC)

| Object | Fields | Enums |
| --- | --- | --- |
| `MessageInfo` | `type` = `info`, `severity`, `resolution`, `param`, `content_type`, `content` | `severity`: `info`, `low`, `medium`, `high`, `critical`; `resolution`: `recoverable`, `requires_buyer_input`, `requires_buyer_review`; `content_type`: `plain`, `markdown` |
| `MessageWarning` | as above plus required `code` | `low_stock`, `high_demand`, `shipping_delay`, `price_change`, `expiring_promotion`, `limited_availability`, and eight `discount_code_*` codes |
| `MessageError` | as above plus required `code` | `missing`, `invalid`, `out_of_stock`, `payment_declined`, `requires_sign_in`, `requires_3ds`, `low_stock`, `quantity_exceeded`, `coupon_invalid`, `coupon_expired`, `minimum_not_met`, `maximum_exceeded`, `region_restricted`, `age_verification_required`, `approval_required`, `unsupported`, `not_found`, `conflict`, `rate_limited`, `expired`, `intervention_required` (the 2025-09-29 set was the first six) |
| `Error` (HTTP-level) | `type`, `code` (free string), `message`, `param`, `supported_versions` | `type`: `invalid_request`, `processing_error`, `service_unavailable`; well-known codes in the RFC: `idempotency_key_required`, `idempotency_conflict`, `idempotency_in_flight`, `unsupported_api_version`, `missing_api_version`, `requires_3ds` |

### Order (AC, after PR #232)

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `type` | const `order` | no | Webhook discriminator |
| `id` | string | yes | Merchant order id |
| `checkout_session_id` | string | yes | Session that created it |
| `permalink_url` | string | yes | Customer order page |
| `order_number`, `client_reference_id` | string | no | Display number; agent's own reference |
| `status` | string (open) | no | Defined values `created`, `confirmed`, `manual_review`, `processing`, `shipped`, `completed`, `canceled` |
| `line_items` | `OrderLineItem[]` (`quantity` { `ordered`, `current`, `fulfilled` }) | no | What was ordered |
| `fulfillments` | `Fulfillment[]` (`type` `shipping`, `pickup`, `digital`; carrier, tracking, `events`) | no | Delivery tracking |
| `adjustments` | `Adjustment[]` (`type` open: `refund`, `credit`, `return`, `exchange`, `price_adjustment`, `cancellation`, `dispute`; `status` `pending`, `completed`, `failed`) | no | Post-order changes |
| `totals` | `Total[]` | no | Order totals |

### Delegate Payment (DP)

| Object.field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `DelegatePaymentRequest.payment_method` | `PaymentMethodCard` | yes | Card to tokenize (only `card` is supported) |
| `DelegatePaymentRequest.allowance` | `Allowance` | yes | Use limits |
| `DelegatePaymentRequest.billing_address` | `Address` | no | Billing address |
| `DelegatePaymentRequest.risk_signals` | `RiskSignal[]` (`type` `card_testing`, `score`, `action` `blocked`, `manual_review`, `authorized`) | yes (may be empty since 2026-04-17) | Fraud signals |
| `DelegatePaymentRequest.metadata` | object | yes | Request metadata |
| `Allowance.reason` | enum `one_time` | yes | Only one-time use is defined |
| `Allowance.max_amount` | integer | yes | Maximum charge, minor units |
| `Allowance.currency` | string | yes | Lowercase ISO 4217 |
| `Allowance.checkout_session_id` | string | yes | Session the token is bound to |
| `Allowance.merchant_id` | string | yes | Merchant allowed to use the token |
| `Allowance.expires_at` | string | yes | Expiry time |
| `PaymentMethodCard` | `type` (`card`), `card_number_type` (`fpan`, `network_token`), `number`, `display_card_funding_type` (`credit`, `debit`, `prepaid`), `metadata` required; `exp_month`, `exp_year`, `name`, `cvc`, `cryptogram`, `eci_value`, `checks_performed` (`avs`, `cvv`, `ani`, `auth0`), `iin` (max 8), `display_wallet_type`, `display_brand`, `display_last4`, `virtual` optional | | Card or network token |
| `DelegatePaymentResponse` | `id` (vault token, `vt_...`), `created`, `metadata` | all required | Returned with HTTP 201 |
| `Error` | `type` (`invalid_request`, `rate_limit_exceeded`, `processing_error`, `service_unavailable`), `code` (`invalid_card`, `duplicate_request`, `idempotency_conflict`, `too_many_requests`, `idempotency_key_required`, `idempotency_in_flight`), `message`, `param`, `supported_versions` | | Errors |

### Discovery document (AC, served at `/.well-known/acp.json`)

| Field | Type | Required | Meaning |
| --- | --- | --- | --- |
| `protocol.name` | const `acp` | yes | Protocol id |
| `protocol.version` | string | yes | Latest supported version |
| `protocol.supported_versions` | string[] | yes | All versions, oldest first |
| `protocol.documentation_url` | string | no | Seller docs |
| `api_base_url` | string | yes | REST base URL |
| `transports` | enum[] `rest`, `mcp` | yes | Bindings offered |
| `capabilities.services` | enum[] `checkout`, `orders`, `delegate_payment`, `carts` | yes | Implemented services |
| `capabilities.extensions` | `DiscoveryExtension[]` (`name`, `spec`) | no | Extensions |
| `capabilities.intervention_types` | enum[] `3ds`, `biometric`, `address_verification` | no | Interventions |
| `capabilities.supported_currencies`, `supported_locales` | string[] | no | Currencies, BCP 47 locales |

### Cart (CA) and Feed (FE)

| Object | Fields (required in bold) |
| --- | --- |
| `Cart` | **`id`**, **`line_items`** (`LineItem[]`), **`currency`**, **`totals`** (estimates), `buyer`, `messages`, `continue_url`, `expires_at` |
| `CartCreateRequest` / `CartUpdateRequest` | **`line_items`** (`Item[]`), `buyer`, `locale` (create only); update replaces all lines |
| `FeedMetadata` | **`id`**, `target_country`, `updated_at` |
| `Product` | **`id`**, **`variants`**, `title`, `description` (`plain`, `html`, `markdown`), `url`, `media` |
| `Variant` | **`id`**, **`title`**, `description`, `url`, `barcodes`, `price` (`amount`, `currency`), `list_price`, `unit_price`, `availability` (`available`, `status`), `categories`, `condition`, `variant_options`, `media`, `seller`, `marketplace` |
| `UpsertProductsRequest` | **`products`** |

### Delegate Authentication (DA)

`DelegateAuthenticationCreateRequest` requires `merchant_id`, `payment_method` and `amount` (`value`, `currency`); the authenticate request requires `fingerprint_completion` (`Y`, `N`, `U`); sessions carry `authentication_session_id` and `status`; `AuthenticationResult` requires `three_ds_server_trans_id`, `trans_status`, `transaction_id`, `version`. Other objects: `BrowserInfo`, `Channel`, `FlowPreference`, `ShopperDetails`, `FingerprintAction` (`three_ds_method_url`, `three_ds_server_trans_id`), `ChallengeAction` (`acs_trans_id`, `acs_url`, `message_version`, `three_ds_server_trans_id`) [src-openai-acp-schema-delegate-auth-20260417] [src-openai-acp-rfc-delegate-auth].

### Extension and add-on objects (AC)

| Object | Fields |
| --- | --- |
| `ExtensionDeclaration` | **`name`** (for example `discount`), `extends` (JSONPath list), `schema`, `spec` |
| `DiscountsRequest` / `DiscountsResponse` | `codes`; `applied` (`AppliedDiscount`: `id`, `coupon`, `amount`, allocations), `rejected` (`RejectedDiscount`: `code`, `reason`) |
| `AffiliateAttribution` | **`provider`**, `token`, `publisher_id`, `campaign_id`, `creative_id`, `sub_id`, `source`, `issued_at`, `expires_at`, `metadata`, `touchpoint` (`first`, `last`) |
| `MarketingConsentOption` | **`channel`**, **`display_text`**, **`privacy_policy_url`**, `is_subscribed` |
| `MarketingConsent` | **`channel`**, **`opted_in`** |
| `RiskSignals` (checkout complete) | `ip_address`, `user_agent`, `accept_language`, `session_id`, `device_fingerprint` |
| `AuthenticationResult` (checkout complete) | **`outcome`** (`abandoned`, `attempt_acknowledged`, `authenticated`, `canceled`, `denied`, `informational`, `internal_error`, `not_supported`, `processing_error`, `rejected`), `outcome_details` |
| `IntentTrace.reason_code` | `price_sensitivity`, `shipping_cost`, `shipping_speed`, `product_fit`, `trust_security`, `returns_policy`, `payment_options`, `comparison`, `timing_deferred`, `other` |

## Message flows step by step

## State machines

## Transports

## Cryptography and standards used

## Security model and published attacks or CVEs

## Controls

## Observability

## Compliance touchpoints

## Ecosystem and SDKs

## Fees and costs

## Metrics with dates and caveats

## Relations to the other seven protocols

## Criticisms and open questions

## Resources

## Publications

## Seed audit

## Blocked sources

## Conflicts

## Least certain
