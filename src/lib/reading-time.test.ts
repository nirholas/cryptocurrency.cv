/**
 * Tests for lib/reading-time.ts
 */

import { describe, it, expect } from 'vitest';
import {
  calculateReadingTime,
  estimateReadingTime,
  getReadingTimeBadgeColor,
} from '@/lib/reading-time';

const WORDS_PER_MINUTE = 200;

// ---------------------------------------------------------------------------
// calculateReadingTime
// ---------------------------------------------------------------------------

describe('calculateReadingTime', () => {
  it('returns minimum 1 minute for very short text', () => {
    const result = calculateReadingTime('Hello world');
    expect(result.minutes).toBe(1);
    expect(result.text).toBe('1 min read');
  });

  it('calculates correct word count', () => {
    const words = Array(400).fill('word').join(' ');
    const result = calculateReadingTime(words);
    expect(result.words).toBe(400);
    expect(result.minutes).toBe(2);
    expect(result.text).toBe('2 min read');
  });

  it('rounds up to next minute', () => {
    // 201 words → ceil(201/200) = 2 minutes
    const words = Array(201).fill('word').join(' ');
    expect(calculateReadingTime(words).minutes).toBe(2);
  });

  it('strips HTML tags before counting', () => {
    const html = '<p>Hello <strong>world</strong></p>';
    const result = calculateReadingTime(html);
    expect(result.words).toBe(2);
    expect(result.minutes).toBe(1);
  });

  it('uses singular "1 min read" for exactly 1 minute', () => {
    expect(calculateReadingTime('word').text).toBe('1 min read');
  });

  it('uses plural for multi-minute reads', () => {
    const words = Array(400).fill('word').join(' ');
    expect(calculateReadingTime(words).text).toBe('2 min read');
  });

  it('handles empty string', () => {
    const result = calculateReadingTime('');
    expect(result.minutes).toBe(1);
    expect(result.words).toBe(0);
  });

  it('handles whitespace-only string', () => {
    const result = calculateReadingTime('   \n\t  ');
    expect(result.minutes).toBe(1);
  });

  it('handles long article correctly', () => {
    const words = Array(1000).fill('word').join(' ');
    const result = calculateReadingTime(words);
    expect(result.minutes).toBe(5);
    expect(result.text).toBe('5 min read');
  });
});

// ---------------------------------------------------------------------------
// estimateReadingTime
// ---------------------------------------------------------------------------

describe('estimateReadingTime', () => {
  it('returns at least 2 minutes', () => {
    const result = estimateReadingTime('BTC');
    expect(result.minutes).toBeGreaterThanOrEqual(2);
  });

  it('prefixes text with ~', () => {
    const result = estimateReadingTime('Some headline');
    expect(result.text).toMatch(/^~\d+ min read$/);
  });

  it('includes description words in estimate', () => {
    const withDesc = estimateReadingTime('Title', 'A longer description with many words here');
    const withoutDesc = estimateReadingTime('Title');
    expect(withDesc.minutes).toBeGreaterThanOrEqual(withoutDesc.minutes);
  });

  it('returns estimated word count', () => {
    const result = estimateReadingTime('Bitcoin reaches new', 'all time high today');
    expect(result.words).toBeGreaterThan(0);
  });

  it('minimum estimated words is 300', () => {
    const result = estimateReadingTime('short');
    expect(result.words).toBeGreaterThanOrEqual(300);
  });
});

// ---------------------------------------------------------------------------
// getReadingTimeBadgeColor
// ---------------------------------------------------------------------------

describe('getReadingTimeBadgeColor', () => {
  it('returns green for 1 minute', () => {
    expect(getReadingTimeBadgeColor(1)).toContain('green');
  });

  it('returns green for 2 minutes', () => {
    expect(getReadingTimeBadgeColor(2)).toContain('green');
  });

  it('returns blue for 3–5 minutes', () => {
    expect(getReadingTimeBadgeColor(3)).toContain('blue');
    expect(getReadingTimeBadgeColor(5)).toContain('blue');
  });

  it('returns amber for 6–10 minutes', () => {
    expect(getReadingTimeBadgeColor(6)).toContain('amber');
    expect(getReadingTimeBadgeColor(10)).toContain('amber');
  });

  it('returns red for 11+ minutes', () => {
    expect(getReadingTimeBadgeColor(11)).toContain('red');
    expect(getReadingTimeBadgeColor(60)).toContain('red');
  });

  it('returns a non-empty string for every boundary value', () => {
    [1, 2, 3, 5, 6, 10, 11].forEach(min => {
      expect(getReadingTimeBadgeColor(min).trim().length).toBeGreaterThan(0);
    });
  });
});
