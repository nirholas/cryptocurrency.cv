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
 * DefiLlama Bridges API
 *
 * Cross-chain bridge volume, flow, and history data.
 * Free API with no authentication required.
 *
 * @see https://bridges.llama.fi/docs
 * @module lib/apis/bridges
 */

import { resilientFetch } from '@/lib/resilient-fetch';
import { staleCache } from '@/lib/cache';

const BASE_URL = 'https://bridges.llama.fi';

// =============================================================================
// Types
// =============================================================================

export interface Bridge {
  id: number;
  name: string;
  displayName: string;
  icon?: string;
  volumePrevDay: number;
  volumePrev2Day: number;
  lastHourlyVolume: number;
  currentDayVolume: number;
  lastDailyVolume: number;
  dayBeforeLastVolume: number;
  weeklyVolume: number;
  monthlyVolume: number;
  chains: string[];
  destinationChain?: string;
  /** Total value locked, in USD. Always present; volume may not be. */
  tvlUsd: number;
  /** 24h change in TVL, percent. */
  tvlChange1d: number;
}

export interface BridgeVolume {
  date: number;
  depositUSD: number;
  withdrawUSD: number;
  depositTxs: number;
  withdrawTxs: number;
}

export interface BridgeHistoryEntry {
  date: number;
  depositUSD: number;
  withdrawUSD: number;
  depositTxs: number;
  withdrawTxs: number;
}

export interface BridgeVolumeChain {
  chain: string;
  volumeIn: number;
  volumeOut: number;
  netFlow: number;
  txsIn: number;
  txsOut: number;
}

export interface BridgeVolumesSummary {
  totalVolume24h: number;
  totalVolume7d: number;
  bridges: Bridge[];
  topByVolume: Bridge[];
  /**
   * False when the roster came from the free TVL endpoint because the volume
   * API is paywalled. Consumers must not render the zeroed volume fields as
   * real numbers when this is false.
   */
  volumeAvailable: boolean;
  /** Which upstream produced this payload. */
  source: 'defillama-bridges' | 'defillama-protocols';
  timestamp: string;
}

// =============================================================================
// API Functions
// =============================================================================

/**
 * Fetch from DefiLlama Bridges API with caching.
 */
async function bridgeFetch<T>(path: string): Promise<T | null> {
  try {
    const { data, stale } = await resilientFetch<T>(`${BASE_URL}${path}`, {
      service: 'defillama-bridges',
      timeoutMs: 10000,
      retries: 1,
      staleCache,
      staleCacheKey: `bridges:${path}`,
      next: { revalidate: 300 },
    });
    if (stale) console.warn('Bridges API: upstream failed, serving last known good payload');
    return data;
  } catch (error) {
    console.error('Bridges API request failed:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Bridge Data
// ---------------------------------------------------------------------------

/** One entry of the free DefiLlama protocols list, narrowed to what we read. */
interface LlamaProtocol {
  id?: string;
  name: string;
  category?: string;
  tvl?: number;
  change_1d?: number;
  chains?: string[];
  logo?: string;
}

/**
 * Bridge roster built from the FREE protocols endpoint.
 *
 * `bridges.llama.fi` moved behind DefiLlama's paid plan and now answers 402 for
 * every request, which left both bridge endpoints returning an empty list with
 * a 200 — a silent failure nothing could detect. `api.llama.fi/protocols` is
 * still free and carries every bridge with its TVL and 24h change, so the
 * product keeps a real, complete bridge roster; only per-bridge volume is lost,
 * and `volumeAvailable: false` tells callers not to render the zeroed fields.
 */
async function fetchBridgeRosterFromProtocols(): Promise<Bridge[]> {
  try {
    const { data } = await resilientFetch<LlamaProtocol[]>('https://api.llama.fi/protocols', {
      service: 'defillama-protocols',
      timeoutMs: 15000,
      retries: 1,
      staleCache,
      staleCacheKey: 'bridges:protocols-fallback',
      next: { revalidate: 900 },
    });
    if (!Array.isArray(data)) return [];

    return data
      .filter((p) => p.category === 'Bridge' && typeof p.tvl === 'number' && p.tvl > 0)
      .map((p, index) => ({
        id: index,
        name: p.name,
        displayName: p.name,
        icon: p.logo,
        volumePrevDay: 0,
        volumePrev2Day: 0,
        lastHourlyVolume: 0,
        currentDayVolume: 0,
        lastDailyVolume: 0,
        dayBeforeLastVolume: 0,
        weeklyVolume: 0,
        monthlyVolume: 0,
        chains: p.chains ?? [],
        tvlUsd: p.tvl ?? 0,
        tvlChange1d: p.change_1d ?? 0,
      }))
      .sort((a, b) => b.tvlUsd - a.tvlUsd);
  } catch (error) {
    console.error('Bridge roster fallback failed:', error);
    return [];
  }
}

/**
 * Get all bridges with volume data, falling back to the free TVL roster when
 * the volume API is unavailable.
 */
export async function getBridges(): Promise<Bridge[]> {
  const data = await bridgeFetch<{ bridges: Bridge[] }>('/bridges');

  if (!data?.bridges?.length) return fetchBridgeRosterFromProtocols();

  return data.bridges
    .map((b) => ({
      id: b.id,
      name: b.name,
      displayName: b.displayName || b.name,
      icon: b.icon,
      volumePrevDay: b.volumePrevDay || 0,
      volumePrev2Day: b.volumePrev2Day || 0,
      lastHourlyVolume: b.lastHourlyVolume || 0,
      currentDayVolume: b.currentDayVolume || 0,
      lastDailyVolume: b.lastDailyVolume || 0,
      dayBeforeLastVolume: b.dayBeforeLastVolume || 0,
      weeklyVolume: b.weeklyVolume || 0,
      monthlyVolume: b.monthlyVolume || 0,
      chains: b.chains || [],
      destinationChain: b.destinationChain,
      tvlUsd: b.tvlUsd || 0,
      tvlChange1d: b.tvlChange1d || 0,
    }))
    .sort((a, b) => b.lastDailyVolume - a.lastDailyVolume);
}

/**
 * Get aggregated bridge volume data (24h and 7d totals).
 */
export async function getBridgeVolumes(): Promise<BridgeVolumesSummary> {
  const bridges = await getBridges();

  const totalVolume24h = bridges.reduce((sum, b) => sum + b.lastDailyVolume, 0);
  const totalVolume7d = bridges.reduce((sum, b) => sum + b.weeklyVolume, 0);
  const volumeAvailable = totalVolume24h > 0;

  return {
    totalVolume24h,
    totalVolume7d,
    volumeAvailable,
    source: volumeAvailable ? 'defillama-bridges' : 'defillama-protocols',
    bridges,
    topByVolume: bridges.slice(0, 20),
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get historical volume for a specific bridge.
 *
 * @param bridgeId - Numeric bridge ID from DefiLlama
 */
export async function getBridgeHistory(bridgeId: number): Promise<BridgeHistoryEntry[]> {
  const data = await bridgeFetch<BridgeHistoryEntry[] | { data: BridgeHistoryEntry[] }>(
    `/bridgevolume/${bridgeId}`,
  );

  if (!data) return [];

  const entries = Array.isArray(data) ? data : data.data || [];

  return entries.map((e) => ({
    date: e.date,
    depositUSD: e.depositUSD || 0,
    withdrawUSD: e.withdrawUSD || 0,
    depositTxs: e.depositTxs || 0,
    withdrawTxs: e.withdrawTxs || 0,
  }));
}
