/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect } from 'vitest';
import {
  calculateReadingTime,
  estimateReadingTime,
  getReadingTimeBadgeColor,
} from '@/lib/reading-time';

describe('calculateReadingTime', () => {
  it('should return 1 min for very short text', () => {
    const result = calculateReadingTime('Hello world');
    expect(result.minutes).toBe(1);
    expect(result.text).toBe('1 min read');
    expect(result.words).toBe(2);
  });

  it('should calculate correctly for 200 words', () => {
    const text = Array(200).fill('word').join(' ');
    const result = calculateReadingTime(text);
    expect(result.minutes).toBe(1);
    expect(result.words).toBe(200);
  });

  it('should calculate correctly for 400 words', () => {
    const text = Array(400).fill('word').join(' ');
    const result = calculateReadingTime(text);
    expect(result.minutes).toBe(2);
    expect(result.words).toBe(400);
  });

  it('should calculate correctly for 1000 words', () => {
    const text = Array(1000).fill('word').join(' ');
    const result = calculateReadingTime(text);
    expect(result.minutes).toBe(5);
    expect(result.text).toBe('5 min read');
  });

  it('should strip HTML tags before counting', () => {
    const text = '<p>Hello</p> <strong>world</strong> <a href="#">link</a>';
    const result = calculateReadingTime(text);
    expect(result.words).toBe(3);
  });

  it('should handle empty string', () => {
    const result = calculateReadingTime('');
    expect(result.minutes).toBe(1);
  });

  it('should handle text with extra whitespace', () => {
    const result = calculateReadingTime('  hello   world  \n test  ');
    expect(result.words).toBe(3);
  });

  it('should return minimum of 1 minute', () => {
    const result = calculateReadingTime('short');
    expect(result.minutes).toBeGreaterThanOrEqual(1);
  });

  it('should format text as "X min read"', () => {
    const text = Array(600).fill('word').join(' ');
    const result = calculateReadingTime(text);
    expect(result.text).toBe('3 min read');
  });
});

describe('estimateReadingTime', () => {
  it('should estimate from title only', () => {
    const result = estimateReadingTime('Bitcoin hits new all-time high');
    expect(result.minutes).toBeGreaterThanOrEqual(2);
    expect(result.text).toContain('~');
    expect(result.text).toContain('min read');
  });

  it('should estimate from title and description', () => {
    const result = estimateReadingTime(
      'Bitcoin hits new all-time high',
      'Bitcoin surged past $100,000 for the first time in history',
    );
    expect(result.minutes).toBeGreaterThanOrEqual(2);
    expect(result.words).toBeGreaterThan(0);
  });

  it('should estimate at least 300 words', () => {
    const result = estimateReadingTime('Short');
    expect(result.words).toBeGreaterThanOrEqual(300);
  });

  it('should return minimum of 2 minutes', () => {
    const result = estimateReadingTime('Short title');
    expect(result.minutes).toBeGreaterThanOrEqual(2);
  });

  it('should format text with ~ prefix', () => {
    const result = estimateReadingTime('Some long title with many words');
    expect(result.text).toMatch(/^~\d+ min read$/);
  });
});

describe('getReadingTimeBadgeColor', () => {
  it('should return green for 1-2 minutes', () => {
    expect(getReadingTimeBadgeColor(1)).toContain('green');
    expect(getReadingTimeBadgeColor(2)).toContain('green');
  });

  it('should return blue for 3-5 minutes', () => {
    expect(getReadingTimeBadgeColor(3)).toContain('blue');
    expect(getReadingTimeBadgeColor(5)).toContain('blue');
  });

  it('should return amber for 6-10 minutes', () => {
    expect(getReadingTimeBadgeColor(6)).toContain('amber');
    expect(getReadingTimeBadgeColor(10)).toContain('amber');
  });

  it('should return red for 11+ minutes', () => {
    expect(getReadingTimeBadgeColor(11)).toContain('red');
    expect(getReadingTimeBadgeColor(30)).toContain('red');
  });
});
