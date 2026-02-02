import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptGroqJson, isGroqConfigured } from '@/lib/groq';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 300;

interface TradingSignal {
  ticker: string;
  signal: 'strong_buy' | 'buy' | 'hold' | 'sell' | 'strong_sell';
  confidence: number; // 0-100
  timeframe: '24h' | '1w' | '1m';
  reasoning: string;
  newsEvents: string[];
  riskLevel: 'low' | 'medium' | 'high';
  catalysts: string[];
}

interface SignalsResponse {
  signals: TradingSignal[];
  disclaimer: string;
}

const SYSTEM_PROMPT = `You are a crypto news-based trading signal generator. Analyze news for potential trading opportunities.

IMPORTANT DISCLAIMER: This is for educational purposes only. Not financial advice. Always DYOR.

Based on news sentiment and events, generate signals:
- ticker: Cryptocurrency symbol
- signal: strong_buy, buy, hold, sell, strong_sell
- confidence: 0-100 based on news clarity and reliability
- timeframe: Expected relevance period
- reasoning: Brief explanation
- newsEvents: Key news driving this signal
- riskLevel: Based on volatility and uncertainty
- catalysts: Upcoming events that could affect this

Be CONSERVATIVE. Only give strong signals when news is very clear.
Default to "hold" when uncertain.
Consider: news reliability, market impact, timing.

Respond with JSON: { "signals": [...], "disclaimer": "..." }`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '30'), 50);
  const minConfidence = parseInt(searchParams.get('min_confidence') || '50');
  const ticker = searchParams.get('ticker')?.toUpperCase();

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
        signals: [],
        disclaimer: 'No articles to analyze',
      });
    }

    const articlesForAnalysis = data.articles.map(a => ({
      title: a.title,
      source: a.source,
      description: a.description || '',
      timeAgo: a.timeAgo,
    }));

    let tickerNote = '';
    if (ticker) {
      tickerNote = `\nFocus especially on ${ticker} but include other relevant signals.`;
    }

    const userPrompt = `Generate news-based trading signals from these ${articlesForAnalysis.length} articles:${tickerNote}

${JSON.stringify(articlesForAnalysis, null, 2)}`;

    const result = await promptGroqJson<SignalsResponse>(
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 3000, temperature: 0.3 }
    );

    // Filter signals
    let signals = result.signals || [];
    
    // Filter by confidence
    signals = signals.filter(s => s.confidence >= minConfidence);
    
    // Filter by ticker if specified
    if (ticker) {
      signals = signals.filter(s => s.ticker.toUpperCase() === ticker);
    }
    
    // Sort by confidence
    signals.sort((a, b) => b.confidence - a.confidence);

    // Stats
    const signalCounts = {
      strong_buy: signals.filter(s => s.signal === 'strong_buy').length,
      buy: signals.filter(s => s.signal === 'buy').length,
      hold: signals.filter(s => s.signal === 'hold').length,
      sell: signals.filter(s => s.signal === 'sell').length,
      strong_sell: signals.filter(s => s.signal === 'strong_sell').length,
    };

    return NextResponse.json(
      {
        signals,
        summary: {
          total: signals.length,
          distribution: signalCounts,
          averageConfidence: signals.length > 0 
            ? Math.round(signals.reduce((sum, s) => sum + s.confidence, 0) / signals.length)
            : 0,
        },
        disclaimer: result.disclaimer || '⚠️ NOT FINANCIAL ADVICE. For educational purposes only. Always do your own research before trading.',
        articlesAnalyzed: data.articles.length,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    const logger = createRequestLogger(request);
    logger.error('Signal generation error', { error });
    return ApiError.internal('Failed to generate signals', error);
  }
}
