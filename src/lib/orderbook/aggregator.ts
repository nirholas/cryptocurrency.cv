/**
 * Multi-Exchange Order Book Aggregator
 * 
 * Aggregates order book data from multiple exchanges:
 * - Binance
 * - Coinbase
 * - Kraken
 * - Bybit
 * - OKX
 * 
 * Features:
 * - Real-time WebSocket connections
 * - Order book normalization
 * - Depth aggregation
 * - Spread analysis
 * - Liquidity metrics
 * - Imbalance detection
 */

// =============================================================================
// Types
// =============================================================================

export type Exchange = 'binance' | 'coinbase' | 'kraken' | 'bybit' | 'okx';

export interface OrderBookLevel {
  price: number;
  quantity: number;
  exchange: Exchange;
  timestamp: number;
}

export interface OrderBook {
  symbol: string;
  exchange: Exchange;
  bids: OrderBookLevel[];
  asks: OrderBookLevel[];
  timestamp: number;
  sequenceId?: number;
}

export interface AggregatedOrderBook {
  symbol: string;
  exchanges: Exchange[];
  bids: AggregatedLevel[];
  asks: AggregatedLevel[];
  metrics: OrderBookMetrics;
  timestamp: number;
}

export interface AggregatedLevel {
  price: number;
  totalQuantity: number;
  quantityByExchange: Record<Exchange, number>;
  exchangeCount: number;
  weightedAvgPrice: number;
}

export interface OrderBookMetrics {
  bestBid: number;
  bestAsk: number;
  spread: number;
  spreadPercent: number;
  midPrice: number;
  bidDepth: DepthMetrics;
  askDepth: DepthMetrics;
  imbalance: number;
  imbalancePercent: number;
  vwap: VWAPMetrics;
  liquidity: LiquidityMetrics;
}

export interface DepthMetrics {
  depth1Percent: number;
  depth2Percent: number;
  depth5Percent: number;
  depth10Percent: number;
  totalVolume: number;
  totalValue: number;
}

export interface VWAPMetrics {
  bid1000: number;
  bid10000: number;
  bid100000: number;
  ask1000: number;
  ask10000: number;
  ask100000: number;
}

export interface LiquidityMetrics {
  totalBidLiquidity: number;
  totalAskLiquidity: number;
  bidLiquidityRatio: number;
  slippageEstimate: SlippageEstimate[];
}

export interface SlippageEstimate {
  orderSize: number;
  side: 'buy' | 'sell';
  avgPrice: number;
  slippage: number;
  slippagePercent: number;
}

export interface ArbitrageOpportunity {
  symbol: string;
  buyExchange: Exchange;
  sellExchange: Exchange;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  potentialProfit: number;
  requiredCapital: number;
  timestamp: number;
  isViable: boolean;
  fees: ArbitrageFees;
}

export interface ArbitrageFees {
  buyFee: number;
  sellFee: number;
  withdrawFee: number;
  networkFee: number;
  totalFees: number;
}

// =============================================================================
// Exchange Configuration
// =============================================================================

interface ExchangeConfig {
  name: Exchange;
  wsUrl: string;
  restUrl: string;
  rateLimit: number;
  makerFee: number;
  takerFee: number;
  withdrawFees: Record<string, number>;
}

