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
 * Agentic RAG - Multi-Hop Reasoning
 * 
 * Advanced RAG with agent-like capabilities:
 * - Iterative retrieval and reasoning
 * - Self-reflection and correction
 * - Tool-use for complex queries
 * - Chain-of-thought reasoning
 */

import { callGroq, parseGroqJson } from '../groq';
import type { ScoredDocument, SearchFilter } from './types';
import { processQuery } from './query-processor';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ReasoningStep {
  type: 'search' | 'analyze' | 'synthesize' | 'verify' | 'reflect';
  input: string;
  output: string;
  documentsUsed?: string[];
  confidence: number;
}

export interface AgenticResponse {
  answer: string;
  reasoning: ReasoningStep[];
  sources: ScoredDocument[];
  confidence: number;
  iterations: number;
  metadata: {
    totalTokensUsed: number;
    searchesPerformed: number;
    documentsAnalyzed: number;
  };
}

export interface AgentTools {
  search: (query: string, filter?: SearchFilter) => Promise<ScoredDocument[]>;
  getDocument: (id: string) => Promise<ScoredDocument | null>;
}

// ═══════════════════════════════════════════════════════════════
// REASONING ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * Determine what action to take next
 */
async function planNextAction(
  query: string,
  currentKnowledge: string,
  previousSteps: ReasoningStep[]
): Promise<{
  action: 'search' | 'analyze' | 'synthesize' | 'answer' | 'refine';
  reason: string;
  searchQuery?: string;
}> {
  const stepsDescription = previousSteps.length > 0
    ? previousSteps.map((s, i) => `Step ${i + 1}: ${s.type} - ${s.output.substring(0, 100)}...`).join('\n')
    : 'None yet';

  const prompt = `You are a reasoning agent answering crypto news questions.

User question: "${query}"

Steps taken so far:
${stepsDescription}

Current knowledge gathered:
${currentKnowledge || 'None yet'}

What should be the next action? Choose one:
- "search": Need more information (provide search query)
- "analyze": Need to analyze gathered documents deeper
- "synthesize": Have enough info, need to combine findings
- "answer": Ready to give final answer
- "refine": Need to refine a previous search that didn't return good results

Respond with JSON:
{
  "action": "search|analyze|synthesize|answer|refine",
  "reason": "why this action",
  "searchQuery": "only if action is search or refine"
}`;

  try {
    const response = await callGroq([{ role: 'user', content: prompt }], {
      temperature: 0.3,
      maxTokens: 256,
      jsonMode: true,
    });

    return parseGroqJson(response.content);
  } catch {
    return { action: 'answer', reason: 'fallback' };
  }
}

/**
 * Analyze documents and extract relevant information
 */
async function analyzeDocuments(
  query: string,
  documents: ScoredDocument[]
): Promise<{ analysis: string; keyFacts: string[]; confidence: number }> {
  if (documents.length === 0) {
    return { analysis: 'No documents to analyze', keyFacts: [], confidence: 0 };
  }

  const docsText = documents
    .slice(0, 5)
    .map((d, i) => `[Doc ${i + 1}] ${d.title}\n${d.content.substring(0, 800)}`)
    .join('\n\n---\n\n');

  const prompt = `Analyze these crypto news articles for information relevant to: "${query}"

Articles:
${docsText}

Extract key facts and assess how well they answer the question.

Respond with JSON:
{
  "analysis": "Overall analysis of findings",
  "keyFacts": ["fact 1", "fact 2", "fact 3"],
  "confidence": 0.0-1.0 (how well do these docs answer the question?)
}`;

  try {
    const response = await callGroq([{ role: 'user', content: prompt }], {
      temperature: 0.2,
      maxTokens: 512,
      jsonMode: true,
    });

    return parseGroqJson(response.content);
  } catch {
    return { analysis: 'Analysis failed', keyFacts: [], confidence: 0.3 };
  }
}

/**
 * Self-reflect on current answer quality
 */
