/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * Multi-Exchange Order Book Aggregator
 * 
 * Enterprise-grade order book aggregation across major cryptocurrency exchanges.
 * Provides unified liquidity view, depth analysis, and real-time updates.
 * 
 * Features:
 * - Real-time order book aggregation from multiple exchanges
 * - Unified depth charts across all venues
 * - Best bid/ask discovery (NBBO)
 * - Liquidity depth analysis at various price levels
 * - Spread tracking and anomaly detection
 * - Order imbalance calculation
 * - Smart order routing suggestions
 * - Whale order detection
 * - Historical order book snapshots
 * 
 * @module order-book
 */

import { db } from './database';
import { aiCache } from './cache';
import { resilientFetchResponse } from '@/lib/resilient-fetch';

// =============================================================================
// TYPES
// =============================================================================

export type Exchange = 
  | 'binance'
  | 'coinbase'
  | 'kraken'
  | 'bitfinex'
  | 'bitstamp'
  | 'okx'
  | 'bybit'
  | 'kucoin'
  | 'huobi'
  | 'gemini';

export interface OrderBookEntry {
  price: number;
  quantity: number;
  exchange: Exchange;
  timestamp: number;
  numOrders?: number;
}

export interface OrderBook {
  symbol: string;
  exchange: Exchange;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  timestamp: number;
  lastUpdateId?: number;
  spread: number;
  midPrice: number;
}

export interface AggregatedOrderBook {
  symbol: string;
  timestamp: number;
  exchanges: Exchange[];
  
  // Best prices across all exchanges
  nbbo: {
    bestBid: OrderBookEntry | null;
    bestAsk: OrderBookEntry | null;
    spread: number;
    spreadPercent: number;
    midPrice: number;
  };
  
  // Aggregated depth
  aggregatedBids: AggregatedLevel[];
  aggregatedAsks: AggregatedLevel[];
  
  // Per-exchange summary
  exchangeData: ExchangeSummary[];
  
  // Analytics
  metrics: OrderBookMetrics;
}

export interface AggregatedLevel {
  price: number;
  totalQuantity: number;
  totalValue: number;
  contributions: Array<{
    exchange: Exchange;
    quantity: number;
    percentage: number;
  }>;
  cumulativeQuantity: number;
  cumulativeValue: number;
}

export interface ExchangeSummary {
  exchange: Exchange;
  bestBid: number;
  bestAsk: number;
  spread: number;
  bidDepth5: number;      // Depth at 5 levels
  askDepth5: number;
  bidDepth10: number;     // Depth at 10 levels
  askDepth10: number;
  totalBidLiquidity: number;
  totalAskLiquidity: number;
  lastUpdate: number;
  status: 'online' | 'delayed' | 'offline';
}

export interface OrderBookMetrics {
  // Imbalance
  imbalanceRatio: number;        // > 1 = more bids, < 1 = more asks
  imbalancePercent: number;
  
  // Liquidity
  bidLiquidity1Percent: number;  // Liquidity within 1% of mid
  askLiquidity1Percent: number;
  bidLiquidity2Percent: number;  // Liquidity within 2% of mid
  askLiquidity2Percent: number;
  
  // Spread analysis
  avgSpread: number;
  minSpread: number;
  maxSpread: number;
  spreadStdDev: number;
  
  // Market depth
  depthScore: number;            // 0-100 liquidity score
  slippageEstimate1k: number;    // Estimated slippage for $1k order
  slippageEstimate10k: number;
  slippageEstimate100k: number;
  
  // Order distribution
  whaleOrders: WhaleOrder[];
  priceWalls: PriceWall[];
}

export interface WhaleOrder {
  exchange: Exchange;
  side: 'bid' | 'ask';
  price: number;
  quantity: number;
  value: number;
  percentOfDepth: number;
}

export interface PriceWall {
  side: 'bid' | 'ask';
  price: number;
  totalQuantity: number;
  exchanges: Exchange[];
  strength: 'weak' | 'moderate' | 'strong';
}

export interface SmartRoutingRecommendation {
  symbol: string;
  orderType: 'buy' | 'sell';
  totalQuantity: number;
  routes: RouteRecommendation[];
  expectedSlippage: number;
  expectedCost: number;
  estimatedFees: number;
}

export interface RouteRecommendation {
  exchange: Exchange;
  quantity: number;
  price: number;
  value: number;
  percentOfOrder: number;
  reason: string;
}

