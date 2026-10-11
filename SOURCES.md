# SOURCES.md: how sources are managed

## Registry
- Every source is a record in `src/content/sources/sources.json` (schema: `Source` in ATLAS_PROMPT.md 12.3).
- IDs are `src-<protocol-or-topic>-<short-slug>` (example `src-x402-spec-v2`). IDs are stable; never reuse an ID for a different URL.
- Research-stage records live in `research/protocols/<slug>.sources.json` and are merged into the registry by `scripts/verify/merge-sources.ts`.

## Claims
- A claim is one plain sentence with `sources[]`, `confidence` and (for numbers and time-sensitive statements) `asOf`.
- Confidence: `verified` = a primary source was read during the build; `reported` = reputable secondary only; `unverified` = shown with a visible badge or left out.
- Claims live next to the content they support (`facts.json`, `security.json`, ...) and are referenced by ID from MDX through `<Cite ids="..." />`.

## Dates
- `accessed` is the date the source was read in this build. The build date for this session is 2026-10-10.
- `published` is the date the publisher states; absent when unknown.

## Conflicts and blocks
- Conflicting sources: both are kept, the primary one is named, and the conflict is logged in `research/conflicts.md`.
- Blocked or unreachable sources are logged in `research/blocked.md` with the date and the alternative used.

## Publications
- Verified only (DataCite, Crossref, DOI content negotiation, arXiv abstract page, or publisher page), with `verifiedAt` and `verifiedVia` stored on every entry.
- Grey literature is tagged `relation: grey` and shown in a separate list.

## Licenses and quotations
- At most one quotation under 15 words per source across the whole site. Spec text is linked, never copied.
