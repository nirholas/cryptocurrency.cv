/**
 * Arbitrage Scanner Service
 * 
 * Scans for price discrepancies across exchanges to identify
 * arbitrage opportunities for spot and futures markets.
 * 
 * Uses real exchange APIs - no mock data.
 */

// Types
export interface SpotPrice {
  exchange: string;
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  volume24h: number;
  timestamp: Date;
}

export interface ArbitrageOpportunity {
  id: string;
  type: 'spot' | 'futures' | 'triangular' | 'cross-chain';
  symbol: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  spreadPercent: number;
  spreadAbsolute: number;
  estimatedProfit: number;
  volume24h: number;
  risk: 'low' | 'medium' | 'high';
  fees: {
    buyFee: number;
    sellFee: number;
    withdrawFee: number;
    totalFees: number;
  };
  netProfit: number;
  executionTime: string;
  timestamp: Date;
}

export interface TriangularArbitrage {
  id: string;
  exchange: string;
  path: string[];
  pairs: string[];
  profitPercent: number;
  steps: Array<{
    pair: string;
    action: 'buy' | 'sell';
    rate: number;
  }>;
  timestamp: Date;
}

export interface CrossChainArbitrage {
  id: string;
  token: string;
  sourceChain: string;
  destChain: string;
  sourceDex: string;
  destDex: string;
  buyPrice: number;
  sellPrice: number;
  bridgeFee: number;
  gasCost: number;
  netProfit: number;
  profitPercent: number;
  bridgeTime: string;
  timestamp: Date;
}

// Exchange fee structure (taker fees)
const EXCHANGE_FEES: Record<string, number> = {
  binance: 0.001,
  coinbase: 0.006,
  kraken: 0.0026,
  bybit: 0.001,
  okx: 0.001,
  kucoin: 0.001,
  huobi: 0.002,
  gateio: 0.002,
  bitfinex: 0.002,
  gemini: 0.004,
};

// Withdrawal fees (in USD equivalent)
const WITHDRAWAL_FEES: Record<string, Record<string, number>> = {
  binance: { BTC: 15, ETH: 5, USDT: 1 },
  coinbase: { BTC: 0, ETH: 0, USDT: 0 }, // Free for Coinbase One
  kraken: { BTC: 10, ETH: 3, USDT: 2.5 },
  bybit: { BTC: 20, ETH: 8, USDT: 1 },
};

// Symbol mapping for exchange API compatibility
const SYMBOL_MAP: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  XRP: 'ripple',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  AVAX: 'avalanche-2',
  DOT: 'polkadot',
  LINK: 'chainlink',
  MATIC: 'matic-network',
  ATOM: 'cosmos',
  UNI: 'uniswap',
  LTC: 'litecoin',
  NEAR: 'near',
  APT: 'aptos',
  ARB: 'arbitrum',
};

// Supported trading pairs
const TRADING_PAIRS = [
  'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC',
  'ATOM', 'UNI', 'LTC', 'NEAR', 'APT', 'ARB',
];

// Cache
const priceCache = new Map<string, { data: SpotPrice[]; expires: number }>();
const CACHE_TTL = 10 * 1000; // 10 seconds for price data

/**
 * Fetch spot prices from Binance
 */
async function fetchBinancePrices(): Promise<SpotPrice[]> {
  try {
    const response = await fetch('https://api.binance.com/api/v3/ticker/bookTicker');
    if (!response.ok) {
      throw new Error(`Binance API error: ${response.status}`);
    }
    
    const data = await response.json();
    const prices: SpotPrice[] = [];
    
    for (const item of data) {
      const symbol = (item.symbol as string);
      // Only process USDT pairs for supported symbols
      if (!symbol.endsWith('USDT')) continue;
      const baseSymbol = symbol.replace('USDT', '');
      if (!TRADING_PAIRS.includes(baseSymbol)) continue;
      
      const bid = parseFloat(item.bidPrice);
      const ask = parseFloat(item.askPrice);
      const price = (bid + ask) / 2;
      const spread = ask - bid;
      
      prices.push({
        exchange: 'binance',
        symbol: baseSymbol,
        price,
        bid,
        ask,
        spread: (spread / price) * 100,
        volume24h: 0, // Would need separate API call
        timestamp: new Date(),
      });
    }
    
    return prices;
  } catch (error) {
    console.error('Binance price fetch error:', error);
    return [];
  }
}

