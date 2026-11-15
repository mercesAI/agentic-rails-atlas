# Market, fees, policy and prehistory research: index

Accessed 2026-10-11; refreshed 2026-11-14 (see the last section). This file replaces the earlier market stub. The data lives in JSON files that validate against `src/lib/schemas.ts` (`Source`, `Metric`, `TimelineEvent`).

| File | Contents | Counts (2026-11-14) |
|---|---|---|
| `market.json` | `sources`, `metrics` (each with a `protocol` field: one of the 8 slugs or `market`), `events` (lane "Market") | 22 sources, 25 metrics, 11 events |
| `fees.json` | `sources`, `rows` of `{ protocol, fact, asOf, confidence, caveat, sources }` for every ATLAS_FOLLOWUP Appendix B row, plus later rows | 28 sources, 27 rows |
| `policy.md` | Jurisdiction notes (US, EU, UK, Canada, Singapore, card networks), Section 8.1 seed audit, per-protocol touchpoint table, refresh log | narrative |
| `policy.json` | `sources`, `events` (lane "Policy") | 84 sources, 30 events |
| `prehistory.json` | `sources`, `events` (lane "Prehistory") | 18 sources, 13 events |

## Rules for writers

- Forecasts (McKinsey, Morgan Stanley, Bain) and observations (Adobe traffic, Salesforce influence, Keyrock, Visa and Artemis, explorer counters) measure different things. Never put them on one axis. A "forecast versus observed" chart needs a caveat line that says so.
- The x402.org "Last 30 Days" counter showed the same values (75.41M transactions, $24.24M) from at least 2025-12-14 to at least 2026-10-24, and x402.org removed it, without an announcement, between 2026-10-24 and 2026-11-14 (home page edited 2026-10-27). Show it only as history, next to the Visa and Artemis adjusted figure, never as current activity.
- 8004scan counts are registrations, not working agents; its count roughly tripled between 2026-10-18 and 2026-11-14, mostly through batch registrations by one operator (Central City). It does not index 0G, so it is not the on-chain total (more than 6 million by highest id on 2026-11-14): show the two side by side, each dated, never one headline number. MPPscan figures cover a rolling window (7 days on its home page), and its indexer appeared stalled from about 2026-11-11: never read the smaller windows as a fall in activity.
- Card networks: Visa's public rules carry agent requirements but no agent-specific dispute condition, fee or liability shift, and neither network publishes agent interchange or agent volume (as of 2026-11-14). Say so plainly.
- Fee rows that describe Instant Checkout (OpenAI's small fee, Shopify's reported 4 percent) are history; current rows say no fee is stated for purchases that start in ChatGPT, for Shopify's ChatGPT channel or for ChatGPT Wallet.
- Policy pages carry one line that the content is not legal advice.

## Sources reused from the protocol dossiers

x402 (counter, Visa and Artemis, Artemis gamed share, CDP, Circle, Spark, Wavect), erc-8004 (8004scan, QuickNode, Cobo, gas probe), ucp (Google FAQ, The Register, PYMNTS), openai-acp (OpenAI, PYMNTS 4 percent), stripe-mpp (Tempo fees, Stripe MPP docs, Stripe stablecoin docs, Yahoo fee report), visa-tap (Worldpay, Nevermined, Merchant Cost Consulting), mastercard-agent-pay (EMVCo, Nevermined, Q3 2025 call). Ids are unchanged. From 2026-11-14 the files also cite records declared in protocol sidecars, without copying them: src-8004scan-stats-api, src-erc-8004-centralcity and src-erc-8004-chain-probe-2026-11-14 (erc-8004), src-x402-site-wb-20261024, src-x402-fee-circle-gateway and src-x402-circle-facilitator-service (x402), src-stripe-mpp-mppscan and src-stripe-mpp-tempo-t13 (stripe-mpp), src-mcap-q3-2026-transcript, src-mcap-q3-2026-results, src-mcap-pymnts-openai-tencent and src-mcap-shopify-fall26 (mastercard-agent-pay), src-chatgpt-merchants, src-openai-chatgpt-wallet, src-openai-commerce-accept-payments, src-openai-acp-cnbc-wallet and src-openai-acp-shopify-help-chatgpt (openai-acp), src-ucp-shopify-help-google, -microsoft and -meta and src-ucp-microsoft-page (ucp), src-visa-vic-docs and src-visa-us-irf-2026-04 (visa-tap).

## Refresh 2026-11-14

- `market.json`: x402.org counter metrics relabeled as history (removed between 2026-10-24 and 2026-11-14; asOf is 2026-10-24, the last capture with the counter, as on the x402 page); 8004scan metrics refreshed to the 2026-11-14 API counts with the batch-wave caveat; MPPscan 7-day metrics refreshed with the stall caveat; the 2025-10-30 Mastercard event no longer says agent payments remained pilots; new events 2026-10-29 (Mastercard Q3 2026 call, reported) and 2026-11-14 (observations). Items X402-05, ERC-01, MPP-06, MA-01 and MA-02.
- `fees.json`: Instant Checkout fee and Shopify 4 percent rows labeled history; new current rows for OpenAI's merchant page, Shopify's ChatGPT channel and ChatGPT Wallet; the Shopify Agentic Storefronts row re-sourced to Shopify's own terms; the Microsoft no-commission clause split out as history (removed by about 2026-11-06); Circle's Gateway example values labeled illustrative; CDP, Tempo and Visa rows annotated; a Crossmint price row added. Items MKT-01, D18, ACP-01, ACP-11, ACP-15, UCP-03, UCP-06, X402-14, MPP-05, XPAY-06 and the Visa fee-docs finding.
- `policy.json` and `policy.md`: see `policy.md` section 10.
- Not updated: the McKinsey and Bain forecast rows (pages still unreadable on 2026-11-14) and the PayAI row, whose 2026-10-11 rates are dated (live rates on 2026-11-14 were about 0.99 credits on Solana and 1.66 on Base).
