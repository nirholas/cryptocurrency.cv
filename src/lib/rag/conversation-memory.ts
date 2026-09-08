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
 * Conversation Memory for Multi-Turn RAG
 * 
 * Maintains conversation context and enables follow-up questions:
 * - Message history storage
 * - Context summarization
 * - Query contextualization
 * - Sliding window memory
 */

import { callGroq, parseGroqJson } from '../groq';
import type { ScoredDocument } from './types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  metadata?: {
    documentsUsed?: string[];
    cryptosDiscussed?: string[];
  };
}

export interface ConversationContext {
  id: string;
  messages: ConversationMessage[];
  summary?: string;
  entities: Set<string>;
  lastUpdated: number;
}

export interface ContextualizedQuery {
  original: string;
  contextualized: string;
  referencedEntities: string[];
  isFollowUp: boolean;
}

// ═══════════════════════════════════════════════════════════════
// MEMORY STORE
// ═══════════════════════════════════════════════════════════════

class ConversationMemoryStore {
  private conversations: Map<string, ConversationContext> = new Map();
  private maxMessages: number = 20;
  private summaryThreshold: number = 10;

  /**
   * Get or create conversation context
   */
  getContext(conversationId: string): ConversationContext {
    let context = this.conversations.get(conversationId);
    
    if (!context) {
      context = {
        id: conversationId,
        messages: [],
        entities: new Set(),
        lastUpdated: Date.now(),
      };
      this.conversations.set(conversationId, context);
    }
    
    return context;
  }

  /**
   * Add a message to conversation
   */
  async addMessage(
    conversationId: string,
    message: Omit<ConversationMessage, 'timestamp'>
  ): Promise<void> {
    const context = this.getContext(conversationId);
    
    context.messages.push({
      ...message,
      timestamp: Date.now(),
    });
    
    // Extract and track entities
    if (message.metadata?.cryptosDiscussed) {
      for (const crypto of message.metadata.cryptosDiscussed) {
        context.entities.add(crypto);
      }
    }
    
    context.lastUpdated = Date.now();
    
    // Summarize if needed
    if (context.messages.length >= this.summaryThreshold && !context.summary) {
      context.summary = await this.summarizeConversation(context);
    }
    
    // Trim if over limit
    if (context.messages.length > this.maxMessages) {
      // Keep summary + recent messages
      context.messages = context.messages.slice(-this.maxMessages / 2);
    }
  }

  /**
   * Get recent messages for context
   */
  getRecentMessages(
    conversationId: string,
    count: number = 6
  ): ConversationMessage[] {
    const context = this.getContext(conversationId);
    return context.messages.slice(-count);
  }

  /**
   * Summarize conversation history
   */
  private async summarizeConversation(context: ConversationContext): Promise<string> {
    const messages = context.messages.slice(0, -3); // Keep last 3 unsummarized
    
    if (messages.length === 0) return '';
    
    const conversationText = messages
      .map(m => `${m.role.toUpperCase()}: ${m.content}`)
      .join('\n');

    const prompt = `Summarize this crypto news conversation in 2-3 sentences, focusing on:
- Main topics discussed
- Cryptocurrencies mentioned
- Key facts shared

Conversation:
${conversationText}

Summary:`;

    try {
      const response = await callGroq([{ role: 'user', content: prompt }], {
        temperature: 0.3,
        maxTokens: 200,
      });
      return response.content.trim();
    } catch {
      return '';
    }
  }

  /**
   * Clear conversation
   */
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  /**
   * Clean up old conversations
   */
  cleanup(maxAgeMs: number = 3600000): void { // 1 hour default
    const now = Date.now();
    for (const [id, context] of this.conversations) {
      if (now - context.lastUpdated > maxAgeMs) {
        this.conversations.delete(id);
      }
    }
  }
}

// Global memory store
export const conversationMemory = new ConversationMemoryStore();

// ═══════════════════════════════════════════════════════════════
// QUERY CONTEXTUALIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Detect if query is a follow-up question
 */
function detectFollowUp(query: string): boolean {
  const followUpPatterns = [
    /^(what|how|why|when|where|who)\s+(about|did|was|is|are|were)/i,
    /^(and|also|but|however)/i,
    /^(tell me more|more details|explain|elaborate)/i,
    /\b(it|they|this|that|those|these|the same)\b/i,
    /^(yes|no|okay|sure|right)/i,
    /\?$/,
  ];
  
  // Short queries with pronouns are likely follow-ups
  const words = query.split(/\s+/);
  if (words.length <= 5 && /\b(it|they|that|this)\b/i.test(query)) {
    return true;
  }
  
  return followUpPatterns.some(p => p.test(query));
}

