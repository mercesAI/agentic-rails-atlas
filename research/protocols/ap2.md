# AP2 research dossier

Slug: `ap2`. Research date (accessed date for everything below): 2026-10-11. US spelling. Dates are YYYY-MM-DD. Source ids in brackets refer to `ap2.sources.json`.

Repositories read (all under `research/vendor/`):

| Repo | Remote | Commit read | Tags read |
| --- | --- | --- | --- |
| `AP2` | https://github.com/google-agentic-commerce/AP2 | `e1ea56db72a6385bce3e5c1112b3a56ce60acb43` (2026-04-29, head of `main`) | `v0.1.0` (`bb57b6bfdb9a1caafffe7d024ca04d99cefa40be`), `v0.2.0` (`b4587ac1d055888a73b4b21750973cffba961793`) |

## Identity and governance

- **What it is.** The Agent Payments Protocol (AP2) is an open protocol that defines signed "mandates": verifiable records of what a user authorized an agent to buy or pay. The repository describes itself as code samples and demos of the protocol; the specification lives in `docs/ap2/` [src-ap2-repo]. AP2 is not a payment rail: it carries authorization evidence on top of existing card, bank and other rails.
- **Origin and repository.** Google created the GitHub repository `google-agentic-commerce/AP2` on 2025-05-30; it is published under Apache-2.0 and links `https://ap2-protocol.org/` as its homepage. As of 2026-10-11 the repository shows 3,216 stars, 510 forks and 174 open issues and pull requests [src-ap2-gh-repo]. The `METADATA` file shows that the public repository is exported by Copybara from Google's internal `third_party/ap2` tree, owned by "agentic-payments-team" [src-ap2-repo].
- **Tags and releases.** GitHub releases `v0.1.0` (published 2025-09-16) and `v0.2.0` (published 2026-04-28). `CHANGELOG.md` dates 0.1.0 at 2025-09-16 ("Create Agent Payments Protocol (AP2)") and 0.2.0 at 2026-04-28 ("Release of V2", commit `b4587ac`) [src-ap2-gh-releases] [src-ap2-changelog].
- **Repository activity.** The last commit on `main` is `e1ea56d` "fix: remove uvlock (#246)", 2026-04-29. No commit has landed on `main` since then as of 2026-10-11 [src-ap2-gh-commits].
- **Governance today.** The v0.2 FAQ says the core specification work "will continue in FIDO", while Google keeps enhancing the code samples and SDK in the repository [src-ap2-faq]. On issue 268, an AP2 spec author (GitHub user GarethCOliver, also the author of the Delegate SD-JWT draft) wrote on 2026-05-27 that further iterations have "officially moved" to FIDO and that the fix should be made in the agentic payments working group [src-ap2-issue-268]. Governance therefore sits with the FIDO Alliance working groups, not with Google alone. The same FAQ still calls AP2 "an open source project created by Google, similar to the A2A protocol" [src-ap2-faq]. FIDO details are in the next bullets and in "Versions and changelog".
- **FIDO Alliance (2026-04-28).** See the FIDO subsection below, filled from the FIDO press release and the Google blog post.

## Versions and changelog

### Version table

