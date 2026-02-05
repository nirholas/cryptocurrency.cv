/**
 * Redis Vector Store
 * 
 * Production-ready vector store using Redis with sorted sets.
 * Falls back to memory if Redis unavailable.
 * 
 * Uses Redis for:
 * - Document storage (HSET)
 * - Embedding storage (compressed binary)
 * - Metadata indexes (sorted sets)
 */

import { redisGet, redisSet, redisDel, redisClient, isRedisAvailable } from '../redis';
import { aiCache } from '../cache';
import type { NewsDocument, NewsMetadata, SearchFilter, SearchResult, VectorStoreStats } from './types';
import { normalizeVector, dotProduct } from './embedding-service';

// Keys
const DOCS_KEY = 'rag:docs';
const EMBEDDINGS_KEY = 'rag:embeddings';
const INDEX_BY_DATE = 'rag:idx:date';
const INDEX_BY_SOURCE = 'rag:idx:source:';
const INDEX_BY_CURRENCY = 'rag:idx:currency:';
const STATS_KEY = 'rag:stats';

/**
 * Compress embedding to base64 for storage
 */
function compressEmbedding(embedding: number[]): string {
  const buffer = new Float32Array(embedding);
  return Buffer.from(buffer.buffer).toString('base64');
}

/**
 * Decompress embedding from base64
 */
function decompressEmbedding(compressed: string): number[] {
  const buffer = Buffer.from(compressed, 'base64');
  const float32 = new Float32Array(buffer.buffer, buffer.byteOffset, buffer.length / 4);
  return Array.from(float32);
}

/**
 * In-memory fallback store
 */
class MemoryVectorStore {
  private documents = new Map<string, NewsDocument>();

  async add(doc: NewsDocument): Promise<void> {
    if (doc.embedding) {
      doc.embedding = normalizeVector(doc.embedding);
    }
    this.documents.set(doc.id, doc);
  }

  async addBatch(docs: NewsDocument[]): Promise<void> {
    for (const doc of docs) {
      await this.add(doc);
    }
  }

  async get(id: string): Promise<NewsDocument | null> {
    return this.documents.get(id) || null;
  }

  async delete(id: string): Promise<boolean> {
    return this.documents.delete(id);
  }

  async search(
    queryEmbedding: number[],
    topK: number,
    filter?: SearchFilter,
    threshold: number = 0.5
  ): Promise<SearchResult[]> {
    const normalizedQuery = normalizeVector(queryEmbedding);
    const results: SearchResult[] = [];

    for (const doc of this.documents.values()) {
      if (!doc.embedding) continue;
      if (filter && !this.matchesFilter(doc, filter)) continue;

      const score = dotProduct(normalizedQuery, doc.embedding);
      if (score >= threshold) {
        results.push({ document: doc, score });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topK);
  }

  private matchesFilter(doc: NewsDocument, filter: SearchFilter): boolean {
    const meta = doc.metadata;
    if (filter.dateRange) {
      const pubDate = meta.pubDate.split('T')[0];
      if (pubDate < filter.dateRange.startDate || pubDate > filter.dateRange.endDate) {
        return false;
      }
    }
    if (filter.currencies?.length) {
      if (!filter.currencies.some(c => (meta.currencies || []).includes(c.toUpperCase()))) {
        return false;
      }
    }
    if (filter.sources?.length) {
      if (!filter.sources.includes(meta.source) && !filter.sources.includes(meta.sourceKey || '')) {
        return false;
      }
    }
    return true;
  }

  async getStats(): Promise<VectorStoreStats> {
    const docs = Array.from(this.documents.values());
    const sources = new Set<string>();
    const categories = new Set<string>();
    let earliest = '', latest = '';

    for (const doc of docs) {
      sources.add(doc.metadata.source);
      if (doc.metadata.category) categories.add(doc.metadata.category);
      const date = doc.metadata.pubDate.split('T')[0];
      if (!earliest || date < earliest) earliest = date;
      if (!latest || date > latest) latest = date;
    }

    return {
      totalDocuments: docs.length,
      dateRange: { earliest, latest },
      sources: Array.from(sources),
      categories: Array.from(categories),
      lastUpdated: new Date().toISOString(),
    };
  }

  async count(): Promise<number> {
    return this.documents.size;
  }

  async clear(): Promise<void> {
    this.documents.clear();
  }
}

// Memory fallback instance
const memoryStore = new MemoryVectorStore();

/**
 * Redis Vector Store Implementation
 */
export class RedisVectorStore {
  /**
   * Add document to store
   */
  async add(doc: NewsDocument): Promise<void> {
    if (!isRedisAvailable()) {
      return memoryStore.add(doc);
    }

    const client = redisClient();
    if (!client) {
      return memoryStore.add(doc);
    }

    try {
      // Normalize and compress embedding
      if (doc.embedding) {
        doc.embedding = normalizeVector(doc.embedding);
      }

      // Store document metadata
      const docData = {
        id: doc.id,
        content: doc.content,
        ...doc.metadata,
        currencies: JSON.stringify(doc.metadata.currencies),
      };
      await client.hSet(`${DOCS_KEY}:${doc.id}`, docData);

      // Store embedding separately (compressed)
      if (doc.embedding) {
        await client.set(`${EMBEDDINGS_KEY}:${doc.id}`, compressEmbedding(doc.embedding));
      }

      // Add to date index
      const timestamp = new Date(doc.metadata.pubDate).getTime();
      await client.zAdd(INDEX_BY_DATE, { score: timestamp, value: doc.id });

      // Add to source index
      await client.sAdd(`${INDEX_BY_SOURCE}${doc.metadata.sourceKey || 'unknown'}`, doc.id);

      // Add to currency indexes
      for (const currency of doc.metadata.currencies || []) {
        await client.sAdd(`${INDEX_BY_CURRENCY}${currency}`, doc.id);
      }
    } catch (error) {
      console.error('Redis add error:', error);
      return memoryStore.add(doc);
    }
  }

