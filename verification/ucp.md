# UCP verification report

Verifier: an independent agent, 2026-10-11. I followed `docs/briefs/VERIFIER_BRIEF.md` for slug `ucp` (ATLAS_PROMPT.md Section 5.5), plus ATLAS_FOLLOWUP.md Section 2, ATLAS_ERRATA.md rows 2.1.9, 2.1.14 and R1 to R5, the scenario `shopper-in-gemini`, and the playground.

**Scope:** `src/content/protocols/ucp/` (every file), the 9 flows `src/content/flows/ucp-*.json`, `src/content/states/ucp-checkout-lifecycle.json`, the diagrams `src/content/diagrams/ucp-*` and `ap2-in-ucp*`, `src/content/scenarios/shopper-in-gemini.mdx` with `src/content/flows/multi-shopper-in-gemini.json`, `src/playgrounds/ucp/`, and the rendered `dist/p/ucp/index.html`. The rendered page was built at 14:25, after the last UCP content change at 13:59, so I did not rebuild.

**Spec baseline:** `research/vendor/ucp` at tag v2026-08-25, commit cd78fb38e819de77d9b527d110476eccb876f1bd. That is the same commit every FieldTable `specRef` and flow `specRef` pins. I treated `main` (ad9950b, 2026-10-09) as draft.

## Summary

| Check | Pass | Fail | Unreachable |
|---|---|---|---|
| 1. Claims against sources (88 referenced + 40 sampled = 128) | 125 | 3 | 0 |
| 1b. Mechanical: verified claims with only non-primary sources; claims with a number and no asOf (235 claims) | 235 | 0 | 0 |
| 2. Identifiers (245 extracted) | 245 | 0 | 0 |
| 3. Dates, versions, numbers (20 timeline events, 9 changedRecently, frontmatter, 10 metrics, SDK versions) | 41 | 0 | 0 |
| 4. Do not get wrong (3 items) | 3 | 0 | 0 |
| 5. Diagrams and flows (9 flows, state machine, 7 hand-written diagrams, scenario flow) | 17 | 2 | 0 |
| 6. Specified vs deployed, stewardship | 6 | 0 | 0 |
| 7. Style gates | 4 | 3 | 0 |
| 8. Coverage | 1 | 0 | 0 |
| Errata and follow-up items touching UCP | 9 | 0 | 0 |
| Playground identifiers | 1 | 0 | 0 |

## Check 1: claims

**How I sampled.** The 88 priority claims are every claim referenced from the frontmatter `keyFacts`, `facts.json`, `faq.json`, `quiz.json` and `flashcards.json`. The pool holds 235 claims, so I drew a random sample of 40 from the remaining 147 (seed 20261011).

**How I checked.**
- 85 claims cite only files in the UCP repository. I checked them against the tag, `main` or `gh api`.
- 43 claims cite external pages. I fetched each one with curl, and a helper agent did the same in parallel. Its evidence table is kept in the session scratchpad, `verify-ucp/ext_results.md`.

**Mechanical checks.** No `verified` claim rests only on secondary sources. Every claim with a number or date has an `asOf`. Every cited claim id and source id resolves. The rendered page and the scenario page have no `data-missing` citations.

### Fails

| Claim | Verdict | Evidence | Note |
|---|---|---|---|
| clm-ucp-190 (reported) "normal PSP processing fees apply to UCP checkouts on Google" | fail | src-ucp-google-faq (developers.google.com/merchant/ucp/faq) | The FAQ never mentions fees. It only says the merchant is merchant of record and the PSP "must be able to process our tokens". The fee statement is an inference. Used in `faq.json:98` and the scenario at line 87. |
| clm-ucp-201 (verified) "No bridge between UCP and ACP ... although Stripe co-develops ACP and holds UCP council seats" | fail (partial) | src-ucp-maintainers, src-ucp-announcements | The Stripe seats are supported: MAINTAINERS.md lists Twum Djin and Prasad Wangikar, and the announcements carry the 2026-04-28 entry. Neither source says Stripe co-develops ACP. |
| clm-ucp-203 (verified) "UCP's network_token credential type ..." | fail (wrong source file) | `source/schemas/common/types/payment_instrument.json` at cd78fb3 | `network_token` is not in the cited file. It is defined in `common/types/network_token_credential.json` (`const: network_token`). The fact is true. The "no Mastercard Agent Pay integration documented" half is supported. |

