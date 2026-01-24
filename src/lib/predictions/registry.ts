/**
 * Prediction Registry
 * 
 * A timestamped, cryptographically verifiable prediction system.
 * Allows users to register predictions with deadlines and track outcomes.
 * 
 * Features:
 * - Immutable prediction registration with cryptographic hashes
 * - Outcome verification and accuracy tracking
 * - Leaderboard by predictor accuracy
 * - Category-based prediction organization
 * - Public audit trail
 * - Persistent storage with KV database
 */

import { createHash } from 'crypto';
import { db } from '../database';

// =============================================================================
// Types
// =============================================================================

export type PredictionCategory = 
  | 'price'
  | 'event'
  | 'adoption'
  | 'regulation'
  | 'technology'
  | 'market_cap'
  | 'dominance'
  | 'defi'
  | 'other';

export type PredictionStatus = 
  | 'pending'
  | 'correct'
  | 'incorrect'
  | 'partially_correct'
  | 'expired'
  | 'cancelled';

export type PredictionConfidence = 'low' | 'medium' | 'high' | 'very_high';

export interface Prediction {
  id: string;
  hash: string; // SHA-256 hash for verification
  
  // Predictor info
  predictorId: string;
  predictorName: string;
  predictorType: 'user' | 'influencer' | 'analyst' | 'ai';
  
  // Prediction content
  title: string;
  description: string;
  category: PredictionCategory;
  tags: string[];
  
  // Target specifics
  targetAsset?: string; // BTC, ETH, etc.
  targetMetric?: string; // price, market_cap, tvl, etc.
  targetValue?: number;
  targetCondition?: 'above' | 'below' | 'between' | 'equals';
  targetRangeMin?: number;
  targetRangeMax?: number;
  
  // Timing
  createdAt: Date;
  deadline: Date;
  resolvedAt?: Date;
  
  // Confidence & stakes
  confidence: PredictionConfidence;
  confidencePercent: number; // 0-100
  stakeAmount?: number; // Optional stake in USD
  
  // Outcome
  status: PredictionStatus;
  outcome?: {
    actualValue?: number;
    accuracyPercent?: number;
    verificationSource?: string;
    verifiedAt?: Date;
    notes?: string;
  };
  
  // Engagement
  upvotes: number;
  downvotes: number;
  comments: number;
  views: number;
  
  // Verification
  isVerified: boolean;
  verifiedBy?: string;
  
  // Metadata
  source?: string; // URL if from external source
  relatedPredictions?: string[];
}

export interface Predictor {
  id: string;
  name: string;
  type: 'user' | 'influencer' | 'analyst' | 'ai';
  avatar?: string;
  bio?: string;
  
  // Stats
  totalPredictions: number;
  correctPredictions: number;
  incorrectPredictions: number;
  pendingPredictions: number;
  
  // Accuracy metrics
  overallAccuracy: number; // 0-100
  accuracyByCategory: Record<PredictionCategory, number>;
  accuracyByTimeframe: {
    '24h': number;
    '7d': number;
    '30d': number;
    '90d': number;
  };
  
  // Reputation
  reputationScore: number; // 0-1000
  rank: number;
  streak: number; // Consecutive correct predictions
  
  // Timestamps
  joinedAt: Date;
  lastPredictionAt?: Date;
}

export interface PredictionLeaderboard {
  timeframe: '7d' | '30d' | '90d' | 'all';
  category?: PredictionCategory;
  entries: LeaderboardEntry[];
  updatedAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  predictor: Predictor;
  predictions: number;
  accuracy: number;
  avgConfidence: number;
  profitLoss?: number;
}

// =============================================================================
// Storage Configuration
// =============================================================================

// Key prefixes for database storage
const DB_KEYS = {
  prediction: 'predictions:',
  predictor: 'predictors:',
  predictorIndex: 'idx:predictor:',
  assetIndex: 'idx:asset:',
  categoryIndex: 'idx:category:',
  allPredictions: 'predictions:all',
  allPredictors: 'predictors:all',
} as const;

