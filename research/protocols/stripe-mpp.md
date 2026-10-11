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

IANA check (2026-10-11): neither the "Payment" scheme nor the three header fields appear in the IANA HTTP Authentication Scheme or HTTP Field Name registries [src-stripe-mpp-iana].

## Message flows step by step

### Flow 1: one-time charge (happy path)

1. Client sends `GET /resource` (optionally with `Accept-Payment: tempo/charge, stripe/charge;q=0.5`) [src-stripe-mpp-core-01].
2. Server answers `402 Payment Required`, `Cache-Control: no-store`, one or more `WWW-Authenticate: Payment id=..., realm=..., method=..., intent="charge", expires=..., request=...` challenges, and optionally an `application/problem+json` body of type `payment-required` [src-stripe-mpp-core-01].
3. Client decodes `request`, checks amount, currency, recipient and expiry, and fulfills payment in the method's own way: signs a Tempo transaction, pays a BOLT11 invoice, mints an SPT, or obtains an encrypted card token [src-stripe-mpp-intent-charge].
4. Client retries the same request with `Authorization: Payment <base64url credential>` (or `Payment-Authorization` if the challenge carried `header="Payment-Authorization"`) and an `Idempotency-Key` for non-idempotent methods [src-stripe-mpp-core-01].
5. Server verifies: challenge `id` outstanding and bound, not expired, proof valid, amount and recipient match, digest matches the body when `digest` was set [src-stripe-mpp-intent-charge] [src-stripe-mpp-core-01].
6. Server settles (immediate, deferred, or processor settlement) and answers `200 OK` with `Payment-Receipt` and `Cache-Control: private` [src-stripe-mpp-intent-charge] [src-stripe-mpp-core-01].

### Flow 2: charge failures

| Condition | Response | Source |
| --- | --- | --- |
| Malformed credential | 402, fresh challenge, `malformed-credential` | [src-stripe-mpp-core-01] |
| Unknown or reused `id` | 402, fresh challenge, `invalid-challenge` | [src-stripe-mpp-core-01] |
| Expired challenge | 402, fresh challenge, `payment-expired` | [src-stripe-mpp-core-01] |
| Proof invalid | 402, fresh challenge, `verification-failed` | [src-stripe-mpp-core-01] |
| Paid, but policy denies | 403, no challenge | [src-stripe-mpp-core-01] |
| Several Payment credentials in one request | SHOULD be rejected with 400 | [src-stripe-mpp-core-01] |
| Authentication failure unrelated to payment | 401 (servers check authentication before issuing 402) | [src-stripe-mpp-core-01] |
| Rate limiting | `Retry-After` header | [src-stripe-mpp-core-01] |
| Partial delivery before verification | Forbidden: the charge intent treats any streamed byte, tool call or started job before successful verification as an implementation defect | [src-stripe-mpp-intent-charge] |

### Flow 3: Stripe SPT charge

1. 402 challenge with `method="stripe"`, `request` carrying `amount`, `currency`, `methodDetails.networkId` and `methodDetails.paymentMethodTypes` [src-stripe-mpp-stripe-charge].
2. Client collects a payment method (may trigger 3DS or biometrics) and creates an SPT with usage limits (`currency`, `max_amount`, `expires_at`) scoped to the seller's profile [src-stripe-mpp-stripe-charge].
3. Client retries with credential `payload` `{ "spt": "spt_..." }` [src-stripe-mpp-stripe-charge].
4. Server validates challenge id and expiry before touching the SPT (order fixed by PR #210, 2026-03-30), then creates a PaymentIntent with `confirm: true`, `shared_payment_granted_token`, `metadata.challenge_id`, and the idempotency key `<challenge.id>_<spt>`; Connect parameters come from server configuration, never from the challenge [src-stripe-mpp-stripe-charge] [src-stripe-mpp-gh-specs-commits].
5. Only a PaymentIntent with `status` `succeeded` yields `200` and a receipt whose `reference` is the PaymentIntent id; otherwise 402 with a new challenge [src-stripe-mpp-stripe-charge].

### Flow 4: Visa card charge

1. 402 challenge with `method="card"`, `acceptedNetworks`, `merchantName` and the server's RSA encryption key (`encryptionJwk`, or `jwksUri` plus `kid` on the realm's origin) [src-stripe-mpp-card-charge].
2. Client sends the card identifier and full challenge context to its Client Enabler (illustrative `POST /v1/payment-tokens`) [src-stripe-mpp-card-charge].
3. Client Enabler provisions a network token and cryptogram (for example through Visa Intelligent Commerce), encrypts them as a JWE for the server key, and returns the credential payload [src-stripe-mpp-card-charge] [src-stripe-mpp-docs-card].
4. Client retries with `Authorization: Payment`; the spec says the client may add Trusted Agent Protocol signature headers for extra identity assurance [src-stripe-mpp-card-charge].
5. Server forwards `encryptedPayload` to its Server Enabler, which decrypts and requests authorization from the network; on approval the server returns 200 with a receipt containing `challengeId` and the authorization `reference`; on decline it SHOULD issue a fresh 402 [src-stripe-mpp-card-charge].

