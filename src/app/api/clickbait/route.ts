import { NextRequest, NextResponse } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptGroqJson, isGroqConfigured } from '@/lib/groq';
import { groqNotConfiguredResponse } from '@/app/api/_utils';

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
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 30);
  const threshold = parseInt(searchParams.get('threshold') || '0'); // Only return above this score

  if (!isGroqConfigured()) return groqNotConfiguredResponse();

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

    const result = await promptGroqJson<ClickbaitResponse>(
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

    return NextResponse.json(
      {
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
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Clickbait analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze headlines', details: String(error) },
      { status: 500 }
    );
  }
}
