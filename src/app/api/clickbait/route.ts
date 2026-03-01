import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptAIJson, isAIConfigured, AIAuthError } from '@/lib/ai-provider';
import { aiNotConfiguredResponse, aiAuthErrorResponse } from '@/app/api/_utils';
import { staleCache, generateCacheKey } from '@/lib/cache';

export const runtime = 'edge';
export const revalidate = 300;

interface HeadlineAnalysis {
  title: string;
  link: string;
  source: string;
  clickbaitScore: number; // 0-100
  clickbaitReasons: string[];
  rewrittenTitle: string;
  emotionalTone: 'fear' | 'greed' | 'excitement' | 'neutral' | 'urgency';
  accuracy: 'likely_accurate' | 'possibly_exaggerated' | 'needs_verification';
}

interface ClickbaitResponse {
  analysis: HeadlineAnalysis[];
}

const SYSTEM_PROMPT = `You are a media literacy expert analyzing cryptocurrency news headlines for clickbait and sensationalism.

For each headline, evaluate:
1. clickbaitScore: 0-100 (0 = factual, 100 = pure clickbait)
2. clickbaitReasons: Why it might be clickbait (e.g., "Uses FOMO language", "Exaggerated claims", "Missing context")
3. rewrittenTitle: A more accurate, neutral version of the headline
4. emotionalTone: The emotion it's trying to evoke
5. accuracy: Your assessment of the claim's likely accuracy

Common clickbait indicators:
- "BREAKING", "URGENT", "JUST IN" when not warranted
- Price predictions without sources
- "X could", "X might" speculation presented as news
- Emotional language: "SOARS", "CRASHES", "EXPLODES"
- Numbers without context ("Bitcoin drops $1000" without percentage)

Respond with JSON: { "analysis": [...] }`;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const limitRaw = parseInt(searchParams.get('limit') || '10');
  const thresholdRaw = parseInt(searchParams.get('threshold') || '0');
  const limit = Math.min(Number.isNaN(limitRaw) ? 10 : Math.max(1, limitRaw), 30);
  const threshold = Number.isNaN(thresholdRaw) ? 0 : Math.max(0, Math.min(thresholdRaw, 100)); // Only return above this score

  if (!isAIConfigured()) return aiNotConfiguredResponse();

  try {
    const data = await getLatestNews(limit);
    
    if (data.articles.length === 0) {
      return NextResponse.json({
        analysis: [],
        message: 'No articles to analyze',
      });
    }

    const headlines = data.articles.map(a => ({
      title: a.title,
      link: a.link,
      source: a.source,
    }));

    const userPrompt = `Analyze these ${headlines.length} crypto news headlines for clickbait:

${JSON.stringify(headlines, null, 2)}`;

    const result = await promptAIJson<ClickbaitResponse>(
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 3000, temperature: 0.3 }
    );

    // Filter by threshold if specified
    let analysis = result.analysis || [];
    if (threshold > 0) {
      analysis = analysis.filter(a => a.clickbaitScore >= threshold);
    }

    // Calculate stats
    const avgScore = analysis.length > 0
      ? Math.round(analysis.reduce((sum, a) => sum + a.clickbaitScore, 0) / analysis.length)
      : 0;
    
    const highClickbait = analysis.filter(a => a.clickbaitScore >= 70).length;
    const lowClickbait = analysis.filter(a => a.clickbaitScore <= 30).length;

    const responseData = {
        analysis,
        stats: {
          total: analysis.length,
          averageScore: avgScore,
          highClickbait,
          lowClickbait,
          healthyRatio: analysis.length > 0 
            ? Math.round((lowClickbait / analysis.length) * 100) 
            : 100,
        },
        analyzedAt: new Date().toISOString(),
      };

    // Persist into stale cache for fallback on future errors
    const staleCacheKey = generateCacheKey('clickbait', { limit, threshold });
    staleCache.set(staleCacheKey, responseData, 3600);

    return NextResponse.json(responseData, {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Clickbait analysis error:', error);

    if (error instanceof AIAuthError || (error as Error).name === 'AIAuthError') {
      return aiAuthErrorResponse((error as Error).message);
    }

    // Stale-on-error: serve last-known-good data
    const staleCacheKey = generateCacheKey('clickbait', { limit, threshold });
    const stale = staleCache.get<Record<string, unknown>>(staleCacheKey);
    if (stale) {
      return NextResponse.json(
        { ...stale, _stale: true },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    return NextResponse.json(
      { error: 'Failed to analyze headlines', details: String(error) },
      { status: 500 }
    );
  }
}