export interface OrderBookSnapshot {
  id: string;
  symbol: string;
  timestamp: string;
  aggregatedBook: AggregatedOrderBook;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SNAPSHOTS_COLLECTION = 'orderbook_snapshots';
const CACHE_TTL = 10; // 10 seconds for order book data

const EXCHANGE_ENDPOINTS: Record<Exchange, { rest: string; ws: string }> = {
  binance: {
    rest: 'https://api.binance.com/api/v3/depth',
    ws: 'wss://stream.binance.com:9443/ws',
  },
  coinbase: {
    rest: 'https://api.exchange.coinbase.com/products/{symbol}/book',
    ws: 'wss://ws-feed.exchange.coinbase.com',
  },
  kraken: {
    rest: 'https://api.kraken.com/0/public/Depth',
    ws: 'wss://ws.kraken.com',
  },
  bitfinex: {
    rest: 'https://api-pub.bitfinex.com/v2/book/{symbol}/P0',
    ws: 'wss://api-pub.bitfinex.com/ws/2',
  },
  bitstamp: {
    rest: 'https://www.bitstamp.net/api/v2/order_book/{symbol}',
    ws: 'wss://ws.bitstamp.net',
  },
  okx: {
    rest: 'https://www.okx.com/api/v5/market/books',
    ws: 'wss://ws.okx.com:8443/ws/v5/public',
  },
  bybit: {
    rest: 'https://api.bybit.com/v5/market/orderbook',
    ws: 'wss://stream.bybit.com/v5/public/spot',
  },
  kucoin: {
    rest: 'https://api.kucoin.com/api/v1/market/orderbook/level2_100',
    ws: 'wss://ws-api.kucoin.com',
  },
  huobi: {
    rest: 'https://api.huobi.pro/market/depth',
    ws: 'wss://api.huobi.pro/ws',
  },
  gemini: {
    rest: 'https://api.gemini.com/v1/book/{symbol}',
    ws: 'wss://api.gemini.com/v1/marketdata',
  },
};

const WHALE_THRESHOLD_USD = 100000;
const WALL_THRESHOLD_PERCENT = 5;

// =============================================================================
// EXCHANGE API CONFIGURATIONS
// =============================================================================

const EXCHANGE_CONFIGS: Record<Exchange, {
  baseUrl: string;
  orderBookEndpoint: (symbol: string, depth: number) => string;
  transform: (data: unknown, symbol: string, exchange: Exchange) => OrderBook | null;
}> = {
  binance: {
    baseUrl: 'https://api.binance.com',
    orderBookEndpoint: (symbol, depth) => `/api/v3/depth?symbol=${symbol.toUpperCase().replace('/', '')}USDT&limit=${Math.min(depth, 1000)}`,
    transform: (data: unknown, symbol: string, exchange: Exchange) => transformBinanceOrderBook(data as BinanceOrderBook, symbol, exchange),
  },
  coinbase: {
    baseUrl: 'https://api.exchange.coinbase.com',
    orderBookEndpoint: (symbol) => `/products/${symbol.toUpperCase()}-USD/book?level=2`,
    transform: (data: unknown, symbol: string, exchange: Exchange) => transformCoinbaseOrderBook(data as CoinbaseOrderBook, symbol, exchange),
  },
  kraken: {
    baseUrl: 'https://api.kraken.com',
    orderBookEndpoint: (symbol, depth) => `/0/public/Depth?pair=${symbol.toUpperCase()}USD&count=${Math.min(depth, 500)}`,
    transform: (data: unknown, symbol: string, exchange: Exchange) => transformKrakenOrderBook(data as KrakenOrderBook, symbol, exchange),
  },
  bitfinex: {
    baseUrl: 'https://api-pub.bitfinex.com',
    orderBookEndpoint: (symbol, depth) => `/v2/book/t${symbol.toUpperCase()}USD/P0?len=${Math.min(depth, 100)}`,
    transform: (data: unknown, symbol: string, exchange: Exchange) => transformBitfinexOrderBook(data as BitfinexOrderBook, symbol, exchange),
  },
  bitstamp: {
    baseUrl: 'https://www.bitstamp.net',
    orderBookEndpoint: (symbol) => `/api/v2/order_book/${symbol.toLowerCase()}usd/`,
    transform: (data: unknown, symbol: string, exchange: Exchange) => transformBitstampOrderBook(data as BitstampOrderBook, symbol, exchange),
  },
  okx: {
    baseUrl: 'https://www.okx.com',
    orderBookEndpoint: (symbol, depth) => `/api/v5/market/books?instId=${symbol.toUpperCase()}-USDT&sz=${Math.min(depth, 400)}`,
    transform: (data: unknown, symbol: string, exchange: Exchange) => transformOKXOrderBook(data as OKXOrderBook, symbol, exchange),
  },
  bybit: {
    baseUrl: 'https://api.bybit.com',
    orderBookEndpoint: (symbol, depth) => `/v5/market/orderbook?category=spot&symbol=${symbol.toUpperCase()}USDT&limit=${Math.min(depth, 200)}`,
    transform: (data: unknown, symbol: string, exchange: Exchange) => transformBybitOrderBook(data as BybitOrderBook, symbol, exchange),
  },
  kucoin: {
    baseUrl: 'https://api.kucoin.com',
    orderBookEndpoint: (symbol) => `/api/v1/market/orderbook/level2_100?symbol=${symbol.toUpperCase()}-USDT`,
    transform: (data: unknown, symbol: string, exchange: Exchange) => transformKucoinOrderBook(data as KucoinOrderBook, symbol, exchange),
  },
  huobi: {
    baseUrl: 'https://api.huobi.pro',
    orderBookEndpoint: (symbol, depth) => `/market/depth?symbol=${symbol.toLowerCase()}usdt&type=step0&depth=${Math.min(depth, 150)}`,
    transform: (data: unknown, symbol: string, exchange: Exchange) => transformHuobiOrderBook(data as HuobiOrderBook, symbol, exchange),
  },
  gemini: {
    baseUrl: 'https://api.gemini.com',
    orderBookEndpoint: (symbol) => `/v1/book/${symbol.toUpperCase()}USD?limit_bids=50&limit_asks=50`,
    transform: (data: unknown, symbol: string, exchange: Exchange) => transformGeminiOrderBook(data as GeminiOrderBook, symbol, exchange),
  },
};

// =============================================================================
// EXCHANGE RESPONSE TYPES
// =============================================================================

interface BinanceOrderBook {
  lastUpdateId: number;
  bids: [string, string][];
  asks: [string, string][];
}

interface CoinbaseOrderBook {
  bids: [string, string, number][];
  asks: [string, string, number][];
  sequence: number;
}

interface KrakenOrderBook {
  result: Record<string, { bids: [string, string, string][]; asks: [string, string, string][] }>;
}

interface BitfinexOrderBook {
  // [price, count, amount][] - amount positive = bid, negative = ask
  length: number;
}

interface BitstampOrderBook {
  timestamp: string;
  bids: [string, string][];
  asks: [string, string][];
}

interface OKXOrderBook {
  data: Array<{ bids: [string, string, string, string][]; asks: [string, string, string, string][] }>;
}

interface BybitOrderBook {
  result: { b: [string, string][]; a: [string, string][]; ts: number };
}

interface KucoinOrderBook {
  data: { bids: [string, string][]; asks: [string, string][]; time: number };
}

interface HuobiOrderBook {
  tick: { bids: [number, number][]; asks: [number, number][]; ts: number };
}

interface GeminiOrderBook {
  bids: Array<{ price: string; amount: string }>;
  asks: Array<{ price: string; amount: string }>;
}

// =============================================================================
// TRANSFORM FUNCTIONS FOR EACH EXCHANGE
// =============================================================================

function transformBinanceOrderBook(data: BinanceOrderBook, symbol: string, exchange: Exchange): OrderBook | null {
  if (!data?.bids?.length || !data?.asks?.length) return null;
  
  const bids: OrderBookEntry[] = data.bids.map(([price, qty]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: Date.now(),
  }));
  