### Flow 5: Tempo session (metered streaming)

1. Client requests a metered resource; server returns 402 with `intent="session"`, `amount` as price per unit, optional `unitType` and `suggestedDeposit`, and `methodDetails.escrowContract` [src-stripe-mpp-tempo-session].
2. Client opens a channel on-chain (deposit into escrow) and sends `action: "open"` with the signed transaction, `channelId`, initial `cumulativeAmount` (usually `"0"`) and a voucher signature; the server broadcasts and verifies [src-stripe-mpp-tempo-session].
3. While consuming, the client sends `action: "voucher"` credentials to the same resource URI (HEAD allowed for voucher-only updates) with rising `cumulativeAmount`; vouchers are off-chain and cost no fees [src-stripe-mpp-tempo-session].
4. `action: "topUp"` adds funds when the deposit runs low [src-stripe-mpp-tempo-session].
5. Server may `settle()` at any time (periodically, by threshold, or on close); a receipt is returned on every paid request and, for SSE, also as a final `payment-receipt` event [src-stripe-mpp-tempo-session].
6. Cooperative close: client sends `action: "close"`; server captures `max(spent, settledOnChain)` (v2), never more than delivered service, and refunds the rest [src-stripe-mpp-tempo-session].
7. Forced close: client calls `requestClose(channelId)`; a grace period of at least 15 minutes starts; the server can still settle or close; after it, the client calls `withdraw(channelId)`. The spec advises waiting at least 16 minutes [src-stripe-mpp-tempo-session].

Failures: 400 malformed payload; 402 invalid signature or signer mismatch; 410 channel finalized or not found; problem types listed under Core objects [src-stripe-mpp-tempo-session].

### Flow 6: subscription

1. 402 with `intent="subscription"`, `amount`, `currency`, `periodUnit`, `periodCount` [src-stripe-mpp-intent-subscription].
2. Client signs a subscription grant (Tempo: an access key authorization; Stripe: a PaymentMethod id) [src-stripe-mpp-tempo-subscription] [src-stripe-mpp-stripe-subscription].
3. Server verifies, collects the first period's charge, stores durable state, and returns 200 with a receipt carrying `subscriptionId` [src-stripe-mpp-intent-subscription].
4. Each later period the server may collect one renewal before or atomically with delivery; missed periods never accumulate extra authority; `subscriptionId` alone does not authorize use [src-stripe-mpp-intent-subscription].
5. Expiry, cancellation, failed renewal or an invalid credential all lead to 402 with a fresh challenge [src-stripe-mpp-intent-subscription].

### Flow 7: MCP tool call

1. Client calls a paid tool; server returns JSON-RPC error `-32042` "Payment Required" with `error.data.httpStatus` 402, `challenges` (with `request` as a JSON object) and an optional `problem` [src-stripe-mpp-mcp-transport].
2. Client retries the call with `params._meta["org.paymentauth/credential"]` [src-stripe-mpp-mcp-transport].
3. Server returns the result with `_meta["org.paymentauth/receipt"]`; a failed verification returns `-32043` with a fresh challenge and a `failure` object; malformed credentials use `-32602` and processor failures `-32603` [src-stripe-mpp-mcp-transport].

### Flow 8: x402 interop in `mppx`

A server built with `mppx` 0.9.0 or later can emit an MPP `WWW-Authenticate: Payment` challenge and an x402 `PAYMENT-REQUIRED` header on the same EVM route, accept either an MPP credential or an x402 `PAYMENT-SIGNATURE`, and answer with the matching receipt header (`Payment-Receipt` or `PAYMENT-RESPONSE`) [src-stripe-mpp-vs-x402] [src-stripe-mpp-mppx-changelog]. The `mppx` client prefers Payment-auth challenges over x402 challenges when both are offered (0.8.7) [src-stripe-mpp-mppx-changelog].

## State machines

