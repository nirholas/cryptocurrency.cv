/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * GET /api/v1/ask
 *
 * Premium API v1 - RAG-Powered Q&A Endpoint
 * Ask natural language questions about crypto markets backed by real-time data.
 * Requires x402 payment or valid API key.
 *
 * @price $0.005 per request
 */

import { type NextRequest, NextResponse } from "next/server";
import { hybridAuthMiddleware } from "@/lib/x402";
import { ApiError } from "@/lib/api-error";
import { createRequestLogger } from "@/lib/logger";
import { promptAIJson, isAIConfigured, AIAuthError } from "@/lib/ai-provider";
import { aiNotConfiguredResponse, aiAuthErrorResponse } from "@/app/api/_utils";
import { getLatestNews } from "@/lib/crypto-news";

export const runtime = "edge";
export const revalidate = 0; // Dynamic - depends on question

const ENDPOINT = "/api/v1/ask";

const SYSTEM_PROMPT = `You are a crypto market analyst assistant. Answer questions using the provided news articles as context.

Rules:
- Be factual and cite sources when possible
- If the news doesn't contain relevant information, say so
- Include relevant data points, prices, and percentages
- Provide balanced analysis (both bullish and bearish perspectives)
- Keep answers concise but comprehensive

Respond with JSON:
{
  "answer": "Your detailed answer here",
  "confidence": 0-100,
  "sources": ["list of relevant article titles used"],
  "relatedTopics": ["topics the user might want to explore next"],
  "disclaimer": "Brief disclaimer if giving market analysis"
}`;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const question = searchParams.get("q") || searchParams.get("question");
  const limit = Math.min(
    parseInt(searchParams.get("context_size") || "20", 10),
    50,
  );

  if (!question) {
    return NextResponse.json(
      {
        error: "Missing question",
        message:
          "Provide a question via ?q=your+question or ?question=your+question",
        version: "v1",
        examples: [
          "/api/v1/ask?q=What is the latest Bitcoin ETF news?",
          "/api/v1/ask?q=How is DeFi performing this week?",
          "/api/v1/ask?q=What are the biggest crypto events today?",
        ],
      },
      { status: 400 },
    );
  }

  if (!isAIConfigured()) return aiNotConfiguredResponse();

  try {
    logger.info("Processing question", { question, limit });

    const data = await getLatestNews(limit);
    const context = data.articles
      .map(
        (a, i) =>
          `[${i + 1}] "${a.title}" (${a.source}, ${a.pubDate})\n${a.description || ""}`,
      )
      .join("\n\n");

    const result: Record<string, unknown> = await promptAIJson(
      SYSTEM_PROMPT,
      `Context (recent crypto news):\n${context}\n\nQuestion: ${question}`,
    );

    return NextResponse.json(
      {
        question,
        ...result,
        articlesAnalyzed: data.articles.length,
        version: "v1",
        duration: Date.now() - startTime,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    if (error instanceof AIAuthError) return aiAuthErrorResponse(error.message);
    logger.error("Ask error", { error });
    const apiError = ApiError.from(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code, version: "v1" },
      { status: apiError.statusCode },
    );
  }
}
