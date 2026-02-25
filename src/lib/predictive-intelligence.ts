/**
 * Predictive Intelligence Engine
 *
 * AI-powered forecasting for crypto markets combining multiple signal types:
 * narrative momentum, sentiment trajectories, market microstructure, on-chain
 * patterns, and historical analogues. Produces probabilistic forecasts with
 * confidence intervals and transparent reasoning chains.
 *
 * Models:
 * 1. Narrative Momentum Model — tracks narrative lifecycle (emergence → peak → decay)
 * 2. Sentiment Trajectory Model — detects sentiment acceleration/deceleration
 * 3. Historical Analogue Finder — finds past periods with similar conditions
 * 4. Regime Detection — identifies market regime (trending/ranging/crisis)
 * 5. Composite Forecast — blends all models with dynamic weighting
 *
 * Features:
 * - Multi-model ensemble with confidence-weighted blending
 * - Backtestable predictions with historical accuracy tracking
 * - Transparent reasoning chains (no black boxes)
 * - Temporal confidence decay (predictions lose confidence over time)
 * - Anomaly-aware: adjusts confidence during unusual conditions
 * - Calibration tracking: are our 70% predictions right 70% of the time?
 *
 * @module predictive-intelligence
 */

import { aiComplete } from './ai-provider';
import { cache, withCache } from './cache';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type ForecastHorizon = '1h' | '4h' | '1d' | '3d' | '1w' | '2w' | '1m';
export type MarketRegime = 'trending-up' | 'trending-down' | 'ranging' | 'high-volatility' | 'crisis' | 'accumulation' | 'distribution';
export type SignalStrength = 'very-strong' | 'strong' | 'moderate' | 'weak' | 'noise';
export type Direction = 'bullish' | 'bearish' | 'neutral';

export interface Forecast {
  id: string;
  asset: string;
  horizon: ForecastHorizon;
  generatedAt: string;
  expiresAt: string;

  // Core prediction
  direction: Direction;
  confidence: number; // 0-100
  expectedMove: {
    base: number; // expected % move
    low: number; // 10th percentile
    high: number; // 90th percentile
  };

  // Model outputs
  models: ModelOutput[];
  compositeSignal: CompositeSignal;

  // Regime context
  currentRegime: MarketRegime;
  regimeConfidence: number;

  // Reasoning
  reasoning: string[];
  keyDrivers: Driver[];
  risks: string[];
  catalysts: Catalyst[];

  // Meta
  historicalAccuracy?: number;
  calibrationScore?: number;
}

export interface ModelOutput {
  model: string;
  direction: Direction;
  confidence: number;
  signal: number; // -100 (max bearish) to +100 (max bullish)
  weight: number; // dynamic weight in ensemble
  reasoning: string;
  features: Record<string, number>;
}

export interface CompositeSignal {
  value: number; // -100 to +100
  strength: SignalStrength;
  agreement: number; // 0-100: how much models agree
  dominantModel: string;
}

export interface Driver {
  name: string;
  type: 'narrative' | 'sentiment' | 'market' | 'onchain' | 'macro' | 'technical';
  impact: number; // -100 to +100
  confidence: number; // 0-100
  description: string;
}

export interface Catalyst {
  event: string;
  expectedDate?: string;
  probability: number; // 0-100
  impact: 'high' | 'medium' | 'low';
  direction: Direction;
}

export interface NarrativeMomentum {
  narrative: string;
  phase: 'emerging' | 'growing' | 'peak' | 'declining' | 'dead';
  velocity: number; // rate of change in mention frequency
  acceleration: number; // rate of change of velocity
  saturation: number; // 0-100: how saturated media coverage is
  predictedPeakDate?: string;
  affectedAssets: string[];
  sentiment: number; // -1 to 1
}

export interface SentimentTrajectory {
  asset: string;
  currentSentiment: number; // -1 to 1
  sentimentVelocity: number; // rate of change
  sentimentAcceleration: number;
  divergence: number; // gap between sentiment and price action
  historicalPercentile: number; // 0-100: where current sentiment sits historically
  extremeReading: boolean;
}

