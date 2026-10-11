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

## Message flows step by step

Spec references are to files at tag v2026-08-25. All examples in the spec are labeled with `{{ ucp_version }}` templates; the site must label any payload as "Illustrative example, spec version 2026-08-25".

### Flow 1: discovery, version selection and capability negotiation (happy path)

1. Platform fetches `GET https://{business}/.well-known/ucp` (MAY; SHOULD cache per HTTP cache headers). Profiles must be HTTPS, must not redirect, must send `Cache-Control: public` with `max-age` of at least 60 seconds (overview "Profile Requirements") [src-ucp-overview].
2. Platform selects a protocol version from `ucp.version` and the keys of `ucp.supported_versions` (SHOULD prefer the newest). If it picks an older version, it fetches the leaf profile and must check that its `ucp.version` equals the selected key [src-ucp-overview].
3. Platform validates authority binding for each capability `schema` URL (WHATWG parse, `https`, no userinfo, at least two labels, reversed host must equal or be a label-aligned prefix of the name; no redirects) and rejects failures [src-ucp-overview].
4. Platform sends its first operation with `UCP-Agent: profile="<platform profile URL>"` (RFC 8941 dictionary syntax), or with `meta["ucp-agent"].profile` over MCP [src-ucp-overview].
5. Business fetches and validates the platform profile (unless cached), checks the version (`version_unsupported` otherwise), and computes the intersection: keep capabilities present on both sides; select the highest version present in both arrays; drop capabilities with no shared version; prune extensions whose parents are all absent; repeat pruning until stable [src-ucp-overview].
6. Business returns a `ucp` envelope with `version` and the active `capabilities` in every response [src-ucp-overview].

Failures (overview "Error Handling"): `invalid_profile_url` (REST 400, MCP -32001), `profile_unreachable` (424), `profile_malformed` (422), `version_unsupported` (422), `capabilities_incompatible` (HTTP 200 with a UCP response). Discovery and version failures are transport errors with an optional `continue_url`; capability failure is a UCP response with an optional `continue_url` [src-ucp-overview]. Businesses SHOULD bound discovery cost (fixed-size cache, global rate limit, backoff, or async discovery answering `503` with `Retry-After`) and must reject profile URLs that resolve to special-use IP ranges such as `169.254.169.254` [src-ucp-overview].

### Flow 2: checkout over REST (happy path, buyer completes in trusted UI)

1. `POST /checkout-sessions` with `line_items` (and optionally `buyer`, `context`, `payment`), headers `UCP-Agent`, `Idempotency-Key` and `Request-Id` (all three marked required in the OpenAPI), plus optional `Authorization`, `X-API-Key`, `Signature`, `Signature-Input`, `Content-Digest` [src-ucp-rest-openapi]. Response: checkout with `id`, `status` (usually `incomplete`), `ucp.payment_handlers`, `totals`, `links`, `expires_at` (default 6 hours) [src-ucp-schema-checkout].
2. `PUT /checkout-sessions/{id}` sends the whole resource; it is a full replacement, not a patch [src-ucp-checkout].
3. When all data is present the business returns `ready_for_complete` [src-ucp-checkout].
4. Payment acquisition happens between platform and credential provider (Flow 4).
5. `POST /checkout-sessions/{id}/complete` with `payment.instruments[]`. Response: `completed` with `order` (`id`, `permalink_url`), or `complete_in_progress` for asynchronous processing [src-ucp-checkout].
6. Business must send a confirmation email after completion; a completed checkout is immutable [src-ucp-checkout].
7. `GET /checkout-sessions/{id}` retrieves state; `POST /checkout-sessions/{id}/cancel` cancels any session not `completed` or `canceled` [src-ucp-checkout] [src-ucp-rest-openapi].

Guideline: an agent may fill the checkout, but must hand it to "a trusted and deterministic UI" for the user to review and place the order, unless the AP2 extension is active [src-ucp-checkout].

Failures: `requires_escalation` must carry `continue_url` and at least one message with severity `requires_buyer_input` or `requires_buyer_review`; an outstanding Action blocking completion yields `incomplete` with a `recoverable` error whose `path` points at the Action; a lost Complete response is recovered by `GET` with bounded backoff and, only if still unknown, by resending the identical request with the same idempotency key; idempotency key reuse with a different payload gives `409` [src-ucp-checkout] [src-ucp-signatures].

### Flow 3: escalation and handoff with `continue_url`

