# Mastercard Agent Pay playground

Client-side simulation of two things on the Mastercard Agent Pay page. No network calls, no real cards, tokens or keys. Keys are generated with WebCrypto at mount, are non-extractable and are never stored.

Sources: the page content in `src/content/protocols/mastercard-agent-pay/` (claims, flows, the state machines `mastercard-agent-pay-token-lifecycle` and `mastercard-agent-pay-vi-mandate-state`), `verification/mastercard-agent-pay.md`, and `research/vendor/verifiable-intent` (`main`, 2026-04-20: `spec/credential-format.md`, `spec/constraints.md`).

## What it covers

1. Agentic token lifecycle simulator. Register an agent into a local fixture key set, certify, consent with a simulated passkey (limit, merchant scope, expiry, single use), provision a fixture token, then purchase through an RFC 9421 style signature with tag `Agent-pay-auth`, an edge check in the order of the Level 1 flow, an authorization against the controls, revoke, and a declined next attempt. State ids and labels come from the page state machine. Failure injections: missing signature, key not in the key set, expired window, replayed nonce, wrong tag, path changed after signing, amount over the limit, merchant out of scope, expired token, revoked token, single-use reuse.
2. Verifiable Intent layer builder. L1, L2 (Immediate or Autonomous), L3a and L3b as SD-JWTs signed with ephemeral ES256 keys. Shows `typ`, signer, lifetime against the recommendation, the `cnf` hand-off from each layer to the next, `sd_hash` links, constraints (`mandate.payment.amount_range`, `mandate.checkout.allowed_merchants`, optional `mandate.payment.budget`, `mandate.payment.reference`), and the `checkout_hash` / `transaction_id` link between L3a and L3b. A verifier recomputes every binding from the serialized strings. Twelve faults, either applied after signing (stale signatures) or built in (valid signatures, broken constraint).

## Teaching simplifications (each labeled in the UI)

- The passkey is a WebCrypto P-256 key signing a challenge. A real passkey is a WebAuthn credential.
- The signed request uses `ecdsa-p256-sha256` and covers `@authority` and `@path`. The guide example uses Ed25519.
- The key set is local. The Mastercard key directory location is not public; no URL is invented. Tag matching is exact; the guides do not say whether case matters.
- Anything Mastercard does not publish is labeled "not published": the provisioning call, the revocation mechanism, decline response codes. Revoke and repeat use are simulator transitions, flagged as not in the page state machine.
- The `line_items` constraint and item disclosures are not modeled; L3b `sd_hash` covers the L2 base JWT plus the checkout disclosure.
- `checkout_jwt` is an ES256 JWS from a fixture merchant key; v0.1 leaves its format implementation-defined.
- One verifier sees the full L2 and both L3 credentials; in the spec the network sees L3a and the merchant sees L3b.
- Cumulative budget uses a typed-in "already spent" value. The spec says networks must hold this state and defines no API.
- Lifetimes are recommendations (SHOULD) except where the spec says MUST NOT (L2 beyond L1 `exp`, L3 beyond one hour); the verifier shows warnings and failures accordingly.

## Not shown

No live Verifiable Intent check by Mastercard is publicly shown, so none is simulated. A DTVC (one-time code issued with a Mastercard Virtual Card Token) is a different object and is out of scope.

## Files

`lib/encoding.ts`, `lib/jws.ts`, `lib/sdjwt.ts` (crypto and SD-JWT helpers), `lib/httpsig.ts` (signature and edge check), `lib/lifecycle.ts` (states, controls, authorization, consent), `lib/vi.ts` (builder), `lib/vi-verify.ts` (verifier), `lib/fixtures.ts`. Tests: `tests/unit/playgrounds/mastercard-agent-pay.test.ts`.
