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

## Actors and roles

| Role | Definition and duties | Source |
| --- | --- | --- |
| Client | Requests a resource, receives the 402 challenge, fulfills payment through the named method, retries with a credential. MUST check amount, recipient, currency and validity window before paying, and MUST NOT rely on `description`. Browser wallets SHOULD show the origin and ask for explicit confirmation. | [src-stripe-mpp-core-01] |
| Server (resource server) | Issues challenges, binds the challenge `id` to its parameters, verifies and settles credentials, returns `Payment-Receipt`. MUST NOT perform side effects for unpaid requests and MUST NOT require user accounts for payment. | [src-stripe-mpp-core-01] |
| Payment method (rail) | Registered lowercase identifier with its own `request` and `payload` schemas, verification and settlement procedure. Maintained by the rail (for example Visa for `card`, Lightspark for `lightning`). | [src-stripe-mpp-core-01] [src-stripe-mpp-governance] |
| Payment network | External settlement system (Tempo chain, Stripe, card networks, Lightning). Shown as a third party in the subscription and session flows. | [src-stripe-mpp-intent-subscription] [src-stripe-mpp-tempo-session] |
| Payer, payee, authorized signer, operator (Tempo session) | Payer funds the escrow; payee withdraws; `authorizedSigner` may sign vouchers for the payer (zero address means the payer); v2 adds an optional payee-side `operator`. | [src-stripe-mpp-tempo-session] |
| Fee payer (Tempo) | When `methodDetails.feePayer` is `true` the server co-signs the Tempo transaction and pays fees; Stripe's `hostedFeePayer` makes Stripe the fee payer for live-mode Tempo deposit-address integrations. | [src-stripe-mpp-tempo-session] [src-stripe-mpp-stripe-docs] |
| Client Enabler and Server Enabler (`card`) | Client Enabler (vault provider, token service provider or issuer-side PSP) provisions an encrypted network token and cryptogram; Server Enabler (PSP or acquirer) decrypts and authorizes through the card network. | [src-stripe-mpp-card-charge] |
| Stripe Business Network Profile | The merchant identity (`profile_...`) placed in `methodDetails.networkId` for the `stripe` method; both client and server need Stripe accounts. | [src-stripe-mpp-stripe-charge] [src-stripe-mpp-stripe-docs] |
| Registry and aggregator | Discovery crawlers that index `/openapi.json` documents carrying `x-payment-info`; MPPscan and the mpp.dev directory are examples. | [src-stripe-mpp-discovery] [src-stripe-mpp-mppscan] [src-stripe-mpp-directory-api] |

## Core objects with exact field names

### Challenge (`WWW-Authenticate: Payment`)

| Field | Type | Required | Meaning | File path |
| --- | --- | --- | --- | --- |
| `id` | string | yes | Challenge identifier, non-empty; bound to the other parameters; echoed unchanged | `specs/core/draft-httpauth-payment-01.md` |
| `realm` | string | yes | Protection space (RFC 9110) | same |
| `method` | string | yes | Payment method identifier, lowercase ASCII letters | same |
| `intent` | string | yes | Registered intent (`charge`, `session`, `subscription`) | same |
| `request` | string | yes | base64url (no padding) of JCS-canonical (RFC 8785) JSON, method-defined | same |
| `digest` | string | no | RFC 9530 content digest of the request body; SHOULD be present for POST, PUT, PATCH | same |
| `expires` | string | no (SHOULD) | RFC 3339 expiry; clients MUST NOT pay expired challenges | same |
| `description` | string | no | Display only; excluded from binding | same |
| `header` | string | no | Only allowed value `Payment-Authorization`; selects the credential field | same |
| `opaque` | string | no | base64url JCS JSON flat string map of server correlation data; echoed unchanged; bound | same |

Recommended HMAC-SHA256 binding input: `realm|method|intent|request|expires|digest|opaque`, with `header` inserted before `opaque` when present; the result is base64url without padding [src-stripe-mpp-core-01]. Size: servers SHOULD keep challenges under 8 KB; clients MUST handle at least 4 KB [src-stripe-mpp-core-01].

### Credential (`Authorization: Payment <base64url>` or `Payment-Authorization: Payment <base64url>`)

