# Stripe MPP (Machine Payments Protocol) research dossier

Slug: `stripe-mpp`. Research date (accessed date for everything below): 2026-10-11. US spelling. Dates are YYYY-MM-DD. Status: in progress (sections are appended as they are finished).

Repositories read (all under `research/vendor/`):

| Repo | Remote | Commit read | Notes |
| --- | --- | --- | --- |
| `mpp-specs` | https://github.com/tempoxyz/mpp-specs | `50309c8e67e6d64b5547f1cc354fb327bda1301e` (2026-10-05) | core, intents, methods, extensions |
| `mpp` | https://github.com/tempoxyz/mpp | `6c5a0c6beee6690dd601c506ffd4ac32a405f96a` (2026-10-07) | mpp.dev docs and service directory |
| `mppx` | https://github.com/wevm/mppx | `d8d800f101ba1568f0d737e12574c0ae8f6b6e93` (2026-10-09) | TypeScript SDK, CHANGELOG |

Source ids in brackets refer to `stripe-mpp.sources.json`.

## Identity and governance

- **What it is.** The Machine Payments Protocol (MPP) is described by its specification repository as an open standard for machine-to-machine payments, co-authored by Tempo and Stripe. A client pays inside the HTTP exchange using the `402 Payment Required` status code, without a pre-provisioned account or API key (`research/vendor/mpp-specs/README.md`) [src-stripe-mpp-specs-repo].
- **Not Stripe only.** The README names the maintainers as Tempo Labs and Stripe [src-stripe-mpp-specs-repo]. The core draft lists five authors: Brendan Ryan, Jake Moxey and Tom Meagher (Tempo Labs), Jeff Weinstein and Steve Kaliski (Stripe) (`specs/core/draft-httpauth-payment-01.md` front matter) [src-stripe-mpp-core-01].
- **Core specification.** "The 'Payment' HTTP Authentication Scheme" (abbrev "Payment Auth Scheme"), docname `draft-httpauth-payment-01`, category `std`, submission type IETF. It is an individual Internet-Draft, not an RFC and not a working group document (see Versions) [src-stripe-mpp-core-01].
- **Architecture.** The README splits the specification into Core (HTTP 402 semantics, headers, IANA registries), Intents (abstract payment patterns), Methods (concrete rails) and Extensions (discovery, identity, transports) [src-stripe-mpp-specs-repo].
- **Licenses.** Specifications in `specs/` are CC0 1.0 Universal; tooling is Apache-2.0 or MIT at the user's option. `LICENSE.md` notes that IETF submissions become subject to IETF Trust licensing (BCP 78/79) [src-stripe-mpp-specs-license].
- **Governance model.** mpp.dev splits governance in two: the core specification goes through the IETF, while each payment method is defined and maintained by the rail behind it (the page names Visa, Mastercard, Solana, Bitcoin, Stripe and Tempo as examples). Rails can add methods without approval ("permissionless extension"); `mppx` supports custom methods [src-stripe-mpp-governance]. No foundation, charter or steering committee exists in any repository read.
- **Contribution rules.** New intents start as "experimental" inside a method spec and become standardized under `specs/intents/` only after two or more methods adopt them; core protocol changes need an issue first; AI-assisted contributions must be disclosed [src-stripe-mpp-specs-contributing].
- **Launch.** Stripe's announcement post and Tempo's mainnet post are both dated 2026-03-18 [src-stripe-mpp-stripe-blog] [src-stripe-mpp-tempo-mainnet]. Tempo's post says Visa, as "design partner", extended MPP to cards, Stripe extended it to cards and wallets through its platform, and Lightspark extended it to Lightning, and that the payments directory launched with more than 100 services (naming Alchemy, Dune Analytics, Merit Systems and Parallel Web Systems) [src-stripe-mpp-tempo-mainnet].
- **The ten "partners".** The same Tempo post names Anthropic, DoorDash, Mastercard, Nubank, OpenAI, Ramp, Revolut, Shopify, Standard Chartered and Visa as partners Tempo is working with to bring stablecoin use cases (payouts, remittances, embedded finance, tokenized deposits) onto Tempo mainnet. The post does not call them MPP design partners; only Visa is described as an MPP design partner [src-stripe-mpp-tempo-mainnet] [src-stripe-mpp-visa-card]. The seed's "design partners named at launch" for MPP is therefore corrected.
- **Not an IETF standard.** The Datatracker lists both drafts under "Individual Submissions" with no stream and no intended status [src-stripe-mpp-ietf-current]. mpp.dev's wording that the core is "submitted to the IETF standards track" is stronger than the Datatracker record (see Conflicts) [src-stripe-mpp-governance].
- **Not crypto-only.** Methods include `stripe` (Shared Payment Tokens for cards, wallets, Klarna and Affirm), `card` (Visa-authored network-token method) and `lightning` (Bitcoin) [src-stripe-mpp-stripe-charge] [src-stripe-mpp-card-charge] [src-stripe-mpp-lightning] [src-stripe-mpp-stripe-sessions].
- **Name collision.** In AP2 documents "MPP" abbreviates Merchant Payment Processor, an unrelated role (see the AP2 dossier). This dossier uses MPP only for the Machine Payments Protocol.

