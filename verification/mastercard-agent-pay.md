# Verification report: mastercard-agent-pay

Verifier: independent agent, 2026-10-11. Scope per `docs/briefs/VERIFIER_BRIEF.md`, ATLAS_PROMPT.md Section 5.8, ATLAS_FOLLOWUP.md Section 2 and the Agent Pay rows of ATLAS_ERRATA.md.

Status: in progress (resumed 2026-10-13 after the first verifier hit a usage limit). Sections are filled as each check completes. Scope for this pass: every claim referenced from `index.mdx` frontmatter and body Cite tags, `facts.json`, `faq.json`, `quiz.json` and `flashcards.json` (161 claims), plus a seeded random sample of 30 further claims (191 distinct claims in all). Sources were fetched with curl on 2026-10-13 and searched as text; sources that blocked curl were retried once with WebFetch.

## Structural findings (claims.json, all 243 claims)

| Id | Verdict | Evidence | Note |
|---|---|---|---|
| clm-mastercard-agent-pay-216 | fail | claims.json; sources.json `src-mcap-pymnts-vi` has `primary: false` | marked `verified` with only a non-primary source; downgrade to `reported` or add a primary source |

Every claim carries an `asOf` value, so no claim fails the "number or date without asOf" rule.

## Check 1: claims against sources (191 claims: 161 referenced + 30 sampled)

Method: each claim's cited sources were fetched and searched for the claim's numbers, names, dates and identifiers, then every claim with any unmatched term or any non-obvious meaning was read in context. Verdicts: pass = source supports text; fail = source contradicts or does not contain it; unreachable = cited source could not be read.

### Failures and defects

| Id | Verdict | Evidence | Note |
|---|---|---|---|
| clm-mastercard-agent-pay-216 | fail | `sources.json` `src-mcap-pymnts-vi` `primary: false` | `verified` with a non-primary source only (from the structural pass). |
| clm-mastercard-agent-pay-007 | fail (wording) | `research` copies of `src-mcap-dev-release-history` ("fecthing this receipt from MDES using the Token Connect API", "MDES for Merchants (M4M)") and `src-mcap-dev-mvct-tests` ("existing MDES token") | Text says "Mastercard pages read for this dossier ... do not name MDES". The cited launch and LatAm releases do not, but two developer pages the dossier itself cites name MDES, for Virtual Card Tokens and Token Connect, not for agentic tokens. Same overstatement in `facts.json` ("Mastercard's pages say ... do not name MDES"), `faq.json` ("The Mastercard pages read for this atlas ... do not name MDES"), `flashcards.json` ("no Mastercard page read names MDES") and `resources.json` line 363 ("the Mastercard pages read for this atlas do not"). Narrow to "Mastercard's agentic-token pages and releases do not name MDES; developer pages mention MDES only for Virtual Card Tokens and Token Connect enrollment". |
| clm-mastercard-agent-pay-034, 035, 036 | unreachable | `src-mcap-q3-transcript` (insidermonkey.com) returns only the operator preamble to curl and WebFetch (sign-up wall) | Marked `reported`, which is right. The PYMNTS copy (`src-mcap-pymnts-q3`), read by WebFetch, contains none of the first-transaction, Citi/U.S. Bank, November, or "no-code" statements. For 036 it supports only the paraphrase "enables any Mastercard merchant to participate without significant development or integration"; the words "no-code" are not confirmed. Keep `reported`, drop "no-code" or attribute it to the unreachable transcript. |
| clm-mastercard-agent-pay-048 | pass with caveat | PYMNTS (WebFetch): "Thursday, March 5, 2026"; GitHub repo created 2026-03-05T09:41:38Z | `reported` is correct; Mastercard's own 2026-03-05 release was not found. |
| clm-mastercard-agent-pay-195 | partial | `research/vendor/ucp` release v2026-08-25 notes: "Migrated payment extensions from `dev.ucp.shopping.*` to `dev.ucp.common.payment.*` (`split_payments`, `payment_terms`, `ap2_mandates`)"; schema at main: name `dev.ucp.common.payment.ap2_mandate` | Namespace move in v2026-08-25 is real. Release notes spell the extension `ap2_mandates` (plural); the schema file at main uses `ap2_mandate`. Claim says "renamed ... to" the singular form; add a note that the release notes use the plural. The cited source (`src-mcap-ucp-schema-ap2`) is a main-branch file, not the release; cite the release note. |
| clm-mastercard-agent-pay-217 | wording | `src-mcap-dev-level1`, `level2`, `level3` are primary Agent Pay developer documents and were readable (HTTP 200); the `use-cases/agent-pay/index.md` page returns 404 | "the only primary record found of Agent Pay developer documentation" contradicts the page's own heavy use of the agentic-commerce-guide pages (claims 072 to 099). Reword to "the use-case page announced on 2025-10-16 could not be read (404 on 2026-10-13)". |
| clm-mastercard-agent-pay-016 | pass with note | WebFetch of FIDO pages: Payments Working Group launched 2025-04-29 (Visa and Mastercard co-chair); 2026-04-28 release creates the Agentic Authentication Technical Working Group and "Payments Technical Working Group ... chaired by members from Mastercard and Visa" | Supports the errata row 2.1.11. Note the 2026 text says "Payments Technical Working Group" while the 2025 text says "Payments Working Group"; the page should say plainly that the Technical group builds on the 2025 working group, not that they are the same body, unless FIDO says so. |

