/**
 * API Route: RAG Streaming
 * POST /api/rag/stream
 * 
 * Server-Sent Events endpoint for streaming RAG responses
 * with real-time updates on reasoning steps
 */

import { NextRequest } from 'next/server';
import { ragService, createRAGService } from '@/lib/rag';
import { processQuery } from '@/lib/rag/query-processor';
import { contextualizeQuery, conversationMemory, generateConversationId } from '@/lib/rag/conversation-memory';
import { rerankResults } from '@/lib/rag/reranker';
import { callGroq, streamGroq } from '@/lib/groq';
import type { ScoredDocument, SearchResult, NewsDocument } from '@/lib/rag/types';

// Convert ScoredDocument to SearchResult format
function toSearchResults(docs: ScoredDocument[]): SearchResult[] {
  return docs.map(doc => ({
    document: {
      id: doc.id,
      content: doc.content,
      metadata: {
        title: doc.title,
        pubDate: doc.publishedAt?.toISOString() || new Date().toISOString(),
        url: doc.url || '',
        source: doc.source,
        sourceKey: doc.source.toLowerCase().replace(/[^a-z0-9]/g, ''),
        voteScore: doc.voteScore || 0,
        ...(doc.metadata as Record<string, unknown> || {}),
      },
    } as NewsDocument,
    score: doc.score,
  }));
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// SSE Helper
function createSSEStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;

  const stream = new ReadableStream({
    start(c) {
      controller = c;
    },
  });

  const send = (event: string, data: unknown) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(encoder.encode(message));
  };

  const close = () => {
    controller.close();
  };

  return { stream, send, close };
}

