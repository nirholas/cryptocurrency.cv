/**
 * Options Flow Tracking Service
 * 
 * Real-time crypto options data aggregation from free public sources.
 * Tracks unusual activity, large trades, and market positioning.
 * 
 * Data Sources (All Free):
 * - Deribit public API (largest crypto options exchange)
 * - OKX options public data
 * - Bybit options market data
 * - Greeks.live aggregated data
 * 
 * @module lib/options-flow
 */

import { cache } from './cache';

// =============================================================================
// Types
// =============================================================================

export interface OptionContract {
  symbol: string;
  underlying: string;
  strike: number;
  expiry: string;
  expiryTimestamp: number;
  type: 'call' | 'put';
  exchange: string;
}

export interface OptionTicker {
  contract: OptionContract;
  markPrice: number;
  markIV: number;
  bidPrice: number;
  bidSize: number;
  bidIV: number;
  askPrice: number;
  askSize: number;
  askIV: number;
  lastPrice: number;
  lastSize: number;
  volume24h: number;
  openInterest: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  underlyingPrice: number;
  timestamp: number;
}

export interface OptionTrade {
  id: string;
  contract: OptionContract;
  price: number;
  size: number;
  side: 'buy' | 'sell';
  timestamp: number;
  notionalValue: number;
  premium: number;
  impliedVolatility: number;
  isBlock: boolean;
  isUnusual: boolean;
  unusualReason?: string[];
}

export interface OptionsFlow {
  trades: OptionTrade[];
  summary: {
    totalVolume: number;
    totalPremium: number;
    callVolume: number;
    putVolume: number;
    callPremium: number;
    putPremium: number;
    putCallRatio: number;
    avgIV: number;
    blockTrades: number;
    unusualTrades: number;
  };
  topTrades: OptionTrade[];
  byExpiry: Record<string, { calls: number; puts: number; premium: number }>;
  byStrike: { strike: number; calls: number; puts: number; premium: number }[];
  timestamp: string;
}

export interface VolatilitySurface {
  underlying: string;
  spotPrice: number;
  strikes: number[];
  expiries: string[];
  ivMatrix: number[][]; // [expiry][strike]
  atmIV: Record<string, number>;
  skew: Record<string, number>;
  termStructure: { days: number; iv: number }[];
  timestamp: string;
}

export interface MaxPainAnalysis {
  underlying: string;
  expiry: string;
  maxPainPrice: number;
  currentPrice: number;
  distanceToMaxPain: number;
  distancePercent: number;
  callOI: { strike: number; oi: number }[];
  putOI: { strike: number; oi: number }[];
  totalCallOI: number;
  totalPutOI: number;
  putCallOIRatio: number;
}

export interface GammaExposure {
  underlying: string;
  spotPrice: number;
  netGamma: number;
  gammaFlipPrice: number;
  gammaByStrike: { strike: number; gamma: number }[];
  totalDealerGamma: number;
  marketMakerPositioning: 'long_gamma' | 'short_gamma' | 'neutral';
  expectedVolatility: 'low' | 'medium' | 'high';
}

// =============================================================================
// Configuration
// =============================================================================

const DERIBIT_API = 'https://www.deribit.com/api/v2/public';
const OKX_API = 'https://www.okx.com/api/v5';
const BYBIT_API = 'https://api.bybit.com/v5';

const CACHE_TTL = {
  tickers: 10,
  trades: 5,
  flow: 30,
  surface: 60,
  maxPain: 300,
  gamma: 60,
};

// Block trade threshold (notional value in USD)
const BLOCK_TRADE_THRESHOLD = 100000;
const UNUSUAL_SIZE_MULTIPLIER = 5; // 5x average = unusual

// =============================================================================
// Deribit API Functions
// =============================================================================

interface DeribitInstrument {
  instrument_name: string;
  base_currency: string;
  quote_currency: string;
  strike: number;
  expiration_timestamp: number;
  option_type: 'call' | 'put';
  is_active: boolean;
}

