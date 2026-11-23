/**
 * Classifies one edge request row (user agent, optional Cloudflare verified-bot category) into
 * the traffic classes that pnpm stats reports. Pure: no network, no file access.
 *
 * Order (first match wins): a known user agent token, then a Cloudflare verified-bot category,
 * then a self-declared bot, then an HTTP library or headless browser, then browser-like traffic.
 * Tokens come from each operator's crawler documentation (read 2026-11-14). Matching is a
 * case-insensitive substring test, so a token anywhere
 * in the user agent counts (OAI-SearchBot, for example, appends its token to a full Chrome
 * string).
 */

export const TRAFFIC_CLASSES = [
  'search',
  'aiTraining',
  'aiSearch',
  'aiAssistant',
  'aiAgent',
  'otherBot',
  'unknownAutomated',
  'browserLike',
] as const;
export type TrafficClass = (typeof TRAFFIC_CLASSES)[number];

export const CLASS_LABELS: Record<TrafficClass, string> = {
  search: 'Search engine crawlers',
  aiTraining: 'AI training crawlers',
  aiSearch: 'AI search crawlers',
  aiAssistant: "AI assistants on a user's request",
  aiAgent: 'AI browser agents (named in the user agent)',
  otherBot: 'Other bots',
  unknownAutomated: 'Unknown automated',
  browserLike: 'Browser-like (upper bound for people)',
};

/** The classes that count as AI bots in the summary. */
export const AI_CLASSES: readonly TrafficClass[] = ['aiTraining', 'aiSearch', 'aiAssistant', 'aiAgent'];
/** The classes that count as bots that are not AI. */
export const NON_AI_BOT_CLASSES: readonly TrafficClass[] = ['search', 'otherBot', 'unknownAutomated'];

export interface KnownAgent {
  token: string;
  operator: string;
  cls: TrafficClass;
}

/**
 * Known user agent tokens. More specific tokens come first; no token here is a substring of
 * another. Google-Extended and Applebot-Extended are robots.txt tokens with no user agent of
 * their own, so they never appear in traffic and are not listed.
 */
export const KNOWN_AGENTS: readonly KnownAgent[] = [
  // Fetches made because a person asked an assistant something.
  { token: 'ChatGPT-User', operator: 'OpenAI', cls: 'aiAssistant' },
  { token: 'Claude-User', operator: 'Anthropic', cls: 'aiAssistant' },
  { token: 'Perplexity-User', operator: 'Perplexity', cls: 'aiAssistant' },
  { token: 'meta-externalfetcher', operator: 'Meta', cls: 'aiAssistant' },
  { token: 'DuckAssistBot', operator: 'DuckDuckGo', cls: 'aiAssistant' },
  { token: 'MistralAI-User', operator: 'Mistral', cls: 'aiAssistant' },
  { token: 'Amzn-User', operator: 'Amazon', cls: 'aiAssistant' },
  // Agents that drive a real browser and name themselves in the user agent.
  { token: 'Claude-Agent', operator: 'Anthropic', cls: 'aiAgent' },
  { token: 'Google-Agent', operator: 'Google', cls: 'aiAgent' },
  // Crawlers that build AI search indexes.
  { token: 'OAI-SearchBot', operator: 'OpenAI', cls: 'aiSearch' },
  { token: 'Claude-SearchBot', operator: 'Anthropic', cls: 'aiSearch' },
  { token: 'PerplexityBot', operator: 'Perplexity', cls: 'aiSearch' },
  { token: 'Amzn-SearchBot', operator: 'Amazon', cls: 'aiSearch' },
  { token: 'MistralAI-Index', operator: 'Mistral', cls: 'aiSearch' },
  { token: 'meta-webindexer', operator: 'Meta', cls: 'aiSearch' },
  // Crawlers that collect training data.
  { token: 'GPTBot', operator: 'OpenAI', cls: 'aiTraining' },
  { token: 'ClaudeBot', operator: 'Anthropic', cls: 'aiTraining' },
  { token: 'CCBot', operator: 'Common Crawl', cls: 'aiTraining' },
  { token: 'meta-externalagent', operator: 'Meta', cls: 'aiTraining' },
  { token: 'Amazonbot', operator: 'Amazon', cls: 'aiTraining' },
  { token: 'Bytespider', operator: 'ByteDance', cls: 'aiTraining' },
  { token: 'Google-CloudVertexBot', operator: 'Google', cls: 'aiTraining' },
  // Search engines.
  { token: 'Googlebot', operator: 'Google', cls: 'search' },
  { token: 'bingbot', operator: 'Microsoft', cls: 'search' },
  { token: 'Applebot', operator: 'Apple', cls: 'search' },
  // Other declared bots from the same operators. GoogleOther is Google's generic crawler; it
  // sends a Chrome-like user agent, so without this token it would look like a browser.
  { token: 'GoogleOther', operator: 'Google', cls: 'otherBot' },
  { token: 'facebookexternalhit', operator: 'Meta', cls: 'otherBot' },
  { token: 'meta-externalads', operator: 'Meta', cls: 'otherBot' },
  { token: 'OAI-AdsBot', operator: 'OpenAI', cls: 'otherBot' },
];

