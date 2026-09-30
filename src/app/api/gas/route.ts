/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { NextResponse } from 'next/server';
import { getPipelineGas } from '@/lib/data-pipeline';
import { registry } from '@/lib/providers/registry';
import { fetchFeeHistoryGas, type GasPrice } from '@/lib/providers/adapters/gas';

import { resilientFetchResponse } from '@/lib/resilient-fetch';
export const revalidate = 30;

const CACHE_HEADERS = { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' };

/** Gas for a standard ETH transfer, used for the USD figures. */
const TRANSFER_GAS_UNITS = 21_000;

/**
 * GET /api/gas
 *
 * Get current Ethereum gas prices.
 * Uses pipeline cache → provider framework (Etherscan → eth_feeHistory →
 * Owlracle) → eth_feeHistory directly. Every layer answers in the same shape:
 * `low` / `medium` / `high` ({ gwei, usd }) for the gas page and older
 * clients, plus the provider fields (`slow`, `standard`, `fast`, `instant`,
 * `baseFee`). When every source is down it returns 503 rather than guessing.
 */
export async function GET() {
  try {
    // Layer 1: Pipeline cache-first
    try {
      const pipelineData = await getPipelineGas();
      if (pipelineData) {
        return NextResponse.json({ ...pipelineData, _cache: 'pipeline' }, { headers: CACHE_HEADERS });
      }
    } catch {
      /* pipeline miss: try provider chain */
    }

    // Layer 2: Provider framework (Etherscan → eth_feeHistory → Owlracle, with circuit breakers)
    try {
      const result = await registry.fetch<GasPrice>('gas-fees');
      return NextResponse.json(
        {
          ...(await toGasResponse(result.data, result.lineage.provider, null)),
          _cache: 'provider',
          _provider: result.lineage.provider,
          _confidence: result.lineage.confidence,
        },
        { headers: CACHE_HEADERS },
      );
    } catch {
      /* provider chain miss: read the chain directly */
    }

    // Layer 3: eth_feeHistory straight from public RPCs (no key, bypasses the chain's breakers)
    try {
      const gas = await fetchFeeHistoryGas('ethereum');
      return NextResponse.json(
        { ...(await toGasResponse(gas, 'eth-feehistory', gas.blockNumber)), _cache: 'direct' },
        { headers: CACHE_HEADERS },
      );
    } catch (error) {
      console.error('Gas API: every source failed:', (error as Error).message);
    }

    return NextResponse.json(
      {
        error: 'Gas prices are temporarily unavailable',
        message: 'Every gas source (Etherscan, eth_feeHistory, Owlracle) failed. Retry in a few seconds.',
      },
      { status: 503, headers: { 'Retry-After': '15' } },
    );
  } catch (error) {
    console.error('Gas API error:', error);
    return NextResponse.json({ error: 'Failed to fetch gas prices' }, { status: 500 });
  }
}

async function toGasResponse(gas: GasPrice, source: string, lastBlock: number | null) {
  const ethPriceUsd = await fetchEthPriceUsd();
  const level = (gwei: number) => ({
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
