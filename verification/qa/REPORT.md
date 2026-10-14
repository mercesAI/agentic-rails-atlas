# QA report: Agentic Rails Atlas (work in progress)

Date: 2026-10-14. Tested against http://localhost:4321 (dist build), Chrome via Playwright, 1440 and 375 px, light and dark.
Known bugs excluded by request: reading-mode switch has no visible effect; wide Mermaid diagrams shrink.

## Bugs found so far (interim, area 2 to 4)

### QA-001 (major) j and k shortcuts stall on protocol pages
- Page: /p/x402/ (all protocol pages), 1440x900, light.
- Steps: load page, press `j` repeatedly, then `k`.
- Expected: each `j` moves to the next section, `k` to the previous.
- Actual: first `j` scrolls to section A (scrollY 377), every later `j` and `k` leaves scrollY at 377.
- Cause: `.psec` has `scroll-margin-top: var(--proto-top)` and `html` has `scroll-padding-top`, so both apply (264 px). `jumpSection` assumes a 96 px offset, so section A still reads as "below" after landing and is re-selected. Heading anchors and the TOC also land 264 px below the top edge.
- Source: src/lib/shortcuts.ts (jumpSection), src/styles/global.css:15, src/components/protocol/protocol.css:129.

### QA-002 (minor) glossary tooltip: raw markdown and wrong-context term
- Page: /p/x402/, 1440, light. Hover the first underlined term "charge" in the main text.
- Actual: tooltip shows the Stripe MPP definition ("The MPP intent for a single payment of a fixed `amount`...") with literal backticks; the x402 sentence uses "charge" as an ordinary verb. The tooltip has no glossary link until the term is clicked (spec 4.6 and the component contract say the tooltip links to /glossary/#id).
- Source: src/lib/glossary/rehype-glossary.ts (links terms regardless of protocol scope; glossary term `charge` has protocols ["stripe-mpp"]), src/lib/client/glossary-tooltip.ts (no markdown stripping), src/content/glossary/terms.json.
