# QA report: Agentic Rails Atlas

Date 2026-10-14. Target http://localhost:4321 (dist build), system Chrome via Playwright, 1440 and 375 px, light and dark.
Excluded on request: reading-mode switch shows no visible effect; wide Mermaid diagrams shrink.
Scope note: all 62 pages plus 404 were swept at 2 widths and 2 themes (252 loads): HTTP status, console, failed requests, horizontal scroll, heading order, data-sanity text, dup ids, citations, axe. Interactive areas were exercised with probe scripts (now deleted). Screenshots are in `verification/qa/screenshots/`. The text-overlap detector was noisy (inline code wrapping); spot checks of flagged pages showed no real overlaps except those listed below. Full-page images are not all reviewed by eye.

## Summary

| Area | Tests run | Blocker | Major | Minor | Cosmetic |
|---|---|---|---|---|---|
| 1 Every page (load, console, scroll, links, headings) | 252 loads, link crawl, static HTML scan | 0 | 3 (QA-002, 003, 004) | 3 (QA-009, 010, 012) | 0 |
| 2 Global UI | palette (3 keys), shortcuts, themes, cite drawer, tooltips, skip link, mobile menu | 0 | 1 (QA-005) | 2 (QA-006, 013) | 0 |
| 3 Home | 4 modes, hover, orbit, persona, mobile dialog, keyboard | 0 | 1 (QA-001) | 1 (QA-011) | 2 (QA-018) |
| 4 Protocol pages (x8) | TOC, rail, flow player, state machine, quiz, flashcards, notes, BibTeX, playground random walk (70 actions each), print | 0 | 0 | 4 (QA-007, 008, 014, 015) | 0 |
| 5 Cross-cutting pages | compare, stack, controls, scenarios, timeline, glossary, library, learn, notes, orbit, personas, whats-new, methodology, 404 | 0 | 0 | 3 (QA-016, 017, 019) | 2 |
| 6 Data sanity | static scan of dist | 0 | 0 | 1 (QA-010) | 0 |
| 7 Accessibility | axe on 252 loads, keyboard pass | 0 | 0 | 2 axe (QA-020, 021) | 0 |
| 8 Offline | SW registered, offline reload visited and unvisited | 0 | 1 (QA-005) | 0 | 0 |

Totals: blocker 0, major 5, minor 15 (counting QA-006 to QA-021 below), cosmetic 3. Ids are ordered by importance, not by area.

## Bugs

### QA-001 (major) 25 of 31 orbit satellites on the home page link to 404 pages
- Home, 1440, any theme. Steps: turn on the Orbit toggle, click any satellite such as AGNTCY and OASF, ANP, Circle, Tempo.
- Expected: link to an existing `/orbit/<slug>/` page, or to the external source.
- Actual: `/orbit/agntcy-oasf/` and 24 others return 404. Only 13 starred pages exist in dist.
- Cause: `src/pages/index.astro:58` builds `orbitPages` from all orbit entries, but `src/pages/orbit/[slug].astro` only generates starred entries, so `resolveOrbit` (src/components/universe/lib/data.ts:108) marks them internal. Filter on `e.data.starred`.
- **Status:** Fixed 2026-10-14. Satellites are now built from the orbit collection (45 items); only starred entries link to /orbit/<slug>/, the rest link to their primary source with the external marker. Relation links in section P and search results for unstarred items now point to /orbit/#orbit-<slug>. Regression test in tests/e2e/qa-regression.spec.ts.

### QA-002 (major) Flow player overflows its column and the page scrolls sideways
- /p/mastercard-agent-pay/ (+502 px) and /p/visa-tap/ (+156 px) at 1440; also erc-8004, openai-acp, ucp, stripe-mpp, visa-tap, mastercard at 375 (up to +1259 px). Section C.
- Steps: open the page, scroll to the first flow player.
- Expected: player fits the 760 px column. Actual: stage, toolbar and step text are 1605 px wide, run under the right rail (text overlapped by Key facts), page gets a horizontal scrollbar.
- Cause: `.fp__detail` and the player grids have no `min-width: 0` / `minmax(0,1fr)`, so the long unbreakable payload line (for example the Signature-Input header) sets the track width. `src/components/protocol/protocol.css` (~lines 190 to 232, `.fp`, `.fp__detail`, `.fp__payload pre`). Screenshot: `screenshots/hs-mastercard-agent-pay-fp.png`.
- **Status:** Fixed 2026-10-14. Root cause was single-column grids with an implicit auto track (min-content blow-out). Flow player, detail and payload now use minmax(0,1fr) and min-width 0; payload scrolls inside its own box. Checked at 360, 375, 768 and 1440 px.

