# Publications, part a: protocol analyses and measurements, agent identity and delegation

Research log for `research/publications.a.json`. Generated 2026-10-10. Scope: the first two groups of ATLAS_PROMPT.md Section 10.2.

## Counts

- Seed entries in scope: 38 (22 protocol analyses and measurements, 16 agent identity and delegation).
- Seed entries verified: 38. Unverified: 0.
- New entries found and verified on 2026-10-10: 25 (14 protocol analyses, 11 identity and delegation).
- Total in `publications`: 63. Peer reviewed (confirmed venue): 9. Grey literature: 1 (OpenID Foundation whitepaper).
- Relation split: direct 27, related 29, foundation 6, grey 1.

## Verification method

- Every arXiv ID was resolved twice: through the arXiv Atom API (`export.arxiv.org/api/query?id_list=`) and through DataCite (`api.datacite.org/dois/10.48550/arXiv.<id>`). Title, author list, submission date, primary category and (where present) DOI, journal reference and author comment were read from the arXiv record; the DataCite title was compared against it. All 62 arXiv IDs returned HTTP 200 on both services with matching titles.
- Every non-arXiv DOI was resolved with DOI content negotiation (`Accept: application/vnd.citationstyles.csl+json`): 10.1145/3630106.3658948 (ACM FAccT 2024), 10.14722/ndss.2014.23212 (NDSS 2014, Internet Society), 10.1007/978-3-032-15632-7_25 (Springer CCIS), 10.34900/jfda.v1i2.1411 (Journal of FinTech and Digital Assets), 10.1109/IMNS67862.2026.11655291 (IEEE IMNS 2026), 10.5220/0014234400004052 (SCITEPRESS, ICAART 2026), 10.3389/fcomp.2026.1966725 (Frontiers in Computer Science), 10.7910/DVN/HJZW8Q (Harvard Dataverse dataset).
- Publisher pages used for venue confirmation: usenix.org technical sessions page for USENIX Security 2026 (lists "When HTTP 402 Meets the Blockchain" with authors Wang, Yang, Chen, Ji, Payer); jmlr.org TMLR BibTeX record Ckh17xN2R2 for "Infrastructure for AI Agents".
- `peerReviewed` is true only where a publisher or DOI record confirms the venue. Author comments on arXiv such as "accepted to workshop X" were not treated as confirmation; they are noted inside the summary instead.
- Summaries were written from the arXiv abstracts. Numbers quoted in summaries come from those abstracts and are attributed to the paper, as of its arXiv version date.

## Corrections to seed entries

1. Vaziry, Rodriguez Garzon, Küpper (arXiv:2507.19550). The seed used the arXiv title "Towards Multi-Agent Economies: Enhancing the A2A Protocol with Ledger-Anchored Identities and x402 Micropayments for AI Agents" and year 2025. The peer-reviewed version (DOI 10.1007/978-3-032-15632-7_25, Springer CCIS, IJCCI 2025, pp. 454-472) is titled "Enhancing the A2A Protocol with Blockchain-Based Identities and x402 Micropayments for Agentic AI" and was issued in 2026. The record uses the published title and year and names the arXiv title in the summary. ID: `pub-vaziry-2026-a2ax402`.
2. Debi, Zhu, Gupta (arXiv:2601.22569). The seed used the arXiv title "Whispers of Wealth: Red-Teaming Google's Agent Payments Protocol via Prompt Injection". The IEEE version (DOI 10.1109/IMNS67862.2026.11655291, IMNS 2026, pp. 1-6) is titled "Whispers of Wealth: A Systematic Red-Teaming Study of the Agent Payments Protocol (AP2)". The record uses the published title and names the arXiv title in the summary. ID: `pub-debi-2026-whispers`.
3. Rodriguez Garzon et al. (arXiv:2511.02841). Seed year 2025 (arXiv v1 2025-10-01). The confirmed venue is ICAART 2026 (DOI 10.5220/0014234400004052, pp. 252-259), so the record year is 2026. Title unchanged.
4. Mafrur, Khusumanegara (arXiv:2606.12128). The seed flagged "[verify on arxiv.org]". Verified on arXiv and DataCite, and additionally confirmed as published in the Journal of FinTech and Digital Assets, vol. 1, no. 2, pp. 69-88 (DOI 10.34900/jfda.v1i2.1411, issued 2026-09-01). Marked peer reviewed.

Minor title differences (seed used a shortened title; record uses the full arXiv title, no ID problem):

- 2509.25974: full title is "OpenID Connect for Agents (OIDC-A) 1.0: A Standard Extension for LLM-Based Agent Identity and Authorization".
- 2510.25819: full title is "Identity Management for Agentic AI: The new frontier of authorization, authentication, and security for an AI agent world".
- 2607.23207: arXiv punctuates the title as "Accountable yet Anonymous AI Agents - Split-Knowledge Binding in National Agent-Identity Layer in China" (hyphen rather than colon).
- 2408.07892: full title is "Personhood credentials: Artificial intelligence and the value of privacy-preserving tools to distinguish who is real online".

No seed ID resolved to an unrelated paper. No title searches were needed.

## Venue and status notes

