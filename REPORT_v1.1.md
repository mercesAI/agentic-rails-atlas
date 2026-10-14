# REPORT_v1.1.md: what the follow-up changed

Completed 2026-10-13. Follows `ATLAS_FOLLOWUP.md` Section 4.5.

## Audit summary

The audit (`AUDIT.md`, 2026-10-10) found the first build paused at the start of Phase 1: one research dossier, schemas and tokens, no pages, no components, no gate scripts. Following the follow-up's own rule, the session finished the first prompt's P0 and P1 tiers and folded every v1.1 correction and gap into the research and writing briefs, so content was written correctly the first time instead of corrected afterwards. `ATLAS_ERRATA.md` records each correction as applied at authoring time.

## Corrections applied

| Category | Count | Where recorded |
|---|---|---|
| Follow-up 2.1 contradictions | 16 of 16 | `ATLAS_ERRATA.md` rows 2.1.1 to 2.1.16 |
| Follow-up 2.2 unsupported claims | 13 of 13 verified, tagged reported, or removed | errata row 2.2 and the protocol claims files |
| Follow-up 2.3 internal inconsistencies | 7 of 7 | errata row 2.3 |
| New corrections found during research and verification | 56 (R1 to R56) | `ATLAS_ERRATA.md` "Found during research" |

Several new rows correct the follow-up itself: Billions has a dated README entry (R9); "TAP headers optional" dates from the draft's first commit, not 2026-10-05 (R15); six npm x402 packages are V1 legacy, not two (R6); PayAI's free tier is 1,000 credits per wallet for life (R46); Google surfaces use `PAN_ONLY`, so even the softened Scenario 3 wording overstated the network-token path (R1); Mastercard pages do name MDES, though not for agentic tokens (R54).

## Gaps filled

- **Tone exemplars:** added to `CLAUDE.md`; the x402 page opens with the practitioner exemplar and its STE section with the STE exemplar, both lint-clean.
- **Learning resources:** every Appendix A entry is in the matching `resources.json` with type and badge; URLs re-checked. AP2 gained a podcast (The Agent Factory, linked from the AP2 README) and UCP gained two conference sessions (W3C and GS1 workshop, 2026-09-08), closing both coverage gaps the follow-up named.
- **Costs:** every protocol page has a dated, sourced Costs block in section L; the compare matrix has `fees-and-who-pays-them` and a short `who-pays` row. ERC-8004 gas was measured with read-only `eth_estimateGas` and labeled with method and date.
- **ERC-3643 and ONCHAINID:** a full comparison card in the ERC-8004 page's section P, the "if you come from T-REX" mapping, ERC-8226 as the bridge, and the `/orbit/erc-3643/` mini page. ERC-734 and ERC-735 link only to their GitHub issues.
- **Hosting:** Cloudflare Pages (`wrangler.toml`, `public/_headers` with build-time script hashes), `pnpm deploy:preview`, and a GitHub Actions workflow that runs the gates without secrets and deploys only on tags.
- **Scope right-sizing:** playgrounds built in the follow-up's order (all eight finished); glossary counts only full terms (224) with stubs listed separately; compare cells may read "not published" with a source.

## Gate results

See `REPORT.md`: every gate passes on a clean install, with no coverage waivers.

## New conflicts

75 entries in `research/conflicts.md`, each naming the primary source followed. The x402 gas question is the one place the site follows the spec against the follow-up: on the EVM `exact` path the facilitator pays gas, not the payer.

## Still unverified (shown with badges or stated as unconfirmed)

- Production use of AP2 mandates anywhere, and of Verifiable Intent in any live authorization.
- Completion of Mastercard's US issuer rollout; the Mastercard key directory location.
- The date the 2025 ChatGPT Instant Checkout form actually stopped; whether the reported 4 percent Shopify fee was ever charged.
- The Shopify auto-enrollment in Google checkout (September 2026) and the 2026-03-19 UCP update contents (secondary sources only).
- Whether Stripe's 1.5 percent stablecoin fee applies to MPP charges.
- The EMVCo tokenisation framework v1.0 date (trade press only).

## Suggested v1.2 items

1. Orbit pages for ERC-8183, ERC-8126 and Virtuals ACP.
2. Refresh SDK versions that moved after 2026-10-11 (pympp 0.14.0, Rust `mpp` 0.15.1).
3. Local labs from `ATLAS_PROMPT.md` Section 16, ERC-8004 on Anvil first; then the unified agent record extended with ERC-3643 and ERC-8226 field mappings; then the decision helper.
4. Hand-written controls-layer annotations for the Controls map.
5. Bundle trims: D3 submodules for the universe; playground CSS out of every protocol page.

## Process note

Two launches of 15 parallel agents hit usage limits before writing anything, and later batches of 7 to 10 hit them again. The work finished by capping parallel agents at three, using Sonnet for verification, fixes and the last two playgrounds, requiring every agent to commit early by explicit path, and doing gates and reports in the lead session. `REFRESH_PROMPT.md` carries these rules forward.
