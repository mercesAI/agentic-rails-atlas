# Integration note: Mastercard Agent Pay playground

Frontmatter line for `src/content/protocols/mastercard-agent-pay/index.mdx` (already applied):

```yaml
playground: { status: 'ready', component: 'mastercard-agent-pay', note: 'Simulate the agentic token lifecycle with signed requests and revocation, and build Verifiable Intent layers L1 to L3 with a verifier that shows which binding breaks.' }
```

The playground has two simulators. The token lifecycle simulator registers an agent into a local fixture key set, takes consent with a simulated passkey, provisions a fixture token with limit, merchant scope and expiry, checks an RFC 9421 style signature with tag `Agent-pay-auth` at the edge, authorizes against the controls, revokes, and declines the next attempt; unpublished details are labeled "not published". The Verifiable Intent builder creates L1, L2 (Immediate or Autonomous), L3a and L3b as SD-JWTs with ephemeral ES256 keys and a verifier that recomputes `sd_hash`, `cnf`, constraint and `checkout_hash` bindings and shows what breaks under 11 faults. See `src/playgrounds/mastercard-agent-pay/README.md` for the simplifications.
