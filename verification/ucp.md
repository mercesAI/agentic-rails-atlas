# UCP verification report (in progress)

Verifier: independent agent, 2026-10-11. Scope: `src/content/protocols/ucp/`, `src/content/flows/ucp-*.json`, `src/content/states/ucp-checkout-lifecycle.json`, `src/content/diagrams/ucp-*` and `ap2-in-ucp*`, `src/content/scenarios/shopper-in-gemini.mdx` with `src/content/flows/multi-shopper-in-gemini.json`, `src/playgrounds/ucp/`, rendered `dist/p/ucp/index.html` (built 14:25, newer than all UCP content, so no rebuild). Spec baseline: `research/vendor/ucp` at tag v2026-08-25 (commit cd78fb3, matches the commit pinned in every FieldTable `specRef`); `main` (ad9950b) treated as draft.

Status: checks 1 (spec-sourced claims), 2, 3 (partial) and errata done; external-source claims, diagrams, style and coverage running.

## Interim results
- Check 2: 245 identifiers extracted from index.mdx, observability.json, security.json, 9 UCP flows, the scenario flow, the state machine, diagrams and the playground. Every protocol identifier (profile fields, checkout fields, credential types, AP2 fields, REST paths, MCP tools, embedded methods, headers, negotiation and signature error codes with REST and MCP codes, severities, action types, A2A DataPart keys, signals keys) appears at the tag. Identifiers absent at the tag are illustrative ids, historical names stated as historical, playground-internal labels, or drafts labeled as main-only.
- Check 1 (85 spec-sourced claims of 128 checked): all pass.
- Errata 2.1.9, 2.1.14, R1, R2, R3, R4, R5: pass.
