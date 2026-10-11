# Playground integration note: visa-tap

Frontmatter block for `src/content/protocols/visa-tap/index.mdx` (applied):

```yaml
playground: { status: 'ready', component: 'visa-tap', note: '...' }
```

The Visa TAP playground (`src/playgrounds/visa-tap/`, Visa TAP specification undated, read 2026-10-11) runs in the browser with an ephemeral WebCrypto Ed25519 key generated at mount (ECDSA P-256 with a visible note when the browser lacks Ed25519). Its three tabs cover an RFC 9421 signature builder (tag, covered components, window; the exact signature base, `Signature-Input` and `Signature` headers with a decoded view); a CDN verifier that walks Cloudflare's published steps plus the Visa minimum-field check against a local fixture JWKS, with tampering in transit, clock moves, an over-long window (including the spec example's 3,600 seconds) and a nonce seen-set for replay; viewers for `agenticConsumer` and `agenticPaymentContainer` (encrypted payload or `browsingIOU`) with field explanations and the spec's checks and consequences; and the same request signed as TAP and as Web Bot Auth (`Signature-Agent`, JWK-thumbprint `keyid`, `tag="web-bot-auth"`) run through both verifiers. A spec quirk panel shows that the spec's examples cannot verify (ATLAS_ERRATA R16, R17). No network calls and no Visa keys. Simplifications are listed in `src/playgrounds/visa-tap/README.md` and labeled "teaching simplification" in the UI.
