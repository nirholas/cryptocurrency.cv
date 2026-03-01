/**
 * Multi-Exchange Order Book Aggregator
 * 
 * Enterprise-grade order book aggregation across major crypto exchanges.
 * Provides unified depth, spread analysis, and liquidity insights.
 * 
 * Features:
 * - Real-time order book fetching from 6+ exchanges
 * - Unified depth aggregation with price normalization
 * - Spread analysis and best bid/ask across exchanges
 * - Liquidity depth calculation
 * - Slippage estimation for large orders
 * - Order book imbalance detection
 * - Support for spot and perpetual markets
 * 
 * Free APIs Used:
 * - Binance: api.binance.com (public)
 * - Bybit: api.bybit.com (public)
 * - OKX: okx.com/api/v5 (public)
 * - Kraken: api.kraken.com (public)
 * - KuCoin: api.kucoin.com (public)
 * - Coinbase: api.exchange.coinbase.com (public)
 * 
 * @module orderbook-aggregator
 */

// =============================================================================
// TYPES
// =============================================================================

export interface OrderBookLevel {
  price: number;
  quantity: number;
  total: number;        // Cumulative quantity
  valueUsd: number;     // USD value at this level
}

export interface ExchangeOrderBook {
  exchange: string;
  symbol: string;
  timestamp: number;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  spread: number;
  spreadPercent: number;
  midPrice: number;
  bidDepthUsd: number;
  askDepthUsd: number;
  lastUpdate: string;
}

export interface AggregatedOrderBook {
  symbol: string;
  timestamp: number;
  exchanges: string[];
  bids: AggregatedLevel[];
  asks: AggregatedLevel[];
  bestBid: BestPrice;
  bestAsk: BestPrice;
  spread: number;
  spreadPercent: number;
  midPrice: number;
  totalBidDepthUsd: number;
  totalAskDepthUsd: number;
  imbalance: number;        // -1 to 1 (negative = more sells, positive = more buys)
  exchangeBreakdown: ExchangeDepth[];
}

export interface AggregatedLevel {
  price: number;
  quantity: number;
  valueUsd: number;
  exchanges: Array<{
    exchange: string;
    quantity: number;
  }>;
}

export interface BestPrice {
  price: number;
  quantity: number;
  exchange: string;
}

export interface ExchangeDepth {
  exchange: string;
  bidDepthUsd: number;
  askDepthUsd: number;
  bidPercent: number;
  askPercent: number;
  spread: number;
  latency: number;
}

export interface SlippageEstimate {
  symbol: string;
  side: 'buy' | 'sell';
  orderSizeUsd: number;
  averagePrice: number;
  slippagePercent: number;
  slippageUsd: number;
  levelsConsumed: number;
  exchangeBreakdown: Array<{
    exchange: string;
    filledUsd: number;
    avgPrice: number;
  }>;
}

