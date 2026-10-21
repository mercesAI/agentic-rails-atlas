# Fact check: openai-acp (2026-10-20)

Full re-verification of the OpenAI ACP page (the Agentic Commerce Protocol, maintained by OpenAI, Stripe and Meta) and of every statement about ACP elsewhere on the site, with the method of `verification/erc-8004-2026-10-18.md`: eight read-only verifiers (three claim batches covering all 248 claims, identifiers and flows against the release folders of the cloned specification at 7fdd78d, page prose, two groups of structured files and cross-site mentions, and changes since 2026-10-11), two fixers who re-checked each finding before editing, an independent critic, and the full gates.

## Results
| Check | Items | Pass | Flagged |
|---|---|---|---|
| Claims, batches 1 to 3 | 248 | 242 | 6 |
| Identifiers, flows, diagrams | 63 | 57 | 6 |
| Page prose | 99 | 87 | 12 |
| Structured files, group 1 | 204 | 191 | 13 |
| Structured files, group 2 and cross-site | 214 | 192 | 22 |
| Changes since 2026-10-11 | 69 | 57 | 12 |
| Total | 897 | 826 | 71 |

Of the 71 findings, 1 was high, 16 medium and 54 low. The specification's identifiers are correct throughout: every status value, error code, header, endpoint and release date matched; 29 of 30 illustrative payloads validated against the 2026-04-17 JSON Schemas. The four "Do not get wrong" items hold, and the three protocols that share the ACP name are kept apart everywhere.

## What changed outside the specification
The ACP repository is unchanged since 2026-07-18: no release, tag, commit or maintainer comment (48 community comments since then, none answered by a maintainer; the one maintainer action was closing a proposal unmerged on 2026-08-09; a dispute-resolution extension proposal opened on 2026-10-16 awaits a sponsor). Around it, the vendors moved:
- OpenAI's merchant page says there are no fees for purchases completed on the merchant's own site or app; shopping is live for US users with a waitlist, and Shopify and Etsy catalogs are integrated without setup.
- OpenAI renamed its Apps SDK documentation to "Plugins", limits external-checkout approval to physical goods for now, and added a checkout path that may use only payment methods already saved with the merchant.
- Stripe restructured its agentic commerce documentation (ACP and UCP each have a protocol page; seller guides name UCP for merchants who run their own checkout), and its Shared Payment Token docs added a one-time Resolve API, a "resolved" deactivation reason and American Express tokens.

## Corrections
Rows F43 to F48 in `ATLAS_ERRATA.md`. The most important: the site said OpenAI had published no fee information, while its merchant page says there are no fees on purchases that start in ChatGPT and that it is moving away from a standalone Instant Checkout experience (F43); a compliance row said ACP does not name GDPR, but its marketing consent RFC does (F45); the California automated-decision date (F45); one scenario payload omitted a required field, a field table misread a conditional requirement, and the state machine lacked the cancel edges the RFC allows (F46); two STE sentences, on the required create fields and on the undescribed status values (F47).

## Re-confirmed on 2026-10-20
OpenAI's commerce documentation (merchant of record, refunds and chargebacks, the 201 and 409 rules, feeds and promotions paths, TLS, the Delegate Payment gate); Stripe's Shared Payment Token statuses, limits, events and preview status; the governance records (TSC of OpenAI, Stripe and Meta; ten corporate CLA signatories); package registries (no official SDK; the npm name belongs to Svix, the PyPI name to IBM); partner pages. `lastVerified` is now 2026-10-20.

## Left open
- Fields without a citation slot (frontmatter strings, the tldr) stay uncited; their statements were checked and are true.
- Pre-existing gaps noted but not required: Target's and Etsy's apps in ChatGPT, Walmart's app live on the web since March 2026 (added only where a named source was found).
- A CERRE publication's PDF could not be read; its tag is softened to what the landing page shows.