- 2607.19545 (Wang et al.): arXiv journal reference says USENIX Security 2026; confirmed on the USENIX technical sessions page on 2026-10-10. Peer reviewed.
- 2501.10114 (Chan et al.): "Accepted to TMLR" confirmed by the jmlr.org TMLR bib record. Peer reviewed.
- 2406.12137 (Chan et al., IDs for AI Systems): author comment says accepted at the RegML workshop at NeurIPS 2024; no publisher record found, so no venue is shown and peerReviewed is false.
- 2511.03434 (Hu, Rong): "Submitted to AAAI 2026 Workshop on Trust and Control in Agentic AI"; submission only, no venue shown.
- 2605.00071 (See, Tan): comment says "Demo Paper Track" without naming the venue; no venue shown.
- 2604.22652 (Liu): the arXiv DOI field holds a Harvard Dataverse dataset DOI (10.7910/DVN/HJZW8Q, "Replication Data for: ..."), not a paper DOI. Recorded in the summary rather than in the `doi` field.
- 2510.25819 (South et al.): OpenID Foundation whitepaper, recorded as grey literature (relation `grey`), venue taken from the arXiv journal reference.
- 2609.22944 (NostrAgent) and 2608.04292 (BIND): author comments report acceptance at AGENTICS 2026 and IJCB 2026 respectively; not confirmed by publisher records as of 2026-10-10, so peerReviewed is false and the claim is noted in the summary.
- 2609.02208 (Agentic Settlement Protocol): arXiv author metadata lists the first author as two single-word entries ("Behnam", "Mohammadkhani"); recorded as one name, as it appears on the abstract page. Flag for a later check against the PDF.
- 2607.21325: full author names (Mar Llambí-Morillas, Daniel Fernández-Fernández) come from the Frontiers DOI record; arXiv lists initials.

## Name clashes flagged

- "ACP": Mao et al. (2604.15367) write "Agent Commerce Protocol (ACP)"; Kang and Diponegoro (2606.31498) analyze an agent interoperability protocol called ACP. Neither is confirmed to be OpenAI's Agentic Commerce Protocol (`openai-acp`). Jiang et al. (2609.00060) model "ACP" alongside x402, MPP and AP2 as an agent payment protocol, which matches the OpenAI and Stripe Agentic Commerce Protocol; mapped to `openai-acp` on that basis.
- RAILS (2606.08790) names "Visa" and "Mastercard" network agent protocols generically; mapped to `visa-tap` and `mastercard-agent-pay` with a note.
- Louck (2607.21824) studies "three leading platforms" without naming them in the abstract; protocol mapping marked unconfirmed in the whyItMatters line.

## New entries (searched on 2026-10-10)

Searches run on the arXiv API, sorted by submission date: `x402`; `ERC-8004 OR ERC8004`; `"Agent Payments Protocol" OR "agentic payments" OR "agentic payment"`; `"agentic commerce" OR "agent payments"` (abstracts); identity and delegation terms (`"agent identity"`, `"delegated authorization"`, `"authenticated delegation"`, `"delegation chain"` combined with agent terms); `"Trusted Agent Protocol" OR "Web Bot Auth" OR "HTTP Message Signatures" OR "agent passport"`; `"Universal Commerce Protocol" OR "Agentic Commerce Protocol" OR "Machine Payments Protocol" OR "Agent Pay"`.

Added to protocol analyses and measurements (14): 2609.11757 (Louck, Dvir, Stulman, whisper attacks on AP2 with A-VIP defense), 2609.02208 (Agentic Settlement Protocol), 2608.30519 (Authority-Inference Separation), 2608.01341 (402Pilot), 2606.25876 (Web4 Agent Economy measurement), 2607.00245 (Agent-to-Agent Finance), 2606.08790 (RAILS), 2603.16899 (Capability-Priced Micro-Markets), 2604.02023 (APEX), 2511.15712 (Acharya), 2606.31498 (Governance Gaps), 2609.10871 (A2ABreak), 2609.14744 (Runtime Authorization for Acquired Resources), 2607.18347 (Decision-Centered Reference Architecture).

Added to agent identity and delegation (11): 2609.22944 (NostrAgent), 2609.15906 (Authorization Architectures review), 2608.04292 (BIND), 2607.21325 (Cryptographically Verifiable Agent Authorization, Frontiers), 2604.23280 (AI Identity gap analysis), 2509.13597 (Agentic JWT), 2606.10711 (Agentic Web Normative Infrastructure), 2603.20953 (Open Agent Passport), 2609.11152 (terms.txt), 2606.04193 (Notarized Agents), 2512.15892 (VET).

Seen in searches but left to other groups (not in this part's scope): 2609.02992 (Gatta et al., reputation), 2609.22076 (APort Vault, benchmarks), 2606.24783 (Paying to Know, markets), 2609.35886 (Agentic Commerce Bench), 2605.06457 (workflow fidelity metric, PAKDD 2026 workshop), 2608.02441 (Agentic Commerce World), 2608.00102 (auction benchmark).

## Blocked or failed endpoints

None blocked. The USENIX per-cycle accepted-paper subpages (`cycle-1-accepted-papers`, `summer-accepted-papers`, and so on) returned 404, but the main `technical-sessions` page loaded and contained the listing. No rate limits were hit on arXiv, DataCite or doi.org.

## Open items for the next pass

- Re-check 2609.22944 (AGENTICS 2026, late October 2026) and 2608.04292 (IJCB 2026) for published DOIs.
- Re-check 2511.03434 (TrustAgent workshop) and 2605.00071 (demo track) for a confirmed venue.
- 2607.23207 promises a revised version with post-launch measurements after Q3 2026.
- Confirm the first author's name on 2609.02208 against the PDF.
