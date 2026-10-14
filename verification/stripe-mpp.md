# Verification report: stripe-mpp

Verifier: independent verifier agent, 2026-10-13. Scope per `docs/briefs/VERIFIER_BRIEF.md` and ATLAS_PROMPT.md Section 5.6, plus the MPP errata rows. Vendor clones read at mpp-specs 50309c8 (2026-10-05), mppx d8d800f (2026-10-09), mpp 6c5a0c6 (2026-10-07). Live APIs queried on 2026-10-13.

Status: complete. 0 claim failures, 0 wrong identifiers, 0 wrong dates, 0 "Do not get wrong" failures, 0 diagram issues. Only low-severity polish items remain (see Required fixes).

## Summary

| Check | Pass | Fail | Unreachable |
|---|---|---|---|
| 1. Claims against sources (113 claims) | 113 | 0 | 0 |
| 2. Identifiers (137) | 137 | 0 | 0 |
| 3. Dates, versions, numbers (26 timeline events, 8 changedRecently, 9 metrics, 5 SDK versions, frontmatter) | all | 0 | 0 |
| Errata rows (2.1.1, 2.1.2, 2.1.12, R26 to R34, R39, R47: 15 rows) | 15 | 0 | 0 |
| Six security advisories | 6 | 0 | 0 |
| 4. Do not get wrong (4 items) | 4 | 0 | 0 |
| 5. Diagrams and flows (8 flows, 1 state machine, 7 diagrams) | all | 0 | 0 |
| 6. Specified vs deployed, stewardship | pass | 0 | 0 |
| Scenario `metered-inference.mdx` | pass | 0 | 0 |
| 7. Style gates | lint:style 0 errors (7 length warnings); lint:ste pass; 0 em dashes | 9 acronym first-use gaps (low) | 0 |
| 8. Coverage | 8 pass, 0 fail, 0 missing | 0 | 0 |

## Check 1. Claims against sources

Scope: the 83 distinct claim ids referenced from `index.mdx` frontmatter, `facts.json`, `faq.json`, `quiz.json` and `flashcards.json`, plus 30 random claims from `claims.json` (pool 211, seed 26). Total 113 claims.

Result: 113 pass, 0 fail, 0 unreachable. Advisory notes (not failures):
- Several claims quote live numbers that drift daily (mpp.dev directory 129 to 130 services, MPPScan 7-day and 30-day windows). Each is dated 2026-10-11 in the claim text or asOf, so the claim stays correct.
- clm-stripe-mpp-024 (draft expiry 2027-03-13) and clm-stripe-mpp-133 (40 findings) carry a number or date and no `asOf`. Both are stable facts about a fixed record, so low severity; adding `asOf: 2026-10-11` would satisfy the brief's rule literally. Dozens of other claims in the pool state a historical event date without `asOf`; they are not time-sensitive, and I did not count them as failures.
- clm-stripe-mpp-183 asOf 2026-03-18: the Visa page shows no visible date; the date rests on the page tying itself to the Tempo mainnet launch.
- clm-stripe-mpp-203 and 202 cite `src-mcap-ap4m-2026`, which lives in `src/content/sources/sources.json`, not in the protocol's own `sources.json`. See the `verify:citations` result in check 7 or 8.
- No verified claim rests only on non-primary sources. The one reported claim with a non-primary source (clm-stripe-mpp-165, Yahoo Finance) is correctly labelled `reported`.

