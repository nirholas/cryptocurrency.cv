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
 * Answer Attribution
 * 
 * Provides fine-grained source attribution:
 * - Inline citations [1], [2]
 * - Exact quote linking
 * - Sentence-level attribution
 * - Source highlighting data
 */

import { callGroq, parseGroqJson } from '../groq';
import type { ScoredDocument } from './types';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface Citation {
  citationId: string;        // e.g., "1", "2a", "2b"
  sourceIndex: number;       // Which source document
  claim: string;             // The claim being cited
  quote: string;             // Exact quote from source
  quoteLocation: {
    start: number;           // Character position in source
    end: number;
  };
  confidence: number;        // How confident in this attribution
}

export interface AttributedAnswer {
  answer: string;            // Answer with inline [1], [2] citations
  citations: Citation[];
  uncitedClaims: string[];   // Claims without source support
  attributionScore: number;  // 0-1, how well attributed
  sourceHighlights: {
    sourceIndex: number;
    highlights: { start: number; end: number; citationId: string }[];
  }[];
}

export interface SourceHighlight {
  sourceIndex: number;
  sourceTitle: string;
  url?: string;
  highlightedContent: string;  // With <mark> tags
  usedQuotes: string[];
}

// ═══════════════════════════════════════════════════════════════
// CLAIM EXTRACTION
// ═══════════════════════════════════════════════════════════════

interface ExtractedClaim {
  claim: string;
  type: 'fact' | 'statistic' | 'quote' | 'event' | 'opinion';
  requiresCitation: boolean;
}

/**
 * Extract individual claims from an answer
 */
