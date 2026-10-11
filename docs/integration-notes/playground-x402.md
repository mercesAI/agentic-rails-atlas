# Integration note: x402 playground

Owner: x402 playground agent. Date: 2026-10-11. Files: `src/playgrounds/x402/**`, `tests/unit/playgrounds/x402.test.ts`.

Set this line in the frontmatter of `src/content/protocols/x402/index.mdx` (the writer owns that file):

```
playground: { status: 'ready', component: 'x402' }
```

The x402 playground simulates a full 402 handshake in the browser, following spec v2.0 with a switch to v1 (header names, base64 JSON versus JSON body, CAIP-2 versus string networks, `amount` versus `maxAmountRequired`). Readers switch between the `exact` and `upto` schemes and the `authorization`, `upfront` and `escrow` payment flows and watch the timeline change, including the facilitator `/verify` and `/settle` calls with every check. Five injected failures (expired `validBefore`, wrong `payTo`, replayed nonce, insufficient balance, facilitator down) show the spec error code, or the TypeScript SDK constant where the spec lists none. An EIP-712 panel shows the `TransferWithAuthorization` typed data signed with an ephemeral key on the fake chain `eip155:424242`, then recovers the signer and shows recovery failing after a one-unit edit. A spend cap demo mirrors the SDK `spendControls` default of $1, and a base64 codec decodes any header from the run. No wallet, RPC or real chain is involved; simplifications are labeled "Teaching simplification" in the UI and listed in `src/playgrounds/x402/README.md`.
