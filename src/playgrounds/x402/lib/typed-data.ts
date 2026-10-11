/**
 * EIP-712 typed data for the two EVM payloads the playground signs.
 * - exact, eip3009: TransferWithAuthorization (spec v1 section 6.1.1; specs/schemes/exact/scheme_exact_evm.md;
 *   SDK authorizationTypes in typescript/packages/mechanisms/evm/src/constants.ts).
 * - upto, permit2: PermitWitnessTransferFrom with the upto Witness (SDK uptoPermit2WitnessTypes, same file;
 *   specs/schemes/upto/scheme_upto_evm.md).
 * Keys are viem local accounts created in the browser; nothing touches a network.
 */
import { bytesToHex, getAddress, hashTypedData, recoverTypedDataAddress, type Address, type Hex } from 'viem';
import { FIXTURE_TOKEN, PERMIT2_ADDRESS, SIM_CHAIN_ID, UPTO_PERMIT2_PROXY } from './fixtures';

export const authorizationTypes = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const;

export const uptoPermit2WitnessTypes = {
  PermitWitnessTransferFrom: [
    { name: 'permitted', type: 'TokenPermissions' },
    { name: 'spender', type: 'address' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
    { name: 'witness', type: 'Witness' },
  ],
  TokenPermissions: [
    { name: 'token', type: 'address' },
    { name: 'amount', type: 'uint256' },
  ],
  Witness: [
    { name: 'to', type: 'address' },
    { name: 'facilitator', type: 'address' },
    { name: 'validAfter', type: 'uint256' },
  ],
} as const;

/** `authorization` object of the exact EVM payload (spec v2 section 5.2.2). All values are strings on the wire. */
export interface Eip3009Authorization {
  from: Address;
  to: Address;
  value: string;
  validAfter: string;
  validBefore: string;
  nonce: Hex;
}

/** `permit2Authorization` object of the upto EVM payload (scheme_upto_evm.md, Phase 2). */
export interface UptoPermit2Authorization {
  from: Address;
  permitted: { token: Address; amount: string };
  spender: Address;
  nonce: string;
  deadline: string;
  witness: { to: Address; facilitator: Address; validAfter: string };
}

export function randomBytes32(): Hex {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
}

/** Random uint256 as a decimal string, as createPermit2Nonce does in the SDK. */
export function randomUint256(): string {
  return BigInt(randomBytes32()).toString();
}

export function transferWithAuthorizationTypedData(auth: Eip3009Authorization, chainId = SIM_CHAIN_ID) {
  return {
    domain: {
      name: FIXTURE_TOKEN.name,
      version: FIXTURE_TOKEN.version,
      chainId,
      verifyingContract: FIXTURE_TOKEN.address,
    },
    types: authorizationTypes,
    primaryType: 'TransferWithAuthorization' as const,
    message: {
      from: getAddress(auth.from),
      to: getAddress(auth.to),
      value: BigInt(auth.value),
      validAfter: BigInt(auth.validAfter),
      validBefore: BigInt(auth.validBefore),
      nonce: auth.nonce,
    },
  };
}

export function permitWitnessTypedData(auth: UptoPermit2Authorization, chainId = SIM_CHAIN_ID) {
  return {
    domain: { name: 'Permit2', chainId, verifyingContract: PERMIT2_ADDRESS },
    types: uptoPermit2WitnessTypes,
    primaryType: 'PermitWitnessTransferFrom' as const,
    message: {
      permitted: { token: getAddress(auth.permitted.token), amount: BigInt(auth.permitted.amount) },
      spender: getAddress(auth.spender),
      nonce: BigInt(auth.nonce),
      deadline: BigInt(auth.deadline),
      witness: {
        to: getAddress(auth.witness.to),
        facilitator: getAddress(auth.witness.facilitator),
        validAfter: BigInt(auth.witness.validAfter),
      },
    },
  };
}

export type TypedData = ReturnType<typeof transferWithAuthorizationTypedData> | ReturnType<typeof permitWitnessTypedData>;

/** Minimal signer shape: a viem LocalAccount satisfies it. */
export interface TypedDataSigner {
  address: Address;
  signTypedData: (td: TypedData) => Promise<Hex>;
}

/** Build the exact EIP-3009 authorization the way createEIP3009Payload does: validAfter "0", validBefore now + maxTimeoutSeconds. */
export function buildEip3009Authorization(opts: {
  from: Address;
  to: Address;
  value: string;
  now: number;
  maxTimeoutSeconds: number;
  nonce?: Hex;
}): Eip3009Authorization {
  return {
    from: getAddress(opts.from),
    to: getAddress(opts.to),
    value: opts.value,
    validAfter: '0',
    validBefore: String(opts.now + opts.maxTimeoutSeconds),
    nonce: opts.nonce ?? randomBytes32(),
  };
}

/** Build the upto Permit2 authorization the way the SDK upto client does: validAfter "0", deadline now + maxTimeoutSeconds. */
export function buildUptoAuthorization(opts: {
  from: Address;
  to: Address;
  facilitator: Address;
  token: Address;
  amount: string;
  now: number;
  maxTimeoutSeconds: number;
  nonce?: string;
}): UptoPermit2Authorization {
  return {
    from: getAddress(opts.from),
    permitted: { token: getAddress(opts.token), amount: opts.amount },
    spender: UPTO_PERMIT2_PROXY,
    nonce: opts.nonce ?? randomUint256(),
    deadline: String(opts.now + opts.maxTimeoutSeconds),
    witness: { to: getAddress(opts.to), facilitator: getAddress(opts.facilitator), validAfter: '0' },
  };
}

export function digestOf(td: TypedData): Hex {
  return hashTypedData(td as Parameters<typeof hashTypedData>[0]);
}

export function signTypedData(signer: TypedDataSigner, td: TypedData): Promise<Hex> {
  return signer.signTypedData(td);
}

/** Recover the signer address from typed data and a signature (what the facilitator does first). */
export async function recoverSigner(td: TypedData, signature: Hex): Promise<Address> {
  return recoverTypedDataAddress({ ...(td as Parameters<typeof hashTypedData>[0]), signature });
}

export function sameAddress(a: string, b: string): boolean {
  return a.toLowerCase() === b.toLowerCase();
}

/** JSON-ready view of typed data (bigints as decimal strings), for the preview panel. */
export function typedDataForDisplay(td: TypedData): unknown {
  return JSON.parse(JSON.stringify(td, (_k, v: unknown) => (typeof v === 'bigint' ? v.toString() : v)));
}

/** Same typed data with the amount raised by one atomic unit, to show that recovery then names a different address. */
export function tamperAmount(td: TypedData): TypedData {
  if (td.primaryType === 'TransferWithAuthorization') {
    return { ...td, message: { ...td.message, value: td.message.value + 1n } };
  }
  return {
    ...td,
    message: { ...td.message, permitted: { ...td.message.permitted, amount: td.message.permitted.amount + 1n } },
  };
}
