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
 * 1inch Aggregation & Price API
 *
 * DEX aggregator for optimal swap quotes, cross-chain token prices,
 * and liquidity source discovery across EVM networks.
 *
 * @see https://portal.1inch.dev/documentation/
 * @module lib/apis/oneinch
 */

import { marketCache, CACHE_TTL, apiCacheKey } from '@/lib/distributed-cache';
import { resilientFetchResponse } from '@/lib/resilient-fetch';

const BASE_URL = 'https://api.1inch.dev';
const API_KEY = process.env.ONEINCH_API_KEY || '';

// =============================================================================
// Types
// =============================================================================

export type ChainId = 1 | 10 | 56 | 100 | 137 | 250 | 324 | 8453 | 42161 | 43114;

export const CHAIN_NAMES: Record<ChainId, string> = {
  1: 'Ethereum',
  10: 'Optimism',
  56: 'BNB Chain',
  100: 'Gnosis',
  137: 'Polygon',
  250: 'Fantom',
  324: 'zkSync Era',
  8453: 'Base',
  42161: 'Arbitrum',
  43114: 'Avalanche',
};

export interface SwapQuoteParams {
  chainId: ChainId;
  src: string;
  dst: string;
  amount: string;
  from?: string;
  slippage?: number;
  protocols?: string;
  includeGas?: boolean;
}

export interface SwapQuote {
  srcToken: TokenInfo;
  dstToken: TokenInfo;
  srcAmount: string;
  dstAmount: string;
  estimatedGas: number;
  protocols: Array<Array<Array<{
    name: string;
    part: number;
    fromTokenAddress: string;
    toTokenAddress: string;
  }>>>;
  priceImpact: number | null;
  exchangeRate: number;
  exchangeRateReverse: number;
  gasUsd: number | null;
  timestamp: string;
}

export interface TokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

export interface TokenPrice {
  address: string;
  priceUsd: number;
}

export interface TokenPriceMap {
  chainId: ChainId;
  chain: string;
  prices: Record<string, number>;
  tokenCount: number;
  timestamp: string;
}

export interface LiquiditySource {
  id: string;
  title: string;
  img: string;
  enabled: boolean;
  chainId: ChainId;
}

