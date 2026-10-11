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

## ★ Visa Intelligent Commerce

- **id:** `visa-intelligent-commerce`
- **Category:** card-wallet-commerce
- **What it is:** Visa's program and API platform for agent-initiated card payments: tokenized credentials for agents, passkey-confirmed payment instructions, transaction signals back to Visa, and the programs (Agentic Ready, Intelligent Commerce Connect, Agentic Directory, Agent Score) built around them. The Trusted Agent Protocol (TAP) is one component.
- **Steward:** Visa (company).
- **Status (as of 2026-10-11):** Mixed. Unveiled 2025-04-30; Visa reported "hundreds" of agent-initiated transactions with partners by 2025-12-18 (controlled, real-world); Agentic Ready live in the UK and Europe, with 31 European issuers named as completing live agent purchases on 2026-07-02; Intelligent Commerce Connect announced as a pilot on 2026-04-08; Agentic Directory and Agent Score announced 2026-06-10 with no public list or endpoint found. The developer page says the platform is free in sandbox and production fees are by contact.
- **Latest version:** no version numbers; latest dated program event is the 2026-07-02 European issuer phase.
- **Primary links:**
  - https://developer.visa.com/capabilities/visa-intelligent-commerce/overview (developer overview)
  - https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html (launch, 2025-04-30)
  - https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.22276.html (Intelligent Commerce Connect, 2026-04-08)
  - https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.22491.html (Agentic Directory and Agent Score, 2026-06-10)
  - https://github.com/visa/ai (VIC MCP and API toolkit, MIT)

**Description.** Visa Intelligent Commerce (VIC) is the commercial layer around Visa's agent protocols. Visa unveiled it on 2025-04-30 under the heading "Find and Buy with AI", pitching AI-ready cards: tokenized Visa credentials that a user can hand to an AI agent without exposing the card number. A user enrolls a card, an agent creates a purchase instruction that the user confirms (Visa Payment Passkeys are the confirmation method Visa names in Europe), and the agent then requests credentials for that instruction. Visa's open-source `visa/ai` toolkit shows the shape of the API: enrollment through `POST /vacp/v1/cards`, then create, update, cancel, credential and confirmation calls under `/vacp/v1/instructions`. The confirmation call reports the outcome back to Visa as a "signal" that Visa says helps resolve disputes.

TAP sits inside VIC. TAP is the signature scheme an agent uses to identify itself to a merchant website; VIC supplies the onboarding of agents, the tokens and the payment instructions that the TAP payment container refers to. The TAP specification says a public key associated with Visa implies the agent takes part in, and complies with, the VIC program requirements, so a merchant that verifies TAP is relying on Visa's agent onboarding, which is not public.

Around the API Visa has announced several programs. Agentic Ready (Europe from 2026-03-17 with 21 named early issuers; global expansion announced 2026-04-29) prepares issuers and merchants to accept agent transactions; on 2026-07-02 Visa said 31 European issuers had completed live agent purchases with merchants such as lastminute.com, and that every Agentic Ready transaction in Europe used Visa Payment Passkeys, supporting Strong Customer Authentication. Intelligent Commerce Connect (pilot, 2026-04-08) is an on-ramp for businesses that accepts agent payments arriving through TAP, MPP, ACP or UCP and can handle orchestration and PCI compliance for enablers. The Agentic Directory (2026-06-10) is described as a list of Visa-verified agents and merchants, and Agent Score rates how ready a merchant site is for agents (it scores sites, not agents); the same release calls the directory an "Agentic Registry" in its subheadline.

Separate what is live from what is announced. Live: the sandbox API, the `visa/ai` toolkit (MIT, last commit 2026-09-30), Agentic Ready transactions in Europe, and partner products such as Crossmint's Agentic Cards API (2026-06-02). Pilot or announced: Intelligent Commerce Connect, the Agentic Directory and Agent Score. No agent-specific liability shift, interchange rate or 3-D Secure rule had been published as of the Visa TAP research on 2026-10-11, and Visa's reference agent (`visa/vic-reference-agent`) carries an evaluation-only license despite being described as open source.

