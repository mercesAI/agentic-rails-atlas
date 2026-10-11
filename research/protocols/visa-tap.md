# Visa Trusted Agent Protocol research dossier

Slug: `visa-tap`. Research date (accessed date for everything below): 2026-10-11. US spelling. Dates are YYYY-MM-DD. Source ids in brackets refer to `visa-tap.sources.json`.

Repositories read (all under `research/vendor/`):

| Repo | Remote | Commit read | Tag or version read |
| --- | --- | --- | --- |
| `visa-trusted-agent-protocol` | https://github.com/visa/trusted-agent-protocol | `16d59bdf3f8a542bc538d0962edbb80ea30a02af` (2025-10-28) | no tags, no releases; 6 commits 2025-10-12 to 2025-10-28 |
| `visa-mcp` | https://github.com/visa/mcp | `1c544e5c1ed45c8c075ca57e9e76e7876e34fd42` (2026-09-30) | see Ecosystem |

## Identity and governance

- **What it is.** The Trusted Agent Protocol (TAP) is a Visa specification that lets an AI agent prove its identity, and the user authorization it carries, to a merchant by attaching a cryptographic signature to its web requests. The reference repository calls it "a standardized, cryptographic method for an AI agent to prove its identity" (README) [src-visa-tap-repo]. It identifies agents; it does not move money by itself.
- **Owner.** Visa. The reference repository `visa/trusted-agent-protocol` was created on GitHub 2025-10-10T02:05:59Z. It has 6 commits between 2025-10-12 and 2025-10-28 (the last one, "Adding nonce validation sample code", merged as PR #3 on 2025-10-28), no tags and no releases. GitHub reports the license as "Other" (`NOASSERTION`) [src-visa-tap-gh-meta].
- **License.** `LICENSE.md` says that using, downloading or installing the code means accepting the Visa Developer Center Terms of Use and the Visa Trusted Agent Protocol Product Terms; it is not an open source license [src-visa-tap-repo-license].
- **Repository activity after launch.** As of 2026-10-11 the repository shows 212 stars and 45 forks; community pull requests opened after 2025-10-28 (for example #21 "make signature verifier RFC 9421-conformant", opened 2026-07-15) are open and unmerged, and issue #23 (2026-07-18) asks for a worked example of the object signature base because it is under-specified [src-visa-tap-gh-meta].
