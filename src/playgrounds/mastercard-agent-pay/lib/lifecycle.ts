/**
 * Agentic token lifecycle. State names and published transitions follow
 * `src/content/states/mastercard-agent-pay-token-lifecycle.json`, which is itself a description of the
 * developer guides, not a published Mastercard state model. Anything the program does not publish
 * (revocation, response codes, the provisioning call) is labeled "not published".
 */
import { fixtureToken } from './fixtures';
import { b64urlEncodeJson, sha256B64url, randomB64url, b64urlEncode } from './encoding';
import { signBytes, verifyBytes, type Es256Key } from './jws';

export const NOT_PUBLISHED = 'not published';

export type TokenState =
  | 'agent-registered'
  | 'agent-certified'
  | 'consumer-authorized'
  | 'token-provisioned'
  | 'presented'
  | 'authorized'
  | 'declined'
  | 'expired-or-revoked';

export const STATES: { id: TokenState; label: string; terminal?: boolean }[] = [
  { id: 'agent-registered', label: 'Agent registered' },
  { id: 'agent-certified', label: 'Agent certified' },
  { id: 'consumer-authorized', label: 'Consumer authorized' },
  { id: 'token-provisioned', label: 'Token provisioned' },
  { id: 'presented', label: 'Presented at checkout' },
  { id: 'authorized', label: 'Authorized', terminal: true },
  { id: 'declined', label: 'Declined', terminal: true },
  { id: 'expired-or-revoked', label: 'Expired or no longer usable', terminal: true },
];

export const stateLabel = (s: TokenState): string => STATES.find((x) => x.id === s)?.label ?? s;

export interface Transition {
  from: TokenState;
  to: TokenState;
  trigger: string;
  /** False for simulator actions that the state machine on the page does not contain. */
  published: boolean;
}

/** Published transitions, copied from the state machine JSON. */
export const PUBLISHED: Transition[] = [
  { from: 'agent-registered', to: 'agent-certified', trigger: 'Security review and certification pass', published: true },
  { from: 'agent-certified', to: 'consumer-authorized', trigger: 'Consumer authenticates and authorizes the agent', published: true },
  { from: 'consumer-authorized', to: 'token-provisioned', trigger: 'Platform requests an agentic token (call not published)', published: true },
  { from: 'token-provisioned', to: 'presented', trigger: 'Agent fills the card form or calls the merchant API', published: true },
  { from: 'presented', to: 'authorized', trigger: 'Network detokenizes and issuer approves', published: true },
  { from: 'presented', to: 'declined', trigger: 'Outside token limits or issuer declines', published: true },
  { from: 'token-provisioned', to: 'expired-or-revoked', trigger: 'Time window passes or single use consumed', published: true },
  { from: 'authorized', to: 'expired-or-revoked', trigger: 'Single-use token cannot be used again', published: true },
];

/** Simulator-only transitions. The page's state machine has no revocation call and no repeat-use edge. */
export const EXTENSIONS: Transition[] = [
  { from: 'token-provisioned', to: 'expired-or-revoked', trigger: 'Revoke (mechanism not published)', published: false },
  { from: 'authorized', to: 'expired-or-revoked', trigger: 'Revoke (mechanism not published)', published: false },
  { from: 'declined', to: 'expired-or-revoked', trigger: 'Revoke (mechanism not published)', published: false },
  { from: 'authorized', to: 'presented', trigger: 'Another purchase with a reusable token (edge not in the page state machine)', published: false },
  { from: 'declined', to: 'presented', trigger: 'Another attempt after a decline (edge not in the page state machine)', published: false },
];

export function findTransition(from: TokenState, to: TokenState, extension = false): Transition | undefined {
  const pool = extension ? EXTENSIONS : PUBLISHED;
  return pool.find((t) => t.from === from && t.to === to);
}

export interface Controls {
  /** Per-purchase limit in minor units. */
  limitMinor: number;
  /** Merchant ids the token may be used at. Empty means no merchant scope was set. */
  merchantIds: string[];
  /** Unix seconds. */
  expiresAt: number;
  singleUse: boolean;
}