| Claim | Group | Verdict | Evidence (vendor path under research/vendor/ or URL) |
|---|---|---|---|
| clm-stripe-mpp-002 | keyFacts/facts/faq/quiz/flashcards | pass | mpp.dev governance page line 11 and Stripe blog ("co-authored by Tempo and Stripe"); specs README |
| clm-stripe-mpp-003 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs README line 11 and LICENSE.md name Tempo and Stripe |
| clm-stripe-mpp-004 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md author block lines 12-35: Ryan, Moxey, Meagher (Tempo Labs); Weinstein, Kaliski (Stripe) |
| clm-stripe-mpp-006 | keyFacts/facts/faq/quiz/flashcards | pass | Datatracker API: group 1027 "Individual Submissions" (acronym none), stream null, intended_std_level null |
| clm-stripe-mpp-008 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs LICENSE.md (CC0 1.0 for specs/) and README lines 74-76 (Apache-2.0 or MIT) |
| clm-stripe-mpp-009 | keyFacts/facts/faq/quiz/flashcards | pass | npm registry license MIT; mppx/package.json line 83 |
| clm-stripe-mpp-010 | keyFacts/facts/faq/quiz/flashcards | pass | mpp/src/pages/governance.mdx lines 13-29 |
| clm-stripe-mpp-011 | keyFacts/facts/faq/quiz/flashcards | pass | Negative claim; governance.mdx describes no foundation, charter or committee; none found in the three repos |
| clm-stripe-mpp-014 | keyFacts/facts/faq/quiz/flashcards | pass | Stripe blog dated March 18, 2026; Tempo mainnet post dated Mar 18, 2026 |
| clm-stripe-mpp-015 | keyFacts/facts/faq/quiz/flashcards | pass | Tempo mainnet post: "our design partner Visa has already extended MPP to support card-based payments" |
| clm-stripe-mpp-017 | keyFacts/facts/faq/quiz/flashcards | pass | Tempo mainnet post: "working with partners including Anthropic, DoorDash, Mastercard, ... Visa to bring these use cases onto mainnet" |
| clm-stripe-mpp-018 | keyFacts/facts/faq/quiz/flashcards | pass | Methods exist: stripe-charge, card-charge, lightning-charge spec files; Stripe blog (cards and BNPL via SPTs) |
| clm-stripe-mpp-019 | keyFacts/facts/faq/quiz/flashcards | pass | research/vendor/AP2/docs/glossary.md line 19 defines Merchant Payment Processor (MPP) |
| clm-stripe-mpp-022 | keyFacts/facts/faq/quiz/flashcards | pass | Datatracker docevent expired_document 2026-09-18T07:09:06Z for draft-ryan-httpauth-payment |
| clm-stripe-mpp-023 | keyFacts/facts/faq/quiz/flashcards | pass | Datatracker newrevisiondocevent draft-httpauth-payment rev 00 2026-06-19T18:09:03Z; draft-ryan rev 01 was active until 2026-09-18 |
| clm-stripe-mpp-024 | keyFacts/facts/faq/quiz/flashcards | pass | Datatracker rev 01 2026-09-09T16:08:12Z, expires 2027-03-13T16:08:12Z. Note: expiry date is time-sensitive and the claim has no asOf (advisory, low) |
| clm-stripe-mpp-025 | keyFacts/facts/faq/quiz/flashcards | pass | Datatracker: -00 on 2026-06-19 under the new name; -01 on 2026-09-09; mpp-specs PR #351 merged 2026-09-09 ("renew IETF draft") |
| clm-stripe-mpp-028 | keyFacts/facts/faq/quiz/flashcards | pass | gh api repos/tempoxyz/mpp-specs created_at 2026-01-05T22:26:21Z; earliest commit 2026-03-18T14:06:38Z |
| clm-stripe-mpp-038 | keyFacts/facts/faq/quiz/flashcards | pass | gh api pulls/346 merged_at 2026-09-08T10:58:23Z |
| clm-stripe-mpp-039 | keyFacts/facts/faq/quiz/flashcards | pass | gh api pulls/230 merged_at 2026-07-29T16:11:10Z |
| clm-stripe-mpp-041 | keyFacts/facts/faq/quiz/flashcards | pass | mpp blog sessions-improved publishedAt 2026-06-17; gh api pulls/278 merged_at 2026-06-25T17:55:22Z |
| clm-stripe-mpp-042 | keyFacts/facts/faq/quiz/flashcards | pass | gh api pulls/328 merged_at 2026-08-25T16:26:28Z; core lines 239-262 |
| clm-stripe-mpp-045 | keyFacts/facts/faq/quiz/flashcards | pass | npm time 0.9.0 = 2026-08-27T03:10Z; mppx CHANGELOG lines 185-199 (dual wrappers, requiresAuth) |
| clm-stripe-mpp-046 | keyFacts/facts/faq/quiz/flashcards | pass | npm dist-tags latest 0.13.4, time 2026-10-08T19:46:24Z; mppx/package.json version 0.13.4 |
| clm-stripe-mpp-048 | keyFacts/facts/faq/quiz/flashcards | pass | gh api pulls/280 state closed, merged_at null, closed_at 2026-09-28T17:30:21Z |
| clm-stripe-mpp-049 | keyFacts/facts/faq/quiz/flashcards | pass | ls mpp-specs/specs/intents shows only charge and subscription drafts |
| clm-stripe-mpp-055 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 273-330 |
| clm-stripe-mpp-056 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md optional params digest, expires, description, header, opaque (lines 296-340) |
| clm-stripe-mpp-057 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md request param: base64url, JCS RFC 8785 |
| clm-stripe-mpp-058 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 358-366 ("description ... is excluded") |
| clm-stripe-mpp-059 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 380-440 (pipe-joined slots, header slot optional) |
| clm-stripe-mpp-060 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 331-337, 584-592 |
| clm-stripe-mpp-061 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 239-266 (Bearer plus Payment-Authorization example) |
| clm-stripe-mpp-062 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 606-630 (challenge, source with DID recommended, payload) |
| clm-stripe-mpp-063 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 700-725 (status, method, timestamp, reference; status MUST be success) |
| clm-stripe-mpp-064 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md line 725 |
| clm-stripe-mpp-066 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 780-830 (q weights, wildcards, q=0) |
| clm-stripe-mpp-067 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md line 826 |
| clm-stripe-mpp-068 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 839-848 |
| clm-stripe-mpp-070 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/intents/draft-payment-intent-charge-00.md lines 149-161 |
| clm-stripe-mpp-072 | keyFacts/facts/faq/quiz/flashcards | pass | draft-payment-intent-subscription-00.md lines 204-242 |
| clm-stripe-mpp-073 | keyFacts/facts/faq/quiz/flashcards | pass | draft-payment-intent-subscription-00.md lines 405, 433 |
| clm-stripe-mpp-075 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/methods/tempo/draft-tempo-session-00.md actions open, topUp, voucher, close (lines 127-156, 459) |
| clm-stripe-mpp-076 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/methods/tempo/draft-tempo-session-00.md lines 265, 445-448 (cumulative, not delta) |
| clm-stripe-mpp-082 | keyFacts/facts/faq/quiz/flashcards | pass | 11 method directories under specs/methods: tempo, stripe, card, lightning, evm, solana, stellar, hedera, usdc, nearintents, xrpl |
| clm-stripe-mpp-084 | keyFacts/facts/faq/quiz/flashcards | pass | draft-card-charge-00.md author Jacob Brans, org Visa |
| clm-stripe-mpp-085 | keyFacts/facts/faq/quiz/flashcards | pass | draft-lightning-charge-00.md and -session-00.md authors from Lightspark |
| clm-stripe-mpp-086 | keyFacts/facts/faq/quiz/flashcards | pass | draft-usdc-charge-00.md authors from Circle Internet Group, Inc. |
| clm-stripe-mpp-087 | keyFacts/facts/faq/quiz/flashcards | pass | evm charge authors MegaETH Labs, Coinbase, Monad Foundation; evm session authors OKG |
| clm-stripe-mpp-088 | keyFacts/facts/faq/quiz/flashcards | pass | session specs exist for tempo, evm, solana, hedera, lightning, xrpl |
| clm-stripe-mpp-089 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 1098-1145 |
| clm-stripe-mpp-090 | keyFacts/facts/faq/quiz/flashcards | pass | IANA http-authschemes page contains no "Payment" (grep count 0) on 2026-10-13 |
| clm-stripe-mpp-091 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 105-160 |
| clm-stripe-mpp-093 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 176, 194 |
| clm-stripe-mpp-102 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/methods/tempo/draft-tempo-session-00.md lines 1488-1500 (captureAmount = max(spent, settledOnChain)) |
| clm-stripe-mpp-103 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/methods/tempo/draft-tempo-session-00.md lines 394-396, 500-527 |
| clm-stripe-mpp-104 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/methods/tempo/draft-tempo-session-00.md line 1510 |
| clm-stripe-mpp-105 | keyFacts/facts/faq/quiz/flashcards | pass | draft-payment-intent-subscription-00.md lines 318-324, 411 |
| clm-stripe-mpp-108 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/methods/tempo/draft-tempo-session-00.md lines 224-233 |
| clm-stripe-mpp-110 | keyFacts/facts/faq/quiz/flashcards | pass | draft-payment-transport-mcp-00.md lines 259-268 |
| clm-stripe-mpp-112 | keyFacts/facts/faq/quiz/flashcards | pass | draft-payment-transport-mcp-00.md lines 667-685 |
| clm-stripe-mpp-115 | keyFacts/facts/faq/quiz/flashcards | pass | draft-payment-discovery-01.md lines 105-160 |
| clm-stripe-mpp-118 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 961-970 |
| clm-stripe-mpp-119 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 315-320, 554-575 |
| clm-stripe-mpp-120 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/methods/tempo/draft-tempo-session-00.md lines 89, 201, 550 (EIP-712, secp256k1 low-s) |
| clm-stripe-mpp-121 | keyFacts/facts/faq/quiz/flashcards | pass | draft-card-charge-00.md lines 244-318, 482 (RSA-OAEP-256 JWE; MUST NOT parse) |
| clm-stripe-mpp-122 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 974-980 |
| clm-stripe-mpp-126 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/methods/tempo/draft-tempo-session-00.md line 1294 (amount-exceeds-deposit), lines 1494-1500 |
| clm-stripe-mpp-134 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md has no agent identity field; mpp blog mppx-identity-support (2026-08-12) |
| clm-stripe-mpp-136 | keyFacts/facts/faq/quiz/flashcards | pass | charge intent line 307 (card chargebacks); Stripe stablecoin page "Dispute support No" |
| clm-stripe-mpp-154 | keyFacts/facts/faq/quiz/flashcards | pass | Stripe MPP docs show Frontier badge and Stripe-Version 2026-07-29.preview |
| clm-stripe-mpp-167 | keyFacts/facts/faq/quiz/flashcards | pass | Stripe stablecoin page: 10,000 USD per transaction, dispute support No, refunds to original wallet |
| clm-stripe-mpp-177 | keyFacts/facts/faq/quiz/flashcards | pass | mpp/src/pages/mpp-vs-x402.mdx lines 28-30 |
| clm-stripe-mpp-178 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-vs-x402.mdx lines 32, 76 |
| clm-stripe-mpp-179 | keyFacts/facts/faq/quiz/flashcards | pass | mpp-vs-x402.mdx line 76; mppx CHANGELOG 0.9.0 |
| clm-stripe-mpp-183 | keyFacts/facts/faq/quiz/flashcards | pass | Visa page: "built on top of ... Visa Intelligent Commerce and the Trusted Agent Protocol"; page carries no visible date, so asOf 2026-03-18 rests on the mainnet-launch reference (low) |
| clm-stripe-mpp-186 | keyFacts/facts/faq/quiz/flashcards | pass | Stripe blog: MPP via Shared Payment Tokens; SPT docs shared with agentic commerce |
| clm-stripe-mpp-187 | keyFacts/facts/faq/quiz/flashcards | pass | grep for Machine Payments Protocol, mpp.dev, paymentauth, tempoxyz over ucp*, acp, AP2, ERCs, erc-8004*, mastercard toolkit: no MPP-protocol hits (AP2 hits are Merchant Payment Processor) |
| clm-stripe-mpp-191 | keyFacts/facts/faq/quiz/flashcards | pass | draft-card-charge-00.md lines 242, 401 list mastercard as network; no Mastercard method directory |
| clm-stripe-mpp-194 | keyFacts/facts/faq/quiz/flashcards | pass | governance.mdx line 19 "submitted to the IETF standards track"; Datatracker individual submission, no stream |
| clm-stripe-mpp-195 | keyFacts/facts/faq/quiz/flashcards | pass | sessions-improved.mdx lines 23, 56 "formal MPP intent" linking PR #280; PR #280 closed unmerged |
| clm-stripe-mpp-202 | keyFacts/facts/faq/quiz/flashcards | pass | AP4M release PDF (read via PDFKit): Dan Romero, Tempo: "excited to work with Mastercard on Machine Payments Protocol compatibility"; body text has no MPP mention |
| clm-stripe-mpp-203 | keyFacts/facts/faq/quiz/flashcards | pass | Negative claim, same release; no Tempo page found. Source id src-mcap-ap4m-2026 lives in src/content/sources/sources.json, not the protocol's sources.json (verify:citations will tell) |
| clm-stripe-mpp-012 | random sample | pass | governance.mdx line 33 and mppx custom payment methods |
| clm-stripe-mpp-016 | random sample | pass | Tempo mainnet post: Stripe extended it for cards, wallets; Lightspark for Bitcoin over Lightning |
| clm-stripe-mpp-021 | random sample | pass | Datatracker newrevisiondocevent draft-ryan rev 01 2026-03-18T02:45:29Z |
| clm-stripe-mpp-035 | random sample | pass | gh api pulls/251 merged 2026-05-14T21:27Z; pulls/258 merged 2026-08-07T22:42Z |
| clm-stripe-mpp-037 | random sample | pass | gh api pulls/284 merged 2026-06-21T20:33Z; first commit for nearintents path |
| clm-stripe-mpp-044 | random sample | pass | gh api mppx pulls/732 merged 2026-08-04T22:34Z; npm 0.8.17 2026-08-10T17:07Z; blog publishedAt 2026-08-12 |
| clm-stripe-mpp-052 | random sample | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md line 1044 |
| clm-stripe-mpp-053 | random sample | pass | draft-card-charge-00.md lines 77-101, 144-168 |
| clm-stripe-mpp-065 | random sample | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md line 737 (1*LOWERALPHA) and line 1127 |
| clm-stripe-mpp-074 | random sample | pass | mpp-specs/specs/methods/tempo/draft-tempo-session-00.md lines 575-615 |
| clm-stripe-mpp-113 | random sample | pass | draft-payment-transport-mcp-00.md lines 166-216 |
| clm-stripe-mpp-114 | random sample | pass | mpp-specs/specs/methods/tempo/draft-tempo-session-00.md lines 1534-1545 |
| clm-stripe-mpp-117 | random sample | pass | draft-payment-discovery-01.md lines 89, 121 |
| clm-stripe-mpp-123 | random sample | pass | mpp-specs/specs/core/draft-httpauth-payment-01.md lines 998-1000; charge intent lines 252-258 |
| clm-stripe-mpp-130 | random sample | pass | GitHub advisory API: GHSA-fxc9-7j2w-vx54, critical, crates mpp < 0.8.0, patched 0.8.0, cve_id null; description lists the seven behaviors |
| clm-stripe-mpp-133 | random sample | pass | arXiv abs page: Tamarin, x402, MPP, ACP, AP2, 86 cases, 46 known, 40 previously undocumented. No asOf (advisory, fixed v1 paper) |
| clm-stripe-mpp-140 | random sample | pass | Only .well-known hits in discovery draft are about A2A and x402 (lines 782, 805); none defined by MPP |
| clm-stripe-mpp-147 | random sample | pass | Directory API on 2026-10-13 returns 130 services (tempo 127, stripe 10, evm 1). Claim is dated 2026-10-11 with 129/126/10/1; drift of one new listing, not an error |
| clm-stripe-mpp-150 | random sample | pass | Stripe Sessions 2026 post (April 29): MPP in stablecoins and cards, Klarna and Affirm via SPTs on Payment Intents API |
| clm-stripe-mpp-152 | random sample | pass | Cloudflare MPP page, last updated Aug 5, 2026: "MPP is backwards-compatible with x402" |
| clm-stripe-mpp-156 | random sample | pass | Tempo fees page: "Tempo has no native token"; fees in stablecoins via Fee AMM |
| clm-stripe-mpp-157 | random sample | pass | Tempo consensus page: Simplex BFT, deterministic finality, blocks about every 600 ms |
| clm-stripe-mpp-159 | random sample | pass | Tempo TIP-20 spec: "Always returns 6 for TIP-20 tokens" |
| clm-stripe-mpp-160 | random sample | pass | tempo-charge line 166 default 42431; tempo-session line 613 default 4217; tempo-subscription line 215 "42431 (Tempo mainnet)" |
| clm-stripe-mpp-163 | random sample | pass | Stripe MPP docs: hostedFeePayer needs mppx 0.9.2 or later, live mode, deposit address and key on same account, not with Connect |
| clm-stripe-mpp-165 | random sample | pass | reported: Yahoo Finance headline on 1.5 percent fee, no MPP mention; correctly labeled reported with NP source |
| clm-stripe-mpp-168 | random sample | pass | unverified negative; no SPT price on Stripe SPT docs (public preview) |
| clm-stripe-mpp-170 | random sample | pass | Core and intent drafts define no protocol fee field (grep fee in core: none normative) |
| clm-stripe-mpp-172 | random sample | pass | MPPscan tRPC protocolStats timeframeDays=30; value moves daily (2026-10-13: 960,520 tx, 8,837 USD); the claim is dated |
| clm-stripe-mpp-173 | random sample | pass | MPPscan 7-day window moves daily (2026-10-13: 125,063 tx, 1,454 USD); the claim is dated 2026-10-11 |