- **Challenge.** issued, then consumed (single use), expired, or replaced by a fresh challenge after a failure. A consumed or unknown `id` returns `invalid-challenge` [src-stripe-mpp-core-01].
- **Tempo channel.** open (deposit) to streaming (vouchers, optional settle and topUp) to either cooperative close (payee `close()` with final voucher) or forced close (`requestClose()`, grace period of at least 15 minutes, `withdraw()`), then closed and finalized. Channels have no expiry and vouchers have no `validUntil`; servers SHOULD close channels idle for extended periods such as 30 or more days [src-stripe-mpp-tempo-session].
- **Session protocol v1 versus v2.** v1 uses the `TempoStreamChannel` escrow contract (EIP-712 domain name "Tempo Stream Channel", `uint128` amounts); v2 uses the TIP-20 channel reserve precompile (TIP-1034; domain name "TIP20 Channel Reserve", `uint96` amounts, descriptor with `operator` and `expiringNonceHash`). A client must answer with the version the challenge names [src-stripe-mpp-tempo-session] [src-stripe-mpp-blog-sessions].
- **Subscription.** pending activation, active (one charge per billing period), then cancelled, expired, or lapsed after failed renewal; all end states lead to a new 402 challenge [src-stripe-mpp-intent-subscription].
- **Stripe PaymentIntent.** Only `succeeded` produces a receipt; any other status returns a new 402 [src-stripe-mpp-stripe-charge].

## Transports

- **HTTP.** The core transport; TLS 1.2 or later required, TLS 1.3 recommended; challenges, credentials and receipts are never sent over plain HTTP [src-stripe-mpp-core-01].
- **JSON-RPC and MCP.** `draft-payment-transport-mcp-00`: capability advertisement under `capabilities.experimental.payment.methods` in MCP `InitializeResult` (example `protocolVersion` "2025-11-25"), or a `payment.capabilities` notification on WebSocket; errors `-32042` and `-32043`; credential and receipt under `_meta` keys `org.paymentauth/credential` and `org.paymentauth/receipt`, checked at both root and nested `_meta` [src-stripe-mpp-mcp-transport].
- **Streaming.** For SSE the session receipt goes in the initial headers and a final `payment-receipt` event; chunked responses MAY carry it as a trailer when the client sends `TE: trailers` [src-stripe-mpp-tempo-session].
- **Discovery (optional).** `GET /openapi.json` with a top-level `x-service-info` (`categories`, `docs.apiReference`, `docs.homepage`, `docs.llms`) and per-operation `x-payment-info` (single offer or `offers[]` with `intent`, `method`, `amount` (nullable for dynamic pricing), `currency`, `description`). Discovery is advisory; the 402 challenge stays authoritative [src-stripe-mpp-discovery].

## Cryptography and standards used

| Standard | Use in MPP | Source |
| --- | --- | --- |
| RFC 9110 (HTTP semantics, 402, auth-params) | Challenge syntax and `WWW-Authenticate` | [src-stripe-mpp-core-01] |
| RFC 4648 base64url without padding; RFC 8259 JSON; RFC 8785 JCS | `request`, `opaque`, credential and receipt encoding; JCS keeps the HMAC input identical across implementations | [src-stripe-mpp-core-01] |
| HMAC-SHA256 | Recommended stateless challenge binding (implementations may use storage or authenticated encryption instead) | [src-stripe-mpp-core-01] |
| RFC 9530 Digest Fields | `digest` binds the challenge to the request body | [src-stripe-mpp-core-01] |
| RFC 9457 Problem Details | Error bodies | [src-stripe-mpp-core-01] |
| RFC 3339 | `expires`, receipt `timestamp` | [src-stripe-mpp-core-01] |
| TLS 1.2 (RFC 5246) minimum, TLS 1.3 (RFC 8446) recommended | Transport | [src-stripe-mpp-core-01] |
| RFC 9111 caching | `no-store` on 402, `private` on receipts | [src-stripe-mpp-core-01] |
| W3C DID | Optional payer `source` (`did:pkh`, `did:key` examples) | [src-stripe-mpp-core-01] [src-stripe-mpp-tempo-charge] |
| EIP-712 typed data, secp256k1 ECDSA, 65-byte `r || s || v` | Tempo session vouchers; Tempo charge zero-amount proofs | [src-stripe-mpp-tempo-session] [src-stripe-mpp-tempo-charge] |
| JWE (RFC 7516), JWK (RFC 7517), JWA (RFC 7518), RSA-OAEP (RFC 8017) | `card` encrypted network token payload | [src-stripe-mpp-card-charge] |
| EMV Secure Remote Commerce API | `card` payload fields largely follow it; cryptogram types | [src-stripe-mpp-card-charge] |
| RFC 9421 HTTP Message Signatures (Web Bot Auth, Visa TAP) | Optional request attestation in `mppx`; Ed25519 and RSA-PSS SHA-512 | [src-stripe-mpp-blog-identity] [src-stripe-mpp-mppx-changelog] |
| OpenAPI 3.x | Discovery document | [src-stripe-mpp-discovery] |
| JSON-RPC 2.0, MCP | Transport binding | [src-stripe-mpp-mcp-transport] |

