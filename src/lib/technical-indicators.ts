/**
 * Technical Analysis Indicators
 * 
 * Mathematical indicators for cryptocurrency technical analysis.
 * All functions are pure and work with price arrays.
 * 
 * @module lib/technical-indicators
 */

// ═══════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════

export interface OHLCV {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp?: number;
}

export interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
  bandwidth: number;
  percentB: number;
}

export interface MACD {
  macd: number;
  signal: number;
  histogram: number;
}

export interface StochasticOscillator {
  k: number;
  d: number;
}

export interface IchimokuCloud {
  tenkanSen: number;       // Conversion Line
  kijunSen: number;        // Base Line
  senkouSpanA: number;     // Leading Span A
  senkouSpanB: number;     // Leading Span B
  chikouSpan: number;      // Lagging Span
}

export interface PivotPoints {
  pivot: number;
  r1: number;
  r2: number;
  r3: number;
  s1: number;
  s2: number;
  s3: number;
}

export interface TechnicalSignal {
  indicator: string;
  value: number;
  signal: 'buy' | 'sell' | 'neutral';
  strength: number;
}

// ═══════════════════════════════════════════════════════════════
// MOVING AVERAGES
// ═══════════════════════════════════════════════════════════════

/**
 * Simple Moving Average (SMA)
 */
export function sma(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  const slice = prices.slice(-period);
  return slice.reduce((sum, price) => sum + price, 0) / period;
}

/**
 * Exponential Moving Average (EMA)
 */
export function ema(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return sma(prices, prices.length);
  
  const multiplier = 2 / (period + 1);
  let emaValue = sma(prices.slice(0, period), period);
  
  for (let i = period; i < prices.length; i++) {
    emaValue = (prices[i] - emaValue) * multiplier + emaValue;
  }
  
  return emaValue;
}

/**
 * Weighted Moving Average (WMA)
 */
export function wma(prices: number[], period: number): number {
  if (prices.length < period) return sma(prices, prices.length);
  
  const slice = prices.slice(-period);
  const weights = Array.from({ length: period }, (_, i) => i + 1);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  
  return slice.reduce((sum, price, i) => sum + price * weights[i], 0) / weightSum;
}

/**
 * Hull Moving Average (HMA) - Faster and smoother
 */
export function hma(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1] || 0;
  
  const halfPeriod = Math.floor(period / 2);
  const sqrtPeriod = Math.floor(Math.sqrt(period));
  
  const wmaHalf = wma(prices, halfPeriod);
  const wmaFull = wma(prices, period);
  
  const raw = 2 * wmaHalf - wmaFull;
  
  // Apply WMA to the raw values
  return wma([raw], sqrtPeriod);
}

/**
 * Volume Weighted Average Price (VWAP)
 */
export function vwap(candles: OHLCV[]): number {
  if (candles.length === 0) return 0;
  
  let cumulativeTPV = 0;
  let cumulativeVolume = 0;
  
  for (const candle of candles) {
    const typicalPrice = (candle.high + candle.low + candle.close) / 3;
    cumulativeTPV += typicalPrice * candle.volume;
    cumulativeVolume += candle.volume;
  }
  
  return cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0;
}

// ═══════════════════════════════════════════════════════════════
// MOMENTUM INDICATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Relative Strength Index (RSI)
 */
export function rsi(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  
  let gains = 0;
  let losses = 0;
  
  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses -= change;
  }
  
  let avgGain = gains / period;
  let avgLoss = losses / period;
  
  // Calculate smoothed RSI
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const currentGain = change > 0 ? change : 0;
    const currentLoss = change < 0 ? -change : 0;
    
    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }
  
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * MACD (Moving Average Convergence Divergence)
 */
export function macd(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): MACD {
  const fastEMA = ema(prices, fastPeriod);
  const slowEMA = ema(prices, slowPeriod);
  const macdLine = fastEMA - slowEMA;
  
  // Calculate MACD history for signal line
  const macdHistory: number[] = [];
  for (let i = slowPeriod; i <= prices.length; i++) {
    const slice = prices.slice(0, i);
    const fast = ema(slice, fastPeriod);
    const slow = ema(slice, slowPeriod);
    macdHistory.push(fast - slow);
  }
  
  const signalLine = ema(macdHistory, signalPeriod);
  
  return {
    macd: macdLine,
    signal: signalLine,
    histogram: macdLine - signalLine,
  };
}

/**
 * Stochastic Oscillator
 */
