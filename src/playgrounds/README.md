# Playgrounds

One client-side simulation per protocol, shown in section O of the protocol page.

## Contract

- File: `src/playgrounds/<slug>/Playground.tsx`, default export, a React component with no required props.
- Pure logic (encoders, signature helpers, constraint evaluators) goes in `src/playgrounds/<slug>/lib/*.ts`, with Vitest tests in `tests/unit/playgrounds/<slug>.test.ts`.
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
- Keys are generated at mount with WebCrypto (Ed25519, ECDSA P-256) or `viem` local accounts, on fake chain identifiers such as `eip155:31337` or `eip155:424242`, or use fixture data.
- Field names, headers and enum values come from the cloned specs in `research/vendor/`; label payloads "Illustrative example, spec version X".
- Use the shared classes from `src/styles/global.css` (`.btn`, `.segmented`) and tokens from `src/styles/tokens.css` for color. No hard-coded colors, no em dashes in UI strings.
- Keyboard operable, visible focus, labels on every input, `aria-live="polite"` for results, respect `prefers-reduced-motion`.
