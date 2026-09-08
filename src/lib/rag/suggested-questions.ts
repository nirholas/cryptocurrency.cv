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
 * Suggested Follow-up Questions Generator
 * 
 * Intelligently generate follow-up questions based on:
 * - Query context
 * - Retrieved documents
 * - Generated answer
 * - User intent
 */

import type { ScoredDocument } from './types';
import { callGroq } from '../groq';

// Alias for document type
type RAGDocument = ScoredDocument;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface SuggestedQuestion {
  question: string;
  type: 'deeper' | 'broader' | 'related' | 'comparison' | 'timeline' | 'impact';
  relevance: number;
  reasoning: string;
}

export interface QuestionGenerationContext {
  originalQuery: string;
  answer: string;
  documents: RAGDocument[];
  conversationHistory?: string[];
  userIntent?: string;
}

export interface QuestionGenerationConfig {
  numQuestions?: number;
  includeTypes?: SuggestedQuestion['type'][];
  excludeAsked?: string[];
  maxTokens?: number;
  model?: string;
}

// ═══════════════════════════════════════════════════════════════
// QUESTION GENERATOR
// ═══════════════════════════════════════════════════════════════

export class SuggestedQuestionsGenerator {
  private model: string;

  constructor(model: string = 'llama-3.3-70b-versatile') {
    this.model = model;
  }