// In-memory cache for fast lookups (synced with database)
const predictionsCache = new Map<string, Prediction>();
const predictorsCache = new Map<string, Predictor>();
const predictionsByPredictor = new Map<string, Set<string>>();
const predictionsByAsset = new Map<string, Set<string>>();
const predictionsByCategory = new Map<PredictionCategory, Set<string>>();

// Track if cache is initialized from database
let cacheInitialized = false;

/**
 * Initialize cache from database on first access
 */
async function ensureCacheInitialized(): Promise<void> {
  if (cacheInitialized) return;
  
  try {
    // Load all prediction IDs from database
    const predictionIds = await db.get<string[]>(DB_KEYS.allPredictions);
    if (predictionIds && predictionIds.length > 0) {
      // Load predictions in batches
      const predictions = await db.mget<Prediction>(
        predictionIds.map(id => `${DB_KEYS.prediction}${id}`)
      );
      
      for (let i = 0; i < predictionIds.length; i++) {
        const prediction = predictions[i];
        if (prediction) {
          // Convert date strings back to Date objects
          prediction.createdAt = new Date(prediction.createdAt);
          prediction.deadline = new Date(prediction.deadline);
          if (prediction.resolvedAt) prediction.resolvedAt = new Date(prediction.resolvedAt);
          if (prediction.outcome?.verifiedAt) {
            prediction.outcome.verifiedAt = new Date(prediction.outcome.verifiedAt);
          }
          
          predictionsCache.set(predictionIds[i], prediction);
          
          // Rebuild indices
          if (!predictionsByPredictor.has(prediction.predictorId)) {
            predictionsByPredictor.set(prediction.predictorId, new Set());
          }
          predictionsByPredictor.get(prediction.predictorId)!.add(predictionIds[i]);
          
          if (prediction.targetAsset) {
            const assetKey = prediction.targetAsset.toUpperCase();
            if (!predictionsByAsset.has(assetKey)) {
              predictionsByAsset.set(assetKey, new Set());
            }
            predictionsByAsset.get(assetKey)!.add(predictionIds[i]);
          }
          
          if (!predictionsByCategory.has(prediction.category)) {
            predictionsByCategory.set(prediction.category, new Set());
          }
          predictionsByCategory.get(prediction.category)!.add(predictionIds[i]);
        }
      }
    }
    
    // Load all predictor IDs from database
    const predictorIds = await db.get<string[]>(DB_KEYS.allPredictors);
    if (predictorIds && predictorIds.length > 0) {
      const predictors = await db.mget<Predictor>(
        predictorIds.map(id => `${DB_KEYS.predictor}${id}`)
      );
      
      for (let i = 0; i < predictorIds.length; i++) {
        const predictor = predictors[i];
        if (predictor) {
          predictor.joinedAt = new Date(predictor.joinedAt);
          if (predictor.lastPredictionAt) {
            predictor.lastPredictionAt = new Date(predictor.lastPredictionAt);
          }
          predictorsCache.set(predictorIds[i], predictor);
        }
      }
    }
    
    cacheInitialized = true;
  } catch (error) {
    console.warn('Failed to initialize predictions cache from database:', error);
    // Continue with empty cache - will populate as predictions are created
    cacheInitialized = true;
  }
}

/**
 * Persist a prediction to the database
 */
async function persistPrediction(prediction: Prediction): Promise<void> {
  try {
    // Save the prediction
    await db.set(`${DB_KEYS.prediction}${prediction.id}`, prediction);
    
    // Update the all predictions index
    const allPredictions = await db.get<string[]>(DB_KEYS.allPredictions) || [];
    if (!allPredictions.includes(prediction.id)) {
      allPredictions.push(prediction.id);
      await db.set(DB_KEYS.allPredictions, allPredictions);
    }
  } catch (error) {
    console.warn('Failed to persist prediction to database:', error);
    // Cache will still have the data
  }
}

/**
 * Persist a predictor to the database
 */
