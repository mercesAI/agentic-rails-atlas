# Integration notes: protocol page template

Owner: template agent. Date: 2026-10-11. Files: `src/layouts/Protocol.astro`, `src/pages/p/[slug].astro`, `src/components/protocol/**`, the islands `FlowPlayer`, `StateMachineExplorer`, `Quiz`, `Flashcards`, `NotesPanel`, `PlaygroundFrame`, `MermaidDiagram.astro`, `src/playgrounds/README.md`, `tests/unit/islands/**`, `tests/e2e/protocol.spec.ts`.

## B and P split (decision)

Writers keep following `docs/briefs/WRITER_BRIEF.md`: section B text, then a `## Compare and compose` heading at the end of `index.mdx`, then 2 to 4 paragraphs for section P. Nothing changes for them.

How it works: `[slug].astro` passes `<Content />` to `layouts/Protocol.astro` as the `body` slot. The layout renders it once with `Astro.slots.render('body')`, then `splitBodyHtml` (`src/components/protocol/lib/split-body.ts`) cuts the HTML at the first `h2` whose text contains "Compare and compose". Before goes to section B, after goes to section P, the heading itself is dropped (P has its own lettered h2). The body is rendered once, so citation numbers, glossary terms and heading ids are never duplicated.

Safety: when the marker is missing, or sits inside an open element (for example inside a `<Mode>` block), the whole body stays in B and P shows "The written comparison is in progress" plus the relations and compare data. Unit tests: `tests/unit/islands/split-body.test.ts`.

Optional alternative: a `src/content/protocols/<slug>/compare.mdx` file (no frontmatter needed, same components provided) replaces the marker text in P when it exists. Its `<Cite>` ids are added to the page source order. Nobody needs it today; it exists for a writer who wants P text outside `index.mdx`.

Rule for writers (worth adding to the brief): put the `## Compare and compose` heading at top level, never inside `<Mode>`, `<Callout>` or any other component.

## What the page provides to MDX

- `index.mdx` and `compare.mdx`: `Mode`, `FieldTable`, `Cite`, `Callout`.
- `ste.mdx`: those plus `SteDescription`, `SteProcedure`, `SteCaution`, `SteNote`, `SteTerms`, `SteCompare`.

## Section D side-by-side

The left column is the first two practitioner paragraphs of `index.mdx` (outside `<Mode>`, not headings, lists, tables or components), as plain text. The right column is the first `<SteDescription>` block of `ste.mdx`, as plain text. The comparison is a disclosure that opens automatically in STE mode. If either side is empty, the disclosure is not rendered.

## Reading modes on the protocol page

- STE: section B is hidden and section D is moved directly after A with CSS `order` (in `protocol.css`). Keyboard order still follows the DOM (A, C, D); B is hidden so nothing is skipped.
- ELI5: in section B, practitioner text outside `<Mode>` is hidden on screen and only `<Mode eli5>` blocks show, with a one-line hint to switch to Practitioner. Print always shows practitioner text.
- Spec-deep: practitioner text plus `<Mode spec>` blocks, with a one-line hint.

## Section L costs

`EcosystemFile.costs` (already in `schemas.ts`, commit "feat(schema): costs block...") renders as a "Costs" table: item, value with citation, who pays, as of, confidence and caveat. When the array is absent or empty, the section says "No dated cost figure is recorded yet." No schema change requested.

## Storage keys used

