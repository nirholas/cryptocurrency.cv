/**
 * OKX Order Book Adapter
 *
 * @module providers/adapters/order-book/okx-orderbook
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OrderBookData } from './types';

const BASE = 'https://www.okx.com/api/v5/market';

const RATE_LIMIT: RateLimitConfig = { maxRequests: 20, windowMs: 1_000 };

export const okxOrderBookAdapter: DataProvider<OrderBookData[]> = {
  name: 'okx-orderbook',
  description: 'OKX — Order book depth data',
  priority: 3,
  weight: 0.25,
  rateLimit: RATE_LIMIT,
  capabilities: ['order-book'],

  async fetch(params: FetchParams): Promise<OrderBookData[]> {
    const symbols = params.symbols ?? ['BTC'];
    const depth = Math.min(params.limit ?? 25, 400);
    const now = new Date().toISOString();

    const results = await Promise.allSettled(
      symbols.map(async (sym): Promise<OrderBookData> => {
        const instId = `${sym.toUpperCase()}-USDT`;
        const res = await fetch(`${BASE}/books?instId=${instId}&sz=${depth}`);
        if (!res.ok) throw new Error(`OKX orderbook ${instId}: ${res.status}`);

        const json = await res.json();
        const book = json.data?.[0];
        if (!book) throw new Error(`No data for ${instId}`);

        const bids = (book.bids ?? []).map(([p, v]: [string, string]) => ({
          price: parseFloat(p),
          quantity: parseFloat(v),
        }));
        const asks = (book.asks ?? []).map(([p, v]: [string, string]) => ({
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
          exchange: 'okx',
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
      const res = await fetch(`${BASE}/books?instId=BTC-USDT&sz=1`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  },

  validate(data: OrderBookData[]): boolean {
    return Array.isArray(data) && data.length > 0;
  },
};
