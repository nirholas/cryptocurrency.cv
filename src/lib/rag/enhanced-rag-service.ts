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
 * Enhanced RAG Service
 * 
 * Production-ready RAG service that combines all advanced features:
 * - Hybrid search (BM25 + semantic)
 * - Advanced reranking
 * - Query processing & HyDE
 * - Conversation memory
 * - Multi-hop reasoning
 * 
 * This is the recommended service for production use.
 */

import { callGroq } from '../groq';
import { vectorStore, computeVoteScore } from './vector-store';
import { RedisVectorStore, redisVectorStore } from './redis-vector-store';
import { hybridSearch, HybridSearchOptions } from './hybrid-search';
import { generateEmbedding } from './embedding-service';
import { extractCurrencies } from './currency-extractor';
import { extractDateRange } from './date-range-extractor';
import { logger } from '@/lib/logger';
import { processQuery, generateHypotheticalDocument } from './query-processor';
import { rerankResults } from './reranker';
import { contextualizeQuery, conversationMemory, generateContextualResponse } from './conversation-memory';
import { agenticRAG, simpleMultiHop } from './agentic-rag';
import type {
  ScoredDocument,
  SearchFilter,
  SearchResult,
  RAGResponse,
  NewsDocument,
  RawNews,
} from './types';

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Convert SearchResult[] to ScoredDocument[]
 */
function toScoredDocuments(results: SearchResult[]): ScoredDocument[] {
  return results.map(r => ({
    id: r.document.id,
    title: r.document.metadata.title,
    content: r.document.content,
    publishedAt: new Date(r.document.metadata.pubDate),
    source: r.document.metadata.source,
    url: r.document.metadata.url,
    voteScore: r.document.metadata.voteScore,
    score: r.score,
  }));
}

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface EnhancedRAGOptions {
  // Search options
  limit?: number;
  similarityThreshold?: number;
  
  // Feature toggles
  useHybridSearch?: boolean;
  useHyDE?: boolean;
  useQueryDecomposition?: boolean;
  useAdvancedReranking?: boolean;
  useConversationMemory?: boolean;
  
  // Reranking options
  rerankOptions?: {
    useTimeDecay?: boolean;
    useSourceCredibility?: boolean;
    useLLMReranking?: boolean;
    diversifySources?: boolean;
  };
  
  // Conversation
  conversationId?: string;
}

export interface EnhancedRAGResponse extends RAGResponse {
  metadata: {
    queryIntent?: string;
    queryComplexity?: string;
    isFollowUp?: boolean;
    searchMethod?: string;
    reranked?: boolean;
    documentsSearched?: number;
    conversationId?: string;
  };
}

// ═══════════════════════════════════════════════════════════════
// ENHANCED RAG SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

export class EnhancedRAGService {
  private useRedis: boolean = false;
  private initialized: boolean = false;

  constructor() {}

  /**
   * Initialize the service with optional Redis backend
   */
  async initialize(options: { useRedis?: boolean } = {}): Promise<void> {
    if (this.initialized) return;

    if (options.useRedis) {
      try {
        const stats = await redisVectorStore.getStats();
        if (stats.totalDocuments > 0) {
          this.useRedis = true;
          logger.info('RAG: Using Redis vector store');
        }
      } catch {
        logger.warn('RAG: Redis not available, using file store');
      }
    }
    
    this.initialized = true;
  }

  /**
   * Get the appropriate vector store
   */
  private getStore() {
    return this.useRedis ? redisVectorStore : vectorStore;
  }

