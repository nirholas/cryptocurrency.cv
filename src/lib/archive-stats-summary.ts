/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

import type { ArchiveV2Stats } from '@/lib/archive-v2';

export interface ArchiveStatsSummary {
  totalArticles: number;
  dateRange: { earliest: string; latest: string } | null;
  byYear: Record<string, number>;
  bySource: Record<string, number>;
  byCategory: Record<string, number>;
}

const MONTH_KEY = /^(\d{4})-\d{2}$/;
const DAY_KEY = /^(\d{4})-\d{2}-\d{2}$/;
/** Bucket the archive uses for articles it could not attribute */
const UNKNOWN_SOURCE = 'unknown';

function toDay(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

/**
 * Sums dated buckets into calendar years. Buckets whose key is not a date
 * (the archive keeps "unknown-date-part1" style keys for undated articles)
 * have no year and are left out.
 */
function countByYear(counts: Record<string, number> | undefined, pattern: RegExp) {
  const byYear: Record<string, number> = {};
  for (const [key, count] of Object.entries(counts ?? {})) {
    const year = pattern.exec(key)?.[1];
    if (year && Number.isFinite(count)) byYear[year] = (byYear[year] ?? 0) + count;
  }
  return byYear;
}

/**
 * Reduces the `/api/archive?stats=true` payload to what the archive page
 * shows. The payload is either the archive's `meta/stats.json` (monthly
 * counts, article dates, categories) or the Postgres summary (daily counts,
 * fetch dates), so every field is read from whichever form is present.
 */
export function summarizeArchiveStats(stats: ArchiveV2Stats): ArchiveStatsSummary {
  const earliest = toDay(stats.first_article_date ?? stats.first_fetch);
  const latest = toDay(stats.last_article_date ?? stats.last_fetch);
  const byMonth = countByYear(stats.monthly_counts, MONTH_KEY);

  const bySource = { ...stats.sources };
  delete bySource[UNKNOWN_SOURCE];

  return {
    totalArticles: stats.total_articles ?? 0,
    dateRange: earliest && latest ? { earliest, latest } : null,
    byYear: Object.keys(byMonth).length > 0 ? byMonth : countByYear(stats.daily_counts, DAY_KEY),
    bySource,
    byCategory: { ...stats.categories },
  };
}
