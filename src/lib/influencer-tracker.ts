/**
 * Influencer Reliability Tracker
 * 
 * Enterprise-grade system for tracking and scoring cryptocurrency
 * influencer predictions and trading calls.
 * 
 * Features:
 * - Historical accuracy tracking
 * - Return-based performance scoring
 * - Recency-weighted reliability scores
 * - Platform-agnostic tracking (Twitter, Discord, Telegram)
 * - Automated call detection and resolution
 * 
 * @module lib/influencer-tracker
 */

import { cache } from './cache';

// =============================================================================
// Types
// =============================================================================

export interface Influencer {
  id: string;
  platform: 'twitter' | 'discord' | 'telegram' | 'youtube';
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  followers: number;
  isVerified: boolean;
  
  // Tracking metadata
  trackedSince: string;
  lastActive: string;
  totalPosts: number;
  postsWithCalls: number;
  
  // Computed scores
  reliabilityScore: number;  // 0-100 overall reliability
  accuracyRate: number;      // % of correct calls
  avgReturn: number;         // Average return per call
  sharpeRatio: number;       // Risk-adjusted returns
  maxDrawdown: number;       // Worst peak-to-trough decline
  
  // Bias analysis
  sentimentBias: number;     // -1 (perma-bear) to 1 (perma-bull)
  tickerConcentration: number; // How diversified their calls are
  avgHoldingPeriod: number;  // Average days between call and resolution
  
  // Rankings
  overallRank: number;
  accuracyRank: number;
  returnRank: number;
  
  // Top performing tickers
  topTickers: Array<{
    ticker: string;
    calls: number;
    accuracy: number;
    avgReturn: number;
  }>;
}

export interface TradingCall {
  id: string;
  influencerId: string;
  
  // Call details
  ticker: string;
  callType: 'long' | 'short' | 'neutral';
  confidence: 'low' | 'medium' | 'high';
  timeframe?: string;  // e.g., "1d", "1w", "1m"
  targetPrice?: number;
  stopLoss?: number;
  
  // Timing
  callTimestamp: string;
  expiryTimestamp?: string;
  resolvedTimestamp?: string;
  
  // Prices
  entryPrice: number;
  currentPrice: number;
  exitPrice?: number;
  
  // Performance
  unrealizedReturn: number;
  realizedReturn?: number;
  maxReturn: number;      // Best return during position
  maxDrawdown: number;    // Worst drawdown during position
  
  // Status
  status: 'open' | 'won' | 'lost' | 'expired' | 'invalidated';
  
  // Source
  sourceUrl?: string;
  sourceText?: string;
  platform: string;
}

export interface InfluencerStats {
  totalInfluencers: number;
  activeInfluencers: number;
  totalCalls: number;
  openCalls: number;
  avgAccuracy: number;
  avgReturn: number;
  topPerformers: Influencer[];
  worstPerformers: Influencer[];
  recentCalls: TradingCall[];
}

// =============================================================================
// Call Detection Patterns
// =============================================================================

interface CallPattern {
  pattern: RegExp;
  callType: 'long' | 'short' | 'neutral';
  confidence: 'low' | 'medium' | 'high';
}

const CALL_PATTERNS: CallPattern[] = [
  // Strong long signals
  { pattern: /\b(buying|bought|long|longing)\s+\$?([A-Z]{2,6})\b/i, callType: 'long', confidence: 'high' },
  { pattern: /\$([A-Z]{2,6})\s+(to|hitting|going\s+to)\s+\$?[\d,.]+/i, callType: 'long', confidence: 'high' },
  { pattern: /\b(accumulating|loading|stacking)\s+\$?([A-Z]{2,6})\b/i, callType: 'long', confidence: 'high' },
  
  // Medium long signals
  { pattern: /\b(bullish\s+on|like|love)\s+\$?([A-Z]{2,6})\b/i, callType: 'long', confidence: 'medium' },
  { pattern: /\$([A-Z]{2,6})\s+(looks?\s+good|ready|primed)/i, callType: 'long', confidence: 'medium' },
  
  // Strong short signals
  { pattern: /\b(selling|sold|shorting|short)\s+\$?([A-Z]{2,6})\b/i, callType: 'short', confidence: 'high' },
  { pattern: /\$([A-Z]{2,6})\s+(dump|crash|going\s+down)/i, callType: 'short', confidence: 'high' },
  
  // Medium short signals
  { pattern: /\b(bearish\s+on|avoid|staying\s+away\s+from)\s+\$?([A-Z]{2,6})\b/i, callType: 'short', confidence: 'medium' },
  
  // Neutral signals
  { pattern: /\b(watching|monitoring|interesting)\s+\$?([A-Z]{2,6})\b/i, callType: 'neutral', confidence: 'low' },
];