## Check 2. Field names, headers, enums, endpoints, events and error codes

Method: extracted every identifier from the `<FieldTable>` blocks and `<Mode spec>` backticks in `index.mdx`, from all eight flow payloads and step texts (`src/content/flows/stripe-mpp-*.json`), and from `observability.json` and `security.json`. 129 distinct tokens plus 8 extras (TransferWithMemo, Transfer, settle, timeframeDays, stats.protocolStats, x-service-info, x-payment-info, Idempotent-Replayed) = 137 identifiers. Each was grepped (fixed string) across `research/vendor/mpp-specs/specs`, `mpp-specs/pages`, `mppx/src`, `mppx/CHANGELOG.md`, `mpp/src` and `mpp/schemas`. The short generic words (id, type, name, code) were then re-checked in the right file by context. Problem types, MCP codes, session problem types and the method-specific fields (acceptedCumulative, minVoucherDelta, supportedModes, panLastFour, encryptionJwk, jwksUri, kid, merchantName, networkId, paymentMethodTypes, spt, feePayer, authorizedSigner, splits, operator) were grepped per owning spec file.

Result: 137 checked, 0 wrong. Three needed a non-vendor check:

| Identifier | Verdict | Evidence |
|---|---|---|
| `timeframeDays`, `stats.protocolStats` | pass (live) | Not in any cloned repo. `GET https://www.mppscan.com/api/trpc/stats.protocolStats?input={"json":{"timeframeDays":7}}` returned totals on 2026-10-13; timeframeDays 0, 7 and 30 all accepted |
| `capabilities.experimental.payment.methods` | pass | Compound path; `draft-payment-transport-mcp-00.md` lines 166-216 show `capabilities.experimental.payment.methods` |
| `specs/core/draft-httpauth-payment-01.md` | pass | File path, exists |

