# Verification report: AP2

Verifier: independent verifier agent. Date: 2026-10-11. Scope per `docs/briefs/VERIFIER_BRIEF.md`, ATLAS_PROMPT.md Section 5.7, ATLAS_FOLLOWUP.md Section 2, ATLAS_ERRATA.md rows 2.1.9, 2.1.10, 2.1.11, 2.2 (VC 2.0 and DIDs), 2.3.2, 2.3.3, 2.3.4, R8, R40, plus the playground at `src/playgrounds/ap2/`.

Spec snapshot used: `research/vendor/AP2` at e1ea56d (main). `git diff --stat v0.2.0 HEAD` touches only CHANGELOG.md, CONTRIBUTING.md, README.md and uv.lock, so `code/sdk/schemas/ap2/*.json` and `docs/ap2/*.md` are identical to tag v0.2.0 (b4587ac). Rendered page: `dist/p/ap2/index.html` (built 2026-10-11 14:22, after the last `index.mdx` change at 13:57; not rebuilt).

Status: in progress. Sections are filled as each check completes.

## Check 1: claims against sources

Pool: 208 claims (202 verified, 4 reported, 2 unverified). Referenced from keyFacts, facts.json, faq.json, quiz.json and flashcards.json: 72 claims, all checked. Random sample of 40 from the remaining 136 (Python `random.seed(2)`). All cited claim ids resolve; all source ids resolve (clm-ap2-169 and clm-ap2-171 cite UCP sources from `src/content/protocols/ucp/sources.json` and `src/content/sources/sources.json`).

Referenced set: 70 pass, 2 fail, 0 unreachable. Sample: 40 pass, 0 fail, 0 unreachable.

Rule checks across all 208 claims:

- `verified` with only non-primary sources: none (0 fails). The only non-primary sources (`src-ap2-issue-374`, `src-ap2-issue-345`, `src-ap2-register-ucp`) are either paired with a primary source or back `reported` claims.
- Number or date without `asOf`: every time-variant figure (repository counts, issue counts, partner counts, "no deliverable yet", "still open") carries `asOf`. Claims without `asOf` state spec constants, fixed paper results (with the paper date in the text) or the date of a past event. Same interpretation as `verification/x402.md`; 0 fails.

### 1a. Referenced claims

