/**
 * Tests for lib/alpha-signal-engine.ts
 * Covers pure helper functions: calculateAlphaScore, determineSignalType,
 * determineUrgency, generateShareableCard, getAccuracyTier, ALPHA_BADGES
 */

import { describe, it, expect } from 'vitest';
import {
  calculateAlphaScore,
  determineSignalType,
  determineUrgency,
  generateShareableCard,
  getAccuracyTier,
  ALPHA_BADGES,
  type AlphaSignal,
} from '@/lib/alpha-signal-engine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function freshNow(): Date {
  return new Date(); // publish time = just now
}

function oldTime(minutesAgo: number): Date {
  return new Date(Date.now() - minutesAgo * 60000);
}

// ---------------------------------------------------------------------------
// calculateAlphaScore
// ---------------------------------------------------------------------------

describe('calculateAlphaScore', () => {
  it('returns base 50 for a minimal article', () => {
    const score = calculateAlphaScore('Crypto update', '', 'unknownsource', oldTime(90));
    expect(score).toBeGreaterThanOrEqual(50);
  });

  it('returns a number between 0 and 100', () => {
    const scores = [
      calculateAlphaScore('hack exploit vulnerability', 'insider confirmed', 'bloomberg', freshNow()),
      calculateAlphaScore('daily update', '', 'randomsource', oldTime(200)),
      calculateAlphaScore('', '', '', freshNow()),
    ];
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });

  it('scores higher for critical keywords (hack, exploit)', () => {
    const bland = calculateAlphaScore('Weekly update', '', 'randomsource', oldTime(90));
    const critical = calculateAlphaScore('Exchange hack exploit vulnerability', '', 'randomsource', oldTime(90));
    expect(critical).toBeGreaterThan(bland);
  });

  it('scores higher for high-priority keywords (etf, institutional)', () => {
    const bland = calculateAlphaScore('Price update', '', 'randomsource', oldTime(90));
    const high = calculateAlphaScore('Bitcoin ETF institutional adoption launch', '', 'randomsource', oldTime(90));
    expect(high).toBeGreaterThan(bland);
  });

  it('gives bonus for premium sources (bloomberg)', () => {
    const regular = calculateAlphaScore('Bitcoin news', '', 'cryptoblog', oldTime(90));
    const premium = calculateAlphaScore('Bitcoin news', '', 'bloomberg', oldTime(90));
    expect(premium).toBeGreaterThan(regular);
  });

  it('gives freshness bonus for very recent articles (< 5 min)', () => {
    const fresh = calculateAlphaScore('Bitcoin update', '', 'source', freshNow());
    const old = calculateAlphaScore('Bitcoin update', '', 'source', oldTime(90));
    expect(fresh).toBeGreaterThan(old);
  });

  it('freshness bonus decreases with age', () => {
    const fresh5 = calculateAlphaScore('update', '', 'src', oldTime(3));
    const fresh30 = calculateAlphaScore('update', '', 'src', oldTime(20));
    const old = calculateAlphaScore('update', '', 'src', oldTime(70));
    expect(fresh5).toBeGreaterThanOrEqual(fresh30);
    expect(fresh30).toBeGreaterThanOrEqual(old);
  });
});

// ---------------------------------------------------------------------------
// determineSignalType
// ---------------------------------------------------------------------------

describe('determineSignalType', () => {
  it('returns "volatility" when volatilityIndicators > 70', () => {
    expect(determineSignalType(50, 80)).toBe('volatility');
  });

  it('returns "bullish" when sentiment > 60 and volatility <= 70', () => {
    expect(determineSignalType(70, 10)).toBe('bullish');
  });

  it('returns "bearish" when sentiment < 40 and volatility <= 70', () => {
    expect(determineSignalType(30, 20)).toBe('bearish');
  });

  it('returns "neutral" for middle-range values', () => {
    expect(determineSignalType(50, 20)).toBe('neutral');
  });

  it('volatility takes priority over bullish sentiment', () => {
    expect(determineSignalType(90, 75)).toBe('volatility');
  });
});

// ---------------------------------------------------------------------------
// determineUrgency
// ---------------------------------------------------------------------------

