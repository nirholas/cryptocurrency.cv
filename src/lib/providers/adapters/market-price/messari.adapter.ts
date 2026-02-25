/**
 * Messari Adapter — Crypto Research & Structured Data
 *
 * Messari provides:
 * - Asset profiles with fundamentals (team, investors, governance)
 * - Market data with unique metrics
 * - Sector/category classification
 * - Token unlock schedules
 * - Research reports metadata
 *
 * Free tier: asset profiles + market data (500 req/day)
 * Pro: full research, screener, advanced metrics
 *
 * API: https://messari.io/api
 * env: MESSARI_API_KEY
 *
 * @module providers/adapters/market-price/messari
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MarketPrice } from './coingecko.adapter';

const MESSARI_BASE = 'https://data.messari.io/api/v1';
const MESSARI_V2 = 'https://data.messari.io/api/v2';
const MESSARI_API_KEY = process.env.MESSARI_API_KEY ?? '';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: MESSARI_API_KEY ? 20 : 5,
  windowMs: 60_000,
};

export const messariAdapter: DataProvider<MarketPrice[]> = {
  name: 'messari',
  description: 'Messari — Institutional-grade crypto research, fundamentals, and market data',
  priority: 3,
  weight: 0.25,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    const symbols = params.symbols ?? ['bitcoin', 'ethereum', 'solana'];
    const limit = params.limit ?? 20;

    // If no specific symbols, get top assets
    if (!params.symbols?.length) {
      return fetchTopAssets(limit);
    }

    const results = await Promise.allSettled(
      symbols.map(async (sym): Promise<MarketPrice> => {
        const slug = sym.toLowerCase();
        const url = `${MESSARI_V2}/assets/${slug}/metrics`;

        const res = await fetch(url, {
          headers: {
            'User-Agent': 'free-crypto-news/2.0',
            ...(MESSARI_API_KEY && { 'x-messari-api-key': MESSARI_API_KEY }),
          },
        });

        if (!res.ok) throw new Error(`Messari ${slug}: ${res.status}`);

        const json = await res.json();
        const d = json.data;
        const market = d.market_data || {};

        return {
          id: d.slug || slug,
          symbol: (d.symbol || sym).toUpperCase(),
          name: d.name || slug,
          currentPrice: market.price_usd || 0,
          marketCap: market.current_marketcap_usd || 0,
          marketCapRank: d.marketcap?.rank || 0,
          totalVolume: market.volume_last_24_hours || 0,
          priceChange24h: market.percent_change_usd_last_24_hours || 0,
          priceChangePercentage24h: market.percent_change_usd_last_24_hours || 0,
          high24h: market.ohlcv_last_24_hour?.high || 0,
          low24h: market.ohlcv_last_24_hour?.low || 0,
          circulatingSupply: d.supply?.circulating || 0,
          totalSupply: d.supply?.total || null,
          lastUpdated: new Date().toISOString(),
        };
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<MarketPrice> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${MESSARI_V2}/assets/bitcoin/metrics`, {
        headers: {
          ...(MESSARI_API_KEY && { 'x-messari-api-key': MESSARI_API_KEY }),
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  normalize(data: MarketPrice[]): MarketPrice[] {
    return data;
  },
};

async function fetchTopAssets(limit: number): Promise<MarketPrice[]> {
  const url = `${MESSARI_V2}/assets?limit=${limit}&fields=id,slug,symbol,name,metrics/market_data,metrics/marketcap,metrics/supply`;

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'free-crypto-news/2.0',
      ...(MESSARI_API_KEY && { 'x-messari-api-key': MESSARI_API_KEY }),
    },
  });

  if (!res.ok) throw new Error(`Messari top assets: ${res.status}`);

  const json = await res.json();
  return (json.data || []).map((d: Record<string, unknown>): MarketPrice => {
    const metrics = (d.metrics || {}) as Record<string, Record<string, unknown>>;
    const market = metrics.market_data || {};
    const supply = metrics.supply || {};
    const cap = metrics.marketcap || {};

    return {
      id: (d.slug as string) || '',
      symbol: ((d.symbol as string) || '').toUpperCase(),
      name: (d.name as string) || '',
      currentPrice: (market.price_usd as number) || 0,
      marketCap: (cap.current_marketcap_usd as number) || 0,
      marketCapRank: (cap.rank as number) || 0,
      totalVolume: (market.volume_last_24_hours as number) || 0,
      priceChange24h: (market.percent_change_usd_last_24_hours as number) || 0,
      priceChangePercentage24h: (market.percent_change_usd_last_24_hours as number) || 0,
      high24h: 0,
      low24h: 0,
      circulatingSupply: (supply.circulating as number) || 0,
      totalSupply: (supply.total as number) || null,
      lastUpdated: new Date().toISOString(),
    };
  });
}

export default messariAdapter;
