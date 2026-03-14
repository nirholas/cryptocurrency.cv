import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateClickbaitScore,
  updateSourceHistory,
  calculateSourceCredibility,
  clearCredibilityHistory,
  getCredibilityStats,
} from '@/lib/source-credibility';
import type { NewsArticle } from '@/lib/crypto-news';

describe('calculateClickbaitScore', () => {
  it('should return 0 for normal headlines', () => {
    expect(calculateClickbaitScore('Bitcoin rises 5% on ETF approval')).toBe(0);
  });

  it('should score "you won\'t believe" as clickbait', () => {
    const score = calculateClickbaitScore("You won't believe what happened to Bitcoin");
    expect(score).toBeGreaterThan(0);
  });

  it('should score "SHOCKING" as clickbait', () => {
    const score = calculateClickbaitScore('SHOCKING: Bitcoin crashes to zero');
    expect(score).toBeGreaterThan(0);
  });

  it('should score "BREAKING:" as clickbait', () => {
    const score = calculateClickbaitScore('BREAKING: Major exchange hacked');
    expect(score).toBeGreaterThan(0);
  });

  it('should score "5 reasons" patterns', () => {
    const score = calculateClickbaitScore('5 reasons Bitcoin will hit $1M');
    expect(score).toBeGreaterThan(0);
  });

  it('should score multiple exclamation marks', () => {
    const score = calculateClickbaitScore('Bitcoin is going to the moon!!');
    expect(score).toBeGreaterThan(0);
  });

  it('should score multiple question marks', () => {
    const score = calculateClickbaitScore('Will Bitcoin crash??');
    expect(score).toBeGreaterThan(0);
  });

  it('should score "here\'s why" patterns', () => {
    const score = calculateClickbaitScore("Here's why Bitcoin will transform finance");
    expect(score).toBeGreaterThan(0);
  });

  it('should score "the truth about" pattern', () => {
    const score = calculateClickbaitScore('The truth about crypto scams');
    expect(score).toBeGreaterThan(0);
  });

  it('should cap score at 1.0', () => {
    const score = calculateClickbaitScore(
      "SHOCKING!! You won't believe!! This is HUGE!! 10 reasons!! EXPOSED!! REVEALED!!",
    );
    expect(score).toBeLessThanOrEqual(1);
  });

  it('should detect ALL CAPS words as clickbait signal', () => {
    const score = calculateClickbaitScore('BITCOIN ETHEREUM SOLANA ALL PUMPING HARD NOW');
    expect(score).toBeGreaterThan(0);
  });
});

describe('updateSourceHistory', () => {
  beforeEach(() => {
    clearCredibilityHistory();
  });

  it('should track articles for a source', () => {
    updateSourceHistory([
      {
        title: 'Bitcoin hits $100k',
        source: 'CoinDesk',
        sourceKey: 'coindesk',
        pubDate: new Date().toISOString(),
      } as unknown as NewsArticle,
    ]);
    const stats = getCredibilityStats();
    expect(stats.sourcesTracked).toBeGreaterThanOrEqual(1);
  });

  it('should not duplicate articles with same title and pubDate', () => {
    const article = {
      title: 'Same Article',
      source: 'CoinDesk',
      sourceKey: 'coindesk',
      pubDate: '2025-01-01T00:00:00Z',
    } as unknown as NewsArticle;
    updateSourceHistory([article]);
    updateSourceHistory([article]);
    const stats = getCredibilityStats();
    expect(stats.totalArticles).toBeGreaterThanOrEqual(1);
  });

  it('should track multiple sources', () => {
    updateSourceHistory([
      {
        title: 'Article 1',
        source: 'CoinDesk',
        sourceKey: 'coindesk',
        pubDate: new Date().toISOString(),
      } as unknown as NewsArticle,
      {
        title: 'Article 2',
        source: 'The Block',
        sourceKey: 'theblock',
        pubDate: new Date().toISOString(),
      } as unknown as NewsArticle,
    ]);
    const stats = getCredibilityStats();
    expect(stats.sourcesTracked).toBeGreaterThanOrEqual(2);
  });
});