Visa also extends VIC beyond its own protocol: it authored the card payment method for MPP (`draft-card-charge-00`, where TAP headers are optional) and a 2026-03-18 card spec and `mpp-card` SDK built on VIC and TAP, it is a Premier member of the x402 Foundation, it is listed as a UCP endorser, and it is a founding validator of Circle's Arc chain. Mastercard's counterpart program is Agent Pay; both networks use the phrase "agentic token" for different constructs.

**Status history.**
- 2025-04-30: VIC unveiled ("Find and Buy with AI").
- 2025-10-14: Trusted Agent Protocol launched as part of VIC, with Cloudflare.
- 2025-12-18: Visa reports hundreds of agent-initiated transactions with partners.
- 2026-03-17: Agentic Ready launched in Europe (21 early issuers).
- 2026-03-18: Visa card spec and SDK for MPP.
- 2026-04-08: Intelligent Commerce Connect announced (pilot).
- 2026-04-29: Agentic Ready global expansion.
- 2026-06-10: Agentic Directory and Agent Score announced.
- 2026-07-02: 31 European issuers complete live agent purchases.

**Relations to the eight.**
- visa-tap: same-steward. TAP is VIC's agent identity component; a Visa-associated key implies VIC program participation.
- stripe-mpp: complements. Visa authored MPP's card method; Intelligent Commerce Connect accepts MPP payments.
- openai-acp: compatible-with. Intelligent Commerce Connect accepts ACP payments; no wire binding published.
- ucp: compatible-with. Visa is a listed UCP endorser and Intelligent Commerce Connect accepts UCP.
- x402: compatible-with. Visa is an x402 Foundation Premier member; the TAP release says Visa is collaborating with Coinbase on x402 interoperability.
- mastercard-agent-pay: competes-with. Rival network program for agent card payments with its own token and directory.
- ap2, erc-8004: no documented relation.

**Sources.** src-visa-vic-pr; src-visa-vic-dev; src-visa-ai-repo; src-visa-ai-vic-client; src-visa-vic-ref-agent; src-visa-tap-pr; src-visa-tap-spec; src-visa-dec18; src-visa-ar-eu; src-visa-ar-global; src-visa-icc; src-visa-jun10; src-visa-eu-live; src-visa-mpp-card; src-x402-lf-july; src-orbit-crossmint-launch.

---

## American Express ACE Developer Kit and Agent Purchase Protection

- **id:** `amex-ace`
- **Category:** card-wallet-commerce
- **What it is:** American Express's Agentic Commerce Experiences (ACE) Developer Kit, with five services (agent registration, account enablement, intent intelligence, payment credentials and cart context), and Agent Purchase Protection, a commitment to protect eligible Card Members from charges caused by errors of registered AI agents.
- **Steward:** American Express (company).
- **Status (as of 2026-10-11):** Announced 2026-04-14. Amex said the protection applies when a Card Member authorizes a registered agent and the agent sends Amex the authenticated purchase intent, with terms and conditions; trade coverage notes the wording is forward-looking. Developer availability details beyond the release were not verified.
- **Latest version:** announcement (2026-04-14).
- **Primary links:**
  - https://www.nasdaq.com/press-release/american-express-debuts-agentic-commerce-experiences-acetm-developer-kit-and (Business Wire release)
  - https://www.americanexpress.com/en-us/company/agentic-commerce/ (program page)

**Status history.**
- 2025-09-16: American Express named among AP2 launch collaborators.
- 2026-04-14: ACE Developer Kit and Agent Purchase Protection announced.
- 2026-07-14: Premier member at the x402 Foundation's operational launch.

**Relations to the eight.**
- ap2: compatible-with. Named collaborator at AP2's launch; no Amex AP2 product found.
- ucp: compatible-with. Listed as a UCP endorser on ucp.dev.
- x402: compatible-with. Premier member of the x402 Foundation.
- visa-tap, mastercard-agent-pay: competes-with. Card-network agent program with its own agent registration, parallel to Visa's and Mastercard's.
- Other two: no documented relation. The release says the kit works with existing and emerging protocols without naming them.

**Sources.** src-orbit-amex-ace-pr; src-orbit-amex-agentic-page; src-ap2-gcloud-launch; src-ucp-site; src-x402-lf-july.

---

## PayPal agentic commerce services (Agent Ready, Store Sync)

