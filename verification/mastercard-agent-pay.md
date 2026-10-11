# Verification report: mastercard-agent-pay

Verifier: independent agent, 2026-10-11. Scope per `docs/briefs/VERIFIER_BRIEF.md`, ATLAS_PROMPT.md Section 5.8, ATLAS_FOLLOWUP.md Section 2 and the Agent Pay rows of ATLAS_ERRATA.md.

Status: in progress. Sections are filled as each check completes.

## Structural findings (claims.json, all 243 claims)

| Id | Verdict | Evidence | Note |
|---|---|---|---|
| clm-mastercard-agent-pay-216 | fail | claims.json; sources.json `src-mcap-pymnts-vi` has `primary: false` | marked `verified` with only a non-primary source; downgrade to `reported` or add a primary source |

Every claim carries an `asOf` value, so no claim fails the "number or date without asOf" rule.
