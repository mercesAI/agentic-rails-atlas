# Mastercard Agent Pay (`mastercard-agent-pay`): research dossier

Accessed 2026-10-11. Research agent output for ATLAS_PROMPT.md Section 5.8 with ATLAS_FOLLOWUP.md corrections 2.1.2, 2.2 (MDES), 2.3.3 and 2.3.6. Inline citations use `[src-...]` ids from `mastercard-agent-pay.sources.json`. Status: in progress; sections below are filled in order.

## Identity and governance

- **What it is.** Mastercard Agent Pay is a proprietary Mastercard program, not an open protocol. The launch release of 2025-04-29 calls it Mastercard's "Agentic Payments Program" and says it introduces Mastercard Agentic Tokens that build on Mastercard's existing tokenization (the same capabilities behind contactless, card-on-file and Payment Passkeys) [src-mcap-launch-2025].
- **Owner and governance.** Mastercard alone sets the program rules (agent registration, merchant registration through acquirers or PSPs, token issuance). No public specification, version number, change log or governance body exists for the program itself; implementation detail is published only as merchant-facing developer guides on developer.mastercard.com [src-mcap-dev-rails] [src-mcap-dev-level1].
- **Verifiable Intent (VI) is separate and open.** VI is an Apache-2.0 specification and Python reference SDK in the GitHub organization `agent-intent` (repository `agent-intent/verifiable-intent`, created 2026-03-05). The README says it is "Maintained by Mastercard; open to multi-stakeholder contribution" and its status is "Draft (v0.1)" [src-mcap-vi-readme] [src-mcap-vi-gh-repo]. The spec authors are listed as the "Verifiable Intent Working Group" [src-mcap-vi-spec].
- **Agent Pay is not AP2.** AP2 is Google's open protocol (donated to FIDO on 2026-04-28). Agent Pay is Mastercard's card-network program. The two meet only through VI, which Mastercard contributed to FIDO the same day and which reuses AP2 v0.2 mandate type strings (see Relations) [src-mcap-fido-pr].
- **"Agentic token" is a Mastercard term here.** At Mastercard it names a network token issued only to registered agents and tied to an agent interaction; Visa uses its own token products (VIC). The same words do not mean the same artifact across networks [src-mcap-launch-2025] [src-mcap-dev-level1].

(Further sub-brands, dates and partners follow under Versions and changelog.)

## Versions and changelog

Agent Pay has no version numbers. Its history is a sequence of program announcements, regional rollouts and sub-brands. Verifiable Intent (VI) is the only versioned artifact.

### Program timeline (announced, pilot, live)

