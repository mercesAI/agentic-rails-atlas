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

Spec references are to files at commit 7fdd78d. "RFC-AC" = `rfcs/rfc.agentic_checkout.md`, "RFC-DP" = `rfcs/rfc.delegate_payment.md`.

### Flow 1: Discovery (2026-04-17, optional)

1. Agent knows only the seller's domain and sends `GET https://<merchant>/.well-known/acp.json` with no authentication (`rfc.discovery.md` section 3; RFC 8615 well-known URI) [src-openai-acp-rfc-discovery].
2. Seller returns `DiscoveryResponse` (`protocol.name` `acp`, `protocol.version`, `protocol.supported_versions`, `api_base_url`, `transports` `rest` or `mcp`, `capabilities.services`). Responses SHOULD carry `Cache-Control: public, max-age=3600` at least [src-openai-acp-rfc-discovery] [src-openai-acp-schema-checkout-20260417].
3. Agent picks a mutually supported `API-Version` and transport. Session-specific data (payment handlers) is not in the discovery document; it comes back on session creation [src-openai-acp-changelog-20260417].

### Flow 2: Checkout happy path (REST, 2026-04-17)

1. **Create.** `POST /checkout_sessions` with headers `Authorization: Bearer <token>`, `Content-Type`, `API-Version`, `Idempotency-Key` (required), and recommended `Signature`, `Timestamp`, `Request-Id`, `Accept-Language`, `User-Agent`. Body: `CheckoutSessionCreateRequest` (`line_items`, `currency`, `capabilities` required). Response **201** with the full `CheckoutSession`, including the seller's `capabilities.payment.handlers` and the intersection of interventions (RFC-AC sections 3.1, 4.1; OpenAPI `createCheckoutSession`) [src-openai-acp-rfc-checkout] [src-openai-acp-openapi-checkout-20260417] [src-openai-acp-rfc-capability-negotiation].
2. **Update.** `POST /checkout_sessions/{checkout_session_id}` with `CheckoutSessionUpdateRequest` (for example `fulfillment_details`, `selected_fulfillment_options`). Response **200** with the full authoritative state; the agent re-renders totals, messages and status (RFC-AC 4.2).
3. **Retrieve.** `GET /checkout_sessions/{checkout_session_id}` returns **200** or **404** (RFC-AC 4.3).
4. **Tokenize** (when the chosen handler has `requires_delegate_payment: true`): see Flow 3. The agent receives a token.
5. **Complete.** `POST /checkout_sessions/{checkout_session_id}/complete` with `payment_data` { `handler_id`, `instrument` { `type`, `credential` { `type`, `token` } }, `billing_address` }, optional `buyer`, `risk_signals`, `authentication_result`, `marketing_consents`, `affiliate_attribution` (last touch). The merchant charges through its own PSP. The response **MUST** include `status: completed` and an `order` with `id`, `checkout_session_id`, `permalink_url` (RFC-AC 4.4). The OpenAPI file lists **200** for this operation; OpenAI's production checklist says to validate `HTTP 201 Created` (see Conflicts) [src-openai-acp-openapi-checkout-20260417] [src-openai-commerce-docs].
6. **Order events.** The merchant sends `POST /agentic_checkout/webhooks/order_events` to the agent with `type` `order_create`, then `order_update` for later changes, signed with `Merchant-Signature` (Flow 7) (RFC-AC 2.3) [src-openai-acp-openapi-webhook-20260417].

### Flow 3: Delegate Payment

