# Fact check: stripe-mpp (2026-10-21)

Full re-verification of the Stripe MPP page (the Machine Payments Protocol, co-authored by Tempo and Stripe) and of every statement about MPP elsewhere on the site, with the method of `verification/erc-8004-2026-10-18.md`. Two of the eight verifiers stopped at a usage limit before writing anything; their scope was re-run as six scoped verifiers, each followed by a completeness critic that checked missed statements and re-tested the weakest passes.

## Results
| Check | Items | Pass | Flagged |
|---|---|---|---|
| Claims, batches 1 to 3 | 211 | 200 | 11 |
| Identifiers, flows, diagrams | 69 | 51 | 18 |
| Page prose | 223 | 214 | 9 |
| Changes since 2026-10-11 | 46 | 33 | 13 |
| Structured files (legal, security, ecosystem, timeline, code, compare cells), with critics | 300 | 199 | 101 |
| Learner files, resources, personas, tags, relations, with critics | 249 | 195 | 54 |
| Cross-site mentions, with critic | 374 | 301 | 73 |
| Total | 1,472 | 1,193 | 279 |

Of the 279 findings, 13 were high, 40 medium and 226 low. The four "Do not get wrong" items (not only Stripe; an individual draft, not an IETF standard; not crypto-only; MPP in AP2 means Merchant Payment Processor) and the corrections of follow-up 2.1.1, 2.1.2 and 2.1.12 are stated correctly. Six fixers applied the findings with strict file ownership (one finding rejected, 14 deferred to the owner or the Mastercard round); two independent critics then found eight more problems, six fixed and two deferred.

## What the round found
- Stripe's US pricing page lists Shared Payment Tokens at 0.15 USD per SPT issued, in every archived copy from 2026-04-23 on. The site, follow-up Appendix B and errata R47 said no SPT price was published. Corrected on the MPP, ACP and Mastercard pages.
- Stripe publishes its 1.5 percent stablecoin fee itself; the site called it a press report. Whether it applies to MPP charges is still not stated.
- The SDKs carry nine published advisories (mppx 5, Rust mpp 2, pympp 2), not five; all are fixed and none is reported exploited.
- Mastercard opened Agent Pay for Machines Early Access on 2026-10-20, built on x402; it names no MPP, so the MPP page no longer lists Mastercard Agent Pay as composing with MPP.
- Since 2026-10-11: mppx 0.14.1, pympp 0.14.0, Rust mpp 0.16.0; MPPscan's 30-day average rose to about 1.1 cents per transaction; the directory lists 138 services; Tempo's MACH credit replaced MPP Credits for new purchases; mppx 0.13.5 answers replayed Tempo charge credentials with a final 403.
- The posted core draft and the repository text order the HMAC binding slots differently when the header parameter is present; the site follows the repository text and mppx and says so.

## Corrections
Rows F55 to F62 in `ATLAS_ERRATA.md`; source conflicts in `research/conflicts.md` (2026-10-21 section). Two code fixes ship with the content: glossary terms scoped to one protocol no longer annotate scenario and orbit pages that do not involve it, and the GitHub snapshot fetcher prefers the latest release over a name-sorted tag.

## Re-confirmed on 2026-10-21
draft-httpauth-payment-01 (posted 2026-09-09, expires 2027-03-13, individual submission, no -02); draft-ryan-httpauth-payment expired 2026-09-18 with no replaces relation; no Payment scheme or Payment header in the IANA registries; the mpp-specs text unchanged since 50309c8 apart from CI; Stripe's minimums (0.50 USD for SPT cards, 0.01 USDC) and hostedFeePayer terms; Tempo's fee cap and floor, block time and chain ids; the card method's authorship and mpp-card 0.1.8; the TAP attestation dates in mppx.

## Left open
- Global persona statements have no sources field (owner decision); they were checked and are true.
- The Mastercard page still lists stripe-mpp in composesWith and lacks the 2026-10-20 brief; that belongs to the Mastercard round.
- Whether Stripe's stablecoin fee or SPT price applies to MPP charges, and who pays the SPT price, is not stated by Stripe.