| Claim | Verdict | Evidence | Note |
| --- | --- | --- | --- |
| clm-ap2-001 | pass | research/vendor/AP2/docs/ap2/specification.md (Mandates section); docs/overview.md |  |
| clm-ap2-002 | pass | cloud.google.com launch post: "payment-agnostic framework", "credit and debit cards to stablecoins and real-time bank transfers" |  |
| clm-ap2-003 | pass | research/vendor/AP2/docs/ap2/specification.md:20-24 "security feature within a Commerce Protocol"; code/samples/*/scenarios/a2a/ |  |
| clm-ap2-005 | pass | research/vendor/AP2/LICENSE (Apache License 2.0) |  |
| clm-ap2-007 | pass | cloud.google.com launch post: byline Stavan Parikh, Rao Surapaneni; September 16, 2025 |  |
| clm-ap2-008 | pass | launch post: "more than 60 organizations" |  |
| clm-ap2-012 | pass | blog.google FIDO post: Stavan Parikh VP/GM, Payments, Apr 28, 2026, "donating ... to the FIDO Alliance" |  |
| clm-ap2-014 | pass | fidoalliance.org PR 2026-04-28: "Verifiable Intent framework, co-developed with Google and designed to work with AP2" |  |
| clm-ap2-017 | pass | FIDO PR: "Payments Technical Working Group, chaired by members from Mastercard and Visa"; contributions "developed ... within the Payments Technical Working Group" |  |
| clm-ap2-018 | pass | fidoalliance.org PWG launch April 29, 2025: "co-chaired by Henna Kapur of Visa and Jonathan Grossar of Mastercard" |  |
| clm-ap2-019 | pass | FIDO PR: "newly formed Agentic Authentication Technical Working Group and the Payments Technical Working Group"; PWG launched 2025-04-29 |  |
| clm-ap2-021 | pass | FIDO PR and ap2-protocol.org (2026-10-11): no FIDO AP2 deliverable listed; tagged unverified (absence claim) |  |
| clm-ap2-022 | pass | research/vendor/AP2/docs/faq.md:149; ap2-protocol.org "Standardization ... will continue within ... FIDO"; issue 268 comment 2026-05-27 |  |
| clm-ap2-023 | pass | research/vendor/AP2/docs/faq.md:149-150 | FAQ says samples and SDK "will continue to be enhanced" without naming Google; acceptable paraphrase. |
| clm-ap2-024 | pass | gh api issues/268/comments: GarethCOliver 2026-05-27T10:32Z "we have officially moved further iterations of this to FIDO" |  |
| clm-ap2-027 | pass | gh api releases: v0.2.0 published 2026-04-28T12:40Z; tag v0.2.0 -> b4587ac "feat: Release Ap2 v0.2 (#233)" |  |
| clm-ap2-028 | pass | gh api commits: e1ea56d 2026-04-29T16:51Z is the head of main |  |
| clm-ap2-029 | pass | gh api commits: no commit after e1ea56d |  |
| clm-ap2-030 | fail | gh search: 44 issues and 63 PRs created >=2026-04-29, but PR 246 (created 2026-04-29T16:38Z) was merged 2026-04-29T16:51Z | PR 246 was opened and merged on 2026-04-29, so "none of the pull requests was merged" is false for the window as stated. Say "62 pull requests opened after the last merge (PR 246, 2026-04-29); none merged" or start the window after e1ea56d. |
| clm-ap2-031 | pass | research/vendor/AP2/code/sdk/schemas/ap2/ (only checkout/payment mandate schemas); docs/ap2/specification.md |  |
| clm-ap2-032 | pass | git show v0.1.0:src/ap2/types/mandate.py classes IntentMandate, CartMandate, PaymentMandate |  |
| clm-ap2-033 | pass | v0.1.0 mandate.py:27-29 *_DATA_KEY constants |  |
| clm-ap2-040 | pass | research/vendor/AP2/docs/glossary.md:19; specification.md:45 |  |
| clm-ap2-041 | pass | research/vendor/AP2/docs/ap2/specification.md:78-83 |  |
| clm-ap2-043 | pass | research/vendor/AP2/docs/ap2/specification.md:72-76 |  |
| clm-ap2-048 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:289-311; no Visa or Trusted Agent Protocol mention in docs |  |
| clm-ap2-050 | pass | research/vendor/AP2/code/sdk/schemas/ap2/checkout_mandate.json required [vct, checkout_jwt, checkout_hash] |  |
| clm-ap2-051 | pass | checkout_mandate.json vct const mandate.checkout.1 |  |
| clm-ap2-053 | pass | checkout_mandate.json checkout_hash description |  |
| clm-ap2-058 | pass | payment_mandate.json required array |  |
| clm-ap2-059 | pass | payment_mandate.json vct const mandate.payment.1 |  |
| clm-ap2-060 | pass | payment_mandate.json transaction_id description |  |
| clm-ap2-061 | pass | payment_mandate.json payment_amount description (27999 = $279.99); types/amount.json |  |
| clm-ap2-064 | pass | open_payment_mandate.json required [vct, constraints, cnf]; contains payment_reference |  |
| clm-ap2-065 | pass | open_payment_mandate.json cnf "RFC 7800 section 3.1"; agent_authorization.md:395-396 |  |
| clm-ap2-071 | pass | open_payment_mandate.json $defs/payment_reference |  |
| clm-ap2-074 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:465 |  |
| clm-ap2-081 | pass | research/vendor/AP2/docs/ap2/specification.md:354-360; receipt schemas reference |  |
| clm-ap2-082 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:521-535 |  |
| clm-ap2-083 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:524-535 |  |
| clm-ap2-091 | pass | research/vendor/AP2/docs/ap2/flows.md:97-116 |  |
| clm-ap2-092 | pass | research/vendor/AP2/docs/ap2/flows.md:146-150 |  |
| clm-ap2-094 | pass | research/vendor/AP2/docs/ap2/specification.md:227-229 |  |
| clm-ap2-099 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:104-111 |  |
| clm-ap2-100 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:119 |  |
| clm-ap2-102 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:392-401 |  |
| clm-ap2-104 | pass | research/vendor/AP2/docs/ap2/specification.md:20-24 |  |
| clm-ap2-105 | fail | research/vendor/AP2/code/samples/go/scenarios/a2a/ has only human-present/cards; Python has human-present and human-not-present with cards and x402 | The Go samples have only a human-present card scenario; only the Python samples cover card and x402 in both modes. |
| clm-ap2-106 | pass | research/vendor/ucp docs/specification/payment/extensions/ap2-mandates.md:63-87 |  |
| clm-ap2-108 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:418-466 |  |
| clm-ap2-109 | pass | datatracker API: draft-gco-oauth-delegate-sd-jwt rev 00 time 2026-04-22T04:45Z (HTML shows 2026-04-21 in US time) | UTC date from the datatracker API. |
| clm-ap2-110 | pass | grep of research/vendor/AP2/docs/ap2 finds no DID or VC 2.0 reference; agent_authorization.md references SD-JWT VC, OpenID4VP, DC API |  |
| clm-ap2-111 | pass | research/vendor/AP2/docs/ap2/*.md: every "alg" value is ES256 |  |
| clm-ap2-114 | pass | gh api issues/268: open, created 2026-05-26T20:53Z |  |
| clm-ap2-117 | pass | grep revoc/revok in research/vendor/AP2/docs returns nothing |  |
| clm-ap2-118 | pass | research/vendor/AP2/docs/ap2/flows.md:11-13; no step-up text in docs/ap2/ |  |
| clm-ap2-119 | pass | v0.1.0 docs/specification.md:526-529 "redirect challenge ... 3DS2, or OTPs" |  |
| clm-ap2-121 | pass | research/vendor/AP2/docs/overview.md:227-232 (3DS2) vs docs/ap2/*.md |  |
| clm-ap2-135 | pass | research/vendor/AP2/pyproject.toml name ap2 version 0.1; PyPI ap2 is third party |  |
| clm-ap2-136 | pass | pypi.org/pypi/ap2/json: 0.1.1, github.com/whillhill/ap2; registry.npmjs.org/ap2: maintainer melvincarvalho |  |
| clm-ap2-139 | pass | FAQ and arXiv:2608.23858 ("no complete public AP2 deployment was available"); tagged unverified as required by errata 2.1.9 |  |
| clm-ap2-141 | pass | datatracker draft-stone-vcap-ap2-binding: -01, Ben Stone, SwarmSync.AI, Informational, 2026-09-04 |  |
| clm-ap2-142 | pass | datatracker abstract names IntentMandate, CartMandate, PaymentMandate |  |
| clm-ap2-144 | pass | research/vendor/AP2/docs/ap2/*.md define no fee (absence) |  |
| clm-ap2-146 | pass | ucp ap2-mandates.md:135-152 AP2 v0.2 and AP2 #268; commit 0b9d7c40 2026-08-25; release v2026-08-25 |  |
| clm-ap2-148 | pass | research/vendor/a2a-x402/spec/v0.2/spec.md:7, 37-46 |  |
| clm-ap2-149 | pass | a2a-x402 spec/v0.2/spec.md:45-46 (CartMandate, PaymentMandate) vs AP2 v0.2 schemas |  |
| clm-ap2-152 | pass | research/vendor/verifiable-intent spec/README.md at 356c296 (main) uses the four .1 vct values |  |
| clm-ap2-163 | pass | export.arxiv.org 2608.23858 abstract: 48 threats, eight High in at least one architecture |  |
| clm-ap2-164 | pass | 2608.23858 abstract: "no complete public AP2 deployment was available, we build a testbed" |  |
| clm-ap2-169 | pass | blog.google google-shopping-cart (May 19, 2026): "begin bringing AP2 to Google products in the coming months, starting with Gemini Spark" |  |
| clm-ap2-171 | pass | gh api v2026-01-11 source/schemas/shopping/ap2_mandate.json name dev.ucp.shopping.ap2_mandate; vendor/ucp v2026-04-08 same; main source/schemas/common/payment_ap2_mandate.json |  |

### 1b. Random sample

| Claim | Verdict | Evidence | Note |
| --- | --- | --- | --- |
| clm-ap2-010 | pass | launch post: no "Visa"; gh api docs/partners.md at all 10 revisions e66fc0b..61f5de4: no Visa |  |
| clm-ap2-011 | pass | launch post: "can be used as an extension of the Agent2Agent (A2A) protocol and Model Context Protocol (MCP)" |  |
| clm-ap2-025 | pass | ap2-protocol.org: "Standardization ... within the Agentic Authentication Technical and Payments Technical Working Groups in FIDO" |  |
| clm-ap2-037 | pass | gh api commits docs/partners.md: b43b072 2025-10-30 "include Tether, Solana and OKX (#103)" |  |
| clm-ap2-046 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:44-47 |  |
| clm-ap2-047 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:309-311 |  |
| clm-ap2-049 | pass | research/vendor/AP2/docs/ap2/implementation_considerations.md:77-81 |  |
| clm-ap2-052 | pass | checkout_mandate.json checkout_jwt description, x-selectively-disclosable-field |  |
| clm-ap2-063 | pass | payment_mandate.json execution_date description |  |
| clm-ap2-066 | pass | open_checkout_mandate.json $defs type consts |  |
| clm-ap2-070 | pass | open_payment_mandate.json agent_recurrence frequency enum and max_occurrences |  |
| clm-ap2-078 | pass | types/jwk.json kty const EC, crv const P-256, alg const ES256 |  |
| clm-ap2-079 | pass | payment_receipt.json required + oneOf |  |
| clm-ap2-084 | pass | v0.1.0 mandate.py:39-73 |  |
| clm-ap2-087 | pass | research/vendor/AP2/docs/ap2/flows.md:5-6, 51-58 |  |
| clm-ap2-088 | pass | research/vendor/AP2/docs/ap2/flows.md:63-67 |  |
| clm-ap2-089 | pass | research/vendor/AP2/docs/ap2/flows.md:70-74 |  |
| clm-ap2-093 | pass | research/vendor/AP2/docs/ap2/specification.md:237-240 (wording: "subsequent open ... Mandates without receiving a rejection receipt") | Spec wording concerns presenting subsequent open mandates; the claim paraphrases the intent (no double use of one open mandate). Pass. |
| clm-ap2-098 | pass | research/vendor/AP2/docs/ap2/specification.md:264-268 |  |
| clm-ap2-101 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:141-146 |  |
| clm-ap2-103 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:497-500 |  |
| clm-ap2-113 | pass | research/vendor/AP2/docs/ap2/security_and_privacy_considerations.md:142-148 |  |
| clm-ap2-123 | pass | research/vendor/AP2/docs/ap2/security_and_privacy_considerations.md:124, 142 |  |
| clm-ap2-124 | pass | research/vendor/AP2/docs/ap2/implementation_considerations.md:99-104 |  |
| clm-ap2-126 | pass | gh api issues/346: open, created 2026-09-02, "Verifiers never consume an accepted closed Payment Mandate" |  |
| clm-ap2-128 | pass | open_checkout_mandate.json and open_payment_mandate.json $defs |  |
| clm-ap2-130 | pass | research/vendor/AP2/docs/ap2/security_and_privacy_considerations.md:113-114 |  |
| clm-ap2-133 | pass | research/vendor/AP2/docs/glossary.md:14, 26, 28; no PSD2 claim |  |
| clm-ap2-140 | pass | gh api issues/345: open, 2026-08-29, JasonColapietro, Suede Agent Studio self-report |  |
| clm-ap2-147 | pass | launch post: "in collaboration with Coinbase, Ethereum Foundation, MetaMask ... launched the A2A x402 extension" |  |
| clm-ap2-156 | pass | eips.ethereum.org/EIPS/eip-8226: Draft, Standards Track ERC, Created 2026-04-12, brickken authors |  |
| clm-ap2-161 | pass | research/vendor/AP2/docs/ap2/security_and_privacy_considerations.md:21 vs open_payment_mandate.json |  |
| clm-ap2-174 | pass | export.arxiv.org 2609.11757 abstract (A-VIP) |  |
| clm-ap2-175 | pass | a2a-x402 spec/v0.2/spec.md:45-46 |  |
| clm-ap2-183 | pass | research/vendor/AP2/docs/ap2/specification.md:270-290 |  |
| clm-ap2-191 | pass | a2a-x402 spec/v0.2/spec.md:11 |  |
| clm-ap2-201 | pass | research/vendor/AP2/docs/ap2/specification.md:302-316 |  |
| clm-ap2-202 | pass | research/vendor/AP2/docs/ap2/agent_authorization.md:455-465 |  |
| clm-ap2-205 | pass | research/vendor/AP2/code/sdk/python/ap2/sdk/README.md:21-22, 83-90 |  |
| clm-ap2-206 | pass | FIDO PR 2026-04-28 "Payments Technical Working Group"; 2025-04-29 release "Payments Working Group (PWG)" |  |