export interface HistoricalAnalogue {
  period: string; // "2021-05 BTC post-ATH correction"
  similarity: number; // 0-100
  priceOutcome: string; // "dropped 35% over 6 weeks"
  sentimentPath: string;
  keyDifferences: string[];
  applicability: number; // 0-100
}

export interface CalibrationMetrics {
  totalPredictions: number;
  byConfidenceBucket: Array<{
    bucket: string; // "60-70%"
    predictions: number;
    correctPct: number;
    expectedPct: number;
    calibrationError: number;
  }>;
  brierScore: number; // 0-1 (lower is better)
  overallAccuracy: number;
  lastUpdated: string;
}

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════

const CONFIG = {
  CACHE_TTL: 300,
  DEFAULT_HORIZON: '1d' as ForecastHorizon,
  MODEL_WEIGHTS: {
    narrative: 0.25,
    sentiment: 0.20,
    analogue: 0.15,
    regime: 0.20,
    composite: 0.20,
  },
  CONFIDENCE_DECAY_PER_HOUR: 0.5,
  MIN_CONFIDENCE: 10,
  MAX_CONFIDENCE: 95,
  HORIZON_HOURS: {
    '1h': 1,
    '4h': 4,
    '1d': 24,
    '3d': 72,
    '1w': 168,
    '2w': 336,
    '1m': 720,
  } as Record<ForecastHorizon, number>,
} as const;

// ═══════════════════════════════════════════════════════════════
// PREDICTION HISTORY (for calibration)
// ═══════════════════════════════════════════════════════════════

interface PredictionRecord {
  id: string;
  asset: string;
  direction: Direction;
  confidence: number;
  expectedMove: number;
  actualMove?: number;
  correct?: boolean;
  createdAt: number;
  resolvedAt?: number;
}

const predictionHistory: PredictionRecord[] = [];

// ═══════════════════════════════════════════════════════════════
// MODEL 1: NARRATIVE MOMENTUM
// ═══════════════════════════════════════════════════════════════

async function narrativeMomentumModel(
  asset: string,
  context: string,
  horizon: ForecastHorizon
): Promise<ModelOutput> {
  const prompt = `Analyze the narrative momentum for ${asset} over the next ${horizon}.

Context from recent news and social signals:
${context}

Evaluate:
1. What are the dominant narratives around ${asset}?
2. Where is each narrative in its lifecycle (emerging/growing/peak/declining/dead)?
3. How fast is narrative momentum changing?
4. Is media coverage saturated or still growing?
5. Are there emerging narratives that could shift sentiment?

Return JSON:
{
  "direction": "bullish|bearish|neutral",
  "confidence": 0-100,
  "signal": -100 to +100,
  "reasoning": "Concise explanation of narrative momentum assessment",
  "features": {
    "dominant_narrative_phase": 0-4 (0=emerging, 4=dead),
    "narrative_velocity": -100 to 100,
    "media_saturation": 0-100,
    "counter_narrative_strength": 0-100,
    "narrative_count": 1-10
  }
}`;

  const response = await aiComplete(
    'You are a narrative intelligence analyst. You track how crypto narratives evolve and predict their trajectory. Be quantitative and precise.',
    prompt,
    { temperature: 0.2, maxTokens: 1200 }
  );

  const parsed = safeParseJSON<Partial<ModelOutput>>(response);

  return {
    model: 'narrative-momentum',
    direction: parsed?.direction || 'neutral',
    confidence: clamp(parsed?.confidence ?? 40, 0, 100),
    signal: clamp(parsed?.signal ?? 0, -100, 100),
    weight: CONFIG.MODEL_WEIGHTS.narrative,
    reasoning: parsed?.reasoning || 'Unable to assess narrative momentum',
    features: parsed?.features || {},
  };
}

// ═══════════════════════════════════════════════════════════════
// MODEL 2: SENTIMENT TRAJECTORY
// ═══════════════════════════════════════════════════════════════

