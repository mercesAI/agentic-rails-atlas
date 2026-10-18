import { describe, expect, it } from 'vitest';
import { errorCode } from '../../../scripts/lib/net';
import { classify, isBotBlockingHost } from '../../../scripts/verify/check-links';

const bot = { hosts: ['blocked.example'], challengeHeaders: { 'cf-mitigated': 'challenge' } };
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
    expect(classify(403, 'a.example', new Headers({ 'cf-mitigated': 'challenge' }), bot).outcome).toBe('warn');
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