export interface LiquidityAnalysis {
  symbol: string;
  timestamp: number;
  depth1Percent: { bid: number; ask: number };  // Liquidity within 1%
  depth2Percent: { bid: number; ask: number };  // Liquidity within 2%
  depth5Percent: { bid: number; ask: number };  // Liquidity within 5%
  depth10Percent: { bid: number; ask: number }; // Liquidity within 10%
  bidAskRatio: number;
  liquidityScore: number;  // 0-100
  recommendation: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const EXCHANGE_ENDPOINTS = {
  binance: {
    spot: 'https://api.binance.com/api/v3/depth',
    futures: 'https://fapi.binance.com/fapi/v1/depth',
  },
  bybit: {
    spot: 'https://api.bybit.com/v5/market/orderbook',
    futures: 'https://api.bybit.com/v5/market/orderbook',
  },
  okx: {
    spot: 'https://www.okx.com/api/v5/market/books',
    futures: 'https://www.okx.com/api/v5/market/books',
  },
  kraken: {
    spot: 'https://api.kraken.com/0/public/Depth',
  },
  kucoin: {
    spot: 'https://api.kucoin.com/api/v1/market/orderbook/level2_100',
  },
  coinbase: {
    spot: 'https://api.exchange.coinbase.com/products',
  },
};

// Symbol mappings for each exchange
const SYMBOL_MAPPINGS: Record<string, Record<string, string>> = {
  binance: {
    BTC: 'BTCUSDT',
    ETH: 'ETHUSDT',
    SOL: 'SOLUSDT',
    BNB: 'BNBUSDT',
    XRP: 'XRPUSDT',
    ADA: 'ADAUSDT',
    DOGE: 'DOGEUSDT',
    AVAX: 'AVAXUSDT',
  },
  bybit: {
    BTC: 'BTCUSDT',
    ETH: 'ETHUSDT',
    SOL: 'SOLUSDT',
    BNB: 'BNBUSDT',
    XRP: 'XRPUSDT',
    ADA: 'ADAUSDT',
    DOGE: 'DOGEUSDT',
    AVAX: 'AVAXUSDT',
  },
  okx: {
    BTC: 'BTC-USDT',
    ETH: 'ETH-USDT',
    SOL: 'SOL-USDT',
    BNB: 'BNB-USDT',
    XRP: 'XRP-USDT',
    ADA: 'ADA-USDT',
    DOGE: 'DOGE-USDT',
    AVAX: 'AVAX-USDT',
  },
  kraken: {
    BTC: 'XXBTZUSD',
    ETH: 'XETHZUSD',
    SOL: 'SOLUSD',
    XRP: 'XXRPZUSD',
    ADA: 'ADAUSD',
    DOGE: 'XDGUSD',
    AVAX: 'AVAXUSD',
  },
  kucoin: {
    BTC: 'BTC-USDT',
    ETH: 'ETH-USDT',
    SOL: 'SOL-USDT',
    BNB: 'BNB-USDT',
    XRP: 'XRP-USDT',
    ADA: 'ADA-USDT',
    DOGE: 'DOGE-USDT',
    AVAX: 'AVAX-USDT',
  },
  coinbase: {
    BTC: 'BTC-USD',
    ETH: 'ETH-USD',
    SOL: 'SOL-USD',
    XRP: 'XRP-USD',
    ADA: 'ADA-USD',
    DOGE: 'DOGE-USD',
    AVAX: 'AVAX-USD',
  },
};

// Default depth limit
const DEFAULT_DEPTH = 100;

// Cache for order books
const orderBookCache = new Map<string, { data: ExchangeOrderBook; timestamp: number }>();
const CACHE_TTL = 1000; // 1 second - order books are very time-sensitive

// =============================================================================
// EXCHANGE FETCHERS
// =============================================================================

async function fetchBinanceOrderBook(
  symbol: string,
  market: 'spot' | 'futures' = 'spot'
): Promise<ExchangeOrderBook | null> {
  const exchangeSymbol = SYMBOL_MAPPINGS.binance[symbol];
  if (!exchangeSymbol) return null;

  const startTime = Date.now();
  try {
    const endpoint = market === 'spot' 
      ? EXCHANGE_ENDPOINTS.binance.spot 
      : EXCHANGE_ENDPOINTS.binance.futures;
    
    const response = await fetch(
      `${endpoint}?symbol=${exchangeSymbol}&limit=${DEFAULT_DEPTH}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const latency = Date.now() - startTime;

    const bids = parseLevels(data.bids);
    const asks = parseLevels(data.asks);
    
    return buildOrderBook('binance', symbol, bids, asks, latency);
  } catch (error) {
    console.error('Binance order book error:', error);
    return null;
  }
}

async function fetchBybitOrderBook(
  symbol: string,
  market: 'spot' | 'futures' = 'spot'
): Promise<ExchangeOrderBook | null> {
  const exchangeSymbol = SYMBOL_MAPPINGS.bybit[symbol];
  if (!exchangeSymbol) return null;

  const startTime = Date.now();
  try {
    const category = market === 'spot' ? 'spot' : 'linear';
    const response = await fetch(
      `${EXCHANGE_ENDPOINTS.bybit.spot}?category=${category}&symbol=${exchangeSymbol}&limit=${DEFAULT_DEPTH}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const latency = Date.now() - startTime;

    if (data.retCode !== 0 || !data.result) return null;

    const bids = data.result.b.map((level: [string, string]) => ({
      price: parseFloat(level[0]),
      quantity: parseFloat(level[1]),
    }));
    
    const asks = data.result.a.map((level: [string, string]) => ({
      price: parseFloat(level[0]),
      quantity: parseFloat(level[1]),
    }));

    return buildOrderBook('bybit', symbol, bids, asks, latency);
  } catch (error) {
    console.error('Bybit order book error:', error);
    return null;
  }
}

async function fetchOKXOrderBook(
  symbol: string,
  market: 'spot' | 'futures' = 'spot'
): Promise<ExchangeOrderBook | null> {
  const exchangeSymbol = SYMBOL_MAPPINGS.okx[symbol];
  if (!exchangeSymbol) return null;

  const startTime = Date.now();
  try {
    const instId = market === 'spot' 
      ? exchangeSymbol 
      : exchangeSymbol.replace('-USDT', '-USDT-SWAP');
    
    const response = await fetch(
      `${EXCHANGE_ENDPOINTS.okx.spot}?instId=${instId}&sz=${DEFAULT_DEPTH}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const latency = Date.now() - startTime;

    if (data.code !== '0' || !data.data?.[0]) return null;

    const bookData = data.data[0];
    const bids = bookData.bids.map((level: string[]) => ({
      price: parseFloat(level[0]),
      quantity: parseFloat(level[1]),
    }));
    
    const asks = bookData.asks.map((level: string[]) => ({
      price: parseFloat(level[0]),
      quantity: parseFloat(level[1]),
    }));

    return buildOrderBook('okx', symbol, bids, asks, latency);
  } catch (error) {
    console.error('OKX order book error:', error);
    return null;
  }
}

async function fetchKrakenOrderBook(symbol: string): Promise<ExchangeOrderBook | null> {
  const exchangeSymbol = SYMBOL_MAPPINGS.kraken[symbol];
  if (!exchangeSymbol) return null;

  const startTime = Date.now();
  try {
    const response = await fetch(
      `${EXCHANGE_ENDPOINTS.kraken.spot}?pair=${exchangeSymbol}&count=${DEFAULT_DEPTH}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const latency = Date.now() - startTime;

    if (data.error?.length > 0) return null;

    const pairData = Object.values(data.result)[0] as { bids: string[][]; asks: string[][] };
    
    const bids = pairData.bids.map((level: string[]) => ({
      price: parseFloat(level[0]),
      quantity: parseFloat(level[1]),
    }));
    
    const asks = pairData.asks.map((level: string[]) => ({
      price: parseFloat(level[0]),
      quantity: parseFloat(level[1]),
    }));

    return buildOrderBook('kraken', symbol, bids, asks, latency);
  } catch (error) {
    console.error('Kraken order book error:', error);
    return null;
  }
}

async function fetchKuCoinOrderBook(symbol: string): Promise<ExchangeOrderBook | null> {
  const exchangeSymbol = SYMBOL_MAPPINGS.kucoin[symbol];
  if (!exchangeSymbol) return null;

  const startTime = Date.now();
  try {
    const response = await fetch(
      `${EXCHANGE_ENDPOINTS.kucoin.spot}?symbol=${exchangeSymbol}`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const latency = Date.now() - startTime;

    if (data.code !== '200000' || !data.data) return null;

    const bids = data.data.bids.slice(0, DEFAULT_DEPTH).map((level: string[]) => ({
      price: parseFloat(level[0]),
      quantity: parseFloat(level[1]),
    }));
    
    const asks = data.data.asks.slice(0, DEFAULT_DEPTH).map((level: string[]) => ({
      price: parseFloat(level[0]),
      quantity: parseFloat(level[1]),
    }));

    return buildOrderBook('kucoin', symbol, bids, asks, latency);
  } catch (error) {
    console.error('KuCoin order book error:', error);
    return null;
  }
}

async function fetchCoinbaseOrderBook(symbol: string): Promise<ExchangeOrderBook | null> {
  const exchangeSymbol = SYMBOL_MAPPINGS.coinbase[symbol];
  if (!exchangeSymbol) return null;

  const startTime = Date.now();
  try {
    const response = await fetch(
      `${EXCHANGE_ENDPOINTS.coinbase.spot}/${exchangeSymbol}/book?level=2`
    );
    
    if (!response.ok) return null;
    
    const data = await response.json();
    const latency = Date.now() - startTime;

    const bids = data.bids.slice(0, DEFAULT_DEPTH).map((level: string[]) => ({
      price: parseFloat(level[0]),
      quantity: parseFloat(level[1]),
    }));
    
    const asks = data.asks.slice(0, DEFAULT_DEPTH).map((level: string[]) => ({
      price: parseFloat(level[0]),
      quantity: parseFloat(level[1]),
    }));

    return buildOrderBook('coinbase', symbol, bids, asks, latency);
  } catch (error) {
    console.error('Coinbase order book error:', error);
    return null;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function parseLevels(levels: [string, string][]): Array<{ price: number; quantity: number }> {
  return levels.map(([price, quantity]) => ({
    price: parseFloat(price),
    quantity: parseFloat(quantity),
  }));
}

function buildOrderBook(
  exchange: string,
  symbol: string,
  bids: Array<{ price: number; quantity: number }>,
  asks: Array<{ price: number; quantity: number }>,
  latency: number
): ExchangeOrderBook {
  const bestBid = bids[0]?.price || 0;
  const bestAsk = asks[0]?.price || 0;
  const midPrice = (bestBid + bestAsk) / 2;
  const spread = bestAsk - bestBid;
  const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0;

  // Calculate cumulative totals and USD values
  let bidTotal = 0;
  let askTotal = 0;
  let bidDepthUsd = 0;
  let askDepthUsd = 0;

  const processedBids: OrderBookLevel[] = bids.map(level => {
    bidTotal += level.quantity;
    const valueUsd = level.quantity * level.price;
    bidDepthUsd += valueUsd;
    return {
      price: level.price,
      quantity: level.quantity,
      total: bidTotal,
      valueUsd,
    };
  });

  const processedAsks: OrderBookLevel[] = asks.map(level => {
    askTotal += level.quantity;
    const valueUsd = level.quantity * level.price;
    askDepthUsd += valueUsd;
    return {
      price: level.price,
      quantity: level.quantity,
      total: askTotal,
      valueUsd,
    };
  });

  return {
    exchange,
    symbol,
    timestamp: Date.now(),
    bids: processedBids,
    asks: processedAsks,
    spread,
    spreadPercent,
    midPrice,
    bidDepthUsd,
    askDepthUsd,
    lastUpdate: new Date().toISOString(),
  };
}

// =============================================================================
// AGGREGATION FUNCTIONS
// =============================================================================

/**
 * Fetch order books from all exchanges for a symbol
 */
export async function fetchAllOrderBooks(
  symbol: string,
  market: 'spot' | 'futures' = 'spot',
  exchanges?: string[]
): Promise<ExchangeOrderBook[]> {
  const enabledExchanges = exchanges || ['binance', 'bybit', 'okx', 'kraken', 'kucoin', 'coinbase'];
  
  const fetchPromises: Promise<ExchangeOrderBook | null>[] = [];

  for (const exchange of enabledExchanges) {
    // Check cache first
    const cacheKey = `${exchange}:${symbol}:${market}`;
    const cached = orderBookCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      fetchPromises.push(Promise.resolve(cached.data));
      continue;
    }

    switch (exchange) {
      case 'binance':
        fetchPromises.push(fetchBinanceOrderBook(symbol, market));
        break;
      case 'bybit':
        fetchPromises.push(fetchBybitOrderBook(symbol, market));
        break;
      case 'okx':
        fetchPromises.push(fetchOKXOrderBook(symbol, market));
        break;
      case 'kraken':
        if (market === 'spot') fetchPromises.push(fetchKrakenOrderBook(symbol));
        break;
      case 'kucoin':
        if (market === 'spot') fetchPromises.push(fetchKuCoinOrderBook(symbol));
        break;
      case 'coinbase':
        if (market === 'spot') fetchPromises.push(fetchCoinbaseOrderBook(symbol));
        break;
    }
  }

  const results = await Promise.all(fetchPromises);
  const orderBooks = results.filter((ob): ob is ExchangeOrderBook => ob !== null);

  // Update cache
  for (const ob of orderBooks) {
    const cacheKey = `${ob.exchange}:${symbol}:${market}`;
    orderBookCache.set(cacheKey, { data: ob, timestamp: Date.now() });
  }

  return orderBooks;
}

/**
 * Aggregate order books from multiple exchanges
 */
export async function getAggregatedOrderBook(
  symbol: string,
  market: 'spot' | 'futures' = 'spot',
  exchanges?: string[]
): Promise<AggregatedOrderBook> {
  const orderBooks = await fetchAllOrderBooks(symbol, market, exchanges);

  if (orderBooks.length === 0) {
    return {
      symbol,
      timestamp: Date.now(),
      exchanges: [],
      bids: [],
      asks: [],
      bestBid: { price: 0, quantity: 0, exchange: 'none' },
      bestAsk: { price: 0, quantity: 0, exchange: 'none' },
      spread: 0,
      spreadPercent: 0,
      midPrice: 0,
      totalBidDepthUsd: 0,
      totalAskDepthUsd: 0,
      imbalance: 0,
      exchangeBreakdown: [],
    };
  }

  // Aggregate all bid and ask levels
  const allBids: Map<number, AggregatedLevel> = new Map();
  const allAsks: Map<number, AggregatedLevel> = new Map();

  let totalBidDepth = 0;
  let totalAskDepth = 0;

  for (const ob of orderBooks) {
    totalBidDepth += ob.bidDepthUsd;
    totalAskDepth += ob.askDepthUsd;

    // Aggregate bids
    for (const level of ob.bids) {
      const existing = allBids.get(level.price);
      if (existing) {
        existing.quantity += level.quantity;
        existing.valueUsd += level.valueUsd;
        existing.exchanges.push({ exchange: ob.exchange, quantity: level.quantity });
      } else {
        allBids.set(level.price, {
          price: level.price,
          quantity: level.quantity,
          valueUsd: level.valueUsd,
          exchanges: [{ exchange: ob.exchange, quantity: level.quantity }],
        });
      }
    }

    // Aggregate asks
    for (const level of ob.asks) {
      const existing = allAsks.get(level.price);
      if (existing) {
        existing.quantity += level.quantity;
        existing.valueUsd += level.valueUsd;
        existing.exchanges.push({ exchange: ob.exchange, quantity: level.quantity });
      } else {
        allAsks.set(level.price, {
          price: level.price,
          quantity: level.quantity,
          valueUsd: level.valueUsd,
          exchanges: [{ exchange: ob.exchange, quantity: level.quantity }],
        });
      }
    }
  }

  // Sort bids descending, asks ascending
  const aggregatedBids = Array.from(allBids.values())
    .sort((a, b) => b.price - a.price)
    .slice(0, DEFAULT_DEPTH);
  
  const aggregatedAsks = Array.from(allAsks.values())
    .sort((a, b) => a.price - b.price)
    .slice(0, DEFAULT_DEPTH);

  // Find best bid/ask
  let bestBid: BestPrice = { price: 0, quantity: 0, exchange: 'none' };
  let bestAsk: BestPrice = { price: Infinity, quantity: 0, exchange: 'none' };

  for (const ob of orderBooks) {
    if (ob.bids[0] && ob.bids[0].price > bestBid.price) {
      bestBid = {
        price: ob.bids[0].price,
        quantity: ob.bids[0].quantity,
        exchange: ob.exchange,
      };
    }
    if (ob.asks[0] && ob.asks[0].price < bestAsk.price) {
      bestAsk = {
        price: ob.asks[0].price,
        quantity: ob.asks[0].quantity,
        exchange: ob.exchange,
      };
    }
  }

  if (bestAsk.price === Infinity) {
    bestAsk = { price: 0, quantity: 0, exchange: 'none' };
  }

  const spread = bestAsk.price - bestBid.price;
  const midPrice = (bestBid.price + bestAsk.price) / 2;
  const spreadPercent = midPrice > 0 ? (spread / midPrice) * 100 : 0;

  // Calculate imbalance
  const imbalance = totalBidDepth + totalAskDepth > 0
    ? (totalBidDepth - totalAskDepth) / (totalBidDepth + totalAskDepth)
    : 0;

  // Build exchange breakdown
  const exchangeBreakdown: ExchangeDepth[] = orderBooks.map(ob => ({
    exchange: ob.exchange,
    bidDepthUsd: ob.bidDepthUsd,
    askDepthUsd: ob.askDepthUsd,
    bidPercent: totalBidDepth > 0 ? (ob.bidDepthUsd / totalBidDepth) * 100 : 0,
    askPercent: totalAskDepth > 0 ? (ob.askDepthUsd / totalAskDepth) * 100 : 0,
    spread: ob.spread,
    latency: (ob as ExchangeOrderBook & { fetchLatencyMs?: number }).fetchLatencyMs ?? 0,
  }));

  return {
    symbol,
    timestamp: Date.now(),
    exchanges: orderBooks.map(ob => ob.exchange),
    bids: aggregatedBids,
    asks: aggregatedAsks,
    bestBid,
    bestAsk,
    spread,
    spreadPercent,
    midPrice,
    totalBidDepthUsd: totalBidDepth,
    totalAskDepthUsd: totalAskDepth,
    imbalance,
    exchangeBreakdown,
  };
}

/**
 * Estimate slippage for a given order size
 */
export async function estimateSlippage(
  symbol: string,
  side: 'buy' | 'sell',
  orderSizeUsd: number,
  market: 'spot' | 'futures' = 'spot'
): Promise<SlippageEstimate> {
  const aggregated = await getAggregatedOrderBook(symbol, market);
  
  const levels = side === 'buy' ? aggregated.asks : aggregated.bids;
  
  let remainingUsd = orderSizeUsd;
  let totalQuantity = 0;
  let totalCost = 0;
  let levelsConsumed = 0;
  const exchangeFills: Map<string, { filledUsd: number; totalPrice: number; fills: number }> = new Map();

  for (const level of levels) {
    if (remainingUsd <= 0) break;
    
    levelsConsumed++;
    const levelValueUsd = level.valueUsd;
    const fillUsd = Math.min(remainingUsd, levelValueUsd);
    const fillQuantity = fillUsd / level.price;
    
    totalQuantity += fillQuantity;
    totalCost += fillUsd;
    remainingUsd -= fillUsd;

    // Track by exchange
    for (const ex of level.exchanges) {
      const exShare = ex.quantity / level.quantity;
      const exFillUsd = fillUsd * exShare;
      
      const existing = exchangeFills.get(ex.exchange) || { filledUsd: 0, totalPrice: 0, fills: 0 };
      existing.filledUsd += exFillUsd;
      existing.totalPrice += level.price * exFillUsd;
      existing.fills++;
      exchangeFills.set(ex.exchange, existing);
    }
  }

  const averagePrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
  const referencePrice = side === 'buy' 
    ? aggregated.bestAsk.price 
    : aggregated.bestBid.price;
  
  const slippagePercent = referencePrice > 0 
    ? Math.abs(averagePrice - referencePrice) / referencePrice * 100 
    : 0;
  const slippageUsd = orderSizeUsd * (slippagePercent / 100);

  const exchangeBreakdown = Array.from(exchangeFills.entries()).map(([exchange, data]) => ({
    exchange,
    filledUsd: data.filledUsd,
    avgPrice: data.filledUsd > 0 ? data.totalPrice / data.filledUsd : 0,
  }));

  return {
    symbol,
    side,
    orderSizeUsd,
    averagePrice,
    slippagePercent,
    slippageUsd,
    levelsConsumed,
    exchangeBreakdown,
  };
}

/**
 * Analyze liquidity at various depth levels
 */
export async function analyzeLiquidity(
  symbol: string,
  market: 'spot' | 'futures' = 'spot'
): Promise<LiquidityAnalysis> {
  const aggregated = await getAggregatedOrderBook(symbol, market);
  
  const midPrice = aggregated.midPrice;
  
  // Calculate liquidity at various depth percentages
  const calculateDepth = (percent: number): { bid: number; ask: number } => {
    const bidThreshold = midPrice * (1 - percent / 100);
    const askThreshold = midPrice * (1 + percent / 100);
    
    let bidDepth = 0;
    let askDepth = 0;
    
    for (const level of aggregated.bids) {
      if (level.price >= bidThreshold) {
        bidDepth += level.valueUsd;
      }
    }
    
    for (const level of aggregated.asks) {
      if (level.price <= askThreshold) {
        askDepth += level.valueUsd;
      }
    }
    
    return { bid: bidDepth, ask: askDepth };
  };

  const depth1Percent = calculateDepth(1);
  const depth2Percent = calculateDepth(2);
  const depth5Percent = calculateDepth(5);
  const depth10Percent = calculateDepth(10);

  // Calculate bid/ask ratio at 2% depth
  const bidAskRatio = depth2Percent.ask > 0 
    ? depth2Percent.bid / depth2Percent.ask 
    : 0;

  // Calculate liquidity score (0-100)
  // Based on: depth at 1%, spread, and exchange coverage
  const depthScore = Math.min(
    ((depth1Percent.bid + depth1Percent.ask) / 1000000) * 40, 
    40
  ); // Max 40 points for $1M+ liquidity at 1%
  
  const spreadScore = Math.max(0, 30 - aggregated.spreadPercent * 100); // Lower spread = higher score
  const coverageScore = Math.min(aggregated.exchanges.length * 5, 30); // More exchanges = higher score
  
  const liquidityScore = Math.round(depthScore + spreadScore + coverageScore);

  // Generate recommendation
  let recommendation: string;
  if (liquidityScore >= 80) {
    recommendation = 'Excellent liquidity - suitable for large orders with minimal slippage';
  } else if (liquidityScore >= 60) {
    recommendation = 'Good liquidity - suitable for medium-sized orders';
  } else if (liquidityScore >= 40) {
    recommendation = 'Moderate liquidity - consider splitting large orders';
  } else if (liquidityScore >= 20) {
    recommendation = 'Low liquidity - expect significant slippage on orders >$10k';
  } else {
    recommendation = 'Poor liquidity - trade with caution, use limit orders only';
  }

  return {
    symbol,
    timestamp: Date.now(),
    depth1Percent,
    depth2Percent,
    depth5Percent,
    depth10Percent,
    bidAskRatio,
    liquidityScore,
    recommendation,
  };
}

/**
 * Get full order book dashboard data
 */
export async function getOrderBookDashboard(
  symbol: string,
  market: 'spot' | 'futures' = 'spot',
  orderSizesUsd: number[] = [10000, 50000, 100000, 500000]
): Promise<{
  aggregatedBook: AggregatedOrderBook;
  liquidityAnalysis: LiquidityAnalysis;
  slippageEstimates: {
    buy: SlippageEstimate[];
    sell: SlippageEstimate[];
  };
  arbitrageOpportunity: {
    exists: boolean;
    buyExchange: string;
    sellExchange: string;
    spreadPercent: number;
    potentialProfitBps: number;
  } | null;
}> {
  const aggregatedBook = await getAggregatedOrderBook(symbol, market);
  const liquidityAnalysis = await analyzeLiquidity(symbol, market);
  
  // Calculate slippage for various order sizes
  const buySlippage = await Promise.all(
    orderSizesUsd.map(size => estimateSlippage(symbol, 'buy', size, market))
  );
  const sellSlippage = await Promise.all(
    orderSizesUsd.map(size => estimateSlippage(symbol, 'sell', size, market))
  );

  // Check for arbitrage opportunity
  let arbitrageOpportunity = null;
  
  if (aggregatedBook.exchangeBreakdown.length >= 2) {
    // Find lowest ask and highest bid across exchanges
    const orderBooks = await fetchAllOrderBooks(symbol, market);
    
    let lowestAsk = { price: Infinity, exchange: '' };
    let highestBid = { price: 0, exchange: '' };
    
    for (const ob of orderBooks) {
      if (ob.asks[0] && ob.asks[0].price < lowestAsk.price) {
        lowestAsk = { price: ob.asks[0].price, exchange: ob.exchange };
      }
      if (ob.bids[0] && ob.bids[0].price > highestBid.price) {
        highestBid = { price: ob.bids[0].price, exchange: ob.exchange };
      }
    }
    
    // Arbitrage exists if highest bid > lowest ask (after accounting for fees)
    const estimatedFees = 0.001; // 0.1% per side = 0.2% total
    const spreadPercent = (highestBid.price - lowestAsk.price) / lowestAsk.price * 100;
    const profitAfterFees = spreadPercent - (estimatedFees * 2 * 100);
    
    if (profitAfterFees > 0 && lowestAsk.exchange !== highestBid.exchange) {
      arbitrageOpportunity = {
        exists: true,
        buyExchange: lowestAsk.exchange,
        sellExchange: highestBid.exchange,
        spreadPercent,
        potentialProfitBps: Math.round(profitAfterFees * 100),
      };
    }
  }

  return {
    aggregatedBook,
    liquidityAnalysis,
    slippageEstimates: {
      buy: buySlippage,
      sell: sellSlippage,
    },
    arbitrageOpportunity,
  };
}
