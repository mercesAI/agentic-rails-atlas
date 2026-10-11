# AP2 playground

Client-side simulation of the Agent Payments Protocol. Default spec version v0.2 (tag `v0.2.0`, 2026-04-28); a toggle shows the v0.1 model (tag `v0.1.0`, 2025-09-16). Sources: `research/vendor/AP2/code/sdk/schemas/ap2/*.json`, `docs/ap2/*.md`, `src/ap2/types/mandate.py` at `v0.1.0`, and `research/protocols/ap2.md`.

## What it covers

- Mandate builder, v0.2: open and closed Checkout and Payment Mandates with the schema `vct` values (`mandate.checkout.open.1`, `mandate.checkout.1`, `mandate.payment.open.1`, `mandate.payment.1`), `cnf`, `iat`, `exp`, and SD arrays concealed as the schemas mark them.
- Human present and human not present paths with the step order of `docs/ap2/flows.md`.
- Constraint evaluator for all ten constraint types; `checkout.line_items` uses the maximum-flow method from `checkout_mandate.md`; unknown types fail with `unresolved_constraint`.
- ES256 signing with WebCrypto keys generated at mount (non-extractable, never stored): user, agent, a second agent, merchant and processor.
- Binding verifier per role (Credential Provider, Merchant, Merchant Payment Processor) plus the dispute checks from `specification.md`, with 13 failure injections.
- Checkout and Payment Receipts in schema form, signed, and the prose Mandate Receipt form.
- v0.1: IntentMandate, CartMandate with `cart_hash`, PaymentMandate with `transaction_data`, intent checks and four tamper cases.

## Teaching simplifications (labeled in the UI)

1. One key stands for the user or agent provider (Trusted Agent Provider model); no user credential, OpenID4VP or Digital Credentials API.
2. The open and closed mandates travel as two serialized SD-JWT strings instead of one Delegate SD-JWT chain; decoys and other hash algorithms are not modeled.
3. `conditional_transaction_id` hashes the issuer-signed JWT of the open Checkout Mandate; the spec says only "digest of the associated Open Checkout Mandate".
4. Stateful constraints (`payment.budget`, `payment.agent_recurrence`) use history the reader types in; frequencies use UTC calendar steps.
5. The Credential Provider defers `payment.reference` to the processor, which gets the open Checkout Mandate hash from the merchant (flows.md, Phase 2 step 5).
6. The mapping from a failed check to an error code is this simulation's reading of the "Errors" list.
7. v0.1 `user_authorization` is one ES256 JWT; "canonical JSON" is JSON with sorted keys.

## Spec quirks shown, not hidden

- `payment.amount_range` `min` and `max` are integers in minor units, but the doc example writes 100.50 and 10.00; a decimal bound fails here.
- `payment.budget` `max` is a number with no unit; both readings are computed and the reader picks one.
- Receipts: schemas use `status` (`Success`, `Error`), the prose uses `result` (`success`, `error`), issue #374.
- Schema descriptions say `vct` "MUST be 'mandate.payment'" while the const is `mandate.payment.1`; a tamper case shows the exact-match rule rejecting the description form.