### QA-003 (major) Scenario pages scroll sideways at 375 px
- All 8 /scenarios/<slug>/ at 375, both themes (+225 to +655 px). The protocol chip list `ul.scn__chips` and `.prose` render 600 to 1030 px wide.
- Cause: `.scn__chips` is wrapping flex in `src/pages/scenarios/[slug].astro:154`, but the parent grid/prose column lacks `min-width: 0` (or something inside forces nowrap), so content widens the page. Also unbreakable code in prose. Needs a check of `.scn` layout.
- **Status:** Fixed 2026-10-14. .scn grid had an auto track; now minmax(0,1fr). Verified on all 8 scenario pages at 360, 375, 768, 1440 px.

### QA-004 (major) /stack/ scrolls sideways at both widths
- /stack/ at 1440 (+79 px) and 375 (+1048 px).
- Cause: `.react-flow__viewport` extends past its container, which has `overflow: visible`; the layer table also exceeds the width. Check `src/components/crosscut/` StackMap container (needs `overflow: hidden` on the flow wrapper and a scroll wrapper for the table).
- **Status:** Fixed 2026-10-14. The overflow came from .sr-only (position: absolute) cells in the layer table whose containing block was the page; td, th, .table-wrap and .cc-frame are now position: relative so they clip inside the scroll frame. The flow canvas was already clipped.

### QA-005 (major) Offline support is a stub
- Steps: load /, /p/x402/, /glossary/ with the service worker allowed, wait, go offline (`context.setOffline(true)`), load /, /p/x402/ (visited) and /p/ap2/ (unvisited).
- Expected: visited pages served from cache, unvisited pages at least a fallback.
- Actual: every navigation fails with ERR_INTERNET_DISCONNECTED. `caches.keys()` is empty. `dist/sw.js` is the one-line placeholder, and `dist/manifest.webmanifest` does not exist although `Base.astro:45` links it (404).
- Source: `scripts/build-sw.ts` lines 4 and 5 only write a placeholder.
- **Status:** Fixed 2026-10-14. scripts/build-sw.ts writes dist/sw.js (precache of 245 files, 35.2 MB of an 80 MB cap; network-first HTML with cache fallback; cache-first /_astro/; stale-while-revalidate otherwise; cache name atlas-<content hash>; old caches deleted on activate) and dist/manifest.webmanifest (colors read from tokens.css). Base.astro already registers /sw.js in production and links the manifest (confirmed). Playwright offline test reloads a visited page and opens unvisited ones.

### QA-006 (minor) j and k shortcuts stall on protocol pages
- /p/x402/, 1440. Press `j` repeatedly then `k`.
- Actual: first `j` goes to section A (scrollY 377); later `j` and `k` do nothing. Expected: step through sections.
- Cause: both `html{scroll-padding-top}` (src/styles/global.css:15) and `.psec{scroll-margin-top}` (protocol.css:129) apply, so section tops land 264 px down; `jumpSection` in src/lib/shortcuts.ts assumes 96 px and re-picks section A. TOC and heading anchors also land 264 px below the top.
- **Status:** Fixed 2026-10-14. Removed the duplicate scroll-margin-top (.psec, source list items, glossary terms); jumpSection now reads the real scroll-padding-top plus scroll-margin-top and re-aligns after lazy diagrams change the layout. TOC and heading anchors now land at one offset.

### QA-007 (minor) Glossary tooltip shows raw markdown and out-of-scope definitions
- /p/x402/, hover the first underlined term "charge". Tooltip shows the Stripe MPP definition with literal backticks around `amount` and `currency`, while the x402 sentence uses "charge" as an ordinary verb. The tooltip has no glossary link until clicked.
- Source: `src/lib/glossary/rehype-glossary.ts` (no protocol scoping; term `charge` has protocols ["stripe-mpp"] in src/content/glossary/terms.json), `src/lib/client/glossary-tooltip.ts` (no markdown stripping).
- **Status:** Fixed 2026-10-14. The glossary rehype plugin now drops terms scoped to other protocols on a protocol page (charge no longer annotates x402 prose); tooltips render backticks as code and show a hint that selecting the term opens the glossary entry.

### QA-008 (minor) "paper in section G" links point to a missing anchor
- /p/visa-tap/ and /p/mastercard-agent-pay/: link `#pub-jiang-2026-formal` has no target (paper not listed in section G).
- Source: `src/content/protocols/visa-tap/security.json:256` and the same field in mastercard-agent-pay.
- **Status:** Fixed 2026-10-14. ThreatTable links to section G only when the paper is listed there; otherwise the link goes to the paper (arXiv) and reads 'paper (not listed in section G)'. The claim text and sources are unchanged.

### QA-009 (minor) Heading levels skip
- /library/ (h1 to h3 on each paper), all 8 /scenarios/<slug>/ (h2 to h4 for step headings). axe heading-order (moderate), 36 page/viewport/theme combinations.
- **Status:** Fixed 2026-10-14. FlowPlayer takes headingLevel (scenario pages use 3, so h2 is followed by h3); the library list has an h2 'Matching entries' before the paper h3s.

