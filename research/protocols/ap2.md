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
- **FIDO Alliance donation (2026-04-28).** Google's blog post "We're donating Agent Payments Protocol to the FIDO Alliance..." by Stavan Parikh (VP/GM, Payments), dated 2026-04-28, announces the donation, says ownership transitions to FIDO so AP2 stays platform-agnostic and community-led, announces v0.2 with "Human Not Present" payments on GitHub the same day, and describes Verifiable Intent as an AP2-compatible standard co-developed with Mastercard that is also being donated to FIDO [src-ap2-google-fido-blog].
- **FIDO press release (2026-04-28)** "FIDO Alliance to Develop Standards for Trusted AI Agent Interactions": Google contributed AP2 and Mastercard contributed its Verifiable Intent framework, "co-developed with Google and designed to work with AP2". FIDO describes the Agentic Authentication Technical Working Group as "newly formed", chaired at launch by members from CVS Health, Google and OpenAI and vice-chaired by members from Amazon, Google and Okta. A Payments Technical Working Group is chaired by members from Mastercard and Visa; the contributions are to be developed within it. FIDO says work has commenced and that it "will provide reports as it progresses"; no deliverable or date is given [src-ap2-fido-pr].
- **The Payments group already existed (correction 2.1.11 confirmed).** FIDO launched a Payments Working Group (PWG) on 2025-04-29, co-chaired by Henna Kapur of Visa and Jonathan Grossar of Mastercard [src-ap2-fido-pwg-2025]. Only the Agentic Authentication TWG was new on 2026-04-28. The 2025 release names the group "Payments Working Group" and the 2026 release "Payments Technical Working Group"; no source found states whether this was a rename (logged in Conflicts).
- **FIDO deliverables.** No FIDO specification, draft or report on AP2 was found published as of 2026-10-11 (absence based on the FIDO press release, the AP2 repository and site, and a web search; FIDO working drafts are member-only) [src-ap2-fido-pr] [src-ap2-site].
- **Project site.** `https://ap2-protocol.org` (MkDocs build of the repository docs) states that standardization will continue in FIDO's Agentic Authentication Technical and Payments Technical Working Groups, and still describes AP2 as an extension for A2A and UCP [src-ap2-site].
- **License.** Apache License 2.0 (`LICENSE`); the Python package metadata in `pyproject.toml` also declares Apache-2.0 [src-ap2-repo].
- **Launch (2025-09-16).** Google Cloud blog "Powering AI commerce with the new Agent Payments Protocol (AP2)" by Stavan Parikh and Rao Surapaneni, dated 2025-09-16: an open protocol developed with "more than 60 organizations", usable as an extension of A2A and MCP; named collaborators: Adyen, American Express, Ant International, Coinbase, Etsy, Forter, Intuit, JCB, Mastercard, Mysten Labs, PayPal, Revolut, Salesforce, ServiceNow, UnionPay International, Worldpay. The post also announced the A2A x402 extension built with Coinbase, the Ethereum Foundation, MetaMask and others, calling it "production-ready". Visa does not appear anywhere in the post [src-ap2-gcloud-launch].

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

## Message flows step by step

All flows in `docs/ap2/flows.md` are non-normative examples that assume enrollment and any user credentials exist in advance. AP2 does not define the commerce messages themselves (catalog, cart and checkout APIs); those come from the surrounding commerce protocol, for example UCP [src-ap2-flows] [src-ap2-spec-v02].

### Flow 1: Human Present ("direct"), happy path

| Step | Actor | Message or call | Spec reference |
| --- | --- | --- | --- |
| 1 | User to SA | User starts shopping | `flows.md` Phase 1 step 1 |
| 2 | SA and Merchant | SA assembles a cart over the commerce protocol | Phase 1 step 2 |
| 3 | Merchant to SA | Merchant creates a signed Checkout (the `checkout_jwt`) and requires a mandate | Phase 1 step 3; `specification.md` "Checkout Mandate" |
| 4 | SA and CP | SA retrieves instrument options from the Credential Provider and picks one | Phase 1 step 4 |
| 5 | SA to TS | SA builds Checkout and Payment Mandate Content and asks the Trusted Surface for approval | Phase 2 step 1 |
| 6 | TS and User | TS renders the content and gets user authentication (for example biometric) and consent | Phase 2 step 2 |
| 7 | TS | TS signs closed `mandate.checkout.1` and `mandate.payment.1` with `user_sk` (the Agent Provider key in the Trusted Agent Provider model); the `checkout_jwt` hash links the two | Phase 2 step 3 |
| 8 | TS to SA | Mandates returned | Phase 2 step 4 |
| 9 | SA to CP | SA sends the Payment Mandate; CP verifies it and creates a payment token, possibly sharing the mandate with the network to get a scoped purchase credential | Phase 2 step 5; `specification.md` "Credential Provider and Network" |
| 10 | SA to Merchant | Token plus Checkout Mandate | Phase 2 step 6 |
| 11 | Merchant | Verifies the Checkout Mandate against the current cart and `checkout_hash`, then initiates payment with the token and the `checkout_jwt` hash | Phase 2 step 7; "Verification: Merchant" |
| 12 | MPP | Verifies the Payment Mandate carried in the token and its binding to the `checkout_jwt` hash | Phase 2 step 8; "Verification: Merchant Payment Processor" |
| 13 | MPP and Merchant to SA, CP, Network | MPP-signed Payment Receipt to SA, CP and Network; Merchant-signed Checkout Receipt to SA | Phase 2 step 9 |

For push payment methods the merchant instead receives confirmation that funds were sent [src-ap2-spec-v02]. The spec notes that because the user approves the closed checkout, this flow can often be replaced by a traditional e-commerce journey between the merchant and the Trusted Surface [src-ap2-spec-v02].

### Flow 2: Human Not Present ("autonomous"), happy path

| Step | Actor | Message or call | Spec reference |
| --- | --- | --- | --- |
| 1a.1 | User to SA | User sets a shopping task | `flows.md` Phase 1a step 1 |
| 1a.2 | SA to TS | SA assembles open Mandate Contents (`mandate.checkout.open.1`, `mandate.payment.open.1`) with constraints | Phase 1a step 2 |
| 1a.3 | TS and User | Authentication and consent | Phase 1a step 3 |
| 1a.4 | TS | Signs the open mandates with `user_sk`; the hash of the open Checkout Mandate goes into the open Payment Mandate (`payment.reference` with `conditional_transaction_id`); `agent_pk` goes into `cnf` | Phase 1a step 4; `specification.md` "Autonomous" |
| 1b.1 | SA and Merchant | SA autonomously assembles a cart | Phase 1b step 1 |
| 1b.2 | Merchant to SA | Signed Checkout (`checkout_jwt`) | Phase 1b step 2 |
| 2.1 | SA | Selects open mandates whose constraints fit the checkout (selection is out of scope); must not create overlapping mandates until it holds an error receipt | Phase 2 step 1 |
| 2.2 | SA | Signs closed Checkout and Payment Mandates with `agent_sk` as key-binding JWTs; `checkout_jwt` hash links them; `sd_hash` binds each closed mandate to its open parent | Phase 2 step 2 |
| 2.3 | SA to CP | Open and closed Payment Mandates; CP verifies the chain and constraints, creates a token | Phase 2 step 3 |
| 2.4 | SA to Merchant | Token plus open and closed Checkout Mandates | Phase 2 step 4 |
| 2.5 | Merchant | Verifies the closed Checkout Mandate against the cart and evaluates every open-mandate constraint; initiates payment with the token, `checkout_jwt` hash and open Checkout Mandate hash | Phase 2 step 5 |
| 2.6 | MPP | Verifies the Payment Mandates in the token and both bindings | Phase 2 step 6 |
| 2.7 | MPP and Merchant | Receipts as in the human-present flow | Phase 2 step 7 |

The spec recommends setting `exp` on open mandates to the smallest value that lets the agent finish its task, and requires the agent to disclose only the open-mandate disclosures needed to evaluate the closed ones [src-ap2-spec-v02].

### Flow 3: Constraint failure and fallback to human present

