# Mastercard Agent Pay (`mastercard-agent-pay`): research dossier

Accessed 2026-10-11. Research agent output for ATLAS_PROMPT.md Section 5.8 with ATLAS_FOLLOWUP.md corrections 2.1.2, 2.2 (MDES), 2.3.3 and 2.3.6. Inline citations use `[src-...]` ids from `mastercard-agent-pay.sources.json`. Status: complete as of 2026-10-11 (all sections filled).

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

Flows 1 to 5 come from Mastercard's merchant-facing developer guides, which describe behavior but publish no wire schema. Flows 6 and 7 come from the VI spec. Mastercard says VI will be embedded in Agent Pay's intent APIs, but no public document shows the VI chain inside a live Agent Pay authorization (see Least certain).

### Flow 1: agent registration and certification

1. The agent developer creates a key pair and registers the public key in the Mastercard Agent Pay key directory during onboarding [src-mcap-dev-level1].
2. Mastercard runs a security review and certification: the agent must authenticate consumers properly, use tokenized credentials and never store raw card data, capture consumer intent accurately and follow privacy rules [src-mcap-dev-level1] [src-mcap-dev-rails].
3. Certified agents are added to trusted agent lists maintained by the network; merchants check these lists through Web Bot Auth verification [src-mcap-dev-rails].
4. Merchants register for Agent Pay through their acquirer or PSP [src-mcap-dev-rails].
Failure: an unregistered agent cannot transact on the network ("Only registered agents can transact through the network") [src-mcap-dev-rails]; the September 2025 "Agent Sign-Up" is the developer entry point named for toolkit users [src-mcap-sep-2025].

### Flow 2: token provisioning (agentic token)

1. The consumer authenticates with the agent platform and authorizes it to buy on their behalf; regional releases name Mastercard Payment Passkeys for authentication [src-mcap-dev-level1] [src-mcap-latam-2026].
2. The platform requests a token from the network; the token contains no card data and "may be single-use, merchant-specific, or time-limited" [src-mcap-dev-level1].
3. Agents may not use cards already on file at the merchant, because without an agentic token the network cannot identify the flow as agentic [src-mcap-dev-level1].
Via Stripe: when a customer authorizes an agent, Stripe provisions an agentic network token from Mastercard scoped to the customer's intent and shares it with the agent as a Shared Payment Token; the network maps it to the latest funding PAN at authorization and adds agent information to the authorization message [src-mcap-stripe-spt-2026].

### Flow 3: Level 1 purchase through existing checkout forms, with edge verification

1. The agent requests a page and signs it with RFC 9421 HTTP Message Signatures: headers `Signature-Input` and `Signature`, with `tag="Agent-pay-auth"`, `keyid`, `created`, `expires`, `nonce`, `alg` [src-mcap-dev-level1].
2. The CDN (Cloudflare) or the merchant backend checks: both headers present; fetch the key for `keyid` from the directory; `created` and `expires` bracket the current time; the nonce is unused; the tag is valid; rebuild the signature base; verify the Ed25519 signature [src-mcap-cloudflare-blog] [src-mcap-dev-level1].
3. The agent fills the standard card form with the token; "the token looks like a standard card number" to the merchant [src-mcap-dev-level1].
4. The merchant's processor submits the authorization; the network detokenizes and routes to the issuer [src-mcap-dev-level1].
Failures (merchant decision table): no `Signature-Input` with a scheme tag, apply the non-agent bot policy; a required field missing, block; key not found in the directory, block [src-mcap-dev-level1].

### Flow 4: guest checkout with a Virtual Card Token and DTVC

1. The integrator (for example an agent platform) requests a checkout for a merchant web domain; after user validation and consent it requests a one-time DTVC [src-mcap-dev-mvct].
2. Mastercard returns the virtual card token, its expiry and a new DTVC [src-mcap-dev-mvct-pay].
3. The agent types these into the card number, expiry and security code fields [src-mcap-dev-mvct].
4. On authorization Mastercard processes the token, validates the DTVC and tells the issuer whether DTVC validation was performed; the issuer approves or declines [src-mcap-dev-mvct-pay].

### Flow 5: Level 2 and Level 3 enrichment

1. Level 2: the request body carries an Agent User Identity object (`mastercardIdToken` plus `signature`, `kid`, `nonce`, `alg`) and a Payment Data object; both are signed with the same private key as the HTTP message signature and carry the same nonce, so the merchant can bind the body to the verified request and compare the form data hash with `paymentData` [src-mcap-dev-level2].
2. Level 3: the agent captures intent; Mastercard's Intent API validates and stores it and returns an `intentId` with tokenized credentials; at checkout the agent sends the intent; the merchant checks intent signature, `intentStatus` `ACTIVE`, expiry and `srcDpaId`, then compares totals, SKUs, quantities and delivery details [src-mcap-dev-level3].
Failures: reject if the checkout total exceeds `orderTotalAmount` or the merchant id differs; flag for review on SKU, quantity or address mismatches; for deferred orders, require the agent to get explicit consumer confirmation [src-mcap-dev-level3]. Mastercard labels intent exchange between agent and merchant "future facing" [src-mcap-dev-rails].

### Flow 6: VI Immediate mode (2 layers, user present)

1. Enrollment: the user registers a public key with the Credential Provider; the Issuer signs L1 (`sd+jwt`) binding it in `cnf.jwk` [src-mcap-vi-spec].
2. The agent builds a cart and creates `checkout_jwt` (SHOULD be merchant-signed; implementation-defined in v0.1) [src-mcap-vi-spec] [src-mcap-vi-format].
3. The user reviews and signs L2 (`kb-sd-jwt`) with a `mandate.checkout.1` (with `checkout_hash`) and a `mandate.payment.1` (with `transaction_id` equal to the same hash); no `cnf` in mandates [src-mcap-vi-spec].
4. The agent forwards L1 plus L2; checkout disclosed to the merchant, payment disclosed to the network [src-mcap-vi-spec].
5. The merchant verifies the L1 signature (Issuer JWKS), L2 signature (L1 `cnf.jwk`), `sd_hash`, catalog match and recomputed hash; the network verifies the chain and the `transaction_id` binding and authorizes [src-mcap-vi-spec].

### Flow 7: VI Autonomous mode (3 layers, agent delegated)

1. The user signs L2 (`kb-sd-jwt+kb`) with `mandate.checkout.open.1` and `mandate.payment.open.1`, both carrying the identical agent `cnf.jwk` (with `kid`) and constraints; the payment mandate includes `mandate.payment.reference` [src-mcap-vi-format].
2. The agent shops, obtains `checkout_jwt`, and signs two L3 credentials: L3a (`mandate.payment.1` with `transaction_id`, plus the selected merchant disclosure; `aud` = network) and L3b (`mandate.checkout.1` with `checkout_hash` and `line_items`; `aud` = merchant) [src-mcap-vi-spec].
3. The merchant verifies L3b (key resolved from L2 by `kid`, `typ`, selective `sd_hash`, checkout constraints) [src-mcap-vi-spec].
4. The network verifies L3a, checks payment constraints, enforces one L3 pair per mandate pair (or the occurrence and budget counters when `mandate.payment.agent_recurrence` is present) and records the spend [src-mcap-vi-security].
5. The network "returns assurance data" and the issuer makes the final decision [src-mcap-vi-spec].
Failures named in the spec: signature or `typ` mismatch, `exp` passed (300 second skew recommended), L3 containing `cnf`, a self-asserted `jwk` header, `cnf.jwk` differing between mandates (split-agent attack), orphaned or duplicate mandates, hash mismatch, and constraint violations such as "Amount exceeded", "Budget exceeded", "Merchant not in allowed list", "Payee not in allowed list", "Maximum occurrences exceeded" [src-mcap-vi-format] [src-mcap-vi-constraints] [src-mcap-vi-security].

### Flow 8: Agent Pay for Machines

Mastercard describes four capabilities (credentialing with VI, permissioning with programmatic spending limits, transacting, and multi-rail settlement across cards, accounts and stablecoins) but publishes no message flow, API or settlement schedule [src-mcap-ap4m-2026].

## State machines