### QA-010 (minor) Scenario table with empty header cell
- /scenarios/metered-inference/: axe empty-table-header (minor), first `th` of a table has no text. All four loads.
- **Status:** Fixed 2026-10-14. Content bug: the first header cell of the comparison table in src/content/scenarios/metered-inference.mdx is now 'Aspect'. No claim changed.

### QA-011 (minor) Mobile "View universe" dialog is unreadable at first view
- Home, 375: View universe. The chart fits at about 40 percent scale (labels about 4 px) in a short canvas with empty space; bubbles are 35 px. Needs zoom to read.

### QA-012 (minor) Other 375 px overflow
- /methodology/ (+90, long list items with unbreakable text in Blocked sources), /orbit/erc-3643/ (+20, table), /p/mastercard-agent-pay/ timeline table (+55), /p/stripe-mpp/ (+37, `sup.cite` at right edge).
- **Status:** Fixed 2026-10-14. Causes: auto grid tracks (methodology lists, finding lists), bare Markdown tables (now scroll inside themselves), long hex strings (overflow-wrap), wide cite lists (now wrap), persona columns at 768. Sweep of all 63 pages at 360, 375, 768 and 1440 px shows no sideways scroll.

### QA-013 (minor) Controls cell details appear off-screen
- /controls/, 1440. Click a cell in the first rows. The detail panel renders below the table's scroll box (about 600 px lower), outside the viewport, so nothing seems to happen. Source: `src/components/crosscut/ControlsMap.tsx:162`. The ninth table column is also cut at 1440 with no scroll cue.

### QA-014 (minor) Printing long tables and diagrams
- /p/ap2/ and /p/x402/ with print media: tables 1000 to 3200 px tall and a 3170 px diagram figure have `break-inside: avoid` (src/styles/print.css) so Chrome splits them anyway, possibly mid-row. Add `tr { break-inside: avoid }` and allow tall tables to break. Sidebars, header, copy-link and mode switch are hidden correctly; AP2 prints to about 100 A4 pages.

### QA-015 (minor) Visa TAP playground message "No key for kid undefined"
- /p/visa-tap/ playground, objects tab, clearing the kid: check reads "Key located for kid: No key for kid undefined."
- Source: `src/playgrounds/visa-tap/lib/objects.ts:136` (`JSON.stringify(undefined)`).
- **Status:** Fixed 2026-10-14. The check now reads 'The object has no kid field, so no key can be located.' when kid is absent. Unit test added.

### QA-016 (minor) Quiz answers cluster on options B and C
- All eight quiz.json files: correct answer is B in 53 of 80 questions, C in 25, A in 1 or 2, D in 1. Guessable. Source: `src/content/protocols/*/quiz.json`.

### QA-017 (minor) Empty search results have no message
- /compare/ (search "zzzz") shows an empty table; /glossary/ and /library/ show only a zero count. No "no results" text or guidance.
- **Status:** Fixed 2026-10-14. Glossary and compare already showed a message in the current build; the library had none and now shows one, and the compare and glossary texts now say how to recover. Regression test covers all three.

### QA-018 (cosmetic) Home universe
- Persona panel stays open over the bubbles after a choice. In Orbit mode two satellites overlap the rotated "Card and wallet commerce" label. The universe starts at 620 px, below the fold at 900 px.

### QA-019 (minor) Timeline
- Learn link `/timeline/#lane-Prehistory` does not scroll to the lane (target exists, scrollY stays 0, and the default zoom "2025 onward" hides pre-2020 events). Lane labels are coloured like links but are plain spans (no link to the protocol page).

### QA-020 (cosmetic) Timeline filter layout
- /timeline/ 1440 and 375: Zoom group sits higher than View/From/To; at 375 "2025 onward" wraps inside the bordered group with a gap; Reset floats alone.

### QA-021 (cosmetic) Short protocol names
- Compare, Stack and Controls label Mastercard Agent Pay as "Agent Pay" while menus use the full name.

## Checked and working
HTTP 200 on all pages; 404 page returns 404; no console errors or failed requests (except during a rebuild at /personas/consumer/, ignored); no broken internal links or images in 252 loads; no duplicate ids; every citation marker has a footer entry; axe found only QA-009 and QA-010 (no contrast issues in either theme); command palette via Cmd/Ctrl+K and `/` finds protocol, term, paper; `g h`, `g c`, `g s`, `?`; cite drawer opens with the right source and closes on Escape; theme persists across reload and navigation; skip link; copy-link buttons; mobile menu closes after navigation; home layout modes without overlap; persona dimming; flow player play, pause, step, keys, payload, failures; state machine transitions; quiz and flashcard persistence; notes export, import and flag; BibTeX copy; library BibTeX, RIS, CSV downloads are well formed (432 entries each); compare filters, pick two and radar; glossary 224 terms and 10 stubs; learn checklists persist; random-walk playground runs produced no page errors or NaN.
