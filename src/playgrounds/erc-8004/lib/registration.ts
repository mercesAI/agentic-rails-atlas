/**
 * Registration file checks and the global agent id composer.
 * The schema below is derived from the spec text; the EIP publishes no JSON Schema. It follows the
 * required structure shown in research/vendor/ERCs/ERCS/erc-8004.md ("Agent URI and Agent Registration File")
 * and the field tables on the protocol page, which mark x402Support and active as required with a caveat.
 */
import { base64ToUtf8, utf8ToBase64 } from '@/lib/playground/bytes';
import { REGISTRATION_TYPE } from './fixtures';

export type JsonSchema = {
  title?: string;
  description?: string;
  type?: 'object' | 'array' | 'string' | 'boolean' | 'integer';
  const?: unknown;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  minItems?: number;
  minLength?: number;
  minimum?: number;
  pattern?: string;
};

export const SCHEMA_LABEL = 'Derived from the spec text; the EIP publishes no JSON Schema';

const AGENT_REGISTRY_PATTERN = '^[a-z0-9-]+:[0-9]+:0x[0-9a-fA-F]{40}$';

/** Local JSON Schema (draft 2020-12 subset) derived from the Draft text example. */
export const REGISTRATION_SCHEMA: JsonSchema = {
  title: 'ERC-8004 agent registration file',
  description: SCHEMA_LABEL,
  type: 'object',
  required: ['type', 'name', 'description', 'image', 'services', 'x402Support', 'active', 'registrations'],
  properties: {
    type: { type: 'string', const: REGISTRATION_TYPE },
    name: { type: 'string', minLength: 1 },
    description: { type: 'string', minLength: 1 },
    image: { type: 'string', minLength: 1 },
    services: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'endpoint'],
        properties: {
          name: { type: 'string', minLength: 1 },
          endpoint: { type: 'string', minLength: 1 },
          version: { type: 'string' },
          skills: { type: 'array', items: { type: 'string' } },
          domains: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    x402Support: { type: 'boolean' },
    active: { type: 'boolean' },
    registrations: {
      type: 'array',
      items: {
        type: 'object',
        required: ['agentId', 'agentRegistry'],
        properties: {
          agentId: { type: 'integer', minimum: 0 },
          agentRegistry: { type: 'string', pattern: AGENT_REGISTRY_PATTERN },
        },
      },
    },
    supportedTrust: { type: 'array', items: { type: 'string' } },
  },
};

export interface Issue {
  level: 'error' | 'warning' | 'note';
  path: string;
  message: string;
}

function typeOf(v: unknown): string {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  if (typeof v === 'number') return Number.isInteger(v) ? 'integer' : 'number';
  return typeof v;
}

/** Validates a value against the schema subset above. Returns errors only. */
export function validateSchema(value: unknown, schema: JsonSchema, path = '$'): Issue[] {
  const out: Issue[] = [];
  const err = (message: string, p = path) => out.push({ level: 'error', path: p, message });
  if (schema.type) {
    const t = typeOf(value);
    if (t !== schema.type) {
      err(`expected ${schema.type}, found ${t}`);
      return out;
    }
  }
  if (schema.const !== undefined && value !== schema.const) err(`must equal ${JSON.stringify(schema.const)}`);
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < schema.minLength) err('must not be empty');
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) err(`does not match ${schema.pattern}`);
  }
  if (typeof value === 'number' && schema.minimum !== undefined && value < schema.minimum) err(`must be at least ${schema.minimum}`);
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) err(`needs at least ${schema.minItems} item(s)`);
    if (schema.items) value.forEach((item, i) => out.push(...validateSchema(item, schema.items!, `${path}[${i}]`)));
  }
  if (schema.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const key of schema.required ?? []) if (!(key in obj)) err(`missing required field "${key}"`, `${path}.${key}`);
    for (const [key, sub] of Object.entries(schema.properties ?? {})) {
      if (key in obj) out.push(...validateSchema(obj[key], sub, `${path}.${key}`));
    }
  }
  return out;
}

export interface Validation {
  ok: boolean;
  issues: Issue[];
}

/** Parses JSON text and checks it: schema errors plus the SHOULD and OPTIONAL rules of the text as warnings and notes. */
export function validateRegistrationText(text: string): Validation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    return { ok: false, issues: [{ level: 'error', path: '$', message: `not valid JSON: ${e instanceof Error ? e.message : String(e)}` }] };
  }
  return validateRegistration(parsed);
}