/**
 * Fetch spot prices from Bybit
 */
async function fetchBybitPrices(): Promise<SpotPrice[]> {
  try {
    const response = await fetch('https://api.bybit.com/v5/market/tickers?category=spot');
    if (!response.ok) {
      throw new Error(`Bybit API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.retCode !== 0) {
      throw new Error(data.retMsg);
    }
    
    const prices: SpotPrice[] = [];
    
    for (const item of data.result.list) {
      const symbol = (item.symbol as string);
      if (!symbol.endsWith('USDT')) continue;
      const baseSymbol = symbol.replace('USDT', '');
      if (!TRADING_PAIRS.includes(baseSymbol)) continue;
      
      const bid = parseFloat(item.bid1Price);
      const ask = parseFloat(item.ask1Price);
      const price = parseFloat(item.lastPrice);
      const spread = ask - bid;
      
      prices.push({
        exchange: 'bybit',
        symbol: baseSymbol,
        price,
        bid,
        ask,
        spread: spread > 0 && price > 0 ? (spread / price) * 100 : 0,
        volume24h: parseFloat(item.turnover24h) || 0,
        timestamp: new Date(),
      });
    }
    
    return prices;
  } catch (error) {
    console.error('Bybit price fetch error:', error);
    return [];
  }
}

/**
 * Fetch spot prices from OKX
 */
async function fetchOKXPrices(): Promise<SpotPrice[]> {
  try {
    const response = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
    if (!response.ok) {
      throw new Error(`OKX API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.code !== '0') {
      throw new Error(data.msg);
    }
    
    const prices: SpotPrice[] = [];
    
    for (const item of data.data) {
      const symbol = (item.instId as string);
      if (!symbol.endsWith('-USDT')) continue;
      const baseSymbol = symbol.replace('-USDT', '');
      if (!TRADING_PAIRS.includes(baseSymbol)) continue;
      
      const bid = parseFloat(item.bidPx);
      const ask = parseFloat(item.askPx);
      const price = parseFloat(item.last);
      const spread = ask - bid;
      
      prices.push({
        exchange: 'okx',
        symbol: baseSymbol,
        price,
        bid,
        ask,
        spread: spread > 0 && price > 0 ? (spread / price) * 100 : 0,
        volume24h: parseFloat(item.vol24h) * price || 0,
        timestamp: new Date(),
      });
    }
    
    return prices;
  } catch (error) {
    console.error('OKX price fetch error:', error);
    return [];
  }
}

/**
 * Fetch spot prices from Kraken
 */
async function fetchKrakenPrices(): Promise<SpotPrice[]> {
  try {
    // Kraken uses different symbol naming
    const krakenPairs = {
      'XXBTZUSD': 'BTC',
      'XETHZUSD': 'ETH',
      'SOLUSD': 'SOL',
      'XXRPZUSD': 'XRP',
      'XDGUSD': 'DOGE',
      'ADAUSD': 'ADA',
      'AVAXUSD': 'AVAX',
      'DOTUSD': 'DOT',
      'LINKUSD': 'LINK',
    };
    
    const pairs = Object.keys(krakenPairs).join(',');
    const response = await fetch(`https://api.kraken.com/0/public/Ticker?pair=${pairs}`);
    if (!response.ok) {
      throw new Error(`Kraken API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.error && data.error.length > 0) {
      throw new Error(data.error[0]);
    }
    
    const prices: SpotPrice[] = [];
    
    for (const [pair, info] of Object.entries(data.result || {})) {
      const baseSymbol = krakenPairs[pair as keyof typeof krakenPairs];
      if (!baseSymbol) continue;
      
      const tickerData = info as { b: string[]; a: string[]; c: string[]; v: string[] };
      const bid = parseFloat(tickerData.b[0]);
      const ask = parseFloat(tickerData.a[0]);
      const price = parseFloat(tickerData.c[0]);
      const spread = ask - bid;
      
      prices.push({
        exchange: 'kraken',
        symbol: baseSymbol,
        price,
        bid,
        ask,
        spread: spread > 0 && price > 0 ? (spread / price) * 100 : 0,
        volume24h: parseFloat(tickerData.v[1]) * price || 0,
        timestamp: new Date(),
      });
    }
    
    return prices;
  } catch (error) {
    console.error('Kraken price fetch error:', error);
    return [];
  }
}

/**
 * Fetch spot prices from KuCoin
 */
async function fetchKuCoinPrices(): Promise<SpotPrice[]> {
  try {
    const response = await fetch('https://api.kucoin.com/api/v1/market/allTickers');
    if (!response.ok) {
      throw new Error(`KuCoin API error: ${response.status}`);
    }
    
    const data = await response.json();
    if (data.code !== '200000') {
      throw new Error(data.msg);
    }
    
    const prices: SpotPrice[] = [];
    
    for (const item of data.data.ticker) {
      const symbol = (item.symbol as string);
      if (!symbol.endsWith('-USDT')) continue;
      const baseSymbol = symbol.replace('-USDT', '');
      if (!TRADING_PAIRS.includes(baseSymbol)) continue;
      
      const bid = parseFloat(item.buy);
      const ask = parseFloat(item.sell);
      const price = parseFloat(item.last);
      const spread = ask - bid;
      
      prices.push({
        exchange: 'kucoin',
        symbol: baseSymbol,
        price,
        bid,
        ask,
        spread: spread > 0 && price > 0 ? (spread / price) * 100 : 0,
        volume24h: parseFloat(item.volValue) || 0,
        timestamp: new Date(),
      });
    }
    
    return prices;
  } catch (error) {
    console.error('KuCoin price fetch error:', error);
    return [];
  }
}

/**
 * Get all spot prices from all exchanges
 * Fetches real data from multiple exchange APIs in parallel
 */
export async function getAllSpotPrices(): Promise<SpotPrice[]> {
  const cacheKey = 'all_spot_prices';
  const cached = priceCache.get(cacheKey);
  
  if (cached && cached.expires > Date.now()) {
    return cached.data;
  }
  
  // Fetch from all exchanges in parallel
  const results = await Promise.allSettled([
    fetchBinancePrices(),
    fetchBybitPrices(),
    fetchOKXPrices(),
    fetchKrakenPrices(),
    fetchKuCoinPrices(),
  ]);
  
  const allPrices: SpotPrice[] = [];
  
  for (const result of results) {
    if (result.status === 'fulfilled') {
      allPrices.push(...result.value);
    }
  }
  
  priceCache.set(cacheKey, {
    data: allPrices,
    expires: Date.now() + CACHE_TTL,
  });
  
  return allPrices;
}

/**
 * Scan for spot arbitrage opportunities
 */
export async function scanSpotArbitrage(minSpread = 0.1): Promise<ArbitrageOpportunity[]> {
  const allPrices = await getAllSpotPrices();
  const opportunities: ArbitrageOpportunity[] = [];
  
  // Group by symbol
  const bySymbol = new Map<string, SpotPrice[]>();
  for (const price of allPrices) {
    const existing = bySymbol.get(price.symbol) || [];
    existing.push(price);
    bySymbol.set(price.symbol, existing);
  }
  
  // Find arbitrage opportunities
  for (const [symbol, prices] of bySymbol) {
    if (prices.length < 2) continue;
    
    // Sort by ask price (where we buy)
    const sortedByAsk = [...prices].sort((a, b) => a.ask - b.ask);
    // Sort by bid price (where we sell)
    const sortedByBid = [...prices].sort((a, b) => b.bid - a.bid);
    
    const buyFrom = sortedByAsk[0]; // Lowest ask
    const sellTo = sortedByBid[0]; // Highest bid
    
    if (buyFrom.exchange === sellTo.exchange) continue;
    
    const spreadAbsolute = sellTo.bid - buyFrom.ask;
    const spreadPercent = (spreadAbsolute / buyFrom.ask) * 100;
    
    if (spreadPercent >= minSpread) {
      // Calculate fees
      const buyFee = buyFrom.ask * (EXCHANGE_FEES[buyFrom.exchange] || 0.001);
      const sellFee = sellTo.bid * (EXCHANGE_FEES[sellTo.exchange] || 0.001);
      const withdrawFee = WITHDRAWAL_FEES[buyFrom.exchange]?.[symbol] || 5;
      const totalFees = buyFee + sellFee + withdrawFee;
      
      const estimatedProfit = spreadAbsolute * 1000; // Assuming $1000 trade
      const netProfit = estimatedProfit - (totalFees * 1000 / buyFrom.ask);
      
      // Risk assessment
      let risk: 'low' | 'medium' | 'high' = 'medium';
      if (spreadPercent > 1) risk = 'high'; // Large spread = high risk
      else if (spreadPercent < 0.3) risk = 'low';
      
      // Consider volume
      const minVolume = Math.min(buyFrom.volume24h, sellTo.volume24h);
      if (minVolume < 100000) risk = 'high'; // Low liquidity
      
      opportunities.push({
        id: `arb_${symbol}_${buyFrom.exchange}_${sellTo.exchange}`,
        type: 'spot',
        symbol,
        buyExchange: buyFrom.exchange,
        sellExchange: sellTo.exchange,
        buyPrice: buyFrom.ask,
        sellPrice: sellTo.bid,
        spreadPercent,
        spreadAbsolute,
        estimatedProfit,
        volume24h: minVolume,
        risk,
        fees: {
          buyFee,
          sellFee,
          withdrawFee,
          totalFees,
        },
        netProfit,
        executionTime: '5-30 min',
        timestamp: new Date(),
      });
    }
  }
  
  return opportunities.sort((a, b) => b.netProfit - a.netProfit);
}

/**
 * Scan for triangular arbitrage within an exchange
 */
export async function scanTriangularArbitrage(exchange = 'binance'): Promise<TriangularArbitrage[]> {
  const opportunities: TriangularArbitrage[] = [];
  
  // Common triangular paths
  const paths = [
    ['BTC', 'ETH', 'USDT'],
    ['BTC', 'SOL', 'USDT'],
    ['ETH', 'SOL', 'USDT'],
    ['BTC', 'DOGE', 'USDT'],
    ['BTC', 'XRP', 'USDT'],
  ];
  
  for (const path of paths) {
    try {
      // Fetch real ticker data from Binance
      const pairs = [
        `${path[0]}${path[1]}`,
        `${path[1]}${path[2]}`,
        `${path[2]}${path[0]}`,
      ];
      
      const tickerResponses = await Promise.all(
        pairs.map(pair => 
          fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${pair}`)
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      );
      
      // Skip if any ticker failed
      if (tickerResponses.some(r => !r)) continue;
      
      const [ticker1, ticker2, ticker3] = tickerResponses;
      
      // Calculate rates using bid/ask for realistic execution
      const step1Rate = parseFloat(ticker1.askPrice); // Buy first pair
      const step2Rate = parseFloat(ticker2.bidPrice); // Sell second pair
      const step3Rate = parseFloat(ticker3.bidPrice); // Sell third pair
      
      // Calculate triangular profit
      // Start with 1 USDT -> BTC -> ETH -> USDT
      const afterStep1 = 1 / step1Rate; // Amount of path[0]
      const afterStep2 = afterStep1 * step2Rate; // Amount of path[1]
      const afterStep3 = afterStep2 * step3Rate; // Back to USDT
      
      const profitPercent = (afterStep3 - 1) * 100;
      
      if (profitPercent > 0.05) {
        opportunities.push({
          id: `tri_${exchange}_${path.join('_')}`,
          exchange,
          path,
          pairs,
          profitPercent,
          steps: [
            { pair: pairs[0], action: 'buy', rate: step1Rate },
            { pair: pairs[1], action: 'sell', rate: step2Rate },
            { pair: pairs[2], action: 'sell', rate: step3Rate },
          ],
          timestamp: new Date(),
        });
      }
    } catch {
      // Skip this path if API fails
      continue;
    }
  }
  
  return opportunities.sort((a, b) => b.profitPercent - a.profitPercent);
}