export function stochastic(
  candles: OHLCV[],
  kPeriod: number = 14,
  dPeriod: number = 3
): StochasticOscillator {
  if (candles.length < kPeriod) return { k: 50, d: 50 };
  
  const kValues: number[] = [];
  
  for (let i = kPeriod - 1; i < candles.length; i++) {
    const slice = candles.slice(i - kPeriod + 1, i + 1);
    const highestHigh = Math.max(...slice.map(c => c.high));
    const lowestLow = Math.min(...slice.map(c => c.low));
    const currentClose = candles[i].close;
    
    const range = highestHigh - lowestLow;
    const k = range === 0 ? 50 : ((currentClose - lowestLow) / range) * 100;
    kValues.push(k);
  }
  
  const k = kValues[kValues.length - 1];
  const d = sma(kValues.slice(-dPeriod), dPeriod);
  
  return { k, d };
}

/**
 * Money Flow Index (MFI) - Volume-weighted RSI
 */
export function mfi(candles: OHLCV[], period: number = 14): number {
  if (candles.length < period + 1) return 50;
  
  let positiveFlow = 0;
  let negativeFlow = 0;
  
  for (let i = 1; i <= period; i++) {
    const typicalPrice = (candles[i].high + candles[i].low + candles[i].close) / 3;
    const prevTypicalPrice = (candles[i-1].high + candles[i-1].low + candles[i-1].close) / 3;
    const moneyFlow = typicalPrice * candles[i].volume;
    
    if (typicalPrice > prevTypicalPrice) {
      positiveFlow += moneyFlow;
    } else {
      negativeFlow += moneyFlow;
    }
  }
  
  if (negativeFlow === 0) return 100;
  const moneyRatio = positiveFlow / negativeFlow;
  return 100 - (100 / (1 + moneyRatio));
}

/**
 * Rate of Change (ROC)
 */
export function roc(prices: number[], period: number = 12): number {
  if (prices.length <= period) return 0;
  const currentPrice = prices[prices.length - 1];
  const pastPrice = prices[prices.length - 1 - period];
  return ((currentPrice - pastPrice) / pastPrice) * 100;
}

/**
 * Williams %R
 */
export function williamsR(candles: OHLCV[], period: number = 14): number {
  if (candles.length < period) return -50;
  
  const slice = candles.slice(-period);
  const highestHigh = Math.max(...slice.map(c => c.high));
  const lowestLow = Math.min(...slice.map(c => c.low));
  const currentClose = candles[candles.length - 1].close;
  
  const range = highestHigh - lowestLow;
  return range === 0 ? -50 : ((highestHigh - currentClose) / range) * -100;
}

// ═══════════════════════════════════════════════════════════════
// VOLATILITY INDICATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Bollinger Bands
 */
export function bollingerBands(
  prices: number[],
  period: number = 20,
  stdDevMultiplier: number = 2
): BollingerBands {
  if (prices.length < period) {
    const price = prices[prices.length - 1] || 0;
    return { upper: price, middle: price, lower: price, bandwidth: 0, percentB: 0.5 };
  }
  
  const slice = prices.slice(-period);
  const middle = sma(slice, period);
  
  // Calculate standard deviation
  const squaredDiffs = slice.map(p => Math.pow(p - middle, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
  const stdDev = Math.sqrt(variance);
  
  const upper = middle + stdDevMultiplier * stdDev;
  const lower = middle - stdDevMultiplier * stdDev;
  const bandwidth = ((upper - lower) / middle) * 100;
  const currentPrice = prices[prices.length - 1];
  const percentB = upper !== lower ? (currentPrice - lower) / (upper - lower) : 0.5;
  
  return { upper, middle, lower, bandwidth, percentB };
}

/**
 * Average True Range (ATR)
 */
export function atr(candles: OHLCV[], period: number = 14): number {
  if (candles.length < 2) return 0;
  
  const trueRanges: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  return sma(trueRanges.slice(-period), Math.min(period, trueRanges.length));
}

/**
 * Keltner Channels
 */
export function keltnerChannels(
  candles: OHLCV[],
  emaPeriod: number = 20,
  atrPeriod: number = 10,
  atrMultiplier: number = 2
): { upper: number; middle: number; lower: number } {
  const closes = candles.map(c => c.close);
  const middle = ema(closes, emaPeriod);
  const atrValue = atr(candles, atrPeriod);
  
  return {
    upper: middle + atrMultiplier * atrValue,
    middle,
    lower: middle - atrMultiplier * atrValue,
  };
}

/**
 * Chaikin Volatility
 */
export function chaikinVolatility(candles: OHLCV[], period: number = 10): number {
  if (candles.length < period * 2) return 0;
  
  const highLowDiffs = candles.map(c => c.high - c.low);
  const currentEMA = ema(highLowDiffs, period);
  const pastEMA = ema(highLowDiffs.slice(0, -period), period);
  
  return pastEMA !== 0 ? ((currentEMA - pastEMA) / pastEMA) * 100 : 0;
}

// ═══════════════════════════════════════════════════════════════
// TREND INDICATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Average Directional Index (ADX)
 */
export function adx(candles: OHLCV[], period: number = 14): number {
  if (candles.length < period * 2) return 0;
  
  const plusDM: number[] = [];
  const minusDM: number[] = [];
  const tr: number[] = [];
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevHigh = candles[i - 1].high;
    const prevLow = candles[i - 1].low;
    const prevClose = candles[i - 1].close;
    
    // True Range
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)));
    
    // Directional Movement
    const upMove = high - prevHigh;
    const downMove = prevLow - low;
    
    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0);
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0);
  }
  
  // Smooth with EMA
  const smoothedTR = ema(tr, period);
  const smoothedPlusDM = ema(plusDM, period);
  const smoothedMinusDM = ema(minusDM, period);
  
  const plusDI = smoothedTR !== 0 ? (smoothedPlusDM / smoothedTR) * 100 : 0;
  const minusDI = smoothedTR !== 0 ? (smoothedMinusDM / smoothedTR) * 100 : 0;
  
  const dx = plusDI + minusDI !== 0 
    ? (Math.abs(plusDI - minusDI) / (plusDI + minusDI)) * 100 
    : 0;
  
  // ADX is smoothed DX
  return dx;
}

