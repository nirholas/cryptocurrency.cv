/**
 * Cross-Exchange Arbitrage Scanner
 * 
 * Real-time price arbitrage detection across major exchanges.
 * Calculates profit opportunities accounting for fees, slippage, and latency.
 * 
 * Exchanges Supported:
 * - Binance
 * - Bybit
 * - OKX
 * - Kraken
 * - Coinbase
 * - KuCoin
 * 
 * @module lib/arbitrage-scanner
 */

import { cache } from './cache';
import { EXTERNAL_APIS } from './external-apis';

// =============================================================================
// Types
// =============================================================================

export interface ExchangePrice {
  exchange: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  bidPrice: number;
  bidSize: number;
  askPrice: number;
  askSize: number;
  lastPrice: number;
  volume24h: number;
  timestamp: number;
}

export interface ArbitrageOpportunity {
  id: string;
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  grossProfit: number;
  estimatedFees: number;
  netProfit: number;
  netProfitPercent: number;
  availableSize: number;
  maxTradeSize: number;
  profitAtMaxSize: number;
  latencyRisk: 'low' | 'medium' | 'high';
  liquidityScore: number;
  overallScore: number;
  direction: 'spot' | 'futures' | 'cross-type';
  expiresAt: number;
  detectedAt: number;
  notes: string[];
}

export interface TriangularArbitrage {
  id: string;
  path: string[];
  exchanges: string[];
  legs: {
    from: string;
    to: string;
    exchange: string;
    rate: number;
    side: 'buy' | 'sell';
  }[];
  startAmount: number;
  endAmount: number;
  profit: number;
  profitPercent: number;
  estimatedFees: number;
  netProfit: number;
  executionTime: number;
  riskScore: number;
  detectedAt: number;
}

export interface ArbitrageScanResult {
  opportunities: ArbitrageOpportunity[];
  triangular: TriangularArbitrage[];
  priceData: Record<string, ExchangePrice[]>;
  summary: {
    totalOpportunities: number;
    avgSpread: number;
    bestOpportunity: ArbitrageOpportunity | null;
    exchangeStats: Record<string, { opportunities: number; avgSpread: number }>;
    scannedPairs: number;
    scanDuration: number;
  };
  lastUpdated: string;
}

// =============================================================================
// Configuration
// =============================================================================

const EXCHANGE_FEES: Record<string, { maker: number; taker: number; withdrawal: Record<string, number> }> = {
  binance: { 
    maker: 0.001, 
    taker: 0.001,
    withdrawal: { BTC: 0.0005, ETH: 0.005, USDT: 1 },
  },
  bybit: { 
    maker: 0.001, 
    taker: 0.001,
    withdrawal: { BTC: 0.0005, ETH: 0.005, USDT: 1 },
  },
  okx: { 
    maker: 0.0008, 
    taker: 0.001,
    withdrawal: { BTC: 0.0004, ETH: 0.004, USDT: 1 },
  },
  kraken: { 
    maker: 0.0016, 
    taker: 0.0026,
    withdrawal: { BTC: 0.00015, ETH: 0.0025, USDT: 2.5 },
  },
  coinbase: { 
    maker: 0.004, 
    taker: 0.006,
    withdrawal: { BTC: 0, ETH: 0, USDT: 0 }, // Network fees only
  },
  kucoin: { 
    maker: 0.001, 
    taker: 0.001,
    withdrawal: { BTC: 0.0005, ETH: 0.005, USDT: 1 },
  },
};

const MIN_PROFIT_THRESHOLD = 0.001; // 0.1% minimum profit
const SCAN_SYMBOLS = [
  'BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT',
  'ADAUSDT', 'AVAXUSDT', 'DOTUSDT', 'LINKUSDT', 'MATICUSDT',
  'LTCUSDT', 'ATOMUSDT', 'UNIUSDT', 'APTUSDT', 'ARBUSDT',
];

// =============================================================================
// Exchange Price Fetchers
// =============================================================================

