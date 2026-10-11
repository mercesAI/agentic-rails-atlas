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