// Price target extraction
const PRICE_TARGET_PATTERN = /\$?(\d+[,.]?\d*)\s*(k|K)?\s*(target|tp|take\s*profit)/i;
const STOP_LOSS_PATTERN = /\$?(\d+[,.]?\d*)\s*(k|K)?\s*(stop|sl|stop\s*loss)/i;

/**
 * Detect trading calls from text content
 */
export function detectTradingCalls(text: string): Array<{
  ticker: string;
  callType: 'long' | 'short' | 'neutral';
  confidence: 'low' | 'medium' | 'high';
  targetPrice?: number;
  stopLoss?: number;
}> {
  const calls: Array<{
    ticker: string;
    callType: 'long' | 'short' | 'neutral';
    confidence: 'low' | 'medium' | 'high';
    targetPrice?: number;
    stopLoss?: number;
  }> = [];
  
  for (const { pattern, callType, confidence } of CALL_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      // Extract ticker (usually in capture group 1 or 2)
      const ticker = (match[1] || match[2]).toUpperCase();
      
      // Skip common false positives
      if (['THE', 'FOR', 'AND', 'BUT', 'NOT', 'THIS', 'THAT'].includes(ticker)) {
        continue;
      }
      
      // Extract price targets if present
      const targetMatch = text.match(PRICE_TARGET_PATTERN);
      const stopMatch = text.match(STOP_LOSS_PATTERN);
      
      let targetPrice: number | undefined;
      let stopLoss: number | undefined;
      
      if (targetMatch) {
        targetPrice = parseFloat(targetMatch[1].replace(',', ''));
        if (targetMatch[2]?.toLowerCase() === 'k') {
          targetPrice *= 1000;
        }
      }
      
      if (stopMatch) {
        stopLoss = parseFloat(stopMatch[1].replace(',', ''));
        if (stopMatch[2]?.toLowerCase() === 'k') {
          stopLoss *= 1000;
        }
      }
      
      calls.push({
        ticker,
        callType,
        confidence,
        targetPrice,
        stopLoss,
      });
    }
  }
  
  return calls;
}

// =============================================================================
// Reliability Scoring Algorithm
// =============================================================================

interface ScoringWeights {
  accuracy: number;        // Weight for win rate
  avgReturn: number;       // Weight for average return
  consistency: number;     // Weight for standard deviation
  recency: number;         // Weight for recent performance
  volume: number;          // Weight for number of calls
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  accuracy: 0.30,
  avgReturn: 0.25,
  consistency: 0.20,
  recency: 0.15,
  volume: 0.10,
};

/**
 * Calculate comprehensive reliability score for an influencer
 */
