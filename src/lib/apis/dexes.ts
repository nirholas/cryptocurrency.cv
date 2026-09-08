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
 * DefiLlama DEX Volumes API
 *
 * Decentralised exchange trading volumes aggregated across all chains.
 * Free API with no authentication required.
 *
 * @see https://defillama.com/docs/api
 * @module lib/apis/dexes
 */

import { resilientFetch } from '@/lib/resilient-fetch';
import { staleCache } from '@/lib/cache';

const BASE_URL = 'https://api.llama.fi/overview/dexs';

// =============================================================================
// Types
// =============================================================================

export interface DexProtocol {
  defiLlamaId: string;
  name: string;
  displayName: string;
  logo?: string;
  chains: string[];
  total24h: number;
  total48hto24h: number;
  total7d: number;
  total30d: number;
  totalAllTime: number;
  change_1d: number;
  change_7d: number;
  change_1m: number;
  methodology?: string;
  category?: string;
  module?: string;
}

export interface DexChainVolume {
  chain: string;
  total24h: number;
  total7d: number;
  total30d: number;
  change_1d: number;
  change_7d: number;
  protocols: number;
}

export interface DexVolumesSummary {
  totalVolume24h: number;
  totalVolume7d: number;
  totalChange24h: number;
  protocols: DexProtocol[];
  timestamp: string;
}

export interface TopDex {
  name: string;
  logo?: string;
  chains: string[];
  volume24h: number;
  volume7d: number;
  volume30d: number;
  change24h: number;
  change7d: number;
  dominance: number;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from DefiLlama DEX API with caching.
 */
async function dexFetch<T>(url: string): Promise<T | null> {
  try {
    const { data, stale } = await resilientFetch<T>(url, {
      service: 'defillama-dex',
      timeoutMs: 10000,
      retries: 1,
      staleCache,
      staleCacheKey: `dex:${url}`,
      next: { revalidate: 300 },
    });
    if (stale) console.warn('DEX API: upstream failed, serving last known good payload');
    return data;
  } catch (error) {
    console.error('DEX API request failed:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// DEX Volume Data
// ---------------------------------------------------------------------------

/**
 * Get all DEX protocols with volume data.
 */
export async function getDexVolumes(): Promise<DexVolumesSummary> {
  const data = await dexFetch<{
    totalDataChart: Array<[number, number]>;
    totalDataChartBreakdown: unknown[];
    protocols: DexProtocol[];
    total24h: number;
    total7d: number;
    change_1d: number;
  }>(BASE_URL);

  if (!data?.protocols) {
    return {
      totalVolume24h: 0,
      totalVolume7d: 0,
      totalChange24h: 0,
      protocols: [],
      timestamp: new Date().toISOString(),
    };
  }

  const protocols = data.protocols
    .map((p) => ({
      defiLlamaId: p.defiLlamaId || p.name,
      name: p.name,
      displayName: p.displayName || p.name,
      logo: p.logo,
      chains: p.chains || [],
      total24h: p.total24h || 0,
      total48hto24h: p.total48hto24h || 0,
      total7d: p.total7d || 0,
      total30d: p.total30d || 0,
      totalAllTime: p.totalAllTime || 0,
      change_1d: p.change_1d || 0,
      change_7d: p.change_7d || 0,
      change_1m: p.change_1m || 0,
      methodology: p.methodology,
      category: p.category,
      module: p.module,
    }))
    .sort((a, b) => b.total24h - a.total24h);

  return {
    totalVolume24h: data.total24h || protocols.reduce((s, p) => s + p.total24h, 0),
    totalVolume7d: data.total7d || protocols.reduce((s, p) => s + p.total7d, 0),
    totalChange24h: data.change_1d || 0,
    protocols,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get DEX volume for a specific chain.
 *
 * @param chain - Chain name (e.g. "ethereum", "bsc", "arbitrum")
 */
export async function getDexVolumeByChain(chain: string): Promise<DexChainVolume | null> {
  const data = await dexFetch<{
    totalDataChart: Array<[number, number]>;
    protocols: Array<{
      name: string;
      total24h: number;
      total7d: number;
      total30d: number;
      change_1d: number;
      change_7d: number;
    }>;
    total24h: number;
    total7d: number;
    total30d: number;
    change_1d: number;
    change_7d: number;
  }>(`${BASE_URL}/${encodeURIComponent(chain)}`);

  if (!data) return null;

  return {
    chain,
    total24h: data.total24h || 0,
    total7d: data.total7d || 0,
    total30d: data.total30d || 0,
    change_1d: data.change_1d || 0,
    change_7d: data.change_7d || 0,
    protocols: data.protocols?.length || 0,
  };
}

/**
 * Get top DEXes by 24h volume with dominance share.
 *
 * @param limit - Number of DEXes to return (default 20)
 */
export async function getTopDexes(limit: number = 20): Promise<TopDex[]> {
  const summary = await getDexVolumes();

  if (!summary.protocols.length) return [];

  const totalVol = summary.totalVolume24h || 1;

  return summary.protocols.slice(0, limit).map((p) => ({
    name: p.name,
    logo: p.logo,
    chains: p.chains,
    volume24h: p.total24h,
    volume7d: p.total7d,
    volume30d: p.total30d,
    change24h: p.change_1d,
    change7d: p.change_7d,
    dominance: (p.total24h / totalVol) * 100,
  }));
}
