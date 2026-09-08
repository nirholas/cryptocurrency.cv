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
// Storage Interface with Vercel KV
// =============================================================================

import { kv } from '@vercel/kv';

// Cache keys for influencer data
const INFLUENCER_PREFIX = 'influencer:';
const CALL_PREFIX = 'call:';
const INFLUENCER_INDEX = 'influencers:all';
const CALL_INDEX = 'calls:all';

// In-memory fallback when KV is not available
const influencerStore = new Map<string, Influencer>();
const callStore = new Map<string, TradingCall>();

/**
 * Check if Vercel KV is configured
 */
function isKvConfigured(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/**
 * Store or update an influencer
 */
export async function upsertInfluencer(influencer: Influencer): Promise<void> {
  if (isKvConfigured()) {
    try {
      await kv.set(`${INFLUENCER_PREFIX}${influencer.id}`, influencer);
      // Add to index
      await kv.sadd(INFLUENCER_INDEX, influencer.id);
    } catch (error) {
      console.error('Failed to store influencer in KV:', error);
      // Fallback to in-memory
      influencerStore.set(influencer.id, influencer);
    }
  } else {
    influencerStore.set(influencer.id, influencer);
  }
}

/**
 * Get an influencer by ID
 */
export async function getInfluencer(id: string): Promise<Influencer | undefined> {
  if (isKvConfigured()) {
    try {
      const data = await kv.get<Influencer>(`${INFLUENCER_PREFIX}${id}`);
      return data || undefined;
    } catch (error) {
      console.error('Failed to get influencer from KV:', error);
      return influencerStore.get(id);
    }
  }
  return influencerStore.get(id);
}

/**
 * Get all influencers
 */
export async function getAllInfluencers(): Promise<Influencer[]> {
  if (isKvConfigured()) {
    try {
      const ids = await kv.smembers(INFLUENCER_INDEX) as string[];
      if (!ids || ids.length === 0) return [];
      
      const influencers = await Promise.all(
        ids.map(id => kv.get<Influencer>(`${INFLUENCER_PREFIX}${id}`))
      );
      return influencers.filter((i): i is Influencer => i !== null);
    } catch (error) {
      console.error('Failed to get all influencers from KV:', error);
      return Array.from(influencerStore.values());
    }
  }
  return Array.from(influencerStore.values());
}

/**
 * Store a trading call
 */
export async function addCall(call: TradingCall): Promise<void> {
  if (isKvConfigured()) {
    try {
      await kv.set(`${CALL_PREFIX}${call.id}`, call);
      // Add to index and influencer-specific index
      await kv.sadd(CALL_INDEX, call.id);
      await kv.sadd(`calls:influencer:${call.influencerId}`, call.id);
      if (call.status === 'open') {
        await kv.sadd('calls:open', call.id);
      }
    } catch (error) {
      console.error('Failed to store call in KV:', error);
      callStore.set(call.id, call);
    }
  } else {
    callStore.set(call.id, call);
  }
}

/**
 * Get calls for an influencer
 */
export async function getInfluencerCalls(influencerId: string): Promise<TradingCall[]> {
  if (isKvConfigured()) {
    try {
      const ids = await kv.smembers(`calls:influencer:${influencerId}`) as string[];
      if (!ids || ids.length === 0) return [];
      
      const calls = await Promise.all(
        ids.map(id => kv.get<TradingCall>(`${CALL_PREFIX}${id}`))
      );
      return calls.filter((c): c is TradingCall => c !== null);
    } catch (error) {
      console.error('Failed to get influencer calls from KV:', error);
      return Array.from(callStore.values()).filter(c => c.influencerId === influencerId);
    }
  }
  return Array.from(callStore.values()).filter(c => c.influencerId === influencerId);
}

/**
 * Get all open calls
 */
export async function getOpenCalls(): Promise<TradingCall[]> {
  if (isKvConfigured()) {
    try {
      const ids = await kv.smembers('calls:open') as string[];
      if (!ids || ids.length === 0) return [];
      
      const calls = await Promise.all(
        ids.map(id => kv.get<TradingCall>(`${CALL_PREFIX}${id}`))
      );
      return calls.filter((c): c is TradingCall => c !== null && c.status === 'open');
    } catch (error) {
      console.error('Failed to get open calls from KV:', error);
      return Array.from(callStore.values()).filter(c => c.status === 'open');
    }
  }
  return Array.from(callStore.values()).filter(c => c.status === 'open');
}

/**
 * Update a call
 */
export async function updateCall(call: TradingCall): Promise<void> {
  if (isKvConfigured()) {
    try {
      await kv.set(`${CALL_PREFIX}${call.id}`, call);
      // Update open calls index
      if (call.status === 'open') {
        await kv.sadd('calls:open', call.id);
      } else {
        await kv.srem('calls:open', call.id);
      }
    } catch (error) {
      console.error('Failed to update call in KV:', error);
      callStore.set(call.id, call);
    }
  } else {
    callStore.set(call.id, call);
  }
}

/**
 * Get all calls (for analytics)
 */
async function getAllCalls(): Promise<TradingCall[]> {
  if (isKvConfigured()) {
    try {
      const ids = await kv.smembers(CALL_INDEX) as string[];
      if (!ids || ids.length === 0) return [];
      
      const calls = await Promise.all(
        ids.map(id => kv.get<TradingCall>(`${CALL_PREFIX}${id}`))
      );
      return calls.filter((c): c is TradingCall => c !== null);
    } catch (error) {
      console.error('Failed to get all calls from KV:', error);
      return Array.from(callStore.values());
    }
  }
  return Array.from(callStore.values());
}

// =============================================================================
// Analytics
// =============================================================================

/**
 * Get overall influencer statistics
 */
export async function getInfluencerStats(): Promise<InfluencerStats> {
  const influencers = await getAllInfluencers();
  const calls = await getAllCalls();
  
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
export async function getTickerInfluencerStats(ticker: string): Promise<Array<{
  influencer: Influencer;
  calls: number;
  accuracy: number;
  avgReturn: number;
}>> {
  const allCalls = await getAllCalls();
  const calls = allCalls.filter(c => c.ticker === ticker);
  
  const byInfluencer = new Map<string, TradingCall[]>();
  for (const call of calls) {
    const existing = byInfluencer.get(call.influencerId) || [];
    existing.push(call);
    byInfluencer.set(call.influencerId, existing);
  }
  
  const stats = [];
  for (const [influencerId, infCalls] of byInfluencer) {
    const influencer = await getInfluencer(influencerId);
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
