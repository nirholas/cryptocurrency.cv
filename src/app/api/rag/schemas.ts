/**
 * RAG API Validation Schemas
 * 
 * Zod schemas for all RAG API request/response validation.
 * Single source of truth for API contracts.
 * 
 * @module api/rag/schemas
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════════════
// SHARED SCHEMAS
// ═══════════════════════════════════════════════════════════════

export const DateRangeSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD format'),
}).refine(
  (data) => new Date(data.startDate) <= new Date(data.endDate),
  { message: 'startDate must be before or equal to endDate' }
);

export const PaginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

// ═══════════════════════════════════════════════════════════════
// ASK ENDPOINT (POST /api/rag/ask)
// ═══════════════════════════════════════════════════════════════

export const AskRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(2000, 'Query too long (max 2000 chars)'),
  options: z.object({
    // Core settings
    limit: z.number().int().min(1).max(50).default(10).optional(),
    similarityThreshold: z.number().min(0).max(1).default(0.5).optional(),

    // Feature toggles
    useRouting: z.boolean().default(true).optional(),
    useHybridSearch: z.boolean().default(true).optional(),
    useHyDE: z.boolean().default(true).optional(),
    useQueryDecomposition: z.boolean().default(true).optional(),
    useAdvancedReranking: z.boolean().default(true).optional(),
    useConversationMemory: z.boolean().default(true).optional(),
    useSelfRAG: z.boolean().default(true).optional(),
    useContextualCompression: z.boolean().default(true).optional(),
    useAttributedAnswers: z.boolean().default(true).optional(),
    useConfidenceScoring: z.boolean().default(true).optional(),
    useSuggestedQuestions: z.boolean().default(true).optional(),
    useRelatedArticles: z.boolean().default(true).optional(),
    useCaching: z.boolean().default(true).optional(),
    useTracing: z.boolean().default(true).optional(),

    // Conversation
    conversationId: z.string().optional(),
  }).default({}).optional(),
});

export type AskRequest = z.infer<typeof AskRequestSchema>;

// ═══════════════════════════════════════════════════════════════
// SHARED HELPER: map AskRequest options → UltimateRAGOptions
// ═══════════════════════════════════════════════════════════════

import type { UltimateRAGOptions } from '@/lib/rag/ultimate-rag-service';

export function buildRagOptions(options: AskRequest['options']): UltimateRAGOptions {
  return {
    limit: options?.limit ?? 10,
    similarityThreshold: options?.similarityThreshold ?? 0.5,
    useRouting: options?.useRouting ?? true,
    useHybridSearch: options?.useHybridSearch ?? true,
    useHyDE: options?.useHyDE ?? true,
    useQueryDecomposition: options?.useQueryDecomposition ?? false,
    useAdvancedReranking: options?.useAdvancedReranking ?? true,
    useConversationMemory: options?.useConversationMemory ?? !!options?.conversationId,
    useSelfRAG: options?.useSelfRAG ?? false,
    useContextualCompression: options?.useContextualCompression ?? true,
    useAttributedAnswers: options?.useAttributedAnswers ?? true,
    useConfidenceScoring: options?.useConfidenceScoring ?? true,
    useSuggestedQuestions: options?.useSuggestedQuestions ?? true,
    useRelatedArticles: options?.useRelatedArticles ?? true,
    useCaching: options?.useCaching ?? true,
    useTracing: options?.useTracing ?? true,
    conversationId: options?.conversationId,
  };
}

// ═══════════════════════════════════════════════════════════════
// SEARCH ENDPOINT (POST /api/rag/search)
export const SearchRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(2000, 'Query too long (max 2000 chars)'),
  topK: z.number().int().min(1).max(100).default(10).optional(),
  similarityThreshold: z.number().min(0).max(1).default(0.5).optional(),
  dateRange: DateRangeSchema.optional(),
  currencies: z.array(z.string()).max(20).optional(),
  sources: z.array(z.string()).max(20).optional(),
  categories: z.array(z.string()).max(10).optional(),
});

export type SearchRequest = z.infer<typeof SearchRequestSchema>;

// ═══════════════════════════════════════════════════════════════
// STREAM ENDPOINT (POST /api/rag/stream)
// ═══════════════════════════════════════════════════════════════

export const StreamRequestSchema = z.object({
  query: z.string().min(1, 'Query is required').max(2000, 'Query too long (max 2000 chars)'),
  conversationId: z.string().optional(),
  options: z.object({
    useHyDE: z.boolean().default(true).optional(),
    useDecomposition: z.boolean().default(true).optional(),
    useExpansion: z.boolean().default(false).optional(),
    useMemory: z.boolean().default(true).optional(),
    useReranking: z.boolean().default(true).optional(),
    useSelfRAG: z.boolean().default(false).optional(),
    limit: z.number().int().min(1).max(50).default(10).optional(),
  }).default({}).optional(),
});

export type StreamRequest = z.infer<typeof StreamRequestSchema>;

// ═══════════════════════════════════════════════════════════════
// FEEDBACK ENDPOINT (POST /api/rag/feedback)
// ═══════════════════════════════════════════════════════════════

export const FeedbackRequestSchema = z.object({
  queryId: z.string().min(1, 'queryId is required'),
  rating: z.enum(['positive', 'negative']),
  category: z.enum(['accuracy', 'relevance', 'completeness', 'timeliness', 'other']).optional(),
  comment: z.string().max(1000, 'Comment too long (max 1000 chars)').optional(),
});

export type FeedbackRequest = z.infer<typeof FeedbackRequestSchema>;

// ═══════════════════════════════════════════════════════════════
// BATCH ENDPOINT (POST /api/rag/batch)
// ═══════════════════════════════════════════════════════════════

export const BatchRequestSchema = z.object({
  queries: z.array(
    z.string().min(1).max(2000)
  ).min(1, 'At least 1 query required').max(10, 'Maximum 10 queries per batch'),
  options: z.object({
    parallelism: z.number().int().min(1).max(5).default(3).optional(),
    shareContext: z.boolean().default(false).optional(),
    limit: z.number().int().min(1).max(50).default(10).optional(),
    similarityThreshold: z.number().min(0).max(1).default(0.5).optional(),
  }).default({}).optional(),
});

export type BatchRequest = z.infer<typeof BatchRequestSchema>;

// ═══════════════════════════════════════════════════════════════
// METRICS ENDPOINT (GET /api/rag/metrics)
// ═══════════════════════════════════════════════════════════════

export const MetricsQuerySchema = z.object({
  period: z.enum(['1h', '6h', '24h', '7d', '30d']).default('24h').optional(),
});

export type MetricsQuery = z.infer<typeof MetricsQuerySchema>;

// ═══════════════════════════════════════════════════════════════
// EVAL ENDPOINT (POST /api/rag/eval)
// ═══════════════════════════════════════════════════════════════

export const EvalRequestSchema = z.object({
  /** Inline test cases. If omitted, uses built-in ground truth set. */
  testCases: z.array(z.object({
    id: z.string().min(1),
    query: z.string().min(1).max(2000),
    expectedAnswer: z.string().max(5000).optional(),
    expectedDocIds: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  })).min(1).max(50).optional(),
  /** Evaluation config overrides */
  config: z.object({
    passThreshold: z.number().min(0).max(1).optional(),
    concurrency: z.number().int().min(1).max(5).optional(),
  }).optional(),
});

