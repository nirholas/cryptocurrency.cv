/**
 * Coinbase Market Price Adapter
 *
 * Coinbase Exchange (Advanced Trade) provides:
 * - 300+ trading pairs
 * - US-regulated pricing
 * - No API key required for public data
 *
 * @module providers/adapters/market-price/coinbase
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MarketPrice } from './coingecko.adapter';

const BASE = 'https://api.exchange.coinbase.com';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 10,
  windowMs: 1_000,
};

const TOP_PAIRS = [
  'BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'ADA-USD', 'DOGE-USD',
  'AVAX-USD', 'LINK-USD', 'DOT-USD', 'MATIC-USD', 'UNI-USD', 'AAVE-USD',
  'LTC-USD', 'ATOM-USD', 'NEAR-USD', 'ARB-USD', 'OP-USD', 'FIL-USD',
  'APT-USD', 'SUI-USD',
];

export const coinbaseAdapter: DataProvider<MarketPrice[]> = {
  name: 'coinbase',
  description: 'Coinbase — US-regulated exchange, institutional-grade pricing',
  priority: 8,
  weight: 0.25,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    let pairs = TOP_PAIRS;

    if (params.symbols?.length) {
      pairs = params.symbols.map((s) => `${s.toUpperCase()}-USD`);
    }

    const limit = params.limit ?? 20;
    pairs = pairs.slice(0, limit);

    const results = await Promise.allSettled(
      pairs.map(async (pair): Promise<MarketPrice> => {
        const [tickerRes, statsRes] = await Promise.all([
          fetch(`${BASE}/products/${pair}/ticker`),
          fetch(`${BASE}/products/${pair}/stats`),
        ]);

        if (!tickerRes.ok) throw new Error(`Coinbase ${pair}: ${tickerRes.status}`);

        const ticker = await tickerRes.json();
        const stats = statsRes.ok ? await statsRes.json() : {};

        const symbol = pair.replace('-USD', '');
        const price = parseFloat(ticker.price) || 0;
        const open = parseFloat(stats.open) || price;

        return {
          id: symbol.toLowerCase(),
          symbol,
          name: symbol,
          currentPrice: price,
          marketCap: 0,
          marketCapRank: 0,
          totalVolume: parseFloat(ticker.volume) * price || 0,
          priceChange24h: price - open,
          priceChangePercentage24h: open > 0 ? ((price - open) / open) * 100 : 0,
          high24h: parseFloat(stats.high) || 0,
          low24h: parseFloat(stats.low) || 0,
          circulatingSupply: 0,
          totalSupply: null,
          lastUpdated: ticker.time || new Date().toISOString(),
        };
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<MarketPrice> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/products/BTC-USD/ticker`, {
        signal: AbortSignal.timeout(5000),
      });
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
