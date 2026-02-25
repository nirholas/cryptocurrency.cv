/**
 * Kraken Market Price Adapter
 *
 * Kraken is one of the most trusted crypto exchanges:
 * - 500+ trading pairs
 * - No API key required for public endpoints
 * - High-quality price data
 *
 * Uses pair format like XXBTZUSD — includes mapping table.
 *
 * @module providers/adapters/market-price/kraken
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { MarketPrice } from './coingecko.adapter';

const BASE = 'https://api.kraken.com/0/public';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 15,
  windowMs: 1_000,
};

// Kraken uses non-standard pair names
const PAIR_MAP: Record<string, string> = {
  BTC: 'XXBTZUSD',
  ETH: 'XETHZUSD',
  SOL: 'SOLUSD',
  XRP: 'XXRPZUSD',
  ADA: 'ADAUSD',
  DOT: 'DOTUSD',
  DOGE: 'XDGUSD',
  AVAX: 'AVAXUSD',
  LINK: 'LINKUSD',
  MATIC: 'MATICUSD',
  UNI: 'UNIUSD',
  AAVE: 'AAVEUSD',
  LTC: 'XLTCZUSD',
  ATOM: 'ATOMUSD',
  NEAR: 'NEARUSD',
  ARB: 'ARBUSD',
  OP: 'OPUSD',
};

// Reverse map for normalization
const REVERSE_PAIR_MAP = new Map(
  Object.entries(PAIR_MAP).map(([symbol, pair]) => [pair, symbol]),
);

export const krakenAdapter: DataProvider<MarketPrice[]> = {
  name: 'kraken',
  description: 'Kraken — trusted exchange with 500+ pairs, no API key required',
  priority: 6,
  weight: 0.25,
  rateLimit: RATE_LIMIT,
  capabilities: ['market-price'],

  async fetch(params: FetchParams): Promise<MarketPrice[]> {
    const symbols = params.symbols?.map((s) => s.toUpperCase()) ?? Object.keys(PAIR_MAP);
    const pairs = symbols
      .map((s) => PAIR_MAP[s])
      .filter(Boolean);

    if (pairs.length === 0) {
      throw new Error('No supported Kraken pairs for requested symbols');
    }

    const res = await fetch(`${BASE}/Ticker?pair=${pairs.join(',')}`);
    if (!res.ok) throw new Error(`Kraken API error: ${res.status}`);

    const json = await res.json();
    if (json.error?.length) throw new Error(`Kraken: ${json.error.join(', ')}`);

    const result = json.result ?? {};
    const now = new Date().toISOString();

    return Object.entries(result).map(([pairKey, data]: [string, unknown]): MarketPrice => {
      const ticker = data as KrakenTicker;
      const symbol = REVERSE_PAIR_MAP.get(pairKey) ?? pairKey.replace(/[XZ]?USD$/, '');

      return {
        id: symbol.toLowerCase(),
        symbol: symbol.toUpperCase(),
        name: symbol,
        currentPrice: parseFloat(ticker.c[0]) || 0,
        marketCap: 0,
        marketCapRank: 0,
        totalVolume: parseFloat(ticker.v[1]) * parseFloat(ticker.c[0]) || 0,
        priceChange24h: parseFloat(ticker.c[0]) - parseFloat(ticker.o) || 0,
        priceChangePercentage24h:
          ((parseFloat(ticker.c[0]) - parseFloat(ticker.o)) / parseFloat(ticker.o)) * 100 || 0,
        high24h: parseFloat(ticker.h[1]) || 0,
        low24h: parseFloat(ticker.l[1]) || 0,
        circulatingSupply: 0,
        totalSupply: null,
        lastUpdated: now,
      };
    });
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/SystemStatus`, { signal: AbortSignal.timeout(5000) });
      if (!res.ok) return false;
      const json = await res.json();
      return json.result?.status === 'online';
    } catch {
      return false;
    }
  },

  validate(data: MarketPrice[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every((d) => typeof d.currentPrice === 'number' && d.currentPrice > 0);
  },
};

interface KrakenTicker {
  a: [string, string, string]; // ask [price, lot volume, volume]
  b: [string, string, string]; // bid
  c: [string, string]; // last trade [price, volume]
  v: [string, string]; // volume [today, 24h]
  p: [string, string]; // VWAP [today, 24h]
  t: [number, number]; // trade count
  l: [string, string]; // low [today, 24h]
  h: [string, string]; // high [today, 24h]
  o: string; // opening price
}
