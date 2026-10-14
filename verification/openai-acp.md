# Verification report: openai-acp

Verifier: independent verifier agent. Date: 2026-10-13. Scope per `docs/briefs/VERIFIER_BRIEF.md`, ATLAS_PROMPT.md Section 5.4, ATLAS_FOLLOWUP.md Section 2 (Scenario 6, fees), ATLAS_ERRATA.md rows R5, R20 to R25, R47, and the stewardship rule in ATLAS_PROMPT.md Section 0.

Spec snapshot: `research/vendor/acp/spec/2026-04-17` (JSON Schema and OpenAPI). Rendered page: `dist/p/openai-acp/index.html` (built 14:31, newer than all ACP content, so no rebuild).

Status: in progress (check 1 written; checks 2 to 8 follow).

## Check 1: claims against sources

Scope (reduced, per task): all claims referenced from frontmatter keyFacts, facts.json, faq.json, quiz.json and flashcards.json (89 distinct ids), plus 30 random claims from the remaining 159 (seed 13), 119 checked in total. Sources: vendor spec at commit 7fdd78d (shallow clone), `gh api` for history, Wayback snapshots cited in sources.json for the two openai.com posts (both returned 200 and the text matched), developers.openai.com markdown exports and docs.stripe.com (HTTP 200 with curl). No source was unreachable for this sample.

Rule checks over all 248 claims: no `verified` claim has only non-primary sources (0 fails); every cited source id exists in sources.json (0 missing); 137 claims have no `asOf`, and all but one state spec constants or the date of a past event (same reading as verification/x402.md and verification/ap2.md). The one exception is claim 216 ("still send").

### 1a. Referenced claims (frontmatter keyFacts, facts, faq, quiz, flashcards)