1. A verifier (Merchant or Credential Provider) cannot confirm that the closed mandate meets the open mandate's constraints, or sees an unknown constraint type.
2. It returns a receipt with status `Error` and error `unresolved_constraint` [src-ap2-agent-authorization].
3. The error "MAY be used as a signal" to fall back to a directly approved closed mandate (the Human Present flow) or a non-agentic flow; `flows.md` says a Human Not Present flow can be turned into a Human Present flow this way [src-ap2-flows].
4. With an error receipt in hand, the agent may present a different mandate for the same open mandate [src-ap2-spec-v02].

This is the only "step-up" path in v0.2. The normative v0.2 documents define no 3DS2, OTP or other challenge messages (correction 2.1.10).

### Flow 4: Terminal failures

- `invalid_credential`: signature or chain verification fails; terminal.
- `invalid_mandate`: the mandate does not approve the requested action; terminal.
- `mandates_not_supported`: the verifier does not use mandates for this action; may fall back to non-agentic flows.
- On any Merchant verification failure the Merchant must return a Checkout Receipt JWT with the error; on any CP or Network failure they must return a Payment Receipt JWT with the error [src-ap2-agent-authorization] [src-ap2-spec-v02].

### Flow 5: Dispute verification

A dispute verifier must: verify the Checkout Mandate under the Merchant rules; recompute the hash of the included `checkout_jwt`; check that the Checkout Receipt `reference` equals the hash of the closed Checkout Mandate (computed like `sd_hash`); verify the Payment Mandate under the MPP rules using `checkout_hash`; and check that the Payment Receipt `reference` equals the hash of the closed Payment Mandate. The Checkout Mandate and Receipt may be provided by the SA or the Merchant; the Payment Mandate and Receipt by the SA, CP, Network or MPP. Retention, retrieval and how evidence is used in a dispute are out of scope; the spec suggests a future retrieval keyed on `transaction_id` [src-ap2-spec-v02].

### Flow 6: Delegation with OpenID4VP and the Digital Credentials API (User Credential model)

1. The agent builds an OpenID4VP Authorization Request whose `transaction_data` contains a base64url object with `type` `delegate`, `format`, `delegate_payload` (the Mandate Contents) and optional `delegate_disclosures`.
2. The request is sent through the Digital Credentials API where available (recommended), with a DCQL query for the user credential.
3. The wallet (Trusted Surface as Holder) shows the content, and its Authorization Response includes `delegate_payload` in the key binding (per the Delegate SD-JWT draft).
4. The non-normative example asks for an EMVCo-style DPC credential (`vct` `com.emvco.dpc`) with disclosures `card_last_four`, `card_network_code`, `credential_id`, and returns a `~`-separated SD-JWT in `vp_token` [src-ap2-agent-authorization].

### v0.1 flows (for the version toggle)

v0.1 Human Present: Intent Mandate captured from the request; merchant-signed `CartMandate`; user signs the cart; `PaymentMandate` with `user_authorization` sent toward the network and issuer; any party may challenge with 3DS2 or OTP through a redirect (Section 5.5). v0.1 Human Not Present: the user signs a detailed Intent Mandate up front and the agent can generate a Cart Mandate when conditions are met; a merchant can force the user back into session [src-ap2-spec-v01] [src-ap2-gcloud-launch].

## State machines

AP2 v0.2 defines no explicit state machine or status enum for a session. The implicit states are:

| Object | States | Transitions | Source |
| --- | --- | --- | --- |
| Mandate | open, closed | An open mandate (constraints plus `cnf`) becomes closed when the agent creates a key-binding JWT with the key in `cnf`, bound to one transaction; a user can also sign a closed mandate directly | [src-ap2-agent-authorization] |
| Open mandate scope | available, reduced, exhausted | After a success receipt the agent stores the open, closed and receipt tuple and reduces the open mandate's scope, "often preventing future presentations entirely"; with `payment.agent_recurrence` and `payment.budget` it can be reused within limits | [src-ap2-agent-authorization] [src-ap2-payment-mandate-doc] |
| Presentation | pending, accepted, rejected | Verifier returns a receipt with `status` `Success` or `Error`; the agent must not present a new closed mandate from the same open mandate while one is pending without a rejection receipt | [src-ap2-schema-receipts] [src-ap2-spec-v02] |
| Expiry | valid, expired | `exp` (Unix epoch) on any mandate; `payment.execution_date` window | [src-ap2-schema-payment] |

There is no revocation state: the spec defines no mandate revocation mechanism. The Implementation Considerations only say the agent SHOULD let users manage active mandates, and that managing delegated mandates on external Trusted Surfaces is out of scope [src-ap2-implementation].

The `a2a-x402` extension does define a payment state machine through the metadata key `x402.payment.status` with values `payment-required`, `payment-submitted`, `payment-rejected`, `payment-verified`, `payment-completed`, `payment-failed` [src-ap2-a2a-x402-v02].

## Transports

- **v0.2 is transport-agnostic.** AP2 "operates as a security feature within a Commerce Protocol"; catalog APIs, checkout updates and role-to-role APIs are out of scope. It is designed to be compatible with UCP [src-ap2-spec-v02].
- **UCP binding.** UCP defines the capability `dev.ucp.common.payment.ap2_mandate` (extends `dev.ucp.shopping.checkout`), advertised in `/.well-known/ucp`. The merchant signs the checkout response as a JWS with detached content in `ap2.merchant_authorization` (ES256, ES384 or ES512, JCS canonicalization, keys from `keys[]` in `/.well-known/ucp`); the platform returns `ap2.checkout_mandate` (an SD-JWT with key binding) on `complete`; the Payment Mandate travels in `payment.instruments[*].credential.token`. UCP's 2026-08-25 refactor (commit `0b9d7c40`, release `v2026-08-25`) cites AP2 v0.2 and issue #268 [src-ap2-ucp-ext] [src-ap2-ucp-schema].
- **A2A.** The Python and Go samples run the roles as A2A agents (`code/samples/python/scenarios/a2a/human-present/cards`, `.../x402`, `.../human-not-present/cards`, `.../x402`; `code/samples/go/scenarios/a2a`). The Implementation Considerations list "a Merchant Agent that communicates over agent-to-agent (a2a)" as one way to structure the merchant [src-ap2-repo] [src-ap2-implementation]. v0.1 documented an A2A extension and a sample agent card extension URI `https://google-a2a.github.io/A2A/ext/payments/v1` [src-ap2-spec-v01]. AP2 is not A2A: A2A is one possible transport for the samples.
- **OpenID4VP and the Digital Credentials API** carry the delegation step in the User Credential model (`response_mode` `dc_api`) [src-ap2-agent-authorization].
- **MCP.** v0.1 and the site describe AP2 as usable with MCP; the FAQ says an SDK and MCP server were "being worked on" [src-ap2-faq] [src-ap2-site]. No AP2 MCP server exists in the repository at `e1ea56d`.
- **Android.** `code/samples/android/scenarios/digital-payment-credentials` demonstrates digital payment credentials on Android [src-ap2-repo].

## Cryptography and standards used

| Element | Used how | Normative? | Source |
| --- | --- | --- | --- |
| SD-JWT (RFC 9901, published 2025-11) | Format of every mandate; selective disclosure of constraints; salted digests; decoy digests allowed (Section 4.2.5) | Normative reference | [src-ap2-agent-authorization] [src-ap2-security] [src-ap2-rfc9901] |
| SD-JWT VC | Mandates are SD-JWT VCs identified by `vct` | Spec text | [src-ap2-agent-authorization] |
| Delegate SD-JWT (individual draft by G. Oliver) | Chains open and closed mandates; the closed mandate is a key-binding JWT (`typ` `kb+sd-jwt` in examples) carrying `sd_hash` over the parent | Normative reference to a GitHub draft; posted to the IETF as `draft-gco-oauth-delegate-sd-jwt-00` on 2026-04-22 | [src-ap2-agent-authorization] [src-ap2-delegate-sd-jwt] |
| RFC 7800 `cnf` | Agent public key in open mandates (proof of possession) | Normative | [src-ap2-agent-authorization] |
| OpenID4VP 1.0 | `transaction_data` of type `delegate`; DCQL | Normative | [src-ap2-agent-authorization] |
| W3C Digital Credentials API | Recommended channel for OpenID4VP delegation | RECOMMENDED | [src-ap2-agent-authorization] |
| OpenID4VCI | One way to issue the user credential | Informative | [src-ap2-agent-authorization] |
| ISO 18013-5 mdoc, 18013-7 Annex C | Alternatives that "could" fill the same role | Informative | [src-ap2-agent-authorization] |
| ES256 (ECDSA P-256) | Used in every example; `jwk.json` fixes `alg` ES256 and `crv` P-256 | Examples and SDK type | [src-ap2-payment-mandate-doc] [src-ap2-schema-types] |
| SHA-256 | Default hash for `checkout_hash`, `transaction_id`, receipt `reference` unless `_sd_alg` says otherwise | Normative | [src-ap2-schema-checkout] |
| JWT | Merchant-signed `checkout_jwt`; signed receipts | Normative | [src-ap2-spec-v02] |
| eIDAS QWAC | `pisp.domain_name` described as secured by the TPP's QWAC | Schema description | [src-ap2-schema-types] |
| EMVCo DPC credential | Example credential type `com.emvco.dpc` | Example only | [src-ap2-agent-authorization] |

