/**
 * NBBO Engine — National Best Bid/Offer across exchanges
 *
 * Aggregates order book data from multiple exchanges to compute
 * the best available bid and ask prices, similar to how traditional
 * finance computes NBBO across stock exchanges.
 *
 * Features:
 * - Cross-exchange best bid/ask computation
 * - Aggregated depth at various price levels
 * - Spread monitoring with anomaly detection
 * - Volume-weighted mid price
 *
 * @module lib/exchange/nbbo
 */

import type { OrderBookData, OrderBookLevel } from '../providers/adapters/order-book/types';

// =============================================================================
// TYPES
// =============================================================================

/** Best bid/ask from a single exchange */
export interface ExchangeQuote {
  exchange: string;
  bestBid: number;
  bestAsk: number;
  bidQuantity: number;
  askQuantity: number;
  spread: number;
  spreadBps: number;
  timestamp: number;
}

/** Aggregated depth at a price level */
export interface AggregatedDepth {
  /** Total bid volume within 0.1% of mid */
  bids01Pct: number;
  /** Total ask volume within 0.1% of mid */
  asks01Pct: number;
  /** Total bid volume within 0.5% of mid */
  bids05Pct: number;
  /** Total ask volume within 0.5% of mid */
  asks05Pct: number;
  /** Total bid volume within 1% of mid */
  bids1Pct: number;
  /** Total ask volume within 1% of mid */
  asks1Pct: number;
  /** Total bid volume within 2% of mid */
  bids2Pct: number;
  /** Total ask volume within 2% of mid */
  asks2Pct: number;
  /** Total bid volume within 5% of mid */
  bids5Pct: number;
  /** Total ask volume within 5% of mid */
  asks5Pct: number;
}

/** NBBO result — cross-exchange best bid/offer */
export interface NBBO {
  /** Trading symbol */
  symbol: string;
  /** Best bid across all exchanges */
  bestBid: { price: number; exchange: string; quantity: number };
  /** Best ask across all exchanges */
  bestAsk: { price: number; exchange: string; quantity: number };
  /** Mid-market price */
  midPrice: number;
  /** Volume-weighted mid price */
  vwMidPrice: number;
  /** Cross-exchange spread */
  spread: number;
  /** Spread in basis points */
  spreadBps: number;
  /** Aggregated depth at various levels */
  depth: AggregatedDepth;
  /** Per-exchange quotes */
  exchanges: ExchangeQuote[];
  /** Number of exchanges with data */
  exchangeCount: number;
  /** Any price deviations > threshold between exchanges */
  anomalies: PriceAnomaly[];
  /** Timestamp */
  timestamp: string;
}

/** Cross-exchange price anomaly */
export interface PriceAnomaly {
  type: 'spread_wide' | 'price_deviation' | 'stale_book';
  exchange: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}

// =============================================================================
// CONFIGURATION
// =============================================================================

const DEFAULT_CONFIG = {
  /** Maximum spread (bps) before alerting */
  maxSpreadBps: 50,
  /** Maximum price deviation between exchanges (%) */
  maxDeviationPercent: 1.0,
  /** Maximum age of order book data before considering stale (ms) */
  maxStaleMs: 30_000,
};

// =============================================================================
// NBBO COMPUTATION
// =============================================================================

/**
 * Compute NBBO from multiple exchange order books.
 *
 * @param orderBooks - Order book data from multiple exchanges
 * @param config - Optional configuration overrides
 * @returns NBBO result with best bid/ask, depth, and anomalies
 *
 * @example
 * ```ts
 * import { computeNBBO } from '@/lib/exchange/nbbo';
 * import { orderBookChain } from '@/lib/providers';
 *
 * const result = await orderBookChain.fetch({ symbols: ['BTCUSDT'] });
 * const nbbo = computeNBBO(result.data);
 * console.log(nbbo.bestBid, nbbo.bestAsk, nbbo.spreadBps);
 * ```
 */