async function persistPredictor(predictor: Predictor): Promise<void> {
  try {
    // Save the predictor
    await db.set(`${DB_KEYS.predictor}${predictor.id}`, predictor);
    
    // Update the all predictors index
    const allPredictors = await db.get<string[]>(DB_KEYS.allPredictors) || [];
    if (!allPredictors.includes(predictor.id)) {
      allPredictors.push(predictor.id);
      await db.set(DB_KEYS.allPredictors, allPredictors);
    }
  } catch (error) {
    console.warn('Failed to persist predictor to database:', error);
    // Cache will still have the data
  }
}

// =============================================================================
// Core Functions
// =============================================================================

/**
 * Generate a unique prediction ID
 */
function generatePredictionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 10);
  return `pred_${timestamp}_${random}`;
}

/**
 * Generate a cryptographic hash of the prediction content
 * This provides an immutable record of what was predicted
 */
function generatePredictionHash(prediction: Omit<Prediction, 'id' | 'hash' | 'status' | 'outcome' | 'upvotes' | 'downvotes' | 'comments' | 'views' | 'isVerified'>): string {
  const content = JSON.stringify({
    title: prediction.title,
    description: prediction.description,
    category: prediction.category,
    targetAsset: prediction.targetAsset,
    targetMetric: prediction.targetMetric,
    targetValue: prediction.targetValue,
    targetCondition: prediction.targetCondition,
    deadline: prediction.deadline.toISOString(),
    createdAt: prediction.createdAt.toISOString(),
    predictorId: prediction.predictorId,
    confidence: prediction.confidence,
    confidencePercent: prediction.confidencePercent,
  });
  
  return createHash('sha256').update(content).digest('hex');
}

/**
 * Register a new prediction
 */
export async function registerPrediction(input: {
  predictorId: string;
  predictorName: string;
  predictorType: 'user' | 'influencer' | 'analyst' | 'ai';
  title: string;
  description: string;
  category: PredictionCategory;
  tags?: string[];
  targetAsset?: string;
  targetMetric?: string;
  targetValue?: number;
  targetCondition?: 'above' | 'below' | 'between' | 'equals';
  targetRangeMin?: number;
  targetRangeMax?: number;
  deadline: Date;
  confidence: PredictionConfidence;
  confidencePercent: number;
  stakeAmount?: number;
  source?: string;
}): Promise<Prediction> {
  await ensureCacheInitialized();
  
  const now = new Date();
  const id = generatePredictionId();
  
  // Validate deadline is in the future
  if (input.deadline <= now) {
    throw new Error('Prediction deadline must be in the future');
  }
  
  // Create prediction object without hash first
  const predictionBase = {
    id,
    hash: '', // Will be set after
    predictorId: input.predictorId,
    predictorName: input.predictorName,
    predictorType: input.predictorType,
    title: input.title,
    description: input.description,
    category: input.category,
    tags: input.tags || [],
    targetAsset: input.targetAsset,
    targetMetric: input.targetMetric,
    targetValue: input.targetValue,
    targetCondition: input.targetCondition,
    targetRangeMin: input.targetRangeMin,
    targetRangeMax: input.targetRangeMax,
    createdAt: now,
    deadline: input.deadline,
    confidence: input.confidence,
    confidencePercent: input.confidencePercent,
    stakeAmount: input.stakeAmount,
    status: 'pending' as PredictionStatus,
    upvotes: 0,
    downvotes: 0,
    comments: 0,
    views: 0,
    isVerified: false,
    source: input.source,
  };
  
  // Generate hash
  const hash = generatePredictionHash(predictionBase);
  const prediction: Prediction = { ...predictionBase, hash };
  
  // Store prediction
  predictionsCache.set(id, prediction);
  
  // Update indices
  if (!predictionsByPredictor.has(input.predictorId)) {
    predictionsByPredictor.set(input.predictorId, new Set());
  }
  predictionsByPredictor.get(input.predictorId)!.add(id);
  
  if (input.targetAsset) {
    const assetKey = input.targetAsset.toUpperCase();
    if (!predictionsByAsset.has(assetKey)) {
      predictionsByAsset.set(assetKey, new Set());
    }
    predictionsByAsset.get(assetKey)!.add(id);
  }
  
  if (!predictionsByCategory.has(input.category)) {
    predictionsByCategory.set(input.category, new Set());
  }
  predictionsByCategory.get(input.category)!.add(id);
  
  // Update predictor stats
  await updatePredictorStats(input.predictorId, input.predictorName, input.predictorType);
  
  // Persist to database
  await persistPrediction(prediction);
  
  return prediction;
}

