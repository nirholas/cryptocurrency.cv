/**
 * RAG System - Main Exports
 * 
 * Production-grade Retrieval-Augmented Generation for crypto news.
 * Adapted from https://github.com/soheilrahsaz/crypto-news-rag
 * 
 * Core Features:
 * - Multi-tier vector storage (file, Redis)
 * - Hybrid search (BM25 + semantic)
 * - Advanced reranking (LLM, cross-encoder, MMR)
 * - Query decomposition & HyDE
 * - Multi-turn conversation memory
 * - Agentic multi-hop reasoning
 * - Streaming responses
 * 
 * Advanced Features (Ultimate RAG Service):
 * - Self-RAG with adaptive retrieval
 * - Contextual compression
 * - Answer attribution with citations
 * - Confidence scoring
 * - Suggested follow-up questions
 * - Related articles discovery
 * - Full observability & tracing
 * - Multi-layer semantic caching
 * 
 * Usage:
 * ```typescript
 * // Simple usage
 * import { askRAG } from '@/lib/rag';
 * const response = await askRAG("What happened to Bitcoin last week?");
 * 
 * // Ultimate service (all features)
 * import { askUltimate, askFast, askComplete } from '@/lib/rag';
 * const result = await askUltimate(query);
 * const fast = await askFast(query);           // Speed optimized
 * const complete = await askComplete(query);   // All features
 * ```
 */

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type {
  RawNews,
  NewsDocument,
  NewsMetadata,
  ScoredDocument,
  DateRange,
  SearchFilter,
  SearchResult,
  RAGQueryOptions,
  RAGResponse,
  EmbeddingConfig,
  VectorStoreStats,
} from './types';

// ═══════════════════════════════════════════════════════════════
// CORE RAG SERVICE
// ═══════════════════════════════════════════════════════════════

export {
  askRAG,
  searchNews,
  quickSearch,
  getSimilarArticles,
  summarizeCryptoNews,
} from './rag-service';

// Enhanced service with all features
export { ragService, createRAGService } from './enhanced-rag-service';

// Ultimate service - full production system with all features
export {
  UltimateRAGService,
  ultimateRAG,
  getUltimateRAGService,
  askUltimate,
  askFast,
  askComplete,
} from './ultimate-rag-service';

export type {
  UltimateRAGOptions,
  UltimateRAGResponse,
} from './ultimate-rag-service';

// ═══════════════════════════════════════════════════════════════
// VECTOR STORES
// ═══════════════════════════════════════════════════════════════

// File-based (development/small datasets)
export { vectorStore, computeVoteScore } from './vector-store';

// Redis-backed (production)
export { 
  RedisVectorStore, 
  redisVectorStore 
} from './redis-vector-store';

// ═══════════════════════════════════════════════════════════════
// SEARCH & RETRIEVAL
// ═══════════════════════════════════════════════════════════════

// Hybrid search (BM25 + semantic)
export {
  hybridSearch,
  keywordSearch,
  searchWithExpansion,
} from './hybrid-search';

export type { HybridSearchOptions } from './hybrid-search';

// Reranking
export {
  timeDecay,
  applyTimeDecay,
  getSourceCredibility,
  applySourceCredibility,
  rerankResults,
  mmrRerank,
  llmRerank,
  crossEncoderRerank,
  diversifyBySources,
  SOURCE_CREDIBILITY,
} from './reranker';

export type { RerankerOptions } from './reranker';

// ═══════════════════════════════════════════════════════════════
// QUERY PROCESSING
// ═══════════════════════════════════════════════════════════════

// Query understanding
export {
  classifyQuery,
  decomposeQuery,
  expandQuery,
  generateHypotheticalDocument,
  generateHypotheticalDocuments,
  reformulateQuery,
  processQuery,
} from './query-processor';

export type {
  QueryIntent,
  QueryClassification,
  SubQuery,
  DecomposedQuery,
  ExpandedQuery,
  ProcessedQuery,
} from './query-processor';

// ═══════════════════════════════════════════════════════════════
// CONVERSATION & CONTEXT
// ═══════════════════════════════════════════════════════════════

export {
  conversationMemory,
  contextualizeQuery,
  generateContextualResponse,
  generateConversationId,
  exportConversation,
} from './conversation-memory';

export type {
  ConversationMessage,
  ConversationContext,
  ContextualizedQuery,
} from './conversation-memory';

// ═══════════════════════════════════════════════════════════════
// AGENTIC RAG
// ═══════════════════════════════════════════════════════════════

export {
  agenticRAG,
  simpleMultiHop,
} from './agentic-rag';

export type {
  ReasoningStep,
  AgenticResponse,
  AgentTools,
} from './agentic-rag';

// ═══════════════════════════════════════════════════════════════
// STREAMING
// ═══════════════════════════════════════════════════════════════

export {
  streamRAG,
  createRAGStreamHandler,
} from './streaming-client';

export type {
  StreamEvent,
  RAGStreamCallbacks,
} from './streaming-client';