export interface AgenticToken {
  value: string;
  controls: Controls;
  issuedAt: number;
  uses: number;
  revoked: boolean;
}

export function provisionToken(controls: Controls, now: number): AgenticToken {
  return { value: fixtureToken(randomB64url(6).replace(/[-_]/g, 'x')), controls, issuedAt: now, uses: 0, revoked: false };
}

export type DeclineReason = 'amount-over-limit' | 'merchant-out-of-scope' | 'token-expired' | 'token-revoked' | 'single-use-consumed';

export const REASON_TEXT: Record<DeclineReason, string> = {
  'amount-over-limit': 'Amount is above the limit the consumer set',
  'merchant-out-of-scope': 'Merchant is outside the consumer scope',
  'token-expired': 'Time window has passed',
  'token-revoked': 'Token was revoked in the simulator',
  'single-use-consumed': 'Single-use token was already used',
};

export interface AuthResult {
  approved: boolean;
  reasons: DeclineReason[];
  /** Mastercard publishes no response codes for agentic token declines. */
  responseCode: typeof NOT_PUBLISHED;
}

export function authorize(token: AgenticToken, req: { amountMinor: number; merchantId: string; now: number }): AuthResult {
  const reasons: DeclineReason[] = [];
  if (token.revoked) reasons.push('token-revoked');
  if (req.now >= token.controls.expiresAt) reasons.push('token-expired');
  if (token.controls.singleUse && token.uses > 0) reasons.push('single-use-consumed');
  if (req.amountMinor > token.controls.limitMinor) reasons.push('amount-over-limit');
  if (!token.controls.merchantIds.includes(req.merchantId)) reasons.push('merchant-out-of-scope');
  return { approved: reasons.length === 0, reasons, responseCode: NOT_PUBLISHED };
}

/** Whether the token can still be presented at all (before limits are checked). */
export function isUsable(token: AgenticToken, now: number): boolean {
  return !token.revoked && now < token.controls.expiresAt && !(token.controls.singleUse && token.uses > 0);
}

/**
 * Next state after a purchase attempt reaches the network. When the token is no longer usable the state
 * is `expired-or-revoked` and the attempt is declined without a new transition.
 */
export function stateAfterAttempt(current: TokenState, usable: boolean, approved: boolean, revoked = false): { state: TokenState; path: Transition[] } {
  if (!usable) {
    const path: Transition[] = [];
    if (current !== 'expired-or-revoked') {
      const t = revoked ? findTransition(current, 'expired-or-revoked', true) : (findTransition(current, 'expired-or-revoked') ?? findTransition(current, 'expired-or-revoked', true));
      if (t) path.push(t);
    }
    return { state: 'expired-or-revoked', path };
  }
  const path: Transition[] = [];
  if (current !== 'token-provisioned') {
    const t = findTransition(current, 'presented', true);
    if (t) path.push(t);
  } else {
    path.push(findTransition('token-provisioned', 'presented') as Transition);
  }
  const final = approved ? 'authorized' : 'declined';
  path.push(findTransition('presented', final) as Transition);
  return { state: final, path };
}

// ---- consent (teaching simplification of a passkey)

export interface Consent {
  challenge: string;
  signature: string;
  verified: boolean;
}

/**
 * Teaching simplification: a real passkey is a WebAuthn credential with authenticator data and a
 * relying party. Here a fresh P-256 key signs a challenge that names the agent and the controls.
 */
export async function signConsent(passkey: Es256Key, agentKeyid: string, controls: Controls): Promise<Consent> {
  const challenge = b64urlEncodeJson({ agent: agentKeyid, controls, nonce: randomB64url(12) });
  const sig = await signBytes(challenge, passkey.privateKey);
  const verified = await verifyBytes(challenge, sig, passkey.publicKey);
  return { challenge, signature: b64urlEncode(sig), verified };
}

export async function consentDigest(c: Consent): Promise<string> {
  return sha256B64url(c.challenge);
}

/** Revoke is a simulator action: the program publishes no revocation API or state. */
export function revoke(current: TokenState): Transition | undefined {
  return findTransition(current, 'expired-or-revoked', true);
}
