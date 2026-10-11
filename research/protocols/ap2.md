# AP2 research dossier

Slug: `ap2`. Research date (accessed date for everything below): 2026-10-11. US spelling. Dates are YYYY-MM-DD. Source ids in brackets refer to `ap2.sources.json`.

Repositories read (all under `research/vendor/`):

| Repo | Remote | Commit read | Tags read |
| --- | --- | --- | --- |
| `AP2` | https://github.com/google-agentic-commerce/AP2 | `e1ea56db72a6385bce3e5c1112b3a56ce60acb43` (2026-04-29, head of `main`) | `v0.1.0` (`bb57b6bfdb9a1caafffe7d024ca04d99cefa40be`), `v0.2.0` (`b4587ac1d055888a73b4b21750973cffba961793`) |

## Identity and governance

- **What it is.** The Agent Payments Protocol (AP2) is an open protocol that defines signed "mandates": verifiable records of what a user authorized an agent to buy or pay. The repository describes itself as code samples and demos of the protocol; the specification lives in `docs/ap2/` [src-ap2-repo]. AP2 is not a payment rail: it carries authorization evidence on top of existing card, bank and other rails.
- **Origin and repository.** Google created the GitHub repository `google-agentic-commerce/AP2` on 2025-05-30; it is published under Apache-2.0 and links `https://ap2-protocol.org/` as its homepage. As of 2026-10-11 the repository shows 3,216 stars, 510 forks and 174 open issues and pull requests [src-ap2-gh-repo]. The `METADATA` file shows that the public repository is exported by Copybara from Google's internal `third_party/ap2` tree, owned by "agentic-payments-team" [src-ap2-repo].
- **Tags and releases.** GitHub releases `v0.1.0` (published 2025-09-16) and `v0.2.0` (published 2026-04-28). `CHANGELOG.md` dates 0.1.0 at 2025-09-16 ("Create Agent Payments Protocol (AP2)") and 0.2.0 at 2026-04-28 ("Release of V2", commit `b4587ac`) [src-ap2-gh-releases] [src-ap2-changelog].
- **Repository activity.** The last commit on `main` is `e1ea56d` "fix: remove uvlock (#246)", 2026-04-29. No commit has landed on `main` since then as of 2026-10-11 [src-ap2-gh-commits].