- **id:** `paypal-agentic`
- **Category:** card-wallet-commerce
- **What it is:** PayPal services that let merchants accept payments from AI assistants with minimal changes (Agent Ready) and expose catalogs, carts and orders to AI shopping platforms (Store Sync).
- **Steward:** PayPal (company).
- **Status (as of 2026-10-11):** Live per PayPal developer docs. Announced 2025-10-28; Store Sync was available first, and Agent Ready payments were slated for early 2026 (reported). On 2025-10-28 PayPal also said it "will adopt" ACP and run an ACP server for its merchants; it signed the ACP corporate CLA on 2026-04-16. PayPal is a listed PSP for the ChatGPT payment sheet beta and a launch partner of Microsoft Copilot Checkout (2026-01-08), and it powers Perplexity Instant Buy (see that item).
- **Latest version:** no versions; docs current on 2026-10-11.
- **Primary links:**
  - https://developer.paypal.com/agentic-commerce-services/about.md (developer overview)
  - https://paypal.ai/ (program site)

**Status history.**
- 2025-10-28: agentic commerce services announced; PayPal says it will adopt ACP.
- 2026-01-08: launch partner of Microsoft Copilot Checkout.
- 2026-04-16: PayPal signs the ACP corporate CLA.

**Relations to the eight.**
- openai-acp: uses-as-rail. PayPal adopts ACP and runs an ACP server for merchants; CLA signatory.
- ucp: compatible-with. Listed as a UCP endorser on ucp.dev.
- ap2: compatible-with. Named among AP2 launch collaborators.
- Other five: no documented relation.

**Sources.** src-orbit-paypal-docs; src-orbit-paypal-dc360; src-paypal-acp; src-openai-acp-cla-signatories; src-openai-apps-monetization; src-ms-copilot-checkout; src-ucp-site; src-ap2-gcloud-launch.

---

## Stripe Agentic Commerce Suite and Shared Payment Tokens

- **id:** `stripe-acs`
- **Category:** card-wallet-commerce
- **What it is:** Stripe's merchant product for selling through AI agents (Agentic Commerce Suite) and its scoped, revocable payment credential that an agent passes to a seller without exposing card details (Shared Payment Token, SPT).
- **Steward:** Stripe (company).
- **Status (as of 2026-10-11):** Live. SPTs launched with ACP on 2025-09-29; the Agentic Commerce Suite launched 2025-12-11. SPTs are available to agents, customers and sellers in the US, Canada and listed European countries; Stripe docs show examples with `Stripe-Version 2026-09-30.preview`.
- **Latest version:** API version `2026-09-30.preview` in SPT examples.
- **Primary links:**
  - https://stripe.com/newsroom/news/agentic-commerce-suite (suite launch)
  - https://docs.stripe.com/agentic-commerce/concepts/shared-payment-tokens (SPT docs)

**Card data.** An SPT carries `usage_limits` (`currency`, `max_amount`, `expires_at`) and `seller_details`; the seller confirms a PaymentIntent with it. OpenAI describes SPT as the first implementation compatible with ACP's Delegated Payment spec, but SPT itself is not part of the ACP spec. Stripe's MPP integration accepts cards through SPTs, a shared primitive rather than a protocol link.

**Status history.**
- 2025-09-29: SPT launched with ACP and ChatGPT Instant Checkout.
- 2025-12-11: Agentic Commerce Suite launched.

**Relations to the eight.**
- openai-acp: same-steward. Stripe co-develops ACP with OpenAI; SPT is the first Delegated Payment implementation.
- stripe-mpp: same-steward. Stripe co-authors MPP; MPP card payments on Stripe use SPTs.
- x402: compatible-with. Stripe's machine payments preview supports x402 on Base (reported 2026-02-11).
- ucp: compatible-with. Stripe is a UCP co-developer listed on ucp.dev.
- Other four: no documented relation.

**Sources.** src-stripe-acs-launch; src-stripe-spt; src-stripe-acp-launch; src-openai-commerce-docs; src-stripe-mpp-docs; src-x402-stripe-coverage; src-ucp-site.

---

## Adyen Agentic