export function validateRegistration(value: unknown): Validation {
  const issues = validateSchema(value, REGISTRATION_SCHEMA);
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.registrations) && obj.registrations.length === 0) {
      issues.push({ level: 'warning', path: '$.registrations', message: 'the text says agents SHOULD have at least one registration' });
    }
    if (Array.isArray(obj.services)) {
      obj.services.forEach((s, i) => {
        if (s && typeof s === 'object' && !('version' in s)) {
          issues.push({ level: 'note', path: `$.services[${i}].version`, message: 'version is a SHOULD, not a MUST' });
        }
      });
    }
    if (!('supportedTrust' in obj) || (Array.isArray(obj.supportedTrust) && obj.supportedTrust.length === 0)) {
      issues.push({ level: 'note', path: '$.supportedTrust', message: 'absent or empty: the file is used for discovery only, not for trust' });
    }
    if (typeof obj.image === 'string' && obj.image && !/^(https:\/\/|ipfs:\/\/|data:)/.test(obj.image)) {
      issues.push({ level: 'warning', path: '$.image', message: 'ERC-721 apps expect a URL here' });
    }
  }
  return { ok: !issues.some((i) => i.level === 'error'), issues };
}

export type UriScheme = 'ipfs' | 'https' | 'data' | 'other';

/** Classifies an agentURI. The text names ipfs://, https:// and base64 data: URIs as examples. */
export function classifyAgentUri(uri: string): { scheme: UriScheme; issue?: Issue } {
  if (uri.startsWith('ipfs://')) return { scheme: 'ipfs' };
  if (uri.startsWith('https://')) return { scheme: 'https' };
  if (uri.startsWith('data:')) {
    if (!uri.startsWith('data:application/json;base64,')) {
      return { scheme: 'data', issue: { level: 'warning', path: 'agentURI', message: 'the text recommends a base64 data URI of type application/json, not raw JSON' } };
    }
    return { scheme: 'data' };
  }
  return { scheme: 'other', issue: { level: 'warning', path: 'agentURI', message: 'the text gives ipfs://, https:// and base64 data: URIs as examples; resolvers may not support other schemes' } };
}

/** Encodes a registration file as the fully on-chain form `data:application/json;base64,...`. */
export function toDataUri(file: unknown): string {
  return `data:application/json;base64,${utf8ToBase64(JSON.stringify(file))}`;
}

/** Decodes a base64 JSON data URI back to the object. Throws on any other form. */
export function fromDataUri(uri: string): unknown {
  const prefix = 'data:application/json;base64,';
  if (!uri.startsWith(prefix)) throw new Error('not a base64 JSON data URI');
  return JSON.parse(base64ToUtf8(uri.slice(prefix.length)));
}

export interface GlobalIdInput {
  namespace: string;
  chainId: string;
  identityRegistry: string;
  agentId: string;
}

export interface GlobalId {
  ok: boolean;
  errors: string[];
  /** `{namespace}:{chainId}:{identityRegistry}` */
  agentRegistry: string;
  agentId: number | null;
  /** The registrations entry that binds a file back to this identity. */
  registrationEntry: { agentId: number; agentRegistry: string } | null;
}

/** Composes the agentRegistry string and checks each part. */
export function composeGlobalId(input: GlobalIdInput): GlobalId {
  const errors: string[] = [];
  const namespace = input.namespace.trim();
  const chainId = input.chainId.trim();
  const registry = input.identityRegistry.trim();
  if (!/^[a-z0-9-]{3,8}$/.test(namespace)) errors.push('namespace must be a chain family id such as eip155');
  else if (namespace !== 'eip155') errors.push('the registries are EVM contracts; the text gives eip155 as the namespace for EVM chains');
  if (!/^[1-9][0-9]*$/.test(chainId)) errors.push('chainId must be a positive decimal integer');
  if (!/^0x[0-9a-fA-F]{40}$/.test(registry)) errors.push('identityRegistry must be a 20-byte hex address');
  let agentId: number | null = null;
  if (/^(0|[1-9][0-9]*)$/.test(input.agentId.trim()) && Number.isSafeInteger(Number(input.agentId.trim()))) agentId = Number(input.agentId.trim());
  else errors.push('agentId must be a non-negative integer (the ERC-721 tokenId)');
  const agentRegistry = `${namespace}:${chainId}:${registry}`;
  return {
    ok: errors.length === 0,
    errors,
    agentRegistry,
    agentId,
    registrationEntry: errors.length === 0 && agentId !== null ? { agentId, agentRegistry } : null,
  };
}

/** Splits an agentRegistry string into its three parts, or returns null. */
export function parseAgentRegistry(s: string): { namespace: string; chainId: string; identityRegistry: string } | null {
  const m = /^([a-z0-9-]+):([0-9]+):(0x[0-9a-fA-F]{40})$/.exec(s.trim());
  return m ? { namespace: m[1]!, chainId: m[2]!, identityRegistry: m[3]! } : null;
}
