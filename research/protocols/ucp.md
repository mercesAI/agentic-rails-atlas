# UCP: Universal Commerce Protocol (`ucp`) research dossier

Accessed 2026-10-11. Vendor commits read:

| Repository | Commit | Commit date |
| --- | --- | --- |
| Universal-Commerce-Protocol/ucp | ad9950ba5c7bcd02af648f849bf7344052f76f57 | 2026-10-09 |
| Universal-Commerce-Protocol/.github | 95b77fd2c4f48336963147086010b52fdec0e439 | 2026-10-05 |
| Universal-Commerce-Protocol/samples | cdb291c452acf7f1253096b0e1ad7c45ecd4b5c7 | 2026-10-05 |
| Universal-Commerce-Protocol/conformance | 016ecbc22240affdec4429a60d539bedd04ab51b | 2026-09-07 |
| Universal-Commerce-Protocol/js-sdk | 6f7a6da79739a2ccf868953ed5138f85fb2b6ce3 | 2026-10-05 |
| Universal-Commerce-Protocol/python-sdk | 8f13fda131ec81012c34c1c7ac5d8703aecafe9a | 2026-10-05 |

## Identity and governance

- UCP is an open commerce protocol published by the GitHub organization `Universal-Commerce-Protocol` under the Apache-2.0 license with the copyright holder "UCP Authors" [src-ucp-governance].
- Governance is defined in `GOVERNANCE.md` of the organization's `.github` repository [src-ucp-governance]. There is no foundation: the Governing Council (GC) is "the ultimate owner of all UCP assets", and Google is the custodian of the ucp.dev domain.
- Governing Council: 5 seats. Google and Shopify each hold 1 permanent seat; 3 seats are elected by the permanent founding members, re-elected annually. Google holds the proxy vote for all open seats until December 2028 [src-ucp-governance]. As of 2026-10-11 `MAINTAINERS.md` lists Amit Handa (Google), Ilya Grigorik (Shopify), Twum Djin (Stripe) and 2 open seats [src-ucp-maintainers].
- Domain Tech Councils (DTC), 16 members each, elected by the GC every 6 months, majority vote [src-ucp-governance]:
  - Shopping TC: 4 permanent from Google and 4 from Shopify plus 8 from any organization. `MAINTAINERS.md` lists 17 names including Etsy, Meta, Amazon, Target, Microsoft, Stripe, Salesforce and Wayfair members [src-ucp-maintainers].
  - Food TC: 10 permanent (6 Google, 1 each DoorDash, Toast, Square, Uber Eats) plus 6 open.
  - Lodging TC: 12 permanent (6 Google, 1 each Amadeus, Booking.com, Expedia, Hilton, Marriott, Trip.com) plus 4 open.
  - Payments TC: 12 permanent (3 Google, 3 Shopify, 1 each Adyen NV, Ant International, Coinbase, Global Payments, PayPal, Stripe) plus 4 open.
- Domain Working Groups (DWG) can be chartered by 3 or more organizations and are overseen by a DTC [src-ucp-governance].
- Every code change needs approval by at least 1 maintainer; contributors sign the Google CLA [src-ucp-governance].

- Repository: `Universal-Commerce-Protocol/ucp` was created on GitHub 2025-12-31, default branch `main`, license Apache-2.0 (GitHub API, 2026-10-11) [src-ucp-gh-repo].
- Contribution and maintainer rosters are governance facts dated 2026-10-11. A roster discrepancy exists: the 2026-04-24 announcement names Greg Smith as the Amazon member, while `MAINTAINERS.md` lists Greg Smith under Google and Jordan Williams under Amazon (see Conflicts) [src-ucp-announcements] [src-ucp-maintainers].
- Governance timeline from `docs/documentation/announcements.md` [src-ucp-announcements]:

