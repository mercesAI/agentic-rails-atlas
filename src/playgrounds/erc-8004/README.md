# ERC-8004 playground

A client-side simulation of ERC-8004 (Trustless Agents). It follows the Draft text in `research/vendor/ERCs/ERCS/erc-8004.md` (last changed 2026-01-25) and the reference contracts in `research/vendor/erc-8004-contracts/contracts` (`IdentityRegistryUpgradeable.sol` and `ReputationRegistryUpgradeable.sol`, implementation version 2.0.0). Examples are labeled "Illustrative example, ERC-8004 (Draft)".

## What it covers

- Global id composer: `{namespace}:{chainId}:{identityRegistry}` plus `agentId`, on the fake chain `eip155:424242` with a fixture registry address. Each part is checked. The listed mainnet and testnet registry addresses (contracts README, as of 2026-08-15) appear as labeled text and are never called.
- Registration file builder: `type`, `name`, `description`, `image`, `services[]` (`name`, `endpoint`, optional `version`), `x402Support`, `active`, `registrations[]` (`agentId`, `agentRegistry`, filled from the composer) and optional `supportedTrust[]`. The JSON is editable and checked against a local JSON Schema labeled "derived from the spec text; the EIP publishes no JSON Schema", plus the SHOULD rules as warnings and notes. A menu breaks the file in four ways. The agentURI view shows the base64 `data:application/json;base64,` form with a decode toggle, and placeholder `ipfs://` and `https://` forms.
- Reputation aggregator: honest clients (with a `proofOfPayment` to the agent wallet in their feedback file), Sybil reviewers (boost with 100 or smear with 0, optionally with a proof that pays their own address) and a watchtower `reachable` ping. `getSummary` mirrors the contract: the client list is required (an empty list reverts with "clientAddresses required"), revoked entries and tag mismatches are skipped, values are scaled to 18 decimals, averaged with truncating division and rescaled to the most frequent `valueDecimals`. It shows the summary for your list next to the summary for every client, and an off-chain weighted mean that discounts feedback without a matching proof. Each row can be revoked by its client (`revokeFeedback` reverts "Already revoked" on a second try); feedback from the owner or an operator reverts with "Self-feedback not allowed".
- Agent wallet: an EIP-712 `AgentWalletSet(uint256 agentId,address newWallet,address owner,uint256 deadline)` signature under the domain `ERC8004IdentityRegistry` version 1, signed by a viem key generated at mount. Submitting runs the contract checks in order: "Not authorized", "bad wallet", "expired", "deadline too far" (more than 5 minutes ahead), "invalid wallet sig" (for example after a transfer changes the owner in the digest).

## Safety

No RPC calls, no wallet connection, no network requests. The new wallet key is generated at mount, held in memory and replaced on reset. All addresses other than the labeled listed addresses are fixtures.

## Teaching simplifications (labeled in the UI)

- The Draft text gives the registration file as an example, not a schema. The derived schema treats `x402Support` and `active` as required, as the protocol page does; the best-practices guide treats `active` as optional.
- The IPFS and HTTPS agentURIs are placeholders; nothing is uploaded or fetched, and the `/.well-known/agent-registration.json` domain proof is described, not run.
- Weighting by proof of payment is an off-chain aggregator rule invented for the demo. The registry stores only value, decimals, tags and the revoked flag, and never reads the feedback file; the simulation checks only that the proof's addresses match, not a real transaction.
- The setAgentWallet clock is device time plus a chosen delay. There is no smart contract wallet, so the ERC-1271 fallback is skipped.
- The live RPC lookup of an `agentId` (a stretch item) is not built.

## Files

`lib/fixtures.ts`, `lib/registration.ts`, `lib/reputation.ts`, `lib/wallet.ts` (pure logic, tested in `tests/unit/playgrounds/erc-8004.test.ts`), `Playground.tsx`, `erc-8004.css`.
