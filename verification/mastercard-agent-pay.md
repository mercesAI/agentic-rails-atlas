# Verification report: mastercard-agent-pay

Verifier: independent agent, 2026-10-11. Scope per `docs/briefs/VERIFIER_BRIEF.md`, ATLAS_PROMPT.md Section 5.8, ATLAS_FOLLOWUP.md Section 2 and the Agent Pay rows of ATLAS_ERRATA.md.

Status: in progress (resumed 2026-10-13 after the first verifier hit a usage limit). Sections are filled as each check completes. Scope for this pass: every claim referenced from `index.mdx` frontmatter and body Cite tags, `facts.json`, `faq.json`, `quiz.json` and `flashcards.json` (161 claims), plus a seeded random sample of 30 further claims (191 distinct claims in all). Sources were fetched with curl on 2026-10-13 and searched as text; sources that blocked curl were retried once with WebFetch.

## Structural findings (claims.json, all 243 claims)

| Id | Verdict | Evidence | Note |
|---|---|---|---|
| clm-mastercard-agent-pay-216 | fail | claims.json; sources.json `src-mcap-pymnts-vi` has `primary: false` | marked `verified` with only a non-primary source; downgrade to `reported` or add a primary source |

Every claim carries an `asOf` value, so no claim fails the "number or date without asOf" rule.

## Check 1: claims against sources (191 claims: 161 referenced + 30 sampled)

Method: each claim's cited sources were fetched and searched for the claim's numbers, names, dates and identifiers, then every claim with any unmatched term or any non-obvious meaning was read in context. Verdicts: pass = source supports text; fail = source contradicts or does not contain it; unreachable = cited source could not be read.

### Failures and defects

| Id | Verdict | Evidence | Note |
|---|---|---|---|
| clm-mastercard-agent-pay-216 | fail | `sources.json` `src-mcap-pymnts-vi` `primary: false` | `verified` with a non-primary source only (from the structural pass). |
| clm-mastercard-agent-pay-007 | fail (wording) | `research` copies of `src-mcap-dev-release-history` ("fecthing this receipt from MDES using the Token Connect API", "MDES for Merchants (M4M)") and `src-mcap-dev-mvct-tests` ("existing MDES token") | Text says "Mastercard pages read for this dossier ... do not name MDES". The cited launch and LatAm releases do not, but two developer pages the dossier itself cites name MDES, for Virtual Card Tokens and Token Connect, not for agentic tokens. Same overstatement in `facts.json` ("Mastercard's pages say ... do not name MDES"), `faq.json` ("The Mastercard pages read for this atlas ... do not name MDES"), `flashcards.json` ("no Mastercard page read names MDES") and `resources.json` line 363 ("the Mastercard pages read for this atlas do not"). Narrow to "Mastercard's agentic-token pages and releases do not name MDES; developer pages mention MDES only for Virtual Card Tokens and Token Connect enrollment". |
| clm-mastercard-agent-pay-034, 035, 036 | unreachable | `src-mcap-q3-transcript` (insidermonkey.com) returns only the operator preamble to curl and WebFetch (sign-up wall) | Marked `reported`, which is right. The PYMNTS copy (`src-mcap-pymnts-q3`), read by WebFetch, contains none of the first-transaction, Citi/U.S. Bank, November, or "no-code" statements. For 036 it supports only the paraphrase "enables any Mastercard merchant to participate without significant development or integration"; the words "no-code" are not confirmed. Keep `reported`, drop "no-code" or attribute it to the unreachable transcript. |
| clm-mastercard-agent-pay-048 | pass with caveat | PYMNTS (WebFetch): "Thursday, March 5, 2026"; GitHub repo created 2026-03-05T09:41:38Z | `reported` is correct; Mastercard's own 2026-03-05 release was not found. |
| clm-mastercard-agent-pay-195 | partial | `research/vendor/ucp` release v2026-08-25 notes: "Migrated payment extensions from `dev.ucp.shopping.*` to `dev.ucp.common.payment.*` (`split_payments`, `payment_terms`, `ap2_mandates`)"; schema at main: name `dev.ucp.common.payment.ap2_mandate` | Namespace move in v2026-08-25 is real. Release notes spell the extension `ap2_mandates` (plural); the schema file at main uses `ap2_mandate`. Claim says "renamed ... to" the singular form; add a note that the release notes use the plural. The cited source (`src-mcap-ucp-schema-ap2`) is a main-branch file, not the release; cite the release note. |
| clm-mastercard-agent-pay-217 | wording | `src-mcap-dev-level1`, `level2`, `level3` are primary Agent Pay developer documents and were readable (HTTP 200); the `use-cases/agent-pay/index.md` page returns 404 | "the only primary record found of Agent Pay developer documentation" contradicts the page's own heavy use of the agentic-commerce-guide pages (claims 072 to 099). Reword to "the use-case page announced on 2025-10-16 could not be read (404 on 2026-10-13)". |
| clm-mastercard-agent-pay-016 | pass with note | WebFetch of FIDO pages: Payments Working Group launched 2025-04-29 (Visa and Mastercard co-chair); 2026-04-28 release creates the Agentic Authentication Technical Working Group and "Payments Technical Working Group ... chaired by members from Mastercard and Visa" | Supports the errata row 2.1.11. Note the 2026 text says "Payments Technical Working Group" while the 2025 text says "Payments Working Group"; the page should say plainly that the Technical group builds on the 2025 working group, not that they are the same body, unless FIDO says so. |

