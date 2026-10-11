// Discovery, protocol version selection and capability negotiation, following the UCP overview at
// v2026-08-25: "Authority Binding", "Protocol Version", "Component Versioning and Release Snapshots",
// "Intersection Algorithm", "Error Handling" and "Response Capability Selection".
import { type Entity, type Profile, type PublicJwk } from './types';

const VERSION_RE = /^\d{4}-\d{2}-\d{2}$/;
/** JWK private members that must never appear in a published `keys[]` set. */
export const PRIVATE_JWK_MEMBERS = ['d', 'p', 'q', 'dp', 'dq', 'qi', 'oth', 'k'] as const;

export type Side = 'business' | 'platform';

export type ParseResult =
  | { ok: true; profile: Profile; warnings: string[] }
  | { ok: false; code: 'profile_malformed'; detail: string };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function checkRegistry(name: string, value: unknown, required: boolean): string | null {
  if (value === undefined) return required ? `ucp.${name} is required (it may be empty)` : null;
  if (!isObject(value)) return `ucp.${name} must be an object keyed by reverse-domain name`;
  for (const [key, entries] of Object.entries(value)) {
    if (!Array.isArray(entries)) return `ucp.${name}["${key}"] must be an array of entries`;
    for (const entry of entries) {
      if (!isObject(entry) || typeof entry.version !== 'string' || !VERSION_RE.test(entry.version)) {
        return `every entry in ucp.${name}["${key}"] needs a version in YYYY-MM-DD form`;
      }
    }
  }
  return null;
}

/** Parse and shape-check a profile document. Failures map to the `profile_malformed` error (REST 422). */
export function parseProfile(text: string, side: Side, opts: { leaf?: boolean } = {}): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    return { ok: false, code: 'profile_malformed', detail: `Not valid JSON: ${(err as Error).message}` };
  }
  if (!isObject(raw)) return { ok: false, code: 'profile_malformed', detail: 'A profile must be a JSON object' };
  const ucp = raw.ucp;
  if (!isObject(ucp)) return { ok: false, code: 'profile_malformed', detail: 'The ucp member is required' };
  if (typeof ucp.version !== 'string' || !VERSION_RE.test(ucp.version)) {
    return { ok: false, code: 'profile_malformed', detail: 'ucp.version must be a date in YYYY-MM-DD form' };
  }
  for (const [name, required] of [
    ['services', true],
    ['capabilities', false],
    ['payment_handlers', true],
  ] as const) {
    const problem = checkRegistry(name, ucp[name], required);
    if (problem) return { ok: false, code: 'profile_malformed', detail: problem };
  }
  const warnings: string[] = [];
  if (ucp.supported_versions !== undefined) {
    if (opts.leaf) {
      return {
        ok: false,
        code: 'profile_malformed',
        detail: 'A version-specific leaf profile must not contain supported_versions',
      };
    }
    if (side === 'platform') {
      warnings.push('supported_versions is defined for business profiles only; the platform entry is ignored');
    } else if (!isObject(ucp.supported_versions)) {
      return { ok: false, code: 'profile_malformed', detail: 'ucp.supported_versions must map versions to URIs' };
    }
  }
  if (raw.keys !== undefined) {
    if (!Array.isArray(raw.keys)) return { ok: false, code: 'profile_malformed', detail: 'keys must be a JWK array' };
    for (const key of raw.keys as unknown[]) {
      if (!isObject(key) || typeof key.kid !== 'string' || typeof key.kty !== 'string') {
        return { ok: false, code: 'profile_malformed', detail: 'every key needs kid and kty' };
      }
      const leaked = PRIVATE_JWK_MEMBERS.filter((m) => m in key);
      if (leaked.length > 0) {
        return {
          ok: false,
          code: 'profile_malformed',
          detail: `key "${key.kid}" carries private members (${leaked.join(', ')}); keys[] may hold public keys only`,
        };
      }
    }
  }
  if (isObject(ucp) && 'keys' in ucp) warnings.push('keys belongs at the top level of the profile, outside ucp');
  const profile = raw as unknown as Profile;
  if (side === 'platform' && profile.ucp.supported_versions) {
    const { supported_versions: _ignored, ...rest } = profile.ucp;
    return { ok: true, profile: { ...profile, ucp: rest }, warnings };
  }
  return { ok: true, profile, warnings };
}

/** Public keys in the profile's top-level `keys[]` (JWK Set). */
export function publicKeys(profile: Profile): PublicJwk[] {
  return Array.isArray(profile.keys) ? profile.keys : [];
}

export type BindingResult = { ok: true; match: 'exact' | 'prefix'; authority: string } | { ok: false; reason: string };

