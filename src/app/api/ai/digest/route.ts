/**
 * AI Topic Digest — Streaming narrative endpoint
 *
 * GET /api/ai/digest?topic=Bitcoin+ETF
 * GET /api/ai/digest?topic=DeFi+hacks&limit=30
 * GET /api/ai/digest?coins=BTC,ETH,SOL
 *
 * Returns: Server-Sent Events stream
 *   data: {"token":"..."}  — incremental text tokens
 *   data: [DONE]           — terminal frame
 */

import { NextRequest } from 'next/server';
import { getLatestNews } from '@/lib/crypto-news';
import { aiCompleteStream, getAIConfigOrNull } from '@/lib/ai-provider';

export const runtime = 'edge';

const SYSTEM_PROMPT = `You are a senior crypto analyst writing a real-time intelligence digest.

Given a curated set of recent news headlines + descriptions, write a flowing, insightful narrative analysis.

Follow this structure (use markdown headers):
## Key Developments
2-4 of the most significant stories, with brief context.

## What It Means
1-2 paragraphs interpreting the signal vs. noise. Is this a trend or a one-off event?

## Market Implications
Concrete takeaways for investors or builders (bullish / bearish / neutral, and why).

## Watch
1-3 things to monitor in the next 24-48 hours.

Keep the total response under 400 words. Be direct, confident, and specific.
Do NOT include disclaimers or say "consult a financial advisor".`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get('topic')?.trim() || '';
  const coinsParam = searchParams.get('coins') || '';
  const limit = Math.min(parseInt(searchParams.get('limit') || '60', 10), 100);

  if (!topic && !coinsParam) {
    return Response.json(
      {
        error: 'Provide ?topic=... or ?coins=BTC,ETH',
        examples: [
          '/api/ai/digest?topic=Bitcoin+ETF',
          '/api/ai/digest?topic=Ethereum+L2',
          '/api/ai/digest?coins=BTC,SOL',
          '/api/ai/digest?topic=DeFi+hacks',
        ],
      },
      { status: 400 }
    );
  }

  const cfg = getAIConfigOrNull(/* preferGroq */ true);
  if (!cfg) {
    return Response.json(
      { error: 'No AI provider configured. Set GROQ_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY.' },
      { status: 503 }
    );
  }

  // Fetch news and filter for relevance
  const newsData = await getLatestNews(limit);
  const coins = coinsParam
    ? coinsParam.toUpperCase().split(',').map(c => c.trim()).filter(Boolean)
    : [];

  const keywords: string[] = [];
  if (topic) {
    keywords.push(...topic.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  }
  keywords.push(...coins.map(c => c.toLowerCase()));

  const relevant = keywords.length > 0
    ? newsData.articles.filter(a => {
        const hay = `${a.title} ${a.description ?? ''} ${a.category ?? ''}`.toLowerCase();
        return keywords.some(kw => hay.includes(kw));
      })
    : newsData.articles;

  // Fall back to all articles if topic is too niche
  const articles = relevant.length >= 5 ? relevant : newsData.articles.slice(0, 30);
  const topN = articles.slice(0, 40); // Keep prompt manageable

  const articleList = topN
    .map((a, i) =>
      `[${i + 1}] ${a.source} | ${new Date(a.pubDate).toLocaleDateString()} | ${a.title}${a.description ? ' — ' + a.description.slice(0, 120) : ''}`
    )
    .join('\n');

  const topicLabel = topic
    ? `"${topic}"`
    : `coins: ${coins.join(', ')}`;

  const userPrompt = `Write a crypto intelligence digest focused on ${topicLabel}.

Here are ${topN.length} recent news articles ordered by relevance:

${articleList}

Write the digest now.`;

  const stream = aiCompleteStream(SYSTEM_PROMPT, userPrompt, { maxTokens: 1024, temperature: 0.45 }, /* preferGroq */ true);

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = stream.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          controller.enqueue(encoder.encode(value));
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
      'Access-Control-Allow-Origin': '*',
      Connection: 'keep-alive',
    },
  });
}
