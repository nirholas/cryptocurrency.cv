/**
 * RAG Chat Types
 * 
 * Type definitions for the RAG chat interface
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  sources?: Source[];
  confidence?: ConfidenceScore;
  suggestedQuestions?: SuggestedQuestion[];
  relatedArticles?: RelatedArticle[];
  queryIntent?: string;
  queryComplexity?: string;
  documentsSearched?: number;
  documentsUsed?: number;
  processingTime?: number;
  conversationId?: string;
  timings?: ProcessingTimings;
}

export interface Source {
  id: string;
  title: string;
  source: string;
  url?: string;
  publishedAt?: string | Date;
  score: number;
  snippet?: string;
}

export interface ConfidenceScore {
  overall: number;
  level: 'high' | 'medium' | 'low' | 'uncertain';
  dimensions?: {
    retrieval: number;
    generation: number;
    attribution: number;
    factual: number;
    temporal: number;
  };
  explanation?: string;
  warnings?: string[];
}

export interface SuggestedQuestion {
  question: string;
  type: 'expansion' | 'detail' | 'comparison' | 'impact' | 'timeline' | 'causal';
  relevance?: number;
}

export interface RelatedArticle {
  id: string;
  title: string;
  source: string;
  url?: string;
  similarity: number;
  relationship?: string;
}

export interface ProcessingTimings {
  routing?: number;
  search?: number;
  reranking?: number;
  compression?: number;
  generation?: number;
  confidence?: number;
  suggestions?: number;
  related?: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    messageCount: number;
    topics?: string[];
  };
}

export interface StreamEvent {
  event: 'start' | 'step' | 'query_info' | 'retrieval' | 'reranking' | 'token' | 'complete' | 'error';
  data: unknown;
}

export interface ChatSettings {
  streamingEnabled: boolean;
  showConfidence: boolean;
  showSources: boolean;
  showSuggestions: boolean;
  showTimings: boolean;
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
}

export const DEFAULT_CHAT_SETTINGS: ChatSettings = {
  streamingEnabled: true,
  showConfidence: true,
  showSources: true,
  showSuggestions: true,
  showTimings: false,
  theme: 'system',
  fontSize: 'medium',
};

export const SUGGESTED_QUERIES = [
  "What's the latest news on Bitcoin ETFs?",
  "Why is Ethereum moving today?",
  "What regulatory news came out this week?",
  "Summarize the crypto market sentiment",
  "Which DeFi protocols are trending?",
  "Any major hacks or exploits recently?",
  "What's happening with Solana?",
  "Bitcoin price analysis for this week",
];

export const CONFIDENCE_COLORS = {
  high: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', border: 'border-green-300 dark:border-green-700' },
  medium: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', border: 'border-yellow-300 dark:border-yellow-700' },
  low: { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-300 dark:border-orange-700' },
  uncertain: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', border: 'border-red-300 dark:border-red-700' },
};

export const CONFIDENCE_ICONS = {
  high: '✓',
  medium: '~',
  low: '!',
  uncertain: '?',
};
