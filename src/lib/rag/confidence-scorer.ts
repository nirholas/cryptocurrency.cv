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
 * Answer Confidence Scoring
 * 
 * Multi-dimensional confidence scoring:
 * - Retrieval confidence (document relevance)
 * - Generation confidence (answer quality)
 * - Attribution confidence (source support)
 * - Factual confidence (claim verification)
 */

import type { ScoredDocument } from './types';
import { callGroq } from '../groq';

// Alias for document type
type RAGDocument = ScoredDocument;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ConfidenceScore {
  overall: number;
  dimensions: {
    retrieval: number;
    generation: number;
    attribution: number;
    factual: number;
    temporal: number;
  };
  level: 'high' | 'medium' | 'low' | 'uncertain';
  explanation: string;
  warnings: string[];
}

export interface ConfidenceScoringContext {
  query: string;
  answer: string;
  documents: RAGDocument[];
  documentScores?: number[];
}

export interface ConfidenceScoringConfig {
  useDeepAnalysis?: boolean;
  weights?: {
    retrieval?: number;
    generation?: number;
    attribution?: number;
    factual?: number;
    temporal?: number;
  };
  model?: string;
}

// ═══════════════════════════════════════════════════════════════
// CONFIDENCE SCORER
// ═══════════════════════════════════════════════════════════════

export class ConfidenceScorer {
  constructor() {}

  /**
   * Calculate comprehensive confidence score
   */
  async scoreConfidence(
    context: ConfidenceScoringContext,
    config: ConfidenceScoringConfig = {}
  ): Promise<ConfidenceScore> {
    const weights = {
      retrieval: 0.25,
      generation: 0.2,
      attribution: 0.25,
      factual: 0.15,
      temporal: 0.15,
      ...config.weights,
    };

    // Calculate each dimension
    const retrievalScore = this.calculateRetrievalConfidence(context);
    const temporalScore = this.calculateTemporalConfidence(context.documents);
    
    let generationScore: number;
    let attributionScore: number;
    let factualScore: number;
    
    if (config.useDeepAnalysis) {
      const deepAnalysis = await this.deepAnalysis(context);
      generationScore = deepAnalysis.generation;
      attributionScore = deepAnalysis.attribution;
      factualScore = deepAnalysis.factual;
    } else {
      generationScore = this.estimateGenerationConfidence(context);
      attributionScore = this.estimateAttributionConfidence(context);
      factualScore = this.estimateFactualConfidence(context);
    }

    const dimensions = {
      retrieval: retrievalScore,
      generation: generationScore,
      attribution: attributionScore,
      factual: factualScore,
      temporal: temporalScore,
    };

    // Calculate weighted overall score
    const overall = 
      dimensions.retrieval * weights.retrieval +
      dimensions.generation * weights.generation +
      dimensions.attribution * weights.attribution +
      dimensions.factual * weights.factual +
      dimensions.temporal * weights.temporal;

    // Determine confidence level
    const level = this.determineLevel(overall, dimensions);
    
    // Generate explanation and warnings
    const { explanation, warnings } = this.generateExplanation(dimensions, context);

    return {
      overall,
      dimensions,
      level,
      explanation,
      warnings,
    };
  }