| Group | Identifiers | Verdict | Evidence |
|---|---|---|---|
| Challenge auth-params | id, realm, method, intent, request, digest, expires, description, header, opaque | pass | `core/draft-httpauth-payment-01.md` lines 273-340 |
| Credential and receipt | challenge, source, payload, status, method, timestamp, reference, subscriptionId | pass | core lines 606-725; `intents/draft-payment-intent-subscription-00.md` line 433 |
| Headers | WWW-Authenticate, Authorization, Payment-Authorization, Payment-Receipt, Accept-Payment, Cache-Control, Idempotency-Key | pass | core lines 105-120, 702, 780, 1012, 1071 |
| Problem types (11) | payment-required, payment-insufficient, payment-expired, verification-failed, method-unsupported (400), malformed-credential, invalid-challenge, bad-request (400), invalid-payload, internal-payment-error (500), payment-action-required | pass | core Error Codes table lines 852-863; statuses match the page text at `index.mdx` line 201 |
| Intent request fields | amount, currency, recipient, description, externalId, methodDetails, periodUnit, periodCount, subscriptionExpires | pass | charge intent lines 149-161; subscription intent lines 204-242 |
| Tempo session | action (open, topUp, voucher, close), channelId, cumulativeAmount, signature, unitType, suggestedDeposit, escrowContract, chainId, sessionProtocol, acceptedCumulative, spent, txHash, requestClose, withdraw, settle, open(payee, token, deposit, salt, authorizedSigner), CloseRequestCancelled | pass | `methods/tempo/draft-tempo-session-00.md` lines 127-156, 224-233, 420-527, 575-615, 1548-1562 |
| Session problem types (8) | session/amount-exceeds-deposit, challenge-not-found, channel-finalized, channel-not-found, delta-too-small, insufficient-balance, invalid-signature, signer-mismatch | pass | `draft-tempo-session-00.md` problem table lines 1294-1300 and IANA table 1820 |
| Tempo charge and subscription | supportedModes, feePayer, splits, memo, accessKey, accessKeyAddress, keyType, keyAuthorization, type "transaction" and "hash" | pass | `draft-tempo-charge-00.md` lines 79-184; `draft-tempo-subscription-00.md` lines 211-345 |
| stripe and card methods | networkId, paymentMethodTypes, spt, externalId, shared_payment_granted_token, metadata.challenge_id, acceptedNetworks, merchantName, encryptionJwk, jwksUri, kid, encryptedPayload, network, panLastFour, panExpirationMonth, panExpirationYear | pass | `methods/stripe/draft-stripe-charge-00.md` lines 124-289; `methods/card/draft-card-charge-00.md` lines 242-482 |
| MCP transport | -32042, -32043, -32602, -32603, httpStatus, challenges, _meta, org.paymentauth/credential, org.paymentauth/receipt | pass | `extensions/transports/draft-payment-transport-mcp-00.md` lines 259-446, 667-685 |
| Discovery | /openapi.json, x-service-info, x-payment-info | pass | `extensions/draft-payment-discovery-01.md` lines 105-160 |
| Method ids (11) | tempo, stripe, card, lightning, evm, solana, stellar, hedera, usdc, nearintents, xrpl | pass | `ls specs/methods` |
| SDK and misc | Idempotent-Replayed, TransferWithMemo | pass | `mppx/CHANGELOG.md` line 877, `mppx/src/stripe/server/Charge.ts` line 384; Tempo token spec (memo) in charge draft |