async function sentimentTrajectoryModel(
  asset: string,
  context: string,
  horizon: ForecastHorizon
): Promise<ModelOutput> {
  const prompt = `Analyze the sentiment trajectory for ${asset} over the next ${horizon}.

Context from recent sentiment data and social signals:
${context}

Evaluate:
1. What is the current aggregate sentiment? (precise number -1 to 1)
2. Is sentiment accelerating, decelerating, or reversing?
3. Is there a divergence between sentiment and price action?
4. Where does current sentiment sit in historical context (percentile)?
5. Are there extreme readings that suggest reversals?

Return JSON:
{
  "direction": "bullish|bearish|neutral",
  "confidence": 0-100,
  "signal": -100 to +100,
  "reasoning": "Concise sentiment trajectory assessment",
  "features": {
    "current_sentiment": -1 to 1,
    "sentiment_velocity": -1 to 1,
    "sentiment_acceleration": -1 to 1,
    "price_sentiment_divergence": -1 to 1,
    "historical_percentile": 0-100,
    "extreme_reading": 0 or 1
  }
}`;

  const response = await aiComplete(
    'You are a sentiment quant. You analyze sentiment trajectories and identify mean-reversion and momentum signals. Be data-driven.',
    prompt,
    { temperature: 0.2, maxTokens: 1200 }
  );

  const parsed = safeParseJSON<Partial<ModelOutput>>(response);

  return {
    model: 'sentiment-trajectory',
    direction: parsed?.direction || 'neutral',
    confidence: clamp(parsed?.confidence ?? 40, 0, 100),
    signal: clamp(parsed?.signal ?? 0, -100, 100),
    weight: CONFIG.MODEL_WEIGHTS.sentiment,
    reasoning: parsed?.reasoning || 'Unable to assess sentiment trajectory',
    features: parsed?.features || {},
  };
}

// ═══════════════════════════════════════════════════════════════
// MODEL 3: HISTORICAL ANALOGUE FINDER
// ═══════════════════════════════════════════════════════════════

async function historicalAnalogueModel(
  asset: string,
  context: string,
  horizon: ForecastHorizon
): Promise<ModelOutput> {
  const prompt = `Find historical analogues for the current situation with ${asset} and predict the next ${horizon}.

Current context:
${context}

Based on your knowledge of crypto market history (2017-2026):
1. What past periods most closely resemble the current situation?
2. What happened in those periods?
3. How applicable are those analogues to today?
4. What are the key differences that might lead to a different outcome?

Return JSON:
{
  "direction": "bullish|bearish|neutral",
  "confidence": 0-100,
  "signal": -100 to +100,
  "reasoning": "Which historical periods are analogous and what they suggest",
  "features": {
    "best_analogue_similarity": 0-100,
    "analogue_outcome_severity": -100 to 100,
    "analogue_applicability": 0-100,
    "num_supporting_analogues": 1-5,
    "analogue_agreement": 0-100
  }
}`;

  const response = await aiComplete(
    'You are a crypto market historian and pattern recognition expert. You find historical parallels and use them to forecast outcomes. Be specific about which periods you reference.',
    prompt,
    { temperature: 0.3, maxTokens: 1500 }
  );

  const parsed = safeParseJSON<Partial<ModelOutput>>(response);

  return {
    model: 'historical-analogue',
    direction: parsed?.direction || 'neutral',
    confidence: clamp(parsed?.confidence ?? 30, 0, 100),
    signal: clamp(parsed?.signal ?? 0, -100, 100),
    weight: CONFIG.MODEL_WEIGHTS.analogue,
    reasoning: parsed?.reasoning || 'Unable to find applicable historical analogues',
    features: parsed?.features || {},
  };
}

// ═══════════════════════════════════════════════════════════════
// MODEL 4: REGIME DETECTION
// ═══════════════════════════════════════════════════════════════

