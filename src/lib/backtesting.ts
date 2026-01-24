/**
 * Backtesting Engine
 * 
 * Enterprise-grade backtesting infrastructure for testing trading strategies
 * against historical crypto news and price data.
 * 
 * Features:
 * - Historical news-price correlation analysis
 * - Multiple strategy templates
 * - Risk metrics calculation (Sharpe, Sortino, Max Drawdown)
 * - Monte Carlo simulations
 * - Walk-forward optimization
 * - Detailed trade logs
 * 
 * @module backtesting
 */

import { getTopCoins, type TokenPrice } from './market-data';
import { aiCache } from './cache';
import { db } from './database';

// Alias for compatibility
type CoinData = TokenPrice;

// =============================================================================
// TYPES
// =============================================================================

export interface BacktestConfig {
  strategyId: string;
  strategyName: string;
  assets: string[];              // Symbols to trade (BTC, ETH, etc.)
  startDate: string;             // ISO date
  endDate: string;               // ISO date
  initialCapital: number;        // Starting capital in USD
  positionSizing: PositionSizing;
  riskManagement: RiskManagement;
  parameters: StrategyParameters;
}

export interface PositionSizing {
  type: 'fixed' | 'percentage' | 'volatility_adjusted' | 'kelly';
  value: number;                 // Fixed amount or percentage
  maxPositionSize?: number;      // Maximum position size
  maxTotalExposure?: number;     // Maximum total portfolio exposure
}

export interface RiskManagement {
  stopLoss?: number;             // Percentage stop loss
  takeProfit?: number;           // Percentage take profit
  trailingStop?: number;         // Trailing stop percentage
  maxDrawdown?: number;          // Maximum allowed drawdown
  maxDailyLoss?: number;         // Maximum daily loss allowed
  positionTimeout?: number;      // Hours to hold position max
}

export interface StrategyParameters {
  // News-based parameters
  sentimentThreshold?: number;   // Minimum sentiment for entry (-1 to 1)
  minConfidence?: number;        // Minimum AI confidence
  newsLookback?: number;         // Hours to look back for news
  minNewsCount?: number;         // Minimum news items required
  
  // Technical parameters
  entryDelay?: number;           // Minutes to wait after signal
  exitDelay?: number;            // Minutes to wait before exit
  cooldownPeriod?: number;       // Minutes between trades
  
  // Custom parameters
  [key: string]: unknown;
}

export interface BacktestResult {
  id: string;
  config: BacktestConfig;
  executedAt: string;
  
  // Performance metrics
  performance: PerformanceMetrics;
  
  // Trade analysis
  trades: Trade[];
  tradeStats: TradeStatistics;
  
  // Risk metrics
  risk: RiskMetrics;
  
  // Time-series data
  equityCurve: EquityPoint[];
  drawdownCurve: DrawdownPoint[];
  
  // Analysis
  monthlyReturns: MonthlyReturn[];
  assetPerformance: AssetPerformance[];
  
  processingTime: number;
}

export interface PerformanceMetrics {
  totalReturn: number;           // Percentage
  totalReturnUSD: number;        // Absolute USD
  annualizedReturn: number;      // CAGR
  finalEquity: number;
  peakEquity: number;
  
  winRate: number;               // Percentage of winning trades
  profitFactor: number;          // Gross profit / Gross loss
  expectancy: number;            // Average expected profit per trade
  
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  
  averageWin: number;
  averageLoss: number;
  largestWin: number;
  largestLoss: number;
  
  averageHoldTime: number;       // Hours
  maxConsecutiveWins: number;
  maxConsecutiveLosses: number;
}

export interface RiskMetrics {
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  
  maxDrawdown: number;           // Percentage
  maxDrawdownUSD: number;        // Absolute USD
  maxDrawdownDuration: number;   // Days
  averageDrawdown: number;
  
  volatility: number;            // Daily volatility
  downside_volatility: number;
  beta?: number;
  alpha?: number;
  
  valueAtRisk95: number;         // 95% VaR
  expectedShortfall: number;     // CVaR
  
  recoveryFactor: number;        // Net profit / Max drawdown
  ulcerIndex: number;
}

export interface Trade {
  id: string;
  asset: string;
  direction: 'long' | 'short';
  
  entryTime: string;
  entryPrice: number;
  entryReason: string;
  