### Passing claims

Referenced claims checked and passing: 001 to 006, 008 to 010, 012, 014, 015, 017 to 024, 029, 030, 032, 037, 040, 042 to 047, 051, 052, 054 to 056, 058, 059, 061 to 064, 066 to 069, 071 to 084, 086 to 096, 098 to 106, 109, 111, 115, 117 to 123, 127 to 135, 139, 150, 152, 154, 159 to 165, 168 to 174, 178, 179, 182 to 191, 193, 194, 196 to 204, 206 to 211, 213 to 215, 220, 221, 227, 228, 231, 241 to 243. Sampled claims checked and passing: 013, 026, 038 to 041, 060, 065, 112, 125, 126, 128, 140, 142, 144, 157, 167, 169, 175, 205, 223, 224, 229, 233, 235, 236, 238, 239.

Selected evidence for the harder passes:

| Id | Evidence |
|---|---|
| 009, 012, 123 | `gh api repos/agent-intent/verifiable-intent`: license Apache-2.0, created 2026-03-05T09:41:38Z, latest commit 2026-04-20T19:06:41Z, zero commits since 2026-04-21, single branch `main`, zero releases. |
| 117 | Tag `v0.1.0` resolves to commit 1dc3d41 dated 2026-03-05T09:42:06Z with no parents; no GitHub release object exists (releases count 0). |
| 115 | `research/vendor/verifiable-intent/CHANGELOG.md` line 12: `## [0.1.0] - 2026-02-19`. |
| 118, 119, 185 | PR 23 commits via API: 1236f6e (2026-04-18) "BREAKING: field alignment per AP2 schema updates" renames `payment.*` to `mandate.payment.*` and `cnf.kid` to `cnf.jwk.kid`; ba1e409 adds `risk_data`, VCT `.1` suffixes, `constraint_policy`, `match_mode`. Merged 2026-04-20. |
| 129 to 132, 139 | `spec/credential-format.md` lines 42 to 45 and 165, 352: L2 Immediate about 15 minutes, L2 Autonomous 24 hours to 30 days, L3 about 5 minutes with a one-hour maximum. L1 about 1 year is stated as a recommendation in `spec/README.md` (SHOULD), so "at most one year" in the L1 table is slightly firmer than the spec. |
| 152 | `spec/constraints.md` registry lines 999 to 1006 lists exactly eight constraint types. |
| 058, 059, 054 | Europe release (Perspectives, 2026-06-02) lists 36 banks; LatAm release (2026-03-24) lists 17 participants. Counted by hand. |
| 064 | AP4M release participant list counts 32 names (Aave Labs through Utila, Mastercard Merchant Cloud included). |
| 198, 201 | AP4M release quotes Tempo ("Machine Payments Protocol compatibility") and Coinbase ("open standards like x402"); Mastercard's own text makes no MPP claim. Errata R39 holds. |
| 200 | x402 Foundation release lists Mastercard among premier members. |
| 203, 204, 205 | EMVCo news 2026-09-01: draft Framework for Specifications, feedback due Wednesday 30 September, Intent Services complementing Verifiable Intent, KYA and Agentic Transaction Indicators "may" be considered later. |
| 215, 243 | Level 1 guide sample code checks `['agent-browser-auth', 'agent-payer-auth']` only; the decision table lists `Agent-pay-auth` too. |