  /**
   * Main RAG query method with all advanced features
   */
  async ask(
    query: string,
    options: EnhancedRAGOptions = {}
  ): Promise<EnhancedRAGResponse> {
    const startTime = Date.now();
    await this.initialize();

    const {
      limit = 10,
      similarityThreshold = 0.5,
      useHybridSearch = true,
      useHyDE = false,
      useQueryDecomposition = true,
      useAdvancedReranking = true,
      useConversationMemory = true,
      rerankOptions = {},
      conversationId,
    } = options;

    // Process query
    let processedQuery = query;
    const queryInfo: { intent?: string; complexity?: string; isFollowUp?: boolean } = {};

    // Handle conversation context
    if (useConversationMemory && conversationId) {
      const contextualized = await contextualizeQuery(query, conversationId);
      if (contextualized.isFollowUp) {
        processedQuery = contextualized.contextualized;
        queryInfo.isFollowUp = true;
      }
    }

    // Query analysis
    if (useQueryDecomposition) {
      const analysis = await processQuery(processedQuery, {
        useHyDE: false,
        useDecomposition: true,
        useExpansion: false,
      });
      queryInfo.intent = analysis.classification.intent;
      queryInfo.complexity = analysis.classification.complexity;
    }

    // Extract filters
    const [dateRange, currencies] = await Promise.all([
      extractDateRange(processedQuery),
      extractCurrencies(processedQuery),
    ]);

    const filter: SearchFilter = {};
    if (dateRange) filter.dateRange = dateRange;
    if (currencies.length > 0) filter.currencies = currencies.slice(0, 3);

    // Generate search embeddings
    let searchQuery = processedQuery;
    if (useHyDE) {
      searchQuery = await generateHypotheticalDocument(processedQuery);
    }

    // Search
    let searchResults: SearchResult[];
    const store = this.getStore();

    if (useHybridSearch) {
      searchResults = await hybridSearch(searchQuery, {
        topK: limit * 2,
        filter,
        fusionMethod: 'rrf',
        semanticWeight: 0.7,
        similarityThreshold,
      });
    } else {
      const embedding = await generateEmbedding(searchQuery);
      searchResults = await store.search(embedding, limit * 2, filter, similarityThreshold);
    }

    // Convert to ScoredDocuments
    const results = toScoredDocuments(searchResults);

    // Handle no results
    if (results.length === 0) {
      return {
        answer: "I couldn't find any relevant news articles for your query. Try broadening your search or asking about a different time period.",
        sources: [],
        extractedFilters: { dateRange: dateRange || undefined, currencies },
        processingTime: Date.now() - startTime,
        metadata: {
          ...queryInfo,
          searchMethod: useHybridSearch ? 'hybrid' : 'semantic',
          documentsSearched: 0,
          conversationId,
        },
      };
    }

    // Rerank
    let rankedResults = searchResults;
    if (useAdvancedReranking) {
      rankedResults = await rerankResults(processedQuery, searchResults, {
        useTimeDecay: rerankOptions.useTimeDecay ?? true,
        useSourceCredibility: rerankOptions.useSourceCredibility ?? true,
        useLLM: rerankOptions.useLLMReranking ?? (searchResults.length <= 10),
        useDiversity: rerankOptions.diversifySources ?? true,
        topK: limit,
      });
    }

    // Convert reranked results to ScoredDocuments
    const rankedDocs = toScoredDocuments(rankedResults);

    // Take top results for context
    const topResults = rankedDocs.slice(0, 5);

    // Generate response
    let answer: string;
    if (useConversationMemory && conversationId) {
      answer = await generateContextualResponse(processedQuery, topResults, conversationId);
      
      // Save to memory
      await conversationMemory.addMessage(conversationId, {
        role: 'user',
        content: query,
      });
      await conversationMemory.addMessage(conversationId, {
        role: 'assistant',
        content: answer,
        metadata: {
          documentsUsed: topResults.map(d => d.id),
          cryptosDiscussed: currencies,
        },
      });
    } else {
      answer = await this.generateAnswer(processedQuery, topResults);
    }

    return {
      answer,
      sources: topResults.map(d => ({
        title: d.title,
        url: d.url || '',
        pubDate: d.publishedAt?.toISOString() || '',
        source: d.source,
        voteScore: d.voteScore || 0,
      })),
      extractedFilters: {
        dateRange: dateRange || undefined,
        currencies,
      },
      processingTime: Date.now() - startTime,
      metadata: {
        ...queryInfo,
        searchMethod: useHybridSearch ? 'hybrid' : 'semantic',
        reranked: useAdvancedReranking,
        documentsSearched: searchResults.length,
        conversationId,
      },
    };
  }

  /**
   * Multi-hop reasoning for complex queries
   */
  async askWithReasoning(
    query: string,
    options: {
      maxIterations?: number;
      confidenceThreshold?: number;
    } = {}
  ): Promise<{
    answer: string;
    reasoning: { type: string; input: string; output: string }[];
    sources: ScoredDocument[];
    confidence: number;
  }> {
    await this.initialize();

    const result = await agenticRAG(query, {
      search: async (q) => this.searchNews(q, { limit: 10 }),
      getDocument: async (id) => {
        const store = this.getStore();
        const doc = await store.get(id);
        if (!doc) return null;
        return {
          id: doc.id,
          title: doc.metadata.title,
          content: doc.content,
          publishedAt: new Date(doc.metadata.pubDate),
          source: doc.metadata.source,
          url: doc.metadata.url,
          voteScore: doc.metadata.voteScore,
          score: 1,
        };
      },
    }, options);

    return {
      answer: result.answer,
      reasoning: result.reasoning,
      sources: result.sources,
      confidence: result.confidence,
    };
  }

