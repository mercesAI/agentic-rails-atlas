# Orbit research, part b: machine payments, card and commerce programs, legal and policy, ERC-3643 and ERC-8226

Generated 2026-10-11. All "accessed" dates are 2026-10-11 unless a source record says otherwise. This file covers the Section 6 groups "Machine payments and money", "Card, wallet and commerce programs" and "Legal and policy events", plus two agent-identity items: ERC-3643 with ONCHAINID (starred, from ATLAS_FOLLOWUP.md Section 3.4 and Appendix C) and ERC-8226. Facts already verified in `research/protocols/*.md` were reused with their source ids; their source records are copied into `orbit.b.sources.json`. GitHub metadata comes from the authenticated `gh api` CLI on 2026-10-11. Items marked with a star get a mini page.

Relation types used: embeds, uses-as-rail, complements, compatible-with, competes-with, same-steward, lineage. The relation is stated from the orbit item toward the protocol; the note says who uses whom. Only relations that a source supports are listed; where none exists the item says so.

---

## ★ ERC-3643 and ONCHAINID

- **id:** `erc-3643`
- **Category:** agent-identity
- **What it is:** A Final Ethereum token standard for permissioned (regulated) tokens whose holders must have an ONCHAINID identity contract carrying claims signed by trusted issuers.
- **Steward:** ERC3643 Association (ERC3643 ASBL, Luxembourg); reference implementation in the `ERC-3643` GitHub organization, originally built by Tokeny Solutions as T-REX. ONCHAINID is maintained in the `onchain-id` GitHub organization.
- **Status (as of 2026-10-11):** Live (Final ERC). ERC-3643 is Final, Standards Track, created 2021-07-09. Reference implementation `ERC-3643/ERC-3643` (GPL-3.0, not archived, last push 2026-08-28). The original `TokenySolutions/T-REX` repository is archived (last push 2025-10-28). ERC-734 and ERC-735, which ONCHAINID implements, were never merged as EIP files.
- **Latest version:** two answers, shown together. `4.1.6` is the highest stable release (published 2024-10-18 in the archived T-REX repository). The ERC-3643 organization repository marks `4.1.3` as "latest" (release published 2025-06-12) with `4.2.0-beta1` as a pre-release.
- **Primary links:**
  - https://eips.ethereum.org/EIPS/eip-3643 (spec)
  - https://github.com/ERC-3643/ERC-3643 (reference implementation)
  - https://github.com/onchain-id/solidity (ONCHAINID contracts)
  - https://github.com/ethereum/EIPs/issues/735 (ERC-735 Claim Holder, a closed GitHub issue, not an EIP file)
  - https://www.erc3643.org/ (association)

**Description.** ERC-3643, titled "T-REX - Token for Regulated EXchanges", is an ERC-20 compatible token standard where every transfer is checked against the identity of the sender and receiver. It reached Final status after being created on 2021-07-09 by Joachim Lebrun, Tony Malghem, Kevin Thizy, Luc Falempin and Adam Boudjemaa, and it requires EIP-20 and EIP-173. A token is wired to an Identity Registry that maps each wallet to an ONCHAINID identity contract and a country code; `isVerified(address)` passes only when that identity holds the claim topics listed in the Claim Topics Registry, signed by issuers listed in the Trusted Issuers Registry. A Compliance contract answers `canTransfer(_from, _to, _amount)` on each transfer, so offering rules (investor caps, country limits and similar modules) sit beside the identity check. In ERC-3643 the word "Agent" names an operator role that the token owner appoints to register identities, mint, burn and freeze.

ONCHAINID is the identity half. Its `Identity.sol` contract descends from the ERC-734 Key Manager and ERC-735 Claim Holder proposals, which exist only as closed GitHub issues 734 and 735 in `ethereum/EIPs` (opened in October 2017 by Fabian Vogelsteller; 734 points to the LSP6 Key Manager, 735 carries the status "Discussion"); the URL `eips.ethereum.org/EIPS/eip-734` returned HTTP 404 on 2026-10-11, and ERC-725 is still Draft. In `Identity.sol`, keys have purposes (1 MANAGEMENT, 2 ACTION, 3 CLAIM signer, 4 ENCRYPTION) and types (1 ECDSA, 2 RSA). Only purpose-3 keys may call `addClaim`. A claim has `topic`, `scheme`, `issuer`, `signature`, `data` and `uri`; the issuer signs the hash of the identity address, topic and data, and a verifier checks a third-party claim through the issuer contract's `isClaimValid`, which lets the issuer side revoke it.

Compared with ERC-8004 the two standards answer different questions. ERC-3643 asks "may this wallet hold or receive this regulated token?" and answers with issuer-attested, revocable claims checked on every transfer. ERC-8004 asks "who is this agent, where are its services, and what do others say about it?" and answers with a permissionless ERC-721 registration, an off-chain registration file and open feedback. Neither covers the other's job: ERC-3643 has no notion of an agent as a service, endpoint or feedback subject, and ERC-8004 has no issuer-attested compliance and no mandate or delegation model.

