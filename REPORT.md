# REPORT.md: Agentic Rails Atlas v1.0

Build completed 2026-10-13. Sources were read between 2026-10-10 and 2026-10-13. This report follows `private/ATLAS_PROMPT.md` Section 15.1. The v1.1 follow-up work (`private/ATLAS_FOLLOWUP.md`) was folded into the same build; see `REPORT_v1.1.md`.

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
- Write the three missing orbit pages and hand-written controls-layer annotations.
- Local labs (ERC-8004 on Anvil first), the unified agent record and the decision helper from `private/ATLAS_PROMPT.md` Section 16.
- Optimize the universe bundle (D3 submodules) and move playground CSS into lazy chunks.