async function fetchBinancePrices(): Promise<ExchangePrice[]> {
  const cacheKey = 'arb:binance:prices';
  const cached = cache.get<ExchangePrice[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${EXTERNAL_APIS.BINANCE}/ticker/bookTicker`);
    if (!response.ok) throw new Error(`Binance API error: ${response.status}`);
    
    const data: Array<{
      symbol: string;
      bidPrice: string;
      bidQty: string;
      askPrice: string;
      askQty: string;
    }> = await response.json();

    const now = Date.now();
    const prices: ExchangePrice[] = data
      .filter(t => t.symbol.endsWith('USDT') && !t.symbol.includes('_'))
      .map(t => ({
        exchange: 'binance',
        symbol: t.symbol,
        baseAsset: t.symbol.replace('USDT', ''),
        quoteAsset: 'USDT',
        bidPrice: parseFloat(t.bidPrice),
        bidSize: parseFloat(t.bidQty),
        askPrice: parseFloat(t.askPrice),
        askSize: parseFloat(t.askQty),
        lastPrice: (parseFloat(t.bidPrice) + parseFloat(t.askPrice)) / 2,
        volume24h: 0,
        timestamp: now,
      }));

    cache.set(cacheKey, prices, 5);
    return prices;
  } catch (error) {
    console.error('Binance price fetch error:', error);
    return [];
  }
}

async function fetchBybitPrices(): Promise<ExchangePrice[]> {
  const cacheKey = 'arb:bybit:prices';
  const cached = cache.get<ExchangePrice[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${EXTERNAL_APIS.BYBIT}/market/tickers?category=spot`);
    if (!response.ok) throw new Error(`Bybit API error: ${response.status}`);
    
    const result = await response.json();
    const data = result.result?.list || [];

    const now = Date.now();
    const prices: ExchangePrice[] = data
      .filter((t: { symbol: string }) => t.symbol.endsWith('USDT'))
      .map((t: {
        symbol: string;
        bid1Price: string;
        bid1Size: string;
        ask1Price: string;
        ask1Size: string;
        lastPrice: string;
        turnover24h: string;
      }) => ({
        exchange: 'bybit',
        symbol: t.symbol,
        baseAsset: t.symbol.replace('USDT', ''),
        quoteAsset: 'USDT',
        bidPrice: parseFloat(t.bid1Price),
        bidSize: parseFloat(t.bid1Size),
        askPrice: parseFloat(t.ask1Price),
        askSize: parseFloat(t.ask1Size),
        lastPrice: parseFloat(t.lastPrice),
        volume24h: parseFloat(t.turnover24h),
        timestamp: now,
      }));

    cache.set(cacheKey, prices, 5);
    return prices;
  } catch (error) {
    console.error('Bybit price fetch error:', error);
    return [];
  }
}

