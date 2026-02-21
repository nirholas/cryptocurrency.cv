/**
 * Tests for lib/source-credibility.ts
 * Focuses on pure/testable functions: calculateClickbaitScore, CLICKBAIT_PATTERNS
 */

import { describe, it, expect } from 'vitest';
import { calculateClickbaitScore } from '@/lib/source-credibility';

// ---------------------------------------------------------------------------
// calculateClickbaitScore
// ---------------------------------------------------------------------------

describe('calculateClickbaitScore', () => {
  it('returns 0 for a neutral factual headline', () => {
    const score = calculateClickbaitScore('Bitcoin price rises 3% following Fed meeting');
    expect(score).toBe(0);
  });

  it('returns higher score for clickbait patterns', () => {
    const neutral = calculateClickbaitScore('Bitcoin price update');
    const clickbait = calculateClickbaitScore('You won\'t believe what happened to Bitcoin');
    expect(clickbait).toBeGreaterThan(neutral);
  });

  it('detects "shocking"', () => {
    expect(calculateClickbaitScore('Shocking Bitcoin revelation changes everything')).toBeGreaterThan(0);
  });

  it('detects "breaking:"', () => {
    expect(calculateClickbaitScore('BREAKING: Major exchange hacked')).toBeGreaterThan(0);
  });

  it('detects number-based patterns (5 reasons)', () => {
    expect(calculateClickbaitScore('5 Reasons Bitcoin Will Moon in 2024')).toBeGreaterThan(0);
  });

  it('detects multiple question marks', () => {
    expect(calculateClickbaitScore('Is crypto dead??')).toBeGreaterThan(0);
  });

  it('detects multiple exclamation marks', () => {
    expect(calculateClickbaitScore('Bitcoin ATH incoming!!')).toBeGreaterThan(0);
  });

  it('detects "exposed" keyword', () => {
    expect(calculateClickbaitScore('Major exchange exposed for fraud')).toBeGreaterThan(0);
  });

  it('detects "revealed" keyword', () => {
    expect(calculateClickbaitScore('The truth about Bitcoin revealed')).toBeGreaterThan(0);
  });

  it('detects excessive all-caps words', () => {
    // More than 30% of words with >2 chars are all caps
    expect(calculateClickbaitScore('BITCOIN IS MASSIVE BUY NOW')).toBeGreaterThan(0);
  });

  it('returns a value between 0 and 1', () => {
    const titles = [
      'Bitcoin hits new all-time high amid market rally',
      'You won\'t believe this shocking secret revealed!!',
      'BREAKING: MASSIVE EXPLOSION IN CRYPTO MARKET NOW!!!',
      '10 reasons why Ethereum will moon — exposed secrets',
    ];
    for (const title of titles) {
      const score = calculateClickbaitScore(title);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });

  it('accumulates score for multiple matching patterns', () => {
    const singleMatch = calculateClickbaitScore('Shocking news');
    const multipleMatch = calculateClickbaitScore('Shocking secret exposed revealed!!');
    expect(multipleMatch).toBeGreaterThanOrEqual(singleMatch);
  });

  it('caps score at 1', () => {
    const extreme = calculateClickbaitScore(
      'SHOCKING BREAKING you won\'t believe this secret revealed exposed!!!! this is massive'
    );
    expect(extreme).toBeLessThanOrEqual(1);
  });
});