/**
 * Contextualize a query using conversation history
 */
export async function contextualizeQuery(
  query: string,
  conversationId: string
): Promise<ContextualizedQuery> {
  const context = conversationMemory.getContext(conversationId);
  const recentMessages = conversationMemory.getRecentMessages(conversationId, 6);
  
  // If no history, return as-is
  if (recentMessages.length === 0) {
    return {
      original: query,
      contextualized: query,
      referencedEntities: [],
      isFollowUp: false,
    };
  }
  
  const isFollowUp = detectFollowUp(query);
  
  // If clearly not a follow-up, return as-is
  if (!isFollowUp && !query.match(/\b(it|they|this|that)\b/i)) {
    return {
      original: query,
      contextualized: query,
      referencedEntities: [],
      isFollowUp: false,
    };
  }

  // Build conversation context
  const conversationText = recentMessages
    .map(m => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n');

  const prompt = `Given this conversation history about crypto news:

${context.summary ? `Earlier context: ${context.summary}\n\n` : ''}Recent exchanges:
${conversationText}

Latest user question: "${query}"

Rewrite the question to be standalone and self-contained, replacing pronouns and references with explicit names.

Respond with JSON:
{
  "contextualized": "the rewritten standalone question",
  "referencedEntities": ["list", "of", "referenced", "cryptos", "or", "entities"]
}`;

  try {
    const response = await callGroq([{ role: 'user', content: prompt }], {
      temperature: 0.2,
      maxTokens: 256,
      jsonMode: true,
    });

    const parsed = parseGroqJson<{ contextualized: string; referencedEntities: string[] }>(response.content);
    
    return {
      original: query,
      contextualized: parsed.contextualized,
      referencedEntities: parsed.referencedEntities,
      isFollowUp,
    };
  } catch {
    return {
      original: query,
      contextualized: query,
      referencedEntities: [],
      isFollowUp,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// RESPONSE GENERATION WITH CONTEXT
// ═══════════════════════════════════════════════════════════════

/**
 * Generate a response that considers conversation history
 */
export async function generateContextualResponse(
  query: string,
  documents: ScoredDocument[],
  conversationId: string
): Promise<string> {
  const recentMessages = conversationMemory.getRecentMessages(conversationId, 4);
  const context = conversationMemory.getContext(conversationId);
  
  // Build document context
  const docsContext = documents
    .slice(0, 5)
    .map((d, i) => `[${i + 1}] ${d.title} (${d.publishedAt?.toLocaleDateString() || 'unknown date'})\n${d.content.substring(0, 500)}...`)
    .join('\n\n');

  // Build conversation history
  const historyText = recentMessages.length > 0
    ? recentMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
    : '';

  const systemPrompt = `You are a cryptocurrency news assistant with access to recent news articles.

${context.summary ? `Conversation context: ${context.summary}` : ''}

Answer questions based on the provided news articles. Be concise but comprehensive.
Reference specific articles when relevant. If information isn't in the articles, say so.
Consider the conversation history when formulating your response.`;

  const userPrompt = `${historyText ? `Previous conversation:\n${historyText}\n\n---\n\n` : ''}Current question: ${query}

Relevant news articles:
${docsContext}

Please answer the question based on these articles:`;

  const response = await callGroq([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ], {
    temperature: 0.4,
    maxTokens: 800,
  });

  return response.content;
}

// ═══════════════════════════════════════════════════════════════
// CONVERSATION UTILITIES
// ═══════════════════════════════════════════════════════════════

/**
 * Generate conversation ID from session info
 */
export function generateConversationId(sessionId?: string, userId?: string): string {
  if (sessionId) return `session:${sessionId}`;
  if (userId) return `user:${userId}`;
  return `anon:${Date.now()}:${Math.random().toString(36).substring(7)}`;
}

/**
 * Format conversation for export
 */
export function exportConversation(conversationId: string): string {
  const context = conversationMemory.getContext(conversationId);
  
  return context.messages
    .map(m => {
      const time = new Date(m.timestamp).toISOString();
      return `[${time}] ${m.role.toUpperCase()}: ${m.content}`;
    })
    .join('\n\n');
}