async function fetchOKXPrices(): Promise<ExchangePrice[]> {
  const cacheKey = 'arb:okx:prices';
  const cached = cache.get<ExchangePrice[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${EXTERNAL_APIS.OKX}/market/tickers?instType=SPOT`);
    if (!response.ok) throw new Error(`OKX API error: ${response.status}`);
    
    const result = await response.json();
    const data = result.data || [];

    const now = Date.now();
    const prices: ExchangePrice[] = data
      .filter((t: { instId: string }) => t.instId.endsWith('-USDT'))
      .map((t: {
        instId: string;
        bidPx: string;
        bidSz: string;
        askPx: string;
        askSz: string;
        last: string;
        vol24h: string;
      }) => ({
        exchange: 'okx',
        symbol: t.instId.replace('-', ''),
        baseAsset: t.instId.split('-')[0],
        quoteAsset: 'USDT',
        bidPrice: parseFloat(t.bidPx),
        bidSize: parseFloat(t.bidSz),
        askPrice: parseFloat(t.askPx),
        askSize: parseFloat(t.askSz),
        lastPrice: parseFloat(t.last),
        volume24h: parseFloat(t.vol24h),
        timestamp: now,
      }));

    cache.set(cacheKey, prices, 5);
    return prices;
  } catch (error) {
    console.error('OKX price fetch error:', error);
    return [];
  }
}

async function fetchKrakenPrices(): Promise<ExchangePrice[]> {
  const cacheKey = 'arb:kraken:prices';
  const cached = cache.get<ExchangePrice[]>(cacheKey);
  if (cached) return cached;

  try {
    // Kraken uses different symbol format
    const krakenPairs = ['XXBTZUSD', 'XETHZUSD', 'SOLUSD', 'XXRPZUSD', 'XDGUSD'];
    const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${krakenPairs.join(',')}`);
    if (!response.ok) throw new Error(`Kraken API error: ${response.status}`);
    
    const result = await response.json();
    const data = result.result || {};

    const symbolMap: Record<string, string> = {
      'XXBTZUSD': 'BTCUSDT',
      'XETHZUSD': 'ETHUSDT',
      'SOLUSD': 'SOLUSDT',
      'XXRPZUSD': 'XRPUSDT',
      'XDGUSD': 'DOGEUSDT',
    };

    const now = Date.now();
    const prices: ExchangePrice[] = Object.entries(data).map(([krakenSymbol, ticker]) => {
      const t = ticker as {
        b: [string, string];
        a: [string, string];
        c: [string];
        v: [string, string];
      };
      const symbol = symbolMap[krakenSymbol] || krakenSymbol;
      
      return {
        exchange: 'kraken',
        symbol,
        baseAsset: symbol.replace('USDT', ''),
        quoteAsset: 'USDT',
        bidPrice: parseFloat(t.b[0]),
        bidSize: parseFloat(t.b[1]),
        askPrice: parseFloat(t.a[0]),
        askSize: parseFloat(t.a[1]),
        lastPrice: parseFloat(t.c[0]),
        volume24h: parseFloat(t.v[1]),
        timestamp: now,
      };
    });

    cache.set(cacheKey, prices, 5);
    return prices;
  } catch (error) {
    console.error('Kraken price fetch error:', error);
    return [];
  }
}

async function fetchKucoinPrices(): Promise<ExchangePrice[]> {
  const cacheKey = 'arb:kucoin:prices';
  const cached = cache.get<ExchangePrice[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch('https://api.kucoin.com/api/v1/market/allTickers');
    if (!response.ok) throw new Error(`KuCoin API error: ${response.status}`);
    
    const result = await response.json();
    const tickers = result.data?.ticker || [];

    const now = Date.now();
    const prices: ExchangePrice[] = tickers
      .filter((t: { symbol: string }) => t.symbol.endsWith('-USDT'))
      .map((t: {
        symbol: string;
        buy: string;
        sell: string;
        last: string;
        vol: string;
      }) => ({
        exchange: 'kucoin',
        symbol: t.symbol.replace('-', ''),
        baseAsset: t.symbol.split('-')[0],
        quoteAsset: 'USDT',
        bidPrice: parseFloat(t.buy),
        bidSize: 0,
        askPrice: parseFloat(t.sell),
        askSize: 0,
        lastPrice: parseFloat(t.last),
        volume24h: parseFloat(t.vol),
        timestamp: now,
      }));

    cache.set(cacheKey, prices, 5);
    return prices;
  } catch (error) {
    console.error('KuCoin price fetch error:', error);
    return [];
  }
}

// =============================================================================
// Arbitrage Detection
// =============================================================================

