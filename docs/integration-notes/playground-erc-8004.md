# Integration note: ERC-8004 playground

Owner: ERC-8004 playground agent. Date: 2026-10-11. Files: `src/playgrounds/erc-8004/**`, `tests/unit/playgrounds/erc-8004.test.ts`.

Frontmatter set in `src/content/protocols/erc-8004/index.mdx` (only the `playground` block):

```
playground:
  status: ready
  component: erc-8004
  note: "..."
```

The ERC-8004 playground has three panels. The first composes the global agent id (`eip155:424242` plus a fixture registry address and an agentId) and builds a registration file that is checked against a local JSON Schema derived from the Draft text, with a menu that breaks the file and a base64 data URI view with a decode toggle; the listed mainnet addresses appear as text only. The second is a reputation aggregator with honest clients, Sybil reviewers and a watchtower: it mirrors the contract's `getSummary` math and revert strings (required client list, revoked entries skipped, tag filters, 18-decimal normalization, mode decimals), shows the summary for a trusted list next to the summary for every client, and adds an off-chain weighting by proof of payment labeled as a teaching simplification. The third signs `AgentWalletSet` EIP-712 typed data with an ephemeral viem key and runs the `setAgentWallet` checks (caller, zero wallet, expired, deadline more than 5 minutes ahead, wrong signer after a transfer). No RPC, no wallet, no network; the live agentId lookup stretch item is not built.