  /**
   * Add multiple documents
   */
  async addBatch(docs: NewsDocument[]): Promise<void> {
    // Use pipeline for efficiency
    if (!isRedisAvailable()) {
      return memoryStore.addBatch(docs);
    }

    for (const doc of docs) {
      await this.add(doc);
    }
  }

  /**
   * Get document by ID
   */
  async get(id: string): Promise<NewsDocument | null> {
    if (!isRedisAvailable()) {
      return memoryStore.get(id);
    }

    const client = redisClient();
    if (!client) return null;

    try {
      const data = await client.hGetAll(`${DOCS_KEY}:${id}`);
      if (!data || !data.id) return null;

      const embedding = await client.get(`${EMBEDDINGS_KEY}:${id}`);

      return {
        id: data.id,
        content: data.content,
        embedding: embedding ? decompressEmbedding(embedding) : undefined,
        metadata: {
          title: data.title,
          pubDate: data.pubDate,
          url: data.url,
          source: data.source,
          sourceKey: data.sourceKey,
          category: data.category,
          currencies: JSON.parse(data.currencies || '[]'),
          voteScore: parseFloat(data.voteScore || '0'),
        },
      };
    } catch (error) {
      console.error('Redis get error:', error);
      return memoryStore.get(id);
    }
  }