/**
 * Scan for cross-chain arbitrage opportunities
 */
export async function scanCrossChainArbitrage(): Promise<CrossChainArbitrage[]> {
  const opportunities: CrossChainArbitrage[] = [];
  
  const tokens = [
    { symbol: 'ETH', geckoId: 'ethereum' },
    { symbol: 'WBTC', geckoId: 'wrapped-bitcoin' },
  ];
  
  const chains = [
    { name: 'Ethereum', dex: 'Uniswap', chainId: 'ethereum', bridgeFee: 10, bridgeTime: '10-15 min' },
    { name: 'Arbitrum', dex: 'GMX', chainId: 'arbitrum-one', bridgeFee: 2, bridgeTime: '1-5 min' },
    { name: 'Optimism', dex: 'Velodrome', chainId: 'optimistic-ethereum', bridgeFee: 2, bridgeTime: '1-5 min' },
    { name: 'Base', dex: 'Aerodrome', chainId: 'base', bridgeFee: 1, bridgeTime: '1-5 min' },
    { name: 'Polygon', dex: 'QuickSwap', chainId: 'polygon-pos', bridgeFee: 0.5, bridgeTime: '5-10 min' },
  ];
  
  for (const token of tokens) {
    try {
      // Fetch prices across chains from CoinGecko
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/${token.geckoId}?localization=false&tickers=true&market_data=true`,
        { next: { revalidate: 30 } }
      );
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const basePrice = data.market_data?.current_price?.usd || 0;
      
      if (basePrice === 0) continue;
      
      // Get DEX prices from tickers
      const dexPrices: Record<string, number> = {};
      for (const ticker of data.tickers || []) {
        const exchange = ticker.market?.identifier?.toLowerCase();
        const chain = chains.find(c => 
          c.dex.toLowerCase() === exchange ||
          ticker.market?.name?.toLowerCase().includes(c.dex.toLowerCase())
        );
        if (chain && ticker.last) {
          dexPrices[chain.name] = ticker.last;
        }
      }
      
      // Use base price for chains without specific DEX price
      for (const chain of chains) {
        if (!dexPrices[chain.name]) {
          dexPrices[chain.name] = basePrice;
        }
      }
      
      // Compare prices between chains
      for (let i = 0; i < chains.length; i++) {
        for (let j = i + 1; j < chains.length; j++) {
          const source = chains[i];
          const dest = chains[j];
          
          const sourcePrice = dexPrices[source.name];
          const destPrice = dexPrices[dest.name];
          
          const bridgeFee = source.bridgeFee + dest.bridgeFee;
          const gasCost = 8; // Estimated gas in USD
          
          const profitAbsolute = Math.abs(destPrice - sourcePrice) * 10 - bridgeFee - gasCost;
          const profitPercent = (profitAbsolute / (sourcePrice * 10)) * 100;
          
          if (profitPercent > 0.1) {
            const isBuyOnSource = sourcePrice < destPrice;
            
            opportunities.push({
              id: `xchain_${token.symbol}_${source.name}_${dest.name}`,
              token: token.symbol,
              sourceChain: isBuyOnSource ? source.name : dest.name,
              destChain: isBuyOnSource ? dest.name : source.name,
              sourceDex: isBuyOnSource ? source.dex : dest.dex,
              destDex: isBuyOnSource ? dest.dex : source.dex,
              buyPrice: Math.min(sourcePrice, destPrice),
              sellPrice: Math.max(sourcePrice, destPrice),
              bridgeFee,
              gasCost,
              netProfit: profitAbsolute,
              profitPercent,
              bridgeTime: `${source.bridgeTime}`,
              timestamp: new Date(),
            });
          }
        }
      }
    } catch {
      // Skip this token if API fails
      continue;
    }
  }
  
  return opportunities.sort((a, b) => b.netProfit - a.netProfit);
}

/**
 * Get arbitrage summary statistics
 */
export async function getArbitrageSummary(): Promise<{
  spotOpportunities: number;
  triangularOpportunities: number;
  crossChainOpportunities: number;
  bestSpot: ArbitrageOpportunity | null;
  bestTriangular: TriangularArbitrage | null;
  bestCrossChain: CrossChainArbitrage | null;
  totalPotentialProfit: number;
}> {
  const [spot, triangular, crossChain] = await Promise.all([
    scanSpotArbitrage(0.05),
    scanTriangularArbitrage(),
    scanCrossChainArbitrage(),
  ]);
  
  const totalPotentialProfit = 
    spot.reduce((sum, o) => sum + o.netProfit, 0) +
    crossChain.reduce((sum, o) => sum + o.netProfit, 0);
  
  return {
    spotOpportunities: spot.length,
    triangularOpportunities: triangular.length,
    crossChainOpportunities: crossChain.length,
    bestSpot: spot[0] || null,
    bestTriangular: triangular[0] || null,
    bestCrossChain: crossChain[0] || null,
    totalPotentialProfit,
  };
}
