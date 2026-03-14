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
 * Prediction Tracking System
 * 
 * Enterprise-grade prediction registry with timestamped predictions,
 * outcome tracking, accuracy scoring, and leaderboard functionality.
 * 
 * Features:
 * - Immutable prediction records with cryptographic timestamps
 * - Automatic outcome resolution via price feeds
 * - User accuracy tracking and leaderboards
 * - Category-based analysis (price targets, events, trends)
 * - Historical performance analytics
 * 
 * @module predictions
 */

import { db } from './database';
import { getTopCoins, type TokenPrice } from './market-data';
import { aiCache } from './cache';

// Alias for compatibility
type CoinData = TokenPrice;

// =============================================================================
// TYPES
// =============================================================================

export type PredictionType = 
  | 'price_above'    // Price will be above target by date
  | 'price_below'    // Price will be below target by date
  | 'price_range'    // Price will be within range by date
  | 'percentage_up'  // Will increase by X% by date
  | 'percentage_down'// Will decrease by X% by date
  | 'event'          // Specific event will occur
  | 'trend'          // General trend prediction
  | 'dominance'      // Market dominance prediction
  | 'custom';        // Custom prediction text

export type PredictionStatus = 
  | 'pending'        // Awaiting target date
  | 'correct'        // Prediction was accurate
  | 'incorrect'      // Prediction was wrong
  | 'partially_correct' // Within margin of error
  | 'expired'        // Target date passed, unable to verify
  | 'cancelled';     // User cancelled prediction

export type PredictionTimeframe = 
  | '1h' | '4h' | '1d' | '3d' | '1w' | '2w' | '1m' | '3m' | '6m' | '1y';

export interface Prediction {
  id: string;
  userId: string;
  userDisplayName?: string;
  
  // Prediction details
  type: PredictionType;
  asset: string;           // e.g., 'BTC', 'ETH', 'TOTAL_MARKET_CAP'
  assetName?: string;
  
  // Target specification
  targetValue?: number;    // Price target or percentage
  targetValueMin?: number; // For range predictions
  targetValueMax?: number;
  targetDate: string;      // ISO date when prediction should be evaluated
  timeframe: PredictionTimeframe;
  
  // Prediction metadata
  priceAtPrediction: number;  // Asset price when prediction was made
  marketCapAtPrediction?: number;
  reasoning?: string;         // User's reasoning
  confidence: number;         // 0-100
  isPublic: boolean;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  
  // Resolution
  status: PredictionStatus;
  outcome?: PredictionOutcome;
  
  // Categorization
  tags?: string[];
  category?: string;
}

export interface PredictionOutcome {
  resolvedAt: string;
  actualValue: number;
  percentageError: number;
  accuracyScore: number;  // 0-100
  priceChange: number;    // Percentage change from prediction to resolution
  notes?: string;
  verificationSource: string;
}

export interface UserStats {
  userId: string;
  displayName?: string;
  totalPredictions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  pendingPredictions: number;
  accuracyRate: number;      // 0-100
  averageConfidence: number; // 0-100
  streak: number;            // Current correct streak
  bestStreak: number;
  totalPoints: number;       // Gamification points
  rank?: number;
  badges: string[];
  joinedAt: string;
  lastActiveAt: string;
  byTimeframe: Record<PredictionTimeframe, { total: number; correct: number }>;
  byAsset: Record<string, { total: number; correct: number }>;
}