| Version | Tag commit | Date | What it defines | Source |
| --- | --- | --- | --- | --- |
| 0.1.0 | `bb57b6bfdb9a1caafffe7d024ca04d99cefa40be` | 2025-09-16 (GitHub release 2025-09-16T12:32:33Z) | Long-form specification `docs/specification.md` (1,016 lines); Pydantic types `src/ap2/types/mandate.py` with `IntentMandate`, `CartMandate`, `PaymentMandate`; A2A extension doc; samples in Python and Android | [src-ap2-spec-v01] [src-ap2-mandate-py-v01] [src-ap2-gh-releases] |
| 0.2.0 | `b4587ac1d055888a73b4b21750973cffba961793` | 2026-04-28 (GitHub release 2026-04-28T12:40:54Z; PR #233 "feat: Release Ap2 v0.2") | Split specification under `docs/ap2/` (specification, agent authorization, checkout mandate, payment mandate, flows, security and privacy, implementation considerations); JSON Schemas under `code/sdk/schemas/ap2/`; Python SDK under `code/sdk/python/ap2/`; samples in Python, Go and Android | [src-ap2-spec-v02] [src-ap2-gh-releases] [src-ap2-changelog] |

- The specification heading reads "Agentic Payment Protocol (v0.2)", although the project name everywhere else is "Agent Payments Protocol" [src-ap2-spec-v02].
- **Schema versioning.** Each mandate type carries a `vct` with a numeric suffix (`mandate.payment.1`, `mandate.checkout.open.1`). Implementations must match the exact string including the suffix; an incompatible revision would use `.2` [src-ap2-spec-v02].
- **Timeline of repository changes between the tags (GitHub commits API).** 2025-09-16 initial commit `e66fc0b` "Create Agent Payments Protocol (AP2)"; 2025-10-10 partners added (#93); 2025-10-30 Tether, Solana and OKX added to `docs/partners.md` (#103, commit `b43b072`); 2025-10-31 Global Payments added (#105); 2025-11-12 PaymentReceipt schema "v.01" (#110); 2025-11-13 specification clarifications (#94); 2025-12-15 x402 payment method support added to the Python human-in-the-loop samples (#121); 2026-01-13 "Changes in Jan 2026" docs (#135); 2026-01-20 article "UCP Translates AP2 Requirements into Reality" linked (#138); 2026-02-09 Kite AI added to partners (#161); 2026-04-28 v0.2 (#233); 2026-04-29 last commit on `main` (#246) [src-ap2-gh-commits] [src-ap2-gh-partners-history].
- **Activity since 2026-04-29.** No commit has been merged to `main` since 2026-04-29 (`gh api repos/google-agentic-commerce/AP2/commits?since=2026-04-29T17:00:00Z` returns 0). The only PR merged on or after 2026-04-29 is #246 itself. Between 2026-04-29 and 2026-10-11, 44 issues and 63 pull requests were opened, mostly by outside contributors (bug reports on the Python SDK, conformance test corpora, proposed extensions); none was merged. Dependabot branches were still being pushed (repository `pushed_at` 2026-06-17) [src-ap2-gh-issues-since] [src-ap2-gh-repo]. The repository is therefore idle on `main` but not abandoned by the community.

### What changed from v0.1 to v0.2

| Topic | v0.1 (2025-09-16) | v0.2 (2026-04-28) | Sources |
| --- | --- | --- | --- |
| Mandate types | `IntentMandate`, `CartMandate`, `PaymentMandate` (Pydantic models; data keys `ap2.mandates.IntentMandate`, `ap2.mandates.CartMandate`, `ap2.mandates.PaymentMandate`) | Checkout Mandate and Payment Mandate only, each closed or open: `mandate.checkout.1`, `mandate.checkout.open.1`, `mandate.payment.1`, `mandate.payment.open.1`. No Intent Mandate and no Cart Mandate | [src-ap2-mandate-py-v01] [src-ap2-schema-checkout] [src-ap2-schema-payment] |
| Human-not-present intent | Intent Mandate with `natural_language_description`, `merchants`, `skus`, `requires_refundability`, `intent_expiry`, `user_cart_confirmation_required` | Open mandates with machine-checkable `constraints` and an agent key in `cnf` | [src-ap2-mandate-py-v01] [src-ap2-agent-authorization] |
| Cart object | `CartContents` with a W3C `PaymentRequest`, signed by the merchant through `merchant_authorization` (a JWT whose payload includes `cart_hash`) | Merchant-signed `checkout_jwt` (a UCP Checkout object when used with UCP) plus `checkout_hash` | [src-ap2-mandate-py-v01] [src-ap2-checkout-mandate-doc] |
| User signature | `user_authorization`: a verifiable presentation, for example an SD-JWT VC with a key-binding JWT whose `transaction_data` holds hashes of the CartMandate and PaymentMandateContents | SD-JWT VC mandates chained with the "Delegate SD-JWT" draft; OpenID4VP `transaction_data` of type `delegate`; Digital Credentials API recommended | [src-ap2-mandate-py-v01] [src-ap2-agent-authorization] |
| Roles | User; User Agent or Shopping Agent; Credentials Provider; Merchant Endpoint (Remote Endpoint); Merchant Payment Processor Endpoint; Network and Issuer | Shopping Agent; Credential Provider; Merchant; Merchant Payment Processor; Trusted Surface (must be non-agentic) | [src-ap2-spec-v01] [src-ap2-spec-v02] |
| Step-up | Section 5.5 "Transaction Challenges": any party may require a redirect challenge such as 3DS2 or an OTP | The normative documents under `docs/ap2/` define no step-up mechanism; a verifier that cannot confirm the constraints returns `unresolved_constraint`, which may trigger a fallback to a user-approved closed mandate or a non-agentic flow. The non-normative Executive Summary (`docs/overview.md`) still mentions 3DS2 challenges as an existing mechanism (see Conflicts) | [src-ap2-spec-v01] [src-ap2-agent-authorization] [src-ap2-flows] [src-ap2-overview] |
| Liability | Table 6.1 lists evidence per failure scenario and says every network defines its own liability contracts | The specification leaves dispute handling, retention and retrieval out of scope; the FAQ says mandates are evidence that helps networks set liability | [src-ap2-spec-v01] [src-ap2-spec-v02] [src-ap2-faq] |
| Receipts | PaymentReceipt schema added 2025-11-12 (#110) | Payment Receipt and Checkout Receipt JSON Schemas; generic Mandate Receipt in `agent_authorization.md` | [src-ap2-gh-commits] [src-ap2-schema-receipts] |
| Transport framing | "designed as an extension" for A2A and MCP; A2A extension URI documented | Operates "as a security feature within a Commerce Protocol"; explicitly compatible with UCP; commerce messaging out of scope | [src-ap2-spec-v01] [src-ap2-spec-v02] |
| Partners page | `docs/partners.md` with 56 entries at the tag; 125 entries at its last edit on 2026-02-09 | `docs/partners.md` removed in the v0.2 commit | [src-ap2-gh-partners-history] |
| Constraint keys | none | `checkout.allowed_merchants`, `checkout.line_items`, `payment.agent_recurrence`, `payment.allowed_payees`, `payment.allowed_payment_instruments`, `payment.allowed_pisps`, `payment.amount_range`, `payment.budget`, `payment.execution_date`, `payment.reference` | [src-ap2-schema-open-checkout] [src-ap2-schema-open-payment] |

## Actors and roles

### v0.2 roles (`docs/ap2/specification.md`)

| Role | Abbreviation | Responsibility in the spec | Agentic? |
| --- | --- | --- | --- |
| Shopping Agent | SA | Discovers products, builds the checkout, executes the purchase; assembles Mandate Content; presents mandates | Expected to be agentic; the spec assumes at minimum that it is |
| Credential Provider | CP | Source of Payment Credentials; verifies that the agent may use the credential and scopes it; verifies the Payment Mandate before returning a credential | May be agentic or non-agentic |
| Merchant | M | Provides and completes the Checkout; signs the `checkout_jwt`; verifies the Checkout Mandate; responsible for inventory, pricing and discounts | May be agentic or non-agentic |
| Merchant Payment Processor | MPP | Processes the payment; verifies that the Payment Credential is scoped to this Checkout (for example by carrying the closed Payment Mandate inside the credential); signs the Payment Receipt | May be agentic or non-agentic |
| Trusted Surface | TS | UI trusted to obtain informed user consent before creating a user-signed Mandate | MUST be non-agentic |

Sources: [src-ap2-spec-v02].

- "MPP" in AP2 means **Merchant Payment Processor**. It is unrelated to Stripe and Tempo's Machine Payments Protocol, which also abbreviates to MPP [src-ap2-spec-v02] [src-ap2-glossary].
- A single entity may play several or all roles. Any role may delegate its responsibilities, for example a merchant may let its processor verify mandates; the delegate then follows that role's rules [src-ap2-spec-v02].
- **Deterministic validation.** Wherever the spec describes validation for a role, it must run in deterministic code, whether or not the role is agentic. When either side of an exchange is agentic, the agent itself is a potential attacker [src-ap2-spec-v02].
- **The Network** is not one of the five roles but appears as a verifier of Payment Mandates and a recipient of Payment Receipts alongside the Credential Provider [src-ap2-spec-v02].
- **Delegation models** (`docs/ap2/agent_authorization.md`): the User Credential model is a three-party model (User Credential Issuer, Trusted Surface as Holder, Agent) in which the verifier trusts the issuer to guarantee the Trusted Surface; the Trusted Agent Provider model makes the agent's provider the trusted party, which must keep its signing key out of the agent's reach [src-ap2-agent-authorization]. "Trusted Agent Provider" is an AP2 delegation model and is unrelated to Visa's Trusted Agent Protocol (TAP).
- **Examples of who plays each role** (`implementation_considerations.md`): Credential Provider as a digital wallet or payment network, a store of instruments provided by the agent, or one provided by the merchant; Trusted Surface as a deterministic part of the agent application, a standalone wallet or issuer app, or a trusted user agent such as a mobile platform or browser; Merchant as UCP endpoints, a merchant agent speaking A2A, a combined merchant and processor, or a merchant that delegates verification [src-ap2-implementation].

### v0.1 roles (`docs/specification.md` at `v0.1.0`, Section 3.1)

User; User Agent (UA) or Shopping Agent (SA); the User's Credentials Provider (CP), for example a digital wallet; the Remote or Merchant Endpoint (ME); the Merchant Payment Processor Endpoint (MPP), which constructs the transaction authorization message; Network and Issuer [src-ap2-spec-v01].

## Core objects with exact field names

All tables below are generated from the JSON Schema files under `code/sdk/schemas/ap2/` at commit `e1ea56d` (identical to `v0.2.0` for these files). "Required" follows each schema's `required` array. SD marks `x-selectively-disclosable-field` or `x-selectively-disclosable-array` in the schema.

### Closed Checkout Mandate (`checkout_mandate.json`, `$id` `https://ap2-protocol.org/schemas/checkout_mandate.json`)

| Field | Type | Required | Meaning | File |
| --- | --- | --- | --- | --- |
| `vct` | string, const `mandate.checkout.1` | yes | Verifiable Credential Type; mandate type and schema version | `code/sdk/schemas/ap2/checkout_mandate.json` |
| `checkout_jwt` | string | yes | base64url-encoded, merchant-signed JWT of the Checkout payload (SD field) | same |
| `checkout_hash` | string | yes | base64url hash of the `checkout_jwt` value; algorithm matches `_sd_alg` if present, otherwise sha-256 | same |
| `iat` | integer | no | Creation time, Unix epoch | same |
| `exp` | integer | no | Expiration time, Unix epoch | same |

[src-ap2-schema-checkout]

### Open Checkout Mandate (`open_checkout_mandate.json`, `$id` `https://ap2-protocol.org/schemas/open_checkout_mandate`)

| Field | Type | Required | Meaning | File |
| --- | --- | --- | --- | --- |
| `vct` | string, const `mandate.checkout.open.1` | yes | Mandate type | `code/sdk/schemas/ap2/open_checkout_mandate.json` |
| `constraints` | array of `checkout.allowed_merchants` or `checkout.line_items` objects; must contain at least one `checkout.line_items` | yes | Constraints the future closed checkout must satisfy | same |
| `cnf` | object | yes | RFC 7800 confirmation claim holding the agent's key | same |
| `iat` | integer | no | Creation time | same |
| `exp` | integer | no | Expiration time | same |

Constraint definitions:

| Constraint `type` | Fields (required in bold) | Evaluation (from `checkout_mandate.md`) |
| --- | --- | --- |
| `checkout.allowed_merchants` | **`type`**, **`allowed`** (array of Merchant; SD array) | The merchant must appear among the revealed elements of `allowed`; no revealed elements makes the constraint invalid |
| `checkout.line_items` | **`type`**, **`items`** (array, `minItems` 1, of line item requirements: **`id`**, **`acceptable_items`** (array of `{id, title}`, SD array), **`quantity`** (integer > 0)) | Each requirement must be met by matching checkout items; no requirement or item may be used twice; the spec suggests a maximum-flow algorithm; one open mandate cannot be split across several checkouts |

[src-ap2-schema-open-checkout] [src-ap2-checkout-mandate-doc]

### Closed Payment Mandate (`payment_mandate.json`, `$id` `https://ap2-protocol.org/schemas/payment_mandate.json`)

| Field | Type | Required | Meaning | File |
| --- | --- | --- | --- | --- |
| `vct` | string, const `mandate.payment.1` | yes | Mandate type | `code/sdk/schemas/ap2/payment_mandate.json` |
| `transaction_id` | string | yes | base64url hash of the `checkout_jwt` value, identifying the checkout; same algorithm as the SD-JWT's `sd_hash`, or sha256 if absent | same |
| `payee` | Merchant (`types/merchant.json`) | yes | The merchant receiving the payment | same |
| `pisp` | PISP (`types/pisp.json`) | no | Payment Initiation Service Provider | same |
| `payment_amount` | Amount (`types/amount.json`) | yes | Currency (ISO 4217) and `amount` in integer minor units; "final value confirmed by the user" | same |
| `payment_instrument` | Payment Instrument (`types/payment_instrument.json`) | yes | The instrument used | same |
| `execution_date` | string | no | ISO 8601 date of execution; absent means immediate | same |
| `risk_data` | object | no | Map of risk signals collected by the Trusted Surface when the mandate was created | same |
| `iat` | integer | no | Creation time, Unix epoch | same |
| `exp` | integer | no | Expiration time, Unix epoch | same |

[src-ap2-schema-payment]

### Open Payment Mandate (`open_payment_mandate.json`, `$id` `https://ap2-protocol.org/schemas/payment_mandate_open.json`)

| Field | Type | Required | Meaning | File |
| --- | --- | --- | --- | --- |
| `vct` | string, const `mandate.payment.open.1` | yes | Mandate type | `code/sdk/schemas/ap2/open_payment_mandate.json` |
| `constraints` | array (`oneOf` the eight payment constraints); must contain a `payment.reference` | yes | Constraints on the future closed payment | same |
| `cnf` | object | yes | RFC 7800 confirmation claim (agent key) | same |
| `payee` | Merchant | no | Pre-set payee | same |
| `payment_amount` | Amount | no | Pre-set by the user at mandate creation | same |
| `payment_instrument` | Payment Instrument | no | Pre-set instrument | same |
| `pisp` | PISP | no | Pre-set PISP | same |
| `execution_date` | string | no | ISO 8601 date | same |
| `risk_data` | object | no | Risk signals from the Trusted Surface | same |
| `iat` | integer | no | Creation time | same |
| `exp` | integer | no | Expiration time | same |

The spec adds that an open Payment Mandate may include any property of the closed one, and that an open mandate need not carry all required fields of its closed type, but the closed mandate must [src-ap2-payment-mandate-doc] [src-ap2-agent-authorization].

Payment constraint definitions (`$defs` in `open_payment_mandate.json`):

| Constraint `type` | Fields (required in bold) | Evaluation (from `payment_mandate.md`) |
| --- | --- | --- |
| `payment.agent_recurrence` | **`type`**, **`frequency`** (enum `ON_DEMAND`, `DAILY`, `WEEKLY`, `BIWEEKLY`, `MONTHLY`, `QUARTERLY`, `ANNUALLY`), `max_occurrences` (integer) | True if the presentation is far enough from the previous one for the frequency and the occurrence count stays within `max_occurrences`; requires tracking previous presentations |
| `payment.allowed_payees` | **`type`**, **`allowed`** (array of Merchant; SD array) | `payee` must be in `allowed` |
| `payment.allowed_payment_instruments` | **`type`**, **`allowed`** (array of Payment Instrument; SD array) | `payment_instrument` must be in `allowed` |
| `payment.allowed_pisps` | **`type`**, **`allowed`** (array of PISP) | The facilitating PISP must be in `allowed` |
| `payment.amount_range` | **`type`**, **`currency`** (ISO 4217 alpha-3), **`max`** (integer, minor units), `min` (integer, minor units; absent means no minimum) | `payment_amount` within `min` and `max`, same currency |
| `payment.budget` | **`type`**, **`max`** (number), **`currency`** | Requested amount plus the sum of previously closed mandates must be at most `max`; to be used with `payment.agent_recurrence` |
| `payment.execution_date` | **`type`**, `not_before`, `not_after` (strings) | `execution_date` within the window |
| `payment.reference` | **`type`**, **`conditional_transaction_id`** (digest of the associated open Checkout Mandate) | The approved checkout's delegate chain must contain an open Checkout Mandate with a matching hash |

[src-ap2-schema-open-payment] [src-ap2-payment-mandate-doc]

- **Unknown constraints fail.** Any constraint type the verifier does not recognize must be treated as failing evaluation, and the error is `unresolved_constraint` [src-ap2-agent-authorization].
- **New constraints** require a unique `type`, a schema that says which fields are selectively disclosable, and an evaluation algorithm; collision-resistant names (reverse DNS prefix or URN) are recommended for new mandate and constraint types [src-ap2-spec-v02] [src-ap2-agent-authorization].

### Shared types (`code/sdk/schemas/ap2/types/`)

| Type file | Fields (required in bold) | Notes |
| --- | --- | --- |
| `amount.json` | **`amount`** (integer, minor units), **`currency`** (ISO 4217 three-letter code) | |
| `merchant.json` | **`id`**, **`name`**, `website` | Title misspelled "Mechant object" in the description |
| `payment_instrument.json` | **`id`**, **`type`**, `description` | New instruments are added by defining a new `type` |
| `pisp.json` | **`legal_name`**, **`brand_name`**, **`domain_name`** | `domain_name` is described as secured by the eIDAS QWAC certificate of the TPP |
| `item.json` | **`id`**, **`title`**, **`price`** (integer, minor units, minimum 0), `image_url` | Description says it matches UCP `types/item.json` (2026-04-08) |
| `jwk.json` | **`kty`** (const `EC`), `crv` (const `P-256`), `x`, `y`, `use`, `key_ops`, `alg` (const `ES256`), `kid`, `x5u`, `x5c`, `x5t`, `x5t#S256` | EC P-256 public key; `additionalProperties: false` |
| `receipt_status.json` | enum `Success`, `Error` | |

[src-ap2-schema-types]

### Receipts

| Object | Field | Type | Required | Meaning |
| --- | --- | --- | --- | --- |
| Payment Receipt (`payment_receipt.json`) | `status` | `Success` or `Error` | yes | Final state of the payment |
| | `iss` | string | yes | Issuer of the receipt |
| | `iat` | integer | yes | Creation time |
| | `reference` | string | yes | Hash of the closed mandate the receipt binds to |
| | `payment_id` | string | yes | Unique payment identifier |
| | `psp_confirmation_id` | string | if `Success` | Confirmation id at the PSP |
| | `network_confirmation_id` | string | if `Success` | Confirmation id at the network |
| | `error`, `error_description` | string | if `Error` | Error code and text |
| Checkout Receipt (`checkout_receipt.json`) | `status`, `iss`, `iat`, `reference` | as above | yes | |
| | `order_id` | string | if `Success` | Order reference |
| | `error`, `error_description` | string | if `Error` | |
| Mandate Receipt (prose, `agent_authorization.md`) | `iss`, `result` (`success` or `error`), `reference`, `error`, `error_description` | | `iss`, `result`, `reference` required | Generic Verifier-signed JWT. Its `result` field does not match the schemas' `status`; issue #374 (opened 2026-10-11) reports this mismatch |

[src-ap2-schema-receipts] [src-ap2-agent-authorization] [src-ap2-issue-374]

### Error codes (`agent_authorization.md`, "Errors")

| Code | Meaning | Terminal? |
| --- | --- | --- |
| `invalid_credential` | The mandate fails verification | Terminal |
| `unresolved_constraint` | Unknown constraint, or the verifier cannot confirm that the closed mandate meets the constraints | May signal a fallback to a directly approved closed mandate or a non-agentic flow |
| `invalid_mandate` | The mandate does not approve the requested action | Terminal |
| `mandates_not_supported` | The verifier does not support mandates for this action | May signal a fallback to non-agentic flows |

[src-ap2-agent-authorization]

### OpenID4VP delegation object (`transaction_data` entry, `agent_authorization.md`)

| Property | Required | Meaning |
| --- | --- | --- |
| `type` | yes | Must be the string `delegate` |
| `format` | yes | VDC format of the returned mandate (example `dc+sd-jwt`) |
| `delegate_payload` | yes | Array of Mandate Content payloads |
| `delegate_disclosures` | no | Selective disclosures inside `delegate_payload` |

The non-normative example also shows `credential_ids` and `transaction_data_hashes_alg`, a second `transaction_data` entry of type `payment_card` for the confirmation UI, `response_mode` `dc_api`, protocol `openid4vp-v1-unsigned`, a DCQL query for a credential with `vct_values` `com.emvco.dpc`, and ES256 for both `sd-jwt_alg_values` and `kb-jwt_alg_values` [src-ap2-agent-authorization].

### v0.1 objects (from `src/ap2/types/mandate.py` at `v0.1.0`)

| Object | Fields |
| --- | --- |
| `IntentMandate` | `user_cart_confirmation_required` (bool, default true), `natural_language_description` (str), `merchants` (optional list), `skus` (optional list), `requires_refundability` (optional bool, default false), `intent_expiry` (ISO 8601 string) |
| `CartContents` | `id`, `user_cart_confirmation_required`, `payment_request` (W3C `PaymentRequest`), `cart_expiry`, `merchant_name` |
| `CartMandate` | `contents` (`CartContents`), `merchant_authorization` (optional JWT whose payload includes `iss`, `sub`, `aud`, `iat`, `exp`, `jti`, `cart_hash`) |
| `PaymentMandateContents` | `payment_mandate_id`, `payment_details_id`, `payment_details_total`, `payment_response`, `merchant_agent`, `timestamp` |
| `PaymentMandate` | `payment_mandate_contents`, `user_authorization` (optional base64url verifiable presentation, for example an SD-JWT VC with a key-binding JWT carrying `aud`, `nonce`, `sd_hash`, `transaction_data` with hashes of the CartMandate and PaymentMandateContents) |

[src-ap2-mandate-py-v01]
