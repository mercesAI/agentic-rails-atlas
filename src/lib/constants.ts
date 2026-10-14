/** Site-wide constants. BUILD_DATE is computed when the module is evaluated at build time. */

export const SITE_NAME = 'Agentic Rails Atlas';
export const ORG_NAME = 'merces.ai';
export const ORG_URL = 'https://merces.ai';
export const ORG_DESCRIPTION = 'merces.ai is the controls platform for agentic transactions: a registry of real agents with a Risk Check, plus monitoring.';
/** Used in og:site_name and the home title. */
export const SITE_BRAND = `${SITE_NAME} by ${ORG_NAME}`;
export const SITE_TAGLINE = 'An observatory for agent identity, checkout and payment rails.';
export const SITE_DESCRIPTION =
  'Research atlas of eight agent identity, checkout and payment protocols (ERC-8004, x402, Visa TAP, ACP, UCP, MPP, AP2, Mastercard Agent Pay): sourced claims, diagrams, security and controls, by merces.ai.';

/**
 * Public site origin for canonical links, Open Graph, the sitemap and llms.txt.
 * Override with PUBLIC_SITE_URL at build time (no trailing slash needed).
 */
function computeSiteUrl(): string {
  const env = typeof process !== 'undefined' ? process.env?.PUBLIC_SITE_URL : undefined;
  const raw = env && /^https?:\/\//.test(env) ? env : 'https://atlas.merces.ai';
  return raw.replace(/\/+$/, '');
}
export const SITE_URL: string = computeSiteUrl();

/** Override with ATLAS_BUILD_DATE=YYYY-MM-DD for reproducible builds. */
function computeBuildDate(): string {
  const env = typeof process !== 'undefined' ? process.env?.ATLAS_BUILD_DATE : undefined;
  if (env && /^\d{4}-\d{2}-\d{2}$/.test(env)) return env;
  return new Date().toISOString().slice(0, 10);
}

export const BUILD_DATE: string = computeBuildDate();

export const REPO_CONTENT_ROOT = 'src/content';
