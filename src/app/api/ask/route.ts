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
import { promptGroq, callGroqStream, isGroqConfigured } from '@/lib/groq';
import { groqNotConfiguredResponse } from '@/app/api/_utils';
import { ApiError } from '@/lib/api-error';
import { instrumented } from '@/lib/telemetry-middleware';

export const runtime = 'edge';

/** Number of recent articles fed as context. Higher = richer answers. */
const CONTEXT_ARTICLES = 100;

const SYSTEM_PROMPT = `You are a helpful cryptocurrency news assistant. Answer questions based ONLY on the provided news articles.

Guidelines:
- Be concise and factual
- Cite sources when possible (e.g., "According to CoinDesk...")
- If the answer isn't in the articles, say so
- For price/market questions, note that news may be slightly delayed
- Don't speculate beyond what's in the articles`;

/** Build the news context block shared by GET and POST. */
function buildNewsContext(
  articles: Array<{ source: string; title: string; description?: string | null; timeAgo?: string }>,
): string {
  return articles
    .map(
      (a, i) =>
        `[${i + 1}] ${a.source}: "${a.title}" - ${a.description || 'No description'} (${a.timeAgo ?? ''})`,
    )
    .join('\n\n');
}

/**
 * Returns a streaming SSE Response that flushes AI tokens as they arrive.
 * Each frame: `data: {"token":"..."}`
 * Terminal:   `data: [DONE]`
 */
function streamResponse(groqStream: ReadableStream<string>): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = groqStream.getReader();
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

export const GET = instrumented(async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const question = searchParams.get('q');
  const wantStream = searchParams.get('stream') === 'true';

  if (!question || question.length > 2000) {
    return ApiError.badRequest(
      !question ? 'Missing question' : 'Question too long (max 2000 characters)',
    );
  }

  if (!isGroqConfigured()) return groqNotConfiguredResponse();

  const data = await getLatestNews(CONTEXT_ARTICLES);
  const newsContext = buildNewsContext(data.articles);
  const userPrompt = `Based on these recent crypto news articles:\n\n${newsContext}\n\nQuestion: ${question}`;
  const messages = [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: userPrompt },
  ];

  if (wantStream) {
    return streamResponse(callGroqStream(messages, { maxTokens: 2048, temperature: 0.4 }));
  }

  try {
    const answer = await promptGroq(SYSTEM_PROMPT, userPrompt, {
      maxTokens: 2048,
      temperature: 0.4,
    });
    return NextResponse.json(
      {
        question,
        answer,
        sourcesUsed: data.articles.length,
        answeredAt: new Date().toISOString(),
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  } catch (error) {
    console.error('Ask GET error:', error);
    return ApiError.internal('Failed to answer question');
  }
}

export const POST = instrumented(async function POST(request: NextRequest) {
  // Support POST for longer questions, conversation history, or streaming
  try {
    const body = await request.json();
    const { question, context, stream: wantStream = false } = body;

    if (!question || (typeof question === 'string' && question.length > 2000)) {
      return ApiError.badRequest(
        !question ? 'Missing question in request body' : 'Question too long (max 2000 characters)',
      );
    }

    if (!isGroqConfigured()) return groqNotConfiguredResponse();

    const data = await getLatestNews(CONTEXT_ARTICLES);
    const newsContext = buildNewsContext(data.articles);

    let userPrompt = `Based on these recent crypto news articles:\n\n${newsContext}\n\n`;
    if (context) userPrompt += `Previous context: ${context}\n\n`;
    userPrompt += `Question: ${question}`;

    const messages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userPrompt },
    ];

    if (wantStream) {
      return streamResponse(callGroqStream(messages, { maxTokens: 2048, temperature: 0.4 }));
    }

    const answer = await promptGroq(SYSTEM_PROMPT, userPrompt, {
      maxTokens: 2048,
      temperature: 0.4,
    });
    return NextResponse.json({
      question,
      answer,
      sourcesUsed: data.articles.length,
      answeredAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Ask POST error:', error);
    return ApiError.internal('Failed to process request');
  }
}
