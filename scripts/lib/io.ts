/**
 * Small file helpers shared by the build scripts. No astro:* imports.
 * Every writer is deterministic: JSON is written with two-space indentation
 * and a trailing newline, and only when the bytes change.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

export function rel(root: string, path: string): string {
  return relative(root, path).split(sep).join('/');
}

export class JsonReadError extends Error {
  constructor(
    public readonly path: string,
    message: string,
  ) {
    super(`${path}: ${message}`);
  }
}

/** Reads JSON. Returns undefined when the file is missing; throws JsonReadError on a parse error. */
export function readJson<T = unknown>(path: string): T | undefined {
  if (!existsSync(path)) return undefined;
  const text = readFileSync(path, 'utf8');
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new JsonReadError(path, err instanceof Error ? err.message : String(err));
  }
}

export function stableJson(value: unknown): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

/** Writes JSON when the content differs. Returns true when the file changed. */
export function writeJsonIfChanged(path: string, value: unknown): boolean {
  return writeTextIfChanged(path, stableJson(value));
}

export function writeTextIfChanged(path: string, text: string): boolean {
  if (existsSync(path) && readFileSync(path, 'utf8') === text) return false;
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, 'utf8');
  return true;
}

export function isDir(path: string): boolean {
  try {
    return statSync(path).isDirectory();
  } catch {
    return false;
  }
}

/** Sorted list of entries in a directory (empty when missing). */
export function listDir(path: string): string[] {
  if (!isDir(path)) return [];
  return readdirSync(path).sort();
}

/** Recursively lists files under a directory, sorted, as absolute paths. */
export function walkFiles(dir: string, filter: (path: string) => boolean = () => true): string[] {
  const out: string[] = [];
  const visit = (d: string): void => {
    for (const name of listDir(d)) {
      if (name === 'node_modules' || name.startsWith('.')) continue;
      const p = join(d, name);
      if (isDir(p)) visit(p);
      else if (filter(p)) out.push(p);
    }
  };
  visit(dir);
  return out.sort();
}

export function sha256(text: string | Buffer): string {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Normalizes a URL for duplicate detection: lower-case scheme and host, no
 * "www.", no fragment, no trailing slash, no default port, sorted query, and
 * common tracking parameters removed.
 */
export function normalizeUrl(raw: string): string {
  try {
    const u = new URL(raw.trim());
    u.hash = '';
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
    if ((u.protocol === 'https:' && u.port === '443') || (u.protocol === 'http:' && u.port === '80')) u.port = '';
    const params = [...u.searchParams.entries()]
      .filter(([k]) => !/^utm_|^ref$|^ref_src$|^fbclid$|^gclid$/i.test(k))
      .sort(([a], [b]) => a.localeCompare(b));
    u.search = '';
    for (const [k, v] of params) u.searchParams.append(k, v);
    let s = `${u.protocol === 'http:' ? 'https:' : u.protocol}//${u.host}${u.pathname}${u.search}`;
    if (s.endsWith('/')) s = s.slice(0, -1);
    return s;
  } catch {
    return raw.trim().toLowerCase();
  }
}

/** Parses simple CLI flags: --name value, --flag. */
export function parseArgs(argv: string[]): { flags: Set<string>; values: Map<string, string>; rest: string[] } {
  const flags = new Set<string>();
  const values = new Map<string, string>();
  const rest: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i] ?? '';
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      if (eq > 0) {
        values.set(a.slice(2, eq), a.slice(eq + 1));
        continue;
      }
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith('--') && VALUE_FLAGS.has(a.slice(2))) {
        values.set(a.slice(2), next);
        i++;
      } else flags.add(a.slice(2));
    } else rest.push(a);
  }
  return { flags, values, rest };
}
const VALUE_FLAGS = new Set(['protocol', 'only', 'root', 'host', 'limit', 'concurrency']);

/** True when the module is the process entry point. */
export function isMain(moduleUrl: string): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return resolve(entry) === fileURLToPath(moduleUrl);
  } catch {
    return false;
  }
}

/** Formats a Zod issue list into one short line. */
export function zodMessage(error: { issues: { path: PropertyKey[]; message: string }[] }): string {
  const first = error.issues[0];
  if (!first) return 'invalid';
  const path = first.path.map((p) => String(p)).join('.');
  const more = error.issues.length > 1 ? ` (+${error.issues.length - 1} more)` : '';
  return `${path || '(root)'}: ${first.message}${more}`;
}

export function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}
