/**
 * Fixture data and labels for the Visa TAP playground. Hosts use reserved example domains; key ids are
 * fixtures; no Visa key, JWKS or endpoint is fetched or embedded.
 */
import type { ComponentId, HttpRequest } from '@/lib/playground/http-sig';

export const SPEC_READ_DATE = '2026-10-11';
export const ILLUSTRATIVE_LABEL = `Illustrative example, Visa TAP specification (undated, read ${SPEC_READ_DATE})`;
export const WBA_DRAFT = 'draft-ietf-webbotauth-httpsig-protocol-00';
export const WBA_LABEL = `Illustrative example, ${WBA_DRAFT}`;

/** The TAP examples use the label sig2; the Web Bot Auth examples use sig1. */
export const TAP_LABEL = 'sig2';
export const WBA_SIG_LABEL = 'sig1';
/** Opaque fixture keyid for TAP (TAP does not fix a keyid format). */
export const TAP_KEYID = 'agent-key-1';
export const MERCHANT_AUTHORITY = 'shop.example';
export const AGENT_DIRECTORY_ORIGIN = 'https://agent.example';
export const WBA_DIRECTORY_PATH = '/.well-known/http-message-signatures-directory';
export const WBA_DIRECTORY_MEDIA_TYPE = 'application/http-message-signatures-directory+json';

export type TapTag = 'agent-browser-auth' | 'agent-payer-auth';
export type WindowChoice = 300 | 480 | 600 | 3600;

export const WINDOW_CHOICES: Array<{ value: WindowChoice; label: string }> = [
  { value: 300, label: '5 minutes' },
  { value: 480, label: '8 minutes (TAP maximum)' },
  { value: 600, label: '10 minutes (too long)' },
  { value: 3600, label: '3,600 seconds (the spec example window)' },
];

export function requestFor(tag: TapTag): HttpRequest {
  return tag === 'agent-payer-auth'
    ? {
        method: 'POST',
        scheme: 'https',
        authority: MERCHANT_AUTHORITY,
        path: '/checkout',
        query: '',
        headers: { 'content-type': 'application/json', 'user-agent': 'ExampleAgent/1.0' },
      }
    : {
        method: 'GET',
        scheme: 'https',
        authority: MERCHANT_AUTHORITY,
        path: '/example-product',
        query: 'color=blue',
        headers: { 'user-agent': 'ExampleAgent/1.0' },
      };
}

export interface ComponentChoice {
  id: ComponentId;
  label: string;
  /** In TAP's minimum set. */
  required: boolean;
  hint: string;
}

export const COMPONENT_CHOICES: ComponentChoice[] = [
  { id: { name: '@authority' }, label: '@authority', required: true, hint: 'Host of the target URI. TAP minimum.' },
  { id: { name: '@path' }, label: '@path', required: true, hint: 'Absolute path. TAP minimum.' },
  { id: { name: '@method' }, label: '@method', required: false, hint: 'GET or POST. Not in the TAP minimum set.' },
  { id: { name: '@query' }, label: '@query', required: false, hint: 'Query string with its leading "?".' },
  { id: { name: '@target-uri' }, label: '@target-uri', required: false, hint: 'The full URI.' },
  { id: { name: 'user-agent' }, label: 'user-agent', required: false, hint: 'A header field, value trimmed.' },
];

export type TamperId = 'none' | 'path' | 'authority' | 'query' | 'user-agent' | 'tag' | 'keyid' | 'signature' | 'drop-signature';

export const TAMPERS: Array<{ value: TamperId; label: string }> = [
  { value: 'none', label: 'Send as signed' },
  { value: 'path', label: 'Change the path in transit' },
  { value: 'authority', label: 'Change the host in transit' },
  { value: 'query', label: 'Change the query string' },
  { value: 'user-agent', label: 'Change the User-Agent header' },
  { value: 'tag', label: 'Swap the tag in Signature-Input' },
  { value: 'keyid', label: 'Point keyid at an unknown key' },
  { value: 'signature', label: 'Flip one bit of the signature' },
  { value: 'drop-signature', label: 'Strip the Signature header' },
];

export interface FieldDoc {
  field: string;
  required: string;
  meaning: string;
}

/** Field explanations paraphrased from the TAP spec tables (Consumer Recognition, Contextual Data, ID Token). */
export const CONSUMER_FIELDS: FieldDoc[] = [
  { field: 'nonce', required: 'Required', meaning: 'Same nonce as the message signature, binding the object to that request.' },
  { field: 'idToken', required: 'Required', meaning: 'A JWT compatible with an OpenID Connect ID Token, signed by Visa. The spec JSON example spells it IdToken.' },
  { field: 'contextualData', required: 'Required', meaning: 'Device and location identifiers: countryCode, zip, ipAddress, deviceData.' },
  { field: 'kid', required: 'Required', meaning: 'Key id; should equal the keyid of the message signature.' },
  { field: 'alg', required: 'Required', meaning: 'Signing algorithm; the spec example uses PS256.' },
  { field: 'signature', required: 'Required', meaning: 'Signature over all other fields in the order received.' },
  { field: 'contextualData.countryCode', required: 'Not stated', meaning: 'ISO 3166-1 alpha-2 country code.' },
  { field: 'contextualData.zip', required: 'Not stated', meaning: 'Postal code, or city and state (16 characters).' },
  { field: 'contextualData.ipAddress', required: 'Not stated', meaning: 'IP address of the consumer device collected during the payment instruction.' },
  { field: 'contextualData.deviceData', required: 'Not stated', meaning: 'Device data collected during the payment instruction; fields not listed.' },
];

