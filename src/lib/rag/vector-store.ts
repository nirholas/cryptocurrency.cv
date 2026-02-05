/**
 * Vector Store
 * 
 * Adapted from crypto-news-rag CassandraConfiguration.java
 * In-memory vector store with file persistence for crypto news embeddings.
 * 
 * For production, consider using:
 * - Vercel KV (already in dependencies)
 * - Upstash Redis (already in dependencies)
 * - Pinecone
 * - Weaviate
 * - Astra DB (Cassandra)
 * 
 * This implementation provides a simple file-based solution that works
 * without external dependencies.
 */

import { promises as fs } from 'fs';
import path from 'path';
import type { NewsDocument, NewsMetadata, SearchFilter, SearchResult, VectorStoreStats } from './types';
import { cosineSimilarity, dotProduct, normalizeVector } from './embedding-service';

// Store path
const STORE_PATH = process.env.RAG_STORE_PATH || '.data/rag-store';

interface VectorStoreData {
  version: number;
  documents: NewsDocument[];
  metadata: {
    lastUpdated: string;
    embeddingModel: string;
    dimensions: number;
  };
}

/**
 * In-memory vector store with file persistence
 */
class VectorStore {
  private documents: Map<string, NewsDocument> = new Map();
  private isLoaded = false;
  private dimensions = 384;
  private embeddingModel = 'sentence-transformers/all-MiniLM-L6-v2';

