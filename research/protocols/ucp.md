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

