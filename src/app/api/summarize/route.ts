import { NextRequest } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { promptGroqJsonCached, isGroqConfigured } from '@/lib/groq';
import { jsonResponse, errorResponse, withTiming } from '@/lib/api-utils';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';

export const runtime = 'edge';
export const revalidate = 60; // 1 minute cache

interface ArticleSummary {
  title: string;
  link: string;
  source: string;
  summary: string;
  keyPoints: string[];
  sentiment: 'bullish' | 'bearish' | 'neutral';
  tickers: string[];
}

interface SummaryResponse {
  summaries: ArticleSummary[];
}

const SYSTEM_PROMPT = `You are a cryptocurrency news analyst. Summarize news articles concisely and extract key information.

For each article, provide:
- summary: A 1-2 sentence summary
- keyPoints: 2-3 bullet points of key takeaways
- sentiment: bullish, bearish, or neutral market sentiment
- tickers: Any cryptocurrency tickers mentioned (e.g., BTC, ETH, SOL)

Respond with a JSON object: { "summaries": [...] }`;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);
  const source = searchParams.get('source') || undefined;
  const style = searchParams.get('style') || 'brief'; // brief, detailed, bullet

  if (!isGroqConfigured()) {
    return errorResponse(
      'AI features not configured',
      'Set GROQ_API_KEY environment variable. Get a free key at https://console.groq.com/keys',
      503
    );
  }

  try {
    const data = await getLatestNews(limit, source);
    
    if (data.articles.length === 0) {
      return jsonResponse({ summaries: [], message: 'No articles to summarize' });
    }

    // Prepare articles for summarization
    const articlesToSummarize = data.articles.map(a => ({
      title: a.title,
      link: a.link,
      source: a.source,
      description: a.description || '',
    }));

    const styleInstructions = {
      brief: 'Keep summaries to 1 sentence.',
      detailed: 'Provide 2-3 sentence summaries with context.',
      bullet: 'Use bullet points only, no prose.',
    }[style] || 'Keep summaries to 1 sentence.';

    const userPrompt = `${styleInstructions}

Summarize these ${articlesToSummarize.length} crypto news articles:

${JSON.stringify(articlesToSummarize, null, 2)}`;

    const result = await promptGroqJsonCached<SummaryResponse>(
      'summarize',
      SYSTEM_PROMPT,
      userPrompt,
      { maxTokens: 3000 }
    );

    // Merge with original article data
    const summaries = result.summaries.map((summary, index) => ({
      ...data.articles[index],
      ...summary,
    }));

    const responseData = withTiming({
      summaries,
      count: summaries.length,
      style,
      generatedAt: new Date().toISOString(),
    }, startTime);

    return jsonResponse(responseData, {
      cacheControl: 'ai',
      etag: true,
      request,
    });
  } catch (error) {
    const logger = createRequestLogger('/api/summarize');
    logger.error('Summarization error', { error });
    return ApiError.internal('Failed to summarize articles', error);
  }
}