| Field | Type | Required | Meaning | File path |
| --- | --- | --- | --- | --- |
| `challenge` | object | yes | Echo of `id`, `realm`, `method`, `intent`, `request`, plus `description`, `opaque`, `digest`, `expires`, `header` when present | `specs/core/draft-httpauth-payment-01.md` |
| `source` | string | no | Payer identifier, DID format RECOMMENDED (for Tempo `did:pkh:eip155:4217:0x...`) | core; `specs/methods/tempo/draft-tempo-charge-00.md` |
| `payload` | object | yes | Method-specific proof | core |

### Receipt (`Payment-Receipt: <base64url>`)

| Field | Type | Required | Meaning | File path |
| --- | --- | --- | --- | --- |
| `status` | string | yes | Always `"success"`; receipts only on 2xx | core |
| `method` | string | yes | Method used | core |
| `timestamp` | string | yes | RFC 3339 settlement time | core |
| `reference` | string | yes | Method reference: tx hash (`tempo`), PaymentIntent id `pi_...` (`stripe`), Server Enabler authorization reference (`card`), `channelId` (Tempo session) | core; method specs |
| `subscriptionId` | string | subscription | base64url server-issued id, returned on activation | `specs/intents/draft-payment-intent-subscription-00.md` |
| `challengeId` | string | `card` | Challenge fulfilled (card receipts) | `specs/methods/card/draft-card-charge-00.md` |
| `externalId` | string | no | Echo of merchant reference | method specs |

### Shared intent request fields

| Intent | Required | Optional | File path |
| --- | --- | --- | --- |
| `charge` | `amount` (base units, string), `currency` (ISO 4217 lowercase, token address, or method-defined) | `recipient`, `description`, `externalId`, `methodDetails` | `specs/intents/draft-payment-intent-charge-00.md` |
| `subscription` | `amount`, `currency`, `periodUnit` (`day`, `week`, `month`), `periodCount` (positive integer string) | `recipient`, `subscriptionExpires`, `description`, `externalId`, `methodDetails` | `specs/intents/draft-payment-intent-subscription-00.md` |
| `session` (Tempo, experimental) | `amount` (price per unit), `currency` (TIP-20 address), `recipient` | `unitType` (for example `llm_token`), `suggestedDeposit`; `methodDetails.escrowContract` (required), `channelId`, `minVoucherDelta`, `chainId` (default 4217), `operator`, `sessionProtocol` (`v1` or `v2`), `sessionSnapshot` | `specs/methods/tempo/draft-tempo-session-00.md` |

`expires` never appears inside `request`; it travels only as the auth-param [src-stripe-mpp-intent-charge] [src-stripe-mpp-tempo-session].

### Method-specific objects (selected)

| Method and intent | `methodDetails` fields | `payload` fields | Source |
| --- | --- | --- | --- |
| `tempo` charge | `chainId` (spec default 42431), `feePayer`, `memo` (bytes32, forces `transferWithMemo`), `splits`, `supportedModes` (`pull`, `push`) | `type` = `transaction` (`signature`: RLP signed tx), `hash` (`hash`), or `proof` (`signature`: EIP-712 zero-amount proof; proof domain versions 1, 2 add `realm`, 3 adds `account`) | [src-stripe-mpp-tempo-charge] |
| `tempo` session | see table above | `action` = `open` (`type`, `channelId`, `transaction`, `authorizedSigner`, `descriptor` for v2, `cumulativeAmount`, `signature`), `topUp`, `voucher` (`channelId`, `cumulativeAmount`, `signature`), `close` | [src-stripe-mpp-tempo-session] |
| `tempo` subscription | `accessKey` (`accessKeyAddress`, `keyType` = `p256`, `secp256k1` or `webAuthn`), `chainId`; request also requires `subscriptionExpires` and `recipient`; `periodUnit` only `day` or `week` | `type` = `keyAuthorization`, `signature` | [src-stripe-mpp-tempo-subscription] |
| `stripe` charge | `networkId` (Business Network Profile), `paymentMethodTypes` (for example `card`, `link`), `metadata` | `spt` (`spt_...`), `externalId` | [src-stripe-mpp-stripe-charge] |
| `stripe` subscription | `networkId`, `paymentMethodTypes`, `metadata`; `recipient` MUST NOT be sent | `paymentMethod`, `customer` | [src-stripe-mpp-stripe-subscription] |
| `card` charge | `acceptedNetworks`, `merchantName`, `encryptionJwk` or `jwksUri` plus `kid`, `billingRequired` | `encryptedPayload` (JWE, RSA-OAEP), `network`, `panLastFour`, `panExpirationMonth`, `panExpirationYear`, `billingAddress`, `cardholderFullName`, `paymentAccountReference`; inside the JWE: `token` (`paymentToken`, `tokenExpirationMonth`, `tokenExpirationYear`, `eci`) and `dynamicData` (`dynamicDataValue`, `dynamicDataType`, `dynamicDataExpiration`) | [src-stripe-mpp-card-charge] |