/**
 * Parabolic SAR
 */
export function parabolicSAR(
  candles: OHLCV[],
  accelerationStart: number = 0.02,
  accelerationMax: number = 0.2
): number {
  if (candles.length < 2) return candles[0]?.close || 0;
  
  let isUptrend = candles[1].close > candles[0].close;
  let sar = isUptrend ? candles[0].low : candles[0].high;
  let ep = isUptrend ? candles[0].high : candles[0].low;
  let af = accelerationStart;
  
  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    
    sar = sar + af * (ep - sar);
    
    if (isUptrend) {
      if (low < sar) {
        isUptrend = false;
        sar = ep;
        ep = low;
        af = accelerationStart;
      } else {
        if (high > ep) {
          ep = high;
          af = Math.min(af + accelerationStart, accelerationMax);
        }
      }
    } else {
      if (high > sar) {
        isUptrend = true;
        sar = ep;
        ep = high;
        af = accelerationStart;
      } else {
        if (low < ep) {
          ep = low;
          af = Math.min(af + accelerationStart, accelerationMax);
        }
      }
    }
  }
  
  return sar;
}

/**
 * Ichimoku Cloud
 */
export function ichimokuCloud(candles: OHLCV[]): IchimokuCloud | null {
  if (candles.length < 52) return null;
  
  const calcMidpoint = (slice: OHLCV[]) => {
    const high = Math.max(...slice.map(c => c.high));
    const low = Math.min(...slice.map(c => c.low));
    return (high + low) / 2;
  };
  
  const tenkanSen = calcMidpoint(candles.slice(-9)); // 9-period
  const kijunSen = calcMidpoint(candles.slice(-26)); // 26-period
  const senkouSpanA = (tenkanSen + kijunSen) / 2;
  const senkouSpanB = calcMidpoint(candles.slice(-52)); // 52-period
  const chikouSpan = candles[candles.length - 1].close; // Current close
  
  return { tenkanSen, kijunSen, senkouSpanA, senkouSpanB, chikouSpan };
}

// ═══════════════════════════════════════════════════════════════
// SUPPORT/RESISTANCE
// ═══════════════════════════════════════════════════════════════

/**
 * Pivot Points (Standard)
 */
export function pivotPoints(candle: OHLCV): PivotPoints {
  const { high, low, close } = candle;
  const pivot = (high + low + close) / 3;
  
  return {
    pivot,
    r1: 2 * pivot - low,
    r2: pivot + (high - low),
    r3: high + 2 * (pivot - low),
    s1: 2 * pivot - high,
    s2: pivot - (high - low),
    s3: low - 2 * (high - pivot),
  };
}

/**
 * Find support and resistance levels from price history
 */