  /**
   * Quick confidence estimation without LLM
   */
  quickScore(context: ConfidenceScoringContext): ConfidenceScore {
    const dimensions = {
      retrieval: this.calculateRetrievalConfidence(context),
      generation: this.estimateGenerationConfidence(context),
      attribution: this.estimateAttributionConfidence(context),
      factual: this.estimateFactualConfidence(context),
      temporal: this.calculateTemporalConfidence(context.documents),
    };

    const overall = 
      dimensions.retrieval * 0.25 +
      dimensions.generation * 0.2 +
      dimensions.attribution * 0.25 +
      dimensions.factual * 0.15 +
      dimensions.temporal * 0.15;

    const level = this.determineLevel(overall, dimensions);
    const { explanation, warnings } = this.generateExplanation(dimensions, context);

    return {
      overall,
      dimensions,
      level,
      explanation,
      warnings,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // DIMENSION SCORERS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Retrieval confidence based on document relevance scores
   */
  private calculateRetrievalConfidence(context: ConfidenceScoringContext): number {
    if (!context.documents.length) return 0;

    // Use provided scores or document scores
    const scores = context.documentScores || 
      context.documents.map(d => d.score || 0.5);

    // Average of top 3 documents
    const topScores = scores.slice(0, 3);
    const avgScore = topScores.reduce((a, b) => a + b, 0) / topScores.length;

    // Score spread (lower is better - consistent relevance)
    const spread = Math.max(...topScores) - Math.min(...topScores);
    const spreadPenalty = spread > 0.3 ? 0.1 : 0;

    // Document count factor
    const countBonus = Math.min(context.documents.length / 5, 1) * 0.1;

    return Math.min(1, Math.max(0, avgScore + countBonus - spreadPenalty));
  }

  /**
   * Temporal confidence based on document freshness
   */
  private calculateTemporalConfidence(documents: RAGDocument[]): number {
    if (!documents.length) return 0.5;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    
    const freshnesScores = documents.slice(0, 5).map(doc => {
      const publishedAt = doc.publishedAt;
      if (!publishedAt) return 0.5;
      
      const pubDate = new Date(publishedAt).getTime();
      const ageInDays = (now - pubDate) / oneDayMs;
      
      // Score based on age (more recent = higher score)
      if (ageInDays <= 1) return 1;
      if (ageInDays <= 7) return 0.9;
      if (ageInDays <= 30) return 0.7;
      if (ageInDays <= 90) return 0.5;
      return 0.3;
    });

    return freshnesScores.reduce((a, b) => a + b, 0) / freshnesScores.length;
  }

  /**
   * Estimate generation quality without LLM
   */
  private estimateGenerationConfidence(context: ConfidenceScoringContext): number {
    const answer = context.answer;
    
    let score = 0.5;

    // Answer length (not too short, not too long)
    const length = answer.length;
    if (length >= 100 && length <= 2000) score += 0.1;
    if (length < 50) score -= 0.2;

    // Contains specific details (numbers, dates)
    if (/\d{4}/.test(answer)) score += 0.05; // Years
    if (/\$[\d,]+/.test(answer)) score += 0.05; // Dollar amounts
    if (/%[\d.]+/.test(answer)) score += 0.05; // Percentages

    // Has structure (paragraphs, lists)
    if (answer.split('\n\n').length > 1) score += 0.05;
    if (/^[\-•\*]\s/m.test(answer)) score += 0.05;

    // Uncertainty indicators (reduce score)
    const uncertaintyPhrases = [
      'might be', 'could be', 'possibly', 'unclear',
      'not sure', 'uncertain', 'may or may not',
    ];
    for (const phrase of uncertaintyPhrases) {
      if (answer.toLowerCase().includes(phrase)) score -= 0.05;
    }

    // Hedging language (slight reduction)
    const hedgingPhrases = ['generally', 'typically', 'often', 'usually'];
    for (const phrase of hedgingPhrases) {
      if (answer.toLowerCase().includes(phrase)) score -= 0.02;
    }

    return Math.min(1, Math.max(0, score));
  }

  /**
   * Estimate attribution confidence
   */
  private estimateAttributionConfidence(context: ConfidenceScoringContext): number {
    const answer = context.answer.toLowerCase();
    const documentTexts = context.documents.map(d => d.content.toLowerCase());
    
    // Split answer into sentences
    const sentences = answer.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    let supportedSentences = 0;
    for (const sentence of sentences) {
      // Check if key phrases from sentence appear in documents
      const words = sentence.split(/\s+/).filter(w => w.length > 4);
      const importantWords = words.slice(0, 10);
      
      let matchCount = 0;
      for (const word of importantWords) {
        for (const doc of documentTexts) {
          if (doc.includes(word)) {
            matchCount++;
            break;
          }
        }
      }
      
      if (matchCount >= importantWords.length * 0.4) {
        supportedSentences++;
      }
    }

    return sentences.length > 0 ? supportedSentences / sentences.length : 0.5;
  }

  /**
   * Estimate factual confidence
   */
  private estimateFactualConfidence(context: ConfidenceScoringContext): number {
    let score = 0.6; // Default moderate confidence

    // Multiple sources agreeing increases confidence
    if (context.documents.length >= 3) {
      const sources = new Set(context.documents.map(d => d.source));
      if (sources.size >= 2) score += 0.15;
    }

    // Reputable sources increase confidence
    const reputableSources = ['coindesk', 'cointelegraph', 'decrypt', 'theblock', 'bloomberg', 'reuters'];
    const hasReputable = context.documents.some(d => {
      const source = (d.source || '').toLowerCase();
      return reputableSources.some(r => source.includes(r));
    });
    if (hasReputable) score += 0.1;

    // Recent documents increase factual relevance
    const recentDocs = context.documents.filter(d => {
      const pubDate = d.publishedAt;
      if (!pubDate) return false;
      const ageMs = Date.now() - new Date(pubDate).getTime();
      return ageMs < 7 * 24 * 60 * 60 * 1000; // Within 7 days
    });
    if (recentDocs.length >= 2) score += 0.1;

    return Math.min(1, score);
  }

  // ═══════════════════════════════════════════════════════════════
  // DEEP ANALYSIS WITH LLM
  // ═══════════════════════════════════════════════════════════════

  private async deepAnalysis(
    context: ConfidenceScoringContext
  ): Promise<{ generation: number; attribution: number; factual: number }> {
    const docSummary = context.documents
      .slice(0, 5)
      .map((d, i) => `[Doc ${i+1}] ${d.title}: ${d.content.slice(0, 300)}...`)
      .join('\n\n');

    const prompt = `Analyze the confidence of this answer.

QUERY: ${context.query}

ANSWER: ${context.answer}

SOURCE DOCUMENTS:
${docSummary}

Evaluate these confidence dimensions (0.0-1.0):

1. GENERATION QUALITY (0.0-1.0):
   - Is the answer well-structured and coherent?
   - Does it directly address the query?
   - Is the writing clear and professional?

2. ATTRIBUTION (0.0-1.0):
   - Are claims in the answer supported by the source documents?
   - Is information accurately taken from sources?
   - Are there unsupported claims?

3. FACTUAL ACCURACY (0.0-1.0):
   - Do the facts appear correct based on sources?
   - Are there contradictions between sources that weren't resolved?
   - Is the information clearly distinguishing fact from speculation?

OUTPUT FORMAT (JSON only):
{
  "generation": 0.0-1.0,
  "attribution": 0.0-1.0,
  "factual": 0.0-1.0,
  "reasoning": "Brief explanation of scoring"
}

Return ONLY the JSON object.`;

    try {
      const response = await callGroq(
        [{ role: 'user', content: prompt }],
        { temperature: 0 }
      );
      const jsonMatch = response.content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0]);
        return {
          generation: Math.min(1, Math.max(0, result.generation || 0.5)),
          attribution: Math.min(1, Math.max(0, result.attribution || 0.5)),
          factual: Math.min(1, Math.max(0, result.factual || 0.5)),
        };
      }
    } catch (error) {
      console.error('Deep analysis failed:', error);
    }

