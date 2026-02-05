/**
 * Advanced Re-Ranking System
 * 
 * Uses LLM to re-rank search results for maximum relevance.
 * Includes multiple ranking strategies:
 * - LLM relevance scoring
 * - Cross-encoder scoring
 * - Source credibility weighting
 * - Time decay
 * - Diversity optimization
 */

import { callGroq } from '../groq';
import type { SearchResult, NewsDocument } from './types';

// ═══════════════════════════════════════════════════════════════
// TIME DECAY
// ═══════════════════════════════════════════════════════════════

/**
 * Calculate time decay factor
 * More recent articles get higher scores
 */
export function timeDecay(
  pubDate: string,
  halfLifeDays: number = 7,
  referenceDate: Date = new Date()
): number {
  const articleDate = new Date(pubDate);
  const ageMs = referenceDate.getTime() - articleDate.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  
  // Exponential decay
  return Math.exp(-Math.LN2 * ageDays / halfLifeDays);
}

/**
 * Apply time decay to search results
 */
export function applyTimeDecay(
  results: SearchResult[],
  halfLifeDays: number = 7,
  weight: number = 0.2
): SearchResult[] {
  const now = new Date();
  
  return results.map(result => {
    const decay = timeDecay(result.document.metadata.pubDate, halfLifeDays, now);
    const adjustedScore = result.score * (1 - weight) + decay * weight;
    return { ...result, score: adjustedScore };
  }).sort((a, b) => b.score - a.score);
}

// ═══════════════════════════════════════════════════════════════
// SOURCE CREDIBILITY
// ═══════════════════════════════════════════════════════════════

/**
 * Source credibility scores (0-1)
 * Based on historical accuracy and journalistic standards
 */
export const SOURCE_CREDIBILITY: Record<string, number> = {
  // Tier 1: Established news organizations
  coindesk: 0.95,
  theblock: 0.93,
  bloomberg: 0.98,
  reuters: 0.98,
  wsj: 0.97,
  
  // Tier 2: Quality crypto media
  decrypt: 0.88,
  blockworks: 0.90,
  defiant: 0.87,
  dlnews: 0.86,
  unchained: 0.88,
  
  // Tier 3: General crypto news
  cointelegraph: 0.78,
  bitcoinmagazine: 0.82,
  cryptoslate: 0.75,
  bitcoinist: 0.72,
  newsbtc: 0.70,
  
  // Tier 4: Aggregators & others
  cryptonews: 0.68,
  cryptopotato: 0.65,
  beincrypto: 0.70,
  ambcrypto: 0.65,
  
  // Research & institutional
  messari: 0.92,
  delphi: 0.90,
  paradigm: 0.94,
  a16z: 0.93,
  
  // Default for unknown sources
  default: 0.60,
};

/**
 * Get credibility score for a source
 */
export function getSourceCredibility(sourceKey: string): number {
  return SOURCE_CREDIBILITY[sourceKey.toLowerCase()] || SOURCE_CREDIBILITY.default;
}

/**
 * Apply source credibility weighting
 */
export function applySourceCredibility(
  results: SearchResult[],
  weight: number = 0.15
): SearchResult[] {
  return results.map(result => {
    const credibility = getSourceCredibility(result.document.metadata.sourceKey || '');
    const adjustedScore = result.score * (1 - weight) + credibility * weight;
    return { ...result, score: adjustedScore };
  }).sort((a, b) => b.score - a.score);
}

// ═══════════════════════════════════════════════════════════════
// LLM RE-RANKING
// ═══════════════════════════════════════════════════════════════

/**
 * LLM-based relevance scoring
 * Uses the LLM to score relevance of each document to the query
 */
export async function llmRerank(
  query: string,
  results: SearchResult[],
  topK: number = 5
): Promise<SearchResult[]> {
  if (results.length === 0) return [];
  if (results.length <= topK) return results;

  // Prepare documents for scoring
  const docsToScore = results.slice(0, Math.min(20, results.length));
  
  const prompt = `You are a relevance scoring expert. Score how relevant each news article is to the user's query.

Query: "${query}"

Rate each article's relevance from 0-10 (10 = perfectly relevant, 0 = not relevant).
Consider:
- How directly the article addresses the query
- The informativeness of the content
- Recency and timeliness

Articles:
${docsToScore.map((r, i) => `[${i + 1}] ${r.document.metadata.title}
${r.document.content.slice(0, 200)}...`).join('\n\n')}

Return ONLY a JSON array of scores in order, like: [8, 5, 9, 3, ...]`;

  try {
    const response = await callGroq([{ role: 'user', content: prompt }], {
      temperature: 0.1,
      maxTokens: 256,
    });

    // Parse scores
    const match = response.content.match(/\[[\d,\s.]+\]/);
    if (!match) {
      console.warn('LLM rerank: Could not parse scores');
      return results.slice(0, topK);
    }

    const scores: number[] = JSON.parse(match[0]);
    
    // Combine with original scores
    const reranked = docsToScore.map((result, i) => ({
      ...result,
      score: (result.score * 0.4) + ((scores[i] || 5) / 10 * 0.6),
    }));

    return reranked.sort((a, b) => b.score - a.score).slice(0, topK);
  } catch (error) {
    console.error('LLM rerank failed:', error);
    return results.slice(0, topK);
  }
}

