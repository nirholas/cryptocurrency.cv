/**
 * @fileoverview Unit tests for Analytics features
 * Tests headline tracking, source credibility, and anomaly detection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateArticleId,
  calculateSimilarity,
  classifyChangeType,
  calculateSentiment,
  detectSentimentShift,
  trackArticle,
  getHeadlineTracking,
  bulkTrackArticles,
  getArticleEvolution,
  clearTracking,
} from './headline-tracker';
import {
  calculateClickbaitScore,
  updateSourceHistory,
  calculateSourceCredibility,
  getSourceCredibility,
  clearCredibilityHistory,
  getCredibilityStats,
} from './source-credibility';
import {
  extractTickers,
  calculateStdDev,
  detectVolumeSpike,
  detectCoordinatedPublishing,
  detectSentimentShift as detectAnomalySentimentShift,
  detectTickerSurge,
  detectSourceOutage,
  getAnomalyReport,
  clearAnomalyData,
  getAnomalyStats,
  ANOMALY_RULES,
} from './anomaly-detector';

// ═══════════════════════════════════════════════════════════════
// HEADLINE TRACKER TESTS
// ═══════════════════════════════════════════════════════════════

describe('Headline Tracker', () => {
  beforeEach(() => {
    clearTracking();
  });

  afterEach(() => {
    clearTracking();
  });

  describe('generateArticleId', () => {
    it('should generate consistent IDs for same URL', () => {
      const url = 'https://example.com/article/123';
      const id1 = generateArticleId(url);
      const id2 = generateArticleId(url);
      expect(id1).toBe(id2);
    });

    it('should generate different IDs for different URLs', () => {
      const id1 = generateArticleId('https://example.com/article/1');
      const id2 = generateArticleId('https://example.com/article/2');
      expect(id1).not.toBe(id2);
    });

    it('should return string starting with art_', () => {
      const id = generateArticleId('https://example.com/test');
      expect(id).toMatch(/^art_/);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1 for identical strings', () => {
      const similarity = calculateSimilarity('hello world', 'hello world');
      expect(similarity).toBe(1);
    });

    it('should return 1 for identical strings with different cases', () => {
      const similarity = calculateSimilarity('Hello World', 'hello world');
      expect(similarity).toBe(1);
    });

    it('should return low similarity for completely different strings', () => {
      const similarity = calculateSimilarity('abc', 'xyz');
      expect(similarity).toBeLessThan(0.5);
    });

    it('should return high similarity for minor changes', () => {
      const similarity = calculateSimilarity(
        'Bitcoin hits new all-time high',
        'Bitcoin hits new all time high'
      );
      expect(similarity).toBeGreaterThan(0.9);
    });

    it('should handle empty strings', () => {
      expect(calculateSimilarity('', '')).toBe(1);
      expect(calculateSimilarity('hello', '')).toBe(0);
      expect(calculateSimilarity('', 'hello')).toBe(0);
    });
  });

  describe('classifyChangeType', () => {
    it('should classify minor changes (typos, punctuation)', () => {
      const type = classifyChangeType(
        'Bitcoin hits $100k!',
        'Bitcoin hits $100k'
      );
      expect(type).toBe('minor');
    });

    it('should classify major changes (significant rewrites)', () => {
      const type = classifyChangeType(
        'Bitcoin price analysis shows bullish trend',
        'Ethereum dominates DeFi market'
      );
      expect(type).toBe('major');
    });
  });

  describe('calculateSentiment', () => {
    it('should return positive score for bullish words', () => {
      const sentiment = calculateSentiment('Bitcoin surges to new high, massive gains expected');
      expect(sentiment).toBeGreaterThan(0);
    });

    it('should return negative score for bearish words', () => {
      const sentiment = calculateSentiment('Bitcoin crashes amid market panic and fear');
      expect(sentiment).toBeLessThan(0);
    });

    it('should return neutral for balanced text', () => {
      const sentiment = calculateSentiment('Bitcoin trading steady today');
      expect(sentiment).toBe(0);
    });
  });

  describe('detectSentimentShift', () => {
    it('should detect shift to more positive', () => {
      const shift = detectSentimentShift(
        'Bitcoin crashes amid fears',
        'Bitcoin surges with gains'
      );
      expect(shift).toBe('more_positive');
    });

    it('should detect shift to more negative', () => {
      const shift = detectSentimentShift(
        'Bitcoin surges with gains',
        'Bitcoin crashes amid panic'
      );
      expect(shift).toBe('more_negative');
    });

    it('should return neutral for similar sentiment', () => {
      const shift = detectSentimentShift(
        'Bitcoin price update today',
        'Bitcoin trading update today'
      );
      expect(shift).toBe('neutral');
    });
  });

  describe('trackArticle', () => {
    it('should track new article', () => {
      const result = trackArticle(
        'https://example.com/article/1',
        'Bitcoin hits $100k',
        'CoinDesk'
      );
      
      expect(result.isNew).toBe(true);
      expect(result.hasChanged).toBe(false);
    });

    it('should detect headline change', () => {
      trackArticle(
        'https://example.com/article/1',
        'Bitcoin hits $100k',
        'CoinDesk'
      );
      
      const result = trackArticle(
        'https://example.com/article/1',
        'Bitcoin surges past $100k milestone',
        'CoinDesk'
      );
      
      expect(result.isNew).toBe(false);
      expect(result.hasChanged).toBe(true);
      expect(result.evolution).toBeDefined();
      expect(result.evolution?.totalChanges).toBe(1);
    });

    it('should not mark as changed if title is same', () => {
      trackArticle(
        'https://example.com/article/1',
        'Bitcoin hits $100k',
        'CoinDesk'
      );
      
      const result = trackArticle(
        'https://example.com/article/1',
        'Bitcoin hits $100k',
        'CoinDesk'
      );
      
      expect(result.isNew).toBe(false);
      expect(result.hasChanged).toBe(false);
    });
  });

  describe('bulkTrackArticles', () => {
    it('should track multiple articles', () => {
      const articles = [
        { link: 'https://example.com/1', title: 'Article 1', source: 'Source A' },
        { link: 'https://example.com/2', title: 'Article 2', source: 'Source B' },
        { link: 'https://example.com/3', title: 'Article 3', source: 'Source C' },
      ];
      
      const result = bulkTrackArticles(articles);
      
      expect(result.tracked).toBe(3);
      expect(result.new).toBe(3);
      expect(result.changed).toBe(0);
    });

    it('should detect changes in bulk tracking', () => {
      bulkTrackArticles([
        { link: 'https://example.com/1', title: 'Original Title', source: 'Source A' },
      ]);
      
      const result = bulkTrackArticles([
        { link: 'https://example.com/1', title: 'Changed Title', source: 'Source A' },
      ]);
      
      expect(result.tracked).toBe(1);
      expect(result.new).toBe(0);
      expect(result.changed).toBe(1);
    });
  });

  describe('getArticleEvolution', () => {
    it('should return null for non-tracked URL', () => {
      const evolution = getArticleEvolution('https://example.com/unknown');
      expect(evolution).toBeNull();
    });

    it('should return evolution for tracked URL', () => {
      trackArticle('https://example.com/1', 'Original', 'Source');
      trackArticle('https://example.com/1', 'Changed', 'Source');
      
      const evolution = getArticleEvolution('https://example.com/1');
      
      expect(evolution).not.toBeNull();
      expect(evolution?.originalTitle).toBe('Original');
      expect(evolution?.currentTitle).toBe('Changed');
      expect(evolution?.totalChanges).toBe(1);
    });
  });

  describe('getHeadlineTracking', () => {
    it('should return empty results for no data', async () => {
      const result = await getHeadlineTracking({ hours: 24 });
      
      expect(result.tracked).toHaveLength(0);
      expect(result.recentChanges).toHaveLength(0);
      expect(result.stats.totalTracked).toBe(0);
    });

    it('should filter by changesOnly', async () => {
      trackArticle('https://example.com/1', 'Title 1', 'Source');
      trackArticle('https://example.com/2', 'Title 2', 'Source');
      trackArticle('https://example.com/1', 'Title 1 Changed', 'Source');
      
      const allResult = await getHeadlineTracking({ hours: 24, changesOnly: false });
      const changesResult = await getHeadlineTracking({ hours: 24, changesOnly: true });
      
      expect(allResult.tracked.length).toBe(2);
      expect(changesResult.tracked.length).toBe(1);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// SOURCE CREDIBILITY TESTS
// ═══════════════════════════════════════════════════════════════

describe('Source Credibility', () => {
  beforeEach(() => {
    clearCredibilityHistory();
  });

  afterEach(() => {
    clearCredibilityHistory();
  });

  describe('calculateClickbaitScore', () => {
    it('should return low score for neutral headline', () => {
      const score = calculateClickbaitScore('Bitcoin trading at $100,000 today');
      expect(score).toBeLessThan(0.3);
    });

    it('should return high score for clickbait headline', () => {
      const score = calculateClickbaitScore("You Won't Believe What Bitcoin Did!! SHOCKING!!!");
      expect(score).toBeGreaterThan(0.5);
    });

    it('should detect numbered list clickbait', () => {
      const score = calculateClickbaitScore('10 Reasons Why Bitcoin Will Moon');
      expect(score).toBeGreaterThan(0);
    });

    it('should detect excessive punctuation', () => {
      const score1 = calculateClickbaitScore('Bitcoin update');
      const score2 = calculateClickbaitScore('Bitcoin update???!!!');
      expect(score2).toBeGreaterThan(score1);
    });

    it('should handle empty string', () => {
      const score = calculateClickbaitScore('');
      expect(score).toBe(0);
    });
  });

  describe('updateSourceHistory', () => {
    it('should add articles to history', () => {
      const articles = [
        { 
          title: 'Test Article', 
          sourceKey: 'coindesk', 
          source: 'CoinDesk',
          pubDate: new Date().toISOString(),
          link: 'https://example.com/1',
          category: 'general',
          timeAgo: '1h ago'
        },
      ];
      
      updateSourceHistory(articles as any);
      
      const stats = getCredibilityStats();
      expect(stats.sourcesTracked).toBeGreaterThan(0);
    });

    it('should not duplicate articles', () => {
      const article = { 
        title: 'Test Article', 
        sourceKey: 'coindesk', 
        source: 'CoinDesk',
        pubDate: new Date().toISOString(),
        link: 'https://example.com/1',
        category: 'general',
        timeAgo: '1h ago'
      };
      
      updateSourceHistory([article] as any);
      updateSourceHistory([article] as any);
      
      const stats = getCredibilityStats();
      expect(stats.totalArticles).toBe(1);
    });
  });

  describe('calculateSourceCredibility', () => {
    it('should return baseline for known source', () => {
      const credibility = calculateSourceCredibility('coindesk');
      
      expect(credibility).not.toBeNull();
      expect(credibility?.sourceKey).toBe('coindesk');
      expect(credibility?.overallScore).toBeGreaterThan(0);
      expect(credibility?.metrics.accuracy).toBeDefined();
      expect(credibility?.metrics.timeliness).toBeDefined();
      expect(credibility?.metrics.consistency).toBeDefined();
      expect(credibility?.metrics.bias).toBeDefined();
      expect(credibility?.metrics.clickbait).toBeDefined();
    });

    it('should return null for unknown source with no history', () => {
      const credibility = calculateSourceCredibility('unknown_source');
      expect(credibility).toBeNull();
    });

    it('should calculate metrics from history', () => {
      const articles = [
        { title: 'Normal article 1', sourceKey: 'testSource', source: 'Test', pubDate: new Date(Date.now() - 1000).toISOString(), link: 'url1', category: 'general', timeAgo: '1s ago' },
        { title: 'Normal article 2', sourceKey: 'testSource', source: 'Test', pubDate: new Date(Date.now() - 2000).toISOString(), link: 'url2', category: 'general', timeAgo: '2s ago' },
        { title: 'Normal article 3', sourceKey: 'testSource', source: 'Test', pubDate: new Date(Date.now() - 3000).toISOString(), link: 'url3', category: 'general', timeAgo: '3s ago' },
      ];
      
      updateSourceHistory(articles as any);
      
      const credibility = calculateSourceCredibility('testSource');
      
      expect(credibility).not.toBeNull();
      expect(credibility?.articleCount).toBe(3);
    });
  });

  describe('getSourceCredibility', () => {
    it('should return report for all sources', async () => {
      const report = await getSourceCredibility();
      
      expect(report.sources).toBeDefined();
      expect(Array.isArray(report.sources)).toBe(true);
      expect(report.averageScore).toBeDefined();
      expect(report.topSources).toBeDefined();
      expect(report.bottomSources).toBeDefined();
      expect(report.generatedAt).toBeDefined();
    });

    it('should sort by different criteria', async () => {
      const byScore = await getSourceCredibility({ sortBy: 'score' });
      const byAccuracy = await getSourceCredibility({ sortBy: 'accuracy' });
      
      expect(byScore.sources.length).toBeGreaterThan(0);
      expect(byAccuracy.sources.length).toBeGreaterThan(0);
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// ANOMALY DETECTOR TESTS
// ═══════════════════════════════════════════════════════════════

describe('Anomaly Detector', () => {
  beforeEach(() => {
    clearAnomalyData();
  });

  afterEach(() => {
    clearAnomalyData();
  });

  describe('extractTickers', () => {
    it('should extract ticker symbols', () => {
      const tickers = extractTickers('BTC and ETH are leading the market');
      expect(tickers).toContain('BTC');
      expect(tickers).toContain('ETH');
    });

    it('should extract full coin names', () => {
      const tickers = extractTickers('Bitcoin and Ethereum prices surge');
      expect(tickers).toContain('BTC');
      expect(tickers).toContain('ETH');
    });

    it('should return empty for no tickers', () => {
      const tickers = extractTickers('General crypto news today');
      expect(tickers).toHaveLength(0);
    });

    it('should not duplicate tickers', () => {
      const tickers = extractTickers('BTC Bitcoin BTC prices');
      const btcCount = tickers.filter(t => t === 'BTC').length;
      expect(btcCount).toBe(1);
    });
  });

  describe('calculateStdDev', () => {
    it('should calculate correct mean and std dev', () => {
      const values = [10, 10, 10, 10, 10];
      const { mean, stdDev } = calculateStdDev(values);
      
      expect(mean).toBe(10);
      expect(stdDev).toBe(0);
    });

    it('should handle varied values', () => {
      const values = [2, 4, 4, 4, 5, 5, 7, 9];
      const { mean, stdDev } = calculateStdDev(values);
      
      expect(mean).toBe(5);
      expect(stdDev).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const { mean, stdDev } = calculateStdDev([]);
      
      expect(mean).toBe(0);
      expect(stdDev).toBe(0);
    });

    it('should handle single value', () => {
      const { mean, stdDev } = calculateStdDev([5]);
      
      expect(mean).toBe(5);
      expect(stdDev).toBe(0);
    });
  });

  describe('detectVolumeSpike', () => {
    it('should detect significant volume spike', () => {
      const historical = [10, 12, 11, 10, 13, 11, 10, 12, 11, 10];
      const current = 50;
      
      const anomaly = detectVolumeSpike(current, historical);
      
      expect(anomaly).not.toBeNull();
      expect(anomaly?.type).toBe('volume_spike');
      expect(anomaly?.severity).toBeDefined();
    });

    it('should not flag normal volume', () => {
      const historical = [10, 12, 11, 10, 13, 11, 10, 12, 11, 10];
      const current = 12;
      
      const anomaly = detectVolumeSpike(current, historical);
      
      expect(anomaly).toBeNull();
    });

    it('should return null with insufficient history', () => {
      const anomaly = detectVolumeSpike(50, [10, 12]);
      expect(anomaly).toBeNull();
    });
  });

  describe('detectCoordinatedPublishing', () => {
    it('should detect coordinated publishing', () => {
      const now = Date.now();
      const articles = [
        { title: 'Bitcoin hits $100k milestone', source: 'Source A', pubDate: new Date(now).toISOString(), sentiment: 0.5, tickers: ['BTC'] },
        { title: 'Bitcoin reaches $100k milestone', source: 'Source B', pubDate: new Date(now - 60000).toISOString(), sentiment: 0.5, tickers: ['BTC'] },
        { title: 'BTC hits 100k milestone', source: 'Source C', pubDate: new Date(now - 120000).toISOString(), sentiment: 0.5, tickers: ['BTC'] },
      ];
      
      const anomaly = detectCoordinatedPublishing(articles);
      
      expect(anomaly).not.toBeNull();
      expect(anomaly?.type).toBe('coordinated_publishing');
    });

    it('should not flag different headlines', () => {
      const now = Date.now();
      const articles = [
        { title: 'Bitcoin price update', source: 'Source A', pubDate: new Date(now).toISOString(), sentiment: 0.5, tickers: ['BTC'] },
        { title: 'Ethereum DeFi news', source: 'Source B', pubDate: new Date(now - 60000).toISOString(), sentiment: 0.5, tickers: ['ETH'] },
        { title: 'Solana NFT market grows', source: 'Source C', pubDate: new Date(now - 120000).toISOString(), sentiment: 0.5, tickers: ['SOL'] },
      ];
      
      const anomaly = detectCoordinatedPublishing(articles);
      
      expect(anomaly).toBeNull();
    });
  });

  describe('detectAnomalySentimentShift', () => {
    it('should detect positive sentiment shift', () => {
      const history = [
        { timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), avg: -0.3 },
        { timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), avg: -0.25 },
        { timestamp: new Date(Date.now() - 6.5 * 60 * 60 * 1000).toISOString(), avg: -0.2 },
        { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), avg: 0.1 },
        { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), avg: 0.2 },
        { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), avg: 0.3 },
      ];
      
      const anomaly = detectAnomalySentimentShift(0.4, history);
      
      expect(anomaly).not.toBeNull();
      expect(anomaly?.type).toBe('sentiment_shift');
    });

    it('should return null for stable sentiment', () => {
      const history = [
        { timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(), avg: 0.1 },
        { timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(), avg: 0.12 },
        { timestamp: new Date(Date.now() - 6.5 * 60 * 60 * 1000).toISOString(), avg: 0.08 },
        { timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), avg: 0.1 },
        { timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), avg: 0.15 },
        { timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), avg: 0.1 },
      ];
      
      const anomaly = detectAnomalySentimentShift(0.12, history);
      
      expect(anomaly).toBeNull();
    });
  });

  describe('detectTickerSurge', () => {
    it('should detect ticker mention surge', () => {
      const current = { 'BTC': 25, 'ETH': 5 };
      const historical = {
        'BTC': [3, 4, 5, 4, 3, 5, 4],
        'ETH': [5, 4, 6, 5, 4, 5, 6],
      };
      
      const anomaly = detectTickerSurge(current, historical);
      
      expect(anomaly).not.toBeNull();
      expect(anomaly?.type).toBe('ticker_surge');
      expect(anomaly?.data.affectedEntities).toContain('BTC');
    });

    it('should not flag normal mentions', () => {
      const current = { 'BTC': 5, 'ETH': 5 };
      const historical = {
        'BTC': [4, 5, 4, 5, 6, 5, 4],
        'ETH': [5, 4, 6, 5, 4, 5, 6],
      };
      
      const anomaly = detectTickerSurge(current, historical);
      
      expect(anomaly).toBeNull();
    });
  });

  describe('detectSourceOutage', () => {
    it('should detect source going silent', () => {
      const lastActivity = {
        'CoinDesk': new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        'The Block': new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      };
      
      const anomalies = detectSourceOutage(lastActivity, ['CoinDesk', 'The Block']);
      
      expect(anomalies.length).toBe(1);
      expect(anomalies[0].type).toBe('source_outage');
      expect(anomalies[0].data.affectedEntities).toContain('CoinDesk');
    });

    it('should not flag active sources', () => {
      const lastActivity = {
        'CoinDesk': new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        'The Block': new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      };
      
      const anomalies = detectSourceOutage(lastActivity, ['CoinDesk', 'The Block']);
      
      expect(anomalies).toHaveLength(0);
    });
  });

  describe('ANOMALY_RULES', () => {
    it('should have all required rules', () => {
      expect(ANOMALY_RULES.volumeSpike).toBeDefined();
      expect(ANOMALY_RULES.coordinatedPublishing).toBeDefined();
      expect(ANOMALY_RULES.sentimentShift).toBeDefined();
      expect(ANOMALY_RULES.tickerSurge).toBeDefined();
      expect(ANOMALY_RULES.sourceOutage).toBeDefined();
    });

    it('should have correct thresholds', () => {
      expect(ANOMALY_RULES.volumeSpike.threshold).toBe(3);
      expect(ANOMALY_RULES.coordinatedPublishing.minSources).toBe(3);
      expect(ANOMALY_RULES.sentimentShift.threshold).toBe(0.4);
      expect(ANOMALY_RULES.tickerSurge.threshold).toBe(5);
      expect(ANOMALY_RULES.sourceOutage.silenceThresholdHours).toBe(12);
    });
  });

  describe('getAnomalyReport', () => {
    it('should return valid report structure', async () => {
      const report = await getAnomalyReport({ hours: 24 });
      
      expect(report.anomalies).toBeDefined();
      expect(Array.isArray(report.anomalies)).toBe(true);
      expect(report.systemHealth).toBeDefined();
      expect(report.systemHealth.normalArticleRate).toBeDefined();
      expect(report.systemHealth.currentRate).toBeDefined();
      expect(report.systemHealth.activeSources).toBeDefined();
      expect(report.systemHealth.totalSources).toBeDefined();
      expect(report.generatedAt).toBeDefined();
    });

    it('should filter by severity', async () => {
      const highOnly = await getAnomalyReport({ hours: 24, severity: 'high' });
      
      expect(highOnly.anomalies.every(a => a.severity === 'high')).toBe(true);
    });
  });

  describe('getAnomalyStats', () => {
    it('should return valid stats', () => {
      const stats = getAnomalyStats();
      
      expect(stats.totalArticlesTracked).toBeDefined();
      expect(stats.hoursOfHistory).toBeDefined();
      expect(stats.anomaliesDetected).toBeDefined();
      expect(stats.lastUpdate).toBeDefined();
    });
  });
});

// ═══════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════

describe('Analytics Integration', () => {
  beforeEach(() => {
    clearTracking();
    clearCredibilityHistory();
    clearAnomalyData();
  });

  afterEach(() => {
    clearTracking();
    clearCredibilityHistory();
    clearAnomalyData();
  });

  it('should track headlines from multiple sources', () => {
    const articles = [
      { link: 'https://coindesk.com/1', title: 'BTC News from CoinDesk', source: 'CoinDesk' },
      { link: 'https://theblock.co/1', title: 'ETH News from The Block', source: 'The Block' },
      { link: 'https://decrypt.co/1', title: 'SOL News from Decrypt', source: 'Decrypt' },
    ];

    const result = bulkTrackArticles(articles);

    expect(result.tracked).toBe(3);
    expect(result.new).toBe(3);
  });

  it('should calculate credibility for tracked sources', () => {
    const articles = [
      { title: 'Test 1', sourceKey: 'coindesk', source: 'CoinDesk', pubDate: new Date().toISOString(), link: 'url1', category: 'general', timeAgo: '1s' },
      { title: 'Test 2', sourceKey: 'coindesk', source: 'CoinDesk', pubDate: new Date().toISOString(), link: 'url2', category: 'general', timeAgo: '2s' },
    ];

    updateSourceHistory(articles as any);

    const cred = calculateSourceCredibility('coindesk');
    expect(cred).not.toBeNull();
    expect(cred?.overallScore).toBeGreaterThan(0);
  });

  it('should handle edge case of no data gracefully', async () => {
    const headlines = await getHeadlineTracking({ hours: 24 });
    expect(headlines.tracked).toHaveLength(0);

    const anomalies = await getAnomalyReport({ hours: 24 });
    expect(anomalies.anomalies).toBeDefined();

    const credibility = await getSourceCredibility();
    expect(credibility.sources).toBeDefined();
  });

  it('should handle single source gracefully', async () => {
    trackArticle('https://example.com/1', 'Single Article', 'SingleSource');

    const headlines = await getHeadlineTracking({ hours: 24 });
    expect(headlines.tracked).toHaveLength(1);
    expect(headlines.stats.withChanges).toBe(0);
  });
});