Schema validation: the only JSON Schema in the clones is `mpp/schemas/discovery.schema.json` (services registry). No page or flow payload is a registry record, so there was nothing to validate with `ajv`. Illustrative payloads were compared field by field to the tables above instead: the Tempo charge credential (`type: transaction`), the Tempo subscription request, the session voucher and the `payment-need-voucher` data all match the spec shapes. One cosmetic point: the SSE receipt example in `stripe-mpp-tempo-session.json` step 10 lists `method, intent, status, reference, channelId, acceptedCumulative, spent, txHash`; the spec's receipt table also has `timestamp` and `challengeId`, which the example omits. Illustrative, not a failure.

## Check 3. Dates, versions and numbers

Every `timeline.json` event (26), `facts.changedRecently` (8), frontmatter dates and `ecosystem.metrics` (9) were checked against Datatracker, GitHub, npm and the live pages.

| Item | Verdict | Evidence |
|---|---|---|
| 2026-01-05 specs repo created | pass | `gh api repos/tempoxyz/mpp-specs` created_at 2026-01-05T22:26:21Z |
| 2026-02-12 mppx package created | pass | npm `time.created` 2026-02-12T23:38:06Z |
| 2026-02-16 draft-ryan -00 | pass | Datatracker newrevisiondocevent 2026-02-16T00:31:03Z (the page notes the evening of 2026-02-15 US time) |
| 2026-03-18 launch (Stripe blog, Tempo mainnet post, draft-ryan -01) | pass | both posts dated March 18, 2026; draft-ryan rev 01 2026-03-18T02:45:29Z |
| 2026-03-24 Solana charge merged | pass | first commit for `solana/draft-solana-charge-00.md` 2026-03-24T16:35:15Z |
| 2026-03-26 advisories and 0.4.11 | pass | GHSA published 2026-03-26T20:56 to 21:33Z; npm 0.4.11 2026-03-26T21:19Z |
| 2026-03-29 Rust advisory | pass | GHSA-fxc9-7j2w-vx54 published_at 2026-03-29T15:20:45Z |
| 2026-03-31 NVD publication (detail text) | pass | NVD API: CVE-2026-34209 and -34210 published 2026-03-31T15:16Z |
| 2026-04-13 Accept-Payment merged | pass | `gh api pulls/231` merged 2026-04-13T21:54:52Z |
| 2026-04-17 EVM charge merged | pass | first commit for `evm/draft-evm-charge-00.md` 2026-04-17T05:01Z |
| 2026-04-29 Stripe Sessions | pass | post header "April 29" |
| 2026-05-12 subscriptions blog and mppx 0.6.20 | pass | blog `publishedAt: "2026-05-12"`; npm 0.6.20 2026-05-12T21:33Z |
| 2026-06-02 mppx 0.6.29 x402 exact | pass | npm 0.6.29 2026-06-02; CHANGELOG line 531 "EVM charge support with x402 exact compatibility" is under 0.6.29 |
| 2026-06-10 Mastercard AP4M release | pass | release PDF dated 2026-06-10 |
| 2026-06-16 usdc method | pass | first commit for `usdc/draft-usdc-charge-00.md` 2026-06-16T17:10Z |
| 2026-06-19 draft-httpauth-payment-00 | pass | Datatracker 2026-06-19T18:09:03Z |
| 2026-06-25 session v2 merged | pass | PR #278 merged 2026-06-25T17:55Z; blog 2026-06-17 |
| 2026-07-01 fee payer advisories | pass | GHSA-727h and GHSA-vc9j published 2026-07-01T17:23Z, CVE ids 2026-63627 and 2026-63628 |
| 2026-07-29 subscription intent | pass | PR #230 merged 2026-07-29T16:11Z |
| 2026-08-04 TAP and Web Bot Auth in mppx | pass | mppx PR #732 merged 2026-08-04T22:34Z; npm 0.8.17 2026-08-10; blog 2026-08-12 |
| 2026-08-25 header parameter | pass | PR #328 merged 2026-08-25T16:26Z |
| 2026-08-27 mppx 0.9.0 | pass | npm 0.9.0 2026-08-27T03:10Z |
| 2026-09-08 XRPL | pass | PR #346 merged 2026-09-08T10:58Z |
| 2026-09-09 draft -01 | pass | Datatracker 2026-09-09T16:08:12Z; expires 2027-03-13T16:08:12Z; PR #351 |
| 2026-09-18 draft-ryan expired | pass | Datatracker expired_document 2026-09-18T07:09:06Z (expires field 2026-09-19T02:45Z) |
| 2026-09-28 PR #280 closed unmerged | pass | `gh api pulls/280` closed_at 2026-09-28T17:30:21Z, merged_at null |
| 2026-10-08 mppx 0.13.4 | pass | npm; still `latest` on 2026-10-13 |
| Hedera 2026-05-14 / 2026-08-07, NEAR Intents 2026-06-21 | pass | PRs #251, #258, #284 |
| metrics: 4,072,426 tx / 435,476 USD all time; 998,771 / 8,774 (30d); 126,902 / 1,484 (7d) | pass (dated) | MPPscan live on 2026-10-13: all time 4,121,980 / 436,012; 30d 960,520 / 8,837; these move daily and the page dates them 2026-10-11 |
| metrics: 129 directory services (126 tempo, 10 stripe, 1 evm) | pass (dated) | Live 2026-10-13: 130 services (127 tempo, 10 stripe, 1 evm); one listing added since |
| metrics: about 25,000 USD over about 115,000 transfers (2026-04-21) | pass | Forkast article text confirms; marked secondary in the caveat |
| metrics: GitHub stars mpp-specs 95, mppx 186 | pass (dated) | live 95 and 185; star counts drift |
| Version labels: mppx 0.13.4, pympp 0.11.0, mpp 0.15.0, mpp-go v0.2.0, mpp-rb 0.1.6 | see "Writer's uncertain items" below | |

Dates wrong: 0.

## ATLAS_ERRATA.md rows for MPP

