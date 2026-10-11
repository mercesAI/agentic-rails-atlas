# ATLAS_ERRATA.md

Corrections to the seed facts in `ATLAS_PROMPT.md`, from `ATLAS_FOLLOWUP.md` Section 2 and `docs/factcheck-of-ATLAS_PROMPT.md`. Because the site content did not exist when the follow-up arrived (see `AUDIT.md`), every item below was applied at authoring time: the research and writer briefs carried the corrected wording. Columns: what the first prompt said, what is correct, source, files that carry the corrected statement (filled in during verification).

| # | First prompt said | Correct | Source | Files |
|---|---|---|---|---|
| 2.1.1 | MPP IETF draft renamed 2026-09-09 | `draft-ryan-httpauth-payment-01` expired 2026-09-18; `draft-httpauth-payment-00` published 2026-06-19; `-01` on 2026-09-09 | IETF datatracker | stripe-mpp timeline, facts |
| 2.1.2 | Mastercard AP4M "cites MPP compatibility" | Tempo lists AP4M as MPP-compatible; Mastercard does not | Tempo pages (or removed) | mastercard-agent-pay, stripe-mpp relations, compare |
| 2.1.3 | Web Bot Auth WG draft is "the basis" of TAP | TAP (2025-10-14) uses RFC 9421 and is aligned with the Web Bot Auth direction but does not conform to the 2026-09-01 WG draft | Visa spec, IETF draft, Cloudflare blog | visa-tap, orbit/web-bot-auth |
| 2.1.4 | Scenario 8 combines Monetization Gateway with `cloudflare:402` batch settlement | Monetization Gateway beta settles USDC on Base through the Coinbase facilitator; `cloudflare:402` is a separate credit-backed scheme variant | Cloudflare blog 2026-09-30, x402 spec | scenarios/crawler-pays-per-page |
| 2.1.5 | L402 is "macaroon plus invoice", "the ancestor of x402" | bLIP-0026 is token-agnostic, macaroons optional; original Lightning Labs spec used macaroon plus BOLT11 invoice; no source states x402 lineage | bLIP-0026, lightninglabs/L402 | x402, orbit/l402 |
| 2.1.6 | PayWord and MicroMint 1996 | LNCS volume dated 1997 (workshop 1996) | DOI 10.1007/3-540-62494-5_6 | publications, timeline prehistory |
| 2.1.7 | ERC-8004 testnets November 2025 | October to November 2025 | erc-8004 repo | erc-8004 timeline |
| 2.1.8 | "about 25 more mainnets" | about 25 mainnets by August 2026 including Ethereum; dated table from README | erc-8004-contracts README | erc-8004 ecosystem |
| 2.1.9 | AP2 production use unverified "outside UCP" | unverified anywhere, including inside UCP | AP2 and UCP repos | ap2, ucp, compare adoption |
| 2.1.10 | AP2 v0.2 leaves step-up to networks | v0.2 specifies no step-up; failures fall back through `unresolved_constraint`; only liability left to networks | AP2 v0.2 docs | ap2 security |
| 2.1.11 | FIDO formed two working groups on 2026-04-28 | only the Agentic Authentication TWG was new; the Payments TWG already existed | FIDO announcement | ap2, mastercard-agent-pay, orbit/fido |
| 2.1.12 | Visa MPP card spec 2026-03-18 "TAP headers optional" | March spec uses VIC tokens and TAP; "optional" is from `draft-card-charge-00` dated 2026-10-05 | mpp-specs | stripe-mpp, visa-tap |
| 2.1.13 | PyPI `x402` legacy | only npm `x402` and `x402-express` are V1; PyPI `x402` 2.x is V2 | PyPI, repo | x402 ecosystem |
| 2.1.14 | "Microsoft says it supports UCP" | "MMC will support UCP" (future); Copilot Checkout requires a UCP-compliant feed (current) | Microsoft announcement | ucp ecosystem |
| 2.1.15 | x402scan operator unverified in one note | Merit Systems (Apache-2.0 repository) | Merit-Systems/x402scan | x402; research/conflicts.md |
| 2.1.16 | STE rule 2.2 "then simplify" | "then make it clear" | research/ste.md | STE guide |
| 2.2 | 13 unsupported items | verified, tagged reported, or removed per item | see follow-up | per item |
| 2.3 | 7 internal inconsistencies | fixed per item (proofOfPayment off-chain; a2a-x402 targets AP2 v0.1; constraint key prefixes; closed Payment Mandate fields from schema; orbit links; MPP mention agreement) | see follow-up | per item |