export async function POST(request: NextRequest) {
  const { query, conversationId, options = {} } = await request.json();

  if (!query || typeof query !== 'string') {
    return new Response(
      JSON.stringify({ error: 'Query is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { stream, send, close } = createSSEStream();

  // Process in background
  (async () => {
    try {
      const convId = conversationId || generateConversationId();
      send('start', { conversationId: convId, timestamp: Date.now() });

      // Step 1: Query Processing
      send('step', { type: 'processing', message: 'Understanding your question...' });
      
      const [processedQuery, contextualizedQuery] = await Promise.all([
        processQuery(query, {
          useHyDE: options.useHyDE ?? true,
          useDecomposition: options.useDecomposition ?? true,
          useExpansion: options.useExpansion ?? false,
        }),
        contextualizeQuery(query, convId),
      ]);

      send('query_info', {
        original: query,
        contextualized: contextualizedQuery.isFollowUp ? contextualizedQuery.contextualized : query,
        intent: processedQuery.classification.intent,
        complexity: processedQuery.classification.complexity,
        isFollowUp: contextualizedQuery.isFollowUp,
      });

      // Step 2: Retrieval
      send('step', { type: 'searching', message: 'Searching news archives...' });
      
      const service = ragService || createRAGService();
      const searchQuery = contextualizedQuery.isFollowUp 
        ? contextualizedQuery.contextualized 
        : query;
      
      const searchResults = await service.searchNews(searchQuery, {
        limit: 15,
        currencies: processedQuery.classification.entities,
      });

      send('retrieval', {
        documentsFound: searchResults.length,
        topSources: searchResults.slice(0, 3).map(d => ({
          id: d.id,
          title: d.title,
          source: d.source,
          score: d.score,
        })),
      });

      // Step 3: Reranking
      if (searchResults.length > 0) {
        send('step', { type: 'reranking', message: 'Analyzing relevance...' });
        
        const rerankedResults = await rerankResults(searchQuery, toSearchResults(searchResults), {
          useTimeDecay: true,
          useSourceCredibility: true,
          useLLM: searchResults.length <= 10,
          useDiversity: true,
        });

        send('reranking', {
          reranked: rerankedResults.slice(0, 5).map(d => ({
            id: d.document.id,
            title: d.document.metadata.title,
            score: d.score,
          })),
        });

        // Step 4: Generate Answer (Streaming)
        send('step', { type: 'generating', message: 'Generating response...' });

        const context = buildContext(rerankedResults.slice(0, 5));
        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt(searchQuery, context);

        // Stream the LLM response
        let fullResponse = '';
        
        try {
          // Try streaming if available
          const streamResponse = await streamGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ], {
            temperature: 0.4,
            maxTokens: 800,
          });

          for await (const chunk of streamResponse) {
            fullResponse += chunk;
            send('token', { content: chunk });
          }
        } catch {
          // Fallback to regular call
          const response = await callGroq([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ], {
            temperature: 0.4,
            maxTokens: 800,
          });
          fullResponse = response.content;
          send('token', { content: fullResponse });
        }

        // Save to conversation memory
        await conversationMemory.addMessage(convId, {
          role: 'user',
          content: query,
        });
        await conversationMemory.addMessage(convId, {
          role: 'assistant',
          content: fullResponse,
          metadata: {
            documentsUsed: rerankedResults.slice(0, 5).map(d => d.document.id),
            cryptosDiscussed: processedQuery.classification.entities,
          },
        });

        // Final response with confidence and suggestions
        const confidence = calculateConfidence(rerankedResults.slice(0, 5), fullResponse, processedQuery);
        const followUpSuggestions = generateFollowUpSuggestions(query, fullResponse, processedQuery.classification);

        send('complete', {
          answer: fullResponse,
          sources: rerankedResults.slice(0, 5).map(d => ({
            id: d.document.id,
            title: d.document.metadata.title,
            source: d.document.metadata.source,
            url: d.document.metadata.url,
            publishedAt: d.document.metadata.pubDate,
            score: d.score,
            snippet: d.document.content.substring(0, 200),
          })),
          confidence,
          suggestions: followUpSuggestions,
          relatedArticles: rerankedResults.slice(5, 9).map(d => ({
            id: d.document.id,
            title: d.document.metadata.title,
            source: d.document.metadata.source,
            url: d.document.metadata.url,
            publishedAt: d.document.metadata.pubDate,
            relevanceScore: d.score,
          })),
          metadata: {
            conversationId: convId,
            queryIntent: processedQuery.classification.intent,
            documentsSearched: searchResults.length,
            processingSteps: 4,
          },
        });
      } else {
        send('complete', {
          answer: "I couldn't find any relevant news articles for your question. Try rephrasing or asking about a different topic.",
          sources: [],
          metadata: {
            conversationId: convId,
            documentsSearched: 0,
          },
        });
      }
    } catch (error) {
      send('error', {
        message: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      close();
    }
  })();

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

function buildContext(results: SearchResult[]): string {
  return results
    .map((r, i) => {
      const d = r.document;
      const meta = d.metadata;
      const date = meta.pubDate ? new Date(meta.pubDate).toLocaleDateString() : 'unknown date';
      return `[${i + 1}] "${meta.title}" (${meta.source}, ${date})
${d.content.substring(0, 600)}${d.content.length > 600 ? '...' : ''}`;
    })
    .join('\n\n---\n\n');
}

function buildSystemPrompt(): string {
  return `You are a knowledgeable cryptocurrency news assistant. Your role is to answer questions about crypto based on recent news articles provided to you.

Guidelines:
- Be concise but thorough
- Cite sources by number [1], [2], etc. when referencing specific articles
- If information is uncertain or conflicting, acknowledge it
- Stay factual and avoid speculation
- If the articles don't contain relevant information, say so honestly`;
}

function buildUserPrompt(query: string, context: string): string {
  return `Based on the following news articles, please answer this question:

Question: ${query}

News Articles:
${context}

Please provide a comprehensive answer based on these articles:`;
}

/**
 * Calculate confidence score based on multiple factors
 */
function calculateConfidence(
  results: SearchResult[],
  response: string,
  processedQuery: { classification: { intent: string; complexity: string } }
): {
  overall: number;
  level: 'high' | 'medium' | 'low' | 'uncertain';
  factors: {
    sourceQuality: number;
    relevance: number;
    recency: number;
    consistency: number;
  };
  warnings?: string[];
} {
  const warnings: string[] = [];
  
  // Source quality: average score of top documents
  const avgScore = results.length > 0 
    ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
    : 0;
  const sourceQuality = Math.min(avgScore * 1.2, 1);
  
  // Relevance: based on how many high-scoring docs we have
  const highScoringDocs = results.filter(r => r.score > 0.7).length;
  const relevance = Math.min(highScoringDocs / 3, 1);
  
  // Recency: check how fresh the sources are
  const now = new Date();
  const recencyScores = results.map(r => {
    const d = r.document;
    const pubDateStr = d.metadata?.pubDate;
    if (!pubDateStr) return 0.5;
    const pubDate = new Date(pubDateStr);
    const daysDiff = (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff < 1) return 1;
    if (daysDiff < 7) return 0.9;
    if (daysDiff < 30) return 0.7;
    if (daysDiff < 90) return 0.5;
    return 0.3;
  });
  const recency: number = recencyScores.length > 0 
    ? recencyScores.reduce((a, b) => a + b, 0) / recencyScores.length 
    : 0.5;
  
  // Consistency: check if response length is reasonable for the query
  const responseLength = response.length;
  let consistency = 0.8;
  if (responseLength < 100) {
    consistency = 0.5;
    warnings.push('Response is quite brief');
  } else if (responseLength > 2000) {
    consistency = 0.7;
  }
  
  // Check for uncertainty phrases
  const uncertaintyPhrases = ['i\'m not sure', 'unclear', 'couldn\'t find', 'no information', 'uncertain'];
  const hasUncertainty = uncertaintyPhrases.some(phrase => 
    response.toLowerCase().includes(phrase)
  );
  if (hasUncertainty) {
    consistency -= 0.2;
    warnings.push('Response expresses uncertainty');
  }
  
  // Calculate overall score (weighted average)
  const overall = (sourceQuality * 0.35 + relevance * 0.3 + recency * 0.2 + consistency * 0.15);
  
  // Add warnings based on factors
  if (sourceQuality < 0.5) warnings.push('Source relevance is limited');
  if (recency < 0.5) warnings.push('Information may be outdated');
  if (results.length < 2) warnings.push('Limited source coverage');
  
  // Determine level
  let level: 'high' | 'medium' | 'low' | 'uncertain';
  if (overall >= 0.75) level = 'high';
  else if (overall >= 0.5) level = 'medium';
  else if (overall >= 0.25) level = 'low';
  else level = 'uncertain';
  
  return {
    overall: Math.round(overall * 100) / 100,
    level,
    factors: {
      sourceQuality: Math.round(sourceQuality * 100) / 100,
      relevance: Math.round(relevance * 100) / 100,
      recency: Math.round(recency * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
    },
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Generate contextual follow-up suggestions
 */
function generateFollowUpSuggestions(
  originalQuery: string,
  response: string,
  classification: { intent: string; entities: string[]; complexity: string }
): Array<{ text: string; category: string }> {
  const suggestions: Array<{ text: string; category: string }> = [];
  const entities = classification.entities || [];
  
  // Entity-based suggestions
  if (entities.length > 0) {
    const mainEntity = entities[0];
    suggestions.push({
      text: `What's the latest news about ${mainEntity}?`,
      category: 'news',
    });
    suggestions.push({
      text: `How has ${mainEntity} performed recently?`,
      category: 'market',
    });
  }
  
  // Intent-based suggestions
  switch (classification.intent) {
    case 'price_inquiry':
      suggestions.push({
        text: 'What factors are affecting prices right now?',
        category: 'analysis',
      });
      break;
    case 'news_lookup':
      suggestions.push({
        text: 'What are experts saying about this?',
        category: 'analysis',
      });
      break;
    case 'comparison':
      suggestions.push({
        text: 'Which one has better long-term potential?',
        category: 'analysis',
      });
      break;
    case 'trend_analysis':
      suggestions.push({
        text: 'What could happen next?',
        category: 'analysis',
      });
      break;
    default:
      suggestions.push({
        text: 'Tell me more about this topic',
        category: 'news',
      });
  }
  
  // Always add some general follow-ups
  suggestions.push({
    text: 'What are the risks to consider?',
    category: 'analysis',
  });
  
  // Return unique suggestions (max 4)
  return suggestions.slice(0, 4);
}
