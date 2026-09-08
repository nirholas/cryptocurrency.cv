/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Rated Network API
 *
 * Ethereum validator performance, effectiveness scores,
 * and staking operator analytics. Free, no API key required.
 *
 * @see https://api-docs.rated.network
 * @module lib/apis/rated
 */

import { resilientFetch } from '@/lib/resilient-fetch';
import { staleCache } from '@/lib/cache';

const BASE_URL = 'https://api.rated.network/v0';

// =============================================================================
// Types
// =============================================================================

export interface ValidatorEffectiveness {
  validatorIndex: number;
  validatorPubkey?: string;
  attestationEffectiveness: number;
  proposerEffectiveness: number;
  syncCommitteeEffectiveness: number;
  overallEffectiveness: number;
  slashingCount: number;
  isActive: boolean;
  activeSince?: string;
  balance: number;
}

export interface NetworkOverview {
  currentEpoch: number;
  finalizedEpoch: number;
  activeValidators: number;
  pendingValidators: number;
  exitingValidators: number;
  totalStaked: number;
  averageEffectiveness: number;
  participationRate: number;
  networkAPR: number;
  medianProposerEffectiveness: number;
  medianAttestationEffectiveness: number;
  timestamp: string;
}

export interface Operator {
  id: string;
  name: string;
  displayName?: string;
  validatorCount: number;
  avgEffectiveness: number;
  avgAttestationEffectiveness: number;
  avgProposerEffectiveness: number;
  stakeShare: number;
  networkPenetration: number;
  category?: string;
  idType?: string;
}

export interface OperatorSummary {
  totalOperators: number;
  operators: Operator[];
  topByValidators: Operator[];
  topByEffectiveness: Operator[];
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from Rated Network API with caching.
 */
async function ratedFetch<T>(path: string): Promise<T | null> {
  try {
    const { data, stale } = await resilientFetch<T>(`${BASE_URL}${path}`, {
      service: 'rated',
      timeoutMs: 10_000,
      retries: 1,
      staleCache,
      staleCacheKey: `rated:${path}`,
      headers: {
        Accept: 'application/json',
      },
      next: { revalidate: 600 }, // 10 min cache
    });
    if (stale) console.warn(`Rated API: upstream failed, serving last known good payload for ${path}`);
    return data;
  } catch (error) {
    console.error('Rated API request failed:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Validator Data
// ---------------------------------------------------------------------------

/**
 * Get validator effectiveness rankings.
 *
 * Returns the top validators by overall effectiveness score.
 *
 * @param limit - Number of validators to return (default 100)
 */
export async function getValidatorEffectiveness(
  limit: number = 100,
): Promise<ValidatorEffectiveness[]> {
  const data = await ratedFetch<{
    page: { data: Array<Record<string, unknown>> };
    data?: Array<Record<string, unknown>>;
  }>(`/eth/validators/effectiveness?size=${limit}`);

  const rows = data?.page?.data || data?.data || [];
  if (!rows.length) return [];

  return rows.map((v) => ({
    validatorIndex: (v.validatorIndex ?? v.validator_index ?? 0) as number,
    validatorPubkey: (v.validatorPubkey ?? v.validator_pubkey) as string | undefined,
    attestationEffectiveness: (v.attestationEffectiveness ?? v.attestation_effectiveness ?? 0) as number,
    proposerEffectiveness: (v.proposerEffectiveness ?? v.proposer_effectiveness ?? 0) as number,
    syncCommitteeEffectiveness: (v.syncCommitteeEffectiveness ?? v.sync_committee_effectiveness ?? 0) as number,
    overallEffectiveness: (v.overallEffectiveness ?? v.overall_effectiveness ?? 0) as number,
    slashingCount: (v.slashingCount ?? v.slashing_count ?? 0) as number,
    isActive: (v.isActive ?? v.is_active ?? true) as boolean,
    activeSince: (v.activeSince ?? v.active_since) as string | undefined,
    balance: (v.balance ?? 0) as number,
  }));
}

// ---------------------------------------------------------------------------
// Network Overview
// ---------------------------------------------------------------------------

/**
 * Get Ethereum network staking overview.
 *
 * Includes total staked, participation rate, and average effectiveness.
 */
export async function getNetworkOverview(): Promise<NetworkOverview | null> {
  const data = await ratedFetch<Record<string, unknown>>(
    '/eth/network/overview',
  );

  if (!data) return null;

  return {
    currentEpoch: (data.currentEpoch ?? data.current_epoch ?? 0) as number,
    finalizedEpoch: (data.finalizedEpoch ?? data.finalized_epoch ?? 0) as number,
    activeValidators: (data.activeValidators ?? data.active_validators ?? 0) as number,
    pendingValidators: (data.pendingValidators ?? data.pending_validators ?? 0) as number,
    exitingValidators: (data.exitingValidators ?? data.exiting_validators ?? 0) as number,
    totalStaked: (data.totalStaked ?? data.total_staked ?? 0) as number,
    averageEffectiveness: (data.averageEffectiveness ?? data.average_effectiveness ?? 0) as number,
    participationRate: (data.participationRate ?? data.participation_rate ?? 0) as number,
    networkAPR: (data.networkAPR ?? data.network_apr ?? 0) as number,
    medianProposerEffectiveness: (data.medianProposerEffectiveness ?? data.median_proposer_effectiveness ?? 0) as number,
    medianAttestationEffectiveness: (data.medianAttestationEffectiveness ?? data.median_attestation_effectiveness ?? 0) as number,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Operators
// ---------------------------------------------------------------------------

/**
 * Get staking operators (pools, CEXs, solo stakers, etc.).
 *
 * Returns operators ranked by validator count with effectiveness data.
 *
 * @param limit - Number of operators to return (default 50)
 */
export async function getOperators(
  limit: number = 50,
): Promise<OperatorSummary> {
  const data = await ratedFetch<{
    page?: { data: Array<Record<string, unknown>> };
    data?: Array<Record<string, unknown>>;
  }>(`/eth/operators?size=${limit}`);

  const rows = data?.page?.data || data?.data || [];

  const operators: Operator[] = rows.map((o) => ({
    id: (o.id ?? o.operator_id ?? '') as string,
    name: (o.name ?? o.operator_name ?? 'Unknown') as string,
    displayName: (o.displayName ?? o.display_name) as string | undefined,
    validatorCount: (o.validatorCount ?? o.validator_count ?? 0) as number,
    avgEffectiveness: (o.avgEffectiveness ?? o.avg_effectiveness ?? 0) as number,
    avgAttestationEffectiveness: (o.avgAttestationEffectiveness ?? o.avg_attestation_effectiveness ?? 0) as number,
    avgProposerEffectiveness: (o.avgProposerEffectiveness ?? o.avg_proposer_effectiveness ?? 0) as number,
    stakeShare: (o.stakeShare ?? o.stake_share ?? 0) as number,
    networkPenetration: (o.networkPenetration ?? o.network_penetration ?? 0) as number,
    category: (o.category ?? o.operator_category) as string | undefined,
    idType: (o.idType ?? o.id_type) as string | undefined,
  }));

  const byValidators = [...operators].sort(
    (a, b) => b.validatorCount - a.validatorCount,
  );
  const byEffectiveness = [...operators].sort(
    (a, b) => b.avgEffectiveness - a.avgEffectiveness,
  );

  return {
    totalOperators: operators.length,
    operators,
    topByValidators: byValidators.slice(0, 20),
    topByEffectiveness: byEffectiveness.slice(0, 20),
    timestamp: new Date().toISOString(),
  };
}