| Claim | Confidence | Verdict | Evidence and note |
|---|---|---|---|
| 001 | verified | pass | Stripe blog + README line 13 ("open standard"); OpenAI launch post text (Wayback 20261007012440): "open standard ... co-developed it with Stripe" |
| 002 | verified | pass | research/vendor/acp/README.md:6,10 (Status-Beta badge; "currently in beta") |
| 003 | verified | pass | rfcs/*.md line 3 Status: checkout, delegate_payment, delegate_authentication, discount, extensions, orders, payment_handlers, seller_backed = Draft; capability_negotiation, cart, discovery, product_feeds, intent_traces, affiliate, marketing_consent = Proposal |
| 005 | verified | pass | LICENSE (Apache 2.0) and NOTICE ("Copyright 2025 OpenAI / Stripe") |
| 007 | verified | pass | Wayback of openai.com/index/buy-it-in-chatgpt (20261007012440): Sept 2025 post "open-sourcing ... Agentic Commerce Protocol"; date 2025-09-29 matches sources.json published |
| 008 | verified | pass | Stripe newsroom page fetched 2026-10-13 (200): "Shared Payment Token ... co-developed"; dated 2025-09-29 |
| 009 | verified | pass | MAINTAINERS.md: Lead maintainers OpenAI, Stripe, Meta |
| 010 | verified | pass | gh api commits path=docs/governance.md: f38a41b 2026-03-10 "ADMIN: Revised governance model (#173)" |
| 011 | verified | pass | docs/governance.md "Composition and Structure" (up to 7 seats, one org each); "Founding Maintainers" Responsibilities (appoint and remove) |
| 012 | verified | pass | docs/governance.md "Composition and Structure" (up to 7 seats, one org each); "Founding Maintainers" Responsibilities (appoint and remove) |
| 013 | verified | pass | docs/governance.md "Current TSC Members" table: OpenAI, Stripe, Meta; repo last commit 2026-07-18 so no later change |
| 014 | verified | pass | gh api commits: 02672ab 2026-04-24 "ADMIN: Add Meta as TSC member (#236)"; table seat 3 Meta |
| 015 | verified | pass | docs/governance.md SEP lifecycle: sponsorship, 7-business-day review, simple majority (50%+1) |
| 017 | verified | pass | docs/governance.md "Reserve Authority" and FAQ line 435: "can only be used to block a change, never to override the TSC"; written explanation |
| 018 | verified | pass | docs/governance.md "Future Evolution and Neutral Governance": goal of a neutral foundation, four conditions; no foundation exists today |
| 021 | verified | pass | legal/cla/SIGNATORIES.md line 3 (Collaboration and Governance Agreement dated November 21, 2025) |
| 022 | verified | pass | legal/cla/SIGNATORIES.md corporate table (10 rows, last updated 2026-06-03); OpenCommerce Network Inc., not nekuda (R21 applied) |
| 025 | verified | pass | README.md:83 (date-based YYYY-MM-DD); rfc.agentic_checkout.md header list (API-Version) |
| 027 | verified | pass | changelog/2026-04-17.md; gh api: 9abf303 2026-04-17 "RELEASE: 2026-04-17 (#227)" |
| 028 | verified | pass | gh api repos/.../tags and /releases: both length 0 (2026-10-13) |
| 034 | verified | pass | changelog/2026-04-17.md headings: Feed API (41), Cart Capability (122), Discovery Integration (140), Delegate Authentication (174), Discovery Well-Known Document (196), MCP Transport Binding (429) |
| 035 | verified | pass | changelog/2026-04-17.md:328-334 (Idempotency-Key mandatory on all POST); rfc.agentic_checkout.md:67 |
| 037 | verified | pass | gh api commits: head 7fdd78d, committer date 2026-07-18T04:51:51Z, message "SEP: Optional product URL ... (#281)"; no later commit as of 2026-10-13 |
| 039 | verified | pass | gh api commits: head 7fdd78d, committer date 2026-07-18T04:51:51Z, message "SEP: Optional product URL ... (#281)"; no later commit as of 2026-10-13 |
| 040 | verified | pass | changelog/unreleased: suggested-pricing.md, fulfillment-details-on-complete.md, add-feed-update-id.md, product-url-on-checkout-item.md |
| 041 | verified | pass | gh api commits path=spec/2026-01-30/json-schema/schema.agentic_checkout.json: 6 commits 2026-02-05 to 2026-02-13; path=spec/2026-04-17: 6b82868 2026-05-01, 17adf49 2026-06-15 |
| 044 | verified | pass | rfc.agentic_checkout.md:9 ("merchant remains the system of record") |
| 045 | verified | pass | developers.openai.com/commerce/llms-full.txt FAQ: "OpenAI ... are not the merchant of record"; merchant name on card statement; "merchant does" handle chargebacks and refunds |
| 046 | verified | pass | developers.openai.com/commerce/llms-full.txt FAQ: "OpenAI ... are not the merchant of record"; merchant name on card statement; "merchant does" handle chargebacks and refunds |
| 049 | verified | pass | llms-full.txt: "Stripe's Shared Payment Token is the first Delegated Payment Spec-compatible implementation" |
| 050 | verified | pass | Stripe SPT docs (Public preview) describe SPT as Stripe object shared_payment.granted_token; absent from spec schemas (credential type spt is an example only) |
| 054 | verified | pass | JSON Schema 2026-01-30 and 2026-04-17 Item: properties id, name, unit_amount; required [id]; 2025-09-29 Item had id, quantity |
| 058 | verified | pass | schema.agentic_checkout.json:2056,2064 ("e.g., card, wallet_token"; "e.g., spt, wallet_token"); no enum |
| 061 | verified | pass | schema.agentic_checkout.json:900 ("reverse-DNS ... e.g., dev.acp.tokenized.card") |
| 062 | verified | pass | rfcs/rfc.seller_backed_payment_handler.md:15-18 (saved_card, gift_card, points, store_credit) |
| 076 | verified | pass | spec/2026-04-17 schema.delegate_payment.json Allowance: required six fields; reason enum ["one_time"] |
| 077 | verified | pass | spec/2026-04-17 schema.delegate_payment.json Allowance: required six fields; reason enum ["one_time"] |
| 078 | verified | pass | PaymentMethodCard: type const card; card_number_type enum fpan, network_token |
| 079 | verified | pass | DelegatePaymentResponse required id, created, metadata ("vt_..."); openapi.delegate_payment.yaml:83 "201" |
| 083 | verified | pass | schema.agentic_checkout.json:3743 services enum [checkout, orders, delegate_payment, carts]; :3711 transports enum [rest, mcp] |
| 091 | verified | pass | rfc.agentic_checkout.md:65-70 (Idempotency-Key REQUIRED; Signature, Timestamp, Request-Id RECOMMENDED) |
| 099 | verified | pass | openapi.delegate_payment.yaml:15 single path /agentic_commerce/delegate_payment |
| 101 | verified | pass | rfc.agentic_checkout.md:339 ("MUST include authentication_metadata") |
| 103 | verified | pass | openapi.delegate_authentication.yaml paths at lines 17, 153, 247 match |
| 108 | verified | pass | rfc.agentic_checkout.md:277-306 (400/422/409 codes, 24 hours, 5xx MUST NOT be cached) |
| 109 | verified | pass | rfc.agentic_checkout.md:277-306 (400/422/409 codes, 24 hours, 5xx MUST NOT be cached) |
| 113 | verified | pass | openapi.feed.yaml paths /feeds, /feeds/{id}, /feeds/{id}/products (get and patch); changelog 2026-04-17 "push model" |
| 115 | verified | pass | llms-full.txt: GET/POST /product_feeds; Promotions API page (/commerce/specs/api/promotions) |
| 118 | verified | pass | rfc.discovery.md:7, :105 (Cache-Control public, max-age=3600 SHOULD), no auth |
| 120 | verified | pass | JSON Schema CheckoutSession.status enums per dated folder: 2025-09-29 five values; 2025-12-12 adds authentication_required; 2026-01-30 eleven values |
| 121 | verified | pass (citation gap) | Claim cites the 2025-09-29 and 2026-01-30 schema records but not the 2025-12-12 schema, which is the one showing the first appearance (verified in research/vendor/acp/spec/2025-12-12). JSON Schema CheckoutSession.status enums per dated folder: 2025-09-29 five values; 2025-12-12 adds authentication_required; 2026-01-30 eleven values |
| 122 | verified | pass | JSON Schema CheckoutSession.status enums per dated folder: 2025-09-29 five values; 2025-12-12 adds authentication_required; 2026-01-30 eleven values |
| 128 | verified | pass | openrpc.agentic_checkout.json methods (five names match); docs/mcp-binding.md:5,23-24,70-78 (JSON-RPC 2.0, Streamable HTTP, meta/id/payload) |
| 129 | verified | pass | openrpc.agentic_checkout.json methods (five names match); docs/mcp-binding.md:5,23-24,70-78 (JSON-RPC 2.0, Streamable HTTP, meta/id/payload) |
| 132 | verified | pass | rfc.agentic_checkout.md:326 "TLS 1.3 MUST be used"; llms-full.txt "TLS 1.2 or later on port 443" |
| 135 | verified | pass | openapi.agentic_checkout_webhook.yaml:8-13,46-50 (t=<unix>,v1=<64hex>, HMAC-SHA256(timestamp + "." + raw_body), 300 s, 401) |
| 136 | verified | pass | openapi.agentic_checkout_webhook.yaml:8-13,46-50 (t=<unix>,v1=<64hex>, HMAC-SHA256(timestamp + "." + raw_body), 300 s, 401) |
| 138 | verified | pass | Absence check: grep of rfcs/, docs/, README for 9421, verifiable credential, mandate returns only delegate_authentication "mandated" challenge type (unrelated) |
| 142 | verified | pass | rfc.delegate_payment.md:38 (client MUST compute detached signature) vs header list RECOMMENDED; openapi.delegate_payment.yaml:269-272 Signature required: false |
| 156 | verified | pass | openapi.agentic_checkout_webhook.yaml:76,97 (type order_create / order_update); rfc.agentic_checkout.md:51 |
| 157 | verified | pass | llms-full.txt production checklist: "order_created and subsequent order_updated" |
| 164 | verified | pass | Stripe SPT docs (markdown payload): "Stripe might use tokens issued through ... Mastercard's Agent Pay and Visa's Intelligent Commerce programs on your behalf" |
| 175 | reported | pass | Retail Systems article text: spokesperson told The Information "instant checkout is moving to apps"; published 2026-03-10; non-primary so confidence reported is right |
| 177 | verified | pass | Wayback of powering-product-discovery-in-chatgpt (20260929220135): "did not offer the level of flexibility"; "merchants share product feeds and promotions" |
| 178 | verified | pass | Wayback of powering-product-discovery-in-chatgpt (20260929220135): "did not offer the level of flexibility"; "merchants share product feeds and promotions" |
| 183 | verified | pass | developers.openai.com/apps-sdk/build/monetization.md: external checkout "recommended and generally available"; payment sheet "(private beta)" for select marketplaces |
| 184 | verified | pass | developers.openai.com/apps-sdk/build/monetization.md: external checkout "recommended and generally available"; payment sheet "(private beta)" for select marketplaces |
| 189 | verified | pass | docs.stripe.com/agentic-commerce: "Protocol used UCP or ACP" for Sell through agents |
| 192 | verified | pass | Wayback buy-it-in-chatgpt: "Merchants pay a small fee on completed purchases, but the service is free for users" |
| 194 | reported | pass | pymnts.com text: 4% fee, The Information, citing a Shopify spokesperson; non-primary so reported is right |
| 196 | verified | pass | Inference from README/LICENSE (no fee terms) plus llms-full.txt merchant-of-record FAQ; no spec text sets a fee. Acceptable as stated, low risk |
| 202 | verified | pass | research/vendor/ERCs/ERCS/erc-8183.md: status Draft, created 2026-02-25, line 16 "defines the Agentic Commerce Protocol: a job with escrowed budget" |
| 205 | verified | pass | Absence check: no ACP/UCP mapping document in rfcs/ or ucp docs/source (grep) |
| 206 | verified | pass | ACP 2026-04-17 status enum and ucp/source/schemas/shopping/checkout.json:60-80 (incomplete, requires_escalation, ready_for_complete, complete_in_progress, completed, canceled): five shared names |
| 208 | verified | pass | rfc.discovery.md:7; ucp/docs/specification/reference.md:83 |
| 212 | verified | pass | Absence check (no mandate/intent-signature objects in rfcs); Wayback buy-it: "explicitly confirm each step" |
| 216 | verified | fail (minor: no asOf) | rfc.agentic_checkout.md:103,349 and openapi.agentic_checkout.yaml example items with quantity: 1; schema requires line_items. Wording "still" is time-variant but claim lacks asOf (see required fixes) |
| 219 | verified | pass | llms-full.txt: "idempotency_conflict with HTTP 409"; "HTTP 201 Created"; spec: 422 (rfc:278) and POST /complete only "200" in openapi.agentic_checkout.yaml |
| 220 | verified | pass | llms-full.txt: "idempotency_conflict with HTTP 409"; "HTTP 201 Created"; spec: 422 (rfc:278) and POST /complete only "200" in openapi.agentic_checkout.yaml |
| 221 | verified | pass | changelog/2026-04-17.md:503 order status list ends delivered; schema.agentic_checkout.json:2509 lists completed |
| 224 | verified | pass | Wayback discovery post + Retail Systems (as above) |
| 226 | verified | pass | lfaidata.foundation post dated August 29, 2025 "ACP Joins Forces with A2A"; IBM Research launched ACP March 2025 |
| 227 | verified | pass | pypi.org/pypi/acp-sdk/json: summary "Agent Communication Protocol SDK", author IBM Corp. |
| 228 | verified | pass | whitepaper.virtuals.io: "Agent Commerce Protocol (ACP) is the commerce layer". Page says EconomyOS has "optional onchain tokenization"; the claim wording "on-chain agent economy" is a mild paraphrase |
| 229 | verified | pass | agentclientprotocol README: "standardizes communication between code editors and coding agents" |
| 230 | verified | pass | arxiv.org/abs/2505.02279: survey of MCP, Agent Communication Protocol (ACP), A2A, ANP, 2025-05-04 |
| 232 | verified | pass | Wayback buy-it: "explicitly confirm each step"; "tokens are only authorized for specific amounts and specific merchants with the user's permission" |
| 233 | verified | pass | README.md:13 ("without being the merchant of record") |
| 237 | verified | pass | examples/2026-04-17/examples.agentic_checkout.json create_checkout_session_request line_items [{"id":"item_123"}] |

### 1b. Random sample of 30 further claims

| Claim | Confidence | Verdict | Evidence and note |
|---|---|---|---|
| 004 | verified | pass | rfcs/*.md line 3 Status: checkout, delegate_payment, delegate_authentication, discount, extensions, orders, payment_handlers, seller_backed = Draft; capability_negotiation, cart, discovery, product_feeds, intent_traces, affiliate, marketing_consent = Proposal |
| 006 | verified | pass | gh api repos/...: created_at 2025-09-29T04:09:29Z |
| 020 | verified | pass | docs/operating-model.md lines 9-12 (Thursday, 30 min), 28-37 (weekly triage rotation, 2 business days) |
| 024 | verified | pass | legal/cla/SIGNATORIES.md: PayPal 2026-04-16, Meta 2026-03-19 |
| 059 | verified | pass | schema.agentic_checkout.json:2086-2106 purchase_order_number, payment_terms enum immediate/net_15/net_30/net_60/net_90, due_date, approval_required |
| 064 | verified | pass | changelog/2026-04-17.md:540-560 (display_order, display_name) |
| 081 | verified | pass | changelog/2026-04-17.md:362 (iin maxLength 6 to 8); schema maxLength 8 |
| 084 | verified | pass | schema.cart.json Cart required [id, line_items, currency, totals] |
| 090 | verified | pass | openapi.agentic_checkout.yaml:1782,2634 (discount_code_expired) |
| 096 | verified | pass | openapi.agentic_checkout.yaml: POST /checkout_sessions/{id}/complete responses 200, 400, 409, 422 |
| 104 | verified | pass | rfc.delegate_authentication.md:128,189 (Y, N, U; 10 second timeout gives N) |
| 105 | verified | pass | schema.agentic_checkout.json:557-589 (interventions required, enforcement); rfc.capability_negotiation.md:186-188 (always, conditional, optional) |
| 126 | verified | pass | rfc.delegate_authentication.md:116-119 |
| 139 | verified | pass | llms-full.txt: "migrate entirely to using network tokens ... Eligible cards will be upgraded using network tokenization" |
| 145 | verified | pass | arxiv.org/abs/2607.19436 abstract: "AP2 and ACP ... do not provide interoperable, tamper-evident auditability"; submitted 2026-07-21. The paper does not say which ACP; claim text is neutral |
| 154 | verified | pass | llms-full.txt prohibited products list (adult content, alcohol, nicotine, gambling, weapons, prescription-only medications) |
| 155 | verified | pass | Stripe SPT docs: "available to agents, customers, and sellers in the US, Canada, and select European countries" |
| 160 | verified | pass | agenticcommerce.dev FAQ: "We're working to create discovery mechanisms for AI platforms"; no registry found in repo |
| 162 | verified | pass | Stripe SPT docs: payment_method_data[shared_payment_granted_token]; "cloned from the customer's original payment method" |
| 166 | verified | pass | docs.stripe.com/agentic-commerce: Agents section "Private preview ... Join the waitlist" |
| 169 | verified | pass | Wayback buy-it: "Instant Checkout items are not preferred ... factors like availability, price, quality ... whether Instant Checkout is enabled" |
| 176 | reported | pass | Retail Systems: 3 March investor conference, Shopify president, "around a dozen merchants"; non-primary so reported is right |
| 182 | verified | pass | Wayback discovery post: Walmart in-ChatGPT app "account linking, loyalty and Walmart payments" |
| 185 | verified | pass | monetization.md: requestCheckout; token to MCP server via complete_checkout tool call |
| 197 | unverified | pass | Stripe SPT and agentic-commerce pages fetched 2026-10-13: no pricing text; page labeled Public preview (R47 consistent) |
| 200 | verified | pass | gh api 2026-10-13: 1573 stars, 253 forks (claim 1,570 / 253 at 2026-10-11): normal drift, asOf present |
| 231 | unverified | pass | arxiv.org/abs/2604.15367 abstract lists "Agent Commerce Protocol (ACP)" and "Agentic Commerce standard (ERC-8183)" separately; unverified label is right |
| 234 | verified | pass | Stripe newsroom: "passes the token to the merchant ... or ... another provider while still benefiting from Stripe's risk scores" |
| 236 | reported | pass | ecommerce-platforms.com article updated Jul 29, 2026 (non-primary; reported label right); "rate not public" not independently confirmed |
| 238 | verified | pass | schema.delegate_payment.json Error.code enum (six values) |
## Check 2: field names, headers, enums, endpoints, events, error codes

Method: parsed all 8 `<FieldTable>` blocks (96 name segments, 80 table rows) and the 4 `<Mode spec>` blocks (60 backticked identifiers) from `index.mdx`, then resolved every field path against `research/vendor/acp/spec/2026-04-17/json-schema/schema.agentic_checkout.json` and `schema.delegate_payment.json` (property existence and required flag, with `allOf` and `$ref` followed), the OpenAPI files (paths, headers, webhook events), the RFC header list and `docs/mcp-binding.md`. Flow payloads, `observability.json`, `security.json`, `code.json` and `controls.json` were scanned for identifiers and compared with the spec corpus. Stripe identifiers were checked on docs.stripe.com.

### 2a. FieldTable rows

| Table | Rows checked | Names not in spec | Required flag wrong | Note |
|---|---|---|---|---|
| CheckoutSession (CheckoutSessionBase) | 17 | 0 | 0 | Required set matches the schema (`id`, `status`, `currency`, `line_items`, `totals`, `fulfillment_options`, `messages`, `links`, `capabilities`). |
| CheckoutSessionCreateRequest | 8 (12 names) | 0 | 0 | `locale`, `timezone`, `quote_id`, `metadata`, `order_notes` all exist. |
| CheckoutSessionCompleteRequest | 9 | 0 | 0 | `payment_data.instrument.credential.{type,token}` required, matches PaymentData schema. `handler_id` optional in schema, optional in table. |
| PaymentHandler | 9 | 0 | 0 | `display_name`, `display_order` optional, present. |
| DelegatePaymentRequest and Allowance | 11 | 0 | 0 | Six Allowance fields and `reason` enum `one_time` match. |
| DelegatePaymentResponse | 3 | 0 | 0 | |
| Checkout request headers | 7 | 0 | 0 | rfc.agentic_checkout.md:63-70: Authorization, API-Version, Idempotency-Key and Content-Type REQUIRED; Signature, Timestamp, Request-Id RECOMMENDED. |
| Order and order webhook (WebhookEvent) | 9 | 0 | 2 | `data.type` and `data.status` are shown as optional, but `EventDataOrder` in `openapi.agentic_checkout_webhook.yaml:219` requires `[type, checkout_session_id, permalink_url, status]`. The Order schema also requires `id`, which the table does list. |

### 2b. Mode spec identifiers (60)

All 60 resolve in the spec corpus except four that are intentional or file-level references: `/product_feeds...` (OpenAI's own docs path, in llms-full.txt, contrasted with the spec's `/feeds`); `order_updated` and `order_created` (OpenAI checklist spelling, contrasted with `order_create` and `order_update`); `CheckoutSession.status` (the spec defines it on `CheckoutSessionBase`, inherited by `CheckoutSession`; acceptable); `spec/2026-04-17/json-schema/` (directory path). Error codes (`out_of_stock`, `payment_declined`, `requires_sign_in`, `requires_3ds`, `intervention_required`, etc.), `Total.type` values, message `resolution` values (`recoverable`, `requires_buyer_input`, `requires_buyer_review`) and discount error codes were matched value by value against the schema enums. Wrong identifiers: 0.

### 2c. Other files

| File | Identifiers | Result |
|---|---|---|
| observability.json | `shared_payment.issued_token.{active,requires_action,used,deactivated}`, `shared_payment.granted_token.deactivated`, `product_feeds` | pass: the Stripe names appear on docs.stripe.com SPT page (2026-10-13); `product_feeds` is OpenAI's path |
| security.json | 4 | pass |
| code.json | `validate:json-schema`, `validate:all`, version 0.1.0, `Merchant-Signature` rule, snippet request body | pass: package.json lines 3, 6, 13 |
| controls.json | `usage_limits` | pass (Stripe SPT parameter on docs.stripe.com) |
| flows (7 files, 44 steps) | labels, paths, headers | pass; `POST /agentic_checkout/webhooks/order_events` is `openapi.agentic_checkout_webhook.yaml:30`; delegate authentication paths match the OpenAPI |

### 2d. Illustrative payloads validated with ajv

Script: Ajv 8.20 (2020-12, formats off) against the dated 2026-04-17 JSON Schemas; scratch script kept outside the repository. 19 payloads validated (the brief asks for up to 10).

| Flow and step | Schema | Result | Detail |
|---|---|---|---|
| 3ds-authentication 3 | Error | pass | |
| 3ds-authentication 7 | CheckoutSessionCompleteRequest | pass | |
| cancel-intent-trace 2 | CancelSessionRequest | pass | |
| checkout-happy-path 1 | DiscoveryResponse | pass | |
| checkout-happy-path 3 | CheckoutSessionCreateRequest | pass | |
| checkout-happy-path 4 | CheckoutSession | fail | `fulfillment_options[0]` (type shipping) lacks required `totals` (FulfillmentOptionShipping requires `type, id, title, totals`). |
| checkout-happy-path 5 | CheckoutSessionUpdateRequest | pass | |
| checkout-happy-path 8 | DelegatePaymentRequest | pass | |
| checkout-happy-path 9 | DelegatePaymentResponse | pass | |
| checkout-happy-path 10 | CheckoutSessionCompleteRequest | pass | |
| checkout-happy-path 12 | CheckoutSessionWithOrder | fail (abbreviated) | Only `id`, `status`, `order`; the full session fields are omitted. The step detail says what the response must carry, but the payload is not marked as abbreviated. |
| checkout-happy-path 13 | WebhookEvent plus Order | pass | |
| delegate-payment 1 | DelegatePaymentRequest | pass | |
| delegate-payment 3 | DelegatePaymentResponse | pass | |
| failure-idempotency-conflict 2 | Error | pass | |
| failure-idempotency-conflict 5 | Error | pass | |
| order-webhook 2 | Order (adjustments) | fail | `adjustments[0]` lacks required `occurred_at` (Adjustment requires `id, type, occurred_at, status`). |
| product-feed-push 1 | CreateFeedRequest | fail | Payload sends `{id, target_country}`; `CreateFeedRequest` has `additionalProperties: false` and only `target_country`. `id` is server-assigned in FeedMetadata (openapi.feed.yaml:36 example sends only `target_country`). The step label "Create feed metadata (id, target_country)" repeats the error. |
| product-feed-push 2 | UpsertProductsRequest | fail | `variants[0].price.currency` is `"usd"`; the feed schema `Price.currency` pattern is `^[A-Z]{3}$` (uppercase, unlike checkout, which is lowercase). |

Totals for check 2: 96 table segments and 60 Mode spec identifiers checked (156), 0 non-existent identifiers, 2 wrong required flags, 5 payload failures (4 genuine schema errors, 1 abbreviated).