## Security model and published attacks or CVEs

- **Threat model.** The core assumes attackers can observe, inject, modify and replay traffic and may run malicious clients or servers [src-stripe-mpp-core-01].
- **Bearer credentials.** Credentials authorize money movement; servers and intermediaries MUST NOT log them, put them in error messages or analytics, and SHOULD keep them in memory only. Receipts are also treated as sensitive [src-stripe-mpp-core-01].
- **Replay.** Methods MUST give single-use proofs; challenge ids are single-use; concurrent requests with one credential must yield at most one settlement (atomic operations or locks recommended) [src-stripe-mpp-core-01].
- **Request integrity.** Binding the `id` to all parameters prevents a client paying something other than what the server asked; `digest` ties the payment to the request body [src-stripe-mpp-core-01].
- **Malicious servers.** Clients must check amount, recipient, currency and window; `description` can lie [src-stripe-mpp-core-01] [src-stripe-mpp-intent-charge].
- **Intermediaries.** Proxies and CDNs may not treat 402 like 401; `Payment-Authorization` lacks the shared-cache protection RFC 9111 gives `Authorization`, so responses must carry `private` or `no-store` [src-stripe-mpp-core-01].
- **Session risk bound.** A Tempo channel caps payer exposure at the deposit; vouchers are monotonic and capped by the deposit; channel ids bind payer, payee, token, salt, signer, contract and chain [src-stripe-mpp-tempo-session].
- **Discovery spoofing.** Discovery data is not authenticated and must not be used for security decisions [src-stripe-mpp-discovery].

**Published advisories (all confirmed on 2026-10-11).**

| Id | CVE | Package | Affected / fixed | Severity | Published | Summary | Source |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GHSA-8x4m-qw58-3pcx | none | npm `mppx` | < 0.4.8 / 0.4.8 | critical | repo 2026-03-26, database 2026-03-29 | Multiple `tempo/charge` and `tempo/session` bypasses: hash replay across modes and routes, free pull-mode charges, fee-payer manipulation, voucher signature bypass, channel piggybacking | [src-stripe-mpp-ghsa-other] |
| GHSA-mv9j-8jvg-j8mr | CVE-2026-34209 | npm `mppx` | < 0.4.11 / 0.4.11 | high (NVD 7.5) | repo 2026-03-26, database 2026-03-29, NVD 2026-03-31 | Session cooperative close compared with `<` instead of `<=`, so a close voucher equal to the settled amount closed or griefed a channel for free | [src-stripe-mpp-ghsa-34209] [src-stripe-mpp-nvd] |
| GHSA-8mhj-rffc-rcvw | CVE-2026-34210 | npm `mppx` | < 0.4.11 / 0.4.11 | medium (NVD scores 6.0 and 8.1 from two scorers) | repo 2026-03-26, database 2026-03-29, NVD 2026-03-31 | `stripe/charge` ignored Stripe's `Idempotent-Replayed` header, so one SPT credential could be replayed against new challenges | [src-stripe-mpp-ghsa-34210] [src-stripe-mpp-nvd] |
| GHSA-fxc9-7j2w-vx54 | none | crates.io `mpp` (tempoxyz/mpp-rs) | < 0.8.0 / 0.8.0 | critical | 2026-03-29 | Free and replayed `tempo/charge`, free and griefed sessions, fee-payer manipulation, replayed `stripe/charge` | [src-stripe-mpp-ghsa-rs] |
| GHSA-727h-3vm5-qwq6 | CVE-2026-63627 | npm `mppx` | listed < 0.8.1 / 0.8.2 | medium | repo 2026-07-01, database 2026-09-22 | Fee-payer gas draining by calldata padding (policy capped gas limit and fee but not calldata length) | [src-stripe-mpp-ghsa-other] |
| GHSA-vc9j-9wph-qghj | CVE-2026-63628 | npm `mppx` | see advisory / 0.8.2 | medium | repo 2026-07-01 | Fee-payer gas draining with access lists | [src-stripe-mpp-ghsa-other] |

The seed's "2026-03-31 two CVEs published" is the NVD publication date; the GitHub advisories and the fix release 0.4.11 are dated 2026-03-26 [src-stripe-mpp-nvd] [src-stripe-mpp-npm-mppx]. The `mppx` CHANGELOG also records later hardening without advisories: cross-route replay fixes (scope-bound challenge metadata, `opaque`-pinned verification), session concurrency and close-race hardening, a Tempo charge replay-marker collision fix (0.13.x), and route-bound x402 credentials required by default (0.13.0) [src-stripe-mpp-mppx-changelog].

