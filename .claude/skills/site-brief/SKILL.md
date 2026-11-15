---
name: site-brief
description: Daily traffic brief for atlas.merces.ai (people, bots and AI bots for 24 hours, 7 days and 30 days) from Cloudflare via `pnpm stats --json`. Use when the owner asks for the daily site brief, site stats, visitors, bot or AI crawler traffic.
---

# Daily site brief

1. Run `pnpm stats --json` in the repository root. It is read-only and also saves any missing daily files under `private/stats/daily/<host>/`.
   - Exit code 1 means a setup problem (settings missing, or the token cannot use any configured dataset, for example a missing permission or an expired token): say so, point the owner to `docs/ANALYTICS.md` steps 3 and 4 and to `pnpm stats --check`, and stop.
   - Exit code 2 means some numbers could not be fetched: brief on what came back and list the `errors` at the end.
2. Write the brief in plain language, at most about 15 lines, in this order:
   - **People, last 24 hours**: `windows.24h.people.pageViews` page views and `visits` visits, with `changes.24h.peoplePageViews` against the 24 hours before. Then the 7-day figures with `changes.7d`.
   - **AI bots, last 24 hours**: `windows.24h.headline.aiBots.requests` requests, split by class (`edge.classes.aiTraining`, `aiSearch`, `aiAssistant`, `aiAgent`), and the change. Name the top three agents of `topAiAgents7d` with their operators. If `edge.classifiable` is false, the classes are unknown (`null` in the headline): say that bots could not be classified, not that there were none.
   - **Other bots**: `headline.otherBots.requests` (search engines, other declared bots, unknown automated).
   - **Top pages and referrers for people, 7 days**: up to three each from `topPages7d` and `topReferrers7d` (the site's own pages are already left out of referrers); call out AI referrers such as chatgpt.com, perplexity.ai or claude.ai.
   - **30 days**: the three headline numbers of `windows.30d`, and `changes.30d` once snapshots allow it.
   - **Watch**: anything unusual, for example a new AI agent in `topAiAgents7d`, `claimed` requests (known bot names without a Cloudflare verified-bot category), `notClassified` above zero, or a change above 50 percent either way.
3. Keep the units apart: people are page views from the Web Analytics beacon (a lower bound); bots are requests at Cloudflare's edge. Never add them together or present browser-like edge requests as people.
4. Mention a `notes` entry only when it changes how a number reads (for example the 30-day comparison still waiting for snapshots, or a missing field). Never print the token or the contents of `private/stats/.env`.
