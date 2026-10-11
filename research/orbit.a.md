# Orbit research, part a: agent communication, agent identity, wallet permissions

Generated 2026-10-10. All "accessed" dates are 2026-10-10 unless stated. Vendor repositories were read from `research/vendor/` (x402 at commit f8f8330, UCP at ad9950b, AP2 at e1ea56d, ERCs at b1f2bd8, acp at 7fdd78d, mpp-specs at 50309c8, a2a-x402 at 125db55, visa-trusted-agent-protocol at 16d59bd, erc-8004-contracts at b9e466c, erc-8004-best-practices at 8a99b86, verifiable-intent at 356c296). GitHub metadata comes from the authenticated `gh api` CLI on 2026-10-10. Items marked with a star get a mini page.

Relation types used: embeds, uses-as-rail, complements, compatible-with, competes-with, same-steward, lineage. The relation is stated from the orbit item toward the protocol; the note says who embeds whom.

---

## ★ MCP (Model Context Protocol)

- **id:** `mcp`
- **Category:** agent-communication
- **What it is:** An open JSON-RPC protocol that lets LLM applications connect to servers that expose tools, resources and prompts.
- **Steward:** Agentic AI Foundation (AAIF), a Linux Foundation directed fund formed 2025-12-09 with Anthropic contributing MCP. Platinum members at formation: Amazon Web Services, Anthropic, Block, Bloomberg, Cloudflare, Google, Microsoft, OpenAI.
- **Status (as of 2026-10-10):** Live. Latest spec revision `2026-07-28` (stable release published 2026-07-28; release candidate 2026-05-29). GitHub `modelcontextprotocol/modelcontextprotocol`: 9,425 stars, last push 2026-10-11 (UTC).
- **Latest version:** 2026-07-28 (2026-07-28).
- **Primary links:**
  - https://modelcontextprotocol.io/specification/2026-07-28 (spec)
  - https://modelcontextprotocol.io/specification/2026-07-28/changelog (key changes)
  - https://github.com/modelcontextprotocol/modelcontextprotocol (repo, tags 2024-10-07 through 2026-07-28)
  - https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation (governance)

**Description.** MCP standardizes how an AI application (the client, usually embedded in a chat product or coding agent) talks to a server that offers capabilities: tools it can call, resources it can read and prompts it can insert. The wire format is JSON-RPC 2.0 over stdio or Streamable HTTP. Anthropic announced the protocol on 2024-11-25 and the first dated revision carries the tag 2024-11-05. On 2025-12-09 Anthropic contributed MCP to the newly formed Agentic AI Foundation under the Linux Foundation, alongside Block's goose and OpenAI's AGENTS.md.

The 2026-07-28 revision is the largest redesign so far. It removes protocol-level sessions and the `Mcp-Session-Id` header, drops the `initialize` handshake, and makes every request carry its protocol version and client capabilities in `_meta` (SEP-2575). Servers must implement `server/discover`, server-to-client change notifications move to a single `subscriptions/listen` stream, and server-initiated requests are replaced by the Multi Round-Trip Requests pattern with a required `resultType` field (SEP-2322). Tasks leave the core and become the `io.modelcontextprotocol/tasks` extension. Roots, Sampling and Logging are deprecated under a new twelve-month lifecycle policy, and Dynamic Client Registration gives way to Client ID Metadata Documents.

For agentic payments MCP is the plumbing that other rails ride on: x402 and Stripe's MPP both define MCP transports, OpenAI's ACP added an MCP binding in its 2026-04-17 release, UCP specifies Streamable HTTP as its MCP transport and signs those requests with RFC 9421, and ERC-8004 registration files list MCP endpoints as a service type.

**Status history.**
- 2024-11-25: Anthropic announces MCP (early adopters Block and Apollo named).
- 2024-11-05: first dated spec revision (tag `2024-11-05`; `2024-11-05-final` retagged 2025-03-26).
- 2025-03-26: revision adds Streamable HTTP; HTTP+SSE transport deprecated from this revision.
- 2025-06-18: revision released.
- 2025-11-25: revision released (RC 2025-11-15).
- 2025-12-09: MCP joins the Agentic AI Foundation (Linux Foundation).
- 2026-05-29: `2026-07-28-RC` published.
- 2026-07-28: stable `2026-07-28` revision; stateless protocol.