| Date | Event |
| --- | --- |
| 2026-01-11 | Protocol release v2026-01-11 |
| 2026-01-23 | Protocol release v2026-01-23 |
| 2026-04-08 | Protocol release v2026-04-08 |
| 2026-04-24 | Tech Council expanded to 16 seats; new members from Amazon, Meta, Microsoft, Stripe, Salesforce (Discussion #379) |
| 2026-04-28 | Stripe joins the Governing Council; 2 more elected open seats added (Discussion #396) |
| 2026-07-16 | Food Technical Council formed: Block (Square), DoorDash, Google, Toast, Uber Eats (Discussion #593) |
| 2026-08-11 | Lodging Technical Council formed: Amadeus, Booking.com, Expedia, Google, Hilton, Marriott, Trip.com (Discussion #714) |
| 2026-08-25 | Protocol release v2026-08-25 |
| 2026-09-02 | Payments Technical Council formed: Adyen NV, Ant International, Coinbase, Global Payments, Google, PayPal, Shopify, Stripe (Discussion #798) |
| 2026-09-25 | Draft Lodging Booking capability `dev.ucp.lodging.booking` merged (Discussion #864) |

- Naming. UCP is the Universal Commerce Protocol. It is not Google's "Universal Cart" shopping feature; Universal Cart is a Google product surface announced separately (see Relations and Seed audit).

## Versions and changelog

Versions are dated `YYYY-MM-DD` identifiers. Git tags carry a `v` prefix [src-ucp-versioning] [src-ucp-gh-releases].

| Tag | Tag commit | GitHub release published | Highlights |
| --- | --- | --- | --- |
| v2026-01-11 | 806a5b74 | 2026-01-23T17:58Z (created retroactively; the release notes are mostly tooling PRs) | Launch version. Already contained `dev.ucp.shopping.ap2_mandate` (`source/schemas/shopping/ap2_mandate.json`, `"version": "2026-01-11"`), checkout, order, fulfillment, discount, buyer consent, identity linking spec page |
| v2026-01-23 | dcf7eac7 | 2026-01-23T22:48Z | PR #115 "refactor!: updates for 2026-01-23 release" (breaking) |
| v2026-04-08 | a25a4a24 | 2026-04-09T01:48Z | Cart (PR #73, merged 2026-01-26), catalog search and lookup (PR #55, 2026-03-08), request and response signing (PR #156, 2026-02-17), signals for authorization and abuse (PR #203, 2026-03-13, breaking), errors, totals, eligibility, attribution, Get Order, embedded cart; identity linking OAuth 2.0 with capability-driven scopes cherry-picked into this release by PR #431 (merged 2026-05-20) |
| v2026-08-25 | cd78fb38 | 2026-08-25T13:53Z | Latest release as of 2026-10-11. Actions primitive (PR #582), 3DS2 via actions (PR #458), `$requestConstraints`, PAN and network token as distinct credential types (PR #424), payment terms, split payments (PR #409), location search and lookup, fractional quantities, loyalty extension (PR #340, merged 2026-05-19), Web Bot Auth interop (PR #483, merged 2026-07-03), `keys[]` as the sole canonical signing key field (PR #566), extensible buyer consent, permalink (PR #523), namespace authority binding, `map_order`; payment extensions moved from `dev.ucp.shopping.*` to `dev.ucp.common.payment.*` (PR #741, merged 2026-08-25) |

Sources: [src-ucp-gh-releases] [src-ucp-release-20260825] [src-ucp-release-20260408] [src-ucp-gh-prs].

- Latest release check: the GitHub releases and tags APIs list exactly four tags (v2026-01-11, v2026-01-23, v2026-04-08, v2026-08-25) on 2026-10-11, so v2026-08-25 is the latest [src-ucp-gh-releases].
- `main` is ahead of v2026-08-25: the commit read (ad9950b, 2026-10-09) adds the draft capabilities `dev.ucp.common.ask` (`source/schemas/common/ask.json`) and `dev.ucp.lodging.booking` plus `dev.ucp.lodging.policy.cancellation`, and extends `dev.ucp.common.payment.ap2_mandate` to `dev.ucp.lodging.booking`. These are not in any release [src-ucp-repo-main].
- AP2 extension rename. Release notes for v2026-08-25 say payment extensions "migrated" from `dev.ucp.shopping.*` to `dev.ucp.common.payment.*` (the notes list `split_payments`, `payment_terms`, `ap2_mandates`). The schema `name` values are exact: v2026-04-08 `source/schemas/shopping/ap2_mandate.json` has `"name": "dev.ucp.shopping.ap2_mandate"`; v2026-08-25 `source/schemas/common/payment_ap2_mandate.json` has `"name": "dev.ucp.common.payment.ap2_mandate"`. The release-notes spelling `ap2_mandates` (plural) does not match the schema name; the schema wins [src-ucp-schema-ap2] [src-ucp-schema-ap2-0408] [src-ucp-release-20260825].
- Release model (from the overview at v2026-08-25): a release `D` is a certified snapshot of services, transport bindings, capabilities, extensions and shared schemas. Every UCP-defined (`dev.ucp.*`) service, capability and extension declares `version` `D` in release `D`; a platform must reject a `dev.ucp.*` entry whose version differs from `ucp.version`. Third-party extensions (`com.{vendor}.*`, `org.{org}.*`) version independently and declare compatibility through `requires`. Payment-handler versions are set by their authors [src-ucp-overview].
- Correction to the seed "capabilities have been versioned independently since 2026-08-25": v2026-08-25 tightened the release contract (PR #614, merged 2026-08-10). Core `dev.ucp.*` capabilities move in lockstep with the release date; only third-party capabilities and extensions version independently. The release notes' executive summary does use the phrase "independent capability versioning" [src-ucp-overview] [src-ucp-release-20260825].
- Backports amend a published release in place ("A dated release works like a long-term-support channel"); breaking backports need Governance Council approval. Release branches are named `release/YYYY-MM-DD`; breaking PRs carry `!` and are announced in Discussions 2 weeks before merge [src-ucp-overview] [src-ucp-versioning].
- Pre-release: businesses must not advertise a non-date version such as `"draft"` in public discovery [src-ucp-overview].
- Docs channels: ucp.dev serves `/latest/` and `/draft/` paths (mkdocs `mike` versioning, PR #106) [src-ucp-release-20260111] [src-ucp-site].
- Breaking changes in v2026-08-25 (selection): fulfillment flags renamed to drop `allows_`; `consent` in `buyer_consent.json` changed from booleans to a reverse-DNS keyed map (`dev.ucp.consent.*`); `signing_keys[]` removed from `profile.json` in favor of `keys[]`; primitive schemas moved under `common/types/` (changing `$id` URLs); `quantity` became integer or `measure.json` object; `retail_location.json` replaced by `common/types/location.json`; `cart.id` omitted in update requests [src-ucp-release-20260825].