async function reflectOnAnswer(
  query: string,
  proposedAnswer: string,
  sources: ScoredDocument[]
): Promise<{
  isGood: boolean;
  issues: string[];
  suggestions: string[];
  confidence: number;
}> {
  const prompt = `Evaluate this answer to a crypto news question.

Question: "${query}"

Proposed answer: "${proposedAnswer}"

Number of sources used: ${sources.length}

Check for:
1. Factual accuracy (based on sources)
2. Completeness
3. Clarity
4. Relevance

Respond with JSON:
{
  "isGood": true/false,
  "issues": ["list of problems if any"],
  "suggestions": ["improvements needed"],
  "confidence": 0.0-1.0
}`;

  try {
    const response = await callGroq([{ role: 'user', content: prompt }], {
      temperature: 0.2,
      maxTokens: 256,
      jsonMode: true,
    });

    return parseGroqJson(response.content);
  } catch {
    return { isGood: true, issues: [], suggestions: [], confidence: 0.7 };
  }
}

/**
 * Synthesize final answer from gathered information
 */
async function synthesizeAnswer(
  query: string,
  knowledge: string,
  documents: ScoredDocument[]
): Promise<string> {
  const sourceSummary = documents
    .slice(0, 5)
    .map((d, i) => `[${i + 1}] ${d.title} - ${d.source}`)
    .join('\n');

  const prompt = `Based on gathered information, provide a comprehensive answer to this crypto question.

Question: "${query}"

Gathered knowledge:
${knowledge}

Available sources:
${sourceSummary}

Provide a clear, factual answer that:
- Directly addresses the question
- References sources when stating facts
- Acknowledges uncertainty where applicable
- Is concise but complete

Answer:`;

  const response = await callGroq([{ role: 'user', content: prompt }], {
    temperature: 0.4,
    maxTokens: 600,
  });

  return response.content.trim();
}

// ═══════════════════════════════════════════════════════════════
// MAIN AGENTIC RAG
// ═══════════════════════════════════════════════════════════════

/**
 * Run agentic RAG with multi-hop reasoning
 */