/**
 * Get a prediction by ID
 */
export async function getPrediction(id: string): Promise<Prediction | null> {
  await ensureCacheInitialized();
  
  const prediction = predictionsCache.get(id);
  if (prediction) {
    // Increment views
    prediction.views++;
  }
  return prediction || null;
}

/**
 * Verify a prediction hash
 */
export function verifyPredictionHash(prediction: Prediction): boolean {
  const expectedHash = generatePredictionHash(prediction);
  return prediction.hash === expectedHash;
}

/**
 * Resolve a prediction outcome
 */
export async function resolvePrediction(
  id: string,
  outcome: {
    status: 'correct' | 'incorrect' | 'partially_correct';
    actualValue?: number;
    verificationSource: string;
    notes?: string;
  },
  verifiedBy: string
): Promise<Prediction> {
  await ensureCacheInitialized();
  
  const prediction = predictionsCache.get(id);
  if (!prediction) {
    throw new Error(`Prediction ${id} not found`);
  }
  
  if (prediction.status !== 'pending') {
    throw new Error(`Prediction ${id} has already been resolved`);
  }
  
  // Calculate accuracy for value-based predictions
  let accuracyPercent: number | undefined;
  if (prediction.targetValue !== undefined && outcome.actualValue !== undefined) {
    const error = Math.abs(outcome.actualValue - prediction.targetValue) / prediction.targetValue;
    accuracyPercent = Math.max(0, (1 - error) * 100);
  }
  
  // Update prediction
  prediction.status = outcome.status;
  prediction.resolvedAt = new Date();
  prediction.isVerified = true;
  prediction.verifiedBy = verifiedBy;
  prediction.outcome = {
    actualValue: outcome.actualValue,
    accuracyPercent,
    verificationSource: outcome.verificationSource,
    verifiedAt: new Date(),
    notes: outcome.notes,
  };
  
  predictionsCache.set(id, prediction);
  
  // Persist updated prediction
  await persistPrediction(prediction);
  
  // Update predictor stats
  const predictor = predictorsCache.get(prediction.predictorId);
  if (predictor) {
    predictor.pendingPredictions--;
    if (outcome.status === 'correct') {
      predictor.correctPredictions++;
      predictor.streak++;
    } else {
      predictor.incorrectPredictions++;
      predictor.streak = 0;
    }
    predictor.overallAccuracy = predictor.totalPredictions > 0
      ? (predictor.correctPredictions / (predictor.correctPredictions + predictor.incorrectPredictions)) * 100
      : 0;
    
    // Update category accuracy
    const categoryPredictions = await getPredictionsByCategory(prediction.category);
    const resolvedCategoryPredictions = categoryPredictions.filter(p => 
      p.predictorId === prediction.predictorId && 
      ['correct', 'incorrect', 'partially_correct'].includes(p.status)
    );
    const correctCategoryPredictions = resolvedCategoryPredictions.filter(p => p.status === 'correct').length;
    predictor.accuracyByCategory[prediction.category] = resolvedCategoryPredictions.length > 0
      ? (correctCategoryPredictions / resolvedCategoryPredictions.length) * 100
      : 0;
    
    predictorsCache.set(prediction.predictorId, predictor);
    
    // Persist updated predictor
    await persistPredictor(predictor);
  }
  
  return prediction;
}

/**
 * Get predictions by predictor
 */