- **id:** `adyen-agentic`
- **Category:** card-wallet-commerce
- **What it is:** A suite of modular Adyen APIs (Agentic Feed, Agentic Cart, Agentic Payments) that lets enterprise merchants sell through AI platforms without rebuilding checkout for each one.
- **Steward:** Adyen (company).
- **Status (as of 2026-10-11):** Limited availability for US enterprise merchants since the 2026-06-16 announcement, with global expansion planned. Adyen's release calls itself an early endorser of UCP and names AP2 and OpenAI's ACP; Adyen publishes UCP integration docs (last modified 2026-10-09). Adyen signed the ACP CLA, and ACP added `adyen` to its authentication provider enum in the 2026-01-16 release.
- **Latest version:** limited availability (2026-06-16).
- **Primary links:**
  - https://www.adyen.com/press-and-media/adyen-agentic (announcement)
  - https://docs.adyen.com/online-payments/agentic-commerce/agent-platform/agentic-payments-ucp (UCP integration docs)

**Status history.**
- 2026-01-16: ACP release adds `adyen` as an authentication provider.
- 2026-06-16: Adyen Agentic announced, US limited availability.
- 2026-07-14: Premier member at the x402 Foundation's operational launch.

**Relations to the eight.**
- ucp: uses-as-rail. Adyen documents an Agentic Payments integration with UCP.
- openai-acp: uses-as-rail. CLA signatory and named authentication provider in the ACP spec.
- ap2: compatible-with. Named in Adyen's release; AP2 launch collaborator.
- mastercard-agent-pay: compatible-with. Mastercard is quoted in the Adyen Agentic release about Agent Pay.
- x402: compatible-with. Premier member of the x402 Foundation.
- Other three: no documented relation.

**Sources.** src-orbit-adyen-agentic; src-ucp-adyen-docs; src-openai-acp-cla-signatories; src-ap2-gcloud-launch; src-x402-lf-july.

---

## Klarna Agentic Product Protocol

- **id:** `klarna-app`
- **Category:** card-wallet-commerce
- **What it is:** An open product-feed specification and API from Klarna that gives AI agents structured, live product, price and availability data.
- **Steward:** Klarna (company).
- **Status (as of 2026-10-11):** Live per the 2025-12-15 announcement (specification and API access "available today"). Klarna claims more than 100 million products and 400 million prices across 12 markets (company figures, as of 2025-12-15). Klarna is a listed UCP endorser.
- **Latest version:** launch (2025-12-15).
- **Primary links:**
  - https://www.businesswire.com/news/home/20251215227830/en/Klarna-Launches-Agentic-Product-Protocol-The-Open-Standard-That-Makes-100M-Products-Instantly-Discoverable-by-AI-Agents (announcement)

**Status history.**
- 2025-12-15: Agentic Product Protocol launched.

**Relations to the eight.**
- openai-acp, ucp: competes-with. A product-feed format for agents, overlapping with ACP product feeds and UCP catalog capabilities; Klarna is also a UCP endorser.
- Other six: no documented relation.

**Sources.** src-orbit-klarna-app; src-ucp-site.

---

## Microsoft Copilot Checkout

- **id:** `microsoft-copilot-checkout`
- **Category:** card-wallet-commerce
- **What it is:** In-chat checkout on Copilot.com where the merchant stays merchant of record, fed by product data from Microsoft Merchant Center.
- **Steward:** Microsoft (Microsoft Advertising and Copilot).
- **Status (as of 2026-10-11):** Live in the US, rolling out since 2026-01-08 with PayPal, Shopify and Stripe. Microsoft's page says Copilot Checkout requires a UCP-compliant feed (present tense) and that Merchant Center "will support" UCP (future tense); Microsoft also says it is adopting open standards like ACP. Copilot does not become merchant of record.
- **Latest version:** launch (2026-01-08).
- **Primary links:**
  - https://about.ads.microsoft.com/en/blog/post/january-2026/conversations-that-convert-copilot-checkout-and-brand-agents (launch)
  - https://about.ads.microsoft.com/en/solutions/technology/agentic-commerce (requirements page)

**Status history.**
- 2026-01-08: Copilot Checkout and Brand Agents announced, US rollout.

**Relations to the eight.**
- ucp: uses-as-rail. A UCP-compliant feed is required; full Merchant Center UCP support is stated in the future tense.
- openai-acp: compatible-with. Microsoft says it is adopting open standards like ACP; no ACP binding documented.
- Other six: no documented relation.