### Passes worth noting

| Claim | Note |
|---|---|
| clm-ucp-018 | GOVERNANCE.md gives 16 members per Domain Tech Council but also defines permanent founding seats, so not every seat is elected. MAINTAINERS.md lists 17 Shopping names. `index.mdx:309` says "Domain Tech Councils of 16 members, elected by the council every 6 months". See advisory fix A2. |
| clm-ucp-024, clm-ucp-026 | Releases v2026-01-11, v2026-01-23, v2026-04-08 and v2026-08-25 confirmed with `gh api .../releases`. v2026-04-08 was published 2026-04-09T01:48Z. |
| clm-ucp-029, 030, 031, 044 | At v2026-01-11 the schema name was `dev.ucp.shopping.ap2_mandate` (read with gh api), and it was still that at v2026-04-08. PR 741 merged 2026-08-25. The release notes spell it `ap2_mandates` and say `signing_keys[]` was removed (PR 566). |
| clm-ucp-038, 041, 042 | PR 156 merged 2026-02-17. PR 431 merged 2026-05-20 into `release/2026-04-08`. PR 483 merged 2026-07-03. |
| clm-ucp-089 | The cited overview says platforms "MUST use Dictionary Structured Field syntax (RFC 8941)" (overview/index.md:1738). |
| clm-ucp-134 | signatures.md:95-101: verifying ES256 is MUST; ES384 and EdDSA are OPTIONAL. |
| clm-ucp-180, 181 | Microsoft page: "MMC will support Universal Commerce Protocol (UCP)" (future tense). "You must have a MMC account and a UCP-compliant feed" (present tense). |
| clm-ucp-192 | Google UCP FAQ (updated 2026-10-02): UCP on Google's AI surfaces "only supports PAN_ONLY" for `allowed_auth_methods`. |
| clm-ucp-196, 197 | The 2026-05-19 post says Google will "begin bringing AP2 to Google products in the coming months, starting with Gemini Spark". No source claims production use. |
| clm-ucp-178 | Google frames ads and YouTube purchases as "Soon". The claim keeps forward-looking wording. |

All other checked claims pass. The spec-sourced claims were matched to these places:

| Claims | Where the spec supports them |
|---|---|
| 032, 033, 034 | overview:997, 1161, 3725-3740 |
| 054, 055, 057, 058, 059, 060, 061 | profile.json, ucp.json, overview:1249-1258 |
| 071 | checkout.json: `expires_at` "Default TTL is 6 hours" |
| 074 to 077 | Credential schemas |
| 083 to 086, 109, 112, 139 | ap2-mandates.md and payment_ap2_mandate.json |
| 088, 090, 091, 094 | overview:1735-1830, 1859-1863 |
| 096 to 101, 227, 228, 234 | checkout/index.md:340-486, 940-1032, 1078-1117 |
| 104 to 106 | overview:2511-2586 |
| 116 to 120 | identity-linking:57-59, 164-169, 296-314 |
| 130 | rest.openapi.json: `UCP-Agent`, `Request-Id` and `Idempotency-Key` are required |
| 132 to 137 | signatures.md:798-836 and overview:1883 |
| 143 | overview:2199 |
| 211 | overview:3378-3390 |
| 217 | glossary:37 |
| 221 | overview:2577 |
| 223 | rest.md:129 |

## Check 2: identifiers

**What I extracted.** I pulled 245 identifiers with a regex covering reverse-DNS names, snake_case words, paths and hyphenated headers. They come from:
- `index.mdx`: FieldTables, the Mode spec blocks and the operations table
- `observability.json` and `security.json`
- the 10 flows, the state machine and the diagrams
- the playground