function detectArbitrageOpportunities(
  pricesBySymbol: Map<string, ExchangePrice[]>
): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];
  const now = Date.now();

  for (const [symbol, prices] of pricesBySymbol.entries()) {
    if (prices.length < 2) continue;

    // Find all buy/sell combinations
    for (const buyExchange of prices) {
      for (const sellExchange of prices) {
        if (buyExchange.exchange === sellExchange.exchange) continue;
        
        const buyPrice = buyExchange.askPrice;
        const sellPrice = sellExchange.bidPrice;
        
        if (buyPrice <= 0 || sellPrice <= 0) continue;
        
        const spread = sellPrice - buyPrice;
        const spreadPercent = (spread / buyPrice) * 100;
        
        // Calculate fees
        const buyFee = EXCHANGE_FEES[buyExchange.exchange]?.taker || 0.001;
        const sellFee = EXCHANGE_FEES[sellExchange.exchange]?.taker || 0.001;
        const totalFeePercent = (buyFee + sellFee) * 100;
        
        const netSpreadPercent = spreadPercent - totalFeePercent;
        
        // Only include profitable opportunities
        if (netSpreadPercent < MIN_PROFIT_THRESHOLD * 100) continue;

        // Calculate maximum trade size (limited by order book depth)
        const maxBuySize = buyExchange.askSize * buyPrice;
        const maxSellSize = sellExchange.bidSize * sellPrice;
        const maxTradeSize = Math.min(maxBuySize, maxSellSize, 100000); // Cap at $100k

        // Calculate actual profit
        const grossProfit = (spread / buyPrice) * maxTradeSize;
        const estimatedFees = (buyFee + sellFee) * maxTradeSize;
        const netProfit = grossProfit - estimatedFees;
        const netProfitPercent = (netProfit / maxTradeSize) * 100;

        // Risk assessment
        const latencyRisk = calculateLatencyRisk(buyExchange.exchange, sellExchange.exchange);
        const liquidityScore = calculateLiquidityScore(buyExchange, sellExchange);
        const overallScore = calculateOverallScore(netProfitPercent, latencyRisk, liquidityScore);

        const notes: string[] = [];
        if (netProfitPercent > 0.5) notes.push('High profit potential');
        if (latencyRisk === 'high') notes.push('High latency risk - fast execution required');
        if (liquidityScore < 50) notes.push('Limited liquidity - reduce position size');
        if (maxTradeSize < 1000) notes.push('Small opportunity - may not be worth gas/fees');

        opportunities.push({
          id: `${symbol}-${buyExchange.exchange}-${sellExchange.exchange}-${now}`,
          symbol,
          baseAsset: buyExchange.baseAsset,
          quoteAsset: 'USDT',
          buyExchange: buyExchange.exchange,
          sellExchange: sellExchange.exchange,
          buyPrice,
          sellPrice,
          spread,
          spreadPercent,
          grossProfit,
          estimatedFees,
          netProfit,
          netProfitPercent,
          availableSize: Math.min(buyExchange.askSize, sellExchange.bidSize),
          maxTradeSize,
          profitAtMaxSize: netProfit,
          latencyRisk,
          liquidityScore,
          overallScore,
          direction: 'spot',
          expiresAt: now + 5000, // 5 second validity
          detectedAt: now,
          notes,
        });
      }
    }
  }

  return opportunities.sort((a, b) => b.overallScore - a.overallScore);
}

function calculateLatencyRisk(
  exchange1: string,
  exchange2: string
): 'low' | 'medium' | 'high' {
  // Exchanges with typically faster API responses
  const fastExchanges = new Set(['binance', 'bybit', 'okx']);
  const slowExchanges = new Set(['kraken', 'coinbase']);

  const isFast1 = fastExchanges.has(exchange1);
  const isFast2 = fastExchanges.has(exchange2);
  const isSlow1 = slowExchanges.has(exchange1);
  const isSlow2 = slowExchanges.has(exchange2);

  if (isFast1 && isFast2) return 'low';
  if (isSlow1 || isSlow2) return 'high';
  return 'medium';
}

function calculateLiquidityScore(
  buyExchange: ExchangePrice,
  sellExchange: ExchangePrice
): number {
  const minSize = Math.min(
    buyExchange.askSize * buyExchange.askPrice,
    sellExchange.bidSize * sellExchange.bidPrice
  );

  // Score based on available liquidity in USD
  if (minSize >= 100000) return 100;
  if (minSize >= 50000) return 80;
  if (minSize >= 10000) return 60;
  if (minSize >= 5000) return 40;
  if (minSize >= 1000) return 20;
  return 10;
}

function calculateOverallScore(
  profitPercent: number,
  latencyRisk: 'low' | 'medium' | 'high',
  liquidityScore: number
): number {
  const latencyMultiplier = latencyRisk === 'low' ? 1 : latencyRisk === 'medium' ? 0.7 : 0.4;
  const profitScore = Math.min(100, profitPercent * 100);
  
  return (profitScore * 0.5 + liquidityScore * 0.3) * latencyMultiplier + (latencyMultiplier * 20);
}

