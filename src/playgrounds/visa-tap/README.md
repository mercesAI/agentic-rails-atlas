# Visa TAP playground

Client-side simulation of the Visa Trusted Agent Protocol agent recognition signature and body objects. It follows the Visa TAP specification as read on 2026-10-11 (the spec carries no version number or date; it launched on 2025-10-14), RFC 9421 for the signature base and headers, Cloudflare's published verification steps (2025-10-24 post) and `draft-ietf-webbotauth-httpsig-protocol-00` for the comparison. Every example is labeled "Illustrative example, Visa TAP specification (undated, read 2026-10-11)". No network calls, no Visa keys, no Visa JWKS, no cards.

## What it covers

1. **Signature builder** (`lib/signature.ts`, `lib/sf.ts`, `lib/keys.ts`). An ephemeral WebCrypto key is generated at mount: Ed25519 when the browser supports it, otherwise ECDSA P-256 (`ecdsa-p256-sha256`) with a visible fallback note. Choose the tag (`agent-browser-auth` for a GET product page, `agent-payer-auth` for a POST checkout), the covered components (`@authority`, `@path`, `@method`, `@query`, `@target-uri`, `user-agent`) and the window (5 minutes, 8 minutes, 10 minutes, or the spec example's 3,600 seconds). The UI shows the exact RFC 9421 signature base, the `Signature-Input` and `Signature` headers (label `sig2`, parameters `created`, `keyid`, `alg`, `expires`, `nonce`, `tag`) and a decoded view.
2. **CDN decision tree** (`lib/verifier.ts`). Cloudflare's steps in order: headers present, key by `keyid` from a local fixture JWKS, time window, nonce unused, tag allowed, rebuild the base, verify. The Visa spec's minimum-field check (the six parameters plus covered `@authority` and `@path`) runs after "headers present". The tree stops at the first block and marks later steps "not reached".
3. **Failure injection.** Change the path, host, query or User-Agent in transit; swap the tag or point `keyid` at an unknown key in `Signature-Input`; flip a signature bit; strip the `Signature` header; move the verifier clock (5 minutes, 9 minutes, 1 minute before `created`); pick a window over 8 minutes; send the same request twice to hit the nonce seen-set (kept for 8 minutes).
4. **Body objects** (`lib/objects.ts`). `agenticConsumer` (with `idToken`, `contextualData`) and `agenticPaymentContainer` (encrypted `payload` plus `cardMetadata`, or `browsingIOU` after an HTTP 402) with field tables paraphrased from the spec, a decoded fixture ID Token, and the spec's checks (minimum fields, nonce equals the message nonce, key for `kid`, signature). Failures show the spec's consequence: consumer data "may be inaccurate"; a payment container "must not be used for any payment".
5. **TAP versus Web Bot Auth.** The same GET signed both ways with one key: TAP (`sig2`, opaque `keyid`, `alg`, `nonce`, TAP tag) and Web Bot Auth (`sig1`, `Signature-Agent` header covered with `;key="sig1"`, JWK-thumbprint `keyid`, `tag="web-bot-auth"`), each run through both verifiers, plus a difference table.
6. **Spec quirks.** The spec examples reuse a Web Bot Auth test vector and cannot verify (ATLAS_ERRATA R17); the example window is 3,600 seconds against an 8-minute cap (R17); Visa's JWKS held no Ed25519 key on 2026-10-11 (R16); `alg="Ed25519"` versus the registry's `ed25519`.

## Teaching simplifications (labeled in the UI)

- The key directory is an in-memory fixture JWKS holding the ephemeral public key under `keyid` `agent-key-1` (and under its thumbprint for Web Bot Auth). Nothing is fetched.
- The spec names no canonical form for body object signatures ("all fields in the order received except the signature") and its examples use PS256. Here each object is signed as compact JSON of those fields, in insertion order, with the same ephemeral key and algorithm as the message signature.
- The ID Token has a real JWT header and claims encoding but a placeholder signature; in production Visa signs it. `payload` is a placeholder string, not ciphertext. `paymentCredentialsHash` is described but not filled, because its inner fields and hash algorithm are not public.
- Hosts are reserved example domains (`shop.example`, `agent.example`). Covered header choices are limited to `user-agent`; only the `key` component parameter is supported.

## Tests

`tests/unit/playgrounds/visa-tap.test.ts` covers every exported function, rebuilds RFC 9421 Appendix B.2.1 and B.2.6 signature bases byte for byte, reproduces the B.2.6 Ed25519 signature with the RFC test key, and checks the RFC 7638 thumbprint example.