## Found during research (session 2), beyond the follow-up

| # | Earlier text said | Correct | Source | Files |
|---|---|---|---|---|
| R1 | Scenario 3 (follow-up wording): "a Google Pay handler that returns a network token" | Google's UCP FAQ says UCP checkout on Google surfaces uses only `PAN_ONLY` for Google Pay `allowed_auth_methods`; a network-token path through that handler is not documented for Google surfaces | developers.google.com/merchant/ucp/faq | scenarios/shopper-in-gemini, ucp |
| R2 | UCP capabilities versioned independently since 2026-08-25 | core `dev.ucp.*` capabilities carry the release date; only third-party extensions version independently | UCP v2026-08-25 schemas | ucp |
| R3 | UCP ES256 "mandatory" | verifiers must support ES256; ES384 and EdDSA optional | UCP spec | ucp |
| R4 | "No paper names UCP"; "no UCP conference talk" | arXiv 2606.05043 models UCP checkout and 2602.06345 names UCP in its abstract; UCP sessions at the W3C and GS1 workshop on 2026-09-08 | arXiv; workshop page | ucp section G and F |
| R5 | UCP "converging with ACP" | no source supports convergence; only "no bridge" is supported | ucp dossier | ucp, openai-acp |
| R6 | Follow-up 2.1.13: only npm `x402` and `x402-express` are V1 legacy | six npm legacy packages are V1 (`x402`, `x402-axios`, `x402-express`, `x402-fetch`, `x402-hono`, `x402-next`); PyPI `x402` 2.x is V2 | x402 repo `typescript/packages/legacy/` | x402 |
| R7 | Follow-up Appendix B: PayAI 1,000 free settlements per month | the cited secondary source says 1,000 free in total; unverified on PayAI's page | Wavect 2026-07-12 | x402 costs |
| R8 | "No AP2 podcast found" | The Agent Factory Podcast episode on agent payments (Google Cloud Tech, 2025-09) linked from the AP2 README | AP2 README | ap2 resources |
| R9 | Follow-up 2.1.8: Billions "has no dated entry" | the contracts README added Billions on 2026-04-08; 25 mainnets including Ethereum are listed (24 others); dates are README listing dates, not deployment dates | erc-8004-contracts README history | erc-8004 ecosystem |
| R10 | Testnet Validation addresses removed 2026-01-08 | removed from the README on 2026-01-06 | erc-8004-contracts commits | erc-8004 timeline |
| R11 | Upgrade key holder "[verify]" | on Ethereum and Base all three proxies are owned by one externally owned account (no contract code, so not a multisig); the holder is not published | eth_call on public RPC, 2026-10-11 | erc-8004 security, compare |
| R12 | No published `giveFeedback` gas; registration "$1 to $5" on mainnet | measured with `eth_estimateGas` on 2026-10-11: about 155k to 179k gas for a first feedback, about 203k for `register`; at the gas price observed that day this is cents on mainnet; method labeled, figures dated | read-only RPC estimate | erc-8004 costs |
| R13 | ERC-8126 Final "[verify, unusually fast]" | Final confirmed on 2026-06-02 (Last Call 2026-05-12) while it requires ERC-8004, still Draft | ERCs repo | erc-8004, orbit |
| R14 | T-REX 4.1.6 year unverified | published 2024-10-18 | GitHub release | orbit/erc-3643 |