export function calculateReliabilityScore(
  calls: TradingCall[],
  weights: ScoringWeights = DEFAULT_WEIGHTS
): {
  score: number;
  accuracyRate: number;
  avgReturn: number;
  sharpeRatio: number;
  maxDrawdown: number;
  breakdown: Record<string, number>;
} {
  // Filter to resolved calls only
  const resolvedCalls = calls.filter(c => 
    c.status === 'won' || c.status === 'lost' || c.status === 'expired'
  );
  
  if (resolvedCalls.length === 0) {
    return {
      score: 50, // Neutral starting score
      accuracyRate: 0,
      avgReturn: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      breakdown: {},
    };
  }
  
  // Calculate accuracy (win rate)
  const wins = resolvedCalls.filter(c => c.status === 'won').length;
  const accuracyRate = wins / resolvedCalls.length;
  
  // Calculate returns
  const returns = resolvedCalls.map(c => c.realizedReturn || c.unrealizedReturn);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  
  // Calculate standard deviation for consistency
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate Sharpe ratio (using 0% risk-free rate for simplicity)
  const sharpeRatio = stdDev > 0 ? avgReturn / stdDev : 0;
  
  // Calculate max drawdown
  let maxDrawdown = 0;
  let peak = 0;
  let cumulative = 0;
  for (const r of returns) {
    cumulative += r;
    if (cumulative > peak) peak = cumulative;
    const drawdown = (peak - cumulative) / (peak || 1);
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  // Calculate recency-weighted accuracy
  const now = Date.now();
  let recentWeightedWins = 0;
  let recentTotalWeight = 0;
  
  for (const call of resolvedCalls) {
    const ageMs = now - new Date(call.resolvedTimestamp || call.callTimestamp).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    const weight = Math.exp(-ageDays / 30); // 30-day half-life
    
    recentTotalWeight += weight;
    if (call.status === 'won') {
      recentWeightedWins += weight;
    }
  }
  
  const recentAccuracy = recentTotalWeight > 0 
    ? recentWeightedWins / recentTotalWeight 
    : accuracyRate;
  
  // Volume bonus (more calls = more confidence in score)
  const volumeScore = Math.min(resolvedCalls.length / 100, 1);
  
  // Consistency score (lower std dev = higher score)
  const consistencyScore = Math.max(0, 1 - stdDev);
  
  // Normalize components to 0-100 scale
  const components = {
    accuracy: accuracyRate * 100,
    avgReturn: Math.min(100, Math.max(0, 50 + avgReturn * 200)), // -25% to +25% mapped to 0-100
    consistency: consistencyScore * 100,
    recency: recentAccuracy * 100,
    volume: volumeScore * 100,
  };
  
  // Calculate weighted score
  const score = 
    components.accuracy * weights.accuracy +
    components.avgReturn * weights.avgReturn +
    components.consistency * weights.consistency +
    components.recency * weights.recency +
    components.volume * weights.volume;
  
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    accuracyRate: Math.round(accuracyRate * 1000) / 10, // Percentage with 1 decimal
    avgReturn: Math.round(avgReturn * 10000) / 100, // Percentage with 2 decimals
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 10000) / 100,
    breakdown: components,
  };
}

// =============================================================================
// Call Resolution
// =============================================================================

interface PriceData {
  symbol: string;
  price: number;
  timestamp: string;
}

/**
 * Resolve a trading call based on current price
 */