  /**
   * Generate follow-up questions based on context
   */
  async generateQuestions(
    context: QuestionGenerationContext,
    config: QuestionGenerationConfig = {}
  ): Promise<SuggestedQuestion[]> {
    const {
      numQuestions = 4,
      includeTypes,
      excludeAsked = [],
    } = config;

    const typeInstructions = includeTypes?.length
      ? `Focus on these types: ${includeTypes.join(', ')}`
      : `Include a mix of: deeper dive, broader context, related topics, comparisons, timeline, and impact questions`;

    const excludeInstructions = excludeAsked.length
      ? `\n\nDo NOT suggest questions similar to these already asked:\n${excludeAsked.map(q => `- ${q}`).join('\n')}`
      : '';

    const documentContext = context.documents
      .slice(0, 5)
      .map(d => `- ${d.title}: ${d.content.slice(0, 200)}...`)
      .join('\n');

    const historyContext = context.conversationHistory?.length
      ? `\n\nPrevious questions in conversation:\n${context.conversationHistory.slice(-3).map(q => `- ${q}`).join('\n')}`
      : '';

    const prompt = `You are a helpful assistant generating follow-up questions for a crypto news research assistant.

CONTEXT:
User Query: "${context.originalQuery}"

Answer Given:
${context.answer.slice(0, 1000)}

Related Articles:
${documentContext}
${historyContext}
${excludeInstructions}

TASK:
Generate exactly ${numQuestions} follow-up questions the user might ask next.

${typeInstructions}

Question Types:
- deeper: Dive deeper into specific details mentioned
- broader: Explore wider context or implications
- related: Ask about related but different topics
- comparison: Compare with other cryptocurrencies/events
- timeline: Ask about timing, history, or future
- impact: Ask about effects on market/industry/users

OUTPUT FORMAT (JSON array):
[
  {
    "question": "The follow-up question",
    "type": "deeper|broader|related|comparison|timeline|impact",
    "relevance": 0.0-1.0,
    "reasoning": "Brief explanation of why this question is valuable"
  }
]

Generate questions that are:
1. Specific and actionable (not generic)
2. Natural (what a curious user would actually ask)
3. Valuable (lead to useful information)
4. Diverse (different angles/depths)

Return ONLY the JSON array, no other text.`;

    try {
      const response = await callGroq(
        [{ role: 'user', content: prompt }],
        { temperature: 0.7 }
      );
      
      // Extract JSON from response
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        return this.generateFallbackQuestions(context, numQuestions);
      }

      const questions = JSON.parse(jsonMatch[0]) as SuggestedQuestion[];
      
      // Validate and filter
      return questions
        .filter(q => 
          q.question &&
          q.type &&
          typeof q.relevance === 'number' &&
          q.relevance >= 0 && q.relevance <= 1
        )
        .slice(0, numQuestions);

    } catch (error) {
      console.error('Failed to generate questions:', error);
      return this.generateFallbackQuestions(context, numQuestions);
    }
  }

  /**
   * Generate questions based on document topics
   */
  async generateFromDocuments(
    documents: RAGDocument[],
    numQuestions: number = 4
  ): Promise<SuggestedQuestion[]> {
    // Extract key topics from documents
    const topics = this.extractTopics(documents);
    
    // Generate questions for each topic category
    const questions: SuggestedQuestion[] = [];

    for (const topic of topics.slice(0, numQuestions)) {
      questions.push({
        question: `What is the latest news about ${topic}?`,
        type: 'related',
        relevance: 0.8,
        reasoning: `Popular topic found in recent articles`,
      });
    }

    return questions;
  }

  /**
   * Generate quick suggestions without LLM
   */
  generateQuickSuggestions(
    query: string,
    documents: RAGDocument[]
  ): SuggestedQuestion[] {
    const questions: SuggestedQuestion[] = [];

    // Extract cryptocurrencies mentioned
    const cryptos = this.extractCryptos(query, documents);
    
    // Time-based questions
    questions.push({
      question: `What happened with ${cryptos[0] || 'crypto'} in the past week?`,
      type: 'timeline',
      relevance: 0.7,
      reasoning: 'Recent timeline often requested',
    });

    // Impact questions
    if (cryptos.length > 0) {
      questions.push({
        question: `How does this affect ${cryptos[0]} price outlook?`,
        type: 'impact',
        relevance: 0.8,
        reasoning: 'Price impact is commonly asked',
      });
    }

    // Comparison if multiple cryptos
    if (cryptos.length >= 2) {
      questions.push({
        question: `How does ${cryptos[0]} compare to ${cryptos[1]} right now?`,
        type: 'comparison',
        relevance: 0.75,
        reasoning: 'Comparison between mentioned assets',
      });
    }

    // Deeper dive
    const mainTopic = this.extractMainTopic(query);
    if (mainTopic) {
      questions.push({
        question: `Tell me more about the technical details of ${mainTopic}`,
        type: 'deeper',
        relevance: 0.7,
        reasoning: 'Deep dive into main topic',
      });
    }

    return questions.slice(0, 4);
  }

  /**
   * Rank and filter questions by relevance and diversity
   */
  rankAndFilter(
    questions: SuggestedQuestion[],
    config: {
      maxQuestions?: number;
      minRelevance?: number;
      ensureDiversity?: boolean;
    } = {}
  ): SuggestedQuestion[] {
    const { maxQuestions = 4, minRelevance = 0.5, ensureDiversity = true } = config;

    // Filter by relevance
    const filtered = questions.filter(q => q.relevance >= minRelevance);

    // Sort by relevance
    filtered.sort((a, b) => b.relevance - a.relevance);

    if (!ensureDiversity) {
      return filtered.slice(0, maxQuestions);
    }

    // Ensure type diversity
    const selected: SuggestedQuestion[] = [];
    const usedTypes = new Set<string>();

    // First pass: one of each type
    for (const q of filtered) {
      if (!usedTypes.has(q.type) && selected.length < maxQuestions) {
        selected.push(q);
        usedTypes.add(q.type);
      }
    }

    // Second pass: fill remaining slots with highest relevance
    for (const q of filtered) {
      if (!selected.includes(q) && selected.length < maxQuestions) {
        selected.push(q);
      }
    }

    return selected;
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════

  private extractTopics(documents: RAGDocument[]): string[] {
    const topicCounts = new Map<string, number>();
    
    const cryptoPatterns = [
      /bitcoin|btc/gi,
      /ethereum|eth/gi,
      /solana|sol/gi,
      /ripple|xrp/gi,
      /cardano|ada/gi,
      /defi/gi,
      /nft/gi,
      /stablecoin/gi,
      /regulation/gi,
      /sec|securities/gi,
      /etf/gi,
      /mining/gi,
    ];

    for (const doc of documents) {
      const text = `${doc.title || ''} ${doc.content}`.toLowerCase();
      
      for (const pattern of cryptoPatterns) {
        const matches = text.match(pattern);
        if (matches) {
          const topic = matches[0].toLowerCase();
          topicCounts.set(topic, (topicCounts.get(topic) || 0) + matches.length);
        }
      }
    }

    return Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([topic]) => topic);
  }

  private extractCryptos(query: string, documents: RAGDocument[]): string[] {
    const cryptos: string[] = [];
    const text = `${query} ${documents.map(d => d.title || '').join(' ')}`.toLowerCase();
    
    const cryptoNames: Record<string, string> = {
      'bitcoin': 'Bitcoin',
      'btc': 'Bitcoin',
      'ethereum': 'Ethereum',
      'eth': 'Ethereum',
      'solana': 'Solana',
      'sol': 'Solana',
      'ripple': 'XRP',
      'xrp': 'XRP',
      'cardano': 'Cardano',
      'ada': 'Cardano',
      'dogecoin': 'Dogecoin',
      'doge': 'Dogecoin',
      'polygon': 'Polygon',
      'matic': 'Polygon',
      'avalanche': 'Avalanche',
      'avax': 'Avalanche',
    };

    for (const [key, name] of Object.entries(cryptoNames)) {
      if (text.includes(key) && !cryptos.includes(name)) {
        cryptos.push(name);
      }
    }

    return cryptos.slice(0, 3);
  }

  private extractMainTopic(query: string): string | null {
    // Simple extraction - find the first noun phrase after "about", "regarding", etc.
    const patterns = [
      /(?:about|regarding|on|for)\s+(?:the\s+)?(.+?)(?:\?|$)/i,
      /(?:what|how|why|when)\s+(?:is|are|did|does|was|were)\s+(?:the\s+)?(.+?)(?:\?|$)/i,
    ];

    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    return null;
  }

  private generateFallbackQuestions(
    context: QuestionGenerationContext,
    numQuestions: number
  ): SuggestedQuestion[] {
    const cryptos = this.extractCryptos(context.originalQuery, context.documents);
    const topic = cryptos[0] || 'crypto';

    const fallbacks: SuggestedQuestion[] = [
      {
        question: `What are the latest developments in ${topic}?`,
        type: 'broader',
        relevance: 0.7,
        reasoning: 'General follow-up about recent news',
      },
      {
        question: `How does this news impact ${topic} investors?`,
        type: 'impact',
        relevance: 0.7,
        reasoning: 'Impact analysis is commonly requested',
      },
      {
        question: `What do experts predict for ${topic}?`,
        type: 'deeper',
        relevance: 0.6,
        reasoning: 'Expert opinions add value',
      },
      {
        question: `What similar events happened in the past?`,
        type: 'timeline',
        relevance: 0.6,
        reasoning: 'Historical context is valuable',
      },
    ];

    return fallbacks.slice(0, numQuestions);
  }
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTION
// ═══════════════════════════════════════════════════════════════

let generator: SuggestedQuestionsGenerator | null = null;

export function getSuggestedQuestionsGenerator(): SuggestedQuestionsGenerator {
  if (!generator) {
    generator = new SuggestedQuestionsGenerator();
  }
  return generator;
}

/**
 * Quick helper to generate suggested questions
 */
export async function generateSuggestedQuestions(
  query: string,
  answer: string,
  documents: RAGDocument[],
  numQuestions: number = 4
): Promise<SuggestedQuestion[]> {
  const gen = getSuggestedQuestionsGenerator();
  
  return gen.generateQuestions(
    { originalQuery: query, answer, documents },
    { numQuestions }
  );
}
