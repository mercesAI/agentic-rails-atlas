/**
 * setAgentWallet preview. Mirrors IdentityRegistryUpgradeable.sol (version 2.0.0): the caller must be the owner
 * or an operator, the wallet must not be zero, `block.timestamp <= deadline`, `deadline <= now + 5 minutes`,
 * and the EIP-712 signature over AgentWalletSet(uint256 agentId,address newWallet,address owner,uint256 deadline)
 * must recover to newWallet. Keys are viem local accounts created in the browser; nothing touches a network.
 */
import { hashTypedData, recoverTypedDataAddress, zeroAddress, type Address, type Hex } from 'viem';
import { EIP712_DOMAIN_NAME, EIP712_DOMAIN_VERSION, FIXTURE_IDENTITY_REGISTRY, MAX_DEADLINE_DELAY_SECONDS, SIM_CHAIN_ID } from './fixtures';

export const agentWalletTypes = {
  AgentWalletSet: [
    { name: 'agentId', type: 'uint256' },
    { name: 'newWallet', type: 'address' },
    { name: 'owner', type: 'address' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export const AGENT_WALLET_TYPE_STRING = 'AgentWalletSet(uint256 agentId,address newWallet,address owner,uint256 deadline)';

export interface WalletMessage {
  agentId: bigint;
  newWallet: Address;
  owner: Address;
  deadline: bigint;
}

export function agentWalletTypedData(message: WalletMessage, chainId = SIM_CHAIN_ID, verifyingContract: Address = FIXTURE_IDENTITY_REGISTRY) {
  return {
    domain: { name: EIP712_DOMAIN_NAME, version: EIP712_DOMAIN_VERSION, chainId, verifyingContract },
    types: agentWalletTypes,
    primaryType: 'AgentWalletSet' as const,
    message,
  };
}

export function agentWalletDigest(message: WalletMessage): Hex {
  return hashTypedData(agentWalletTypedData(message));
}

export type WalletRevert = 'Not authorized' | 'bad wallet' | 'expired' | 'deadline too far' | 'invalid wallet sig';

export interface SetWalletCall {
  /** msg.sender of setAgentWallet. */
  sender: Address;
  /** Current token owner (ownerOf(agentId)). */
  owner: Address;
  operators: readonly Address[];
  agentId: bigint;
  newWallet: Address;
  deadline: bigint;
  signature: Hex;
  /** Simulated block.timestamp in seconds. */
  now: bigint;
}

export interface SetWalletResult {
  ok: boolean;
  revert?: WalletRevert;
  recovered?: Address;
  digest?: Hex;
}

/**
 * Runs the contract checks in the contract's order. The digest always uses the current owner, so a signature made
 * before a transfer stops verifying after it. Teaching simplification: there is no smart contract wallet, so the
 * ERC-1271 fallback always fails and an ECDSA mismatch ends in "invalid wallet sig".
 */
export async function checkSetAgentWallet(call: SetWalletCall): Promise<SetWalletResult> {
  if (call.sender !== call.owner && !call.operators.includes(call.sender)) return { ok: false, revert: 'Not authorized' };
  if (call.newWallet === zeroAddress) return { ok: false, revert: 'bad wallet' };
  if (call.now > call.deadline) return { ok: false, revert: 'expired' };
  if (call.deadline > call.now + BigInt(MAX_DEADLINE_DELAY_SECONDS)) return { ok: false, revert: 'deadline too far' };
  const message: WalletMessage = { agentId: call.agentId, newWallet: call.newWallet, owner: call.owner, deadline: call.deadline };
  const digest = agentWalletDigest(message);
  let recovered: Address | undefined;
  try {
    recovered = await recoverTypedDataAddress({ ...agentWalletTypedData(message), signature: call.signature });
  } catch {
    return { ok: false, revert: 'invalid wallet sig', digest };
  }
  if (recovered.toLowerCase() !== call.newWallet.toLowerCase()) return { ok: false, revert: 'invalid wallet sig', recovered, digest };
  return { ok: true, recovered, digest };
}
