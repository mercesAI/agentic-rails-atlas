
## 2026-10-10, publications part b (commerce and benchmarks; security; reputation and Sybil)

- dblp.org search API: anti-bot challenge page returned instead of JSON for every query, some requests timed out. Alternative used: OpenReview, proceedings.neurips.cc, doi.org content negotiation, Semantic Scholar (secondary only).
- dl.acm.org: HTTP 403 for 10.1145/355112.355122 (Resnick 2000) and 10.1145/775152.775242 (Kamvar 2003). Alternative used: doi.org CSL JSON for metadata, OpenAlex for abstracts.
- sciencedirect.com: HTTP 403 for 10.1016/j.dss.2005.05.019 (Josang 2007). Alternative used: authors' preprint PDF at folk.universitetetioslo.no.
- link.springer.com: served no abstract for 10.1007/3-540-45748-8_24 (Douceur 2002). Alternative used: Microsoft Research publication page.
- api2.openreview.net: 403 "Challenge verification required" after about ten requests; WebArena, tau-bench and WASP records captured before the block.
- proceedings.neurips.cc 2025 listing incomplete (64 entries) on the access date; WASP venue confirmed via OpenReview instead.
- escience-conference.org/2026/papers: reachable; accepted list does not include arXiv:2609.19502 despite the arXiv comment. Venue left unconfirmed.
- 2026-10-11, ap2: https://fidoalliance.org/fido-alliance-to-develop-standards-for-trusted-ai-agent-interactions/: curl returned HTTP 403; alternative used: WebFetch of the same URL (succeeded).
- 2026-10-11, ucp: https://www.warren.senate.gov/?p=31789 and /newsroom/news-coverage/...: HTTP 403; alternative used: eWeek 2026-02-05 coverage (letter marked reported)
- 2026-10-11, ucp: https://www.searchenginejournal.com/ (UCP March update article): HTTP 403; alternative used: techwyse.com coverage (reported)
- 2026-10-11, ucp: https://searchengineland.com/google-opens-native-ai-checkout-to-eligible-shopify-merchants-490407: HTTP 403; alternative used: ppc.land 2026-09-23 (reported)
- 2026-10-11, openai-acp: https://openai.com/index/buy-it-in-chatgpt/ and https://openai.com/index/powering-product-discovery-in-chatgpt/: HTTP 403 to curl and WebFetch; alternative used: Wayback Machine snapshots 20261007012440 and 20260929220135 (text read from the archived HTML).
- 2026-10-11, ucp: https://fidoalliance.org/google-donates-agent-payments-protocol-to-fido-alliance/: HTTP 403; alternative used: Google blog 2026-04-28 post
- 2026-10-11, erc-8004: https://www.fireblocks.com/blog/agentic-payment-protocols-compared: HTTP 403 to curl; alternative used: none needed (cross-cutting resource left out of the ERC-8004 list)
- 2026-10-11, erc-8004: https://docs.polygon.technology/payment-services/agentic-payments/erc8004: HTTP 404; alternative used: agentic-docs.polygon.technology page (200), not cited
- 2026-10-11, erc-8004: eth_getLogs over 10,000-block ranges on mainnet.base.org and base-rpc.publicnode.com: errors or empty responses; alternative used: eth_estimateGas through cast for gas figures
- 2026-10-11, erc-8004: https://agentscan.info: counts render client-side, no numbers in HTML; alternative used: 8004scan.io and the CSOAI census for metrics
- 2026-10-11, visa-tap: https://investor.visa.com/news/news-details/2025/Akamai-and-Visa-Collaborate-to-Build-Trust-in-Agentic-Commerce/default.aspx: curl HTTP 403; alternative used: Akamai press release (WebFetch) and Visa 2025-12-18 release.
- 2026-10-11, visa-tap: https://www.businesswire.com/news/home/20260703072567/en (eDreams ODIGEO): curl HTTP/2 stream error and WebFetch HTTP 403; alternative used: secondary coverage found by search (marked reported).
- 2026-10-11, visa-tap: https://merchantcostconsulting.com/?p=8876: curl and WebFetch HTTP 403; alternative used: ATLAS_FOLLOWUP.md Appendix B summary (claim marked reported).
- 2026-10-11, visa-tap: https://www.mastercard.com/us/en/news-and-trends/stories/2025/agentic-commerce-framework.html: curl HTTP 403 (developer.mastercard.com Agent Pay page renders client-side, no text); alternative used: search excerpts of Mastercard pages (claims marked reported).
- 2026-10-11, stripe-mpp: https://www.theblock.co/post/394131/tempo-mainnet-goes-live-with-machine-payments-protocol-for-agents: HTTP 403 to curl; alternative used: tempo.xyz/blog/mainnet (primary)
- 2026-10-11, stripe-mpp: thedefiant.io and fireblocks.com resource pages: HTTP 403 to curl HEAD (bot blocking); alternative used: kept Appendix A entries (opened 2026-10-10) with a note
- 2026-10-11, stripe-mpp: mastercard.com AP4M press release and businesswire.com copy: HTTP 403 to curl and WebFetch; alternative used: ecommercenews.co.nz, electronicpaymentsinternational.com and thepaypers.com coverage (secondary)
