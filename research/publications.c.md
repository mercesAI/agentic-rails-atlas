# Publications, part c: verifiable compute; micropayments and channels; card payment security; economics and law; grey literature; dossier and recent additions

Generated 2026-10-11 by the part-c research agent. Output file: `research/publications.c.json` (keys `part`, `generatedAt`, `scope`, `groups`, `entries`, `unverified`, `verificationLog`).

## Counts

- Verified and published: 55.
- By group: verifiable compute 7 (4 seed, 3 new); micropayments and payment channels 8 (all seed); card payment security 9 (all seed); economics and law 8 (all seed); protocol analyses and recent papers 8 (3 from the protocol dossiers, 5 new); grey literature 15 (14 seed items, counting the three IETF drafts separately, plus none new).
- Seed entries in scope: 45 (4 + 8 + 9 + 8 + 16 grey items). Verified 44. Unverified 1 (Mastercard Trust Framework white paper, see below).
- Peer-reviewed with a confirmed venue: 20. Preprints and reports: 20. Grey literature: 15.
- By relation: foundation 22, related 16, grey 15, direct 2.
- By verification channel: doi-negotiation 19, arxiv 18, publisher 18.
- No id, arXiv id or DOI duplicates an entry from parts a or b (checked against `src/content/publications/publications.json` by the build script).

## Corrected or extended metadata

- PayWord and MicroMint (Rivest, Shamir): year 1997 from the DOI record (LNCS book "Security Protocols"), per ATLAS_FOLLOWUP 2.1.6. The timeline can say "1996 (workshop)". The record does not state the LNCS volume number, so none is given.
- Provable Security Analysis of FIDO2 (Barbosa et al.): the seed gave only ePrint 2020/756; Crossref has the CRYPTO 2021 chapter, DOI 10.1007/978-3-030-84252-9_5. DOI added.
- FP-Inconsistent (Venugopalan et al.): seed listed arXiv 2406.07647 with year 2024; the paper appeared at ACM IMC 2025 (DOI 10.1145/3730567.3732919). Year set to 2025, venue and DOI added, author list now includes Samuel T. King (from the DOI record).
- AI Agents and the Law (Riedl, Desai): AIES 2025 confirmed through DOI 10.1609/aies.v8i3.36705 (pp. 2189-2198).
- zkLLM (Sun, Li, Zhang): DOI and arXiv 2404.16109 both recorded; venue CCS 2024 confirmed.
- The Lightning Network white paper PDF reads "DRAFT Version 0.5.9.2", dated 2016-01-14; the lightning.network home page labels the link 0.5.9.1. The entry uses the PDF.
- BIS Working Paper 1310 (Aldasoro, Desai): BIS date 2025-11-26. A journal version exists in the Journal of Financial Market Infrastructures (DOI 10.21314/jfmi.2026.008). The entry stays grey with the BIS URL; the journal DOI is named in the summary.
- IMF Note 2026/004 has a DOI (10.5089/9781513533308.068), so it was verified by DOI negotiation; it is still grey literature (`peerReviewed: false`).
- Bain (2025-12-17): the item is the Snap Chart "2030 Forecast: How Agentic AI Will Reshape US Retail" by Aaron Cheris, Mikey Vu, Stephanie Koszyk and Katherine Hall. A separate Bain retail report was announced 2025-11-13; do not mix the two.
- Visa agentic payments report (2026-07): identified as "Agentic Payments from the Ground Up: What the Onchain Data Tells Us", Visa with Artemis. The summary page says "Last updated on July 14, 2026"; trade press dated the release 2026-07-16. Data as of 2026-04-21.
- Waller, "Payments in the Age of AI Agents": the Board speech feed dates it 2026-09-29 (Sibos 2026, Miami), while the page slug is `waller20260928a`. Use 2026-09-29.
- GLEIF working paper: cover says September 2026; the PDF file name and creation date say 2026-08-13.
- IETF drafts: Web Bot Auth WG draft `draft-ietf-webbotauth-httpsig-protocol-00` (2026-09-01, T. Meunier, S. Major); expired `draft-oauth-ai-agents-on-behalf-of-user-02` (2025-08-26, expired 2026-02-27, T. S. Senarath, A. Dissanayaka); MPP's `draft-httpauth-payment-01` (2026-09-09, B. Ryan, J. Moxey, T. Meagher of Tempo Labs, J. Weinstein, S. Kaliski of Stripe). Author names are given as initials, as in the draft headers.

## Unverified seed entry

- Mastercard Trust Framework white paper (2026-09-30). The mastercard.com Insights page for a trust white paper returned HTTP 403 to curl and WebFetch. The 2026-09-30 Investor Relations release names the Agent Pay Trust Framework (identity, intent, controls, execution, intelligence) but links no white paper, which matches the Mastercard Agent Pay dossier ("No white paper for the Trust Framework was found"). A search result shows a Mastercard page titled as a trust white paper dated 2026-09-30; it could not be opened, so it is not published. Re-check from a browser.

## Flags and caveats