interface DeribitTicker {
  instrument_name: string;
  mark_price: number;
  mark_iv: number;
  best_bid_price: number;
  best_bid_amount: number;
  best_ask_price: number;
  best_ask_amount: number;
  last_price: number;
  open_interest: number;
  greeks: {
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
  };
  underlying_price: number;
  timestamp: number;
}

async function fetchDeribitInstruments(currency: string = 'BTC'): Promise<OptionContract[]> {
  const cacheKey = `deribit:instruments:${currency}`;
  const cached = cache.get<OptionContract[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${DERIBIT_API}/get_instruments?currency=${currency}&kind=option&expired=false`
    );
    
    if (!response.ok) throw new Error(`Deribit API error: ${response.status}`);
    
    const result = await response.json();
    const instruments: DeribitInstrument[] = result.result || [];
    
    const contracts: OptionContract[] = instruments
      .filter(i => i.is_active)
      .map(i => ({
        symbol: i.instrument_name,
        underlying: currency,
        strike: i.strike,
        expiry: new Date(i.expiration_timestamp).toISOString().split('T')[0],
        expiryTimestamp: i.expiration_timestamp,
        type: i.option_type,
        exchange: 'deribit',
      }));

    cache.set(cacheKey, contracts, 3600); // Cache for 1 hour
    return contracts;
  } catch (error) {
    console.error('Deribit instruments fetch error:', error);
    return [];
  }
}

async function fetchDeribitTickers(currency: string = 'BTC'): Promise<OptionTicker[]> {
  const cacheKey = `deribit:tickers:${currency}`;
  const cached = cache.get<OptionTicker[]>(cacheKey);
  if (cached) return cached;

  try {
    // Get book summary for all options
    const response = await fetch(
      `${DERIBIT_API}/get_book_summary_by_currency?currency=${currency}&kind=option`
    );
    
    if (!response.ok) throw new Error(`Deribit API error: ${response.status}`);
    
    const result = await response.json();
    const summaries = result.result || [];
    
    const now = Date.now();
    const tickers: OptionTicker[] = summaries.map((s: {
      instrument_name: string;
      mark_price: number;
      mark_iv: number;
      bid_price: number;
      ask_price: number;
      last: number;
      volume: number;
      open_interest: number;
      underlying_price: number;
    }) => {
      // Parse instrument name: BTC-26JAN26-100000-C
      const parts = s.instrument_name.split('-');
      const strike = parseFloat(parts[2]);
      const type = parts[3] === 'C' ? 'call' : 'put';
      const expiry = parseExpiryDate(parts[1]);
      
      return {
        contract: {
          symbol: s.instrument_name,
          underlying: currency,
          strike,
          expiry,
          expiryTimestamp: new Date(expiry).getTime(),
          type,
          exchange: 'deribit',
        },
        markPrice: s.mark_price * s.underlying_price, // Convert from BTC to USD
        markIV: s.mark_iv,
        bidPrice: (s.bid_price || 0) * s.underlying_price,
        bidSize: 0,
        bidIV: 0,
        askPrice: (s.ask_price || 0) * s.underlying_price,
        askSize: 0,
        askIV: 0,
        lastPrice: (s.last || 0) * s.underlying_price,
        lastSize: 0,
        volume24h: s.volume || 0,
        openInterest: s.open_interest || 0,
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        underlyingPrice: s.underlying_price,
        timestamp: now,
      };
    });

    cache.set(cacheKey, tickers, CACHE_TTL.tickers);
    return tickers;
  } catch (error) {
    console.error('Deribit tickers fetch error:', error);
    return [];
  }
}

async function fetchDeribitTrades(currency: string = 'BTC', count: number = 100): Promise<OptionTrade[]> {
  const cacheKey = `deribit:trades:${currency}:${count}`;
  const cached = cache.get<OptionTrade[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(
      `${DERIBIT_API}/get_last_trades_by_currency?currency=${currency}&kind=option&count=${count}`
    );
    
    if (!response.ok) throw new Error(`Deribit API error: ${response.status}`);
    
    const result = await response.json();
    const rawTrades = result.result?.trades || [];
    
    // Calculate average trade size for unusual detection
    const avgSize = rawTrades.length > 0
      ? rawTrades.reduce((sum: number, t: { amount: number }) => sum + t.amount, 0) / rawTrades.length
      : 0;
    
    const trades: OptionTrade[] = rawTrades.map((t: {
      trade_id: string;
      instrument_name: string;
      price: number;
      amount: number;
      direction: string;
      timestamp: number;
      iv: number;
      index_price: number;
    }) => {
      const parts = t.instrument_name.split('-');
      const strike = parseFloat(parts[2]);
      const type = parts[3] === 'C' ? 'call' : 'put';
      const expiry = parseExpiryDate(parts[1]);
      
      const notionalValue = t.amount * t.index_price;
      const premium = t.price * t.amount * t.index_price;
      const isBlock = notionalValue >= BLOCK_TRADE_THRESHOLD;
      const isUnusual = t.amount > avgSize * UNUSUAL_SIZE_MULTIPLIER;
      
      const unusualReason: string[] = [];
      if (isBlock) unusualReason.push('Block trade');
      if (isUnusual) unusualReason.push('Size significantly above average');
      if (t.iv > 100) unusualReason.push('High IV trade');
      
      return {
        id: t.trade_id,
        contract: {
          symbol: t.instrument_name,
          underlying: currency,
          strike,
          expiry,
          expiryTimestamp: new Date(expiry).getTime(),
          type,
          exchange: 'deribit',
        },
        price: t.price * t.index_price,
        size: t.amount,
        side: t.direction as 'buy' | 'sell',
        timestamp: t.timestamp,
        notionalValue,
        premium,
        impliedVolatility: t.iv,
        isBlock,
        isUnusual: isUnusual || isBlock,
        unusualReason: unusualReason.length > 0 ? unusualReason : undefined,
      };
    });

    cache.set(cacheKey, trades, CACHE_TTL.trades);
    return trades;
  } catch (error) {
    console.error('Deribit trades fetch error:', error);
    return [];
  }
}

// =============================================================================
// OKX Options API
// =============================================================================

async function fetchOKXOptionsTickers(underlying: string = 'BTC-USD'): Promise<OptionTicker[]> {
  const cacheKey = `okx:options:${underlying}`;
  const cached = cache.get<OptionTicker[]>(cacheKey);
  if (cached) return cached;

  try {
    const response = await fetch(`${OKX_API}/market/tickers?instType=OPTION&uly=${underlying}`);
    
    if (!response.ok) throw new Error(`OKX API error: ${response.status}`);
    
    const result = await response.json();
    const data = result.data || [];
    
    const now = Date.now();
    const tickers: OptionTicker[] = data.map((t: {
      instId: string;
      last: string;
      bidPx: string;
      bidSz: string;
      askPx: string;
      askSz: string;
      vol24h: string;
      volCcy24h: string;
      ts: string;
    }) => {
      // Parse OKX instrument: BTC-USD-260126-100000-C
      const parts = t.instId.split('-');
      const strike = parseFloat(parts[3]);
      const type = parts[4] === 'C' ? 'call' : 'put';
      const expiry = `20${parts[2].slice(0, 2)}-${parts[2].slice(2, 4)}-${parts[2].slice(4, 6)}`;
      
      return {
        contract: {
          symbol: t.instId,
          underlying: parts[0],
          strike,
          expiry,
          expiryTimestamp: new Date(expiry).getTime(),
          type,
          exchange: 'okx',
        },
        markPrice: 0,
        markIV: 0,
        bidPrice: parseFloat(t.bidPx) || 0,
        bidSize: parseFloat(t.bidSz) || 0,
        bidIV: 0,
        askPrice: parseFloat(t.askPx) || 0,
        askSize: parseFloat(t.askSz) || 0,
        askIV: 0,
        lastPrice: parseFloat(t.last) || 0,
        lastSize: 0,
        volume24h: parseFloat(t.vol24h) || 0,
        openInterest: 0,
        delta: 0,
        gamma: 0,
        theta: 0,
        vega: 0,
        underlyingPrice: 0,
        timestamp: now,
      };
    });

    cache.set(cacheKey, tickers, CACHE_TTL.tickers);
    return tickers;
  } catch (error) {
    console.error('OKX options tickers fetch error:', error);
    return [];
  }
}

// =============================================================================
// Helper Functions
// =============================================================================

function parseExpiryDate(expiryStr: string): string {
  // Parse Deribit format: 26JAN26 -> 2026-01-26
  const day = expiryStr.slice(0, 2);
  const monthStr = expiryStr.slice(2, 5);
  const year = `20${expiryStr.slice(5, 7)}`;
  
  const months: Record<string, string> = {
    JAN: '01', FEB: '02', MAR: '03', APR: '04', MAY: '05', JUN: '06',
    JUL: '07', AUG: '08', SEP: '09', OCT: '10', NOV: '11', DEC: '12',
  };
  
  return `${year}-${months[monthStr]}-${day}`;
}

// =============================================================================
// Options Flow Aggregation
// =============================================================================

export async function getOptionsFlow(
  underlying: string = 'BTC',
  limit: number = 100
): Promise<OptionsFlow> {
  const cacheKey = `options:flow:${underlying}:${limit}`;
  const cached = cache.get<OptionsFlow>(cacheKey);
  if (cached) return cached;

  // Fetch trades from Deribit (primary source)
  const trades = await fetchDeribitTrades(underlying, limit);
  
  // Calculate summary statistics
  let totalVolume = 0;
  let totalPremium = 0;
  let callVolume = 0;
  let putVolume = 0;
  let callPremium = 0;
  let putPremium = 0;
  let totalIV = 0;
  let blockTrades = 0;
  let unusualTrades = 0;
  
  const byExpiry: Record<string, { calls: number; puts: number; premium: number }> = {};
  const byStrikeMap = new Map<number, { calls: number; puts: number; premium: number }>();

  for (const trade of trades) {
    totalVolume += trade.size;
    totalPremium += trade.premium;
    totalIV += trade.impliedVolatility;
    
    if (trade.contract.type === 'call') {
      callVolume += trade.size;
      callPremium += trade.premium;
    } else {
      putVolume += trade.size;
      putPremium += trade.premium;
    }
    
    if (trade.isBlock) blockTrades++;
    if (trade.isUnusual) unusualTrades++;
    
    // By expiry
    const expiry = trade.contract.expiry;
    if (!byExpiry[expiry]) {
      byExpiry[expiry] = { calls: 0, puts: 0, premium: 0 };
    }
    byExpiry[expiry].premium += trade.premium;
    if (trade.contract.type === 'call') {
      byExpiry[expiry].calls += trade.size;
    } else {
      byExpiry[expiry].puts += trade.size;
    }
    
    // By strike
    const strike = trade.contract.strike;
    if (!byStrikeMap.has(strike)) {
      byStrikeMap.set(strike, { calls: 0, puts: 0, premium: 0 });
    }
    const strikeData = byStrikeMap.get(strike)!;
    strikeData.premium += trade.premium;
    if (trade.contract.type === 'call') {
      strikeData.calls += trade.size;
    } else {
      strikeData.puts += trade.size;
    }
  }

  const byStrike = Array.from(byStrikeMap.entries())
    .map(([strike, data]) => ({ strike, ...data }))
    .sort((a, b) => a.strike - b.strike);

  const flow: OptionsFlow = {
    trades,
    summary: {
      totalVolume,
      totalPremium,
      callVolume,
      putVolume,
      callPremium,
      putPremium,
      putCallRatio: callVolume > 0 ? putVolume / callVolume : 0,
      avgIV: trades.length > 0 ? totalIV / trades.length : 0,
      blockTrades,
      unusualTrades,
    },
    topTrades: trades
      .filter(t => t.isUnusual)
      .sort((a, b) => b.notionalValue - a.notionalValue)
      .slice(0, 10),
    byExpiry,
    byStrike,
    timestamp: new Date().toISOString(),
  };

  cache.set(cacheKey, flow, CACHE_TTL.flow);
  return flow;
}

// =============================================================================
// Volatility Surface
// =============================================================================

export async function getVolatilitySurface(underlying: string = 'BTC'): Promise<VolatilitySurface> {
  const cacheKey = `options:surface:${underlying}`;
  const cached = cache.get<VolatilitySurface>(cacheKey);
  if (cached) return cached;

  const tickers = await fetchDeribitTickers(underlying);
  
  if (tickers.length === 0) {
    throw new Error('No options data available');
  }

  // Get unique strikes and expiries
  const strikeSet = new Set<number>();
  const expirySet = new Set<string>();
  const spotPrice = tickers[0]?.underlyingPrice || 0;
  
  for (const ticker of tickers) {
    strikeSet.add(ticker.contract.strike);
    expirySet.add(ticker.contract.expiry);
  }
  
  const strikes = Array.from(strikeSet).sort((a, b) => a - b);
  const expiries = Array.from(expirySet).sort();
  
  // Build IV matrix
  const ivMatrix: number[][] = [];
  const atmIV: Record<string, number> = {};
  const skew: Record<string, number> = {};
  
  // Create lookup map
  const ivMap = new Map<string, number>();
  for (const ticker of tickers) {
    if (ticker.markIV > 0) {
      const key = `${ticker.contract.expiry}-${ticker.contract.strike}-${ticker.contract.type}`;
      ivMap.set(key, ticker.markIV);
    }
  }
  
  for (const expiry of expiries) {
    const row: number[] = [];
    let atmStrike = strikes.reduce((prev, curr) => 
      Math.abs(curr - spotPrice) < Math.abs(prev - spotPrice) ? curr : prev
    );
    
    for (const strike of strikes) {
      // Use call IV for above spot, put IV for below
      const type = strike >= spotPrice ? 'call' : 'put';
      const key = `${expiry}-${strike}-${type}`;
      const iv = ivMap.get(key) || 0;
      row.push(iv);
    }
    ivMatrix.push(row);
    
    // Calculate ATM IV
    const atmKey = `${expiry}-${atmStrike}-call`;
    atmIV[expiry] = ivMap.get(atmKey) || 0;
    
    // Calculate skew (25 delta put IV - 25 delta call IV approximation)
    const lowStrike = strikes.find(s => s <= spotPrice * 0.9) || strikes[0];
    const highStrike = strikes.find(s => s >= spotPrice * 1.1) || strikes[strikes.length - 1];
    const putIV = ivMap.get(`${expiry}-${lowStrike}-put`) || 0;
    const callIV = ivMap.get(`${expiry}-${highStrike}-call`) || 0;
    skew[expiry] = putIV - callIV;
  }
  
  // Build term structure
  const now = Date.now();
  const termStructure = expiries.map(expiry => ({
    days: Math.ceil((new Date(expiry).getTime() - now) / (1000 * 60 * 60 * 24)),
    iv: atmIV[expiry] || 0,
  })).filter(t => t.days > 0);

  const surface: VolatilitySurface = {
    underlying,
    spotPrice,
    strikes,
    expiries,
    ivMatrix,
    atmIV,
    skew,
    termStructure,
    timestamp: new Date().toISOString(),
  };

  cache.set(cacheKey, surface, CACHE_TTL.surface);
  return surface;
}

// =============================================================================
// Max Pain Calculation
// =============================================================================

export async function getMaxPain(
  underlying: string = 'BTC',
  expiry?: string
): Promise<MaxPainAnalysis> {
  const tickers = await fetchDeribitTickers(underlying);
  
  if (tickers.length === 0) {
    throw new Error('No options data available');
  }

  // Get closest expiry if not specified
  const expiries = [...new Set(tickers.map(t => t.contract.expiry))].sort();
  const targetExpiry = expiry || expiries[0];
  
  // Filter tickers for target expiry
  const expiryTickers = tickers.filter(t => t.contract.expiry === targetExpiry);
  
  // Get spot price
  const spotPrice = expiryTickers[0]?.underlyingPrice || 0;
  
  // Get all strikes
  const strikes = [...new Set(expiryTickers.map(t => t.contract.strike))].sort((a, b) => a - b);
  
  // Build OI data
  const callOI: { strike: number; oi: number }[] = [];
  const putOI: { strike: number; oi: number }[] = [];
  let totalCallOI = 0;
  let totalPutOI = 0;
  
  for (const strike of strikes) {
    const callTicker = expiryTickers.find(
      t => t.contract.strike === strike && t.contract.type === 'call'
    );
    const putTicker = expiryTickers.find(
      t => t.contract.strike === strike && t.contract.type === 'put'
    );
    
    const callOIVal = callTicker?.openInterest || 0;
    const putOIVal = putTicker?.openInterest || 0;
    
    callOI.push({ strike, oi: callOIVal });
    putOI.push({ strike, oi: putOIVal });
    totalCallOI += callOIVal;
    totalPutOI += putOIVal;
  }
  
  // Calculate max pain (price at which total option value is minimized)
  let minPain = Infinity;
  let maxPainPrice = spotPrice;
  
  for (const testPrice of strikes) {
    let pain = 0;
    
    // Call pain: For each call with strike < testPrice, add (testPrice - strike) * OI
    for (const call of callOI) {
      if (call.strike < testPrice) {
        pain += (testPrice - call.strike) * call.oi;
      }
    }
    
    // Put pain: For each put with strike > testPrice, add (strike - testPrice) * OI
    for (const put of putOI) {
      if (put.strike > testPrice) {
        pain += (put.strike - testPrice) * put.oi;
      }
    }
    
    if (pain < minPain) {
      minPain = pain;
      maxPainPrice = testPrice;
    }
  }

  const result: MaxPainAnalysis = {
    underlying,
    expiry: targetExpiry,
    maxPainPrice,
    currentPrice: spotPrice,
    distanceToMaxPain: maxPainPrice - spotPrice,
    distancePercent: spotPrice > 0 ? ((maxPainPrice - spotPrice) / spotPrice) * 100 : 0,
    callOI,
    putOI,
    totalCallOI,
    totalPutOI,
    putCallOIRatio: totalCallOI > 0 ? totalPutOI / totalCallOI : 0,
  };

  return result;
}

// =============================================================================
// Gamma Exposure Analysis
// =============================================================================

export async function getGammaExposure(underlying: string = 'BTC'): Promise<GammaExposure> {
  const cacheKey = `options:gamma:${underlying}`;
  const cached = cache.get<GammaExposure>(cacheKey);
  if (cached) return cached;

  const tickers = await fetchDeribitTickers(underlying);
  
  if (tickers.length === 0) {
    throw new Error('No options data available');
  }

  const spotPrice = tickers[0]?.underlyingPrice || 0;
  
  // Aggregate gamma by strike
  const gammaMap = new Map<number, number>();
  let netGamma = 0;
  
  for (const ticker of tickers) {
    // Market makers are typically short options = short gamma
    // Positive OI with positive gamma means dealers are short gamma
    const dealerGamma = -ticker.gamma * ticker.openInterest * spotPrice;
    netGamma += dealerGamma;
    
    const existing = gammaMap.get(ticker.contract.strike) || 0;
    gammaMap.set(ticker.contract.strike, existing + dealerGamma);
  }
  
  const gammaByStrike = Array.from(gammaMap.entries())
    .map(([strike, gamma]) => ({ strike, gamma }))
    .sort((a, b) => a.strike - b.strike);
  
  // Find gamma flip price (where gamma changes sign)
  let gammaFlipPrice = spotPrice;
  let prevGamma = 0;
  let cumulativeGamma = 0;
  
  for (const { strike, gamma } of gammaByStrike) {
    cumulativeGamma += gamma;
    if (prevGamma * cumulativeGamma < 0) {
      gammaFlipPrice = strike;
      break;
    }
    prevGamma = cumulativeGamma;
  }
  
  const positioning = netGamma > 1000000 ? 'long_gamma' : 
                      netGamma < -1000000 ? 'short_gamma' : 'neutral';
  
  const expectedVolatility = positioning === 'short_gamma' ? 'high' :
                             positioning === 'long_gamma' ? 'low' : 'medium';

  const result: GammaExposure = {
    underlying,
    spotPrice,
    netGamma,
    gammaFlipPrice,
    gammaByStrike,
    totalDealerGamma: netGamma,
    marketMakerPositioning: positioning,
    expectedVolatility,
  };

  cache.set(cacheKey, result, CACHE_TTL.gamma);
  return result;
}

// =============================================================================
// Full Options Dashboard
// =============================================================================

export interface OptionsDashboard {
  flow: OptionsFlow;
  surface: VolatilitySurface;
  maxPain: MaxPainAnalysis;
  gamma: GammaExposure;
  alerts: OptionsAlert[];
  lastUpdated: string;
}

export interface OptionsAlert {
  type: 'unusual_activity' | 'high_volume' | 'iv_spike' | 'gamma_flip' | 'max_pain';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export async function getOptionsDashboard(underlying: string = 'BTC'): Promise<OptionsDashboard> {
  const [flow, surface, maxPain, gamma] = await Promise.all([
    getOptionsFlow(underlying, 100),
    getVolatilitySurface(underlying),
    getMaxPain(underlying),
    getGammaExposure(underlying),
  ]);
  
  // Generate alerts
  const alerts: OptionsAlert[] = [];
  const now = Date.now();
  
  // Unusual activity alerts
  if (flow.summary.unusualTrades > 5) {
    alerts.push({
      type: 'unusual_activity',
      severity: 'warning',
      message: `${flow.summary.unusualTrades} unusual options trades detected`,
      data: { count: flow.summary.unusualTrades, topTrades: flow.topTrades.slice(0, 3) },
      timestamp: now,
    });
  }
  
  // High put/call ratio
  if (flow.summary.putCallRatio > 1.5) {
    alerts.push({
      type: 'high_volume',
      severity: 'warning',
      message: `Elevated put/call ratio: ${flow.summary.putCallRatio.toFixed(2)}`,
      data: { ratio: flow.summary.putCallRatio },
      timestamp: now,
    });
  }
  
  // Max pain distance
  if (Math.abs(maxPain.distancePercent) > 5) {
    alerts.push({
      type: 'max_pain',
      severity: 'info',
      message: `Price ${maxPain.distancePercent > 0 ? 'below' : 'above'} max pain by ${Math.abs(maxPain.distancePercent).toFixed(1)}%`,
      data: { maxPain: maxPain.maxPainPrice, current: maxPain.currentPrice },
      timestamp: now,
    });
  }
  
  // Short gamma warning
  if (gamma.marketMakerPositioning === 'short_gamma') {
    alerts.push({
      type: 'gamma_flip',
      severity: 'warning',
      message: 'Market makers are short gamma - expect increased volatility',
      data: { netGamma: gamma.netGamma, flipPrice: gamma.gammaFlipPrice },
      timestamp: now,
    });
  }

  return {
    flow,
    surface,
    maxPain,
    gamma,
    alerts,
    lastUpdated: new Date().toISOString(),
  };
}
