/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/cryptocurrency.cv
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * eth_feeHistory Gas Adapter: keyless, standards-based gas estimation
 *
 * Every EIP-1559 chain answers the `eth_feeHistory` JSON-RPC method, so gas
 * tiers can be derived from what recent blocks actually paid instead of from a
 * proprietary estimator. This replaced Blocknative, whose gas API shut down on
 * 2026-06-19 (reported in issue #44).
 *
 * Method: request the last FEE_HISTORY_BLOCKS blocks with the reward
 * percentiles below, take the median priority fee each percentile paid across
 * those blocks, and add it to the base fee the node reports for the next
 * block. `instant` also budgets for the largest possible base-fee rise in one
 * block (12.5%, per EIP-1559) so it still lands if the next block is full.
 *
 * Each network lists several public RPCs and fails over between them. Set
 * `<NETWORK>_RPC_URL` (e.g. ETHEREUM_RPC_URL) to put your own node first.
 *
 * @module providers/adapters/gas/fee-history
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { GasPrice } from './etherscan.adapter';
import { resilientFetchResponse } from '@/lib/resilient-fetch';

// =============================================================================
// NETWORKS
// =============================================================================

export type FeeHistoryNetwork = 'ethereum' | 'base' | 'arbitrum' | 'optimism' | 'polygon';

interface NetworkConfig {
  chainId: number;
  symbol: string;
  /** Optional env var holding a preferred RPC URL, tried before the public ones. */
  rpcEnv: string;
  /** Keyless public RPCs verified to serve eth_feeHistory over 20 blocks. */
  publicRpcs: string[];
}

export const FEE_HISTORY_NETWORKS: Record<FeeHistoryNetwork, NetworkConfig> = {
  ethereum: {
    chainId: 1,
    symbol: 'ETH',
    rpcEnv: 'ETHEREUM_RPC_URL',
    publicRpcs: ['https://ethereum-rpc.publicnode.com', 'https://eth.drpc.org'],
  },
  base: {
    chainId: 8453,
    symbol: 'ETH',
    rpcEnv: 'BASE_RPC_URL',
    publicRpcs: [
      'https://mainnet.base.org',
      'https://base-rpc.publicnode.com',
      'https://base.drpc.org',
    ],
  },
  arbitrum: {
    chainId: 42161,
    symbol: 'ETH',
    rpcEnv: 'ARBITRUM_RPC_URL',
    publicRpcs: [
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum-one-rpc.publicnode.com',
      'https://arbitrum.drpc.org',
    ],
  },
  optimism: {
    chainId: 10,
    symbol: 'ETH',
    rpcEnv: 'OPTIMISM_RPC_URL',
    publicRpcs: [
      'https://mainnet.optimism.io',
      'https://optimism-rpc.publicnode.com',
      'https://optimism.drpc.org',
    ],
  },
  polygon: {
    chainId: 137,
    symbol: 'POL',
    rpcEnv: 'POLYGON_RPC_URL',
    publicRpcs: ['https://polygon-bor-rpc.publicnode.com', 'https://polygon.drpc.org'],
  },
};

export function isFeeHistoryNetwork(value: string): value is FeeHistoryNetwork {
  return Object.prototype.hasOwnProperty.call(FEE_HISTORY_NETWORKS, value);
}

// =============================================================================
// ESTIMATION
// =============================================================================

const FEE_HISTORY_BLOCKS = 20;
/** Reward percentiles requested, in order: slow, standard, fast, instant. */
const REWARD_PERCENTILES = [10, 50, 90, 99] as const;
const RPC_TIMEOUT_MS = 5000;
const WEI_PER_GWEI = 1_000_000_000;

/** Raw `eth_feeHistory` result (hex quantities). */
export interface FeeHistoryResult {
  oldestBlock: string;
  baseFeePerGas: string[];
  gasUsedRatio: number[];
  reward?: string[][];
}

export interface FeeHistoryEstimate extends GasPrice {
  symbol: string;
  /** Newest block the estimate was computed from. */
  blockNumber: number;
  /** Host of the RPC that answered, for lineage. */
  rpc: string;
}

function median(values: bigint[]): bigint {
  if (values.length === 0) return BigInt(0);
  const sorted = [...values].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  return sorted[Math.floor(sorted.length / 2)];
}

function weiToGwei(wei: bigint): number {
  return Number(wei) / WEI_PER_GWEI;
}

/**
 * Turn an `eth_feeHistory` result into gas tiers (gwei). Pure, so it is unit
 * tested against real responses without the network.
 */
export function estimateFromFeeHistory(
  network: FeeHistoryNetwork,
  history: FeeHistoryResult,
): Omit<FeeHistoryEstimate, 'rpc' | 'lastUpdated'> {
  const baseFees = history.baseFeePerGas ?? [];
  if (baseFees.length === 0) throw new Error('eth_feeHistory returned no base fees');

  // The array holds one entry per requested block plus the next block's base
  // fee, which is the one a transaction sent now will pay.
  const nextBaseFee = BigInt(baseFees[baseFees.length - 1]);

  // Empty blocks report a zero reward at every percentile; counting them would
  // drag every tier down to the bare base fee. Fall back to all blocks when the
  // whole window was empty.
  const rewards = history.reward ?? [];
  const busy = rewards.filter((_, i) => (history.gasUsedRatio?.[i] ?? 0) > 0);
  const sample = busy.length > 0 ? busy : rewards;
  const tips = REWARD_PERCENTILES.map((_, p) =>
    median(sample.map((row) => BigInt(row[p] ?? '0x0'))),
  );

  const [slowTip, standardTip, fastTip, instantTip] = tips;
  const slow = nextBaseFee + slowTip;
  // Percentile medians can cross when a window is sparse; tiers must not.
  const standard = maxBig(slow, nextBaseFee + standardTip);
  const fast = maxBig(standard, nextBaseFee + fastTip);
  const instant = maxBig(fast, (nextBaseFee * BigInt(1125)) / BigInt(1000) + instantTip);

  const config = FEE_HISTORY_NETWORKS[network];
  const newestBlock = parseInt(history.oldestBlock, 16) + Math.max(baseFees.length - 2, 0);

  return {
    chain: network,
    chainId: config.chainId,
    symbol: config.symbol,
    slow: weiToGwei(slow),
    standard: weiToGwei(standard),
    fast: weiToGwei(fast),
    instant: weiToGwei(instant),
    baseFee: weiToGwei(nextBaseFee),
    unit: 'gwei',
    blockNumber: newestBlock,
  };
}

function maxBig(a: bigint, b: bigint): bigint {
  return a > b ? a : b;
}

function rpcUrls(network: FeeHistoryNetwork): string[] {
  const config = FEE_HISTORY_NETWORKS[network];
  const preferred = process.env[config.rpcEnv]?.trim();
  return preferred
    ? [preferred, ...config.publicRpcs.filter((u) => u !== preferred)]
    : config.publicRpcs;
}

async function requestFeeHistory(url: string): Promise<FeeHistoryResult> {
  const response = await resilientFetchResponse(url, {
    service: `rpc:${new URL(url).host}`,
    timeoutMs: RPC_TIMEOUT_MS,
    retries: 0, // fail over to the next RPC instead of retrying this one
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'eth_feeHistory',
      params: [`0x${FEE_HISTORY_BLOCKS.toString(16)}`, 'latest', [...REWARD_PERCENTILES]],
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const body = (await response.json()) as {
    result?: FeeHistoryResult;
    error?: { message?: string };
  };
  if (body.error) throw new Error(body.error.message ?? 'JSON-RPC error');
  if (!body.result) throw new Error('empty JSON-RPC result');
  return body.result;
}

/**
 * Fetch live gas tiers for a network, failing over across its RPCs. Throws
 * with every RPC's failure reason when none answered.
 */
export async function fetchFeeHistoryGas(network: FeeHistoryNetwork): Promise<FeeHistoryEstimate> {
  const failures: string[] = [];
  for (const url of rpcUrls(network)) {
    try {
      const history = await requestFeeHistory(url);
      return {
        ...estimateFromFeeHistory(network, history),
        rpc: new URL(url).host,
        lastUpdated: new Date().toISOString(),
      };
    } catch (err) {
      failures.push(`${new URL(url).host}: ${(err as Error).message}`);
    }
  }
  throw new Error(`eth_feeHistory failed on every ${network} RPC (${failures.join('; ')})`);
}

// =============================================================================
// ADAPTER (Ethereum mainnet, for the gas-fees provider chain)
// =============================================================================

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

export const feeHistoryGasAdapter: DataProvider<GasPrice> = {
  name: 'eth-feehistory-gas',
  description:
    'eth_feeHistory: keyless EIP-1559 gas estimation from recent blocks over public RPCs',
  priority: 2,
  weight: 0.5,
  rateLimit: RATE_LIMIT,
  capabilities: ['gas-fees'],

  async fetch(_params: FetchParams): Promise<GasPrice> {
    const estimate = await fetchFeeHistoryGas('ethereum');
    return {
      chain: estimate.chain,
      chainId: estimate.chainId,
      slow: estimate.slow,
      standard: estimate.standard,
      fast: estimate.fast,
      instant: estimate.instant,
      baseFee: estimate.baseFee,
      unit: estimate.unit,
      lastUpdated: estimate.lastUpdated,
    };
  },

  async healthCheck(): Promise<boolean> {
    try {
      await fetchFeeHistoryGas('ethereum');
      return true;
    } catch {
      return false;
    }
  },

  validate(data: GasPrice): boolean {
    return (
      typeof data.slow === 'number' &&
      data.slow > 0 &&
      typeof data.fast === 'number' &&
      data.fast >= data.slow
    );
  },
};
