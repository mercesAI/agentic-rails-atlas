# PLAN.md: Agentic Rails Atlas build plan

Scope: `private/ATLAS_PROMPT.md` (v1.0) plus `private/ATLAS_FOLLOWUP.md` (v1.1). Fact-check: `private/docs/factcheck-of-private/ATLAS_PROMPT.md`. Audit of the resumed state: `private/AUDIT.md`. Build date (used as `accessed` for all sources read in this session): **2026-10-11** (sources read before the pause keep 2026-10-10).

## Status (2026-10-10, session 2)
| Phase | Scope | Status |
|---|---|---|
| 0 | Bootstrap | done (2cb8ff1) |
| A | v1.1 audit (`private/AUDIT.md`) | done |
| 1 | Research: 8 dossiers, orbit a/b/c, policy, market, fees, prehistory, publications a/b/c, glossary | done |
| 2 | Architecture, template, islands, universe, cross-cutting pages | done |
| 3 | Content: 8 protocol pages, 8 scenarios | done |
| 4 | Interactive: universe, flow player, state explorer, 8 playgrounds, compare, stack, controls | done |
| 5 | Cross-cutting pages incl. ERC-3643 orbit page and 8 scenarios | done |
| 6 | Verification: 8 independent reports, all fixes applied, gates green, screenshots | done |
| 7 | Handover: README, REFRESH_PROMPT, REPORT, REPORT_v1.1, ATLAS_ERRATA, deploy target, tags v1.0 and v1.1 | done |
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

## Scope right-sizing (private/ATLAS_FOLLOWUP.md 3.6)
- Playground order: x402, AP2, UCP, TAP, MPP, ERC-8004, ACP, Agent Pay. Unfinished ones show "coming next".
- Glossary: 80 fully written terms minimum; stubs flagged and excluded from the count.
- Compare cells may read "not published" with a source showing the absence.
- Practitioner text 2,000 to 3,500 words.