| Date | Event | Status as stated by the source | Source |
|---|---|---|---|
| 2025-04-29 | Launch of the "Agentic Payments Program", Mastercard Agent Pay, introducing Mastercard Agentic Tokens. Named collaborators: Microsoft (Azure OpenAI Service, Copilot Studio), IBM (watsonx Orchestrate, B2B), Braintree and Checkout.com (acquirers and checkout players) | announced | [src-mcap-launch-2025] |
| 2025-04-29 | FIDO Alliance launches its Payments Working Group, co-chaired by Visa and Mastercard | standards work begins | [src-mcap-fido-pwg-2025] |
| 2025-07-22 | `mastercard/developers-agent-toolkit` repository created (npm packages first published 2025-07-24) | released (documentation tool) | [src-mcap-toolkit-gh] [src-mcap-npm-mcp] |
| 2025-09-10 | All US Mastercard cardholders to be enabled "by the holiday season"; Citi and U.S. Bank cardholders first; PayOS named as a provider going live; Agent Toolkit, Agent Sign-Up, Insight Tokens and Agentic Consulting Services announced; Stripe, Google and Ant International's Antom named | announced (US enablement plan) | [src-mcap-sep-2025] |
| 2025-10-01 | PayOS says it executed the first live agentic payment using a Mastercard Agentic Token | reported (PayOS release) | [src-mcap-payos-2025] |
| 2025-10 | Agent Pay Acceptance Framework launched (Mastercard's December 2025 release says "launched in October 2025"; exact day not confirmed because the mastercard.com story is blocked) | launched | [src-mcap-latam-2025] |
| 2025-10-16 | Initial Agent Pay documentation pages go live on Mastercard Developers "for early preview" | documentation preview | [src-mcap-dev-release-history] |
| 2025-10-24 | Cloudflare describes edge verification for Agent Pay and Visa TAP on Web Bot Auth | announced (partner) | [src-mcap-cloudflare-blog] |
| 2025-10-27 | Agent Pay to be integrated into PayPal's wallet; PayPal to pilot the Acceptance Framework | announced; pilot | [src-mcap-paypal-2025] |
| 2025-10-30 | On the Q3 2025 earnings call the CEO says the first agentic transaction took place on the network that quarter; U.S. Bank and Citi cardholders can use Agent Pay; remaining US issuers to be enabled in November | reported (call transcript) | [src-mcap-q3-transcript] [src-mcap-pymnts-q3] |
| 2025-12-03 | Agent Pay to launch across Latin America and the Caribbean from 2026; issuers enabled by February 2026; enabling partners Bemobi, Checkout.com, Davivienda, Evertec, Getnet, Inti, MagaluPay, Yuno | announced | [src-mcap-latam-2025] |
| 2026-01-28 | Australia's first authenticated agentic transactions: a CBA debit card (Event Cinemas tickets) and a Westpac credit card (Thredbo accommodation), processed through IPSI using Maincode's Matilda model | controlled trial (CBA calls it "early, controlled trials") | [src-mcap-australia-2026] |
| 2026-02-19 | VI CHANGELOG entry for 0.1.0 (spec documents dated 2026-02-18) | spec drafted | [src-mcap-vi-changelog] [src-mcap-vi-spec] |
| 2026-03-02 | Santander and Mastercard complete "Europe's first live end-to-end payment executed by an AI agent", in a controlled environment on Santander's live infrastructure, orchestrated by PayOS | pilot; "does not constitute a commercial rollout" | [src-mcap-santander-2026] |
| 2026-03-03 | Stripe extends Shared Payment Tokens (SPTs) to Mastercard Agent Pay and Visa Intelligent Commerce agentic network tokens | rolling out | [src-mcap-stripe-spt-2026] |
| 2026-03-05 | VI announced; repository `agent-intent/verifiable-intent` created and tag `v0.1.0` set on the initial commit; commitments reported from Google, Fiserv, IBM, Checkout.com, Basis Theory and Getnet; integration into Agent Pay intent APIs "expected in the coming months" | open draft spec | [src-mcap-vi-gh-repo] [src-mcap-vi-tag] [src-mcap-pymnts-vi] |
| 2026-03-17 | Korea's first live, authenticated agentic transaction (CardInfoLink agent books a hoppa ride from Incheon Airport) | live transaction (single use case) | [src-mcap-korea-2026] |
| 2026-03-24 | Live transactions in Latin America and the Caribbean by 17 issuers and processors, "performed in controlled environments" | controlled live transactions | [src-mcap-latam-2026] |
| 2026-04-18 to 2026-04-20 | VI PR #23 "BREAKING: Field alignment v2" merged (prefix rename, `cnf.jwk.kid`, `risk_data`, versioned VCTs); no new tag | spec change on `main` | [src-mcap-vi-pr23] |
| 2026-04-28 | Mastercard contributes VI to the FIDO Alliance alongside Google's AP2; the work goes to FIDO's Payments Technical Working Group; only the Agentic Authentication TWG was newly formed that day | contributed | [src-mcap-fido-pr] [src-mcap-google-fido-blog] |
| 2026-06-02 | "All Mastercard issuers in Europe are enabled at a network level for Agent Pay"; 36 named European banks completed controlled live transactions on Priceless.com with payOS | network enablement; controlled transactions | [src-mcap-europe-2026] |
| 2026-06-10 | Agent Pay for Machines (AP4M) launched for high-frequency, low-value machine payments with multi-rail settlement; 32 named initial participants and supporters | launched (service introduced; no availability dates given) | [src-mcap-ap4m-2026] |
| 2026-07-14 | x402 Foundation operational launch; Mastercard is a premier member | membership | [src-mcap-x402-lf-july] |
| 2026-09-01 | EMVCo publishes the draft "EMV Agentic Payments: Framework for Specifications" for comment until 2026-09-30, naming VI as an existing cryptographic solution | draft standard | [src-mcap-emvco-news] |
| 2026-09-30 | Agent Pay Trust Framework named (identity, intent, controls, execution, intelligence); a probability score for AI-initiated transactions rolls out "for testing in the U.S."; Skyfire named as KYA partner; Cloudflare named for privacy-preserving signal work | testing | [src-mcap-trust-2026] |

### Sub-brands and terms

| Name | What the primary source says | Source |
|---|---|---|
| Mastercard Agentic Tokens | Introduced at launch; build on existing Mastercard tokenization | [src-mcap-launch-2025] |
| Agent Pay Acceptance Framework | Requires agent registration and verification before transacting on the network; lets merchants recognize trusted agents and accept tokenized transactions "with minimal effort" | [src-mcap-latam-2025] [src-mcap-latam-2026] |
| Agent Pay for Machines (AP4M) | Credentialing, permissioning, transacting, settling; "guaranteed multi-rail settlement across cards, accounts and stablecoins" | [src-mcap-ap4m-2026] |
| Agent Pay Trust Framework | Brings together identity, intent, controls, execution and intelligence; the 2026-09-30 services are its intelligence layer | [src-mcap-trust-2026] |
| DTVC | A one-time code issued with a Mastercard Virtual Card Token; Mastercard's docs spell it both "Dynamic Token Validation Code" and "Dynamic Token Verification Code" | [src-mcap-dev-mvct] [src-mcap-dev-mvct-tests] |
| Intent API | Mastercard API that registers an agent-captured intent and returns an `intentId` with tokenized credentials | [src-mcap-dev-level3] [src-mcap-dev-testing] |
| Agent Suite (for Merchants) | Listed on Mastercard Developers as "Bring Agentic Commerce to Merchants through a single integration" | [src-mcap-dev-llms] [src-mcap-dev-rails] |

No "white paper" for the Trust Framework was found: the 2026-09-30 release names the framework but links no paper (seed item unconfirmed) [src-mcap-trust-2026].

### Verifiable Intent versions

| Version or ref | Date | What changed | Source |
|---|---|---|---|
| CHANGELOG `[0.1.0]` | 2026-02-19 | First entry: spec, Python SDK, Immediate and Autonomous modes, split L3, "Five constraint types" | [src-mcap-vi-changelog] |
| Spec header "0.1-draft" | 2026-02-18 | All four spec documents carry this version and date | [src-mcap-vi-spec] |
| Tag `v0.1.0` | 2026-03-05 | Points to commit `1dc3d41` "Initial commit: Verifiable Intent v0.1 specification and SDK"; no GitHub release object | [src-mcap-vi-tag] |
| `main` after PR #23 | 2026-04-20 | Constraint prefixes renamed (for example `payment.amount` became `mandate.payment.amount_range`; `payment.allowed_payee` became `mandate.payment.allowed_payees`; `mandate.checkout.allowed_merchant` became `mandate.checkout.allowed_merchants`); list fields normalized to `allowed`; `cnf.kid` moved to `cnf.jwk.kid`; frequency enum changed to ISO 20022 codes; `risk_data`, L2 `aud`/`kid`/`iss`, `.1` VCT suffixes, per-constraint policy and `match_mode` added. Still labeled 0.1 | [src-mcap-vi-pr23] [src-mcap-vi-v010-constraints] [src-mcap-vi-constraints] |

Version caveat: at tag `v0.1.0` the mandate VCTs were `mandate.checkout`, `mandate.payment`, `mandate.checkout.open` and `mandate.payment.open`, and the eight constraint types used mixed prefixes (`mandate.checkout.allowed_merchant`, `mandate.checkout.line_items`, `payment.allowed_payee`, `payment.amount`, `payment.budget`, `payment.recurrence`, `payment.agent_recurrence`, `payment.reference`) [src-mcap-vi-v010-constraints] [src-mcap-vi-v010-format]. The `.1`-suffixed VCTs and `mandate.`-prefixed keys quoted in this dossier come from `main` at commit `356c296` (2026-04-20). Both carry the label 0.1, and the CHANGELOG at `main` still says "Five constraint types" while `spec/constraints.md` registers eight [src-mcap-vi-changelog] [src-mcap-vi-constraints].

## Actors and roles

### Agent Pay program roles (Mastercard documents)

| Role | What it does in Agent Pay | Source |
|---|---|---|
| Consumer (cardholder) | Authenticates with the agent platform, authorizes purchases, sets permissions and limits; authentication with Mastercard Payment Passkeys is named in regional releases | [src-mcap-dev-level1] [src-mcap-latam-2026] |
| Agent platform or agent developer | Registers the agent and its public key with Mastercard, passes certification, requests agentic tokens, signs requests with Web Bot Auth, may register intent through the Intent API | [src-mcap-dev-level1] [src-mcap-dev-level3] |
| Issuer | Issues the card; enabled at network level for Agent Pay (all US issuers planned by November 2025, Latin American issuers by February 2026, all European issuers by 2026-06-02); makes the final authorization decision | [src-mcap-q3-transcript] [src-mcap-latam-2025] [src-mcap-europe-2026] |
| Mastercard (network) | Registers and verifies agents, keeps trusted agent lists and a key directory, issues agentic tokens, detokenizes, flags agent-initiated transactions, runs the Intent API and (from 2026-09-30) a probability score | [src-mcap-dev-rails] [src-mcap-dev-level1] [src-mcap-trust-2026] |
| Merchant | Registers through its acquirer or PSP, accepts tokens in existing forms (Level 1 and 2) or through APIs (Level 3), verifies agent signatures directly or at its CDN | [src-mcap-dev-rails] [src-mcap-dev-level1] |
| Acquirer, PSP or orchestrator | Handles merchant registration and acceptance (named examples: Braintree, Checkout.com, PayPal, Stripe, Getnet, Worldline, PayOS, IPSI) | [src-mcap-launch-2025] [src-mcap-paypal-2025] [src-mcap-stripe-spt-2026] [src-mcap-europe-2026] [src-mcap-australia-2026] |
| Edge or CDN provider | Verifies Web Bot Auth signatures on behalf of merchants (Cloudflare) | [src-mcap-cloudflare-blog] |
| KYA provider | Skyfire extends Know Your Agent into Agent Pay (2026-09-30) | [src-mcap-trust-2026] |

### Verifiable Intent roles (spec)

| Role | Trust level in the spec | Responsibilities | Source |
|---|---|---|---|
| Issuer | Trusted third party | Signs L1; a bank or "a payment network (Mastercard) acting on the bank's behalf"; publishes a JWKS endpoint | [src-mcap-vi-spec] |
| Credential Provider | Service provider | Hosts the wallet that stores L1 and where users build L2 | [src-mcap-vi-spec] |
| User | Root of authority | Signs L2 with the key bound in L1 `cnf.jwk` | [src-mcap-vi-spec] |
| Agent | Constrained delegate | Signs L3a and L3b with the key bound in L2 mandate `cnf.jwk` (Autonomous only) | [src-mcap-vi-spec] |
| Merchant | Verifier | Creates `checkout_jwt` (SHOULD be signed in v0.1) and verifies the checkout side | [src-mcap-vi-spec] [src-mcap-vi-format] |
| Payment Network | Verifier and arbiter | Verifies the chain as a pre-authorization step, enforces one L3 pair per mandate pair, tracks cumulative spend; the issuer still makes the final decision | [src-mcap-vi-spec] |

## Core objects with exact field names

Two kinds of objects exist. The Agent Pay program objects are described only in Mastercard's merchant-facing developer guides (no schema files are public). The VI objects come from the open spec at commit `356c296`; file paths are relative to `research/vendor/verifiable-intent/`.

### A. Agent Pay program objects (developer guides, no public schema)

**Web Bot Auth `Signature-Input` parameters as Mastercard documents them** [src-mcap-dev-level1]

| Field | Type | Required | Meaning | Source file |
|---|---|---|---|---|
| `keyid` | string | yes (verification step 2 lists it) | Identifies the agent's public key in the network key directory | Level 1 guide, "Understanding the Signature Headers" |
| `alg` | string | yes | Example values `ed25519`, `ecdsa-p256-sha256` | same |
| `created` | integer | yes | Signature creation time | same |
| `expires` | integer | yes | Signature expiry | same |
| `nonce` | string | yes | Replay protection; also binds body objects to the signature | same |
| `tag` | string | yes | Interaction type; Mastercard Agent Pay uses `Agent-pay-auth` (spelled `agent-pay-auth` in the same site's glossary); Visa uses `agent-browser-auth` and `agent-payer-auth`; generic agents such as ChatGPT use `web-bot-auth` | Level 1 guide; testing guide glossary [src-mcap-dev-testing] |
| `Signature-Agent` header | string | shown in the example | The example value is `"https://agentpay-key-directory.mastercard.com/"`; that host returned NXDOMAIN on 2026-10-11, so treat it as illustrative | Level 1 guide example request |

Covered components in the example: `"@authority" "@path"` [src-mcap-dev-level1].

**Agent User Identity object** (consumer recognition, request body) [src-mcap-dev-level2]

| Field | Type | Required | Meaning |
|---|---|---|---|
| `mastercardIdToken` | string (JWT) | not stated | Mastercard-issued JWT identifying the consumer; RFC 7519 and OIDC ID Token compatible, aligned with EMVCo Secure Remote Commerce |
| `signature` | string | not stated | Binds the identity to the message signature |
| `kid` | string | not stated | Matches the message signature key |
| `nonce` | string | not stated | Same nonce as the message signature |
| `alg` | string | not stated | For example `PS256`, `ES256` |

**Payment Data object** (request body) [src-mcap-dev-level2]

| Field | Type | Required | Meaning |
|---|---|---|---|
| `paymentData` | varies | not stated | Level 1 and 2 form fill: a hash of the tokenized payment data typed into the form; Level 3: a hash of credentials submitted |
| `signature` | string | not stated | Made with the same private key as the HTTP message signature |
| `kid` | string | not stated | Matches the message signature `keyid` |
| `nonce` | string | not stated | Matches the message signature nonce |
| `alg` | string | not stated | For example `PS256`, `ES256` |

For Level 3 direct payments the guide says the Mastercard payload is a tokenized payload "containing DSRP cryptogram and card metadata" (Digital Secure Remote Payment) [src-mcap-dev-level3].

**Intent API objects** (key elements only; Mastercard points to the Acceptance Framework for the full spec, which is not public) [src-mcap-dev-level3]

| Object | Fields named in the guide |
|---|---|
| Intent | `intentId` (Mastercard-generated), `intentSummary` (agent-generated text), `intentStatus` (validation requires `ACTIVE`), `orders`, `consumer`, `digitalAccountCredentials` (tokenized credentials) |
| Order | `orderId`, `orderExecutionType` (`IMMEDIATE` or `DEFERRED`), `orderStatus`, `orderExpiry` (UTC epoch seconds), `orderTotalAmount`, `items`, `merchants`, `orderDeliveryDetails` |
| Item | `itemId`, `itemName`, `itemDescription`, `itemUnitPrice`, `itemQuantity`, `itemDeliveryMethod`, `itemUrl`, `itemImageUrl`, `itemMetadata` |
| Merchant | `srcDpaId` (Mastercard-generated merchant identifier), `merchantName`, `merchantUrl`, `merchantLogoUrl` |

**Virtual Card Token checkout response** (guest checkout path) [src-mcap-dev-mvct] [src-mcap-dev-mvct-pay]: a virtual card token (static token number), token expiration date and a newly generated one-time DTVC, which the integrator places in standard card fields; Mastercard validates the DTVC and tells the issuer in the authorization request whether DTVC validation was performed.

### B. Verifiable Intent credential layers

**Layer overview** (`spec/credential-format.md` section 2) [src-mcap-vi-format]

| Layer | `typ` | Signed by | Lifetime (recommended, maximum) |
|---|---|---|---|
| L1 | `sd+jwt` | Issuer | about 1 year; SHOULD NOT exceed 1 year |
| L2 Immediate | `kb-sd-jwt` | User key from L1 `cnf.jwk` | about 15 minutes; 15 minutes |
| L2 Autonomous | `kb-sd-jwt+kb` | User key from L1 `cnf.jwk` | 24 hours to 30 days (30 days RECOMMENDED default for consumers); MUST NOT exceed L1 `exp` |
| L3a (payment, to network) | `kb-sd-jwt` | Agent key from L2 mandate `cnf.jwk` | 5 minutes recommended; MUST NOT exceed 1 hour |
| L3b (checkout, to merchant) | `kb-sd-jwt` | Agent key from L2 mandate `cnf.jwk` | 5 minutes recommended; MUST NOT exceed 1 hour |

**L1 header and payload** (`spec/credential-format.md` sections 3.2 to 3.4) [src-mcap-vi-format]

| Field | Type | Required | Meaning |
|---|---|---|---|
| header `alg` | string | REQUIRED | MUST be `ES256` |
| header `typ` | string | REQUIRED | MUST be `sd+jwt` |
| header `kid` | string | REQUIRED | Issuer key id in its JWKS |
| `iss` | string | REQUIRED | Issuer URI |
| `sub` | string | REQUIRED | Opaque stable user id |
| `iat`, `exp` | integer | REQUIRED | Unix times; `exp` SHOULD be at most 1 year after `iat` |
| `vct` | string | REQUIRED | Credential type URI, always visible; the Mastercard reference profile MUST use `https://credentials.mastercard.com/card` |
| `cnf` | object | REQUIRED | `cnf.jwk` holds the user's public key (RFC 7800) |
| `pan_last_four` | string | REQUIRED (Mastercard profile) | Last four PAN digits, always visible |
| `scheme` | string | REQUIRED (Mastercard profile) | For example `mastercard`, `visa` |
| `card_id` | string | OPTIONAL | Opaque card-level id |
| `_sd_alg` | string | REQUIRED | MUST be `sha-256` |
| `_sd` | array | REQUIRED | Disclosure digests |
| `email` | string | OPTIONAL, selectively disclosable | User email |

**L2 header and always-visible payload** (sections 4.2 and 4.3) [src-mcap-vi-format]

| Field | Type | Required | Meaning |
|---|---|---|---|
| header `alg` | string | REQUIRED | `ES256` |
| header `typ` | string | REQUIRED | `kb-sd-jwt` (Immediate) or `kb-sd-jwt+kb` (Autonomous) |
| header `kid` | string | OPTIONAL | References the user device key in L1 `cnf.jwk` |
| `nonce` | string | REQUIRED | Random nonce |
| `aud` | string | REQUIRED | In L2 the agent (typically the agent platform URL) |
| `iss` | string | OPTIONAL | Signer of L2 (wallet or user agent), a URI |
| `iat`, `exp` | integer | REQUIRED | See lifetimes |
| `sd_hash` | string | REQUIRED | `B64U(SHA-256(ASCII(serialized_L1)))` |
| `delegate_payload` | array | REQUIRED | `{"...": "<hash>"}` references to the mandate disclosures |
| `_sd_alg`, `_sd` | string, array | REQUIRED | `sha-256`; digests |
| `prompt_summary` | string | OPTIONAL, selectively disclosable (Autonomous) | Human-readable intent |

**Mandates** (sections 4.4, 4.5, 5.5, 5.6, 10) [src-mcap-vi-format]

| Mandate | `vct` | Fields (required unless noted) | Used in |
|---|---|---|---|
| Checkout, final | `mandate.checkout.1` | `vct`, `checkout_jwt`, `checkout_hash`; L3b adds optional `line_items`, `prompt_summary`; MUST NOT contain `cnf` or `constraints` | L2 Immediate, L3b |
| Payment, final | `mandate.payment.1` | `vct`, `payment_instrument`, `payment_amount` (`currency` ISO 4217, `amount` integer minor units), `payee`, `transaction_id`; L3a adds optional `selected_merchant`; MUST NOT contain `cnf` or `constraints` | L2 Immediate, L3a |
| Checkout, open | `mandate.checkout.open.1` | `vct`, `cnf` (`cnf.jwk` with `kid`), `constraints` (at least one), optional `prompt_summary` | L2 Autonomous |
| Payment, open | `mandate.payment.open.1` | `vct`, `cnf`, `payment_instrument`, `constraints` (at least one, including `mandate.payment.reference`), optional `risk_data` (`device_id`, `ip_address`; never copied into L3) | L2 Autonomous |

Sub-objects: `payment_instrument` has `type` (example `mastercard.srcDigitalCard`), `id` (example: a token UUID) and optional `description`; `payee` has optional `id` and required `name` and `website` [src-mcap-vi-format].

**L3 header and payload** (sections 5.2 and 5.3): header `alg` `ES256`, `typ` `kb-sd-jwt`, `kid` matching L2 `cnf.jwk.kid` (a `jwk` header is forbidden); payload `nonce` (distinct from L2), `aud` (L3a: network; L3b: merchant), `iat`, `exp`, `sd_hash` (selective: L3a over L2 base plus payment and merchant disclosures; L3b over L2 base plus checkout and item disclosures), `delegate_payload`, `_sd_alg`, `_sd`; no `cnf` [src-mcap-vi-format].

**Hash bindings** (sections 6.1, 6.2, 4.5.3) [src-mcap-vi-format]

| Value | Formula | Where |
|---|---|---|
| `sd_hash` (L2) | `B64U(SHA-256(ASCII(serialized_L1)))` | L2 payload |
| `checkout_hash` | `B64U(SHA-256(ASCII(checkout_jwt)))` | checkout mandate; equals `transaction_id` on the payment mandate; L3a `transaction_id` MUST equal L3b `checkout_hash` |
| `conditional_transaction_id` | `B64U(SHA-256(ASCII(checkout_disclosure_b64)))` | inside `mandate.payment.reference` in L2 Autonomous; binds the payment mandate to the checkout mandate before any checkout JWT exists |

### C. VI constraint types (`spec/constraints.md` section 4, eight registered types) [src-mcap-vi-constraints]

| Type string | Fields | Checked by | Notes |
|---|---|---|---|
| `mandate.checkout.allowed_merchants` | `allowed` (merchant objects with optional `id`, required `name`, `website`, or disclosure refs) | merchant or verifier with the checkout | Needs a merchant `id` inside `checkout_jwt` to be enforceable |
| `mandate.checkout.line_items` | `items` (each `id`, `acceptable_items` of `{id, title}`, `quantity`), optional `match_mode` (`minimum` default, `exact`) | merchant side | Empty `acceptable_items` means any item |
| `mandate.payment.allowed_payees` | `allowed` (payee objects) | network | Exact matching only |
| `mandate.payment.amount_range` | `currency`, optional `min`, optional `max` (integer minor units) | network | Per transaction |
| `mandate.payment.budget` | `currency`, optional `min`, required `max` | network (stateful) | Cumulative cap |
| `mandate.payment.recurrence` | `frequency` (ISO 20022 codes such as `MNTH`), `start_date`, RECOMMENDED `end_date`, `number` | network (stateful) | Merchant-managed subscription setup; later charges happen outside VI |
| `mandate.payment.agent_recurrence` | `frequency` (`ON_DEMAND` or ISO 20022 code), `start_date`, `end_date` (required), RECOMMENDED `max_occurrences` | network (stateful) | Requires companion `mandate.payment.amount_range` and `mandate.payment.budget` |
| `mandate.payment.reference` | `conditional_transaction_id` | chain verifier (not the constraint checker) | Mandatory in every Autonomous payment mandate |

Strictness: PERMISSIVE (default, skips unknown types) and STRICT; verifiers MUST still reject open mandates containing unknown types; a per-type policy map may override the mode [src-mcap-vi-constraints].

Optional extension claim: `agent_attestation` with `type` and `value`; unknown types MUST be ignored; no scheme is defined yet [src-mcap-vi-spec].

## Message flows

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
