# Integration note: Stripe MPP playground

Owner: Stripe MPP playground agent. Date: 2026-10-11. Files: `src/playgrounds/stripe-mpp/**`, `tests/unit/playgrounds/stripe-mpp.test.ts`.

Frontmatter set in `src/content/protocols/stripe-mpp/index.mdx` (only the `playground` block changed; `validate-content` passes):

```
playground: { status: 'ready', component: 'stripe-mpp', note: '<one sentence>' }
```

The Stripe MPP playground builds a `WWW-Authenticate: Payment` challenge for the `tempo` method with a base64url canonical JSON `request` and a challenge `id` bound by HMAC-SHA256 (WebCrypto, ephemeral key; the core draft's three test vectors pass), then the matching `Authorization: Payment` or `Payment-Authorization` credential, each with a decode toggle and an `Accept-Payment` request line. Injected failures (changed parameter, replay, expiry, wrong field, malformed credential, failed proof, policy denial) return the core draft's status and RFC 9457 problem type, or 403 without a challenge. An intent switcher covers charge, subscription and session, the last labeled as defined by the Tempo method. A session meter signs cumulative EIP-712 vouchers with an ephemeral `viem` key on the fake chain 424242 and walks through top-up, settle, cooperative close and forced close with the 15 minute grace period, showing a worst-case loss equal to the deposit. A method matrix lists the 11 method ids with spec files and their intents, and a translator maps x402 V2 headers to their MPP counterparts using the x402 playground's fixtures. Simplifications are labeled "Teaching simplification" and listed in `src/playgrounds/stripe-mpp/README.md`.

The frame shows the spec version from the first flow file (`draft-httpauth-payment-01 with draft-payment-intent-charge-00 and draft-tempo-charge-00`); the playground also names the session draft in its own header.