/**
 * Cross-encoder style relevance scoring
 * Encodes query and document together for fine-grained relevance
 */
export async function crossEncoderRerank(
  query: string,
  results: SearchResult[],
  topK: number = 5
): Promise<SearchResult[]> {
  if (results.length === 0) return [];

  const prompt = `Score the relevance of each document to the query on a scale of 0-100.

Query: ${query}

Documents:
${results.slice(0, 15).map((r, i) => 
`[DOC${i}] Title: ${r.document.metadata.title}
Content: ${r.document.content.slice(0, 300)}`
).join('\n\n')}

Output JSON only: {"scores": [{"doc": 0, "score": 85}, ...]}`;

  try {
    const response = await callGroq([{ role: 'user', content: prompt }], {
      temperature: 0,
      maxTokens: 512,
      jsonMode: true,
    });

    const parsed = JSON.parse(response.content);
    const scoreMap = new Map<number, number>();
    
    for (const item of parsed.scores || []) {
      scoreMap.set(item.doc, item.score / 100);
    }

    const reranked = results.slice(0, 15).map((result, i) => ({
      ...result,
      score: scoreMap.get(i) ?? result.score,
    }));

    return reranked.sort((a, b) => b.score - a.score).slice(0, topK);
  } catch {
    return results.slice(0, topK);
  }
}

// ═══════════════════════════════════════════════════════════════
// DIVERSITY OPTIMIZATION
// ═══════════════════════════════════════════════════════════════

/**
 * Maximal Marginal Relevance (MMR)
 * Balances relevance with diversity
 */
export function mmrRerank(
  results: SearchResult[],
  topK: number = 5,
  lambda: number = 0.7 // Balance factor (1 = pure relevance, 0 = pure diversity)
): SearchResult[] {
  if (results.length <= topK) return results;

  const selected: SearchResult[] = [];
  const remaining = [...results];

  while (selected.length < topK && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const relevance = remaining[i].score;
      
      // Calculate max similarity to already selected docs
      let maxSimilarity = 0;
      for (const sel of selected) {
        const sim = calculateSimilarity(remaining[i].document, sel.document);
        maxSimilarity = Math.max(maxSimilarity, sim);
      }

      // MMR score
      const mmrScore = lambda * relevance - (1 - lambda) * maxSimilarity;
      
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  return selected;
}

/**
 * Calculate content similarity between two documents
 * Simple Jaccard similarity on tokens
 */
function calculateSimilarity(doc1: NewsDocument, doc2: NewsDocument): number {
  const tokens1 = new Set(tokenize(doc1.content));
  const tokens2 = new Set(tokenize(doc2.content));
  
  const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
  const union = new Set([...tokens1, ...tokens2]);
  
  return intersection.size / union.size;
}

function tokenize(text: string): string[] {
  return text.toLowerCase().split(/\W+/).filter(t => t.length > 3);
}

/**
 * Source diversity reranking
 * Ensures results come from multiple sources
 */
export function diversifyBySources(
  results: SearchResult[],
  maxPerSource: number = 2,
  topK: number = 10
): SearchResult[] {
  const sourceCounts = new Map<string, number>();
  const diversified: SearchResult[] = [];

  for (const result of results) {
    const source = result.document.metadata.sourceKey || result.document.metadata.source;
    const count = sourceCounts.get(source) || 0;

    if (count < maxPerSource) {
      diversified.push(result);
      sourceCounts.set(source, count + 1);
    }

    if (diversified.length >= topK) break;
  }

  return diversified;
}

// ═══════════════════════════════════════════════════════════════
// COMBINED RE-RANKING PIPELINE
// ═══════════════════════════════════════════════════════════════

export interface RerankerOptions {
  useLLM?: boolean;
  useTimeDecay?: boolean;
  useSourceCredibility?: boolean;
  useDiversity?: boolean;
  useMMR?: boolean;
  topK?: number;
  timeDecayHalfLife?: number;
  diversityMaxPerSource?: number;
  mmrLambda?: number;
}

/**
 * Full re-ranking pipeline
 */
export async function rerankResults(
  query: string,
  results: SearchResult[],
  options: RerankerOptions = {}
): Promise<SearchResult[]> {
  const {
    useLLM = true,
    useTimeDecay = true,
    useSourceCredibility = true,
    useDiversity = true,
    useMMR = false,
    topK = 5,
    timeDecayHalfLife = 7,
    diversityMaxPerSource = 2,
    mmrLambda = 0.7,
  } = options;

  if (results.length === 0) return [];

  let reranked = [...results];

  // Apply time decay
  if (useTimeDecay) {
    reranked = applyTimeDecay(reranked, timeDecayHalfLife, 0.15);
  }

  // Apply source credibility
  if (useSourceCredibility) {
    reranked = applySourceCredibility(reranked, 0.1);
  }

  // LLM re-ranking (most expensive, do on smaller set)
  if (useLLM) {
    reranked = await llmRerank(query, reranked, Math.min(topK * 2, 15));
  }

  // MMR for diversity
  if (useMMR) {
    reranked = mmrRerank(reranked, topK, mmrLambda);
  }

  // Source diversity
  if (useDiversity && !useMMR) {
    reranked = diversifyBySources(reranked, diversityMaxPerSource, topK);
  }

  return reranked.slice(0, topK);
}
