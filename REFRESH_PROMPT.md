# REFRESH_PROMPT.md

A reusable prompt for a future Claude Code session that brings the Agentic Rails Atlas up to date. Copy the block below into a new session opened in this folder.

---

Read `CLAUDE.md`, `PLAN.md`, the tail of `private/PROGRESS.md`, `private/DECISIONS.md`, `ATLAS_ERRATA.md` and `README.md` first. Today's date is the `accessed` date for every source you read. Work autonomously, log judgment calls in `private/DECISIONS.md`, and append a timestamped line to `private/PROGRESS.md` at each milestone.

**Budget rules (learned the hard way).** Run at most 2 or 3 subagents at a time. Use Sonnet for research, verification and fixes; keep the lead session for decisions, merges, gates and reports. Briefs must tell agents to write files early, commit by explicit path, never use `git commit -a` or rewrite history, and never spawn helper agents of their own.

## 1. Refresh the sources

1. Re-clone or `git fetch` the spec repositories into `research/vendor/` (list in `private/ATLAS_PROMPT.md` 5.0), plus `agent-intent/verifiable-intent`, `ERC-3643/ERC-3643`, and fetch ERC-8226 from `ethereum/ERCs`.
2. For each of the eight protocols, diff the repository since the commit recorded in `research/protocols/<slug>.md` (tags, releases, changed spec files, schema changes, new advisories via `gh api repos/<owner>/<repo>/security-advisories`). Check the official announcement pages and newsrooms named in each dossier's resources table.
3. Re-check the IETF drafts on the Datatracker (`draft-httpauth-payment`, `draft-ietf-webbotauth-httpsig-protocol`), FIDO and EMVCo pages, and the EIP status of ERC-8004, ERC-8126, ERC-8183 and ERC-8226.

## 2. Re-check what is time-sensitive

- **Fees and costs** (`research/fees.json`, each protocol's `ecosystem.json` costs): CDP facilitator pricing, PayAI pricing docs, Circle Nanopayments, Tempo fees, Stripe MPP minimums and SPT status, OpenAI and Shopify fees, Google's statements. Re-measure ERC-8004 `register` and `giveFeedback` gas with a read-only `eth_estimateGas` and label the method and date.
- **Metrics** (`research/market.json`, ecosystem metrics): x402.org counter (it has been static since August 2026; say if it still is), 8004scan, mppscan, GitHub stars. Never present an old number as current; keep disputes visible.
- **SDK versions**: pympp, Rust `mpp`, mpp-go, mpp-rb, `mppx`, `@x402/*`, PyPI `x402`, UCP SDKs.
- **Every claim marked `reported`** and every item in `private/ATLAS_FOLLOWUP.md` Section 2.2 that was kept as reported: look for a primary source; upgrade to `verified` or leave it with the reason.
- **Known open items**: whether AP2 mandates or Verifiable Intent are used in any production flow; whether FIDO published a deliverable; Mastercard key directory location; whether the 2025 Instant Checkout form is fully retired; Soneium and Billions ERC-8004 deployments.

## 3. Update the content

For each protocol with changes: update `research/protocols/<slug>.claims.json` and `.sources.json`, then the page sidecars and `index.mdx` (follow `docs/briefs/WRITER_BRIEF.md`), the timeline (add dated events), `facts.json` `changedRecently`, quiz and flashcards whose claims changed, and set `lastVerified` in the frontmatter. Record every correction to earlier content in `ATLAS_ERRATA.md`. Write a short dated entry for the What's new page (timeline events dated within the last 90 days appear there automatically).

## 4. Verify and ship

1. For every protocol whose content changed, run an independent verifier (`docs/briefs/VERIFIER_BRIEF.md`, Sonnet) that did not make the change; output `verification/<slug>-<date>.md`; fix every failure.
2. Run `pnpm data`, `pnpm merge`, `pnpm diagrams`, then all gates: `pnpm check`, `pnpm test`, `pnpm lint:style`, `pnpm lint:ste`, `pnpm verify:sources`, `pnpm verify:coverage`, `pnpm verify:citations`, `pnpm verify:links`, `pnpm build`, `pnpm e2e` (with `PLAYWRIGHT_CHANNEL=chrome` if the bundled browser is not installed).
3. Update `REPORT.md` with a dated "Refresh" section (what changed, gate results, new conflicts, what is still unverified), commit, and tag `v<major>.<minor+1>`.
