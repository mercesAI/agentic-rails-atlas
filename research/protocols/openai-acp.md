# OpenAI ACP (Agentic Commerce Protocol) research dossier

Slug: `openai-acp`. Research date (accessed date for everything below): 2026-10-11. US spelling. Dates are YYYY-MM-DD.

Repositories read (all under `research/vendor/`):

| Repo | Remote | Commit read | Version read |
| --- | --- | --- | --- |
| `acp` | https://github.com/agentic-commerce-protocol/agentic-commerce-protocol | `7fdd78df677a94dce04c770644b0fbbb1401272b` (2026-07-17 21:51:51 -0700, "SEP: Optional product URL on checkout Item (#281)"; shallow clone, 1 commit) | spec folders `2025-09-29`, `2025-12-12`, `2026-01-16`, `2026-01-30`, `2026-04-17` (latest dated snapshot), `unreleased` |

Source ids in brackets refer to `openai-acp.sources.json`. This is the Agentic Commerce Protocol from OpenAI and Stripe. It is not the IBM Agent Communication Protocol, not the Virtuals Agent Commerce Protocol and not the Agent Client Protocol (see "Disambiguation" under Criticisms).

## Identity and governance

- **What it is.** The repository README describes ACP as "an interaction model and open standard" that connects buyers, their AI agents and businesses to complete purchases. The README says the specification is maintained by OpenAI and Stripe and is in `beta`; the status badge reads "Beta" [src-openai-acp-readme]. The core RFCs carry `**Status:** Draft` (`rfc.agentic_checkout.md`, `rfc.delegate_payment.md`, `rfc.payment_handlers.md`, `rfc.extensions.md`, `rfc.orders.md`, `rfc.delegate_authentication.md`, `rfc.discount_extension.md`, `rfc.seller_backed_payment_handler.md`); newer RFCs carry `**Status:** Proposal` (`rfc.capability_negotiation.md`, `rfc.cart.md`, `rfc.discovery.md`, `rfc.product_feeds.md`, `rfc.intent_traces.md`, `rfc.affiliate_attribution.md`, `rfc.marketing_consent.md`) [src-openai-acp-rfc-checkout] [src-openai-acp-rfcs-dir].
- **Who.** The README badge reads "Maintained by OpenAI & Stripe". `MAINTAINERS.md` lists three lead maintainers: OpenAI, Stripe and Meta (Meta was added by PR #236, "ADMIN: Add Meta as TSC member", committed 2026-04-24) [src-openai-acp-maintainers] [src-openai-acp-gh-commits].
- **Repository.** GitHub `agentic-commerce-protocol/agentic-commerce-protocol`, created 2025-09-29T04:09:29Z, the same day as the "Initial commit" and the ChatGPT Instant Checkout launch. Homepage `https://agenticcommerce.dev`. On 2026-10-11 the repository had 1,570 stars and 253 forks; the last push was 2026-07-18T04:51:51Z (commit `7fdd78d`, 2026-07-17 Pacific time) [src-openai-acp-gh-repo].
- **No GitHub releases or tags.** The GitHub API returns zero releases and zero tags. Versions are dated folders under `spec/` and changelog files, not Git tags. "Latest release" therefore means the newest dated folder, `spec/2026-04-17/`, promoted by PR #227 "RELEASE: 2026-04-17" (commit 2026-04-17) [src-openai-acp-gh-commits] [src-openai-acp-changelog-20260417].
- **License.** `LICENSE` is Apache License 2.0. `NOTICE` reads "Copyright 2025 OpenAI" and "Copyright 2025 Stripe" [src-openai-acp-license].
- **CLA and legal basis.** Contributions require a CLA. `legal/cla/SIGNATORIES.md` cites Section 2.4 of a "Collaboration and Governance Agreement dated November 21, 2025" and was last updated 2026-06-03. Corporate signatories with signing dates: Stripe, Inc. (2025-11-21), OpenAI LLC (2025-11-21), Adyen N.V. (2026-01-28), Wix.com Ltd. (2026-02-19), commercetools Inc. (2026-02-19), OpenCommerce Network Inc. (2026-02-26; its authorized users include a `nekuda-ai` account), Affirm Inc. (2026-03-09), Meta Platforms, Inc. (2026-03-19), Agentic Commerce Inc. (Catalog) (2026-03-30), PayPal, Inc. (2026-04-16) [src-openai-acp-cla-signatories]. The seed listed "nekuda"; the file names the corporation "OpenCommerce Network Inc.", so nekuda's link is through a GitHub user name only.
- **Governance model.** `docs/governance.md` was first added by PR #43 (2025-12-02) and replaced by PR #173 "ADMIN: Revised governance model" on 2026-03-10 [src-openai-acp-governance] [src-openai-acp-gh-commits]. It defines:
  - a Technical Steering Committee (TSC) of up to 7 seats, one organization per seat, appointed by the Founding Maintainers (OpenAI and Stripe) on criteria of shared vision, contributions and time commitment, reviewed quarterly;
  - current TSC: seat 1 OpenAI (`aravindrao-openai`), seat 2 Stripe (`prasad-stripe`), seat 3 Meta (`lhwa`);
  - Specification Enhancement Proposals (SEPs) for major and process changes: a TSC sponsor, a mandatory 7-business-day public review spanning at least one weekly meeting, and a simple majority (50%+1) TSC vote; standard PRs need two TSC approvals (one may come from a recognized Domain Working Group member);
  - Domain Working Groups (DWGs), recognized by TSC simple majority when members come from at least two organizations;
  - a Founding Maintainers' reserve veto, limited to SEPs, usable only to block (never to force) a change, with a written explanation;
  - a stated long-term goal of moving to a neutral foundation "similar to" the Linux Foundation or OpenJS Foundation, with four preconditions. No foundation exists today.
- **No membership fees.** The governance FAQ says there are no fees for the TSC or DWGs [src-openai-acp-governance].
- **Operating model.** `docs/operating-model.md`: a weekly 30-minute Thursday TSC meeting, a weekly triage rotation by seat order with a 2-business-day initial response target, Discord and GitHub as channels [src-openai-acp-operating-model].
- **Mission.** `docs/principles-mission.md` lists principles including trust, security and compliance; real-world use; and being open and neutral (agnostic to agents, PSPs, sellers, transports and payment methods) [src-openai-acp-principles].
- **Launch.** OpenAI announced Instant Checkout in ChatGPT and the open-sourced ACP on 2025-09-29 ("Buy it in ChatGPT") [src-openai-buy-it]. Stripe announced the same day that it co-developed ACP and launched Shared Payment Tokens [src-stripe-acp-launch].

## Versions and changelog

## Actors and roles

## Core objects with exact field names

## Message flows step by step

## State machines

## Transports

## Cryptography and standards used

## Security model and published attacks or CVEs

## Controls

## Observability

## Compliance touchpoints

## Ecosystem and SDKs

## Fees and costs

## Metrics with dates and caveats

## Relations to the other seven protocols

## Criticisms and open questions

## Resources

## Publications

## Seed audit

## Blocked sources

## Conflicts

## Least certain