**Sources.** src-ms-copilot-checkout; src-ucp-microsoft-page; src-ms-agentic-commerce.

---

## Perplexity Instant Buy (with PayPal)

- **id:** `perplexity-instant-buy`
- **Category:** card-wallet-commerce
- **What it is:** In-chat checkout in Perplexity for PayPal merchants, using PayPal identity verification and purchase protection.
- **Steward:** Perplexity and PayPal (companies).
- **Status (as of 2026-10-11):** Live for US users since 2025-11-25 per PayPal's newsroom; early retailers named include Abercrombie & Fitch, Ashley Furniture, Fabletics, Adorama and Newegg. Perplexity's separate Comet browser agent is the subject of Amazon v. Perplexity (see the legal item).
- **Latest version:** launch (2025-11-25).
- **Primary links:**
  - https://newsroom.paypal-corp.com/2025-11-PayPal-and-Perplexity-Launch-Instant-Buy (launch)
  - https://newsroom.paypal-corp.com/2025-11-PayPal-Launches-Agentic-Shopping-with-Perplexity (related PayPal release)

**Status history.**
- 2025-11-25: Instant Buy launched for US Perplexity users with PayPal.

**Relations to the eight.**
- None documented. The releases do not name ACP, UCP, AP2 or another protocol; PayPal's own ACP and UCP ties are listed under the PayPal item.

**Sources.** src-orbit-perplexity-instant-buy; src-orbit-perplexity-paypal-agentic.

---

## Google Universal Cart

- **id:** `google-universal-cart`
- **Category:** card-wallet-commerce
- **What it is:** A Google shopping product (not the UCP protocol) that keeps one cart across merchants and across Search, Gemini, YouTube and Gmail, tracks prices and restocks, and checks out through UCP with Google Pay.
- **Steward:** Google (company).
- **Status (as of 2026-10-11):** Announced 2026-05-19 at Google I/O; rollout in the US across Search and the Gemini app was scheduled for summer 2026, with YouTube and Gmail later. Whether the rollout completed was not verified. The same post says AP2 comes to Google products "in the coming months", starting with Gemini Spark, and that the brand remains merchant of record.
- **Latest version:** announcement (2026-05-19).
- **Primary links:**
  - https://blog.google/products-and-platforms/products/shopping/google-shopping-cart/ (announcement)

**Status history.**
- 2026-05-19: Universal Cart announced; UCP checkout expansion to Canada and Australia, then the UK, announced in the same post.

**Relations to the eight.**
- ucp: uses-as-rail. Checkout runs on UCP. Disambiguation: Universal Cart is a product, UCP is the protocol (Appendix D).
- ap2: same-steward. Google started AP2 (now at FIDO) and says AP2 will reach Google products starting with Gemini Spark; live use unverified.
- Other six: no documented relation.

**Sources.** src-ucp-google-universal-cart.

---

## Shopify Agentic Storefronts

- **id:** `shopify-agentic-storefronts`
- **Category:** card-wallet-commerce
- **What it is:** A Shopify admin channel that syndicates a merchant's Shopify Catalog data to AI assistants (ChatGPT, Microsoft Copilot, Google AI Mode and Gemini) and, where enabled, lets buyers check out inside the AI channel; an Agentic plan opens the catalog to brands that do not run a Shopify store.
- **Steward:** Shopify (company); Shopify co-develops UCP with Google.
- **Status (as of 2026-10-11):** Mixed. Announced 2026-01-11 with UCP. Shopify Help Center: checkout is active by default for eligible US stores; Microsoft Copilot, Google AI Mode and Gemini storefronts are in early access and not yet available to all stores. Agentic Storefronts got its own admin page on 2026-05-11 (changelog). Secondary reports say eligible US merchants were auto-enrolled in Google AI Mode checkout around 2026-09-18 to 2026-09-22 with opt-out (reported). A per-channel fee is reported but its rate is not public (unverified).
- **Latest version:** admin page update (2026-05-11).
- **Primary links:**
  - https://www.shopify.com/news/ai-commerce-at-scale (announcement)
  - https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts/requirements (requirements)
  - https://help.shopify.com/en/manual/online-sales-channels/agentic-storefronts/customer-experience (customer experience, early access note)
  - https://shopify.dev/changelog/a-new-home-for-agentic-storefronts-in-your-admin (changelog)

