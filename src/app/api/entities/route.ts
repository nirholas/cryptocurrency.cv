import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptGroqJson, isGroqConfigured } from '@/lib/groq';

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
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);
  const type = searchParams.get('type') || undefined; // Filter by entity type
  const minMentions = parseInt(searchParams.get('min_mentions') || '1');

  if (!isGroqConfigured()) {
    return NextResponse.json(
      { 
        error: 'AI features not configured',
        message: 'Set GROQ_API_KEY environment variable. Get a free key at https://console.groq.com/keys',
      },
      { status: 503 }
    );
  }

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

    const result = await promptGroqJson<EntitiesResponse>(
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
    return NextResponse.json(
      { error: 'Failed to extract entities', details: String(error) },
      { status: 500 }
    );
  }
}