### Passing claims

Referenced claims checked and passing: 001 to 006, 008 to 010, 012, 014, 015, 017 to 024, 029, 030, 032, 037, 040, 042 to 047, 051, 052, 054 to 056, 058, 059, 061 to 064, 066 to 069, 071 to 084, 086 to 096, 098 to 106, 109, 111, 115, 117 to 123, 127 to 135, 139, 150, 152, 154, 159 to 165, 168 to 174, 178, 179, 182 to 191, 193, 194, 196 to 204, 206 to 211, 213 to 215, 220, 221, 227, 228, 231, 241 to 243. Sampled claims checked and passing: 013, 026, 038 to 041, 060, 065, 112, 125, 126, 128, 140, 142, 144, 157, 167, 169, 175, 205, 223, 224, 229, 233, 235, 236, 238, 239.

Selected evidence for the harder passes:

| Id | Evidence |
|---|---|
| 009, 012, 123 | `gh api repos/agent-intent/verifiable-intent`: license Apache-2.0, created 2026-03-05T09:41:38Z, latest commit 2026-04-20T19:06:41Z, zero commits since 2026-04-21, single branch `main`, zero releases. |
| 117 | Tag `v0.1.0` resolves to commit 1dc3d41 dated 2026-03-05T09:42:06Z with no parents; no GitHub release object exists (releases count 0). |
| 115 | `research/vendor/verifiable-intent/CHANGELOG.md` line 12: `## [0.1.0] - 2026-02-19`. |
| 118, 119, 185 | PR 23 commits via API: 1236f6e (2026-04-18) "BREAKING: field alignment per AP2 schema updates" renames `payment.*` to `mandate.payment.*` and `cnf.kid` to `cnf.jwk.kid`; ba1e409 adds `risk_data`, VCT `.1` suffixes, `constraint_policy`, `match_mode`. Merged 2026-04-20. |
| 129 to 132, 139 | `spec/credential-format.md` lines 42 to 45 and 165, 352: L2 Immediate about 15 minutes, L2 Autonomous 24 hours to 30 days, L3 about 5 minutes with a one-hour maximum. L1 about 1 year is stated as a recommendation in `spec/README.md` (SHOULD), so "at most one year" in the L1 table is slightly firmer than the spec. |
| 152 | `spec/constraints.md` registry lines 999 to 1006 lists exactly eight constraint types. |
| 058, 059, 054 | Europe release (Perspectives, 2026-06-02) lists 36 banks; LatAm release (2026-03-24) lists 17 participants. Counted by hand. |
| 064 | AP4M release participant list counts 32 names (Aave Labs through Utila, Mastercard Merchant Cloud included). |
| 198, 201 | AP4M release quotes Tempo ("Machine Payments Protocol compatibility") and Coinbase ("open standards like x402"); Mastercard's own text makes no MPP claim. Errata R39 holds. |
| 200 | x402 Foundation release lists Mastercard among premier members. |
| 203, 204, 205 | EMVCo news 2026-09-01: draft Framework for Specifications, feedback due Wednesday 30 September, Intent Services complementing Verifiable Intent, KYA and Agentic Transaction Indicators "may" be considered later. |
| 215, 243 | Level 1 guide sample code checks `['agent-browser-auth', 'agent-payer-auth']` only; the decision table lists `Agent-pay-auth` too. |