### Payment method identifiers

| Id | Rail | Spec author org | Intents in `mpp-specs` | Source |
| --- | --- | --- | --- | --- |
| `tempo` | Tempo TIP-20 | Tempo Labs | charge, session, subscription | [src-stripe-mpp-tempo-charge] [src-stripe-mpp-tempo-session] [src-stripe-mpp-tempo-subscription] |
| `stripe` | Stripe SPT | Stripe and Tempo Labs | charge, subscription | [src-stripe-mpp-stripe-charge] [src-stripe-mpp-stripe-subscription] |
| `card` | Card network tokens | Visa | charge | [src-stripe-mpp-card-charge] |
| `lightning` | BOLT11 | Lightspark | charge, session | [src-stripe-mpp-lightning] |
| `evm` | ERC-20 on any EVM chain | Coinbase, MegaETH Labs, Monad Foundation; session by OKG | charge, session | [src-stripe-mpp-evm] |
| `solana` | SOL and SPL | Solana Foundation; Moonsong Labs (session) | charge, session | [src-stripe-mpp-solana] |
| `stellar` | SEP-41 tokens | Stellar Development Foundation | charge (session documented on mpp.dev as spec in progress) | [src-stripe-mpp-stellar] [src-stripe-mpp-docs-methods] |
| `hedera` | Hedera Token Service | Hedera / Hashgraph | charge, session | [src-stripe-mpp-hedera] |
| `usdc` | Circle USDC | Circle Internet Group | charge | [src-stripe-mpp-usdc] |
| `nearintents` | NEAR Intents 1Click | Near One | charge | [src-stripe-mpp-nearintents] |
| `xrpl` | XRP Ledger | Ripple | charge, session | [src-stripe-mpp-xrpl] |
| `monad`, `redotpay` | Monad ERC-20; RedotPay | (docs only) | charge | [src-stripe-mpp-docs-methods] |

The seed's method list is confirmed, with two additions documented on mpp.dev but without a spec file in `mpp-specs` (`monad`, `redotpay`), and with `hedera` and `usdc` specified but without an mpp.dev method page [src-stripe-mpp-docs-methods] [src-stripe-mpp-specs-repo]. The seed's description of `evm` as "Permit2, EIP-3009 and more" was not checked field by field and is left out.

### Problem types (RFC 9457, base `https://paymentauth.org/problems/`)

`payment-required` (402), `payment-insufficient` (402), `payment-expired` (402), `verification-failed` (402), `method-unsupported` (400), `malformed-credential` (402), `invalid-challenge` (402), `bad-request` (400), `invalid-payload` (402), `internal-payment-error` (500), `payment-action-required` (402) [src-stripe-mpp-core-01]. Tempo session adds `session/invalid-signature`, `session/signer-mismatch`, `session/amount-exceeds-deposit`, `session/delta-too-small`, `session/channel-not-found` (410), `session/channel-finalized` (410), `session/challenge-not-found`, `session/insufficient-balance` [src-stripe-mpp-tempo-session].

### Registered headers

`Accept-Payment`, `Payment-Authorization` and `Payment-Receipt` are requested as permanent header fields; the "Payment" scheme in the HTTP Authentication Scheme Registry; two new registries "HTTP Payment Methods" and "HTTP Payment Intents", both Specification Required [src-stripe-mpp-core-01]. These are requests inside a draft, not completed IANA registrations. Tempo v2 sessions also use `Payment-Session-Snapshot` and `Payment-Session` response headers [src-stripe-mpp-tempo-session].