export function resolveCall(
  call: TradingCall,
  currentPrice: number,
  now: Date = new Date()
): TradingCall {
  const updatedCall = { ...call, currentPrice };
  
  // Calculate unrealized return based on call type
  if (call.callType === 'long') {
    updatedCall.unrealizedReturn = (currentPrice - call.entryPrice) / call.entryPrice;
  } else if (call.callType === 'short') {
    updatedCall.unrealizedReturn = (call.entryPrice - currentPrice) / call.entryPrice;
  } else {
    updatedCall.unrealizedReturn = 0;
  }
  
  // Update max return and max drawdown
  if (updatedCall.unrealizedReturn > (call.maxReturn || 0)) {
    updatedCall.maxReturn = updatedCall.unrealizedReturn;
  }
  if (updatedCall.unrealizedReturn < -(call.maxDrawdown || 0)) {
    updatedCall.maxDrawdown = Math.abs(updatedCall.unrealizedReturn);
  }
  
  // Check for resolution conditions
  if (call.status === 'open') {
    // Check target hit
    if (call.targetPrice) {
      if (call.callType === 'long' && currentPrice >= call.targetPrice) {
        updatedCall.status = 'won';
        updatedCall.exitPrice = call.targetPrice;
        updatedCall.realizedReturn = (call.targetPrice - call.entryPrice) / call.entryPrice;
        updatedCall.resolvedTimestamp = now.toISOString();
      } else if (call.callType === 'short' && currentPrice <= call.targetPrice) {
        updatedCall.status = 'won';
        updatedCall.exitPrice = call.targetPrice;
        updatedCall.realizedReturn = (call.entryPrice - call.targetPrice) / call.entryPrice;
        updatedCall.resolvedTimestamp = now.toISOString();
      }
    }
    
    // Check stop loss hit
    if (call.stopLoss) {
      if (call.callType === 'long' && currentPrice <= call.stopLoss) {
        updatedCall.status = 'lost';
        updatedCall.exitPrice = call.stopLoss;
        updatedCall.realizedReturn = (call.stopLoss - call.entryPrice) / call.entryPrice;
        updatedCall.resolvedTimestamp = now.toISOString();
      } else if (call.callType === 'short' && currentPrice >= call.stopLoss) {
        updatedCall.status = 'lost';
        updatedCall.exitPrice = call.stopLoss;
        updatedCall.realizedReturn = (call.entryPrice - call.stopLoss) / call.entryPrice;
        updatedCall.resolvedTimestamp = now.toISOString();
      }
    }
    
    // Check expiry
    if (call.expiryTimestamp && new Date(call.expiryTimestamp) <= now) {
      updatedCall.status = 'expired';
      updatedCall.exitPrice = currentPrice;
      updatedCall.realizedReturn = updatedCall.unrealizedReturn;
      updatedCall.resolvedTimestamp = now.toISOString();
    }
    
    // Auto-resolution based on return thresholds (if no target/stop)
    if (!call.targetPrice && !call.stopLoss) {
      // Win if 10%+ gain after 7+ days
      const callAge = (now.getTime() - new Date(call.callTimestamp).getTime()) / (1000 * 60 * 60 * 24);
      
      if (callAge >= 7) {
        if (updatedCall.unrealizedReturn >= 0.10) {
          updatedCall.status = 'won';
          updatedCall.exitPrice = currentPrice;
          updatedCall.realizedReturn = updatedCall.unrealizedReturn;
          updatedCall.resolvedTimestamp = now.toISOString();
        } else if (updatedCall.unrealizedReturn <= -0.15) {
          updatedCall.status = 'lost';
          updatedCall.exitPrice = currentPrice;
          updatedCall.realizedReturn = updatedCall.unrealizedReturn;
          updatedCall.resolvedTimestamp = now.toISOString();
        }
      }
      
      // Auto-expire after 30 days if no resolution
      if (callAge >= 30 && call.status === 'open') {
        updatedCall.status = 'expired';
        updatedCall.exitPrice = currentPrice;
        updatedCall.realizedReturn = updatedCall.unrealizedReturn;
        updatedCall.resolvedTimestamp = now.toISOString();
      }
    }
  }
  
  return updatedCall;
}

// =============================================================================
// Influencer Ranking
// =============================================================================

/**
 * Rank influencers by various metrics
 */
export function rankInfluencers(
  influencers: Influencer[],
  sortBy: 'reliability' | 'accuracy' | 'returns' | 'sharpe' = 'reliability'
): Influencer[] {
  const sorted = [...influencers];
  
  switch (sortBy) {
    case 'reliability':
      sorted.sort((a, b) => b.reliabilityScore - a.reliabilityScore);
      break;
    case 'accuracy':
      sorted.sort((a, b) => b.accuracyRate - a.accuracyRate);
      break;
    case 'returns':
      sorted.sort((a, b) => b.avgReturn - a.avgReturn);
      break;
    case 'sharpe':
      sorted.sort((a, b) => b.sharpeRatio - a.sharpeRatio);
      break;
  }
  
  // Update ranks
  sorted.forEach((inf, index) => {
    inf.overallRank = index + 1;
  });
  
  return sorted;
}

// =============================================================================
// Storage Interface
// =============================================================================

// In-memory storage for demo (use database in production)
const influencerStore = new Map<string, Influencer>();
const callStore = new Map<string, TradingCall>();

/**
 * Store or update an influencer
 */
