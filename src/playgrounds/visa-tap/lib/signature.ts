/**
 * RFC 9421 signature base construction, Signature-Input and Signature headers, signing and parsing.
 * Covers the derived components @method, @authority, @path, @query and @target-uri plus header fields
 * (with the `key` parameter for Dictionary headers such as Signature-Agent).
 */
import {
  bytesToBase64,
  isInnerList,
  parseDictionary,
  serializeInnerList,
  serializeItem,
  type BareItem,
  type InnerList,
  type Item,
  type Params,
} from './sf';
import { signText, type SigAlg } from './keys';

export interface HttpRequest {
  method: string;
  /** Always https in this simulation. */
  scheme: 'https';
  /** Host and optional port, for example shop.example. */
  authority: string;
  /** Absolute path, starting with "/". */
  path: string;
  /** Query without the leading "?", or "" for none. */
  query: string;
  /** Header fields with lowercase names. */
  headers: Record<string, string>;
}

export interface ComponentId {
  /** Derived component such as "@path" or a lowercase header name. */
  name: string;
  /** RFC 9421 `key` parameter: select one member of a Dictionary header. */
  key?: string;
}

export type SigParamName = 'created' | 'expires' | 'keyid' | 'alg' | 'nonce' | 'tag';
export type SigParams = Array<[SigParamName | string, string | number]>;

export const DERIVED = ['@method', '@authority', '@path', '@query', '@target-uri'] as const;

/** `"@path"` or `"signature-agent";key="sig1"`: the component identifier as it appears in the base. */
export function serializeComponentId(c: ComponentId): string {
  return serializeItem(toItem(c));
}

function toItem(c: ComponentId): Item {
  return { value: c.name, params: c.key !== undefined ? [['key', c.key]] : [] };
}

function fromItem(item: Item): ComponentId {
  if (typeof item.value !== 'string') throw new Error('Component identifiers must be strings');
  const key = item.params.find(([k]) => k === 'key')?.[1];
  const unsupported = item.params.filter(([k]) => k !== 'key').map(([k]) => k);
  if (unsupported.length) throw new Error(`Unsupported component parameter: ${unsupported.join(', ')}`);
  if (key !== undefined && typeof key !== 'string') throw new Error('The key parameter must be a string');
  return key !== undefined ? { name: item.value, key } : { name: item.value };
}

/** Lowercase host; drop the default https port (RFC 9421 Section 2.2.3). */
export function normalizeAuthority(a: string): string {
  return a.toLowerCase().replace(/:443$/, '');
}

/** The value of one covered component, or an error naming what is missing. */
export function componentValue(req: HttpRequest, c: ComponentId): string {
  switch (c.name) {
    case '@method':
      return req.method.toUpperCase();
    case '@authority':
      return normalizeAuthority(req.authority);
    case '@path':
      return req.path || '/';
    case '@query':
      return `?${req.query}`;
    case '@target-uri':
      return `${req.scheme}://${normalizeAuthority(req.authority)}${req.path || '/'}${req.query ? `?${req.query}` : ''}`;
  }
  if (c.name.startsWith('@')) throw new Error(`Unsupported derived component ${c.name}`);
  if (c.name !== c.name.toLowerCase()) throw new Error(`Header component names must be lowercase: ${c.name}`);
  const raw = req.headers[c.name];
  if (raw === undefined) throw new Error(`Covered header ${c.name} is not in the request`);
  const value = raw.trim();
  if (c.key === undefined) return value;
  const member = parseDictionary(value).find(([k]) => k === c.key);
  if (!member) throw new Error(`Dictionary header ${c.name} has no member ${c.key}`);
  const m = member[1];
  return isInnerList(m) ? serializeInnerList(m) : serializeItem(m);
}

function toParams(params: SigParams): Params {
  return params.map(([k, v]) => [k, v as BareItem]);
}

/** The @signature-params value: inner list of component ids plus parameters, serialized as a Structured Field. */
export function serializeSignatureParams(components: ComponentId[], params: SigParams): string {
  const list: InnerList = { items: components.map(toItem), params: toParams(params) };
  return serializeInnerList(list);
}