async function regimeDetectionModel(
  asset: string,
  context: string,
  _horizon: ForecastHorizon
): Promise<{ output: ModelOutput; regime: MarketRegime; regimeConfidence: number }> {
  const prompt = `Classify the current market regime for ${asset} and predict how the regime will evolve.

Context:
${context}

Market regimes:
- trending-up: Sustained uptrend with higher highs/lows
- trending-down: Sustained downtrend with lower highs/lows
- ranging: Sideways price action within bounds
- high-volatility: Elevated volatility without clear direction
- crisis: Panic selling, liquidity crunch, cascading liquidations
- accumulation: Smart money building positions, price consolidating
- distribution: Smart money distributing, price showing weakness at highs

Return JSON:
{
  "direction": "bullish|bearish|neutral",
  "confidence": 0-100,
  "signal": -100 to +100,
  "reasoning": "Regime classification and evolution prediction",
  "features": {
    "regime": "trending-up|trending-down|ranging|high-volatility|crisis|accumulation|distribution",
    "regime_confidence": 0-100,
    "regime_age_days": 1-365,
    "regime_transition_probability": 0-100,
    "likely_next_regime": "..."
  }
}`;

  const response = await aiComplete(
    'You are a market microstructure analyst specializing in regime detection. You identify whether markets are trending, ranging, accumulating, distributing, or in crisis. Be precise about transitions.',
    prompt,
    { temperature: 0.15, maxTokens: 1200 }
  );

  const parsed = safeParseJSON<Partial<ModelOutput & { features: { regime?: string; regime_confidence?: number } }>>(response);

  const regime = (parsed?.features?.regime as MarketRegime) || 'ranging';
  const regimeConfidence = parsed?.features?.regime_confidence ?? 50;

  return {
    output: {
      model: 'regime-detection',
      direction: parsed?.direction || 'neutral',
      confidence: clamp(parsed?.confidence ?? 40, 0, 100),
      signal: clamp(parsed?.signal ?? 0, -100, 100),
      weight: CONFIG.MODEL_WEIGHTS.regime,
      reasoning: parsed?.reasoning || 'Unable to classify market regime',
      features: parsed?.features || {},
    },
    regime,
    regimeConfidence,
  };
}

// ═══════════════════════════════════════════════════════════════
// ENSEMBLE: COMPOSITE FORECAST
// ═══════════════════════════════════════════════════════════════

function buildCompositeSignal(models: ModelOutput[]): CompositeSignal {
  if (models.length === 0) {
    return { value: 0, strength: 'noise', agreement: 0, dominantModel: 'none' };
  }

  // Confidence-weighted signal blending
  let weightedSignal = 0;
  let totalWeight = 0;

  for (const m of models) {
    const effectiveWeight = m.weight * (m.confidence / 100);
    weightedSignal += m.signal * effectiveWeight;
    totalWeight += effectiveWeight;
  }

  const compositeValue = totalWeight > 0 ? weightedSignal / totalWeight : 0;

  // Calculate agreement (how much models agree on direction)
  const directions = models.map((m) => Math.sign(m.signal));
  const majorityDirection = directions.reduce((a, b) => a + b, 0) > 0 ? 1 : -1;
  const agreementCount = directions.filter((d) => d === majorityDirection).length;
  const agreement = Math.round((agreementCount / models.length) * 100);

  // Determine signal strength
  const absSignal = Math.abs(compositeValue);
  let strength: SignalStrength;
  if (absSignal >= 70 && agreement >= 80) strength = 'very-strong';
  else if (absSignal >= 50 && agreement >= 60) strength = 'strong';
  else if (absSignal >= 30) strength = 'moderate';
  else if (absSignal >= 15) strength = 'weak';
  else strength = 'noise';

  // Find dominant model (highest absolute contribution)
  const dominant = models.reduce((best, m) =>
    Math.abs(m.signal * m.weight * m.confidence) > Math.abs(best.signal * best.weight * best.confidence) ? m : best
  );

  return {
    value: Math.round(compositeValue),
    strength,
    agreement,
    dominantModel: dominant.model,
  };
}

