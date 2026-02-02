/**
 * Narrative Lifecycle Tracker
 * 
 * Tracks crypto narratives through their lifecycle:
 * - Emergence: First mentions, early signals
 * - Growth: Increasing coverage, building momentum
 * - Peak: Maximum coverage, mainstream attention
 * - Decline: Fading interest, moving to next narrative
 * 
 * Uses historical patterns to predict narrative trajectory.
 */

import { promptGroqJsonCached, isGroqConfigured } from './groq';

export interface NarrativeSnapshot {
  name: string;
  mentionCount: number;
  timestamp: string;
  sentiment: number; // -1 to 1
  sources: string[];
}

export interface Narrative {
  id: string;
  name: string;
  aliases: string[];
  description: string;
  lifecycle: 'emerging' | 'growing' | 'peak' | 'declining' | 'dormant';
  strength: number; // 0-100
  velocity: number; // Rate of change, can be negative
  sentiment: number; // -1 to 1
  firstSeen: string;
  lastSeen: string;
  peakDate?: string;
  peakStrength?: number;
  relatedCoins: string[];
  keyEvents: Array<{
    date: string;
    event: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  prediction?: {
    nextPhase: string;
    confidence: number;
    timeframe: string;
    reasoning: string;
  };
}

export interface NarrativeAnalysis {
  activeNarratives: Narrative[];
  emergingNarratives: Narrative[];
  decliningNarratives: Narrative[];
  historicalPatterns: Array<{
    pattern: string;
    currentMatch: string;
    confidence: number;
  }>;
  marketContext: string;
  generatedAt: string;
}

// Known narrative patterns with typical durations
const NARRATIVE_PATTERNS = [
  { name: 'ETF Speculation', typicalDuration: '2-6 months', phases: ['rumor', 'filing', 'review', 'decision'] },
  { name: 'Halving Cycle', typicalDuration: '12-18 months', phases: ['anticipation', 'event', 'post-halving rally', 'consolidation'] },
  { name: 'Layer 2 Season', typicalDuration: '3-6 months', phases: ['tech breakthrough', 'adoption', 'token launches', 'normalization'] },
  { name: 'DeFi Summer', typicalDuration: '2-4 months', phases: ['innovation', 'yield farming', 'forks', 'consolidation'] },
  { name: 'NFT Mania', typicalDuration: '1-3 months', phases: ['cultural moment', 'celebrity adoption', 'mainstream', 'fatigue'] },
  { name: 'Memecoin Season', typicalDuration: '2-8 weeks', phases: ['origin meme', 'viral spread', 'peak fomo', 'crash'] },
  { name: 'Regulatory FUD', typicalDuration: '1-4 weeks', phases: ['announcement', 'panic', 'analysis', 'resolution'] },
  { name: 'Exchange Crisis', typicalDuration: '1-2 weeks', phases: ['rumors', 'confirmation', 'contagion fear', 'stabilization'] },
];

/**
 * Calculate narrative lifecycle phase from historical data
 */
export function calculateLifecyclePhase(
  snapshots: NarrativeSnapshot[],
  currentMentions: number
): { phase: Narrative['lifecycle']; velocity: number; strength: number } {
  if (snapshots.length < 2) {
    return { phase: 'emerging', velocity: 0, strength: Math.min(currentMentions * 10, 100) };
  }

  // Sort by timestamp
  const sorted = [...snapshots].sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Calculate velocity (rate of change)
  const recent = sorted.slice(-3);
  const older = sorted.slice(-6, -3);
  
  const recentAvg = recent.reduce((sum, s) => sum + s.mentionCount, 0) / recent.length;
  const olderAvg = older.length > 0 
    ? older.reduce((sum, s) => sum + s.mentionCount, 0) / older.length 
    : recentAvg / 2;
  
  const velocity = (recentAvg - olderAvg) / Math.max(olderAvg, 1);
  
  // Find peak
  const peak = Math.max(...sorted.map(s => s.mentionCount));
  const strength = Math.min((currentMentions / Math.max(peak, 1)) * 100, 100);

  // Determine phase
  let phase: Narrative['lifecycle'];
  if (sorted.length < 5 && velocity > 0.2) {
    phase = 'emerging';
  } else if (velocity > 0.3) {
    phase = 'growing';
  } else if (velocity > -0.1 && velocity <= 0.3 && strength > 70) {
    phase = 'peak';
  } else if (velocity < -0.2) {
    phase = 'declining';
  } else if (strength < 20) {
    phase = 'dormant';
  } else {
    phase = currentMentions > peak * 0.7 ? 'peak' : 'growing';
  }

  return { phase, velocity, strength };
}

/**
 * Detect emerging narratives from recent news
 */
export async function detectNarratives(
  recentHeadlines: string[],
  historicalNarratives?: Narrative[]
): Promise<NarrativeAnalysis> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const knownNarratives = historicalNarratives?.map(n => n.name).join(', ') || 'None tracked';