    // Fallback to estimation
    return {
      generation: this.estimateGenerationConfidence(context),
      attribution: this.estimateAttributionConfidence(context),
      factual: this.estimateFactualConfidence(context),
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPER METHODS
  // ═══════════════════════════════════════════════════════════════

  private determineLevel(
    overall: number,
    dimensions: ConfidenceScore['dimensions']
  ): ConfidenceScore['level'] {
    // Check for any critically low dimensions
    const hasLowDimension = Object.values(dimensions).some(d => d < 0.3);
    
    if (overall >= 0.8 && !hasLowDimension) return 'high';
    if (overall >= 0.6) return 'medium';
    if (overall >= 0.4) return 'low';
    return 'uncertain';
  }

  private generateExplanation(
    dimensions: ConfidenceScore['dimensions'],
    context: ConfidenceScoringContext
  ): { explanation: string; warnings: string[] } {
    const warnings: string[] = [];
    const parts: string[] = [];

    // Retrieval
    if (dimensions.retrieval >= 0.8) {
      parts.push('highly relevant sources found');
    } else if (dimensions.retrieval < 0.5) {
      warnings.push('Limited relevant sources available');
    }

    // Temporal
    if (dimensions.temporal >= 0.8) {
      parts.push('recent information');
    } else if (dimensions.temporal < 0.5) {
      warnings.push('Sources may be outdated');
    }

    // Attribution
    if (dimensions.attribution >= 0.8) {
      parts.push('well-supported by sources');
    } else if (dimensions.attribution < 0.5) {
      warnings.push('Some claims may not be fully supported');
    }

    // Factual
    if (dimensions.factual < 0.5) {
      warnings.push('Factual accuracy could not be fully verified');
    }

    // Document count
    if (context.documents.length < 2) {
      warnings.push('Based on limited sources');
    }

    const explanation = parts.length > 0
      ? `Answer is ${parts.join(', ')}.`
      : 'Moderate confidence based on available sources.';

    return { explanation, warnings };
  }
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

let scorer: ConfidenceScorer | null = null;

export function getConfidenceScorer(): ConfidenceScorer {
  if (!scorer) {
    scorer = new ConfidenceScorer();
  }
  return scorer;
}

/**
 * Quick helper to score answer confidence
 */
export function scoreAnswerConfidence(
  query: string,
  answer: string,
  documents: RAGDocument[],
  documentScores?: number[]
): ConfidenceScore {
  return getConfidenceScorer().quickScore({
    query,
    answer,
    documents,
    documentScores,
  });
}

/**
 * Format confidence for display
 */
export function formatConfidenceForUI(score: ConfidenceScore): {
  label: string;
  color: string;
  icon: string;
  percentage: number;
  tooltip: string;
} {
  const percentage = Math.round(score.overall * 100);
  
  const config: Record<ConfidenceScore['level'], { label: string; color: string; icon: string }> = {
    high: { label: 'High Confidence', color: 'green', icon: '✓' },
    medium: { label: 'Moderate Confidence', color: 'yellow', icon: '~' },
    low: { label: 'Low Confidence', color: 'orange', icon: '!' },
    uncertain: { label: 'Uncertain', color: 'red', icon: '?' },
  };

  const { label, color, icon } = config[score.level];
  const tooltip = score.warnings.length > 0
    ? `${score.explanation}\n\nWarnings:\n${score.warnings.map(w => `• ${w}`).join('\n')}`
    : score.explanation;

  return { label, color, icon, percentage, tooltip };
}
