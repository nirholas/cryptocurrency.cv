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
 * Intelligent Query Routing
 * 
 * Route queries to optimal retrieval strategies:
 * - Semantic search for conceptual queries
 * - Keyword search for specific terms
 * - Hybrid for complex queries
 * - Agentic for multi-hop reasoning
 * - Direct answer for simple questions
 */

import type { QueryClassification } from './query-processor';
import { callGroq } from '../groq';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type RouteType = 
  | 'semantic'      // Conceptual, meaning-based search
  | 'keyword'       // Exact term matching
  | 'hybrid'        // Combination search
  | 'agentic'       // Multi-hop reasoning required
  | 'direct'        // Can answer without retrieval
  | 'temporal'      // Time-sensitive queries
  | 'comparison'    // Compare multiple entities
  | 'aggregation';  // Aggregate info from multiple sources

export interface QueryRoute {
  primary: RouteType;
  secondary?: RouteType;
  confidence: number;
  parameters: RouteParameters;
  reasoning: string;
}

export interface RouteParameters {
  // Retrieval parameters
  topK: number;
  scoreThreshold: number;
  useReranking: boolean;
  rerankingTopN?: number;
  
  // Search type weights
  semanticWeight: number;
  keywordWeight: number;
  
  // Processing
  useHyDE: boolean;
  useDecomposition: boolean;
  maxHops?: number;
  
  // Time filtering
  timeFilter?: {
    startDate?: Date;
    endDate?: Date;
    recencyBias?: number;
  };
  
  // Entity focus
  entities?: string[];
  
  // Special handling
  requiresMultipleSources?: boolean;
  needsFactVerification?: boolean;
}

export interface RouterConfig {
  useDeepAnalysis?: boolean;
  defaultRoute?: RouteType;
  model?: string;
}

// ═══════════════════════════════════════════════════════════════
// QUERY ROUTER
// ═══════════════════════════════════════════════════════════════

export class QueryRouter {
  constructor() {}

  /**
   * Route query to optimal strategy
   */
  async route(
    query: string,
    classification?: QueryClassification,
    config: RouterConfig = {}
  ): Promise<QueryRoute> {
    // Quick route for simple cases
    const quickRoute = this.quickRoute(query);
    if (quickRoute.confidence >= 0.85) {
      return quickRoute;
    }

    // Deep analysis for complex queries
    if (config.useDeepAnalysis) {
      return this.deepRoute(query, classification);
    }

    // Use classification-based routing
    if (classification) {
      return this.routeByClassification(query, classification);
    }

    return quickRoute;
  }

  /**
   * Fast pattern-based routing
   */
  quickRoute(query: string): QueryRoute {
    const normalized = query.toLowerCase().trim();

    // Direct answer patterns (no retrieval needed)
    if (this.isDirectAnswerable(normalized)) {
      return this.createRoute('direct', 0.9, {
        topK: 0,
        scoreThreshold: 0,
        useReranking: false,
        semanticWeight: 0,
        keywordWeight: 0,
        useHyDE: false,
        useDecomposition: false,
      }, 'Question can be answered directly');
    }

    // Temporal patterns
    const temporalMatch = this.matchTemporalPattern(normalized);
    if (temporalMatch) {
      return this.createRoute('temporal', temporalMatch.confidence, {
        ...this.getDefaultParams(),
        timeFilter: temporalMatch.timeFilter,
        semanticWeight: 0.6,
        keywordWeight: 0.4,
        useReranking: true,
      }, temporalMatch.reasoning);
    }

    // Comparison patterns
    if (this.matchComparisonPattern(normalized)) {
      return this.createRoute('comparison', 0.85, {
        ...this.getDefaultParams(),
        topK: 10,
        useReranking: true,
        rerankingTopN: 6,
        requiresMultipleSources: true,
      }, 'Query compares multiple entities');
    }

    // Specific entity/term queries (keyword-focused)
    const entities = this.extractEntities(normalized);
    if (entities.length > 0 && this.isSpecificQuery(normalized)) {
      return this.createRoute('keyword', 0.8, {
        ...this.getDefaultParams(),
        semanticWeight: 0.3,
        keywordWeight: 0.7,
        entities,
      }, 'Query targets specific entities');
    }

    // Complex multi-part queries (agentic)
    if (this.isComplexQuery(normalized)) {
      return this.createRoute('agentic', 0.85, {
        ...this.getDefaultParams(),
        topK: 8,
        useDecomposition: true,
        useReranking: true,
        maxHops: 3,
      }, 'Query requires multi-step reasoning');
    }

    // Default to hybrid
    return this.createRoute('hybrid', 0.7, {
      ...this.getDefaultParams(),
      semanticWeight: 0.6,
      keywordWeight: 0.4,
    }, 'Default hybrid routing');
  }