  const systemPrompt = `You are a crypto market narrative analyst. Identify and track market narratives from news headlines.

A narrative is a unifying theme or story that drives market attention and capital flows.
Examples: "Bitcoin ETF approval", "Ethereum scaling", "AI + Crypto convergence", "RWA tokenization"

For each narrative, assess:
1. Lifecycle phase: emerging (new), growing (gaining traction), peak (maximum attention), declining (fading)
2. Strength: 0-100 based on coverage intensity
3. Velocity: positive = growing, negative = declining
4. Sentiment: -1 (bearish) to 1 (bullish)

Return JSON:
{
  "activeNarratives": [
    {
      "id": "unique-slug",
      "name": "Narrative Name",
      "aliases": ["alt name 1", "alt name 2"],
      "description": "one sentence description",
      "lifecycle": "emerging|growing|peak|declining|dormant",
      "strength": 0-100,
      "velocity": -1.0 to 1.0,
      "sentiment": -1.0 to 1.0,
      "relatedCoins": ["BTC", "ETH"],
      "keyEvents": [{"date": "recent", "event": "description", "impact": "positive|negative|neutral"}],
      "prediction": {
        "nextPhase": "what happens next",
        "confidence": 0.0-1.0,
        "timeframe": "days/weeks/months",
        "reasoning": "why"
      }
    }
  ],
  "emergingNarratives": [...],
  "decliningNarratives": [...],
  "historicalPatterns": [
    {"pattern": "pattern name", "currentMatch": "current narrative", "confidence": 0.0-1.0}
  ],
  "marketContext": "overall narrative landscape summary"
}`;

  const result = await promptGroqJsonCached<Omit<NarrativeAnalysis, 'generatedAt'>>(
    'narratives',
    systemPrompt,
    `Known narratives being tracked: ${knownNarratives}

Recent headlines (last 24h):
${recentHeadlines.slice(0, 50).map((h, i) => `${i + 1}. ${h}`).join('\n')}

Identify active, emerging, and declining narratives.`,
    { maxTokens: 2500, temperature: 0.4 }
  );

  // Add timestamps
  const now = new Date().toISOString();
  const addTimestamps = (narratives: Narrative[]) => narratives.map(n => ({
    ...n,
    firstSeen: n.firstSeen || now,
    lastSeen: now,
  }));

  return {
    activeNarratives: addTimestamps(result.activeNarratives || []),
    emergingNarratives: addTimestamps(result.emergingNarratives || []),
    decliningNarratives: addTimestamps(result.decliningNarratives || []),
    historicalPatterns: result.historicalPatterns || [],
    marketContext: result.marketContext || '',
    generatedAt: now,
  };
}

/**
 * Predict narrative trajectory based on historical patterns
 */
export async function predictNarrativeTrajectory(
  narrative: Narrative,
  currentHeadlines: string[]
): Promise<{
  prediction: string;
  confidence: number;
  timeToNextPhase: string;
  priceImplication: string;
  historicalComparison: string;
}> {
  if (!isGroqConfigured()) {
    throw new Error('AI features require GROQ_API_KEY');
  }

  const matchingPatterns = NARRATIVE_PATTERNS.filter(p => 
    narrative.name.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
  );

  const systemPrompt = `You are a crypto market strategist predicting narrative trajectories.

Given a narrative's current state and historical patterns, predict its future.

Return JSON:
{
  "prediction": "detailed prediction of what happens next",
  "confidence": 0.0-1.0,
  "timeToNextPhase": "estimated time (e.g., '2-3 weeks')",
  "priceImplication": "expected price impact on related coins",
  "historicalComparison": "similar historical narrative and outcome"
}`;

  return promptGroqJsonCached(
    'narrative-prediction',
    systemPrompt,
    `Narrative: ${narrative.name}
Current phase: ${narrative.lifecycle}
Strength: ${narrative.strength}/100
Velocity: ${narrative.velocity > 0 ? '+' : ''}${(narrative.velocity * 100).toFixed(0)}%
Sentiment: ${narrative.sentiment > 0 ? 'Bullish' : narrative.sentiment < 0 ? 'Bearish' : 'Neutral'}
Related coins: ${narrative.relatedCoins.join(', ')}

Similar historical patterns: ${matchingPatterns.map(p => `${p.name} (typical duration: ${p.typicalDuration})`).join(', ') || 'None identified'}

Recent headlines about this narrative:
${currentHeadlines.slice(0, 10).join('\n')}

Predict the trajectory of this narrative.`,
    { maxTokens: 800, temperature: 0.5 }
  );
}

/**
 * Compare current narrative landscape to historical periods
 */
export function identifyMarketCycle(narratives: Narrative[]): {
  cyclePhase: 'accumulation' | 'markup' | 'distribution' | 'markdown';
  confidence: number;
  dominantNarratives: string[];
  historicalAnalog: string;
} {
  const bullishNarratives = narratives.filter(n => n.sentiment > 0.3);
  const bearishNarratives = narratives.filter(n => n.sentiment < -0.3);
  const growingNarratives = narratives.filter(n => n.velocity > 0.2);
  const decliningNarratives = narratives.filter(n => n.velocity < -0.2);

  const bullRatio = bullishNarratives.length / Math.max(narratives.length, 1);
  const growthRatio = growingNarratives.length / Math.max(narratives.length, 1);

  let cyclePhase: 'accumulation' | 'markup' | 'distribution' | 'markdown';
  let confidence: number;
  let historicalAnalog: string;

  if (growthRatio > 0.6 && bullRatio > 0.5) {
    cyclePhase = 'markup';
    confidence = 0.7;
    historicalAnalog = 'Similar to Q4 2020 - Early 2021 bull run';
  } else if (growthRatio < 0.3 && bullRatio > 0.4) {
    cyclePhase = 'distribution';
    confidence = 0.6;
    historicalAnalog = 'Similar to April-November 2021 distribution';
  } else if (decliningNarratives.length > growingNarratives.length && bullRatio < 0.3) {
    cyclePhase = 'markdown';
    confidence = 0.65;
    historicalAnalog = 'Similar to 2022 bear market';
  } else {
    cyclePhase = 'accumulation';
    confidence = 0.55;
    historicalAnalog = 'Similar to late 2022 - early 2023 accumulation';
  }

  return {
    cyclePhase,
    confidence,
    dominantNarratives: narratives
      .sort((a, b) => b.strength - a.strength)
      .slice(0, 5)
      .map(n => n.name),
    historicalAnalog,
  };
}