// ═══════════════════════════════════════════════════════════════
// EMBEDDINGS
// ═══════════════════════════════════════════════════════════════

export {
  generateEmbedding,
  generateEmbeddings,
  getEmbeddingConfig,
  normalizeVector,
  dotProduct,
  cosineSimilarity,
} from './embedding-service';

// ═══════════════════════════════════════════════════════════════
// EXTRACTORS
// ═══════════════════════════════════════════════════════════════

export {
  extractCurrencies,
  extractCurrenciesWithLLM,
  extractCurrenciesStatic,
  extractCurrenciesSync,
  convertToCodes,
} from './currency-extractor';

export {
  extractDateRange,
  extractDateRangeWithDefaults,
  parseSimpleDateExpression,
} from './date-range-extractor';

// ═══════════════════════════════════════════════════════════════
// RANKERS (Legacy)
// ═══════════════════════════════════════════════════════════════

export {
  rankByVoteScore,
  rankByRecency,
  rankBySimilarity,
  rankCombined,
  diversifyBySource,
  rankForRAG,
} from './document-ranker';

// ═══════════════════════════════════════════════════════════════
// REFERENCE DATA
// ═══════════════════════════════════════════════════════════════

export {
  KNOWN_CRYPTOS,
  NAME_TO_CODE,
  VALID_CODES,
  CRYPTO_ALIASES,
  normalizeToCode,
} from './known-cryptos';

// ═══════════════════════════════════════════════════════════════
// SELF-RAG (Adaptive Retrieval)
// ═══════════════════════════════════════════════════════════════

export {
  gradeRetrieval,
  gradeRetrievals,
  generateWithReflection,
  detectHallucinations,
  decideRetrievalAction,
  selfRAG,
} from './self-rag';

export type {
  RetrievalGrade,
  GenerationResult,
  HallucinationCheck,
  RetrievalAction,
  SelfRAGResult,
} from './self-rag';

// ═══════════════════════════════════════════════════════════════
// CONTEXTUAL COMPRESSION
// ═══════════════════════════════════════════════════════════════

export {
  extractRelevantSentences,
  compressDocument,
  compressDocuments,
  extractKeyFacts,
  assembleContext,
} from './contextual-compression';

export type {
  CompressedDocument,
  ExtractedSentence,
  KeyFact,
  AssembledContext,
} from './contextual-compression';

// ═══════════════════════════════════════════════════════════════
// ANSWER ATTRIBUTION
// ═══════════════════════════════════════════════════════════════

export {
  extractClaims,
  findSupportingQuote,
  generateAttributedAnswer,
  generateSourceHighlights,
  formatCitationsForDisplay,
} from './answer-attribution';

export type {
  AttributedAnswer,
  Citation,
  SourceHighlight,
} from './answer-attribution';

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY & TRACING
// ═══════════════════════════════════════════════════════════════

export {
  ragTracer,
  ragLogger,
  withSpan,
  estimateTokens,
  estimateCost,
} from './observability';

export type {
  RAGSpan,
  SpanEvent,
  RAGTrace,
  RAGMetrics,
  AggregatedMetrics,
  RAGLogEntry,
} from './observability';

// ═══════════════════════════════════════════════════════════════
// INTELLIGENT CACHING
// ═══════════════════════════════════════════════════════════════

export {
  ragCache,
  EmbeddingCache,
  SemanticQueryCache,
  LLMResponseCache,
  DocumentCache,
  RAGCacheManager,
} from './cache';

export type {
  CacheEntry,
  CacheStats,
  QueryCacheEntry,
  EmbeddingCacheEntry,
} from './cache';

// ═══════════════════════════════════════════════════════════════
// SUGGESTED QUESTIONS
// ═══════════════════════════════════════════════════════════════

export {
  SuggestedQuestionsGenerator,
  getSuggestedQuestionsGenerator,
  generateSuggestedQuestions,
} from './suggested-questions';

export type {
  SuggestedQuestion,
  QuestionGenerationContext,
  QuestionGenerationConfig,
} from './suggested-questions';

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE SCORING
// ═══════════════════════════════════════════════════════════════

export {
  ConfidenceScorer,
  getConfidenceScorer,
  scoreAnswerConfidence,
  formatConfidenceForUI,
} from './confidence-scorer';

export type {
  ConfidenceScore,
  ConfidenceScoringContext,
  ConfidenceScoringConfig,
} from './confidence-scorer';

// ═══════════════════════════════════════════════════════════════
// QUERY ROUTING
// ═══════════════════════════════════════════════════════════════

export {
  QueryRouter,
  getQueryRouter,
  routeQuery,
} from './query-router';

export type {
  RouteType,
  QueryRoute,
  RouteParameters,
  RouterConfig,
} from './query-router';

// ═══════════════════════════════════════════════════════════════
// RELATED ARTICLES
// ═══════════════════════════════════════════════════════════════

export {
  RelatedArticlesFinder,
  relatedArticlesFinder,
  findRelatedArticles,
} from './related-articles';

export type {
  RelatedArticle,
  RelatedArticlesConfig,
} from './related-articles';