export async function agenticRAG(
  query: string,
  tools: AgentTools,
  options: {
    maxIterations?: number;
    confidenceThreshold?: number;
    enableReflection?: boolean;
  } = {}
): Promise<AgenticResponse> {
  const {
    maxIterations = 5,
    confidenceThreshold = 0.7,
    enableReflection = true,
  } = options;

  const reasoning: ReasoningStep[] = [];
  const allSources: ScoredDocument[] = [];
  let knowledge = '';
  let searchesPerformed = 0;
  let totalTokens = 0;

  // Process query to understand intent
  const processedQuery = await processQuery(query, {
    useHyDE: false,
    useDecomposition: true,
    useExpansion: false,
  });

  // Use decomposed sub-queries if available
  const searchQueries = processedQuery.decomposition.isComplex
    ? processedQuery.decomposition.subQueries.map(sq => sq.query)
    : [query];

  // Iterative reasoning loop
  for (let i = 0; i < maxIterations; i++) {
    const plan = await planNextAction(query, knowledge, reasoning);
    totalTokens += 256; // Approximate

    if (plan.action === 'answer') {
      // Ready to synthesize final answer
      const answer = await synthesizeAnswer(query, knowledge, allSources);
      totalTokens += 600;

      // Optional reflection to verify answer quality
      if (enableReflection) {
        const reflection = await reflectOnAnswer(query, answer, allSources);
        totalTokens += 256;
        
        reasoning.push({
          type: 'reflect',
          input: answer,
          output: reflection.isGood 
            ? 'Answer verified' 
            : `Issues: ${reflection.issues.join(', ')}`,
          confidence: reflection.confidence,
        });

        if (!reflection.isGood && i < maxIterations - 1) {
          // Try to improve
          knowledge += `\nNeeds improvement: ${reflection.suggestions.join('. ')}`;
          continue;
        }
      }

      return {
        answer,
        reasoning,
        sources: deduplicateSources(allSources),
        confidence: calculateOverallConfidence(reasoning),
        iterations: i + 1,
        metadata: {
          totalTokensUsed: totalTokens,
          searchesPerformed,
          documentsAnalyzed: allSources.length,
        },
      };
    }

    if (plan.action === 'search' || plan.action === 'refine') {
      // Perform search
      const searchQuery = plan.searchQuery || searchQueries[searchesPerformed] || query;
      const results = await tools.search(searchQuery);
      searchesPerformed++;

      reasoning.push({
        type: 'search',
        input: searchQuery,
        output: `Found ${results.length} documents`,
        documentsUsed: results.slice(0, 5).map(d => d.id),
        confidence: results.length > 0 ? 0.8 : 0.3,
      });

      allSources.push(...results.slice(0, 5));
    }

    if (plan.action === 'analyze' || allSources.length > 0) {
      // Analyze gathered documents
      const analysis = await analyzeDocuments(query, allSources);
      totalTokens += 512;

      reasoning.push({
        type: 'analyze',
        input: `Analyzing ${allSources.length} documents`,
        output: analysis.analysis,
        confidence: analysis.confidence,
      });

      if (analysis.keyFacts.length > 0) {
        knowledge += '\nKey facts found:\n- ' + analysis.keyFacts.join('\n- ');
      }

      // If confidence is high enough, move to synthesis
      if (analysis.confidence >= confidenceThreshold) {
        reasoning.push({
          type: 'synthesize',
          input: knowledge,
          output: 'Confidence threshold met, synthesizing answer',
          confidence: analysis.confidence,
        });
      }
    }
  }

  // Max iterations reached, synthesize best effort answer
  const answer = await synthesizeAnswer(query, knowledge, allSources);
  
  return {
    answer,
    reasoning,
    sources: deduplicateSources(allSources),
    confidence: calculateOverallConfidence(reasoning),
    iterations: maxIterations,
    metadata: {
      totalTokensUsed: totalTokens,
      searchesPerformed,
      documentsAnalyzed: allSources.length,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function deduplicateSources(sources: ScoredDocument[]): ScoredDocument[] {
  const seen = new Set<string>();
  return sources.filter(s => {
    if (seen.has(s.id)) return false;
    seen.add(s.id);
    return true;
  });
}

function calculateOverallConfidence(steps: ReasoningStep[]): number {
  if (steps.length === 0) return 0;
  
  const weights: Record<string, number> = {
    search: 0.1,
    analyze: 0.3,
    synthesize: 0.2,
    verify: 0.3,
    reflect: 0.3,
  };
  
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const step of steps) {
    const weight = weights[step.type] || 0.1;
    totalWeight += weight;
    weightedSum += step.confidence * weight;
  }
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0.5;
}

// ═══════════════════════════════════════════════════════════════
// SIMPLE MULTI-HOP (Lightweight alternative)
// ═══════════════════════════════════════════════════════════════

/**
 * Simple multi-hop retrieval without full agent
 * More efficient but less powerful
 */
export async function simpleMultiHop(
  query: string,
  search: (q: string) => Promise<ScoredDocument[]>,
  hops: number = 2
): Promise<{ answer: string; sources: ScoredDocument[] }> {
  const allDocs: ScoredDocument[] = [];
  let currentQuery = query;

  for (let i = 0; i < hops; i++) {
    const results = await search(currentQuery);
    allDocs.push(...results.slice(0, 3));

    if (i < hops - 1 && results.length > 0) {
      // Generate follow-up query based on findings
      const topDoc = results[0];
      const prompt = `Based on this crypto news about "${query}":

"${topDoc.content.substring(0, 500)}"

What follow-up question would help get more complete information?
Reply with just the question.`;

      try {
        const response = await callGroq([{ role: 'user', content: prompt }], {
          temperature: 0.5,
          maxTokens: 100,
        });
        currentQuery = response.content.trim();
      } catch {
        break;
      }
    }
  }

  // Synthesize answer
  const uniqueDocs = deduplicateSources(allDocs);
  const docsText = uniqueDocs
    .slice(0, 5)
    .map(d => `- ${d.title}: ${d.content.substring(0, 300)}`)
    .join('\n');

  const answerPrompt = `Answer this crypto question based on these news articles:

Question: "${query}"

Articles:
${docsText}

Concise answer:`;

  const answer = await callGroq([{ role: 'user', content: answerPrompt }], {
    temperature: 0.4,
    maxTokens: 400,
  });

  return {
    answer: answer.content.trim(),
    sources: uniqueDocs.slice(0, 5),
  };
}