const EXCHANGE_CONFIGS: Record<Exchange, ExchangeConfig> = {
  binance: {
    name: 'binance',
    wsUrl: 'wss://stream.binance.com:9443/ws',
    restUrl: 'https://api.binance.com/api/v3',
    rateLimit: 1200,
    makerFee: 0.001,
    takerFee: 0.001,
    withdrawFees: { BTC: 0.0001, ETH: 0.005 },
  },
  coinbase: {
    name: 'coinbase',
    wsUrl: 'wss://ws-feed.exchange.coinbase.com',
    restUrl: 'https://api.exchange.coinbase.com',
    rateLimit: 10,
    makerFee: 0.004,
    takerFee: 0.006,
    withdrawFees: { BTC: 0.0001, ETH: 0.005 },
  },
  kraken: {
    name: 'kraken',
    wsUrl: 'wss://ws.kraken.com',
    restUrl: 'https://api.kraken.com/0',
    rateLimit: 15,
    makerFee: 0.0016,
    takerFee: 0.0026,
    withdrawFees: { BTC: 0.00015, ETH: 0.005 },
  },
  bybit: {
    name: 'bybit',
    wsUrl: 'wss://stream.bybit.com/v5/public/spot',
    restUrl: 'https://api.bybit.com/v5',
    rateLimit: 120,
    makerFee: 0.001,
    takerFee: 0.001,
    withdrawFees: { BTC: 0.0002, ETH: 0.004 },
  },
  okx: {
    name: 'okx',
    wsUrl: 'wss://ws.okx.com:8443/ws/v5/public',
    restUrl: 'https://www.okx.com/api/v5',
    rateLimit: 20,
    makerFee: 0.001,
    takerFee: 0.0015,
    withdrawFees: { BTC: 0.0001, ETH: 0.004 },
  },
};

// =============================================================================
// Order Book Storage
// =============================================================================

const orderBooks = new Map<string, Map<Exchange, OrderBook>>();
const arbitrageOpportunities = new Map<string, ArbitrageOpportunity[]>();