  /**
   * Route based on query classification
   */
  private routeByClassification(
    query: string,
    classification: QueryClassification
  ): QueryRoute {
    const params = this.getDefaultParams();
    
    switch (classification.intent) {
      case 'temporal':
        return this.createRoute('temporal', 0.85, {
          ...params,
          timeFilter: { recencyBias: 0.8 },
          keywordWeight: 0.6,
          semanticWeight: 0.4,
        }, 'Temporal queries need recent data');

      case 'aggregation':
        return this.createRoute('semantic', 0.8, {
          ...params,
          topK: 8,
          useReranking: true,
          semanticWeight: 0.8,
          keywordWeight: 0.2,
        }, 'Aggregation queries benefit from semantic search');

      case 'causal':
        return this.createRoute('semantic', 0.85, {
          ...params,
          useHyDE: true,
          semanticWeight: 0.9,
          keywordWeight: 0.1,
        }, 'Causal queries need conceptual matching');

      case 'comparison':
        return this.createRoute('comparison', 0.85, {
          ...params,
          topK: 10,
          requiresMultipleSources: true,
          useReranking: true,
        }, 'Comparisons need multiple perspectives');

      case 'predictive':
        return this.createRoute('aggregation', 0.8, {
          ...params,
          topK: 10,
          timeFilter: { recencyBias: 0.7 },
          requiresMultipleSources: true,
        }, 'Predictions need aggregated analysis');

      case 'factual':
        return this.createRoute('hybrid', 0.85, {
          ...params,
          needsFactVerification: true,
          topK: 8,
          useReranking: true,
        }, 'Factual queries need verification');

      case 'opinion':
        return this.createRoute('semantic', 0.75, {
          ...params,
          topK: 10,
          semanticWeight: 0.7,
          keywordWeight: 0.3,
        }, 'Opinion queries need broad semantic search');

      case 'procedural':
        return this.createRoute('semantic', 0.8, {
          ...params,
          useHyDE: true,
          semanticWeight: 0.85,
          keywordWeight: 0.15,
        }, 'Procedural queries need step-by-step matching');

      default:
        return this.createRoute('hybrid', 0.7, params, 'Default hybrid routing');
    }
  }

