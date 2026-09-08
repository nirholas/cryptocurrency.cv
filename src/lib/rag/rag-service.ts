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
 * RAG Service
 * 
 * Adapted from crypto-news-rag CryptoAIAssistService.java
 * Main service for Retrieval-Augmented Generation on crypto news.
 * 
 * Features:
 * - Natural language query processing
 * - Date range extraction
 * - Cryptocurrency mention extraction
 * - Vector similarity search
 * - Vote-based re-ranking
 * - Context-aware response generation
 */

import { callGroq } from '../groq';
import { vectorStore } from './vector-store';
import { generateEmbedding, getEmbeddingConfig } from './embedding-service';
import { extractCurrencies } from './currency-extractor';
import { extractDateRange } from './date-range-extractor';
import { rankForRAG, diversifyBySource } from './document-ranker';
import type { RAGQueryOptions, RAGResponse, SearchResult, SearchFilter } from './types';

// Default RAG configuration
const DEFAULT_OPTIONS: Required<RAGQueryOptions> = {
  topK: 10,
  similarityThreshold: 0.5,
  maxDocumentsForContext: 5,
  includeSources: true,
};

// Prompt template adapted from Java implementation
const RAG_PROMPT_TEMPLATE = `Context information is below.

---------------------
{context}
---------------------
Each news item includes a user sentiment score from -1 (strongly negative) to +1 (strongly positive), based on real user votes.

Given the context information and no prior knowledge, answer the query.

Instructions:
1. If the answer is not in the context, just say that you don't know.
2. Avoid statements like "Based on the context..." or "The provided information...".
3. At the end, list the URLs of the articles you relied on when forming your response. Ignore unrelated articles.
4. Be concise but comprehensive.

Query: {query}

Answer:`;

/**
 * Format documents into context string for the prompt
 */
function formatDocumentsForContext(results: SearchResult[]): string {
  return results.map(({ document, score }) => {
    const meta = document.metadata;
    return `Title: ${meta.title}
Description: ${document.content}
Url: ${meta.url}
Datetime: ${meta.pubDate}
Source: ${meta.source}
User Sentiment Score: ${meta.voteScore.toFixed(2)}
Relevance Score: ${score.toFixed(2)}`;
  }).join('\n\n');
}

/**
 * Main RAG query function
 */
export async function askRAG(
  userQuery: string,
  options: RAGQueryOptions = {}
): Promise<RAGResponse> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Extract filters from query
  const [dateRange, currencies] = await Promise.all([
    extractDateRange(userQuery),
    extractCurrencies(userQuery),
  ]);
  
  // Build search filter
  const filter: SearchFilter = {};
  if (dateRange) {
    filter.dateRange = dateRange;
  }
  if (currencies.length > 0) {
    // Cassandra limitation: only support single currency filter
    filter.currencies = currencies.slice(0, 1);
  }
  
  // Generate query embedding
  const embeddingConfig = getEmbeddingConfig();
  const queryEmbedding = await generateEmbedding(userQuery, embeddingConfig);
  
  // Search vector store
  const searchResults = await vectorStore.search(
    queryEmbedding,
    opts.topK,
    filter,
    opts.similarityThreshold
  );
  
  // Handle no results
  if (searchResults.length === 0) {
    return {
      answer: "I couldn't find any relevant news articles matching your query. Try broadening your search or asking about different time periods.",
      sources: [],
      extractedFilters: { dateRange: dateRange || undefined, currencies },
      processingTime: Date.now() - startTime,
    };
  }
  
  // Rank and select top documents
  const rankedResults = rankForRAG(searchResults, opts.topK, opts.maxDocumentsForContext);
  const diversifiedResults = diversifyBySource(rankedResults, 2, opts.maxDocumentsForContext);
  
  // Format context for prompt
  const context = formatDocumentsForContext(diversifiedResults);
  
  // Build and send prompt
  const prompt = RAG_PROMPT_TEMPLATE
    .replace('{context}', context)
    .replace('{query}', userQuery);
  
  const response = await callGroq([{ role: 'user', content: prompt }], {
    temperature: 0.3,
    maxTokens: 1024,
  });
  
  // Extract sources
  const sources = opts.includeSources ? diversifiedResults.map(r => ({
    title: r.document.metadata.title,
    url: r.document.metadata.url,
    pubDate: r.document.metadata.pubDate,
    source: r.document.metadata.source,
    voteScore: r.document.metadata.voteScore,
  })) : [];
  
  return {
    answer: response.content,
    sources,
    extractedFilters: {
      dateRange: dateRange || undefined,
      currencies,
    },
    processingTime: Date.now() - startTime,
  };
}