- **Hash bindings.** `checkout_hash` = hash of `checkout_jwt` (closed Checkout Mandate); `transaction_id` = the same hash in the closed Payment Mandate; `conditional_transaction_id` in `payment.reference` = digest of the open Checkout Mandate; `sd_hash` binds a closed mandate to its open parent; receipt `reference` = hash of the closed mandate, computed like `sd_hash` [src-ap2-schema-checkout] [src-ap2-schema-payment] [src-ap2-schema-open-payment] [src-ap2-spec-v02].
- **Signature determinism rule.** `specification.md` requires the Checkout JWT to be signed with a non-deterministic scheme such as ECDSA, not a deterministic one such as Ed25519, to stop rainbow-table guessing of `checkout_hash`; `security_and_privacy_considerations.md` instead allows a deterministic scheme if the Checkout carries a salt of sufficient entropy. Issue #268 (opened 2026-05-26 by igrigorik, still open on 2026-10-11) reports the inconsistency; spec author GarethCOliver agreed on 2026-05-27 that a payload-entropy rule is reasonable and that the change belongs in the FIDO working group [src-ap2-spec-v02] [src-ap2-security] [src-ap2-issue-268].
- **W3C VC 2.0 and DIDs (correction 2.2).** The v0.2 normative documents do not reference W3C Verifiable Credentials Data Model 2.0 or DIDs; they use SD-JWT VC, OpenID4VP and the Digital Credentials API. VC 2.0 and DIDs belong to the wider verifiable-credential family. The v0.1 specification spoke of "Verifiable Credentials (VCs)" generically, and the launch post says mandates are "signed by verifiable credentials" [src-ap2-agent-authorization] [src-ap2-spec-v01] [src-ap2-gcloud-launch].

## Security model and published attacks or CVEs

### Threat model (`security_and_privacy_considerations.md`)

AP2 assumes that preventing prompt injection is infeasible, so every LLM and agent must be treated as a potential attacker [src-ap2-security].

| Threat | Mitigation in the spec |
| --- | --- |
| Stolen Payment Mandate used with another checkout | Closed Payment Mandate carries `transaction_id`; open ones carry a reference constraint (the doc writes it as `mandate.payment.reference`, while the schema key is `payment.reference`) |
| Reuse of an open mandate with a different closed mandate or checkout | Closed mandates must carry `sd_hash`; open mandates must carry the agent key in `cnf` |
| Closed Checkout Mandate used with another session | Merchant checks `checkout_hash` against the latest `checkout_jwt` |
| Payment manipulated in transit by the SA or CP | MPP and CP verify the user's signature; `transaction_id` link; constraint evaluation |
| Theft of the payment credential or token | Token released to the merchant only after a final Payment Mandate is verified |
| Prompt injection steering product choice ("Manipulated Discovery") | Merchant signature; constraints bound the worst-case financial impact |
| Double spend from one open mandate | Deterministic part of the agent must not sign overlapping closed mandates without rejection receipts, which must be integrity-protected from the LLM; CP, networks or MPPs MAY reject overlapping mandates or invalidate tokens |
| Leakage of user intent through constraints | Selective disclosure MUST be used; decoy digests MAY be added |
| Rainbow-table guessing of digests | Salted digests (RFC 9901 Section 9.1); entropy in the Checkout JWT |

- **No revocation.** v0.2 defines no way to revoke a mandate before `exp` [src-ap2-implementation] [src-ap2-agent-authorization].
- **No step-up.** v0.2 defines no step-up authentication; failures fall back through `unresolved_constraint` (correction 2.1.10). Liability is left to the networks, as in v0.1 Table 6.1 [src-ap2-agent-authorization] [src-ap2-spec-v01].
- **Agent identification** is left to the commerce protocol layer [src-ap2-implementation].
- **Agent-to-agent delegation** is conceptually possible but out of scope [src-ap2-spec-v02].
- **CVEs and advisories.** No CVE and no GitHub security advisory was found for `google-agentic-commerce/AP2` as of 2026-10-11 [src-ap2-gh-advisories].

### Reported weaknesses in the reference SDK and samples (GitHub issues, unreviewed by maintainers)