- **Formal analysis.** arXiv:2609.00060 models MPP alongside x402, ACP and AP2 in Tamarin and reports 40 previously undocumented formal-consistency findings across the four protocols (not broken out per protocol in the abstract) [src-stripe-mpp-arxiv-2609-00060].

## Controls (native and gaps)

| Control id | Support | Mechanism | Source |
| --- | --- | --- | --- |
| `agent-identity-verification` | partial | Core payment is pseudonymous; optional `source` DID; `mppx` adds RFC 9421 request attestation for Web Bot Auth and Visa TAP (SDK feature, not in the core spec); `card` allows optional TAP headers | [src-stripe-mpp-core-01] [src-stripe-mpp-blog-identity] [src-stripe-mpp-card-charge] |
| `agent-registration-kya` | none | Core forbids requiring user accounts for payment; KYC is left to methods (Stripe accounts on both sides for `stripe`) | [src-stripe-mpp-core-01] [src-stripe-mpp-stripe-charge] [src-stripe-mpp-governance] |
| `user-consent-capture` | partial | Browser wallets SHOULD require explicit confirmation; SPT creation may prompt 3DS or biometrics; otherwise external | [src-stripe-mpp-core-01] [src-stripe-mpp-stripe-charge] |
| `spending-caps` | partial | Session deposit caps loss; SPT `usage_limits.max_amount`; Tempo subscription access keys with limits; `mppx` fee-payer policies | [src-stripe-mpp-tempo-session] [src-stripe-mpp-stripe-charge] [src-stripe-mpp-tempo-subscription] |
| `merchant-payee-scoping` | native | `recipient`, `realm` and HMAC binding; SPT scoped to seller `networkId`; v2 descriptor payee must match challenge | [src-stripe-mpp-core-01] [src-stripe-mpp-stripe-charge] [src-stripe-mpp-tempo-session] |
| `time-windows-expiry` | partial | Challenge `expires`; `subscriptionExpires`; SPT `expires_at`; but session channels and vouchers never expire | [src-stripe-mpp-core-01] [src-stripe-mpp-intent-subscription] [src-stripe-mpp-tempo-session] |
| `revocation` | partial | Subscription cancellation (method-specific); forced channel close; no core revocation message | [src-stripe-mpp-intent-subscription] [src-stripe-mpp-tempo-session] |
| `step-up-authentication` | external | Method-specific (Stripe may prompt 3DS during SPT creation; card cryptograms) | [src-stripe-mpp-stripe-charge] [src-stripe-mpp-card-charge] |
| `replay-protection` | native | Single-use challenge ids and proofs; Idempotency-Key; channel and EIP-712 domain binding | [src-stripe-mpp-core-01] [src-stripe-mpp-tempo-session] |
| `receipts-evidence` | native | `Payment-Receipt` with `reference`; SSE final receipt event; on-chain tx hashes | [src-stripe-mpp-core-01] [src-stripe-mpp-tempo-session] |
| `dispute-support` | external | Method-dependent: card chargebacks apply to `card` and `stripe`; Stripe stablecoin payments have no disputes; on-chain charges final | [src-stripe-mpp-intent-charge] [src-stripe-mpp-stripe-stablecoin] |
| `reputation` | none | No reputation layer; discovery mentions future on-chain anchoring compatible with ERC-8004 | [src-stripe-mpp-discovery] |
| `monitoring-signals` | partial | Public explorer data (MPPscan, Tempo explorer); Stripe Dashboard for Stripe-settled payments; servers SHOULD rate-limit | [src-stripe-mpp-mppscan] [src-stripe-mpp-stripe-blog] [src-stripe-mpp-core-01] |
| `kill-switch` | none | No protocol-level stop; a payer can stop signing vouchers or force-close; Stripe can disable a merchant account (external) | [src-stripe-mpp-tempo-session] |

Gaps worth showing: no user-to-agent delegation or mandate object (AP2 fills that role); no protocol identity of the agent (identity is an SDK add-on); no dispute flow on stablecoin rails; channels without expiry leave liabilities open [src-stripe-mpp-core-01] [src-stripe-mpp-tempo-session].

## Observability

