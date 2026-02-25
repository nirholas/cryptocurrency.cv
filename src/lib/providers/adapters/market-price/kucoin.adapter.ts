/**
 * KuCoin Market Price Adapter
 *
 * KuCoin is a major exchange with wide altcoin coverage:
 * - 800+ trading pairs
 * - No API key required for public data
 * - Single endpoint for all tickers
 *
 * @module providers/adapters/market-price/kucoin
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MarketPrice } from './coingecko.adapter';

const BASE = 'https://api.kucoin.com/api/v1';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 30,
  windowMs: 1_000,
};

export const kucoinAdapter: DataProvider<MarketPrice[]> = {
  name: 'kucoin',
  description: 'KuCoin — 800+ pairs, wide altcoin coverage',
  priority: 7,
  weight: 0.20,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    const res = await fetch(`${BASE}/market/allTickers`);
    if (!res.ok) throw new Error(`KuCoin API error: ${res.status}`);

    const json = await res.json();
    const tickers: KuCoinTicker[] = json.data?.ticker ?? [];

    // Filter to USD / USDT pairs
    let usdPairs = tickers.filter(
      (t) => t.symbol.endsWith('-USDT') || t.symbol.endsWith('-USD'),
    );

    if (params.symbols?.length) {
      const syms = new Set(params.symbols.map((s) => s.toUpperCase()));
      usdPairs = usdPairs.filter((t) => {
        const base = t.symbol.split('-')[0];
        return syms.has(base);
      });
    }

    const limit = params.limit ?? 100;
    const now = new Date().toISOString();

    return usdPairs.slice(0, limit).map((t): MarketPrice => {
      const base = t.symbol.split('-')[0];
      const price = parseFloat(t.last) || 0;
      const changeRate = parseFloat(t.changeRate) || 0;

      return {
        id: base.toLowerCase(),
        symbol: base,
        name: t.symbolName || base,
        currentPrice: price,
        marketCap: 0,
        marketCapRank: 0,
        totalVolume: parseFloat(t.volValue) || 0,
        priceChange24h: price * changeRate,
        priceChangePercentage24h: changeRate * 100,
        high24h: parseFloat(t.high) || 0,
        low24h: parseFloat(t.low) || 0,
        circulatingSupply: 0,
        totalSupply: null,
        lastUpdated: now,
      };
    });
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/status`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: MarketPrice[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every((d) => typeof d.currentPrice === 'number' && d.currentPrice > 0);
  },
};

interface KuCoinTicker {
  symbol: string;
  symbolName: string;
  last: string;
  high: string;
  low: string;
  vol: string;
  volValue: string;
  changeRate: string;
  changePrice: string;
}