| Machine | States documented | Transitions documented | Gaps | Source |
|---|---|---|---|---|
| Agent onboarding | registered, security reviewed, certified, on trusted agent list | registration, review, certification | Suspension, delisting and key rotation are not documented publicly | [src-mcap-dev-rails] [src-mcap-dev-level1] |
| Agentic token | provisioned (scoped single-use, merchant-specific or time-limited), used | provisioning by the platform, use at checkout, detokenization by the network | No public lifecycle API, suspend or delete states for agentic tokens; MDES is not named by any Mastercard page read (correction 2.2) | [src-mcap-dev-level1] |
| Intent (Intent API) | `intentStatus` is "dynamically updated"; only `ACTIVE` is named | register, validate at checkout | Other status values are not published | [src-mcap-dev-level3] |
| Order | `orderExecutionType` `IMMEDIATE` or `DEFERRED`; `orderStatus` values not published; `orderExpiry` | expiry | Status enum not published | [src-mcap-dev-level3] |
| VI credential lifecycle | enrollment, L1 issuance, L2 Immediate or L2 Autonomous, L3 creation (Autonomous), presentation, verification, settlement | numbered steps 1 to 7 | No revocation step in v0.1 | [src-mcap-vi-spec] [src-mcap-vi-security] |
| VI mandate pair (network state) | unfulfilled, fulfilled (base model); with `mandate.payment.agent_recurrence`: counters `occurrence_count` and `cumulative_spent` until `max_occurrences`, `budget.max` or `end_date` | record each authorized L3a | The spec says networks MUST hold this state but defines no API for it | [src-mcap-vi-constraints] [src-mcap-vi-security] |
| VI autonomous mandate expiry | valid until L2 `exp`; when it expires before fulfillment the implementation SHOULD prompt the user to re-authorize | expiry | | [src-mcap-vi-format] |
| Trust Framework probability score | testing in the US (2026-09-30) | | Score range, thresholds and message fields not published | [src-mcap-trust-2026] |

## Transports

- **Agent to merchant web traffic:** ordinary HTTPS requests carrying RFC 9421 `Signature-Input` and `Signature` headers (Web Bot Auth pattern); verification can happen at the CDN or in the merchant backend [src-mcap-dev-level1] [src-mcap-cloudflare-blog] [src-mcap-rfc9421].
- **Card data at Level 1 and 2:** existing HTML checkout forms; tokens are typed into card number, expiry and security code fields [src-mcap-dev-level1] [src-mcap-dev-mvct].
- **Level 3:** merchant agentic API endpoints that receive tokens and intent objects in the request body; Mastercard gives no endpoint paths [src-mcap-dev-level3].
- **Network:** standard card authorization messages through acquirer, network and issuer; the network adds agent information for issuers (stated by Stripe for agentic network tokens; Mastercard says transactions are recognizable to all parties) [src-mcap-stripe-spt-2026] [src-mcap-launch-2025]. No public field or data element name for the agent flag was found.
- **Via other protocols:** Stripe SPTs (usable under OpenAI's ACP and Stripe's own flows) and PayPal's wallet [src-mcap-stripe-spt-2026] [src-mcap-paypal-2025].
- **VI:** transport-agnostic by design; "Transport protocols" are out of scope, and SD-JWT compact form is chosen partly because it fits in HTTP headers and payment message fields [src-mcap-vi-readme] [src-mcap-vi-rationale]. VI suggests carriage through UCP's AP2 mandate fields and ACP extensions but defines no binding [src-mcap-vi-landscape].
- **Developer tooling:** the Mastercard Developers MCP server runs over stdio (`npx -y @mastercard/developers-mcp`) or as a remote server, and reads `llms.txt` files from developer.mastercard.com; it is a documentation tool, not a payment transport [src-mcap-toolkit-readme] [src-mcap-toolkit-api] [src-mcap-dev-toolkit-doc].

## Cryptography and standards used

| Standard | Use | Source |
|---|---|---|
| Network tokenization (Mastercard) | Agentic Tokens "build upon proven tokenization capabilities"; Mastercard pages read say "tokenization", not MDES | [src-mcap-launch-2025] [src-mcap-latam-2025] |
| DSRP cryptogram | Named for Level 3 Mastercard payloads | [src-mcap-dev-level3] |
| DTVC | One-time security code with Virtual Card Tokens | [src-mcap-dev-mvct] |
| Mastercard Payment Passkeys (FIDO) | Consumer authentication in regional live transactions | [src-mcap-latam-2026] [src-mcap-europe-2026] |
| RFC 9421 HTTP Message Signatures (February 2024) | Agent request signing; Ed25519 in examples; `ecdsa-p256-sha256` also listed | [src-mcap-rfc9421] [src-mcap-dev-level1] |
| JWT (RFC 7519), OIDC ID Token | `mastercardIdToken` | [src-mcap-dev-level2] |
| SD-JWT (RFC 9901, November 2025) | VI credential format for every layer | [src-mcap-vi-spec] [src-mcap-rfc9901] |
| JWS, JWK, JWA (RFC 7515 to 7518) | Signatures and keys | [src-mcap-vi-spec] |
| RFC 7800 `cnf` | Key binding from L1 to L2 to L3 | [src-mcap-vi-spec] [src-mcap-rfc7800] |
| ES256 (P-256, SHA-256) | The only VI signing algorithm; EdDSA planned as optional later | [src-mcap-vi-spec] [src-mcap-vi-rationale] |
| SHA-256 | `sd_hash`, `checkout_hash`, `conditional_transaction_id`, `_sd_alg` `sha-256` | [src-mcap-vi-format] |
| ISO 4217, ISO 20022 | Amount minor units; recurrence frequency codes | [src-mcap-vi-constraints] |

VI uses no novel cryptography ("Built on SD-JWT, JWS, JWK, and RFC 7800") [src-mcap-vi-readme]. The design rationale says VI credentials are not WebAuthn credentials, although the same P-256 hardware can hold both [src-mcap-vi-rationale].

## Security model and published attacks or CVEs

**Program level.** Mastercard's security claims are that only registered and verified agents transact, card numbers never reach agents, tokens can be single-use or scoped, agent traffic is signed and nonce-protected, consumers authenticate with passkeys, and every party can see that an agent was involved [src-mcap-launch-2025] [src-mcap-dev-level1] [src-mcap-latam-2026]. The 2026-09-30 probability score exists to estimate "the likelihood that a transaction was initiated by an AI agent", which implies that agent involvement is not always reliably marked in today's authorization traffic [src-mcap-trust-2026]. No security audit, bug bounty scope, CVE or published attack specific to Agent Pay was found as of 2026-10-11.

**VI threat model** (`spec/security-model.md`) [src-mcap-vi-security]

| Attack | Defense in the spec |
|---|---|
| Credential replay | `nonce`, `aud`, short L3 lifetime; verifiers track seen nonces |
| Cross-merchant replay and budget overrun | Stateful network tracking per L2 mandate pair (lookup by `sd_hash`); cannot be done cryptographically |
| Constraint stripping | L2 signature covers all constraints |
| Checkout-payment mismatch | `checkout_hash` and `transaction_id` binding |
| Algorithm confusion (`none`, `HS256`) | ES256 only; reject other `alg` values |
| Clock skew abuse | 300 second skew recommended; 60 seconds suggested for high security |
| Disclosure withholding | `delegate_payload` reveals that mandates exist |
| Type confusion | identify mandates by `vct`, check `typ` per layer |
| Split-agent attack | `cnf.jwk` must be identical across a mandate pair |

**Known limitations stated by VI itself:** no credential revocation protocol in v0.1 (JWKS key removal and short lifetimes are the interim tools; RFC 9701 Token Status Lists are named as a future option); `sub` is always visible and links transactions for about a year; a constrained agent can still leak intent through side channels; open-ended `mandate.payment.recurrence`; PERMISSIVE default mode; `checkout_jwt` format and signing are implementation-defined; the reference implementation uses fixed deterministic keys suitable only for testing [src-mcap-vi-security].

**Published issues against VI (third party, open on 2026-10-11):**
- Issue #29 (2026-07-17): the L2 format lists each mandate digest in both `_sd` and `delegate_payload`; RFC 9901 says "The same digest value MUST NOT appear more than once in the SD-JWT" and verifiers must reject such credentials; the reporter says `@sd-jwt/core` 0.20.0 rejects every VI L2 credential. The duplicate listing is visible in the spec's own section 11 examples [src-mcap-vi-issue29] [src-mcap-rfc9901] [src-mcap-vi-format]. No maintainer response or fix as of 2026-10-11.
- Issues #12 to #17 (2026-03-27, filed by users labeling them "Ant") ask about trust model, keys, chargeback liability and intent revocation; issue #15 carries an inline answer signed "[CY]" saying the merchant is liable after verifying L3 against L2 and that liability shift work for the Acceptance Framework is ongoing; the responder's affiliation is not stated [src-mcap-vi-issue15] [src-mcap-vi-issues].