1. The agent prepares a one-time request with the user's card (`card_number_type` `fpan` or `network_token`), an `allowance` (`reason` `one_time`, `max_amount`, `currency`, `checkout_session_id`, `merchant_id`, `expires_at`), `billing_address`, `risk_signals` and `metadata` [src-openai-acp-schema-delegate-payment-20260417].
2. `POST /agentic_commerce/delegate_payment` to the PSP or vault (or a PCI DSS Level 1 merchant's own vault) with `Authorization`, `Idempotency-Key` and `API-Version` required. RFC-DP section 2.2 says the client MUST compute a detached signature over canonical JSON, base64url-encode it in `Signature`, and include `Timestamp`; the same RFC's header list and the OpenAPI file mark `Signature` and `Timestamp` as recommended or optional (see Conflicts) [src-openai-acp-rfc-delegate-payment] [src-openai-acp-openapi-delegate-payment-20260417].
3. Response **201** `DelegatePaymentResponse` { `id` (`vt_...`), `created`, `metadata` }. The token may be used by the merchant's PSP only within the allowance (RFC-DP introduction).
4. The agent passes the token to the merchant in `payment_data.instrument.credential.token` on complete.
5. **Failures:** `invalid_card`, `duplicate_request`, `idempotency_conflict` (422), `idempotency_in_flight` (409), `idempotency_key_required` (400), `too_many_requests` with `rate_limit_exceeded` (429); OpenAPI response codes 201, 400, 401, 409, 422, 429, 500, 503 [src-openai-acp-openapi-delegate-payment-20260417].
6. **Stripe variant (not spec text).** With Stripe, the agent creates a Shared Payment Token (`spt_...`) with `usage_limits` (`currency`, `max_amount`, `expires_at`) and `seller_details`; the seller confirms a `PaymentIntent` with `payment_method_data[shared_payment_granted_token]`; Stripe clones the original `PaymentMethod` for the seller [src-stripe-spt].

### Flow 4: 3DS authentication

1. Seller's session declares `capabilities.interventions` (`required`, `enforcement` `always`, `conditional` or `optional`) and, when needed, sets `status` to `authentication_required` and includes `authentication_metadata` (`acquirer_details`, `directory_server`) (RFC-AC 4.4 and 8) [src-openai-acp-rfc-checkout].
2. Agent runs 3DS2 itself, either with its own provider or through Delegate Authentication: `POST /delegate_authentication` (201; status `action_required`, `pending` or `not_supported`), device fingerprint through a hidden iframe to `three_ds_method_url` (client waits up to 10 seconds, then reports `fingerprint_completion` `Y`, `N` or `U`), `POST /delegate_authentication/{authentication_session_id}/authenticate` (200; challenge action or result), `GET /delegate_authentication/{authentication_session_id}` (200) [src-openai-acp-rfc-delegate-auth] [src-openai-acp-openapi-delegate-auth-20260417].
3. Agent MUST send `authentication_result` on complete regardless of outcome. If it calls complete without it while the session is `authentication_required`, the server MUST return a 4XX error with `type` `invalid_request`, `code` `requires_3ds`, `param` `$.authentication_result` (RFC-AC 4.4).
4. If the agent cannot perform a required intervention and enforcement is `always`, the seller SHOULD add a message with `code` `intervention_required` (RFC-AC section 5) [src-openai-acp-rfc-checkout].

### Flow 5: Cancel with intent trace

1. `POST /checkout_sessions/{checkout_session_id}/cancel`, optional body `CancelSessionRequest` { `intent_trace` { `reason_code`, `trace_summary`, `metadata` } } [src-openai-acp-rfc-intent-traces].
2. **200** with `status: canceled`; **405** if the session is already `completed` or `canceled` (RFC-AC 4.5). Servers that do not implement intent traces MUST still accept a cancel request that carries an `intent_trace` body (`rfc.intent_traces.md`) [src-openai-acp-rfc-intent-traces].

### Flow 6: Failure handling on checkout

- **Idempotency** (RFC-AC section 6, mandatory since 2026-04-17): missing key 400 `idempotency_key_required`; same key with a different body 422 `idempotency_conflict`; same key still running 409 `idempotency_in_flight` with `Retry-After`; replays return the original status with `Idempotent-Replayed: true`; 5xx responses are not cached; keys kept at least 24 hours [src-openai-acp-rfc-checkout].
- **Version mismatch:** 400 with `supported_versions`; well-known codes `unsupported_api_version`, `missing_api_version` (RFC-AC 2.1) [src-openai-acp-changelog-20260417].
- **Business errors** come back inside a normal session response as `messages[]` entries (`MessageError` code such as `out_of_stock` or `payment_declined`, with `resolution` telling the agent whether it can recover or must ask the buyer) [src-openai-acp-schema-checkout-20260417].

### Flow 7: Order webhooks

1. Merchant computes `HMAC-SHA256(timestamp + "." + raw_body, secret)` and sends `Merchant-Signature: t=<unix_seconds>,v1=<64_hex>` to `/agentic_checkout/webhooks/order_events` [src-openai-acp-openapi-webhook-20260417].
2. Receiver (the agent platform, "hosted by OpenAI" in the OpenAPI description) rejects with 401 when the header is missing, malformed, outside the time window (recommended tolerance 300 seconds) or fails verification.
3. Payload `WebhookEvent` { `type` (`order_create` or `order_update`, open string), `data` (`Order` with `type` `order`) }. Refunds, returns and disputes are `adjustments[]` entries; the legacy `refunds[]` was removed in 2026-04-17 [src-openai-acp-openapi-webhook-20260417].

### Flow 8: Cart (2026-04-17)

`POST /carts` (201) creates a single-seller cart with estimated totals; `GET /carts/{id}` (200 or 404); `PUT /carts/{id}` replaces all lines; `POST /carts/{id}/cancel`. Carts have no status, no payment data and no capability negotiation; agents check for `carts` in the discovery `services` list first. Cart-to-checkout conversion was deferred [src-openai-acp-rfc-cart] [src-openai-acp-openapi-cart-20260417].

### Flow 9: Product feed push (2026-04-17)

The Feed API is hosted by the agent and called by the merchant: `POST /feeds` (201) creates feed metadata, `GET /feeds/{id}`, `GET /feeds/{id}/products`, `PATCH /feeds/{id}/products` upserts by `Product.id`. A file format (`metadata.json` plus `products.jsonl`) does full replacement. Promotions were deferred [src-openai-acp-changelog-20260417] [src-openai-acp-openapi-feed-20260417]. OpenAI's own feed endpoints are named differently (`POST /product_feeds`, `GET /product_feeds/{id}`, `GET` and `PATCH /product_feeds/{id}/products`, plus a promotions API and SFTP file upload) [src-openai-commerce-docs].

### Flow 10: As deployed in ChatGPT (2026, outside the ACP spec)

- **Product discovery:** merchants send product feeds and promotions to OpenAI through ACP, directly or through providers such as Salesforce and Stripe; Shopify merchants are covered through Shopify Catalog [src-openai-product-discovery].
- **External checkout (generally available):** an app links or redirects the user to the merchant's own checkout [src-openai-apps-monetization].
- **ChatGPT payment sheet (beta, select marketplace partners):** the widget calls `window.openai.requestCheckout(...)`; on "buy" ChatGPT sends a token for the selected payment method to the merchant's MCP server in a `complete_checkout` tool call; supported PSPs listed: Adyen, Checkout.com, Fiserv, PayPal, Stripe, Worldpay. PCI DSS Level 1 merchants can instead receive raw card data by implementing the ACP Delegate Payment endpoint; that request includes allowance constraints [src-openai-apps-monetization]. No source says the payment sheet token is an allowance-scoped delegated token in the general case.

## State machines

### Checkout session `status`

| Version | Enum in `schema.agentic_checkout.json` |
| --- | --- |
| 2025-09-29 | `not_ready_for_payment`, `ready_for_payment`, `completed`, `canceled`, `in_progress` |
| 2025-12-12, 2026-01-16 | adds `authentication_required` |
| 2026-01-30, 2026-04-17, unreleased | `incomplete`, `not_ready_for_payment`, `requires_escalation`, `authentication_required`, `ready_for_payment`, `pending_approval`, `complete_in_progress`, `completed`, `canceled`, `in_progress`, `expired` |

Sources: [src-openai-acp-schema-checkout-20250929] [src-openai-acp-schema-checkout-20260130] [src-openai-acp-schema-checkout-20260417].

Transitions stated in the text:
- `not_ready_for_payment` to `ready_for_payment` as the buyer supplies address and fulfillment choices (implied by RFC-AC 4.1 to 4.2; not given as a formal table).
- `ready_for_payment` to `authentication_required` when the seller requires 3DS; the client then completes with `authentication_result` (RFC-AC 4.4).
- Complete to `completed` with an `order`; cancel to `canceled`; cancel on `completed` or `canceled` returns 405 (RFC-AC 4.4, 4.5).
- The six statuses added in 2026-01-30 (`incomplete`, `requires_escalation`, `pending_approval`, `complete_in_progress`, `expired`, plus `authentication_required` from 2025-12-12) have no definitions in any RFC at commit 7fdd78d; `rfc.agentic_checkout.md` sections 4.1 and 8 still list only the original five values. Five of the names match UCP's checkout status enum (`incomplete`, `requires_escalation`, `complete_in_progress`, `completed`, `canceled`) [src-openai-acp-rfc-checkout] [src-ucp-checkout-schema].

### Delegate Payment token

The spec defines no token status field. Use is constrained by `allowance`: one use (`reason` `one_time`), up to `max_amount` in `currency`, only for `merchant_id` and `checkout_session_id`, until `expires_at` [src-openai-acp-schema-delegate-payment-20260417]. Enforcement is the PSP's job; the spec states the constraints but not the error codes a PSP returns when they are exceeded.

### Stripe Shared Payment Token (Stripe docs, not ACP)

`status` values `active`, `requires_action`, `deactivated` (terminal). `active` and `requires_action` can loop; an SPT can start in either. Deactivation happens when it is consumed, expires or is revoked (`POST /v1/shared_payment/issued_tokens/{id}/revoke`). Webhooks: `shared_payment.issued_token.requires_action`, `.active`, `.used`, `.deactivated` (agent side) and `shared_payment.granted_token.deactivated` (seller side) [src-stripe-spt].

### Delegate Authentication session

Create: `action_required`, `pending`, `not_supported`. Authenticate: `authenticated`, `action_required`, `attempted`, `not_authenticated`, `rejected`, `unavailable`, `expired`. Retrieve adds `challenge_abandoned`, `pending`, `not_supported` (`rfc.delegate_authentication.md` section 9) [src-openai-acp-rfc-delegate-auth].

### Order, fulfillment and adjustment

- Order `status` (open string, 2026-04-17 after PR #232): `created`, `confirmed`, `manual_review`, `processing`, `shipped`, `completed`, `canceled`. The 2026-04-17 changelog lists `delivered` instead of `completed`; the snapshot was changed on 2026-05-01 (see Conflicts) [src-openai-acp-schema-checkout-20260417] [src-openai-acp-changelog-20260417].
- Fulfillment `status`: `pending`, `processing`, `shipped`, `in_transit`, `out_for_delivery`, `ready_for_pickup`, `delivered`, `failed`, `canceled`.
- FulfillmentEvent `type`: `processing`, `shipped`, `in_transit`, `out_for_delivery`, `ready_for_pickup`, `delivered`, `failed_attempt`, `returned_to_sender`, `canceled`, `undeliverable`.
- Adjustment `status`: `pending`, `completed`, `failed`.

### Cart

No state machine: a cart exists or returns 404 (`rfc.cart.md`) [src-openai-acp-rfc-cart].

## Transports

- **REST over HTTPS** with JSON bodies is the primary binding. RFC-AC section 7 says TLS 1.3 MUST be used; OpenAI's production guide says TLS 1.2 or later on port 443 (see Conflicts) [src-openai-acp-rfc-checkout] [src-openai-commerce-docs].
- **MCP binding** (`docs/mcp-binding.md`, added 2026-02-19 by PR #139, released in 2026-04-17): JSON-RPC 2.0 over MCP Streamable HTTP at a single endpoint such as `/mcp`. Five tools: `create_checkout_session`, `get_checkout_session`, `update_checkout_session`, `complete_checkout_session`, `cancel_checkout_session`. Arguments are `meta` (headers: `meta.api_version` required, `meta.idempotency_key`, `meta.request_id`, `meta.user_agent`, `meta.accept_language`, `meta.signature`, `meta.timestamp`), `id` and `payload`. `Authorization` moves to MCP server auth. ACP errors use JSON-RPC code `-32000` with the ACP `Error` object in `error.data`; `-32602` is reserved for malformed arguments. The OpenRPC schema is `spec/2026-04-17/openrpc/openrpc.agentic_checkout.json` [src-openai-acp-mcp-binding] [src-openai-acp-openrpc-20260417].
- **Discovery** through `/.well-known/acp.json`; `transports` lists `rest` and `mcp` [src-openai-acp-rfc-discovery].
- **Webhooks**: merchant to agent HTTPS POST [src-openai-acp-openapi-webhook-20260417].
- **Feed files**: `metadata.json` plus `products.jsonl` in the spec; OpenAI also accepts SFTP uploads [src-openai-acp-changelog-20260417] [src-openai-commerce-docs].
- **ChatGPT Apps SDK** (OpenAI product surface, not ACP): `window.openai.requestCheckout` in the widget and a `complete_checkout` MCP tool on the merchant's server [src-openai-apps-monetization].

## Cryptography and standards used

- **Bearer tokens.** `Authorization: Bearer <token>` is REQUIRED on checkout and Delegate Payment; the OpenAPI security scheme is HTTP bearer with `bearerFormat: API Key`. Keys are exchanged bilaterally (out of band) [src-openai-acp-openapi-delegate-payment-20260417] [src-openai-acp-rfc-checkout].
- **Request signatures.** `Signature` (base64url detached signature over canonical JSON) and `Timestamp` (RFC 3339) are RECOMMENDED on checkout. The server publishes accepted algorithms out of band; RFC-DP gives Ed25519 and ES256 as examples. No canonicalization algorithm is named for signing; RFC 8785 (JCS) is mentioned only as an informative option for idempotency body comparison [src-openai-acp-rfc-checkout] [src-openai-acp-rfc-delegate-payment]. The checkout OpenAPI file describes its `Signature` parameter as "HMAC signature for webhook verification", which does not match the RFC text [src-openai-acp-openapi-checkout-20260417].
- **Webhook HMAC.** HMAC-SHA256 over `timestamp + "." + raw_body` with a shared secret, header `Merchant-Signature: t=<unix_seconds>,v1=<64_hex>`, 300-second recommended tolerance; the changelog says this format aligns with Stripe's webhook signature scheme [src-openai-acp-openapi-webhook-20260417] [src-openai-acp-changelog-20260417].
- **Card data and tokens.** Delegate Payment carries an FPAN or a network token (`card_number_type`), optional `cryptogram` and `eci_value`; the result is an opaque vault token (`vt_...`). OpenAI says it intends to move to network tokens as they become supported and that eligible cards are upgraded through network tokenization [src-openai-acp-schema-delegate-payment-20260417] [src-openai-commerce-docs].
- **3DS2 (EMV 3-D Secure).** Delegate Authentication carries 3DS Method fingerprinting, challenge (`acs_url`, `acs_trans_id`), and results (`three_ds_cryptogram`, `electronic_commerce_indicator`, `trans_status`) [src-openai-acp-rfc-delegate-auth] [src-openai-acp-rfc-checkout].
- **Other standards referenced:** RFC 2119 and RFC 8174 (normative words), RFC 9535 JSONPath (`param`), RFC 8615 (well-known URIs), ISO 4217, ISO 3166-1 alpha-2, E.164, BCP 47, CommonMark 0.31.2, ISO/IEC 7812-1 (IIN length), JSON-RPC 2.0 and MCP Streamable HTTP [src-openai-acp-rfc-checkout] [src-openai-acp-rfc-discovery] [src-openai-acp-changelog-20260417] [src-openai-acp-mcp-binding].
- **Not used:** no verifiable credentials, no user-signed mandates, no HTTP Message Signatures (RFC 9421), no DIDs and no on-chain components appear in the ACP repository (grep at commit 7fdd78d) [src-openai-acp-rfcs-dir].

## Security model and published attacks or CVEs

### Trust model

- **Bilateral onboarding.** Each agent and merchant pair shares a bearer token (an API key per the OpenAPI `bearerFormat`). There is no agent registry, no public key directory and no agent identity standard in ACP; signature algorithms and keys are agreed out of band [src-openai-acp-rfc-checkout] [src-openai-acp-openapi-delegate-payment-20260417]. OpenAI also tells merchants to allowlist its published egress IP ranges [src-openai-commerce-docs].
- **Merchant decides.** The merchant accepts or declines each order with its own fraud stack; the agent may pass `risk_signals` (checkout) and `RiskSignal` entries (delegate payment) [src-openai-acp-schema-checkout-20260417] [src-openai-acp-schema-delegate-payment-20260417].
- **Credential scope.** The Allowance binds the vault token to one merchant, one checkout session, a maximum amount, a currency and an expiry, for one use. Enforcement is done by the PSP or vault, not by cryptography visible to the merchant [src-openai-acp-rfc-delegate-payment].
- **PCI scope.** OpenAI says the feed and checkout specs carry no cardholder data, using a PSP's Delegated Payment implementation may avoid PCI scope changes, while direct integration with the Delegate Payment endpoints handles cardholder data and is likely in PCI scope; OpenAI may ask for an attestation of compliance (AOC) [src-openai-commerce-docs]. The governance FAQ gives "exposes agents directly to raw payment credentials" as an example of a change the founders could veto [src-openai-acp-governance].
- **User confirmation.** OpenAI's launch post says users confirm each step and that tokens are authorized only for specific amounts and merchants [src-openai-buy-it]. The spec has no signed user consent artifact.
- **Markdown injection guard.** Since 2026-04-17, markdown content must be CommonMark 0.31.2 without raw HTML; servers must reject raw HTML and agents must render with raw HTML disabled or sanitized [src-openai-acp-rfc-checkout].
- **Replay and duplicates.** Idempotency rules prevent double side effects; webhook HMAC with a 300-second window limits webhook replay. Request `Timestamp` checks are only SHOULD [src-openai-acp-rfc-checkout] [src-openai-acp-openapi-webhook-20260417].

### Published attacks, CVEs and analyses

- **No CVEs or GitHub security advisories** exist for the ACP repository (GitHub API returned 0 advisories on 2026-10-11). ACP is a specification with no official SDK, so CVEs would attach to implementations [src-openai-acp-gh-advisories].
- **Formal analysis (arXiv 2609.00060, 2026-08-30).** Jiang and co-authors model x402, MPP, ACP and AP2 in Tamarin and report 86 verification cases, 46 reproduced known or calibration cases and 40 previously undocumented formal-consistency findings across the four protocols, consolidated into 18 shared principles. The abstract does not break the findings down by protocol, so ACP-specific findings are not stated here [src-arxiv-2609-00060].
- **Protocol-level attacks (arXiv 2607.21824, 2026-07-23).** Louck reports 33 structural vulnerabilities across "three leading platforms" with deterministic exploitation; the abstract does not name ACP or the platforms [src-arxiv-2607-21824].
- **Audit trail gap (arXiv 2607.19436, 2026-07-21).** Srivastava states that protocols such as AP2 and ACP do not provide interoperable, tamper-evident auditability [src-arxiv-2607-19436].
- **Verifiable Intent view.** The Verifiable Intent repository (`agent-intent/verifiable-intent`) says SPTs authorize payment execution while VI credentials prove user authorization, and proposes carrying VI credentials through ACP's extension mechanism; it says adoption design would need coordination with ACP's maintainers [src-vi-protocols].

## Controls

Status per control id from `CONTROL_IDS` (native = defined in the ACP spec; partial = defined in part or only as SHOULD; product = provided by a vendor product, not the spec; gap = absent).

| Control id | Status | Evidence |
| --- | --- | --- |
| `agent-identity-verification` | partial | Bearer token plus RECOMMENDED detached `Signature` and `Timestamp`; algorithms out of band; no agent identity scheme [src-openai-acp-rfc-checkout] |
| `agent-registration-kya` | gap (product) | No registry in the spec; each platform runs its own merchant application (for ChatGPT, approved partners apply at chatgpt.com/merchants) [src-openai-commerce-docs] [src-openai-acp-site] |
| `user-consent-capture` | partial | Buyer confirms in the agent UI (product claim); spec captures `marketing_consents` and `authentication_result`, but no signed purchase consent [src-openai-buy-it] [src-openai-acp-schema-checkout-20260417] |
| `spending-caps` | native | `allowance.max_amount` and `currency` on Delegate Payment; Stripe SPT `usage_limits.max_amount` [src-openai-acp-schema-delegate-payment-20260417] [src-stripe-spt] |
| `merchant-payee-scoping` | native | `allowance.merchant_id` and `allowance.checkout_session_id`; SPT `seller_details` [src-openai-acp-schema-delegate-payment-20260417] [src-stripe-spt] |
| `time-windows-expiry` | native | `allowance.expires_at`; session `expires_at`; status `expired`; SPT `usage_limits.expires_at` [src-openai-acp-schema-delegate-payment-20260417] [src-openai-acp-schema-checkout-20260417] |
| `revocation` | gap in spec (product) | No revoke endpoint in ACP; Stripe SPTs can be revoked (`/v1/shared_payment/issued_tokens/{id}/revoke`) [src-stripe-spt] |
| `step-up-authentication` | native | `authentication_required` status, `authentication_metadata`, `authentication_result`, Delegate Authentication (3DS2), `capabilities.interventions` [src-openai-acp-rfc-checkout] [src-openai-acp-rfc-delegate-auth] |
| `replay-protection` | native (partial for requests) | Mandatory `Idempotency-Key` on POSTs; webhook timestamp window 300 s; request `Timestamp` only SHOULD; `allowance.reason` `one_time` [src-openai-acp-rfc-checkout] [src-openai-acp-openapi-webhook-20260417] |
| `receipts-evidence` | partial | `order` with `permalink_url`, `order_create` and `order_update` webhooks, `client_reference_id`; no signed receipt [src-openai-acp-openapi-webhook-20260417] [src-openai-acp-schema-checkout-20260417] |
| `dispute-support` | partial | `adjustments[]` types include `refund`, `return`, `dispute` (covers chargebacks); merchant handles chargebacks as merchant of record; no dispute protocol [src-openai-acp-schema-checkout-20260417] [src-openai-commerce-docs] |
| `reputation` | gap | Nothing in the spec |
| `monitoring-signals` | partial | `risk_signals` on complete and delegate payment, `intent_trace` reason codes on cancel, `Request-Id` [src-openai-acp-schema-checkout-20260417] [src-openai-acp-rfc-intent-traces] |
| `kill-switch` | gap in spec (product) | Merchants can decline any order; agents can cancel sessions; Stripe SPT revocation; no protocol-wide kill switch [src-openai-acp-rfc-checkout] [src-stripe-spt] |

## Observability

- **Public:** the GitHub repository (spec, changelog, PRs, CLA list, governance); `https://www.agenticcommerce.dev`; each seller's optional `/.well-known/acp.json` (unauthenticated, cacheable for an hour) [src-openai-acp-gh-repo] [src-openai-acp-rfc-discovery].
- **Private (between the parties):** checkout sessions, delegate payment tokens, order webhooks, feeds. No explorer, indexer or public registry of ACP merchants exists; the ACP site FAQ says discovery mechanisms were still being worked on [src-openai-acp-site].
- **Event names:** ACP webhooks `order_create`, `order_update` at `/agentic_checkout/webhooks/order_events` [src-openai-acp-openapi-webhook-20260417]. OpenAI's production checklist calls them `order_created` and `order_updated`, and its FAQ says `ORDER_UPDATE` [src-openai-commerce-docs]. Stripe SPT events: `shared_payment.issued_token.requires_action`, `shared_payment.issued_token.active`, `shared_payment.issued_token.used`, `shared_payment.issued_token.deactivated`, `shared_payment.granted_token.deactivated` [src-stripe-spt].
- **Headers useful for tracing:** `Request-Id` (echoed), `Idempotency-Key` (echoed), `Idempotent-Replayed` [src-openai-acp-rfc-checkout].
- **Endpoints:** merchant `/checkout_sessions`, `/checkout_sessions/{checkout_session_id}`, `/complete`, `/cancel`, `/carts`, `/carts/{id}`, `/carts/{id}/cancel`; PSP `/agentic_commerce/delegate_payment`; authentication provider `/delegate_authentication`, `/delegate_authentication/{authentication_session_id}`, `/authenticate`; agent `/agentic_checkout/webhooks/order_events`, `/feeds`, `/feeds/{id}`, `/feeds/{id}/products`; well-known `/.well-known/acp.json` [src-openai-acp-openapi-checkout-20260417] [src-openai-acp-openapi-cart-20260417] [src-openai-acp-openapi-delegate-payment-20260417] [src-openai-acp-openapi-delegate-auth-20260417] [src-openai-acp-openapi-feed-20260417].
- **Metrics:** no official volume, merchant count or transaction data is published by OpenAI, Stripe or the project (see Metrics).

## Compliance touchpoints

- **PCI DSS.** Direct Delegate Payment integration is reserved for PSPs and PCI DSS Level 1 merchants with their own vaults; OpenAI may require an AOC; full PAN and CVC must not be logged [src-openai-commerce-docs] [src-openai-acp-rfc-delegate-payment]. In the ChatGPT payment sheet beta, PCI DSS Level 1 merchants can receive raw card data through the ACP Delegate Payment endpoint [src-openai-apps-monetization].
- **Merchant of record.** The merchant remains merchant of record and system of record for orders, payments, taxes and compliance, including sales tax and refunds or chargebacks [src-openai-acp-rfc-checkout] [src-openai-commerce-docs].
- **Strong customer authentication and 3DS.** 3DS2 support (Delegate Authentication, `requires_3ds`, `authentication_result`) gives a path for issuer authentication where required; the spec does not name PSD2 or any regulation [src-openai-acp-rfc-delegate-auth].
- **Marketing consent.** `marketing_consent_options` with `privacy_policy_url` and `marketing_consents` (`opted_in`) let sellers record opt-ins; consent is captured only at completion [src-openai-acp-changelog-20260417]. The spec does not name GDPR, CAN-SPAM or TCPA.
- **Prohibited products.** OpenAI's policy for ChatGPT excludes, among others, adult content, age-restricted products (alcohol, nicotine, gambling), weapons and prescription-only medications [src-openai-commerce-docs]. ACP itself has an `age_verification_required` and `region_restricted` message code [src-openai-acp-schema-checkout-20260417].
- **Data minimization.** OpenAI's launch post says only the information needed for the order is shared with the merchant, with the user's permission [src-openai-buy-it]. RFC-AC asks implementers to redact addresses as policy requires [src-openai-acp-rfc-checkout].
- **Regions.** Stripe SPTs are available to agents, customers and sellers in the US, Canada and listed European countries (34 country codes in the docs list, including US and CA) [src-stripe-spt]. Instant Checkout launched for US users and US Etsy sellers [src-openai-buy-it].
- **Terms.** Using Stripe SPTs requires agreeing to Stripe's agentic commerce preview service terms [src-stripe-spt].

## Ecosystem and SDKs

### Surfaces (agents)

| Surface | Status | Date | Source |
| --- | --- | --- | --- |
| ChatGPT Instant Checkout (in-chat purchase through ACP) | Launched for US Plus, Pro and Free users buying from US Etsy sellers; single-item only; Shopify merchants "coming soon" | 2025-09-29 | [src-openai-buy-it] [src-stripe-acp-launch] |
| ChatGPT Instant Checkout | Reported "moving to Apps" (OpenAI spokesperson quoted by The Information, relayed by trade press) | reported 2026-03 (article 2026-03-10) | [src-retailsystems-pivot] |
| ChatGPT product discovery through ACP feeds | Live; merchants use their own checkout; "initial version of Instant Checkout did not offer the level of flexibility" OpenAI wanted | 2026-03-24 | [src-openai-product-discovery] |
| ChatGPT apps: external checkout | Generally available (recommended path) | accessed 2026-10-11 | [src-openai-apps-monetization] |
| ChatGPT apps: payment sheet | Private beta for select marketplace partners | accessed 2026-10-11 | [src-openai-apps-monetization] |
| Microsoft Copilot Checkout | Rolling out in the US on Copilot.com with PayPal, Shopify and Stripe; Microsoft says it is "adopting open standards like" ACP | 2026-01-08 | [src-ms-copilot-checkout] |
| Microsoft Merchant Center | Later page: "MMC will support" UCP and Copilot Checkout requires a UCP-compliant feed | accessed 2026-10-11 | [src-ms-agentic-commerce] |

### Merchants, platforms and PSPs (with what each source actually says)

- **Etsy:** US Etsy sellers live at launch (2025-09-29) [src-openai-buy-it].
- **Shopify:** "over a million Shopify merchants" announced as coming soon on 2025-09-29 (named: Glossier, SKIMS, Spanx, Vuori) [src-openai-buy-it]. On 2026-03-24 OpenAI said Shopify product data reaches ChatGPT through Shopify Catalog with no extra merchant work, and buyers complete purchases on the merchant's store in an in-app browser [src-openai-product-discovery].
- **Walmart:** announced 2025-10-14 that customers would "soon" shop Walmart in ChatGPT using Instant Checkout [src-walmart-openai]; on 2026-03-24 OpenAI described a Walmart in-ChatGPT app with account linking, loyalty and Walmart payments [src-openai-product-discovery].
- **Retailers integrated into ACP for discovery (2026-03-24):** Target, Sephora, Nordstrom, Lowe's, Best Buy, The Home Depot, Wayfair [src-openai-product-discovery].
- **Feed providers:** Salesforce and Stripe named as third-party delivery paths [src-openai-product-discovery].
- **PayPal:** 2025-10-28, PayPal "will adopt" ACP, support Instant Checkout through the delegated payments API and run an "ACP server" for its merchants, with catalogs arriving "in 2026" [src-paypal-acp]. Corporate CLA signed 2026-04-16 [src-openai-acp-cla-signatories].
- **PSPs listed for the ChatGPT payment sheet:** Adyen, Checkout.com, Fiserv, PayPal, Stripe, Worldpay [src-openai-apps-monetization].
- **Stripe:** co-developer; Shared Payment Tokens (first Delegated Payment-compatible implementation) [src-openai-commerce-docs]; Agentic Commerce Suite launched 2025-12-11 with named brands (Coach, Kate Spade, URBN, Revolve, Ashley Furniture, Halara, ABT Electronics, Nectar) and platforms (Squarespace, Wix, Etsy, WooCommerce, commercetools, BigCommerce) [src-stripe-acs-launch]; Stripe's docs list "UCP or ACP" as the protocol used for selling through agents [src-stripe-agentic-commerce].
- **Meta:** CLA 2026-03-19, TSC seat 3 on 2026-04-24 [src-openai-acp-cla-signatories] [src-openai-acp-governance].
- **Other CLA signatories:** Adyen, Wix, commercetools, OpenCommerce Network (nekuda-linked), Affirm, Agentic Commerce Inc. (Catalog) [src-openai-acp-cla-signatories].

Separate announced from live: Walmart's 2025 Instant Checkout plan and PayPal's catalog plan were announcements; whether either ran on Instant Checkout before the March 2026 change is not confirmed by a primary source read here.

### SDKs and packages

| Package | Registry | Publisher | Status (2026-10-11) | Source |
| --- | --- | --- | --- | --- |
| `@agentic-commerce-protocol/specification` | npm | ACP repo `package.json` name, version 0.1.0 | **Not published** (404) | [src-openai-acp-package-json] [src-openai-acp-npm-404] |
| `agentic-commerce-protocol` | npm and PyPI | Svix ("Type definitions for the Agentic Commerce Protocol specification") | 0.2.0 (npm published 2025-10-02); unofficial, third party | [src-svix-acp-types] |
| `acp-sdk` | PyPI | IBM Corp. | 1.0.3; this is IBM's Agent Communication Protocol, **not** this ACP | [src-pypi-acp-sdk] |

There is no official ACP SDK from OpenAI or Stripe. Reference implementations are OpenAI's and Stripe's hosted services and docs [src-openai-acp-readme]. The repository's CI runs `scripts/validate-consistency.js` (ajv schema compile, example validation) [src-openai-acp-workflows].

## Fees and costs

| Party | Fact | Date | Source | Caveat |
| --- | --- | --- | --- | --- |
| OpenAI (Instant Checkout) | "Merchants pay a small fee on completed purchases"; free for users; does not change prices or ranking | 2025-09-29 | [src-openai-buy-it] | primary; no rate published by OpenAI |
| OpenAI (ChatGPT checkout, Shopify merchants) | 4% of ChatGPT checkout sales, on top of Shopify fees; Google AI Mode, Gemini and Microsoft Copilot checkouts with no additional fee "for now" | 2026-01-21 | [src-pymnts-4pct] | secondary: PYMNTS relaying The Information, citing a Shopify spokesperson; not published by OpenAI; whether it applies after the March 2026 change is unknown |
| ACP protocol | No protocol fee; Apache-2.0; no fee to join the TSC or a DWG | 2026-03-10 | [src-openai-acp-license] [src-openai-acp-governance] | primary |
| Stripe SPT | No SPT price found on the Stripe pages read; agent features are labeled "Private preview" with a waitlist | accessed 2026-10-11 | [src-stripe-agentic-commerce] [src-stripe-spt] | absence of evidence; Appendix B also lists no pricing |
| Merchant PSP | Normal processing fees of the merchant's own PSP apply because the merchant charges the payment | 2025-09-29 | [src-openai-commerce-docs] | primary statement of model; no figures |
| Stripe MPP (context) | SPT card payments through MPP have a 0.50 USD minimum | accessed 2026-10-11 | [src-stripe-mpp-docs] | MPP, not ACP |

## Metrics with dates and caveats

| Metric | Value | As of | Source | Caveat |
| --- | --- | --- | --- | --- |
| ChatGPT weekly users (context at launch) | "More than 700 million" | 2025-09-29 | [src-openai-buy-it] | OpenAI's own figure; not an ACP metric |
| Shopify merchants announced for Instant Checkout | "Over a million" (coming soon) | 2025-09-29 | [src-openai-buy-it] | announcement, not live count |
| Shopify merchants selling through AI tools (ChatGPT, Gemini, Copilot) | "Around a dozen" | 2026-03-03 | [src-retailsystems-pivot] | reported remark by Shopify's president at an investor conference |
| Retailers named as integrated into ACP for discovery | 7 | 2026-03-24 | [src-openai-product-discovery] | named list, not a total |
| Corporate CLA signatories | 10 | 2026-06-03 | [src-openai-acp-cla-signatories] | includes OpenAI and Stripe |
| TSC seats filled | 3 of up to 7 | 2026-04-24 | [src-openai-acp-governance] | |
| GitHub stars / forks | 1,570 / 253 | 2026-10-11 | [src-openai-acp-gh-repo] | popularity, not adoption |
| Commits after the 2026-04-17 release | 18 (last 2026-07-18 UTC) | 2026-10-11 | [src-openai-acp-gh-commits] | |
| ACP transaction volume or GMV | No official data | 2026-10-11 | [src-openai-buy-it] [src-openai-product-discovery] | none published by OpenAI, Stripe or the project |

## Relations to the other seven protocols

## Criticisms and open questions

## Resources

## Publications

## Seed audit

## Blocked sources

## Conflicts

## Least certain