**Status history.**
- 2026-01-11: Agentic Storefronts and Agentic plan announced alongside UCP.
- 2026-05-11: dedicated Agentic Storefronts page in Shopify admin.
- 2026-09-18 to 2026-09-22: reported automatic enrollment in Google AI Mode checkout.

**Relations to the eight.**
- ucp: same-steward. Shopify co-develops UCP and holds a permanent Governing Council seat; Google and Copilot checkouts run on UCP.
- openai-acp: uses-as-rail. Shopify catalog data reaches ChatGPT (OpenAI, 2026-03-24); buyers complete purchases on the merchant's store.
- Other six: no documented relation.

**Sources.** src-orbit-shopify-news; src-orbit-shopify-help-requirements; src-orbit-shopify-help-cx; src-orbit-shopify-changelog; src-ucp-ppcland-shopify; src-openai-product-discovery.

---

## ★ NPCI UPI agentic payments

- **id:** `npci-upi-agentic`
- **Category:** card-wallet-commerce
- **What it is:** Pilots in which AI assistants (first ChatGPT, then Claude) pay Indian merchants over UPI, using UPI Reserve Pay so the user approves one spending limit for a merchant once and the agent then completes several debits within it.
- **Steward:** National Payments Corporation of India (NPCI, operator of UPI), with Razorpay as payment aggregator and OpenAI and Anthropic as AI platform partners.
- **Status (as of 2026-10-11):** Pilot. ChatGPT pilot announced 2025-10-09 with Axis Bank and Airtel Payments Bank as banking partners and Bigbasket among the first merchants; Claude pilot announced 2026-02-20 at the India AI Impact Summit with Zomato, Swiggy and Zepto, for a small group of users. A national framework (reported as a "Unified Agentic Protocol" with an AI-agent registry) has been reported in September 2026 but not confirmed by an NPCI publication found here (reported).
- **Latest version:** Claude pilot (2026-02-20).
- **Primary links:**
  - https://razorpay.com/newsroom/razorpay-npci-and-openai-come-together-to-launch-agentic-payments-ushering-in-ai-driven-commerce-at-national-scale/ (ChatGPT pilot release)
  - https://razorpay.com/newsroom/razorpay-npci-launch-agentic-payments-on-claude-powering-zomato-swiggy-zepto-at-the-india-ai-impact-summit/ (Claude pilot release)
  - https://razorpay.com/blog/upi-reserve-pay/ (Reserve Pay on NPCI's Single Block Multi Debit framework)
  - https://www.npci.org.in/ (NPCI)

**Description.** UPI is India's real-time account-to-account payment system, run by NPCI. Its agentic pilots do not add a new protocol on the wire; they reuse two UPI features that let a user hand bounded authority to someone else. UPI Reserve Pay, which Razorpay describes as built on NPCI's Single Block Multi Debit (SBMD) framework, lets a user block an amount for a merchant once (with UPI PIN) and then allows several debits against that block without another PIN prompt. UPI Circle lets a primary user delegate UPI payments to a secondary user within limits. Together they give an AI agent a pre-authorized, capped and merchant-scoped budget.

The first pilot was announced on 2025-10-09 by Razorpay, NPCI and OpenAI as "Agentic Payments" on ChatGPT, described as being in the pilot stage. Razorpay's banking partners were Axis Bank and Airtel Payments Bank, and Bigbasket (Tata group) was among the first merchants; TechCrunch reported Vi mobile recharges as another. NPCI's growth executive director was quoted in the release. Razorpay's newsroom page carries a 2025-10-30 publication timestamp, while the joint announcement and news coverage are dated 2025-10-09; use 2025-10-09 for the announcement.

On 2026-02-20, at the India AI Impact Summit, Razorpay and NPCI brought the same model to Anthropic's Claude: users can order food, groceries and essentials from Zomato, Swiggy and Zepto inside the conversation, approving one spending limit per merchant through Reserve Pay. Razorpay said this pilot runs with a small group of users. Razorpay's 2026-03-12 blog post on Reserve Pay offers Reserve Pay to merchants through early access, with agentic payments as one use.