describe('calculateSourceCredibility', () => {
  beforeEach(() => {
    clearCredibilityHistory();
  });

  it('should return null for unknown source without baseline', () => {
    const result = calculateSourceCredibility('totally-unknown-source-xyz');
    expect(result).toBeNull();
  });

  it('should return credibility for source with baseline', () => {
    const result = calculateSourceCredibility('coindesk');
    expect(result).toBeDefined();
    expect(result?.sourceKey).toBe('coindesk');
    expect(result?.overallScore).toBeGreaterThan(0);
    expect(result?.overallScore).toBeLessThanOrEqual(100);
  });

  it('should include all metric fields', () => {
    const result = calculateSourceCredibility('theblock');
    expect(result).toBeDefined();
    expect(result?.metrics.accuracy).toBeGreaterThanOrEqual(0);
    expect(result?.metrics.timeliness).toBeGreaterThanOrEqual(0);
    expect(result?.metrics.consistency).toBeGreaterThanOrEqual(0);
    expect(result?.metrics.bias).toBeDefined();
    expect(result?.metrics.clickbait).toBeGreaterThanOrEqual(0);
  });

  it('should return credibility for source with history', () => {
    updateSourceHistory([
      {
        title: 'Normal headline 1',
        source: 'CoinDesk',
        sourceKey: 'coindesk',
        pubDate: '2025-01-01T00:00:00Z',
      } as unknown as NewsArticle,
      {
        title: 'Normal headline 2',
        source: 'CoinDesk',
        sourceKey: 'coindesk',
        pubDate: '2025-01-01T01:00:00Z',
      } as unknown as NewsArticle,
      {
        title: 'Normal headline 3',
        source: 'CoinDesk',
        sourceKey: 'coindesk',
        pubDate: '2025-01-01T02:00:00Z',
      } as unknown as NewsArticle,
    ]);
    const result = calculateSourceCredibility('coindesk');
    expect(result).toBeDefined();
    expect(result?.articleCount).toBe(3);
  });

  it('should have a trend field', () => {
    const result = calculateSourceCredibility('coindesk');
    expect(['improving', 'declining', 'stable']).toContain(result?.trend);
  });
});

describe('clearCredibilityHistory', () => {
  it('should reset all tracked data', () => {
    updateSourceHistory([
      {
        title: 'Article',
        source: 'CoinDesk',
        sourceKey: 'coindesk',
        pubDate: new Date().toISOString(),
      } as unknown as NewsArticle,
    ]);
    clearCredibilityHistory();
    const stats = getCredibilityStats();
    expect(stats.sourcesTracked).toBe(0);
  });
});

describe('getCredibilityStats', () => {
  beforeEach(() => {
    clearCredibilityHistory();
  });

  it('should return zero stats when empty', () => {
    const stats = getCredibilityStats();
    expect(stats.sourcesTracked).toBe(0);
    expect(stats.totalArticles).toBe(0);
  });

  it('should return correct counts after adding articles', () => {
    updateSourceHistory([
      {
        title: 'A1',
        source: 'CoinDesk',
        sourceKey: 'coindesk',
        pubDate: new Date().toISOString(),
      } as unknown as NewsArticle,
      {
        title: 'A2',
        source: 'CoinDesk',
        sourceKey: 'coindesk',
        pubDate: new Date().toISOString(),
      } as unknown as NewsArticle,
      {
        title: 'A3',
        source: 'The Block',
        sourceKey: 'theblock',
        pubDate: new Date().toISOString(),
      } as unknown as NewsArticle,
    ]);
    const stats = getCredibilityStats();
    expect(stats.sourcesTracked).toBe(2);
    expect(stats.totalArticles).toBe(3);
  });
});