- **Public.** Tempo settlement is on a public chain (explorer linked from the Tempo connection-details page); MPPscan (Merit Systems) indexes servers, agents, transactions and volume and exposes a tRPC endpoint `/api/trpc/stats.protocolStats` with `timeframeDays` 0 (all), 1, 7, 15 or 30 [src-stripe-mpp-tempo-connection] [src-stripe-mpp-mppscan]. The mpp.dev payments directory is public JSON at `https://mpp.dev/api/services` [src-stripe-mpp-directory-api].
- **Discovery endpoints.** Protocol-level: `GET /openapi.json` with `x-service-info` and `x-payment-info`; no `.well-known` path is defined by the MPP specs [src-stripe-mpp-discovery]. The mpp.dev site itself serves `/.well-known/api-catalog` and `/.well-known/mcp.json` (site features, not protocol requirements) [src-stripe-mpp-docs-repo].
- **Events.** Tempo TIP-20 `TransferWithMemo` logs (used by `mppx` to verify subscription settlement), escrow `open`, `settle`, `topUp`, `close`, `requestClose`, `withdraw` calls; SSE `payment-receipt` event [src-stripe-mpp-mppx-changelog] [src-stripe-mpp-tempo-session].
- **Private.** Stripe-settled MPP payments appear in the merchant's Stripe API and Dashboard like other payments; card authorizations are visible only to the parties [src-stripe-mpp-stripe-blog].

## Compliance touchpoints

- **PCI DSS.** The `stripe` method keeps raw card data away from client and server, reducing PCI scope; the `card` method encrypts the network token so neither client nor server parses it [src-stripe-mpp-stripe-charge] [src-stripe-mpp-card-charge].
- **Token compliance on Tempo.** TIP-20 tokens can reference TIP-403 policy registry allow and block lists; T6 receive policies redirect blocked transfers to `ReceivePolicyGuard` [src-stripe-mpp-tempo-tip20].
- **Stripe merchant stack.** Stripe says MPP payments reuse its tax calculation, fraud protection, reporting and refunds; stablecoin deposits are off-ramped into the Stripe balance [src-stripe-mpp-stripe-blog] [src-stripe-mpp-stripe-docs].
- **Privacy.** Core forbids requiring accounts for payment and asks methods to support pseudonymous options [src-stripe-mpp-core-01]. Card credentials can carry billing address, cardholder name and PAR [src-stripe-mpp-card-charge].
- No regulator statement specific to MPP was found.

## Ecosystem and SDKs

| Package | Registry | Version (2026-10-11) | Maintainer | Source |
| --- | --- | --- | --- | --- |
| `mppx` | npm | 0.13.4 (2026-10-08) | wevm; MIT | [src-stripe-mpp-npm-mppx] [src-stripe-mpp-mppx-repo] |
| `pympp` | PyPI | 0.11.0 | tempoxyz; MIT OR Apache-2.0 | [src-stripe-mpp-sdk-registries] |
| `mpp` | crates.io | 0.15.0 | tempoxyz/mpp-rs | [src-stripe-mpp-sdk-registries] |
| `github.com/tempoxyz/mpp-go` | Go modules | v0.2.0 (2026-07-01) | tempoxyz | [src-stripe-mpp-sdk-registries] |
| `mpp-rb` | RubyGems | 0.1.6 | stripe/mpp-rb | [src-stripe-mpp-sdk-registries] |
| `mpp-card` | npm | 0.1.8 | Visa (jbrans-visa); proprietary license | [src-stripe-mpp-sdk-registries] [src-stripe-mpp-mpp-card-pkg] |
| `@solana/mpp`, `@stellar/mpp`, `@monad-crypto/mpp` | npm | 0.7.0, 0.7.1, 0.0.3 | rail teams | [src-stripe-mpp-sdk-registries] |

- Community SDKs listed on mpp.dev: Elixir `mpp` (ZenHive), Go `mppx` (cp0x), Swift `mpp-swift` [src-stripe-mpp-sdk-index].
- Payments directory: 129 services on 2026-10-11 (126 accept `tempo`, 10 `stripe`, 1 `evm`), up from "more than 100" at launch [src-stripe-mpp-directory-api] [src-stripe-mpp-tempo-mainnet].
- Named users at launch (Stripe): Browserbase, PostalForm, Prospect Butcher Co., Stripe Climate, Parallel Web Systems (quote) [src-stripe-mpp-stripe-blog]. Tempo named Alchemy, Dune Analytics, Merit Systems and Parallel Web Systems in the directory [src-stripe-mpp-tempo-mainnet].
- Cloudflare's Agents docs describe MPP and use `mppx` in their guides [src-stripe-mpp-cloudflare].
- Stripe at Sessions (2026-04-29): MPP payments via SPTs now include cards, Klarna and Affirm on the Payment Intents API; streaming payments announced as Metronome plus Tempo (the recap does not say "over MPP") [src-stripe-mpp-stripe-sessions].
- Tempo Wallet "MPP Credits" let users fund agents by card [src-stripe-mpp-tempo-credits].
- Stripe labels its MPP docs "Frontier" and uses API version `2026-07-29.preview` [src-stripe-mpp-stripe-docs].