| Dimension | ERC-3643 plus ONCHAINID | ERC-8004 |
|---|---|---|
| Status | Final ERC (created 2021-07-09); stewarded by the ERC3643 Association | Draft ERC (created 2025-08-13); community effort |
| Access model | Permissioned: the holder must be in the Identity Registry and pass `isVerified`, which needs the required claim topics from trusted issuers | Permissionless: any address calls `register()` and receives an ERC-721 agent id |
| Trust signal | Issuer-signed claims on the holder's ONCHAINID, checked through `isClaimValid`, revocable by the issuer side | Open feedback from any address except owner and operators; validator responses 0 to 100 in a Validation Registry that is specified but not officially deployed |
| Scope | Transfer compliance for one token | Discovery and trust registry for agents and their services |
| Who writes | Token agents register identities; CLAIM keys add claims; MANAGEMENT keys manage keys; the token owner manages issuers and topics | Owner or operator writes URI and metadata; any third party writes feedback; a named validator responds |
| Upgradeability | T-REX contracts behind proxies that point to `TREXImplementationAuthority`; ONCHAINID identities can be proxies | UUPS proxies at CREATE2 addresses; one EOA holds the upgrade right on Ethereum and Base as of 2026-10-11 |
| Data location | Claims on-chain in the identity contract; `data` may be a hash and `uri` may point off-chain | Registration file off-chain (IPFS, HTTPS) or a data URI; feedback value and tags on-chain; detail files off-chain |
| Missing | No agent, service endpoint or feedback concept | No issuer-attested compliance and no mandate model |

If you come from T-REX: a `ClaimIssuer` you trust plays the part of the trusted reviewer list you pass to ERC-8004's `getSummary`; claim topics map loosely to ERC-8004 feedback tags (both are labels a reader filters on, but tags are free text written by anyone); and the ERC-8004 "Identity Registry" shares a name with the T-REX Identity Registry but is a different thing, an ERC-721 directory of agents rather than an allowlist that maps wallets to identities. The T-REX "Agent" role (an operator appointed by the token owner) is also unrelated to an ERC-8004 agent (the AI service itself).

The only standard found that joins the two worlds is ERC-8226 "Regulated Agent Mandate" (Draft, 2026-04-12, see the next item), which treats ERC-3643 or ERC-7943 as the token-compliance layer and ERC-8004 as the agent-identity layer. No ERC3643 Association or Tokeny statement about AI agents or ERC-8004 was found in the pages searched on 2026-10-11 (absence of evidence only).

**Status history.**
- 2017-10-02: ERC-734 Key Manager header date (GitHub issue 734; issue opened 2017-10-09 per its record).
- 2017-10-09: ERC-735 Claim Holder proposed as GitHub issue 735.
- 2021-07-09: ERC-3643 created.
- 2024-10-18: T-REX `4.1.6` stable release published.
- 2025-01-16: T-REX `4.2.0-beta2` pre-release.
- 2025-02-05: T-REX `4.1.7-beta1` pre-release.
- 2025-06-12: ERC-3643 organization repository publishes `4.1.3` (marked latest) and `4.2.0-beta1`.
- 2025-10-28: last push to `TokenySolutions/T-REX` before archiving (archive date itself not exposed by the API).
- 2026-04-12: ERC-8226 created, naming ERC-3643 as a token-compliance layer for agents.
- 2026-08-28: last push to `ERC-3643/ERC-3643` as of 2026-10-11.

**Relations to the eight.**
- erc-8004: complements. Different layers (token compliance versus agent identity and reputation); ERC-8226 composes them, naming ERC-3643 for asset eligibility and ERC-8004 for agent identity. Neither spec references the other.
- ap2: no documented relation. ERC-8226, not ERC-3643, is the on-chain analogue of an AP2 mandate.
- Other six: no documented relation.

**Sources.** src-erc-3643-spec; src-erc-3643-repo; src-trex-repo; src-onchainid-identity; src-onchainid-structs; src-eip-issue-734; src-eip-issue-735; src-eip-725; src-erc3643-association; src-erc-8226; src-erc-8004-spec.

---

## ERC-8226 Regulated Agent Mandate