  const asks: OrderBookEntry[] = data.asks.map(([price, qty]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: Date.now(),
  }));
  
  const midPrice = (bids[0].price + asks[0].price) / 2;
  const spread = asks[0].price - bids[0].price;
  
  return { symbol, exchange, bids, asks, timestamp: Date.now(), lastUpdateId: data.lastUpdateId, spread, midPrice };
}

function transformCoinbaseOrderBook(data: CoinbaseOrderBook, symbol: string, exchange: Exchange): OrderBook | null {
  if (!data?.bids?.length || !data?.asks?.length) return null;
  
  const bids: OrderBookEntry[] = data.bids.map(([price, qty, numOrders]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: Date.now(),
    numOrders,
  }));
  
  const asks: OrderBookEntry[] = data.asks.map(([price, qty, numOrders]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: Date.now(),
    numOrders,
  }));
  
  const midPrice = (bids[0].price + asks[0].price) / 2;
  const spread = asks[0].price - bids[0].price;
  
  return { symbol, exchange, bids, asks, timestamp: Date.now(), lastUpdateId: data.sequence, spread, midPrice };
}

function transformKrakenOrderBook(data: KrakenOrderBook, symbol: string, exchange: Exchange): OrderBook | null {
  const result = data?.result;
  if (!result) return null;
  
  const pairData = Object.values(result)[0];
  if (!pairData?.bids?.length || !pairData?.asks?.length) return null;
  
  const bids: OrderBookEntry[] = pairData.bids.map(([price, qty]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: Date.now(),
  }));
  
  const asks: OrderBookEntry[] = pairData.asks.map(([price, qty]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: Date.now(),
  }));
  
  const midPrice = (bids[0].price + asks[0].price) / 2;
  const spread = asks[0].price - bids[0].price;
  
  return { symbol, exchange, bids, asks, timestamp: Date.now(), spread, midPrice };
}