## Fees and costs

| Item | Figure | As of | Confidence | Source |
| --- | --- | --- | --- | --- |
| Protocol fee | None defined in any spec; costs come from the rail | 2026-10-11 | verified | [src-stripe-mpp-core-01] |
| Tempo gas | No native token; fees paid in USD TIP-20 stablecoins through the Fee AMM; bounded dynamic base fee; a 50,000-gas transfer costs at most about $0.0006 with a quiet-period floor near $0.00003; fees go to the proposing validator | 2026-10-11 | verified | [src-stripe-mpp-tempo-fees] |
| Tempo session v2 gas | Open with an existing reserve balance 294,425 gas versus 1,055,229 in v1 (minus 72.1 percent); open with first reserve balance minus 39.2 percent; settle to a new payee balance plus 79.4 percent (559,871 gas). "Up to 72%" is the best case, not an average | 2026-06-17 | verified | [src-stripe-mpp-blog-sessions] |
| Who pays gas on Tempo | Client by default; server when `feePayer: true` for charge, open and topUp; server always pays for `settle` and `close` | 2026-10-11 | verified | [src-stripe-mpp-tempo-session] [src-stripe-mpp-tempo-charge] |
| Stripe `hostedFeePayer` | Stripe covers customers' Tempo network fees; needs `mppx` 0.9.2 or later, live mode, Tempo deposit address on the same account; not with Connect | 2026-10-11 | verified | [src-stripe-mpp-stripe-docs] |
| Stripe MPP minimums | 0.50 USD for SPT card payments; 0.01 USDC for stablecoin payments | 2026-10-11 | verified | [src-stripe-mpp-stripe-docs] |
| Stripe stablecoin payments fee | 1.5 percent per transaction reported at launch of USD-settled stablecoin payments; the current Stripe docs page states no percentage; whether it applies to MPP charges is unverified | reported 2025-12-10 | reported (figure), unverified (MPP applicability) | [src-stripe-mpp-yahoo-fee] [src-stripe-mpp-stripe-stablecoin] |
| Stripe stablecoin limits | 10,000 USD per-transaction customer limit; no disputes; refunds in stablecoin to the original wallet | 2026-10-11 | verified | [src-stripe-mpp-stripe-stablecoin] |
| SPT fee | No public SPT price schedule found | 2026-10-11 | unverified | [src-stripe-mpp-stripe-docs] |
| Card method | Card economics unchanged (interchange and acquirer fees); no MPP-specific card pricing published by Visa | 2026-10-11 | reported | [src-stripe-mpp-visa-card] |
| Average payment size | Visa and Artemis measured about 25,000 USD across about 115,000 MPP transfers to 2026-04-21 (about $0.22 each) | 2026-04-21 | reported | [src-stripe-mpp-forkast-visa] |

## Metrics with dates and caveats

| Metric | Value | Window | As of | Caveat | Source |
| --- | --- | --- | --- | --- | --- |
| MPPscan transactions | 4,072,426 | all time | 2026-10-11 | Indexer's own definition; includes test and self-dealing traffic it cannot filter; mostly Tempo | [src-stripe-mpp-mppscan] |
| MPPscan volume | 435,476 USD | all time | 2026-10-11 | Same | [src-stripe-mpp-mppscan] |
| MPPscan unique senders / recipients | 224,244 / 6,101 | all time | 2026-10-11 | Address counts, not agents or businesses | [src-stripe-mpp-mppscan] |
| MPPscan last 30 days | 998,771 transactions; 8,774 USD | 30 days | 2026-10-11 | About $0.009 per transaction | [src-stripe-mpp-mppscan] |
| MPPscan last 7 days (homepage default) | 126,902 transactions; 1,484 USD; 3,711 senders; 167 recipients | 7 days | 2026-10-11 | | [src-stripe-mpp-mppscan] |
| Directory size | 129 services | snapshot | 2026-10-11 | Listing, not usage | [src-stripe-mpp-directory-api] |
| Launch directory | more than 100 services | launch | 2026-03-18 | Self-reported | [src-stripe-mpp-tempo-mainnet] |
| Visa and Artemis | about 25,000 USD over about 115,000 transfers | to 2026-04-21 | 2026-07-20 | Secondary report | [src-stripe-mpp-forkast-visa] |
| GitHub stars | `mpp-specs` 95; `mppx` 186 | snapshot | 2026-10-11 | Popularity only | [src-stripe-mpp-gh-specs-commits] [src-stripe-mpp-mppx-repo] |

