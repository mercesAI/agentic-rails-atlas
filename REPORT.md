# REPORT.md: Agentic Rails Atlas v1.0

Build completed 2026-10-13. Sources were read between 2026-10-10 and 2026-10-13. This report follows `private/ATLAS_PROMPT.md` Section 15.1. The v1.1 follow-up work (`private/ATLAS_FOLLOWUP.md`) was folded into the same build; see `REPORT_v1.1.md`.

## Refresh 2026-11-14

Sources were re-read on 2026-11-14 (some reads ran past midnight UTC). Thirteen discovery areas each had a scout and an independent verifier, plus four top-up verifiers, and a consolidator ranked 126 items (40 big, 84 medium, 2 minor). Nine writers applied every OpenAI ACP item and, elsewhere, the big items and the medium items that left site text stale; 26 purely additive medium items were deferred. Ten independent critics then checked every writer's changes (199 problems, 188 fixed in place, the rest settled by the lead), and ten more agents drafted and checked the errata rows and reports. Reports: `verification/<slug>-2026-11-14.md` for each protocol and `verification/refresh-2026-11-14.md` for the method and the cross-site pages.

### What changed

- **OpenAI.** ChatGPT Wallet (2026-11-13), built with American Express, Mastercard and Visa, is rolling out first in dots for US ChatGPT Pro subscribers. It pays with a card network token on the merchant's existing checkout, and OpenAI does not present it as ACP. Between 2026-11-12 and 2026-11-13 OpenAI rewrote its commerce docs into the Commerce in ChatGPT partner playbook, which no longer names ACP, while the ACP specification is unchanged since 2026-07-18 and OpenAI's merchant page still says shopping is built on ACP. ChatGPT's cloud browser signs certain requests with Web Bot Auth. New orbit page: ChatGPT Wallet.
- **Identity and standards.** Web Bot Auth draft -01 (2026-10-29) fetches keys from each Signature-Agent URL as a JWK Set. Sierra announced Personal Agent Protocol 1.0, which it develops with Meta (2026-11-13; new orbit page). The IETF OAuth working group adopted Delegate SD-JWT (2026-10-30), MCP 2026-07-28 is stateless, and World archived AgentKit (2026-10-20).
- **x402 and ERC-8004.** A third-party CVE (CVE-2026-113603, 2026-10-20) covers a sign-in-with-x bypass, the deprecated V1 middleware has an open route bypass, and x402.org removed its static counter. 8004scan counted 2,062,896 agents on 2026-11-14 (reported) after batch registrations on Base and Arc.
- **UCP.** Direct checkout began rolling out to Canadian shoppers (2026-11-04), and Ask was backported into the 2026-08-25 release branch (2026-11-02).
- **Stripe MPP and Visa TAP.** mppx 0.16.0 replaced request attestation with per-route identity, and 0.16.0 to 0.19.0 carry breaking changes; the core draft's repository text adds a second 403 case. Visa's VIC docs are public again and outline onboarding with the Visa Agent Registry Service, and the 2026-10-24 rules edition renumbers the agent section to 4.1.23.
- **Mastercard Agent Pay and AP2.** Agent Pay's status moves from pilot to mixed: Shopify reported Shop Pay token use in agent purchases (2026-10-28), and Verifiable Intent was used in one live flight purchase (2026-11-12). The Delegate SD-JWT draft that AP2 builds on is now a working group draft.
- **Policy.** The Council adopted its first-reading positions on PSD3 and the PSR (2026-10-29), and the OCC published its GENIUS Act final rule (2026-10-23).

### Corrections, conflicts and gaps

- 47 errata rows, F76 to F122 in `ATLAS_ERRATA.md`. Statements that were dated and later overtaken are described in the reports instead.
- 23 new source conflicts in `research/conflicts.md` and 51 refused hosts in `research/blocked.md`.
- Still unverified: the help.openai.com articles on Wallet and the cloud browser (403), the DRCF statement's own text, and Stripe's US SPT price (the pricing page redirected to the Canadian one). To re-check: IETF 127 outcomes (after 2026-11-20), UCP's 2026-12-08 milestone and the Parliament plenary on PSD3 and the PSR (indicative 2026-12-14).

### Content now

2,060 protocol claims (1,967 verified, 84 reported, 9 unverified: 95 percent verified), up from 1,954; 58 scenario claims; 1,457 source records; 174 publications; 229 glossary terms; 47 orbit pages (2 new); 84 global timeline events.