  /**
   * Simple multi-hop search
   */
  async multiHopSearch(
    query: string,
    hops: number = 2
  ): Promise<{ answer: string; sources: ScoredDocument[] }> {
    await this.initialize();

    return simpleMultiHop(
      query,
      (q) => this.searchNews(q, { limit: 5 }),
      hops
    );
  }

  /**
   * Search news articles
   */
  async searchNews(
    query: string,
    options: {
      limit?: number;
      currencies?: string[];
      dateRange?: { startDate: string; endDate: string };
    } = {}
  ): Promise<ScoredDocument[]> {
    await this.initialize();
    
    const { limit = 10, currencies, dateRange } = options;
    
    // Extract filters if not provided
    const [extractedDateRange, extractedCurrencies] = await Promise.all([
      dateRange ? Promise.resolve(dateRange) : extractDateRange(query),
      currencies || extractCurrencies(query),
    ]);

    const filter: SearchFilter = {};
    if (extractedDateRange) filter.dateRange = extractedDateRange;
    if (extractedCurrencies.length > 0) filter.currencies = extractedCurrencies.slice(0, 3);

    const embedding = await generateEmbedding(query);
    const store = this.getStore();
    const results = await store.search(embedding, limit, filter, 0.4);

    return toScoredDocuments(results);
  }

  /**
   * Get similar articles
   */
  async getSimilarArticles(articleId: string, limit: number = 5): Promise<ScoredDocument[]> {
    await this.initialize();
    
    const store = this.getStore();
    const article = await store.get(articleId);
    
    if (!article?.embedding) return [];
    
    const results = await store.search(article.embedding, limit + 1, undefined, 0.5);
    
    return toScoredDocuments(results)
      .filter(r => r.id !== articleId)
      .slice(0, limit);
  }

  /**
   * Ingest news articles
   */
  async ingestNews(articles: RawNews[]): Promise<number> {
    await this.initialize();
    
    const store = this.getStore();
    let ingested = 0;

    for (const article of articles) {
      const id = article.id || `news-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
      const content = article.title + (article.description ? '\n' + article.description : '');
      const embedding = await generateEmbedding(content);

      const voteUp = article.votes?.positive || 0;
      const voteDown = article.votes?.negative || 0;

      const doc: NewsDocument = {
        id,
        content,
        embedding,
        metadata: {
          title: article.title,
          description: article.description || '',
          url: article.link,
          pubDate: article.pubDate || new Date().toISOString(),
          source: article.source || 'unknown',
          sourceKey: article.sourceKey,
          category: article.category,
          currencies: article.currencies,
          voteUp,
          voteDown,
          voteScore: computeVoteScore(voteUp, voteDown),
        },
      };

      await store.add(doc);
      ingested++;
    }

    return ingested;
  }

  /**
   * Get store statistics
   */
  async getStats() {
    await this.initialize();
    return this.getStore().getStats();
  }

  /**
   * Generate answer from documents
   */
  private async generateAnswer(query: string, documents: ScoredDocument[]): Promise<string> {
    const context = documents
      .map((d, i) => {
        const date = d.publishedAt?.toLocaleDateString() || 'unknown date';
        return `[${i + 1}] "${d.title}" (${d.source}, ${date})
${d.content.substring(0, 600)}`;
      })
      .join('\n\n---\n\n');

    const prompt = `You are a cryptocurrency news assistant. Based on the following news articles, answer the question.

Question: ${query}

News Articles:
${context}

Instructions:
- Be concise but comprehensive
- Cite sources by number [1], [2], etc.
- If information isn't in the articles, say so
- Avoid phrases like "Based on the provided information..."

Answer:`;

    const response = await callGroq([{ role: 'user', content: prompt }], {
      temperature: 0.4,
      maxTokens: 800,
    });

    return response.content.trim();
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON & FACTORY
// ═══════════════════════════════════════════════════════════════

// Global singleton instance
let _ragService: EnhancedRAGService | null = null;

/**
 * Get the singleton RAG service instance
 */
export function createRAGService(): EnhancedRAGService {
  if (!_ragService) {
    _ragService = new EnhancedRAGService();
  }
  return _ragService;
}

/**
 * Convenience export for singleton
 */
export const ragService = createRAGService();