1. Business returns `status: requires_escalation`, `messages[]` (severity `requires_buyer_input` or `requires_buyer_review`) and `continue_url` (absolute HTTPS) [src-ucp-checkout].
2. Platform resolves any `recoverable` errors first, then must open `continue_url` for the buyer [src-ucp-checkout].
3. The buyer finishes on the business UI; the session reaches `completed` [src-ucp-checkout].
`continue_url` can be server-state backed (`/checkout-sessions/{checkout_id}`, recommended) or a stateless checkout permalink; platforms SHOULD prefer the business-provided URL [src-ucp-checkout].

### Flow 4: payment handler negotiation, acquisition and completion

1. Negotiation: the business advertises handlers (for example `com.google.pay`, `dev.shopify.shop_pay`, or a processor tokenizer) in its profile and in `checkout.ucp.payment_handlers`, filtered by cart context, with resolved `available_instruments` that the platform must treat as authoritative [src-ucp-overview].
2. Acquisition: the platform runs the handler's logic directly with the credential provider (for example exchanging credentials for a network token). The business is not involved [src-ucp-overview].
3. Completion: the platform submits `payment.instruments[]` with `handler_id`, `type` and an opaque `credential` (`token`, `pan` or `network_token` types). Credentials flow platform to business only; the business must not echo them back [src-ucp-overview] [src-ucp-schema-payment].
4. Exactly one instrument per submission unless `dev.ucp.common.payment.split_payments` is active; violations get `payment_failed` [src-ucp-overview].
A generic `Tokenization API` (`POST /tokenize`, `POST /detokenize`) is published as a handler building block [src-ucp-tokenization-openapi].

### Flow 5: 3DS2 through Actions (`dev.ucp.common.payment.authentication`, v2026-08-25)

1. Both sides negotiate the extension (extends checkout) [src-ucp-payment-auth].
2. After complete, the business returns `complete_in_progress` (or `incomplete`) with an `actions` entry of type `dev.ucp.common.payment.device_data_collection` or `dev.ucp.common.payment.three_ds_challenge`, each with an `id` and `config` (for example `config.url`, `config.payment_instrument_id`) [src-ucp-payment-auth].
3. Platform runs the browser surface; the embedded surface reports `action.ready`, `action.done` or `action.error` (payment-actions embedded OpenRPC) [src-ucp-embedded-openrpc].
4. Platform confirms the result with `GET /checkout-sessions/{id}` (the Action signal is not authoritative) [src-ucp-checkout].
The extension does not carry EMV 3DS messages; the business, handler and PSP own the 3DS protocol state [src-ucp-payment-auth].

### Flow 6: AP2 mandates inside a UCP checkout (spec flow; live use unverified)

1. Business advertises `dev.ucp.common.payment.ap2_mandate` (extends `dev.ucp.shopping.checkout`, config `vp_formats_supported` with `dc+sd-jwt`); the platform advertises it and, under the trusted platform provider model, publishes at least one key in `keys` [src-ucp-ap2-spec].
2. If the extension is in the intersection the session is "Security Locked": neither party may fall back to an unprotected checkout [src-ucp-ap2-spec].
3. Every checkout response carries `ap2.merchant_authorization` (detached JWS over the JCS-canonicalized checkout without `ap2`; header `alg`, `kid`). The platform must verify it before showing the checkout to the user [src-ucp-ap2-spec].
4. On complete the platform sends `ap2.checkout_mandate` (SD-JWT with key binding, containing the full checkout including the merchant signature) and the payment mandate inside `payment.instruments[*].credential.token` [src-ucp-ap2-spec].
5. The business must reject a complete request without `ap2.checkout_mandate`; failures use `mandate_required`, `agent_missing_key`, `mandate_invalid_signature`, `mandate_expired`, `mandate_scope_mismatch`, `merchant_authorization_invalid`, `merchant_authorization_missing` [src-ucp-ap2-spec] [src-ucp-schema-ap2].
Over A2A, the merchant signature appears as `ap2.merchant_authorization` and the mandate as `ap2.checkout_mandate` inside `DataPart` objects (`a2a.ucp.checkout`, `a2a.ucp.checkout.payment`) [src-ucp-a2a].
Production use of AP2 mandates in any UCP deployment is unverified as of 2026-10-11 (ATLAS_FOLLOWUP 2.1.9; no public source found in this pass).

### Flow 7: identity linking (`dev.ucp.common.identity_linking`)

