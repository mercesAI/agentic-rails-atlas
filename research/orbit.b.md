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