function transformBitfinexOrderBook(rawData: BitfinexOrderBook, symbol: string, exchange: Exchange): OrderBook | null {
  const data = rawData as unknown as [number, number, number][];
  if (!Array.isArray(data) || !data.length) return null;
  
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  
  for (const [price, count, amount] of data) {
    const entry: OrderBookEntry = {
      price: Math.abs(price),
      quantity: Math.abs(amount),
      exchange,
      timestamp: Date.now(),
      numOrders: count,
    };
    
    if (amount > 0) {
      bids.push(entry);
    } else {
      asks.push(entry);
    }
  }
  
  bids.sort((a, b) => b.price - a.price);
  asks.sort((a, b) => a.price - b.price);
  
  if (!bids.length || !asks.length) return null;
  
  const midPrice = (bids[0].price + asks[0].price) / 2;
  const spread = asks[0].price - bids[0].price;
  
  return { symbol, exchange, bids, asks, timestamp: Date.now(), spread, midPrice };
}

function transformBitstampOrderBook(data: BitstampOrderBook, symbol: string, exchange: Exchange): OrderBook | null {
  if (!data?.bids?.length || !data?.asks?.length) return null;
  
  const bids: OrderBookEntry[] = data.bids.map(([price, qty]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: parseInt(data.timestamp) * 1000,
  }));
  
  const asks: OrderBookEntry[] = data.asks.map(([price, qty]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: parseInt(data.timestamp) * 1000,
  }));
  
  const midPrice = (bids[0].price + asks[0].price) / 2;
  const spread = asks[0].price - bids[0].price;
  
  return { symbol, exchange, bids, asks, timestamp: Date.now(), spread, midPrice };
}

function transformOKXOrderBook(data: OKXOrderBook, symbol: string, exchange: Exchange): OrderBook | null {
  const bookData = data?.data?.[0];
  if (!bookData?.bids?.length || !bookData?.asks?.length) return null;
  
  const bids: OrderBookEntry[] = bookData.bids.map(([price, qty, , numOrders]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: Date.now(),
    numOrders: parseInt(numOrders),
  }));
  
  const asks: OrderBookEntry[] = bookData.asks.map(([price, qty, , numOrders]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: Date.now(),
    numOrders: parseInt(numOrders),
  }));
  
  const midPrice = (bids[0].price + asks[0].price) / 2;
  const spread = asks[0].price - bids[0].price;
  
  return { symbol, exchange, bids, asks, timestamp: Date.now(), spread, midPrice };
}

function transformBybitOrderBook(data: BybitOrderBook, symbol: string, exchange: Exchange): OrderBook | null {
  const result = data?.result;
  if (!result?.b?.length || !result?.a?.length) return null;
  
  const bids: OrderBookEntry[] = result.b.map(([price, qty]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: result.ts,
  }));
  
  const asks: OrderBookEntry[] = result.a.map(([price, qty]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: result.ts,
  }));
  
  const midPrice = (bids[0].price + asks[0].price) / 2;
  const spread = asks[0].price - bids[0].price;
  
  return { symbol, exchange, bids, asks, timestamp: Date.now(), spread, midPrice };
}

function transformKucoinOrderBook(data: KucoinOrderBook, symbol: string, exchange: Exchange): OrderBook | null {
  const bookData = data?.data;
  if (!bookData?.bids?.length || !bookData?.asks?.length) return null;
  
  const bids: OrderBookEntry[] = bookData.bids.map(([price, qty]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: bookData.time,
  }));
  
  const asks: OrderBookEntry[] = bookData.asks.map(([price, qty]) => ({
    price: parseFloat(price),
    quantity: parseFloat(qty),
    exchange,
    timestamp: bookData.time,
  }));
  
  const midPrice = (bids[0].price + asks[0].price) / 2;
  const spread = asks[0].price - bids[0].price;
  
  return { symbol, exchange, bids, asks, timestamp: Date.now(), spread, midPrice };
}

function transformHuobiOrderBook(data: HuobiOrderBook, symbol: string, exchange: Exchange): OrderBook | null {
  const tick = data?.tick;
  if (!tick?.bids?.length || !tick?.asks?.length) return null;
  
  const bids: OrderBookEntry[] = tick.bids.map(([price, qty]) => ({
    price,
    quantity: qty,
    exchange,
    timestamp: tick.ts,
  }));
  
  const asks: OrderBookEntry[] = tick.asks.map(([price, qty]) => ({
    price,
    quantity: qty,
    exchange,
    timestamp: tick.ts,
  }));
  
  const midPrice = (bids[0].price + asks[0].price) / 2;
  const spread = asks[0].price - bids[0].price;
  
  return { symbol, exchange, bids, asks, timestamp: Date.now(), spread, midPrice };
}

