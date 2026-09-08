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
 * Ultimate RAG Service
 *
 * The most advanced RAG service integrating ALL features:
 * - Intelligent query routing
 * - Self-RAG with adaptive retrieval
 * - Contextual compression
 * - Answer attribution with citations
 * - Confidence scoring
 * - Suggested follow-up questions
 * - Related articles
 * - Multi-layer caching
 * - Full observability & tracing
 * - Conversation memory
 * - Multi-hop reasoning
 *
 * Use this for production deployments requiring maximum capability.
 */

import { callGroq } from "../groq";
import { vectorStore } from "./vector-store";
import { redisVectorStore } from "./redis-vector-store";
import { hybridSearch } from "./hybrid-search";
import { generateEmbedding } from "./embedding-service";
import { extractCurrencies } from "./currency-extractor";
import { extractDateRange } from "./date-range-extractor";
import { processQuery, generateHypotheticalDocument } from "./query-processor";
import {
  rerankResults,
} from "./reranker";
import {
  contextualizeQuery,
  conversationMemory,
  generateContextualResponse,
} from "./conversation-memory";
import { agenticRAG } from "./agentic-rag";
import { gradeRetrievals } from "./self-rag";
import {
  assembleContext,
  type AssembledContext,
} from "./contextual-compression";
import {
  generateAttributedAnswer,
  formatCitationsForDisplay,
  type AttributedAnswer,
} from "./answer-attribution";
import { ragTracer, ragLogger, type RAGTrace } from "./observability";
import { ragCache } from "./cache";
import {
  generateSuggestedQuestions,
  type SuggestedQuestion,
} from "./suggested-questions";
import {
  ConfidenceScorer,
  type ConfidenceScore,
  formatConfidenceForUI,
  type ConfidenceScoringContext,
} from "./confidence-scorer";
import { routeQuery, type QueryRoute } from "./query-router";
import {
  findRelatedArticles,
  type RelatedArticle,
} from "./related-articles";
import { graphRAG } from "./graph-rag";
import { quickDedup } from "./deduplication";
import type {
  ScoredDocument,
  SearchFilter,
  SearchResult,
} from "./types";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface UltimateRAGOptions {
  // Core settings
  limit?: number;
  similarityThreshold?: number;

  // Feature toggles - all default to true
  useRouting?: boolean;
  useHybridSearch?: boolean;
  useHyDE?: boolean;
  useQueryDecomposition?: boolean;
  useAdvancedReranking?: boolean;
  useConversationMemory?: boolean;
  useSelfRAG?: boolean;
  useContextualCompression?: boolean;
  useAttributedAnswers?: boolean;
  useConfidenceScoring?: boolean;
  useSuggestedQuestions?: boolean;
  useRelatedArticles?: boolean;
  useGraphRAG?: boolean;
  useDeduplication?: boolean;
  useCaching?: boolean;
  useTracing?: boolean;

  // Conversation
  conversationId?: string;

  // Self-RAG options
  selfRAGOptions?: {
    minRetrievalScore?: number;
    maxIterations?: number;
    detectHallucinations?: boolean;
  };

  // Reranking options
  rerankOptions?: {
    useTimeDecay?: boolean;
    useSourceCredibility?: boolean;
    useLLMReranking?: boolean;
    diversifySources?: boolean;
  };

  // Compression options
  compressionOptions?: {
    maxTokens?: number;
    method?: "llm_compress" | "extract_sentences" | "extractive";
  };

  // Graph RAG options
  graphRAGOptions?: {
    maxHops?: number;
    fusionWeight?: number;
    useImpactPropagation?: boolean;
  };
}

// UI format for confidence score
interface ConfidenceUI {
  label: string;
  color: string;
  icon: string;
  percentage: number;
  tooltip: string;
}

// Topic cluster from related articles
interface TopicCluster {
  topic: string;
  documents: ScoredDocument[];
  relevance: number;
}

// RAG strategy type (matches RouteType from query-router)
type RAGStrategy =
  | "semantic"
  | "keyword"
  | "hybrid"
  | "agentic"
  | "direct"
  | "temporal"
  | "comparison"
  | "aggregation";