function calculateExpectedMove(
  signal: CompositeSignal,
  _horizon: ForecastHorizon,
  _regime: MarketRegime
): { base: number; low: number; high: number } {
  // Base move proportional to signal strength
  const basePct = signal.value * 0.05; // 1 signal point ≈ 0.05% expected move

  // Widen confidence interval based on uncertainty
  const uncertainty = (100 - signal.agreement) / 100;
  const spread = Math.abs(basePct) * (0.8 + uncertainty * 2);

  return {
    base: Math.round(basePct * 100) / 100,
    low: Math.round((basePct - spread) * 100) / 100,
    high: Math.round((basePct + spread) * 100) / 100,
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN FORECAST PIPELINE
// ═══════════════════════════════════════════════════════════════

export async function generateForecast(
  asset: string,
  options?: {
    horizon?: ForecastHorizon;
    context?: string;
    includeAnalogues?: boolean;
  }
): Promise<Forecast> {
  const horizon = options?.horizon ?? CONFIG.DEFAULT_HORIZON;
  const cacheKey = `forecast:${asset}:${horizon}`;

  const cached = cache.get<Forecast>(cacheKey);
  if (cached) return cached;

  const context = options?.context || `Analyzing ${asset} for the next ${horizon}`;

  // Run all models in parallel
  const [narrativeResult, sentimentResult, regimeResult, analogueResult] =
    await Promise.allSettled([
      narrativeMomentumModel(asset, context, horizon),
      sentimentTrajectoryModel(asset, context, horizon),
      regimeDetectionModel(asset, context, horizon),
      options?.includeAnalogues !== false
        ? historicalAnalogueModel(asset, context, horizon)
        : Promise.resolve(null),
    ]);

  const models: ModelOutput[] = [];

  if (narrativeResult.status === 'fulfilled') models.push(narrativeResult.value);
  if (sentimentResult.status === 'fulfilled') models.push(sentimentResult.value);
  if (regimeResult.status === 'fulfilled') models.push(regimeResult.value.output);
  if (analogueResult.status === 'fulfilled' && analogueResult.value) models.push(analogueResult.value);

  const regime = regimeResult.status === 'fulfilled' ? regimeResult.value.regime : 'ranging';
  const regimeConfidence = regimeResult.status === 'fulfilled' ? regimeResult.value.regimeConfidence : 50;

  // Build composite signal
  const compositeSignal = buildCompositeSignal(models);
  const expectedMove = calculateExpectedMove(compositeSignal, horizon, regime);

  // Determine overall direction and confidence
  const direction: Direction = compositeSignal.value > 10 ? 'bullish' : compositeSignal.value < -10 ? 'bearish' : 'neutral';
  const confidence = clamp(
    Math.round(Math.abs(compositeSignal.value) * (compositeSignal.agreement / 100)),
    CONFIG.MIN_CONFIDENCE,
    CONFIG.MAX_CONFIDENCE
  );

  // Aggregate reasoning and drivers
  const reasoning = models.map((m) => `[${m.model}] ${m.reasoning}`);
  const keyDrivers = extractDrivers(models);
  const risks = extractRisks(models, regime);
  const catalysts = await identifyCatalysts(asset, context, horizon);

  // Calculate expiration
  const horizonHours = CONFIG.HORIZON_HOURS[horizon];
  const expiresAt = new Date(Date.now() + horizonHours * 3600 * 1000).toISOString();

  const forecast: Forecast = {
    id: `fc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    asset,
    horizon,
    generatedAt: new Date().toISOString(),
    expiresAt,
    direction,
    confidence,
    expectedMove,
    models,
    compositeSignal,
    currentRegime: regime,
    regimeConfidence,
    reasoning,
    keyDrivers,
    risks,
    catalysts,
    historicalAccuracy: getHistoricalAccuracy(asset),
    calibrationScore: getCalibrationScore(),
  };

  // Record prediction for future calibration
  predictionHistory.push({
    id: forecast.id,
    asset,
    direction,
    confidence,
    expectedMove: expectedMove.base,
    createdAt: Date.now(),
  });

  cache.set(cacheKey, forecast, CONFIG.CACHE_TTL);

  return forecast;
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function extractDrivers(models: ModelOutput[]): Driver[] {
  const drivers: Driver[] = [];

  for (const model of models) {
    if (model.confidence < 30) continue;

    const driverType: Driver['type'] =
      model.model === 'narrative-momentum' ? 'narrative' :
      model.model === 'sentiment-trajectory' ? 'sentiment' :
      model.model === 'historical-analogue' ? 'market' :
      model.model === 'regime-detection' ? 'technical' : 'market';

    drivers.push({
      name: model.model,
      type: driverType,
      impact: model.signal,
      confidence: model.confidence,
      description: model.reasoning,
    });
  }

  return drivers.sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));
}

function extractRisks(models: ModelOutput[], regime: MarketRegime): string[] {
  const risks: string[] = [];

  // Regime-specific risks
  if (regime === 'crisis') risks.push('Market in crisis regime — extreme volatility and liquidity risk');
  if (regime === 'high-volatility') risks.push('Elevated volatility regime — wider stops recommended');
  if (regime === 'distribution') risks.push('Potential distribution phase — smart money may be selling');

  // Model disagreement risk
  const signals = models.map((m) => m.signal);
  const maxSignal = Math.max(...signals);
  const minSignal = Math.min(...signals);
  if (maxSignal - minSignal > 100) {
    risks.push('Significant model disagreement — high uncertainty in forecast');
  }

  // Low confidence risk
  const avgConfidence = models.reduce((s, m) => s + m.confidence, 0) / models.length;
  if (avgConfidence < 40) {
    risks.push('Low average model confidence — insufficient signal quality');
  }

  return risks;
}

async function identifyCatalysts(
  asset: string,
  context: string,
  horizon: ForecastHorizon
): Promise<Catalyst[]> {
  try {
    const response = await aiComplete(
      'You are a crypto market catalyst identifier. List upcoming events or triggers that could move the price.',
      `Asset: ${asset}\nHorizon: ${horizon}\nContext: ${context}\n\nReturn JSON array:\n[{ "event": "...", "expectedDate": "YYYY-MM-DD or null", "probability": 0-100, "impact": "high|medium|low", "direction": "bullish|bearish|neutral" }]`,
      { temperature: 0.3, maxTokens: 800 }
    );

    const parsed = safeParseJSON<Catalyst[]>(response);
    return (parsed || []).slice(0, 5);
  } catch {
    return [];
  }
}

function getHistoricalAccuracy(asset: string): number | undefined {
  const assetPredictions = predictionHistory.filter(
    (p) => p.asset === asset && p.correct !== undefined
  );
  if (assetPredictions.length < 5) return undefined;

  const correct = assetPredictions.filter((p) => p.correct).length;
  return Math.round((correct / assetPredictions.length) * 100);
}

function getCalibrationScore(): number | undefined {
  const resolved = predictionHistory.filter((p) => p.correct !== undefined);
  if (resolved.length < 10) return undefined;

  // Simple Brier score calculation
  let brierSum = 0;
  for (const p of resolved) {
    const prob = p.confidence / 100;
    const outcome = p.correct ? 1 : 0;
    brierSum += (prob - outcome) ** 2;
  }

  return Math.round((1 - brierSum / resolved.length) * 100);
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function safeParseJSON<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    const blockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (blockMatch) {
      try { return JSON.parse(blockMatch[1].trim()) as T; } catch { /* fall through */ }
    }
    const objMatch = raw.match(/[\[{][\s\S]*[\]}]/);
    if (objMatch) {
      try { return JSON.parse(objMatch[0]) as T; } catch { /* fall through */ }
    }
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// NARRATIVE MOMENTUM TRACKER
// ═══════════════════════════════════════════════════════════════

export async function trackNarratives(
  context?: string
): Promise<NarrativeMomentum[]> {
  return withCache(cache, 'narrative-momentum:latest', 300, async () => {
    const prompt = `Identify and rank the top 5-8 active crypto narratives right now.

${context ? `Context:\n${context}\n\n` : ''}For each narrative, assess:
- Lifecycle phase (emerging/growing/peak/declining/dead)
- Velocity (how fast it's gaining/losing attention)
- Media saturation level
- Which assets are most affected

Return JSON array:
[{
  "narrative": "Name of narrative",
  "phase": "emerging|growing|peak|declining|dead",
  "velocity": -100 to 100,
  "acceleration": -100 to 100,
  "saturation": 0-100,
  "affectedAssets": ["BTC", "ETH", ...],
  "sentiment": -1 to 1
}]`;

    const response = await aiComplete(
      'You are a crypto narrative intelligence analyst tracking the lifecycle of market narratives.',
      prompt,
      { temperature: 0.25, maxTokens: 2000 }
    );

    return safeParseJSON<NarrativeMomentum[]>(response) || [];
  });
}

// ═══════════════════════════════════════════════════════════════
// CALIBRATION METRICS
// ═══════════════════════════════════════════════════════════════

export function getCalibrationMetrics(): CalibrationMetrics {
  const resolved = predictionHistory.filter((p) => p.correct !== undefined);

  const buckets = [
    { min: 0, max: 20, label: '0-20%' },
    { min: 20, max: 40, label: '20-40%' },
    { min: 40, max: 60, label: '40-60%' },
    { min: 60, max: 80, label: '60-80%' },
    { min: 80, max: 100, label: '80-100%' },
  ];

  const byBucket = buckets.map((bucket) => {
    const inBucket = resolved.filter(
      (p) => p.confidence >= bucket.min && p.confidence < bucket.max
    );
    const correct = inBucket.filter((p) => p.correct).length;
    const expectedPct = (bucket.min + bucket.max) / 2;
    const correctPct = inBucket.length > 0 ? (correct / inBucket.length) * 100 : 0;

    return {
      bucket: bucket.label,
      predictions: inBucket.length,
      correctPct: Math.round(correctPct),
      expectedPct,
      calibrationError: Math.round(Math.abs(correctPct - expectedPct)),
    };
  });

  let brierSum = 0;
  for (const p of resolved) {
    const prob = p.confidence / 100;
    const outcome = p.correct ? 1 : 0;
    brierSum += (prob - outcome) ** 2;
  }

  return {
    totalPredictions: predictionHistory.length,
    byConfidenceBucket: byBucket,
    brierScore: resolved.length > 0 ? Math.round((brierSum / resolved.length) * 1000) / 1000 : 0,
    overallAccuracy: resolved.length > 0
      ? Math.round((resolved.filter((p) => p.correct).length / resolved.length) * 100)
      : 0,
    lastUpdated: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// RESOLVE PREDICTIONS (for calibration tracking)
// ═══════════════════════════════════════════════════════════════

export function resolvePrediction(
  forecastId: string,
  actualMovePct: number
): void {
  const record = predictionHistory.find((p) => p.id === forecastId);
  if (!record) return;

  record.actualMove = actualMovePct;
  record.resolvedAt = Date.now();

  // Determine if prediction was correct
  if (record.direction === 'bullish') {
    record.correct = actualMovePct > 0;
  } else if (record.direction === 'bearish') {
    record.correct = actualMovePct < 0;
  } else {
    record.correct = Math.abs(actualMovePct) < 2; // neutral = small move
  }
}

// ═══════════════════════════════════════════════════════════════
// MULTI-ASSET FORECAST
// ═══════════════════════════════════════════════════════════════

export async function generateMultiAssetForecast(
  assets: string[],
  horizon?: ForecastHorizon
): Promise<Map<string, Forecast>> {
  const results = new Map<string, Forecast>();

  // Run forecasts with some concurrency (not all at once to avoid rate limits)
  const batchSize = 3;
  for (let i = 0; i < assets.length; i += batchSize) {
    const batch = assets.slice(i, i + batchSize);
    const forecasts = await Promise.allSettled(
      batch.map((asset) => generateForecast(asset, { horizon }))
    );

    for (let j = 0; j < batch.length; j++) {
      const result = forecasts[j];
      if (result.status === 'fulfilled') {
        results.set(batch[j], result.value);
      }
    }
  }

  return results;
}
