# Market, fees, policy and prehistory research: index

Accessed 2026-10-11. This file replaces the earlier market stub. The data lives in JSON files that validate against `src/lib/schemas.ts` (`Source`, `Metric`, `TimelineEvent`).

| File | Contents | Counts |
|---|---|---|
| `market.json` | `sources`, `metrics` (each with a `protocol` field: one of the 8 slugs or `market`), `events` (lane "Market") | 22 sources, 25 metrics, 9 events |
| `fees.json` | `sources`, `rows` of `{ protocol, fact, asOf, confidence, caveat, sources }` for every ATLAS_FOLLOWUP Appendix B row | 26 sources, 22 rows |
| `policy.md` | Jurisdiction notes (US, EU, UK, Canada, Singapore, card networks), Section 8.1 seed audit, per-protocol touchpoint table | narrative |
| `policy.json` | `sources`, `events` (lane "Policy") | 56 sources, 19 events |
| `prehistory.json` | `sources`, `events` (lane "Prehistory") | 18 sources, 13 events |

## Rules for writers

- Forecasts (McKinsey, Morgan Stanley, Bain) and observations (Adobe traffic, Salesforce influence, Keyrock, Visa and Artemis, live counters) measure different things. Never put them on one axis. A "forecast versus observed" chart needs a caveat line that says so.
- The x402.org "Last 30 Days" counter showed the same values (75.41M transactions, $24.24M) from at least mid August to 2026-10-11. Show it as a displayed value with that caveat, next to the Visa and Artemis adjusted figure.
- 8004scan counts are registrations, not working agents. mppscan figures appear to cover a 7-day window.
- Card-network agent pricing and liability: no public rules as of 2026-10-11. Say so plainly.
- Policy pages carry one line that the content is not legal advice.

## Sources reused from the protocol dossiers

x402 (counter, Visa and Artemis, Artemis gamed share, CDP, Circle, Spark, Wavect), erc-8004 (8004scan, QuickNode, Cobo, gas probe), ucp (Google FAQ, The Register, PYMNTS), openai-acp (OpenAI, PYMNTS 4 percent), stripe-mpp (Tempo fees, Stripe MPP docs, Stripe stablecoin docs, Yahoo fee report), visa-tap (Worldpay, Nevermined, Merchant Cost Consulting), mastercard-agent-pay (EMVCo, Nevermined, Q3 2025 call). Ids are unchanged.