function transformGeminiOrderBook(data: GeminiOrderBook, symbol: string, exchange: Exchange): OrderBook | null {
  if (!data?.bids?.length || !data?.asks?.length) return null;
  
  const bids: OrderBookEntry[] = data.bids.map(({ price, amount }) => ({
    price: parseFloat(price),
    quantity: parseFloat(amount),
    exchange,
    timestamp: Date.now(),
  }));
  
  const asks: OrderBookEntry[] = data.asks.map(({ price, amount }) => ({
    price: parseFloat(price),
    quantity: parseFloat(amount),
    exchange,
    timestamp: Date.now(),
  }));
  
  const midPrice = (bids[0].price + asks[0].price) / 2;
  const spread = asks[0].price - bids[0].price;
  
  return { symbol, exchange, bids, asks, timestamp: Date.now(), spread, midPrice };
}

// =============================================================================
// ORDER BOOK FETCHING - REAL EXCHANGE APIs
// =============================================================================

/**
 * Fetch order book from a specific exchange using real APIs
 */
export async function fetchOrderBook(
  symbol: string,
  exchange: Exchange,
  depth: number = 25
): Promise<OrderBook | null> {
  const cacheKey = `orderbook:${exchange}:${symbol}`;
  
  // Check cache first (short TTL for real-time data)
  const cached = await aiCache.get<OrderBook>(cacheKey);
  if (cached) return cached;
  
  const config = EXCHANGE_CONFIGS[exchange];
  if (!config) {
    console.error(`Exchange ${exchange} not configured`);
    return null;
  }
  
  try {
    const endpoint = config.orderBookEndpoint(symbol, depth);
    const url = `${config.baseUrl}${endpoint}`;
    
    const response = await resilientFetchResponse(url, {
      service: `orderbook-${exchange}`,
      timeoutMs: 5_000,
      retries: 1,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FreeCryptoNews/1.0',
      },
      next: { revalidate: 5 }, // Cache for 5 seconds
    });
    
    if (!response.ok) {
      console.error(`${exchange} API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    const orderBook = config.transform(data, symbol, exchange);
    
    if (!orderBook) {
      console.error(`Failed to transform ${exchange} order book data`);
      return null;
    }
    
    // Limit depth
    orderBook.bids = orderBook.bids.slice(0, depth);
    orderBook.asks = orderBook.asks.slice(0, depth);
    
    await aiCache.set(cacheKey, orderBook, CACHE_TTL);
    return orderBook;
  } catch (error) {
    console.error(`Failed to fetch order book from ${exchange}:`, error);
    return null;
  }
}

/**
 * Fetch order books from multiple exchanges
 */
export async function fetchMultipleOrderBooks(
  symbol: string,
  exchanges: Exchange[],
  depth: number = 25
): Promise<Map<Exchange, OrderBook>> {
  const results = new Map<Exchange, OrderBook>();
  
  const promises = exchanges.map(async (exchange) => {
    const book = await fetchOrderBook(symbol, exchange, depth);
    if (book) {
      results.set(exchange, book);
    }
  });
  
  await Promise.all(promises);
  return results;
}

// =============================================================================
// ORDER BOOK AGGREGATION
// =============================================================================

/**
 * Aggregate order books from multiple exchanges
 */
export async function aggregateOrderBooks(
  symbol: string,
  exchanges: Exchange[] = ['binance', 'coinbase', 'kraken', 'okx', 'bybit']
): Promise<AggregatedOrderBook> {
  const orderBooks = await fetchMultipleOrderBooks(symbol, exchanges);
  
  // Collect all bids and asks
  const allBids: OrderBookEntry[] = [];
  const allAsks: OrderBookEntry[] = [];
  const exchangeData: ExchangeSummary[] = [];
  
  for (const [exchange, book] of orderBooks) {
    allBids.push(...book.bids);
    allAsks.push(...book.asks);
    
    // Calculate exchange summary
    const bidDepth5 = book.bids.slice(0, 5).reduce((s, e) => s + e.quantity * e.price, 0);
    const askDepth5 = book.asks.slice(0, 5).reduce((s, e) => s + e.quantity * e.price, 0);
    const bidDepth10 = book.bids.slice(0, 10).reduce((s, e) => s + e.quantity * e.price, 0);
    const askDepth10 = book.asks.slice(0, 10).reduce((s, e) => s + e.quantity * e.price, 0);
    
    exchangeData.push({
      exchange,
      bestBid: book.bids[0]?.price || 0,
      bestAsk: book.asks[0]?.price || 0,
      spread: book.spread,
      bidDepth5,
      askDepth5,
      bidDepth10,
      askDepth10,
      totalBidLiquidity: book.bids.reduce((s, e) => s + e.quantity * e.price, 0),
      totalAskLiquidity: book.asks.reduce((s, e) => s + e.quantity * e.price, 0),
      lastUpdate: book.timestamp,
      status: 'online',
    });
  }
  
  // Sort by price
  allBids.sort((a, b) => b.price - a.price); // Highest first
  allAsks.sort((a, b) => a.price - b.price); // Lowest first
  
  // Find NBBO
  const bestBid = allBids[0] || null;
  const bestAsk = allAsks[0] || null;
  const midPrice = bestBid && bestAsk 
    ? (bestBid.price + bestAsk.price) / 2 
    : bestBid?.price || bestAsk?.price || 0;
  const spread = bestBid && bestAsk ? bestAsk.price - bestBid.price : 0;
  const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0;
  
  // Aggregate levels
  const aggregatedBids = aggregateLevels(allBids, 'bid', midPrice);
  const aggregatedAsks = aggregateLevels(allAsks, 'ask', midPrice);
  
  // Calculate metrics
  const metrics = calculateMetrics(
    allBids,
    allAsks,
    aggregatedBids,
    aggregatedAsks,
    exchangeData,
    midPrice
  );
  
  return {
    symbol,
    timestamp: Date.now(),
    exchanges: Array.from(orderBooks.keys()),
    nbbo: {
      bestBid,
      bestAsk,
      spread,
      spreadPercent,
      midPrice,
    },
    aggregatedBids,
    aggregatedAsks,
    exchangeData,
    metrics,
  };
}

function aggregateLevels(
  entries: OrderBookEntry[],
  side: 'bid' | 'ask',
  midPrice: number,
  bucketSize: number = 0.001 // 0.1% price buckets
): AggregatedLevel[] {
  const buckets = new Map<number, OrderBookEntry[]>();
  
  // Group by price bucket
  for (const entry of entries) {
    const bucketPrice = side === 'bid'
      ? Math.floor(entry.price / (midPrice * bucketSize)) * (midPrice * bucketSize)
      : Math.ceil(entry.price / (midPrice * bucketSize)) * (midPrice * bucketSize);
    
    if (!buckets.has(bucketPrice)) {
      buckets.set(bucketPrice, []);
    }
    buckets.get(bucketPrice)!.push(entry);
  }
  
  // Convert to aggregated levels
  const levels: AggregatedLevel[] = [];
  let cumulativeQuantity = 0;
  let cumulativeValue = 0;
  
  const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => 
    side === 'bid' ? b[0] - a[0] : a[0] - b[0]
  );
  
  for (const [price, bucketEntries] of sortedBuckets) {
    const totalQuantity = bucketEntries.reduce((s, e) => s + e.quantity, 0);
    const totalValue = bucketEntries.reduce((s, e) => s + e.quantity * e.price, 0);
    
    cumulativeQuantity += totalQuantity;
    cumulativeValue += totalValue;
    
    // Calculate contributions per exchange
    const exchangeContributions = new Map<Exchange, number>();
    for (const entry of bucketEntries) {
      exchangeContributions.set(
        entry.exchange,
        (exchangeContributions.get(entry.exchange) || 0) + entry.quantity
      );
    }
    
    const contributions = Array.from(exchangeContributions.entries()).map(([exchange, quantity]) => ({
      exchange,
      quantity,
      percentage: totalQuantity > 0 ? (quantity / totalQuantity) * 100 : 0,
    }));
    
    levels.push({
      price,
      totalQuantity,
      totalValue,
      contributions,
      cumulativeQuantity,
      cumulativeValue,
    });
  }
  
  return levels.slice(0, 50); // Limit to 50 levels
}

function calculateMetrics(
  allBids: OrderBookEntry[],
  allAsks: OrderBookEntry[],
  aggregatedBids: AggregatedLevel[],
  aggregatedAsks: AggregatedLevel[],
  exchangeData: ExchangeSummary[],
  midPrice: number
): OrderBookMetrics {
  // Imbalance
  const totalBidValue = allBids.reduce((s, e) => s + e.quantity * e.price, 0);
  const totalAskValue = allAsks.reduce((s, e) => s + e.quantity * e.price, 0);
  const imbalanceRatio = totalAskValue > 0 ? totalBidValue / totalAskValue : 1;
  const imbalancePercent = ((imbalanceRatio - 1) / (imbalanceRatio + 1)) * 100;
  
  // Liquidity within price ranges
  const bidLiquidity1Percent = allBids
    .filter(b => b.price >= midPrice * 0.99)
    .reduce((s, e) => s + e.quantity * e.price, 0);
  const askLiquidity1Percent = allAsks
    .filter(a => a.price <= midPrice * 1.01)
    .reduce((s, e) => s + e.quantity * e.price, 0);
  const bidLiquidity2Percent = allBids
    .filter(b => b.price >= midPrice * 0.98)
    .reduce((s, e) => s + e.quantity * e.price, 0);
  const askLiquidity2Percent = allAsks
    .filter(a => a.price <= midPrice * 1.02)
    .reduce((s, e) => s + e.quantity * e.price, 0);
  
  // Spread analysis
  const spreads = exchangeData.map(e => e.spread);
  const avgSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length;
  const minSpread = Math.min(...spreads);
  const maxSpread = Math.max(...spreads);
  const spreadStdDev = Math.sqrt(
    spreads.reduce((s, v) => s + Math.pow(v - avgSpread, 2), 0) / spreads.length
  );
  
  // Depth score (0-100)
  const avgLiquidity = (bidLiquidity1Percent + askLiquidity1Percent) / 2;
  const depthScore = Math.min(100, avgLiquidity / 10000); // $1M = 100
  
  // Slippage estimates
  const slippageEstimate1k = estimateSlippage(allBids, allAsks, 1000, midPrice);
  const slippageEstimate10k = estimateSlippage(allBids, allAsks, 10000, midPrice);
  const slippageEstimate100k = estimateSlippage(allBids, allAsks, 100000, midPrice);
  
  // Detect whale orders
  const whaleOrders = detectWhaleOrders(allBids, allAsks, midPrice);
  
  // Detect price walls
  const priceWalls = detectPriceWalls(aggregatedBids, aggregatedAsks);
  
  return {
    imbalanceRatio,
    imbalancePercent,
    bidLiquidity1Percent,
    askLiquidity1Percent,
    bidLiquidity2Percent,
    askLiquidity2Percent,
    avgSpread,
    minSpread,
    maxSpread,
    spreadStdDev,
    depthScore,
    slippageEstimate1k,
    slippageEstimate10k,
    slippageEstimate100k,
    whaleOrders,
    priceWalls,
  };
}

function estimateSlippage(
  bids: OrderBookEntry[],
  asks: OrderBookEntry[],
  orderSizeUsd: number,
  midPrice: number
): number {
  // Estimate buy side slippage
  let remaining = orderSizeUsd;
  let totalCost = 0;
  
  for (const ask of asks) {
    const levelValue = ask.quantity * ask.price;
    if (levelValue >= remaining) {
      totalCost += remaining;
      remaining = 0;
      break;
    } else {
      totalCost += levelValue;
      remaining -= levelValue;
    }
  }
  
  if (remaining > 0) {
    // Not enough liquidity
    return 100; // 100% slippage (can't fill)
  }
  
  const avgExecutionPrice = totalCost / orderSizeUsd * midPrice;
  const slippage = ((avgExecutionPrice - asks[0]?.price || midPrice) / midPrice) * 100;
  
  return Math.abs(slippage);
}

function detectWhaleOrders(
  bids: OrderBookEntry[],
  asks: OrderBookEntry[],
  _midPrice: number
): WhaleOrder[] {
  const whales: WhaleOrder[] = [];
  
  const totalBidValue = bids.reduce((s, e) => s + e.quantity * e.price, 0);
  const totalAskValue = asks.reduce((s, e) => s + e.quantity * e.price, 0);
  
  for (const bid of bids) {
    const value = bid.quantity * bid.price;
    if (value >= WHALE_THRESHOLD_USD) {
      whales.push({
        exchange: bid.exchange,
        side: 'bid',
        price: bid.price,
        quantity: bid.quantity,
        value,
        percentOfDepth: (value / totalBidValue) * 100,
      });
    }
  }
  
  for (const ask of asks) {
    const value = ask.quantity * ask.price;
    if (value >= WHALE_THRESHOLD_USD) {
      whales.push({
        exchange: ask.exchange,
        side: 'ask',
        price: ask.price,
        quantity: ask.quantity,
        value,
        percentOfDepth: (value / totalAskValue) * 100,
      });
    }
  }
  
  return whales.sort((a, b) => b.value - a.value).slice(0, 10);
}

function detectPriceWalls(
  aggregatedBids: AggregatedLevel[],
  aggregatedAsks: AggregatedLevel[]
): PriceWall[] {
  const walls: PriceWall[] = [];
  
  // Find bid walls
  const avgBidQuantity = aggregatedBids.reduce((s, l) => s + l.totalQuantity, 0) / aggregatedBids.length;
  for (const level of aggregatedBids) {
    if (level.totalQuantity > avgBidQuantity * 3) {
      walls.push({
        side: 'bid',
        price: level.price,
        totalQuantity: level.totalQuantity,
        exchanges: level.contributions.map(c => c.exchange),
        strength: level.totalQuantity > avgBidQuantity * 10 ? 'strong' :
                 level.totalQuantity > avgBidQuantity * 5 ? 'moderate' : 'weak',
      });
    }
  }
  
  // Find ask walls
  const avgAskQuantity = aggregatedAsks.reduce((s, l) => s + l.totalQuantity, 0) / aggregatedAsks.length;
  for (const level of aggregatedAsks) {
    if (level.totalQuantity > avgAskQuantity * 3) {
      walls.push({
        side: 'ask',
        price: level.price,
        totalQuantity: level.totalQuantity,
        exchanges: level.contributions.map(c => c.exchange),
        strength: level.totalQuantity > avgAskQuantity * 10 ? 'strong' :
                 level.totalQuantity > avgAskQuantity * 5 ? 'moderate' : 'weak',
      });
    }
  }
  
  return walls;
}

// =============================================================================
// SMART ORDER ROUTING
// =============================================================================

/**
 * Calculate optimal order routing across exchanges
 */
export async function calculateSmartRoute(
  symbol: string,
  orderType: 'buy' | 'sell',
  quantity: number,
  exchanges: Exchange[] = ['binance', 'coinbase', 'kraken', 'okx', 'bybit']
): Promise<SmartRoutingRecommendation> {
  const aggregated = await aggregateOrderBooks(symbol, exchanges);
  
  const routes: RouteRecommendation[] = [];
  let remainingQuantity = quantity;
  let totalCost = 0;
  
  // Use asks for buy orders, bids for sell orders
  const levels = orderType === 'buy' 
    ? [...aggregated.aggregatedAsks]
    : [...aggregated.aggregatedBids];
  
  for (const level of levels) {
    if (remainingQuantity <= 0) break;
    
    // Allocate across exchanges at this level
    for (const contribution of level.contributions) {
      if (remainingQuantity <= 0) break;
      
      const availableQuantity = Math.min(contribution.quantity, remainingQuantity);
      const value = availableQuantity * level.price;
      
      routes.push({
        exchange: contribution.exchange,
        quantity: availableQuantity,
        price: level.price,
        value,
        percentOfOrder: (availableQuantity / quantity) * 100,
        reason: `Best price at ${level.price.toFixed(2)} on ${contribution.exchange}`,
      });
      
      remainingQuantity -= availableQuantity;
      totalCost += value;
    }
  }
  
  // Calculate expected slippage
  const avgPrice = totalCost / (quantity - remainingQuantity);
  const startPrice = orderType === 'buy' 
    ? aggregated.nbbo.bestAsk?.price || avgPrice
    : aggregated.nbbo.bestBid?.price || avgPrice;
  const slippage = Math.abs((avgPrice - startPrice) / startPrice) * 100;
  
  // Estimate fees (0.1% avg)
  const estimatedFees = totalCost * 0.001;
  
  return {
    symbol,
    orderType,
    totalQuantity: quantity - remainingQuantity,
    routes,
    expectedSlippage: slippage,
    expectedCost: totalCost,
    estimatedFees,
  };
}

// =============================================================================
// SNAPSHOT MANAGEMENT
// =============================================================================

/**
 * Save order book snapshot
 */
export async function saveSnapshot(
  aggregatedBook: AggregatedOrderBook
): Promise<OrderBookSnapshot> {
  const id = `obs_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  
  const snapshot: OrderBookSnapshot = {
    id,
    symbol: aggregatedBook.symbol,
    timestamp: new Date(aggregatedBook.timestamp).toISOString(),
    aggregatedBook,
  };
  
  await db.saveDocument(SNAPSHOTS_COLLECTION, id, snapshot);
  return snapshot;
}

/**
 * Get snapshot by ID
 */
export async function getSnapshot(id: string): Promise<OrderBookSnapshot | null> {
  const doc = await db.getDocument<OrderBookSnapshot>(SNAPSHOTS_COLLECTION, id);
  return doc?.data || null;
}

/**
 * List recent snapshots
 */
export async function listSnapshots(options: {
  symbol?: string;
  limit?: number;
} = {}): Promise<OrderBookSnapshot[]> {
  const docs = await db.listDocuments<OrderBookSnapshot>(SNAPSHOTS_COLLECTION, {
    limit: options.limit || 100,
  });
  
  let snapshots = docs.map(d => d.data);
  
  if (options.symbol) {
    snapshots = snapshots.filter(s => s.symbol === options.symbol);
  }
  
  return snapshots.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

// =============================================================================
// DEPTH CHART DATA
// =============================================================================

export interface DepthChartData {
  bids: Array<{ price: number; cumulative: number }>;
  asks: Array<{ price: number; cumulative: number }>;
  midPrice: number;
  symbol: string;
}

/**
 * Generate depth chart data for visualization
 */
export async function getDepthChartData(
  symbol: string,
  exchanges?: Exchange[]
): Promise<DepthChartData> {
  const aggregated = await aggregateOrderBooks(symbol, exchanges);
  
  return {
    bids: aggregated.aggregatedBids.map(l => ({
      price: l.price,
      cumulative: l.cumulativeValue,
    })),
    asks: aggregated.aggregatedAsks.map(l => ({
      price: l.price,
      cumulative: l.cumulativeValue,
    })),
    midPrice: aggregated.nbbo.midPrice,
    symbol,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export const orderBook = {
  // Fetching
  fetchOrderBook,
  fetchMultipleOrderBooks,
  
  // Aggregation
  aggregateOrderBooks,
  
  // Routing
  calculateSmartRoute,
  
  // Snapshots
  saveSnapshot,
  getSnapshot,
  listSnapshots,
  
  // Visualization
  getDepthChartData,
};

export default orderBook;
