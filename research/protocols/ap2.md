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
