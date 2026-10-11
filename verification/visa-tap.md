# Verification report: visa-tap

Verifier: independent verifier agent, 2026-10-11. Scope per `docs/briefs/VERIFIER_BRIEF.md` (ATLAS_PROMPT.md Section 5.3), plus ATLAS_FOLLOWUP.md Section 2, ATLAS_ERRATA.md rows that touch TAP, and `src/playgrounds/visa-tap/`.

Status: in progress. Sections below are filled as each check completes.

## Sources fetched
- Visa TAP merchant specification page, fetched 2026-10-11 with curl (HTTP 200, 57,571 bytes): https://developer.visa.com/capabilities/trusted-agent-protocol/trusted-agent-protocol-specifications

## Check 1: claims against sources

Referenced from keyFacts, facts.json, faq.json, quiz.json, flashcards.json: 86 claims, all checked. Random sample (seed 20261011) of 40 from the other 151. All source ids resolve (five via `src/content/sources/sources.json`). No `verified` claim relies only on non-primary sources.

| Claim | Set | Verdict | Evidence | Claim text (start) |
|---|---|---|---|---|
| clm-visa-tap-001 | ref | pass | TAP spec page fetched 2026-10-11, matching section | The Trusted Agent Protocol (TAP) is a Visa specification that lets an AI agent prove its identity to a merchan |
| clm-visa-tap-002 | ref | pass | spec has no payment movement; VIC page carries tokens and controls | TAP identifies agents; it does not move money by itself. |
| clm-visa-tap-003 | ref | pass | spec and terms on developer.visa.com; no IETF document | TAP is not an IETF standard; it is published by Visa on the Visa Developer Center under Visa's own terms. |
| clm-visa-tap-004 | ref | pass | businesswire id 20251014974512 in pr.html | Visa announced the Trusted Agent Protocol on 2025-10-14. |
| clm-visa-tap-005 | ref | pass | PR: "developed in collaboration with Cloudflare" | Visa says TAP was developed in collaboration with Cloudflare. |
| clm-visa-tap-006 | ref | pass | PR lists the 12 names exactly | Visa's launch release names Adyen, Ant International, Checkout.com, Coinbase, CyberSource, Elavon, Fiserv, Mic |
| clm-visa-tap-007 | ref | pass | overview: "Enhancing Visa Intelligent Commerce" | Visa presents TAP as an enhancement to Visa Intelligent Commerce (VIC). |
| clm-visa-tap-008 | ref | pass | VIC PR businesswire 20250430580204 | Visa unveiled Visa Intelligent Commerce on 2025-04-30. |
| clm-visa-tap-009 | ref | pass | overview: "in the process of development and deployment ... May not be available in all markets" | The TAP overview page says the product is in the process of development and deployment and may not be availabl |
| clm-visa-tap-010 | ref | pass | PR: "aligning closely with global standards bodies like IETF, OpenID Foundation and EMVCo" | Visa's launch release says Visa is committed to aligning with standards bodies such as the IETF, the OpenID Fo |
| clm-visa-tap-011 | ref | pass | PR: "initial specifications apply to the Visa network in this phase" | Visa's launch release says the initial TAP specifications apply to the Visa network in this phase. |
| clm-visa-tap-012 | ref | pass | product-terms HTML: "October 10, 2025" | The TAP Product Terms are dated 2025-10-10. |
| clm-visa-tap-013 | ref | pass | terms section 1 | The TAP Product Terms grant a nonexclusive, non-sublicensable, nontransferable and revocable license. |
| clm-visa-tap-014 | ref | pass | terms section 1 "in its entirety in strict conformance" | The TAP license is conditioned on implementing the most current version of the specification in its entirety a |
| clm-visa-tap-016 | ref | pass | terms: "at least annually" and "within six months" | Implementers must apply each Visa update to TAP at least annually and within six months of its publication. |
| clm-visa-tap-019 | ref | pass | research/vendor/visa-trusted-agent-protocol/LICENSE.md | The reference repository visa/trusted-agent-protocol has no open source license; its LICENSE.md binds users to |
| clm-visa-tap-020 | ref | pass | cdn-proxy/server.js lines 1-8 MIT text | Source files in the TAP sample repository start with a Visa copyright line followed by MIT-style permission te |
| clm-visa-tap-021 | ref | pass | gh api: license NOASSERTION | GitHub reports the license of visa/trusted-agent-protocol as unrecognized (NOASSERTION). |
| clm-visa-tap-023 | ref | pass | no version or date string in spec.html | The TAP specification page carries no version number and no publication date. |
| clm-visa-tap-024 | ref | pass | gh api commits: 6, 2025-10-12..2025-10-28; tags 0, releases 0 | The TAP reference repository has six commits, dated 2025-10-12 to 2025-10-28, and no tags or releases. |
| clm-visa-tap-025 | ref | pass | 7c8b407 "Adding nonce validation sample code", merged 16d59bd 2025-10-28 | The last commit to the TAP reference repository, which added nonce validation sample code, was merged on 2025- |
| clm-visa-tap-026 | ref | pass | gh api pulls: #4,5,6,7,9,11,12,17,18,19,20,21 = 12, none merged | As of 2026-10-11, no pull request to the TAP reference repository has been merged since 2025-10-28; twelve lat |
| clm-visa-tap-027 | ref | pass | PR #21 opened 2026-07-15, open | An open pull request opened on 2026-07-15 proposes making the sample merchant signature verifier conform to RF |
| clm-visa-tap-034 | ref | pass | TAP spec page fetched 2026-10-11, matching section | The TAP specification says merchants are not required to use the protocol and need not register with payment s |
| clm-visa-tap-037 | ref | pass | TAP spec page fetched 2026-10-11, matching section | TAP's agent recognition signature uses the RFC 9421 Signature-Input and Signature header fields. |
| clm-visa-tap-038 | ref | pass | TAP spec page fetched 2026-10-11, matching section | The minimum covered components of a TAP message signature are @authority and @path. |
| clm-visa-tap-039 | ref | pass | TAP spec page fetched 2026-10-11, matching section | A TAP message signature must carry the parameters created, expires, keyid, alg, nonce and tag. |
| clm-visa-tap-040 | ref | pass | TAP spec page fetched 2026-10-11, matching section | TAP defines two tag values: agent-browser-auth for browsing and agent-payer-auth for checkout and payment. |
| clm-visa-tap-041 | ref | pass | TAP spec page fetched 2026-10-11, matching section | Under TAP, a request whose Signature-Input carries neither agent-browser-auth nor agent-payer-auth has not bee |
| clm-visa-tap-042 | ref | pass | TAP spec page fetched 2026-10-11, matching section | TAP defines the nonce as a session identifier that is reused across all message signatures in the header and i |
| clm-visa-tap-043 | ref | pass | TAP spec page fetched 2026-10-11, matching section | TAP requires the created and expires timestamps to be no more than 8 minutes apart. |
| clm-visa-tap-044 | ref | pass | TAP spec page fetched 2026-10-11, matching section | The TAP specification's header examples use alg="Ed25519" for the message signature. |
| clm-visa-tap-045 | ref | pass | TAP spec page fetched 2026-10-11, matching section | The TAP specification's body object examples use alg "PS256". |
| clm-visa-tap-047 | ref | pass | TAP spec page fetched 2026-10-11, matching section | The TAP consumer recognition object, agenticConsumer, contains at least nonce, idToken, contextualData, kid, a |
| clm-visa-tap-048 | ref | pass | TAP spec page fetched 2026-10-11, matching section | TAP's contextualData object contains countryCode, zip, ipAddress and deviceData. |
| clm-visa-tap-050 | ref | pass | TAP spec page fetched 2026-10-11, matching section | The TAP ID Token is a JWT per RFC 7519 that is compatible with an OpenID Connect ID Token and is signed by Vis |
| clm-visa-tap-051 | ref | pass | TAP spec page fetched 2026-10-11, matching section | The TAP ID Token header requires alg, kid and typ, with typ JWT+ext.id_token and the none algorithm not suppor |
| clm-visa-tap-056 | ref | pass | TAP spec page fetched 2026-10-11, matching section | The TAP payment container, agenticPaymentContainer, contains at least nonce, kid, alg and signature. |
| clm-visa-tap-057 | ref | pass | TAP spec page fetched 2026-10-11, matching section | A TAP payment container can also carry paymentCredentialsHash, cardMetadata, an encrypted payload or a browsin |
| clm-visa-tap-062 | ref | pass | TAP spec page fetched 2026-10-11, matching section | TAP's browsingIOU contains invoiceId, amount, cardAcceptorId, acquirerId, uri, sequenceCounter, paymentService |
| clm-visa-tap-063 | ref | pass | TAP spec page fetched 2026-10-11, matching section | TAP's browsingIOU is present when a merchant has asked for payment with an HTTP 402 response. |
| clm-visa-tap-069 | ref | pass | TAP spec page fetched 2026-10-11, matching section | TAP says Visa hosts its public keys at https://mcp.visa.com/.well-known/jwks. |
| clm-visa-tap-071 | ref | pass | JWKS fetched 2026-10-11: 1 RSA key, 2048-bit modulus | On 2026-10-11, https://mcp.visa.com/.well-known/jwks returned a JWK Set with one 2048-bit RSA key and no Ed255 |
| clm-visa-tap-072 | ref | pass | no alg/use; x5c subject CN=vic-oauth-jwe.visa.com, issuer CN=Visa Sandbox Issuing CA | On 2026-10-11, the single key at Visa's well-known JWKS had no alg or use member and carried a certificate for |
| clm-visa-tap-074 | ref | pass | spec names only the well-known URL; JWKS holds no agent key | Visa has not published how production TAP agent keys are distributed beyond the well-known JWKS. |
| clm-visa-tap-078 | ref | pass | TAP spec page fetched 2026-10-11, matching section | A TAP consumer recognition object or payment container is signed with the same private key as the message sign |
| clm-visa-tap-083 | ref | pass | TAP spec page fetched 2026-10-11, matching section | With a browsingIOU, the merchant checks the IOU against its 402 response and the signature, then grants access |
| clm-visa-tap-090 | ref | pass | TAP spec page fetched 2026-10-11, matching section | TAP places its two signed objects in the HTTP request body and its agent signature in HTTP headers. |
| clm-visa-tap-095 | ref | pass | TAP spec page fetched 2026-10-11, matching section | TAP does not require a Content-Digest, so the request body is not covered by the TAP message signature. |
| clm-visa-tap-104 | ref | pass | datatracker lists only -00; txt dated 1 September 2026 | The IETF Web Bot Auth working group draft draft-ietf-webbotauth-httpsig-protocol-00 was posted on 2026-09-01 a |
| clm-visa-tap-106 | ref | pass | 2025-10-14 vs 2026-09-01 (10.6 months) | TAP launched almost eleven months before the Web Bot Auth working group draft -00, so that draft is not the ba |
| clm-visa-tap-107 | ref | pass | spec: "RCF 9421 [and aligned with web-bot-auth]" | The TAP specification says its agent recognition signature is based on RFC 9421 and aligned with web-bot-auth. |
| clm-visa-tap-108 | ref | pass | draft-00 s5.2: "tag MUST be web-bot-auth" | TAP does not conform to the Web Bot Auth working group draft: the draft requires tag web-bot-auth while TAP us |
| clm-visa-tap-109 | ref | pass | draft-00: "A signed request MUST carry the Signature-Agent header"; TAP minimum lacks it (note: TAP spec prose on the base string mentions "signature agent") | The Web Bot Auth working group draft requires a Signature-Agent header that the signature covers; TAP's requir |
| clm-visa-tap-111 | ref | pass | draft-00: "document defines no additional nonce requirements" | TAP requires a nonce, while the Web Bot Auth working group draft adds no nonce requirement beyond RFC 9421. |
| clm-visa-tap-112 | ref | pass | draft-00 s8.1 well-known URI | The Web Bot Auth working group draft serves keys at /.well-known/http-message-signatures-directory, while Visa |
| clm-visa-tap-113 | ref | pass | draft-00: "RECOMMENDED that expiry be no more than 24 hours" | The Web Bot Auth working group draft recommends an expiry of no more than 24 hours, while TAP allows at most 8 |
| clm-visa-tap-114 | ref | pass | draft-00 E.2.2 has same keyid, created, expires, nonce, Signature | The example keyid, nonce, timestamps and Signature value in the TAP specification are the same values as a tes |
| clm-visa-tap-115 | ref | pass | 1735693200-1735689600=3600 | The TAP specification's own example has created and expires 3,600 seconds apart, which breaks its 8-minute rul |
| clm-visa-tap-116 | ref | pass | browsing and checkout examples share Signature value | The TAP specification shows the same Signature value for its browsing and checkout examples although their tag |
| clm-visa-tap-117 | ref | pass | TAP spec page fetched 2026-10-11, matching section | TAP's minimum covered components do not include @method, the query string or a content digest. |
| clm-visa-tap-129 | ref | pass | VIC page: controls, step-up, passkey | Spending limits, consent capture and step-up authentication sit in Visa Intelligent Commerce, not in TAP. |
| clm-visa-tap-135 | ref | pass | verified-bots page: "As of July 1, 2026 ... Direct versus Intermediary access" | Since 2026-07-01 Cloudflare treats signed agents as verified bots, distinguished by a Direct versus Intermedia |
| clm-visa-tap-140 | ref | pass | VIC dev page: step up verification and Passkey | Visa Intelligent Commerce provisions agent-specific payment tokens after step-up verification of the cardholde |
| clm-visa-tap-141 | ref | pass | VIC dev page: "authenticate the Payment Instruction using their Passkey" | In Visa Intelligent Commerce the user authenticates each Payment Instruction with a passkey before the agent r |
| clm-visa-tap-154 | ref | pass | ICC release (businesswire 20260408772335) lists TAP, MPP, ACP, UCP | Visa unveiled Intelligent Commerce Connect on 2026-04-08 as a pilot that lets merchants accept agent payments  |
| clm-visa-tap-156 | ref | pass | release businesswire 20260610464331, Visa Payments Forum | Visa announced the Agentic Directory and Agent Score on 2026-06-10 at Visa Payments Forum. |
| clm-visa-tap-157 | ref | pass | jun10 release text | Visa describes the Agentic Directory as including agents and merchants that Visa has verified as legitimate pa |
| clm-visa-tap-158 | ref | pass | jun10 release: "Created with New Generation" | Visa's Agent Score, created with New Generation, lets merchants evaluate whether AI agents can navigate and co |
| clm-visa-tap-159 | ref | pass | EU release: "enabled through Visa's Trusted Agent Protocol (TAP) and Agent Directory" | Visa's 2026-07-02 release says merchant participation in live European agent purchases was enabled through TAP |
| clm-visa-tap-160 | ref | pass | EU release names the four merchants | Visa names lastminute.com, Frasers, Cleverbridge and BrickDepot as merchants in its live European agentic tran |
| clm-visa-tap-161 | ref | pass | PYMNTS: eDreams, Opodo, GO Voyages, Travellink; "Friday (July 3)"; reported is right | eDreams ODIGEO announced on 2026-07-03 that it uses Visa's TAP and Agentic Directory to recognize verified AI  |
| clm-visa-tap-162 | ref | pass | research/vendor/mppx/src/tap/Constants.ts (8*60, both tags) | The mppx SDK includes a TAP attestation profile with tags agent-browser-auth and agent-payer-auth and a defaul |
| clm-visa-tap-163 | ref | pass | mpp blog publishedAt "2026-08-12" | Tempo's MPP blog announced TAP and Web Bot Auth request attestation in mppx on 2026-08-12. |
| clm-visa-tap-169 | ref | pass | Worldpay 2026-07-30: "No liability shift exists yet." | Worldpay wrote on 2026-07-30 that no liability shift for agentic transactions exists yet. |
| clm-visa-tap-170 | ref | pass | Worldpay: "liability generally follows existing tokenized-transaction rules" | Worldpay says properly authenticated, correctly tokenized agent transactions follow existing tokenized-transac |
| clm-visa-tap-179 | ref | pass | businesswire 20260429232971: "more than 20 partners", "85+ partners" | Visa expanded Agentic Ready to Asia Pacific and Latin America on 2026-04-29, saying it was live with more than |
| clm-visa-tap-180 | ref | pass | EU release issuer list counts 31 | Visa's 2026-07-02 release names 31 European issuers that completed live agent-executed transactions at partici |
| clm-visa-tap-181 | ref | pass | EU release: "an advance beyond testing at controlled storefronts" | Visa's live European agent transactions announced on 2026-07-02 took place at merchant websites rather than co |
| clm-visa-tap-183 | ref | pass | Visa post dated 03/18/2026 (WebFetch): "built on top of ... Visa Intelligent Commerce and the Trusted Agent Protocol" | Visa's 2026-03-18 post says its MPP card spec and SDK are built on Visa Intelligent Commerce and the Trusted A |
| clm-visa-tap-185 | ref | pass | mpp-specs draft-card-charge-00.md front matter: Jacob Brans, Visa | The MPP card method draft draft-card-charge-00 is authored by Jacob Brans of Visa. |
| clm-visa-tap-186 | ref | pass | draft line 98; present in init commit b3bc1ab | draft-card-charge-00 says a client may include Trusted Agent Protocol signature headers for additional identit |
| clm-visa-tap-200 | ref | pass | Stripe blog datePublished 2026-03-03 | Stripe added support for Visa Intelligent Commerce and Mastercard Agent Pay agentic network tokens to its Shar |
| clm-visa-tap-201 | ref | pass | Stripe: "agentic network tokens"; VIC page "agent-specific payment tokens"; Mastercard page 403 (reported is right) | Visa's own wording for its agent credentials is agentic network tokens or agent-specific payment tokens, while |
| clm-visa-tap-220 | ref | pass | Mastercard Level 1 guide: "Mastercard Agent Pay : Agent-pay-auth" | Mastercard's Level 1 guide says Agent Pay agents use the single tag value Agent-pay-auth, while agent-browser- |
| clm-visa-tap-233 | ref | pass | spec Introduction paragraphs 2 and 4 | The TAP specification targets agents that are initially unknown to the merchant, and merchants that have not a |
| clm-visa-tap-015 | sample | pass | terms "Modifications" section | The TAP Product Terms forbid modifications to the specification or sample code, apart from implementing or por |
| clm-visa-tap-018 | sample | pass | terms disclosures and consents paragraph | Under the TAP Product Terms the implementer alone is responsible for disclosures to users and for collecting a |
| clm-visa-tap-022 | sample | pass | gh api created_at 2025-10-10T02:05:59Z | The visa/trusted-agent-protocol repository was created on GitHub on 2025-10-10. |
| clm-visa-tap-030 | sample | pass | TAP spec page fetched 2026-10-11, matching section | The TAP specification names these participants: Agent Providers, Checkout Enablers, Consumers, Site Protection |
| clm-visa-tap-033 | sample | pass | TAP spec page fetched 2026-10-11, matching section | TAP defines Site Protection Providers as layers in front of a merchant site, such as CDNs, trust management sy |
| clm-visa-tap-035 | sample | pass | TAP spec page fetched 2026-10-11, matching section | Verification of TAP signatures can be done by the merchant itself or by a Site Protection Provider on its beha |
| clm-visa-tap-052 | sample | pass | TAP spec page fetched 2026-10-11, matching section | The TAP specification prefers PS256 to RS256 for the ID Token signature. |
| clm-visa-tap-055 | sample | pass | TAP spec page fetched 2026-10-11, matching section | Because no identity arrives in the clear, a merchant using the Visa ID Token must keep a table that maps obfus |
| clm-visa-tap-067 | sample | pass | TAP spec page fetched 2026-10-11, matching section | The TAP specification names the credential hash paymentCredentialsHash in its example and credentialHash in it |
| clm-visa-tap-073 | sample | pass | response header cache-control: public, max-age=3600 | Visa's well-known JWKS was served with cache-control public, max-age=3600 on 2026-10-11. |
| clm-visa-tap-079 | sample | pass | TAP spec page fetched 2026-10-11, matching section | The signature base for TAP body objects is all fields in the order received except the signature, with no name |
| clm-visa-tap-085 | sample | pass | Cloudflare blog 2025-10-24 seven checks | Cloudflare's published TAP checks are: headers present, key fetched by keyid, time window, nonce uniqueness, v |
| clm-visa-tap-086 | sample | pass | blog example tag = "web-bot-auth" | Cloudflare's 2025-10-24 post shows an example request with tag web-bot-auth even though its listed checks requ |
| clm-visa-tap-093 | sample | pass | rfc9421.txt header: Standards Track, February 2024 | RFC 9421, HTTP Message Signatures, is a Standards Track RFC dated February 2024. |
| clm-visa-tap-094 | sample | pass | rfc9530.txt header: Obsoletes 3230, Standards Track, February 2024 | RFC 9530, Digest Fields, is a Standards Track RFC dated February 2024 that obsoletes RFC 3230. |
| clm-visa-tap-099 | sample | pass | merchant-backend/app/security/signature_verification.py lines 140-160 | The TAP sample merchant backend builds a signature base with nonce, created and expires lines and no @signatur |
| clm-visa-tap-103 | sample | pass | spec Python sample: f"@authority: {authority}" | The TAP specification's Python sample writes the @authority and @path component names without quotes, unlike R |
| clm-visa-tap-110 | sample | pass | draft-00: keyid MUST be a base64url JWK SHA-256 Thumbprint | The Web Bot Auth working group draft requires keyid to be a base64url JWK SHA-256 thumbprint; TAP treats keyid |
| clm-visa-tap-120 | sample | pass | NVD keywordSearch "Trusted Agent Protocol" 2026-10-11: 1 hit, CVE-2026-100567 (OpenClaw, unrelated). Cited source (GitHub repo) does not document a CVE search; add NVD as source | No CVE naming the Trusted Agent Protocol was found as of 2026-10-11. |
| clm-visa-tap-123 | sample | pass | blog: "Visa and Mastercard will be hosting their own directories" | Cloudflare says Visa and Mastercard each host their own directory for agents registered with them. |
| clm-visa-tap-127 | sample | pass | TAP spec page fetched 2026-10-11, matching section | TAP's replay protection is partial because nonce tracking is optional for the verifier. |
| clm-visa-tap-134 | sample | pass | Cloudflare field reference: "Requires a Cloudflare Enterprise plan with Bot Management enabled" | Cloudflare exposes a cf.bot_management.signed_agent field for Web Bot Auth agents, which requires an Enterpris |
| clm-visa-tap-144 | sample | pass | VIC dev page: "guest checkout, key entry (form fill)" | The VIC developer page says payments are initially made through guest checkout with key entry (form fill). |
| clm-visa-tap-152 | sample | pass | EU release: "supported by infrastructure providers including Cloudflare and Akamai" | Visa's 2026-07-02 release says Cloudflare and Akamai support TAP implementation at the infrastructure level. |
| clm-visa-tap-155 | sample | pass | ICC release partner list | Visa's 2026-04-08 release names Aldar, AWS, Diddo, Highnote, Mesh, Payabli and Sumvin as Intelligent Commerce  |
| clm-visa-tap-166 | sample | pass | no fee term in product terms | The TAP Product Terms state no license fee. |
| clm-visa-tap-168 | sample | unreachable | merchantcostconsulting.com HTTP 403 (curl and WebFetch) | A Merchant Cost Consulting article of 2026-05-01 reports that no new agentic interchange categories had been d |
| clm-visa-tap-171 | sample | pass | no such item in VIC page or terms | No agent-specific interchange, token fee or liability allocation for TAP appears in Visa's public material as  |
| clm-visa-tap-175 | sample | pass | dec18 release (businesswire 20251218812271) | Visa said on 2025-12-18 that it works with more than 100 partners on agentic commerce, with over 30 building i |
| clm-visa-tap-191 | sample | fail | cited README has no 402 or X-Payment text; the behavior is in merchant-backend/app/routes/cart.py lines 484-618. Fix the source, not the text | The TAP sample merchant returns HTTP 402 with an ad hoc JSON body and X-Payment headers rather than the x402 w |
| clm-visa-tap-199 | sample | pass | blog: "Both protocols build on Web Bot Auth by introducing a new tag ... nonce" | Cloudflare says Visa's TAP and Mastercard's Agent Pay both build on Web Bot Auth by adding a tag for browsing  |
| clm-visa-tap-205 | sample | pass | spec: "goal would be to have a shared approach"; blog: own directories | TAP's specification says a shared key-store approach across payment schemes is a goal, but today each network  |
| clm-visa-tap-207 | sample | pass | arXiv HTML 2606.08790 names Visa's Trusted Agent Protocol 6 times | The arXiv paper 2606.08790, RAILS: Verification-Native Clearing For Agentic Commerce, names Visa's Trusted Age |
| clm-visa-tap-210 | sample | pass | Crossref: FC 2010, LNCS, Murdoch and Anderson | Murdoch and Anderson analyzed Verified by Visa and MasterCard SecureCode at Financial Cryptography 2010. |
| clm-visa-tap-211 | sample | pass | Crossref: PoPETs 2018 | Privacy Pass: Bypassing Internet Challenges Anonymously appeared in Proceedings on Privacy Enhancing Technolog |
| clm-visa-tap-215 | sample | fail | cited file (blog mppx-identity-support.mdx) does not say this; the sentence is in research/vendor/mpp/src/pages/advanced/identity.mdx line 23. Same issue for clm-visa-tap-213 (line 158 of identity.mdx) | The MPP documentation says a request attestation does not authorize a payment or prove the end user's identity |
| clm-visa-tap-221 | sample | pass | host agentpay-key-directory.mastercard.com: NXDOMAIN 2026-10-11 | The only Mastercard key directory host in Mastercard's guide, agentpay-key-directory.mastercard.com, did not r |
| clm-visa-tap-222 | sample | pass | cdn-proxy/server.js lines 108-140 (rate limit commented), nonce stored line 506 before verification | The TAP sample CDN proxy records a nonce before it verifies the signature and has its rate limiting commented  |
| clm-visa-tap-225 | sample | pass | overview three information kinds | Visa's TAP overview describes three kinds of verifiable information: agent intent, consumer recognition and pa |
| clm-visa-tap-236 | sample | pass | overview: "Historically, merchants and their proxies ..." | Visa's TAP overview says merchants and their proxies, such as CDNs and bot mitigation services, have historica |

Totals: 126 checked, 123 pass, 2 fail, 1 unreachable.

### asOf rule (literal)

The brief fails a claim that carries a number or date without `asOf`. All such dates checked above are correct (fixed events or spec constants such as the 8-minute window). Claims with an explicit date or count and no `asOf`: see the list in "Required fixes" (item 6). Treated as a rule-level finding, not counted as a content failure, consistent with `verification/erc-8004.md`.
