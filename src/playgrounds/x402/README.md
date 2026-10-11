# x402 playground

A client-side simulation of an x402 payment. It follows x402 spec v2.0 (2025-12-09) by default and spec v1 when the version switch is set to V1. Sources (in `research/vendor/x402/`, commit f8f83309): `specs/x402-specification-v2.md`, `specs/x402-specification-v1.md`, `specs/transports-v2/http.md`, `specs/transports-v1/http.md`, `specs/schemes/exact/scheme_exact_evm.md`, `specs/schemes/upto/scheme_upto.md`, `specs/schemes/upto/scheme_upto_evm.md`, and the TypeScript SDK (`@x402/core` 2.28.0, `@x402/evm`).

## What it covers

- 402 handshake with a V1/V2 switch. V2: `PAYMENT-REQUIRED`, `PAYMENT-SIGNATURE`, `PAYMENT-RESPONSE` as base64 JSON, CAIP-2 network `eip155:424242`, `amount`. V1: JSON 402 body, `X-PAYMENT`, `X-PAYMENT-RESPONSE`, a string network name, `maxAmountRequired`.
- Scheme switch (`exact` with EIP-3009, `upto` with Permit2) and payment-flow switch (`authorization`, `upfront`, `escrow`). Unsupported pairs show the reason and the SDK `resolvePaymentFlow` error text.
- Facilitator `/verify` and `/settle` timeline with each check in SDK order and the request and response bodies.
- Failure injection: expired `validBefore`, wrong `payTo`, replayed nonce, insufficient balance, facilitator down. The wire carries the spec error code where spec section 9 lists one; the SDK constant is shown next to it, or alone when the spec lists none (replayed nonce, all Permit2 codes). Facilitator down gives HTTP 502 with the `@x402/express` timeout body (90 s default).
- EIP-712 preview of `TransferWithAuthorization` (or `PermitWitnessTransferFrom` for upto), signed with a `viem` key from `generatePrivateKey`, digest, signature, recovery, and a tamper button that shows recovery failing.
- Spend cap demo mirroring `spendControls` and `DEFAULT_MAX_AMOUNT_PER_PAYMENT = "$1"` in `typescript/packages/core/src/client/x402Client.ts`, with the SDK rejection message.
- Base64 header encoder and decoder, with the headers of the current run preloaded.

## Safety

No wallet connection, no RPC call, no real chain id. The key is generated at mount, held in memory and replaced on reset. The token, payTo and facilitator addresses are fixtures; Permit2 and the upto proxy use the canonical SDK addresses only inside the EIP-712 domain and message.

## Teaching simplifications (labeled in the UI)

- V1 uses the made-up network name `sim-424242`; real V1 names come from a fixed list such as `base-sepolia`.
- The fixture token counts as a recognized default asset, so the USD spend cap applies to it.
- upto assumes the payer already approved Permit2.
- `escrow` is shown as call order only (deposit settle, resource, claim settle). The spec defines it for upto on Solana; the EVM SDK rejects upto with escrow. Failure injection other than facilitator down is not modeled for escrow.
- The ledger, transaction hash (keccak256 of the signature) and receipts are in-memory stand-ins.
- The settle-time balance drop and `settlement_pending` variants are described in the flow files but not simulated.

## Files

`lib/fixtures.ts`, `lib/base64.ts`, `lib/messages.ts`, `lib/typed-data.ts`, `lib/spend.ts`, `lib/facilitator.ts`, `lib/flows.ts`, `lib/simulate.ts` (pure logic, tested in `tests/unit/playgrounds/x402.test.ts`), `Playground.tsx`, `x402.css`.