export interface LiquiditySourcesSummary {
  chainId: ChainId;
  chain: string;
  sources: LiquiditySource[];
  totalSources: number;
  enabledSources: number;
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from 1inch API with bearer auth.
 */
async function oneinchFetch<T>(
  path: string,
  params?: Record<string, string>,
): Promise<T | null> {
  if (!API_KEY) {
    console.warn('1inch: ONEINCH_API_KEY not set — skipping request');
    return null;
  }

  const url = new URL(`${BASE_URL}${path}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const res = await resilientFetchResponse(url.toString(), {
    service: 'oneinch', timeoutMs: 8000, retries: 1,
    headers: {
      accept: 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    next: { revalidate: 15 },
  });

  if (!res.ok) {
    throw new Error(`1inch API error ${res.status}: ${path}`);
  }

  return (await res.json()) as T;
}

// ---------------------------------------------------------------------------
// Swap Quote
// ---------------------------------------------------------------------------

/**
 * Get optimal swap quote with routing through multiple DEX protocols.
 */
export async function getSwapQuote(params: SwapQuoteParams): Promise<SwapQuote | null> {
  const queryParams: Record<string, string> = {
    src: params.src,
    dst: params.dst,
    amount: params.amount,
  };
  if (params.from) queryParams.from = params.from;
  if (params.slippage !== undefined) queryParams.slippage = String(params.slippage);
  if (params.protocols) queryParams.protocols = params.protocols;
  if (params.includeGas) queryParams.includeGas = 'true';

  const cacheKey = apiCacheKey('oneinch:swap-quote', {
    chainId: params.chainId,
    ...queryParams,
  });

  return marketCache.getOrSet(
    cacheKey,
    async () => {
      const data = await oneinchFetch<{
        srcToken?: {
          address?: string;
          symbol?: string;
          name?: string;
          decimals?: number;
          logoURI?: string;
        };
        dstToken?: {
          address?: string;
          symbol?: string;
          name?: string;
          decimals?: number;
          logoURI?: string;
        };
        srcAmount?: string;
        dstAmount?: string;
        estimatedGas?: number;
        protocols?: Array<Array<Array<{
          name: string;
          part: number;
          fromTokenAddress: string;
          toTokenAddress: string;
        }>>>;
        gas?: number;
      }>(`/swap/v6.0/${params.chainId}/quote`, queryParams);

      if (!data) return null;

      const srcDecimals = data.srcToken?.decimals || 18;
      const dstDecimals = data.dstToken?.decimals || 18;
      const srcAmt = Number(data.srcAmount || '0') / 10 ** srcDecimals;
      const dstAmt = Number(data.dstAmount || '0') / 10 ** dstDecimals;

      return {
        srcToken: {
          address: data.srcToken?.address || params.src,
          symbol: data.srcToken?.symbol || 'UNKNOWN',
          name: data.srcToken?.name || 'Unknown',
          decimals: srcDecimals,
          logoURI: data.srcToken?.logoURI,
        },
        dstToken: {
          address: data.dstToken?.address || params.dst,
          symbol: data.dstToken?.symbol || 'UNKNOWN',
          name: data.dstToken?.name || 'Unknown',
          decimals: dstDecimals,
          logoURI: data.dstToken?.logoURI,
        },
        srcAmount: data.srcAmount || params.amount,
        dstAmount: data.dstAmount || '0',
        estimatedGas: data.estimatedGas || data.gas || 0,
        protocols: data.protocols || [],
        priceImpact: srcAmt > 0 && dstAmt > 0 ? null : null, // API doesn't always provide
        exchangeRate: srcAmt > 0 ? dstAmt / srcAmt : 0,
        exchangeRateReverse: dstAmt > 0 ? srcAmt / dstAmt : 0,
        gasUsd: null,
        timestamp: new Date().toISOString(),
      } satisfies SwapQuote;
    },
    { ttl: 15, staleTtl: 5 }, // Very short TTL for quotes
  );
}

// ---------------------------------------------------------------------------
// Token Prices
// ---------------------------------------------------------------------------

/**
 * Get spot prices for all tokens on a given chain.
 */
export async function getTokenPrices(chainId: ChainId = 1): Promise<TokenPriceMap> {
  const cacheKey = apiCacheKey('oneinch:token-prices', { chainId });

  return marketCache.getOrSet(
    cacheKey,
    async () => {
      const data = await oneinchFetch<Record<string, string>>(
        `/price/v1.1/${chainId}`,
      );

      const prices: Record<string, number> = {};
      if (data) {
        for (const [address, price] of Object.entries(data)) {
          prices[address] = Number(price) || 0;
        }
      }

      return {
        chainId,
        chain: CHAIN_NAMES[chainId] || `Chain ${chainId}`,
        prices,
        tokenCount: Object.keys(prices).length,
        timestamp: new Date().toISOString(),
      } satisfies TokenPriceMap;
    },
    { ...CACHE_TTL.PRICES }, // 30s fresh, 2min stale
  );
}

// ---------------------------------------------------------------------------
// Liquidity Sources
// ---------------------------------------------------------------------------

/**
 * Get available DEX liquidity sources on a chain.
 */
export async function getLiquiditySources(chainId: ChainId = 1): Promise<LiquiditySourcesSummary> {
  const cacheKey = apiCacheKey('oneinch:liquidity-sources', { chainId });

  return marketCache.getOrSet(
    cacheKey,
    async () => {
      const data = await oneinchFetch<{
        protocols?: Array<{
          id?: string;
          title?: string;
          img?: string;
        }>;
      }>(`/swap/v6.0/${chainId}/liquidity-sources`);

      const sources: LiquiditySource[] = (data?.protocols || []).map((p) => ({
        id: p.id || '',
        title: p.title || p.id || 'Unknown',
        img: p.img || '',
        enabled: true,
        chainId,
      }));

      return {
        chainId,
        chain: CHAIN_NAMES[chainId] || `Chain ${chainId}`,
        sources,
        totalSources: sources.length,
        enabledSources: sources.filter((s) => s.enabled).length,
        timestamp: new Date().toISOString(),
      } satisfies LiquiditySourcesSummary;
    },
    { ttl: 3600, staleTtl: 1800 }, // 1hr, sources rarely change
  );
}
