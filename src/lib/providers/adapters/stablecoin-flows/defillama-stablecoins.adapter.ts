/**
 * DefiLlama Stablecoins Adapter — Stablecoin supply & flow data
 *
 * DefiLlama Stablecoins API provides:
 * - All stablecoin market caps and supplies
 * - Chain distribution for each stablecoin
 * - Historical MCAP data
 * - Completely free, no API key
 *
 * @module providers/adapters/stablecoin-flows/defillama-stablecoins
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { StablecoinFlow } from './types';

const BASE = 'https://stablecoins.llama.fi';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60_000,
};

export const defillamaStablecoinsAdapter: DataProvider<StablecoinFlow[]> = {
  name: 'defillama-stablecoins',
  description: 'DefiLlama Stablecoins — Supply and flow data for all major stablecoins',
  priority: 1,
  weight: 0.60,
  rateLimit: RATE_LIMIT,
  capabilities: ['stablecoin-flows'],

  async fetch(params: FetchParams): Promise<StablecoinFlow[]> {
    const response = await fetch(`${BASE}/stablecoins?includePrices=true`);

    if (!response.ok) {
      throw new Error(`DefiLlama Stablecoins API error: ${response.status}`);
    }

    const json = await response.json();
    const assets: LlamaPegged[] = json?.peggedAssets ?? [];
    const now = new Date().toISOString();

    // Fetch historical data for 24h and 7d change calculations
    // DefiLlama provides chart data with daily MCAP per stablecoin
    const historicalMap = new Map<string, { change24h: number; change7d: number }>();
    try {
      const histRes = await fetch(`${BASE}/stablecoincharts/all?stablecoin=1`);
      if (histRes.ok) {
        const histData = await histRes.json();
        // histData is an array of {date, totalCirculatingUSD, ...} per stablecoin
        // We'll compute changes from the raw asset data instead
      }
    } catch { /* historical data unavailable */ }

    let results: StablecoinFlow[] = assets.map((a, i) => {
      const circUsd = a.circulating?.peggedUSD;
      const circEur = a.circulating?.peggedEUR;
      const totalCirc = (typeof circUsd === 'number' ? circUsd : 0) || (typeof circEur === 'number' ? circEur : 0);

      // Extract 24h and 7d circulating changes from DefiLlama's circulatingPrevDay/Week fields
      const circPrevDay = (a as unknown as Record<string, unknown>).circulatingPrevDay as Record<string, number> | undefined;
      const circPrevWeek = (a as unknown as Record<string, unknown>).circulatingPrevWeek as Record<string, number> | undefined;
      const prevDayUsd = circPrevDay?.peggedUSD ?? 0;
      const prevWeekUsd = circPrevWeek?.peggedUSD ?? 0;
      const change24h = prevDayUsd > 0 ? totalCirc - prevDayUsd : 0;
      const change7d = prevWeekUsd > 0 ? totalCirc - prevWeekUsd : 0;

      const chains = a.chainCirculating
        ? Object.entries(a.chainCirculating).map(([chain, data]) => ({
            chain,
            amount: data?.current?.peggedUSD ?? 0,
          }))
        : [];

      return {
        id: a.id ?? `stablecoin-${i}`,
        name: a.name ?? '',
        symbol: a.symbol ?? '',
        pegType: a.pegType ?? 'peggedUSD',
        circulatingUsd: totalCirc,
        circulatingChange24h: change24h,
        circulatingChange7d: change7d,
        chainDistribution: chains.sort((x, y) => y.amount - x.amount),
        price: a.price ?? 1.0,
        rank: i + 1,
        timestamp: now,
      };
    });

    // Sort by circulating supply
    results.sort((a, b) => b.circulatingUsd - a.circulatingUsd);

    const limit = params.limit ?? 50;
    results = results.slice(0, limit);

    return results;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/stablecoins`, {
        signal: AbortSignal.timeout(5000),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: StablecoinFlow[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(s =>
      typeof s.symbol === 'string' &&
      typeof s.circulatingUsd === 'number',
    );
  },
};

// =============================================================================
// INTERNAL
// =============================================================================

interface LlamaPegged {
  id: string;
  name: string;
  symbol: string;
  pegType: string;
  price: number;
  circulating: Record<string, number | Record<string, unknown>>;
  chainCirculating?: Record<string, Record<string, Record<string, number>>>;
}