export function findSupportResistance(
  candles: OHLCV[],
  sensitivity: number = 0.02
): { support: number[]; resistance: number[] } {
  if (candles.length < 10) return { support: [], resistance: [] };
  
  const levels = new Map<number, number>();
  
  // Find local highs and lows
  for (let i = 2; i < candles.length - 2; i++) {
    const curr = candles[i];
    const prev1 = candles[i - 1];
    const prev2 = candles[i - 2];
    const next1 = candles[i + 1];
    const next2 = candles[i + 2];
    
    // Local high
    if (curr.high > prev1.high && curr.high > prev2.high && 
        curr.high > next1.high && curr.high > next2.high) {
      const roundedLevel = Math.round(curr.high * (1 / sensitivity)) / (1 / sensitivity);
      levels.set(roundedLevel, (levels.get(roundedLevel) || 0) + 1);
    }
    
    // Local low
    if (curr.low < prev1.low && curr.low < prev2.low && 
        curr.low < next1.low && curr.low < next2.low) {
      const roundedLevel = Math.round(curr.low * (1 / sensitivity)) / (1 / sensitivity);
      levels.set(roundedLevel, (levels.get(roundedLevel) || 0) + 1);
    }
  }
  
  // Sort by frequency and separate into support/resistance
  const currentPrice = candles[candles.length - 1].close;
  const sortedLevels = Array.from(levels.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([level]) => level);
  
  const support = sortedLevels.filter(l => l < currentPrice).sort((a, b) => b - a);
  const resistance = sortedLevels.filter(l => l > currentPrice).sort((a, b) => a - b);
  
  return { support, resistance };
}

// ═══════════════════════════════════════════════════════════════
// SIGNAL GENERATION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate comprehensive technical signals
 */
export function generateSignals(
  prices: number[],
  candles: OHLCV[]
): TechnicalSignal[] {
  const signals: TechnicalSignal[] = [];
  
  // RSI Signal
  const rsiValue = rsi(prices);
  signals.push({
    indicator: 'RSI',
    value: rsiValue,
    signal: rsiValue < 30 ? 'buy' : rsiValue > 70 ? 'sell' : 'neutral',
    strength: Math.abs(50 - rsiValue) / 50,
  });
  
  // MACD Signal
  const macdData = macd(prices);
  signals.push({
    indicator: 'MACD',
    value: macdData.histogram,
    signal: macdData.histogram > 0 && macdData.macd > macdData.signal ? 'buy' :
            macdData.histogram < 0 && macdData.macd < macdData.signal ? 'sell' : 'neutral',
    strength: Math.min(Math.abs(macdData.histogram) / 100, 1),
  });
  
  // Stochastic Signal
  const stochData = stochastic(candles);
  signals.push({
    indicator: 'Stochastic',
    value: stochData.k,
    signal: stochData.k < 20 && stochData.k > stochData.d ? 'buy' :
            stochData.k > 80 && stochData.k < stochData.d ? 'sell' : 'neutral',
    strength: Math.abs(50 - stochData.k) / 50,
  });
  
  // Bollinger Bands Signal
  const bbData = bollingerBands(prices);
  const currentPrice = prices[prices.length - 1];
  signals.push({
    indicator: 'Bollinger Bands',
    value: bbData.percentB * 100,
    signal: currentPrice < bbData.lower ? 'buy' :
            currentPrice > bbData.upper ? 'sell' : 'neutral',
    strength: bbData.percentB < 0 ? Math.abs(bbData.percentB) :
              bbData.percentB > 1 ? bbData.percentB - 1 : 0,
  });
  
  // Moving Average Crossover
  const sma20 = sma(prices, 20);
  const sma50 = sma(prices, 50);
  signals.push({
    indicator: 'SMA Crossover',
    value: ((sma20 - sma50) / sma50) * 100,
    signal: sma20 > sma50 ? 'buy' : sma20 < sma50 ? 'sell' : 'neutral',
    strength: Math.min(Math.abs(sma20 - sma50) / sma50 * 10, 1),
  });
  
  return signals;
}

/**
 * Calculate overall signal strength
 */
export function calculateOverallSignal(
  signals: TechnicalSignal[]
): { signal: 'buy' | 'sell' | 'neutral'; confidence: number } {
  if (signals.length === 0) return { signal: 'neutral', confidence: 0 };
  
  let buyScore = 0;
  let sellScore = 0;
  let totalStrength = 0;
  
  for (const s of signals) {
    const weight = s.strength;
    totalStrength += weight;
    
    if (s.signal === 'buy') buyScore += weight;
    else if (s.signal === 'sell') sellScore += weight;
  }
  
  const netScore = buyScore - sellScore;
  const confidence = totalStrength > 0 ? Math.abs(netScore) / totalStrength : 0;
  
  let signal: 'buy' | 'sell' | 'neutral';
  if (netScore > 0.2) signal = 'buy';
  else if (netScore < -0.2) signal = 'sell';
  else signal = 'neutral';
  
  return { signal, confidence: Math.min(confidence, 1) };
}
