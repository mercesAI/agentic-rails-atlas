# Publications, part b: agentic commerce, markets and benchmarks; security of agents; reputation and Sybil resistance

Generated 2026-10-10 by the part-b research agent. Output file: `research/publications.b.json`.

## Counts

- Seed entries in scope: 40 (22 commerce, markets, benchmarks and surveys; 10 security of agents; 8 reputation and Sybil resistance).
- Verified and published: 54 (40 seed entries plus 14 new entries found on 2026-10-10).
- Unverified: 0. Every seed ID resolved and every resolved title matched its seed title (four seed titles were shortened and are recorded in full).
- Peer-reviewed (confirmed venue): 15. Preprints: 39.
- By relation: direct 2, foundation 8, related 44.
- By verification channel: arxiv 39, doi-negotiation 10, publisher 5. Every arXiv-only entry was resolved through the arXiv API (export.arxiv.org); DOI entries through doi.org content negotiation (CSL JSON); conference papers without a DOI through proceedings.neurips.cc or OpenReview records.

## Corrected or extended metadata

- 2505.15799 (Rothschild et al., The Agentic Economy): seed listed it as a 2025 preprint; DOI negotiation on 10.1145/3747175 confirms publication in Communications of the ACM 69(2), pp. 39-42, issued 2026-01-29. Year set to 2026, venue added. It is a four-page CACM piece, so treat the peer-review badge as journal editorial review.
- 2406.12045 (tau-bench): seed listed 2024 with no venue; OpenReview record roNSXZpUDN shows ICLR 2025 poster. Year set to 2025, venue added. Title normalized from the arXiv LaTeX form.
- 2307.13854 (WebArena): seed listed 2023 with no venue; OpenReview record oKn9c6ytLx shows ICLR 2024 poster. Year set to 2024, venue added.
- 2503.18813 (CaMeL, Defeating Prompt Injections by Design): seed listed a 2025 preprint; DOI negotiation on 10.1109/SaTML68715.2026.00040 confirms publication at IEEE SaTML 2026, pp. 587-618. Year set to 2026, venue added.
- 2504.18575 (WASP): seed listed no venue; OpenReview record Ip1cCUAllL shows NeurIPS 2025 Datasets and Benchmarks Track poster. Venue added (the proceedings.neurips.cc 2025 listing was incomplete on 2026-10-10, so OpenReview is the record used).
- 10.18653/v1/2026.acl-long.1009 (Shi, Fang, Chen): seed gave only the DOI; an arXiv title search found the matching preprint arXiv:2606.13686 (same three authors, comment 'Accepted to ACL 2026'). arXiv id added.
- Shortened seed titles recorded in full: WebShop (2207.01206), tau-bench (2406.12045), WebArena (2307.13854), Yang et al. 2026 'Paying for Honesty Without Knowing the Truth: Reputation-Penalty Design for LLM Marketplace Agents' (2607.28330).
- Greshake et al. 2023: the ACM record capitalizes the title 'Not What You've Signed Up For'; arXiv uses 'Not what you've signed up for'. ACM form used.

## Flags and caveats

- 2609.19502 (Chard et al., Cairn): the arXiv comment says '22nd IEEE International Conference on eScience', but the eScience 2026 accepted-papers page (55 main-track and 25 short papers, read 2026-10-10) does not list the title. Recorded as a preprint without venue; re-check when the IEEE proceedings appear.
- 2505.02279 (Ehtesham et al.): its 'ACP' is IBM's Agent Communication Protocol, not OpenAI's Agentic Commerce Protocol. Protocol list left empty; the name clash is stated in whyItMatters.
- 2609.22076 (Uchibeke, APort Vault): the Open Agent Passport specification being benchmarked is the author's own; stated in whyItMatters.
- 2609.33017 (Olieslagers et al.): a vendor evaluation of the authors' own assistant; stated in the summary.
- 2505.15799 / 10.1145/3747175 (Rothschild et al.): a four-page Communications of the ACM piece; peerReviewed is set true on the confirmed journal venue, but it should be read as editorially reviewed rather than a refereed research article.
- 2608.14074 (Racioppi, Mandato): five-page position paper that reports implementation status and an evaluation plan, not results.
- 2610.01756 (Sun et al., SoK): abstract says it examines 12 systems and standards; which ones was not confirmed from the abstract.
- Jøsang, Ismail, Boyd 2007: publisher and ACM pages were blocked, so the abstract was read from the authors' preprint PDF, which states 'Preprint of article published in Decision Support Systems, 43(2) 2007, p.618-644'. Douceur 2002 abstract read from the Microsoft Research publication page. Resnick 2000 and Kamvar 2003 abstracts read via the OpenAlex API record.
- Peer-review status for Chard et al. (eScience claim) and for 2608.30362 'Will the User Ever Know?' (arXiv comment claims EMNLP 2026 Main, proceedings not yet published) could not be confirmed; the latter was not added.

## New entries added (14)