Since 2026-04-29 outside contributors have filed issues against the Python SDK and samples, none merged or confirmed by maintainers as of 2026-10-11: closed checkout binding not enforced by default (#328, #358), verifiers never consume an accepted closed Payment Mandate so it can be replayed (#346), constraint evaluation is presence-driven so a withheld disclosure can silently pass (#339), the `contains` requirement on constraints is dropped by code generation (#356), the budget cap uses `max * 100` for all currencies (#362), and the Mandate Receipt `result` versus `status` mismatch (#374) [src-ap2-gh-issues-since]. These are reported, not verified.

### Research (details under Publications)

- arXiv:2608.23858 reports 48 threats with 8 rated high risk; arXiv:2602.06345 reports replay and context-binding gaps; arXiv:2601.22569 shows prompt injection that steers agent choices; arXiv:2609.00060 models agent payment protocols in Tamarin. See the Publications table for verified titles.

## Controls (native and gaps)

| Control id | Support | AP2 v0.2 mechanism or gap | Sources |
| --- | --- | --- | --- |
| `agent-identity-verification` | partial | Agent proves possession of the key in `cnf`; who the agent is, is left to the commerce protocol | [src-ap2-agent-authorization] [src-ap2-implementation] |
| `agent-registration-kya` | none | No registry or KYA; Trusted Agent Provider model relies on verifiers trusting each provider out of band | [src-ap2-agent-authorization] |
| `user-consent-capture` | native | Trusted Surface (non-agentic) renders Mandate Content and gets authentication and consent before signing | [src-ap2-spec-v02] |
| `spending-caps` | native | `payment.amount_range` per payment, `payment.budget` cumulative | [src-ap2-schema-open-payment] |
| `merchant-payee-scoping` | native | `checkout.allowed_merchants`, `payment.allowed_payees`, `payment.allowed_pisps`, `payment.allowed_payment_instruments`, `checkout.line_items` | [src-ap2-schema-open-checkout] [src-ap2-schema-open-payment] |
| `time-windows-expiry` | native | `iat`, `exp`, `payment.execution_date`, `payment.agent_recurrence` | [src-ap2-schema-open-payment] |
| `revocation` | none | No mandate revocation defined; only short `exp` and agent-side management | [src-ap2-implementation] |
| `step-up-authentication` | none | Not specified in v0.2; `unresolved_constraint` fallback to a human-present approval | [src-ap2-agent-authorization] |
| `replay-protection` | partial | `checkout_hash`, `transaction_id`, `sd_hash`, `cnf`, one-at-a-time presentation rule; consumption tracking left to verifiers (see issue #346) | [src-ap2-security] [src-ap2-gh-issues-since] |
| `receipts-evidence` | native | Signed Payment and Checkout Receipts bound by `reference` | [src-ap2-schema-receipts] |
| `dispute-support` | partial | Dispute verification steps defined; retention, retrieval and adjudication out of scope | [src-ap2-spec-v02] |
| `reputation` | none | Not addressed | [src-ap2-spec-v02] |
| `monitoring-signals` | partial | `risk_data` map from the Trusted Surface; no event or telemetry format | [src-ap2-schema-payment] |
| `kill-switch` | external | CP, networks or MPPs MAY reject overlapping mandates or invalidate tokens; card networks keep their own controls | [src-ap2-security] |

## Observability

- **Public data.** The specification, schemas and samples on GitHub; the docs site; GitHub issues and pull requests. AP2 defines no public registry, explorer, indexer, `.well-known` path or event stream of its own [src-ap2-repo] [src-ap2-spec-v02].
- **Schema `$id` URLs** use `https://ap2-protocol.org/schemas/...` (for example `checkout_mandate.json`, `payment_mandate.json`, `payment_mandate_open.json`, `types/merchant.json`) [src-ap2-schema-types].
- **Discovery through UCP.** A business advertises `dev.ucp.common.payment.ap2_mandate` in `/.well-known/ucp`, and signing keys sit in `keys[]` there, so AP2 support is publicly observable only for UCP merchants that publish profiles [src-ap2-ucp-ext].
- **Private data.** Mandates, receipts and `risk_data` stay between the SA, CP, Merchant, MPP and Network. Selective disclosure deliberately limits what each sees [src-ap2-security].
- **Self-reported deployment surfaces.** Issue #345 (2026-08-29) claims a merchant-side v0.2 deployment at Suede Agent Studio with `/.well-known/ap2.json` and `/.well-known/ap2-jwks.json`. These paths are not defined by AP2; they are that implementer's own convention [src-ap2-issue-345].

## Compliance touchpoints

- **PSD2 and SCA language.** The glossary defines Strong Customer Authentication, Dynamic Linking (linking SCA to transaction details) and PISP; `pisp.json` refers to eIDAS QWAC certificates of the TPP. These are European open-banking terms, but the spec does not claim PSD2 compliance [src-ap2-glossary] [src-ap2-schema-types].
- **PCI DSS.** The FAQ says the role-based design keeps sensitive PCI and PII data from shopping agents through payload encryption and selective disclosure [src-ap2-faq].
- **Dispute evidence and liability.** Mandates are evidence for network adjudicators; liability rules stay with each network (v0.1 Table 6.1 is "not a binding contract of any kind") [src-ap2-spec-v01] [src-ap2-faq].
- **Privacy and data minimization.** Selective disclosure is mandatory for constraints; agents must reveal only needed disclosures [src-ap2-security] [src-ap2-spec-v02].
- **Post-quantum and algorithm agility.** Issue #250, cited by #268, proposes a `signature_algorithm` field citing HKMA, EU DORA and NIST IR 8547; not adopted [src-ap2-issue-268].

## Ecosystem and SDKs

| Artifact | Where | Version or status (as of 2026-10-11) | Source |
| --- | --- | --- | --- |
| Python SDK `ap2` (models, mandate chains, constraint evaluation, max-flow helper, SD-JWT helpers, receipts) | `code/sdk/python/ap2/` in the AP2 repo; root `pyproject.toml` name `ap2`, version `0.1`, requires Python 3.11 or later, depends on `sd-jwt` 0.10.4, `jwcrypto` 1.5.6, `cryptography` 46.0.5, `pydantic` 2.12.5 | Installed from source only; not published by Google to PyPI | [src-ap2-repo] |
| Python samples (ADK, Gemini 3.1 Flash Lite Preview) | `code/samples/python/scenarios/a2a/human-present/{cards,x402}`, `.../human-not-present/{cards,x402}` | In repo | [src-ap2-repo] |
| Go samples | module `github.com/google-agentic-commerce/ap2/samples/go` (Go 1.24.0), `code/samples/go/scenarios/a2a` | In repo | [src-ap2-repo] |
| Android sample | `code/samples/android/scenarios/digital-payment-credentials` | In repo | [src-ap2-repo] |
| Web client | `code/web-client/` (Vite and React demo) | In repo | [src-ap2-repo] |
| JSON Schemas | `code/sdk/schemas/ap2/*.json`, `$id` under `https://ap2-protocol.org/schemas/` | v0.2 | [src-ap2-schema-types] |
| TypeScript SDK | PR #305 "feat(sdk): add TypeScript SDK for AP2 mandates and receipts" | Closed without merge on 2026-10-03 | [src-ap2-gh-issues-since] |
| `a2a-x402` | `google-agentic-commerce/a2a-x402`; Python package `x402-a2a` 0.1.0 in `python/x402_a2a/pyproject.toml` (authors Coinbase Developer Platform and Google A2A); GitHub release `v0.1.0` 2025-09-16 | `x402-a2a` not found on PyPI | [src-ap2-a2a-x402-repo] |
| Name collisions on registries | PyPI `ap2` 0.1.1 (2025-10-03) belongs to a third-party repo `whillhill/ap2`; npm `ap2` 0.0.1 is maintained by `melvincarvalho` | Not Google packages; do not present them as the official SDK | [src-ap2-pypi-npm] |
| UCP extension | `dev.ucp.common.payment.ap2_mandate` in UCP schemas and SDKs | In UCP since the 2026-01-11 initial commit; refactored 2026-08-25 | [src-ap2-ucp-ext] [src-ap2-ucp-releases] |

- **Partners.** The launch post named 16 organizations out of "more than 60" [src-ap2-gcloud-launch]. The repository partners page held 56 entries at the launch commit and at `v0.1.0`, 113 after Tether, Solana and OKX were added on 2025-10-30 (#103), and 125 at its last edit on 2026-02-09 (Kite AI, #161); v0.2 removed the page [src-ap2-gh-partners-history] [src-ap2-partners-launch] [src-ap2-partners-final]. The launch partners file lists "Ant Group" where the launch post says "Ant International"; Visa appears in neither the launch post nor any version of the partners page [src-ap2-partners-launch] [src-ap2-gcloud-launch]. Being listed is endorsement, not deployment.
- **Production use (correction 2.1.9).** No primary source verifies production use of AP2 mandates anywhere, including inside UCP and Google's own surfaces. The AP2 FAQ frames the UCP AP2 extension as something merchants "will be able to" use for agent-driven transactions [src-ap2-faq]. The 2026-08-24 paper arXiv:2608.23858 states that no complete public AP2 deployment was available to its authors [src-ap2-pub-2608-23858]. One third party self-reports a merchant-side v0.2 deployment (issue #345, Suede Agent Studio, 2026-08-29); this is unverified [src-ap2-issue-345].
- **Third-party drafts.** `draft-stone-vcap-ap2-binding-01` (B. Stone, SwarmSync.AI; individual Informational Internet-Draft; -00 2026-03-17, -01 2026-09-04, expires 2027-03-08) binds "Verified Commerce for Agent Protocols" delivery and settlement evidence to AP2 mandates by digest. Its abstract still names the v0.1 objects IntentMandate, CartMandate and PaymentMandate. It has no IETF standing [src-ap2-dt-vcap].

## Fees and costs

- AP2 defines no fee, no pricing and no protocol-level charge. It carries authorization evidence; payment costs are those of the underlying rail (card interchange and processing, bank transfer, or for x402 the chain gas and facilitator fees) [src-ap2-spec-v02].
- ATLAS_FOLLOWUP Appendix B has no AP2-specific row. For UCP, where AP2 is embedded, Appendix B records secondary reporting that Google "doesn't plan to take a cut" (2026-01-12, The Register) and the UCP FAQ statement that the merchant's PSP must process Google tokens; neither is an AP2 fee [src-ap2-register-ucp].
- Hidden costs named in sources: running a Trusted Surface and key management; integrators under Web Bot Auth may need a second key type because of the ECDSA rule, which issue #268 calls a "composition cost" [src-ap2-issue-268].

## Metrics with dates and caveats

| Metric | Value | As of | Caveat | Source |
| --- | --- | --- | --- | --- |
| Launch collaborators | "more than 60 organizations" | 2025-09-16 | Google's own count; not a list of deployments | [src-ap2-gcloud-launch] |
| Partners page entries | 56 / 113 / 125 | 2025-09-16 / 2025-10-30 / 2026-02-09 | Self-nominated through a form; page removed in v0.2 | [src-ap2-gh-partners-history] |
| GitHub stars, forks | 3,216 stars, 510 forks | 2026-10-11 | Popularity, not adoption | [src-ap2-gh-repo] |
| Open issues and PRs | 174 | 2026-10-11 | Includes community PRs | [src-ap2-gh-repo] |
| Issues and PRs opened since v0.2 | 44 issues, 63 PRs | 2026-04-29 to 2026-10-11 | None merged | [src-ap2-gh-issues-since] |
| Commits on `main` since 2026-04-29 | 0 | 2026-10-11 | Spec work moved to FIDO | [src-ap2-gh-commits] |
| Verified production deployments | none found | 2026-10-11 | One self-report (#345) | [src-ap2-issue-345] |
| `a2a-x402` stars | 564 | 2026-10-11 | | [src-ap2-a2a-x402-repo] |

## Relations to the other seven protocols

- **UCP (`ucp`).** Native embedding. UCP defines the extension `dev.ucp.common.payment.ap2_mandate`: the merchant signs the checkout (`ap2.merchant_authorization`, detached JWS), the platform submits `ap2.checkout_mandate` (SD-JWT with key binding) on complete, and the Payment Mandate travels in `payment.instruments[*].credential.token`. The AP2 doc first appeared in UCP's initial commit on 2026-01-11; the 2026-08-25 refactor (release `v2026-08-25`) references AP2 v0.2 and issue #268. AP2 v0.2 says the `checkout_jwt` MUST be a UCP Checkout object when used with UCP, and `types/item.json` says it matches UCP's item type (2026-04-08). Live use of the extension is unverified [src-ap2-ucp-ext] [src-ap2-ucp-releases] [src-ap2-checkout-mandate-doc] [src-ap2-schema-types].
- **x402 (`x402`).** Through `a2a-x402`, launched with AP2 on 2025-09-16 with Coinbase, the Ethereum Foundation and MetaMask. The a2a-x402 v0.2 spec (2025-11-04) supports a Standalone Flow and an Embedded Flow in which `x402PaymentRequiredResponse` sits inside an AP2 `CartMandate` (data key `ap2.mandates.CartMandate`) and `PaymentPayload` inside an AP2 `PaymentMandate`; payment state is tracked in `x402.payment.status` from `payment-required` to `payment-completed`. Those are AP2 v0.1 objects: AP2 v0.2 has no Cart mandate, so the documented embedding targets v0.1 and has not been updated for v0.2 (correction 2.3.2). The a2a-x402 v0.1 spec does not mention AP2. The AP2 repository also ships x402 samples (human-present and human-not-present), added to the Python samples on 2025-12-15 (#121). The x402 Foundation repository does not reference AP2 [src-ap2-a2a-x402-v02] [src-ap2-a2a-x402-v01] [src-ap2-gcloud-launch] [src-ap2-gh-commits] [src-ap2-repo].
- **Mastercard Agent Pay (`mastercard-agent-pay`).** Through Verifiable Intent (VI). Mastercard launched in the launch list; on 2026-04-28 Mastercard contributed VI, "co-developed with Google and designed to work with AP2", to FIDO alongside AP2. VI 0.1-draft uses the same mandate `vct` values as AP2 v0.2 (`mandate.checkout.open.1`, `mandate.checkout.1`, `mandate.payment.open.1`, `mandate.payment.1`) and aligned constraint semantics, but different key prefixes: AP2 schemas use `checkout.allowed_merchants`, `checkout.line_items`, `payment.amount_range`, `payment.allowed_payees`, `payment.budget`, `payment.agent_recurrence`, `payment.reference`; the VI spec README uses `mandate.checkout.allowed_merchants`, `mandate.checkout.line_items`, `mandate.payment.amount_range`, `mandate.payment.allowed_payees`, `mandate.payment.budget`, `mandate.payment.agent_recurrence`, `mandate.payment.reference`, and adds `mandate.payment.recurrence`. AP2's `payment.allowed_payment_instruments`, `payment.allowed_pisps` and `payment.execution_date` have no VI counterpart in the files read. The top-level VI `README.md` contains none of these strings; they appear in `spec/README.md` and `spec/constraints.md` (correction 2.3.3) [src-ap2-fido-pr] [src-ap2-google-fido-blog] [src-ap2-vi-spec] [src-ap2-vi-constraints] [src-ap2-schema-open-payment] [src-ap2-schema-open-checkout].
- **Visa TAP (`visa-tap`).** No documented relation. The AP2 repository and docs do not mention Visa or the Trusted Agent Protocol; Visa was not in the launch list. Visa co-chairs the FIDO Payments group where AP2 now lives. Issue #268 discusses composing AP2 with Web Bot Auth (Ed25519 HTTP signatures), the direction TAP is aligned with. AP2's "Trusted Agent Provider" is a delegation model, not Visa TAP [src-ap2-repo] [src-ap2-fido-pr] [src-ap2-issue-268].
- **OpenAI ACP (`openai-acp`).** No documented relation. The AP2 repository does not mention ACP, Shared Payment Tokens or OpenAI, and the ACP repository does not mention AP2. OpenAI's link is indirect: a member chairs FIDO's Agentic Authentication TWG [src-ap2-repo] [src-ap2-fido-pr].
- **Stripe MPP (`stripe-mpp`).** No documented relation. The cloned `mpp-specs`, `mpp` and `mppx` repositories do not mention AP2, and AP2 does not mention Stripe or Tempo. The abbreviation "MPP" in AP2 means Merchant Payment Processor, a role [src-ap2-spec-v02] [src-ap2-repo].
- **ERC-8004 (`erc-8004`).** No documented relation in either repository. The on-chain analogue of a mandate is ERC-8226 "Regulated Agent Mandate" (Draft, created 2026-04-12, Brickken authors): a verified principal grants an agent scoped, time-bounded, capped authority (`grantMandate`, `revokeMandate`, `extendMandate`, `canExecute`, `recordExecution`, `freezeAgent`; struct fields `validFrom`, `validUntil`, `maxTransactionValue`, `maxCumulativeValue`, `cumulativeUsed`, `revoked`), naming ERC-8004 as the agent identity layer and ERC-7943 or ERC-3643 as token compliance. Unlike AP2, it has on-chain revocation and freeze. ERC-8226 does not mention AP2 [src-ap2-erc8226].
- **A2A (not one of the eight).** AP2 is not A2A. v0.1 was framed as an A2A and MCP extension; v0.2 samples still run over A2A, but v0.2 itself is transport-agnostic [src-ap2-spec-v01] [src-ap2-spec-v02].

## Criticisms and open questions

1. **No revocation.** An open mandate stays valid until `exp`; the spec relies on short expiry and agent-side management [src-ap2-implementation].
2. **No step-up in v0.2.** Recovery depends on `unresolved_constraint` fallbacks; the normative docs do not define how a verifier challenges the user, while the Executive Summary still mentions 3DS2 [src-ap2-agent-authorization] [src-ap2-overview].
3. **Signature determinism inconsistency** (issue #268), open since 2026-05-26 and deferred to FIDO [src-ap2-issue-268].
4. **Receipt field mismatch.** `agent_authorization.md` defines Mandate Receipt `result` (`success`, `error`) while the schemas use `status` (`Success`, `Error`) (issue #374) [src-ap2-agent-authorization] [src-ap2-schema-receipts] [src-ap2-issue-374].
5. **Unit inconsistencies.** `payment.amount_range` `max` and `min` are integers in minor units, but the doc example uses `100.50` and `10.00`; `payment.budget` `max` is typed `number` without a stated unit, and its example is `1000.00` (PR #340 proposes documenting the unit; issue #362 reports a `max * 100` cap bug in the SDK) [src-ap2-schema-open-payment] [src-ap2-payment-mandate-doc] [src-ap2-gh-issues-since].
6. **Prefix drift.** The security doc writes `mandate.payment.reference`, the schema `payment.reference`; VI uses the `mandate.` prefix throughout [src-ap2-security] [src-ap2-schema-open-payment] [src-ap2-vi-spec].
7. **`vct` descriptions disagree with `const`.** Each schema's description says, for example, "MUST be 'mandate.checkout'" while the `const` is `mandate.checkout.1` (PR #349 proposes fixing this) [src-ap2-schema-checkout] [src-ap2-gh-issues-since].
8. **a2a-x402 version mismatch** (v0.1 Cart and Payment mandates only) [src-ap2-a2a-x402-v02].
9. **Stateful constraints.** `payment.budget` and `payment.agent_recurrence` require verifiers to track previous presentations; the spec does not say who holds that state. VI calls such constraints network-enforced [src-ap2-payment-mandate-doc] [src-ap2-vi-spec].
10. **Pre-authorization context is unprotected.** Mandates protect data after signing, but A2A messages and MCP tool calls that shape the transaction before signing are outside that protection (arXiv:2608.23858); prompt injection can steer product ranking (arXiv:2601.22569) [src-ap2-pub-2608-23858] [src-ap2-pub-2601-22569].
11. **Runtime replay.** Consume-once semantics are not specified; arXiv:2602.06345 proposes runtime nonces; issue #346 reports that the samples never consume an accepted Payment Mandate [src-ap2-pub-2602-06345] [src-ap2-gh-issues-since].
12. **Governance in transition.** Normative work moved to FIDO, but no FIDO draft is public; the GitHub repo receives issues and PRs that nobody merges [src-ap2-fido-pr] [src-ap2-gh-issues-since].
13. **Reference dating error.** AP2 cites SD-JWT (RFC 9901) as "February 2025"; the RFC Editor dates RFC 9901 to November 2025 [src-ap2-agent-authorization] [src-ap2-rfc9901].
14. **Normative dependence on an individual draft.** Mandate chaining relies on Delegate SD-JWT, an individual draft with no working-group adoption found [src-ap2-delegate-sd-jwt].

## Resources (20 or more)

URLs re-checked with `curl -sSIL` on 2026-10-11; status shown in the note when not 200.

| Title | URL | Publisher | Date | Type | Badge | Note | Start here |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AP2 documentation site | https://ap2-protocol.org/ | Google (google-agentic-commerce) | 2026-04-28 (v0.2) | docs | official | Overview, spec, glossary, FAQ, samples; FIDO pointer | yes |
| AP2 repository | https://github.com/google-agentic-commerce/AP2 | Google | 2025-09-16 (v0.1.0), 2026-04-28 (v0.2.0) | repo | official | Spec in `docs/ap2/`, schemas, Python SDK, samples | yes |
| AP2 v0.2 specification | https://github.com/google-agentic-commerce/AP2/blob/main/docs/ap2/specification.md | Google | 2026-04-28 | spec | official | Roles, modes, verification, dispute | yes |
| Agent Authorization | https://github.com/google-agentic-commerce/AP2/blob/main/docs/ap2/agent_authorization.md | Google | 2026-04-28 | spec | official | Open and closed mandates, OpenID4VP delegation, errors | yes |
| Flow Examples | https://github.com/google-agentic-commerce/AP2/blob/main/docs/ap2/flows.md | Google | 2026-04-28 | spec | official | Human Present and Human Not Present step lists | no |
| AP2 JSON Schemas | https://github.com/google-agentic-commerce/AP2/tree/main/code/sdk/schemas/ap2 | Google | 2026-04-28 | spec | official | Source for every field table | no |
| AP2 v0.1.0 specification | https://github.com/google-agentic-commerce/AP2/blob/v0.1.0/docs/specification.md | Google | 2025-09-16 | spec | official | Intent, Cart and Payment mandates; 3DS2 challenges | no |
| Powering AI commerce with the new Agent Payments Protocol (AP2) | https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol | Google Cloud Blog | 2025-09-16 | announcement | official | Launch post, partner list, a2a-x402 | yes |
| We're donating Agent Payments Protocol to the FIDO Alliance | https://blog.google/products-and-platforms/platforms/google-pay/agent-payments-protocol-fido-alliance/ | Google | 2026-04-28 | announcement | official | Donation and v0.2 release | no |
| FIDO Alliance to Develop Standards for Trusted AI Agent Interactions | https://fidoalliance.org/fido-alliance-to-develop-standards-for-trusted-ai-agent-interactions/ | FIDO Alliance | 2026-04-28 | announcement | official | Working groups and chairs; curl 403, read via WebFetch | no |
| FIDO Alliance Launches Payments Working Group | https://fidoalliance.org/fido-alliance-launches-payments-working-group | FIDO Alliance | 2025-04-29 | announcement | official | Shows the Payments group predates the donation | no |
| UCP AP2 Mandates Extension | https://ucp.dev/latest/specification/payment/extensions/ap2-mandates/ | Universal Commerce Protocol | 2026-08-25 | spec | partner | How UCP carries AP2 mandates | no |
| a2a-x402 | https://github.com/google-agentic-commerce/a2a-x402 | Google Agentic Commerce | 2025-09-16 | repo | official | AP2's crypto path (Appendix A); embeds v0.1 mandates | no |
| Verifiable Intent specification | https://github.com/agent-intent/verifiable-intent/blob/main/spec/README.md | Mastercard and Google | 2026-02-19 (0.1.0) | spec | partner | Same `vct` values, `mandate.`-prefixed constraint keys | no |
| Delegate SD-JWT (individual draft) | https://github.com/GarethCOliver/gco-delegate-sd-jwt | Gareth Oliver | 2026-03-04 created | spec | community | Chaining mechanism AP2 depends on; IETF `draft-gco-oauth-delegate-sd-jwt-00` | no |
| RFC 9901 Selective Disclosure for JSON Web Tokens | https://www.rfc-editor.org/rfc/rfc9901 | IETF | 2025-11 | standard | official | SD-JWT base format | no |
| OpenID for Verifiable Presentations 1.0 | https://openid.net/specs/openid-4-verifiable-presentations-1_0.html | OpenID Foundation | 2025 | standard | official | `transaction_data` used for delegation (AP2 links an older URL that now returns 404) | no |
| Digital Credentials API | https://www.w3.org/TR/digital-credentials/ | W3C | ongoing | standard | official | Recommended delegation channel | no |
| How the Agent Payments Protocol (AP2) lets AI shop for you, securely | https://youtu.be/jSHj0z9Gi24 | Google for Developers (YouTube) | 2025 | video | official | Short intro video linked from the README [src-ap2-video-intro] | yes |
| Agent payments, can you do my shopping? (The Agent Factory, episode 8) | https://youtu.be/T1MtWnEYXM0 | Google Cloud Tech (YouTube) | 2025-09 | video | official | Video podcast episode on AP2; answers the follow-up's "no podcast found" gap [src-ap2-video-agent-factory] | no |
| Issue 268: Checkout JWT algorithm constraint | https://github.com/google-agentic-commerce/AP2/issues/268 | GitHub (igrigorik) | 2026-05-26 | other | community | Open spec bug, author response | no |
| draft-stone-vcap-ap2-binding-01 | https://datatracker.ietf.org/doc/draft-stone-vcap-ap2-binding/ | IETF Datatracker (B. Stone) | 2026-09-04 | spec | community | Third-party individual draft; no IETF standing | no |
| ERC-8226: Regulated Agent Mandate | https://eips.ethereum.org/EIPS/eip-8226 | Ethereum Improvement Proposals | 2026-04-12 | standard | community | On-chain analogue of a mandate (Draft) | no |
| Google's AP2: The New Way AI Agents Pay for You | https://www.analyticsvidhya.com/blog/2025/09/agent-payments-protocol-ap2/ | Analytics Vidhya | 2025-09-25 | tutorial | community | Appendix A; v0.1 mandates and sample run | no |
| AP2: Technical Guide & Implementation | https://medium.com/@visrow/google-agent-payments-protocol-ap2-technical-guide-implementation-73ee772fe349 | Vishal Mysore | 2025-09-18 | tutorial | community | Appendix A; Java v0.1 flow; HEAD returned 403 (bot block) on 2026-10-11 | no |
| Google's new Agent Payments Protocol (RTZ #848) | https://michaelparekh.substack.com/p/ai-googles-new-ai-agent-payments | Michael Parekh | 2025-09-18 | newsletter | community | Appendix A; strategic framing | no |
| Should banks fear Google's Fintech comeback? | https://lex.substack.com/p/analysis-should-banks-fear-googles | Fintech Blueprint | 2025 | newsletter | community | Appendix A | no |
| AP2 and the Race to Build Agent Infrastructure | https://yewjin.substack.com/p/agent-payments-protocol-ap2-and-the | Yew Jin | 2025-09 | newsletter | community | Appendix A; AP2 with ERC-8004 layers | no |
| Google AP2: Solving Trust in Agent Payments | https://blog.pebblous.ai/blog/google-ap2-agent-payment-protocol-2025/en/ | Pebblous | 2025-2026 | long-form | community | Appendix A | no |
| Agentic commerce and the battleground for payments infrastructure | https://bankunderground.co.uk/2026/05/21/agentic-commerce-and-the-battleground-for-new-payments-infrastructure/ | Bank Underground (Bank of England staff blog) | 2026-05-21 | long-form | community | Cross-cutting, Appendix A | no |
| Agentic Payment Protocols Compared | https://www.fireblocks.com/blog/agentic-payment-protocols-compared | Fireblocks | 2026-08-27 | long-form | community | Cross-cutting, Appendix A; HEAD 403 on 2026-10-11 | no |
| AP2 vs ACP vs x402 | https://blindpay.com/resources/more/agent-payment-protocols-compared | BlindPay | 2026-09-02 | long-form | community | Cross-cutting, Appendix A | no |
| Beyond the Mandate: A Systematic Security Analysis of AP2 | https://arxiv.org/abs/2608.23858 | arXiv | 2026-08-24 | paper | academic | 48 threats, 8 High | no |

Note: all v0.1-era tutorials describe Intent and Cart mandates that v0.2 removed; writers should label them "v0.1".

## Publications (verified IDs)

Checked against `https://export.arxiv.org/api/query` and `https://doi.org` content negotiation on 2026-10-11. All 14 seed items resolved; titles below are as registered.

| ID | Title (verified) | Authors | First version or date | Relevance |
| --- | --- | --- | --- | --- |
| arXiv:2608.23858 | Beyond the Mandate: A Systematic Security Analysis of the Agent Payments Protocol (AP2) | Avital Aviv, Parth A. Gandh, Ron Bitton, Asaf Shabtai | 2026-08-24 | Direct: AP2 v0.2 MAESTRO threat model, 48 threats, 8 reach the High band (AIVSS) in at least one of five architectures; built its own testbed because no complete public deployment existed [src-ap2-pub-2608-23858] |
| arXiv:2602.06345 | Zero-Trust Runtime Verification for Agentic Payment Protocols: Mitigating Replay and Context-Binding Failures in AP2 | Qianlong Lan, Anuj Kaul, Shaun Jones, Stephanie Westrum | 2026-02-06 | Direct: replay and context-redirect gaps; consume-once nonces, about 3.8 ms at up to 10,000 TPS in simulation [src-ap2-pub-2602-06345] |
| arXiv:2601.22569 | Whispers of Wealth: Red-Teaming Google's Agent Payments Protocol via Prompt Injection | Tanusree Debi, Wentian Zhu, Pranjol Sen Gupta | 2026-01-30 | Direct: Branded Whisper and Vault Whisper attacks on an AP2 agent (Gemini 2.5 Flash, ADK); DOI 10.1109/IMNS67862.2026.11655291 (IMNS 2026) [src-ap2-pub-2601-22569] |
| arXiv:2609.00060 | A Formal Analysis of Agent Payment Protocols | Ke Jiang, Mohan Yu, Yuan Chang, Mohit Kumar Jangid et al. | 2026-08-30 | Direct: Tamarin models of x402, MPP, ACP and AP2; 86 cases, 40 new findings, 18 principles [src-ap2-pub-2609-00060] |
| arXiv:2604.15367 | SoK: Security of Autonomous LLM Agents in Agentic Commerce | Qian'ang Mao, Jiaxin Wang, Ya Liu, Li Zhu et al. | 2026-04-15 | Context: 12 cross-layer attack vectors across ERC-8004, AP2, x402, ACP, MPP and others [src-ap2-pub-2604-15367] |
| arXiv:2603.24775 | AIP: Agent Identity Protocol for Verifiable Delegation Across MCP and A2A | Sunil Prakash | 2026-03-25 | Related delegation design [src-ap2-pub-2603-24775] |
| arXiv:2509.25974 | OpenID Connect for Agents (OIDC-A) 1.0: A Standard Extension for LLM-Based Agent Identity and Authorization | Subramanya Nagabhushanaradhya | 2025-09-30 | Related identity standard proposal [src-ap2-pub-2509-25974] |
| arXiv:2510.25819 | Identity Management for Agentic AI: The new frontier of authorization, authentication, and security for an AI agent world | Tobin South, Subramanya Nagabhushanaradhya, Ayesha Dissanayaka, Sarah Cecchetti et al. | 2025-10-29 | OpenID Foundation white paper context [src-ap2-pub-2510-25819] |
| arXiv:2501.09674 | Authenticated Delegation and Authorized AI Agents | Tobin South, Samuele Marro, Thomas Hardjono, Robert Mahari et al. | 2025-01-16 | Delegation credentials, precursor ideas [src-ap2-pub-2501-09674] |
| arXiv:2609.15803 | Delegating Authorization to Misaligned Agents: Coalitional Alignment and Safe Control | Natalie Collina, Surbhi Goel, Aaron Roth, Sikata Bela Sengupta | 2026-09-14 | Theory of approving agent actions [src-ap2-pub-2609-15803] |
| DOI 10.14722/ndss.2014.23212 | Macaroons: Cookies with Contextual Caveats for Decentralized Authorization in the Cloud | Arnar Birgisson, Joe Gibbs Politz, Úlfar Erlingsson, Ankur Taly, Michael Vrable, Mark Lentczner | 2014 (NDSS) | Ancestor of attenuated, caveat-based delegation (compare open-mandate constraints) [src-ap2-pub-macaroons] |
| arXiv:2501.07913 | Governing AI Agents | Noam Kolt | 2025-01-14 | Legal and governance context [src-ap2-pub-2501-07913] |
| arXiv:2508.08544 | AI Agents and the Law | Mark O. Riedl, Deven R. Desai | 2025-08-12 | Legal context (agency, liability) [src-ap2-pub-2508-08544] |
| DOI 10.1017/err.2026.10103 | AI Agents in Payments: Applications, Risks and Regulations | David Restrepo Amariles, Damien Charlotin, Liyun He-Guelton | 2026-05-19 (European Journal of Risk Regulation) | Regulatory context [src-ap2-pub-restrepo] |

## Seed audit

| Seed fact (ATLAS_PROMPT 5.7 or ATLAS_FOLLOWUP Section 2) | Verdict | Evidence | Note |
| --- | --- | --- | --- |
| Bubble: signed mandates prove what a user authorized an agent to buy | confirmed | src-ap2-spec-v02 | |
| Bubble: v0.2 uses Checkout and Payment Mandates, each closed or open | confirmed | src-ap2-schema-checkout, src-ap2-schema-open-payment | |
| Bubble: donated to FIDO in April 2026 and embedded in UCP | confirmed (embedding specified) | src-ap2-google-fido-blog, src-ap2-ucp-ext | Live UCP use unverified (2.1.9) |
| Announced 2025-09-16 with more than 60 organizations | confirmed | src-ap2-gcloud-launch | |
| Tags `v0.1.0` (2025-09-16) and `v0.2.0` (2026-04-28); Apache-2.0 | confirmed | src-ap2-gh-releases, src-ap2-repo | |
| Donated with Mastercard's Verifiable Intent on 2026-04-28 | confirmed | src-ap2-fido-pr | VI is "co-developed with Google" |
| FIDO formed an Agentic Authentication TWG (CVS Health, Google, OpenAI chairs) and a Payments WG (Mastercard, Visa) | corrected | src-ap2-fido-pr, src-ap2-fido-pwg-2025 | Only the Agentic Authentication TWG was new; the Payments WG launched 2025-04-29 (2.1.11). Vice-chairs: Amazon, Google, Okta |
| No FIDO deliverable has been published yet [verify] | confirmed (absence) | src-ap2-fido-pr, src-ap2-site | As of 2026-10-11; based on searched pages only |
| Repository idle since 2026-04-29 | confirmed for `main` | src-ap2-gh-commits, src-ap2-gh-issues-since | 107 community issues and PRs since, none merged |
| v0.1 roles | confirmed | src-ap2-spec-v01 | Named "User Agent (UA) or Shopping Agent (SA)", "Credentials Provider", "Remote or Merchant Endpoint" |
| v0.1 IntentMandate fields (natural language, merchants, SKUs, refundability, expiry, cart-confirmation flag) | confirmed | src-ap2-mandate-py-v01 | Exact names in Core objects |
| v0.1 CartMandate with W3C PaymentRequest plus merchant JWT carrying `cart_hash` | confirmed | src-ap2-mandate-py-v01 | Field `merchant_authorization` |
| v0.1 PaymentMandate user authorization is an SD-JWT-VC presentation with key binding and mandate hashes | confirmed | src-ap2-mandate-py-v01 | Field `user_authorization`; "for example" in the docstring |
| v0.2 roles; Trusted Surface non-agentic; validation in deterministic code | confirmed | src-ap2-spec-v02 | |
| Type identifiers `mandate.checkout.1`, `mandate.checkout.open.1`, `mandate.payment.1`, `mandate.payment.open.1` | confirmed | src-ap2-schema-checkout, src-ap2-schema-open-checkout, src-ap2-schema-payment, src-ap2-schema-open-payment | Schema descriptions omit the `.1` suffix |
| Closed Checkout Mandate carries `checkout_jwt` and `checkout_hash` | confirmed | src-ap2-schema-checkout | Plus `vct` (required), `iat`, `exp` |
| Closed Payment Mandate fields | corrected | src-ap2-schema-payment | Full list: `vct`, `transaction_id`, `payee`, `pisp`, `payment_amount`, `payment_instrument`, `execution_date`, `risk_data`, `iat`, `exp`; required: `vct`, `transaction_id`, `payee`, `payment_amount`, `payment_instrument` (2.3.4) |
| Open mandates add `constraints` and `cnf` | confirmed | src-ap2-schema-open-checkout, src-ap2-schema-open-payment | Both required; open checkout must contain `checkout.line_items`, open payment must contain `payment.reference` |
| Ten constraint keys | confirmed | src-ap2-schema-open-checkout, src-ap2-schema-open-payment | Exact strings as listed |
| Unrecognized constraint must cause failure | confirmed | src-ap2-agent-authorization | |
| SD-JWT VCs chained with Delegate SD-JWT draft; ES256 in examples | confirmed | src-ap2-agent-authorization, src-ap2-delegate-sd-jwt | Draft posted to IETF 2026-04-22 |
| Two delegation models (OpenID4VP `delegate`, DC API, EMVCo DPC example; or Trusted Agent Provider key the agent cannot reach) | confirmed | src-ap2-agent-authorization | |
| Human-present flow steps | confirmed | src-ap2-flows | |
| Human-not-present flow; `sd_hash`; no new mandate without a rejection receipt | confirmed | src-ap2-flows, src-ap2-spec-v02 | |
| Receipts and four error codes | confirmed | src-ap2-schema-receipts, src-ap2-agent-authorization | |
| a2a-x402 v0.2 standalone or embedded in AP2 mandates, statuses `payment-required` to `payment-completed` | confirmed with correction | src-ap2-a2a-x402-v02 | Embedding targets AP2 v0.1 `CartMandate` and `PaymentMandate` (2.3.2) |
| UCP embeds AP2 mandates | confirmed (specified) | src-ap2-ucp-ext | |
| 2025-09-16 launch with x402 extension (Coinbase, Ethereum Foundation, MetaMask) | confirmed | src-ap2-gcloud-launch | |
| 2025-10-30 new partners Tether, Solana, OKX | confirmed | src-ap2-gh-partners-history | Commit b43b072 (#103) |
| 2026-01-11 UCP launches with an AP2 extension | confirmed | src-ap2-ucp-ext, src-ap2-ucp-releases | UCP initial commit 2026-01-11 contains `docs/specification/ap2-mandates.md`; release `v2026-01-11` was published 2026-01-23 |
| 2026-04-28 v0.2 and FIDO donation | confirmed | src-ap2-gh-releases, src-ap2-google-fido-blog | |
| 2026-08-25 UCP references AP2 v0.2 | confirmed | src-ap2-ucp-ext | Commit 0b9d7c40, release v2026-08-25 |
| 2026-09-04 `draft-stone-vcap-ap2-binding-01` [verify] | confirmed | src-ap2-dt-vcap | Individual Informational draft; abstract uses v0.1 mandate names |
| Launch partners named; Visa absent | confirmed | src-ap2-gcloud-launch, src-ap2-partners-launch | |
| Old partners file had 125 entries before v0.2 removed it | confirmed | src-ap2-partners-final | 125 at 61f5de4 (2026-02-09) |
| Samples in Python, Go and Android | confirmed | src-ap2-repo | |
| Production use outside UCP is unverified | corrected | src-ap2-faq, src-ap2-pub-2608-23858, src-ap2-issue-345 | Unverified anywhere, including UCP (2.1.9); one self-report |
| VI "aligned field names" | corrected | src-ap2-vi-spec, src-ap2-schema-open-payment | Same `vct` values; aligned semantics, different constraint key prefixes (2.3.3) |
| Samples run over A2A | confirmed | src-ap2-repo | |
| AP2 repo does not reference ACP, SPTs, TAP or MPP | confirmed | src-ap2-repo | grep on e1ea56d |
| Threat model treats every LLM and agent as a potential attacker | confirmed | src-ap2-security | |
| No mandate revocation defined | confirmed | src-ap2-implementation | |
| v0.2 leaves step-up and liability to the networks | corrected | src-ap2-agent-authorization, src-ap2-spec-v01 | v0.2 specifies no step-up; `unresolved_constraint` fallback; only liability left to networks; v0.1 had 3DS2 and OTP (2.1.10) |
| 48 threats, 8 high (2608.23858); prompt injection (2601.22569); replay and context binding (2602.06345) | confirmed | src-ap2-pub-2608-23858, src-ap2-pub-2601-22569, src-ap2-pub-2602-06345 | |
| Issue 268 signature determinism inconsistency | confirmed | src-ap2-issue-268 | Open; author agreed |
| 2.2: v0.2 "relies on W3C VC 2.0 and DIDs" | corrected | src-ap2-agent-authorization | SD-JWT VC, OpenID4VP, DC API; VC 2.0 and DIDs are wider family only |
| 2.2 Scenario 3: AP2 mandate step in Gemini | per spec; live use unverified | src-ap2-ucp-ext | |
| 3.4: ERC-8226 as on-chain analogue | confirmed | src-ap2-erc8226 | Draft, created 2026-04-12, Brickken; no AP2 reference |
| Do not get wrong: no Intent or Cart in v0.2; not a rail; not A2A; FIDO governance | confirmed | src-ap2-schema-payment, src-ap2-spec-v02, src-ap2-fido-pr | |

## Blocked sources

- `https://fidoalliance.org/fido-alliance-to-develop-standards-for-trusted-ai-agent-interactions/`: curl HTTP 403; read with WebFetch instead (logged in `research/blocked.md`).
- Medium (Vishal Mysore tutorial) and Fireblocks blog returned 403 to `curl -I`; kept from Appendix A without re-reading.
- `https://deepwiki.com/google-agentic-commerce/AP2` returned 429; not used.

## Conflicts

Also appended to `research/conflicts.md`:

1. Step-up: normative docs (none) versus Executive Summary (3DS2 mention).
2. FIDO "Payments Working Group" (2025) versus "Payments Technical Working Group" (2026).
3. Checkout JWT signature rule: `specification.md` versus `security_and_privacy_considerations.md` (issue #268).
4. Mandate Receipt `result` versus schema `status` (issue #374).
5. `mandate.payment.reference` (security doc) versus `payment.reference` (schema).
6. `payment.amount_range` integer minor units versus decimal examples; `payment.budget` unit undefined.
7. "Ant International" (launch post) versus "Ant Group" (launch partners file).
8. RFC 9901 date: "February 2025" in AP2 versus November 2025 at the RFC Editor.

## Least certain

1. Whether FIDO's 2026 "Payments Technical Working Group" is the same body as the 2025 "Payments Working Group" under a new name (both co-chaired by Visa and Mastercard; no source states it).
2. That no FIDO deliverable on AP2 exists: FIDO working drafts are member-only, so absence is based on public pages only.
3. That no production deployment of AP2 mandates exists: the only evidence is absence in primary sources, a 2026-08 paper's statement, and one unverified self-report (issue #345).
