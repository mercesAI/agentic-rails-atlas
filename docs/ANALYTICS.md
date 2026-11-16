# Visitor statistics for atlas.merces.ai

How the site counts people, bots and AI bots on Cloudflare's Free plan, how to set it up, and how Claude Code turns the numbers into a daily brief. Facts below were checked against Cloudflare's documentation on 2026-11-14 (sources at the end), except those marked as measured or read in code; plan-dependent facts are marked.

## What is counted, and where

| Group | Counted by | Unit | 24 h / 7 d / 30 d | Cost |
|---|---|---|---|---|
| People | Cloudflare Web Analytics: a small script that Cloudflare adds to each page at its edge | page views and visits, bot-flagged loads left out | yes, data kept six months | free on every plan |
| Bots and AI bots | Cloudflare's edge, which sees every request; nothing is added to the page | requests, and HTML pages | yes: the edge dataset keeps 31 days and allows 30 days per query on every plan | free |
| One table for all three | `pnpm stats` in this repository, through Cloudflare's GraphQL Analytics API | both of the above, side by side | yes; daily files in `private/stats/` keep older days | free |

Google Analytics is not used. It never sees crawlers (they run no JavaScript), it hides the bots it filters, it needs a cookie banner for EEA, UK and Swiss readers, and its script weighs about 150 KB.

Before this change, Cloudflare was already adding its Web Analytics script to every page, and the site's own Content Security Policy blocked it, so nothing was recorded. The repository change allows that one script and nothing else.

## Step 1. Check Web Analytics in the dashboard (5 minutes)

1. In the Cloudflare dashboard, open **Web Analytics** (use the dashboard search if it is not in the sidebar), open the site for merces.ai, then **Manage site**. One site covers every hostname of the zone, atlas.merces.ai included.
2. See which option is selected:
   - **Enable**: counts every reader. Readers in the EEA, the UK and Switzerland are counted too; whether that needs consent there is a legal question, not a technical one.
   - **Enable, excluding visitor data in the EU**: leaves out readers who connect through Cloudflare data centers in the EEA, the UK and Switzerland. [Free] Cloudflare has switched Web Analytics on in this mode by default for Free domains since 2025-10-15, so this is the likely current setting.
   - **Enable with JS Snippet installation** or **Disable**: not wanted here.
3. Recommended: keep **Enable, excluding visitor data in the EU** unless you have a legal view that allows counting EU readers. Bots are counted at the edge either way.
4. Tell Claude which option is selected before the deploy. The methodology page gets one more sentence if EU readers are left out.
5. Never add a manual snippet as well: Cloudflare allows one beacon per page.
6. Optional: turn on the Web Analytics weekly summary email (visits, page views, median page load time; all plans).
7. When you read numbers in the dashboard, set the **Host** filter to atlas.merces.ai and **Exclude Bots** to Yes. [Free] The beacon runs on every hostname of the zone; to switch it off on another hostname, add a Configuration Rule with the setting "Disable Real User Monitoring (RUM)" (10 Configuration Rules on Free).

## Step 2. Check the bot settings (5 minutes)

1. **AI Crawl Control** needs nothing switched on. Its Overview, Crawlers and Metrics tabs show AI crawlers per crawler, operator and category. [Free] The dashboard shows the last 24 hours and matches crawlers by user agent only. A **Download CSV** file covers those 24 hours, so a longer record by hand means one download a day; `pnpm stats` covers 7 and 30 days without that.
2. In **Security > Settings**, filter **Bot traffic** and open **AI Crawler and Agent access policies**. Confirm that Search, Agent and Training are set to **Allow (do not block)**. A Block there, or Disallow for Training, makes Cloudflare prepend lines to robots.txt when Bot Preference Sync is on, which would contradict `public/robots.txt`.
3. Leave **Bot Fight Mode** off. [Free] It gives no bot report (the requests it challenges appear only as events in Security Analytics), it injects a script that this site's Content Security Policy may refuse, and it strips ETags.

## Step 3. Create a read-only API token (5 minutes)

1. In the dashboard, open **Manage Account > API Tokens** (an account token) or **My Profile > API Tokens** (a user token); either works. Select **Create Token**, then start a custom token: **Get started** in the Custom token section, or start from scratch, depending on which version of the page you see.
2. Name: `atlas stats (read-only)`.
3. Exactly two permissions:
   - an Account policy: **Account Analytics** Read, on your account (people, from Web Analytics);
   - a Zone policy: **Analytics** Read, on the zone merces.ai only (bots and AI bots, from the edge).