What is not yet public is a national rulebook. In July to September 2026 Indian and international outlets reported that NPCI was preparing a framework for agent payments on UPI, with an AI-agent registry and phased rollout, expected around Global Fintech Fest 2026 (September 8 to 11); reported caps vary between outlets and should not be shown as rules. No NPCI circular or press release confirming the framework, limits or liability was found on 2026-10-11, so the site should show it as reported only.

Compared with the eight protocols, UPI agentic payments are closest in spirit to AP2 mandates and to card-network agentic tokens: a user-approved, capped, merchant-scoped authority that the agent spends. The difference is that the scope is enforced by the payment system itself (the blocked amount in the user's bank account) rather than by a signed credential or a token's controls.

**Status history.**
- 2025-10-09: Razorpay, NPCI and OpenAI announce the ChatGPT agentic payments pilot on UPI.
- 2026-02-20: Razorpay and NPCI announce the Claude pilot (Zomato, Swiggy, Zepto).
- 2026-03-12: Razorpay describes Reserve Pay as built on NPCI's SBMD framework.
- 2026-09: NPCI agent registry and framework reported around Global Fintech Fest 2026 (reported, not confirmed by NPCI).

**Relations to the eight.**
- ap2: competes-with. Different mechanism for the same job (user-approved, capped agent spending); no reference in either direction.
- openai-acp: no documented relation. The ChatGPT pilot is an OpenAI partnership; the releases do not say it uses ACP.
- Other six: no documented relation.

**Sources.** src-orbit-npci-chatgpt-pilot; src-orbit-npci-claude-pilot; src-orbit-npci-reserve-pay; src-orbit-npci-techcrunch; src-orbit-npci-registry-report.

---

## Amazon v. Perplexity (Comet shopping agent)

- **id:** `amazon-v-perplexity`
- **Category:** legal-policy
- **What it is:** A US lawsuit in which Amazon sued Perplexity under the federal Computer Fraud and Abuse Act (CFAA) and California's CDAFA over Perplexity's Comet browser agent logging in to and shopping on Amazon.com for users; the first appellate ruling on whether an AI agent acting for a user accesses a site "without authorization".
- **Steward:** US District Court for the Northern District of California (No. 3:25-cv-09514-MMC, Judge Maxine M. Chesney); US Court of Appeals for the Ninth Circuit (No. 26-1444).
- **Status (as of 2026-10-11):** Preliminary injunction vacated; case remanded and continuing in the district court. The Ninth Circuit opinion (filed 2026-08-04; Judges Milan D. Smith Jr. and Eric C. Tung, and District Judge John Charles Hinderaker by designation; opinion by Judge Smith) held that Amazon was unlikely to succeed on its CFAA and CDAFA claims because, on these facts, the user rather than Perplexity accessed Amazon, using the agent as a tool, and that the equitable factors favored Perplexity. The court described its holding as narrow and tied to the facts before it.
- **Latest version:** Ninth Circuit opinion, 2026-08-04.
- **Primary links:**
  - https://cdn.ca9.uscourts.gov/datastore/opinions/2026/08/04/26-1444.pdf (Ninth Circuit opinion)
  - https://www.courtlistener.com/docket/71874820/amazoncom-services-llc-v-perplexity-ai-inc/ (district docket, CourtListener)
  - https://www.courtlistener.com/docket/72502129/amazoncom-services-llc-v-perplexity-ai-inc/ (appeal docket, CourtListener)

**Card data.** Amazon filed its complaint and a motion for a preliminary injunction in November 2025 (docket opened 2025-11-04). After a March 2026 hearing, the district court granted the injunction on 2026-03-09 (date per GeekWire and Decrypt; reported): it barred Comet's agent from password-protected areas of Amazon and ordered deletion of collected Amazon customer data, with a seven-day administrative stay. Perplexity appealed (appeal docketed 2026-03-11) and the Ninth Circuit stayed the injunction pending appeal and expedited the case; it was argued on 2026-06-11 in Seattle. Amici included the ACLU and the Knight First Amendment Institute, the Electronic Frontier Foundation with Mozilla and others, the Software and Information Industry Association, the National Retail Federation, Digital Content Next, the News/Media Alliance and Airlines for America. Commentators note that the ruling leaves site operators with terms of service and technical measures, which is where agent identity schemes such as Visa TAP, Mastercard Agent Pay signatures and Web Bot Auth come in.

**Status history.**
- 2025-11-04: Amazon files suit and moves for a preliminary injunction (N.D. Cal.).
- 2026-03-09: preliminary injunction granted, seven-day administrative stay (reported date).
- 2026-03-11: appeal docketed in the Ninth Circuit (No. 26-1444); stay pending appeal later granted.
- 2026-06-11: argued and submitted.
- 2026-08-04: injunction vacated and case remanded.

**Relations to the eight.**
- None documented. Context for the site: the dispute concerns agent access that the site could not tell apart from its user, the gap that signed agent identification (Visa TAP, Mastercard Agent Pay, Web Bot Auth) targets; no source links the case to those programs, so show this as editorial context, not a relation.

**Sources.** src-orbit-amazon-perplexity-ca9; src-orbit-amazon-perplexity-dockets; src-orbit-amazon-perplexity-geekwire; src-orbit-amazon-perplexity-decrypt; src-orbit-amazon-perplexity-jonesday.

---

## Item index (for `OrbitMeta`, lastVerified 2026-10-11)

| slug | category | starred | status label | latest version (date) |
|---|---|---|---|---|
| `erc-3643` | agent-identity | yes | Final ERC; reference implementation live | 4.1.6 stable in T-REX (2024-10-18); 4.1.3 marked latest in ERC-3643 org (2025-06-12) |
| `erc-8226` | agent-identity | no | Draft | ERCs commit f4df3d0 (2026-10-09) |
| `l402` | machine-payments | yes | Live (Lightning Labs); bLIP-0026 PR open | bLIP-0026 version 0 draft (2026-02-25) |
| `interledger` | machine-payments | no | Live; Web Monetization is a CG draft; no agent program found | open-payments 7.4.0 (2026-03-11) |
| `circle` | machine-payments | no | Live | Arc public mainnet (2026-09-16) |
| `coinbase-agent-products` | machine-payments | no | Live | Base MCP (2026-05-26, reported) |
| `cloudflare-agent-payments` | machine-payments | no | Mixed (closed beta, announced, unverified launch) | Monetization Gateway closed beta (2026-09-30) |
| `tempo` | machine-payments | no | Live | node 1.16.0 (2026-10-06) |
| `kite-ai` | machine-payments | no | Live | mainnet (2026-04-30) |
| `nevermined` | machine-payments | no | Live | none |
| `crossmint` | machine-payments | no | Live | public launch (2026-06-02) |
| `x402r-a402` | machine-payments | no | x402r live SDK; A402 paper only | @x402r/sdk 0.2.1; arXiv 2603.01179 (2026-03-01) |
| `visa-intelligent-commerce` | card-wallet-commerce | yes | Mixed | European issuer phase (2026-07-02) |
| `amex-ace` | card-wallet-commerce | no | Announced | announcement (2026-04-14) |
| `paypal-agentic` | card-wallet-commerce | no | Live | none |
| `stripe-acs` | card-wallet-commerce | no | Live | Stripe-Version 2026-09-30.preview |
| `adyen-agentic` | card-wallet-commerce | no | Limited availability (US) | announcement (2026-06-16) |
| `klarna-app` | card-wallet-commerce | no | Live | launch (2025-12-15) |
| `microsoft-copilot-checkout` | card-wallet-commerce | no | Live (US) | launch (2026-01-08) |
| `perplexity-instant-buy` | card-wallet-commerce | no | Live (US) | launch (2025-11-25) |
| `google-universal-cart` | card-wallet-commerce | no | Announced; rollout not verified | announcement (2026-05-19) |
| `shopify-agentic-storefronts` | card-wallet-commerce | no | Mixed (ChatGPT live; others early access) | admin page update (2026-05-11) |
| `npci-upi-agentic` | card-wallet-commerce | yes | Pilot | Claude pilot (2026-02-20) |
| `amazon-v-perplexity` | legal-policy | no | Injunction vacated; remanded | Ninth Circuit opinion (2026-08-04) |