| Row | Verdict | Evidence |
|---|---|---|
| 2.1.1 draft rename dates | pass | Datatracker API: draft-ryan -00 2026-02-16, -01 2026-03-18, expired 2026-09-18; draft-httpauth-payment -00 2026-06-19, -01 2026-09-09. Page: `timeline.json`, `facts.json` lines 15 and 21, `index.mdx` lines 343 and 413-427 state the same, and call -01 a revision, not a rename |
| 2.1.2 AP4M "cites MPP compatibility" | pass | Page attributes the statement to Tempo only: `index.mdx` line 435, `relations.json` line 50, `compare-cells.json` line 326, claim 202. Mastercard release body has no MPP text (see AP4M below) |
| 2.1.12 Visa card spec and TAP | pass | `draft-card-charge-00.md` line 98 "The client may include Trusted Agent Protocol signature headers"; the same sentence is in the first commit b3bc1ab (2026-03-18), checked with `gh api contents?ref=b3bc1ab`. Page (`index.mdx` line 433) says exactly that, and does not date "optional" to March only |
| R26 draft dates | pass | Datatracker: ryan -00 2026-02-16T00:31Z, -01 2026-03-18T02:45Z, expired event 2026-09-18T07:09Z, expires field 2026-09-19T02:45Z; httpauth -00 2026-06-19, -01 2026-09-09, expires 2027-03-13; both group "Individual Submissions", stream null, no "replaces" relation (relateddocument API shows only refnorm links) |
| R27 AP4M, "Tempo lists AP4M as MPP-compatible" | pass (superseded by R39) | The page contains no claim that a Tempo page lists AP4M; claim 203 and `index.mdx` line 435 say none was found |
| R28 design partners | pass | Tempo mainnet post: only Visa is called an MPP "design partner"; Anthropic, DoorDash, Mastercard, Nubank, OpenAI, Ramp, Revolut, Shopify, Standard Chartered are "partners ... to bring these use cases onto mainnet". Page: claims 015 and 017, `faq.json` line 117, `index.mdx` line 414 |
| R29 Tempo finality | pass | No "500 ms finality" in the folder. Tempo consensus page: "approximately every 600ms (500ms builder loop plus network latency)"; flows and scenario say about 600 ms with deterministic finality |
| R30 MPP seed dates | pass | Timeline uses code and spec dates with blog dates as detail: subscriptions spec 2026-07-29 (blog and 0.6.20 on 2026-05-12 kept as announcement), x402 exact in mppx 0.6.29 2026-06-02, session v2 spec 2026-06-25, identity merged 2026-08-04 and npm 0.8.17 2026-08-10, advisories 2026-03-26 with NVD 2026-03-31 |
| R31 session as an intent | pass | `ls specs/intents` shows only charge and subscription; PR #280 closed unmerged 2026-09-28. `index.mdx` lines 351 and 401, `facts.json` and the frontmatter `statusNote` say session is per method; the scenario opens with the same correction |
| R32 "up to 72%" | pass | `sessions-improved.mdx` lines 24, 75, 78 (-72.1% open with existing reserve, +79.4% settle to new payee balance). `index.mdx` line 402 and the scenario state both |
| R33 MPPScan figures | pass | Page uses all-time 4,072,426 tx and 435,476 USD dated 2026-10-11; claim 174 explains the June article showed live values. Live API on 2026-10-13 gives 4,121,980 and 436,012, consistent with growth |
| R34 Rivest DOI | pass | Crossref: 10.1007/3-540-63594-7_87 is "Electronic lottery tickets as micropayments", Rivest, 1997; `publications.json` pub-rivest-1997-lottery uses that DOI |
| R39 refined AP4M | pass | Same as 2.1.2; the wording is Tempo's statement, sourced to the 2026-06-10 release |
| R47 Stripe SPT preview status | pass | `docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens` shows "Public preview" and no price. Page: claim 209, `index.mdx` line 433, `ecosystem.json` line 353 |

## The six security advisories

Checked with `gh api repos/wevm/mppx/security-advisories` (five) and the GitHub advisory API for the Rust crate (one). `security.json` lists exactly these six; `index.mdx` lines 337 and 416 and `timeline.json` repeat them.

| Advisory | Verdict | Evidence |
|---|---|---|
| GHSA-8x4m-qw58-3pcx | pass | mppx < 0.4.8, fixed 0.4.8, critical, no CVE, published 2026-03-26T20:56Z |
| GHSA-mv9j-8jvg-j8mr / CVE-2026-34209 | pass | mppx < 0.4.11, fixed 0.4.11, high, "Tempo session close voucher bypass via settled amount equality"; NVD published 2026-03-31 |
| GHSA-8mhj-rffc-rcvw / CVE-2026-34210 | pass | mppx < 0.4.11, medium, "Stripe charge credential replay"; description names the `Idempotent-Replayed` header; NVD published 2026-03-31 |
| GHSA-fxc9-7j2w-vx54 (Rust crate `mpp`) | pass | GitHub advisory: critical, crates `mpp` < 0.8.0, patched 0.8.0, cve_id null, published 2026-03-29T15:20Z; seven behaviors match `security.json` |
| GHSA-727h-3vm5-qwq6 / CVE-2026-63627 | pass | medium, "Gas Draining with padding", fixed 0.8.2, published 2026-07-01 |
| GHSA-vc9j-9wph-qghj / CVE-2026-63628 | pass | medium, "Gas Draining with access list", fixed 0.8.2 (the API range is "> 0.8.1"), published 2026-07-01 |

The page says "within two weeks of launch" for the two critical advisories (2026-03-26 and 2026-03-29 against a 2026-03-18 launch): correct. The "never expires" session channels and the cap of loss at the deposit match `draft-tempo-session-00.md` lines 375 and 1294.

## Writer's three uncertain items

