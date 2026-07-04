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
 * GET /api/v1/classify
 *
 * Premium API v1 - News Classification Endpoint
 * AI-powered categorization of crypto news articles.
 * Requires x402 payment or valid API key.
 *
 * @price $0.002 per request
 */

import { type NextRequest, NextResponse } from "next/server";
import { hybridAuthMiddleware } from "@/lib/x402";
import { ApiError } from "@/lib/api-error";
import { createRequestLogger } from "@/lib/logger";
import { getLatestNews } from "@/lib/crypto-news";
import { classifyEvent } from "@/lib/event-classifier";

export const runtime = 'nodejs';
export const revalidate = 300;

const ENDPOINT = "/api/v1/classify";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);
  const source = searchParams.get("source") || undefined;

  try {
    logger.info("Classifying articles", { limit, source });

    const data = await getLatestNews(limit, source);

    const classified = await Promise.all(
      data.articles.map(async (article) => {
        try {
          const classification = classifyEvent(
            article.title,
            article.description || "",
          );
          return {
            title: article.title,
            link: article.link,
            source: article.source,
            publishedAt: article.pubDate,
            classification,
          };
        } catch {
          return {
            title: article.title,
            link: article.link,
            source: article.source,
            publishedAt: article.pubDate,
            classification: { category: "unknown", confidence: 0 },
          };
        }
      }),
    );

    return NextResponse.json(
      {
        articles: classified,
        total: classified.length,
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
    logger.error("Classification error", { error });
    const apiError = ApiError.from(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code, version: "v1" },
      { status: apiError.statusCode },
    );
  }
}
