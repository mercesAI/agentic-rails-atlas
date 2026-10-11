/**
 * Scheme and payment-flow resolution (spec v2 section 6.1, "Asset Transfer Methods and Payment Flow Models").
 *
 * Orderings: authorization = verify, resource, settle; upfront = settle, resource; escrow = settle,
 * resource, settle. Supported combinations on EVM come from the SDK server schemes:
 * - exact (eip3009, permit2): authorization (default) and upfront (mechanisms/evm/src/exact/server/scheme.ts)
 * - upto (permit2): authorization only (mechanisms/evm/src/upto/server/scheme.ts)
 * - upto on Solana uses escrow only (mechanisms/svm/src/upto/server/scheme.ts; specs/schemes/upto/scheme_upto_svm.md)
 * V1 defines only the exact scheme and has no paymentFlow key (spec v1 section 6).
 */
import type { PaymentFlow, Scheme, Version } from './fixtures';

export type Phase = 'verify' | 'settle-before' | 'resource' | 'settle-after';

export const FLOW_PHASES: Record<PaymentFlow, Phase[]> = {
  authorization: ['verify', 'resource', 'settle-after'],
  upfront: ['settle-before', 'resource'],
  escrow: ['settle-before', 'resource', 'settle-after'],
};

export const FLOW_ORDER_TEXT: Record<PaymentFlow, string> = {
  authorization: 'verify, then resource, then settle, then respond',
  upfront: 'settle, then resource, then respond',
  escrow: 'settle, then resource, then settle, then respond',
};

/** Error text that resolvePaymentFlow (typescript/packages/core/src/server/paymentFlow.ts) throws. */
export function sdkUnsupportedFlowError(scheme: Scheme, atm: string, flow: PaymentFlow, supported: PaymentFlow[], def: PaymentFlow): string {
  return (
    `[x402] Scheme "${scheme}" assetTransferMethod "${atm}" does not support paymentFlow "${flow}". ` +
    `Supported: ${supported.join(', ')} (default: ${def}).`
  );
}

export type FlowResolution =
  | {
      supported: true;
      phases: Phase[];
      /** True when the simulation shows the call order only (no signed payload). */
      orderingOnly: boolean;
      assetTransferMethod: string;
      notes: string[];
      simplifications: string[];
    }
  | { supported: false; reason: string; sdkError?: string };

export function resolveFlow(version: Version, scheme: Scheme, flow: PaymentFlow): FlowResolution {
  if (version === 1) {
    if (scheme !== 'exact' || flow !== 'authorization') {
      return {
        supported: false,
        reason:
          'V1 defines only the exact scheme, and its PaymentRequirements have no paymentFlow key. Every V1 payment is verified, then the handler runs, then it settles.',
      };
    }
    return {
      supported: true,
      phases: FLOW_PHASES.authorization,
      orderingOnly: false,
      assetTransferMethod: 'eip3009',
      notes: ['V1 has no paymentFlow key; the order is always verify, resource, settle.'],
      simplifications: [],
    };
  }

  if (scheme === 'exact') {
    if (flow === 'escrow') {
      return {
        supported: false,
        reason:
          'exact moves one fixed amount in one transfer, so it has nothing to hold and capture later. On EVM it supports authorization and upfront. Servers must reject combinations the scheme does not support (spec v2 section 6.1).',
        sdkError: sdkUnsupportedFlowError('exact', 'eip3009', 'escrow', ['authorization', 'upfront'], 'authorization'),
      };
    }
    return {
      supported: true,
      phases: FLOW_PHASES[flow],
      orderingOnly: false,
      assetTransferMethod: 'eip3009',
      notes:
        flow === 'upfront'
          ? [
              'The 402 must carry extra.paymentFlow "upfront" because the flow is not authorization.',
              'No /verify call: settle establishes validity. If the handler then fails, the client has paid and the spec defines no refund.',
              'Clients should prefer authorization when a resource offers both.',
            ]
          : ['Default flow. Funds move only after the handler succeeds.'],
      simplifications: [],
    };
  }

  // upto
  if (flow === 'upfront') {
    return {
      supported: false,
      reason:
        'The upto spec rules out upfront: the final charge is known only after the handler runs, so settlement cannot come first.',
      sdkError: sdkUnsupportedFlowError('upto', 'permit2', 'upfront', ['authorization'], 'authorization'),
    };
  }
  if (flow === 'escrow') {
    return {
      supported: true,
      phases: FLOW_PHASES.escrow,
      orderingOnly: true,
      assetTransferMethod: 'channel',
      notes: [
        'The first settle commits a deposit (payload.type "deposit"); after the handler, a second settle claims the metered amount (payload.type "claim").',
        'There is no /verify call: the first settle is the pre-resource check.',
        `On EVM the SDK rejects this combination: ${sdkUnsupportedFlowError('upto', 'permit2', 'escrow', ['authorization'], 'authorization')}`,
      ],
      simplifications: [
        'The spec defines escrow for upto on Solana, where the client opens a payment channel. The simulation shows the order of calls only and does not build Solana transactions.',
      ],
    };
  }
  return {
    supported: true,
    phases: FLOW_PHASES.authorization,
    orderingOnly: false,
    assetTransferMethod: 'permit2',
    notes: [
      'The client signs a Permit2 maximum. /verify checks that permitted.amount equals amount; /settle carries the actual charge in paymentRequirements.amount.',
    ],
    simplifications: ['The payer is assumed to have approved Permit2 already (otherwise verify returns PERMIT2_ALLOWANCE_REQUIRED or a sponsoring extension applies).'],
  };
}