export async function getPredictionsByPredictor(
  predictorId: string,
  options?: { status?: PredictionStatus; limit?: number }
): Promise<Prediction[]> {
  await ensureCacheInitialized();
  
  const predictionIds = predictionsByPredictor.get(predictorId);
  if (!predictionIds) return [];
  
  let results = Array.from(predictionIds)
    .map(id => predictionsCache.get(id))
    .filter((p): p is Prediction => p !== undefined);
  
  if (options?.status) {
    results = results.filter(p => p.status === options.status);
  }
  
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  if (options?.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
}

/**
 * Get predictions by asset
 */
export async function getPredictionsByAsset(
  asset: string,
  options?: { status?: PredictionStatus; limit?: number }
): Promise<Prediction[]> {
  await ensureCacheInitialized();
  
  const predictionIds = predictionsByAsset.get(asset.toUpperCase());
  if (!predictionIds) return [];
  
  let results = Array.from(predictionIds)
    .map(id => predictionsCache.get(id))
    .filter((p): p is Prediction => p !== undefined);
  
  if (options?.status) {
    results = results.filter(p => p.status === options.status);
  }
  
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  if (options?.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
}

/**
 * Get predictions by category
 */
export async function getPredictionsByCategory(
  category: PredictionCategory,
  options?: { status?: PredictionStatus; limit?: number }
): Promise<Prediction[]> {
  await ensureCacheInitialized();
  
  const predictionIds = predictionsByCategory.get(category);
  if (!predictionIds) return [];
  
  let results = Array.from(predictionIds)
    .map(id => predictionsCache.get(id))
    .filter((p): p is Prediction => p !== undefined);
  
  if (options?.status) {
    results = results.filter(p => p.status === options.status);
  }
  
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  if (options?.limit) {
    results = results.slice(0, options.limit);
  }
  
  return results;
}

/**
 * Get recent predictions
 */
export async function getRecentPredictions(limit = 50): Promise<Prediction[]> {
  await ensureCacheInitialized();
  
  return Array.from(predictionsCache.values())
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

/**
 * Get trending predictions (by engagement)
 */
export async function getTrendingPredictions(limit = 20): Promise<Prediction[]> {
  await ensureCacheInitialized();
  
  const now = Date.now();
  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  
  return Array.from(predictionsCache.values())
    .filter(p => p.createdAt.getTime() >= oneWeekAgo && p.status === 'pending')
    .sort((a, b) => {
      const scoreA = a.upvotes - a.downvotes + a.comments * 2 + a.views * 0.1;
      const scoreB = b.upvotes - b.downvotes + b.comments * 2 + b.views * 0.1;
      return scoreB - scoreA;
    })
    .slice(0, limit);
}

/**
 * Get expiring predictions (deadline within 24h)
 */
export async function getExpiringPredictions(hoursUntilDeadline = 24): Promise<Prediction[]> {
  await ensureCacheInitialized();
  
  const now = Date.now();
  const cutoff = now + hoursUntilDeadline * 60 * 60 * 1000;
  
  return Array.from(predictionsCache.values())
    .filter(p => 
      p.status === 'pending' && 
      p.deadline.getTime() > now &&
      p.deadline.getTime() <= cutoff
    )
    .sort((a, b) => a.deadline.getTime() - b.deadline.getTime());
}

/**
 * Vote on a prediction
 */
export async function votePrediction(
  id: string,
  vote: 'up' | 'down'
): Promise<Prediction> {
  await ensureCacheInitialized();
  
  const prediction = predictionsCache.get(id);
  if (!prediction) {
    throw new Error(`Prediction ${id} not found`);
  }
  
  if (vote === 'up') {
    prediction.upvotes++;
  } else {
    prediction.downvotes++;
  }
  
  predictionsCache.set(id, prediction);
  
  // Persist vote update
  await persistPrediction(prediction);
  
  return prediction;
}

// =============================================================================
// Predictor Functions
// =============================================================================

/**
 * Update predictor stats
 */
async function updatePredictorStats(
  id: string,
  name: string,
  type: 'user' | 'influencer' | 'analyst' | 'ai'
): Promise<void> {
  let predictor = predictorsCache.get(id);
  
  if (!predictor) {
    predictor = {
      id,
      name,
      type,
      totalPredictions: 0,
      correctPredictions: 0,
      incorrectPredictions: 0,
      pendingPredictions: 0,
      overallAccuracy: 0,
      accuracyByCategory: {} as Record<PredictionCategory, number>,
      accuracyByTimeframe: {
        '24h': 0,
        '7d': 0,
        '30d': 0,
        '90d': 0,
      },
      reputationScore: 100,
      rank: 0,
      streak: 0,
      joinedAt: new Date(),
    };
  }
  
  predictor.totalPredictions++;
  predictor.pendingPredictions++;
  predictor.lastPredictionAt = new Date();
  
  predictorsCache.set(id, predictor);
  
  // Persist predictor update
  await persistPredictor(predictor);
}

/**
 * Get predictor by ID
 */
export async function getPredictor(id: string): Promise<Predictor | null> {
  await ensureCacheInitialized();
  return predictorsCache.get(id) || null;
}

/**
 * Get predictor leaderboard
 */
export async function getLeaderboard(options?: {
  timeframe?: '7d' | '30d' | '90d' | 'all';
  category?: PredictionCategory;
  limit?: number;
}): Promise<PredictionLeaderboard> {
  await ensureCacheInitialized();
  
  const timeframe = options?.timeframe || 'all';
  const limit = options?.limit || 50;
  
  let allPredictors = Array.from(predictorsCache.values());
  
  // Filter by minimum predictions for reliability
  allPredictors = allPredictors.filter(p => 
    p.correctPredictions + p.incorrectPredictions >= 3
  );
  
  // Sort by accuracy (with reputation as tiebreaker)
  allPredictors.sort((a, b) => {
    if (b.overallAccuracy !== a.overallAccuracy) {
      return b.overallAccuracy - a.overallAccuracy;
    }
    return b.reputationScore - a.reputationScore;
  });
  
  const entries: LeaderboardEntry[] = allPredictors
    .slice(0, limit)
    .map((predictor, index) => ({
      rank: index + 1,
      predictor,
      predictions: predictor.correctPredictions + predictor.incorrectPredictions,
      accuracy: predictor.overallAccuracy,
      avgConfidence: 75, // Would calculate from actual predictions
    }));
  
  return {
    timeframe,
    category: options?.category,
    entries,
    updatedAt: new Date(),
  };
}

/**
 * Get prediction statistics
 */
export async function getPredictionStats(): Promise<{
  totalPredictions: number;
  pendingPredictions: number;
  resolvedPredictions: number;
  overallAccuracy: number;
  predictionsByCategory: Record<PredictionCategory, number>;
  topPredictors: Predictor[];
  recentResolutions: Prediction[];
}> {
  await ensureCacheInitialized();
  const allPredictions = Array.from(predictionsCache.values());
  const resolved = allPredictions.filter(p => 
    ['correct', 'incorrect', 'partially_correct'].includes(p.status)
  );
  const correct = resolved.filter(p => p.status === 'correct').length;
  
  const byCategory: Record<PredictionCategory, number> = {} as Record<PredictionCategory, number>;
  for (const category of predictionsByCategory.keys()) {
    byCategory[category] = predictionsByCategory.get(category)?.size || 0;
  }
  
  const topPredictors = Array.from(predictorsCache.values())
    .filter(p => p.correctPredictions + p.incorrectPredictions >= 3)
    .sort((a, b) => b.overallAccuracy - a.overallAccuracy)
    .slice(0, 10);
  
  const recentResolutions = allPredictions
    .filter(p => p.resolvedAt)
    .sort((a, b) => (b.resolvedAt?.getTime() || 0) - (a.resolvedAt?.getTime() || 0))
    .slice(0, 10);
  
  return {
    totalPredictions: allPredictions.length,
    pendingPredictions: allPredictions.filter(p => p.status === 'pending').length,
    resolvedPredictions: resolved.length,
    overallAccuracy: resolved.length > 0 ? (correct / resolved.length) * 100 : 0,
    predictionsByCategory: byCategory,
    topPredictors,
    recentResolutions,
  };
}

// =============================================================================
// Exports
// =============================================================================

export {
  generatePredictionHash,
  generatePredictionId,
};