- pub-fan-2026-acworld: arXiv:2608.02441, Agentic Commerce World: An Auditable and Verifiable Environment for Vibe Commerce
- pub-liu-2026-agentlance: arXiv:2608.23867, Markets, Not Planners: Decentralized Orchestration of LLM Agents with Private Information
- pub-aldridge-2026-microstructure: arXiv:2609.33058, Evolution of Market Microstructure in the Age of AI
- pub-sun-2026-sok-economic: arXiv:2610.01756, SoK: Decentralized Agent Economic Infrastructure
- pub-li-2026-skillshift: arXiv:2609.02564, A Finger on the Scale: Covert Policy Steering through Agentic Skills
- pub-zheng-2026-kita: arXiv:2609.05901, From Review to Authorization: Key-Isolated Threshold Signing for LLM Agents
- pub-zhu-2026-runtime: arXiv:2609.14744, Runtime Authorization for Resources Acquired by AI Agents
- pub-racioppi-2026-mandato: arXiv:2608.14074, Mandato: Protocol-Level Enforcement of Digitally Signed Mandates on AI Agent Actions with Cryptographically Chained Audit Trails
- pub-tong-2026-aidguard: arXiv:2608.21159, AID-Guard: Stateful Authorization for Delegated Agent Effects
- pub-petersgill-2026-multicamel: arXiv:2610.05640, Can CaMeLs Talk? Securing Multi-Agent Systems Against Indirect Prompt Injection Attacks
- pub-zhan-2026-stepjack: arXiv:2608.06477, StepJack: Benchmarking Computer-Use Agent Safety Against Multi-Step Indirect Prompt Injection
- pub-wang-2026-provider: arXiv:2610.05266, Who Is Your Agent Serving? Provider-Side Indirect Prompt Injection in Proactive Agents
- pub-drew-2026-legit: arXiv:2609.21325, LEGIT: Credentialing Protocol for Trustworthy AI Agent Marketplaces
- pub-bara-2026-epistemic: arXiv:2609.01873, Epistemic Sybil Resistance: Multiplying AI Agents Without Multiplying Evidence

## Candidates found but left for part a (protocol analyses; identity and delegation)

- arXiv:2609.11757 Louck, Dvir, Stulman, 'Signing the Transaction but Not the Decision: Whisper Attacks and a Binding Defense for AP2' (2026-09-10).
- arXiv:2609.02208 'Agentic Settlement Protocol: An Application Profile for Refundable, Delayed-Fulfilment Agent Commerce on Stablecoin Rails' (2026-09-02).
- arXiv:2608.01341 '402Pilot: An x402 Decision Layer for Autonomous Agent Micropayments' (2026-08-02).
- arXiv:2608.30519 'Authority-Inference Separation in Agentic Finance: First-Line Control, Blockchain Enforcement, and Replayable Assurance' (2026-08-31).
- arXiv:2609.22944 Larsen, Moghaddam, 'NostrAgent: A Decentralized Identity and Delegation Architecture for Sovereign Agentic Systems' (2026-09-19).
- arXiv:2608.21942 Goenka, Pathak, Asthana, 'TessIndex: Capability Verified Identity System for the Agent Economy' (2026-08-22).
- arXiv:2609.15906 'Authorization Architectures for Tool-Using AI Agents' (2026-09-14); arXiv:2609.21284 'Authorization Revocation for Long-Running AI Agents' (2026-09-18); arXiv:2608.04626 'Blockchain Empowered Trustworthy Agent Networks' (2026-08-05).
- Security papers seen but not added (general indirect-prompt-injection work without a commerce or payment angle): 2610.09935, 2610.08951, 2610.06401, 2610.05295, 2610.05163, 2610.06966, 2609.37196 ToolFence, 2609.26900 Ajar, 2609.14987 ActGuard, 2608.27496 ROPE, 2608.30362.

## Blocked or degraded endpoints (2026-10-10)

- dblp.org search API: anti-bot challenge page ('Making sure you're not a bot') returned instead of JSON for every query; some requests also timed out. Venue checks were done through OpenReview, proceedings.neurips.cc, DOI negotiation and Semantic Scholar instead.
- dl.acm.org: HTTP 403 (Cloudflare) for the Resnick 2000 and Kamvar 2003 landing pages. Metadata taken from doi.org CSL JSON; abstracts from OpenAlex.
- sciencedirect.com: HTTP 403 for Jøsang 2007. Abstract taken from the authors' preprint PDF.
- link.springer.com: page for Douceur 2002 returned 200 but no abstract in the served HTML; Microsoft Research page used instead.
- api2.openreview.net: began returning 403 'Challenge verification required' after about ten requests. WebArena (oKn9c6ytLx), tau-bench (roNSXZpUDN) and WASP (Ip1cCUAllL) records were captured before the block.
- proceedings.neurips.cc 2025 listing contained only 64 entries on the access date, so WASP was confirmed through OpenReview rather than the proceedings page.
- api.semanticscholar.org: one DOI lookup (10.18653/v1/2024.findings-acl.624) returned 'not found'; the batch endpoint worked. Used only as a secondary cross-check, never as the sole verification.
- escience-conference.org/2026/papers: reachable; the accepted list did not include Chard et al.

## Method notes

- arXiv metadata (title, authors, abstract, submission date, comment, journal_ref, DOI) pulled from export.arxiv.org/api/query in four id_list batches plus two candidate batches; titles and author lists in the JSON were loaded programmatically from those records rather than retyped.
- New-paper search: nine arXiv API queries sorted by submittedDate (agentic commerce, x402, ERC-8004, AP2 and agent payments, reputation and Sybil, prompt injection with commerce terms, shopping agents, benchmarks, agent economies, delegation), filtered to submissions since 2026-08-01. Abstracts of 22 candidates were read; 14 were added, the rest are listed above.
- Years follow the published version where a venue is confirmed (Rothschild 2026, CaMeL 2026, tau-bench 2025, WebArena 2024) and the arXiv submission year otherwise.
- BibTeX: article for journals (CACM, DSS), inproceedings for conferences and workshops, misc with eprint and archivePrefix=arXiv for preprints.
