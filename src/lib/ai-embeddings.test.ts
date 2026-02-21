import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  cosineSimilarity,
  euclideanDistance,
  generateEmbedding,
  generateEmbeddings,
  semanticSearch,
} from './ai-embeddings';

// --------------------------------------------------------------------------
// Mock fetch
// --------------------------------------------------------------------------

const mockFetch = vi.fn();
global.fetch = mockFetch;

function embeddingResponse(vectors: number[][]): Response {
  const data = vectors.map((embedding, index) => ({ index, embedding, object: 'embedding' }));
  return new Response(JSON.stringify({ object: 'list', data, model: 'text-embedding-3-small', usage: { prompt_tokens: 8, total_tokens: 8 } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeVec(dim: number, ...values: [number, number][]): number[] {
  const vec = new Array<number>(dim).fill(0);
  for (const [i, v] of values) vec[i] = v;
  return vec;
}

// --------------------------------------------------------------------------

describe('ai-embeddings', () => {
  const originalApiKey = process.env.OPENAI_API_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (originalApiKey) {
      process.env.OPENAI_API_KEY = originalApiKey;
    } else {
      delete process.env.OPENAI_API_KEY;
    }
  });

  // ------------------------------------------------------------------------
  // Math utilities
  // ------------------------------------------------------------------------

  describe('cosineSimilarity', () => {
    it('returns 1 for identical vectors', () => {
      const v = [1, 2, 3];
      expect(cosineSimilarity(v, v)).toBeCloseTo(1);
    });

    it('returns -1 for opposite vectors', () => {
      const a = [1, 0];
      const b = [-1, 0];
      expect(cosineSimilarity(a, b)).toBeCloseTo(-1);
    });

    it('returns 0 for orthogonal vectors', () => {
      const a = [1, 0];
      const b = [0, 1];
      expect(cosineSimilarity(a, b)).toBeCloseTo(0);
    });

    it('returns 0 for zero vectors', () => {
      expect(cosineSimilarity([0, 0], [0, 0])).toBe(0);
    });

    it('throws when vector lengths differ', () => {
      expect(() => cosineSimilarity([1, 2], [1, 2, 3])).toThrow('Vector length mismatch');
    });
  });

  describe('euclideanDistance', () => {
    it('returns 0 for identical vectors', () => {
      expect(euclideanDistance([1, 2, 3], [1, 2, 3])).toBeCloseTo(0);
    });

    it('returns correct distance for known values', () => {
      // distance between [0,0] and [3,4] is 5
      expect(euclideanDistance([0, 0], [3, 4])).toBeCloseTo(5);
    });
  });

  // ------------------------------------------------------------------------
  // generateEmbedding — no API key (sparse fallback)
  // ------------------------------------------------------------------------

  describe('generateEmbedding (no API key)', () => {
    beforeEach(() => {
      delete process.env.OPENAI_API_KEY;
    });

    it('returns a vector of length 1024', async () => {
      const vec = await generateEmbedding('Bitcoin price rises');
      expect(vec).toHaveLength(1024);
    });

    it('returns a normalised vector', async () => {
      const vec = await generateEmbedding('Ethereum DeFi');
      const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
      expect(norm).toBeCloseTo(1, 5);
    });

    it('returns stable output for identical inputs', async () => {
      const a = await generateEmbedding('same text');
      const b = await generateEmbedding('same text');
      expect(a).toEqual(b);
    });

    it('returns different output for different inputs', async () => {
      const a = await generateEmbedding('bitcoin');
      const b = await generateEmbedding('ethereum defi protocol yield');
      expect(a).not.toEqual(b);
    });

    it('does not call fetch', async () => {
      await generateEmbedding('test');
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  // ------------------------------------------------------------------------
  // generateEmbedding — with API key
  // ------------------------------------------------------------------------

  describe('generateEmbedding (with API key)', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('calls OpenAI and returns the embedding', async () => {
      const fakeVec = new Array<number>(1536).fill(0.1);
      mockFetch.mockResolvedValueOnce(embeddingResponse([fakeVec]));

      const result = await generateEmbedding('Bitcoin ETF');
      expect(result).toEqual(fakeVec);
      expect(mockFetch).toHaveBeenCalledOnce();

      const [url, opts] = mockFetch.mock.calls[0];
      expect(url).toBe('https://api.openai.com/v1/embeddings');
      expect(JSON.parse(opts.body).input).toBe('Bitcoin ETF');
    });

    it('throws on non-OK API response', async () => {
      mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }));
      await expect(generateEmbedding('test')).rejects.toThrow('401');
    });
  });

  // ------------------------------------------------------------------------
  // generateEmbeddings — batch
  // ------------------------------------------------------------------------

  describe('generateEmbeddings (with API key)', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-key';
    });

    it('returns one vector per input', async () => {
      const fakeVecs = [new Array<number>(1536).fill(0.2), new Array<number>(1536).fill(0.3)];
      mockFetch.mockResolvedValueOnce(embeddingResponse(fakeVecs));

      const result = await generateEmbeddings(['text one', 'text two']);
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(fakeVecs[0]);
      expect(result[1]).toEqual(fakeVecs[1]);
    });
  });

  // ------------------------------------------------------------------------
  // semanticSearch
  // ------------------------------------------------------------------------

  describe('semanticSearch', () => {
    it('returns empty array when corpus is empty', async () => {
      const result = await semanticSearch('bitcoin', []);
      expect(result).toEqual([]);
    });

    it('ranks documents by cosine similarity (sparse fallback)', async () => {
      delete process.env.OPENAI_API_KEY;

      // Provide docs where one shares many tokens with the query
      const docs = [
        { id: 'a', text: 'totally unrelated text about cooking recipes' },
        { id: 'b', text: 'bitcoin price prediction market analysis bitcoin btc' },
        { id: 'c', text: 'ethereum defi protocol liquidity' },
      ];

      const results = await semanticSearch('bitcoin market analysis', docs, 3);
      expect(results).toHaveLength(3);
      // 'b' should score highest — most token overlap with query
      expect(results[0].id).toBe('b');
    });

    it('respects topK limit', async () => {
      delete process.env.OPENAI_API_KEY;

      const docs = Array.from({ length: 20 }, (_, i) => ({ id: String(i), text: `article ${i}` }));
      const results = await semanticSearch('bitcoin', docs, 5);
      expect(results.length).toBeLessThanOrEqual(5);
    });

    it('returns descending score order', async () => {
      delete process.env.OPENAI_API_KEY;

      const docs = [
        { id: '1', text: 'bitcoin bitcoin bitcoin bitcoin btc' },
        { id: '2', text: 'bitcoin price' },
        { id: '3', text: 'ethereum' },
      ];
      const results = await semanticSearch('bitcoin', docs, 3);
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });
  });
});