- Kolt, "Governing AI Agents": the arXiv comment says Notre Dame Law Review vol. 101, forthcoming. Not confirmed, so no venue.
- Bindschaedler et al. (Recourse): the arXiv comment says accepted at IEEE BCCA 2026; recorded as a preprint until proceedings appear.
- Christie, Chopra, Singh (Strabo): the arXiv comment says presented at the EMAS 2026 workshop at AAMAS 2026; no venue recorded.
- Hammond et al.: a Cooperative AI Foundation technical report; preprint, not peer reviewed.
- Srivastava (2607.19436): single-author proposal with a Zenodo copy (DOI 10.5281/zenodo.19060285).
- Goenka, Pathak, Asthana (TessIndex, 2608.21942): the same authors wrote TessPay (part a); part b listed TessIndex as a candidate for part a, but it was not in the merged file, so it is added here.
- Industry forecasts (McKinsey, Morgan Stanley, Bain) are projections stated as of their publication dates; the Visa and Artemis volumes are vendor-computed and adjusted for wash and test traffic.
- CERRE: the Regulatory Lab series received input from members including Apple, Booking.com and Microsoft (stated in the summary).

## Dossier papers checked

- Added: arXiv 2606.05043 (Strabo, UCP, from `ucp.md`), arXiv 2607.19436 (Srivastava, AP2 and ACP, from `openai-acp.md`), arXiv 2508.00007 (ANP white paper, from `orbit.a.md`).
- Already in the merged file or covered by part c seeds: every other arXiv id cited in `research/protocols/*.md`, `orbit.*.md` and `market.md` (for example 2606.08790 RAILS is `pub-devaloisfranklin-2026-rails`; 2404.16109 zkLLM, 2210.08674, 2401.17555, 2406.07647, 2501.07913 and 2508.08544 are part c seeds).

## New entries from the last-60-days search (2026-08-10 to 2026-10-11)

- pub-shang-2026-restaking: arXiv:2608.09055, Repeated-Game Security for Restaking-Based Verifiable Inference
- pub-xue-2026-zkmldebloat: arXiv:2609.10149, Sound Debloating of Redundant Checks in Zero-Knowledge Machine-Learning Circuits
- pub-liu-2026-ancestry: arXiv:2608.30387, Attesting Outputs and Delegation Ancestry in Multi-Agent AI Systems
- pub-goenka-2026-tessindex: arXiv:2608.21942, TessIndex: Capability Verified Identity System for the Agent Economy
- pub-zhu-2026-constructvalidity: arXiv:2609.01519, When Guardrails Look Effective: Construct Validity Failures in LLM Agent Commerce Evaluation
- pub-xu-2026-concurrency: arXiv:2610.06017, Parallelism or Concession? Concurrency-Aware Procurement Negotiation for Agentic Commerce
- pub-irshad-2026-vac: arXiv:2609.18411, The Verifiable Action Card: Trustworthy Human-in-the-Loop Control for Secure Autonomous Agents
- pub-zou-2026-intersage: arXiv:2608.13030, InterSAGE: The Secure and Verifiable Interoperability Protocol for An Internet of Agents

Seen but not added (off scope or weak link to the eight protocols): 2608.14068 MACS, 2608.11604 shopping-agent feedback, 2608.27443 permission policies, 2608.29381 rollback security, 2609.31562 agentic economies for science, 2610.01045 empty commitments, 2608.23060 invoice clearing, 2610.09610 envy-free allocations, 2609.34983 SmartMemory. Queries for "Universal Commerce Protocol", "Machine Payments Protocol", "Trusted Agent Protocol" and ERC-8004 returned no papers in the window beyond those already in parts a and b.

## Blocked or degraded endpoints (2026-10-11)

Logged in `research/blocked.md`: imf.org (403, DOI used), mckinsey.com (timeouts, karriere.mckinsey.de mirror used), bain.com (403 to curl, WebFetch worked), mastercard.com white paper pages (403, entry left unverified), export.arxiv.org (429 after about 25 searches, resumed with 3 s spacing), datatracker documentauthor filter (no results, draft text used).

## Method notes

- arXiv metadata from export.arxiv.org/api/query id_list batches; titles and author lists in the JSON are loaded from those records, not retyped. Every arXiv id was checked against its title.
- DOIs resolved with doi.org content negotiation (CSL JSON); Crossref works API used for book titles of Springer chapters and Crossref bibliographic search to find DOIs for FIDO2, FP-Inconsistent, AIES and the IMF note.
- Grey literature verified on the publisher page (title, author, date read from page metadata or text; PDFs read with pypdf in the scratch area).
- New-paper search: arXiv API queries sorted by submission date for agentic commerce, x402, agent payments, agentic payments, ERC-8004, AP2, Universal Commerce Protocol, Machine Payments Protocol, Trusted Agent Protocol, Verifiable Intent, plus scope queries (HTTP 402, micropayments, stablecoins, payment channels, zkML, verifiable inference, Web Bot Auth, passkeys, mandates, agent economy), filtered to submissions from 2026-08-10.
- Years follow the published version where a venue is confirmed (FP-Inconsistent 2025, PayWord 1997) and the arXiv submission year otherwise.
- BibTeX: inproceedings for conference papers, article for journals, incollection for the BIS chapter, techreport for working papers and issue papers, misc for preprints, drafts, speeches, blogs and industry reports.
- Validated against the `Publication` Zod schema with a scratch script run through `pnpm tsx`; no em dashes in any field.