**Academic analysis:** no paper analyzes Agent Pay or VI directly. arXiv 2609.00060 (2026-08-30) models x402, MPP, ACP and AP2 in Tamarin, not Agent Pay. arXiv 2609.27452 (2026-09-23), "Issuer-Sovereign Agentic Payments", is the closest topical paper (see Publications).

## Controls

Support values follow `ControlSupport` in `src/lib/schemas.ts` (`native`, `partial`, `external`, `none`). "Program" means Agent Pay as Mastercard describes it; "VI" means the open spec.

| Control id | Support | Mechanism | Sources |
|---|---|---|---|
| `agent-identity-verification` | native | Registered agents sign requests (RFC 9421, `tag` `Agent-pay-auth`) verified against the Mastercard key directory, at the CDN or merchant | [src-mcap-dev-level1] [src-mcap-cloudflare-blog] |
| `agent-registration-kya` | native | Registration, security review, certification and trusted agent lists; Skyfire KYA added 2026-09-30 | [src-mcap-dev-rails] [src-mcap-trust-2026] |
| `user-consent-capture` | native | Consumer authorizes the agent; passkey authentication in live pilots; VI L2 signed by the user's key | [src-mcap-dev-level1] [src-mcap-latam-2026] [src-mcap-vi-spec] |
| `spending-caps` | native | Program: tokens "can be limited by merchant, amount, or time window"; VI: `mandate.payment.amount_range`, `mandate.payment.budget` | [src-mcap-dev-level1] [src-mcap-vi-constraints] |
| `merchant-payee-scoping` | native | Merchant-specific tokens; VI `mandate.checkout.allowed_merchants`, `mandate.payment.allowed_payees`; Intent API `srcDpaId` check | [src-mcap-dev-level1] [src-mcap-vi-constraints] [src-mcap-dev-level3] |
| `time-windows-expiry` | native | Time-limited tokens, signature `created`/`expires`, `orderExpiry`, VI layer lifetimes (L3 at most 1 hour) | [src-mcap-dev-level1] [src-mcap-dev-level3] [src-mcap-vi-format] |
| `revocation` | partial | Program: no public revocation API for agentic tokens or agents; VI v0.1 has no revocation protocol (JWKS key removal and expiry only) | [src-mcap-vi-security] |
| `step-up-authentication` | partial | Passkeys at consent; Level 3 guide suggests escalating deferred orders to the consumer; Mastercard says networks and EMVCo are still working on 3DS support for agentic flows | [src-mcap-latam-2026] [src-mcap-dev-level3] [src-mcap-dev-level1] |
| `replay-protection` | native | Mandatory `nonce` and short expiry on signatures; single-use tokens and DTVC; VI `nonce`, `aud`, one L3 pair per mandate pair | [src-mcap-dev-level1] [src-mcap-dev-mvct] [src-mcap-vi-security] |
| `receipts-evidence` | partial | VI full-chain verification gives a dispute evidence package; Intent records "as evidence when handling chargebacks"; no receipt object in the program | [src-mcap-vi-security] [src-mcap-dev-level3] |
| `dispute-support` | partial | Launch release promises "a process to help clarify agentic transactions that may be unfamiliar or unrecognized"; standard chargeback rights apply; no agent-specific reason codes or liability shift published; VI leaves dispute choreography out of scope | [src-mcap-launch-2025] [src-mcap-dev-level1] [src-mcap-vi-security] |
| `reputation` | none | No public agent reputation score; the probability score rates transactions, not agents | [src-mcap-trust-2026] |
| `monitoring-signals` | native | Agent-flagged transactions visible to issuers; probability score and risk signals in US testing from 2026-09-30; VI `risk_data` (`device_id`, `ip_address`) at consent | [src-mcap-launch-2025] [src-mcap-trust-2026] [src-mcap-vi-format] |
| `kill-switch` | external | Issuers keep card-level blocks and declines; no documented control to disable one agent across the network | [src-mcap-vi-security] [src-mcap-vi-spec] |

## Observability

**Public:**
- Press releases and newsroom pages with milestone counts (names of banks and partners, never transaction volumes) [src-mcap-europe-2026] [src-mcap-latam-2026] [src-mcap-ap4m-2026].
- VI repository activity: GitHub API (`/repos/agent-intent/verifiable-intent`), 97 stars, 20 forks, 41 issues and pull requests, last merge 2026-04-20 (as of 2026-10-11) [src-mcap-vi-gh-repo] [src-mcap-vi-issues].
- Mastercard Developers `llms.txt` index and Checkout Solutions release history [src-mcap-dev-llms] [src-mcap-dev-release-history].
- npm download counts for `@mastercard/developers-mcp` and `@mastercard/developers-agent-toolkit` (documentation tools only) [src-mcap-npm-mcp] [src-mcap-npm-toolkit].
- `.well-known` paths: Mastercard's guide points verifiers to `/.well-known/http-message-signatures-directory` on the `Signature-Agent` host, in its ChatGPT example; the Mastercard example host `agentpay-key-directory.mastercard.com` did not resolve on 2026-10-11, and Cloudflare's blog names no Mastercard directory URL. The live Mastercard directory location is therefore unknown [src-mcap-dev-level1] [src-mcap-cloudflare-blog].
- VI issuer JWKS endpoints are required by the spec, but no public Mastercard JWKS URL for VI was found [src-mcap-vi-spec].

**Private (not observable from outside):** agent registry contents, agentic token issuance counts, authorization message fields that mark agent transactions, probability scores, Intent API records, dispute data. There are no explorers or indexers, because nothing is on a public ledger. AP4M settlement on stablecoin rails is described but no chain addresses or contracts are published [src-mcap-ap4m-2026].

**Event names:** none published. The developer guides name object fields but no webhook or event types for Agent Pay.

## Compliance touchpoints

- **PCI DSS.** Mastercard says merchants receive only tokens, so "PCI scope remains unchanged" [src-mcap-dev-level1].
- **PSD2 and SCA (EU).** VI's design rationale presents its amount and payee constraints plus `checkout_hash` as a cryptographic form of dynamic linking, while saying VI "does not replace SCA"; the README says regulatory references are informational and VI makes no compliance claims [src-mcap-vi-rationale] [src-mcap-vi-readme]. European live transactions used passkeys [src-mcap-europe-2026]. Whether a VI Autonomous mandate (user absent at payment time) satisfies SCA is not addressed by any regulator source found.
- **Regulation E (US).** No Mastercard or regulator document found on how unauthorized-transfer rules apply to agent-initiated card purchases (open question; card credit purchases fall under other rules).
- **Dispute and liability.** Standard chargeback rights apply; no agent-specific reason codes or liability shift published as of 2026-10-11 [src-mcap-dev-level1] [src-mcap-nevermined-review]. An unattributed inline answer in VI issue #15 says liability shift work for the Acceptance Framework is ongoing [src-mcap-vi-issue15].
- **Privacy.** Certification requires agents to follow privacy regulations [src-mcap-dev-level1]; VI selective disclosure limits what each party sees, but `sub` and `pan_last_four` are always visible [src-mcap-vi-security].
- **Regulated pilots.** Santander ran its pilot "within Santander's regulated payment framework" [src-mcap-santander-2026].
- **Standards bodies.** VI contributed to FIDO (2026-04-28); EMVCo's draft agentic framework (2026-09-01) names VI and plans KYA and Agentic Transaction Indicators [src-mcap-fido-pr] [src-mcap-emvco-news].

## Ecosystem and SDKs

### Packages and code

| Package or repo | Registry | Version (date) | What it is | Source |
|---|---|---|---|---|
| `agent-intent/verifiable-intent` (Python package name `verifiable-intent`) | GitHub only; not on PyPI (404 on 2026-10-11) | 0.1.0 in `pyproject.toml`; tag `v0.1.0` (2026-03-05) | Official VI spec and Python reference SDK; Apache-2.0; requires Python 3.10+ and `cryptography>=42.0` | [src-mcap-vi-pyproject] [src-mcap-pypi-vi] [src-mcap-vi-tag] |
| `verifiable-intent` | npm | 0.1.0 (created 2026-07-18) | Unofficial TypeScript port by an individual (repository `lukasjhan/verifiable-intent`), not from the `agent-intent` organization | [src-mcap-npm-vi-unofficial] |
| `@mastercard/developers-mcp` | npm | 0.1.7 (modified 2026-05-16) | MCP server for Mastercard Developers documentation | [src-mcap-npm-mcp] |
| `@mastercard/developers-agent-toolkit` | npm | 0.1.6 (modified 2026-05-08) | Library form of the same toolkit | [src-mcap-npm-toolkit] |
| `mastercard/developers-agent-toolkit` | GitHub, MIT | commit 2c6781c (2026-09-30) | Tools: `get-services-list`, `get-documentation`, `get-documentation-section-content`, `get-documentation-page`, `get-oauth10a-integration-guide`, `get-oauth20-integration-guide`, `get-openfinance-integration-guide`, `get-api-operation-list`, `get-api-operation-details`; plugins for Claude Code, Codex and Cursor with a `mastercard-best-practices` skill | [src-mcap-toolkit-readme] |