4. Set an end date (for example one year from today), create the token and copy it once.
5. Never paste the token into a chat, an issue or a commit.

## Step 4. Store the token and ids (2 minutes)

1. Create `private/stats/.env` in the repository. Git ignores `private/`, and no build tool or Wrangler reads this file:

   ```
   ATLAS_STATS_CF_TOKEN=paste-the-token-here
   ATLAS_STATS_CF_ACCOUNT_ID=32-hex-characters
   ATLAS_STATS_CF_ZONE_ID=32-hex-characters
   ```

   The merces.ai zone's **Overview** page shows the **Zone ID** and **Account ID** under **API**. For the Account ID you can also press Cmd+K in the dashboard and search "Copy account ID".

   `ATLAS_STATS_SITE_TAG` is optional and normally not needed: the script filters Web Analytics by host. If you set it, use the `site_tag` that Cloudflare's API returns for the site (`GET /accounts/{account_id}/rum/site_info/list`), not the `token` in the page's beacon tag; the two are different values, and a wrong one makes people numbers read 0.
2. Run `pnpm stats --check`. It prints which settings it found, what each dataset allows on this plan, which fields exist, and a test query for the last 24 hours. It ends with `Result: ready` when everything works, and with `Result: fix the problems above` when the token, its permissions or a required field is missing (exit code 1 when no dataset can be used at all).
3. If a field shows `no`, the numbers that need it show `n/a` and `pnpm stats` says why in a note. Show the output to Claude; some field names in the Web Analytics dataset (the bot flag in particular) are not documented by Cloudflare, so the first real run is also their test.

The variables start with `ATLAS_STATS_` on purpose: Wrangler reads `CLOUDFLARE_API_TOKEN`, so a read-only token under that name could end up in a deploy.

## Step 5. Deploy the site change

When you say "deploy", Claude pushes `main` and Cloudflare's Workers Builds deploys it. The change:

- `public/_headers`: `script-src` allows `https://static.cloudflareinsights.com` (a host, not a path: the edge loads `/beacon.min.js/<version>` and a manual snippet would load `/beacon.min.js`; a host source covers both). `connect-src` stays `'self'`, because the beacon reports to `/cdn-cgi/rum` on this site.
- `Referrer-Policy` and the `<meta name="referrer">` tag change from `no-referrer` to `same-origin`. Other sites still receive no referrer. Under `no-referrer`, every page opened in a new tab counted as a new visit, and Cloudflare's FAQ says the beacon needs the Referer header.
- The methodology page gets a "Visitor statistics" section, with its Cloudflare source in the source registry; the Notes panel and playground footer wording now promise only what they control.
- `public/robots.txt`: the named AI crawlers now get the `/notes/` rule too (a crawler follows only the most specific group that names it, RFC 9309), with Disallow before Allow for parsers that take the first match. Bingbot keeps access to `/notes/` so it can read that page's `noindex`.

These changes went live on 2026-11-15 with v1.2.

## Step 6. Check after the deploy (10 minutes)

Use a normal browser profile without an ad blocker.

1. Open atlas.merces.ai in a private window. The console shows no Content Security Policy error, `beacon.min.js` loads, and a POST to `/cdn-cgi/rum` answers 204. (`tests/e2e/csp.spec.ts` checks the site's own pages under the same policy locally, with a same-origin stand-in for the beacon, so only this check shows that the policy lets the real beacon load and report.) (A GET to `/cdn-cgi/rum` proves nothing: Cloudflare documents a 405 for it, and on 2026-11-14 it answered 404 even on Cloudflare's own sites.)
2. Within a few minutes, Web Analytics lists atlas.merces.ai under Host.
3. Returning reader, in a normal window (a private window drops its service worker and caches when its last tab closes, so the retry below would start from nothing): open a page and wait until DevTools > Application > Service workers shows `sw.js` as activated (the install fetches about 28 MB of files, about 7 MB compressed). Click a link to another page, then open that page in a new tab from the address bar. `beacon.min.js` should load again, and a POST to `/cdn-cgi/rum` should answer 204. Right after the deploy that ships this fix, the v1.2 worker stays in charge until every tab of the site is closed, and this check can fail once (later deploys do not have this problem); close them all, wait until the new worker is activated and try again. `tests/e2e/analytics-beacon.spec.ts` runs a similar path (a click, then the page in a new tab) against a local stand-in for the edge on `pnpm e2e`; CI does not run it, and it does not replace this check.