export async function extractClaims(answer: string): Promise<ExtractedClaim[]> {
  const prompt = `Extract individual factual claims from this answer:

"${answer}"

For each claim, identify:
- The claim itself
- Type: fact, statistic, quote, event, or opinion
- Whether it requires a citation (opinions and common knowledge don't)

Return JSON:
{
  "claims": [
    {"claim": "...", "type": "fact|statistic|quote|event|opinion", "requiresCitation": true/false}
  ]
}`;

  try {
    const response = await callGroq([{ role: 'user', content: prompt }], {
      temperature: 0,
      maxTokens: 500,
      jsonMode: true,
    });

    const { claims } = parseGroqJson<{ claims: ExtractedClaim[] }>(response.content);
    return claims;
  } catch {
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// QUOTE FINDING
// ═══════════════════════════════════════════════════════════════

/**
 * Find the best supporting quote for a claim in a document
 */
export async function findSupportingQuote(
  claim: string,
  document: ScoredDocument
): Promise<{
  found: boolean;
  quote?: string;
  confidence: number;
  location?: { start: number; end: number };
}> {
  const prompt = `Find a quote that supports this claim:

Claim: "${claim}"

Document:
"${document.content}"

If there's a supporting quote, return it EXACTLY as it appears in the document.

Return JSON:
{
  "found": true/false,
  "quote": "exact quote from document" or null,
  "confidence": 0.0-1.0
}`;

  try {
    const response = await callGroq([{ role: 'user', content: prompt }], {
      temperature: 0,
      maxTokens: 200,
      jsonMode: true,
    });

    const result = parseGroqJson<{
      found: boolean;
      quote?: string;
      confidence: number;
    }>(response.content);

    if (result.found && result.quote) {
      // Find quote location in document
      const start = document.content.indexOf(result.quote);
      if (start !== -1) {
        return {
          ...result,
          location: { start, end: start + result.quote.length },
        };
      }
    }

    return result;
  } catch {
    return { found: false, confidence: 0 };
  }
}

// ═══════════════════════════════════════════════════════════════
// FULL ATTRIBUTION
// ═══════════════════════════════════════════════════════════════

/**
 * Generate answer with full attribution
 */
export async function generateAttributedAnswer(
  query: string,
  documents: ScoredDocument[]
): Promise<AttributedAnswer> {
  // Build numbered source context
  const context = documents
    .slice(0, 5)
    .map((d, i) => `[${i + 1}] ${d.title}\n${d.content.substring(0, 800)}`)
    .join('\n\n---\n\n');

  const prompt = `Answer this question with detailed citations.

Question: "${query}"

Sources:
${context}

IMPORTANT:
- Add inline citations like [1], [2] after each factual claim
- For key quotes, include the exact text in quotation marks
- If combining info from multiple sources, cite all: [1,2]
- Don't make claims without source support

Return JSON:
{
  "answer": "Your answer with [1], [2] citations inline",
  "citations": [
    {
      "citationId": "1",
      "sourceIndex": 1,
      "claim": "the claim being cited",
      "quote": "exact supporting quote from source"
    }
  ],
  "uncitedClaims": ["any claims you couldn't find sources for"]
}`;

  try {
    const response = await callGroq([{ role: 'user', content: prompt }], {
      temperature: 0.2,
      maxTokens: 1000,
      jsonMode: true,
    });

    const result = parseGroqJson<{
      answer: string;
      citations: Omit<Citation, 'quoteLocation' | 'confidence'>[];
      uncitedClaims: string[];
    }>(response.content);

    // Enrich citations with quote locations
    const enrichedCitations: Citation[] = [];
    const sourceHighlights: AttributedAnswer['sourceHighlights'] = documents
      .slice(0, 5)
      .map((_, i) => ({ sourceIndex: i + 1, highlights: [] }));

    for (const citation of result.citations) {
      const doc = documents[citation.sourceIndex - 1];
      if (!doc) continue;

      const start = doc.content.indexOf(citation.quote);
      const enriched: Citation = {
        ...citation,
        quoteLocation: start !== -1 
          ? { start, end: start + citation.quote.length }
          : { start: 0, end: 0 },
        confidence: start !== -1 ? 0.9 : 0.6,
      };
      enrichedCitations.push(enriched);

      // Add to highlights
      if (start !== -1) {
        const highlightEntry = sourceHighlights.find(
          h => h.sourceIndex === citation.sourceIndex
        );
        if (highlightEntry) {
          highlightEntry.highlights.push({
            start,
            end: start + citation.quote.length,
            citationId: citation.citationId,
          });
        }
      }
    }

    // Calculate attribution score
    const citedClaimCount = enrichedCitations.length;
    const uncitedCount = result.uncitedClaims.length;
    const totalClaims = citedClaimCount + uncitedCount;
    const attributionScore = totalClaims > 0 
      ? citedClaimCount / totalClaims 
      : 1;

    return {
      answer: result.answer,
      citations: enrichedCitations,
      uncitedClaims: result.uncitedClaims,
      attributionScore,
      sourceHighlights,
    };
  } catch {
    // Fallback to simple answer
    return {
      answer: "Unable to generate attributed answer.",
      citations: [],
      uncitedClaims: [],
      attributionScore: 0,
      sourceHighlights: [],
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// SOURCE RENDERING
// ═══════════════════════════════════════════════════════════════

/**
 * Generate highlighted source content for UI display
 */
export function generateSourceHighlights(
  documents: ScoredDocument[],
  attribution: AttributedAnswer
): SourceHighlight[] {
  return documents.slice(0, 5).map((doc, i) => {
    const sourceIndex = i + 1;
    const highlightData = attribution.sourceHighlights.find(
      h => h.sourceIndex === sourceIndex
    );

    let highlightedContent = doc.content;
    const usedQuotes: string[] = [];

    if (highlightData && highlightData.highlights.length > 0) {
      // Sort highlights by position (reverse to avoid offset issues)
      const sorted = [...highlightData.highlights].sort(
        (a, b) => b.start - a.start
      );

      for (const highlight of sorted) {
        const quote = doc.content.substring(highlight.start, highlight.end);
        usedQuotes.push(quote);
        
        highlightedContent = 
          highlightedContent.substring(0, highlight.start) +
          `<mark data-citation="${highlight.citationId}">${quote}</mark>` +
          highlightedContent.substring(highlight.end);
      }
    }

    return {
      sourceIndex,
      sourceTitle: doc.title,
      url: doc.url,
      highlightedContent,
      usedQuotes: usedQuotes.reverse(),
    };
  });
}

// ═══════════════════════════════════════════════════════════════
// CITATION FORMATTING
// ═══════════════════════════════════════════════════════════════

/**
 * Format citations for display
 */
export function formatCitationsForDisplay(
  attribution: AttributedAnswer,
  documents: ScoredDocument[]
): {
  footnotes: string[];
  bibliography: { index: number; title: string; url?: string }[];
} {
  const footnotes: string[] = [];
  const usedSources = new Set<number>();

  for (const citation of attribution.citations) {
    usedSources.add(citation.sourceIndex);
    footnotes.push(
      `[${citation.citationId}] "${citation.quote}" — ${documents[citation.sourceIndex - 1]?.title || 'Unknown'}`
    );
  }

  const bibliography = [...usedSources].sort().map(index => ({
    index,
    title: documents[index - 1]?.title || 'Unknown',
    url: documents[index - 1]?.url,
  }));

  return { footnotes, bibliography };
}