- `atlas:read:<slug>`: array of section ids. A section counts as read once its end has been on screen. The page fires `atlas:read` on `document` after each change (ProgressRing listens).
- `atlas:quiz:<slug>`: `{ answers: {questionId: optionIndex}, submitted, score?, total?, date?, best? }`. Fires `atlas:quiz`.
- `atlas:cards:<slug>`: `{ known: string[] }`.
- `atlas:notes`: one object keyed by `<slug>/<sectionId>`, value `{ text, updated }` (ISO timestamp). Plain string values are accepted on read. "Flag an issue" writes `<slug>/flags` (appending) and fires `atlas:notes` with `{ key }`. JSON export envelope: `{ format: "atlas-notes", version: 1, exportedAt, notes }`. Markdown export: a level-2 heading per note followed by `<!-- atlas-note key="..." updated="..." -->`, which import reads back. **The `/notes/` page owner should import `normalizeStore`, `exportJSON`, `exportMarkdown`, `importJSON`, `importMarkdown` and `mergeStores` from `src/components/protocol/lib/notes.ts`** so both views share one format.

## Requests to other owners (not done by the template; worked around)

1. Foundation, `src/lib/content.ts`: `getFlow`, `getStateMachine` and `getDiagramMeta` share one generic `byId` whose return type is the union of all three collections. The template casts through typed wrappers in `components/protocol/lib/load.ts` (`flowById`, `machineById`, `diagramMetaById`). Suggested fix: overloads or three typed functions.
2. Foundation, `src/styles/prose.css`: `.table-wrap` should be `position: relative`. Without it, `.sr-only` text inside a scrolling table escapes the clip and widens the page on phones (seen at 360 px: 740 px scroll width). The template sets it under `.proto` only.
3. Foundation, `src/styles/prose.css`: code blocks use `--bg-sunken` as background. With the `github-light` Shiki theme the keyword red `#d73a49` is 3.96:1 on `#efefeb` (axe color-contrast, serious). The template sets `.proto .astro-code` to `--bg-elevated` (white in light theme, 4.5:1 or better). Other pages with TypeScript code blocks in the light theme will fail axe until prose.css changes. Further, on the real x402 snippets the `github-dark` comment gray `#6a737d` (3.82:1) and the `github-light` parameter orange `#e36209` (3.48:1) fail AA on any background, so `CodeBlocks.astro` (section N) uses `github-light-high-contrast` and `github-dark-high-contrast`. Suggest the same themes in `astro.config.mjs` `shikiConfig` for MDX code blocks.
4. Foundation, `src/styles/tokens.css`: there is no chart palette. `MetricChart` uses the four family fills in fixed order, starting with the protocol's own family, with dash patterns, marker shapes, a legend, direct labels and a table view as second channels. The dataviz validator flags the fills as a categorical set (dark: amber fill lightness 0.67 above band, teal chroma 0.095 below floor; light: teal chroma 0.087 below floor) while CVD separation (12.7 and 11.6) and contrast pass. If a dedicated chart palette is added to tokens, swap `FILL_VAR` in `MetricChart.astro`.
5. Foundation, `src/lib/content.ts` `getPageSources`: it does not include flow, state machine, diagram, relation or compare sources. The template appends them after the contract order (per-section lists in `load.ts`), so footer numbers stay stable and complete. If `getPageSources` grows, nothing breaks.
6. e2e environment: `astro preview` in Astro 7 runs as a background daemon and `playwright.config.ts` reuses any server on port 4321. Another agent's preview of an older `dist/` on that port makes protocol tests fail with missing sections. Stop it with `pnpm astro preview stop` before `pnpm e2e`, or run against a fresh build.
7. Writers: `meta.playground.status: ready` only takes effect when `src/playgrounds/<slug>/Playground.tsx` exists; otherwise section O shows the ComingNext card with `playground.note`.
8. Copy-link buttons: `lib/client/copy-link.ts` appends a `#` button inside every `h2[id]`, so a heading's accessible name ends with "Copy link to ...". Tests match heading text with `startsWith`.

## Gaps the template reports instead of failing

Every section always renders `<section id data-section aria-labelledby>` and its lettered `h2`. A missing sidecar shows "This section is in progress. Its data file `src/content/protocols/<slug>/<file>` is not written yet." Missing flows, state machines and diagram metadata show the same placeholder with their own path. A diagram whose SVG is not rendered yet shows its `.mmd` source with "Not rendered yet. Run `pnpm diagrams`."