export interface UltimateRAGResponse {
  // Core response
  answer: string;

  // Sources and citations
  sources: Array<{
    title: string;
    url: string;
    pubDate: string;
    source: string;
    voteScore: number;
  }>;
  citations?: {
    claims: Array<{ claim: string; sourceIndex: number; quote?: string }>;
    footnotes: string[];
    bibliography: { index: number; title: string; url?: string }[];
  };

  // Confidence
  confidence?: ConfidenceScore;
  confidenceUI?: ConfidenceUI;

  // Follow-up
  suggestedQuestions?: SuggestedQuestion[];
  relatedArticles?: RelatedArticle[];
  topicClusters?: TopicCluster[];

  // Filters
  extractedFilters: {
    dateRange?: { startDate: string; endDate: string };
    currencies: string[];
  };

  // Metadata
  metadata: {
    queryIntent?: string;
    queryComplexity?: string;
    isFollowUp?: boolean;
    searchMethod?: string;
    routingStrategy?: RAGStrategy;
    reranked?: boolean;
    compressed?: boolean;
    documentsSearched?: number;
    documentsUsed?: number;
    conversationId?: string;
    selfRAGIterations?: number;
    cacheHit?: boolean;
    traceId?: string;
    graphEntities?: string[];
    graphRelationshipsTraversed?: number;
    deduplicatedCount?: number;
  };

