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

## Core objects with exact field names

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
