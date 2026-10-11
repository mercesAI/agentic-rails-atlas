/**
 * A small subset of RFC 8941 (Structured Field Values) that RFC 9421 needs: strings, integers, tokens,
 * booleans and byte sequences, with parameters, inner lists and dictionaries. Pure functions, no DOM.
 */

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

// ---------- base64 helpers ----------

export function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

export function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBytes(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  return base64ToBytes(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
}

// ---------- serialization ----------

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

// ---------- parsing ----------

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