## Versions and changelog

- **No wire version.** The core carries no version on the wire, like `Basic` and `Bearer`; an incompatible change would register a new scheme name such as `Payment2`. Methods may add a `version` field in `methodDetails` (absent means 1); intents have no version and break by taking a new identifier such as `charge-v2` [src-stripe-mpp-core-01].
- **IETF record (from the Datatracker API, correction 2.1.1 of ATLAS_FOLLOWUP.md).**

| Draft | Revision | Posted (UTC) | State | Notes |
| --- | --- | --- | --- | --- |
| `draft-ryan-httpauth-payment` | -00 | 2026-02-16T00:31Z | | Submitted by Brendan Ryan. The seed's "2026-02-15 first draft" matches US local time on the evening before. |
| `draft-ryan-httpauth-payment` | -01 | 2026-03-18T02:45Z | Expired | "Document has expired" event 2026-09-18T07:09Z; the record's expires field reads 2026-09-19T02:45Z. 29 pages. |
| `draft-httpauth-payment` | -00 | 2026-06-19T18:09Z | Active | |
| `draft-httpauth-payment` | -01 | 2026-09-09T16:08Z | Active | Expires 2027-03-13. 36 pages. |

Sources: [src-stripe-mpp-ietf-ryan] [src-stripe-mpp-ietf-current]. The Datatracker records no "replaces" relation between the two names; the continuity is shown by identical titles and abstracts, the same authors, and the repository's renewal tooling (PR #351, merged 2026-09-09, "renew IETF draft from Datatracker expiry", which bumped the core to -01) [src-stripe-mpp-gh-pr-351]. The seed's "renamed 2026-09-09" is wrong: the new name first appeared on 2026-06-19, while the old name was still live, and 2026-09-09 is the -01 revision. Companion drafts (intents, methods, discovery, MCP transport) are not on the Datatracker; they live only in the repository and on paymentauth.org [src-stripe-mpp-ietf-current]. The mpp-specs README still links the expired `draft-ryan-httpauth-payment` record [src-stripe-mpp-specs-repo].

- **Repository timeline (GitHub API).** `tempoxyz/mpp-specs` was created 2026-01-05; its single squashed "init" commit is authored 2026-01-05 and committed 2026-03-18 (public launch). 98 commits on `main` as of 2026-10-05 [src-stripe-mpp-gh-specs-commits].