### Gate results (2026-11-15)

| Gate | Result |
|---|---|
| `pnpm merge` | 0 errors, 14 warnings (glossary definitions that differ between files) |
| `pnpm diagrams` | 147 inputs, 0 stale |
| `pnpm check` | 0 errors (412 content files) |
| `pnpm test` | 773 of 773 |
| `pnpm lint:style` | 0 errors, 0 warnings |
| `pnpm lint:ste` | pass for all 8 |
| `pnpm verify:sources` | 0 errors (1,457 sources, 126 orphans) |
| `pnpm verify:coverage` | 8 of 8 pass, no waivers |
| `pnpm verify:citations` | 173 of 174 matched; 1 publisher page (McKinsey) returns 403 |
| `pnpm build` | 65 pages |
| `pnpm e2e` (system Chrome) | 310 passed, 14 skipped |
| `pnpm verify:links` | 1,555 URLs: 1,485 ok, 70 warnings (bot challenges, bot-blocking hosts, rate limits, timeouts), 0 failures; one earlier run failed on a transient DNS miss for research.ibm.com |

### Also in this round

Visitor statistics: Cloudflare Web Analytics counts people and the GraphQL Analytics API counts bots and AI crawlers, read by `pnpm stats` (`docs/ANALYTICS.md`); it goes live after the owner finishes the Cloudflare steps. The link checker now treats Vercel and AWS WAF challenges as warnings and accepts documented non-404 answers (`scripts/verify/bot-blocking-hosts.json`). The v1.2 tag marks the deploy of this round.

## What was built

- **Home** (`/`): the bubble universe with Constellation, Layers, Rails map and Timeline modes, an orbit toggle, a persona filter, relation edges, an accessible card list, "Changed in the last 60 days" and a progress ring.
- **Eight protocol pages** (`/p/<slug>/`): ERC-8004, x402, Visa TAP, OpenAI ACP, UCP, Stripe MPP, AP2, Mastercard Agent Pay. Each has sections A to T, four reading modes (ELI5, Practitioner, Spec-deep, STE), a flow player, a state machine explorer, a playground, a self-test and per-section notes.
- **Cross-cutting pages:** Compare (matrix, pick-two diff, radar), Stack, Controls, Scenarios (8), Timeline, Glossary, Library (BibTeX, RIS, CSV export), Personas (19 plus a heatmap), Orbit (45 items, starred ones with mini pages including ERC-3643), Learn, Notes, What's new, Methodology, 404.

## Content statistics

| Protocol | Practitioner words | ELI5 words | Diagrams | Flows | Resources | Claims (verified / reported / unverified) |
|---|---|---|---|---|---|---|
| ERC-8004 | 3,888 | 281 | 16 | 8 | 30 | 200 / 22 / 3 |
| x402 | 3,382 | 297 | 17 | 8 | 37 | 227 / 17 / 6 |
| Visa TAP | 3,351 | 297 | 15 | 8 | 28 | 223 / 14 / 0 |
| OpenAI ACP | 3,192 | 280 | 16 | 7 | 33 | 238 / 5 / 5 |
| UCP | 3,259 | 301 | 15 | 8 | 36 | 225 / 5 / 5 |
| Stripe MPP | 3,300 | 318 | 17 | 9 | 32 | 205 / 3 / 3 |
| AP2 | 2,852 | 348 | 16 | 7 | 35 | 202 / 4 / 2 |
| Mastercard Agent Pay | 3,013 | 271 | 19 | 10 | 30 | 228 / 14 / 1 |

Word counts include the section P text, which sits in the same file; ERC-8004 is above the 3,500 ceiling for that reason (its section P carries the full ERC-3643 comparison card).

| Site-wide | Count |
|---|---|
| Claims | 1,857 (1,748 verified, 84 reported, 25 unverified: 94 percent verified) |
| Sources in the registry | 1,008 |
| Verified publications | 171 (31 direct, 88 related, 36 foundation, 16 grey) |
| Glossary terms (full) | 224 |
| Rendered diagrams (light and dark) | 147 |
| Scenarios | 8 |
| Orbit items | 45 |
| Global timeline events | 61 (Standards, Policy, Market, Prehistory) plus per-protocol lanes |
| Playgrounds ready | 8 of 8 |

