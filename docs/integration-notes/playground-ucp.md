# Playground integration note: ucp

Frontmatter line for `src/content/protocols/ucp/index.mdx` (already applied, with a `note`):

```yaml
playground: { status: 'ready', component: 'ucp' }
```

The UCP playground (`src/playgrounds/ucp/`, spec version v2026-08-25) runs entirely in the browser on fixture profiles for a store at `juniper.example` and an agent at `agent.example`. Its four tabs cover a profile negotiation simulator (edit both profiles or load nine scenarios, then see the protocol version chosen through `version` or `supported_versions`, the active capabilities at their highest common version, and every pruned or rejected entry with its reason, including transitive orphaned extensions, authority-binding failures, `dev.ucp.*` release skew, `version_unsupported`, `profile_malformed` and `capabilities_incompatible`); payment-handler selection (cart-context filtering, `available_instruments` resolution, the one-instrument rule unless split payments is negotiated, `payment_failed`); a checkout state machine with escalation through `continue_url`, asynchronous completion, cancel from any non-terminal state, 6 hour default expiry, the AP2 security lock with `mandate_required`, and injected faults such as a missing `continue_url` and an idempotency key reused with a different body (409); and a transport switcher that shows the same operation as REST, MCP and A2A messages with the real endpoint paths, tool names, headers and `DataPart` keys. Simplifications are listed in `src/playgrounds/ucp/README.md` and labeled "teaching simplification" in the UI.
