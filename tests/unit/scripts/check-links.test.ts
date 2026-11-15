import { describe, expect, it } from 'vitest';
import { errorCode } from '../../../scripts/lib/net';
import { classify, expectedOutcome, isBotBlockingHost } from '../../../scripts/verify/check-links';

const bot = {
  hosts: ['blocked.example'],
  challengeHeaders: { 'cf-mitigated': 'challenge', 'x-vercel-mitigated': 'challenge', 'x-amzn-waf-action': ['challenge', 'captcha'] },
  expectedMissing: ['https://gone.example/page'],
  expectedStatus: { 'https://pay.example/api?q=1': 402 },
};
const none = new Headers();

describe('check-links classify', () => {
  it('passes 2xx and 3xx', () => {
    expect(classify(200, 'a.example', none, bot)).toEqual({ outcome: 'ok' });
    expect(classify(301, 'a.example', none, bot)).toEqual({ outcome: 'ok' });
  });

  it('fails 404, 410 and other 4xx', () => {
    expect(classify(404, 'a.example', none, bot)).toEqual({ outcome: 'fail', reason: 'HTTP 404' });
    expect(classify(410, 'a.example', none, bot).outcome).toBe('fail');
    expect(classify(401, 'a.example', none, bot).outcome).toBe('fail');
    expect(classify(403, 'a.example', none, bot).outcome).toBe('fail');
  });

  it('warns on 403 and 429 from known bot-blocking hosts or behind a challenge', () => {
    expect(isBotBlockingHost('www.blocked.example', bot.hosts)).toBe(true);
    expect(isBotBlockingHost('docs.blocked.example', bot.hosts)).toBe(true);
    expect(isBotBlockingHost('notblocked.example', bot.hosts)).toBe(false);
    expect(classify(403, 'blocked.example', none, bot).outcome).toBe('warn');
    expect(classify(429, 'docs.blocked.example', none, bot).outcome).toBe('warn');
    expect(classify(403, 'a.example', new Headers({ 'cf-mitigated': 'challenge' }), bot)).toEqual({ outcome: 'warn', reason: 'HTTP 403 (Cloudflare challenge)' });
    expect(classify(429, 'a.example', new Headers({ 'x-vercel-mitigated': 'challenge' }), bot)).toEqual({ outcome: 'warn', reason: 'HTTP 429 (Vercel challenge)' });
    expect(classify(429, 'a.example', new Headers({ 'x-vercel-mitigated': 'deny' }), bot).outcome).toBe('fail');
  });

  it('warns on an AWS WAF challenge even when it answers 2xx or 405, and on 405 from a bot-blocking host', () => {
    const waf = (v: string): Headers => new Headers({ 'x-amzn-waf-action': v });
    expect(classify(202, 'a.example', waf('challenge'), bot)).toEqual({ outcome: 'warn', reason: 'HTTP 202 (AWS WAF challenge)' });
    expect(classify(405, 'a.example', waf('captcha'), bot)).toEqual({ outcome: 'warn', reason: 'HTTP 405 (AWS WAF challenge)' });
    expect(classify(404, 'a.example', waf('challenge'), bot).outcome).toBe('fail');
    expect(classify(405, 'blocked.example', none, bot)).toEqual({ outcome: 'warn', reason: 'HTTP 405 from a known bot-blocking host' });
    expect(classify(405, 'a.example', none, bot).outcome).toBe('fail');
  });

  it('accepts only the documented answer for a listed URL', () => {
    expect(expectedOutcome('https://gone.example/page', 404, bot)).toEqual({ outcome: 'ok', reason: 'HTTP 404 (expected: cited as evidence of absence)' });
    expect(expectedOutcome('https://gone.example/page', 410, bot)?.outcome).toBe('ok');
    expect(expectedOutcome('https://gone.example/page', 500, bot)).toBeUndefined();
    expect(expectedOutcome('https://pay.example/api?q=1', 402, bot)).toEqual({ outcome: 'ok', reason: 'HTTP 402 (expected: documented answer)' });
    expect(expectedOutcome('https://pay.example/api?q=1', 404, bot)).toBeUndefined();
    expect(expectedOutcome('https://other.example/', 402, bot)).toBeUndefined();
    expect(classify(402, 'pay.example', none, bot).outcome).toBe('fail');
  });

  it('warns on 5xx and on transient network errors', () => {
    expect(classify(503, 'a.example', none, bot).outcome).toBe('warn');
    for (const code of [undefined, 'ECONNRESET', 'ECONNREFUSED', 'ETIMEDOUT', 'EAI_AGAIN']) {
      expect(classify(0, 'a.example', none, bot, code)).toEqual({ outcome: 'warn', reason: 'network error or timeout' });
    }
  });

  it('fails a host that does not resolve', () => {
    expect(classify(0, 'gone.example', none, bot, 'ENOTFOUND')).toEqual({ outcome: 'fail', reason: 'host not found (ENOTFOUND)' });
  });
});

describe('errorCode', () => {
  it('reads the system code behind a fetch failure', () => {
    const dns = Object.assign(new Error('getaddrinfo ENOTFOUND gone.example'), { code: 'ENOTFOUND' });
    expect(errorCode(new TypeError('fetch failed', { cause: dns }))).toBe('ENOTFOUND');
    const refused = new AggregateError([Object.assign(new Error('connect ECONNREFUSED 127.0.0.1:443'), { code: 'ECONNREFUSED' })], 'all addresses failed');
    expect(errorCode(new TypeError('fetch failed', { cause: refused }))).toBe('ECONNREFUSED');
    expect(errorCode(Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }))).toBe('ECONNRESET');
  });

  it('is undefined for aborts, plain errors and non-errors', () => {
    expect(errorCode(new DOMException('This operation was aborted', 'AbortError'))).toBeUndefined();
    expect(errorCode(new TypeError('fetch failed'))).toBeUndefined();
    expect(errorCode('nope')).toBeUndefined();
    expect(errorCode(undefined)).toBeUndefined();
  });
});