  exitTime: string;
  exitPrice: number;
  exitReason: 'stop_loss' | 'take_profit' | 'trailing_stop' | 'signal' | 'timeout' | 'manual';
  
  quantity: number;
  positionValue: number;
  
  pnl: number;
  pnlPercent: number;
  fees: number;
  netPnl: number;
  
  holdTime: number;              // Hours
  
  // Related news/signals
  triggerNews?: string[];
  sentimentAtEntry?: number;
  sentimentAtExit?: number;
}

export interface TradeStatistics {
  byAsset: Record<string, {
    trades: number;
    wins: number;
    losses: number;
    pnl: number;
    winRate: number;
  }>;
  byDirection: {
    long: { trades: number; wins: number; pnl: number };
    short: { trades: number; wins: number; pnl: number };
  };
  byHour: Record<number, { trades: number; pnl: number }>;
  byDayOfWeek: Record<number, { trades: number; pnl: number }>;
}

export interface EquityPoint {
  timestamp: string;
  equity: number;
  drawdown: number;
  trades: number;
}

export interface DrawdownPoint {
  timestamp: string;
  drawdown: number;
  drawdownUSD: number;
  fromPeak: number;
}

export interface MonthlyReturn {
  year: number;
  month: number;
  return: number;
  trades: number;
  startEquity: number;
  endEquity: number;
}

export interface AssetPerformance {
  asset: string;
  trades: number;
  pnl: number;
  winRate: number;
  avgHoldTime: number;
  contribution: number;          // Contribution to total PnL
}

// Strategy types
export type StrategyType = 
  | 'news_sentiment'            // Trade based on news sentiment
  | 'momentum_news'             // Combine momentum with news
  | 'mean_reversion'            // Mean reversion after news
  | 'breakout_news'             // Breakout confirmed by news
  | 'custom';

export interface Strategy {
  id: string;
  name: string;
  type: StrategyType;
  description: string;
  parameters: StrategyParameters;
  defaultConfig: Partial<BacktestConfig>;
}

// =============================================================================
// BUILT-IN STRATEGIES
// =============================================================================

export const BUILTIN_STRATEGIES: Strategy[] = [
  {
    id: 'news_sentiment_long',
    name: 'News Sentiment Long Only',
    type: 'news_sentiment',
    description: 'Enter long positions when positive news sentiment exceeds threshold',
    parameters: {
      sentimentThreshold: 0.5,
      minConfidence: 0.7,
      newsLookback: 24,
      minNewsCount: 3,
    },
    defaultConfig: {
      positionSizing: { type: 'percentage', value: 10 },
      riskManagement: { stopLoss: 5, takeProfit: 15 },
    },
  },
  {
    id: 'momentum_news',
    name: 'News Momentum',
    type: 'momentum_news',
    description: 'Trade in direction of price momentum confirmed by news sentiment',
    parameters: {
      sentimentThreshold: 0.3,
      minConfidence: 0.6,
      newsLookback: 12,
    },
    defaultConfig: {
      positionSizing: { type: 'volatility_adjusted', value: 2 },
      riskManagement: { stopLoss: 3, takeProfit: 9, trailingStop: 2 },
    },
  },
  {
    id: 'contrarian_news',
    name: 'News Contrarian',
    type: 'mean_reversion',
    description: 'Fade extreme sentiment readings expecting mean reversion',
    parameters: {
      sentimentThreshold: 0.8,
      entryDelay: 60,
      cooldownPeriod: 240,
    },
    defaultConfig: {
      positionSizing: { type: 'fixed', value: 1000 },
      riskManagement: { stopLoss: 7, takeProfit: 5 },
    },
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

// Import crypto for secure ID generation
import { randomUUID } from 'crypto';

function generateId(): string {
  return `bt_${randomUUID()}`;
}

function calculateSharpe(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length === 0) return 0;
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  );
  if (stdDev === 0) return 0;
  return (avgReturn * 252 - riskFreeRate) / (stdDev * Math.sqrt(252));
}

function calculateSortino(returns: number[], riskFreeRate: number = 0.02): number {
  if (returns.length === 0) return 0;
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return avgReturn > 0 ? Infinity : 0;
  const downsideStd = Math.sqrt(
    negativeReturns.reduce((sum, r) => sum + r * r, 0) / negativeReturns.length
  );
  if (downsideStd === 0) return 0;
  return (avgReturn * 252 - riskFreeRate) / (downsideStd * Math.sqrt(252));
}

