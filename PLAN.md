# PLAN.md: Agentic Rails Atlas build plan

Source of truth for scope: `ATLAS_PROMPT.md` (v1.0, 2026-10-10). This file tracks phases, status and checklists. Status words: todo, doing, done, waived.

Build date (used as `accessed` for all sources read in this session): **2026-10-10**.

## Phases

| Phase | Scope | Status |
|---|---|---|
| 0 | Bootstrap: git, docs, scaffold, deps, vendor clones, first build, commit `chore: bootstrap atlas` | done (2cb8ff1) |
| 1 | Research fan-out: 8 protocol dossiers + 4 cross-cutting (orbit, publications, policy and market, STE) | doing (workflow wf_9b2a3e3c-534) |
| 2 | Architecture: schemas, layouts, tokens, theme and reading-mode switches, citations, glossary tooltips, flow-to-Mermaid, diagram pipeline, search, page template, coverage checker; commit `feat: architecture and templates` | doing (workflow wf_1c0b7d84-8dc) |
| 3 | Content: x402 vertical slice, then 7 writer agents, diagram review; `pnpm verify:coverage` green or waived | todo |
| 4 | Interactive: bubble universe, flow player, state explorer, 8 playgrounds, compare matrix, stack map, controls map, notes, progress, command palette | todo |
| 5 | Cross-cutting pages: compare, stack, controls, scenarios, timeline, glossary, library, personas, orbit, learn, notes, what's new, methodology | todo |
| 6 | Verification and QA: independent fact-check per protocol, all gates green, screenshot review | todo |
| 7 | Handover: README, REFRESH_PROMPT, REPORT, tag v1.0 | todo |
| 8 | Stretch backlog (ATLAS_PROMPT.md Section 16) | todo |

## Milestone commits
`bootstrap` → `architecture` → `x402 slice` → `all protocols content` → `interactive` → `cross-cutting` → `verified` → `v1.0` → one commit per stretch item.

## Priority tiers if time runs short
- P0: Home bubbles (Constellation + accessible list); 8 protocol pages with sections A to G and citations; Methodology.
- P1: sections H to M; compare matrix; stack map; glossary; library; quizzes; flow player; 4+ playgrounds.
- P2: remaining sections and playgrounds; controls map; scenarios; timeline; personas hub; learn; notes; offline; what's new.
- P3: stretch backlog.

## Phase 0 checklist
- [x] git init, .gitignore
- [x] PROGRESS.md, DECISIONS.md, SOURCES.md
- [x] PLAN.md, CLAUDE.md
- [x] research/vendor clones (22 repos + sparse ERCs)
- [x] Astro 7 scaffold with React, MDX, Tailwind 4, pinned versions
- [x] `pnpm dev` and `pnpm build` pass with a placeholder home
- [x] commit `chore: bootstrap atlas` (2cb8ff1)

## Phase 1 checklist (exit criteria)
- [ ] `research/protocols/<slug>.md`, `.claims.json`, `.sources.json` for all 8
- [ ] 25+ sources per protocol (card networks may have fewer, reason logged)
- [ ] `research/seed-audit.md`: every Section 5 seed fact confirmed, corrected or unconfirmed
- [ ] `research/orbit.md`, `research/publications.json`, `research/policy.md`, `research/market.json`, `research/ste.md`
- [ ] `research/conflicts.md`, `research/blocked.md`

## Phase 2 checklist
- [x] Zod schemas for every type in ATLAS_PROMPT.md 12.3 (`src/lib/schemas.ts`)
- [x] Content collections wired (protocols, flows, states, sources, publications, glossary, personas, scenarios, orbit)
- [ ] Design tokens, dark-first theme, light theme, reduced motion
- [ ] Layouts: Base, Protocol page (sections A to T stubbed), cross-cutting
- [ ] Components: ReadingModeSwitch, Mode, Cite, CitationDrawer, SourceList, FreshnessBadge, GlossaryTerm tooltip, FieldTable, MermaidDiagram
- [ ] `scripts/flow-to-mermaid.ts`, `scripts/render-diagrams.ts` (light + dark SVG)
- [ ] `scripts/check-coverage.ts` with thresholds from 14.2 and `coverage-waivers.json`
- [ ] `scripts/style/lint-style.ts` (em dash + banned phrases), `src/lib/ste/` linter + `pnpm lint:ste`
- [ ] Pagefind search, command palette shell
- [ ] commit `feat: architecture and templates`

## Phase 3 to 7 checklists
Tracked in the task list and in PROGRESS.md; the Definition of Done is ATLAS_PROMPT.md 14.4.
