# Verifier brief (one protocol)

You did not write this content. You check it and report; you never edit content. Your protocol slug and private/ATLAS_PROMPT.md section number are given in your task message. Today is 2026-10-11.

## Scope
`src/content/protocols/<slug>/` (every file), the protocol's flows in `src/content/flows/<slug>-*.json`, its state machine in `src/content/states/`, its diagrams in `src/content/diagrams/<slug>-*`, and the rendered page `dist/p/<slug>/index.html` (run `pnpm build` first if `dist/` is stale).

## Checks (record every result)
1. Claims against sources. For every claim referenced from `index.mdx` frontmatter `keyFacts`, `facts.json`, `faq.json`, `quiz.json` and `flashcards.json`: open the cited source (a file under `research/vendor/` by grep, or the URL with `curl -sSL` or WebFetch loaded through ToolSearch "select:WebFetch") and decide pass, fail (the source does not support the text, or contradicts it) or unreachable. Then sample 40 further claims from `claims.json` at random (or all when the pool is 150 or fewer). A claim marked `verified` whose only sources are non-primary is a fail. A claim with a number or date and no `asOf` is a fail.
2. Field names, headers, enums, endpoints, events and error codes. Extract every identifier from the `<FieldTable>` blocks and `<Mode spec>` blocks in `index.mdx`, from flow payloads, from `observability.json` and `security.json`, and grep each one in the cloned spec files under `research/vendor/` (and the spec's JSON schemas or OpenAPI where they exist). Report every identifier that does not appear, with the closest real spelling. Validate illustrative JSON payloads against the spec's JSON Schema when one exists (write a small script with `ajv`, installed).
3. Dates, versions and numbers. Check every date in `timeline.json`, `facts.changedRecently`, the frontmatter (`firstAnnounced`, `latestVersion`) and `ecosystem.metrics` against its source. Check that version labels match the repository tags or dated releases (`gh api repos/<owner>/<repo>/tags` and `/releases`).
4. The "Do not get wrong" list of Section 5.n (`sed -n '/### 5.n /,/^---$/p' private/ATLAS_PROMPT.md`): for each item, find where the page states it (section A, B or Q) and confirm the statement is correct and explicit. Missing or wrong is a fail.
5. Diagrams against the spec: the main flow's step order, actors and messages match the spec's described flow; the state machine's states and transitions match the spec's status values; failure branches correspond to real error conditions. Hand-written diagrams make no unsupported claim.
6. Separation of specified versus deployed, announced versus live, and stewardship accuracy (naming per private/ATLAS_PROMPT.md Section 0 "Naming accuracy").
7. Style gates: run `pnpm lint:style` and `pnpm lint:ste --protocol <slug>`; grep the folder for U+2014; check US spelling on a sample; check that acronyms are expanded on first use in `index.mdx`.
8. Coverage: run `pnpm verify:coverage --protocol <slug>` and record the result.

## Output
Write `verification/<slug>.md` with: a summary table (check, pass count, fail count, unreachable count); a table per check with one row per item (id or identifier, verdict, evidence: file path and line or URL, note); a "Do not get wrong" table; a prioritized list of required fixes with the exact file and the suggested correction; a list of blocked or unreachable sources. Then reply with JSON: `{"slug": "...", "claimsChecked": N, "claimsFailed": N, "identifiersChecked": N, "identifiersWrong": N, "datesWrong": N, "doNotGetWrongFailed": N, "diagramIssues": N, "styleIssues": N, "coveragePass": boolean, "requiredFixes": ["..."]}`.

## Scratchpad
Several agents share the session scratchpad. Put your temporary files in a subfolder named after your task (for example `scratchpad/<slug>-writer/`) so no other agent overwrites them. Never keep anything the repository needs in the scratchpad.

## Git safety
Many agents commit to `main` at the same time. Stage files by explicit path only; never use `git commit -a`, `git add -A` or `git add .`. Never rewrite or move history: no `git reset`, `git rebase`, `git commit --amend`, `git update-ref`, `git push --force`, `git checkout -- <file>` on files you do not own, or `git stash`. If you commit something by mistake, leave it and say so in your final reply.