export type EvalRequest = z.infer<typeof EvalRequestSchema>;

// ═══════════════════════════════════════════════════════════════
// TIMELINE ENDPOINT (POST /api/rag/timeline)
// ═══════════════════════════════════════════════════════════════

export const TimelineRequestSchema = z.object({
  topic: z.string().min(1, 'Topic is required').max(500, 'Topic too long'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD').optional(),
  granularity: z.enum(['day', 'week', 'month']).default('week').optional(),
  maxEvents: z.number().int().min(1).max(100).default(30).optional(),
  minImportance: z.number().min(0).max(1).default(0.2).optional(),
});

export type TimelineRequest = z.infer<typeof TimelineRequestSchema>;

// ═══════════════════════════════════════════════════════════════
// PERSONALIZATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════

export const UpdatePreferencesSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
  preferences: z.object({
    interests: z.array(z.string().max(100)).max(30).optional(),
    sources: z.array(z.string().max(100)).max(20).optional(),
    readingLevel: z.enum(['beginner', 'intermediate', 'expert']).optional(),
    responseStyle: z.enum(['concise', 'detailed', 'technical', 'casual']).optional(),
    languages: z.array(z.string().max(5)).max(10).optional(),
    mutedTopics: z.array(z.string().max(100)).max(30).optional(),
  }),
});

export type UpdatePreferencesRequest = z.infer<typeof UpdatePreferencesSchema>;

export const UserIdSchema = z.object({
  userId: z.string().min(1, 'userId is required'),
});

// ═══════════════════════════════════════════════════════════════
// ENHANCED FEEDBACK ENDPOINT
// ═══════════════════════════════════════════════════════════════

export const EnhancedFeedbackRequestSchema = z.object({
  queryId: z.string().min(1, 'queryId is required'),
  query: z.string().min(1).max(2000),
  answer: z.string().min(1).max(10000),
  rating: z.enum(['positive', 'negative']),
  category: z.enum(['accuracy', 'relevance', 'completeness', 'timeliness', 'other']).optional(),
  comment: z.string().max(1000).optional(),
  sources: z.array(z.string()).max(50).optional(),
  confidence: z.number().min(0).max(1).optional(),
  experimentVariantId: z.string().optional(),
  userId: z.string().optional(),
});

export type EnhancedFeedbackRequest = z.infer<typeof EnhancedFeedbackRequestSchema>;

export const TrainingExportSchema = z.object({
  includeNegatives: z.boolean().default(true).optional(),
  limit: z.number().int().min(1).max(10000).default(5000).optional(),
  categories: z.array(z.enum(['accuracy', 'relevance', 'completeness', 'timeliness', 'other'])).optional(),
});

export type TrainingExportRequest = z.infer<typeof TrainingExportSchema>;

// ═══════════════════════════════════════════════════════════════
// ERROR RESPONSE
// ═══════════════════════════════════════════════════════════════

export interface APIErrorResponse {
  error: string;
  code?: string;
  details?: z.ZodIssue[];
  hint?: string;
}

/**
 * Format Zod validation errors into a clean API error response
 */
export function formatValidationError(error: z.ZodError): APIErrorResponse {
  return {
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: error.issues,
  };
}
