/**
 * Configuration for `pnpm stats`. Values come from the environment, then from the first of these
 * files that defines them: private/stats/.env (recommended: nothing else reads it), .env.local,
 * .env. Only ATLAS_STATS_* keys are read, so Wrangler's CLOUDFLARE_API_TOKEN is never used and
 * this read-only token is never picked up by a deploy. Git ignores all three files.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

export const ENV_FILES = ['private/stats/.env', '.env.local', '.env'] as const;
export const DEFAULT_HOST = 'atlas.merces.ai';

export interface StatsConfig {
  token: string;
  zoneId: string | null;
  accountId: string | null;
  siteTag: string | null;
  host: string;
}

/** Copies ATLAS_STATS_* keys from the env files into `env` without overriding set values. */
export function loadStatsEnv(root: string, env: Record<string, string | undefined> = process.env): string[] {
  const loaded: string[] = [];
  for (const rel of ENV_FILES) {
    const path = join(root, rel);
    if (!existsSync(path)) continue;
    const parsed = parseEnv(readFileSync(path, 'utf8')) as Record<string, string | undefined>;
    let used = false;
    for (const [key, value] of Object.entries(parsed)) {
      if (!key.startsWith('ATLAS_STATS_') || value === undefined || value === '') continue;
      used = true;
      if (env[key] === undefined || env[key] === '') env[key] = value;
    }
    if (used) loaded.push(rel);
  }
  return loaded;
}

const HEX32 = /^[0-9a-f]{32}$/;

export function readConfig(env: Record<string, string | undefined>, hostOverride?: string): { config: StatsConfig | null; problems: string[] } {
  const problems: string[] = [];
  const token = (env.ATLAS_STATS_CF_TOKEN ?? '').trim();
  const zone = (env.ATLAS_STATS_CF_ZONE_ID ?? '').trim().toLowerCase();
  const account = (env.ATLAS_STATS_CF_ACCOUNT_ID ?? '').trim().toLowerCase();
  const siteTag = (env.ATLAS_STATS_SITE_TAG ?? '').trim();
  const host = (hostOverride ?? env.ATLAS_STATS_HOST ?? DEFAULT_HOST).trim().toLowerCase();
  if (!token) problems.push('ATLAS_STATS_CF_TOKEN is not set');
  // A token with spaces or control characters would make an HTTP header error that quotes it.
  else if (!/^[\x21-\x7e]+$/.test(token)) problems.push('ATLAS_STATS_CF_TOKEN has spaces, line breaks or other characters a token never has; paste it again on one line');
  if (zone && !HEX32.test(zone)) problems.push('ATLAS_STATS_CF_ZONE_ID must be 32 hex characters');
  if (account && !HEX32.test(account)) problems.push('ATLAS_STATS_CF_ACCOUNT_ID must be 32 hex characters');
  if (!zone && !account) problems.push('set ATLAS_STATS_CF_ZONE_ID (bots) and ATLAS_STATS_CF_ACCOUNT_ID (people)');
  if (problems.length > 0) return { config: null, problems };
  return {
    config: { token, zoneId: zone || null, accountId: account || null, siteTag: siteTag || null, host },
    problems,
  };
}