  /**
   * Ensure store is loaded from disk
   */
  private async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    
    try {
      await this.load();
    } catch {
      // Store doesn't exist yet, start fresh
      this.documents = new Map();
    }
    this.isLoaded = true;
  }

  /**
   * Load store from disk
   */
  async load(): Promise<void> {
    const filePath = path.join(STORE_PATH, 'documents.json');
    const data = await fs.readFile(filePath, 'utf-8');
    const parsed: VectorStoreData = JSON.parse(data);
    
    this.documents = new Map(
      parsed.documents.map(doc => [doc.id, doc])
    );
    this.dimensions = parsed.metadata.dimensions;
    this.embeddingModel = parsed.metadata.embeddingModel;
    this.isLoaded = true;
    
    console.log(`Loaded ${this.documents.size} documents from vector store`);
  }

  /**
   * Save store to disk
   */
  async save(): Promise<void> {
    await fs.mkdir(STORE_PATH, { recursive: true });
    
    const data: VectorStoreData = {
      version: 1,
      documents: Array.from(this.documents.values()),
      metadata: {
        lastUpdated: new Date().toISOString(),
        embeddingModel: this.embeddingModel,
        dimensions: this.dimensions,
      },
    };
    
    const filePath = path.join(STORE_PATH, 'documents.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    
    console.log(`Saved ${this.documents.size} documents to vector store`);
  }

  /**
   * Add a document to the store
   */
  async add(document: NewsDocument): Promise<void> {
    await this.ensureLoaded();
    
    if (!document.embedding || document.embedding.length === 0) {
      throw new Error('Document must have an embedding');
    }
    
    // Normalize embedding for dot product similarity
    document.embedding = normalizeVector(document.embedding);
    this.documents.set(document.id, document);
  }

  /**
   * Add multiple documents to the store
   */
  async addBatch(documents: NewsDocument[]): Promise<void> {
    await this.ensureLoaded();
    
    for (const doc of documents) {
      if (!doc.embedding || doc.embedding.length === 0) {
        console.warn(`Skipping document ${doc.id} - no embedding`);
        continue;
      }
      doc.embedding = normalizeVector(doc.embedding);
      this.documents.set(doc.id, doc);
    }
  }

  /**
   * Get a document by ID
   */
  async get(id: string): Promise<NewsDocument | null> {
    await this.ensureLoaded();
    return this.documents.get(id) || null;
  }

  /**
   * Delete a document by ID
   */
  async delete(id: string): Promise<boolean> {
    await this.ensureLoaded();
    return this.documents.delete(id);
  }

  /**
   * Search for similar documents
   */
  async search(
    queryEmbedding: number[],
    topK: number = 10,
    filter?: SearchFilter,
    similarityThreshold: number = 0.7
  ): Promise<SearchResult[]> {
    await this.ensureLoaded();
    
    // Normalize query embedding
    const normalizedQuery = normalizeVector(queryEmbedding);
    
    // Score all documents
    const results: SearchResult[] = [];
    
    for (const document of this.documents.values()) {
      // Apply filters
      if (filter && !this.matchesFilter(document, filter)) {
        continue;
      }
      
      if (!document.embedding) continue;
      
      // Calculate similarity using dot product (since vectors are normalized)
      const score = dotProduct(normalizedQuery, document.embedding);
      
      if (score >= similarityThreshold) {
        results.push({ document, score });
      }
    }
    
    // Sort by score descending and take top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, topK);
  }

  /**
   * Check if document matches filter
   */
  private matchesFilter(document: NewsDocument, filter: SearchFilter): boolean {
    const meta = document.metadata;
    
    // Date range filter
    if (filter.dateRange) {
      const pubDate = meta.pubDate.split('T')[0];
      if (pubDate < filter.dateRange.startDate || pubDate > filter.dateRange.endDate) {
        return false;
      }
    }
    
    // Currency filter
    if (filter.currencies && filter.currencies.length > 0) {
      const docCurrencies = meta.currencies || [];
      const hasMatchingCurrency = filter.currencies.some(c => 
        docCurrencies.includes(c.toUpperCase())
      );
      if (!hasMatchingCurrency) {
        return false;
      }
    }
    
    // Source filter
    if (filter.sources && filter.sources.length > 0) {
      if (!filter.sources.includes(meta.source) && !filter.sources.includes(meta.sourceKey || '')) {
        return false;
      }
    }
    
    // Category filter
    if (filter.categories && filter.categories.length > 0) {
      if (!filter.categories.includes(meta.category || '')) {
        return false;
      }
    }
    
    // Vote score filter
    if (filter.minVoteScore !== undefined) {
      if (Math.abs(meta.voteScore) < filter.minVoteScore) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get all documents (for debugging/export)
   */
  async getAll(): Promise<NewsDocument[]> {
    await this.ensureLoaded();
    return Array.from(this.documents.values());
  }

  /**
   * Get store statistics
   */
  async getStats(): Promise<VectorStoreStats> {
    await this.ensureLoaded();
    
    const documents = Array.from(this.documents.values());
    const sources = new Set<string>();
    const categories = new Set<string>();
    let earliestDate = '';
    let latestDate = '';
    
    for (const doc of documents) {
      sources.add(doc.metadata.source);
      const category = doc.metadata.category;
      if (category) categories.add(category);
      
      const pubDate = doc.metadata.pubDate.split('T')[0];
      if (!earliestDate || pubDate < earliestDate) earliestDate = pubDate;
      if (!latestDate || pubDate > latestDate) latestDate = pubDate;
    }
    
    return {
      totalDocuments: documents.length,
      dateRange: {
        earliest: earliestDate,
        latest: latestDate,
      },
      sources: Array.from(sources),
      categories: Array.from(categories),
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Clear all documents
   */
  async clear(): Promise<void> {
    this.documents = new Map();
    try {
      await fs.rm(STORE_PATH, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  }

  /**
   * Check if store has documents
   */
  async isEmpty(): Promise<boolean> {
    await this.ensureLoaded();
    return this.documents.size === 0;
  }

  /**
   * Get document count
   */
  async count(): Promise<number> {
    await this.ensureLoaded();
    return this.documents.size;
  }
}

// Singleton instance
export const vectorStore = new VectorStore();

/**
 * Utility function to compute weighted vote score
 * Adapted from RawNews.computeWeightedScore() in Java
 */
export function computeVoteScore(positiveVotes: number, negativeVotes: number, k: number = 1): number {
  const totalVotes = positiveVotes + negativeVotes;
  
  if (totalVotes === 0) return 0;
  
  const rawScore = (positiveVotes - negativeVotes) / totalVotes;
  const confidence = 1 - Math.exp(-totalVotes / k);
  
  return rawScore * confidence;
}
