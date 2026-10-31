/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptAIJson, isAIConfigured, AIAuthError } from '@/lib/ai-provider';
import { aiNotConfiguredResponse, aiAuthErrorResponse } from '@/app/api/_utils';
import { intParam } from '@/lib/query-params';

export const runtime = 'edge';
export const revalidate = 300;

interface Entity {
  name: string;
  type: 'ticker' | 'person' | 'company' | 'protocol' | 'exchange' | 'regulator' | 'event';
  mentions: number;
  context: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface EntitiesResponse {
  entities: Entity[];
}

const SYSTEM_PROMPT = `You are a named entity recognition (NER) system specialized in cryptocurrency news.

Extract all entities from the provided articles and categorize them:
- ticker: Cryptocurrency symbols (BTC, ETH, SOL, etc.)
- person: People mentioned (Vitalik Buterin, CZ, Gary Gensler, etc.)
- company: Companies (BlackRock, Coinbase, MicroStrategy, etc.)
- protocol: DeFi/crypto protocols (Uniswap, Aave, Lido, etc.)
- exchange: Exchanges (Binance, Kraken, etc.)
- regulator: Regulatory bodies (SEC, CFTC, DOJ, etc.)
- event: Events (ETF approval, halving, conference, etc.)

For each entity, provide:
- name: Canonical name
- type: One of the categories above
- mentions: How many articles mention it
- context: 1-2 brief context snippets showing how it's mentioned
- sentiment: Overall sentiment when this entity is mentioned

Respond with JSON: { "entities": [...] }`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = intParam(searchParams, 'limit', { fallback: 30, min: 1, max: 50 });
  const type = searchParams.get('type') || undefined; // Filter by entity type
  const minMentions = intParam(searchParams, 'min_mentions', { fallback: 1, min: 0, max: 10000 });

  if (!isAIConfigured()) return aiNotConfiguredResponse();

  try {
    const data = await getLatestNews(limit);
    
    if (data.articles.length === 0) {
      return NextResponse.json({
        entities: [],
        message: 'No articles to analyze',
      });
    }

    const articlesText = data.articles
      .map((a, i) => `[${i + 1}] ${a.title}. ${a.description || ''}`)
      .join('\n\n');

    const userPrompt = `Extract all named entities from these ${data.articles.length} crypto news articles:

${articlesText}`;

    const result = await promptAIJson<EntitiesResponse>(
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 3000 }
    );

    // Filter and sort entities
    let entities = result.entities || [];
    
    // Filter by type if specified
    if (type) {
      entities = entities.filter(e => e.type === type);
    }
    
    // Filter by minimum mentions
    entities = entities.filter(e => e.mentions >= minMentions);
    
    // Sort by mentions (descending)
    entities.sort((a, b) => b.mentions - a.mentions);

    // Group by type for summary
    const byType = entities.reduce((acc, e) => {
      acc[e.type] = (acc[e.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json(
      {
        entities,
        summary: {
          total: entities.length,
          byType,
        },
        articlesAnalyzed: data.articles.length,
        extractedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Entity extraction error:', error);
    if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
      return aiAuthErrorResponse((error as Error).message);
    }
    return NextResponse.json(
      { error: 'Failed to extract entities', details: process.env.NODE_ENV === 'development' ? String(error) : 'Internal server error' },
      { status: 500 }
    );
  }
}