1. Platform resolves the authorization server: RFC 9728 protected-resource metadata (`/.well-known/oauth-protected-resource`), then RFC 8414 metadata at `/.well-known/oauth-authorization-server`, falling back to `/.well-known/openid-configuration` only on `404`; the `issuer` must match byte for byte [src-ucp-identity-linking].
2. OAuth 2.0 Authorization Code flow with PKCE `S256` (plain PKCE forbidden); the business must return `iss` (RFC 9207) and enforce exact `redirect_uri` matching [src-ucp-identity-linking].
3. Scopes are capability-derived, for example `dev.ucp.shopping.checkout:manage`, `dev.ucp.shopping.order:read`, `dev.ucp.shopping.order:manage` [src-ucp-identity-linking] [src-ucp-checkout].
4. Accelerated IdP flow (v2026-08-25): the platform gets a JWT authorization grant from a trusted IdP by RFC 8693 token exchange and presents it at the business token endpoint with the RFC 7523 JWT bearer grant; the platform must not present a raw IdP token to a business. This profiles `draft-ietf-oauth-identity-chaining` [src-ucp-identity-linking].
5. Revocation: businesses must implement RFC 7009; SHOULD support the OpenID RISC profile for account events [src-ucp-identity-linking].
Access levels: public (no credentials), agent-authenticated (platform credentials), user-authenticated (platform credentials plus user token) [src-ucp-identity-linking].
Failures: `identity_required`, `insufficient_scope` (with `WWW-Authenticate: Bearer` challenges), `identity_optional` [src-ucp-identity-linking].

### Flow 8: order events by webhook

1. The platform publishes `config.webhook_url` in its `dev.ucp.shopping.order` capability entry [src-ucp-order].
2. The business POSTs the full current order snapshot to that URL (`orderEvent` webhook, operation `order_event_webhook`) with Standard Webhooks headers `Webhook-Id` and `Webhook-Timestamp`, and an RFC 9421 signature (must be signed) [src-ucp-order] [src-ucp-rest-openapi].
3. The platform verifies the signature and must reject events where the signer's profile does not match the order's business [src-ucp-order].
4. `GET /orders/{id}` (MCP `get_order`) is for reconciliation [src-ucp-order].

## State machines

### Checkout `status`

| From | Event | To |
| --- | --- | --- |
| (new) | Create Checkout | `incomplete` (or later states if all data supplied) |
| `incomplete` | data needs buyer input or review | `requires_escalation` |
| `requires_escalation` | resolved via update | `incomplete` |
| `incomplete` | all information collected, no Action outstanding | `ready_for_complete` |
| `ready_for_complete` | Complete Checkout accepted asynchronously | `complete_in_progress` |
| `ready_for_complete` or `complete_in_progress` | order placed | `completed` (terminal; `order` present) |
| `requires_escalation` | buyer finishes via `continue_url` | `completed` |
| any | session invalid or expired, or Cancel Checkout | `canceled` (terminal) |

Rules: Update and new Complete are forbidden during `complete_in_progress`; `completed` is immutable; default `expires_at` is creation plus 6 hours [src-ucp-checkout] [src-ucp-schema-checkout].

### Session security lock (AP2)

`unlocked` to `security locked` once `dev.ucp.common.payment.ap2_mandate` is in the intersection; there is no transition back for that session [src-ucp-ap2-spec].

### Adjustment `status`

`pending` to `completed` or `failed` (enum in `adjustment.json`) [src-ucp-schema-order].

### Response `ucp.status`

`success` or `error` [src-ucp-schema-profile].

## Transports

| Transport | Description format | Binding facts | Source |
| --- | --- | --- | --- |
| REST | OpenAPI 3.1 (`services/shopping/rest.openapi.json`) | Paths appended to `endpoint`. Checkout: `POST /checkout-sessions`, `GET` and `PUT /checkout-sessions/{id}`, `POST /checkout-sessions/{id}/complete`, `POST /checkout-sessions/{id}/cancel`. Cart: `POST /carts`, `GET` and `PUT /carts/{id}`, `POST /carts/{id}/cancel`. Catalog: `POST /catalog/search`, `POST /catalog/lookup`, `POST /catalog/product`. Order: `GET /orders/{id}`. Common: `POST /locations/search`, `POST /locations/lookup`. Webhook `orderEvent` | [src-ucp-rest-openapi] |
| MCP | OpenRPC (`services/shopping/mcp.openrpc.json`), streamable HTTP | Tools: `create_checkout`, `get_checkout`, `update_checkout`, `complete_checkout`, `cancel_checkout`, `create_cart`, `get_cart`, `update_cart`, `cancel_cart`, `search_catalog`, `lookup_catalog`, `get_product`, `get_order`; common: `search_locations`, `lookup_locations`. Profile in `meta["ucp-agent"]`. The glossary says capabilities map 1:1 to MCP tools | [src-ucp-mcp-openrpc] [src-ucp-glossary] |
| A2A | Agent Card at `endpoint`; UCP A2A extension URI `https://ucp.dev/{version}/specification/reference` | Headers `UCP-Agent` and `X-A2A-Extensions`; data in `DataPart` keys `a2a.ucp.checkout`, `a2a.ucp.checkout.payment`, `a2a.ucp.checkout.signals` | [src-ucp-a2a] |
| Embedded (EP) | OpenRPC (`services/shopping/embedded.openrpc.json`) | Checkout messages `ec.ready`, `ec.auth`, `ec.error`, `ec.start`, `ec.complete`, `ec.messages.change`, `ec.line_items.change`, `ec.buyer.change`, `ec.totals.change`, `ec.payment.change`, `ec.payment.instruments_change_request`, `ec.payment.credential_request`, `ec.window.open_request`, `ec.fulfillment.change`, `ec.fulfillment.address_change_request`; cart messages `ep.cart.*`; payment actions `action.ready`, `action.done`, `action.error` | [src-ucp-embedded-openrpc] |