I then searched for each one in the tag tree (docs and `source/`). All protocol identifiers match the tag:
- **Profile:** `ucp.version`, `services`, `capabilities`, `payment_handlers`, `supported_versions`, `map_order`, top-level `keys`.
- **Checkout:** the required set `ucp, id, line_items, status, currency, totals, links`, plus `messages`, `actions`, `signals`, `expires_at`, `continue_url`, `payment`, `order`. The status enum has 6 values, matching the schema.
- **Payment instrument:** requires `id`, `handler_id` and `type`.
- **Credentials:** `token`; `pan` (`number`, `expiry_*`); `network_token` (`number`, `cryptogram`, `eci_value`, `token_requestor_id`). `card_number_type` is `fpan`, `network_token` or `dpan`, and the `card_credential` schema is `deprecated: true`.
- **AP2:** `ap2.merchant_authorization` (pattern `header..signature`), `ap2.checkout_mandate` (SD-JWT+kb; `ucp_request` complete required), `payment.instruments[*].credential.token`, and 7 AP2 error codes.
- **REST paths** (all match `rest.openapi.json` and `common/rest.openapi.json`): `/checkout-sessions`, `/{id}`, `/{id}/complete`, `/{id}/cancel`; the same set for `/carts`; `/catalog/search`, `/catalog/lookup`, `/catalog/product`; `/orders/{id}`; `/locations/search`, `/locations/lookup`.
- **MCP tools** (all match the OpenRPC files): `create_checkout`, `get_checkout`, `update_checkout`, `complete_checkout`, `cancel_checkout`, `create_cart`, `get_cart`, `update_cart`, `cancel_cart`, `search_catalog`, `lookup_catalog`, `get_product`, `get_order`, `search_locations`, `lookup_locations`.
- **Embedded:** `ec.ready`, `ec.start`, `ec.complete`, `ec.payment.credential_request`.
- **Headers** (OpenAPI components plus signatures.md): `UCP-Agent`, `Request-Id`, `Idempotency-Key`, `Signature`, `Signature-Input`, `Content-Digest`, `Authorization`, `X-API-Key`, `Webhook-Id`, `Webhook-Timestamp`, `Signature-Agent`.
- **Negotiation and signature error codes** with REST and MCP numbers: match overview:1859-1873.
- **Severities:** the 4 values match message_error.json.
- **Action types:** `dev.ucp.common.payment.device_data_collection` and `.three_ds_challenge`.
- **A2A DataPart keys:** `a2a.ucp.checkout`, `.payment`, `.signals`.
- **Signals keys:** `dev.ucp.buyer_ip`, `dev.ucp.user_agent`.
- **Handler ids:** `com.google.pay`, `dev.shopify.shop_pay`.
- **Capability names:** every name listed in index.mdx:321-332.

**Identifiers not at the tag, all correctly labeled in the content:**

| Identifier | Where | Verdict |
|---|---|---|
| `dev.ucp.shopping.ap2_mandate` | index.mdx:330, relations.json, playground fixtures | ok: the historical name, present at v2026-01-11 and v2026-04-08, stated as the old name |
| `signing_keys` | index.mdx:168 | ok: removed in this release, present at v2026-04-08 |
| `ap2_mandates` | index.mdx:346 | ok: the release-notes spelling, stated as drift |
| `dev.ucp.common.ask`, `dev.ucp.lodging.booking` | index.mdx:100, 305, 332 | ok: on `main` only, labeled as drafts |
| `Google-UCP-Prober`, `Google/UCP` | index.mdx:147 | ok: from Google's documentation, not the spec |
| `checkout_hash`, `transaction_id`, `payment_amount`, `risk_data` | scenario flow | ok: AP2 v0.2 fields, confirmed in `research/vendor/AP2` at v0.2.0 (`payment_mandate.json`, `checkout_mandate.json`) |
| `update_not_allowed` | playground | ok: declared a fixture code in `FIXTURE_CODES`, flagged in the UI and the README |
| `authority_binding_failed`, `core_version_mismatch`, `missing_schema`, `not_offered_by_*`, `no_common_version`, `orphaned_extension`, `platform_cannot_execute`, `filtered_by_cart_context`, `no_common_instrument` | playground lib | ok: internal reason labels shown as explanations, not as wire codes |
| `chk_*`, `order_789`, `evt_001`, `req_01`, `agent_2026`, `shop_2026`, `sku_*`, `gift_card_1`, `wallet_1` and similar | examples | ok: illustrative ids |

