import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptGroqJson, isGroqConfigured } from '@/lib/groq';
import { groqNotConfiguredResponse } from '@/app/api/_utils';

export const runtime = 'edge';
export const revalidate = 300; // 5 minute cache

interface DigestSection {
  title: string;
  summary: string;
  articles: string[];
}

interface DigestResponse {
  headline: string;
  tldr: string;
  marketSentiment: {
    overall: 'bullish' | 'bearish' | 'neutral' | 'mixed';
    reasoning: string;
  };
  sections: DigestSection[];
  mustRead: {
    title: string;
    source: string;
    why: string;
  }[];
  tickers: {
    symbol: string;
    mentions: number;
    sentiment: 'bullish' | 'bearish' | 'neutral';
  }[];
}

const SYSTEM_PROMPT = `You are a crypto news editor creating a daily digest. Analyze the provided articles and create a structured summary.

Create a digest with:
1. headline: A catchy headline summarizing the day's biggest story
2. tldr: 2-3 sentence summary of what happened today
3. marketSentiment: Overall market mood with reasoning
4. sections: Group related news into 3-5 themed sections (e.g., "Bitcoin & ETFs", "DeFi Updates", "Regulatory News")
5. mustRead: Top 2-3 must-read articles with reasons why they matter
6. tickers: Most mentioned cryptocurrencies with sentiment

Respond with valid JSON matching this structure.`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period') || '24h'; // 24h, 12h, 6h
  const format = searchParams.get('format') || 'full'; // full, brief, newsletter

  if (!isGroqConfigured()) return groqNotConfiguredResponse();

  try {
    // Fetch articles based on period
    const hoursMap: Record<string, number> = { '6h': 6, '12h': 12, '24h': 24 };
    const hours = hoursMap[period] || 24;
    const limit = Math.min(hours * 5, 100); // ~5 articles per hour
    
    const data = await getLatestNews(limit);
    
    if (data.articles.length === 0) {
      return NextResponse.json({
        error: 'No articles available for digest',
      }, { status: 404 });
    }

    // Filter to articles within the time period
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const recentArticles = data.articles.filter(a => {
      const pubDate = new Date(a.pubDate);
      return pubDate >= cutoff;
    });

    const articlesForDigest = recentArticles.length > 0 ? recentArticles : data.articles.slice(0, 20);

    const articlesText = articlesForDigest
      .map(a => `- [${a.source}] ${a.title}: ${a.description || 'No description'}`)
      .join('\n');

    const formatInstructions = {
      full: 'Create a comprehensive digest with all sections.',
      brief: 'Create a brief digest with just headline, tldr, and top 3 tickers.',
      newsletter: 'Format for email newsletter - make it engaging and readable.',
    }[format] || 'Create a comprehensive digest with all sections.';

    const userPrompt = `${formatInstructions}

Period: Last ${hours} hours
Total articles: ${articlesForDigest.length}

Articles:
${articlesText}`;

    const digest = await promptGroqJson<DigestResponse>(
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 3000, temperature: 0.5 }
    );

    return NextResponse.json(
      {
        digest,
        meta: {
          period,
          format,
          articlesAnalyzed: articlesForDigest.length,
          generatedAt: new Date().toISOString(),
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
    console.error('Digest error:', error);
    return NextResponse.json(
      { error: 'Failed to generate digest', details: String(error) },
      { status: 500 }
    );
  }
}
