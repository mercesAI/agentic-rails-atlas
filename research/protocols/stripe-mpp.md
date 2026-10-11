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
