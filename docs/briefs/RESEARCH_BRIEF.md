# Research brief (one protocol)

You research one protocol for the Agentic Rails Atlas as of today, 2026-10-11. Your slug and ATLAS_PROMPT.md section are in your task message. You write files; a chat-only answer is a failure.

## Read first
1. `ATLAS_PROMPT.md` Sections 2.3 (truth contract), 2.4 (copyright), 2.8 (tools and network), and your protocol's Section 5.n in full (`sed -n '/^### 5.n /,/^---$/p' ATLAS_PROMPT.md`).
2. `ATLAS_FOLLOWUP.md` Section 2 (corrections to seed facts; the follow-up wins over the first prompt), Appendix A (learning resources for your protocol; include them in your resources list and re-check each URL with `curl -sSIL -A 'Mozilla/5.0' <url> | head -1`), Appendix B (fees and costs for your protocol; verify the primary ones), Appendix C (only for erc-8004).
3. `docs/factcheck-of-ATLAS_PROMPT.md`.
4. The reference dossier `research/protocols/x402.md` (first 220 lines) for the expected depth, table shapes and the inline `[src-...]` citation style.
5. The schemas `Source`, `Claim` and `ClaimsFile` in `src/lib/schemas.ts` (ids: `src-<slug>-<topic>`, `clm-<slug>-NNN`).

## Primary sources, in order
1. The cloned repositories under `research/vendor/` (read the spec text, JSON schemas, OpenAPI files, changelogs, READMEs; grep for every field name you report). Record the commit you read (`git -C research/vendor/<repo> log -1 --format='%H %cd'`).
2. GitHub metadata through `gh api` (tags, releases, commits with dates, PR merge dates, security advisories). `gh` is authenticated.
3. Official docs and announcements, standards records (EIPs, IETF datatracker, FIDO, EMVCo) through `curl -sSL -A 'Mozilla/5.0'` or WebFetch (load it with ToolSearch `select:WebFetch,WebSearch` first). Use WebSearch for discovery of 2026 news and for anything newer than your knowledge.
4. Reputable secondary sources only for things primary sources do not state; mark those claims `reported`.
If a site blocks you, append one line to `research/blocked.md` (`- 2026-10-11, <slug>: <host or URL>: <error>; alternative used: ...`), try one alternative, move on. Never loop on a blocked source.

## Output files
- `research/protocols/<slug>.md`: the dossier. Headings, in order: Identity and governance; Versions and changelog; Actors and roles; Core objects with exact field names (tables: field, type, required, meaning, file path); Message flows step by step (happy path and failures, one subsection per flow, each step with the message or call and its spec reference); State machines; Transports; Cryptography and standards used; Security model and published attacks or CVEs; Controls (native and gaps, mapped to the 14 control ids in `CONTROL_IDS` of `src/lib/schemas.ts`); Observability (public versus private data; exact event names, endpoints, `.well-known` paths, explorers, indexers); Compliance touchpoints; Ecosystem and SDKs (package names and registries, confirmed with `npm view <pkg> version time --json` or `curl https://pypi.org/pypi/<pkg>/json`); Fees and costs (from Appendix B plus anything newer; every figure dated and caveated); Metrics with dates and caveats (contested metrics shown with the dispute); Relations to the other seven protocols (one paragraph each, with the exact mechanism and a source, and "no documented relation" where that is the truth); Criticisms and open questions; Resources (20 or more rows: title, URL, publisher, date, type, badge, note, start here; include Appendix A rows for your protocol); Publications (verified arXiv ids and DOIs with titles, checked against `https://export.arxiv.org/api/query?id_list=<id>` or `https://api.datacite.org/dois/10.48550/arXiv.<id>` or `curl -sSL -H 'Accept: application/vnd.citationstyles.csl+json' https://doi.org/<doi>`); Seed audit (a table with one row per seed fact of Section 5.n and per Section 2 item of the follow-up that touches your protocol: confirmed, corrected with a source, or unconfirmed); Blocked sources; Conflicts (also append to `research/conflicts.md`).
- `research/protocols/<slug>.sources.json`: `Source[]` for every `[src-...]` id used in the dossier. Every record has `url`, `title`, `publisher`, `type`, `primary`, `accessed: "2026-10-11"`, `published` when known. For vendor files use the GitHub blob URL of the file at the commit you read.
- `research/protocols/<slug>.claims.json`: `ClaimsFile` with 120 or more claims. One plain sentence each, no em dashes, `sources` ids from your sources file, `confidence` (`verified` only when you read a primary source), `asOf` on every number and time-sensitive statement, `topic` set, `specVersion` where relevant. Cover every row of the key facts, every date, every field table, every metric, every relation and every item in the "Do not get wrong" list; the writers may only use facts that exist as claims.

## Rules
- Never invent citations, field names, endpoints, headers, error codes, version numbers, dates or partner names. Quote identifiers exactly as the spec spells them.
- Separate specified from deployed, announced from pilot from beta from live.
- No em dashes anywhere. US spelling. Dates as YYYY-MM-DD. Paraphrase; at most one quotation under 15 words per source.
- Record the three facts you are least sure about at the end of the dossier under "Least certain".
- Validate your JSON before you finish: `pnpm tsx research/validate.ts <slug>` (checks both schemas, source ids, duplicate ids and em dashes).
- Finish with a short reply: counts (sources, claims by confidence, resources, publications), the corrected seed facts, and the least-certain facts.

## Work incrementally
Write your dossier to disk section by section as you go (append after each heading), and write the sources file as soon as you have 10 records, then keep extending it. A session limit may stop you at any time; whatever is on disk is kept and a later agent continues from it. If `research/protocols/<slug>.md` already exists when you start, read it and continue from where it stops instead of starting over.

## Write early and commit
Usage limits have stopped earlier agents before they wrote anything. Create `research/protocols/<slug>.md` with its headings and the "Identity and governance" section within your first few tool calls. Write the sources file once it has 10 records. After each dossier section, append it and commit: `git add research/protocols/<slug>.* && git commit -m "research(<slug>): <section>"`, the message ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`. Only add your own files (plus `research/blocked.md` and `research/conflicts.md` when you change them).
