# Visa Trusted Agent Protocol research dossier

Slug: `visa-tap`. Research date (accessed date for everything below): 2026-10-11. US spelling. Dates are YYYY-MM-DD. Source ids in brackets refer to `visa-tap.sources.json`.

Repositories read (all under `research/vendor/`):

| Repo | Remote | Commit read | Tag or version read |
| --- | --- | --- | --- |
| `visa-trusted-agent-protocol` | https://github.com/visa/trusted-agent-protocol | `16d59bdf3f8a542bc538d0962edbb80ea30a02af` (2025-10-28) | no tags, no releases; 6 commits 2025-10-12 to 2025-10-28 |
| `visa-mcp` | https://github.com/visa/mcp | `1c544e5c1ed45c8c075ca57e9e76e7876e34fd42` (2026-09-30) | see Ecosystem |

## Identity and governance

- **What it is.** The Trusted Agent Protocol (TAP) is a Visa specification that lets an AI agent prove its identity, and the user authorization it carries, to a merchant by attaching a cryptographic signature to its web requests. The reference repository calls it "a standardized, cryptographic method for an AI agent to prove its identity" (README) [src-visa-tap-repo]. It identifies agents; it does not move money by itself.
- **Owner.** Visa. The reference repository `visa/trusted-agent-protocol` was created on GitHub 2025-10-10T02:05:59Z. It has 6 commits between 2025-10-12 and 2025-10-28 (the last one, "Adding nonce validation sample code", merged as PR #3 on 2025-10-28), no tags and no releases. GitHub reports the license as "Other" (`NOASSERTION`) [src-visa-tap-gh-meta].
- **License.** `LICENSE.md` says that using, downloading or installing the code means accepting the Visa Developer Center Terms of Use and the Visa Trusted Agent Protocol Product Terms; it is not an open source license [src-visa-tap-repo-license].
- **Repository activity after launch.** As of 2026-10-11 the repository shows 212 stars and 45 forks; community pull requests opened after 2025-10-28 (for example #21 "make signature verifier RFC 9421-conformant", opened 2026-07-15) are open and unmerged, and issue #23 (2026-07-18) asks for a worked example of the object signature base because it is under-specified [src-visa-tap-gh-meta].
- **Launch.** Visa announced TAP on 2025-10-14 (Business Wire dateline San Francisco) as "developed in collaboration with Cloudflare" and available "today" in the Visa Developer Center and on GitHub [src-visa-tap-pr]. The release names these early partners that gave feedback: Adyen, Ant International, Checkout.com, Coinbase, CyberSource, Elavon, Fiserv, Microsoft, Nuvei, Shopify, Stripe and Worldpay. It cites a 4,700% rise in AI-driven traffic to US retail sites (Adobe Data Insights, August 2025) [src-visa-tap-pr].
- **Place in Visa's product line.** The developer overview presents TAP as an enhancement to Visa Intelligent Commerce (VIC) and says the product "is in the process of development and deployment" and may not be available in all markets [src-visa-tap-overview]. The specification says a public key associated with Visa implies the agent takes part in, and complies with, the VIC program requirements [src-visa-tap-spec].
- **Standards status.** TAP is not an IETF document. It is a Visa specification published on the Visa Developer Center. The release says the initial specifications apply to the Visa network "in this phase" and that Visa is committed to aligning with IETF, the OpenID Foundation and EMVCo [src-visa-tap-pr]. The specification says the agent recognition signature is based on RFC 9421 (spelled "RCF 9421" on the page) "and aligned with web-bot-auth" [src-visa-tap-spec].
- **Product Terms (dated 2025-10-10).** Access to the specification and the sample code is subject to the Visa Developer Center Terms of Use plus the TAP Product Terms. The license is nonexclusive, non-sublicensable (with a narrow end-user exception), nontransferable and revocable. It is conditioned on implementing "the most current version of the Specification in its entirety in strict conformance". Modifications are not allowed except implementation or porting; unpermitted modifications are assigned to Visa. Implementers must apply each "Visa Update" at least annually and within six months of its publication. Production use does not require Visa's Solution Approval review. The implementer is responsible for consumer disclosures and consents [src-visa-tap-terms].
- **License ambiguity.** Every source file in the sample repository (37 files) starts with "© 2025 Visa." followed by MIT-style permission text, while `LICENSE.md` points to the proprietary Developer Center terms and Product Terms; GitHub reports no recognized license [src-visa-tap-repo-license] [src-visa-tap-gh-meta]. The Product Terms text governs according to `LICENSE.md`; the conflict is logged in `research/conflicts.md`.
- **Related repositories.** `visa/mcp` now resolves to `visa/ai` ("Integration toolkit for connecting AI agents to the Visa Intelligent Commerce platform"), created 2025-11-05, MIT license [src-visa-ai-repo]. `visa/vic-reference-agent` (created 2026-01-23, described on GitHub as an "Open source reference app") carries a proprietary "VIC Reference Agent License Agreement": evaluation and testing only, test data only, revocable; GitHub reports no recognized license [src-visa-vic-ref-agent]. Its code was not read.

## Versions and changelog

- **No version number.** Neither the specification page nor the repository carries a version number, a revision date or a changelog. The specification page shows no publication or modification date [src-visa-tap-spec]. The Product Terms are dated 2025-10-10 [src-visa-tap-terms].
- **Repository history (GitHub API).** All 6 commits [src-visa-tap-gh-meta]:

| Commit | Date (UTC) | Message |
| --- | --- | --- |
| `7e48da2` | 2025-10-12T22:26:29Z | Initial commit Readme |
| `5c1b21a` | 2025-10-12T22:43:44Z | initialize license and update readme |
| `891c8d7` | 2025-10-13T18:51:50Z | Add Sample implementation of Trusted Agent Protocol |
| `038955e` | 2025-10-13T19:49:51Z | Merge pull request #1 |
| `7c8b407` | 2025-10-28T21:13:19Z | Adding nonce validation sample code. |
| `16d59bd` | 2025-10-28T22:43:43Z | Merge pull request #3 |

- **No merges since 2025-10-28.** Twelve later pull requests (#4 to #21, eight open and four closed unmerged) were opened and none was merged as of 2026-10-11, including #11 "Feat/x402 implementation" (2026-02-18), #18 "DID-based key_id resolution + Ed25519+ML-DSA-65 hybrid algorithm" (closed 2026-05-02) and #21 "make signature verifier RFC 9421-conformant" (2026-07-15, open) [src-visa-tap-gh-meta].
- **Open issues that ask for spec clarity.** #23 (2026-07-18): the object signature base for the Consumer Recognition Object and Payment Container is under-specified; it asks for a worked example or test vector. #26 (2026-09-18): what standing a payment instruction has after the originating agent is revoked. #8 (2025-12-26): commit-time authorization semantics [src-visa-tap-gh-meta].
- **Related dated changes outside the repository.** See "Key dates" in the seed audit; these come from Visa and partner announcements, not from a TAP changelog.

## Actors and roles

From the "Participants" section of the specification [src-visa-tap-spec] and the Cloudflare post [src-visa-tap-cf-blog]:

| Role | Definition (paraphrased from the spec) | Notes |
| --- | --- | --- |
| Agent Provider (Agent) | Certified AI platforms onboarded as an "Agent" to Payment Schemes and approved to pay on behalf of account holders | Signs requests and body objects with a registered key |
| Checkout Enabler | Intermediary an agent may use to reach merchant sites | Only expectation: pass through message signatures and query parameters unchanged |
| Consumer | Account holder of a Payment Scheme with a profile at an Agent and at least one linked payment credential | Not a signer in TAP |
| Site Protection Provider | Layer in front of the merchant site: CDN, trust management system or proxy | May verify signatures on the merchant's behalf (Cloudflare, later Akamai) |
| Identity Provider | Entity that verified the consumer's credentials and can supply a verifiable value | For VIC, Visa issues the ID Token |
| Merchant | Online seller that accepts scheme credentials through its acquirer | Not required to adopt TAP or register with the scheme; may present an agent-specific experience |
| Payment Scheme | Sets rules, standards and infrastructure for agent-initiated transactions | Visa for TAP; hosts the key store |
| Key Store | Web location where merchants or site protection providers retrieve public keys | Visa: `https://mcp.visa.com/.well-known/jwks` |

The seed list (Agent Provider, Checkout Enabler, Merchant, Site Protection Provider, Payment Scheme) is confirmed; the spec also names Consumer, Identity Provider and Key Store.

The sample repository models five services: TAP Agent (Streamlit, port 8501), Merchant Frontend (React, 3001), Merchant Backend (FastAPI, 8000), CDN Proxy (Node.js, 3001 per `.env.example`) and Agent Registry (FastAPI) [src-visa-tap-repo]. The registry port differs by file: `.env.example` says 8001, the README says 8080, `main.py` binds 9002 and the CDN proxy calls `http://localhost:9002` [src-visa-tap-agent-registry] [src-visa-tap-cdn-proxy].

## Core objects with exact field names

TAP publishes no JSON Schema, OpenAPI file or test vectors. Field names below are quoted from the specification page [src-visa-tap-spec] ("Spec" in the File column means `developer.visa.com/.../trusted-agent-protocol-specifications`, section named in brackets). The sample repository does not implement the consumer recognition object or the payment container at all: a search of every file for `agenticConsumer`, `agenticPaymentContainer`, `idToken`, `contextualData`, `browsingIOU`, `paymentCredentialsHash` and `cardMetadata` returns nothing [src-visa-tap-repo].

### Agent recognition signature: `Signature-Input` and `Signature` headers

| Field | Type | Required | Meaning | File |
| --- | --- | --- | --- | --- |
| `Signature-Input` | RFC 9421 Dictionary Structured Field | Required | Signature metadata: covered components and parameters | Spec [Agent Recognition Signature] |
| `Signature` | RFC 9421 Dictionary Structured Field | Required | The signature value, label `sig2` in every example | Spec [Agent Recognition Signature] |
| `@authority` | covered component | Required (minimum set) | Authority of the target URI | Spec [Required Message Signature Fields] |
| `@path` | covered component | Required (minimum set) | Absolute path of the target URI | Spec [Required Message Signature Fields] |
| `created` | integer (UNIX time) | Required | When the request was created | Spec [Required Message Signature Fields] |
| `expires` | integer (UNIX time) | Required | When the request stops being valid; at most 8 minutes after `created` | Spec [Required Message Signature Fields], [Timestamps] |
| `keyid` | string | Required | Identity of the public key; the merchant may cache it | Spec [Required Message Signature Fields] |
| `alg` | string | Required | Signing algorithm; examples use `"Ed25519"` | Spec [Required Message Signature Fields] |
| `nonce` | string | Required | "A session identifier"; the same nonce is reused across all message signatures in the header and in the signed body objects | Spec [Required Message Signature Fields] |
| `tag` | string | Required | `agent-browser-auth` (browsing) or `agent-payer-auth` (checkout and payment) | Spec [Required Message Signature Fields] |

The spec says an agent or payment scheme may add fields beyond this minimum. The minimum covered set does not include `@method`, `@query`, `@target-uri` or `content-digest` [src-visa-tap-spec].

Inconsistencies inside the spec page: the first header example spells the parameter `keyId` while the table and later examples use `keyid`; the timestamp rule calls the parameter `expired`; the nonce in the code sample differs from the nonce in the header examples; and the "Result String" printed under the Python sample starts with `authority:` (no `@`), shows path `/example.html` and is followed by a second result for `/example-product` [src-visa-tap-spec].

### Agentic Consumer Recognition Object: `agenticConsumer` (request body)

| Field | Type | Required | Meaning | File |
| --- | --- | --- | --- | --- |
| `nonce` | string | Required | Same nonce as the message signature | Spec [Consumer Recognition] |
| `idToken` | JWT | Required | ID Token (see below); the JSON example spells it `"IdToken"` | Spec [Consumer Recognition] |
| `contextualData` | object | Required | Device and location identifiers | Spec [Consumer Recognition] |
| `kid` | string | Required | Key id; should equal the message signature `keyid` | Spec [Consumer Recognition] |
| `alg` | string | Required | Algorithm; example `"PS256"` | Spec [Consumer Recognition] |
| `signature` | string | Required | Signature over all other fields in the order received | Spec [Consumer Recognition] |

The spec says the object comprises "at least" these fields (it says 5 fields and lists 6). Other fields such as a loyalty number or a third-party identity token may be present [src-visa-tap-spec].

### `contextualData`

| Field | Type | Required | Meaning | File |
| --- | --- | --- | --- | --- |
| `countryCode` | string | not stated | ISO 3166-1 alpha-2 country code | Spec [Contextual Data] |
| `zip` | string, 16 characters | not stated | Postal code, or city and state | Spec [Contextual Data] |
| `ipAddress` | string | not stated | IP address of the consumer's device collected during the Payment Instruction | Spec [Contextual Data] |
| `deviceData` | object | not stated | Device data collected during the Payment Instruction (fields not listed) | Spec [Contextual Data] |

### ID Token (Visa implementation)

A JWT per RFC 7519, compatible with an OpenID Connect ID Token, signed by Visa as a JWS (RFC 7515) [src-visa-tap-spec].

| Field | Type | Required (cardinality) | Meaning | File |
| --- | --- | --- | --- | --- |
| header `alg` | string | Required | `none` not supported; PS256 preferred to RS256 | Spec [Token Header] |
| header `kid` | string | Required | Visa key id; key type must match the algorithm | Spec [Token Header] |
| header `typ` | string | Required | Should be `JWT+ext.id_token` | Spec [Token Header] |
| `iss` | string | 1 | Issuer identifier | Spec [Public Claims] |
| `sub` | string | 1 | Locally unique, never reassigned consumer identifier | Spec [Public Claims] |
| `aud` | array | 1..n | Audiences | Spec [Public Claims] |
| `exp` | number | 1 | Expiry | Spec [Public Claims] |
| `iat` | number | 1 | Issued at | Spec [Public Claims] |
| `jti` | string | 0..1 | Token id | Spec [Public Claims] |
| `auth_time` | number | 0..1 | Time of end-user authentication | Spec [Public Claims] |
| `amr` | array | 0..n | Authentication methods used | Spec [Public Claims] |
| `phone_number` | string | 0..1 | Obfuscated phone number (E.164 without the leading `+`) | Spec [Standard ID Token Claims] |
| `phone_number_verified` | boolean | 0..1 | Phone verified by the OpenID Provider | Spec [Standard ID Token Claims] |
| `email` | string | 0..1 | Obfuscated email (RFC 5322, lowercased) | Spec [Standard ID Token Claims] |
| `email_verified` | boolean | 0..1 | Email verified | Spec [Standard ID Token Claims] |
| `phone_number_mask` | string | 0..1 | Masked phone for display | Spec [Private Claims] |
| `email_mask` | string | 0..1 | Masked email for display | Spec [Private Claims] |

The merchant must keep a mapping table from obfuscated (the spec also says "hashed") phone and email values to its own account holders, because no identity arrives in the clear. The hash or obfuscation method is not specified [src-visa-tap-spec].

### Agentic Payment Container: `agenticPaymentContainer` (request body)

| Field | Type | Required | Meaning | File |
| --- | --- | --- | --- | --- |
| `nonce` | string | Required | Same nonce as the message signature | Spec [Payment] |
| `kid` | string | Required | Key id; should equal the message signature `keyid` | Spec [Payment] |
| `alg` | string | Required | Algorithm; example `"PS256"` | Spec [Payment] |
| `signature` | string | Required | Signature over the other fields in the order received | Spec [Payment] |
| `paymentCredentialsHash` | object | Conditional | Present for guest checkout with key entry; the processing section calls it `credentialHash` | Spec [Payment], [Payment Credential Hash] |
| `cardMetadata` | object | Optional | Card details for receipts and display | Spec [Card Metadata] |
| `payload` | encrypted object | Conditional | Full payment object encrypted to the merchant's public key, when the merchant processes by API | Spec [Payment Object] |
| `browsingIOU` | object | Conditional | Present when the merchant asked for payment with an HTTP 402 response | Spec [Browsing IOU] |

The spec says "at least the following 4 fields" (nonce, kid, alg, signature) [src-visa-tap-spec].

### Nested payment objects

| Object | Fields (exact) | Note | File |
| --- | --- | --- | --- |
| `cardMetadata` | `lastFour`, `paymentAccountReference`, `shortDescription`, a list of CardData objects with `contentType`, Content object, `mimeType`, `width`, `height` | Lets the merchant link token or virtual card payments to one funding account through the PAR | Spec [Card Metadata] |
| Payment credential hash | hash over 16-digit account number, 2-digit expiry month, 2-digit expiry year, 3-digit security code | Merchant hashes the key-entered values and compares; mismatch means decline. Hash algorithm not stated | Spec [Payment Credential Hash] |
| `payload` | Token object (`paymentToken`, `expirationMonth`, `expirationYear`, `cardholderName`, `dynamicData`), ShippingAddress object, BillingAddress object, `consumerEmailAddress`, `consumerName`, `consumerMobileNumber` | Encrypted with the merchant public key that the merchant onboards to each scheme | Spec [Payment Object] |
| `browsingIOU` | `invoiceId`, `amount`, `cardAcceptorId`, `acquirerId`, `uri`, `sequenceCounter`, `paymentService`, `kid`, `alg`, `signature` | Merchant checks the IOU against its 402 response and the signature, then grants access expecting funds at settlement | Spec [Browsing IOU] |

### Public key retrieval (key store)

| Field | Type | Meaning | File |
| --- | --- | --- | --- |
| Well-known URL | URL | `https://mcp.visa.com/.well-known/jwks` | Spec [Public Keys Retrieval Service] |
| Operation | HTTP | `GET` on path `/keys` with parameter `keyID` (the spec's "Public Key Retrieval Definition") | Spec [Public Key Retrieval] |
| JWK `kty` | string | Key type (`RSA`, `EC`, `oct`) | Spec [Public Key Retrieval] |
| JWK `kid` | string | Key id | Spec [Public Key Retrieval] |
| JWK `use` | string | `sig` | Spec [Public Key Retrieval] |
| JWK `alg` | string | For example `PS256`, `ES256` | Spec [Public Key Retrieval] |
| JWK `n`, `e` | base64url | RSA modulus and exponent | Spec [Public Key Retrieval] |

**What the key store returned on 2026-10-11.** `GET https://mcp.visa.com/.well-known/jwks` returned HTTP 200 (`application/json`, `cache-control: public, max-age=3600`, served through Cloudflare) with a JWKS of one key: `kty` `RSA` (2048-bit modulus), a UUID `kid`, `n`, `e` and an `x5c` chain. It has no `alg` and no `use` member. The certificate subject is `CN=vic-oauth-jwe.visa.com`, issued by "Visa Sandbox Issuing CA" (O=Visa Inc.), valid 2025-07-11 to 2027-09-29, extended key usage TLS client authentication. No Ed25519 (OKP) key is published, so the Ed25519 `keyid` in the spec's examples cannot be resolved from this endpoint. The name suggests a key for VIC OAuth or JWE work rather than agent message signatures, but Visa does not say so; how merchants obtain agent keys in production is not public [src-visa-tap-jwks].

### Sample repository objects (not spec)

| Object | Fields | File |
| --- | --- | --- |
| Agent registry `Agent` | `id`, `name`, `domain` (unique), `description`, `contact_email`, `is_active` (string `"true"`), `created_at`, `updated_at` | agent-registry/models.py |
| Agent registry `AgentKey` | `id`, `agent_id`, `key_id`, `public_key` (PEM for RSA, base64 for Ed25519), `algorithm` (default `RSA-SHA256`), `description`, `is_active`, `created_at`, `updated_at` | agent-registry/models.py, schemas.py |
| Sample `Signature-Input` | `sig2=("@authority" "@path"); created=...; expires=...; keyId="..."; alg="ed25519" or "rsa-pss-sha256"; nonce="<uuid4>"; tag="..."` with `expires = created + 8 * 60` | tap-agent/agent_app.py |
| Merchant backend parser | expects `Signature-Agent`, label `sig1`, order `nonce`, `created`, `expires`, `keyid`, `tag`, components such as `directory-agent` and `query-param` | merchant-backend/app/security/signature_verification.py |

Sources: [src-visa-tap-agent-registry] [src-visa-tap-agent-app] [src-visa-tap-merchant-verifier].

## Message flows step by step (happy path and failures)

TAP defines verification procedures, not an HTTP API. All flows below are from the specification [src-visa-tap-spec] unless another source is named. Visa says the agent side (how signatures are generated) is in the "Visa Intelligent Commerce Client Implementation Guide for onboarded agents", which is not public [src-visa-tap-overview].

### Flow A: browsing request (product detail page), `agent-browser-auth`

| # | From | To | Message or call | Spec reference | What can fail |
| --- | --- | --- | --- | --- | --- |
| 1 | Agent | Merchant (through Checkout Enabler and Site Protection Provider) | `GET https://www.example.com/example-product` with `Signature-Input: sig2=("@authority" "@path"); created=...; keyid=...; alg="Ed25519"; expires=...; nonce=...; tag="agent-browser-auth"` and `Signature: sig2=:...:` | [Sample Browsing Request] | Checkout Enabler strips headers (spec only expects pass-through) |
| 2 | Verifier (merchant or CDN) | | Look for a `Signature-Input` with tag `agent-browser-auth` or `agent-payer-auth` | [Verification Steps] | No such tag: "not signed by a trusted agent"; merchant may block or use other means |
| 3 | Verifier | | Check every minimum field is present | [Minimum fields] | Any missing: block |
| 4 | Verifier | | `created` in the past, `expires` in the future, interval no more than 8 minutes | [Timestamps] | Block |
| 5 | Verifier | | If keeping nonces from the last 8 minutes, reject a repeated nonce | [Nonce] | Repeated: block. Tracking is conditional ("If maintaining a record") |
| 6 | Verifier | Key store | Use cached key for `keyid` or fetch it (Visa: `https://mcp.visa.com/.well-known/jwks`) | [Locate the public key], [Public Keys Retrieval Service] | Key not retrievable or expired: block |
| 7 | Verifier | | Rebuild the signature base and verify with the key | [Validate the signature] | Fails: block |
| 8 | Verifier | Merchant | Treat as a trusted agent seeking product details or paying; may still limit the interaction | [Verification Steps] | |
| 9 | Agent | Merchant | Optional `agenticConsumer` object in the request body with the same `nonce` and `kid` | [Consumer Recognition] | See Flow C |

### Flow B: checkout request, `agent-payer-auth`

Same as Flow A with URL `https://www.example.com/checkout` and `tag="agent-payer-auth"` [Sample Checkout Request]. The body may carry `agenticConsumer` and should carry `agenticPaymentContainer` with the same `nonce` and `kid`. What the container holds depends on the merchant's processing path: a credential hash for key-entered guest checkout, an encrypted `payload` when a network token is expected, or a `browsingIOU` after an HTTP 402 [src-visa-tap-spec].

### Flow C: consumer recognition object verification

| # | Step | Spec reference | Outcome on failure |
| --- | --- | --- | --- |
| 1 | Check the minimum fields (`nonce`, `idToken`, `contextualData`, `kid`, `alg`, `signature`) | [Consumer Recognition, Minimum fields] | "content may be inaccurate" |
| 2 | Compare `nonce` with the message signature nonce | [Nonce] | content may be inaccurate even if the signature verifies |
| 3 | Locate the key for `kid` | [Locate the public key] | content may be inaccurate |
| 4 | Build the base from all fields in the order received except `signature`, then verify | [Validate the signature] | content may be inaccurate |
| 5 | Verify the ID Token JWS with Visa's key (`kid` in the JWT header) and map obfuscated email or phone to own accounts | [ID Token], [Processing of Identity Data] | Merchant decides |

The merchant may use the data even if verification fails ("at the discretion of the Merchant") [src-visa-tap-spec].

### Flow D: payment container verification

| # | Step | Spec reference | Outcome on failure |
| --- | --- | --- | --- |
| 1 | Check `nonce`, `kid`, `alg`, `signature` are present | [Payment, Minimum fields] | Must not be used for any payment |
| 2 | Compare `nonce` with the message signature nonce; may be skipped when a payment is required without a message signature | [Nonce] | Must not be used |
| 3 | Locate the key for `kid` | [Locate the public key] | "may be inaccurate" (weaker wording than steps 1, 2 and 4) |
| 4 | Build the base (all fields in order, minus `signature`) and verify | [Validate the signature] | Must not be used |
| 5 | Process by type: compare credential hash with the hash of key-entered card data (mismatch: decline); decrypt `payload` with the merchant private key; or check `browsingIOU` against the 402 response | [Processing of Payment Data] | Decline or deny access |

### Flow E: HTTP 402 and `browsingIOU` (paid content)

1. Agent requests a resource; merchant answers HTTP 402 with `invoiceId`, `amount` and a card acceptor id (CAID). The spec does not define the 402 response format, header or body [src-visa-tap-spec].
2. Agent retries with `agenticPaymentContainer.browsingIOU` carrying `invoiceId`, `amount`, `cardAcceptorId`, `acquirerId`, `uri`, `sequenceCounter`, `paymentService`, `kid`, `alg`, `signature`.
3. Merchant checks the IOU against its 402 data and verifies the signature, then grants access "with the expectation that the funds will be available when settlement occurs". No settlement mechanism, timing or liability is specified [src-visa-tap-spec].

### Flow F: Cloudflare edge verification (deployed variant)

Cloudflare's 2025-10-24 post lists the checks it runs: (1) `Signature-Input` and `Signature` present; (2) take `keyid`, fetch and cache the key from the public key directory; (3) current time between `created` and `expires`; (4) nonce not seen recently; (5) tag valid: `agent-browser-auth` when browsing, `agent-payer-auth` when paying; (6) rebuild the signature base from the components in `Signature-Input`; (7) Ed25519 verification [src-visa-tap-cf-blog]. The same post's example request uses `tag="web-bot-auth"`, which contradicts step 5; Cloudflare's numbered checks match the Visa spec.

### Flow G: sample repository flow (not spec)

The Streamlit agent generates a UUID nonce, `created = now`, `expires = created + 8 * 60`, and signs `"@authority"`, `"@path"` and `"@signature-params"` with Ed25519 (default) or RSA-PSS; it drives a Playwright browser with the headers to product, cart and checkout pages. The sample CDN proxy only requires signatures on paths starting with `/product/`; every other path (including `/api` and checkout pages) is forwarded without verification [src-visa-tap-agent-app] [src-visa-tap-cdn-proxy].

## State machines

TAP defines no stateful objects. The only state is verifier-side:

| State holder | States | Transition | Source |
| --- | --- | --- | --- |
| Nonce record (optional) | unseen, seen (kept for 8 minutes) | first valid use marks seen; repeat within 8 minutes blocks | [src-visa-tap-spec] |
| Key cache | not cached, cached, expired | fetch by `keyid`; expired key blocks | [src-visa-tap-spec] |
| Signature validity window | not yet valid, valid (up to 8 minutes), expired | `created` and `expires` | [src-visa-tap-spec] |
| Sample registry key (not spec) | `is_active` `"true"` or other | `DELETE /agents/{agent_id}` deactivates the agent; proxy rejects inactive keys | [src-visa-tap-agent-registry] [src-visa-tap-cdn-proxy] |
| Browsing IOU (implied) | issued in 402, presented, accepted, settled | settlement not specified | [src-visa-tap-spec] |

A purchase instruction lifecycle exists in VIC, not in TAP: the `visa/ai` client calls `POST /vacp/v1/instructions`, `PUT /vacp/v1/instructions/{instructionId}`, `PUT /vacp/v1/instructions/{instructionId}/cancel`, `POST /vacp/v1/instructions/{instructionId}/credentials` and `POST /vacp/v1/instructions/{instructionId}/confirmations`, plus `POST /vacp/v1/cards` for enrollment [src-visa-ai-vic-client].

## Transports

- **HTTP headers.** `Signature-Input` and `Signature` (RFC 9421) on HTTP requests; the spec says "HTTP header, REST API header or similar message header" [src-visa-tap-spec].
- **Request body.** `agenticConsumer` and `agenticPaymentContainer` JSON objects in the request body. The spec does not say how they are carried on a `GET` browsing request [src-visa-tap-spec]. The repository README says identifiers arrive "via query parameters" [src-visa-tap-repo]; the spec says Checkout Enablers must pass through "message signatures and query parameters". The carrying format is therefore not fixed in public text.
- **Other channels.** The spec says the agent can communicate over web or API channels and protocols such as MCP and ACP [src-visa-tap-spec]; the press release says TAP is "extendable to non-web message protocols" [src-visa-tap-pr]. No binding for MCP or ACP is published.
- **Key retrieval.** HTTPS `GET` of a JWKS at `https://mcp.visa.com/.well-known/jwks`, plus a `GET /keys` operation with a `keyID` parameter whose host is not named [src-visa-tap-spec].
- **CDN layer.** Verification can run at the merchant or at a Site Protection Provider (Cloudflare, Akamai) [src-visa-tap-spec] [src-visa-tap-cf-blog].

## Cryptography and standards used

| Standard | Use in TAP | Date checked | Source |
| --- | --- | --- | --- |
| RFC 9421 HTTP Message Signatures | Agent recognition signature; `Signature-Input`, `Signature`, derived components `@authority`, `@path`, parameters `created`, `expires`, `keyid`, `alg`, `nonce`, `tag` | RFC dated February 2024, Standards Track | [src-rfc9421] |
| RFC 9530 Digest Fields | Not used by TAP; TAP does not require `Content-Digest`, so request bodies (including the signed objects' transport) are not covered by the message signature | RFC dated February 2024, obsoletes RFC 3230 | [src-rfc9530] [src-visa-tap-spec] |
| Ed25519 | Message signature algorithm in spec examples (`alg="Ed25519"`) | | [src-visa-tap-spec] |
| PS256 (RSASSA-PSS with SHA-256, JOSE name) | Example `alg` for the body objects and preferred for the ID Token | | [src-visa-tap-spec] |
| RFC 7519 JWT, RFC 7515 JWS, RFC 7518 | ID Token format and algorithms; `none` not supported | | [src-visa-tap-spec] |
| OpenID Connect ID Token claims | `iss`, `sub`, `aud`, `exp`, `iat`, `auth_time`, `amr`, `email`, `phone_number` and verified flags | | [src-visa-tap-spec] |
| JWK / JWKS | Key store format | | [src-visa-tap-spec] [src-visa-tap-jwks] |
| Merchant public key encryption | Encrypts `payload`; algorithm and format not specified | | [src-visa-tap-spec] |
| ISO 3166-1 alpha-2, E.164, RFC 5322 | Country code, phone format, email format | | [src-visa-tap-spec] |

**Algorithm naming.** RFC 9421 says `alg` values must come from the IANA "HTTP Signature Algorithms" registry, whose initial entries are `rsa-pss-sha512`, `rsa-v1_5-sha256`, `hmac-sha256`, `ecdsa-p256-sha256`, `ecdsa-p384-sha384` and `ed25519` (lowercase) [src-rfc9421]. The TAP spec uses `"Ed25519"` in the header examples and the JOSE name `"PS256"` in body objects. The sample code uses `ed25519` and `rsa-pss-sha256`; `rsa-pss-sha256` is not in the RFC 9421 initial registry [src-visa-tap-agent-app] [src-rfc9421].

**Signature base construction.** RFC 9421 requires each component line as `"<component>": <value>` and `"@signature-params"` as the last line, with the parameters serialized as a Structured Field (no spaces after `;`) [src-rfc9421]. The spec's Python sample writes `@authority:` and `@path:` without quotes around the component names, while it quotes `"@signature-params"`; the sample agent and CDN proxy quote all three but join parameters with `"; "` (a space after each semicolon) and copy the raw header text into the base. The sample merchant backend builds a non-RFC base (`"nonce": ...`, `"created": ...`, `"expires": ...` lines, no `@signature-params`) and verifies RSA-PSS only [src-visa-tap-spec] [src-visa-tap-agent-app] [src-visa-tap-cdn-proxy] [src-visa-tap-merchant-verifier]. Both sides of the sample use the same non-canonical serialization, so they interoperate with each other but not necessarily with a strict RFC 9421 library. Open PR #21 (2026-07-15) proposes to make the merchant verifier conform [src-visa-tap-gh-meta].

**Body object signatures.** The base is "a canonical representation of all fields in the object in the order received except for the signature itself". No canonicalization (such as JCS, RFC 8785) or JWS serialization is named, and no test vector exists; issue #23 asks for one [src-visa-tap-spec] [src-visa-tap-gh-meta]. The sample agent's generic `create_signature` signs base64 of a key-sorted compact JSON string with RSA-PSS; this is not described in the spec [src-visa-tap-agent-app].

### TAP compared with the Web Bot Auth working group draft

`draft-ietf-webbotauth-httpsig-protocol-00` ("HTTP Message Signatures for automated traffic", T. Meunier of Cloudflare and S. Major of Google) was posted 2026-09-01; -00 is the current revision on 2026-10-11 and it expires 2027-03-05 [src-wba-draft]. TAP launched on 2025-10-14, almost eleven months earlier, so the WG draft cannot be its basis. Both use RFC 9421, and the TAP spec says it is "aligned with web-bot-auth" [src-visa-tap-spec].

| Aspect | TAP (Visa spec) | Web Bot Auth WG draft -00 |
| --- | --- | --- |
| `tag` | `agent-browser-auth` or `agent-payer-auth` | MUST be `web-bot-auth` |
| Key discovery header | none; `Signature-Agent` not in the required fields | `Signature-Agent` is REQUIRED (Dictionary Structured Header, https URI) and must be covered by the signature |
| Covered components | `@authority` and `@path` required | at least one of `@authority` or `@target-uri`; `@method`, `@path`, `@target-uri`, `@query-param` SHOULD be added to narrow scope |
| `nonce` | required; a session identifier shared with body objects; uniqueness tracking optional | not required by the draft; replay protection deferred to RFC 9421 Section 7.2.2 |
| `keyid` | opaque string; examples are 43-character base64url strings | MUST be a base64url JWK SHA-256 thumbprint |
| `alg` | required | not in the required list |
| Validity window | `expires - created` no more than 8 minutes | expiry RECOMMENDED no more than 24 hours |
| Key directory | Visa-hosted `https://mcp.visa.com/.well-known/jwks` | `/.well-known/http-message-signatures-directory` with media type `application/http-message-signatures-directory+json` |
| Body coverage | none; separate signed body objects | none by default; `Content-Digest` (RFC 9530) if needed |
| Status | Visa specification under proprietary Product Terms | IETF working group Internet-Draft, Revised BSD license for code |

Sources: [src-visa-tap-spec] [src-wba-draft] [src-rfc9530]. Note that the TAP spec's prose about the signature base mentions "signature agent" among the attributes, but no `Signature-Agent` component appears in its required fields or examples [src-visa-tap-spec]. The Cloudflare post says both Visa and Mastercard protocols "build on Web Bot Auth by introducing a new tag" and require a `nonce` [src-visa-tap-cf-blog].

## Security model and published attacks or CVEs

**What TAP claims to provide.** The spec lists strong identity (a registered key implies program participation), tamper-proof requests, replay protection through timestamps and nonces, and no reliance on IP addresses or header overloading [src-visa-tap-spec]. Visa's threat-landscape post (2025-11-20) adds that TAP "integrates continuous telemetry into Visa's fraud and risk models" [src-visa-threats].

**Trust anchors.** Trust rests on (1) Visa's onboarding of agents into VIC, which is not public, and (2) the key store that Visa hosts. The spec says the goal "would be to have a shared approach across Payment Schemes", but today each scheme hosts its own directory [src-visa-tap-spec] [src-visa-tap-cf-blog].

**Advisories and CVEs.** The GitHub security advisories API for `visa/trusted-agent-protocol` returns an empty list on 2026-10-11, and no CVE naming TAP was found [src-visa-tap-gh-meta]. No published academic attack on TAP was found; the formal analysis arXiv 2609.00060 (2026-08-30) models x402, MPP, ACP and AP2 in Tamarin and does not model TAP [src-pub-2609-00060].

**Weaknesses found in the public material (analysis by this dossier, each tied to a source):**

| # | Weakness | Evidence | Source |
| --- | --- | --- | --- |
| S1 | The minimum covered components are `@authority` and `@path`. `@method`, `@query` or `@target-uri`, and `Content-Digest` are not required, so the method, the query string and the body are not bound. The WG draft itself warns that a signature over the authority alone can be reused against any method, path or body until it expires. | Required fields table; WBA draft Section 5.2 | [src-visa-tap-spec] [src-wba-draft] [src-rfc9530] |
| S2 | Nonce tracking is conditional ("If maintaining a record of all nonces ... in the last 8 minutes"), so replay protection depends on the verifier choosing to keep state. The nonce is also defined as a session identifier reused across signatures, not as a per-request value. | Nonce step; field table | [src-visa-tap-spec] |
| S3 | The spec's own example has `created=1735689600` and `expires=1735693200`, a 3,600-second (60-minute) window, which breaks its 8-minute rule. | Sample requests | [src-visa-tap-spec] |
| S4 | The example `Signature` value is identical in the browsing and checkout samples although the tags differ, and it equals the signature in the Web Bot Auth draft test vector E.2.2, which signs a different base (`"@authority"` and `"signature-agent"`, tag `web-bot-auth`). The TAP examples therefore cannot verify as shown; they are placeholders. The example `keyid` and nonce also come from that test vector. | Sample requests; WBA draft Appendix E.2.2 | [src-visa-tap-spec] [src-wba-draft] |
| S5 | Body object signature bases are "all fields in the order received", with no canonicalization or test vector; independent implementations can disagree. | Consumer Recognition and Payment verification steps; issue #23 | [src-visa-tap-spec] [src-visa-tap-gh-meta] |
| S6 | Consumer recognition data may be used even when verification fails, at the merchant's discretion. | Verification Steps | [src-visa-tap-spec] |
| S7 | The payment container key lookup failure leads only to "may be inaccurate", unlike the other payment checks, which say the data must not be used. | Payment verification steps | [src-visa-tap-spec] |
| S8 | The payment credential hash covers PAN, expiry and a 3-digit CVV with no salt or algorithm stated; card data has low entropy, so an unsalted hash could be brute-forced by anyone who sees it. | Payment Credential Hash | [src-visa-tap-spec] |
| S9 | Sample code deviates from RFC 9421: unregistered `alg` value `rsa-pss-sha256`; `keyId` instead of `keyid`; spaces in the serialized `@signature-params`; the merchant backend builds a non-RFC base; the CDN proxy does not check the tag or the 8-minute window, keeps nonces for 1 hour, caches keys for 5 ms, records a nonce before verifying the signature, and protects only `/product/` paths; rate limiting is commented out. | Source files | [src-visa-tap-cdn-proxy] [src-visa-tap-merchant-verifier] [src-visa-tap-agent-app] |
| S10 | The sample agent registry has no authentication on `POST /agents/register` or key endpoints. It is a demo, but it is the only public model of a key registry. | agent-registry/main.py | [src-visa-tap-agent-registry] |
| S11 | The live Visa JWKS publishes one RSA key from a sandbox CA, with no `alg` or `use`, and no Ed25519 key; the examples' Ed25519 `keyid` is not resolvable there. | Live fetch | [src-visa-tap-jwks] |
| S12 | The spec says the `browsingIOU` lets the merchant grant access "with the expectation that the funds will be available when settlement occurs", with no settlement or default rules. | Browsing IOU | [src-visa-tap-spec] |

## Controls (native and gaps)

Mapped to the 14 control ids in `CONTROL_IDS` (`src/lib/schemas.ts`). "native" means TAP itself specifies it; "external" means another Visa product (usually VIC) does; "partial" means TAP covers part; "none" means nothing public.

| Control id | Support | Note | Sources |
| --- | --- | --- | --- |
| `agent-identity-verification` | native | RFC 9421 signature with a key from the scheme's key store; tag shows browse or pay intent | [src-visa-tap-spec] |
| `agent-registration-kya` | external | Agents are onboarded to VIC and approved by the scheme; process not public. Agentic Directory (2026-06-10) lists Visa-verified agents and merchants | [src-visa-tap-spec] [src-visa-jun10] |
| `user-consent-capture` | external | Consent and passkey-authenticated Payment Instructions live in VIC, not in TAP; the ID Token carries `auth_time` and `amr` | [src-visa-vic-dev] [src-visa-tap-spec] |
| `spending-caps` | external | VIC Payment Instructions and network-level controls; TAP carries no amount limits | [src-visa-vic-dev] |
| `merchant-payee-scoping` | partial | `@authority` binds the signature to the merchant domain; VIC checks the authorization comes from the intended merchant | [src-visa-tap-spec] [src-visa-vic-dev] |
| `time-windows-expiry` | native | `created` and `expires`, at most 8 minutes apart | [src-visa-tap-spec] |
| `revocation` | partial | Key expiry or removal from the key store blocks verification; no revocation list or status endpoint is specified | [src-visa-tap-spec] |
| `step-up-authentication` | external | VIC step-up verification and Visa Payment Passkeys | [src-visa-vic-dev] [src-visa-eu-live] |
| `replay-protection` | partial | Nonce and time window; nonce tracking optional | [src-visa-tap-spec] |
| `receipts-evidence` | none | TAP defines no receipt; VIC commerce signals and confirmations serve dispute resolution | [src-visa-vic-dev] [src-visa-ai-vic-client] |
| `dispute-support` | external | VIC "Signals" support "quick resolution of most disputes"; no agent-specific liability shift published | [src-visa-vic-dev] [src-worldpay-liability] |
| `reputation` | none | No reputation mechanism in TAP; Agent Score rates merchant sites for agent readiness, not agents | [src-visa-jun10] |
| `monitoring-signals` | partial | Visa says TAP feeds telemetry into its fraud models; CDNs log verification results | [src-visa-threats] [src-visa-tap-cf-blog] |
| `kill-switch` | partial | Visa can remove a key from its directory; a merchant can block untagged or failing requests; no documented emergency procedure | [src-visa-tap-spec] |

## Observability (public versus private data)

| Item | Public or private | Details | Source |
| --- | --- | --- | --- |
| Key store `https://mcp.visa.com/.well-known/jwks` | public | One RSA key on 2026-10-11, `cache-control: public, max-age=3600`; can be polled to watch for key changes | [src-visa-tap-jwks] |
| `.well-known` paths | public | Only `/.well-known/jwks` on `mcp.visa.com`; TAP does not use `/.well-known/http-message-signatures-directory` | [src-visa-tap-spec] [src-wba-draft] |
| Per-request headers | visible to the merchant, CDN and any intermediary | `Signature-Input` shows `keyid`, `tag`, `nonce` and timestamps in clear text | [src-visa-tap-spec] |
| Agentic Directory | not published as an open list | Announced 2026-06-10; no public endpoint or list found | [src-visa-jun10] |
| Cloudflare signals | private to the zone owner | Cloudflare Bot Management field `cf.bot_management.signed_agent`; since 2026-07-01 signed agents are a category of Verified bots (Direct or Intermediary access) | [src-cf-verified-bots] |
| Visa telemetry | private | TAP data feeds Visa risk models | [src-visa-threats] |
| VIC transaction signals | private | `POST /vacp/v1/instructions/{instructionId}/confirmations` reports outcomes to Visa | [src-visa-ai-vic-client] |
| Counts of verifying merchants or signed requests | none published | No public count of merchants that verify TAP or of TAP-signed requests was found | [src-visa-eu-live] |
| Event names, on-chain explorers, indexers | none | TAP is off-chain and defines no events | [src-visa-tap-spec] |

## Compliance touchpoints

- **Personal data.** `contextualData` carries the consumer's `ipAddress`, `deviceData`, `countryCode` and `zip`; the ID Token carries obfuscated email and phone, masks and a stable `sub`. Under GDPR an IP address and device data are generally personal data; the Product Terms make the implementer solely responsible for disclosures and consents and say Visa is not liable for them [src-visa-tap-spec] [src-visa-tap-terms].
- **PCI DSS.** A merchant that decrypts the `payload` receives a payment token, expiry, cardholder name and `dynamicData`; the credential hash flow involves key-entered PAN and CVV at the merchant. The spec says nothing about PCI scope. Visa says Intelligent Commerce Connect can handle "orchestration and PCI compliance" for enablers [src-visa-tap-spec] [src-visa-icc].
- **Strong Customer Authentication (EU).** Visa says every Agentic Ready transaction in Europe used Visa Payment Passkeys, supporting SCA compliance; SCA sits in VIC, not TAP [src-visa-eu-live].
- **Bot and anti-fraud rules.** Merchants may block untagged requests; Cloudflare and Akamai apply the checks at the edge [src-visa-tap-spec] [src-visa-tap-cf-blog] [src-akamai-pr].
- **Licensing.** Implementers must apply each Visa Update within six months and at least annually, and must implement the most current spec in full [src-visa-tap-terms].
- **Liability.** No agent-specific liability shift had been published as of 2026-07-30 (Worldpay) [src-worldpay-liability].

## Ecosystem and SDKs

| Item | Kind | Status (date) | Source |
| --- | --- | --- | --- |
| `visa/trusted-agent-protocol` | Python and Node.js sample (agent, merchant, CDN proxy, registry) | Last commit 2025-10-28; no packages published | [src-visa-tap-gh-meta] |
| `visa/ai` (was `visa/mcp`) | MIT; npm workspace packages `@visa/token-manager`, `@visa/mcp-client`, `@visa/api-client` at version 1.0.0 in `package.json`; VIC MCP and API examples; `vic-agent` demo | Last commit 2026-09-30; `npm view` returns E404 for all three names on 2026-10-11 (workspace packages, not published) | [src-visa-ai-repo] |
| Visa MCP server | `https://sandbox.mcp.visa.com` (sandbox base URL in examples); documentation MCP at `https://sandbox.mcp.visa.com/mcp/doc` | Announced 2025-09-04, in pilot | [src-visa-ai-repo] [src-visa-mcp-server] |
| `visa/vic-reference-agent` | Proprietary reference app | Created 2026-01-23; evaluation license | [src-visa-vic-ref-agent] |
| `mpp-card` (npm) | Visa's card SDK for MPP, "SEE LICENSE IN LICENSE" (Visa terms) | 0.1.8 published 2026-03-18; created 2026-03-12 | [src-npm-mpp-card] |
| `mppx` (npm) | MPP TypeScript SDK with `mppx/attestation/tap` signer and verifier (tags `agent-browser-auth`, `agent-payer-auth`, 480-second default and maximum lifetime, label `tap`) | Identity support blog 2026-08-12; npm `latest` 0.13.4 (modified 2026-10-08) | [src-mppx-tap] [src-mpp-identity] |
| Cloudflare | Edge verification of TAP signatures; planned Agents SDK support and managed rules | Announced 2025-10-24 | [src-visa-tap-cf-blog] |
| Akamai | TAP supported across Akamai Cloud | Announced 2025-12-17 | [src-akamai-pr] [src-visa-dec18] |
| Intelligent Commerce Connect | Visa on-ramp that accepts TAP, MPP, ACP and UCP payments | Pilot, announced 2026-04-08 | [src-visa-icc] |
| Agentic Directory, Agent Score | Directory of Visa-verified agents and merchants; site readiness score built with New Generation | Announced 2026-06-10 | [src-visa-jun10] |
| Merchants using TAP | lastminute.com, Frasers, Cleverbridge, BrickDepot (Europe, live); eDreams ODIGEO brands (announced 2026-07-03) | 2026-07-02, 2026-07-03 | [src-visa-eu-live] [src-edreams-pymnts] |

No TAP-specific package exists on npm or PyPI from Visa. Community PRs to the sample repository (x402, DID resolution, ML-DSA) were not merged [src-visa-tap-gh-meta].

## Fees and costs

| Fact | Date | Source | Caveat |
| --- | --- | --- | --- |
| VIC developer page: "Free to use in Sandbox. Contact Visa for fees in Production." | read 2026-10-11 | [src-visa-vic-dev] | primary; the TAP overview page shows no fee section |
| TAP license: no fee stated in the Product Terms; production use needs no Solution Approval | 2025-10-10 | [src-visa-tap-terms] | primary |
| Nevermined review: sandbox free, production pricing by contacting Visa, no universal production price in public documentation | 2026-08-19 | [src-nevermined-vic] | secondary review |
| Merchant Cost Consulting: no new agentic interchange categories or dates disclosed; the author expects new network fee categories (opinion) | 2026-05-01 | [src-mcc-2026] | secondary opinion; page blocked on 2026-10-11, figure taken from ATLAS_FOLLOWUP Appendix B |
| Worldpay: "No liability shift exists yet"; properly authenticated tokenized agent transactions follow existing tokenized-transaction rules | 2026-07-30 | [src-worldpay-liability] | acquirer analysis |
| CDN cost: Cloudflare's signed-agent field requires Enterprise with Bot Management | read 2026-10-11 | [src-cf-signed-agent-field] | primary docs; no TAP-specific price |

No agent-specific interchange, token fee, 3DS rule or liability allocation for TAP was found in Visa's public material on 2026-10-11 [src-visa-vic-dev] [src-visa-tap-terms].

## Metrics with dates and caveats

| Metric | Value | As of | Source | Caveat |
| --- | --- | --- | --- | --- |
| AI-driven traffic to US retail sites | up over 4,700% in a year | Adobe data, August 2025 (cited 2025-10-14) | [src-visa-tap-pr] | Adobe figure quoted by Visa; not about TAP traffic |
| Malicious bot-initiated transactions | up 25% in six months; US up 40% | Visa post 2025-11-20 | [src-visa-threats] | Visa internal data (PERC); not TAP-specific |
| Agent-initiated transactions completed with partners | "hundreds" | 2025-12-18 | [src-visa-dec18] | VIC, controlled real-world; not TAP-specific |
| Partners in VIC | more than 100; over 30 building in sandbox; over 20 agents and enablers integrating | 2025-12-18 | [src-visa-dec18] | Visa self-reported |
| Akamai AI bot traffic | up 300% in a year; more than 25 billion AI bot requests to commerce in two months | 2025-12-17 | [src-akamai-pr] | Akamai report |
| Agentic Ready early issuers (Europe) | 21 named | 2026-03-17 | [src-visa-ar-eu] | issuers, not merchants |
| Agentic Ready partners | more than 20 live in UK and Europe; 85+ planned in Asia Pacific and Latin America | 2026-04-29 | [src-visa-ar-global] | |
| European issuers with live agent purchases | 31 named ("over 30") | 2026-07-02 | [src-visa-eu-live] | merchant side enabled through TAP and the directory |
| Merchants named as using TAP live | 4 (lastminute.com, Frasers, Cleverbridge, BrickDepot) | 2026-07-02 | [src-visa-eu-live] | no total count of verifying merchants published |
| Reference repository | 212 stars, 45 forks, 6 commits | 2026-10-11 | [src-visa-tap-gh-meta] | |

## Relations to the other seven protocols

- **x402.** Visa is a Premier member of the x402 Foundation (Linux Foundation, 2026-07-14) [src-x402-lf-july]. The TAP launch release says Visa is "collaborating with Coinbase to align on interoperability with x402" [src-visa-tap-pr]. Mechanism in TAP: the `browsingIOU` object answers a merchant's HTTP 402, but it is a card-acquiring IOU (`cardAcceptorId`, `acquirerId`) and uses none of x402's headers or payloads [src-visa-tap-spec]. The sample merchant backend returns `402` with an ad hoc JSON body (`payment_type` `"x402_delegation"`) and `X-Payment-*` headers, which are not x402's wire format [src-visa-tap-repo]. A community PR "Feat/x402 implementation" (#11) is unmerged [src-visa-tap-gh-meta].
- **Stripe MPP.** Visa authored the MPP card method: `draft-card-charge-00` lists Jacob Brans (Visa) as author and says the client "may include" TAP signature headers "for additional identity assurance" [src-mpp-card-draft]. Visa's 2026-03-18 post says the card spec and the `mpp-card` SDK are built on VIC and TAP [src-visa-mpp-card]. `mppx` ships a TAP attestation profile (blog 2026-08-12) [src-mpp-identity] [src-mppx-tap].
- **OpenAI ACP.** The TAP release says Visa will ensure TAP complements ACP [src-visa-tap-pr]; the spec says agents can communicate over protocols such as ACP [src-visa-tap-spec]; Intelligent Commerce Connect accepts ACP payments [src-visa-icc]. No ACP specification file in the cloned `acp` repository mentions TAP. No wire-level binding is published.
- **UCP.** UCP has its own RFC 9421 request signing with `Content-Digest` and keys in `/.well-known/ucp`, plus an optional Web Bot Auth profile (`Signature-Agent`, `tag="web-bot-auth"`, RFC 7638 thumbprint `keyid`) [src-ucp-signatures]. That is closer to the IETF draft than TAP is. The UCP spec never names TAP. Visa is listed as an endorser on ucp.dev, and Intelligent Commerce Connect accepts UCP [src-ucp-site] [src-visa-icc].
- **AP2.** No documented relation. The AP2 repository does not mention Visa or TAP [src-ap2-repo]. The only institutional link is FIDO: Visa co-chairs the FIDO Payments Working Group (launched 2025-04-29), and Google contributed AP2 to the FIDO Alliance on 2026-04-28 [src-fido-pwg] [src-fido-agentic].
- **Mastercard Agent Pay.** Same pattern: Cloudflare says both protocols build on Web Bot Auth with a new browse or pay tag and a mandatory nonce, and each network hosts its own directory of registered agents [src-visa-tap-cf-blog]. Both networks use "agentic token" language for their own network tokens: Stripe and Visa call Visa's credentials "agentic network tokens", while "Agentic Tokens" is Mastercard's name for Agent Pay credentials; they are separate products on separate networks [src-stripe-spt] [src-mc-agentic-tokens].
- **ERC-8004.** No documented relation. TAP identities are keys in a Visa-hosted JWKS; ERC-8004 identities are ERC-721 tokens on public chains. No Visa or ERC-8004 source links them [src-visa-tap-spec].
- **Web Bot Auth and Cloudflare signed agents (orbit).** Covered under Cryptography. Since 2026-07-01 Cloudflare treats signed agents as Verified bots distinguished by Direct or Intermediary access [src-cf-verified-bots].

## Criticisms and open questions

- **Proprietary and revocable.** The license is revocable, forbids modification and requires full, current conformance within six months of each update; implementers bear consent obligations [src-visa-tap-terms]. Visa calls TAP "an open framework" (2025-12-18) and the release says "ecosystem-led", yet it is not under an open license or a standards body [src-visa-dec18] [src-visa-tap-pr].
- **One directory per network.** Each network hosts its own key directory; the spec's shared cross-scheme approach is only a goal [src-visa-tap-spec] [src-visa-tap-cf-blog].
- **Spec quality.** No version, no changelog, typos ("RCF 9421"), contradictory examples, and no test vectors (see S3, S4, S5) [src-visa-tap-spec].
- **Sample code drift.** The sample has not changed since 2025-10-28 and deviates from RFC 9421 and from the spec (see S9); community fixes are unmerged [src-visa-tap-gh-meta].
- **Privacy.** IP address, device data and location travel to every merchant the agent visits, with hashed or obfuscated contact data that merchants must map; the spec gives no data-minimization or retention rule [src-visa-tap-spec].
- **Liability.** No agent-specific liability shift (Worldpay, 2026-07-30) [src-worldpay-liability].
- **Open questions in the repository.** What standing a payment instruction has after its agent is revoked (#26); commit-time authorization semantics (#8); transaction receipt signing (#16) [src-visa-tap-gh-meta].
- **Key store content.** The published JWKS holds one sandbox-CA RSA key, which does not match the Ed25519 examples; how production agent keys are distributed is not public [src-visa-tap-jwks].