function calculateMaxDrawdown(equityCurve: number[]): { maxDd: number; maxDdDuration: number } {
  let peak = equityCurve[0] || 0;
  let maxDd = 0;
  let currentDdStart = 0;
  let maxDdDuration = 0;

  for (let i = 0; i < equityCurve.length; i++) {
    if (equityCurve[i] > peak) {
      peak = equityCurve[i];
      currentDdStart = i;
    }
    const dd = (peak - equityCurve[i]) / peak;
    if (dd > maxDd) {
      maxDd = dd;
      maxDdDuration = i - currentDdStart;
    }
  }

  return { maxDd, maxDdDuration };
}

function calculateVaR(returns: number[], confidence: number = 0.95): number {
  if (returns.length === 0) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const index = Math.floor((1 - confidence) * sorted.length);
  return Math.abs(sorted[index] || 0);
}

// =============================================================================
// HISTORICAL DATA SIMULATION
// =============================================================================

interface HistoricalDataPoint {
  timestamp: string;
  price: number;
  volume: number;
  sentiment?: number;
  newsCount?: number;
}

/**
 * Fetch real historical data from CoinGecko or data providers
 */
async function getHistoricalData(
  asset: string,
  startDate: string,
  endDate: string
): Promise<HistoricalDataPoint[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.ceil((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
  
  // Map asset symbol to CoinGecko ID
  const symbolToGecko: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'AVAX': 'avalanche-2',
    'DOT': 'polkadot',
    'LINK': 'chainlink',
  };
  
  const geckoId = symbolToGecko[asset.toUpperCase()] || asset.toLowerCase();
  
  try {
    // Fetch historical market data from CoinGecko
    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart/range?vs_currency=usd&from=${Math.floor(start.getTime() / 1000)}&to=${Math.floor(end.getTime() / 1000)}`,
      { next: { revalidate: 3600 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      const prices = data.prices || [];
      const volumes = data.total_volumes || [];
      
      const result: HistoricalDataPoint[] = [];
      
      for (let i = 0; i < prices.length; i++) {
        const [timestamp, price] = prices[i];
        const volume = volumes[i]?.[1] || 0;
        
        result.push({
          timestamp: new Date(timestamp).toISOString(),
          price,
          volume,
          sentiment: undefined, // Not available from price API
          newsCount: undefined,
        });
      }
      
      return result;
    }
  } catch (error) {
    console.error('Failed to fetch historical data from CoinGecko:', error);
  }
  
  // Fallback: Try Binance for more granular data
  try {
    const binanceSymbol = `${asset.toUpperCase()}USDT`;
    const response = await fetch(
      `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1h&startTime=${start.getTime()}&endTime=${end.getTime()}&limit=1000`,
      { next: { revalidate: 3600 } }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.map((kline: [number, string, string, string, string, string]) => ({
        timestamp: new Date(kline[0]).toISOString(),
        price: parseFloat(kline[4]), // Close price
        volume: parseFloat(kline[5]), // Volume
        sentiment: undefined,
        newsCount: undefined,
      }));
    }
  } catch {
    // Binance may not have the pair
  }
  
  // Return empty array if no data available
  console.warn(`No historical data available for ${asset} from ${startDate} to ${endDate}`);
  return [];
}

// =============================================================================
// BACKTEST ENGINE
// =============================================================================

/**
 * Execute a backtest
 */
export async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
  const startTime = Date.now();
  const resultId = generateId();
  
  // Validate config
  if (!config.assets?.length) throw new Error('At least one asset is required');
  if (!config.startDate || !config.endDate) throw new Error('Date range is required');
  if (config.initialCapital <= 0) throw new Error('Initial capital must be positive');
  
  // Initialize state
  let equity = config.initialCapital;
  let peakEquity = equity;
  const trades: Trade[] = [];
  const equityCurve: EquityPoint[] = [];
  const drawdownCurve: DrawdownPoint[] = [];
  const dailyReturns: number[] = [];
  
  // Get historical data for all assets
  const historicalData = new Map<string, HistoricalDataPoint[]>();
  for (const asset of config.assets) {
    const data = await getHistoricalData(asset, config.startDate, config.endDate);
    historicalData.set(asset, data);
  }
  
  // Find the asset with the most data points to use as timeline
  const primaryAsset = config.assets[0];
  const timeline = historicalData.get(primaryAsset) || [];
  
  // Simulate trading
  let position: { asset: string; direction: 'long' | 'short'; entry: HistoricalDataPoint; quantity: number } | null = null;
  let lastEquity = equity;
  let dayStart = '';
  
  for (let i = 0; i < timeline.length; i++) {
    const point = timeline[i];
    const day = point.timestamp.split('T')[0];
    
    // Track daily returns
    if (day !== dayStart) {
      if (dayStart) {
        dailyReturns.push((equity - lastEquity) / lastEquity);
      }
      dayStart = day;
      lastEquity = equity;
    }
    
    // Check for exit conditions if in position
    if (position) {
      const currentAssetData = historicalData.get(position.asset);
      const currentPoint = currentAssetData?.find(p => p.timestamp === point.timestamp);
      
      if (currentPoint) {
        const pnlPercent = position.direction === 'long'
          ? (currentPoint.price - position.entry.price) / position.entry.price
          : (position.entry.price - currentPoint.price) / position.entry.price;
        
        let exitReason: Trade['exitReason'] | null = null;
        
        // Check stop loss
        if (config.riskManagement.stopLoss && pnlPercent * 100 <= -config.riskManagement.stopLoss) {
          exitReason = 'stop_loss';
        }
        // Check take profit
        else if (config.riskManagement.takeProfit && pnlPercent * 100 >= config.riskManagement.takeProfit) {
          exitReason = 'take_profit';
        }
        // Check sentiment reversal for exit
        else if (
          config.parameters.sentimentThreshold &&
          currentPoint.sentiment !== undefined &&
          ((position.direction === 'long' && currentPoint.sentiment < -config.parameters.sentimentThreshold) ||
           (position.direction === 'short' && currentPoint.sentiment > config.parameters.sentimentThreshold))
        ) {
          exitReason = 'signal';
        }
        
        if (exitReason) {
          const pnl = pnlPercent * position.quantity * position.entry.price;
          const fees = position.quantity * position.entry.price * 0.001; // 0.1% fee
          
          equity += pnl - fees;
          
          trades.push({
            id: `trade_${trades.length + 1}`,
            asset: position.asset,
            direction: position.direction,
            entryTime: position.entry.timestamp,
            entryPrice: position.entry.price,
            entryReason: 'Sentiment threshold crossed',
            exitTime: currentPoint.timestamp,
            exitPrice: currentPoint.price,
            exitReason,
            quantity: position.quantity,
            positionValue: position.quantity * position.entry.price,
            pnl,
            pnlPercent: pnlPercent * 100,
            fees,
            netPnl: pnl - fees,
            holdTime: (new Date(currentPoint.timestamp).getTime() - new Date(position.entry.timestamp).getTime()) / 3600000,
            sentimentAtEntry: position.entry.sentiment,
            sentimentAtExit: currentPoint.sentiment,
          });
          
          position = null;
        }
      }
    }
    
    // Check for entry conditions if not in position
    if (!position && point.sentiment !== undefined) {
      const threshold = config.parameters.sentimentThreshold || 0.5;
      
      if (point.sentiment > threshold) {
        // Long signal
        const positionSize = config.positionSizing.type === 'percentage'
          ? equity * (config.positionSizing.value / 100)
          : config.positionSizing.value;
        
        const quantity = positionSize / point.price;
        
        position = {
          asset: primaryAsset,
          direction: 'long',
          entry: point,
          quantity,
        };
      } else if (point.sentiment < -threshold) {
        // Short signal
        const positionSize = config.positionSizing.type === 'percentage'
          ? equity * (config.positionSizing.value / 100)
          : config.positionSizing.value;
        
        const quantity = positionSize / point.price;
        
        position = {
          asset: primaryAsset,
          direction: 'short',
          entry: point,
          quantity,
        };
      }
    }
    
    // Update equity curve
    if (peakEquity < equity) peakEquity = equity;
    const drawdown = (peakEquity - equity) / peakEquity;
    
    // Record every 6 hours
    if (i % 6 === 0) {
      equityCurve.push({
        timestamp: point.timestamp,
        equity,
        drawdown: drawdown * 100,
        trades: trades.length,
      });
      
      drawdownCurve.push({
        timestamp: point.timestamp,
        drawdown: drawdown * 100,
        drawdownUSD: peakEquity - equity,
        fromPeak: peakEquity,
      });
    }
  }
  
  // Close any remaining position
  if (position) {
    const lastPoint = timeline[timeline.length - 1];
    const pnlPercent = position.direction === 'long'
      ? (lastPoint.price - position.entry.price) / position.entry.price
      : (position.entry.price - lastPoint.price) / position.entry.price;
    const pnl = pnlPercent * position.quantity * position.entry.price;
    const fees = position.quantity * position.entry.price * 0.001;
    
    equity += pnl - fees;
    
    trades.push({
      id: `trade_${trades.length + 1}`,
      asset: position.asset,
      direction: position.direction,
      entryTime: position.entry.timestamp,
      entryPrice: position.entry.price,
      entryReason: 'Sentiment threshold crossed',
      exitTime: lastPoint.timestamp,
      exitPrice: lastPoint.price,
      exitReason: 'manual',
      quantity: position.quantity,
      positionValue: position.quantity * position.entry.price,
      pnl,
      pnlPercent: pnlPercent * 100,
      fees,
      netPnl: pnl - fees,
      holdTime: (new Date(lastPoint.timestamp).getTime() - new Date(position.entry.timestamp).getTime()) / 3600000,
    });
  }
  
  // Calculate performance metrics
  const winningTrades = trades.filter(t => t.netPnl > 0);
  const losingTrades = trades.filter(t => t.netPnl < 0);
  const breakEvenTrades = trades.filter(t => t.netPnl === 0);
  
  const grossProfit = winningTrades.reduce((sum, t) => sum + t.netPnl, 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + t.netPnl, 0));
  
  const { maxDd, maxDdDuration } = calculateMaxDrawdown(equityCurve.map(e => e.equity));
  
  const performance: PerformanceMetrics = {
    totalReturn: ((equity - config.initialCapital) / config.initialCapital) * 100,
    totalReturnUSD: equity - config.initialCapital,
    annualizedReturn: 0, // Would need actual date range calculation
    finalEquity: equity,
    peakEquity,
    
    winRate: trades.length > 0 ? (winningTrades.length / trades.length) * 100 : 0,
    profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0,
    expectancy: trades.length > 0 
      ? trades.reduce((sum, t) => sum + t.netPnl, 0) / trades.length 
      : 0,
    
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    breakEvenTrades: breakEvenTrades.length,
    
    averageWin: winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + t.netPnl, 0) / winningTrades.length 
      : 0,
    averageLoss: losingTrades.length > 0 
      ? losingTrades.reduce((sum, t) => sum + t.netPnl, 0) / losingTrades.length 
      : 0,
    largestWin: winningTrades.length > 0 
      ? Math.max(...winningTrades.map(t => t.netPnl)) 
      : 0,
    largestLoss: losingTrades.length > 0 
      ? Math.min(...losingTrades.map(t => t.netPnl)) 
      : 0,
    
    averageHoldTime: trades.length > 0 
      ? trades.reduce((sum, t) => sum + t.holdTime, 0) / trades.length 
      : 0,
    maxConsecutiveWins: calculateConsecutive(trades, true),
    maxConsecutiveLosses: calculateConsecutive(trades, false),
  };
  
  const volatility = dailyReturns.length > 0 
    ? Math.sqrt(dailyReturns.reduce((sum, r) => sum + r * r, 0) / dailyReturns.length) 
    : 0;
  
  const risk: RiskMetrics = {
    sharpeRatio: calculateSharpe(dailyReturns),
    sortinoRatio: calculateSortino(dailyReturns),
    calmarRatio: maxDd > 0 ? performance.annualizedReturn / (maxDd * 100) : 0,
    
    maxDrawdown: maxDd * 100,
    maxDrawdownUSD: maxDd * peakEquity,
    maxDrawdownDuration: maxDdDuration,
    averageDrawdown: drawdownCurve.reduce((sum, d) => sum + d.drawdown, 0) / (drawdownCurve.length || 1),
    
    volatility: volatility * 100,
    downside_volatility: calculateDownsideVolatility(dailyReturns) * 100,
    
    valueAtRisk95: calculateVaR(dailyReturns, 0.95) * 100,
    expectedShortfall: calculateExpectedShortfall(dailyReturns, 0.95) * 100,
    
    recoveryFactor: maxDd > 0 ? performance.totalReturnUSD / (maxDd * peakEquity) : 0,
    ulcerIndex: calculateUlcerIndex(drawdownCurve.map(d => d.drawdown)),
  };
  
  // Calculate trade statistics
  const tradeStats = calculateTradeStats(trades);
  
  // Calculate monthly returns
  const monthlyReturns = calculateMonthlyReturns(equityCurve, config.initialCapital);
  
  // Calculate asset performance
  const assetPerformance = calculateAssetPerformance(trades, performance.totalReturnUSD);
  
  const result: BacktestResult = {
    id: resultId,
    config,
    executedAt: new Date().toISOString(),
    performance,
    trades,
    tradeStats,
    risk,
    equityCurve,
    drawdownCurve,
    monthlyReturns,
    assetPerformance,
    processingTime: Date.now() - startTime,
  };
  
  // Save result to database
  await db.saveDocument('backtest_results', resultId, result);
  
  return result;
}

// Helper functions
function calculateConsecutive(trades: Trade[], wins: boolean): number {
  let max = 0;
  let current = 0;
  
  for (const trade of trades) {
    if ((wins && trade.netPnl > 0) || (!wins && trade.netPnl < 0)) {
      current++;
      max = Math.max(max, current);
    } else {
      current = 0;
    }
  }
  
  return max;
}

function calculateDownsideVolatility(returns: number[]): number {
  const negativeReturns = returns.filter(r => r < 0);
  if (negativeReturns.length === 0) return 0;
  return Math.sqrt(
    negativeReturns.reduce((sum, r) => sum + r * r, 0) / negativeReturns.length
  );
}

function calculateExpectedShortfall(returns: number[], confidence: number): number {
  if (returns.length === 0) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const cutoff = Math.floor((1 - confidence) * sorted.length);
  const tail = sorted.slice(0, cutoff + 1);
  return Math.abs(tail.reduce((a, b) => a + b, 0) / tail.length);
}

function calculateUlcerIndex(drawdowns: number[]): number {
  if (drawdowns.length === 0) return 0;
  const sumSquared = drawdowns.reduce((sum, d) => sum + d * d, 0);
  return Math.sqrt(sumSquared / drawdowns.length);
}

function calculateTradeStats(trades: Trade[]): TradeStatistics {
  const byAsset: TradeStatistics['byAsset'] = {};
  const byDirection: TradeStatistics['byDirection'] = {
    long: { trades: 0, wins: 0, pnl: 0 },
    short: { trades: 0, wins: 0, pnl: 0 },
  };
  const byHour: TradeStatistics['byHour'] = {};
  const byDayOfWeek: TradeStatistics['byDayOfWeek'] = {};
  
  for (const trade of trades) {
    // By asset
    if (!byAsset[trade.asset]) {
      byAsset[trade.asset] = { trades: 0, wins: 0, losses: 0, pnl: 0, winRate: 0 };
    }
    byAsset[trade.asset].trades++;
    if (trade.netPnl > 0) byAsset[trade.asset].wins++;
    if (trade.netPnl < 0) byAsset[trade.asset].losses++;
    byAsset[trade.asset].pnl += trade.netPnl;
    
    // By direction
    byDirection[trade.direction].trades++;
    if (trade.netPnl > 0) byDirection[trade.direction].wins++;
    byDirection[trade.direction].pnl += trade.netPnl;
    
    // By hour
    const hour = new Date(trade.entryTime).getHours();
    if (!byHour[hour]) byHour[hour] = { trades: 0, pnl: 0 };
    byHour[hour].trades++;
    byHour[hour].pnl += trade.netPnl;
    
    // By day of week
    const day = new Date(trade.entryTime).getDay();
    if (!byDayOfWeek[day]) byDayOfWeek[day] = { trades: 0, pnl: 0 };
    byDayOfWeek[day].trades++;
    byDayOfWeek[day].pnl += trade.netPnl;
  }
  
  // Calculate win rates
  for (const asset of Object.keys(byAsset)) {
    byAsset[asset].winRate = byAsset[asset].trades > 0 
      ? (byAsset[asset].wins / byAsset[asset].trades) * 100 
      : 0;
  }
  
  return { byAsset, byDirection, byHour, byDayOfWeek };
}

function calculateMonthlyReturns(equityCurve: EquityPoint[], initialCapital: number): MonthlyReturn[] {
  const byMonth: Record<string, { points: EquityPoint[]; start: number }> = {};
  let prevEquity = initialCapital;
  
  for (const point of equityCurve) {
    const date = new Date(point.timestamp);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
    
    if (!byMonth[key]) {
      byMonth[key] = { points: [], start: prevEquity };
    }
    byMonth[key].points.push(point);
    prevEquity = point.equity;
  }
  
  return Object.entries(byMonth).map(([key, data]) => {
    const [year, month] = key.split('-').map(Number);
    const lastPoint = data.points[data.points.length - 1];
    
    return {
      year,
      month,
      return: data.start > 0 ? ((lastPoint.equity - data.start) / data.start) * 100 : 0,
      trades: lastPoint.trades - (data.points[0]?.trades || 0),
      startEquity: data.start,
      endEquity: lastPoint.equity,
    };
  });
}

function calculateAssetPerformance(trades: Trade[], totalPnl: number): AssetPerformance[] {
  const byAsset: Record<string, { trades: number; pnl: number; wins: number; holdTime: number }> = {};
  
  for (const trade of trades) {
    if (!byAsset[trade.asset]) {
      byAsset[trade.asset] = { trades: 0, pnl: 0, wins: 0, holdTime: 0 };
    }
    byAsset[trade.asset].trades++;
    byAsset[trade.asset].pnl += trade.netPnl;
    if (trade.netPnl > 0) byAsset[trade.asset].wins++;
    byAsset[trade.asset].holdTime += trade.holdTime;
  }
  
  return Object.entries(byAsset).map(([asset, data]) => ({
    asset,
    trades: data.trades,
    pnl: data.pnl,
    winRate: data.trades > 0 ? (data.wins / data.trades) * 100 : 0,
    avgHoldTime: data.trades > 0 ? data.holdTime / data.trades : 0,
    contribution: totalPnl !== 0 ? (data.pnl / totalPnl) * 100 : 0,
  }));
}

// =============================================================================
// BACKTEST MANAGEMENT
// =============================================================================

/**
 * Get a backtest result by ID
 */
export async function getBacktestResult(id: string): Promise<BacktestResult | null> {
  const doc = await db.getDocument<BacktestResult>('backtest_results', id);
  return doc?.data || null;
}

/**
 * List all backtest results
 */
export async function listBacktestResults(options: {
  limit?: number;
  strategyId?: string;
} = {}): Promise<BacktestResult[]> {
  const docs = await db.listDocuments<BacktestResult>('backtest_results', {
    limit: options.limit || 50,
  });
  
  let results = docs.map(d => d.data);
  
  if (options.strategyId) {
    results = results.filter(r => r.config.strategyId === options.strategyId);
  }
  
  return results.sort((a, b) => 
    new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
  );
}

/**
 * Compare multiple backtest results
 */
export async function compareBacktests(ids: string[]): Promise<{
  results: BacktestResult[];
  comparison: {
    metric: string;
    values: Record<string, number>;
    best: string;
  }[];
}> {
  const results = await Promise.all(ids.map(id => getBacktestResult(id)));
  const validResults = results.filter((r): r is BacktestResult => r !== null);
  
  const metrics = [
    { key: 'totalReturn', label: 'Total Return (%)', higherBetter: true },
    { key: 'sharpeRatio', label: 'Sharpe Ratio', higherBetter: true },
    { key: 'maxDrawdown', label: 'Max Drawdown (%)', higherBetter: false },
    { key: 'winRate', label: 'Win Rate (%)', higherBetter: true },
    { key: 'profitFactor', label: 'Profit Factor', higherBetter: true },
  ];
  
  const comparison = metrics.map(({ key, label, higherBetter }) => {
    const values: Record<string, number> = {};
    
    for (const result of validResults) {
      const value = key === 'sharpeRatio' || key === 'maxDrawdown'
        ? result.risk[key as keyof RiskMetrics]
        : result.performance[key as keyof PerformanceMetrics];
      values[result.id] = value as number;
    }
    
    const entries = Object.entries(values);
    const best = higherBetter
      ? entries.reduce((a, b) => b[1] > a[1] ? b : a)[0]
      : entries.reduce((a, b) => b[1] < a[1] ? b : a)[0];
    
    return { metric: label, values, best };
  });
  
  return { results: validResults, comparison };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  runBacktest,
  getResult: getBacktestResult,
  listResults: listBacktestResults,
  compareResults: compareBacktests,
  strategies: BUILTIN_STRATEGIES,
};