/**
 * RFC 9421 Section 2.5: one line per component, `"<id>": <value>`, then the `"@signature-params"` line,
 * joined with LF and no trailing newline.
 */
export function buildSignatureBase(req: HttpRequest, components: ComponentId[], params: SigParams): string {
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const c of components) {
    const id = serializeComponentId(c);
    if (seen.has(id)) throw new Error(`Component ${id} is listed twice`);
    seen.add(id);
    const v = componentValue(req, c);
    if (/[\r\n]/.test(v)) throw new Error(`Component ${id} contains a line break`);
    lines.push(`${id}: ${v}`);
  }
  lines.push(`"@signature-params": ${serializeSignatureParams(components, params)}`);
  return lines.join('\n');
}

export function signatureInputHeader(label: string, components: ComponentId[], params: SigParams): string {
  return `${label}=${serializeSignatureParams(components, params)}`;
}

export function signatureHeader(label: string, sig: Uint8Array): string {
  return `${label}=:${bytesToBase64(sig)}:`;
}

export interface SignedOutput {
  base: string;
  signatureInput: string;
  signature: string;
  sigBytes: Uint8Array;
}

export async function signRequest(
  req: HttpRequest,
  opts: { label: string; components: ComponentId[]; params: SigParams; alg: SigAlg; privateKey: CryptoKey },
): Promise<SignedOutput> {
  const base = buildSignatureBase(req, opts.components, opts.params);
  const sigBytes = await signText(opts.alg, opts.privateKey, base);
  return {
    base,
    signatureInput: signatureInputHeader(opts.label, opts.components, opts.params),
    signature: signatureHeader(opts.label, sigBytes),
    sigBytes,
  };
}

export interface ParsedSignature {
  label: string;
  components: ComponentId[];
  params: SigParams;
}

/** Parse every label in a Signature-Input header. */
export function parseSignatureInput(header: string): ParsedSignature[] {
  return parseDictionary(header).map(([label, m]) => {
    if (!isInnerList(m)) throw new Error(`Signature-Input member ${label} is not an inner list`);
    const params: SigParams = m.params.map(([k, v]) => {
      if (typeof v === 'string' || typeof v === 'number') return [k, v];
      throw new Error(`Parameter ${k} has an unsupported type`);
    });
    return { label, components: m.items.map(fromItem), params };
  });
}

/** Parse a Signature header into label to signature bytes. */
export function parseSignatureHeader(header: string): Map<string, Uint8Array> {
  const out = new Map<string, Uint8Array>();
  for (const [label, m] of parseDictionary(header)) {
    if (isInnerList(m) || !(m.value instanceof Uint8Array)) throw new Error(`Signature member ${label} is not a byte sequence`);
    out.set(label, m.value);
  }
  return out;
}

export function paramValue(params: SigParams, name: string): string | number | undefined {
  return params.find(([k]) => k === name)?.[1];
}

/** Replace one parameter value in a Signature-Input header (for tampering demos). */
export function rewriteParam(header: string, label: string, name: string, value: string | number): string {
  const parsed = parseSignatureInput(header);
  return parsed
    .map((p) => {
      const params: SigParams = p.params.map(([k, v]) => (k === name && p.label === label ? [k, value] : [k, v]));
      return signatureInputHeader(p.label, p.components, params);
    })
    .join(', ');
}

/** Render the request line, Host and headers as HTTP/1.1 text for display. */
export function renderHttp(req: HttpRequest, extra: Array<[string, string]>): string {
  const target = `${req.path}${req.query ? `?${req.query}` : ''}`;
  const lines = [`${req.method.toUpperCase()} ${target} HTTP/1.1`, `Host: ${req.authority}`];
  for (const [k, v] of Object.entries(req.headers)) lines.push(`${titleCase(k)}: ${v}`);
  for (const [k, v] of extra) lines.push(`${k}: ${v}`);
  return lines.join('\n');
}

function titleCase(h: string): string {
  return h.replace(/(^|-)([a-z])/g, (_m, d: string, c: string) => d + c.toUpperCase());
}

