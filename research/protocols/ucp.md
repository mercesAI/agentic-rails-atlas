# UCP: Universal Commerce Protocol (`ucp`) research dossier

Accessed 2026-10-11. Vendor commits read:

| Repository | Commit | Commit date |
| --- | --- | --- |
| Universal-Commerce-Protocol/ucp | ad9950ba5c7bcd02af648f849bf7344052f76f57 | 2026-10-09 |
| Universal-Commerce-Protocol/.github | 95b77fd2c4f48336963147086010b52fdec0e439 | 2026-10-05 |
| Universal-Commerce-Protocol/samples | cdb291c452acf7f1253096b0e1ad7c45ecd4b5c7 | 2026-10-05 |
| Universal-Commerce-Protocol/conformance | 016ecbc22240affdec4429a60d539bedd04ab51b | 2026-09-07 |
| Universal-Commerce-Protocol/js-sdk | 6f7a6da79739a2ccf868953ed5138f85fb2b6ce3 | 2026-10-05 |
| Universal-Commerce-Protocol/python-sdk | 8f13fda131ec81012c34c1c7ac5d8703aecafe9a | 2026-10-05 |

## Identity and governance

- UCP is an open commerce protocol published by the GitHub organization `Universal-Commerce-Protocol` under the Apache-2.0 license with the copyright holder "UCP Authors" [src-ucp-governance].
- Governance is defined in `GOVERNANCE.md` of the organization's `.github` repository [src-ucp-governance]. There is no foundation: the Governing Council (GC) is "the ultimate owner of all UCP assets", and Google is the custodian of the ucp.dev domain.
- Governing Council: 5 seats. Google and Shopify each hold 1 permanent seat; 3 seats are elected by the permanent founding members, re-elected annually. Google holds the proxy vote for all open seats until December 2028 [src-ucp-governance]. As of 2026-10-11 `MAINTAINERS.md` lists Amit Handa (Google), Ilya Grigorik (Shopify), Twum Djin (Stripe) and 2 open seats [src-ucp-maintainers].
- Domain Tech Councils (DTC), 16 members each, elected by the GC every 6 months, majority vote [src-ucp-governance]:
  - Shopping TC: 4 permanent from Google and 4 from Shopify plus 8 from any organization. `MAINTAINERS.md` lists 17 names including Etsy, Meta, Amazon, Target, Microsoft, Stripe, Salesforce and Wayfair members [src-ucp-maintainers].
  - Food TC: 10 permanent (6 Google, 1 each DoorDash, Toast, Square, Uber Eats) plus 6 open.
  - Lodging TC: 12 permanent (6 Google, 1 each Amadeus, Booking.com, Expedia, Hilton, Marriott, Trip.com) plus 4 open.
  - Payments TC: 12 permanent (3 Google, 3 Shopify, 1 each Adyen NV, Ant International, Coinbase, Global Payments, PayPal, Stripe) plus 4 open.
- Domain Working Groups (DWG) can be chartered by 3 or more organizations and are overseen by a DTC [src-ucp-governance].
- Every code change needs approval by at least 1 maintainer; contributors sign the Google CLA [src-ucp-governance].

- Repository: `Universal-Commerce-Protocol/ucp` was created on GitHub 2025-12-31, default branch `main`, license Apache-2.0 (GitHub API, 2026-10-11) [src-ucp-gh-repo].
- Contribution and maintainer rosters are governance facts dated 2026-10-11. A roster discrepancy exists: the 2026-04-24 announcement names Greg Smith as the Amazon member, while `MAINTAINERS.md` lists Greg Smith under Google and Jordan Williams under Amazon (see Conflicts) [src-ucp-announcements] [src-ucp-maintainers].
- Governance timeline from `docs/documentation/announcements.md` [src-ucp-announcements]:

| Date | Event |
| --- | --- |
| 2026-01-11 | Protocol release v2026-01-11 |
| 2026-01-23 | Protocol release v2026-01-23 |
| 2026-04-08 | Protocol release v2026-04-08 |
| 2026-04-24 | Tech Council expanded to 16 seats; new members from Amazon, Meta, Microsoft, Stripe, Salesforce (Discussion #379) |
| 2026-04-28 | Stripe joins the Governing Council; 2 more elected open seats added (Discussion #396) |
| 2026-07-16 | Food Technical Council formed: Block (Square), DoorDash, Google, Toast, Uber Eats (Discussion #593) |
| 2026-08-11 | Lodging Technical Council formed: Amadeus, Booking.com, Expedia, Google, Hilton, Marriott, Trip.com (Discussion #714) |
| 2026-08-25 | Protocol release v2026-08-25 |
| 2026-09-02 | Payments Technical Council formed: Adyen NV, Ant International, Coinbase, Global Payments, Google, PayPal, Shopify, Stripe (Discussion #798) |
| 2026-09-25 | Draft Lodging Booking capability `dev.ucp.lodging.booking` merged (Discussion #864) |

- Naming. UCP is the Universal Commerce Protocol. It is not Google's "Universal Cart" shopping feature; Universal Cart is a Google product surface announced separately (see Relations and Seed audit).

## Versions and changelog

Versions are dated `YYYY-MM-DD` identifiers. Git tags carry a `v` prefix [src-ucp-versioning] [src-ucp-gh-releases].

| Tag | Tag commit | GitHub release published | Highlights |
| --- | --- | --- | --- |
| v2026-01-11 | 806a5b74 | 2026-01-23T17:58Z (created retroactively; the release notes are mostly tooling PRs) | Launch version. Already contained `dev.ucp.shopping.ap2_mandate` (`source/schemas/shopping/ap2_mandate.json`, `"version": "2026-01-11"`), checkout, order, fulfillment, discount, buyer consent, identity linking spec page |
| v2026-01-23 | dcf7eac7 | 2026-01-23T22:48Z | PR #115 "refactor!: updates for 2026-01-23 release" (breaking) |
| v2026-04-08 | a25a4a24 | 2026-04-09T01:48Z | Cart (PR #73, merged 2026-01-26), catalog search and lookup (PR #55, 2026-03-08), request and response signing (PR #156, 2026-02-17), signals for authorization and abuse (PR #203, 2026-03-13, breaking), errors, totals, eligibility, attribution, Get Order, embedded cart; identity linking OAuth 2.0 with capability-driven scopes cherry-picked into this release by PR #431 (merged 2026-05-20) |
| v2026-08-25 | cd78fb38 | 2026-08-25T13:53Z | Latest release as of 2026-10-11. Actions primitive (PR #582), 3DS2 via actions (PR #458), `$requestConstraints`, PAN and network token as distinct credential types (PR #424), payment terms, split payments (PR #409), location search and lookup, fractional quantities, loyalty extension (PR #340, merged 2026-05-19), Web Bot Auth interop (PR #483, merged 2026-07-03), `keys[]` as the sole canonical signing key field (PR #566), extensible buyer consent, permalink (PR #523), namespace authority binding, `map_order`; payment extensions moved from `dev.ucp.shopping.*` to `dev.ucp.common.payment.*` (PR #741, merged 2026-08-25) |

Sources: [src-ucp-gh-releases] [src-ucp-release-20260825] [src-ucp-release-20260408] [src-ucp-gh-prs].

- Latest release check: the GitHub releases and tags APIs list exactly four tags (v2026-01-11, v2026-01-23, v2026-04-08, v2026-08-25) on 2026-10-11, so v2026-08-25 is the latest [src-ucp-gh-releases].
- `main` is ahead of v2026-08-25: the commit read (ad9950b, 2026-10-09) adds the draft capabilities `dev.ucp.common.ask` (`source/schemas/common/ask.json`) and `dev.ucp.lodging.booking` plus `dev.ucp.lodging.policy.cancellation`, and extends `dev.ucp.common.payment.ap2_mandate` to `dev.ucp.lodging.booking`. These are not in any release [src-ucp-repo-main].
- AP2 extension rename. Release notes for v2026-08-25 say payment extensions "migrated" from `dev.ucp.shopping.*` to `dev.ucp.common.payment.*` (the notes list `split_payments`, `payment_terms`, `ap2_mandates`). The schema `name` values are exact: v2026-04-08 `source/schemas/shopping/ap2_mandate.json` has `"name": "dev.ucp.shopping.ap2_mandate"`; v2026-08-25 `source/schemas/common/payment_ap2_mandate.json` has `"name": "dev.ucp.common.payment.ap2_mandate"`. The release-notes spelling `ap2_mandates` (plural) does not match the schema name; the schema wins [src-ucp-schema-ap2] [src-ucp-schema-ap2-0408] [src-ucp-release-20260825].
- Release model (from the overview at v2026-08-25): a release `D` is a certified snapshot of services, transport bindings, capabilities, extensions and shared schemas. Every UCP-defined (`dev.ucp.*`) service, capability and extension declares `version` `D` in release `D`; a platform must reject a `dev.ucp.*` entry whose version differs from `ucp.version`. Third-party extensions (`com.{vendor}.*`, `org.{org}.*`) version independently and declare compatibility through `requires`. Payment-handler versions are set by their authors [src-ucp-overview].
- Correction to the seed "capabilities have been versioned independently since 2026-08-25": v2026-08-25 tightened the release contract (PR #614, merged 2026-08-10). Core `dev.ucp.*` capabilities move in lockstep with the release date; only third-party capabilities and extensions version independently. The release notes' executive summary does use the phrase "independent capability versioning" [src-ucp-overview] [src-ucp-release-20260825].
- Backports amend a published release in place ("A dated release works like a long-term-support channel"); breaking backports need Governance Council approval. Release branches are named `release/YYYY-MM-DD`; breaking PRs carry `!` and are announced in Discussions 2 weeks before merge [src-ucp-overview] [src-ucp-versioning].
- Pre-release: businesses must not advertise a non-date version such as `"draft"` in public discovery [src-ucp-overview].
- Docs channels: ucp.dev serves `/latest/` and `/draft/` paths (mkdocs `mike` versioning, PR #106) [src-ucp-release-20260111] [src-ucp-site].
- Breaking changes in v2026-08-25 (selection): fulfillment flags renamed to drop `allows_`; `consent` in `buyer_consent.json` changed from booleans to a reverse-DNS keyed map (`dev.ucp.consent.*`); `signing_keys[]` removed from `profile.json` in favor of `keys[]`; primitive schemas moved under `common/types/` (changing `$id` URLs); `quantity` became integer or `measure.json` object; `retail_location.json` replaced by `common/types/location.json`; `cart.id` omitted in update requests [src-ucp-release-20260825].

## Actors and roles

Definitions from `docs/specification/glossary.md` and the overview "Payment Architecture" section at v2026-08-25 [src-ucp-glossary] [src-ucp-overview].

| Role | Definition in the spec | Notes |
| --- | --- | --- |
| Platform | The consumer-facing surface (AI agent, app, website) acting for the user to discover businesses and facilitate commerce | Publishes a platform profile at a URI it advertises in `UCP-Agent`. Executes payment-handler logic to obtain an opaque credential. Must not touch raw credentials (SHOULD NOT). Examples in public sources: Google AI Mode and Gemini (see Ecosystem) |
| Business | The entity selling goods or services; acts as the Merchant of Record (MoR), keeping financial liability and order ownership | Publishes `/.well-known/ucp`, computes the capability intersection, sets checkout status, configures handlers |
| Buyer | The transacting customer; synonym for user or consumer | Must review and place the order in a trusted UI unless the AP2 extension is active [src-ucp-checkout] |
| Payment Credential Provider (CP) | A trusted entity (such as a digital wallet) that manages and executes the user's payment and identity credentials | Authors payment handler specifications, for example `com.google.pay` (Google Pay) and `dev.shopify.shop_pay` (Shop Pay) |
| Payment Service Provider (PSP) | Infrastructure that processes payments, authorizations and settlements for the business | Receives the opaque credential from the business and captures funds |
| Identity Provider (IdP) | Party that issues user identity tokens; since v2026-08-25 an IdP can be delegated and chained to new businesses through the Accelerated IdP flow | Defined in `common/identity-linking` [src-ucp-identity-linking] |
| UCP governing body | Owner of the `dev.ucp.*` namespace | Vendors must use their own reverse-domain namespace |

- Trust triangle: business and credential provider have a prior legal and technical relationship; the platform calls the credential provider to tokenize but does not own the funds; the platform passes the token or mandate to the business [src-ucp-overview].
- Division of labor: the credential provider defines the handler spec; the business configures the handler (keys, merchant ids); the platform executes the handler to acquire a token [src-ucp-overview].
- Payment handlers are specifications, not entities. UCP itself defines the declaration structure but "currently no concrete handler" (v2026-08-25 overview), so handler specs live with their authors [src-ucp-overview].

## Core objects with exact field names

All names below were read from the JSON Schemas at tag v2026-08-25 (`source/schemas/...`). "Req" reflects the schema `required` list. `ucp_request` annotations mark request direction (`omit`, `optional`, `required`).

### Profile document (`source/schemas/profile.json`, `ucp.json`)

Business profiles live at `/.well-known/ucp`; platform profiles live at the URI advertised in `UCP-Agent` [src-ucp-overview] [src-ucp-schema-profile].

| Field | Type | Req | Meaning | File |
| --- | --- | --- | --- | --- |
| `ucp` | object | Required | Protocol metadata | source/schemas/profile.json |
| `ucp.version` | string `YYYY-MM-DD` | Required | Core release version of this profile | source/schemas/ucp.json |
| `ucp.services` | object, keyed by reverse-domain name (for example `dev.ucp.shopping`), each value an array of bindings | Required (may be empty) | Service registry | source/schemas/ucp.json |
| `ucp.capabilities` | object keyed by capability name, each value an array of entries | Optional | Capability and extension registry | source/schemas/ucp.json |
| `ucp.payment_handlers` | object keyed by handler name, each value an array of handler instances | Required (may be empty) | Payment handler registry | source/schemas/ucp.json |
| `ucp.supported_versions` | object mapping older version to profile URI | Optional (business only) | Leaf profiles for older releases; leaf profiles must not contain it | source/schemas/ucp.json |
| `ucp.map_order` | object | Optional | Preferred key order for `services`, `capabilities`, `payment_handlers` (added v2026-08-25) | source/schemas/ucp.json |
| `ucp.status` | string enum `success`, `error` | Optional (responses) | Application-level status of the operation | source/schemas/ucp.json |
| `keys` | array of public JWK | Optional | Canonical signing key set (RFC 7517 JWK Set); replaced `signing_keys[]` in v2026-08-25; private members (`d`, `p`, `q`, `dp`, `dq`, `qi`, `oth`, `k`) are forbidden | source/schemas/profile.json |
| `keys[].kid`, `keys[].kty` | string | Required | Key id (JWK SHA-256 thumbprint when used for Web Bot Auth) and key type (`EC`, `OKP`) | source/schemas/profile.json |
| `keys[].crv`, `x`, `y`, `alg`, `use` | string | Conditional | `P-256` pairs with `ES256`, `P-384` with `ES384`, `Ed25519` with `EdDSA` | source/schemas/profile.json |

Common entity fields for every service, capability and handler entry (`ucp.json#/$defs/entity`): `version` (required), `spec`, `schema`, `id`, `config` [src-ucp-schema-profile].

- Service binding (`service.json`): `transport` required, enum `rest`, `mcp`, `a2a`, `embedded`; `endpoint` optional. REST is described by OpenAPI 3.x, MCP by OpenRPC, A2A by an Agent Card, embedded by OpenRPC. For A2A the `endpoint` is the Agent Card URL [src-ucp-overview].
- Capability entry (`capability.json`): adds `extends` (string or array) for extensions [src-ucp-overview].
- Payment handler entry (`payment_handler.json`): adds `available_instruments` (array of instrument types with optional `constraints`) [src-ucp-overview].
- Extension compatibility metadata: `requires.protocol` (`min`, `max`) and `requires.capabilities` [src-ucp-schema-profile].
- Seed check: the seed listed `ucp { version, services, capabilities, payment_handlers, supported_versions }` plus a JWK set. Confirmed, with two refinements: `supported_versions` is business-only and optional, and the JWK set is the top-level `keys[]` (outside `ucp`) [src-ucp-schema-profile].

### Capability namespace (v2026-08-25 release, plus drafts on `main`)

Capability names are `{reverse-domain}.{service}.{capability}`; the schema URL host must match the reverse-DNS authority ("provenance, not trust") [src-ucp-overview].

| Name | Kind | Schema file | Status |
| --- | --- | --- | --- |
| `dev.ucp.shopping.checkout` | capability | shopping/checkout.json | released since v2026-01-11 |
| `dev.ucp.shopping.cart` | capability | shopping/cart.json | released v2026-04-08 |
| `dev.ucp.shopping.catalog.search` | capability | shopping/catalog_search.json | released v2026-04-08 |
| `dev.ucp.shopping.catalog.lookup` | capability | shopping/catalog_lookup.json | released v2026-04-08 |
| `dev.ucp.shopping.order` | capability | shopping/order.json | released since v2026-01-11 |
| `dev.ucp.shopping.permalink` | capability | shopping/permalink.json | released v2026-08-25 |
| `dev.ucp.shopping.fulfillment` | extension of checkout (and cart) | shopping/fulfillment.json | released |
| `dev.ucp.shopping.discount` | extension of checkout and cart | shopping/discount.json | released |
| `dev.ucp.shopping.buyer_consent` | extension | shopping/buyer_consent.json | released; reworked v2026-08-25 |
| `dev.ucp.common.identity_linking` | capability | common/identity_linking.json | released |
| `dev.ucp.common.loyalty` | extension | common/loyalty.json | released (PR #340, 2026-05-19) |
| `dev.ucp.common.location.search`, `dev.ucp.common.location.lookup` | capabilities | common/location_search.json, location_lookup.json | released v2026-08-25 |
| `dev.ucp.common.payment.ap2_mandate` | extension of checkout | common/payment_ap2_mandate.json | released v2026-08-25 (was `dev.ucp.shopping.ap2_mandate` in v2026-01-11 to v2026-04-08) |
| `dev.ucp.common.payment.authentication` | extension (3DS2 via actions) | common/payment_authentication.json | released v2026-08-25 |
| `dev.ucp.common.payment.split_payments` | extension | common/payment_split_payments.json | released v2026-08-25 |
| `dev.ucp.common.payment.terms` | extension | common/payment_terms.json | released v2026-08-25 |
| `dev.ucp.common.ask` | capability | common/ask.json | draft on `main` only |
| `dev.ucp.lodging.booking`, `dev.ucp.lodging.policy.cancellation` | capability, extension | lodging/booking.json, lodging/policy_cancellation.json | draft on `main` only (merged 2026-09-25) |

Sources: [src-ucp-overview] [src-ucp-repo-main] [src-ucp-announcements].

### Checkout (`source/schemas/shopping/checkout.json`, name `dev.ucp.shopping.checkout`)

| Field | Type | Req | Meaning | Request direction |
| --- | --- | --- | --- | --- |
| `ucp` | object | Required | Response envelope with version, active capabilities, `payment_handlers` | omit |
| `id` | string | Required | Checkout session id | omit |
| `line_items` | array | Required | Items being checked out | create and update required, complete omit |
| `buyer` | object | Optional | Buyer representation | create and update optional |
| `context` | object | Optional | Buyer signals for localization | create and update optional |
| `signals` | object | Optional | Platform-observed signals: `dev.ucp.buyer_ip`, `dev.ucp.user_agent` | optional |
| `attribution` | object | Optional | Referral and ad attribution | optional |
| `status` | string enum | Required | `incomplete`, `requires_escalation`, `ready_for_complete`, `complete_in_progress`, `completed`, `canceled` | omit |
| `currency` | string (ISO 4217) | Required | Set by the business | omit |
| `totals` | object | Required | Totals | omit |
| `actions` | object | Optional | Outstanding extension-defined actions (v2026-08-25) | omit |
| `messages` | array | Optional | Errors, warnings, info | omit |
| `links` | array | Required | Privacy policy, terms; "mandatory for legal compliance" | omit |
| `policies` | array | Optional | Return, refund, warranty terms (v2026-08-25) | omit |
| `expires_at` | string (RFC 3339) | Optional | Default TTL 6 hours from creation | omit |
| `continue_url` | string | Optional | Handoff URL; must be present when status is `requires_escalation` | omit |
| `payment` | object | Optional | `instruments[]`; required on complete | create and update optional, complete required |
| `order` | object | Optional | `id`, `label`, `permalink_url` once completed | omit |

Source: [src-ucp-schema-checkout].

### Payment objects (`source/schemas/common/types/`)

| Object | Field | Type | Req | Meaning |
| --- | --- | --- | --- | --- |
| `payment.json` | `instruments` | array | Optional | Payment instruments, each tied to a handler through `handler_id` |
| `payment_instrument.json` | `id` | string | Required | Instrument instance id |
| | `handler_id` | string | Required | The `id` of the handler instance that produced it |
| | `type` | string | Required | Instrument category, for example `card` |
| | `billing_address` | object | Optional | Billing address |
| | `credential` | object | Optional | Payment credential (discriminated by `type`) |
| | `display` | object | Optional | Display-safe data |
| | `selected` | boolean | Optional | Selected by the user |
| `token_credential.json` | `type`, `token` | string | Required | Handler-specific token (example type `stripe_token`) |
| `pan_credential.json` | `type` = `pan`, `number` | string | Required | Funding PAN; also `expiry_month`, `expiry_year`, `name`, `cvc` |
| `network_token_credential.json` | `type` = `network_token`, `number`, `cryptogram` | string | Required | Network or wallet-provisioned token; also `expiry_month`, `expiry_year`, `name`, `eci_value`, `token_requestor_id` |
| `card_credential.json` | `type` = `card`, `card_number_type` | string | Required | Older combined card credential; `card_number_type` (`fpan`, `network_token`, `dpan`) is marked deprecated |
| `card_payment_instrument.json` | `type` = `card`, `network` | string | `type` required | `network` is the elected network for co-badged cards |

Source: [src-ucp-schema-payment]. PAN and network token became distinct credential types in v2026-08-25 (PR #424) [src-ucp-release-20260825].

### AP2 extension (`source/schemas/common/payment_ap2_mandate.json`)

| Field | Type | Req | Meaning |
| --- | --- | --- | --- |
| `ap2.merchant_authorization` | string, pattern `<header>..<signature>` | Response only (`ucp_request: omit`) | JWS detached content (RFC 7515 Appendix F) over the checkout body without `ap2`, canonicalized with JCS; header carries `alg` (ES256, ES384 or ES512) and `kid` |
| `ap2.checkout_mandate` | string, SD-JWT with key binding | Required on `complete`, omitted on create and update | User authorization for the checkout; contains the full checkout including `ap2.merchant_authorization` |
| Error codes | enum | | `mandate_required`, `agent_missing_key`, `mandate_invalid_signature`, `mandate_expired`, `mandate_scope_mismatch`, `merchant_authorization_invalid`, `merchant_authorization_missing` |

- The payment mandate is placed in `payment.instruments[*].credential.token` [src-ucp-ap2-spec].
- Business config example: `"vp_formats_supported": {"dc+sd-jwt": {}}` [src-ucp-ap2-spec].
- On `main` (draft) the same `ap2` object also extends `dev.ucp.lodging.booking` [src-ucp-repo-main].

### Order (`source/schemas/shopping/order.json`, name `dev.ucp.shopping.order`)

| Field | Type | Req | Meaning |
| --- | --- | --- | --- |
| `ucp` | object | Required | Envelope |
| `id` | string | Required | Order id |
| `label` | string | Optional | Business-provided label |
| `checkout_id` | string | Required | Originating checkout for reconciliation |
| `permalink_url` | string | Required | Order page on the merchant site |
| `line_items` | array | Required | Purchased items; can change after edits or exchanges |
| `fulfillment` | object | Required | Expectations and fulfillment events |
| `adjustments` | array | Optional | Refunds, returns, credits, disputes, cancellations |
| `currency` | string | Required | Must match the checkout currency |
| `totals` | object | Required | Totals |
| `policies`, `messages`, `attribution` | | Optional | Snapshots and messages |
| platform config `webhook_url` | string | Required in the platform's `dev.ucp.shopping.order` config | Where the business sends order events |

- Fulfillment event (`types/fulfillment_event.json`): `id`, `occurred_at`, `type` (open string; examples `processing`, `shipped`, `in_transit`), `line_items` required; `tracking_number`, `tracking_url`, `carrier`, `description` optional.
- Adjustment (`types/adjustment.json`): `id`, `type` (open string; typical `refund`, `return`, `credit`, `price_adjustment`, `dispute`, `cancellation`), `occurred_at`, `status` (`pending`, `completed`, `failed`) required; `line_items`, `totals` (signed), `description` optional.

Source: [src-ucp-schema-order].

### Cart (`source/schemas/shopping/cart.json`, name `dev.ucp.shopping.cart`)

Required: `ucp`, `id`, `line_items` (full replacement on update), `currency`, `totals`. Optional: `context`, `signals`, `attribution`, `buyer`, `actions`, `messages`, `links`, `policies`, `continue_url`, `expires_at`. A checkout can be created from a cart with `cart_id`; the business must then use cart contents [src-ucp-schema-cart].