Scope check on the toolkit (seed fact confirmed): its API client only reads `llms.txt` and `llms-full.txt` documentation files from developer.mastercard.com; it contains no Agent Pay, token or payment calls (no "agent pay" string in `typescript/src` or `skills`) [src-mcap-toolkit-api].

There is no public Agent Pay SDK, API reference or sandbox. Mastercard Developers lists no Agent Pay service in its `llms.txt` index (2026-10-11); its Checkout Solutions release history says initial Agent Pay documentation pages went live on 2025-10-16 "for early preview", but the markdown source of that page now returns 404 and the HTML is a JavaScript shell, so its current content could not be read (seed item "developer docs page is still a placeholder": unconfirmed either way) [src-mcap-dev-llms] [src-mcap-dev-release-history].

### Named participants (by role, with the source that names them)

| Role | Names | Source |
|---|---|---|
| Launch collaborators (2025-04-29) | Microsoft, IBM, Braintree, Checkout.com | [src-mcap-launch-2025] |
| AI and commerce collaborators (2025-09-10) | Stripe, Google, Ant International (Antom); PayOS | [src-mcap-sep-2025] |
| First US issuers | Citi, U.S. Bank | [src-mcap-sep-2025] [src-mcap-q3-transcript] |
| Wallet | PayPal (pilots the Acceptance Framework) | [src-mcap-paypal-2025] |
| Edge | Cloudflare | [src-mcap-cloudflare-blog] |
| PSP tokens | Stripe (SPTs carry Mastercard agentic network tokens from 2026-03-03) | [src-mcap-stripe-spt-2026] |
| Latin America enabling partners | Bemobi, Checkout.com, Davivienda, Evertec, Getnet, Inti, MagaluPay, Yuno | [src-mcap-latam-2025] |
| Latin America live issuers and processors (17) | BAC, Banco de la Nacion Argentina, Banco Falabella, Banco Galicia, Banco Itaú, Banco Ripley, Banco Security de BICE, Bancolombia, Banamex, Cencosud-Scotiabank, Davivienda, Dock, Evertec, Oriental Bank, Pomelo, Santander, ueno bank | [src-mcap-latam-2026] |
| Australia | CBA, Westpac, IPSI, Maincode, EVT (Event Cinemas, Thredbo) | [src-mcap-australia-2026] |
| Europe | Santander (2026-03-02); 36 named banks including Deutsche Bank, N26, KBC, UniCredit Bank Austria; Worldline and ING (regional end-to-end transaction) | [src-mcap-santander-2026] [src-mcap-europe-2026] |
| Korea | CardInfoLink, hoppa | [src-mcap-korea-2026] |
| VI commitments (2026-03-05) | Google, Fiserv, IBM, Checkout.com, Basis Theory, Getnet (PYMNTS); Mastercard's own guides list Google, IBM, Fiserv, Checkout.com, Worldpay, Adyen | [src-mcap-pymnts-vi] [src-mcap-dev-rails] [src-mcap-dev-level1] |
| AP4M (32) | Aave Labs, Adyen, Alchemy, Anchorage Digital, Ant International, Basis Theory, BVNK, Catena, Checkout.com, Cloudflare, Coinbase, Coinflow, Crossmint, Getnet by Santander, Global Payments, Lovable Labs Incorporated, Mastercard Merchant Cloud, MoonPay, Nevermined, OKX, PayOS, Polygon, Rain, RippleX, Sapiom, Skyfire, Solana Foundation, Stripe, t54 Labs, Tempo, Turnkey, Utila (one of the 32 is Mastercard's own unit) | [src-mcap-ap4m-2026] |
| Trust and intelligence (2026-09-30) | Cloudflare, Skyfire; quotes from Capital One and Javelin Strategy & Research | [src-mcap-trust-2026] |

Other regional launches named but not individually verified here: New Zealand, Singapore, Malaysia and India (listed in the Korea release), UAE pilots (listed in the Australia release), Thailand with Krungthai Card (Mastercard developer guide) [src-mcap-korea-2026] [src-mcap-australia-2026] [src-mcap-dev-rails].

## Fees and costs

| Item | Finding | Date | Source | Caveat |
|---|---|---|---|---|
| Agent Pay price list | Mastercard "does not publish a universal self-service price table for Agent Pay"; the review names no Mastercard fee, interchange, tokenization fee, liability rule or chargeback code | 2026-08-28 | [src-mcap-nevermined-review] | Vendor blog; Nevermined is an AP4M participant and quotes its own 1 to 2% pricing, which is not a Mastercard fee |
| Network fee categories | No new agentic interchange categories or effective dates disclosed; the author expects new network fee categories (opinion) | 2026-05-01 | [src-mcap-mcc-fees] | Secondary opinion; page blocked on 2026-10-11, taken from ATLAS_FOLLOWUP.md Appendix B |
| Merchant cost model | Merchants accept tokens through existing processors and "PCI scope remains unchanged"; Mastercard's guides describe no extra merchant fee | undated guide (2026) | [src-mcap-dev-level1] | Absence of a statement, not a statement of zero fees |
| Stripe SPT path | Sellers already on Stripe "automatically support" agentic network tokens; no Agent Pay-specific Stripe price stated | 2026-03-03 | [src-mcap-stripe-spt-2026] | Stripe's normal card pricing presumably applies; not stated |
| AP4M | No pricing; payments "some only fractions of a cent" are the target | 2026-06-10 | [src-mcap-ap4m-2026] | Settlement costs per rail not published |
| Trust Framework probability score | Pricing undisclosed | 2026-09-30 | [src-mcap-trust-2026] | |

Conclusion for writers: as of 2026-10-11 treat Agent Pay card payments as standard tokenized card-not-present economics ("card economics unchanged" in the compare matrix) until Mastercard publishes otherwise.

## Metrics with dates and caveats

| Metric | Value | As of | Source | Caveat |
|---|---|---|---|---|
| Agent Pay transaction volume or value | Not published | 2026-10-11 | [src-mcap-trust-2026] [src-mcap-nevermined-review] | No Mastercard release reports counts or value |
| European issuers enabled | "All Mastercard issuers in Europe" at network level | 2026-06-02 | [src-mcap-europe-2026] | Enablement, not usage |
| European banks with completed controlled live transactions | 36 named | 2026-06-02 | [src-mcap-europe-2026] | Controlled transactions on Priceless.com |
| Latin American issuers and processors with live transactions | 17 named | 2026-03-24 | [src-mcap-latam-2026] | "Performed in controlled environments" |
| Latin American issuers enabled for tokenization | "nearly 100%" (December 2025: tokenization; March 2026: "agentic token technology") | 2025-12-03 and 2026-03-24 | [src-mcap-latam-2025] [src-mcap-latam-2026] | The wording changed between releases |
| US cardholders enabled | All US cardholders planned "by the holiday season" 2025; remaining US issuers planned for November 2025 | 2025-09-10 and 2025-10-30 | [src-mcap-sep-2025] [src-mcap-q3-transcript] | Completion not confirmed by a later primary source found |
| AP4M named participants | 32 ("More than 30") | 2026-06-10 | [src-mcap-ap4m-2026] | Includes Mastercard Merchant Cloud |
| VI repository | 97 stars, 20 forks, 41 issues and PRs, 5 commits on `main` | 2026-10-11 | [src-mcap-vi-gh-repo] [src-mcap-vi-issues] | No commits since 2026-04-20 |
| VI test suite | "268 tests across 17 test files" (CHANGELOG 0.1.0) | 2026-02-19 | [src-mcap-vi-changelog] | The repository now has more test files than 17 |
| Consumer adoption projection | "one in 10 consumers projected to routinely use agents to make purchases by 2030" | 2026-09-30 | [src-mcap-trust-2026] | Projection; source of the projection not given |
| Australian projection | Agentic commerce could influence 55% of Australian consumer transactions by 2030, up to A$670 billion | 2026-01-28 | [src-mcap-australia-2026] | Third-party research cited by Mastercard |

## Relations to the other seven protocols

- **AP2 (`ap2`).** Agent Pay is not AP2. The link is VI: Mastercard contributed VI to FIDO on 2026-04-28 next to Google's AP2, described as co-developed with Google and designed to work with AP2 [src-mcap-fido-pr] [src-mcap-google-fido-blog]. On `main`, VI uses the same four mandate `vct` values as AP2 v0.2 (`mandate.checkout.open.1`, `mandate.checkout.1`, `mandate.payment.open.1`, `mandate.payment.1`) and aligned constraint semantics with different key prefixes: AP2 schemas use `payment.amount_range`, VI uses `mandate.payment.amount_range` (correction 2.3.3) [src-mcap-vi-format] [src-mcap-vi-constraints] [src-mcap-ap2-schema-open-payment]. The 2026-04 VI commit is titled "field alignment per AP2 schema updates" [src-mcap-vi-pr23]. VI's protocol-landscape page says AP2 leaves the verifiable digital credential format open and VI "provides a concrete option" [src-mcap-vi-landscape]. Live use of VI inside AP2 flows is not documented.
- **Visa TAP (`visa-tap`).** Same edge pattern, different network: Cloudflare says both build on Web Bot Auth with a tag in `Signature-Input`, a mandatory nonce, and a directory hosted by each network [src-mcap-cloudflare-blog]. Mastercard's guide gives Mastercard's tag as `Agent-pay-auth` and Visa's as `agent-browser-auth` and `agent-payer-auth` [src-mcap-dev-level1]. Both networks issue their own agentic network tokens; Stripe carries both through SPTs [src-mcap-stripe-spt-2026]. The word "agentic token" names different products on the two networks.
- **OpenAI ACP (`openai-acp`).** No Mastercard-specific field in ACP; `mastercard` appears only in card brand and 3DS `directory_server` enums [src-mcap-acp-schema]. Indirect path: Stripe SPTs can carry Mastercard agentic network tokens, so an ACP payment through Stripe can use an Agent Pay token [src-mcap-stripe-spt-2026]. VI's landscape page proposes ACP extensions as a carrier for VI but defines none [src-mcap-vi-landscape]. Mastercard's 2025 story linking Agent Pay to ChatGPT Instant Checkout could not be read (403), and Mastercard's own developer guide says OpenAI discontinued Instant Checkout in March 2026 [src-mcap-dev-rails].
- **UCP (`ucp`).** Mastercard is listed as a UCP endorser [src-mcap-ucp-endorsers]. VI says its credentials can be carried in UCP's AP2 mandate extension "without changes to UCP's core endpoints"; the page names `dev.ucp.shopping.ap2_mandate`, which UCP renamed `dev.ucp.common.payment.ap2_mandate` in v2026-08-25 [src-mcap-vi-landscape] [src-mcap-ucp-schema-ap2]. No documented Agent Pay integration with UCP; which network token a Google Pay handler returns is not published.
- **Stripe MPP (`stripe-mpp`).** Mastercard does not itself claim MPP compatibility for AP4M. The claim is Tempo's: in the AP4M release's quote sheet, Tempo says it is "excited to work with Mastercard on Machine Payments Protocol compatibility", with Tempo providing stablecoin settlement (correction 2.1.2) [src-mcap-ap4m-2026]. No Mastercard-maintained MPP payment method exists; MPP's governance page names Mastercard only as an example rail, and the MPP card method draft is authored by Visa and lists `mastercard` as an accepted network value [src-mcap-mpp-governance] [src-mcap-mpp-card-spec].
- **x402 (`x402`).** Mastercard is a premier member of the x402 Foundation (launched 2026-04-02, operational 2026-07-14) [src-mcap-x402-cdp-foundation] [src-mcap-x402-lf-july]. Coinbase's AP4M quote names x402 as an open standard it brings to the partnership [src-mcap-ap4m-2026]. No x402 mention in Agent Pay technical documents or the toolkit.
- **ERC-8004 (`erc-8004`).** No documented relation. Agent Pay registers agents in a Mastercard-run registry; ERC-8004 is a public on-chain registry. AP4M names Polygon, Solana Foundation and others as partners but publishes no on-chain identity mechanism [src-mcap-ap4m-2026].
- **EMVCo (orbit).** EMVCo's 2026-09-01 draft framework names VI as an existing cryptographic solution that its "Intent Services" would complement [src-mcap-emvco-news].

## Criticisms and open questions

1. **Closed program, thin public spec.** Agent Pay's rules, token lifecycle, Intent API and key directory are not public; Mastercard's guides repeatedly defer to "the Mastercard Agent Pay Acceptance Framework" for details that are not published [src-mcap-dev-level2] [src-mcap-dev-level3].
2. **Pilots versus scale.** Most transactions named in releases are "controlled" (Santander: "does not constitute a commercial rollout"; LAC: "performed in controlled environments"); no volume data exists [src-mcap-santander-2026] [src-mcap-latam-2026].
3. **Form fill keeps scraping alive.** The DTVC and Level 1 paths make agents type tokens into human checkout forms, so agents still drive merchant web pages [src-mcap-dev-mvct] [src-mcap-dev-level1].
4. **Agent detection is probabilistic.** A probability score for AI-initiated transactions (US testing, 2026-09-30) implies the agent flag is not reliably present in all authorization traffic [src-mcap-trust-2026].
5. **Liability and disputes undefined.** No agent-specific reason codes or liability shift published; VI leaves dispute choreography out of scope [src-mcap-vi-security] [src-mcap-nevermined-review].
6. **Key directory location.** The only Mastercard directory host in public docs does not resolve [src-mcap-dev-level1].
7. **Inconsistent tag spelling.** `Agent-pay-auth` and `agent-pay-auth` on the same developer site; Cloudflare's 2025 post implies browse and pay tags for both networks; Mastercard's guide gives one Mastercard tag. The Level 1 guide's sample verification code accepts only the two Visa tags [src-mcap-dev-level1] [src-mcap-dev-testing] [src-mcap-cloudflare-blog].
8. **VI spec issues.** RFC 9901 duplicate-digest conflict (issue #29); the CHANGELOG says five constraint types while the spec registers eight; the same 0.1 label covers two incompatible key sets; no revocation; PERMISSIVE default conflicts with the rule that open mandates with unknown types MUST be rejected, since constraints appear only in open mandates; no commits since 2026-04-20 while issues accumulate [src-mcap-vi-issue29] [src-mcap-vi-changelog] [src-mcap-vi-constraints] [src-mcap-vi-security].
9. **Stateful constraints need network state.** Budgets and recurrence require the payment network to track every L3 by L2; no API for that state is defined [src-mcap-vi-security].
10. **Developer documentation odds and ends.** The VI design rationale lists "Mastercard ACP" among JSON payment APIs without defining it [src-mcap-vi-rationale]. Mastercard's guide credits Latin American live transactions to Santander; that is consistent with Santander being one of the 17 LAC participants, and is separate from Santander's 2026-03-02 European pilot [src-mcap-dev-rails] [src-mcap-latam-2026] [src-mcap-santander-2026].
11. **Open regulatory questions.** How Regulation E, PSD2 SCA and chargeback rights apply to autonomous mandates is not settled by any source found.

## Resources

Types use `ResourceType` in `src/lib/schemas.ts`. URL status from `curl -sSIL` on 2026-10-11; 403 means bot-blocked to curl (the page exists per Appendix A, opened 2026-10-10, or per search results).

| Title | URL | Publisher | Date | Type | Badge | Note | Start here |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Mastercard Agent Pay (product page) | https://www.mastercard.com/us/en/business/artificial-intelligence/mastercard-agent-pay.html | Mastercard | ongoing | docs | official | Program overview; HTTP 403 to curl and WebFetch | no |
| Mastercard Unveils Agent Pay (launch release) | https://s25.q4cdn.com/479285134/files/doc_news/Mastercard-Unveils-Agent-Pay-Pioneering-Agentic-Payments-Technology-to-Power-Commerce-in-the-Age-of-AI-2025.pdf | Mastercard Investor Relations | 2025-04-29 | announcement | official | Agentic Tokens, registered agents, launch partners | yes |
| Verifiable Intent repository | https://github.com/agent-intent/verifiable-intent | agent-intent (Mastercard) | 2026-03-05 | repo | official | Spec, constraint registry, threat model, Python SDK | yes |
| Verifiable Intent documentation | https://verifiableintent.dev | agent-intent | 2026 | docs | official | Rendered spec and protocol mappings | no |
| The Rails for Agentic Commerce | https://developer.mastercard.com/merchant-cloud/documentation/tutorials-and-guides/ai-revolution/14/index.md | Mastercard Developers | 2026 | tutorial | official | Agent certification, tokens, intent, merchant registration | yes |
| Level 1 Agentic Commerce guide | https://developer.mastercard.com/merchant-cloud/documentation/tutorials-and-guides/agentic-commerce-guide/21/index.md | Mastercard Developers | 2026 | docs | official | Web Bot Auth headers, `Agent-pay-auth` tag, tokens in forms | no |
| Level 3 Agentic Commerce guide | https://developer.mastercard.com/merchant-cloud/documentation/tutorials-and-guides/agentic-commerce-guide/23/index.md | Mastercard Developers | 2026 | docs | official | Intent API objects, DSRP payload, VI | no |
| Securing agentic commerce with Visa and Mastercard | https://blog.cloudflare.com/secure-agentic-commerce/ | Cloudflare | 2025-10-24 | tutorial | partner | Edge verification checks for TAP and Agent Pay | yes |
| Mastercard Launches Agent Pay for Machines | https://s25.q4cdn.com/479285134/files/doc_news/Mastercard-Launches-Agent-Pay-for-Machines-to-Unlock-Super-Fast-Always-On-Payments-2026.pdf | Mastercard Investor Relations | 2026-06-10 | announcement | official | AP4M capabilities and 32 participants | no |
| Mastercard Advances Agentic Commerce With New Trust and Intelligence Services | https://s25.q4cdn.com/479285134/files/doc_news/Mastercard-Advances-Agentic-Commerce-With-New-Trust-and-Intelligence-Services-2026.pdf | Mastercard Investor Relations | 2026-09-30 | announcement | official | Trust Framework, probability score, Skyfire KYA | no |
| Europe is Building the Foundations for Trusted Agentic Commerce | https://newsroom.mastercard.com/news/europe/en/perspectives/en/2026/europe-is-building-the-foundations-for-trusted-agentic-commerce/ | Mastercard Newsroom | 2026-06-02 | announcement | official | All European issuers enabled; 36 banks | no |
| Supporting additional payment methods for agentic commerce | https://stripe.com/blog/supporting-additional-payment-methods-for-agentic-commerce | Stripe | 2026-03-03 | announcement | partner | SPTs carry Mastercard agentic network tokens | no |
| How EMVCo is working to enable card-based agentic payments | https://www.emvco.com/knowledge-hub/how-emvco-is-working-to-enable-secure-interoperable-and-scalable-card-based-agentic-payments/ | EMVCo | 2026-09 | standard | official | Intent Services; cites VI | no |
| Mastercard Developers Agent Toolkit | https://github.com/mastercard/developers-agent-toolkit | Mastercard | 2025-07-22 | tool | official | MCP server for documentation only | no |
| Mastercard focuses on 'Verifiable Intent', CDO says | https://fidoalliance.org/finainews-podcast-mastercard-focuses-on-verifiable-intent-for-agentic-payments-cdo-says/ | FinAi Podcast with Pablo Fourez (FIDO Alliance page) | 2026-09-15 | podcast | official | Year one of Agent Pay; HTTP 403 to curl | no |
| Mastercard x Checkout.com on agentic commerce | https://www.checkout.com/es-es/blog/mastercard-x-checkout-una-conversacion-sobre-el-agentic-commerce | Checkout.com (Fourez, O'Neill) | 2026-05-21 | talk | partner | Video; Spanish page | no |
| Mastercard Agent Pay: Enabling Trusted Payments | https://www.merchantadvisorygroup.org/mag-calendar/2025/07/29/default-calendar/mastercard-agent-pay--enabling-trusted-payments-in-the-age-of-ai-agents | Merchant Advisory Group | 2025-07-29 | talk | community | Merchant briefing | no |
| How Verifiable Intent builds trust | https://www.mastercard.com/us/en/news-and-trends/stories/2026/verifiable-intent.html | Mastercard Stories (Pablo Fourez) | 2026-03-05 | announcement | official | Executive explainer; HTTP 403 to curl | no |
| Verifiable Intent: Mastercard's New Trust Primitive | https://atxp.ai/blog/verifiable-intent-mastercard-ai-agents | ATXP | 2026-03-22 | tutorial | community | Developer view | no |
| Agent Pay Explained: Agentic Tokens and VI | https://stellagent.ai/insights/mastercard-agent-pay-agentic-tokens | Stellagent | 2026-04-09 | analysis | community | Compared with Visa | no |
| Visa and Mastercard's Battle for Standards | https://stellagent.ai/insights/visa-mastercard-agentic-standards-battle | Stellagent | 2026-03-06 | analysis | community | March 2026 launches | no |
| Mastercard bets payments run through AI agents | https://ppc.land/mastercard-bets-future-payments-run-through-ai-agents-instead-of-people/ | PPC Land | 2026-01-11 | analysis | community | Consent and audit trail | no |
| Agent Pay for Machines (AP4M) | https://www.theblock.co/post/404288 | The Block | 2026-06-10 | analysis | community | Stablecoin extension; HTTP 403 to curl | no |
| Mastercard, Google Introduce Verifiable Intent | https://fintechnews.sg/127287/ai/mastercard-google-verifiable-intent/ | Fintech News Singapore | 2026-03-06 | analysis | community | Launch summary | no |
| Mastercard Agent Pay Explained | https://eco.com/support/en/articles/14845483-mastercard-agent-pay-explained | Eco | 2026-09-07 | tutorial | community | Tokenization, pilots; says MDES, which Mastercard pages read do not | no |
| A Formal Analysis of Agent Payment Protocols | https://arxiv.org/abs/2609.00060 | arXiv (Jiang et al.) | 2026-08-30 | analysis | academic | Does not model Agent Pay; context | no |

## Publications

No paper names Agent Pay or Verifiable Intent (search of arXiv titles on 2026-10-11 found none). Each entry below was checked on 2026-10-11 by the method shown.

| Id | Title | Authors | Venue and date | Relevance | Checked with |
| --- | --- | --- | --- | --- | --- |
| arXiv 2609.27452 | Issuer-Sovereign Agentic Payments | Dishant Sharma, Rajneesh Kaushal, Ashu Kanaujia | arXiv, 2026-09-23 | Closest topical work: issuer control over agent payments | export.arxiv.org API |
| arXiv 2609.00060 | A Formal Analysis of Agent Payment Protocols | Ke Jiang, Mohan Yu, Yuan Chang, Mohit Kumar Jangid, Jianyu Niu, Cong Wang, Yinqian Zhang | arXiv, 2026-08-30 | Formal models of neighboring protocols; Agent Pay not modeled | export.arxiv.org API |
| DOI 10.1109/SP.2010.33 | Chip and PIN is Broken | Murdoch, Drimer, Anderson, Bond | IEEE S&P 2010 | EMV card protocol flaws (foundation) | doi.org CSL JSON |
| DOI 10.1109/SP.2014.11 | Chip and Skim: Cloning EMV Cards with the Pre-play Attack | Bond, Choudary, Murdoch, Skorobogatov, Anderson | IEEE S&P 2014 | Unpredictable-number weaknesses | doi.org CSL JSON |
| DOI 10.1109/SP40001.2021.00037 (arXiv 2006.08249) | The EMV Standard: Break, Fix, Verify | Basin, Sasse, Toro-Pozo | IEEE S&P 2021 | Tamarin analysis of EMV | doi.org CSL JSON; export.arxiv.org |
| USENIX Security 2021 (no DOI) | Card Brand Mixup Attack: Bypassing the PIN in non-Visa Cards by Using Them for Visa Transactions | Basin, Sasse, Toro-Pozo | USENIX Security 2021 | Cross-brand confusion | usenix.org page title |
| DOI 10.1109/SP46214.2022.9833642 | Practical EMV Relay Protection | Radu, Chothia, Newton, Boureanu, Chen | IEEE S&P 2022 | Relay defenses | doi.org CSL JSON |
| DOI 10.1007/978-3-642-14577-3_27 | Verified by Visa and MasterCard SecureCode: Or, How Not to Design Authentication | Murdoch, Anderson | FC 2010, LNCS | Earlier network-run authentication layer and liability design | doi.org CSL JSON |
| DOI 10.1007/978-3-030-84252-9_5 (ePrint 2020/756) | Provable Security Analysis of FIDO2 | Barbosa, Boldyreva, Chen, Warinschi | CRYPTO 2021, LNCS | Passkeys used for Agent Pay consent | doi.org CSL JSON; eprint.iacr.org HTTP 200 |
| DOI 10.2307/3087474 | Cooperation among Competitors: Some Economics of Payment Card Associations | Rochet, Tirole | RAND Journal of Economics, 2002 | Card network economics (interchange) | Crossref API and doi.org CSL JSON |

Sources: [src-mcap-arxiv-issuer] [src-mcap-arxiv-formal] [src-mcap-doi-chippin] [src-mcap-doi-chipskim] [src-mcap-doi-emvbfv] [src-mcap-usenix-mixup] [src-mcap-doi-relay] [src-mcap-doi-3ds] [src-mcap-doi-fido2] [src-mcap-doi-rochet].

Note: the Rochet and Tirole DOI is 10.2307/3087474 (10.2307/3087478 resolves to a different paper) [src-mcap-doi-rochet].

## Seed audit

| Seed fact (ATLAS_PROMPT 5.8 or ATLAS_FOLLOWUP) | Verdict | Source | Note |
| --- | --- | --- | --- |
| Announced 2025-04-29 as the Agentic Payments Program with Mastercard Agentic Tokens | confirmed | src-mcap-launch-2025 | |
| Sub-brand: Agent Pay Acceptance Framework (October 2025) | confirmed (month only) | src-mcap-latam-2025 | Day not confirmed; see Conflicts on 2025-10-14 |
| Sub-brand: Agent Pay for Machines (AP4M, June 2026) | confirmed | src-mcap-ap4m-2026 | 2026-06-10 |
| Sub-brand: Agent Pay Trust Framework (September 2026) | confirmed | src-mcap-trust-2026 | 2026-09-30; no white paper found |
| Sub-brand: DTVC | confirmed, with naming conflict | src-mcap-dev-mvct, src-mcap-dev-mvct-tests | "Dynamic Token Validation Code" and "Dynamic Token Verification Code" both used by Mastercard |
| Proprietary program | confirmed | src-mcap-launch-2025, src-mcap-dev-level3 | Full Acceptance Framework spec not public |
| Public developer docs page is still a placeholder [verify] | unconfirmed | src-mcap-dev-release-history, src-mcap-dev-llms | Preliminary docs went live 2025-10-16 for early preview; current page unreadable (404 markdown, JavaScript shell) |
| Launch partners Microsoft, IBM, Braintree, Checkout.com | confirmed | src-mcap-launch-2025 | |
| VI co-developed with Google, Apache-2.0, at github.com/agent-intent/verifiable-intent | confirmed | src-mcap-fido-pr, src-mcap-vi-readme, src-mcap-vi-gh-repo | README says "Maintained by Mastercard" |
| VI v0.1.0 dated 2026-02-19 | confirmed, with nuance | src-mcap-vi-changelog, src-mcap-vi-tag | CHANGELOG date; the git tag is on a 2026-03-05 commit |
| VI announced 2026-03-05 | confirmed | src-mcap-pymnts-vi, src-mcap-vi-gh-repo | Mastercard story blocked; PYMNTS and repo creation date agree |
| VI contributed to FIDO 2026-04-28 | confirmed | src-mcap-fido-pr | |
| Agentic token built on Mastercard tokenization (MDES) | corrected | src-mcap-launch-2025 | Say "built on Mastercard tokenization"; no Mastercard page read names MDES (follow-up 2.2) |
| Issued only to registered agents | confirmed | src-mcap-dev-rails, src-mcap-latam-2025 | |
| Tied to a specific authorized agent interaction, bounded by user limits, programmable controls | partially confirmed | src-mcap-dev-level1, src-mcap-latam-2025 | Tokens "may be single-use, merchant-specific, or time-limited"; consumer "permissions and limits" |
| DTVC is an agentic token formatted for standard card fields | corrected | src-mcap-dev-mvct, src-mcap-dev-mvct-pay | DTVC is a one-time security code issued with a Mastercard Virtual Card Token, used for guest checkout forms |
| KYA: registration, security review, certification, trusted lists | confirmed | src-mcap-dev-rails | |
| Merchants register through acquirer or PSP | confirmed | src-mcap-dev-rails | |
| Skyfire named KYA partner, September 2026 | confirmed | src-mcap-trust-2026 | 2026-09-30; Skyfire was already an AP4M participant on 2026-06-10 |
| No-code path (Web Bot Auth at the CDN plus tokens in forms) | confirmed | src-mcap-dev-level1, src-mcap-q3-transcript | "no-code approach" quoted on the Q3 2025 call |
| Deeper path (agent recognition, purchase intent, tokens, consumer identity) | confirmed | src-mcap-dev-level2, src-mcap-dev-level3 | Agent User Identity object, Intent API |
| Identity travels as a browse or pay `tag` in `Signature-Input` | corrected | src-mcap-dev-level1, src-mcap-cloudflare-blog | Mastercard's guide gives one Mastercard tag, `Agent-pay-auth`; browse and pay tags are Visa's |
| Verified against a Mastercard-hosted key directory [verify URL] | confirmed (directory), URL unknown | src-mcap-cloudflare-blog, src-mcap-dev-level1 | The only host shown, `agentpay-key-directory.mastercard.com`, does not resolve |
| US probability score test from September 2026 | confirmed | src-mcap-trust-2026 | |
| VI layer lifetimes (L1 about 1 year; L2 Immediate about 15 minutes; L2 Autonomous 24 hours to 30 days; L3a and L3b about 5 minutes) | confirmed | src-mcap-vi-format | L3 maximum 1 hour |
| L3a and L3b linked by `checkout_hash` | confirmed, refined | src-mcap-vi-format | L3a `transaction_id` must equal L3b `checkout_hash` |
| Constraints mirror AP2 v0.2 with `mandate.payment.amount_range` and others | corrected | src-mcap-vi-constraints, src-mcap-ap2-schema-open-payment | Aligned semantics, different prefixes (2.3.3); VI strings valid on `main` only, not at tag v0.1.0 |
| ES256 signatures | confirmed | src-mcap-vi-spec | |
| 2025-09-10 US enablement plan, Citi and U.S. Bank first | confirmed | src-mcap-sep-2025 | |
| 2025-09-30 Agent Pay for ChatGPT Instant Checkout | unconfirmed | none read | mastercard.com story blocked; Instant Checkout was later discontinued (March 2026, per Mastercard's guide) |
| 2025-10-14 Acceptance Framework with Cloudflare | corrected | src-mcap-latam-2025, src-mcap-cloudflare-blog | "October 2025"; Cloudflare's post is dated 2025-10-24 |
| 2025-10-27 PayPal integration | confirmed | src-mcap-paypal-2025 | PayPal pilots the Acceptance Framework |
| 2025-10-30 first agentic transaction on the network reported | confirmed (reported) | src-mcap-q3-transcript, src-mcap-pymnts-q3 | Earnings call statement; PayOS claimed a first live payment on 2025-10-01 |
| 2025-12-03 Latin America and Caribbean launch | confirmed | src-mcap-latam-2025 | |
| 2026-01-28 Australia's first authenticated transactions (CBA, Westpac) | confirmed | src-mcap-australia-2026 | |
| 2026-03-02 Santander Europe first live end-to-end payment | confirmed | src-mcap-santander-2026 | Pilot, not a commercial rollout |
| 2026-03-17 Korea | confirmed | src-mcap-korea-2026 | |
| 2026-03-24 17 Latin American issuers and processors live | confirmed | src-mcap-latam-2026 | Controlled environments |
| 2026-06-02 all European issuers enabled at network level | confirmed | src-mcap-europe-2026 | |
| 2026-06-10 AP4M with 32 partners incl. Coinbase, Stripe, Tempo, Polygon, Solana Foundation | confirmed | src-mcap-ap4m-2026 | 32 includes Mastercard Merchant Cloud |
| 2026-09-30 Trust Framework and probability score | confirmed | src-mcap-trust-2026 | |
| Issuers Citi, U.S. Bank, Santander, CBA, Westpac | confirmed | src-mcap-sep-2025, src-mcap-santander-2026, src-mcap-australia-2026 | |
| Platforms Microsoft, IBM, OpenAI, Google | partially confirmed | src-mcap-launch-2025, src-mcap-sep-2025, src-mcap-pymnts-q3 | OpenAI only through PYMNTS earnings coverage (reported) |
| Payments partners PayPal, Braintree, Checkout.com, Stripe, PayOS, Basis Theory, Cloudflare, Skyfire | confirmed | src-mcap-paypal-2025, src-mcap-launch-2025, src-mcap-stripe-spt-2026, src-mcap-ap4m-2026, src-mcap-trust-2026 | |
| Payments partner Firmly.AI | unconfirmed | none | Not named in any source read |
| VI supporters Adyen, Basis Theory, Checkout.com, Getnet, Fiserv, IBM, Worldpay | partially confirmed | src-mcap-pymnts-vi, src-mcap-dev-rails | Lists differ by source (see Conflicts) |
| Mastercard Agent Toolkit is an MCP server for documentation only | confirmed | src-mcap-toolkit-readme, src-mcap-toolkit-api | |
| Mostly controlled pilots; no public volume data | confirmed | src-mcap-latam-2026, src-mcap-santander-2026 | |
| Web Bot Auth like Visa TAP, different directory | confirmed | src-mcap-cloudflare-blog | |
| VI maps into UCP's AP2 extension | confirmed, with rename | src-mcap-vi-landscape, src-mcap-ucp-schema-ap2 | VI names `dev.ucp.shopping.ap2_mandate`, now `dev.ucp.common.payment.ap2_mandate` |
| Usable under ACP via Stripe SPTs | confirmed (indirect) | src-mcap-stripe-spt-2026 | |
| AP4M cites MPP compatibility (follow-up 2.1.2) | corrected | src-mcap-ap4m-2026 | Use: Tempo says it is working with Mastercard on MPP compatibility (Tempo's quote in Mastercard's AP4M release); Mastercard's own text does not claim MPP compatibility, and no Tempo page listing AP4M was found |
| Mastercard is a premier x402 Foundation member | confirmed | src-mcap-x402-lf-july, src-mcap-x402-cdp-foundation | |
| EMVCo draft agentic framework (2026-09-01) cites VI | confirmed | src-mcap-emvco-news | |
| No agent-specific dispute reason codes or liability shift | confirmed (absence) | src-mcap-nevermined-review, src-mcap-dev-level1 | |
| VI leaves out dispute resolution and key provisioning | confirmed | src-mcap-vi-readme, src-mcap-vi-security | |
| FIDO working groups (follow-up 2.1.11) | confirmed | src-mcap-fido-pr, src-mcap-fido-pwg-2025 | Payments WG launched 2025-04-29; only the Agentic Authentication TWG was new on 2026-04-28 |
| Scenario 3 pairing of Google Pay handler with a Mastercard agentic token (follow-up 2.2) | confirmed as unpublished | src-mcap-ucp-schema-ap2 | No source documents which network token flows inside |
| AP2 vs VI key names (follow-up 2.3.3) | confirmed | src-mcap-vi-constraints, src-mcap-ap2-schema-open-payment | |
| Relations and compare cell agree on MPP (follow-up 2.3.6) | applied | src-mcap-ap4m-2026 | |
| Appendix B: Nevermined review 2026-08-28 | confirmed | src-mcap-nevermined-review | Vendor and AP4M participant |
| Appendix B: Merchant Cost Consulting 2026-05-01 | unconfirmed today (blocked) | src-mcap-mcc-fees | Kept as reported from Appendix B |
| Appendix A: 11 Mastercard resources | 8 reachable, 3 HTTP 403 to curl | see Resources | FIDO podcast page, Mastercard VI story, The Block |
| Publication 2609.27452 | confirmed | src-mcap-arxiv-issuer | |
| Foundation papers (Chip and PIN, Chip and Skim, EMV Break Fix Verify, Card Brand Mixup, EMV relay, 3-D Secure, FIDO2, Rochet and Tirole) | confirmed | see Publications | |

## Blocked sources

Logged in `research/blocked.md` on 2026-10-11:
- www.mastercard.com (product page, stories, press pages) and investor.mastercard.com: HTTP 403 to curl and WebFetch. Used Investor Relations PDFs on s25.q4cdn.com and newsroom.mastercard.com copies.
- www.businesswire.com: HTTP/2 stream error. Used the Investor Relations PDFs.
- developer.mastercard.com Agent Pay use-case page: markdown 404, HTML is a JavaScript shell.
- agentpay-key-directory.mastercard.com: NXDOMAIN.
- merchantcostconsulting.com, theblock.co, fireblocks.com, digitalcommerce360.com, the fidoalliance.org podcast page: HTTP 403 to curl.

## Conflicts

Also appended to `research/conflicts.md`.

1. **Web Bot Auth tag for Agent Pay.** Cloudflare (2025-10-24) says both TAP and Agent Pay add a tag indicating browsing or purchasing and lists the values `agent-browser-auth` and `agent-payer-auth` [src-mcap-cloudflare-blog]. Mastercard's Level 1 guide says Mastercard uses `Agent-pay-auth` and attributes the browse and pay values to Visa [src-mcap-dev-level1]; Mastercard's testing glossary spells it `agent-pay-auth` [src-mcap-dev-testing]. Primary for Mastercard's value: Mastercard's guide; the exact case is unresolved.
2. **DTVC expansion.** "Dynamic Token Validation Code" (MVCT overview) versus "Dynamic Token Verification Code" (MVCT test cases); both Mastercard [src-mcap-dev-mvct] [src-mcap-dev-mvct-tests].
3. **VI version identity.** CHANGELOG `[0.1.0]` is dated 2026-02-19 and spec headers 2026-02-18, but tag `v0.1.0` points to a 2026-03-05 commit; PR #23 (2026-04-20) made breaking renames without a new version; the CHANGELOG still says "Five constraint types" while `spec/constraints.md` registers eight [src-mcap-vi-changelog] [src-mcap-vi-tag] [src-mcap-vi-pr23] [src-mcap-vi-constraints]. The AP2 dossier's statement that VI uses the same `vct` values as AP2 v0.2 holds for `main` (2026-04-20), not for tag `v0.1.0`, whose VCTs had no `.1` suffix [src-mcap-vi-v010-format].
4. **AP4M and MPP (follow-up 2.1.2).** The seed said Mastercard cites MPP compatibility; the only statement is Tempo's quote in Mastercard's AP4M release [src-mcap-ap4m-2026]. No Tempo web page listing AP4M as MPP-compatible was found.
5. **Acceptance Framework date.** The seed gives 2025-10-14 with Cloudflare; Mastercard's December 2025 release says "launched in October 2025"; Cloudflare's post is dated 2025-10-24 [src-mcap-latam-2025] [src-mcap-cloudflare-blog]. 2025-10-14 is Visa TAP's launch date in the Visa dossier, which may be the source of the seed date.
6. **VI supporter lists.** PYMNTS (2026-03-05) lists Google, Fiserv, IBM, Checkout.com, Basis Theory, Getnet; Mastercard's developer guides list Google, IBM, Fiserv, Checkout.com, Worldpay, Adyen [src-mcap-pymnts-vi] [src-mcap-dev-rails] [src-mcap-dev-level1].
7. **Key directory URL.** The Mastercard guide's example `Signature-Agent: "https://agentpay-key-directory.mastercard.com/"` does not resolve (NXDOMAIN, 2026-10-11) [src-mcap-dev-level1].
8. **MDES (follow-up 2.2).** Eco's explainer says agentic tokens come from MDES; no Mastercard page read names MDES for Agent Pay ("tokenization" only) [src-mcap-launch-2025].
9. **First transaction.** PayOS claimed "the world's first live agentic payment using a Mastercard Agentic Token" on 2025-10-01; the CEO said on 2025-10-30 the first agentic transaction took place on the network that quarter; both are consistent with Q3 2025 but neither gives a transaction date [src-mcap-payos-2025] [src-mcap-q3-transcript].
10. **Duplicate digests in VI L2.** The VI spec's examples list mandate digests in both `_sd` and `delegate_payload`; RFC 9901 requires rejection of repeated digests (issue #29) [src-mcap-vi-format] [src-mcap-rfc9901] [src-mcap-vi-issue29]. RFC 9901 is primary for SD-JWT processing.

## Least certain

1. **Whether VI runs inside any live Agent Pay authorization.** Mastercard says it is "embedding" VI into the payment flow (2026-03-24) and AP4M credentialing uses VI, but no public document or transaction record shows a VI chain checked by the network in production; the repository has had no commits since 2026-04-20 [src-mcap-latam-2026] [src-mcap-ap4m-2026] [src-mcap-vi-gh-repo].
2. **Mastercard's exact Web Bot Auth tag and key directory location.** `Agent-pay-auth` versus `agent-pay-auth`, Cloudflare's browse and pay wording, and a directory host that does not resolve [src-mcap-dev-level1] [src-mcap-dev-testing] [src-mcap-cloudflare-blog].
3. **US rollout completion and the ChatGPT link.** Mastercard planned all US issuers enabled by November 2025 and linked Agent Pay to ChatGPT Instant Checkout in a story that could not be read; no later primary source confirms completion, and Mastercard's own guide says Instant Checkout was discontinued in March 2026 [src-mcap-sep-2025] [src-mcap-q3-transcript] [src-mcap-dev-rails].
