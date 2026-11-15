import { describe, expect, it } from 'vitest';
import { KNOWN_AGENTS, classForCategory, classify } from '../../../scripts/stats/classify';

const CHROME = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const FIREFOX = 'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0';

describe('classify', () => {
  it('puts known AI tokens in their class, case-insensitively', () => {
    expect(classify('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.2; +https://openai.com/gptbot)').cls).toBe('aiTraining');
    expect(classify('Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)').cls).toBe('aiTraining');
    expect(classify('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; ChatGPT-User/1.0; +https://openai.com/bot').cls).toBe('aiAssistant');
    expect(classify('perplexity-user/1.0').cls).toBe('aiAssistant');
    expect(classify('Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)').cls).toBe('aiSearch');
    expect(classify(`${CHROME} Claude-Agent/1.0`).cls).toBe('aiAgent');
  });

  it('matches the OAI-SearchBot token even though its user agent starts like Chrome', () => {
    const c = classify(`${CHROME}; compatible; OAI-SearchBot/1.3; +https://openai.com/searchbot`);
    expect(c).toMatchObject({ cls: 'aiSearch', agent: 'OAI-SearchBot', operator: 'OpenAI' });
  });

  it('classes search engines and other declared bots', () => {
    expect(classify('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)').cls).toBe('search');
    expect(classify('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)').cls).toBe('search');
    expect(classify('facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)').cls).toBe('otherBot');
    expect(classify('Mozilla/5.0 (compatible; SomeNewBot/0.1; +https://example.org/bot)').cls).toBe('otherBot');
    expect(classify('UptimeRobot/2.0; http://www.uptimerobot.com/').cls).toBe('otherBot');
  });

  it('keeps a phone model with "bot" in its name a browser, and names GoogleOther', () => {
    expect(classify('Mozilla/5.0 (Linux; Android 13; CUBOT P80) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36').cls).toBe('browserLike');
    expect(classify('Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X Build/MMB29P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 (compatible; GoogleOther)')).toMatchObject({ cls: 'otherBot', agent: 'GoogleOther' });
    expect(classify('Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)').cls).toBe('otherBot');
  });

  it('separates HTTP libraries and headless browsers from browsers', () => {
    expect(classify('').cls).toBe('unknownAutomated');
    expect(classify('curl/8.7.1').cls).toBe('unknownAutomated');
    expect(classify('python-requests/2.32.3').cls).toBe('unknownAutomated');
    expect(classify('Go-http-client/2.0').cls).toBe('unknownAutomated');
    expect(classify(CHROME.replace('Chrome/', 'HeadlessChrome/')).cls).toBe('unknownAutomated');
    expect(classify(CHROME).cls).toBe('browserLike');
    expect(classify(FIREFOX).cls).toBe('browserLike');
  });

  it('marks a known token as verified only when Cloudflare attached a verified-bot category', () => {
    expect(classify('GPTBot/1.2', 'AI Crawler').verified).toBe(true);
    expect(classify('GPTBot/1.2', '').verified).toBe(false);
    expect(classify('GPTBot/1.2').verified).toBeNull();
  });

  it('uses the verified-bot category when no token matches', () => {
    expect(classify('Mozilla/5.0 (compatible; Unknown/1.0)', 'AI Crawler')).toMatchObject({ cls: 'aiTraining', verified: true });
    expect(classify('Mozilla/5.0 (compatible; Unknown/1.0)', 'Search Engine Crawler').cls).toBe('search');
  });
});

describe('classForCategory', () => {
  it('maps Cloudflare categories, keeping SEO tools out of search engines', () => {
    expect(classForCategory('AI Crawler')).toBe('aiTraining');
    expect(classForCategory('AI Search')).toBe('aiSearch');
    expect(classForCategory('AI Assistant')).toBe('aiAssistant');
    expect(classForCategory('Search Engine Crawler')).toBe('search');
    expect(classForCategory('Search Engine Optimization')).toBe('otherBot');
    expect(classForCategory('Monitoring & Analytics')).toBe('otherBot');
  });
});

describe('KNOWN_AGENTS', () => {
  it('has unique tokens, none of which is a substring of another', () => {
    const tokens = KNOWN_AGENTS.map((a) => a.token.toLowerCase());
    expect(new Set(tokens).size).toBe(tokens.length);
    for (const a of tokens) for (const b of tokens) if (a !== b) expect(b.includes(a), `${a} inside ${b}`).toBe(false);
  });
});
