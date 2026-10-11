# Visa Trusted Agent Protocol research dossier

Slug: `visa-tap`. Research date (accessed date for everything below): 2026-10-11. US spelling. Dates are YYYY-MM-DD. Source ids in brackets refer to `visa-tap.sources.json`.

Repositories read (all under `research/vendor/`):

| Repo | Remote | Commit read | Tag or version read |
| --- | --- | --- | --- |
| `visa-trusted-agent-protocol` | https://github.com/visa/trusted-agent-protocol | `16d59bdf3f8a542bc538d0962edbb80ea30a02af` (2025-10-28) | no tags, no releases; 6 commits 2025-10-12 to 2025-10-28 |
| `visa-mcp` | https://github.com/visa/mcp | `1c544e5c1ed45c8c075ca57e9e76e7876e34fd42` (2026-09-30) | see Ecosystem |

## Identity and governance

- **What it is.** The Trusted Agent Protocol (TAP) is a Visa specification that lets an AI agent prove its identity, and the user authorization it carries, to a merchant by attaching a cryptographic signature to its web requests. The reference repository calls it "a standardized, cryptographic method for an AI agent to prove its identity" (README) [src-visa-tap-repo]. It identifies agents; it does not move money by itself.
- **Owner.** Visa. The reference repository `visa/trusted-agent-protocol` was created on GitHub 2025-10-10T02:05:59Z. It has 6 commits between 2025-10-12 and 2025-10-28 (the last one, "Adding nonce validation sample code", merged as PR #3 on 2025-10-28), no tags and no releases. GitHub reports the license as "Other" (`NOASSERTION`) [src-visa-tap-gh-meta].
- **License.** `LICENSE.md` says that using, downloading or installing the code means accepting the Visa Developer Center Terms of Use and the Visa Trusted Agent Protocol Product Terms; it is not an open source license [src-visa-tap-repo-license].
- **Repository activity after launch.** As of 2026-10-11 the repository shows 212 stars and 45 forks; community pull requests opened after 2025-10-28 (for example #21 "make signature verifier RFC 9421-conformant", opened 2026-07-15) are open and unmerged, and issue #23 (2026-07-18) asks for a worked example of the object signature base because it is under-specified [src-visa-tap-gh-meta].
- **Launch.** Visa announced TAP on 2025-10-14 (Business Wire dateline San Francisco) as "developed in collaboration with Cloudflare" and available "today" in the Visa Developer Center and on GitHub [src-visa-tap-pr]. The release names these early partners that gave feedback: Adyen, Ant International, Checkout.com, Coinbase, CyberSource, Elavon, Fiserv, Microsoft, Nuvei, Shopify, Stripe and Worldpay. It cites a 4,700% rise in AI-driven traffic to US retail sites (Adobe Data Insights, August 2025) [src-visa-tap-pr].
- **Place in Visa's product line.** The developer overview presents TAP as an enhancement to Visa Intelligent Commerce (VIC) and says the product "is in the process of development and deployment" and may not be available in all markets [src-visa-tap-overview]. The specification says a public key associated with Visa implies the agent takes part in, and complies with, the VIC program requirements [src-visa-tap-spec].
- **Standards status.** TAP is not an IETF document. It is a Visa specification published on the Visa Developer Center. The release says the initial specifications apply to the Visa network "in this phase" and that Visa is committed to aligning with IETF, the OpenID Foundation and EMVCo [src-visa-tap-pr]. The specification says the agent recognition signature is based on RFC 9421 (spelled "RCF 9421" on the page) "and aligned with web-bot-auth" [src-visa-tap-spec].
- **Product Terms (dated 2025-10-10).** Access to the specification and the sample code is subject to the Visa Developer Center Terms of Use plus the TAP Product Terms. The license is nonexclusive, non-sublicensable (with a narrow end-user exception), nontransferable and revocable. It is conditioned on implementing "the most current version of the Specification in its entirety in strict conformance". Modifications are not allowed except implementation or porting; unpermitted modifications are assigned to Visa. Implementers must apply each "Visa Update" at least annually and within six months of its publication. Production use does not require Visa's Solution Approval review. The implementer is responsible for consumer disclosures and consents [src-visa-tap-terms].
- **License ambiguity.** Every source file in the sample repository (37 files) starts with "© 2025 Visa." followed by MIT-style permission text, while `LICENSE.md` points to the proprietary Developer Center terms and Product Terms; GitHub reports no recognized license [src-visa-tap-repo-license] [src-visa-tap-gh-meta]. The Product Terms text governs according to `LICENSE.md`; the conflict is logged in `research/conflicts.md`.
- **Related repositories.** `visa/mcp` now resolves to `visa/ai` ("Integration toolkit for connecting AI agents to the Visa Intelligent Commerce platform"), created 2025-11-05, MIT license [src-visa-ai-repo]. `visa/vic-reference-agent` (created 2026-01-23, described on GitHub as an "Open source reference app") carries a proprietary "VIC Reference Agent License Agreement": evaluation and testing only, test data only, revocable; GitHub reports no recognized license [src-visa-vic-ref-agent]. Its code was not read.

## Versions and changelog

- **No version number.** Neither the specification page nor the repository carries a version number, a revision date or a changelog. The specification page shows no publication or modification date [src-visa-tap-spec]. The Product Terms are dated 2025-10-10 [src-visa-tap-terms].
- **Repository history (GitHub API).** All 6 commits [src-visa-tap-gh-meta]:

| Commit | Date (UTC) | Message |
| --- | --- | --- |
| `7e48da2` | 2025-10-12T22:26:29Z | Initial commit Readme |
| `5c1b21a` | 2025-10-12T22:43:44Z | initialize license and update readme |
| `891c8d7` | 2025-10-13T18:51:50Z | Add Sample implementation of Trusted Agent Protocol |
| `038955e` | 2025-10-13T19:49:51Z | Merge pull request #1 |
| `7c8b407` | 2025-10-28T21:13:19Z | Adding nonce validation sample code. |
| `16d59bd` | 2025-10-28T22:43:43Z | Merge pull request #3 |

- **No merges since 2025-10-28.** Seventeen later pull requests from outside contributors were opened and none was merged as of 2026-10-11, including #11 "Feat/x402 implementation" (2026-02-18), #18 "DID-based key_id resolution + Ed25519+ML-DSA-65 hybrid algorithm" (closed 2026-05-02) and #21 "make signature verifier RFC 9421-conformant" (2026-07-15, open) [src-visa-tap-gh-meta].
- **Open issues that ask for spec clarity.** #23 (2026-07-18): the object signature base for the Consumer Recognition Object and Payment Container is under-specified; it asks for a worked example or test vector. #26 (2026-09-18): what standing a payment instruction has after the originating agent is revoked. #8 (2025-12-26): commit-time authorization semantics [src-visa-tap-gh-meta].
- **Related dated changes outside the repository.** See "Key dates" in the seed audit; these come from Visa and partner announcements, not from a TAP changelog.

## Actors and roles

From the "Participants" section of the specification [src-visa-tap-spec] and the Cloudflare post [src-visa-tap-cf-blog]:

| Role | Definition (paraphrased from the spec) | Notes |
| --- | --- | --- |
| Agent Provider (Agent) | Certified AI platforms onboarded as an "Agent" to Payment Schemes and approved to pay on behalf of account holders | Signs requests and body objects with a registered key |
| Checkout Enabler | Intermediary an agent may use to reach merchant sites | Only expectation: pass through message signatures and query parameters unchanged |
| Consumer | Account holder of a Payment Scheme with a profile at an Agent and at least one linked payment credential | Not a signer in TAP |
| Site Protection Provider | Layer in front of the merchant site: CDN, trust management system or proxy | May verify signatures on the merchant's behalf (Cloudflare, later Akamai) |
| Identity Provider | Entity that verified the consumer's credentials and can supply a verifiable value | For VIC, Visa issues the ID Token |
| Merchant | Online seller that accepts scheme credentials through its acquirer | Not required to adopt TAP or register with the scheme; may present an agent-specific experience |
| Payment Scheme | Sets rules, standards and infrastructure for agent-initiated transactions | Visa for TAP; hosts the key store |
| Key Store | Web location where merchants or site protection providers retrieve public keys | Visa: `https://mcp.visa.com/.well-known/jwks` |

The seed list (Agent Provider, Checkout Enabler, Merchant, Site Protection Provider, Payment Scheme) is confirmed; the spec also names Consumer, Identity Provider and Key Store.

The sample repository models five services: TAP Agent (Streamlit, port 8501), Merchant Frontend (React, 3001), Merchant Backend (FastAPI, 8000), CDN Proxy (Node.js, 3001 per `.env.example`) and Agent Registry (FastAPI) [src-visa-tap-repo]. The registry port differs by file: `.env.example` says 8001, the README says 8080, `main.py` binds 9002 and the CDN proxy calls `http://localhost:9002` [src-visa-tap-agent-registry] [src-visa-tap-cdn-proxy].
