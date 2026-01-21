import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptGroqJson, isGroqConfigured } from '@/lib/groq';

export const runtime = 'edge';
export const revalidate = 300;

interface SentimentArticle {
  title: string;
  link: string;
  source: string;
  sentiment: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
  confidence: number; // 0-100
  reasoning: string;
  impactLevel: 'high' | 'medium' | 'low';
  timeHorizon: 'immediate' | 'short_term' | 'long_term';
  affectedAssets: string[];
}

interface MarketSentiment {
  overall: 'very_bullish' | 'bullish' | 'neutral' | 'bearish' | 'very_bearish';
  score: number; // -100 to 100
  confidence: number;
  summary: string;
  keyDrivers: string[];
}

interface SentimentResponse {
  articles: SentimentArticle[];
  market: MarketSentiment;
}

const SYSTEM_PROMPT = `You are a cryptocurrency market sentiment analyst. Analyze news articles for market sentiment and potential impact.

For each article:
- sentiment: very_bullish, bullish, neutral, bearish, very_bearish
- confidence: 0-100 how confident you are in this assessment
- reasoning: Brief explanation of why this is bullish/bearish
- impactLevel: high (market-moving), medium, low (minor news)
- timeHorizon: immediate (<24h), short_term (1-7 days), long_term (>1 week)
- affectedAssets: Which cryptocurrencies this news affects

Also provide overall market sentiment:
- overall: Aggregated market mood
- score: -100 (extremely bearish) to +100 (extremely bullish)
- confidence: How confident in overall assessment
- summary: 1-2 sentence market summary
- keyDrivers: Top 3 factors driving sentiment

Be objective. Don't overreact to minor news. Consider the source reliability.

Respond with JSON: { "articles": [...], "market": {...} }`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const asset = searchParams.get('asset')?.toUpperCase(); // Filter by asset (BTC, ETH, etc.)

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
        articles: [],
        market: {
          overall: 'neutral',
          score: 0,
          confidence: 0,
          summary: 'No articles to analyze',
          keyDrivers: [],
        },
      });
    }

    const articlesForAnalysis = data.articles.map(a => ({
      title: a.title,
      link: a.link,
      source: a.source,
      description: a.description || '',
      timeAgo: a.timeAgo,
    }));

    let contextNote = '';
    if (asset) {
      contextNote = `\nFocus especially on news affecting ${asset}.`;
    }

    const userPrompt = `Analyze sentiment for these ${articlesForAnalysis.length} crypto news articles:${contextNote}

${JSON.stringify(articlesForAnalysis, null, 2)}`;

    const result = await promptGroqJson<SentimentResponse>(
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 4000, temperature: 0.3 }
    );

    // Filter by asset if specified
    let articles = result.articles || [];
    if (asset) {
      articles = articles.filter(a => 
        a.affectedAssets.some(ticker => 
          ticker.toUpperCase() === asset || 
          ticker.toUpperCase().includes(asset)
        )
      );
    }

    // Calculate distribution
    const distribution = {
      very_bullish: articles.filter(a => a.sentiment === 'very_bullish').length,
      bullish: articles.filter(a => a.sentiment === 'bullish').length,
      neutral: articles.filter(a => a.sentiment === 'neutral').length,
      bearish: articles.filter(a => a.sentiment === 'bearish').length,
      very_bearish: articles.filter(a => a.sentiment === 'very_bearish').length,
    };

    // High impact news
    const highImpact = articles.filter(a => a.impactLevel === 'high');

    return NextResponse.json(
      {
        articles,
        market: result.market,
        distribution,
        highImpactNews: highImpact,
        meta: {
          articlesAnalyzed: data.articles.length,
          asset: asset || 'all',
          analyzedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Sentiment analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze sentiment', details: String(error) },
      { status: 500 }
    );
  }
}