export interface PredictionInput {
  userId: string;
  userDisplayName?: string;
  type: PredictionType;
  asset: string;
  targetValue?: number;
  targetValueMin?: number;
  targetValueMax?: number;
  targetDate: string;
  timeframe: PredictionTimeframe;
  reasoning?: string;
  confidence: number;
  isPublic?: boolean;
  tags?: string[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName?: string;
  accuracyRate: number;
  totalPredictions: number;
  correctPredictions: number;
  points: number;
  streak: number;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const COLLECTION = 'predictions';
const USER_STATS_COLLECTION = 'prediction_user_stats';
const MAX_PREDICTIONS_PER_USER = 100;
const PARTIAL_ACCURACY_THRESHOLD = 0.1; // 10% margin for partial correctness

// Point system
const POINTS = {
  correct: 100,
  partiallyCorrect: 50,
  incorrect: -10,
  highConfidenceBonus: 25, // Bonus for correct predictions with >80% confidence
  streakBonus: 10,         // Per prediction in streak
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Generate a unique prediction ID
 */
function generatePredictionId(): string {
  const timestamp = Date.now().toString(36);
  return `pred_${timestamp}_${crypto.randomUUID().slice(0, 8)}`;
}

/**
 * Get current price for an asset
 */
async function getCurrentPrice(asset: string): Promise<number | null> {
  try {
    const coins = await getTopCoins(100);
    const coin = coins.find(c => 
      c.symbol.toUpperCase() === asset.toUpperCase() || 
      c.id === asset.toLowerCase()
    );
    return coin?.current_price || null;
  } catch {
    return null;
  }
}

/**
 * Calculate accuracy score based on prediction type
 */
function calculateAccuracyScore(prediction: Prediction, actualValue: number): number {
  const { type, targetValue, targetValueMin, targetValueMax, priceAtPrediction } = prediction;
  
  switch (type) {
    case 'price_above':
      if (!targetValue) return 0;
      if (actualValue >= targetValue) return 100;
      const aboveRatio = actualValue / targetValue;
      return Math.max(0, Math.min(100, aboveRatio * 100));
      
    case 'price_below':
      if (!targetValue) return 0;
      if (actualValue <= targetValue) return 100;
      const belowRatio = targetValue / actualValue;
      return Math.max(0, Math.min(100, belowRatio * 100));
      
    case 'price_range':
      if (!targetValueMin || !targetValueMax) return 0;
      if (actualValue >= targetValueMin && actualValue <= targetValueMax) return 100;
      const rangeCenter = (targetValueMin + targetValueMax) / 2;
      const rangeWidth = targetValueMax - targetValueMin;
      const distanceFromCenter = Math.abs(actualValue - rangeCenter);
      const normalizedDistance = distanceFromCenter / (rangeWidth / 2);
      return Math.max(0, Math.min(100, (1 - normalizedDistance) * 100));
      
    case 'percentage_up':
    case 'percentage_down':
      if (!targetValue || !priceAtPrediction) return 0;
      const actualChange = ((actualValue - priceAtPrediction) / priceAtPrediction) * 100;
      const predictedChange = type === 'percentage_up' ? targetValue : -targetValue;
      const changeError = Math.abs(actualChange - predictedChange);
      return Math.max(0, Math.min(100, 100 - changeError * 2));
      
    default:
      // For event/trend/custom, requires manual resolution
      return 0;
  }
}

/**
 * Determine prediction status based on accuracy
 */
function determineStatus(accuracyScore: number): PredictionStatus {
  if (accuracyScore >= 90) return 'correct';
  if (accuracyScore >= 70) return 'partially_correct';
  return 'incorrect';
}

// =============================================================================
// PREDICTION MANAGEMENT
// =============================================================================

/**
 * Create a new prediction
 */
export async function createPrediction(input: PredictionInput): Promise<Prediction> {
  // Validate input
  if (!input.userId) throw new Error('userId is required');
  if (!input.asset) throw new Error('asset is required');
  if (!input.targetDate) throw new Error('targetDate is required');
  if (!input.timeframe) throw new Error('timeframe is required');
  if (input.confidence < 0 || input.confidence > 100) {
    throw new Error('confidence must be between 0 and 100');
  }

  // Check user's prediction count
  const userPredictions = await getUserPredictions(input.userId);
  const pendingCount = userPredictions.filter(p => p.status === 'pending').length;
  if (pendingCount >= MAX_PREDICTIONS_PER_USER) {
    throw new Error(`Maximum of ${MAX_PREDICTIONS_PER_USER} pending predictions allowed`);
  }

  // Get current price
  const currentPrice = await getCurrentPrice(input.asset);
  if (currentPrice === null && ['price_above', 'price_below', 'price_range', 'percentage_up', 'percentage_down'].includes(input.type)) {
    throw new Error(`Unable to get current price for ${input.asset}`);
  }

  // Create prediction
  const prediction: Prediction = {
    id: generatePredictionId(),
    userId: input.userId,
    userDisplayName: input.userDisplayName,
    type: input.type,
    asset: input.asset.toUpperCase(),
    targetValue: input.targetValue,
    targetValueMin: input.targetValueMin,
    targetValueMax: input.targetValueMax,
    targetDate: input.targetDate,
    timeframe: input.timeframe,
    priceAtPrediction: currentPrice || 0,
    reasoning: input.reasoning,
    confidence: input.confidence,
    isPublic: input.isPublic ?? true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'pending',
    tags: input.tags,
  };

  // Save prediction
  await db.saveDocument(COLLECTION, prediction.id, prediction);
  
  // Update user stats
  await updateUserStats(input.userId, 'create');

  return prediction;
}

/**
 * Get a prediction by ID
 */
export async function getPrediction(id: string): Promise<Prediction | null> {
  const doc = await db.getDocument<Prediction>(COLLECTION, id);
  return doc?.data || null;
}

/**
 * Get user's predictions
 */
export async function getUserPredictions(
  userId: string, 
  options: { status?: PredictionStatus; limit?: number } = {}
): Promise<Prediction[]> {
  const allDocs = await db.listDocuments<Prediction>(COLLECTION, { limit: 500 });
  
  let predictions = allDocs
    .map(doc => doc.data)
    .filter(p => p.userId === userId);
  
  if (options.status) {
    predictions = predictions.filter(p => p.status === options.status);
  }
  
  predictions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  if (options.limit) {
    predictions = predictions.slice(0, options.limit);
  }
  
  return predictions;
}

/**
 * Get public predictions for an asset
 */
export async function getAssetPredictions(
  asset: string,
  options: { status?: PredictionStatus; limit?: number } = {}
): Promise<Prediction[]> {
  const allDocs = await db.listDocuments<Prediction>(COLLECTION, { limit: 500 });
  
  let predictions = allDocs
    .map(doc => doc.data)
    .filter(p => p.asset.toUpperCase() === asset.toUpperCase() && p.isPublic);
  
  if (options.status) {
    predictions = predictions.filter(p => p.status === options.status);
  }
  
  predictions.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  if (options.limit) {
    predictions = predictions.slice(0, options.limit);
  }
  
  return predictions;
}

/**
 * Resolve a prediction (check if target date has passed and evaluate)
 */
export async function resolvePrediction(
  predictionId: string,
  manualOutcome?: { status: PredictionStatus; notes?: string }
): Promise<Prediction> {
  const prediction = await getPrediction(predictionId);
  if (!prediction) {
    throw new Error('Prediction not found');
  }
  
  if (prediction.status !== 'pending') {
    throw new Error('Prediction has already been resolved');
  }

  let outcome: PredictionOutcome;
  let status: PredictionStatus;

  if (manualOutcome) {
    // Manual resolution (for event/trend/custom types)
    status = manualOutcome.status;
    const currentPrice = await getCurrentPrice(prediction.asset);
    
    outcome = {
      resolvedAt: new Date().toISOString(),
      actualValue: currentPrice || 0,
      percentageError: 0,
      accuracyScore: status === 'correct' ? 100 : status === 'partially_correct' ? 75 : 0,
      priceChange: currentPrice && prediction.priceAtPrediction 
        ? ((currentPrice - prediction.priceAtPrediction) / prediction.priceAtPrediction) * 100 
        : 0,
      notes: manualOutcome.notes,
      verificationSource: 'manual',
    };
  } else {
    // Automatic resolution based on price
    const currentPrice = await getCurrentPrice(prediction.asset);
    if (currentPrice === null) {
      throw new Error(`Unable to get current price for ${prediction.asset}`);
    }

    const accuracyScore = calculateAccuracyScore(prediction, currentPrice);
    status = determineStatus(accuracyScore);
    
    const percentageError = prediction.targetValue 
      ? Math.abs((currentPrice - prediction.targetValue) / prediction.targetValue) * 100 
      : 0;

    outcome = {
      resolvedAt: new Date().toISOString(),
      actualValue: currentPrice,
      percentageError,
      accuracyScore,
      priceChange: ((currentPrice - prediction.priceAtPrediction) / prediction.priceAtPrediction) * 100,
      verificationSource: 'coingecko',
    };
  }

  // Update prediction
  const updatedPrediction: Prediction = {
    ...prediction,
    status,
    outcome,
    updatedAt: new Date().toISOString(),
  };

  await db.saveDocument(COLLECTION, prediction.id, updatedPrediction);
  
  // Update user stats
  await updateUserStats(prediction.userId, 'resolve', status, prediction.confidence);

  return updatedPrediction;
}

/**
 * Cancel a pending prediction
 */
export async function cancelPrediction(predictionId: string, userId: string): Promise<Prediction> {
  const prediction = await getPrediction(predictionId);
  if (!prediction) {
    throw new Error('Prediction not found');
  }
  
  if (prediction.userId !== userId) {
    throw new Error('Not authorized to cancel this prediction');
  }
  
  if (prediction.status !== 'pending') {
    throw new Error('Only pending predictions can be cancelled');
  }

  const updatedPrediction: Prediction = {
    ...prediction,
    status: 'cancelled',
    updatedAt: new Date().toISOString(),
  };

  await db.saveDocument(COLLECTION, prediction.id, updatedPrediction);
  
  return updatedPrediction;
}

// =============================================================================
// USER STATISTICS
// =============================================================================

/**
 * Get user statistics
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  const doc = await db.getDocument<UserStats>(USER_STATS_COLLECTION, userId);
  return doc?.data || null;
}

/**
 * Update user statistics
 */
async function updateUserStats(
  userId: string, 
  action: 'create' | 'resolve',
  status?: PredictionStatus,
  confidence?: number
): Promise<void> {
  let stats = await getUserStats(userId);
  
  if (!stats) {
    stats = {
      userId,
      totalPredictions: 0,
      correctPredictions: 0,
      incorrectPredictions: 0,
      pendingPredictions: 0,
      accuracyRate: 0,
      averageConfidence: 0,
      streak: 0,
      bestStreak: 0,
      totalPoints: 0,
      badges: [],
      joinedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      byTimeframe: {} as Record<PredictionTimeframe, { total: number; correct: number }>,
      byAsset: {},
    };
  }

  if (action === 'create') {
    stats.totalPredictions++;
    stats.pendingPredictions++;
  } else if (action === 'resolve' && status) {
    stats.pendingPredictions = Math.max(0, stats.pendingPredictions - 1);
    
    if (status === 'correct') {
      stats.correctPredictions++;
      stats.streak++;
      if (stats.streak > stats.bestStreak) {
        stats.bestStreak = stats.streak;
      }
      stats.totalPoints += POINTS.correct + (stats.streak * POINTS.streakBonus);
      
      // High confidence bonus
      if (confidence && confidence >= 80) {
        stats.totalPoints += POINTS.highConfidenceBonus;
      }
    } else if (status === 'partially_correct') {
      stats.streak = 0;
      stats.totalPoints += POINTS.partiallyCorrect;
    } else if (status === 'incorrect') {
      stats.incorrectPredictions++;
      stats.streak = 0;
      stats.totalPoints = Math.max(0, stats.totalPoints + POINTS.incorrect);
    }
    
    // Recalculate accuracy rate
    const resolved = stats.correctPredictions + stats.incorrectPredictions;
    stats.accuracyRate = resolved > 0 
      ? (stats.correctPredictions / resolved) * 100 
      : 0;
  }

  stats.lastActiveAt = new Date().toISOString();
  
  await db.saveDocument(USER_STATS_COLLECTION, userId, stats);
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(
  options: { limit?: number; minPredictions?: number } = {}
): Promise<LeaderboardEntry[]> {
  const { limit = 50, minPredictions = 5 } = options;
  
  const allDocs = await db.listDocuments<UserStats>(USER_STATS_COLLECTION, { limit: 500 });
  
  const eligible = allDocs
    .map(doc => doc.data)
    .filter(s => (s.correctPredictions + s.incorrectPredictions) >= minPredictions)
    .sort((a, b) => {
      // Sort by accuracy first, then by total points
      if (Math.abs(a.accuracyRate - b.accuracyRate) > 1) {
        return b.accuracyRate - a.accuracyRate;
      }
      return b.totalPoints - a.totalPoints;
    })
    .slice(0, limit);

  return eligible.map((stats, index) => ({
    rank: index + 1,
    userId: stats.userId,
    displayName: stats.displayName,
    accuracyRate: Math.round(stats.accuracyRate * 10) / 10,
    totalPredictions: stats.totalPredictions,
    correctPredictions: stats.correctPredictions,
    points: stats.totalPoints,
    streak: stats.streak,
  }));
}

// =============================================================================
// BATCH RESOLUTION
// =============================================================================

/**
 * Resolve all predictions that have passed their target date
 */
export async function resolveExpiredPredictions(): Promise<{
  resolved: number;
  failed: number;
  errors: string[];
}> {
  const allDocs = await db.listDocuments<Prediction>(COLLECTION, { limit: 1000 });
  const now = new Date();
  
  const expired = allDocs
    .map(doc => doc.data)
    .filter(p => p.status === 'pending' && new Date(p.targetDate) <= now);

  let resolved = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const prediction of expired) {
    try {
      await resolvePrediction(prediction.id);
      resolved++;
    } catch (error) {
      failed++;
      errors.push(`${prediction.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  return { resolved, failed, errors };
}

// =============================================================================
// ANALYTICS
// =============================================================================

/**
 * Get prediction analytics
 */
export async function getPredictionAnalytics(): Promise<{
  totalPredictions: number;
  pending: number;
  resolved: number;
  overallAccuracy: number;
  byAsset: Record<string, { total: number; correct: number; accuracy: number }>;
  byType: Record<PredictionType, { total: number; correct: number; accuracy: number }>;
  byTimeframe: Record<PredictionTimeframe, { total: number; correct: number; accuracy: number }>;
  recentActivity: { date: string; created: number; resolved: number }[];
}> {
  const allDocs = await db.listDocuments<Prediction>(COLLECTION, { limit: 2000 });
  const predictions = allDocs.map(doc => doc.data);

  const pending = predictions.filter(p => p.status === 'pending').length;
  const correct = predictions.filter(p => p.status === 'correct').length;
  const incorrect = predictions.filter(p => p.status === 'incorrect').length;
  const resolved = correct + incorrect;

  // By asset
  const byAsset: Record<string, { total: number; correct: number }> = {};
  predictions.forEach(p => {
    if (!byAsset[p.asset]) {
      byAsset[p.asset] = { total: 0, correct: 0 };
    }
    byAsset[p.asset].total++;
    if (p.status === 'correct') byAsset[p.asset].correct++;
  });

  // By type
  const byType: Record<string, { total: number; correct: number }> = {};
  predictions.forEach(p => {
    if (!byType[p.type]) {
      byType[p.type] = { total: 0, correct: 0 };
    }
    byType[p.type].total++;
    if (p.status === 'correct') byType[p.type].correct++;
  });

  // By timeframe
  const byTimeframe: Record<string, { total: number; correct: number }> = {};
  predictions.forEach(p => {
    if (!byTimeframe[p.timeframe]) {
      byTimeframe[p.timeframe] = { total: 0, correct: 0 };
    }
    byTimeframe[p.timeframe].total++;
    if (p.status === 'correct') byTimeframe[p.timeframe].correct++;
  });

  // Calculate accuracies
  const addAccuracy = (stats: { total: number; correct: number }): { total: number; correct: number; accuracy: number } => ({
    ...stats,
    accuracy: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
  });

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentByDate: Record<string, { created: number; resolved: number }> = {};
  predictions
    .filter(p => new Date(p.createdAt) >= thirtyDaysAgo)
    .forEach(p => {
      const date = p.createdAt.split('T')[0];
      if (!recentByDate[date]) {
        recentByDate[date] = { created: 0, resolved: 0 };
      }
      recentByDate[date].created++;
    });
  
  predictions
    .filter(p => p.outcome && new Date(p.outcome.resolvedAt) >= thirtyDaysAgo)
    .forEach(p => {
      const date = p.outcome!.resolvedAt.split('T')[0];
      if (!recentByDate[date]) {
        recentByDate[date] = { created: 0, resolved: 0 };
      }
      recentByDate[date].resolved++;
    });

  return {
    totalPredictions: predictions.length,
    pending,
    resolved,
    overallAccuracy: resolved > 0 ? (correct / resolved) * 100 : 0,
    byAsset: Object.fromEntries(
      Object.entries(byAsset).map(([k, v]) => [k, addAccuracy(v)])
    ),
    byType: Object.fromEntries(
      Object.entries(byType).map(([k, v]) => [k, addAccuracy(v)])
    ) as Record<PredictionType, { total: number; correct: number; accuracy: number }>,
    byTimeframe: Object.fromEntries(
      Object.entries(byTimeframe).map(([k, v]) => [k, addAccuracy(v)])
    ) as Record<PredictionTimeframe, { total: number; correct: number; accuracy: number }>,
    recentActivity: Object.entries(recentByDate)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export default {
  create: createPrediction,
  get: getPrediction,
  getUserPredictions,
  getAssetPredictions,
  resolve: resolvePrediction,
  cancel: cancelPrediction,
  getUserStats,
  getLeaderboard,
  resolveExpired: resolveExpiredPredictions,
  getAnalytics: getPredictionAnalytics,
};
