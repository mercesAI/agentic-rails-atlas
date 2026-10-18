/**
 * HTTP message signatures (RFC 9421) over a small subset of Structured Field Values (RFC 8941): strings,
 * integers, tokens, booleans and byte sequences, with parameters, inner lists and dictionaries. Covers the
 * derived components @method, @authority, @path, @query and @target-uri plus header fields (with the `key`
 * parameter for Dictionary headers such as Signature-Agent), the signature base, the Signature-Input and
 * Signature headers, and their parsing. Pure functions, no DOM; signing is a callback the caller provides.
 */
import { base64ToBytes, bytesToBase64 } from './bytes';

// ---------- Structured Field types ----------

export type BareItem = string | number | boolean | Uint8Array | { token: string };
export type Params = Array<[string, BareItem]>;
export interface Item {
  value: BareItem;
  params: Params;
}
export interface InnerList {
  items: Item[];
  params: Params;
}
export type Member = Item | InnerList;
export type Dictionary = Array<[string, Member]>;

export function isInnerList(m: Member): m is InnerList {
  return Array.isArray((m as InnerList).items);
}

// ---------- Structured Field serialization ----------

const KEY_RE = /^[a-z*][a-z0-9_\-.*]*$/;
const TOKEN_RE = /^[A-Za-z*][!#$%&'*+\-.^_`|~0-9A-Za-z:/]*$/;

export function serializeString(s: string): string {
  for (const ch of s) {
    const c = ch.charCodeAt(0);
    if (c < 0x20 || c > 0x7e) throw new Error(`String contains a character outside printable ASCII: ${JSON.stringify(ch)}`);
  }
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

export function serializeBareItem(v: BareItem): string {
  if (typeof v === 'string') return serializeString(v);
  if (typeof v === 'number') {
    if (!Number.isInteger(v)) throw new Error('Only integers are supported');
    return String(v);
  }
  if (typeof v === 'boolean') return v ? '?1' : '?0';
  if (v instanceof Uint8Array) return `:${bytesToBase64(v)}:`;
  if (!TOKEN_RE.test(v.token)) throw new Error(`Invalid token: ${v.token}`);
  return v.token;
}

export function serializeParams(params: Params): string {
  return params
    .map(([k, v]) => {
      if (!KEY_RE.test(k)) throw new Error(`Invalid parameter key: ${k}`);
      return v === true ? `;${k}` : `;${k}=${serializeBareItem(v)}`;
    })
    .join('');
}

export function serializeItem(item: Item): string {
  return serializeBareItem(item.value) + serializeParams(item.params);
}

export function serializeInnerList(list: InnerList): string {
  return `(${list.items.map(serializeItem).join(' ')})${serializeParams(list.params)}`;
}

export function serializeMember(m: Member): string {
  return isInnerList(m) ? serializeInnerList(m) : serializeItem(m);
}

export function serializeDictionary(dict: Dictionary): string {
  return dict
    .map(([k, m]) => {
      if (!KEY_RE.test(k)) throw new Error(`Invalid dictionary key: ${k}`);
      if (!isInnerList(m) && m.value === true) return k + serializeParams(m.params);
      return `${k}=${serializeMember(m)}`;
    })
    .join(', ');
}

// ---------- Structured Field parsing ----------

class Cursor {
  i = 0;
  constructor(readonly s: string) {}
  peek(): string {
    return this.s[this.i] ?? '';
  }
  done(): boolean {
    return this.i >= this.s.length;
  }
  skipSp(): void {
    while (this.peek() === ' ') this.i++;
  }
  skipOws(): void {
    while (this.peek() === ' ' || this.peek() === '\t') this.i++;
  }
  fail(msg: string): never {
    throw new Error(`${msg} at position ${this.i}`);
  }
}

function parseKey(c: Cursor): string {
  const m = /^[a-z*][a-z0-9_\-.*]*/.exec(c.s.slice(c.i));
  if (!m) c.fail('Expected a key');
  c.i += m[0].length;
  return m[0];
}

function parseBareItem(c: Cursor): BareItem {
  const ch = c.peek();
  const rest = c.s.slice(c.i);
  if (ch === '"') {
    c.i++;
    let out = '';
    while (!c.done()) {
      const x = c.s[c.i++];
      if (x === '\\') {
        const n = c.s[c.i++];
        if (n !== '"' && n !== '\\') c.fail('Bad escape in string');
        out += n;
      } else if (x === '"') return out;
      else out += x;
    }
    c.fail('Unterminated string');
  }
  if (ch === ':') {
    const end = c.s.indexOf(':', c.i + 1);
    if (end < 0) c.fail('Unterminated byte sequence');
    const b64 = c.s.slice(c.i + 1, end);
    if (!/^[A-Za-z0-9+/=]*$/.test(b64)) c.fail('Bad byte sequence');
    c.i = end + 1;
    return base64ToBytes(b64);
  }
  if (ch === '?') {
    const b = c.s[c.i + 1];
    if (b !== '0' && b !== '1') c.fail('Bad boolean');
    c.i += 2;
    return b === '1';
  }
  const num = /^-?\d{1,15}/.exec(rest);
  if (num) {
    c.i += num[0].length;
    return Number(num[0]);
  }
  const tok = /^[A-Za-z*][!#$%&'*+\-.^_`|~0-9A-Za-z:/]*/.exec(rest);
  if (tok) {
    c.i += tok[0].length;
    return { token: tok[0] };
  }
  return c.fail('Expected a value');
}

function parseParams(c: Cursor): Params {
  const out: Params = [];
  while (c.peek() === ';') {
    c.i++;
    c.skipSp();
    const k = parseKey(c);
    let v: BareItem = true;
    if (c.peek() === '=') {
      c.i++;
      v = parseBareItem(c);
    }
    const existing = out.findIndex(([ek]) => ek === k);
    if (existing >= 0) out[existing] = [k, v];
    else out.push([k, v]);
  }
  return out;
}

function parseItem(c: Cursor): Item {
  const value = parseBareItem(c);
  return { value, params: parseParams(c) };
}

function parseMember(c: Cursor): Member {
  if (c.peek() === '(') {
    c.i++;
    const items: Item[] = [];
    for (;;) {
      c.skipSp();
      if (c.peek() === ')') {
        c.i++;
        return { items, params: parseParams(c) };
      }
      if (c.done()) c.fail('Unterminated inner list');
      items.push(parseItem(c));
      if (c.peek() !== ' ' && c.peek() !== ')') c.fail('Expected a space or ) in inner list');
    }
  }
  return parseItem(c);
}

export function parseItemText(s: string): Item {
  const c = new Cursor(s.trim());
  const item = parseItem(c);
  if (!c.done()) c.fail('Unexpected characters after item');
  return item;
}

export function parseDictionary(s: string): Dictionary {
  const c = new Cursor(s.trim());
  const out: Dictionary = [];
  while (!c.done()) {
    const k = parseKey(c);
    let m: Member;
    if (c.peek() === '=') {
      c.i++;
      m = parseMember(c);
    } else {
      m = { value: true, params: parseParams(c) };
    }
    const existing = out.findIndex(([ek]) => ek === k);
    if (existing >= 0) out[existing] = [k, m];
    else out.push([k, m]);
    c.skipOws();
    if (c.done()) break;
    if (c.peek() !== ',') c.fail('Expected a comma between dictionary members');
    c.i++;
    c.skipOws();
    if (c.done()) c.fail('Trailing comma');
  }
  return out;
}

// ---------- RFC 9421 ----------

export interface HttpRequest {
  method: string;
  /** Always https in the simulations. */
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

/** Build the base, sign it with the caller's signer and return both headers. */
export async function signRequest(
  req: HttpRequest,
  opts: { label: string; components: ComponentId[]; params: SigParams; sign: (base: string) => Promise<Uint8Array> },
): Promise<SignedOutput> {
  const base = buildSignatureBase(req, opts.components, opts.params);
  const sigBytes = await opts.sign(base);
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