describe('determineUrgency', () => {
  it('returns "critical" when combined >= 85', () => {
    expect(determineUrgency(90, 80)).toBe('critical');
    expect(determineUrgency(85, 85)).toBe('critical');
  });

  it('returns "high" when combined 70-84', () => {
    expect(determineUrgency(75, 65)).toBe('high');
  });

  it('returns "medium" when combined 50-69', () => {
    expect(determineUrgency(60, 50)).toBe('medium');
  });

  it('returns "low" when combined < 50', () => {
    expect(determineUrgency(30, 40)).toBe('low');
  });

  it('uses the average of alphaScore and signalStrength', () => {
    // (80 + 90) / 2 = 85 → critical
    expect(determineUrgency(80, 90)).toBe('critical');
    // (40 + 100) / 2 = 70 → high
    expect(determineUrgency(40, 100)).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// generateShareableCard
// ---------------------------------------------------------------------------

const mockSignal: AlphaSignal = {
  id: 'sig-001',
  timestamp: new Date(),
  articleId: 'art-001',
  articleTitle: 'BTC breaks ATH',
  articleUrl: 'https://example.com/btc-ath',
  source: 'bloomberg',
  signalType: 'bullish',
  signalStrength: 85,
  confidence: 90,
  urgency: 'high',
  primaryAsset: 'BTC',
  relatedAssets: ['ETH'],
  alphaScore: 88,
  narrativeShift: 'Bitcoin momentum accelerating',
  keyInsight: 'ETF inflows hitting records',
  actionableIntel: 'Consider accumulation at support',
  expectedImpactWindow: '1-4 hours',
  detectedAt: new Date(),
  shareCount: 0,
  viewCount: 0,
  savedCount: 0,
};

describe('generateShareableCard', () => {
  it('returns a non-empty string', () => {
    const card = generateShareableCard(mockSignal);
    expect(typeof card).toBe('string');
    expect(card.length).toBeGreaterThan(0);
  });

  it('includes a 🚀 emoji for bullish signals', () => {
    const card = generateShareableCard(mockSignal);
    expect(card).toContain('🚀');
  });

  it('includes a 🔻 emoji for bearish signals', () => {
    const bearishSignal = { ...mockSignal, signalType: 'bearish' as const };
    expect(generateShareableCard(bearishSignal)).toContain('🔻');
  });

  it('includes a ⚡ emoji for volatility signals', () => {
    const volSignal = { ...mockSignal, signalType: 'volatility' as const };
    expect(generateShareableCard(volSignal)).toContain('⚡');
  });

  it('includes the primary asset ticker', () => {
    const card = generateShareableCard(mockSignal);
    expect(card).toContain('BTC');
  });

  it('includes the signal type', () => {
    const card = generateShareableCard(mockSignal);
    expect(card.toUpperCase()).toContain('BULLISH');
  });

  it('includes the alpha score', () => {
    const card = generateShareableCard(mockSignal);
    expect(card).toContain('88');
  });

  it('includes the key insight', () => {
    const card = generateShareableCard(mockSignal);
    expect(card).toContain('ETF inflows hitting records');
  });

  it('includes the impact window', () => {
    const card = generateShareableCard(mockSignal);
    expect(card).toContain('1-4 hours');
  });
});

// ---------------------------------------------------------------------------
// getAccuracyTier
// ---------------------------------------------------------------------------

describe('getAccuracyTier', () => {
  it('returns Elite for accuracy >= 90', () => {
    expect(getAccuracyTier(90).tier).toBe('Elite');
    expect(getAccuracyTier(100).tier).toBe('Elite');
  });

  it('returns Expert for accuracy 80-89', () => {
    expect(getAccuracyTier(80).tier).toBe('Expert');
    expect(getAccuracyTier(89).tier).toBe('Expert');
  });

  it('returns Advanced for accuracy 70-79', () => {
    expect(getAccuracyTier(70).tier).toBe('Advanced');
    expect(getAccuracyTier(79).tier).toBe('Advanced');
  });

  it('returns Intermediate for accuracy 60-69', () => {
    expect(getAccuracyTier(60).tier).toBe('Intermediate');
    expect(getAccuracyTier(69).tier).toBe('Intermediate');
  });

  it('returns Beginner for accuracy below 60', () => {
    expect(getAccuracyTier(59).tier).toBe('Beginner');
    expect(getAccuracyTier(0).tier).toBe('Beginner');
  });

  it('includes color and description for all tiers', () => {
    for (const accuracy of [95, 85, 75, 65, 50]) {
      const { tier, color, description } = getAccuracyTier(accuracy);
      expect(tier).toBeTruthy();
      expect(color).toBeTruthy();
      expect(description).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// ALPHA_BADGES
// ---------------------------------------------------------------------------

describe('ALPHA_BADGES', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(ALPHA_BADGES)).toBe(true);
    expect(ALPHA_BADGES.length).toBeGreaterThan(0);
  });

  it('every badge has required fields', () => {
    for (const badge of ALPHA_BADGES) {
      expect(badge.id).toBeTruthy();
      expect(badge.name).toBeTruthy();
      expect(badge.icon).toBeTruthy();
      expect(badge.description).toBeTruthy();
      expect(['common', 'rare', 'epic', 'legendary']).toContain(badge.rarity);
    }
  });

  it('all badge IDs are unique', () => {
    const ids = ALPHA_BADGES.map(b => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes legendary badges', () => {
    expect(ALPHA_BADGES.some(b => b.rarity === 'legendary')).toBe(true);
  });

  it('includes the "oracle" badge', () => {
    expect(ALPHA_BADGES.some(b => b.id === 'oracle')).toBe(true);
  });
});