- HTTP headers in the REST OpenAPI: `UCP-Agent` (required), `Request-Id` (required), `Idempotency-Key` (required on state-changing operations), `Authorization`, `X-API-Key`, `Signature`, `Signature-Input`, `Content-Digest`, `User-Agent`, `Content-Type`, `Accept`, `Accept-Language`, `Accept-Encoding`; webhooks add `Webhook-Timestamp` and `Webhook-Id`; Web Bot Auth-shape requests add `Signature-Agent` [src-ucp-rest-openapi] [src-ucp-signatures].
- Protocol errors: 401, 403, 409 (idempotency key reused with a different payload), 429, 500, 503, with MCP codes -32000 or -32603; `Retry-After` (REST) or `error.data.retry_after` (MCP) on 429 and 503 [src-ucp-overview].

## Cryptography and standards used

| Item | Standard | Use in UCP | Source |
| --- | --- | --- | --- |
| HTTP Message Signatures | RFC 9421 | Request, response and webhook signing; webhooks must be signed; requests SHOULD be signed when signatures are the chosen auth | [src-ucp-signatures] |
| Content-Digest | RFC 9530 | `sha-256` over raw body bytes; intermediaries must not re-serialize JSON | [src-ucp-signatures] |
| Algorithms | JWA | Verifiers must support `ES256`; `ES384` and `EdDSA` optional; open vocabulary | [src-ucp-signatures] |
| Keys | JWK, JWK Set (RFC 7517), RFC 8037, thumbprint RFC 7638 | Top-level `keys[]` in the profile | [src-ucp-schema-profile] |
| Structured fields | RFC 8941 | `UCP-Agent: profile="..."` | [src-ucp-overview] |
| Web Bot Auth | `draft-meunier-webbotauth-httpsig-directory-00` | Optional interop since v2026-08-25: `Signature-Agent` header, `tag="web-bot-auth"`, `created` and `expires` required, `nonce` SHOULD, `keyid` is the JWK thumbprint | [src-ucp-signatures] |
| JWS detached | RFC 7515 Appendix F | `ap2.merchant_authorization` | [src-ucp-ap2-spec] |
| JCS | RFC 8785 | Canonicalization for mandates and merchant authorization | [src-ucp-ap2-spec] |
| SD-JWT with key binding | (AP2 spec) | `ap2.checkout_mandate`, payment mandate | [src-ucp-ap2-spec] |
| OAuth 2.0 family | RFC 8414, RFC 9728, RFC 9207, RFC 7009, RFC 8693, RFC 7523, PKCE S256, OpenID RISC | Identity linking | [src-ucp-identity-linking] |
| Standard Webhooks | standardwebhooks.com | Webhook header names | [src-ucp-order] |
| 3DS2 | EMV 3DS (not re-specified) | Actions for device data collection and challenge | [src-ucp-payment-auth] |
| JSON Schema 2020-12, OpenAPI 3.1, OpenRPC | | Schemas and transport descriptions | [src-ucp-rest-openapi] |

- Seed check "ES256 mandatory": precise wording is that all implementations must support verifying `ES256`; it is the baseline, not the only algorithm. AP2 mandate signing follows AP2's rule (ECDSA `ES256`, `ES384`, `ES512` in v0.2), and the spec notes an inconsistency in AP2 v0.2 tracked as AP2 issue #268 [src-ucp-signatures] [src-ucp-ap2-spec].
- Replay protection is at the business layer through signed `Idempotency-Key` (128-bit minimum entropy, stored 24 hours minimum, 48 recommended, fail closed with 503 on storage failure). For default UCP signatures `created` is optional [src-ucp-signatures].

