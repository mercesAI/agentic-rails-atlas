# PLAN.md: Agentic Rails Atlas build plan

Scope: `ATLAS_PROMPT.md` (v1.0) plus `ATLAS_FOLLOWUP.md` (v1.1). Fact-check: `docs/factcheck-of-ATLAS_PROMPT.md`. Audit of the resumed state: `AUDIT.md`. Build date (used as `accessed` for all sources read in this session): **2026-10-10**.

## Status (2026-10-10, session 2)
| Phase | Scope | Status |
|---|---|---|
| 0 | Bootstrap | done (2cb8ff1) |
| A | v1.1 audit (`AUDIT.md`) | done |
| 1 | Research: 7 remaining dossiers + x402 claims and sources + orbit part b + policy + market + publications part c + glossary draft + prehistory, with v1.1 corrections folded in | doing (wave 1 agents) |
| 2 | Architecture: foundation, scripts, STE linter, protocol template, islands, universe, cross-cutting pages | doing (wave 1 agents) |
| 3 | Content: x402 slice, then 7 writers, diagram review, merge | todo (wave 2) |
| 4 | Interactive: universe, flow player, state explorer, playgrounds in the 3.6 order, compare, stack, controls, notes, palette | todo (wave 2 and 3) |
| 5 | Cross-cutting pages incl. ERC-3643 orbit page and 8 scenarios (corrected 1, 3, 6, 8) | todo (wave 3) |
| 6 | Verification: independent fact-check per protocol, gates green, screenshots | todo (wave 4) |
| 7 | Handover: README, REFRESH_PROMPT, REPORT, REPORT_v1.1, ATLAS_ERRATA, deploy target, tag v1.0 then v1.1 | todo |
| 8 | Stretch (labs, unified agent record, decision helper) | todo |

## Waves
1. Parallel: research agents (7 protocols, x402 sources and claims, orbit b, policy, market, publications c, glossary, prehistory) and architecture agents (foundation, scripts, STE linter). Then protocol template, islands, universe, cross-cutting pages once the foundation lands.
2. x402 writer as the vertical slice (starts as soon as the foundation exists), then 7 writers in parallel; playgrounds in the 3.6 order; merge pipeline; diagrams rendered.
3. Scenarios (8), orbit pages, compare, stack, controls, timeline, glossary, library, personas, learn, notes, what's new, methodology.
4. Verification agents (8), errata check, gates, screenshots, reports, tags.

## Priority tiers if time runs short
- P0: Home bubbles (Constellation + accessible list); 8 protocol pages with sections A to G and citations; Methodology.
- P1: sections H to M; compare matrix; stack map; glossary (80 full terms); library; quizzes; flow player; 4+ playgrounds (x402, AP2, UCP, TAP first).
- P2: remaining sections and playgrounds; controls map; scenarios; timeline; personas hub; learn; notes; offline; what's new.
- P3: stretch backlog.

## Scope right-sizing (ATLAS_FOLLOWUP.md 3.6)
- Playground order: x402, AP2, UCP, TAP, MPP, ERC-8004, ACP, Agent Pay. Unfinished ones show "coming next".
- Glossary: 80 fully written terms minimum; stubs flagged and excluded from the count.
- Compare cells may read "not published" with a source showing the absence.
- Practitioner text 2,000 to 3,500 words.