/**
 * Search without generating a response (for API use)
 */
export async function searchNews(
  query: string,
  options: {
    topK?: number;
    similarityThreshold?: number;
    dateRange?: { startDate: string; endDate: string };
    currencies?: string[];
  } = {}
): Promise<{
  results: SearchResult[];
  extractedFilters: {
    dateRange?: { startDate: string; endDate: string };
    currencies?: string[];
  };
}> {
  // Extract filters if not provided
  const dateRange = options.dateRange || await extractDateRange(query);
  const currencies = options.currencies || await extractCurrencies(query);
  
  // Build search filter
  const filter: SearchFilter = {};
  if (dateRange) {
    filter.dateRange = dateRange;
  }
  if (currencies.length > 0) {
    filter.currencies = currencies.slice(0, 1);
  }
  
  // Generate query embedding
  const queryEmbedding = await generateEmbedding(query);
  
  // Search
  const results = await vectorStore.search(
    queryEmbedding,
    options.topK || 10,
    filter,
    options.similarityThreshold || 0.5
  );
  
  return {
    results,
    extractedFilters: {
      dateRange: dateRange || undefined,
      currencies,
    },
  };
}

/**
 * Quick similarity search (no filter extraction)
 */
export async function quickSearch(
  query: string,
  topK: number = 10
): Promise<SearchResult[]> {
  const queryEmbedding = await generateEmbedding(query);
  return vectorStore.search(queryEmbedding, topK, undefined, 0.3);
}

/**
 * Get similar articles to a given article
 */
export async function getSimilarArticles(
  articleId: string,
  topK: number = 5
): Promise<SearchResult[]> {
  const article = await vectorStore.get(articleId);
  if (!article?.embedding) {
    return [];
  }
  
  const results = await vectorStore.search(article.embedding, topK + 1, undefined, 0.5);
  
  // Exclude the original article
  return results.filter(r => r.document.id !== articleId).slice(0, topK);
}

/**
 * Summarize recent news for a cryptocurrency
 */
export async function summarizeCryptoNews(
  cryptoCode: string,
  days: number = 7
): Promise<{
  summary: string;
  articleCount: number;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  sources: string[];
}> {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  
  const filter: SearchFilter = {
    dateRange: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    },
    currencies: [cryptoCode.toUpperCase()],
  };
  
  // Get all matching articles (use high topK)
  const queryEmbedding = await generateEmbedding(`${cryptoCode} news updates`);
  const results = await vectorStore.search(queryEmbedding, 50, filter, 0.3);
  
  if (results.length === 0) {
    return {
      summary: `No recent news found for ${cryptoCode} in the last ${days} days.`,
      articleCount: 0,
      sentiment: 'neutral',
      sources: [],
    };
  }
  
  // Calculate average sentiment
  const avgVoteScore = results.reduce((sum, r) => sum + r.document.metadata.voteScore, 0) / results.length;
  const sentiment: 'bullish' | 'bearish' | 'neutral' = 
    avgVoteScore > 0.2 ? 'bullish' : avgVoteScore < -0.2 ? 'bearish' : 'neutral';
  
  // Generate summary
  const context = results.slice(0, 10).map(r => 
    `- ${r.document.metadata.title} (${r.document.metadata.pubDate.split('T')[0]})`
  ).join('\n');
  
  const summaryPrompt = `Summarize the following ${cryptoCode} news headlines from the past ${days} days in 2-3 sentences:

${context}

Summary:`;

  const response = await callGroq([{ role: 'user', content: summaryPrompt }], {
    temperature: 0.3,
    maxTokens: 256,
  });
  
  return {
    summary: response.content,
    articleCount: results.length,
    sentiment,
    sources: [...new Set(results.map(r => r.document.metadata.source))],
  };
}