  /**
   * Search with filters
   */
  async search(
    queryEmbedding: number[],
    topK: number = 10,
    filter?: SearchFilter,
    threshold: number = 0.5
  ): Promise<SearchResult[]> {
    if (!isRedisAvailable()) {
      return memoryStore.search(queryEmbedding, topK, filter, threshold);
    }

    const client = redisClient();
    if (!client) {
      return memoryStore.search(queryEmbedding, topK, filter, threshold);
    }

    try {
      const normalizedQuery = normalizeVector(queryEmbedding);
      
      // Get candidate document IDs based on filters
      let candidateIds: string[] = [];

      if (filter?.dateRange) {
        const startTs = new Date(filter.dateRange.startDate).getTime();
        const endTs = new Date(filter.dateRange.endDate + 'T23:59:59Z').getTime();
        candidateIds = await client.zRangeByScore(INDEX_BY_DATE, startTs, endTs);
      } else {
        // Get recent documents (last 10000)
        candidateIds = await client.zRange(INDEX_BY_DATE, -10000, -1);
      }

      // Filter by currency if specified
      if (filter?.currencies?.length && candidateIds.length > 0) {
        const currencyIds = new Set<string>();
        for (const currency of filter.currencies) {
          const ids = await client.sMembers(`${INDEX_BY_CURRENCY}${currency}`);
          ids.forEach((id: string) => currencyIds.add(id));
        }
        candidateIds = candidateIds.filter(id => currencyIds.has(id));
      }

      // Filter by source if specified
      if (filter?.sources?.length && candidateIds.length > 0) {
        const sourceIds = new Set<string>();
        for (const source of filter.sources) {
          const ids = await client.sMembers(`${INDEX_BY_SOURCE}${source}`);
          ids.forEach((id: string) => sourceIds.add(id));
        }
        candidateIds = candidateIds.filter((id: string) => sourceIds.has(id));
      }

      // Score candidates
      const results: SearchResult[] = [];
      
      // Batch fetch embeddings
      for (const id of candidateIds.slice(0, 1000)) { // Limit for performance
        const embedding = await client.get(`${EMBEDDINGS_KEY}:${id}`);
        if (!embedding) continue;

        const docEmbedding = decompressEmbedding(embedding);
        const score = dotProduct(normalizedQuery, docEmbedding);

        if (score >= threshold) {
          const doc = await this.get(id);
          if (doc) {
            results.push({ document: doc, score });
          }
        }
      }

      return results.sort((a, b) => b.score - a.score).slice(0, topK);
    } catch (error) {
      console.error('Redis search error:', error);
      return memoryStore.search(queryEmbedding, topK, filter, threshold);
    }
  }

  /**
   * Delete document
   */
  async delete(id: string): Promise<boolean> {
    if (!isRedisAvailable()) {
      return memoryStore.delete(id);
    }

    const client = redisClient();
    if (!client) return false;

    try {
      await client.del(`${DOCS_KEY}:${id}`);
      await client.del(`${EMBEDDINGS_KEY}:${id}`);
      await client.zRem(INDEX_BY_DATE, id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get store statistics
   */
  async getStats(): Promise<VectorStoreStats> {
    if (!isRedisAvailable()) {
      return memoryStore.getStats();
    }

    const client = redisClient();
    if (!client) {
      return memoryStore.getStats();
    }

    try {
      const count = await client.zCard(INDEX_BY_DATE);
      const earliest = await client.zRange(INDEX_BY_DATE, 0, 0);
      const latest = await client.zRange(INDEX_BY_DATE, -1, -1);

      // Get unique sources
      const sourceKeys = await client.keys(`${INDEX_BY_SOURCE}*`);
      const sources = sourceKeys.map((k: string) => k.replace(INDEX_BY_SOURCE, ''));

      return {
        totalDocuments: count,
        dateRange: {
          earliest: earliest[0] ? (await this.get(earliest[0]))?.metadata.pubDate.split('T')[0] || '' : '',
          latest: latest[0] ? (await this.get(latest[0]))?.metadata.pubDate.split('T')[0] || '' : '',
        },
        sources,
        categories: [],
        lastUpdated: new Date().toISOString(),
      };
    } catch {
      return memoryStore.getStats();
    }
  }

  /**
   * Get document count
   */
  async count(): Promise<number> {
    if (!isRedisAvailable()) {
      return memoryStore.count();
    }

    const client = redisClient();
    if (!client) return 0;

    try {
      return await client.zCard(INDEX_BY_DATE);
    } catch {
      return memoryStore.count();
    }
  }

  /**
   * Check if store is empty
   */
  async isEmpty(): Promise<boolean> {
    return (await this.count()) === 0;
  }

  /**
   * Clear all data
   */
  async clear(): Promise<void> {
    if (!isRedisAvailable()) {
      return memoryStore.clear();
    }

    const client = redisClient();
    if (!client) return;

    try {
      const keys = await client.keys('rag:*');
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch {
      // Ignore
    }
    
    await memoryStore.clear();
  }

  /**
   * Save to disk (no-op for Redis, kept for compatibility)
   */
  async save(): Promise<void> {
    // Redis persists automatically
  }
}

// Singleton instance
export const redisVectorStore = new RedisVectorStore();
