/**
 * Kraken Order Book Adapter
 *
 * @module providers/adapters/order-book/kraken-orderbook
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OrderBookData } from './types';

const BASE = 'https://api.kraken.com/0/public';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 15, windowMs: 1_000 };

const PAIR_MAP: Record<string, string> = {
  BTC: 'XXBTZUSD', ETH: 'XETHZUSD', SOL: 'SOLUSD', XRP: 'XXRPZUSD',
  ADA: 'ADAUSD', DOT: 'DOTUSD', LINK: 'LINKUSD', AVAX: 'AVAXUSD',
};

export const krakenOrderBookAdapter: DataProvider<OrderBookData[]> = {
  name: 'kraken-orderbook',
  description: 'Kraken — Order book depth data',
  priority: 2,
  weight: 0.30,
  rateLimit: RATE_LIMIT,
  capabilities: ['order-book'],

  async fetch(params: FetchParams): Promise<OrderBookData[]> {
    const symbols = params.symbols ?? ['BTC'];
    const depth = params.limit ?? 25;
    const now = new Date().toISOString();

    const results = await Promise.allSettled(
      symbols.map(async (sym): Promise<OrderBookData> => {
        const pair = PAIR_MAP[sym.toUpperCase()] ?? `${sym.toUpperCase()}USD`;
        const res = await fetch(`${BASE}/Depth?pair=${pair}&count=${depth}`);
        if (!res.ok) throw new Error(`Kraken orderbook ${pair}: ${res.status}`);

        const json = await res.json();
        if (json.error?.length) throw new Error(json.error.join(', '));

        const bookData = Object.values(json.result ?? {})[0] as KrakenBook;
        const bids = (bookData?.bids ?? []).map(([p, v]: [string, string, string]) => ({
          price: parseFloat(p),
          quantity: parseFloat(v),
        }));
        const asks = (bookData?.asks ?? []).map(([p, v]: [string, string, string]) => ({
          price: parseFloat(p),
          quantity: parseFloat(v),
        }));

        const bestBid = bids[0]?.price ?? 0;
        const bestAsk = asks[0]?.price ?? 0;
        const spread = bestAsk - bestBid;
        const midPrice = (bestAsk + bestBid) / 2;

        const bidDepth2Pct = bids.filter(b => b.price >= midPrice * 0.98).reduce((s, b) => s + b.price * b.quantity, 0);
        const askDepth2Pct = asks.filter(a => a.price <= midPrice * 1.02).reduce((s, a) => s + a.price * a.quantity, 0);
        const totalBidVol = bids.reduce((s, b) => s + b.quantity, 0);
        const totalAskVol = asks.reduce((s, a) => s + a.quantity, 0);

        return {
          symbol: sym.toUpperCase(),
          exchange: 'kraken',
          bids,
          asks,
          midPrice,
          spread,
          spreadPercent: midPrice > 0 ? (spread / midPrice) * 100 : 0,
          bidDepth2Pct,
          askDepth2Pct,
          imbalanceRatio: totalAskVol > 0 ? totalBidVol / totalAskVol : 1,
          timestamp: Date.now(),
          lastUpdated: now,
        };
      }),
    );

    return results
      .filter((r): r is PromiseFulfilledResult<OrderBookData> => r.status === 'fulfilled')
      .map((r) => r.value);
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BASE}/Depth?pair=XXBTZUSD&count=1`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: OrderBookData[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};

interface KrakenBook {
  bids: [string, string, string][];
  asks: [string, string, string][];
}
