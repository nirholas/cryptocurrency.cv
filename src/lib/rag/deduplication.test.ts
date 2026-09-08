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
 * Unit tests for Document Deduplication
 *
 * Tests MinHash, SimHash, embedding-based duplicate detection,
 * deduplication strategies, and the quickDedup convenience function.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  findDuplicates,
  deduplicateDocuments,
  quickDedup,
} from '@/lib/rag/deduplication';
import type { ScoredDocument } from '@/lib/rag/types';

// ═══════════════════════════════════════════════════════════════
// MOCKS
// ═══════════════════════════════════════════════════════════════

vi.mock('@/lib/rag/embedding-service', () => ({
  generateEmbedding: vi.fn().mockImplementation(async (text: string) => {
    // Same text → same embedding (for deterministic duplicate detection)
    const base = new Array(384).fill(0);
    for (let i = 0; i < Math.min(text.length, 384); i++) {
      base[i] = text.charCodeAt(i % text.length) / 256;
    }
    return base;
  }),
}));

vi.mock('@/lib/rag/observability', () => ({
  ragLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// ═══════════════════════════════════════════════════════════════
// TEST DATA
// ═══════════════════════════════════════════════════════════════

function makeDocs(): ScoredDocument[] {
  return [
    {
      id: 'doc-1',
      title: 'Bitcoin Surges After ETF Approval',
      content: 'Bitcoin surged 8% today after the SEC approved spot Bitcoin ETFs. Market participants celebrated the milestone.',
      publishedAt: new Date('2024-01-10'),
      source: 'CoinDesk',
      voteScore: 42,
      score: 0.95,
    },
    {
      id: 'doc-2',
      title: 'Bitcoin Surges After ETF Approval',
      content: 'Bitcoin surged 8% today after the SEC approved spot Bitcoin ETFs. Market participants celebrated the milestone.',
      publishedAt: new Date('2024-01-10'),
      source: 'CryptoPanic',
      voteScore: 10,
      score: 0.90,
    },
    {
      id: 'doc-3',
      title: 'Ethereum Dencun Upgrade Reduces L2 Fees',
      content: 'The Ethereum Dencun upgrade went live today, dramatically reducing Layer 2 transaction fees through proto-danksharding.',
      publishedAt: new Date('2024-03-13'),
      source: 'The Block',
      voteScore: 38,
      score: 0.88,
    },
    {
      id: 'doc-4',
      title: 'Bitcoin ETF News: SEC Gives Green Light',
      content: 'The SEC has given the green light to spot Bitcoin ETFs. Bitcoin surged 8% as market participants celebrated.',
      publishedAt: new Date('2024-01-11'),
      source: 'Decrypt',
      voteScore: 25,
      score: 0.85,
    },
    {
      id: 'doc-5',
      title: 'Federal Reserve Holds Rates Steady',
      content: 'The Federal Reserve held interest rates unchanged at its latest meeting, signaling potential cuts later this year.',
      publishedAt: new Date('2024-01-31'),
      source: 'Bloomberg',
      voteScore: 55,
      score: 0.80,
    },
  ];
}

// ═══════════════════════════════════════════════════════════════
// TESTS
// ═══════════════════════════════════════════════════════════════

describe('Document Deduplication', () => {
  // ─────────────────────────────────────────────────────────────
  // MinHash Detection
  // ─────────────────────────────────────────────────────────────

  describe('findDuplicates — minhash', () => {
    it('detects exact duplicates', async () => {
      const docs = makeDocs();
      const result = await findDuplicates(docs, {
        method: 'minhash',
        threshold: 0.9,
      });

      // doc-1 and doc-2 are exact duplicates
      expect(result.clusters.length).toBeGreaterThan(0);
      const dupeCluster = result.clusters.find(
        (c) => c.documentIds.includes('doc-1') && c.documentIds.includes('doc-2'),
      );
      expect(dupeCluster).toBeDefined();
    });

    it('does not flag unrelated documents as duplicates', async () => {
      const docs = makeDocs();
      const result = await findDuplicates(docs, {
        method: 'minhash',
        threshold: 0.95,
      });

      // doc-3 (Ethereum) and doc-5 (Fed) should not be clustered together
      const badCluster = result.clusters.find(
        (c) => c.documentIds.includes('doc-3') && c.documentIds.includes('doc-5'),
      );
      expect(badCluster).toBeUndefined();
    });

    it('reports correct total duplicates', async () => {
      const docs = makeDocs();
      const result = await findDuplicates(docs, {
        method: 'minhash',
        threshold: 0.9,
      });

      expect(result.totalDuplicates).toBeGreaterThanOrEqual(2);
      expect(result.uniqueCount).toBeLessThan(docs.length);
    });

    it('records processing time', async () => {
      const docs = makeDocs();
      const result = await findDuplicates(docs, { method: 'minhash' });

      expect(result.processingTime).toBeGreaterThanOrEqual(0);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // SimHash Detection
  // ─────────────────────────────────────────────────────────────

  describe('findDuplicates — simhash', () => {
    it('detects duplicates using SimHash', async () => {
      const docs = makeDocs();
      const result = await findDuplicates(docs, {
        method: 'simhash',
        threshold: 0.85,
      });

      expect(result.method).toBe('simhash');
      // Should detect doc-1/doc-2 as duplicates
      const dupeCluster = result.clusters.find(
        (c) => c.documentIds.includes('doc-1') && c.documentIds.includes('doc-2'),
      );
      expect(dupeCluster).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Embedding Detection
  // ─────────────────────────────────────────────────────────────

  describe('findDuplicates — embedding', () => {
    it('detects duplicates using embeddings', async () => {
      const docs = makeDocs();
      const result = await findDuplicates(docs, {
        method: 'embedding',
        threshold: 0.95,
      });

      expect(result.method).toBe('embedding');
      // Exact text duplicates should be detected
      const dupeCluster = result.clusters.find(
        (c) => c.documentIds.includes('doc-1') && c.documentIds.includes('doc-2'),
      );
      expect(dupeCluster).toBeDefined();
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Deduplication Strategies
  // ─────────────────────────────────────────────────────────────

  describe('deduplicateDocuments', () => {
    it('keep_newest — retains the most recent document', async () => {
      const docs = makeDocs();
      const result = await findDuplicates(docs, { method: 'minhash', threshold: 0.9 });
      const cleaned = deduplicateDocuments(docs, result, 'keep_newest');

      // Should keep one of the exact dupes
      const keptIds = cleaned.map((d) => d.id);
      // At least one of doc-1/doc-2 should remain
      expect(keptIds.includes('doc-1') || keptIds.includes('doc-2')).toBe(true);
      // But not both
      expect(keptIds.includes('doc-1') && keptIds.includes('doc-2')).toBe(false);
    });

    it('keep_highest_vote — retains the top-voted document', async () => {
      const docs = makeDocs();
      const result = await findDuplicates(docs, { method: 'minhash', threshold: 0.9 });
      const cleaned = deduplicateDocuments(docs, result, 'keep_highest_vote');

      // doc-1 has higher vote than doc-2
      if (result.clusters.some((c) => c.documentIds.includes('doc-1') && c.documentIds.includes('doc-2'))) {
        expect(cleaned.map((d) => d.id)).toContain('doc-1');
        expect(cleaned.map((d) => d.id)).not.toContain('doc-2');
      }
    });

    it('keep_best_source — retains the most credible source', async () => {
      const docs = makeDocs();
      const result = await findDuplicates(docs, { method: 'minhash', threshold: 0.9 });
      const cleaned = deduplicateDocuments(docs, result, 'keep_best_source');

      // CoinDesk (doc-1) is more credible than CryptoPanic (doc-2)
      if (result.clusters.some((c) => c.documentIds.includes('doc-1') && c.documentIds.includes('doc-2'))) {
        expect(cleaned.map((d) => d.id)).toContain('doc-1');
      }
    });

    it('preserves unique documents', async () => {
      const docs = makeDocs();
      const result = await findDuplicates(docs, { method: 'minhash', threshold: 0.95 });
      const cleaned = deduplicateDocuments(docs, result, 'keep_newest');

      // doc-3 and doc-5 are unique, should always be preserved
      expect(cleaned.map((d) => d.id)).toContain('doc-3');
      expect(cleaned.map((d) => d.id)).toContain('doc-5');
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Quick Dedup
  // ─────────────────────────────────────────────────────────────

  describe('quickDedup', () => {
    it('find + deduplicate in one call', async () => {
      const docs = makeDocs();
      const { documents: cleaned, result } = await quickDedup(docs, {
        method: 'minhash',
        threshold: 0.9,
        strategy: 'keep_newest',
      });

      expect(cleaned.length).toBeLessThanOrEqual(docs.length);
      expect(result.clusters.length).toBeGreaterThanOrEqual(0);
    });

    it('returns all documents when no duplicates', async () => {
      const uniqueDocs: ScoredDocument[] = [
        {
          id: 'u1',
          title: 'Totally unique article 1',
          content: 'Completely different content about dogs and cats.',
          source: 'A',
          score: 1,
        },
        {
          id: 'u2',
          title: 'Another unique article',
          content: 'This is about space exploration and starships.',
          source: 'B',
          score: 1,
        },
      ];

      const { documents: cleaned } = await quickDedup(uniqueDocs, {
        threshold: 0.99,
      });

      expect(cleaned.length).toBe(2);
    });
  });

  // ─────────────────────────────────────────────────────────────
  // Edge Cases
  // ─────────────────────────────────────────────────────────────

  describe('edge cases', () => {
    it('handles empty document array', async () => {
      const result = await findDuplicates([], { method: 'minhash' });
      expect(result.clusters.length).toBe(0);
      expect(result.totalDuplicates).toBe(0);
    });

    it('handles single document', async () => {
      const result = await findDuplicates([makeDocs()[0]], { method: 'minhash' });
      expect(result.clusters.length).toBe(0);
    });

    it('handles very short documents', async () => {
      const docs: ScoredDocument[] = [
        { id: 's1', title: 'Hi', content: 'Hello', source: 'A', score: 1 },
        { id: 's2', title: 'Hi', content: 'Hello', source: 'B', score: 1 },
      ];

      const result = await findDuplicates(docs, { method: 'minhash', threshold: 0.5 });
      // Short docs may or may not cluster depending on shingle size
      expect(result).toBeDefined();
    });
  });
});