export function upsertInfluencer(influencer: Influencer): void {
  influencerStore.set(influencer.id, influencer);
}

/**
 * Get an influencer by ID
 */
export function getInfluencer(id: string): Influencer | undefined {
  return influencerStore.get(id);
}

/**
 * Get all influencers
 */
export function getAllInfluencers(): Influencer[] {
  return Array.from(influencerStore.values());
}

/**
 * Store a trading call
 */
export function addCall(call: TradingCall): void {
  callStore.set(call.id, call);
}

/**
 * Get calls for an influencer
 */
export function getInfluencerCalls(influencerId: string): TradingCall[] {
  return Array.from(callStore.values()).filter(c => c.influencerId === influencerId);
}

/**
 * Get all open calls
 */
export function getOpenCalls(): TradingCall[] {
  return Array.from(callStore.values()).filter(c => c.status === 'open');
}

/**
 * Update a call
 */
export function updateCall(call: TradingCall): void {
  callStore.set(call.id, call);
}

// =============================================================================
// Analytics
// =============================================================================

/**
 * Get overall influencer statistics
 */
export function getInfluencerStats(): InfluencerStats {
  const influencers = getAllInfluencers();
  const calls = Array.from(callStore.values());
  
  const activeInfluencers = influencers.filter(i => {
    const lastActive = new Date(i.lastActive);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return lastActive >= thirtyDaysAgo;
  });
  
  const resolvedCalls = calls.filter(c => c.status !== 'open');
  const openCalls = calls.filter(c => c.status === 'open');
  
  const avgAccuracy = resolvedCalls.length > 0
    ? resolvedCalls.filter(c => c.status === 'won').length / resolvedCalls.length * 100
    : 0;
  
  const avgReturn = resolvedCalls.length > 0
    ? resolvedCalls.reduce((sum, c) => sum + (c.realizedReturn || 0), 0) / resolvedCalls.length * 100
    : 0;
  
  const rankedInfluencers = rankInfluencers(influencers, 'reliability');
  
  return {
    totalInfluencers: influencers.length,
    activeInfluencers: activeInfluencers.length,
    totalCalls: calls.length,
    openCalls: openCalls.length,
    avgAccuracy: Math.round(avgAccuracy * 10) / 10,
    avgReturn: Math.round(avgReturn * 100) / 100,
    topPerformers: rankedInfluencers.slice(0, 10),
    worstPerformers: rankedInfluencers.slice(-10).reverse(),
    recentCalls: calls
      .sort((a, b) => new Date(b.callTimestamp).getTime() - new Date(a.callTimestamp).getTime())
      .slice(0, 20),
  };
}

/**
 * Get ticker-specific influencer performance
 */
export function getTickerInfluencerStats(ticker: string): Array<{
  influencer: Influencer;
  calls: number;
  accuracy: number;
  avgReturn: number;
}> {
  const calls = Array.from(callStore.values()).filter(c => c.ticker === ticker);
  
  const byInfluencer = new Map<string, TradingCall[]>();
  for (const call of calls) {
    const existing = byInfluencer.get(call.influencerId) || [];
    existing.push(call);
    byInfluencer.set(call.influencerId, existing);
  }
  
  const stats = [];
  for (const [influencerId, infCalls] of byInfluencer) {
    const influencer = getInfluencer(influencerId);
    if (!influencer) continue;
    
    const resolved = infCalls.filter(c => c.status !== 'open');
    const wins = resolved.filter(c => c.status === 'won').length;
    const accuracy = resolved.length > 0 ? wins / resolved.length * 100 : 0;
    const avgReturn = resolved.length > 0
      ? resolved.reduce((sum, c) => sum + (c.realizedReturn || 0), 0) / resolved.length * 100
      : 0;
    
    stats.push({
      influencer,
      calls: infCalls.length,
      accuracy: Math.round(accuracy * 10) / 10,
      avgReturn: Math.round(avgReturn * 100) / 100,
    });
  }
  
  return stats.sort((a, b) => b.accuracy - a.accuracy);
}
