# Scenario brief (one multi-protocol walkthrough)

You write one end-to-end scenario of the Agentic Rails Atlas (ATLAS_PROMPT.md Appendix B). Your scenario number, slug and title are given in your task message. Today is 2026-10-11.

## Read first
1. `docs/ARCHITECTURE.md` sections 2, 5 (how Cite works), 12 and 13; the `ScenarioMeta`, `Flow` and `FlowStep` schemas in `src/lib/schemas.ts` (note `protocol`, `controlPoint`, `observable` and `failures` on steps).
2. ATLAS_PROMPT.md Appendix B (your scenario line and the closing paragraph), Sections 2.3, 2.4 and 2.6.
3. For every protocol in your scenario: `src/content/protocols/<slug>/index.mdx` (frontmatter and the flow subsection), `claims.json`, `controls.json`, `observability.json`, and the protocol's flows in `src/content/flows/`. Reuse their step shapes and cite their claim ids. When you need a fact that none of the claim files carries, verify it in `research/vendor/` or the dossier and add a Claim to `src/content/scenarios/<slug>.claims.json` (same `ClaimsFile` shape but with `protocol` set to the first protocol of the scenario and claim ids `clm-scn-<slug>-NNN`) together with its Source in `src/content/scenarios/<slug>.sources.json`.

## Files to produce
- `src/content/scenarios/<slug>.mdx`: frontmatter `ScenarioMeta` (slug, order, title, summary, protocols, flow id, personas, lastVerified 2026-10-11). Body sections (`##`): The situation (who wants what, human present or not); Actors; Step by step (a numbered list that mirrors the flow, each step naming the protocol that owns it); Which protocol does what (a table: step range, protocol, object or message, spec version); Where controls apply (the control points from the controls sidecars: before authorization, at signing, at the edge, at settlement, after the fact; what an independent controls layer could check at each); What is observable from outside (public artifacts, events, documents, and what stays private); What can go wrong (failure modes with the protocol's own error or outcome and who bears the loss); Variants (one or two alternatives, for example a different rail or human-not-present). 900 to 1,600 words. Cite every factual sentence with `<Cite ids="..." />`.
- `src/content/flows/multi-<slug>.json`: `Flow` with `protocol: "multi"`, 8 to 20 steps, each step with `protocol`, `controlPoint` where a control can act, `observable` where something is visible from outside, `payload` where a real message exists (exact field names, `illustrative: true`), `crossesTrustBoundary`, `specRef`, and `failures`. The flow player renders this with a legend of which protocol owns each step.
- `src/content/diagrams/multi-<slug>-context.mmd` plus `.json` (`DiagramMeta`, protocol `multi`, type `composition`): the actors and the protocol boundaries in one picture.

## Rules
No em dashes, no banned phrases, US spelling, sentence case, dates as YYYY-MM-DD. Never present a composition as live when the sources show it as specified or announced only; say which parts are deployed today and cite it. Keep the owner's two lenses explicit: controls and observability.

## Finish
`pnpm tsx scripts/verify/validate-content.ts`, `pnpm lint:style`, `pnpm tsx scripts/flow-to-mermaid.ts && pnpm tsx scripts/render-diagrams.ts --only multi-<slug>-context`, `pnpm build` and confirm `dist/scenarios/<slug>/index.html` exists. Final reply: word count, step count, claims added, and the two facts you were least sure about.

## Scratchpad
Several agents share the session scratchpad. Put your temporary files in a subfolder named after your task (for example `scratchpad/<slug>-writer/`) so no other agent overwrites them. Never keep anything the repository needs in the scratchpad.

## Git safety
Many agents commit to `main` at the same time. Stage files by explicit path only; never use `git commit -a`, `git add -A` or `git add .`. Never rewrite or move history: no `git reset`, `git rebase`, `git commit --amend`, `git update-ref`, `git push --force`, `git checkout -- <file>` on files you do not own, or `git stash`. If you commit something by mistake, leave it and say so in your final reply.
