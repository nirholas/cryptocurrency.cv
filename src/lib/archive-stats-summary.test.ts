import { describe, expect, it } from 'vitest';
import type { ArchiveV2Stats } from '@/lib/archive-v2';
import { summarizeArchiveStats } from '@/lib/archive-stats-summary';

describe('summarizeArchiveStats', () => {
  it('reads the archive stats.json shape', () => {
    const stats: ArchiveV2Stats = {
      version: '2.0.0',
      total_articles: 879751,
      first_article_date: '2017-09-23T10:00:42.000Z',
      last_article_date: '2026-10-30T21:14:05.000Z',
      sources: { odaily: 316016, unknown: 174034, coindesk: 3904 },
      tickers: { BTC: 81362 },
      categories: { general: 410000, bitcoin: 80556 },
      monthly_counts: {
        '2017-09': 2,
        '2017-12': 18,
        '2025-12': 1093,
        'unknown-date-part1': 90000,
      },
    };

    expect(summarizeArchiveStats(stats)).toEqual({
      totalArticles: 879751,
      dateRange: { earliest: '2017-09-23', latest: '2026-10-30' },
      byYear: { '2017': 20, '2025': 1093 },
      bySource: { odaily: 316016, coindesk: 3904 },
      byCategory: { general: 410000, bitcoin: 80556 },
    });
  });

  it('reads the Postgres summary shape', () => {
    const stats: ArchiveV2Stats = {
      version: '2.0.0',
      total_articles: 12,
      total_fetches: 12,
      first_fetch: '2026-01-02 08:00:00+00',
      last_fetch: '2026-10-29 08:00:00+00',
      sources: { coindesk: 12 },
      tickers: {},
      daily_counts: { '2026-01-02': 5, '2026-10-29': 7 },
    };

    expect(summarizeArchiveStats(stats)).toEqual({
      totalArticles: 12,
      dateRange: { earliest: '2026-01-02', latest: '2026-10-29' },
      byYear: { '2026': 12 },
      bySource: { coindesk: 12 },
      byCategory: {},
    });
  });

  it('leaves out a date range it cannot parse', () => {
    const stats: ArchiveV2Stats = {
      version: '2.0.0',
      total_articles: 0,
      first_fetch: null,
      last_fetch: 'not a date',
      sources: {},
      tickers: {},
    };

    expect(summarizeArchiveStats(stats).dateRange).toBeNull();
  });
});