- **id:** `erc-8226`
- **Category:** agent-identity
- **What it is:** A Draft ERC (RAMS) that lets a KYC-verified principal give an on-chain agent scoped, time-bounded and capped authority over a regulated token, checked by the token at execution time.
- **Steward:** Authors Ludovico Rossi, Dario Lo Buglio, Thamer Dridi and Nabil El Alami Khalifi (all brickken.com addresses); Ethereum ERC process.
- **Status (as of 2026-10-11):** Draft. Created 2026-04-12; first merged into `ethereum/ERCs` on 2026-05-12 (PR #1679); updated 2026-06-29 (reference implementation, PR #1844), 2026-08-31 (PR #1982) and 2026-10-09 (multi-asset mandates, PR #2060). Ethereum Magicians thread opened 2026-04-12, 50 posts, last post 2026-10-09.
- **Latest version:** ERCs commit `f4df3d0` (2026-10-09); ERCs carry no version numbers.
- **Primary links:**
  - https://eips.ethereum.org/EIPS/eip-8226 (spec)
  - https://github.com/ethereum/ERCs/blob/master/ERCS/erc-8226.md (spec source and history)
  - https://ethereum-magicians.org/t/erc-8226-regulated-agent-mandate/28208 (discussion)
  - https://www.brickken.com/post/regulated-agent-mandate-standard-rams-ai-agents-tokenized-assets (author announcement)

**Card data.** RAMS splits compliance into three layers: token compliance (investor eligibility, for example ERC-7943 or ERC-3643), mandate compliance (this ERC) and agent identity (a registry such as ERC-8004). It defines two interfaces. `IComplianceProvider` (`grantPrincipal`, `revokePrincipal`, `checkPrincipal`) vouches that a principal is eligible. `IAgentMandate` stores a `Mandate` keyed by agent, principal and asset, with `validFrom`, `validUntil`, `maxTransactionValue`, `maxCumulativeValue`, `cumulativeUsed`, `revoked`, `complianceProvider`, `identityRef` and `metadata`; the principal signs the grant with EIP-712 (EIP-1271 for contract accounts). Tokens call `canExecute`, which returns a boolean and a `MandateReason` such as `OVER_TX_CAP` or `AGENT_FROZEN`, and `recordExecution` to consume the cap. Enforcers can `freezeAgent` or `freezePrincipal` but cannot revoke; only the principal revokes. The 2026-10-09 update moved from one mandate per agent and principal to one per agent, principal and asset. The spec text does not mention AP2, x402 or any card network.

**Status history.**
- 2026-04-12: ERC created; PR #1679 opened; Magicians thread opened.
- 2026-05-12: PR #1679 merged ("Add ERC: Regulated Agent Mandate"), Draft.
- 2026-06-29: reference implementation and spec refinements merged (PR #1844).
- 2026-08-31: further updates merged (PR #1982).
- 2026-10-09: multi-asset mandates merged (PR #2060).

**Relations to the eight.**
- erc-8004: complements. ERC-8226 names ERC-8004 as an example agent-identity layer that "provides agent discovery and trust signals but no mandate framework" (paraphrased) and adds the mandate layer above it.
- ap2: complements. An on-chain analogue of an AP2 mandate: both express bounded, revocable authority from a principal to an agent (AP2 as signed credentials off-chain, ERC-8226 as on-chain registry state with freeze and revocation); neither references the other.
- Other six: no documented relation.

**Sources.** src-erc-8226; src-orbit-erc-8226-prs; src-orbit-erc-8226-magicians; src-orbit-erc-8226-brickken; src-ap2-erc8226.

---

## ★ L402 and the Lightning Network

- **id:** `l402`
- **Category:** machine-payments
- **What it is:** An HTTP 402 authentication scheme from Lightning Labs in which a server returns a Lightning invoice plus a bearer token, and the client proves payment by presenting the token with the invoice preimage.
- **Steward:** Lightning Labs (`lightninglabs/L402` repository, created 2020-02-07). Proposed to the Lightning bLIP process as bLIP-0026, which is still an open pull request.
- **Status (as of 2026-10-11):** Live as a deployed protocol (Lightning Labs' Aperture proxy, release `v0.5.0` on 2026-03-25). The specification exists in two forms: the `lightninglabs/L402` master text (macaroon plus BOLT11 invoice, `macaroon=` parameter; repository last pushed 2026-06-09, 91 stars) and the bLIP-0026 draft (header status "Active", created 2023-06-06, rewritten 2026-02-25 to be token-agnostic with `token=` and `version="0"`; pull request #26 in `lightning/blips` still open and unmerged on 2026-10-11).
- **Latest version:** bLIP-0026 draft protocol version `0` (PR head rewritten 2026-02-25); repository text at commit `592203a` (2026-03-20).
- **Primary links:**
  - https://github.com/lightninglabs/L402 (Lightning Labs specification repository)
  - https://github.com/lightning/blips/pull/26 (bLIP-0026 pull request, open)
  - https://docs.lightning.engineering/the-lightning-network/l402 (Lightning Labs builder's guide)
  - https://github.com/lightninglabs/aperture (reference reverse proxy)

**Description.** L402 is an earlier HTTP 402 payment design on Lightning. A client requests a paid resource; the server answers `402 Payment Required` with a `WWW-Authenticate: L402` challenge that carries a credential and a BOLT11 Lightning invoice. The client pays the invoice, which reveals the payment preimage, and then sends `Authorization: L402 <credential>:<preimage>`. Because the credential commits to the invoice's payment hash, the server can check that the hash of the preimage matches without a database lookup. The credential is a bearer token, so it can be reused for later requests or handed to another agent or wallet. Lightning Labs' docs now describe L402 as built with a focus on agentic commerce.

The protocol began as LSAT ("Lightning Service Authentication Token"). The repository's first commit is dated 2020-02-06 and its 2020 README describes LSAT as macaroon-based authentication and paid APIs for Lightning Labs services. A documentation rewrite merged on 2023-04-20 replaced "LSAT" with "L402" throughout the specification. Both the repository and bLIP-0026 keep a backwards-compatibility rule: servers and clients should accept `LSAT` wherever `L402` appears.

The original Lightning Labs specification, and the repository text that is current today, fixes the credential as a macaroon: the challenge reads `L402 macaroon="...", invoice="..."`, and caveats on the macaroon attenuate what the token may access (target services, capabilities, constraints such as expiry). bLIP-0026, as rewritten by Olaoluwa Osuntokun on 2026-02-25, makes L402 token-format agnostic: the challenge becomes `L402 version="0", token="...", invoice="..."`, any token that commits to the preimage is allowed, and macaroons become the RECOMMENDED format rather than a requirement. Lightning Labs briefly aligned its repository with that rewrite on 2026-03-10 and reverted it on 2026-03-20, saying the header changes would be re-proposed later. Pages and quizzes should therefore say "macaroons are optional in the bLIP-0026 draft and required in the Lightning Labs repository text", with both dates.

L402 rides on the Lightning Network, Bitcoin's payment-channel network specified in the BOLT documents, so payments are in bitcoin (sats), settle in seconds and carry routing fees set by channel operators. Payment must happen over Lightning: when a reviewer on the bLIP thread raised this limit, Osuntokun replied on 2026-03-11 that a card-accepting variant might be possible but does not fit the vision being pursued. Neither spec text defines a refund or dispute process; the preimage is the proof of payment.

Several of the eight protocols now carry Lightning as a payment method without L402's token layer. The x402 `exact` scheme has an `lnbtc` binding that reuses the idea of a preimage as proof of payment but carries it in x402's own payment header with no macaroon. MPP's specs repository includes Lightning charge and session method drafts authored by Lightspark. Neither spec claims descent from L402, so the site should not call L402 "the ancestor of x402".

**Status history.**
- 2020-02-06: first commit of the LSAT specification repository (repository created 2020-02-07).
- 2020-06-03: last LSAT-era spec change (macaroon identifier version bytes).
- 2023-04-20: documentation rewrite renames LSAT to L402 in the specification.
- 2023-06-06: bLIP-0026 "L402: The Lightning HTTP 402 Protocol" created (PR #26 opened 2023-06-07).
- 2023-07-05: Aperture `v0.2-beta` release.
- 2026-02-25: bLIP-0026 rewritten: token-agnostic `token=` parameter and `version="0"`.
- 2026-03-10: Lightning Labs repository aligned with the bLIP rewrite and adds an agent-oriented spec (`agent-spec.md`).
- 2026-03-11: Lightning Labs says development will continue in its standalone L402 repository.
- 2026-03-20: repository reverts to the pre-bLIP `macaroon=` header format; agent spec kept.
- 2026-03-25: Aperture `v0.5.0` release.

**Relations to the eight.**
- x402: competes-with. Both are HTTP 402 payment schemes for APIs and agents; x402's `exact` scheme on `lnbtc` reuses L402's preimage-as-proof idea without a macaroon. No source states that L402 is x402's ancestor.
- stripe-mpp: competes-with. MPP also uses the HTTP 402 challenge pattern, and its specs repository defines Lightning charge and session methods (Lightspark authors) that do not use L402 tokens.
- Other six: no documented relation.

**Sources.** src-x402-l402-repo; src-orbit-l402-repo-history; src-orbit-l402-blip-pr; src-orbit-l402-blip-head; src-x402-blip-0026; src-orbit-l402-docs; src-orbit-l402-aperture; src-x402-scheme-exact-lnbtc; src-orbit-l402-mpp-lightning.

---

## Interledger Open Payments and Web Monetization

- **id:** `interledger`
- **Category:** machine-payments
- **What it is:** Open Payments is an Interledger Foundation REST API standard (with GNAP authorization) that lets clients request and send payments between accounts on any Open Payments-enabled wallet; Web Monetization is a browser-side draft that streams payments from a visitor's wallet to a page's wallet address.
- **Steward:** Interledger Foundation. Web Monetization is incubated in the W3C Web Platform Incubator Community Group (WICG).
- **Status (as of 2026-10-11):** Live (Open Payments API and SDKs; Rafiki reference implementation). Web Monetization is a Draft Community Group Report (respec `publishDate` 2026-09-15), not a W3C standard. No official AI-agent program found: the interledger.org blog index and the openpayments.dev home page contained no agent announcement when fetched on 2026-10-11; a community forum post on using Open Payments as an x402 settlement rail is an individual's research, not a Foundation program.
- **Latest version:** npm `@interledger/open-payments` 7.4.0 (2026-03-11); Web Monetization draft 2026-09-15.
- **Primary links:**
  - https://openpayments.dev/ (Open Payments docs)
  - https://github.com/interledger/open-payments (spec and SDK; Apache-2.0, 549 stars, pushed 2026-10-09)
  - https://webmonetization.org/specification/ (Web Monetization draft)
  - https://github.com/interledger/rafiki (reference implementation)

**Status history.**
- 2018-09-07: `WICG/webmonetization` repository created.
- 2019-09-13: `interledger/open-payments` repository created.
- 2023-03-22: `@interledger/open-payments` 1.0.0 published on npm.
- 2026-03-11: `@interledger/open-payments` 7.4.0 published.
- 2026-09-15: Web Monetization draft republished (Interledger Foundation editors).

**Relations to the eight.**
- x402: no documented relation in either spec. A community post explores Open Payments as an x402 settlement rail (individual research, reported only).
- Other seven: no documented relation.

**Sources.** src-orbit-interledger-op-repo; src-orbit-interledger-op-npm; src-orbit-interledger-wm-spec; src-orbit-interledger-blog; src-orbit-interledger-community-x402.

---

## Circle: Nanopayments, Agent Stack and Arc

- **id:** `circle`
- **Category:** machine-payments
- **What it is:** The USDC and EURC issuer, whose agent-facing products are Nanopayments through Circle Gateway (sub-cent USDC payments inside the x402 flow), the Circle Agent Stack and the Arc Layer 1 chain that charges fees in USDC.
- **Steward:** Circle Internet Group (company).
- **Status (as of 2026-10-11):** Live. Nanopayments on mainnet since 2026-04-29; Circle Agent Stack launched in May 2026 (month only, per Circle); Arc public mainnet since 2026-09-16 with a permissioned founding validator cohort (developers deploy without approval). Circle's Arc release says Arc has not been reviewed or approved by the New York State Department of Financial Services or any other regulator.
- **Latest version:** Arc public mainnet (2026-09-16).
- **Primary links:**
  - https://www.circle.com/blog/nanopayments-powered-by-circle-gateway-is-now-live-on-mainnet (Nanopayments mainnet)
  - https://developers.circle.com/gateway/nanopayments (Nanopayments docs)
  - https://www.circle.com/pressroom/circle-launches-arc-mainnet-an-economic-operating-system-for-the-internet (Arc mainnet)
  - https://www.circle.com/pressroom/circle-announces-founding-validator-cohort-and-major-integrations-for-arc-ahead-of-september-16-mainnet-launch (validators, 2026-08-05)

**Card data.** Nanopayments let a buyer sign EIP-3009 authorizations off-chain at zero gas for amounts from $0.000001 USDC; Gateway batches them and settles in bulk across 11 chains. Circle publishes no fee schedule for it on the docs page. The Arc release (2026-09-16) describes Arc as EVM-compatible with USDC gas, sub-second finality and opt-in privacy still in development, names founding validators including BlackRock, DTCC, Mastercard and Visa, and says the Agent Stack gives developers policy-controlled Agent Wallets plus Nanopayments. It also claims that USDC accounts for 98.8% of agent-driven transaction volume (Circle's own figure, method and date range not given; show as a vendor claim with as-of 2026-09-16). Secondary reports note a ten-billion ARC genesis mint with no public token offering decided (reported).

**Status history.**
- 2026-04-29: Nanopayments powered by Circle Gateway live on mainnet.
- 2026-05: Circle Agent Stack launched (month per Circle's 2026-09-16 release).
- 2026-08-05: Circle names the Arc founding validator cohort and sets 2026-09-16 for mainnet.
- 2026-09-16: Arc public mainnet.

**Relations to the eight.**
- x402: complements. Nanopayments run inside the x402 flow with EIP-3009 authorizations; Circle reports Agent Stack payments over the x402 standard settle in USDC.
- stripe-mpp: no documented relation found in Circle's Arc and Nanopayments pages (the Arc release does not mention MPP or Tempo).
- visa-tap, mastercard-agent-pay: no protocol relation; Visa and Mastercard are named Arc founding validators (corporate, not protocol).
- Other four: no documented relation.

**Sources.** src-x402-circle-nanopayments; src-x402-fee-circle; src-orbit-circle-arc-mainnet; src-orbit-circle-arc-validators; src-orbit-circle-arc-theblock.

---

## Coinbase: Payments MCP, Agentic Wallets and Base MCP

- **id:** `coinbase-agent-products`
- **Category:** machine-payments
- **What it is:** Coinbase Developer Platform products that give AI agents wallets and payment tools built around x402: Payments MCP (a local MCP server with wallet, onramp and x402 payments), Agentic Wallets (TEE-secured agent wallets with spending controls) and Base MCP (a Base Account connector for chat agents).
- **Steward:** Coinbase (Coinbase Developer Platform; Base).
- **Status (as of 2026-10-11):** Live. Payments MCP launched 2025-10-23 (repository `coinbase/payments-mcp` last pushed 2025-10-22, npm `@coinbase/payments-mcp` 1.0.5); Agentic Wallets launched 2026-02-11 (CLI `awal`; Base, Base Sepolia, Solana and Polygon listed in the quickstart); Base MCP launched 2026-05-26 (date from Fortune; reported).
- **Latest version:** Base MCP (2026-05-26, reported).
- **Primary links:**
  - https://www.coinbase.com/developer-platform/discover/launches/payments-mcp (Payments MCP launch)
  - https://www.coinbase.com/developer-platform/discover/launches/agentic-wallets (Agentic Wallets launch)
  - https://docs.cdp.coinbase.com/agentic-wallet/cli/quickstart (Agentic Wallet CLI docs)
  - https://github.com/coinbase/payments-mcp (repository)

**Card data.** Payments MCP runs on the user's desktop and was tested by Coinbase with Claude Desktop, Claude Code, Codex, Gemini and Cherry Studio; it lets an agent create a wallet, fund it through an onramp and pay x402 services, with a Bazaar explorer for discovery. Agentic Wallets keep keys in Trusted Execution Environments, expose skills (authenticate, fund, send, trade, earn), and apply session caps, per-transaction limits and KYT screening; Coinbase frames x402 as the payment protocol. Base MCP, per Fortune, lets Claude or ChatGPT propose transfers and swaps that the user confirms in the Base wallet, without the agent holding keys (OAuth 2.1 sign-in). Coinbase also originated x402 itself (see the x402 page) and runs the facilitator that settles Cloudflare's Monetization Gateway payments.

**Status history.**
- 2025-10-23: Payments MCP launch post (The Block dates its story 2025-10-22).
- 2026-02-11: Agentic Wallets launch post.
- 2026-05-26: Base MCP launch (reported).

**Relations to the eight.**
- x402: same-steward. Coinbase started x402 and these products pay through it; x402 governance moved to the x402 Foundation (Linux Foundation, operational launch 2026-07-14), so the relation is to the originator rather than the current steward.
- Other seven: no documented relation.

**Sources.** src-orbit-coinbase-payments-mcp; src-orbit-coinbase-payments-mcp-repo; src-orbit-coinbase-agentic-wallets; src-orbit-coinbase-awal-docs; src-x402-agentic-wallets-coverage; src-orbit-coinbase-base-mcp-fortune.

---

## Cloudflare: Monetization Gateway, Wallets, NET Dollar and Radar data

- **id:** `cloudflare-agent-payments`
- **Category:** machine-payments
- **What it is:** Cloudflare's agent payment products: the Monetization Gateway (pay-per-crawl generalized to any resource, settling x402 payments), Cloudflare Wallets (stablecoin wallets for accounts and their agents), and the announced NET Dollar stablecoin; plus the Radar dataset that reports AI crawler traffic.
- **Steward:** Cloudflare (company). Cloudflare co-founded the x402 Foundation with Coinbase (announced 2025-09-23).
- **Status (as of 2026-10-11):**
  - Monetization Gateway: closed beta since 2026-09-30, limited to eligible US-based sellers and buyers; settles USDC on Base through Coinbase's x402 facilitator.
  - `cloudflare:402`: a separate, credit-backed `batch-settlement` network in the x402 spec, with RFC 9421 signatures and Cloudflare as Merchant of Record, described for pay-per-crawl. It is not the settlement path of the Monetization Gateway beta.
  - Cloudflare Wallets: announced 2026-08-04; only handle reservation at cloudflare.pay is open; full access (onramp, offramp, Virtual Wallets for agents) is promised "in the coming months"; first version will send, receive and hold stablecoins only.
  - NET Dollar: announced 2025-09-25 as a planned US dollar-backed stablecoin; no launch found as of 2026-10-11 (launch unverified).
  - Radar: the Radar API requires an API token (Custom Token with Account > Radar > Read) and its data is published under CC BY-NC 4.0, per Cloudflare's docs.
- **Latest version:** Monetization Gateway closed beta (2026-09-30).
- **Primary links:**
  - https://blog.cloudflare.com/monetization-gateway-beta/ (Monetization Gateway beta)
  - https://blog.cloudflare.com/wallets/ (Wallets announcement)
  - https://developers.cloudflare.com/wallets/ (Wallets docs)
  - https://www.cloudflare.com/press/press-releases/2025/cloudflare-introduces-net-dollar-to-support-a-new-business-model-for-the-ai-driven-internet/ (NET Dollar)
  - https://developers.cloudflare.com/radar/ (Radar docs and data license)

**Card data.** Cloudflare Wallets have two types: Account Wallets for human account owners and Virtual Wallets that agents use through API keys, with owner-set guardrails (allowance, allow list, maximum transaction size); agents may optionally identify themselves as delegates of the account. The NET Dollar release says Cloudflare contributes to AP2 and x402 and leaves the timing of beta and general availability open. Cloudflare's AI Gateway accepts a `PAYMENT-METHOD: x402` header for paid inference. Cloudflare also verifies Visa TAP and Mastercard Agent Pay signatures at its edge (blog 2025-10-24) and, since 2026-07-01, lists signed agents as a category of Verified Bots; those identity items are covered in `orbit.a.md`.

**Status history.**
- 2025-09-23: Cloudflare and Coinbase announce the x402 Foundation; Cloudflare proposes a deferred scheme (later `batch-settlement`).
- 2025-09-25: NET Dollar announced.
- 2025-10-24: Cloudflare blog on verifying Visa and Mastercard agent signatures.
- 2026-04-15: x402 PR #1145 merges `batch-settlement` with the `cloudflare:402` binding.
- 2026-08-04: Cloudflare Wallets announced (Agents Week); handle reservation opens.
- 2026-09-30: Monetization Gateway closed beta (US only), USDC on Base via the Coinbase facilitator.

**Relations to the eight.**
- x402: complements. Cloudflare co-founded the x402 Foundation, wrote the `cloudflare:402` binding into the x402 spec, settles Monetization Gateway payments with x402, and Wallets are built to pay with x402.
- visa-tap: complements. TAP was developed in collaboration with Cloudflare, which verifies TAP signatures at the edge.
- mastercard-agent-pay: complements. Cloudflare verifies Mastercard agent signatures at the edge (2025-10-24 post).
- ap2: compatible-with. The NET Dollar release says Cloudflare contributes to AP2; no Cloudflare AP2 product found.
- Other four: no documented relation.

**Sources.** src-x402-cf-mg-beta; src-x402-cf-changelog; src-x402-cf-blog-foundation; src-x402-scheme-batch-cf; src-x402-gh-pr-1145; src-orbit-cloudflare-wallets-blog; src-orbit-cloudflare-wallets-pr; src-orbit-cloudflare-wallets-docs; src-orbit-cloudflare-net-dollar; src-orbit-cloudflare-radar-api; src-visa-tap-cf-blog; src-cf-verified-bots.

---

## Tempo

- **id:** `tempo`
- **Category:** machine-payments
- **What it is:** A payments-focused EVM Layer 1 incubated by Stripe and Paradigm, launched on mainnet together with the Machine Payments Protocol, and MPP's home rail.
- **Steward:** Tempo Labs (company); node software `tempoxyz/tempo` (Apache-2.0).
- **Status (as of 2026-10-11):** Live. Mainnet since 2026-03-18 (chain ID 4217 per Tempo docs); `tempoxyz/tempo` 1,031 stars, release `tempo-primitives@1.16.0` on 2026-10-06. Validator set is permissioned with a stated path to permissionless validation (reported, Everstake).
- **Latest version:** node packages 1.16.0 (2026-10-06).
- **Primary links:**
  - https://tempo.xyz/blog/mainnet/ (mainnet and MPP announcement)
  - https://tempo.xyz/developers/docs/ (developer docs)
  - https://github.com/tempoxyz/tempo (node)
  - https://github.com/tempoxyz/mpp-specs (MPP specs, maintained by Tempo Labs and Stripe)

**Card data.** Tempo's mainnet post (2026-03-18) introduces MPP as an open standard co-authored by Stripe and Tempo and supporting stablecoins, cards and other methods; Tempo is one payment method among several in MPP, not a requirement. Coverage dates the project announcement to 2025-09-04 and the public testnet to 2025-12-09 (reported). ATLAS_FOLLOWUP.md 2.1.2 says Tempo, not Mastercard, lists Mastercard Agent Pay for Machines as MPP-compatible; that claim belongs to the MPP and Mastercard pages.

**Status history.**
- 2025-09-04: Tempo announced by Stripe and Paradigm (reported).
- 2025-12-09: public testnet (reported).
- 2026-03-18: mainnet live; MPP released.
- 2026-10-06: node release 1.16.0.

**Relations to the eight.**
- stripe-mpp: same-steward. Tempo Labs co-authors and maintains MPP with Stripe; Tempo is MPP's native stablecoin rail.
- x402: no documented relation.
- Other six: no documented relation.

**Sources.** src-orbit-tempo-mainnet; src-orbit-tempo-repo; src-orbit-mpp-specs-repo; src-orbit-tempo-testnet-theblock.

---

## Kite AI (Kite Chain and Agent Passport)

- **id:** `kite-ai`
- **Category:** machine-payments
- **What it is:** A Layer 1 settlement chain for agent payments plus an "Agent Passport" that gives an agent a programmable wallet with user-set spending limits and allowed destinations.
- **Steward:** Kite (company, San Francisco); member of the x402 Foundation.
- **Status (as of 2026-10-11):** Live (mainnet and Agent Passport launched 2026-04-30 per Kite's press release). Kite says it integrates over 90 service providers (company figure). Support for x402, AP2 and MPP appears only on Kite's social account as seen through a mirror (unverified).
- **Latest version:** mainnet (2026-04-30).
- **Primary links:**
  - https://www.theblock.co/press-releases/399534/kite-launches-kite-chain-and-kite-agent-passport-enabling-autonomous-ai-agent-payments (Kite press release via Chainwire)
  - https://gokite.ai/ (company site)

**Status history.**
- 2026-04-30: Kite Chain mainnet and Kite Agent Passport launched.
- 2026-07-14: Kite AI listed as a general member at the x402 Foundation's operational launch.

**Relations to the eight.**
- x402: compatible-with. Kite is an x402 Foundation member; product-level x402 support is claimed only on social media (unverified).
- Other seven: no documented relation (AP2 and MPP claims unverified).

**Sources.** src-orbit-kite-launch; src-x402-lf-july.

---

## Nevermined

- **id:** `nevermined`
- **Category:** machine-payments
- **What it is:** A payments platform for AI agents that runs an x402 facilitator with an ERC-4337 smart-account scheme (`nvm:erc4337`) supporting plans, credits and subscriptions, and documents AP2 and A2A integration.
- **Steward:** Nevermined (company); SDK `nevermined-io/payments` (Apache-2.0, pushed 2026-10-05).
- **Status (as of 2026-10-11):** Live. Docs describe an x402 Smart Accounts Extension, an ADK demo carrying Nevermined x402 payments over AP2 and A2A messages, and a Payments Facilitator that also accepts MPP, which Nevermined's docs expand as "Merchant Payment Protocol" (a naming mismatch with the Machine Payments Protocol; see Appendix D on "MPP").
- **Primary links:**
  - https://nevermined.ai/docs/products/payments-facilitator/how-it-works.md (facilitator docs)
  - https://nevermined.ai/docs/integrations/nevermined-x402-ap2.md (AP2 integration)
  - https://github.com/nevermined-io/payments (SDK)

**Status history.**
- 2024-02-21: `nevermined-io/payments` repository created.
- 2026-01: blog post on combining x402, A2A and AP2 (month per search summary; reported).

**Relations to the eight.**
- x402: complements. Nevermined runs an x402 facilitator and defines its own smart-account scheme on top.
- ap2: complements. Docs show x402 payments carried inside AP2 and A2A messages (demo).
- stripe-mpp: compatible-with. The facilitator documents accepting MPP payments, though it names the protocol differently.
- visa-tap: none at protocol level; Nevermined published a third-party review of Visa Intelligent Commerce (see the Visa TAP research).

**Sources.** src-orbit-nevermined-facilitator; src-orbit-nevermined-ap2; src-orbit-nevermined-repo; src-nevermined-vic.

---

## Crossmint Agentic Cards API

- **id:** `crossmint`
- **Category:** machine-payments
- **What it is:** A Crossmint API, launched publicly on 2026-06-02, that lets developers connect eligible US-issued Visa credit and debit cards to AI agents as tokenized credentials through Visa Intelligent Commerce and Basis Theory, with spend limits.
- **Steward:** Crossmint (company); SDK `Crossmint/crossmint-sdk` (Apache-2.0).
- **Status (as of 2026-10-11):** Live (public launch 2026-06-02). Issuer approval and controls still apply per Crossmint. Crossmint also runs stablecoin wallets and publishes a protocol comparison page.
- **Latest version:** public launch (2026-06-02).
- **Primary links:**
  - https://crossmint.com/announcement/agentic-cards-api-launch-visa-basistheory (launch)
  - https://www.crossmint.com/products/agentic-cards (product)
  - https://github.com/Crossmint/crossmint-sdk (SDK)

**Status history.**
- 2026-06-02: Agentic Cards API public launch on Visa Intelligent Commerce and Basis Theory.

**Relations to the eight.**
- visa-tap: compatible-with. The product runs on Visa Intelligent Commerce tokens; TAP use is not stated in the launch post.
- Other seven: no documented relation in the launch post.

**Sources.** src-orbit-crossmint-launch; src-orbit-crossmint-sdk.

---

## x402r (refunds) and A402 (academic proposal)

- **id:** `x402r-a402`
- **Category:** machine-payments
- **What it is:** Two x402-adjacent proposals with confusable names. x402r is a third-party, non-custodial refund and arbitration protocol for x402 payments (`@x402r/sdk`). A402 is an academic paper that binds crypto payments to service execution with Atomic Service Channels.
- **Steward:** x402r: BackTrackCo (GitHub organization). A402: authors Li et al. (arXiv).
- **Status (as of 2026-10-11):** x402r: live SDK, listed by the x402 docs as a third-party extension; npm `@x402r/sdk` 0.2.1 (first published 2026-03-20, last modified 2026-05-23); `BackTrackCo/x402r-sdk` created 2026-01-26, pushed 2026-09-23, 1 star. A402: paper only (arXiv:2603.01179, 2026-03-01), no deployment found.
- **Latest version:** `@x402r/sdk` 0.2.1; arXiv 2603.01179.
- **Primary links:**
  - https://x402r.org (x402r)
  - https://github.com/BackTrackCo/x402r-sdk (x402r SDK)
  - https://arxiv.org/abs/2603.01179 (A402)

**Card data.** x402's `exact` scheme defines no refund; refunds exist only in the later `auth-capture` scheme and batch-settlement channels, or through third parties such as x402r and zauth. A402 argues that x402 does not make execution, payment and delivery atomic and proposes TEE-assisted adaptor signatures as a fix.

**Status history.**
- 2026-01-26: x402r SDK repository created.
- 2026-03-01: A402 paper posted (arXiv:2603.01179).
- 2026-03-20: `@x402r/sdk` first published on npm.

**Relations to the eight.**
- x402: complements (x402r adds refunds and arbitration; listed in the x402 docs). A402: competes-with (an alternative design motivated by x402's lack of atomicity).
- Other seven: no documented relation.

**Sources.** src-x402-docs-devtools; src-orbit-x402r-sdk; src-x402-arxiv-2603-01179.

---
