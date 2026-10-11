/** Site-wide constants. BUILD_DATE is computed when the module is evaluated at build time. */

export const SITE_NAME = 'Agentic Rails Atlas';
export const SITE_TAGLINE = 'An observatory for agent identity, checkout and payment rails.';
export const SITE_DESCRIPTION =
  'A sourced, offline-capable atlas of eight agent identity, checkout and payment protocols.';

/** Override with ATLAS_BUILD_DATE=YYYY-MM-DD for reproducible builds. */
function computeBuildDate(): string {
  const env = typeof process !== 'undefined' ? process.env?.ATLAS_BUILD_DATE : undefined;
  if (env && /^\d{4}-\d{2}-\d{2}$/.test(env)) return env;
  return new Date().toISOString().slice(0, 10);
}

export const BUILD_DATE: string = computeBuildDate();

export const REPO_CONTENT_ROOT = 'src/content';