/** Authority binding: the `schema` URL host, reversed, must equal the name or be a label-aligned prefix of it. */
export function checkAuthorityBinding(name: string, schemaUrl: string): BindingResult {
  let url: URL;
  try {
    url = new URL(schemaUrl);
  } catch {
    return { ok: false, reason: 'schema URL does not parse' };
  }
  if (url.protocol !== 'https:') return { ok: false, reason: 'schema URL must use https' };
  if (url.username || url.password) return { ok: false, reason: 'schema URL must not contain userinfo' };
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (host.startsWith('[') || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    return { ok: false, reason: 'an IP-literal host is not a valid authority' };
  }
  const labels = host.split('.');
  if (labels.length < 2) return { ok: false, reason: 'a single-label host is not a valid authority' };
  const authority = labels.reverse().join('.');
  if (name === authority) return { ok: true, match: 'exact', authority };
  if (name.startsWith(`${authority}.`)) return { ok: true, match: 'prefix', authority };
  return { ok: false, reason: `reversed host "${authority}" is not a label-aligned prefix of "${name}"` };
}

export type ProtocolVersionResult =
  | { ok: true; version: string; profile: Profile; via: 'current' | 'supported_versions'; leafUri?: string }
  | { ok: false; code: 'version_unsupported' | 'profile_malformed' | 'profile_unreachable'; detail: string };

/**
 * Request-time validation by the business: the platform's `ucp.version` must equal the business `version`
 * or be a key in `supported_versions`, in which case the matching leaf profile is used.
 */
export function selectProtocolVersion(
  business: Profile,
  platformVersion: string,
  leafProfiles: Record<string, Profile>,
): ProtocolVersionResult {
  if (platformVersion === business.ucp.version) {
    return { ok: true, version: platformVersion, profile: business, via: 'current' };
  }
  const supported = business.ucp.supported_versions ?? {};
  const uri = supported[platformVersion];
  if (!uri) {
    const offered = [business.ucp.version, ...Object.keys(supported)].sort().reverse().join(', ');
    return {
      ok: false,
      code: 'version_unsupported',
      detail: `Protocol version ${platformVersion} is not supported. This business supports ${offered}.`,
    };
  }
  const leaf = leafProfiles[uri];
  if (!leaf) {
    return { ok: false, code: 'profile_unreachable', detail: `The leaf profile at ${uri} is not in the fixtures` };
  }
  const leafCheck = parseProfile(JSON.stringify(leaf), 'business', { leaf: true });
  if (!leafCheck.ok) return { ok: false, code: 'profile_malformed', detail: leafCheck.detail };
  if (leaf.ucp.version !== platformVersion) {
    return {
      ok: false,
      code: 'profile_malformed',
      detail: `The leaf profile declares ${leaf.ucp.version}, not ${platformVersion}; it must not be used`,
    };
  }
  return { ok: true, version: platformVersion, profile: leaf, via: 'supported_versions', leafUri: uri };
}

export type PruneReason =
  | 'authority_binding_failed'
  | 'core_version_mismatch'
  | 'missing_schema'
  | 'not_offered_by_platform'
  | 'not_offered_by_business'
  | 'no_common_version'
  | 'orphaned_extension';

export interface Pruned {
  name: string;
  reason: PruneReason;
  detail: string;
  side?: Side;
  /** Pruning round for orphaned extensions (1 = first pass). */
  round?: number;
}

export interface ActiveCapability {
  name: string;
  version: string;
  extends?: string[];
}

export interface Negotiation {
  ok: true;
  protocolVersion: string;
  via: 'current' | 'supported_versions';
  leafUri?: string;
  active: ActiveCapability[];
  pruned: Pruned[];
  /** True when the active set is empty: a `capabilities_incompatible` business outcome (HTTP 200). */
  incompatible: boolean;
  warnings: string[];
}

export interface NegotiationFailure {
  ok: false;
  code: 'profile_malformed' | 'version_unsupported' | 'profile_unreachable';
  side?: Side;
  detail: string;
  httpStatus: number;
  mcpCode: number;
}

const ERROR_STATUS: Record<NegotiationFailure['code'], number> = {
  profile_malformed: 422,
  version_unsupported: 422,
  profile_unreachable: 424,
};

