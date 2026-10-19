# Playgrounds

One client-side simulation per protocol, shown in section O of the protocol page.

## Contract

- File: `src/playgrounds/<slug>/Playground.tsx`, default export, a React component with no required props.
- Pure logic (encoders, signature helpers, constraint evaluators) goes in `src/playgrounds/<slug>/lib/*.ts`, with Vitest tests in `tests/unit/playgrounds/<slug>.test.ts`. Logic that more than one playground needs goes in `src/lib/playground/` (see below), never in another playground's folder.
- Turn it on by setting `playground.status: ready` in the protocol frontmatter (`src/content/protocols/<slug>/index.mdx`). `playground.note` is shown above the frame when ready, and as the "coming next" text otherwise. The page shows the ComingNext card when the status is `coming-next` or when the file does not exist.

## How the page loads it

`src/components/islands/PlaygroundFrame.tsx` is the island (`client:visible`). It finds the module with `import.meta.glob('../../playgrounds/*/Playground.tsx')`, so each playground is its own JavaScript chunk and is only downloaded when section O scrolls into view. Do not import a playground from anywhere else.

The frame already provides, so the playground must not repeat them:

- the "Simulation, no real funds" label and the spec version the simulation follows (from the main flow's `specVersion`, or the protocol's latest version);
- a Reset button, which remounts the playground (all component state is discarded);
- an error boundary with a reset action;
- a footer line about in-browser keys and no network.

## Rules

- No real funds, keys, wallet connections, sign-ups or network calls. CSP allows `connect-src 'self'` only.
- Keys are generated at mount with WebCrypto (Ed25519, ECDSA P-256) or `viem` local accounts, on a simulated chain id (`eip155:402402`, not assigned in the public chain registry on 2026-10-18), or use fixture data.
- Field names, headers and enum values come from the cloned specs in `research/vendor/`; label payloads "Illustrative example, spec version X".
- Use the kit components below, the shared classes from `src/styles/global.css` (`.btn`, `.segmented`) and tokens from `src/styles/tokens.css` for color. No hard-coded colors, no em dashes in UI strings.
- Keyboard operable, visible focus, labels on every input, `aria-live="polite"` for results, respect `prefers-reduced-motion`.

## Shared helpers and UI kit

Logic that more than one playground needs lives in `src/lib/playground/` (pure functions, no DOM, tested in `tests/unit/lib/playground/`):

- `bytes.ts`: UTF-8, standard base64 with padding, base64url without padding, hex, JSON over base64url, random bytes and SHA-256.
- `canonical-json.ts`: RFC 8785 `canonicalize` and `jsonEqual`.
- `es256.ts`: ES256 keys, raw r||s signatures, compact JWS and the RFC 7638 JWK thumbprint.
- `sd-jwt.ts`: array and property disclosures, the `~` serialization and verifier-side resolution.
- `http-sig.ts`: the RFC 8941 Structured Fields subset and the RFC 9421 signature base, headers and parsing. Signing is a callback, so each playground keeps its own key handling (Visa TAP adds Ed25519 on top).
- `money.ts`: `parseDecimalToMinor` and `formatMinor` on bigint minor units.
- `number-input.ts`: the parsing and clamping rules of `NumberField`.
- `util.ts`: `clone`, `pretty`, `nowSec` and `ellipsize`.

The React shells share `src/components/playground/` (their styles are in `kit.css`, loaded by the components):

- `Segmented`: radiogroup with roving focus (arrows, Home, End), optionally with a visible label.
- `Tabs` and `TabList`: `Tabs` renders the strip and every panel, keeps each panel mounted and hides the inactive ones; `TabList` is the strip alone for shells that render panels themselves.
- `Wire`: a wire-format block with an optional decode toggle; the scrollable block is keyboard focusable and labeled.
- `Note`: a teaching simplification, spec quirk or example label.
- `NumberField`: keeps the typed text in local state, reports a number or null on every edit and clamps to min and max on blur, so clearing a field never snaps back mid-edit.
- `Select` and `Check`.

A playground keeps a local helper only where it formats or validates differently on purpose, and the comment at that helper says why (for example AP2's `formatMinor` accepts non-integer and NaN amounts; Stripe MPP's `parseUnits` keeps its own messages and rejects a trailing point).
