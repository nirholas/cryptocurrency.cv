/**
 * AI Intelligence Engine Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  clusterSimilarArticles, 
  type NewsArticle 
} from './ai-intelligence';

// Mock Groq
vi.mock('./groq', () => ({
  isGroqConfigured: () => true,
  promptGroqJson: vi.fn(),
  promptGroqJsonCached: vi.fn(),
}));

describe('AI Intelligence Engine', () => {
  describe('clusterSimilarArticles', () => {
    const sampleArticles: NewsArticle[] = [
      {
        title: 'Bitcoin ETF approved by SEC, market rallies',
        description: 'The SEC has approved the first spot Bitcoin ETF',
        source: 'CoinDesk',
        pubDate: '2026-02-01T10:00:00Z',
        link: 'https://coindesk.com/btc-etf',
      },
      {
        title: 'SEC approves Bitcoin spot ETF, prices surge',
        description: 'Historic approval of spot Bitcoin ETF by SEC',
        source: 'The Block',
        pubDate: '2026-02-01T10:05:00Z',
        link: 'https://theblock.co/btc-etf',
      },
      {
        title: 'Bitcoin ETF gets green light from SEC',
        description: 'Spot Bitcoin ETF finally approved after years',
        source: 'Decrypt',
        pubDate: '2026-02-01T10:10:00Z',
        link: 'https://decrypt.co/btc-etf',
      },
      {
        title: 'Ethereum layer 2 sees record TVL',
        description: 'Arbitrum and Optimism hit new highs',
        source: 'CoinDesk',
        pubDate: '2026-02-01T11:00:00Z',
        link: 'https://coindesk.com/l2-tvl',
      },
      {
        title: 'Solana DeFi ecosystem growing rapidly',
        description: 'New protocols launching on Solana',
        source: 'The Block',
        pubDate: '2026-02-01T12:00:00Z',
        link: 'https://theblock.co/solana-defi',
      },
    ];

    it('should cluster similar articles together', () => {
      const clusters = clusterSimilarArticles(sampleArticles, 0.3);
      
      // Should find at least one cluster (the ETF articles)
      expect(clusters.length).toBeGreaterThan(0);
      
      // The largest cluster should contain the ETF articles
      const largestCluster = clusters[0];
      expect(largestCluster.articles.length).toBeGreaterThanOrEqual(2);
      
      // All articles in cluster should be about ETF
      const allAboutEtf = largestCluster.articles.every(a => 
        a.title.toLowerCase().includes('etf') || 
        a.title.toLowerCase().includes('sec')
      );
      expect(allAboutEtf).toBe(true);
    });

    it('should not cluster unrelated articles', () => {
      const unrelatedArticles: NewsArticle[] = [
        {
          title: 'Bitcoin price hits new high',
          source: 'CoinDesk',
          pubDate: '2026-02-01T10:00:00Z',
          link: 'https://example.com/1',
        },
        {
          title: 'Ethereum NFT market booming',
          source: 'The Block',
          pubDate: '2026-02-01T11:00:00Z',
          link: 'https://example.com/2',
        },
        {
          title: 'Solana DeFi protocol launches',
          source: 'Decrypt',
          pubDate: '2026-02-01T12:00:00Z',
          link: 'https://example.com/3',
        },
      ];

      const clusters = clusterSimilarArticles(unrelatedArticles, 0.4);
      
      // Should find no clusters (all articles are unique)
      expect(clusters.length).toBe(0);
    });

    it('should handle empty array', () => {
      const clusters = clusterSimilarArticles([]);
      expect(clusters).toEqual([]);
    });

    it('should handle single article', () => {
      const clusters = clusterSimilarArticles([sampleArticles[0]]);
      expect(clusters).toEqual([]);
    });

    it('should respect threshold parameter', () => {
      // With high threshold, fewer clusters
      const highThreshold = clusterSimilarArticles(sampleArticles, 0.8);
      
      // With low threshold, more clusters
      const lowThreshold = clusterSimilarArticles(sampleArticles, 0.2);
      
      // Low threshold should find more or equal clusters
      expect(lowThreshold.length).toBeGreaterThanOrEqual(highThreshold.length);
    });
  });

  describe('Article clustering edge cases', () => {
    it('should handle articles with no description', () => {
      const articles: NewsArticle[] = [
        {
          title: 'Bitcoin reaches $100k milestone',
          source: 'Source A',
          pubDate: '2026-02-01T10:00:00Z',
          link: 'https://example.com/1',
        },
        {
          title: 'Bitcoin hits $100k for the first time',
          source: 'Source B',
          pubDate: '2026-02-01T10:05:00Z',
          link: 'https://example.com/2',
        },
      ];

      const clusters = clusterSimilarArticles(articles, 0.3);
      expect(clusters.length).toBe(1);
      expect(clusters[0].articles.length).toBe(2);
    });

    it('should handle articles with special characters', () => {
      const articles: NewsArticle[] = [
        {
          title: "Bitcoin's price: $100k reached!",
          description: 'Historic milestone for BTC',
          source: 'Source A',
          pubDate: '2026-02-01T10:00:00Z',
          link: 'https://example.com/1',
        },
        {
          title: "Bitcoin price hits $100,000 — what's next?",
          description: 'BTC milestone achieved',
          source: 'Source B',
          pubDate: '2026-02-01T10:05:00Z',
          link: 'https://example.com/2',
        },
      ];

      // Should not throw
      expect(() => clusterSimilarArticles(articles)).not.toThrow();
    });
  });
});