function getOrderBookKey(symbol: string): string {
  return symbol.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

// =============================================================================
// Order Book Fetching
// =============================================================================

/**
 * Fetch order book from a specific exchange
 */
export async function fetchOrderBook(
  symbol: string,
  exchange: Exchange,
  depth: number = 20
): Promise<OrderBook> {
  const config = EXCHANGE_CONFIGS[exchange];
  const normalizedSymbol = normalizeSymbol(symbol, exchange);
  
  try {
    switch (exchange) {
      case 'binance':
        return await fetchBinanceOrderBook(normalizedSymbol, depth);
      case 'coinbase':
        return await fetchCoinbaseOrderBook(normalizedSymbol, depth);
      case 'kraken':
        return await fetchKrakenOrderBook(normalizedSymbol, depth);
      case 'bybit':
        return await fetchBybitOrderBook(normalizedSymbol, depth);
      case 'okx':
        return await fetchOKXOrderBook(normalizedSymbol, depth);
      default:
        throw new Error(`Unsupported exchange: ${exchange}`);
    }
  } catch (error) {
    console.error(`Failed to fetch order book from ${exchange}:`, error);
    throw error;
  }
}

/**
 * Normalize symbol for specific exchange
 */
function normalizeSymbol(symbol: string, exchange: Exchange): string {
  const base = symbol.toUpperCase();
  
  switch (exchange) {
    case 'binance':
    case 'bybit':
      return base.replace('/', '').replace('-', '');
    case 'coinbase':
      return base.includes('-') ? base : `${base.slice(0, -4)}-${base.slice(-4)}`;
    case 'kraken':
      return base.replace('BTC', 'XBT').replace('/', '');
    case 'okx':
      return base.includes('-') ? base : `${base.slice(0, -4)}-${base.slice(-4)}`;
    default:
      return base;
  }
}

// Exchange-specific fetchers

async function fetchBinanceOrderBook(symbol: string, depth: number): Promise<OrderBook> {
  const response = await fetch(
    `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${depth}`
  );
  
  if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
  
  const data = await response.json();
  const timestamp = Date.now();
  
  return {
    symbol,
    exchange: 'binance',
    bids: data.bids.map((b: string[]) => ({
      price: parseFloat(b[0]),
      quantity: parseFloat(b[1]),
      exchange: 'binance' as Exchange,
      timestamp,
    })),
    asks: data.asks.map((a: string[]) => ({
      price: parseFloat(a[0]),
      quantity: parseFloat(a[1]),
      exchange: 'binance' as Exchange,
      timestamp,
    })),
    timestamp,
    sequenceId: data.lastUpdateId,
  };
}

async function fetchCoinbaseOrderBook(symbol: string, depth: number): Promise<OrderBook> {
  const response = await fetch(
    `https://api.exchange.coinbase.com/products/${symbol}/book?level=2`
  );
  
  if (!response.ok) throw new Error(`Coinbase API error: ${response.status}`);
  
  const data = await response.json();
  const timestamp = Date.now();
  
  return {
    symbol,
    exchange: 'coinbase',
    bids: data.bids.slice(0, depth).map((b: string[]) => ({
      price: parseFloat(b[0]),
      quantity: parseFloat(b[1]),
      exchange: 'coinbase' as Exchange,
      timestamp,
    })),
    asks: data.asks.slice(0, depth).map((a: string[]) => ({
      price: parseFloat(a[0]),
      quantity: parseFloat(a[1]),
      exchange: 'coinbase' as Exchange,
      timestamp,
    })),
    timestamp,
    sequenceId: data.sequence,
  };
}

async function fetchKrakenOrderBook(symbol: string, depth: number): Promise<OrderBook> {
  const response = await fetch(
    `https://api.kraken.com/0/public/Depth?pair=${symbol}&count=${depth}`
  );
  
  if (!response.ok) throw new Error(`Kraken API error: ${response.status}`);
  
  const data = await response.json();
  const timestamp = Date.now();
  const pairKey = Object.keys(data.result)[0];
  const orderData = data.result[pairKey];
  
  return {
    symbol,
    exchange: 'kraken',
    bids: orderData.bids.map((b: string[]) => ({
      price: parseFloat(b[0]),
      quantity: parseFloat(b[1]),
      exchange: 'kraken' as Exchange,
      timestamp: parseInt(b[2]) * 1000,
    })),
    asks: orderData.asks.map((a: string[]) => ({
      price: parseFloat(a[0]),
      quantity: parseFloat(a[1]),
      exchange: 'kraken' as Exchange,
      timestamp: parseInt(a[2]) * 1000,
    })),
    timestamp,
  };
}

async function fetchBybitOrderBook(symbol: string, depth: number): Promise<OrderBook> {
  const response = await fetch(
    `https://api.bybit.com/v5/market/orderbook?category=spot&symbol=${symbol}&limit=${depth}`
  );
  
  if (!response.ok) throw new Error(`Bybit API error: ${response.status}`);
  
  const data = await response.json();
  const timestamp = parseInt(data.result.ts);
  
  return {
    symbol,
    exchange: 'bybit',
    bids: data.result.b.map((b: string[]) => ({
      price: parseFloat(b[0]),
      quantity: parseFloat(b[1]),
      exchange: 'bybit' as Exchange,
      timestamp,
    })),
    asks: data.result.a.map((a: string[]) => ({
      price: parseFloat(a[0]),
      quantity: parseFloat(a[1]),
      exchange: 'bybit' as Exchange,
      timestamp,
    })),
    timestamp,
    sequenceId: data.result.u,
  };
}

async function fetchOKXOrderBook(symbol: string, depth: number): Promise<OrderBook> {
  const response = await fetch(
    `https://www.okx.com/api/v5/market/books?instId=${symbol}&sz=${depth}`
  );
  
  if (!response.ok) throw new Error(`OKX API error: ${response.status}`);
  
  const data = await response.json();
  const bookData = data.data[0];
  const timestamp = parseInt(bookData.ts);
  
  return {
    symbol,
    exchange: 'okx',
    bids: bookData.bids.map((b: string[]) => ({
      price: parseFloat(b[0]),
      quantity: parseFloat(b[1]),
      exchange: 'okx' as Exchange,
      timestamp,
    })),
    asks: bookData.asks.map((a: string[]) => ({
      price: parseFloat(a[0]),
      quantity: parseFloat(a[1]),
      exchange: 'okx' as Exchange,
      timestamp,
    })),
    timestamp,
  };
}

// =============================================================================
// Aggregation
// =============================================================================

/**
 * Fetch and aggregate order books from multiple exchanges
 */
export async function aggregateOrderBooks(
  symbol: string,
  exchanges: Exchange[] = ['binance', 'coinbase', 'kraken', 'bybit', 'okx'],
  depth: number = 20
): Promise<AggregatedOrderBook> {
  // Fetch from all exchanges in parallel
  const results = await Promise.allSettled(
    exchanges.map(exchange => fetchOrderBook(symbol, exchange, depth))
  );
  
  const orderBooksList: OrderBook[] = [];
  const successfulExchanges: Exchange[] = [];
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      orderBooksList.push(result.value);
      successfulExchanges.push(exchanges[index]);
    }
  });
  
  if (orderBooksList.length === 0) {
    throw new Error('Failed to fetch order book from any exchange');
  }
  
  // Aggregate bids and asks
  const aggregatedBids = aggregateLevels(
    orderBooksList.flatMap(ob => ob.bids),
    'desc'
  );
  
  const aggregatedAsks = aggregateLevels(
    orderBooksList.flatMap(ob => ob.asks),
    'asc'
  );
  
  // Calculate metrics
  const metrics = calculateMetrics(aggregatedBids, aggregatedAsks);
  
  // Store for caching
  const key = getOrderBookKey(symbol);
  if (!orderBooks.has(key)) {
    orderBooks.set(key, new Map());
  }
  orderBooksList.forEach(ob => {
    orderBooks.get(key)!.set(ob.exchange, ob);
  });
  
  return {
    symbol,
    exchanges: successfulExchanges,
    bids: aggregatedBids,
    asks: aggregatedAsks,
    metrics,
    timestamp: Date.now(),
  };
}

