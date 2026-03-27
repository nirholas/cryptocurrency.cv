/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import { describe, it, expect } from 'vitest';
import { formatCurrency, formatPercent, formatLargeNumber } from '@/lib/format';

describe('formatCurrency', () => {
  it('should format a standard price', () => {
    const result = formatCurrency(65432.1);
    expect(result).toContain('65,432');
    expect(result).toContain('$');
  });

  it('should use compact notation with prefix', () => {
    const result = formatCurrency(1_200_000_000_000, { compact: true });
    expect(result).toContain('$');
    expect(result).toContain('T');
  });

  it('should show more decimals for small prices', () => {
    const result = formatCurrency(0.00042);
    expect(result).toContain('0.0004');
  });

  it('should respect custom fraction digits', () => {
    const result = formatCurrency(100.123, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
    expect(result).toContain('100.1');
  });

  it('should handle zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('$');
    expect(result).toContain('0');
  });

  it('should handle negative values', () => {
    const result = formatCurrency(-100);
    expect(result).toContain('-');
  });

  it('should accept different currency codes', () => {
    const result = formatCurrency(100, { currency: 'EUR' });
    expect(result).toContain('€');
  });
});

describe('formatPercent', () => {
  it('should format positive percent with + sign', () => {
    const result = formatPercent(2.45);
    expect(result.text).toBe('+2.45%');
    expect(result.className).toContain('green');
  });

  it('should format negative percent', () => {
    const result = formatPercent(-3.21);
    expect(result.text).toBe('-3.21%');
    expect(result.className).toContain('red');
  });

  it('should format zero percent', () => {
    const result = formatPercent(0);
    expect(result.text).toBe('0.00%');
    expect(result.className).toContain('text-');
  });

  it('should handle null', () => {
    const result = formatPercent(null);
    expect(result.text).toBe('—');
  });

  it('should handle undefined', () => {
    const result = formatPercent(undefined);
    expect(result.text).toBe('—');
  });

  it('should handle NaN', () => {
    const result = formatPercent(NaN);
    expect(result.text).toBe('—');
  });

  it('should format to 2 decimal places', () => {
    const result = formatPercent(1.999);
    expect(result.text).toBe('+2.00%');
  });
});

describe('formatLargeNumber', () => {
  it('should format trillions', () => {
    expect(formatLargeNumber(1_200_000_000_000)).toBe('1.20T');
  });

  it('should format billions', () => {
    expect(formatLargeNumber(45_600_000_000)).toBe('45.60B');
  });

  it('should format millions', () => {
    expect(formatLargeNumber(123_400_000)).toBe('123.40M');
  });

  it('should format thousands', () => {
    expect(formatLargeNumber(56_700)).toBe('56.70K');
  });

  it('should format small numbers without suffix', () => {
    expect(formatLargeNumber(999)).toBe('999.00');
  });

  it('should handle negative numbers', () => {
    expect(formatLargeNumber(-1_500_000)).toBe('-1.50M');
  });

  it('should handle null', () => {
    expect(formatLargeNumber(null)).toBe('—');
  });

  it('should handle undefined', () => {
    expect(formatLargeNumber(undefined)).toBe('—');
  });

  it('should handle NaN', () => {
    expect(formatLargeNumber(NaN)).toBe('—');
  });

  it('should support prefix option', () => {
    expect(formatLargeNumber(1_000_000, { prefix: '$' })).toBe('$1.00M');
  });

  it('should support custom decimals', () => {
    expect(formatLargeNumber(1_234_567, { decimals: 1 })).toBe('1.2M');
  });

  it('should handle zero', () => {
    expect(formatLargeNumber(0)).toBe('0.00');
  });
});