| Item | Verdict | Evidence |
|---|---|---|
| pympp 0.11.0 | pass as of 2026-10-11, now stale | PyPI: 0.11.0 uploaded 2026-08-28; it was the latest on 2026-10-11. PyPI now shows 0.14.0 (uploaded 2026-10-13T22:01Z, after the content was written). Not an error; refresh on the next data pass |
| Rust crate `mpp` 0.15.0 | pass as of 2026-10-11, now stale | crates.io: 0.15.0 created 2026-10-06; 0.15.1 created 2026-10-12. Repo tempoxyz/mpp-rs, license MIT OR Apache-2.0 |
| mpp-go v0.2.0 | pass | Go proxy `@latest`: v0.2.0, 2026-07-01T18:50:36Z, github.com/tempoxyz/mpp-go |
| mpp-rb 0.1.6 | pass | RubyGems: 0.1.6 created 2026-09-01T19:35Z, license MIT, source github.com/stripe/mpp-rb (the page says it is hosted in stripe/mpp-rb, claim 145) |
| Tempo subscription example fields | pass | Flow `stripe-mpp-subscription-renewal.json` step 1 uses amount, currency, recipient, periodUnit "week", periodCount "1", subscriptionExpires, methodDetails.chainId 42431, methodDetails.accessKey.accessKeyAddress, keyType "p256". `draft-tempo-subscription-00.md` lines 185-215 require exactly these (recipient and subscriptionExpires REQUIRED; periodUnit day or week only; accessKey with accessKeyAddress and keyType in p256, secp256k1, webAuthn; chainId default 42431, which the spec mislabels as mainnet). The page flags that mislabel (`index.mdx` line 403) |
| AP4M as Tempo's quote | pass | Mastercard IR PDF (2026-06-10), read with macOS PDFKit: "We're excited to work with Mastercard on Machine Payments Protocol compatibility, with Tempo providing stablecoin settlement ...", said Dan Romero, go-to-market at Tempo. The release body and the other quotes have no MPP text. Stripe and Tempo are in the 32-name initial participants list. The page's wording ("Tempo says ... Mastercard's own text makes no MPP claim") is exact |

## Check 4. "Do not get wrong" list (ATLAS_PROMPT.md Section 5.6)

| Item | Verdict | Where the page states it |
|---|---|---|
| Not only Stripe (co-authored with Tempo) | pass | Frontmatter `intro` line 8, `stewards`, `disambiguation` line 61; keyFacts Steward line 88; `faq.json` line 6 ("Not only ... three of the five core authors work at Tempo Labs and two at Stripe"); `facts.json` whatItIsNot; rendered `dist/p/stripe-mpp/index.html` contains "not a Stripe-only" 8 times |
| Not an IETF standard yet (individual draft) | pass | Frontmatter `governance` and `disambiguation` line 62; Section A line 131 ("What MPP does not give you: an IETF standard"); Section C lines 339-345; `ste.mdx` line 13; dist contains "not an IETF standard" 11 times |
| Not crypto-only (cards via Stripe and Visa, plus Lightning) | pass | Section A line 131 ("so MPP is not crypto-only"); keyFacts Rails line 109; `facts.json` whatItIsNot; Section D card and stripe method text lines 143-145 |
| "MPP" in AP2 documents means Merchant Payment Processor | pass | Frontmatter `disambiguation` line 60; `faq.json` line 37; `ste.mdx` line 19; dist contains "Merchant Payment Processor" 20 times. The statement matches `research/vendor/AP2/docs/glossary.md` line 19 |

## Check 5. Diagrams and flows against the spec

