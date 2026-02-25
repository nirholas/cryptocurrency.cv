/**
 * Bybit Order Book Adapter — Order book depth from Bybit
 *
 * Bybit is one of the largest derivatives & spot exchanges:
 * - No API key required for public market data
 * - 120 req/s rate limit
 * - Good liquidity for major pairs
 *
 * @module providers/adapters/order-book/bybit
 */

import type { DataProvider, FetchParams, RateLimitConfig } from '../../types';
import type { OrderBookData, OrderBookLevel } from './types';

const BYBIT_BASE = 'https://api.bybit.com/v5/market';

const RATE_LIMIT: RateLimitConfig = {
  maxRequests: 600,
  windowMs: 60_000,
};

const SYMBOL_MAP: Record<string, string> = {
  BTCUSDT: 'BTCUSDT',
  ETHUSDT: 'ETHUSDT',
  SOLUSDT: 'SOLUSDT',
  XRPUSDT: 'XRPUSDT',
  DOGEUSDT: 'DOGEUSDT',
  ADAUSDT: 'ADAUSDT',
  AVAXUSDT: 'AVAXUSDT',
  LINKUSDT: 'LINKUSDT',
  DOTUSDT: 'DOTUSDT',
  MATICUSDT: 'MATICUSDT',
};

export const bybitOrderBookAdapter: DataProvider<OrderBookData[]> = {
  name: 'bybit-orderbook',
  description: 'Bybit — real-time order book depth for major pairs',
  priority: 3,
  weight: 0.30,
  rateLimit: RATE_LIMIT,
  capabilities: ['order-book'],

  async fetch(params: FetchParams): Promise<OrderBookData[]> {
    const symbols = params.symbols ?? ['BTCUSDT'];
    const depthLimit = Math.min((params.extra?.depth as number) ?? 25, 200);
    const results: OrderBookData[] = [];

    for (const symbol of symbols) {
      const bybitSymbol = SYMBOL_MAP[symbol] ?? symbol;
      const url = `${BYBIT_BASE}/orderbook?category=spot&symbol=${bybitSymbol}&limit=${depthLimit}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        throw new Error(`Bybit orderbook API error: ${response.status}`);
      }

      const json: BybitOrderBookResponse = await response.json();
      if (json.retCode !== 0) {
        throw new Error(`Bybit orderbook error: ${json.retMsg}`);
      }

      const raw = json.result;

      const bids: OrderBookLevel[] = (raw.b || []).map(([price, qty]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(qty),
      }));

      const asks: OrderBookLevel[] = (raw.a || []).map(([price, qty]: [string, string]) => ({
        price: parseFloat(price),
        quantity: parseFloat(qty),
      }));

      const bestBid = bids[0]?.price ?? 0;
      const bestAsk = asks[0]?.price ?? 0;
      const midPrice = (bestBid + bestAsk) / 2;
      const spread = bestAsk - bestBid;
      const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0;

      const lower2 = midPrice * 0.98;
      const upper2 = midPrice * 1.02;
      const bidDepth2Pct = bids
        .filter(b => b.price >= lower2)
        .reduce((sum, b) => sum + b.price * b.quantity, 0);
      const askDepth2Pct = asks
        .filter(a => a.price <= upper2)
        .reduce((sum, a) => sum + a.price * a.quantity, 0);

      const imbalanceRatio = askDepth2Pct > 0 ? bidDepth2Pct / askDepth2Pct : 1;

      results.push({
        symbol: bybitSymbol,
        exchange: 'bybit',
        bids,
        asks,
        midPrice,
        spread,
        spreadPercent,
        bidDepth2Pct,
        askDepth2Pct,
        imbalanceRatio,
        timestamp: parseInt(raw.ts, 10) || Date.now(),
        lastUpdated: new Date().toISOString(),
      });
    }

    return results;
  },

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch(`${BYBIT_BASE}/orderbook?category=spot&symbol=BTCUSDT&limit=1`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return false;
      const json = await res.json();
      return json.retCode === 0;
    } catch {
      return false;
    }
  },

  validate(data: OrderBookData[]): boolean {
    if (!Array.isArray(data) || data.length === 0) return false;
    return data.every(d => d.bids.length > 0 && d.asks.length > 0 && d.midPrice > 0);
  },
};

interface BybitOrderBookResponse {
  retCode: number;
  retMsg: string;
  result: {
    s: string;
    b: [string, string][];
    a: [string, string][];
    ts: string;
    u: number;
  };
}
