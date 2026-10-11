# Mastercard Agent Pay (`mastercard-agent-pay`): research dossier

Accessed 2026-10-11. Research agent output for ATLAS_PROMPT.md Section 5.8 with ATLAS_FOLLOWUP.md corrections 2.1.2, 2.2 (MDES), 2.3.3 and 2.3.6. Inline citations use `[src-...]` ids from `mastercard-agent-pay.sources.json`. Status: in progress; sections below are filled in order.

## Identity and governance

- **What it is.** Mastercard Agent Pay is a proprietary Mastercard program, not an open protocol. The launch release of 2025-04-29 calls it Mastercard's "Agentic Payments Program" and says it introduces Mastercard Agentic Tokens that build on Mastercard's existing tokenization (the same capabilities behind contactless, card-on-file and Payment Passkeys) [src-mcap-launch-2025].
- **Owner and governance.** Mastercard alone sets the program rules (agent registration, merchant registration through acquirers or PSPs, token issuance). No public specification, version number, change log or governance body exists for the program itself; implementation detail is published only as merchant-facing developer guides on developer.mastercard.com [src-mcap-dev-rails] [src-mcap-dev-level1].
- **Verifiable Intent (VI) is separate and open.** VI is an Apache-2.0 specification and Python reference SDK in the GitHub organization `agent-intent` (repository `agent-intent/verifiable-intent`, created 2026-03-05). The README says it is "Maintained by Mastercard; open to multi-stakeholder contribution" and its status is "Draft (v0.1)" [src-mcap-vi-readme] [src-mcap-vi-gh-repo]. The spec authors are listed as the "Verifiable Intent Working Group" [src-mcap-vi-spec].
- **Agent Pay is not AP2.** AP2 is Google's open protocol (donated to FIDO on 2026-04-28). Agent Pay is Mastercard's card-network program. The two meet only through VI, which Mastercard contributed to FIDO the same day and which reuses AP2 v0.2 mandate type strings (see Relations) [src-mcap-fido-pr].
- **"Agentic token" is a Mastercard term here.** At Mastercard it names a network token issued only to registered agents and tied to an agent interaction; Visa uses its own token products (VIC). The same words do not mean the same artifact across networks [src-mcap-launch-2025] [src-mcap-dev-level1].

(Further sub-brands, dates and partners follow under Versions and changelog.)

## Versions and changelog

## Actors and roles

## Core objects with exact field names

## Message flows

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
