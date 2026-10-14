# Playground integration note: openai-acp

Frontmatter line for `src/content/protocols/openai-acp/index.mdx` (already applied, with a `note`):

```yaml
playground: { status: 'ready', component: 'openai-acp' }
```

The OpenAI ACP playground (`src/playgrounds/openai-acp/`, spec versions 2025-09-29 and 2026-04-17, toggle in the UI) runs entirely in the browser against a fixture merchant at `juniper-goods.example`. Five tabs cover a checkout session state machine with a request and response log (create, update, get, complete, cancel; five statuses in the older version, eleven in the newer; every transition labeled stated, implied or inferred); Delegate Payment allowance enforcement (exceed `max_amount`, let `expires_at` pass on a simulated clock, wrong `merchant_id`, wrong `checkout_session_id`, wrong currency, reuse of a `one_time` token, with a plain statement that the spec defines no error code for these); HMAC verification of a `Merchant-Signature` webhook with WebCrypto and an ephemeral secret (tamper, wrong secret, missing or malformed header, replay outside the 300-second window); idempotency (replay, 422 `idempotency_conflict`, 409 `idempotency_in_flight`, 400 `idempotency_key_required`, 24-hour expiry); and `/.well-known/acp.json` discovery with payment handler selection (2026-04-17 only). Simplifications are listed in `src/playgrounds/openai-acp/README.md` and labeled "teaching simplification" in the UI.

Possible fix outside this task: in `src/content/states/openai-acp-checkout-session.json` the `ready_for_payment` to `in_progress` transition still reads "2025-09-29 schema"; `verification/openai-acp.md` (required fix 11) asks for "(inferred)". The playground already labels it inferred.