## Check 2: field names, headers, enums and identifiers

Extracted every name from the eight `<FieldTable>` blocks, the L3a example payload, the six Verifiable Intent (VI) flows, `multi-mastercard-token-in-checkout-form.json`, and the camelCase and hyphenated tokens in the other sidecars (about 120 distinct identifiers). Program identifiers were searched in the fetched Mastercard developer guides (Level 1, 2, 3, testing, MVCT, release history, llms-full). VI identifiers were grepped in `research/vendor/verifiable-intent` (`main` at 356c296, 2026-04-20) under `spec/`, `src/` and `examples/`. Result: 0 identifiers missing or misspelled.

| Group | Identifiers | Verdict | Evidence |
|---|---|---|---|
| Signature-Input | keyid, alg, created, expires, nonce, tag; examples ed25519, ecdsa-p256-sha256; components @authority, @path; header Signature-Agent | pass | Level 1 guide parameter table and example request |
| Tag values | Agent-pay-auth, agent-pay-auth (testing glossary), agent-browser-auth, agent-payer-auth, web-bot-auth | pass | Level 1 guide has `Agent-pay-auth` 9 times and never the lower-case form; testing glossary has `agent-pay-auth` once; `llms-full` has neither. |
| Agent User Identity | mastercardIdToken, signature, kid, nonce, alg; PS256, ES256 | pass | Level 2 guide |
| Payment Data | paymentData, signature, kid, nonce, alg | pass | Level 2 guide |
| Intent API | intentId, intentSummary, intentStatus (ACTIVE), digitalAccountCredentials, orders[].orderExecutionType (IMMEDIATE, DEFERRED), orderExpiry, orderTotalAmount, merchants[].srcDpaId, orderId, orderStatus, items, orderDeliveryDetails, itemId and the other item fields | pass | Level 3 guide tables and its zod schema |
| VI L1 | alg ES256, typ sd+jwt, kid, iss, sub, iat, exp, vct https://credentials.mastercard.com/card, cnf.jwk, pan_last_four, scheme, email | pass | `spec/credential-format.md` sections 3.3 and 3.4; `README.md` |
| VI L2 | typ kb-sd-jwt and kb-sd-jwt+kb, nonce, aud, iat, exp, sd_hash, delegate_payload, iss | pass | `spec/credential-format.md` |
| VI mandates | mandate.checkout.1, mandate.payment.1, mandate.checkout.open.1, mandate.payment.open.1; checkout_jwt, checkout_hash, payment_instrument, payment_amount, payee, transaction_id, risk_data | pass | `spec/credential-format.md`; `spec/constraints.md` |
| VI constraints | all eight registered keys, conditional_transaction_id, acceptable_items, match_mode, start_date, end_date, allowed_merchants | pass | `spec/constraints.md` registry lines 999 to 1006 |
| Example payload | `mastercard.srcDigitalCard`, `<B64U(SHA-256(checkout_jwt))>` | pass | `spec/credential-format.md` line 206 and `spec/constraints.md` line 1223 |
| Tag v0.1.0 names (the page's note) | payment.amount, payment.allowed_payee, mandate types without `.1` | pass | Fetched `blob/v0.1.0/spec/constraints.md` and `credential-format.md`: `payment.amount`, `payment.allowed_payee`, `mandate.payment.open` without suffix. Matches errata R40. |

Observations that are not identifier errors:

- The L1 table says `exp` "at most one year after iat" with required true; the spec phrases L1 lifetime as a recommendation (`spec/README.md` line 850 "SHOULD set L1 expiration to no more than 1 year"; `credential-format.md` section 7 "RECOMMENDED"). Soften to "about one year, recommended".
- L2 Immediate `exp` is a SHOULD of 15 minutes, so "Immediate 15 minutes" in the L2 table is the recommendation, not a limit.
- No JSON Schema exists for Agent Pay objects. The VI repository has no `.json` schema for the example payload, so schema validation with `ajv` was not applicable; the L3a example was checked field by field against `credential-format.md`.

## Check 3: dates, versions and numbers

| Item | Verdict | Evidence |
|---|---|---|
| `firstAnnounced` 2025-04-29 | pass | Business Wire release dated 2025-04-29 |
| `latestVersion` label "Verifiable Intent 0.1 (tag v0.1.0 on 2026-03-05 ...)" date 2026-04-20 | pass | Tag v0.1.0 on commit dated 2026-03-05T09:42:06Z; last commit 2026-04-20T19:06:41Z; 0 GitHub releases; spec headers `Version: 0.1-draft`, `Date: 2026-02-18`; CHANGELOG `0.1.0 - 2026-02-19` |
| `facts.changedRecently` and 23 `timeline.json` events | pass | Each date matched in the cited release or page: 2025-07-22 (toolkit repo created, API), 2025-09-10, 2025-10-01 (PayOS), 2025-10-16 (release history), 2025-10-24 (Cloudflare), 2025-10-27, 2025-12-03, 2026-01-28, 2026-03-02, 2026-03-03, 2026-03-05, 2026-03-17, 2026-03-24, 2026-04-20, 2026-04-28, 2026-06-02, 2026-06-10, 2026-07-17 (issue 29), 2026-09-01, 2026-09-30. 2025-10-30 depends on the unreachable transcript (reported). |
| `ecosystem.metrics` 36 banks, 17 issuers and processors, 32 AP4M names, "one in 10 consumers by 2030" | pass | Counted by hand in the releases; trust release says "one in 10 consumers projected to routinely use agents ... by 2030" |
| `ecosystem.metrics` VI stars 97 on 2026-10-11 | pass, drifted | GitHub API on 2026-10-13: 99 stars, 20 forks. The `asOf` label is correct; refresh at the next pass. |
| `@mastercard/developers-mcp` 0.1.7 | pass | npm registry `dist-tags.latest` 0.1.7 |
| Version labels vs tags | pass | Only one tag (`v0.1.0`) exists on the VI repository; the page's use of "0.1 Draft on main" with the tag caveat is accurate. |
| RFC 9421 February 2024; RFC 9901 November 2025 | pass | rfc-editor.org headers |

## Check 4: "Do not get wrong" (ATLAS_PROMPT.md 5.8)

| Item | Verdict | Where the page states it |
|---|---|---|
| Agent Pay is not AP2 | pass | `index.mdx` line 136 (section A) and line 646; `ste.mdx` line 9 ("It is not AP2."); claim 006 |
| "Agentic token" means different things at Visa and at Mastercard | pass | `index.mdx` line 144; `ste.mdx` line 101 ("Visa uses the same words for a different product"); claim 008 (Stripe blog says the tokens are "built by Mastercard and Visa", which supports separate products) |
| Most live transactions are controlled pilots | pass | `statusNote`, `index.mdx` line 617, ELI5 closing line, `faq.json` line 24, `ste.mdx` line 19; claims 211, 210. Wording follows errata R52 ("pilots or first transactions"). |

## Check 5: diagrams against the sources

| Diagram | Verdict | Note |
|---|---|---|
| `mastercard-agent-pay-level1-purchase` (edge verification then form fill) | pass | Matches the Level 1 verification checklist and the example request |
| `mastercard-agent-pay-failure-unknown-key` | pass | Decision table row 7: key not retrieved leads to "Block request" |
| `mastercard-agent-pay-edge-decision` (.mmd) | pass | Matches the nine-step checklist; it folds the created, expires and 8-minute rules into "window valid" |
| `mastercard-agent-pay-level3-intent`, `failure-intent-mismatch` | pass | Level 3 guide: reject if total exceeds `orderTotalAmount` or `srcDpaId` differs |
| `mastercard-agent-pay-vi-immediate`, `vi-autonomous`, `failure-vi-budget-exceeded`, `vi-layers` (.mmd) | pass | L3a to network, L3b to merchant, lifetimes, `transaction_id` equals `checkout_hash`, cumulative budget tracked by the network, all per `spec/README.md` and `spec/security-model.md` |
| `mastercard-agent-pay-stripe-spt` | pass | Stripe blog: agentic network tokens vaulted with Stripe and shared as SPTs |
| `mastercard-agent-pay-enrollment-provisioning` | pass with note | Step 1 says the developer "registers the public key in the Mastercard Agent Pay key directory during onboarding". Cloudflare and the Level 1 guide support registered public keys in a network directory; the registration process itself is not public. Add "(process not public)". |
| `mastercard-agent-pay-dtvc-guest-checkout` | fail (order) | Step 1 "Request checkout for merchant domain" comes before step 2 "User validation and consent", but the MVCT page says the DTVC is requested "following user validation and consent". Step 2's own detail says consent happens "before a security code is requested", which contradicts the numbering. Swap steps 1 and 2. |
| `mastercard-agent-pay-dtvc-guest-checkout` step 6 failure | fail (unsupported detail) | "Validation fails and the issuer is told" asserts an outcome. The MVCT page says only that the issuer is told whether DTVC validation was performed. Reword to "outcome and response code not published". |
| `multi-mastercard-token-in-checkout-form` | pass with note | Steps are labeled specified or live-not-shown correctly; step order matches the scenario. |
| State machine `mastercard-agent-pay-token-lifecycle` | pass | Titled "as described, not a published state model"; the `expired-or-revoked` state is marked inferred. No unsupported claim. |

## Check 6: specified versus deployed, stewardship, naming

| Item | Verdict | Evidence |
|---|---|---|
| Program is proprietary, Acceptance Framework spec not public | pass | Developer guides refer to the framework without publishing it |
| Verifiable Intent: Apache-2.0, maintained by Mastercard, contributed to FIDO on 2026-04-28 | pass | README "Maintained by Mastercard"; FIDO release 2026-04-28 (WebFetch) says Mastercard contributed VI, co-developed with Google |
| VI "live use" separated from "specified" | pass | Index line 637 and the scenario mark every VI step "specified; live use not shown publicly"; the only primary statement is Mastercard's 2026-03-24 "embedding Verifiable Intent directly into the payment flow" |
| Announced versus live | pass | US all-cardholder plan (2025-09-10) kept as "announced"; Europe network enablement kept apart from named pilots; no US completion claim |
| AP4M MPP compatibility is Tempo's statement | pass | Errata 2.1.2 and R39 applied on the page, FAQ, quiz, relations, compare cells and the `stripe-mpp` side. The relations note "maintains no MPP payment method" rests on absence: `research/vendor/mpp-specs/specs/methods` has card, evm, hedera, lightning, nearintents, solana, stellar, stripe, tempo, usdc and xrpl, and no Mastercard method. |
| Stewardship labels | pass | Bubble label "Agent Pay"; page shows Mastercard as steward and VI separately |

## Check 7: style gates

| Gate | Result |
|---|---|
| `pnpm lint:style` | 0 errors, 33 warnings repo-wide, of which 9 are long-sentence warnings in this page: `index.mdx` lines 150, 153, 564, 569, 571, 595 (a table row counted as one 127-word sentence), 612, 627, 632 |
| `pnpm lint:ste --protocol mastercard-agent-pay` | pass: 78 sentences, 0 errors, 0 warnings, 0 review |
| U+2014 grep across protocol folder, its flows, state, diagrams and the scenario | none |
| US spelling sample | no British forms found |
| Acronyms expanded on first use in `index.mdx` body | 4 fail: `JWKS` (line 355, table), `3DS` (line 638), `PCI` (line 572), `CBA` (line 609, table). `DSRP`, `CDN`, `PSP`, `KYA`, `AP4M`, `SPT`, `JWT`, `SD-JWT`, `EMVCo` and `FIDO` are expanded or glossed. |

## Check 8: coverage

`pnpm verify:coverage --protocol mastercard-agent-pay`: PASS (8 pass, 0 fail, 0 missing). 243 claims, 13 reported, 1 unverified; sections A to T present; ELI5 271 words; 19 diagrams; 30 resources; 23 tagged publications; 10 quiz questions; 15 flashcards; 34 of 34 compare cells; 14 of 14 controls cells.

## Errata rows and the writer's uncertain items

| Row or item | Verdict | Evidence |
|---|---|---|
| 2.1.2 and R39 (AP4M and MPP) | pass | AP4M release text: Tempo "excited to work with Mastercard on Machine Payments Protocol compatibility"; no MPP wording from Mastercard. Page attributes it to Tempo everywhere. |
| 2.1.11 (FIDO two working groups) | pass | WebFetch: Payments Working Group launched 2025-04-29 (Visa and Mastercard co-chair); on 2026-04-28 FIDO added the Agentic Authentication TWG and says the payments work is "chaired by members from Mastercard and Visa". Claim 016 states this. See the naming note in Check 1. |
| 2.2 (MDES never named) | partial fail | See clm-007 above. True for the launch, LatAm, Stripe and Level 1 to 3 pages; false as a blanket statement because `release-history` and `mvct-tests` name MDES (for Token Connect enrollment, M4M migration and existing MDES tokens). The follow-up allows "built on Mastercard tokenization" wording, which the page uses; fix only the "no page names MDES" sentences. |
| 2.3.3 (AP2 versus VI constraint names) | pass | AP2 `open_payment_mandate.json` and `research/vendor/AP2` use `payment.amount_range`; VI main uses `mandate.payment.amount_range`; page states "aligned semantics, different key prefixes" (claim 184, quiz question 8) |
| R40 | pass | See Check 2 |
| R41 | pass | DTVC is described as a one-time code issued with a Virtual Card Token; "Validation" appears in the MVCT overview, "Verification" in the test cases and release history |
| R42 | pass | One Mastercard tag in the guides: `Agent-pay-auth`. Spelling: Level 1 guide capital A throughout; testing glossary lower case. Only one Mastercard tag exists in all fetched Mastercard pages; `agent-browser-auth` and `agent-payer-auth` are Visa's. Whether verifiers compare case-sensitively is not stated; RFC 9421 tag values are strings, so a case-sensitive match is the safe reading, which the scenario's "wrong tag spelling" risk reflects. |
| R43 | pass | `agentpay-key-directory.mastercard.com`: NXDOMAIN on 2026-10-13 (nslookup); Cloudflare names none |
| R44 | pass | Latin America release: Acceptance Framework "launched in October 2025"; Trust Framework release links no white paper (checked the PDF text) |
| R45 | pass | CHANGELOG 2026-02-19; tag on 2026-03-05 commit |
| R52 | pass | Page uses "pilots or first transactions" with sources; the Q3 call remark is `reported` |
| Writer item 1: tag spelling and number of tags | resolved | One Mastercard tag; capitalization differs between two Mastercard pages; the page says so (index line 634). |
| Writer item 2: is Verifiable Intent checked in any live authorization | unsupported by any public source, correctly hedged | Only Mastercard's statement of 2026-03-24 that it is "embedding Verifiable Intent directly into the payment flow" and PYMNTS (2026-03-05) "integration into Agent Pay's intent APIs is expected in the coming months". GitHub shows no commit after 2026-04-20 and issue 29 (open, no comments) says a current library rejects every L2 credential. Index line 637 is right. |
| Writer item 3a: agent flag in authorization messages (a Stripe statement) | partly overstated | Stripe (2026-03-03): agentic network tokens "add additional information in the authorization message for the issuers to make informed authorization and provisioning decisions". Stripe does not say "agent flag" or "agent information". Index line 573 says "adds agent information to the authorization message" and `open-questions.json` asks about "the agent flag". Reword to Stripe's "additional information". The trust release's probability score is the only support for "not reliably marked", and that is the page's inference, labeled as such. |
| Writer item 3b: US issuer rollout completion | unreachable / unconfirmed | The 2025-09-10 release says all US cardholders "by the holiday season". The November remainder comes from the unreachable Q3 transcript. Mastercard newsroom search returns 403. No fetched source confirms completion; index line 617 says so. Correct. |

## Scenario: `src/content/scenarios/mastercard-token-in-checkout-form.mdx`

| Item | Verdict | Note |
|---|---|---|
| Claims cited (about 45 Cite ids) | pass | All exist in `claims.json`, each checked in Check 1 (including 149, 177, 124, 189) |
| Title and summary say "agentic token", but steps 6 and 7 use a Virtual Card Token with a DTVC | fail (wording) | Claim 105 and step 7 say a DTVC is "not an agentic token itself", and the Mastercard MVCT page is a separate tokenization program. Retitle to "A Mastercard virtual card token and DTVC in an existing checkout form" or state in the summary that the token here is a Virtual Card Token, and that the agentic-token variant is in "Variants". The flow `multi-mastercard-token-in-checkout-form.json` title has the same wording. |
| Step 4 | pass | Sample code accepts only the two Visa tags (claim 215), so "would reject this agent" is correct |
| Step 5 | pass | `checkout_jwt` schema and verification are implementation-defined (`credential-format.md` line 475) |
| Step 10 | pass | VI transport is out of scope (README) |
| Controls section | pass | Claims 076, 077, 152, 173, 243, 221, 174, 168 verified |
| `lastVerified` 2026-10-11 | pass | |

## Required fixes (priority order)

1. `src/content/protocols/mastercard-agent-pay/claims.json` clm-216: downgrade to `reported`, or add a primary source (the GitHub repo, `src-mcap-vi-gh-repo`, if the claim concerns the repository). 
2. MDES wording, in `claims.json` clm-007, `facts.json` line 10, `faq.json` lines 34 to 35, `flashcards.json` line 15 and `resources.json` line 363: replace "no Mastercard page read names MDES" with "Mastercard's launch, regional and developer-guide pages describe agentic tokens as built on Mastercard tokenization and do not name MDES; developer pages mention MDES only for Virtual Card Tokens and Token Connect enrollment".
3. `src/content/flows/mastercard-agent-pay-dtvc-guest-checkout.json`: swap steps 1 and 2 (consent first, then the Checkout request); change the step 6 failure outcome to "outcome and response code not published".
4. `src/content/scenarios/mastercard-token-in-checkout-form.mdx` and `src/content/flows/multi-mastercard-token-in-checkout-form.json`: title and summary should say Virtual Card Token and DTVC, not agentic token.
5. `index.mdx` line 573 and `open-questions.json` line 46: replace "agent information" and "agent flag" with Stripe's "additional information in the authorization message".
6. `claims.json` clm-217: reword so it does not call the release history the only primary record; the Level 1 to 3 guides are primary and were readable. Say the use-case page `use-cases/agent-pay/index.md` returned 404 on 2026-10-13. `index.mdx` line 601 repeats the HTML-shell point; keep it.
7. `claims.json` clm-195: state that release v2026-08-25 notes spell the extension `ap2_mandates` while the schema at main is `dev.ucp.common.payment.ap2_mandate`; cite the release note as a source.
8. `claims.json` clm-036: drop "no-code" or attribute it to the unreachable transcript; PYMNTS supports "participate without significant development or integration".
9. `index.mdx`: expand `JWKS` (line 355), `3DS` (line 638), `PCI` (line 572) and `CBA` (line 609) on first use.
10. `index.mdx` L1 table: soften "exp at most one year after iat" and "Immediate 15 minutes" to recommendations (SHOULD).
11. `ecosystem.json` metric `mcap-vi-stars`: refresh to 99 stars and 20 forks on 2026-10-13 at the next data pass.
12. `mastercard-agent-pay-enrollment-provisioning.json` step 1: add "(registration process not public)".

## Blocked or unreachable sources

| Source | Status | Affects |
|---|---|---|
| `insidermonkey.com` Q3 2025 earnings transcript (`src-mcap-q3-transcript`) | sign-up wall; curl and WebFetch return only the operator preamble | clm-034, 035, 036 (kept `reported`); timeline 2025-10-30 |
| `mastercard.com` (US news search) | 403 to WebFetch | US issuer rollout completion |
| `fidoalliance.org` pages | 403 to curl, readable through WebFetch | none (verified via WebFetch) |
| `src-mcap-mcc-fees` | 403 | listed source only; no cited claim read from it |
| DOI links for chip-and-pin, chip-and-skim, EMV break-fix-verify, relay-protection papers, and Rochet and Tirole | curl returned 202 or 403 with no body | publications list was outside the scope of this pass |
| `developer.mastercard.com/.../use-cases/agent-pay/index.md` | 404 | current Agent Pay page content (page already states this) |
| `pypi.org/pypi/verifiable-intent/json` | 404 (supports clm-125) | none |
