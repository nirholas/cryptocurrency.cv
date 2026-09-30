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
 * Premium API v1 - Gas Prices Endpoint
 *
 * Returns live gas prices for Ethereum, Base, Arbitrum, Optimism and Polygon.
 * Ethereum goes through the provider framework (Etherscan, eth_feeHistory,
 * Owlracle, with circuit breakers and caching); every other network is read
 * straight from recent blocks with eth_feeHistory, and Polygon prefers the
 * official Polygon gas station. Nothing here is estimated or hardcoded: a
 * network whose sources are all down is left out and named in
 * `meta.unavailable`.
 * Requires x402 payment or valid API key.
 *
 * @price $0.001 per request
 */

import { type NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { registry } from '@/lib/providers/registry';
import {
  fetchFeeHistoryGas,
  isFeeHistoryNetwork,
  FEE_HISTORY_NETWORKS,
  type FeeHistoryNetwork,
  type GasPrice,
} from '@/lib/providers/adapters/gas';

import { resilientFetchResponse } from '@/lib/resilient-fetch';
const ENDPOINT = '/api/v1/gas';

const NETWORKS = Object.keys(FEE_HISTORY_NETWORKS) as FeeHistoryNetwork[];

interface GasData {
  network: string;
  chainId: number;
  symbol: string;
  slow: number | null;
  standard: number | null;
  fast: number | null;
  instant?: number | null;
  baseFee?: number | null;
  unit: string;
  source: string;
  timestamp: string;
}

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const requested = request.nextUrl.searchParams.get('network')?.toLowerCase() ?? null;
  if (requested !== null && !isFeeHistoryNetwork(requested)) {
    return ApiError.badRequest(
      `Unknown network "${requested}". Supported networks: ${NETWORKS.join(', ')}.`,
    );
  }
  const networks = requested ? [requested] : NETWORKS;

  try {
    logger.info('Fetching gas prices', { network: requested });

    const settled = await Promise.allSettled(networks.map(fetchNetworkGas));
    const data: GasData[] = [];
    const unavailable: string[] = [];
    settled.forEach((result, i) => {
      if (result.status === 'fulfilled') {
        data.push(result.value);
      } else {
        unavailable.push(networks[i]);
        logger.warn('Gas source unavailable', {
          network: networks[i],
          error: (result.reason as Error)?.message,
        });
      }
    });

    if (data.length === 0) {
      return ApiError.serviceUnavailable(
        `Gas prices for ${networks.join(', ')} are unavailable right now: every upstream source failed. Retry in a few seconds.`,
      );
    }

    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        success: true,
        data,
        meta: {
          endpoint: ENDPOINT,
          networkCount: data.length,
          ...(unavailable.length > 0 && { unavailable }),
          timestamp: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=60',
        },
      },
    );
  } catch (error) {
    logger.error('Failed to fetch gas prices', error);
    return ApiError.internal('Failed to fetch gas prices', error);
  }
}

async function fetchNetworkGas(network: FeeHistoryNetwork): Promise<GasData> {
  if (network === 'ethereum') return fetchEthereumGas();
  if (network === 'polygon') {
    try {
      return await fetchPolygonGasStation();
    } catch {
      /* gas station down: read the chain directly */
    }
  }
  return fetchFromFeeHistory(network);
}

/** Ethereum: provider framework first, then eth_feeHistory directly. */
async function fetchEthereumGas(): Promise<GasData> {
  try {
    const result = await registry.fetch<GasPrice>('gas-fees');
    const gp = result.data;
    return {
      network: gp.chain || 'ethereum',
      chainId: gp.chainId || 1,
      symbol: 'ETH',
      slow: gp.slow,
      standard: gp.standard,
      fast: gp.fast,
      instant: gp.instant,
      baseFee: gp.baseFee,
      unit: gp.unit || 'gwei',
      source: result.lineage.provider,
      timestamp: gp.lastUpdated || new Date().toISOString(),
    };
  } catch {
    return fetchFromFeeHistory('ethereum');
  }
}

async function fetchFromFeeHistory(network: FeeHistoryNetwork): Promise<GasData> {
  const gas = await fetchFeeHistoryGas(network);
  return {
    network,
    chainId: gas.chainId,
    symbol: gas.symbol,
    slow: gas.slow,
    standard: gas.standard,
    fast: gas.fast,
    instant: gas.instant,
    baseFee: gas.baseFee,
    unit: 'gwei',
    source: 'eth-feehistory',
    timestamp: gas.lastUpdated,
  };
}

async function fetchPolygonGasStation(): Promise<GasData> {
  const response = await resilientFetchResponse('https://gasstation.polygon.technology/v2', {
    service: 'polygon-gasstation',
    timeoutMs: 8000,
    retries: 1,
    headers: { Accept: 'application/json' },
    next: { revalidate: 15 },
  });
  if (!response.ok) throw new Error(`Polygon gas station HTTP ${response.status}`);

  const data = await response.json();
  const slow = Number(data.safeLow?.maxFee);
  const standard = Number(data.standard?.maxFee);
  const fast = Number(data.fast?.maxFee);
  if (!(slow > 0 && standard > 0 && fast > 0)) {
    throw new Error('Polygon gas station returned no usable fees');
  }
  return {
    network: 'polygon',
    chainId: 137,
    symbol: 'POL',
    slow,
    standard,
    fast,
    baseFee: Number(data.estimatedBaseFee) || null,
    unit: 'gwei',
    source: 'polygon-gasstation',
    timestamp: new Date().toISOString(),
  };
}