## Gate results (clean install, 2026-10-13)

| Gate | Result |
|---|---|
| `pnpm lint:style` | 0 errors, 33 long-sentence warnings |
| `pnpm lint:ste` | pass for all 8 |
| `pnpm verify:sources` | 0 errors |
| `pnpm verify:coverage` | 8 of 8 pass, no waivers |
| `pnpm check` | 0 errors (after six small lint fixes) |
| `pnpm test` | 580 of 580 |
| `pnpm build` | 63 pages |
| `pnpm e2e` (system Chrome) | 223 passed, 9 skipped (desktop-only or mobile-only tests), axe clean in both themes |
| `pnpm verify:citations` | 170 of 171 matched; 1 publisher page (McKinsey) returns 403 |
| `pnpm verify:links` | 1,120 ok, 42 warnings (bot blocks and rate limits), 0 failures |

## Waivers

None. `coverage-waivers.json` is empty.

## Independent verification

Every protocol page was checked by an agent that did not write it (`verification/<slug>.md`). Across the eight reports, no field name, header, endpoint or error code was misspelled; the identifier problems were four invented wrapper keys in two AP2 flow payloads and a few wrong required flags in field tables (ACP webhook, TAP JWK). Every "Do not get wrong" item passed. The failures were sourcing and attribution (for example a Solana share quote credited to the Linux Foundation, a pull-request count, an "agentic token" label on a Virtual Card Token path), five ACP example payloads that failed the spec's JSON Schema, and style items. All required fixes were applied and re-gated.

## Known gaps

- Orbit pages for ERC-8183, ERC-8126 and Virtuals ACP are not written (they appear only in text on the ERC-8004 page).
- Home JavaScript loads the full `d3` package in the universe island (42 KB gzipped); importing the submodules needs them as direct dependencies.
- Each playground's CSS is inlined into every protocol page (about 1.7 KB gzipped each).
- The controls map's "independent controls layer" annotations are derived from the cells, not hand-written.
- Playwright's bundled Chromium is not installed locally (installing it writes outside the project); e2e runs use the system Chrome.
- The x402.org 30-day counter has shown the same values since at least mid August 2026; the site says so.

## Blocked sources

See `research/blocked.md` and the Methodology page. The most frequent blocks were openai.com, mastercard.com, senate.gov, The Block, CourtListener, dl.acm.org and sciencedirect.com; each entry names the alternative used.

## Conflicts between sources

`research/conflicts.md` lists over 60. The most consequential: the ACP spec's RFC examples disagree with its JSON Schema (`items` versus `line_items`), and released spec folders were edited after release; the AP2 spec disagrees with itself on receipts (`result` versus `status`) and amount units; Visa TAP's own examples reuse a Web Bot Auth test vector and cannot verify; UCP spells the Shop Pay handler two ways; the x402 SDK's facilitator timeout is 90 seconds, not the 30 seconds an early note gave.

## Most surprising findings

1. Visa's published key directory holds one RSA sandbox key and no Ed25519 key, so the TAP spec's example key id cannot be resolved there.
2. On Ethereum and Base, one plain externally owned account can upgrade all three ERC-8004 registries; on Soneium the "deployed" registries are still a placeholder where `register` reverts.
3. The AP2 repository has merged nothing since 2026-04-29, while 58 pull requests have been opened.
4. Google's UCP FAQ says checkout on Google surfaces uses only raw card numbers (`PAN_ONLY`) through Google Pay, so the often-drawn "agentic network token through Google Pay" path is not documented.
5. Neither Visa nor Mastercard publishes any agent-specific pricing, interchange, liability rule or dispute reason code.

## Suggested next steps

- Run `REFRESH_PROMPT.md` monthly; the fee figures, SDK versions and live counters move fastest.
- Next refresh (after 2026-11-14): the 26 deferred medium items listed in `verification/refresh-2026-11-14.md`, the retailer agent terms and WebMCP pages, an Agent0 subgraph endpoint for `pnpm data` (its snapshot is still from 2026-10-11), and one canonical id for each group of records that share a URL.
- Write the three missing orbit pages and hand-written controls-layer annotations.
- Local labs (ERC-8004 on Anvil first), the unified agent record and the decision helper from `private/ATLAS_PROMPT.md` Section 16.
- Optimize the universe bundle (D3 submodules) and move playground CSS into lazy chunks.