export const ID_TOKEN_FIELDS: FieldDoc[] = [
  { field: 'header alg', required: 'Required', meaning: 'none is not supported; PS256 preferred to RS256.' },
  { field: 'header kid', required: 'Required', meaning: 'Visa key id.' },
  { field: 'header typ', required: 'Required', meaning: 'Should be JWT+ext.id_token.' },
  { field: 'iss, sub, aud, exp, iat', required: '1 each (aud 1..n)', meaning: 'Issuer, a never-reassigned consumer id, audiences, expiry, issued at.' },
  { field: 'jti, auth_time, amr', required: 'Optional', meaning: 'Token id, time of authentication, authentication methods.' },
  { field: 'email, phone_number', required: 'Optional', meaning: 'Obfuscated values; the merchant maps them to its own accounts. The method is not specified.' },
  { field: 'email_verified, phone_number_verified', required: 'Optional', meaning: 'Verified by the OpenID Provider.' },
  { field: 'email_mask, phone_number_mask', required: 'Optional', meaning: 'Masked values for display.' },
];

export const PAYMENT_FIELDS: FieldDoc[] = [
  { field: 'nonce', required: 'Required', meaning: 'Same nonce as the message signature.' },
  { field: 'kid', required: 'Required', meaning: 'Key id; should equal the keyid of the message signature.' },
  { field: 'alg', required: 'Required', meaning: 'Signing algorithm; the spec example uses PS256.' },
  { field: 'signature', required: 'Required', meaning: 'Signature over the other fields in the order received.' },
  { field: 'paymentCredentialsHash', required: 'Conditional', meaning: 'Guest checkout with key-entered card data: the merchant hashes what was typed and compares. Inner fields and hash algorithm are not stated, so this simulation leaves it out.' },
  { field: 'cardMetadata', required: 'Optional', meaning: 'Card details for receipts and display: lastFour, paymentAccountReference, shortDescription and card art.' },
  { field: 'payload', required: 'Conditional', meaning: 'The full payment object encrypted to the merchant public key, when the merchant processes by API.' },
  { field: 'browsingIOU', required: 'Conditional', meaning: 'Present after an HTTP 402: invoiceId, amount, cardAcceptorId, acquirerId, uri, sequenceCounter, paymentService, kid, alg, signature.' },
];

export interface ComparisonRow {
  aspect: string;
  tap: string;
  wba: string;
}

export const COMPARISON: ComparisonRow[] = [
  { aspect: 'tag', tap: 'agent-browser-auth or agent-payer-auth', wba: 'MUST be web-bot-auth' },
  { aspect: 'Key discovery header', tap: 'None required', wba: 'Signature-Agent REQUIRED and covered by the signature' },
  { aspect: 'Covered components', tap: '@authority and @path required', wba: '@authority or @target-uri; more SHOULD be added' },
  { aspect: 'nonce', tap: 'Required; shared with body objects', wba: 'Not required by the draft' },
  { aspect: 'keyid', tap: 'Key identifier, no fixed format', wba: 'MUST be the base64url JWK SHA-256 thumbprint' },
  { aspect: 'alg', tap: 'Required', wba: 'Not in the required list' },
  { aspect: 'Window', tap: 'expires - created at most 8 minutes', wba: 'Expiry RECOMMENDED within 24 hours' },
  { aspect: 'Key directory', tap: 'Visa-hosted JWKS', wba: `${WBA_DIRECTORY_PATH} on the Signature-Agent host` },
];

/** Spec quirks shown in the UI (ATLAS_ERRATA R16 and R17, research dossier). */
export const SPEC_QUIRKS: string[] = [
  "The TAP spec's example keyid, nonce, timestamps and signature reuse a Web Bot Auth draft test vector, and the browsing and checkout examples print the same signature, so the published examples cannot verify against the requests they sit under.",
  'The example created and expires are 3,600 seconds apart, while the same spec caps the window at 8 minutes. Pick the 3,600-second window below to see a strict verifier block it.',
  "Visa's published key directory held one RSA key on 2026-10-11 and no Ed25519 key, so the example keyid cannot be resolved there. This playground uses a local fixture directory instead and never contacts Visa.",
  'The examples write alg="Ed25519"; the RFC 9421 algorithm registry name is ed25519 in lowercase. This verifier accepts both.',
];
