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

## Security model and published attacks or CVEs

- Threats named by the signatures spec: impersonation, tampering, replay, method or endpoint confusion. Mitigations: RFC 9421 signatures over method, authority, path, `ucp-agent`, `idempotency-key`, `content-digest`, `content-type`; signed idempotency keys; key rotation by removal from `keys[]` ("a revoked or compromised key is not effectively revoked until it is absent") [src-ucp-signatures] [src-ucp-overview].
- Identity binding: with API keys, OAuth or mTLS, the verifier must confirm the authenticated principal may act for the profile named in `UCP-Agent` [src-ucp-overview].
- Permissionless onboarding: any platform with a discoverable profile can call any business without registration; businesses SHOULD keep a registry of pre-approved platforms and bound discovery cost for unknown ones [src-ucp-overview].
- Server-side request forgery guard: profile, `jwks_uri` and CIMD fetches must reject non-HTTPS, redirects and special-use IP ranges (RFC 6890), and SHOULD check resolved addresses against DNS rebinding [src-ucp-overview].
- Namespace authority binding prevents publishing an entity under a domain one does not control; it establishes "provenance, not trust" and does not consult the Public Suffix List, so co-tenants on shared suffixes (for example `github.io`) are a stated risk [src-ucp-overview].
- PCI scope: credentials flow one way (platform to business), are opaque (tokens, encrypted payloads, mandates), and `handler_id` routing prevents key confusion. The checkout spec states a business does not need to become PCI DSS compliant to accept cards through this capability [src-ucp-overview] [src-ucp-checkout].
- Signals: values must be observed or third-party attested, never buyer-asserted; reverse-domain keys; SHOULD not be persisted beyond operational need [src-ucp-overview].
- Webhooks: must be signed; platform must reject events whose signer profile does not match the order's business [src-ucp-order].
- Human review: absent AP2, the agent must hand checkout to a trusted deterministic UI for the buyer to place the order [src-ucp-checkout].
- AP2 lock: once negotiated, no downgrade to unprotected checkout; merchant signature covers header and payload to block algorithm substitution [src-ucp-ap2-spec].
- Advisories: the GitHub security-advisories API returned 0 advisories for `ucp`, `python-sdk`, `js-sdk`, `samples`, `conformance` and `ucp-schema` on 2026-10-11. No CVE naming UCP was found [src-ucp-gh-advisories].
- Academic analysis: arXiv 2602.06345 (2026-02-06) studies replay and context-binding failures in mandate-based protocols and names UCP and AP2; arXiv 2606.05043 (Strabo, 2026-06-03) models UCP checkout as a declarative protocol [src-ucp-arxiv-260206345] [src-ucp-arxiv-260605043].
- Spec-acknowledged inconsistency: AP2 v0.2 states two different rules for mandate signing algorithms (tracked as AP2 issue #268); UCP defers to AP2 [src-ucp-ap2-spec].

## Controls

Mapping to the 14 `CONTROL_IDS`. "native" means the UCP spec defines it; "partial" means defined only in an optional extension or as SHOULD; "external" means delegated to another party; "none" means not addressed.

| Control id | Support | Mechanism and source |
| --- | --- | --- |
| `agent-identity-verification` | native | Platform profile via `UCP-Agent`; RFC 9421 signatures with `keys[]`, or API key, OAuth, mTLS bound to the profile [src-ucp-overview] [src-ucp-signatures] |
| `agent-registration-kya` | partial | Permissionless onboarding by design; businesses SHOULD keep a pre-approved platform registry; no know-your-agent registry in the spec [src-ucp-overview] |
| `user-consent-capture` | partial | Trusted UI review required without AP2; `dev.ucp.shopping.buyer_consent` map; AP2 `checkout_mandate` as signed consent (extension) [src-ucp-checkout] [src-ucp-ap2-spec] |
| `spending-caps` | external | No cap field in UCP; caps live in AP2 mandates or the credential provider [src-ucp-ap2-spec] |
| `merchant-payee-scoping` | partial | Payment tokens are handler-specific; AP2 mandate bound to the merchant-signed checkout; Adyen tokens bound to session and merchant id (vendor doc) [src-ucp-ap2-spec] [src-ucp-adyen-docs] |
| `time-windows-expiry` | native | `expires_at` (default 6 hours), cart `expires_at`; `mandate_expired` error in AP2 extension [src-ucp-schema-checkout] [src-ucp-schema-ap2] |
| `revocation` | native | Key removal from `keys[]`; OAuth token revocation RFC 7009 required for identity linking; OpenID RISC SHOULD [src-ucp-overview] [src-ucp-identity-linking] |
| `step-up-authentication` | partial | `requires_escalation` handoff; 3DS2 device data collection and challenge Actions in `dev.ucp.common.payment.authentication` (optional extension) [src-ucp-checkout] [src-ucp-payment-auth] |
| `replay-protection` | native | Signed `Idempotency-Key` (128-bit, 24 to 48 hour storage, 409 on mismatch); WBA `nonce` SHOULD [src-ucp-signatures] |
| `receipts-evidence` | partial | Order with `permalink_url`, confirmation email required; AP2 mandates stored as durable evidence (JCS) [src-ucp-checkout] [src-ucp-ap2-spec] |
| `dispute-support` | partial | Order `adjustments[]` with type `dispute`, `refund`, `return`; dispute handling itself is with the business and PSP [src-ucp-schema-order] |
| `reputation` | none | No reputation mechanism in the spec |
| `monitoring-signals` | native | `signals` (`dev.ucp.buyer_ip`, `dev.ucp.user_agent`, attestations), `signal` messages, webhooks [src-ucp-overview] |
| `kill-switch` | partial | Businesses may refuse unknown platforms, return `503`, cancel sessions; Google can route traffic back to an older endpoint (FAQ); no protocol-level global stop [src-ucp-overview] [src-ucp-google-faq] |

## Observability

Public:
- Business profiles at `https://{domain}/.well-known/ucp` are public by design (cacheable, `public`, `max-age` at least 60 seconds), so anyone can check which capabilities, transports and payment handlers a domain advertises. There is no public registry or index of UCP businesses; no indexer or explorer was found [src-ucp-overview].
- Other well-known paths in the spec: `/.well-known/oauth-protected-resource` (RFC 9728), `/.well-known/oauth-authorization-server` (RFC 8414), `/.well-known/openid-configuration` (fallback), `/.well-known/http-message-signatures-directory` (WBA directory variant), `/.well-known/agent-card.json` (A2A example) [src-ucp-identity-linking] [src-ucp-overview].
- ucp.dev publishes `versions.json`, listing `draft` and the dated versions with `latest` aliased to 2026-08-25 on 2026-10-11 [src-ucp-site-versions].
- Governance is public: announcements, GitHub Discussions, a `meeting-minutes` repository (created 2026-02-04) [src-ucp-announcements] [src-ucp-gh-org].
Private:
- Checkout sessions, orders, webhooks (`orderEvent` with `Webhook-Id`, `Webhook-Timestamp`) and embedded events (`ec.*`, `ep.cart.*`, `action.*`) are point-to-point [src-ucp-rest-openapi] [src-ucp-embedded-openrpc].
- Google traffic markers (Google FAQ): UCP requests carry a `UCP-Agent` header and a `User-Agent` beginning `Google/UCP`; health checks use `User-Agent: Google-UCP-Prober/1.0`; verification of Google origin via reverse DNS and published IP ranges [src-ucp-google-faq].
- No merchant counts, transaction counts or volumes are published by Google or the UCP project as of 2026-10-11.

## Compliance touchpoints

- Merchant of record: the business is the MoR in the spec glossary, in Google's FAQ, in Google's NRF and I/O posts, and Microsoft's Copilot Checkout page says "Copilot does not become merchant of record" [src-ucp-glossary] [src-ucp-google-faq] [src-ucp-microsoft-page].
- PCI DSS: business does not need PCI compliance to accept cards through checkout (tokens); platform, business and credential-provider scope sections in the overview [src-ucp-checkout] [src-ucp-overview].
- Privacy: PII and payment data must follow PCI-DSS and GDPR guidance; the glossary names CCPA, GDPR, KYC [src-ucp-overview] [src-ucp-glossary].
- Legal links: `links[]` is required on checkout ("mandatory for legal compliance"); `disclosure` warnings with jurisdiction applicability; `policies[]` for return and refund terms [src-ucp-schema-checkout] [src-ucp-checkout].
- SCA and 3DS2: supported through the authentication extension; SCA defined in the glossary under PSD2 [src-ucp-payment-auth] [src-ucp-glossary].
- Google data retention: Google keeps standard order data shown on "My orders" until the user deletes it; the merchant's own retention rules still apply [src-ucp-google-faq].
- Marketing consent: Google says a future feature will let users opt in to marketing at checkout [src-ucp-google-faq]; the spec's `buyer_consent` became a reverse-DNS map in v2026-08-25 [src-ucp-release-20260825].
- Regulatory scrutiny: Senator Elizabeth Warren wrote to Google's CEO in a letter dated 2026-02-03 about Gemini checkout and UCP data use and upselling (reported by eWeek 2026-02-05; the senate.gov copy returned HTTP 403) [src-ucp-eweek-warren].

## Ecosystem and SDKs

| Package | Registry | Latest (2026-10-11) | First published | Source |
| --- | --- | --- | --- | --- |
| `ucp-sdk` (Python) | PyPI | 0.5.0 (2026-08-27) | 0.1.0 on 2026-01-12 | [src-ucp-pypi] |
| `@ucp-js/sdk` | npm | 0.5.1 (2026-09-02) | 0.0.1 on 2026-01-13 | [src-ucp-npm] |
| `ucp-schema` (Rust, "Runtime resolution of UCP schema annotations") | crates.io | 1.4.1 (2026-08-03) | 0.1.0 on 2026-01-27 | [src-ucp-crates] |

- Organization repositories (GitHub API, 2026-10-11): `ucp` (created 2025-12-31, 3,413 stars), `python-sdk`, `samples`, `conformance` (2026-01-06), `js-sdk` (2026-01-09), `ucp-schema` (2026-01-28), `meeting-minutes` (2026-02-04), `.github` (2026-02-05) [src-ucp-gh-org].
- Samples: `rest/python`, `rest/nodejs`, `a2a` (business agent, chat client) [src-ucp-samples]. Conformance: language-agnostic pytest suite (`ap2_test.py`, `checkout_lifecycle_test.py`, `idempotency_test.py`, `webhook_test.py`, `simulation_url_security_test.py` and others); its README example config targets `"ucp_version": "2026-04-08"`, one release behind latest [src-ucp-conformance].
- Platforms (deployed): Google AI Mode in Search and Gemini (US, Etsy and Wayfair from 2026-02-11) [src-ucp-google-feb2026]; Microsoft Copilot Checkout requires a UCP-compliant feed through Microsoft Merchant Center, while Microsoft's page says "MMC will support Universal Commerce Protocol (UCP)" (future tense on the page as read 2026-10-11) [src-ucp-microsoft-page].
- Payment providers: Stripe documents UCP support and a "Stripe Payments handler", and says it is a member of the UCP Tech Council [src-ucp-stripe-docs]; Adyen documents a UCP Tokenization Handler following the 2026-01-23 tokenization guide, and an Agentic API over UCP [src-ucp-adyen-docs]. The seed's "Stripe Agentic Commerce Suite supports UCP" is reported in secondary coverage only; Stripe's own UCP page does not name the suite.
- Co-developers and endorsers on ucp.dev (2026-10-11): 21 unique co-developer organizations across Shopping (Google, Shopify, Etsy, Wayfair, Target, Walmart, Amazon, Microsoft, Meta, Salesforce, Stripe), Lodging (Amadeus, Booking.com, Expedia Group, Google, Hilton, Marriott, Trip.com) and Food (DoorDash, Google, Square, Toast, Uber Eats); 51 endorsers listed (includes Adyen, Amex, Mastercard, Visa, PayPal, Klarna, Affirm, Worldpay, Checkout.com, Fiserv) [src-ucp-site].
- Launch-time count: Google's 2026-01-11 posts said co-developed with Shopify, Etsy, Wayfair, Target and Walmart and "endorsed by over 20 global partners" [src-ucp-google-dev-blog] [src-ucp-google-nrf].
- Integrators: Google Merchant Center onboarding; Google offers "Native checkout" (default) and "Embedded checkout" (optional, approved merchants) [src-ucp-google-guide].
- Shopify: secondary reports say Google began automatically enrolling eligible US Shopify merchants in native checkout around 2026-09-18 to 2026-09-22, with opt-out in Shopify admin; no Google or Shopify primary announcement was found [src-ucp-ppcland-shopify].

## Fees and costs

| Fact | Date | Source | Confidence |
| --- | --- | --- | --- |
| UCP is an Apache-2.0 open standard; no protocol fee exists in the spec | 2026-10-11 | [src-ucp-gh-repo] | verified |
| Google told The Register it "doesn't plan to take a cut" of sales closed through buy-on-Google agentic checkout | 2026-01-12 | [src-ucp-register] | reported |
| Merchant stays merchant of record and its PSP must be able to process Google's tokens; merchants need not support Google Pay on their own site | 2026-10-11 | [src-ucp-google-faq] | verified |
| Normal PSP processing fees therefore apply (inference from MoR and PSP role; no Google fee schedule exists) | 2026-10-11 | [src-ucp-google-faq] | reported |
| Checkouts in Google AI Mode, Gemini and Microsoft Copilot reported as "no additional fees, for now" (The Information via PYMNTS) | 2026-01-21 | [src-ucp-pymnts-fees] | reported |
| Shopify Agentic Storefronts per-channel fee on top of processing (Appendix B, secondary, rate not public) | 2026-07-29 | Appendix B of ATLAS_FOLLOWUP | unverified here |
| Google Pay on Google AI surfaces supports only `PAN_ONLY` for `allowed_auth_methods` in UCP checkout | 2026-10-11 | [src-ucp-google-faq] | verified |

Who pays: merchant pays its PSP only (UCP on Google), card economics unchanged.

## Metrics with dates and caveats

| Metric | Value | As of | Source | Caveat |
| --- | --- | --- | --- | --- |
| Co-developer organizations on ucp.dev | 21 unique (23 logo slots across 3 verticals) | 2026-10-11 | [src-ucp-site] | Count of names on the homepage; Google appears in 3 verticals |
| Endorsers on ucp.dev | 51 | 2026-10-11 | [src-ucp-site] | Several also appear as vertical co-developers |
| Endorsers at launch | "over 20" | 2026-01-11 | [src-ucp-google-dev-blog] | Google wording |
| GitHub stars, `ucp` repo | 3,413 | 2026-10-11 | [src-ucp-gh-repo] | Popularity, not adoption |
| Forks, `ucp` repo | 476 | 2026-10-11 | [src-ucp-gh-repo] | |
| Protocol releases | 4 | 2026-10-11 | [src-ucp-gh-releases] | |
| Governing Council seats filled | 3 of 5 | 2026-10-11 | [src-ucp-maintainers] | |
| Merchant count, transaction volume | not published | 2026-10-11 | none | Google said "hundreds" of companies showed interest (2026-02-11) |
| Interest | "hundreds of top tech companies, payments partners and retailers" | 2026-02-11 | [src-ucp-google-feb2026] | Marketing claim |

## Relations to the other seven protocols

- **AP2 (Agent Payments Protocol).** AP2 is an optional extension inside UCP, not the same protocol. UCP defines where AP2 artifacts go (`ap2.merchant_authorization`, `ap2.checkout_mandate`, payment mandate in `payment.instruments[*].credential.token`); the mandate formats come from the AP2 specification. The extension existed since v2026-01-11 as `dev.ucp.shopping.ap2_mandate` and was renamed `dev.ucp.common.payment.ap2_mandate` in v2026-08-25 [src-ucp-ap2-spec] [src-ucp-schema-ap2] [src-ucp-schema-ap2-0408]. Google's FAQ says AP2 "can be used as a specialized payment layer within UCP" [src-ucp-google-faq]. Google donated AP2 to the FIDO Alliance on 2026-04-28 [src-ucp-google-ap2-fido], and on 2026-05-19 said it would "begin bringing AP2 to Google products in the coming months, starting with Gemini Spark" [src-ucp-google-universal-cart]. Production use of AP2 mandates inside UCP (or anywhere) is unverified as of 2026-10-11.
- **x402.** No documented relation. The UCP spec does not mention x402 or HTTP 402 and defines no stablecoin handler. Coinbase sits on the UCP Payments Tech Council (governance overlap only) [src-ucp-maintainers].
- **Visa Trusted Agent Protocol (TAP).** No documented bridge. Both use RFC 9421 HTTP Message Signatures. UCP added Web Bot Auth interop in v2026-08-25 (`Signature-Agent`, `tag="web-bot-auth"`), the same direction TAP is aligned with, but the UCP spec never names TAP. Visa is a listed UCP endorser [src-ucp-signatures] [src-ucp-site].
- **OpenAI ACP (Agentic Commerce Protocol).** No bridge or mapping is specified. Both cover agent checkout with the merchant as merchant of record. Stripe co-develops ACP and holds a UCP Governing Council seat (since 2026-04-28) and Shopping and Payments TC seats [src-ucp-announcements] [src-ucp-maintainers]. Reported fee contrast: Shopify merchants pay a 4% fee on ChatGPT checkout sales while Google and Microsoft checkouts carry no additional fee "for now" [src-ucp-pymnts-fees].
- **Stripe MPP (Machine Payments Protocol).** No documented relation in the UCP spec. Stripe's UCP page documents a Stripe Payments handler for UCP, which is a card and wallet tokenization path, not MPP [src-ucp-stripe-docs].
- **Mastercard Agent Pay.** No documented integration. UCP's `network_token` credential type (with `cryptogram`, `eci_value`, `token_requestor_id`) can carry network tokens in general [src-ucp-schema-payment]. Which network's agentic token, if any, flows inside a Google Pay handler is not published; Google's FAQ says UCP on Google AI surfaces supports only `PAN_ONLY` for Google Pay `allowed_auth_methods` [src-ucp-google-faq]. Mastercard is a listed UCP endorser [src-ucp-site].
- **ERC-8004 (Trustless Agents).** No documented relation. UCP identity is domain-based (profiles, reverse-DNS names, JWK sets), not on-chain [src-ucp-overview].
- **Transports (context, not one of the eight).** MCP and A2A are UCP transport bindings [src-ucp-overview].

## Criticisms and open questions

- Google's structural control: Google holds a permanent GC seat, the proxy vote for all open GC seats until December 2028 (2 of 5 seats open on 2026-10-11), custody of the ucp.dev domain, 6 of 10 permanent Food TC seats and 6 of 12 permanent Lodging TC seats; there is no foundation [src-ucp-governance] [src-ucp-maintainers].
- Privacy and upselling: Senator Warren's letter dated 2026-02-03 raised data sharing with retailers and upselling (reported) [src-ucp-eweek-warren]. The UCP roadmap lists "native cross-sell and upsell modules" as a priority [src-ucp-roadmap].
- Merchant consent and measurement: reported automatic enrollment of eligible US Shopify merchants with manual opt-out (September 2026) and concerns about attribution gaps when checkout happens on Google surfaces [src-ucp-ppcland-shopify]. The spec's `attribution` field passes campaign parameters such as `gclid` but prescribes no attribution model [src-ucp-overview].
- Complexity: two layers of negotiation (pick one protocol version profile, then exact-version capability intersection), schema composition with `extends`, `$requestConstraints`, actions and multiple transports [src-ucp-overview].
- Documentation drift: the ucp.dev "UCP and AP2" page still describes a `checkoutSignature` and a CheckoutMandate holding a hash of the checkout, while the schema uses `ap2.merchant_authorization` and a checkout mandate that contains the full checkout (see Conflicts) [src-ucp-ucp-and-ap2-page] [src-ucp-ap2-spec].
- Conformance lag: the conformance README targets 2026-04-08 while the latest release is 2026-08-25 [src-ucp-conformance].
- Permissionless onboarding shifts abuse handling to each business (discovery budgets, SSRF guards) [src-ucp-overview].
- Backports amend dated releases in place, so two parties can hold different copies of the same version [src-ucp-overview].
- Open: live AP2 use; merchant and volume numbers; whether and when non-Google platforms (Copilot) are live on UCP rather than feeds; whether Google Pay tokens on AI surfaces will move beyond `PAN_ONLY`.

## Resources

| Title | URL | Publisher | Date | Type | Badge | Note | Start here |
| --- | --- | --- | --- | --- | --- | --- | --- |
| UCP home | https://ucp.dev | UCP Authors | 2026-10-11 (read) | spec site | official | Co-developers and endorsers | yes |
| Specification overview (latest) | https://ucp.dev/latest/specification/overview/ | UCP Authors | 2026-08-25 | spec | official | Discovery, negotiation, payments | yes |
| Specification (draft) | https://ucp.dev/draft/specification/overview/ | UCP Authors | rolling | spec | official, draft | Unreleased changes | no |
| UCP repository | https://github.com/Universal-Commerce-Protocol/ucp | UCP Authors | 2025-12-31 (created) | repo | official | Schemas, OpenAPI, OpenRPC, releases | yes |
| Announcements | https://ucp.dev/documentation/announcements/ | UCP Authors | 2026-09-25 (latest entry) | announcement | official | Releases and councils | no |
| Governance | https://github.com/Universal-Commerce-Protocol/.github/blob/main/GOVERNANCE.md | UCP Authors | 2026-10-05 (commit) | governance | official | Councils, proxy vote | no |
| UCP and AP2 | https://ucp.dev/documentation/ucp-and-ap2/ | UCP Authors | 2026 | docs | official | Note naming drift | no |
| Google UCP guide | https://developers.google.com/merchant/ucp/ | Google | 2026-10-11 (read) | docs | vendor | Native vs embedded checkout | yes |
| Google UCP FAQ | https://developers.google.com/merchant/ucp/faq | Google | 2026-10-11 (read) | docs | vendor | MoR, PSP, `PAN_ONLY`, user agents | yes |
| Under the Hood: UCP | https://developers.googleblog.com/under-the-hood-universal-commerce-protocol-ucp/ | Google Developers | 2026-01-11 | engineering | vendor | Demo checkout | yes |
| Building the Universal Commerce Protocol | https://shopify.engineering/UCP | Shopify (Ilya Grigorik) | 2026-01-11 | engineering | co-author | Rationale | yes |
| The next era of agentic retail (NRF remarks) | https://blog.google/company-news/inside-google/message-ceo/nrf-2026-remarks/ | Google | 2026-01-11 | announcement | vendor | Launch | no |
| Digital advertising and commerce in 2026 | https://blog.google/products/ads-commerce/digital-advertising-commerce-2026/ | Google | 2026-02-11 | announcement | vendor | Etsy and Wayfair live in US | no |
| Universal Cart | https://blog.google/products-and-platforms/products/shopping/google-shopping-cart/ | Google | 2026-05-19 | announcement | vendor | Product, not the protocol | no |
| UCP features at Google Marketing Live | https://blog.google/products-and-platforms/products/shopping/shopping-updates-google-marketing-live/ | Google | 2026-05-20 | announcement | vendor | Ads, Canada, Australia, UK | no |
| UCP: Building a common language for agentic commerce (talk) | https://w3c.github.io/ecommerce-for-humans-and-AI-Agents-workshop/agenda.html | W3C/GS1 workshop (Amit Handa, Google) | 2026-09-08 | talk | event | Conference talk with slides | no |
| Shopify: UCP / WebMCP (talk) | https://w3c.github.io/ecommerce-for-humans-and-AI-Agents-workshop/agenda.html | W3C/GS1 workshop (Yoav Weiss, Shopify) | 2026-09-08 | talk | event | Production view | no |
| Microsoft agentic commerce and Copilot Checkout | https://about.ads.microsoft.com/en/solutions/technology/agentic-commerce | Microsoft Advertising | 2026-10-11 (read) | docs | vendor | "MMC will support UCP" | no |
| Stripe UCP docs | https://docs.stripe.com/agentic-commerce/protocols/ucp | Stripe | 2026-10-11 (read) | docs | vendor | Stripe Payments handler | no |
| Adyen Agentic Payments with UCP | https://docs.adyen.com/online-payments/agentic-commerce/agent-platform/agentic-payments-ucp | Adyen | 2026-10-09 (modified) | docs | vendor | Tokenization handler | no |
| Samples | https://github.com/Universal-Commerce-Protocol/samples | UCP Authors | 2026-01-06 (created) | repo | official | REST and A2A samples | yes |
| Conformance tests | https://github.com/Universal-Commerce-Protocol/conformance | UCP Authors | 2026-01-06 (created) | repo | official | Test suite | no |
| UCP Explained (Ep. 43) | https://smarter-ecommerce.com/en/podcast/season-4/universal-commerce-protocol-ucp-explained-what-every-ecommerce-brand-must-know/ | Growing Ecommerce | 2026-06-30 | podcast | secondary | Merchant prep | no |
| Will Agentic Commerce Replace Search? (Ep. 22) | https://smarter-ecommerce.com/en/podcast/season-4/google-s-ucp-explained-will-agentic-commerce-replace-search-in-2026/ | Growing Ecommerce | 2026-02-10 | podcast | secondary | UCP vs rivals | no |
| Deep Dive: Shopify and Google's UCP | https://www.fintechwrapup.com/p/deep-dive-breaking-down-shopify-and | Fintech Wrap Up | 2026-01-18 | newsletter | secondary | Bindings, AP2 link | no |
| How to Integrate UCP with AI Agents | https://www.analyticsvidhya.com/blog/2026/01/universal-commerce-protocol-by-google/ | Analytics Vidhya | 2026-01-12 | tutorial | secondary | Local demo | no |
| Google's UCP Powers Agentic Shopping | https://www.infoq.com/news/2026/01/google-ucp | InfoQ | 2026-01-24 | long-form | secondary | Architecture summary | no |
| UCP: Solving the N x N Bottleneck | https://uday.bearblog.dev/ucp/ | Uday (blog) | 2026-01 | long-form | secondary | Why a shared protocol | no |
| Agentic commerce and the battleground for payments infrastructure | https://bankunderground.co.uk/2026/05/21/agentic-commerce-and-the-battleground-for-new-payments-infrastructure/ | Bank Underground (BoE staff blog) | 2026-05-21 | long-form | secondary | Cross-protocol | no |
| Every Agent Payment Protocol Compared | https://atxp.ai/blog/agent-payment-protocols-compared | ATXP | 2026-03-04 | long-form | secondary | x402, ACP, UCP, AP2 | no |
| The Agentic Payments Map | https://www.fintechbrainfood.com/p/the-agentic-payments-map | Fintech Brainfood | 2026-02-01 | newsletter | secondary | All protocols | no |
| Agentic payments protocols compared | https://crossmint.com/learn/agentic-payments-protocols-compared | Crossmint | 2026-03-12 | long-form | secondary | Readiness matrix | no |

All URLs returned HTTP 200 to `curl -sSIL` on 2026-10-11 except where noted (the announcements and governance URLs are the published forms of files read in the repo). Conference talk coverage: the earlier pass found none; this pass found the W3C/GS1 "E-commerce for Humans and AI Agents" workshop (Zurich, 2026-09-08 to 2026-09-09) with a UCP session by Amit Handa (Google) and a Shopify UCP and WebMCP session by Yoav Weiss, both with slides [src-ucp-w3c-workshop].

## Publications

| Id | Title | Authors | Date | Relation to UCP | Verified via |
| --- | --- | --- | --- | --- | --- |
| arXiv:2606.05043 | Strabo: Declarative Specification and Implementation of Agentic Interaction Protocols | Samuel H. Christie, Amit K. Chopra, Munindar P. Singh | 2026-06-03 | Models UCP checkout as a Langshaw protocol and interoperates with Google's UCP agents | export.arxiv.org API |
| arXiv:2602.06345 | Zero-Trust Runtime Verification for Agentic Payment Protocols: Mitigating Replay and Context-Binding Failures in AP2 | Qianlong Lan, Anuj Kaul, Shaun Jones, Stephanie Westrum | 2026-02-06 | Abstract names UCP and AP2 as mandate-based protocols | export.arxiv.org API |
| arXiv:2607.21824 | Protocol-Level Attacks on Agentic Commerce Platforms: A Cross-Platform Taxonomy, AIP-Bench, and Unified Defense | Yedidel Louck | 2026-07-23 | Context (abstract does not name UCP) | export.arxiv.org API |
| arXiv:2609.00060 | A Formal Analysis of Agent Payment Protocols | Ke Jiang et al. | 2026-08-30 | Context (abstract does not name UCP) | export.arxiv.org API |
| arXiv:2508.02630 | What Is Your AI Agent Buying? Evaluation, Biases, Model Dependence, and Emerging Implications for Agentic E-Commerce | Amine Allouah et al. | 2025-08-04 | Context | export.arxiv.org API |
| arXiv:2510.25779 | Magentic Marketplace: An Open-Source Environment for Studying Agentic Markets | Gagan Bansal et al. | 2025-10-27 | Context | export.arxiv.org API |
| arXiv:2607.25253 | The User Asks, Platforms Compete: How Agentic Recommendation Markets Take Shape | Deyao Hong et al. | 2026-07-28 | Context | export.arxiv.org API |
| arXiv:2608.08395 | From Product Search to Preference Articulation: The Economics of Agentic Commerce | Lingxiu Dong, Kaiwen Luo, Fasheng Xu | 2026-08-09 | Context | export.arxiv.org API |
| arXiv:2307.13854 | WebArena: A Realistic Web Environment for Building Autonomous Agents | Shuyan Zhou et al. | 2023-07-25 | Context | export.arxiv.org API |
| DOI 10.1162/154247603322493212 | Platform Competition in Two-Sided Markets | Jean-Charles Rochet, Jean Tirole | 2003-06 | Foundations | doi.org CSL-JSON |

An arXiv abstract search for "Universal Commerce Protocol" returned 2 results on 2026-10-11 (2606.05043 and 2602.06345). The seed statement "no paper names UCP" is corrected.

