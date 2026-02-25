/**
 * MEXC Market Price Adapter
 *
 * MEXC is known for early listings and wide altcoin coverage:
 * - 2000+ trading pairs
 * - No API key required
 *
 * @module providers/adapters/market-price/mexc
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MarketPrice } from './coingecko.adapter';

const BASE = 'https://api.mexc.com/api/v3';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 1_000,
};

export const mexcAdapter: DataProvider<MarketPrice[]> = {
  name: 'mexc',
  description: 'MEXC — 2000+ pairs, early altcoin listings',
  priority: 10,
  weight: 0.15,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    const res = await fetch(`${BASE}/ticker/24hr`);
    if (!res.ok) throw new Error(`MEXC API error: ${res.status}`);

    const tickers: MexcTicker[] = await res.json();

    // Filter USDT pairs
    let usdtPairs = tickers.filter((t) => t.symbol.endsWith('USDT'));

    if (params.symbols?.length) {
      const syms = new Set(params.symbols.map((s) => `${s.toUpperCase()}USDT`));
      usdtPairs = usdtPairs.filter((t) => syms.has(t.symbol));
    }

    const limit = params.limit ?? 100;
    const now = new Date().toISOString();

    return usdtPairs.slice(0, limit).map((t): MarketPrice => {
      const symbol = t.symbol.replace(/USDT$/, '');
      return {
        id: symbol.toLowerCase(),
        symbol,
        name: symbol,
        currentPrice: parseFloat(t.lastPrice) || 0,
        marketCap: 0,
        marketCapRank: 0,
        totalVolume: parseFloat(t.quoteVolume) || 0,
        priceChange24h: parseFloat(t.priceChange) || 0,
        priceChangePercentage24h: parseFloat(t.priceChangePercent) || 0,
        high24h: parseFloat(t.highPrice) || 0,
        low24h: parseFloat(t.lowPrice) || 0,
        circulatingSupply: 0,
        totalSupply: null,
        lastUpdated: now,
      };
    });
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/ping`, { signal: AbortSignal.timeout(5000) });
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

interface MexcTicker {
  symbol: string;
  lastPrice: string;
  priceChange: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
}