// =============================================================================
// Triangular Arbitrage
// =============================================================================

function detectTriangularArbitrage(
  allPrices: ExchangePrice[]
): TriangularArbitrage[] {
  const opportunities: TriangularArbitrage[] = [];
  const now = Date.now();

  // Group prices by exchange
  const pricesByExchange = new Map<string, Map<string, ExchangePrice>>();
  for (const price of allPrices) {
    if (!pricesByExchange.has(price.exchange)) {
      pricesByExchange.set(price.exchange, new Map());
    }
    pricesByExchange.get(price.exchange)!.set(price.symbol, price);
  }

  // Common triangular paths
  const trianglePaths = [
    ['BTC', 'ETH', 'USDT'],
    ['BTC', 'SOL', 'USDT'],
    ['ETH', 'SOL', 'USDT'],
    ['BTC', 'XRP', 'USDT'],
    ['ETH', 'LINK', 'USDT'],
  ];

  for (const [exchange, prices] of pricesByExchange.entries()) {
    for (const path of trianglePaths) {
      // Path: A -> B -> C -> A
      // Example: USDT -> BTC -> ETH -> USDT
      const [a, b, c] = path;
      
      const abSymbol = `${a}USDT`;
      const baSymbol = `${b}${a}`; // e.g., ETH/BTC
      const caSymbol = `${c}USDT`;
      
      const abPrice = prices.get(abSymbol);
      const baPrice = prices.get(baSymbol);
      const caPrice = prices.get(caSymbol);
      
      // Skip if we don't have all required pairs - no simulated data
      if (!abPrice || !caPrice) continue;

      // Calculate triangular rate
      // Start with 1000 USDT
      const startAmount = 1000;
      
      // Buy A with USDT (e.g., buy BTC with USDT)
      const aAmount = startAmount / abPrice.askPrice;
      
      // Convert A to B using the B/A pair if available
      // If B/A pair not available, try A/B pair inverse
      let bAmount: number;
      let hasRealRate = false;
      
      if (baPrice) {
        // We have B/A pair (e.g., ETH/BTC) - buy B with A
        bAmount = aAmount * baPrice.bidPrice * 0.999; // 0.1% slippage
        hasRealRate = true;
      } else {
        // Try to find the inverse pair A/B
        const abAltSymbol = `${a}${b}`;
        const abAltPrice = prices.get(abAltSymbol);
        if (abAltPrice) {
          // Sell A for B using A/B pair
          bAmount = aAmount / abAltPrice.askPrice * 0.999;
          hasRealRate = true;
        } else {
          // No real pair data available - skip this triangular opportunity
          continue;
        }
      }
      
      // Only proceed with real exchange rate data
      if (!hasRealRate) continue;
      
      // Sell C for USDT (but we have B, so we need B → USDT)
      // The path naming is confusing - let's use B to sell for USDT
      const bUsdtSymbol = `${b}USDT`;
      const bUsdtPrice = prices.get(bUsdtSymbol);
      
      if (!bUsdtPrice) continue; // Need real price data
      
      const endAmount = bAmount * bUsdtPrice.bidPrice * 0.999; // Including slippage

      const profit = endAmount - startAmount;
      const profitPercent = (profit / startAmount) * 100;

      if (profitPercent < 0.1) continue; // Min 0.1% profit

      const estimatedFees = startAmount * 0.003 * 3; // 0.3% per trade x 3 trades
      const netProfit = profit - estimatedFees;

      if (netProfit <= 0) continue;

      opportunities.push({
        id: `tri-${exchange}-${path.join('-')}-${now}`,
        path,
        exchanges: [exchange, exchange, exchange],
        legs: [
          { from: 'USDT', to: a, exchange, rate: 1 / abPrice.askPrice, side: 'buy' },
          { from: a, to: b, exchange, rate: 1, side: 'buy' },
          { from: b, to: 'USDT', exchange, rate: caPrice.bidPrice, side: 'sell' },
        ],
        startAmount,
        endAmount,
        profit,
        profitPercent,
        estimatedFees,
        netProfit,
        executionTime: 500, // Estimated ms
        riskScore: 70, // Medium risk
        detectedAt: now,
      });
    }
  }

  return opportunities.sort((a, b) => b.netProfit - a.netProfit);
}