/**
 * Aggregate order book levels by price
 */
function aggregateLevels(
  levels: OrderBookLevel[],
  sortOrder: 'asc' | 'desc'
): AggregatedLevel[] {
  // Group by price
  const priceMap = new Map<number, OrderBookLevel[]>();
  
  for (const level of levels) {
    const existing = priceMap.get(level.price) || [];
    existing.push(level);
    priceMap.set(level.price, existing);
  }
  
  // Aggregate
  const aggregated: AggregatedLevel[] = [];
  
  for (const [price, priceLevels] of priceMap) {
    const quantityByExchange: Record<Exchange, number> = {} as Record<Exchange, number>;
    let totalQuantity = 0;
    let weightedSum = 0;
    
    for (const level of priceLevels) {
      quantityByExchange[level.exchange] = 
        (quantityByExchange[level.exchange] || 0) + level.quantity;
      totalQuantity += level.quantity;
      weightedSum += level.price * level.quantity;
    }
    
    aggregated.push({
      price,
      totalQuantity,
      quantityByExchange,
      exchangeCount: Object.keys(quantityByExchange).length,
      weightedAvgPrice: totalQuantity > 0 ? weightedSum / totalQuantity : price,
    });
  }
  
  // Sort
  aggregated.sort((a, b) => 
    sortOrder === 'asc' ? a.price - b.price : b.price - a.price
  );
  
  return aggregated;
}

// =============================================================================
// Metrics Calculation
// =============================================================================

function calculateMetrics(
  bids: AggregatedLevel[],
  asks: AggregatedLevel[]
): OrderBookMetrics {
  const bestBid = bids.length > 0 ? bids[0].price : 0;
  const bestAsk = asks.length > 0 ? asks[0].price : 0;
  const spread = bestAsk - bestBid;
  const midPrice = (bestBid + bestAsk) / 2;
  
  return {
    bestBid,
    bestAsk,
    spread,
    spreadPercent: midPrice > 0 ? (spread / midPrice) * 100 : 0,
    midPrice,
    bidDepth: calculateDepthMetrics(bids, midPrice),
    askDepth: calculateDepthMetrics(asks, midPrice),
    imbalance: calculateImbalance(bids, asks),
    imbalancePercent: calculateImbalancePercent(bids, asks),
    vwap: calculateVWAP(bids, asks),
    liquidity: calculateLiquidity(bids, asks, midPrice),
  };
}