Dispute on the seed figure: the seed says MPPScan figures "cited by Merit Systems on 2026-06-24 (about 4M transactions, about $435K volume)". The Merit Systems glossary page carries "Updated June 24, 2026" as its article date, but its stats block is live and refreshed hourly; on 2026-10-11 it showed 4.1M transactions and $435.4K, exactly the current all-time API values. The 4M and $435K figures are therefore 2026-10-11 numbers, not June numbers. A search-engine summary of the same page reported about 2.3M transactions and $314.4K, which could be an older render; that value could not be confirmed [src-stripe-mpp-merit-glossary] [src-stripe-mpp-mppscan]. Note also the gap between volume and count: about $0.11 average all time, falling to under $0.01 in the last 30 days, which points to many tiny or test payments.

## Relations to the other seven protocols

- **x402.** Competing and interoperable HTTP 402 designs. Header mapping: x402 `PAYMENT-REQUIRED` to `WWW-Authenticate: Payment`, `PAYMENT-SIGNATURE` to `Authorization: Payment` (or `Payment-Authorization`), `PAYMENT-RESPONSE` to `Payment-Receipt`. x402 `exact` maps to MPP `charge`; x402 `upto` and EVM `batch-settlement` are the comparable usage-based mechanisms to MPP `session`. `mppx` can serve both on one route and its x402 headers are implemented in `src/x402/Header.ts`; Cloudflare calls MPP backwards compatible with x402. Stripe sits on both: it co-authors MPP and is an x402 Foundation TSC member (see the x402 dossier, clm-x402-213 and clm-x402-214). The discovery draft cites x402scan's OpenAPI-first approach and `/.well-known/x402` as prior art, and both explorers are run by Merit Systems [src-stripe-mpp-vs-x402] [src-stripe-mpp-mppx-changelog] [src-stripe-mpp-cloudflare] [src-stripe-mpp-discovery].
- **Visa TAP.** Two links. (1) Visa's `card` method spec says a client may add Trusted Agent Protocol signature headers; this wording has been in the file since the 2026-03-18 public commit. (2) Visa's 2026-03-18 announcement says the card spec and SDK are built on Visa Intelligent Commerce and TAP. Separately, `mppx` added TAP and Web Bot Auth request-attestation profiles (merged 2026-08-04, blog 2026-08-12). The `mpp-card` 0.1.8 package contains no TAP signing code [src-stripe-mpp-card-history] [src-stripe-mpp-visa-card] [src-stripe-mpp-blog-identity] [src-stripe-mpp-mpp-card-pkg].
- **OpenAI ACP.** No protocol cross-reference. Shared component: Stripe Shared Payment Tokens, which the `stripe` MPP method carries in `payload.spt` and which Stripe also uses for agentic checkout; Stripe presents MPP, ACP and x402 support side by side in its agentic commerce offering [src-stripe-mpp-stripe-charge] [src-stripe-mpp-stripe-blog].
- **Google UCP.** No documented relation: the cloned UCP repositories contain no reference to MPP, paymentauth or `mppx` [src-stripe-mpp-specs-repo].
- **AP2.** No cross-reference in either direction; the cloned AP2 repository never mentions the Machine Payments Protocol. Inside AP2 documents "MPP" means Merchant Payment Processor, a role that builds the authorization message. Conceptually complementary (AP2 carries user authorization evidence, MPP negotiates and settles payment), but no spec defines a binding [src-stripe-mpp-ap2-glossary].
- **ERC-8004.** No integration. The discovery draft compares itself with ERC-8004 and says it is off-chain but "compatible with future on-chain anchoring" [src-stripe-mpp-discovery].
- **Mastercard Agent Pay.** Tempo and Stripe are in the initial partner group of Mastercard Agent Pay for Machines (AP4M, announced 2026-06-10), per secondary coverage; none of the articles read mentions MPP compatibility, and no Tempo or Mastercard page confirming MPP compatibility could be opened (correction 2.1.2: the claim is dropped). Other links: Tempo's mainnet post lists Mastercard among Tempo's partners; mpp.dev governance names Mastercard as an example of a rail that would maintain its own method, but no Mastercard method spec exists; the Visa `card` method accepts `"mastercard"` as a `network` value [src-stripe-mpp-ap4m-coverage] [src-stripe-mpp-tempo-mainnet] [src-stripe-mpp-governance] [src-stripe-mpp-card-charge].