| Item | Verdict | Evidence |
|---|---|---|
| Main flow `stripe-mpp-charge` (8 steps) | pass | Order request, 402 + challenge, client check, retry with `Authorization: Payment`, verify, co-sign and broadcast, confirm, 200 + `Payment-Receipt` matches core lines 105-160 and `draft-tempo-charge-00.md` pull mode (lines 79-91). `Cache-Control: no-store` on 402 and `private` on the receipt response match core lines 1071-1079. Failure branches (malformed-credential, invalid-challenge, payment-expired, verification-failed, 403 policy) match core lines 172-196 and the Error Codes table. The "401 first when ordinary authentication is also needed" branch matches core lines 185-232 |
| `stripe-mpp-tempo-session` (10 steps) | pass | open, voucher, topUp, settle, close, forced close flow matches `draft-tempo-session-00.md` lines 127-160, 394-396, 500-527, 1494, 1534-1545. Failure outcomes are real problem types |
| `stripe-mpp-stripe-spt-charge`, `stripe-mpp-card-charge` | pass | Stripe: `spt` payload, PaymentIntent with `shared_payment_granted_token` and `metadata.challenge_id`, receipt reference is the PaymentIntent id (`draft-stripe-charge-00.md` lines 124-289). Card: Client Enabler and Server Enabler, JWE (RSA-OAEP-256), `encryptedPayload` not parsed (`draft-card-charge-00.md`) |
| `stripe-mpp-mcp-tool-call` | pass | -32042 with `error.data.httpStatus` and `challenges`; `_meta` `org.paymentauth/credential`; matches the MCP transport draft |
| `stripe-mpp-subscription-renewal` | pass | Activation then at most one renewal per period; `subscriptionId` in the receipt; examples match Tempo subscription draft (see Writer's uncertain items) |
| Three failure flows (expired, reused, policy denied) | pass | `payment-expired`, `invalid-challenge`, and 403 without challenge are in the core error table; the HMAC binds `expires`, so a client cannot extend it (core lines 358-366) |
| State machine `stripe-mpp-session-channel` | pass | States and transitions match the Tempo session channel: close-requested returns to streaming on `topUp` (emits `CloseRequestCancelled`, line 462), forced close after the grace period then `withdraw`, cooperative close with `max(spent, settled)`. "rejected" is an HTTP-level outcome rather than a channel state; the model is labelled as a flow, so I do not count it |
| Diagrams `anatomy`, `data-model`, `methods-map`, `x402-mapping`, `composition`, `context`, `attack-surface` | pass | Anatomy HMAC slot order matches core lines 380-440. Methods map intents per method match the spec folders (charge only for card, stellar, usdc, nearintents; stripe adds subscription; session for tempo, evm, solana, hedera, lightning, xrpl) and author orgs match the draft author blocks (Solana Foundation, Moonsong Labs for solana session, SDF, Hedera, Near One, Ripple). x402 mapping matches `mpp-vs-x402.mdx` lines 28-32. Composition marks AP2 and UCP as "no reference" (verified by grep, claim 187) and the Mastercard link as Tempo's statement. Attack surface items map to real spec text (channels have no expiry, line 375; forced close 15 minutes; Cache-Control guidance) and real advisories |

Diagram issues: 0 (one cosmetic: the SSE receipt example omits `timestamp` and `challengeId`).

## Check 6. Specified versus deployed, announced versus live, stewardship

| Item | Verdict | Evidence |
|---|---|---|
| Stewardship rule: co-authored by Stripe and Tempo | pass | Frontmatter `stewards: Tempo Labs, Stripe`; `compare-cells.json` stewards cell "Tempo Labs and Stripe"; method authors named separately (Visa, Lightspark, Circle, Coinbase, MegaETH, Monad, OKG, Solana Foundation and others) and verified against draft author blocks. The label "Stripe MPP" is kept as the bubble label only, as Section 0 allows. No sentence in the folder calls MPP "Stripe's protocol"; the one third-party resource title that does ("Why Stripe's MPP signals a turning point") is a cited article title |
| Specified versus deployed | pass | `status: mixed` and `statusNote` say payments are live (Tempo mainnet, Stripe) while the core is an individual draft with no IANA registrations, Stripe docs are Frontier with a preview API version, and session is per method |
| Announced versus live | pass | Mastercard AP4M shown as announced and as Tempo's statement; Stripe SPT shown as public preview with no price; the blog's "formal MPP intent" is contradicted by the closed PR, and the page says so (claim 195) |
| Method authorship and status | pass | `card` authored by Visa; no Mastercard method exists (claim 191); `mpp-rb` hosted by Stripe, `mpp-go` and `mpp-rs` by tempoxyz |

## Scenario: src/content/scenarios/metered-inference.mdx

Result: pass. All 47 cited ids exist (the 4 `clm-scn-metered-inference-*` ids live in `metered-inference.claims.json`). Checked against `draft-tempo-session-00.md`:
- The opening correction (session is not a standardized intent; PR #280 closed 2026-09-28; only charge and subscription in `specs/intents`) is true.
- Receipt fields `challengeId`, `channelId`, `acceptedCumulative`, `spent`, reference = `channelId` (lines 1548-1562); `payment-need-voucher` data fields `acceptedCumulative`, `channelId`, `deposit`, `requiredCumulative` (lines 1422-1445); `topUp` with `additionalDeposit` (line 939) and a HEAD request for a fresh challenge (lines 920-927); the server pays fees for settle and close regardless of `feePayer` (lines 752-762); vouchers have no `validUntil` and servers SHOULD close channels idle 30+ days (lines 1629-1638); `CloseRequestCancelled` (line 462); 15 minute grace and 16 minute advice (lines 500-527, 1510).
- Cost figures: 72.1 percent less and 79.4 percent more gas from `sessions-improved.mdx` lines 75-78; Tempo fee cap about $0.0006 for 50,000 gas from the Tempo fees page.
- x402 comparison table: `scheme_upto_evm.md` line 7 (Permit2, signs a maximum, server settles actual); `scheme_batch_settlement_evm.md` lines 25 and 94 (`withdrawDelay` 15 minutes to 30 days); claims x402-104, 106, 107 and 131 exist and say the same.
- MPPScan 998,771 transactions and 8,774 USD (30 days to 2026-10-11) is dated; the "MPPScan by Merit Systems" attribution matches the MPPScan site footer.
- Observed note (not a fault): "Both MPP SDKs had critical advisories within two weeks of launch" is true for mppx (2026-03-26) and the Rust crate (2026-03-29).

## Check 7. Style gates

| Gate | Result |
|---|---|
| `pnpm lint:style` | 0 errors, 33 warnings repo-wide. 7 are in `stripe-mpp/index.mdx` (long practitioner sentences, 36 to 42 words, lines 131, 143, 235 twice, 275, 320, 329); none in the scenario |
| `pnpm lint:ste --protocol stripe-mpp` | pass: 77 sentences, max paragraph 14 and max document 16, 0 errors, 0 warnings, 0 review |
| U+2014 em dash | none in `src/content/protocols/stripe-mpp`, the stripe-mpp flows, diagrams and states, the scenario, or `dist/p/stripe-mpp/index.html` |
| US spelling sample | pass on a sample of 40 prose lines (no "colour", "behaviour", "authorise", "centre") |
| Acronyms expanded on first use in `index.mdx` | 9 gaps, all low: ACP and AP2 are used at line 337 and expanded at line 395; IANA used at line 203, expanded at line 343; TLS (line 331), EVM (line 363, in the methods table), NVD (line 416), UCP (line 395), URI (line 283), SDK (line 337) and TIP-20 are never expanded; the ELI5 block says "MPP" at line 127 before the expansion at line 131 (ELI5 mode, acceptable). Expanded correctly: MPP, HTTP, HMAC, API, PSP, JCS, DID, SPT, JWE, MCP, SSE, CVE, TAP, VIC, AP4M |

## Check 8. Coverage

`pnpm verify:coverage --protocol stripe-mpp`: 8 pass, 0 fail, 0 missing, all checks pass or waived (211 of 211 claims have sources; 34 of 34 compare cells; 14 of 14 controls cells; 13 FAQ; 10 quiz; 15 flashcards; 26 timeline events; 44 glossary terms). `pnpm verify:citations`: 170 of 171 publications ok, 1 unreachable (pub-schumacher-2025-mckinsey, HTTP 403, not an MPP publication). Side effect: those two commands rewrote `src/generated/coverage.json` and `src/generated/citation-report.json`; I did not stage them.

## Required fixes (prioritized, all low severity; no content is wrong)

1. `src/content/protocols/stripe-mpp/index.mdx`: expand ACP and AP2 at their first use on line 337 (for example "ACP (Agentic Commerce Protocol) and AP2 (Agent Payments Protocol)") and drop the later expansion on line 395; expand IANA at line 203 (move the expansion from line 343); expand TLS (Transport Layer Security) at line 331, EVM (Ethereum Virtual Machine) at line 363, NVD (National Vulnerability Database) at line 416, UCP (Universal Commerce Protocol) at line 395, URI (Uniform Resource Identifier) at line 283, SDK (software development kit) at its first body use, and TIP-20 (Tempo token standard) at its first body use.
2. `src/content/protocols/stripe-mpp/claims.json`: add `"asOf": "2026-10-11"` to clm-stripe-mpp-024 (draft expiry date) and clm-stripe-mpp-133 (40 findings), to satisfy the "number or date needs asOf" rule literally.
3. `src/content/protocols/stripe-mpp/ecosystem.json` and `sources.json` (src-stripe-mpp-sdk-registries): on the next data pass update pympp 0.11.0 to 0.14.0 (uploaded 2026-10-13) and Rust `mpp` 0.15.0 to 0.15.1 (2026-10-12), directory services 129 to 130 (127 tempo), mppx stars 186 to 185. Dated 2026-10-11 values are correct as written.
4. `src/content/protocols/stripe-mpp/index.mdx` lines 131, 143, 235, 275, 320, 329: split the seven practitioner sentences over 35 words (warnings only).
5. `src/content/flows/stripe-mpp-tempo-session.json` step 10: add `timestamp` and `challengeId` to the SSE receipt example, or keep and leave as is (illustrative).
6. clm-stripe-mpp-183: the Visa page shows no visible date; keep asOf 2026-03-18 but note "dated by reference to the Tempo mainnet launch" in the source note.

## Blocked or unreachable sources

None blocked. Reached by other means: `mastercard.com` press page returned HTTP 403 and `businesswire.com` closed the connection; the investor-relations PDF copy cited by the page (`s25.q4cdn.com`) downloaded and was read through PDFKit (poppler was absent). The Visa corporate page carries no publication date in its text.