// "bot" only where it ends a product token (for example SomeBot/1.0 or Slackbot-LinkExpanding),
// so a phone model such as "CUBOT P80" in a browser's platform comment does not match.
const SELF_DECLARED_BOT = /bot(?=[/;)\-_]|$)|crawler|spider|slurp|scraper|fetcher|monitor|preview|inspectiontool|feed|validator|lighthouse/i;
const AUTOMATION =
  /^(curl|wget|python|aiohttp|httpx|go-http-client|okhttp|axios|node-fetch|node|undici|java|libwww-perl|apache-httpclient|ruby|php|deno|bun|postman|insomnia)\b|headlesschrome|phantomjs|puppeteer|playwright|selenium|scrapy/i;
const BROWSER = /^Mozilla\/5\.0 \(/;
const ENGINE = /(AppleWebKit|Gecko|Trident)\//;

export interface Classification {
  cls: TrafficClass;
  /** The matched token (for example GPTBot), or null when no token matched. */
  agent: string | null;
  operator: string | null;
  /**
   * true when Cloudflare attached a verified-bot category to the row, false when a known token
   * came without one (claimed: possibly spoofed or de-listed), null when the category field is
   * not available for this zone.
   */
  verified: boolean | null;
}

export function agentFor(userAgent: string): KnownAgent | undefined {
  const ua = userAgent.toLowerCase();
  return KNOWN_AGENTS.find((a) => ua.includes(a.token.toLowerCase()));
}

/**
 * Maps a Cloudflare verified-bot category (the legacy category strings, such as "AI Crawler" or
 * "Search Engine Crawler") to a class, case-insensitively. No category marks a signed browser
 * agent: those are recognizable only by their Web Bot Auth headers, which this dataset lacks.
 */
export function classForCategory(category: string): TrafficClass {
  const c = category.trim().toLowerCase();
  if (c.includes('ai crawler')) return 'aiTraining';
  if (c.includes('ai search')) return 'aiSearch';
  if (c.includes('ai assistant')) return 'aiAssistant';
  if (c.includes('search engine optimization')) return 'otherBot';
  if (c.includes('search engine') || c === 'search') return 'search';
  return 'otherBot';
}

/**
 * @param userAgent the request's user agent ('' when absent)
 * @param category the verified-bot category: a string (possibly empty) when the field is
 *   available, undefined when it is not
 */
export function classify(userAgent: string, category?: string | null): Classification {
  const hasCategoryField = category !== undefined;
  const cat = (category ?? '').trim();
  const verified = hasCategoryField ? cat !== '' : null;
  const known = agentFor(userAgent);
  if (known) return { cls: known.cls, agent: known.token, operator: known.operator, verified };
  if (cat) return { cls: classForCategory(cat), agent: null, operator: null, verified: true };
  const ua = userAgent.trim();
  const unverified = hasCategoryField ? false : null;
  if (ua === '') return { cls: 'unknownAutomated', agent: null, operator: null, verified: unverified };
  if (SELF_DECLARED_BOT.test(ua)) return { cls: 'otherBot', agent: null, operator: null, verified: unverified };
  if (AUTOMATION.test(ua)) return { cls: 'unknownAutomated', agent: null, operator: null, verified: unverified };
  if (BROWSER.test(ua) && ENGINE.test(ua)) return { cls: 'browserLike', agent: null, operator: null, verified: null };
  return { cls: 'unknownAutomated', agent: null, operator: null, verified: unverified };
}
