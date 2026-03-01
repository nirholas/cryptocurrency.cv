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
 * Number & currency formatting utilities for the markets dashboard.
 */

interface FormatCurrencyOptions {
  /** Currency code (default: "USD") */
  currency?: string;
  /** Use compact notation for large numbers (default: false) */
  compact?: boolean;
  /** Minimum fraction digits */
  minimumFractionDigits?: number;
  /** Maximum fraction digits */
  maximumFractionDigits?: number;
}

/**
 * Format a number as currency.
 *
 * @example
 * formatCurrency(65432.10)       // "$65,432.10"
 * formatCurrency(1_200_000_000_000, { compact: true }) // "$1.2T"
 * formatCurrency(0.00042, { maximumFractionDigits: 6 }) // "$0.000420"
 */
export function formatCurrency(
  value: number,
  options: FormatCurrencyOptions = {},
): string {
  const {
    currency = 'USD',
    compact = false,
    minimumFractionDigits,
    maximumFractionDigits,
  } = options;

  if (compact) {
    return formatLargeNumber(value, { prefix: '$' });
  }

  // Small prices (< $1) need more decimals
  const defaultMax = value < 1 ? 6 : value < 100 ? 4 : 2;
  const defaultMin = value < 1 ? 4 : 2;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: minimumFractionDigits ?? defaultMin,
    maximumFractionDigits: maximumFractionDigits ?? defaultMax,
  }).format(value);
}

/**
 * Format a percentage with a + sign for positive values
 * and return the appropriate CSS color class.
 *
 * @returns `{ text: "+2.45%", className: "text-green-500" }`
 */
export function formatPercent(value: number | null | undefined): {
  text: string;
  className: string;
} {
  if (value == null || Number.isNaN(value)) {
    return { text: '—', className: 'text-[var(--color-text-secondary)]' };
  }

  const sign = value > 0 ? '+' : '';
  const text = `${sign}${value.toFixed(2)}%`;
  const className =
    value > 0
      ? 'text-green-500 dark:text-green-400'
      : value < 0
        ? 'text-red-500 dark:text-red-400'
        : 'text-[var(--color-text-secondary)]';

  return { text, className };
}

interface FormatLargeNumberOptions {
  /** String to prepend (e.g. "$") */
  prefix?: string;
  /** Decimal places (default: 2) */
  decimals?: number;
}

/**
 * Format large numbers into human-readable shorthand.
 *
 * @example
 * formatLargeNumber(1_200_000_000_000) // "1.20T"
 * formatLargeNumber(45_600_000_000)    // "45.60B"
 * formatLargeNumber(123_400_000)       // "123.40M"
 * formatLargeNumber(56_700)            // "56.70K"
 * formatLargeNumber(999)              // "999.00"
 */
export function formatLargeNumber(
  value: number | null | undefined,
  options: FormatLargeNumberOptions = {},
): string {
  if (value == null || Number.isNaN(value)) return '—';

  const { prefix = '', decimals = 2 } = options;
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (abs >= 1e12) return `${sign}${prefix}${(abs / 1e12).toFixed(decimals)}T`;
  if (abs >= 1e9) return `${sign}${prefix}${(abs / 1e9).toFixed(decimals)}B`;
  if (abs >= 1e6) return `${sign}${prefix}${(abs / 1e6).toFixed(decimals)}M`;
  if (abs >= 1e3) return `${sign}${prefix}${(abs / 1e3).toFixed(decimals)}K`;

  return `${sign}${prefix}${abs.toFixed(decimals)}`;
}
