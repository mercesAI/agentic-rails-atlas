# Integration note: AP2 playground

Owner: AP2 playground agent. Date: 2026-10-11. Files: `src/playgrounds/ap2/**`, `tests/unit/playgrounds/ap2.test.ts`.

Set this line in the frontmatter of `src/content/protocols/ap2/index.mdx`:

```
playground: { status: 'ready', component: 'ap2' }
```

The AP2 playground builds and verifies mandates in the browser with a spec version toggle. In v0.2 (tag `v0.2.0`, the default) readers choose the human-not-present path (user-signed open `mandate.checkout.open.1` and `mandate.payment.open.1` with constraints and the agent key in `cnf`, then agent-signed closed `mandate.checkout.1` and `mandate.payment.1` key-binding JWTs) or the human-present path (user-signed closed mandates only), edit every schema constraint (`checkout.allowed_merchants`, `checkout.line_items`, `payment.amount_range`, `payment.budget`, `payment.agent_recurrence`, `payment.allowed_payees`, `payment.allowed_payment_instruments`, `payment.execution_date`, `payment.reference`, plus an unrecognized type that fails as the spec requires), see a live constraint evaluator, then sign with ephemeral ES256 keys and watch the Credential Provider, Merchant and Merchant Payment Processor recompute `checkout_hash`, `transaction_id`, `sd_hash`, the `cnf` key binding and the disclosure digests. Thirteen failure injections show which binding breaks and which error code results (`invalid_credential`, `invalid_mandate`, `unresolved_constraint`, `mandates_not_supported`), and schema-form receipts are shown next to the prose `result` form. The v0.1 view builds IntentMandate, CartMandate (`cart_hash` in `merchant_authorization`) and PaymentMandate (`transaction_data` hashes in `user_authorization`) with four tamper cases. Spec quirks (decimal `amount_range` example, unit-less `payment.budget`, `result` versus `status`) are labeled "Spec quirk"; reductions of the SD-JWT and Delegate SD-JWT machinery are labeled "Teaching simplification" and listed in `src/playgrounds/ap2/README.md`.