**Payload checks.** The scenario complete payload uses `type: "PAYMENT_GATEWAY"`, which appears in the spec's a2a.md and playground examples. `selected` exists in payment_instrument.json. The create example in index.mdx:248-260 carries only `line_items`, as `ucp_request` create requires, and its signed components match signatures.md.

**Playground.** `lib/transport.ts` maps every operation to the correct REST path and status. Create returns 201, as in the OpenAPI. MCP tool names, the `meta["ucp-agent"].profile` placement, the A2A `add_to_checkout` and `complete_checkout` actions, `X-A2A-Extensions`, and the `a2a.ucp.*` keys all match the tag.

## Check 3: dates, versions, numbers

| Item | Verdict | Evidence |
|---|---|---|
| `firstAnnounced` 2026-01-11 | pass | Google NRF remarks and Developers blog, both 2026-01-11 |
| `latestVersion` v2026-08-25; SDKs `@ucp-js/sdk` 0.5.1, `ucp-sdk` 0.5.0 | pass | gh releases; npm latest 0.5.1 (2026-09-02); PyPI 0.5.0 |
| Timeline, 20 events | pass | Repository created 2025-12-31T02:17Z. Releases as listed. PRs 156 and 483. Announcements give 04-24, 04-28, 07-16, 08-11, 09-02 and 09-25. Google posts dated 02-11, 04-28, 05-19 and 05-20. The 02-03, 03-19 and 09-22 events are correctly tagged reported. |
| `facts.changedRecently`, 9 items | pass | Same sources as the timeline |
| Metrics | pass | Stars 3,413 asOf 2026-10-11 (3,414 when I checked). Forks 476 (477). 4 releases. 3 of 5 council seats filled. |
| Advisory | note | The v2026-01-11 tag and GitHub release were created 2026-01-23, so "release v2026-01-11" on the 2026-01-11 timeline row is a version label, not the tag date. The v2026-04-08 tag now points at a 2026-09-09 backport commit, which matches clm-ucp-035. No change required. |

## Check 4: "Do not get wrong"

| Item | Verdict | Where |
|---|---|---|
| UCP is not Google's Universal Cart | pass | Frontmatter `disambiguation[0]`; index.mdx:131 (section A); facts.whatItIsNot[0]; timeline 2026-05-19 |
| Google is not the merchant of record | pass | `disambiguation[1]`; index.mdx:131 and 139; faq.json; scenario line 22 |
| AP2 is an extension used inside UCP, not the same thing | pass | `disambiguation[2]`; index.mdx:131, 339 and 372; faq.json:23; facts.whatItIsNot[2] |

## Check 5: diagrams and flows

**Main flow `ucp-rest-checkout`: pass.** The step order follows the spec: discovery, version and authority check, signed create, business fetching the platform profile and intersecting, 201 incomplete, PUT full replacement, trusted UI, handler, complete, PSP outside UCP, signed webhook. Failure branches use real codes.

**Other flows: pass.**
- `ucp-failure-capabilities-incompatible`: the 200 response with `ucp.status: error` and a `continue_url` fallback matches overview:1940-1963.
- `ucp-failure-lost-complete-response`: polling Get Checkout, then resending the identical request with the same key, matches checkout:1108-1117.
- `ucp-3ds-authentication-actions`, `ucp-checkout-escalation`, `ucp-discovery-negotiation`, `ucp-identity-linking` (RFC 9728, then RFC 8414, PKCE S256, `iss`) and `ucp-ap2-mandate-checkout` also pass.