On 2026-11-15, after the v1.2 deploy, checks 1 and 3 were run in a headless Chrome against the live site. Check 1 passed for the beacon: `beacon.min.js` answered 200 and each POST to `/cdn-cgi/rum` answered 204. The same run found two older Content Security Policy errors, a data: font on every page and Zod's eval probe on the home page, and the review of the fix found a third, a data: script that the router adds after a click to the glossary; the same change fixes all three (`docs/ARCHITECTURE.md`, the `public/_headers` entry). Check 3 failed, which led to the service worker change described below. Run checks 1 and 3 again after the deploy that ships the fix.

## Daily brief with Claude Code

Ask Claude Code in this repository for "the daily site brief", or run `/site-brief`. The project skill in `.claude/skills/site-brief/` runs `pnpm stats --json` and writes the brief.

- `pnpm stats` prints the table; `pnpm stats --json` prints the same data for an agent; `pnpm stats --no-snapshots` skips the daily files.
- Every run saves each complete UTC day it has not saved yet to `private/stats/daily/<host>/YYYY-MM-DD.json` (up to the 30 days the API still has). A day is saved only when every configured part of it came back, so a failed day is fetched again next time. After 60 days of files, the brief can compare the last 30 days with the 30 before.
- Exit codes: 0 fine; 1 setup problem (missing settings, or the token cannot use any configured dataset); 2 some numbers could not be fetched, the rest are still printed.
- To let Claude Code run the command without asking each time, add this to `.claude/settings.local.json` (not committed): `{"permissions": {"allow": ["Bash(pnpm stats)", "Bash(pnpm stats *)"]}}`.
- To get the brief on a schedule, a macOS job can start Claude Code without a window, for example every morning at 08:00: `cd /Users/admin/Documents/Dev/agentic-rails-atlas && claude -p "/site-brief"`. Ask Claude to set it up if you want it.

## What the numbers mean

| Class | How it is recognized | Examples |
|---|---|---|
| People | Web Analytics page loads not flagged as bots | |
| Search engine crawlers | user agent token, or Cloudflare's "Search Engine Crawler" category | Googlebot, bingbot, Applebot |
| AI training crawlers | token, or the "AI Crawler" category | GPTBot, ClaudeBot, CCBot, meta-externalagent, Amazonbot, Bytespider |
| AI search crawlers | token, or the "AI Search" category | OAI-SearchBot, Claude-SearchBot, PerplexityBot, Amzn-SearchBot |
| AI assistants on a user's request | token, or the "AI Assistant" category | ChatGPT-User, Claude-User, Perplexity-User, DuckAssistBot |
| AI browser agents (named in the user agent) | token only; agents that only sign their requests with Web Bot Auth, such as ChatGPT's cloud browser, are visible only to a Worker or Logpush | Claude-Agent, Google-Agent |
| Other bots | other declared bots | GoogleOther, facebookexternalhit, uptime monitors, feed readers |
| Unknown automated | empty user agents, HTTP libraries, headless browsers | curl, python-requests, HeadlessChrome |
| Browser-like | everything that looks like a browser | an upper bound for people |

The token list lives in `scripts/stats/classify.ts`. A known token without a Cloudflare verified-bot category is counted in its class but reported as "without a verified-bot category" (claimed): spoofers and de-listed bots land there.

Read the numbers with these limits:

- People are a lower bound: ad and tracker blockers (uBlock Origin's default lists, Brave) stop the beacon, the EU-excluding option, if it is selected (step 1), leaves out readers who connect through data centers in the EEA, the UK and Switzerland, and a few returning readers are missed (see "Returning readers and the service worker").
- Edge figures that read the Referer header see this site as Referer for a returning reader who arrives from another site through the service worker: the request logs lose that referral, and on Pro, Zone Analytics does not count that page view as a visit and the AI referral counts leave it out. Web Analytics and `pnpm stats` read `document.referrer` and are not affected.
- AI agents that drive a real browser (ChatGPT's cloud browser in dots, Claude-Agent, Google-Agent) run the beacon and can be counted as people. ChatGPT's cloud browser documents no user agent token; it signs requests with Web Bot Auth, which only a Worker or Logpush can see.
- Edge numbers are requests, not people. HTML page counts include the service worker fetching every page once per new reader and per deploy, so browser-like pages overstate people.
- Your own visits count; the beacon keeps no state that could exclude you.
- [Free] Anything older than 31 days exists only in the daily files.

## What upgrading adds

| Plan | Price (2026-11-14) | Adds for statistics |
|---|---|---|
| Free | $0 | everything above |
| Pro | $20 a month billed yearly, $25 monthly | edge page views and visits in Zone Analytics with a user agent filter; AI referral counts (people sent by AI apps) in AI Crawl Control; a 24-hour Bot Report |
| Business | $200 a month billed yearly, $250 monthly | Bot Analytics, 72 hours at a time, up to 30 days back |
| Enterprise with Bot Management | contract | bot scores and Business Insights for 24 h, 7 d and 30 d |

Free is enough for the basic split. Pro is worth it only if you want referral counts from AI apps (which miss some returning readers; see the limits above) or Cloudflare's own bot report.

## Returning readers and the service worker

The check of 2026-11-15 found that a returning reader was not counted. Three facts combined:

1. Measured with curl on 2026-11-15 (Cloudflare does not document this, so it can change): the edge adds the beacon tag only to HTML asked for with `text/html` in the Accept header, and that response has no ETag. HTML asked for otherwise has no tag and has an ETag, and the edge answers a matching `If-None-Match` with 304 whatever the Accept header says.
2. The service worker (`scripts/build-sw.ts`) precached pages with a plain fetch, and the router (Astro's ClientRouter) fetches each page a reader reaches by a click without `text/html` as well (so does its hover prefetch in a browser without link prefetch, such as Safari, where Astro prefetches with a plain fetch). Both left a copy without the tag, with an ETag, in the browser's HTTP cache, and the worker also kept the router's copies in its own cache.
3. A page opened later from the address bar, a bookmark or a new tab went through the worker, which revalidated the HTTP cache copy: the edge answered 304, and the page showed without the tag.

The worker now precaches pages with a browser's Accept header, so its copies carry the tag; fetches every navigation with `cache: 'reload'`, so a copy in the HTTP cache is never revalidated; and stores a router answer only for a page it does not hold yet, so a copy with the tag is never replaced by one without it. Inside the site, the beacon follows clicks by itself (its SPA mode). Nothing is counted twice: the router does not run a script whose source already ran, and the beacon returns at once when it has already started (its load setting defaults to single; both read in code, see Sources). `tests/e2e/analytics-beacon.spec.ts` follows these paths against a stand-in for the edge (`tests/e2e/support/edge-server.ts`).

This fix keeps the automatic beacon and whichever Manage site option is selected (step 1). The other fix considered, adding the beacon snippet to the pages ourselves, needs the snippet option in Manage site and `https://cloudflareinsights.com` in `connect-src`, and would also count readers in the EU, since the EU-excluding option only stops the automatic tag.

Still missed:

- readers on a first visit, a new private window included, who open a page directly before the worker has finished installing, if they reached that page before by a click (in Safari also by a hover);
- returning readers still controlled by the v1.2 worker (the new worker does not skip waiting), until every tab of the site has closed once: pages they reached by a click (in Safari also by a hover) since the deploy, and most pages on a network slower than 4 seconds, because that worker's own copies lack the tag; later deploys do not have this gap;
- a page that the worker first stored from a router answer (a page added by a later deploy while an older worker still controls the browser, or a page over the precache size cap; none today), when it is opened directly on a network slower than 4 seconds;
- a reader who follows a link before `beacon.min.js` has run on the first page: the beacon then finds no settings on the page that replaced it;
- readers who are offline: the beacon may load from the browser cache, but its report to `/cdn-cgi/rum` cannot be sent.

The costs: a page asked for with `text/html` comes without an ETag, so every navigation through the worker downloads the whole page (the only 304 it could have had was for a copy without the tag), and so does a router fetch or prefetch when the copy in the HTTP cache came from the install or a navigation; under the v1.2 worker most of these were 304 answers. And the worker's request cannot carry a referrer from another site (the Fetch standard replaces it with the worker's own URL), so for a returning reader who follows a link from another site the edge sees this site as Referer, with `Sec-Fetch-Mode: same-origin` and `Sec-Fetch-Dest: empty` instead of `navigate` and `document`. Web Analytics is not affected, since the beacon reports `document.referrer`.

## Sources (read 2026-11-14; measured and read in code 2026-11-15)

- Web Analytics: overview https://developers.cloudflare.com/web-analytics/ , FAQ (CSP entries, one snippet per page, Referer, blockers, sampling) https://developers.cloudflare.com/web-analytics/faq/ , get started and Manage site https://developers.cloudflare.com/web-analytics/get-started/ , metrics https://developers.cloudflare.com/web-analytics/data-metrics/high-level-metrics/ , dimensions https://developers.cloudflare.com/web-analytics/data-metrics/dimensions/ , limits https://developers.cloudflare.com/web-analytics/limits/ , weekly email https://developers.cloudflare.com/web-analytics/get-started/notifications/
- Beacon privacy: https://developers.cloudflare.com/speed/observatory/rum-beacon/ ; default on Free since 2025-10-15: https://blog.cloudflare.com/the-rum-diaries-enabling-web-analytics-by-default/
- Zone Analytics: https://developers.cloudflare.com/analytics/account-and-zone-analytics/zone-analytics/ ; 30 days on every plan: https://developers.cloudflare.com/changelog/post/2026-10-02-30-days-analytics-on-every-plan/
- GraphQL Analytics API: https://developers.cloudflare.com/analytics/graphql-api/ , settings node https://developers.cloudflare.com/analytics/graphql-api/features/discovery/settings/ , limits https://developers.cloudflare.com/analytics/graphql-api/limits/ , errors https://developers.cloudflare.com/analytics/graphql-api/errors/ , token https://developers.cloudflare.com/analytics/graphql-api/getting-started/authentication/api-token-auth/ , permissions https://developers.cloudflare.com/fundamentals/api/reference/permissions/
- AI Crawl Control: https://developers.cloudflare.com/ai-crawl-control/ , get started https://developers.cloudflare.com/ai-crawl-control/get-started/ , analyze traffic https://developers.cloudflare.com/ai-crawl-control/features/analyze-ai-traffic/ , categories https://developers.cloudflare.com/ai-crawl-control/reference/glossary/ , bot reference https://developers.cloudflare.com/ai-crawl-control/reference/bots/ , GraphQL https://developers.cloudflare.com/ai-crawl-control/reference/graphql-api/
- Bots: Free plan https://developers.cloudflare.com/bots/plans/free/ , Bot Fight Mode https://developers.cloudflare.com/bots/get-started/bot-fight-mode/ , access policies https://developers.cloudflare.com/bots/additional-configurations/block-ai-bots/ , managed robots.txt https://developers.cloudflare.com/bots/additional-configurations/managed-robots-txt/ , verified bots https://developers.cloudflare.com/bots/concepts/bot/verified-bots/ , Web Bot Auth https://developers.cloudflare.com/bots/reference/bot-verification/web-bot-auth/
- Plans and prices: https://www.cloudflare.com/plans/
- Measured 2026-11-15 (curl and a headless Chrome): how atlas.merces.ai answers with and without `text/html` in Accept and with If-None-Match, and the beacon script that the edge adds (`beacon.min.js`, a module script).
- Read 2026-11-15 in the beacon's own code: it finds its settings in the first `script[data-cf-beacon]` (a module script has no `document.currentScript`), sets `load` to single unless it is multi and then returns at once on a second start, follows client-side navigations through the History and Navigation APIs, and reports `document.referrer`.
- Read 2026-11-15 in Astro's router (`node_modules/astro/dist/transitions/`): it does not run a swapped-in script whose source (or inline text) already ran, and it appends a data: module script after a navigation into a page whose last new module script is inline.
- Crawler documentation by operator: OpenAI https://developers.openai.com/api/docs/bots , Anthropic https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler , Perplexity https://docs.perplexity.ai/docs/resources/perplexity-crawlers , Google https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers , Apple https://support.apple.com/en-us/119829 , Meta https://developers.facebook.com/documentation/sharing/webmasters/web-crawlers , Amazon https://developer.amazon.com/docs/amazonbot/amazonbot.html , DuckDuckGo https://duckduckgo.com/duckduckgo-help-pages/results/duckassistbot , Mistral https://docs.mistral.ai/robots