| Date (merge) | Change | PR | Source |
| --- | --- | --- | --- |
| 2026-01-05 (authored) / 2026-03-18 (public) | Core, charge intent, Tempo charge and session, Stripe charge, Visa card charge, Lightning charge and session, discovery, MCP transport | init | [src-stripe-mpp-gh-specs-commits] |
| 2026-03-24 | Solana charge | #188 | [src-stripe-mpp-solana] |
| 2026-03-29 | Stellar charge | #199 | [src-stripe-mpp-stellar] |
| 2026-04-13 | `Accept-Payment` negotiation | #231 | [src-stripe-mpp-gh-pr-231] |
| 2026-04-16 | Challenge-binding secret guidance | #233 | [src-stripe-mpp-gh-specs-commits] |
| 2026-04-17 | Unified EVM charge | #213 | [src-stripe-mpp-evm] |
| 2026-05-14 | Hedera charge | #251 | [src-stripe-mpp-hedera] |
| 2026-06-16 | `usdc` (Circle) charge | #272 | [src-stripe-mpp-usdc] |
| 2026-06-19 | Non-empty challenge `id` rule | #285 | [src-stripe-mpp-gh-specs-commits] |
| 2026-06-21 | NEAR Intents charge | #284 | [src-stripe-mpp-nearintents] |
| 2026-06-25 | Tempo session v2 (TIP-20 channel precompile) documented | #278 | [src-stripe-mpp-gh-pr-278] |
| 2026-06-30 | Solana session | #201 | [src-stripe-mpp-solana] |
| 2026-07-03 | EVM session | #225 | [src-stripe-mpp-evm] |
| 2026-07-29 | Subscription intent plus Stripe and Tempo subscription methods | #230 | [src-stripe-mpp-gh-pr-230] |
| 2026-08-07 | Hedera session | #258 | [src-stripe-mpp-hedera] |
| 2026-08-24 | Discovery -01 (output schemas) | #326 | [src-stripe-mpp-discovery] |
| 2026-08-25 | `header` parameter and `Payment-Authorization` | #328 | [src-stripe-mpp-gh-pr-328] |
| 2026-09-08 | XRPL charge and session | #346 | [src-stripe-mpp-xrpl] |
| 2026-09-09 | Core bumped to -01 for Datatracker renewal | #351 | [src-stripe-mpp-gh-pr-351] |
| 2026-09-21 | HMAC test vectors for the `header` slot | #362 | [src-stripe-mpp-gh-specs-commits] |
| 2026-09-28 | Generic `session` intent PR closed without merging | #280 | [src-stripe-mpp-gh-pr-280] |

- **Seed key dates, checked.** Several seed dates are SDK or blog dates rather than spec dates: "2026-05-12 subscriptions" is the mpp.dev blog post and `mppx` 0.6.20 (Tempo subscriptions); the subscription intent spec merged 2026-07-29 [src-stripe-mpp-blog-index] [src-stripe-mpp-npm-mppx] [src-stripe-mpp-gh-pr-230]. "2026-06-08 x402 exact support" is the blog post "EVM and x402 support"; `mppx` 0.6.29 with "EVM charge support with x402 exact compatibility" was published 2026-06-02 [src-stripe-mpp-blog-index] [src-stripe-mpp-mppx-changelog]. "2026-06-17 session v2" is the blog post; the spec text merged 2026-06-25 [src-stripe-mpp-blog-sessions] [src-stripe-mpp-gh-pr-278]. "2026-08-12 identity support" is the blog post; the code merged 2026-08-04 (mppx PR #732) and first shipped in npm 0.8.17 on 2026-08-10 [src-stripe-mpp-blog-identity] [src-stripe-mpp-gh-mppx-pr-732]. "2026-08-25 Payment-Authorization" matches the spec merge; `mppx` added the `requiresAuth` server option in 0.9.0 (2026-08-27) [src-stripe-mpp-gh-pr-328] [src-stripe-mpp-mppx-changelog]. "2026-03-24 to 2026-09-08 new methods" matches the merge dates above.
- **`mppx` release train.** npm package created 2026-02-12; 0.1.0 on 2026-02-13; 0.4.11 (CVE fixes) 2026-03-26; 0.5.12 (`paymentPreferences` emitting `Accept-Payment`) 2026-04-11; 0.6.0 (breaking: `Accept-Payment` only same-origin by default in browsers) 2026-04-21; 0.8.18 (Coinbase x402 interop tests) 2026-08-21; 0.9.0 (dual MPP and x402 wrappers for Express, Hono, Next.js and MCP) 2026-08-27; 0.9.2 (minimum for Stripe `hostedFeePayer`) 2026-09-02; 0.12.0 (`hostedFeePayer` allowed in Stripe test mode, applied only in live mode) 2026-09-29; latest 0.13.4 on 2026-10-08. The seed's "around 0.13" is confirmed [src-stripe-mpp-npm-mppx] [src-stripe-mpp-mppx-changelog].
