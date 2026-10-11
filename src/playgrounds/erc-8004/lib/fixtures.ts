/**
 * Fixture data for the ERC-8004 playground. Nothing here is called on a chain.
 * Spec: research/vendor/ERCs/ERCS/erc-8004.md (Draft, text last changed 2026-01-25).
 * Contracts: research/vendor/erc-8004-contracts/contracts (implementation version 2.0.0).
 */
import { getAddress, type Address } from 'viem';

export const SPEC_LABEL = 'ERC-8004 (Draft)';
export const ILLUSTRATIVE = `Illustrative example, ${SPEC_LABEL}`;
export const SIMPLIFICATION = 'Teaching simplification';

/** Fake chain. 424242 is not a chain id where the registries are listed. */
export const SIM_CHAIN_ID = 424242;
export const SIM_NAMESPACE = 'eip155';

/** Fixture Identity Registry address on the fake chain. */
export const FIXTURE_IDENTITY_REGISTRY: Address = getAddress('0x1d00000000000000000000000000000000008004');

/** The registration file `type` value fixed by the Draft text. */
export const REGISTRATION_TYPE = 'https://eips.ethereum.org/EIPS/eip-8004#registration-v1';

/** Example trust model strings from the Draft text; the list is open. */
export const TRUST_EXAMPLES = ['reputation', 'crypto-economic', 'tee-attestation'] as const;

/** Service names used in the Draft text example; any name is allowed. */
export const SERVICE_EXAMPLES = ['web', 'A2A', 'MCP', 'OASF', 'ENS', 'DID', 'email'] as const;

/**
 * Real deployment addresses, shown as labeled text only (claims clm-erc-8004-094 and clm-erc-8004-096,
 * contracts README as of 2026-08-15). The playground never calls them.
 */
export const LISTED_ADDRESSES = {
  asOf: '2026-08-15',
  mainnetIdentity: '0x8004A169FB4a3325136EB29fA0ceB6D2e539a432',
  mainnetReputation: '0x8004BAa17C55a88189AE136b182e5fdA19dE9b63',
  testnetIdentity: '0x8004A818BFB912233c491871b3d84c89A494BD9e',
  testnetReputation: '0x8004B663056A597Dffe9eCcC1965A193B7388713',
} as const;

/** EIP-712 domain of the Identity Registry (`__EIP712_init("ERC8004IdentityRegistry", "1")`). */
export const EIP712_DOMAIN_NAME = 'ERC8004IdentityRegistry';
export const EIP712_DOMAIN_VERSION = '1';
/** `MAX_DEADLINE_DELAY = 5 minutes` in IdentityRegistryUpgradeable.sol. */
export const MAX_DEADLINE_DELAY_SECONDS = 300;

/** A sample registration file in the shape of the Draft text example, with fixture values. */
export function sampleRegistration(agentId = 7): Record<string, unknown> {
  return {
    type: REGISTRATION_TYPE,
    name: 'Sim Weather Agent',
    description: 'Answers weather questions for a fixed price per call. Fixture agent for this simulation.',
    image: 'https://agent.example/sim-weather.png',
    services: [
      { name: 'web', endpoint: 'https://agent.example/' },
      { name: 'A2A', endpoint: 'https://agent.example/.well-known/agent-card.json', version: '0.3.0' },
      { name: 'MCP', endpoint: 'https://mcp.agent.example/', version: '2025-06-18' },
    ],
    x402Support: true,
    active: true,
    registrations: [{ agentId, agentRegistry: `${SIM_NAMESPACE}:${SIM_CHAIN_ID}:${FIXTURE_IDENTITY_REGISTRY}` }],
    supportedTrust: ['reputation'],
  };
}