export function toArray(value: string | string[] | undefined): string[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/** Drop entries a receiver must treat as not present: failed authority binding or a `dev.ucp.*` version skew. */
export function filterEntries(
  caps: Record<string, Entity[]>,
  protocolVersion: string,
  side: Side,
): { kept: Record<string, Entity[]>; pruned: Pruned[] } {
  const kept: Record<string, Entity[]> = {};
  const pruned: Pruned[] = [];
  for (const [name, entries] of Object.entries(caps)) {
    const good: Entity[] = [];
    const reasons: Pruned[] = [];
    for (const entry of entries) {
      if (!entry.schema) {
        reasons.push({ name, side, reason: 'missing_schema', detail: 'A capability must declare a schema URL' });
        continue;
      }
      const binding = checkAuthorityBinding(name, entry.schema);
      if (!binding.ok) {
        reasons.push({ name, side, reason: 'authority_binding_failed', detail: binding.reason });
        continue;
      }
      if (name.startsWith('dev.ucp.') && entry.version !== protocolVersion) {
        reasons.push({
          name,
          side,
          reason: 'core_version_mismatch',
          detail: `dev.ucp.* entries must declare the release date ${protocolVersion}, not ${entry.version}`,
        });
        continue;
      }
      good.push(entry);
    }
    if (good.length > 0) kept[name] = good;
    else pruned.push(...reasons.slice(0, 1));
  }
  return { kept, pruned };
}

function highest(versions: string[]): string | undefined {
  return [...versions].sort().at(-1);
}

/** Steps 1 to 4 of the intersection algorithm on already-filtered registries. */
export function intersectCapabilities(
  business: Record<string, Entity[]>,
  platform: Record<string, Entity[]>,
): { active: ActiveCapability[]; pruned: Pruned[] } {
  const pruned: Pruned[] = [];
  let active: ActiveCapability[] = [];
  for (const [name, bEntries] of Object.entries(business)) {
    const pEntries = platform[name];
    if (!pEntries) {
      pruned.push({ name, reason: 'not_offered_by_platform', detail: 'The agent profile does not list it' });
      continue;
    }
    const pVersions = new Set(pEntries.map((e) => e.version));
    const common = bEntries.map((e) => e.version).filter((v) => pVersions.has(v));
    const chosen = highest(common);
    if (!chosen) {
      pruned.push({
        name,
        reason: 'no_common_version',
        detail: `business offers ${bEntries.map((e) => e.version).join(', ')}; agent offers ${[...pVersions].join(', ')}`,
      });
      continue;
    }
    const entry = bEntries.find((e) => e.version === chosen);
    const parents = toArray(entry?.extends);
    active.push(parents.length > 0 ? { name, version: chosen, extends: parents } : { name, version: chosen });
  }
  for (const name of Object.keys(platform)) {
    if (!business[name]) {
      pruned.push({ name, reason: 'not_offered_by_business', detail: 'The business profile does not list it' });
    }
  }
  // Steps 3 and 4: prune extensions whose parents are all absent, repeating until stable.
  for (let round = 1; ; round++) {
    const names = new Set(active.map((c) => c.name));
    const orphans = active.filter((c) => c.extends && !c.extends.some((p) => names.has(p)));
    if (orphans.length === 0) break;
    for (const o of orphans) {
      pruned.push({
        name: o.name,
        reason: 'orphaned_extension',
        round,
        detail: `no parent in the intersection (extends ${o.extends?.join(', ')})`,
      });
    }
    active = active.filter((c) => !orphans.includes(c));
  }
  return { active, pruned };
}

/** Full business-side negotiation for one request carrying the agent profile. */
export function negotiate(
  businessText: string,
  platformText: string,
  leafProfiles: Record<string, Profile>,
): Negotiation | NegotiationFailure {
  const b = parseProfile(businessText, 'business');
  if (!b.ok) return { ok: false, code: b.code, side: 'business', detail: b.detail, httpStatus: 422, mcpCode: -32001 };
  const p = parseProfile(platformText, 'platform');
  if (!p.ok) return { ok: false, code: p.code, side: 'platform', detail: p.detail, httpStatus: 422, mcpCode: -32001 };
  const selected = selectProtocolVersion(b.profile, p.profile.ucp.version, leafProfiles);
  if (!selected.ok) {
    return {
      ok: false,
      code: selected.code,
      detail: selected.detail,
      httpStatus: ERROR_STATUS[selected.code],
      mcpCode: -32001,
    };
  }
  const bf = filterEntries(selected.profile.ucp.capabilities ?? {}, selected.version, 'business');
  const pf = filterEntries(p.profile.ucp.capabilities ?? {}, selected.version, 'platform');
  const result = intersectCapabilities(bf.kept, pf.kept);
  return {
    ok: true,
    protocolVersion: selected.version,
    via: selected.via,
    ...(selected.leafUri ? { leafUri: selected.leafUri } : {}),
    active: result.active,
    pruned: [...bf.pruned, ...pf.pruned, ...result.pruned],
    incompatible: result.active.length === 0,
    warnings: [...b.warnings, ...p.warnings],
  };
}

export function isActive(n: Negotiation | NegotiationFailure | null, name: string): boolean {
  return !!n && n.ok && n.active.some((c) => c.name === name);
}

/**
 * Capabilities to declare in a response: the root capability for the operation plus extensions where any
 * `extends` value matches it ("Response Capability Selection").
 */
export function responseCapabilities(
  n: Negotiation,
  root: string,
): Record<string, { version: string }[]> {
  const out: Record<string, { version: string }[]> = {};
  for (const c of n.active) {
    if (c.name === root || c.extends?.includes(root)) out[c.name] = [{ version: c.version }];
  }
  return out;
}

/** RFC 8941 dictionary with one string member, as the UCP-Agent header requires. */
export function ucpAgentHeader(profileUrl: string): string {
  return `profile="${profileUrl.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export const PRUNE_REASON_TEXT: Record<PruneReason, string> = {
  authority_binding_failed: 'Rejected: schema host does not own this namespace',
  core_version_mismatch: 'Rejected: dev.ucp.* entry not on the selected release',
  missing_schema: 'Rejected: no schema URL',
  not_offered_by_platform: 'Not in the agent profile',
  not_offered_by_business: 'Not in the business profile',
  no_common_version: 'No version in common',
  orphaned_extension: 'Pruned: parent capability missing',
};