  /**
   * Deep LLM-based routing for complex queries
   */
  private async deepRoute(
    query: string,
    classification?: QueryClassification
  ): Promise<QueryRoute> {
    const prompt = `Analyze this crypto news query and determine the optimal retrieval strategy.

QUERY: "${query}"
${classification ? `CLASSIFIED AS: ${classification.intent} (complexity: ${classification.complexity})` : ''}

Determine the best route:
1. semantic - For conceptual, meaning-based queries
2. keyword - For queries with specific terms/entities to match
3. hybrid - For mixed conceptual and specific queries
4. agentic - For complex multi-step reasoning queries
5. temporal - For time-sensitive queries (recent news, trends)
6. comparison - For comparing multiple entities
7. aggregation - For gathering info from multiple sources

Also determine optimal parameters:
- topK: How many documents to retrieve (3-15)
- useReranking: Whether to rerank results (true for quality, false for speed)
- semanticWeight: Weight for semantic search (0.0-1.0)
- keywordWeight: Weight for keyword search (0.0-1.0)
- useHyDE: Whether to use hypothetical document expansion
- useDecomposition: Whether to break into sub-queries

OUTPUT JSON:
{
  "route": "semantic|keyword|hybrid|agentic|temporal|comparison|aggregation",
  "confidence": 0.0-1.0,
  "parameters": {
    "topK": 5,
    "useReranking": true,
    "semanticWeight": 0.6,
    "keywordWeight": 0.4,
    "useHyDE": false,
    "useDecomposition": false
  },
  "reasoning": "Brief explanation"
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
        return this.createRoute(
          result.route || 'hybrid',
          result.confidence || 0.7,
          {
            ...this.getDefaultParams(),
            ...(result.parameters || {}),
            scoreThreshold: 0.5,
          },
          result.reasoning || 'LLM-determined routing'
        );
      }
    } catch (error) {
      console.error('Deep routing failed:', error);
    }

    return this.quickRoute(query);
  }

  // ═══════════════════════════════════════════════════════════════
  // PATTERN MATCHERS
  // ═══════════════════════════════════════════════════════════════

  private isDirectAnswerable(query: string): boolean {
    const directPatterns = [
      /^what\s+is\s+(bitcoin|ethereum|crypto|blockchain)\??$/i,
      /^(hi|hello|hey|thanks|thank you)/i,
      /^how\s+are\s+you/i,
    ];
    return directPatterns.some(p => p.test(query));
  }

  private matchTemporalPattern(query: string): {
    confidence: number;
    timeFilter: RouteParameters['timeFilter'];
    reasoning: string;
  } | null {
    const patterns: {
      pattern: RegExp;
      filter: RouteParameters['timeFilter'];
      reasoning: string;
    }[] = [
      {
        pattern: /(?:today|today's|this morning)/i,
        filter: { 
          startDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          recencyBias: 0.95 
        },
        reasoning: 'Query about today\'s news',
      },
      {
        pattern: /(?:yesterday|yesterday's)/i,
        filter: { 
          startDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
          endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
          recencyBias: 0.9 
        },
        reasoning: 'Query about yesterday\'s news',
      },
      {
        pattern: /(?:this week|past week|last 7 days)/i,
        filter: { 
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          recencyBias: 0.8 
        },
        reasoning: 'Query about this week\'s news',
      },
      {
        pattern: /(?:this month|past month|last 30 days)/i,
        filter: { 
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          recencyBias: 0.6 
        },
        reasoning: 'Query about this month\'s news',
      },
      {
        pattern: /(?:latest|recent|just now|breaking)/i,
        filter: { 
          recencyBias: 0.9 
        },
        reasoning: 'Query for latest news',
      },
    ];

    for (const { pattern, filter, reasoning } of patterns) {
      if (pattern.test(query)) {
        return { confidence: 0.85, timeFilter: filter, reasoning };
      }
    }

    return null;
  }

  private matchComparisonPattern(query: string): boolean {
    const patterns = [
      /compare|comparison|versus|vs\.?|better|worse|difference between/i,
      /(\w+)\s+(?:or|vs\.?|versus)\s+(\w+)/i,
      /which\s+(?:is|are)\s+(?:better|worse|more|less)/i,
    ];
    return patterns.some(p => p.test(query));
  }

  private isSpecificQuery(query: string): boolean {
    // Contains specific tickers or proper nouns
    const patterns = [
      /\$[A-Z]{2,5}/i, // Ticker symbols like $BTC
      /\b[A-Z]{3,5}\b/, // Uppercase abbreviations
      /\d+/, // Contains numbers
      /"[^"]+"/,  // Quoted terms
    ];
    return patterns.some(p => p.test(query));
  }

  private isComplexQuery(query: string): boolean {
    const indicators = [
      /and\s+(?:also|then|what)/i,
      /first.*then/i,
      /step\s+by\s+step/i,
      /explain.*how.*(?:and|then)/i,
      /what.*why.*how/i,
      /multiple|several|various/i,
    ];
    
    // Also check for very long queries
    const wordCount = query.split(/\s+/).length;
    
    return indicators.some(p => p.test(query)) || wordCount > 25;
  }

  private extractEntities(query: string): string[] {
    const entities: string[] = [];
    
    // Crypto names and tickers
    const cryptoPatterns: Record<string, string> = {
      'bitcoin|btc': 'Bitcoin',
      'ethereum|eth': 'Ethereum',
      'solana|sol': 'Solana',
      'ripple|xrp': 'XRP',
      'cardano|ada': 'Cardano',
      'dogecoin|doge': 'Dogecoin',
      'polygon|matic': 'Polygon',
      'avalanche|avax': 'Avalanche',
      'polkadot|dot': 'Polkadot',
      'chainlink|link': 'Chainlink',
    };

    for (const [pattern, name] of Object.entries(cryptoPatterns)) {
      if (new RegExp(pattern, 'i').test(query)) {
        entities.push(name);
      }
    }

    // Extract ticker symbols
    const tickers = query.match(/\$[A-Z]{2,5}/gi);
    if (tickers) {
      entities.push(...tickers.map(t => t.toUpperCase()));
    }

    return [...new Set(entities)];
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  private getDefaultParams(): RouteParameters {
    return {
      topK: 5,
      scoreThreshold: 0.5,
      useReranking: true,
      rerankingTopN: 5,
      semanticWeight: 0.6,
      keywordWeight: 0.4,
      useHyDE: false,
      useDecomposition: false,
    };
  }

  private createRoute(
    primary: RouteType,
    confidence: number,
    parameters: RouteParameters,
    reasoning: string
  ): QueryRoute {
    return {
      primary,
      confidence,
      parameters,
      reasoning,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

let router: QueryRouter | null = null;

export function getQueryRouter(): QueryRouter {
  if (!router) {
    router = new QueryRouter();
  }
  return router;
}

/**
 * Quick helper to route a query
 */
export async function routeQuery(
  query: string,
  classification?: QueryClassification
): Promise<QueryRoute> {
  return getQueryRouter().route(query, classification);
}