function calculateDepthMetrics(
  levels: AggregatedLevel[],
  midPrice: number
): DepthMetrics {
  const depths = [0.01, 0.02, 0.05, 0.10];
  let totalVolume = 0;
  let totalValue = 0;
  
  const depthVolumes: number[] = [0, 0, 0, 0];
  
  for (const level of levels) {
    const distance = Math.abs(level.price - midPrice) / midPrice;
    totalVolume += level.totalQuantity;
    totalValue += level.totalQuantity * level.price;
    
    depths.forEach((d, i) => {
      if (distance <= d) {
        depthVolumes[i] += level.totalQuantity;
      }
    });
  }
  
  return {
    depth1Percent: depthVolumes[0],
    depth2Percent: depthVolumes[1],
    depth5Percent: depthVolumes[2],
    depth10Percent: depthVolumes[3],
    totalVolume,
    totalValue,
  };
}

function calculateImbalance(
  bids: AggregatedLevel[],
  asks: AggregatedLevel[]
): number {
  const bidVolume = bids.reduce((sum, b) => sum + b.totalQuantity, 0);
  const askVolume = asks.reduce((sum, a) => sum + a.totalQuantity, 0);
  return bidVolume - askVolume;
}

function calculateImbalancePercent(
  bids: AggregatedLevel[],
  asks: AggregatedLevel[]
): number {
  const bidVolume = bids.reduce((sum, b) => sum + b.totalQuantity, 0);
  const askVolume = asks.reduce((sum, a) => sum + a.totalQuantity, 0);
  const total = bidVolume + askVolume;
  return total > 0 ? ((bidVolume - askVolume) / total) * 100 : 0;
}

function calculateVWAP(
  bids: AggregatedLevel[],
  asks: AggregatedLevel[]
): VWAPMetrics {
  return {
    bid1000: calculateVWAPForSize(bids, 1000),
    bid10000: calculateVWAPForSize(bids, 10000),
    bid100000: calculateVWAPForSize(bids, 100000),
    ask1000: calculateVWAPForSize(asks, 1000),
    ask10000: calculateVWAPForSize(asks, 10000),
    ask100000: calculateVWAPForSize(asks, 100000),
  };
}

function calculateVWAPForSize(levels: AggregatedLevel[], targetSize: number): number {
  let remainingSize = targetSize;
  let weightedSum = 0;
  let filledSize = 0;
  
  for (const level of levels) {
    const fillSize = Math.min(remainingSize, level.totalQuantity * level.price);
    const fillQty = fillSize / level.price;
    weightedSum += level.price * fillQty;
    filledSize += fillQty;
    remainingSize -= fillSize;
    
    if (remainingSize <= 0) break;
  }
  
  return filledSize > 0 ? weightedSum / filledSize : 0;
}

function calculateLiquidity(
  bids: AggregatedLevel[],
  asks: AggregatedLevel[],
  midPrice: number
): LiquidityMetrics {
  const totalBidLiquidity = bids.reduce(
    (sum, b) => sum + b.totalQuantity * b.price,
    0
  );
  const totalAskLiquidity = asks.reduce(
    (sum, a) => sum + a.totalQuantity * a.price,
    0
  );
  
  const slippageEstimate: SlippageEstimate[] = [];
  const orderSizes = [1000, 10000, 50000, 100000];
  
  for (const size of orderSizes) {
    slippageEstimate.push({
      orderSize: size,
      side: 'buy',
      avgPrice: calculateVWAPForSize(asks, size),
      slippage: calculateVWAPForSize(asks, size) - midPrice,
      slippagePercent: ((calculateVWAPForSize(asks, size) - midPrice) / midPrice) * 100,
    });
    slippageEstimate.push({
      orderSize: size,
      side: 'sell',
      avgPrice: calculateVWAPForSize(bids, size),
      slippage: midPrice - calculateVWAPForSize(bids, size),
      slippagePercent: ((midPrice - calculateVWAPForSize(bids, size)) / midPrice) * 100,
    });
  }
  
  return {
    totalBidLiquidity,
    totalAskLiquidity,
    bidLiquidityRatio: totalBidLiquidity / (totalBidLiquidity + totalAskLiquidity),
    slippageEstimate,
  };
}