  // Performance
  processingTime: number;
  timings?: {
    routing?: number;
    search?: number;
    reranking?: number;
    compression?: number;
    generation?: number;
    attribution?: number;
    confidence?: number;
    suggestions?: number;
    related?: number;
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

function toScoredDocuments(results: SearchResult[]): ScoredDocument[] {
  return results.map((r) => ({
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
// ULTIMATE RAG SERVICE CLASS
// ═══════════════════════════════════════════════════════════════

export class UltimateRAGService {
  private useRedis: boolean = false;
  private initialized: boolean = false;
  private confidenceScorer: ConfidenceScorer;

  constructor() {
    this.confidenceScorer = new ConfidenceScorer();
  }

  /**
   * Initialize the service
   */
  async initialize(options: { useRedis?: boolean } = {}): Promise<void> {
    if (this.initialized) return;

    if (options.useRedis) {
      try {
        const stats = await redisVectorStore.getStats();
        if (stats.totalDocuments > 0) {
          this.useRedis = true;
          ragLogger.info("Ultimate RAG: Using Redis vector store");
        }
      } catch {
        ragLogger.warn("Ultimate RAG: Redis not available, using file store");
      }
    }

    this.initialized = true;
  }

  private getStore() {
    return this.useRedis ? redisVectorStore : vectorStore;
  }

  /**
   * Main query method with all advanced features
   */
  async ask(
    query: string,
    options: UltimateRAGOptions = {},
  ): Promise<UltimateRAGResponse> {
    const startTime = Date.now();
    const timings: UltimateRAGResponse["timings"] = {};

    await this.initialize();

    // Destructure with defaults
    const {
      limit = 10,
      similarityThreshold = 0.5,
      useRouting = true,
      useHybridSearch = true,
      useHyDE = false,
      useQueryDecomposition = true,
      useAdvancedReranking = true,
      useConversationMemory = true,
      useSelfRAG = false, // Expensive, off by default
      useContextualCompression = true,
      useAttributedAnswers = true,
      useConfidenceScoring = true,
      useSuggestedQuestions = true,
      useRelatedArticles = true,
      useGraphRAG = false, // Off by default, opt-in for entity-relationship queries
      useDeduplication = true,
      useCaching = true,
      useTracing = true,
      conversationId,
      selfRAGOptions = {},
      rerankOptions = {},
      compressionOptions = {},
      graphRAGOptions = {},
    } = options;

    // ─────────────────────────────────────────────────────────────
    // TRACING
    // ─────────────────────────────────────────────────────────────
    let trace: RAGTrace | undefined;
    if (useTracing) {
      trace = ragTracer.startTrace(query);
      ragLogger.info("Query started", trace.id, { query, conversationId });
    }

    try {
      // ─────────────────────────────────────────────────────────────
      // CACHE CHECK
      // ─────────────────────────────────────────────────────────────
      if (useCaching) {
        const cacheSpan = trace
          ? ragTracer.startSpan(trace.id, "cache_check")
          : undefined;

        // Check semantic query cache
        const cachedResult = await ragCache.query.get(query, async () => {
          const emb = await generateEmbedding(query);
          return emb;
        });

        if (cachedResult) {
          ragLogger.info("Cache hit", trace?.id, {
            cacheType: cachedResult.type,
          });
          if (cacheSpan && trace) {
            ragTracer.endSpan(trace.id, cacheSpan.id, "success", {
              cacheHit: true,
            });
          }

          // Build response from cached entry
          const cachedResponse: UltimateRAGResponse = {
            answer: cachedResult.entry.answer,
            sources: cachedResult.entry.documents.map((d) => ({
              title: d.title,
              url: d.url || "",
              pubDate: d.publishedAt?.toISOString() || "",
              source: d.source,
              voteScore: d.voteScore || 0,
            })),
            extractedFilters: { currencies: [] },
            processingTime: Date.now() - startTime,
            metadata: {
              cacheHit: true,
              traceId: trace?.id,
            },
          };

          return cachedResponse;
        }

        if (cacheSpan && trace) {
          ragTracer.endSpan(trace.id, cacheSpan.id, "success", {
            cacheHit: false,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // QUERY ROUTING
      // ─────────────────────────────────────────────────────────────
      let route: QueryRoute | undefined;
      if (useRouting) {
        const routeStart = Date.now();
        const routeSpan = trace
          ? ragTracer.startSpan(trace.id, "routing")
          : undefined;

        route = await routeQuery(query);
        timings.routing = Date.now() - routeStart;

        if (routeSpan && trace) {
          ragTracer.endSpan(trace.id, routeSpan.id, "success", {
            route: route.primary,
            confidence: route.confidence,
          });
        }
        ragLogger.debug("Route determined", trace?.id, { route });

        // Apply route parameters
        if (route.parameters.topK) {
          options.limit = route.parameters.topK;
        }
      }

      // ─────────────────────────────────────────────────────────────
      // QUERY PROCESSING
      // ─────────────────────────────────────────────────────────────
      let processedQuery = query;
      const queryInfo: {
        intent?: string;
        complexity?: string;
        isFollowUp?: boolean;
      } = {};

      // Conversation context
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

      // HyDE
      let searchQuery = processedQuery;
      if (useHyDE) {
        searchQuery = await generateHypotheticalDocument(processedQuery);
      }

      // ─────────────────────────────────────────────────────────────
      // SEARCH
      // ─────────────────────────────────────────────────────────────
      const searchStart = Date.now();
      const searchSpan = trace
        ? ragTracer.startSpan(trace.id, "retrieval")
        : undefined;

      let searchResults: SearchResult[];
      const store = this.getStore();

      // Route to appropriate search strategy
      const searchMethod =
        route?.primary === "keyword"
          ? "bm25"
          : route?.primary === "semantic"
            ? "semantic"
            : useHybridSearch
              ? "hybrid"
              : "semantic";

      if (searchMethod === "hybrid") {
        searchResults = await hybridSearch(searchQuery, {
          topK: limit * 2,
          filter,
          fusionMethod: "rrf",
          semanticWeight: route?.parameters.semanticWeight ?? 0.7,
          similarityThreshold,
        });
      } else {
        const embedding = await generateEmbedding(searchQuery);
        searchResults = await store.search(
          embedding,
          limit * 2,
          filter,
          similarityThreshold,
        );
      }

      timings.search = Date.now() - searchStart;

      if (searchSpan && trace) {
        ragTracer.endSpan(trace.id, searchSpan.id, "success", {
          docsFound: searchResults.length,
          method: searchMethod,
        });
        ragTracer.updateMetrics(trace.id, {
          retrievalLatencyMs: timings.search,
          documentsRetrieved: searchResults.length,
        });
      }

      // ─────────────────────────────────────────────────────────────
      // HANDLE NO RESULTS
      // ─────────────────────────────────────────────────────────────
      if (searchResults.length === 0) {
        const noResultsResponse: UltimateRAGResponse = {
          answer:
            "I couldn't find any relevant news articles for your query. Try broadening your search or asking about a different time period.",
          sources: [],
          extractedFilters: { dateRange: dateRange || undefined, currencies },
          processingTime: Date.now() - startTime,
          metadata: {
            ...queryInfo,
            searchMethod,
            documentsSearched: 0,
            documentsUsed: 0,
            conversationId,
            traceId: trace?.id,
          },
          timings,
        };

        if (trace) {
          ragTracer.endTrace(trace.id, "success");
        }

        return noResultsResponse;
      }

      // ─────────────────────────────────────────────────────────────
      // RERANKING
      // ─────────────────────────────────────────────────────────────
      const rerankStart = Date.now();
      let rankedResults = searchResults;

      if (useAdvancedReranking) {
        const rerankSpan = trace
          ? ragTracer.startSpan(trace.id, "reranking")
          : undefined;

        rankedResults = await rerankResults(processedQuery, searchResults, {
          useTimeDecay: rerankOptions.useTimeDecay ?? true,
          useSourceCredibility: rerankOptions.useSourceCredibility ?? true,
          useLLM: rerankOptions.useLLMReranking ?? searchResults.length <= 10,
          useDiversity: rerankOptions.diversifySources ?? true,
          topK: limit,
        });

        timings.reranking = Date.now() - rerankStart;

        if (rerankSpan && trace) {
          ragTracer.endSpan(trace.id, rerankSpan.id, "success", {
            originalCount: searchResults.length,
            rerankCount: rankedResults.length,
          });
        }
      }

      let documents = toScoredDocuments(rankedResults);

      // ─────────────────────────────────────────────────────────────
      // GRAPH RAG (KNOWLEDGE GRAPH ENHANCED RETRIEVAL)
      // ─────────────────────────────────────────────────────────────
      let graphEntities: string[] | undefined;
      let graphRelationshipsTraversed: number | undefined;
      let entityContext = "";

      if (useGraphRAG) {
        const graphSpan = trace
          ? ragTracer.startSpan(trace.id, "graph_rag")
          : undefined;

        try {
          const graphResult = await graphRAG.search(processedQuery, {
            maxHops: graphRAGOptions.maxHops ?? 2,
            fusionWeight: graphRAGOptions.fusionWeight ?? 0.3,
            combineWithVector: true,
            useImpactPropagation: graphRAGOptions.useImpactPropagation ?? false,
            injectEntityContext: true,
            filter,
            limit: limit * 2,
            similarityThreshold,
          });

          if (graphResult.queryEntities.length > 0) {
            // Merge graph results with existing results
            const existingIds = new Set(documents.map((d) => d.id));
            const newGraphDocs = graphResult.documents.filter(
              (d) => !existingIds.has(d.id),
            );
            documents = [...documents, ...newGraphDocs];
            entityContext = graphResult.entityContext;
            graphEntities = graphResult.queryEntities.map((e) => e.name);
            graphRelationshipsTraversed =
              graphResult.metadata.relationshipsTraversed;
          }
        } catch (error) {
          ragLogger.warn(
            "GraphRAG search failed, continuing without graph",
            trace?.id,
            {
              error: String(error),
            },
          );
        }

        if (graphSpan && trace) {
          ragTracer.endSpan(trace.id, graphSpan.id, "success", {
            entities: graphEntities?.length ?? 0,
            relationships: graphRelationshipsTraversed ?? 0,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // DEDUPLICATION
      // ─────────────────────────────────────────────────────────────
      let deduplicatedCount: number | undefined;

      if (useDeduplication && documents.length > 1) {
        const dedupSpan = trace
          ? ragTracer.startSpan(trace.id, "deduplication")
          : undefined;
        const before = documents.length;

        try {
          const { documents: deduped } = await quickDedup(documents, {
            method: "minhash",
            threshold: 0.85,
            strategy: "keep_newest",
          });
          deduplicatedCount = before - deduped.length;
          documents = deduped;
        } catch (error) {
          ragLogger.warn(
            "Deduplication failed, continuing with original docs",
            trace?.id,
            {
              error: String(error),
            },
          );
        }

        if (dedupSpan && trace) {
          ragTracer.endSpan(trace.id, dedupSpan.id, "success", {
            before,
            after: documents.length,
            removed: deduplicatedCount ?? 0,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // SELF-RAG (ADAPTIVE RETRIEVAL)
      // ─────────────────────────────────────────────────────────────
      let selfRAGIterations = 0;

      if (useSelfRAG && route?.primary === "agentic") {
        const selfRAGSpan = trace
          ? ragTracer.startSpan(trace.id, "self_rag")
          : undefined;

        // Grade retrievals (threshold is the 3rd parameter)
        const graded = await gradeRetrievals(
          processedQuery,
          documents,
          selfRAGOptions.minRetrievalScore ?? 0.6,
        );

        // If not enough relevant docs, perform additional retrieval
        if (graded.needsMoreRetrieval) {
          const expanded = await this.expandSearch(
            processedQuery,
            documents,
            filter,
          );
          documents = [...graded.relevant, ...expanded].slice(0, limit);
          selfRAGIterations = 1;
        } else {
          documents = graded.relevant;
        }

        if (selfRAGSpan && trace) {
          ragTracer.endSpan(trace.id, selfRAGSpan.id, "success", {
            originalRelevant: graded.relevant.length,
            finalCount: documents.length,
            iterations: selfRAGIterations,
          });
        }
      }

      // Take top results
      const topResults = documents.slice(0, 5);

      // ─────────────────────────────────────────────────────────────
      // CONTEXTUAL COMPRESSION
      // ─────────────────────────────────────────────────────────────
      let context: string;
      let compressed = false;
      let assembledContext: AssembledContext | undefined;

      if (useContextualCompression) {
        const compressStart = Date.now();
        const compressSpan = trace
          ? ragTracer.startSpan(trace.id, "compression")
          : undefined;

        assembledContext = await assembleContext(
          processedQuery,
          topResults,
          compressionOptions.maxTokens ?? 4000,
        );
        context = assembledContext.text;
        compressed = true;

        timings.compression = Date.now() - compressStart;

        if (compressSpan && trace) {
          ragTracer.endSpan(trace.id, compressSpan.id, "success", {
            originalDocs: topResults.length,
            contextLength: context.length,
          });
        }
      } else {
        context = topResults
          .map((d, i) => {
            const date = d.publishedAt?.toLocaleDateString() || "unknown date";
            return `[${i + 1}] "${d.title}" (${d.source}, ${date})\n${d.content.substring(0, 600)}`;
          })
          .join("\n\n---\n\n");
      }

      // ─────────────────────────────────────────────────────────────
      // ANSWER GENERATION
      // ─────────────────────────────────────────────────────────────
      const genStart = Date.now();
      const genSpan = trace
        ? ragTracer.startSpan(trace.id, "generation")
        : undefined;

      // Prepend entity context from graph RAG if available
      if (entityContext && context) {
        context = `${entityContext}\n\n---\n\n${context}`;
      }

      let answer: string;
      let attributedAnswer: AttributedAnswer | undefined;

      if (useAttributedAnswers) {
        attributedAnswer = await generateAttributedAnswer(
          processedQuery,
          topResults,
        );
        answer = attributedAnswer.answer;
      } else if (useConversationMemory && conversationId) {
        answer = await generateContextualResponse(
          processedQuery,
          topResults,
          conversationId,
        );
      } else {
        answer = await this.generateAnswer(processedQuery, context);
      }

      timings.generation = Date.now() - genStart;

      if (genSpan && trace) {
        ragTracer.endSpan(trace.id, genSpan.id, "success", {
          answerLength: answer.length,
          attributed: !!attributedAnswer,
        });
        ragTracer.updateMetrics(trace.id, {
          generationLatencyMs: timings.generation,
        });
      }

      // Save to conversation memory
      if (useConversationMemory && conversationId) {
        await conversationMemory.addMessage(conversationId, {
          role: "user",
          content: query,
        });
        await conversationMemory.addMessage(conversationId, {
          role: "assistant",
          content: answer,
          metadata: {
            documentsUsed: topResults.map((d) => d.id),
            cryptosDiscussed: currencies,
          },
        });
      }

      // ─────────────────────────────────────────────────────────────
      // CONFIDENCE SCORING
      // ─────────────────────────────────────────────────────────────
      let confidence: ConfidenceScore | undefined;
      let confidenceUI: ConfidenceUI | undefined;

      if (useConfidenceScoring) {
        const confStart = Date.now();
        const confSpan = trace
          ? ragTracer.startSpan(trace.id, "confidence")
          : undefined;

        const context: ConfidenceScoringContext = {
          query: processedQuery,
          answer,
          documents: topResults,
        };
        confidence = await this.confidenceScorer.scoreConfidence(context);
        confidenceUI = formatConfidenceForUI(confidence);

        timings.confidence = Date.now() - confStart;

        if (confSpan && trace) {
          ragTracer.endSpan(trace.id, confSpan.id, "success", {
            overall: confidence.overall,
            level: confidence.level,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // SUGGESTED QUESTIONS
      // ─────────────────────────────────────────────────────────────
      let suggestedQuestions: SuggestedQuestion[] | undefined;

      if (useSuggestedQuestions) {
        const suggestStart = Date.now();
        const suggestSpan = trace
          ? ragTracer.startSpan(trace.id, "suggestions")
          : undefined;

        suggestedQuestions = await generateSuggestedQuestions(
          processedQuery,
          answer,
          topResults,
          3, // numQuestions
        );

        timings.suggestions = Date.now() - suggestStart;

        if (suggestSpan && trace) {
          ragTracer.endSpan(trace.id, suggestSpan.id, "success", {
            count: suggestedQuestions.length,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // RELATED ARTICLES
      // ─────────────────────────────────────────────────────────────
      let relatedArticles: RelatedArticle[] | undefined;
      let topicClusters: TopicCluster[] | undefined;

      if (useRelatedArticles) {
        const relatedStart = Date.now();
        const relatedSpan = trace
          ? ragTracer.startSpan(trace.id, "related")
          : undefined;

        // Get all documents for finding related
        const allResults = toScoredDocuments(searchResults);

        relatedArticles = findRelatedArticles(
          topResults,
          allResults,
          processedQuery,
          5, // maxArticles
        );

        // Simple topic clustering based on shared words
        const topicMap = new Map<string, ScoredDocument[]>();
        const allDocs = [
          ...topResults,
          ...relatedArticles.map((r) => r.document),
        ];
        for (const doc of allDocs) {
          const topic = doc.title.split(" ")[0].toLowerCase();
          if (!topicMap.has(topic)) topicMap.set(topic, []);
          topicMap.get(topic)!.push(doc);
        }
        topicClusters = Array.from(topicMap.entries())
          .filter(([_, docs]) => docs.length > 1)
          .map(([topic, documents]) => ({
            topic,
            documents,
            relevance:
              documents.reduce((acc, d) => acc + (d.score || 0), 0) /
              documents.length,
          }));

        timings.related = Date.now() - relatedStart;

        if (relatedSpan && trace) {
          ragTracer.endSpan(trace.id, relatedSpan.id, "success", {
            relatedCount: relatedArticles.length,
            topicCount: topicClusters?.length || 0,
          });
        }
      }

      // ─────────────────────────────────────────────────────────────
      // FORMAT CITATIONS
      // ─────────────────────────────────────────────────────────────
      let citations: UltimateRAGResponse["citations"];
      if (attributedAnswer) {
        const formatted = formatCitationsForDisplay(
          attributedAnswer,
          topResults,
        );
        citations = {
          claims: attributedAnswer.citations.map((c) => ({
            claim: c.claim,
            sourceIndex: c.sourceIndex,
            quote: c.quote,
          })),
          footnotes: formatted.footnotes,
          bibliography: formatted.bibliography,
        };
      }

      // ─────────────────────────────────────────────────────────────
      // BUILD RESPONSE
      // ─────────────────────────────────────────────────────────────
      const response: UltimateRAGResponse = {
        answer,
        sources: topResults.map((d) => ({
          title: d.title,
          url: d.url || "",
          pubDate: d.publishedAt?.toISOString() || "",
          source: d.source,
          voteScore: d.voteScore || 0,
        })),
        citations,
        confidence,
        confidenceUI,
        suggestedQuestions,
        relatedArticles,
        topicClusters,
        extractedFilters: {
          dateRange: dateRange || undefined,
          currencies,
        },
        processingTime: Date.now() - startTime,
        timings,
        metadata: {
          ...queryInfo,
          searchMethod,
          routingStrategy: route?.primary,
          reranked: useAdvancedReranking,
          compressed,
          documentsSearched: searchResults.length,
          documentsUsed: topResults.length,
          conversationId,
          selfRAGIterations:
            selfRAGIterations > 0 ? selfRAGIterations : undefined,
          cacheHit: false,
          traceId: trace?.id,
          graphEntities,
          graphRelationshipsTraversed,
          deduplicatedCount,
        },
      };

      // ─────────────────────────────────────────────────────────────
      // CACHE RESULT
      // ─────────────────────────────────────────────────────────────
      if (useCaching) {
        const embedding = await generateEmbedding(query);
        ragCache.query.set(
          query,
          embedding,
          response.answer,
          topResults,
          confidence?.overall ?? 0,
        );
      }

      // ─────────────────────────────────────────────────────────────
      // END TRACE
      // ─────────────────────────────────────────────────────────────
      if (trace) {
        ragTracer.updateMetrics(trace.id, {
          totalLatencyMs: response.processingTime,
          documentsUsed: topResults.length,
        });
        ragTracer.endTrace(trace.id, "success");
        ragLogger.info("Query completed", trace.id, {
          processingTime: response.processingTime,
          documentsUsed: topResults.length,
          confidence: confidence?.overall,
        });
      }

      return response;
    } catch (error) {
      if (trace) {
        ragTracer.endTrace(trace.id, "error", (error as Error).message);
        ragLogger.error("Query failed", trace.id, { error: String(error) });
      }
      throw error;
    }
  }

  /**
   * Multi-hop reasoning with full tracing
   */
  async askWithReasoning(
    query: string,
    options: UltimateRAGOptions & {
      maxIterations?: number;
      confidenceThreshold?: number;
    } = {},
  ): Promise<{
    answer: string;
    reasoning: Array<{ type: string; input: string; output: string }>;
    sources: ScoredDocument[];
    confidence: number;
    trace?: RAGTrace;
  }> {
    await this.initialize();

    const trace =
      options.useTracing !== false ? ragTracer.startTrace(query) : undefined;

    try {
      const result = await agenticRAG(
        query,
        {
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
        },
        options,
      );

      if (trace) {
        ragTracer.endTrace(trace.id, "success");
      }

      return {
        ...result,
        trace,
      };
    } catch (error) {
      if (trace) {
        ragTracer.endTrace(trace.id, "error", (error as Error).message);
      }
      throw error;
    }
  }

  /**
   * Get performance metrics
   */
  getMetrics(timeWindowMinutes: number = 60) {
    return ragTracer.getAggregatedMetrics(timeWindowMinutes);
  }

  /**
   * Get recent traces
   */
  getRecentTraces(limit: number = 100) {
    return ragTracer.getRecentTraces(limit);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return ragCache.getAllStats();
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    ragCache.clearAll();
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
    } = {},
  ): Promise<ScoredDocument[]> {
    await this.initialize();

    const { limit = 10, currencies, dateRange } = options;

    const [extractedDateRange, extractedCurrencies] = await Promise.all([
      dateRange ? Promise.resolve(dateRange) : extractDateRange(query),
      currencies || extractCurrencies(query),
    ]);

    const filter: SearchFilter = {};
    if (extractedDateRange) filter.dateRange = extractedDateRange;
    if (extractedCurrencies.length > 0)
      filter.currencies = extractedCurrencies.slice(0, 3);

    const embedding = await generateEmbedding(query);
    const store = this.getStore();
    const results = await store.search(embedding, limit, filter, 0.4);

    return toScoredDocuments(results);
  }

  /**
   * Expand search with query variations
   */
  private async expandSearch(
    query: string,
    existingDocs: ScoredDocument[],
    filter: SearchFilter,
  ): Promise<ScoredDocument[]> {
    const existingIds = new Set(existingDocs.map((d) => d.id));

    // Generate query expansion
    const expandedQuery = await this.generateQueryExpansion(query);

    const embedding = await generateEmbedding(expandedQuery);
    const store = this.getStore();
    const results = await store.search(embedding, 10, filter, 0.3);

    return toScoredDocuments(results).filter((d) => !existingIds.has(d.id));
  }

  private async generateQueryExpansion(query: string): Promise<string> {
    const response = await callGroq(
      [
        {
          role: "user",
          content: `Expand and rephrase this crypto news query to find more relevant results. Keep it focused.

Query: "${query}"

Expanded query:`,
        },
      ],
      { temperature: 0.3, maxTokens: 100 },
    );

    return response.content.trim() || query;
  }

  private async generateAnswer(
    query: string,
    context: string,
  ): Promise<string> {
    const response = await callGroq(
      [
        {
          role: "system",
          content: `You are a cryptocurrency news assistant. Answer questions based on the provided context.
Be concise but comprehensive. Cite sources by number [1], [2], etc. If information isn't in the context, say so.`,
        },
        {
          role: "user",
          content: `Context:\n${context}\n\nQuestion: ${query}\n\nAnswer:`,
        },
      ],
      { temperature: 0.4, maxTokens: 800 },
    );

    return response.content.trim();
  }
}

// ═══════════════════════════════════════════════════════════════
// SINGLETON
// ═══════════════════════════════════════════════════════════════

let _ultimateService: UltimateRAGService | null = null;

export function getUltimateRAGService(): UltimateRAGService {
  if (!_ultimateService) {
    _ultimateService = new UltimateRAGService();
  }
  return _ultimateService;
}

export const ultimateRAG = getUltimateRAGService();

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Quick RAG query with all features
 */
export async function askUltimate(
  query: string,
  options?: UltimateRAGOptions,
): Promise<UltimateRAGResponse> {
  return ultimateRAG.ask(query, options);
}

/**
 * Fast RAG query with minimal features (fastest response)
 */
export async function askFast(query: string): Promise<UltimateRAGResponse> {
  return ultimateRAG.ask(query, {
    useRouting: false,
    useSelfRAG: false,
    useContextualCompression: false,
    useAttributedAnswers: false,
    useConfidenceScoring: false,
    useSuggestedQuestions: false,
    useRelatedArticles: false,
    useTracing: false,
    useCaching: true,
  });
}

/**
 * High-quality RAG query with all features (slowest but most complete)
 */
export async function askComplete(
  query: string,
  conversationId?: string,
): Promise<UltimateRAGResponse> {
  return ultimateRAG.ask(query, {
    useRouting: true,
    useHybridSearch: true,
    useHyDE: true,
    useQueryDecomposition: true,
    useAdvancedReranking: true,
    useConversationMemory: !!conversationId,
    useSelfRAG: true,
    useContextualCompression: true,
    useAttributedAnswers: true,
    useConfidenceScoring: true,
    useSuggestedQuestions: true,
    useRelatedArticles: true,
    useGraphRAG: true,
    useDeduplication: true,
    useCaching: true,
    useTracing: true,
    conversationId,
    selfRAGOptions: {
      minRetrievalScore: 0.7,
      maxIterations: 3,
      detectHallucinations: true,
    },
    rerankOptions: {
      useTimeDecay: true,
      useSourceCredibility: true,
      useLLMReranking: true,
      diversifySources: true,
    },
  });
}