// =============================================================================
// Main Scanner Function
// =============================================================================

export async function scanArbitrageOpportunities(): Promise<ArbitrageScanResult> {
  const cacheKey = 'arbitrage:scan:full';
  const cached = cache.get<ArbitrageScanResult>(cacheKey);
  if (cached) return cached;

  const startTime = Date.now();

  // Fetch prices from all exchanges in parallel
  const [binancePrices, bybitPrices, okxPrices, krakenPrices, kucoinPrices] = await Promise.all([
    fetchBinancePrices(),
    fetchBybitPrices(),
    fetchOKXPrices(),
    fetchKrakenPrices(),
    fetchKucoinPrices(),
  ]);

  const allPrices = [...binancePrices, ...bybitPrices, ...okxPrices, ...krakenPrices, ...kucoinPrices];

  // Group prices by symbol
  const pricesBySymbol = new Map<string, ExchangePrice[]>();
  for (const price of allPrices) {
    const existing = pricesBySymbol.get(price.symbol) || [];
    existing.push(price);
    pricesBySymbol.set(price.symbol, existing);
  }

  // Detect opportunities
  const opportunities = detectArbitrageOpportunities(pricesBySymbol);
  const triangular = detectTriangularArbitrage(allPrices);

  // Calculate summary statistics
  const exchangeStats: Record<string, { opportunities: number; avgSpread: number }> = {};
  const exchanges = ['binance', 'bybit', 'okx', 'kraken', 'kucoin'];
  
  for (const exchange of exchanges) {
    const exchangeOpps = opportunities.filter(
      o => o.buyExchange === exchange || o.sellExchange === exchange
    );
    const avgSpread = exchangeOpps.length > 0
      ? exchangeOpps.reduce((sum, o) => sum + o.spreadPercent, 0) / exchangeOpps.length
      : 0;
    
    exchangeStats[exchange] = {
      opportunities: exchangeOpps.length,
      avgSpread,
    };
  }

  const avgSpread = opportunities.length > 0
    ? opportunities.reduce((sum, o) => sum + o.spreadPercent, 0) / opportunities.length
    : 0;

  const result: ArbitrageScanResult = {
    opportunities: opportunities.slice(0, 100),
    triangular: triangular.slice(0, 20),
    priceData: Object.fromEntries(pricesBySymbol),
    summary: {
      totalOpportunities: opportunities.length,
      avgSpread,
      bestOpportunity: opportunities[0] || null,
      exchangeStats,
      scannedPairs: pricesBySymbol.size,
      scanDuration: Date.now() - startTime,
    },
    lastUpdated: new Date().toISOString(),
  };

  cache.set(cacheKey, result, 3); // 3 second cache
  return result;
}

// =============================================================================
// Real-time Monitoring
// =============================================================================

export interface ArbitrageMonitor {
  isRunning: boolean;
  lastScan: number;
  scanCount: number;
  profitableScans: number;
  totalProfitFound: number;
  alerts: ArbitrageAlert[];
}

export interface ArbitrageAlert {
  id: string;
  opportunity: ArbitrageOpportunity;
  alertType: 'new' | 'expired' | 'executed';
  timestamp: number;
}

let monitorState: ArbitrageMonitor = {
  isRunning: false,
  lastScan: 0,
  scanCount: 0,
  profitableScans: 0,
  totalProfitFound: 0,
  alerts: [],
};

export function getMonitorState(): ArbitrageMonitor {
  return { ...monitorState };
}

export function resetMonitor(): void {
  monitorState = {
    isRunning: false,
    lastScan: 0,
    scanCount: 0,
    profitableScans: 0,
    totalProfitFound: 0,
    alerts: [],
  };
}