**Hand-written diagrams: pass.** `ucp-capability-namespace`, `ucp-composition`, `ucp-context`, `ap2-in-ucp` and `ucp-transport-bindings` make no unsupported claim. Links that do not exist are drawn as "no bridge" or "no documented link".

**Scenario flow `multi-shopper-in-gemini`: pass, see R1.**

**State machine `ucp-checkout-lifecycle`:** the 6 states match the schema enum. Two issues:

| # | Issue | Evidence |
|---|---|---|
| D1 | The transition `ready_for_complete` to `requires_escalation` is missing. The spec says a Complete Checkout response can return `requires_escalation` for buyer handoff. | checkout/index.md:1103-1106 ("`requires_escalation` for Buyer handoff"). Also affects the table at index.mdx:278. |
| D2 | The transition `complete_in_progress` to `incomplete` ("Action fails or payment declined") cites `authentication.md#decline-failure-and-abandonment`, which does not state it. The spec returns `incomplete` only when Complete is *not accepted* (authentication.md:171-173; three-ds-challenge.md:47-52). During `complete_in_progress` it prescribes fallback, handoff, then cancel (checkout:470-486). | Also at index.mdx:279. Re-source it or remove it. |

## Check 6: specified vs deployed, stewardship

**Pass.**
- `status: live` is scoped to Google checkout since 2026-02-11.
- The AP2 extension is marked "specified, live use unverified" everywhere: statusNote, index.mdx:339 and 372, compare-cells, controls.json, ecosystem.json "AP2 extension in production: unknown", and the compare.json adoption cell.
- Microsoft is described in the future tense.
- Universal Cart, ads and Canada, Australia and the UK are described as announcements.
- The 09-22 auto-enrollment is tagged reported.
- Stewardship matches GOVERNANCE.md and MAINTAINERS.md: Governing Council, Google and Shopify permanent seats, Stripe elected, Google custodian of ucp.dev and holder of the proxy until December 2028, no foundation.
- Drafts on `main` are labeled.

## Check 7: style

| Gate | Result |
|---|---|
| `pnpm lint:style` | 0 errors; 0 warnings in UCP or scenario files (32 warnings elsewhere) |
| `pnpm lint:ste --protocol ucp` | pass (72 sentences, 0 errors, 0 warnings) |
| U+2014 in scope | none |
| US spelling | 1 issue: `compliance.json:98` "authorised" (not a quotation) |
| Acronyms on first use in index.mdx | Never expanded: JWS (198), JCS (198), PAN (194), FIDO (361). Expanded only after first use: AP2 (first at 132, expanded later in the same paragraph) and SD-JWT (first at 199, expanded at 373). UCP is unexpanded in the ELI5 block and section A, though the intro expands it. |

## Check 8: coverage

`pnpm verify:coverage --protocol ucp`: all checks pass (8 pass, 0 fail, 0 missing). The counts are 15 diagrams, 36 resources, 33 publications, 13 STRIDE threats, 13 FAQs, 10 quiz questions, 15 flashcards, 20 timeline events, 34 of 34 compare cells, 14 of 14 controls, and 235 of 235 claims sourced.

## Errata and follow-up items

