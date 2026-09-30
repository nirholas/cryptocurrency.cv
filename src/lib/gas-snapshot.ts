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
 * Ethereum gas snapshot shared by `/api/gas` and the `/gas` page.
 *
 * The page used to fetch `/api/gas` over the public internet, which put every
 * server render behind the anonymous rate limit of the server's own egress IP
 * (and, past that, the repeat-429 block). Both now call this directly.
 *
 * Sources, in order: pipeline cache → provider framework (Etherscan →
 * eth_feeHistory → Owlracle) → eth_feeHistory straight from public RPCs.
 * Every source answers in one shape: `low` / `medium` / `high` ({ gwei, usd })
 * plus the provider fields (`slow`, `standard`, `fast`, `instant`, `baseFee`).
 *
 * @module lib/gas-snapshot
 */

import { getPipelineGas } from '@/lib/data-pipeline';
import { registry } from '@/lib/providers/registry';
import { fetchFeeHistoryGas, type GasPrice } from '@/lib/providers/adapters/gas';
import { resilientFetchResponse } from '@/lib/resilient-fetch';

/** Gas for a standard ETH transfer, used for the USD figures. */
const TRANSFER_GAS_UNITS = 21_000;

export interface GasLevel {
  gwei: number;
  usd: number | null;
}

/** The fields every source provides; the gas page reads only these. */
export interface GasSnapshotCore {
  network: string;
  baseFee: number | null;
  low: GasLevel;
  medium: GasLevel;
  high: GasLevel;
  lastBlock: string | null;
  timestamp: string;
  source: string;
}

export type EthereumGasSnapshot = GasSnapshotCore &
  Partial<GasPrice> & {
    _cache: 'pipeline' | 'provider' | 'direct';
    _provider?: string;
    _confidence?: number;
  };

/**
 * Current Ethereum gas, or null when every source is down. Never invents
 * numbers: a null is the caller's cue to show an outage, not a guess.
 */
export async function getEthereumGasSnapshot(): Promise<EthereumGasSnapshot | null> {
  try {
    const pipelineData = await getPipelineGas();
    if (pipelineData) {
      // The pipeline stores the GasSnapshotCore shape (see fetchGas in data-pipeline).
      return { ...(pipelineData as unknown as GasSnapshotCore), _cache: 'pipeline' };
    }
  } catch {
    /* pipeline miss: try the provider chain */
  }

  try {
    const result = await registry.fetch<GasPrice>('gas-fees');
    return {
      ...(await toSnapshot(result.data, result.lineage.provider, null)),
      _cache: 'provider',
      _provider: result.lineage.provider,
      _confidence: result.lineage.confidence,
    };
  } catch {
    /* provider chain miss: read the chain directly */
  }

  try {
    const gas = await fetchFeeHistoryGas('ethereum');
    return { ...(await toSnapshot(gas, 'eth-feehistory', gas.blockNumber)), _cache: 'direct' };
  } catch (error) {
    console.error('[gas] every source failed:', (error as Error).message);
    return null;
  }
}

async function toSnapshot(gas: GasPrice, source: string, lastBlock: number | null) {
  const ethPriceUsd = await fetchEthPriceUsd();
  const level = (gwei: number): GasLevel => ({
    gwei,
    usd:
      ethPriceUsd !== null
        ? parseFloat((gwei * TRANSFER_GAS_UNITS * 1e-9 * ethPriceUsd).toFixed(4))
        : null,
  });
  return {
    ...gas,
    network: gas.chain,
    low: level(gas.slow),
    medium: level(gas.standard),
    high: level(gas.fast),
    lastBlock: lastBlock !== null ? String(lastBlock) : null,
    timestamp: gas.lastUpdated,
    source,
  };
}

async function fetchEthPriceUsd(): Promise<number | null> {
  try {
    const res = await resilientFetchResponse(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd',
      { service: 'coingecko', timeoutMs: 8000, retries: 1, next: { revalidate: 60 } },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.ethereum?.usd === 'number' ? data.ethereum.usd : null;
  } catch {
    return null; // USD figures are optional; gwei is still served
  }
}