**Relations to the eight.**
- x402: complements. x402 defines an MCP transport in `specs/transports-v1/mcp.md` and `specs/transports-v2/mcp.md` (tool result with `isError: true` carrying `PaymentRequired`; retry with `_meta["x402/payment"]`; settlement in `_meta["x402/payment-response"]`) and ships `@x402/mcp` plus Python and Go MCP packages.
- stripe-mpp: complements. `mpp-specs/specs/extensions/transports/draft-payment-transport-mcp-00.md` defines a JSON-RPC and MCP transport for the Payment authentication scheme, with capability advertisement and nested `_meta` placement per MCP.
- openai-acp: complements. The 2026-04-17 ACP release added an MCP transport binding (SEP #135): `spec/2026-04-17/openrpc/openrpc.agentic_checkout.json` defines five MCP tools mapping 1:1 to the REST checkout operations, with auth handled at the MCP server level.
- ucp: complements. UCP lists MCP as a transport (OpenRPC schema), specifies Streamable HTTP rather than SSE, and applies the same RFC 9421 signature rules to MCP POST requests (`docs/specification/signatures.md`, "MCP Transport").
- erc-8004: compatible-with. The registration file's `services` list accepts an `MCP` entry with endpoint and version; feedback entries may carry `mcp: { tool | prompt | resource }`.
- ap2: compatible-with. AP2 samples run merchant, processor and credentials provider agents as MCP servers; the FAQ says an SDK and MCP server are in progress.
- visa-tap: compatible-with. Visa publishes an MCP server and client packages (`visa-mcp` repo: `@visa/mcp-client`, `@visa/token-manager`) for VIC and VDP APIs; TAP itself does not depend on MCP.
- mastercard-agent-pay: compatible-with. Mastercard ships the Developers MCP server (`@mastercard/developers-mcp`) and plugins; the toolkit repo does not cover Agent Pay specifics.

**Sources (5+).** modelcontextprotocol.io spec 2026-07-28; changelog 2026-07-28 (read from `docs/specification/2026-07-28/changelog.mdx`); GitHub releases and tags (gh api); Linux Foundation AAIF press release 2025-12-09; Anthropic announcement 2024-11-25; aaif.io/projects; x402 `specs/transports-v2/mcp.md`; mpp-specs `draft-payment-transport-mcp-00.md`; acp `changelog/2026-04-17.md`; ucp `docs/specification/signatures.md`.

---

## ★ A2A (Agent2Agent)

- **id:** `a2a`
- **Category:** agent-communication
- **What it is:** An open protocol for agents to discover each other through Agent Cards and delegate tasks over JSON-RPC, gRPC or HTTP bindings.
- **Steward:** Agentic AI Foundation (hosted project since 2026-08-17); Linux Foundation project since 2025-06-23; created by Google (announced 2025-04-09).
- **Status (as of 2026-10-10):** Live. v1.0.0 released 2026-03-12; v1.0.1 released 2026-05-28. GitHub `a2aproject/A2A`: 26,102 stars, Apache-2.0, last push 2026-10-08.
- **Latest version:** v1.0.1 (2026-05-28).
- **Primary links:**
  - https://a2a-protocol.org/latest/specification/ (spec)
  - https://github.com/a2aproject/A2A/releases/tag/v1.0.0 (v1.0.0 notes)
  - https://aaif.io/blog/a2a-joins-aaif (governance move, 2026-08-17)
  - https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents (2025-06-23)

**Description.** A2A gives an agent a published Agent Card (JSON) describing its skills, endpoints and security schemes, and a task model (messages, artifacts, task states such as `input-required`) that a client agent drives across a network boundary. Google announced it on 2025-04-09 with roughly fifty partners, moved it to the Linux Foundation on 2025-06-23, and on 2026-08-17 the project became a hosted project of the Agentic AI Foundation next to MCP, so both layers of the agent stack now share one neutral home.

Version 0.3.0 (2025-07-30) added the `signatures` field to the Agent Card (JWS per RFC 7515), moved the well-known card to `agent-card.json` and added the extended card method. Version 1.0.0 (2026-03-12) was a breaking release: the specification was refactored to separate the application protocol from its transport mappings, OAuth flows were modernized (implicit and password removed, device code and PKCE added), `tasks/list` arrived with filtering and pagination, gRPC gained native multi-tenancy, and many field names were normalized. Version 1.0.1 (2026-05-28) prefers `application/a2a+json` in the HTTP binding and fixes task status values.

In the payments orbit A2A is a transport and a container for extensions: AP2 describes itself as an extension for A2A and its samples run A2A agents; the `a2a-x402` repository defines the x402 Payments Extension v0.1 (extension URI `https://github.com/google-a2a/a2a-x402/v0.1`) and x402 v2 carries a matching `transports-v2/a2a.md`; UCP's checkout capability has an A2A binding; ERC-8004 registration files advertise A2A agent cards and feedback can reference A2A skills, `contextId` and `taskId`.

**Status history.**
- 2025-04-09: Google announces A2A.
- 2025-06-23: Linux Foundation launches the A2A project (Google Cloud, SAP, ServiceNow, Outshift by Cisco named as founding contributors or partners).
- 2025-07-30: v0.3.0 adds Agent Card `signatures` and `agent-card.json`.
- 2026-03-12: v1.0.0 (breaking release).
- 2026-05-28: v1.0.1.
- 2026-08-17: A2A becomes an AAIF hosted project.

**Relations to the eight.**
- ap2: complements. AP2 docs call it an open extension for A2A (and MCP, UCP); the Python and Go samples run merchant, credentials provider and processor agents over A2A.
- x402: complements. `a2a-x402` spec v0.1 (`payment-required`, `payment-submitted`, `payment-completed`, declared in `AgentCard.capabilities.extensions`) and x402 `specs/transports-v2/a2a.md` (task state `input-required` with `x402.payment.status` metadata).
- ucp: complements. `docs/specification/shopping/checkout/a2a.md` defines the A2A binding; businesses using A2A publish an agent card endpoint.
- erc-8004: compatible-with. Registration file service `A2A` points to an agent card; feedback may carry `a2a.skills`, `contextId`, `taskId`.
- openai-acp, stripe-mpp, visa-tap, mastercard-agent-pay: no direct binding found in the cloned specs.

**Seed note.** The seed attributes signed agent cards to v1.0; the signature field predates v1.0 (added in v0.3.0, 2025-07-30) and is retained in v1.0 as `AgentCardSignature`.

**Sources (5+).** a2a-protocol.org spec; GitHub releases v0.3.0, v1.0.0, v1.0.1 (gh api); `docs/specification.md` at tags v0.3.0 and v1.0.0; Google Developers Blog 2025-04-09; Linux Foundation press release 2025-06-23; aaif.io blog 2026-08-17; Axios 2026-08-17 (secondary); a2a-x402 `spec/v0.1/spec.md`; x402 `specs/transports-v2/a2a.md`; ucp checkout A2A binding; erc-8004-contracts `ERC8004SPEC.md`.

---

## AGNTCY and OASF

- **id:** `agntcy-oasf`
- **Category:** agent-communication
- **What it is:** A Linux Foundation project (started by Cisco's Outshift in March 2025) for agent discovery, identity, messaging and observability, whose Open Agentic Schema Framework (OASF) defines machine-readable agent records.
- **Steward:** Linux Foundation; formative members Cisco, Dell Technologies, Google Cloud, Oracle and Red Hat (press release dated 2025-07-29).
- **Status (as of 2026-10-10):** Live open source. OASF v1.1.0 released 2026-07-10 (`agntcy/oasf`, 339 stars); Agent Directory `agntcy/dir` v1.7.1 released 2026-09-22 (195 stars).
- **Latest version:** OASF v1.1.0 (2026-07-10).
- **Primary links:**
  - https://www.linuxfoundation.org/press/linux-foundation-welcomes-the-agntcy-project-to-standardize-open-multi-agent-system-infrastructure-and-break-down-ai-agent-silos
  - https://github.com/agntcy/oasf
  - https://github.com/agntcy/dir
  - https://schema.oasf.outshift.com
- **Relations:** erc-8004 compatible-with. The ERC-8004 registration file example lists an `OASF` service with `version: "0.8"` linking to `github.com/agntcy/oasf/tree/v0.8.0`, and feedback entries may carry `oasf.skills` and `oasf.domains`; the ERC-8004 best-practices guide recommends OASF taxonomies. The Linux Foundation release states AGNTCY directories can discover A2A agents and MCP servers.
- **Seed audit:** "Linux Foundation, Cisco-led" confirmed; "OASF appears in ERC-8004 services" confirmed.

---

## ANP (Agent Network Protocol)

- **id:** `anp`
- **Category:** agent-communication
- **What it is:** An open-source protocol suite for agent identity (DID based, `did:wba`), discovery, meta-protocol negotiation and secure messaging that aims to be the HTTP of the agentic web.
- **Steward:** Agent Network Protocol open-source community (lead Gaowei Chang); standards track through the W3C AI Agent Protocol Community Group (proposed 2025-05-08; chairs Gaowei Chang and Song XU; 277 participants on 2026-10-10).
- **Status (as of 2026-10-10):** Draft. W3C CG draft white paper 2025-05-23; use case and protocol drafts dated 2025-08-19; arXiv technical white paper 2508.00007 (2025-07-18). GitHub `agent-network-protocol/AgentNetworkProtocol`: 1,444 stars, Apache-2.0, last push 2026-10-09.
- **Primary links:**
  - https://github.com/agent-network-protocol/AgentNetworkProtocol
  - https://www.w3.org/community/agentprotocol/
  - https://w3c-cg.github.io/ai-agent-protocol/
  - https://arxiv.org/abs/2508.00007
- **Relations:** none of the eight reference ANP in their specs. ANP relies on W3C DIDs (see the W3C VC and DID cluster).
- **Seed audit:** "W3C Community Group work" confirmed, with the precise group name: AI Agent Protocol Community Group.

---

## AGENTS.md

- **id:** `agents-md`
- **Category:** agent-communication
- **What it is:** A simple open Markdown file format that gives coding agents project instructions and context.
- **Steward:** Agentic AI Foundation (contributed by OpenAI at AAIF formation, 2025-12-09). Repo `agentsmd/agents.md` (MIT, 24,864 stars, last push 2026-09-10 renaming its Technical Charter PDF).
- **Status (as of 2026-10-10):** Live convention; no numbered versions.
- **Primary links:** https://agents.md ; https://github.com/agentsmd/agents.md ; https://aaif.io/projects ; Linux Foundation AAIF press release.
- **Relations:** stripe-mpp compatible-with (the `mpp` and `mppx` repositories ship `AGENTS.md` files); ucp compatible-with (the `ucp` repository ships `AGENTS.md`). No protocol semantics involved.
- **Seed audit:** "AAIF project" confirmed.

---

## goose

- **id:** `goose`
- **Category:** agent-communication
- **What it is:** An open-source, extensible AI agent (desktop and CLI) from Block that uses MCP servers as extensions.
- **Steward:** Agentic AI Foundation (contributed by Block at formation). Repository now lives at `aaif-goose/goose` (the `block/goose` URL redirects); Apache-2.0; 55,141 stars.
- **Status (as of 2026-10-10):** Live. v1.54.0 released 2026-10-08.
- **Latest version:** v1.54.0 (2026-10-08).
- **Primary links:** https://github.com/aaif-goose/goose ; https://goose-docs.ai ; https://aaif.io/projects .
- **Relations:** none of the eight reference goose; as an MCP client it can consume x402 or MPP MCP servers, which was not verified here.
- **Seed audit:** "AAIF project" confirmed.

---

## OpenAI Apps SDK (ChatGPT apps and plugins)

- **id:** `openai-apps-sdk`
- **Category:** agent-communication
- **What it is:** OpenAI's MCP-based framework for building apps that render inside ChatGPT, now documented as "plugins" (skills, MCP servers and optional UI), including checkout from the app UI.
- **Steward:** OpenAI.
- **Status (as of 2026-10-10):** Live with beta parts. Example repo `openai/openai-apps-sdk-examples` created 2025-10-06. The `developers.openai.com/apps-sdk` path now serves the Plugins documentation; no rename notice was found. Monetization page: external checkout is generally available (physical goods), saved payment methods inside ChatGPT, and a ChatGPT payment sheet in private beta (`window.openai.requestCheckout`, token delivered to the developer's MCP server through a `complete_checkout` tool call, charged by the merchant's PSP: Adyen, Checkout.com, Fiserv, PayPal, Stripe, Worldpay). Raw payment methods require the Agentic Commerce Protocol Delegate Payment endpoint and PCI DSS Level 1. The product checkout conversion spec is in beta for approved partners (`checkout_session` tool, `ui://widget/checkout-session.html`).
- **Buying since March 2026:** Digital Commerce 360 (2026-03-06) quotes an OpenAI spokesperson: Instant Checkout is moving to Apps, with ACP continuing as infrastructure across the shopping journey. OpenAI's own announcement pages returned HTTP 403 to this run.
- **Primary links:**
  - https://developers.openai.com/plugins (index; same content served at /apps-sdk)
  - https://developers.openai.com/plugins/build/monetization
  - https://developers.openai.com/plugins/guides/product-checkout-conversion-spec
  - https://github.com/openai/openai-apps-sdk-examples
- **Relations:** openai-acp complements (the plugin checkout session aligns with the commerce checkout session shape; the Delegate Payment endpoint of ACP is used for raw payment methods; the ACP README points merchants to OpenAI's implementation for ChatGPT). Built on MCP.
- **Seed audit:** "how buying works in ChatGPT since March 2026" confirmed as reported (OpenAI statement via Digital Commerce 360, 2026-03-06; openai.com blocked).

---
