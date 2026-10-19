# Playground brief (one protocol)

You build the client-side simulation for one protocol of the Agentic Rails Atlas. Your protocol slug and its private/ATLAS_PROMPT.md section number are given in your task message. Today is 2026-10-11.

## Read first
1. `docs/ARCHITECTURE.md` sections 1, 6, 8 and 11.
2. private/ATLAS_PROMPT.md Section 2.5 (safety: no real funds, no mainnet, no private keys from the user, no wallet connections, no sign-ups; ephemeral in-browser keys on fake chain ids or fixtures; the UI says it is a simulation), and the "Playground" paragraph of your Section 5.n, which is the feature list you implement.
3. The spec files in `research/vendor/` for your protocol and the dossier `research/protocols/<slug>.md` (Core objects, Message flows). Every header, field name, enum and error code in the simulation must match the spec file; grep it, never guess.
4. `src/components/islands/PlaygroundFrame.tsx` (wrap your component in it) and the flow JSON in `src/content/flows/<slug>-*.json` (reuse its step order and payload shapes where it exists).

## Files you own
- `src/playgrounds/<slug>/Playground.tsx`: default export, no required props, React 19, `'use client'` not needed (Astro island). Mounted by `src/components/protocol/sections/o-playground.astro` with `client:visible`.
- `src/playgrounds/<slug>/lib/*.ts`: pure logic (encoders and decoders, state machines, constraint evaluators, signature and hash helpers, fixture data). No React imports. Each exported function has a Vitest test in `tests/unit/playgrounds/<slug>.test.ts`.
- `src/playgrounds/<slug>/README.md`: what the simulation covers, which spec version it follows, which simplifications it makes (each labeled in the UI as "teaching simplification").

## Rules
- Cryptography: WebCrypto (`crypto.subtle`) for Ed25519, ECDSA P-256 (ES256), HMAC and SHA-256; `viem` (installed) for EIP-712 typed data hashing and signing with `privateKeyToAccount(generatePrivateKey())`; `jose` (installed) for JWT and JWS where the protocol uses them. Keys are generated at mount and never persisted. Chain ids are simulated ones that the public chain registry (chainid.network) does not assign, such as `eip155:402402`; addresses and tokens are fixtures; the UI shows a "Simulation, no real funds" banner from PlaygroundFrame.
- Show the wire format: when the protocol defines headers or JSON, render the exact bytes the real protocol would carry (base64 or base64url where the spec says so) with a decode toggle, and label every example "Illustrative example, spec version X".
- Failure injection: every playground has a way to make the flow fail in the ways the spec describes (expired window, wrong recipient, replayed nonce, exceeded limit, missing signature) and shows the protocol's own error code or outcome.
- Accessibility: every control has a label, the flow is keyboard operable, state changes are announced in an `aria-live="polite"` region, colors come from tokens and are never the only signal.
- Size: no new dependencies; import `viem` and `jose` from submodules or named exports so the island chunk stays small; report the gzipped chunk size from `dist/_astro` after `pnpm build`.
- Content rules apply to UI text: no em dashes, no banned phrases, US spelling, sentence case.

## Finish
`pnpm exec vitest run tests/unit/playgrounds/<slug>.test.ts`, `pnpm exec tsc --noEmit -p tsconfig.json` (your files), `pnpm build`. Do not edit `src/content/protocols/<slug>/index.mdx`; instead write `docs/integration-notes/playground-<slug>.md` with the line to set in its frontmatter: `playground: { status: 'ready', component: '<slug>' }` plus a one-paragraph note of what the simulation covers. Final reply: features implemented against the Section 5.n list (done, partial, skipped with reason), test count, chunk size.

## Scratchpad
Several agents share the session scratchpad. Put your temporary files in a subfolder named after your task (for example `scratchpad/<slug>-writer/`) so no other agent overwrites them. Never keep anything the repository needs in the scratchpad.

## Git safety
Many agents commit to `main` at the same time. Stage files by explicit path only; never use `git commit -a`, `git add -A` or `git add .`. Never rewrite or move history: no `git reset`, `git rebase`, `git commit --amend`, `git update-ref`, `git push --force`, `git checkout -- <file>` on files you do not own, or `git stash`. If you commit something by mistake, leave it and say so in your final reply.