export function computeNBBO(
  orderBooks: OrderBookData[],
  config = DEFAULT_CONFIG,
): NBBO {
  if (!orderBooks || orderBooks.length === 0) {
    throw new Error('No order book data provided for NBBO computation');
  }

  const symbol = orderBooks[0].symbol;
  const now = Date.now();
  const anomalies: PriceAnomaly[] = [];

  // Extract per-exchange quotes
  const exchanges: ExchangeQuote[] = orderBooks
    .filter(ob => ob.bids.length > 0 && ob.asks.length > 0)
    .map(ob => {
      const bestBid = ob.bids[0].price;
      const bestAsk = ob.asks[0].price;
      const spread = bestAsk - bestBid;
      const mid = (bestBid + bestAsk) / 2;
      const spreadBps = mid > 0 ? (spread / mid) * 10_000 : 0;

      // Check for stale data
      if (ob.timestamp && now - ob.timestamp > config.maxStaleMs) {
        anomalies.push({
          type: 'stale_book',
          exchange: ob.exchange,
          details: `Order book is ${Math.round((now - ob.timestamp) / 1000)}s old`,
          severity: 'medium',
        });
      }

      return {
        exchange: ob.exchange,
        bestBid,
        bestAsk,
        bidQuantity: ob.bids[0].quantity,
        askQuantity: ob.asks[0].quantity,
        spread,
        spreadBps,
        timestamp: ob.timestamp,
      };
    });

  if (exchanges.length === 0) {
    throw new Error('No valid order books with bids and asks');
  }

  // Find best bid (highest) and best ask (lowest) across exchanges
  let bestBidExchange = exchanges[0];
  let bestAskExchange = exchanges[0];

  for (const ex of exchanges) {
    if (ex.bestBid > bestBidExchange.bestBid) bestBidExchange = ex;
    if (ex.bestAsk < bestAskExchange.bestAsk) bestAskExchange = ex;
  }

  const midPrice = (bestBidExchange.bestBid + bestAskExchange.bestAsk) / 2;
  const spread = bestAskExchange.bestAsk - bestBidExchange.bestBid;
  const spreadBps = midPrice > 0 ? (spread / midPrice) * 10_000 : 0;

  // Volume-weighted mid price
  const totalBidVol = exchanges.reduce((sum, e) => sum + e.bidQuantity, 0);
  const totalAskVol = exchanges.reduce((sum, e) => sum + e.askQuantity, 0);
  const vwBid = totalBidVol > 0
    ? exchanges.reduce((sum, e) => sum + e.bestBid * e.bidQuantity, 0) / totalBidVol
    : bestBidExchange.bestBid;
  const vwAsk = totalAskVol > 0
    ? exchanges.reduce((sum, e) => sum + e.bestAsk * e.askQuantity, 0) / totalAskVol
    : bestAskExchange.bestAsk;
  const vwMidPrice = (vwBid + vwAsk) / 2;

  // Check for wide spread
  if (spreadBps > config.maxSpreadBps) {
    anomalies.push({
      type: 'spread_wide',
      exchange: `${bestBidExchange.exchange}/${bestAskExchange.exchange}`,
      details: `NBBO spread is ${spreadBps.toFixed(1)} bps (threshold: ${config.maxSpreadBps})`,
      severity: spreadBps > config.maxSpreadBps * 3 ? 'high' : 'medium',
    });
  }

  // Check for price deviation between exchanges
  for (let i = 0; i < exchanges.length; i++) {
    for (let j = i + 1; j < exchanges.length; j++) {
      const midI = (exchanges[i].bestBid + exchanges[i].bestAsk) / 2;
      const midJ = (exchanges[j].bestBid + exchanges[j].bestAsk) / 2;
      const deviation = midI > 0 ? Math.abs((midJ - midI) / midI) * 100 : 0;

      if (deviation > config.maxDeviationPercent) {
        anomalies.push({
          type: 'price_deviation',
          exchange: `${exchanges[i].exchange} vs ${exchanges[j].exchange}`,
          details: `Price deviation: ${deviation.toFixed(2)}% (threshold: ${config.maxDeviationPercent}%)`,
          severity: deviation > config.maxDeviationPercent * 3 ? 'high' : 'medium',
        });
      }
    }
  }

  // Compute aggregated depth
  const depth = computeAggregatedDepth(orderBooks, midPrice);

  return {
    symbol,
    bestBid: {
      price: bestBidExchange.bestBid,
      exchange: bestBidExchange.exchange,
      quantity: bestBidExchange.bidQuantity,
    },
    bestAsk: {
      price: bestAskExchange.bestAsk,
      exchange: bestAskExchange.exchange,
      quantity: bestAskExchange.askQuantity,
    },
    midPrice,
    vwMidPrice,
    spread,
    spreadBps,
    depth,
    exchanges,
    exchangeCount: exchanges.length,
    anomalies,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Compute aggregated depth across all exchanges at various price levels.
 */
function computeAggregatedDepth(
  orderBooks: OrderBookData[],
  midPrice: number,
): AggregatedDepth {
  const allBids: OrderBookLevel[] = [];
  const allAsks: OrderBookLevel[] = [];

  for (const ob of orderBooks) {
    allBids.push(...ob.bids);
    allAsks.push(...ob.asks);
  }

  const computeDepth = (
    levels: OrderBookLevel[],
    mid: number,
    pctRange: number,
    side: 'bid' | 'ask',
  ): number => {
    if (mid === 0) return 0;
    const lower = side === 'bid' ? mid * (1 - pctRange) : mid;
    const upper = side === 'ask' ? mid * (1 + pctRange) : mid;

    return levels
      .filter(l => (side === 'bid' ? l.price >= lower : l.price <= upper))
      .reduce((sum, l) => sum + l.price * l.quantity, 0);
  };

  return {
    bids01Pct: computeDepth(allBids, midPrice, 0.001, 'bid'),
    asks01Pct: computeDepth(allAsks, midPrice, 0.001, 'ask'),
    bids05Pct: computeDepth(allBids, midPrice, 0.005, 'bid'),
    asks05Pct: computeDepth(allAsks, midPrice, 0.005, 'ask'),
    bids1Pct: computeDepth(allBids, midPrice, 0.01, 'bid'),
    asks1Pct: computeDepth(allAsks, midPrice, 0.01, 'ask'),
    bids2Pct: computeDepth(allBids, midPrice, 0.02, 'bid'),
    asks2Pct: computeDepth(allAsks, midPrice, 0.02, 'ask'),
    bids5Pct: computeDepth(allBids, midPrice, 0.05, 'bid'),
    asks5Pct: computeDepth(allAsks, midPrice, 0.05, 'ask'),
  };
}

/**
 * Quick NBBO summary for a single trading pair.
 * Returns just the essential fields for API responses.
 */
export function nbboSummary(nbbo: NBBO) {
  return {
    symbol: nbbo.symbol,
    bestBid: nbbo.bestBid.price,
    bestAsk: nbbo.bestAsk.price,
    midPrice: nbbo.midPrice,
    spreadBps: Math.round(nbbo.spreadBps * 100) / 100,
    exchangeCount: nbbo.exchangeCount,
    hasAnomalies: nbbo.anomalies.length > 0,
    timestamp: nbbo.timestamp,
  };
}
