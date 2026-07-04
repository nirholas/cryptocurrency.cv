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
 * GET /api/v1/signals
 *
 * Premium API v1 - Trading Signals Endpoint
 * AI-generated trading signals based on news sentiment and market data.
 * Requires x402 payment or valid API key.
 *
 * @price $0.005 per request
 */

import { type NextRequest, NextResponse } from "next/server";
import { hybridAuthMiddleware } from "@/lib/x402";
import { ApiError } from "@/lib/api-error";
import { createRequestLogger } from "@/lib/logger";
import { getLatestNews } from "@/lib/crypto-news";
import { promptAIJson, isAIConfigured, AIAuthError } from "@/lib/ai-provider";
import { aiNotConfiguredResponse, aiAuthErrorResponse } from "@/app/api/_utils";

export const runtime = 'nodejs';
export const revalidate = 300;

const ENDPOINT = "/api/v1/signals";

const SYSTEM_PROMPT = `You are a crypto news-based trading signal generator. Analyze news for potential trading opportunities.

IMPORTANT DISCLAIMER: This is for educational purposes only. Not financial advice. Always DYOR.

Based on news sentiment and events, generate signals:
- ticker: Cryptocurrency symbol
- signal: strong_buy, buy, hold, sell, strong_sell
- confidence: 0-100 based on news clarity and reliability
- timeframe: Expected relevance period (24h, 1w, 1m)
- reasoning: Brief explanation
- newsEvents: Key news driving this signal
- riskLevel: Based on volatility and uncertainty (low, medium, high)
- catalysts: Upcoming events that could affect this

Be CONSERVATIVE. Only give strong signals when news is very clear.
Default to "hold" when uncertain.

Respond with JSON: { "signals": [...], "disclaimer": "..." }`;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "30", 10), 50);
  const minConfidence = Math.max(
    0,
    Math.min(100, parseInt(searchParams.get("min_confidence") || "50", 10)),
  );

  if (!isAIConfigured()) return aiNotConfiguredResponse();

  try {
    logger.info("Generating trading signals", { limit, minConfidence });

    const data = await getLatestNews(limit);
    const context = data.articles
      .map(
        (a, i) =>
          `[${i + 1}] "${a.title}" (${a.source})\n${a.description || ""}`,
      )
      .join("\n\n");

    const result = (await promptAIJson(
      SYSTEM_PROMPT,
      `Analyze these ${data.articles.length} articles and generate trading signals:\n\n${context}`,
    )) as { signals?: Array<{ confidence?: number }>; disclaimer?: string };

    // Filter by min confidence
    const signals = (result.signals || []).filter(
      (s: { confidence?: number }) => (s.confidence || 0) >= minConfidence,
    );

    return NextResponse.json(
      {
        signals,
        total: signals.length,
        minConfidence,
        articlesAnalyzed: data.articles.length,
        disclaimer:
          result.disclaimer ||
          "Not financial advice. For educational purposes only.",
        version: "v1",
        duration: Date.now() - startTime,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    if (error instanceof AIAuthError) return aiAuthErrorResponse(error.message);
    logger.error("Signals error", { error });
    const apiError = ApiError.from(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code, version: "v1" },
      { status: apiError.statusCode },
    );
  }
}
