# Fact check: mastercard-agent-pay (2026-10-21)

Full re-verification of the Mastercard Agent Pay page (agentic tokens, the Agent Pay Acceptance Framework, Verifiable Intent and Agent Pay for Machines) and of every statement about it elsewhere on the site, with the method of `verification/erc-8004-2026-10-18.md`: eight read-only verifiers, two fixers with separate files, and an independent critic that re-read the primary sources. Mastercard's pages block automated fetches; they were read in a real browser.

## Results
| Check | Items | Pass | Flagged |
|---|---|---|---|
| Claims, batches 1 to 3 | 243 | 216 | 27 |
| Identifiers, flows, diagrams | 75 | 63 | 12 |
| Page prose | 64 | 44 | 20 |
| Structured files, group 1 | 181 | 133 | 48 |
| Structured files, group 2 and cross-site | 292 | 243 | 49 |
| Changes since 2026-10-11 | 34 | 21 | 13 |
| Total | 889 | 720 | 169 |

Of the 169 findings, 11 were high, 59 medium and 99 low. The three "Do not get wrong" items (Agent Pay is not AP2; "agentic token" means different things at Visa and Mastercard; most live transactions are controlled pilots) are stated correctly. The fixers rejected one finding, which the critic overturned; the critic fixed nine more problems.

## What the round found
- Mastercard opened Agent Pay for Machines Early Access on 2026-10-20, with APIs, a toolkit and a sandbox, and says it builds on x402. The page said AP4M had no availability and no x402 link; the x402 page now records the link too.
- Mastercard's own Agent Pay developer page names MDES, so the site now does; MDES gained token spend controls for Agent Pay issuers on 2026-08-05.
- Mastercard published a Trust Framework white paper on 2026-09-30; the page said none existed.
- The 2026-06-02 Mastercard Rules require Agent Pay participants to follow Program Standards that are not public; the page now says so wherever it discusses disputes and liability, and no longer cites a review for what it does not say.
- Mastercard documents deletion and issuer suspension of virtual card tokens, so "no public revocation" was wrong for tokens; agents and mandates still have no public revocation.
- The edge verification steps now follow Mastercard's nine-step checklist, including its 8-minute window, in the diagram, procedure and playground.

## Corrections
Rows F69 to F75 in `ATLAS_ERRATA.md`; source conflicts in `research/conflicts.md` (2026-10-21 Mastercard section); a fetch route in `research/blocked.md`.

## Re-confirmed on 2026-10-21
The Mastercard Rules are still the 2026-06-02 edition; the Agent Pay Program Standards are not public; the example key directory host does not resolve; Verifiable Intent has no commit since 2026-04-20 and issue 29 is open; the toolkit is unchanged (npm 0.1.7 and 0.1.6); Mastercard remains a premier x402 Foundation member and a UCP endorser; no Agent Pay volume figures, CVEs or advisories.

## Left open
- Mastercard reports Q3 2026 results on 2026-10-29; volume figures and US enablement should be rechecked then.
- The Early Access developer documentation is behind a login and was not read.
- Global persona statements have no sources field (owner decision).
