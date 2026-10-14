# Verification report: stripe-mpp

Verifier: independent verifier agent, 2026-10-13. Scope per `docs/briefs/VERIFIER_BRIEF.md` and ATLAS_PROMPT.md Section 5.6, plus the MPP errata rows. Vendor clones read at mpp-specs 50309c8 (2026-10-05), mppx d8d800f (2026-10-09), mpp 6c5a0c6 (2026-10-07). Live APIs queried on 2026-10-13.

Status: in progress (check 1 recorded below; later checks are appended as they finish).

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