// =============================================================================
// Arbitrage Detection
// =============================================================================

/**
 * Scan for arbitrage opportunities across exchanges
 */
export async function scanArbitrageOpportunities(
  symbol: string,
  exchanges: Exchange[] = ['binance', 'coinbase', 'kraken', 'bybit', 'okx'],
  minSpreadPercent: number = 0.1
): Promise<ArbitrageOpportunity[]> {
  const aggregated = await aggregateOrderBooks(symbol, exchanges, 5);
  const opportunities: ArbitrageOpportunity[] = [];
  
  // Check each exchange pair
  for (let i = 0; i < exchanges.length; i++) {
    for (let j = i + 1; j < exchanges.length; j++) {
      const ex1 = exchanges[i];
      const ex2 = exchanges[j];
      
      const key = getOrderBookKey(symbol);
      const books = orderBooks.get(key);
      if (!books) continue;
      
      const book1 = books.get(ex1);
      const book2 = books.get(ex2);
      if (!book1 || !book2) continue;
      
      // Check both directions
      const opp1 = checkArbitrageDirection(symbol, book1, book2, minSpreadPercent);
      if (opp1) opportunities.push(opp1);
      
      const opp2 = checkArbitrageDirection(symbol, book2, book1, minSpreadPercent);
      if (opp2) opportunities.push(opp2);
    }
  }
  
  // Sort by profit potential
  opportunities.sort((a, b) => b.potentialProfit - a.potentialProfit);
  
  // Cache results
  arbitrageOpportunities.set(symbol, opportunities);
  
  return opportunities;
}

function checkArbitrageDirection(
  symbol: string,
  buyBook: OrderBook,
  sellBook: OrderBook,
  minSpreadPercent: number
): ArbitrageOpportunity | null {
  const buyPrice = buyBook.asks[0]?.price;
  const sellPrice = sellBook.bids[0]?.price;
  
  if (!buyPrice || !sellPrice) return null;
  
  const spread = sellPrice - buyPrice;
  const spreadPercent = (spread / buyPrice) * 100;
  
  if (spreadPercent < minSpreadPercent) return null;
  
  // Calculate fees
  const buyConfig = EXCHANGE_CONFIGS[buyBook.exchange];
  const sellConfig = EXCHANGE_CONFIGS[sellBook.exchange];
  
  const buyFee = buyPrice * buyConfig.takerFee;
  const sellFee = sellPrice * sellConfig.takerFee;
  const baseAsset = symbol.replace(/USD[T]?$|USDC$/i, '');
  const withdrawFee = buyConfig.withdrawFees[baseAsset] || 0.001;
  const networkFee = 0; // Would need real-time gas estimation
  
  const totalFees = buyFee + sellFee + (withdrawFee * buyPrice);
  const potentialProfit = spread - totalFees;
  const isViable = potentialProfit > 0;
  
  return {
    symbol,
    buyExchange: buyBook.exchange,
    sellExchange: sellBook.exchange,
    buyPrice,
    sellPrice,
    spread,
    spreadPercent,
    potentialProfit,
    requiredCapital: buyPrice + buyFee,
    timestamp: Date.now(),
    isViable,
    fees: {
      buyFee,
      sellFee,
      withdrawFee: withdrawFee * buyPrice,
      networkFee,
      totalFees,
    },
  };
}

/**
 * Get cached arbitrage opportunities
 */
export function getArbitrageOpportunities(symbol: string): ArbitrageOpportunity[] {
  return arbitrageOpportunities.get(symbol) || [];
}

/**
 * Get all exchange configs
 */
export function getExchangeConfigs(): Record<Exchange, ExchangeConfig> {
  return EXCHANGE_CONFIGS;
}

/**
 * Get supported exchanges
 */
export function getSupportedExchanges(): Exchange[] {
  return Object.keys(EXCHANGE_CONFIGS) as Exchange[];
}