| Item | Verdict | Evidence |
|---|---|---|
| Follow-up 2.1.9 / errata 2.1.9: AP2 production use unverified anywhere, including in UCP | pass | index.mdx:28, 339, 372; compare-cells.json:88, 138, 337; compare.json adoption cells (ucp: "AP2 inside UCP: unverified"; ap2: "Unverified anywhere, including inside UCP"); scenario line 24 |
| 2.1.14: Microsoft tense | pass | index.mdx:28 and 147; faq.json:69; ecosystem.json:81; open-questions.json:30. "Copilot Checkout requires a UCP-compliant feed" is present tense. |
| 2.2 Scenario 3: "a network token" wording; AP2 step "per spec; live use unverified" | pass, superseded by R1 | scenario lines 24, 91; flow step 8 label "(per spec; live use unverified)" |
| R1: Google surfaces use PAN_ONLY; no network token shown | pass | Scenario: frontmatter summary, step 7, table row 7, and the Variants note that a network-token path is not documented and which network's token is not published. Flow step 7 is labeled "(PAN_ONLY)" and its detail says CRYPTOGRAM_3DS and agentic tokens are not documented. No `network_token` or Mastercard appears in the flow payloads. Source confirmed: the Google FAQ. |
| R2: only third-party extensions version independently | pass | index.mdx:307; faq.json:51; playground text (Playground.tsx:539); overview:997, 1161, 3725 |
| R3: ES256 is a baseline, not mandatory-only | pass | index.mdx:295; faq.json:61; signatures.md:95-101 |
| R4: two arXiv papers name UCP; W3C and GS1 session 2026-09-08 | pass | compare-cells.json:342; faq.json:114; timeline 2026-09-08 |
| R5: no convergence claim | pass | index.mdx:370; open-questions.json:44-45; frontmatter `disambiguation[3]` |
| Other Section 2 items (2.1.1 to 2.1.8, 2.1.10 to 2.1.13, 2.1.15, 2.1.16, 2.3) | not applicable | They concern other protocols. A grep of the UCP folder found no carried-over wrong wording. |

## Required fixes, in priority order

1. **`src/content/protocols/ucp/claims.json` clm-ucp-190.** The Google FAQ does not mention fees. Either re-source it to the reporting already used by clm-ucp-191 (PYMNTS, relaying The Information) and keep it `reported`, or set it to `unverified`. The same fix applies to `faq.json:95-98` and to `src/content/scenarios/shopper-in-gemini.mdx:87`.
2. **clm-ucp-201.** Add a primary ACP source for "Stripe co-develops ACP", such as the ACP repository or the OpenAI and Stripe launch post already in the openai-acp sources. Otherwise drop that clause from the claim and from index.mdx:370 ("Stripe co-develops ACP ...").
3. **clm-ucp-203.** Add a source record for `source/schemas/common/types/network_token_credential.json` at cd78fb3 and cite it in place of, or in addition to, `src-ucp-schema-payment`. The same applies to clm-ucp-075 and clm-ucp-076 if they rely on that file.
4. **`src/content/states/ucp-checkout-lifecycle.json` and the status table at index.mdx:278.** Add `ready_for_complete` to `requires_escalation` on a Complete response, sourced to checkout/index.md#complete-checkout.
5. **The same state machine and index.mdx:279, transition `complete_in_progress` to `incomplete`.** The cited section does not support it. Remove it, or re-source it to explicit spec text. The spec handles failure in `complete_in_progress` through fallback, handoff, then cancel, and returns `incomplete` only when Complete is not accepted.
6. **`src/content/protocols/ucp/compliance.json:98`.** Change "authorised" to "authorized", or quote the regulation explicitly.
7. **`src/content/protocols/ucp/index.mdx`, acronyms.**
   - Expand JWS (JSON Web Signature) and JCS (JSON Canonicalization Scheme) at line 198 or in earlier prose.
   - Expand PAN (primary account number) and FIDO (FIDO Alliance).
   - Expand AP2 at its first use on line 131 ("the AP2 extension").
   - Expand SD-JWT at its first use on line 199, or move the expansion from 373.

**Advisory (no change required):**
- **A1.** The timeline row 2026-01-11 "release v2026-01-11" could note that the tag and GitHub release were created 2026-01-23.
- **A2.** index.mdx:309 says the 16 Tech Council members are "elected by the council every 6 months". GOVERNANCE.md also defines permanent founding seats, and MAINTAINERS.md lists 17 Shopping names. Consider "16 seats, some permanent".

## Blocked or unreachable sources

None. Every external source loaded on the first try. GitHub sources were read at their pinned commits through the local clone and `gh api`.
