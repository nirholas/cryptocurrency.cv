/**
 * Governance — Provider chain index
 *
 * @module providers/adapters/governance
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { GovernanceProposal } from './types';
import { tallyAdapter } from './tally.adapter';
import { snapshotAdapter } from './snapshot.adapter';

export type { GovernanceProposal, GovernanceStats } from './types';

export interface GovernanceChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
}

export function createGovernanceChain(
  options: GovernanceChainOptions = {},
): ProviderChain<GovernanceProposal[]> {
  const {
    strategy = 'broadcast',
    cacheTtlSeconds = 300,
    staleWhileError = true,
  } = options;

  const config: Partial<ProviderChainConfig> = { strategy, cacheTtlSeconds, staleWhileError };
  const chain = new ProviderChain<GovernanceProposal[]>('governance', config);
  chain.addProvider(tallyAdapter);
  chain.addProvider(snapshotAdapter);
  return chain;
}

export const governanceChain = createGovernanceChain();
