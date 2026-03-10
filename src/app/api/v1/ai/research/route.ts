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
 * GET /api/v1/ai/research
 *
 * Premium API v1 - AI Research Agent Endpoint
 * Deep AI-powered research on crypto topics, protocols, and market themes.
 * Requires x402 payment or valid API key.
 *
 * @price $0.01 per request
 */

import { type NextRequest, NextResponse } from "next/server";
import { hybridAuthMiddleware } from "@/lib/x402";
import { ApiError } from "@/lib/api-error";
import { createRequestLogger } from "@/lib/logger";
import { promptAIJson, isAIConfigured, AIAuthError } from "@/lib/ai-provider";
import { aiNotConfiguredResponse, aiAuthErrorResponse } from "@/app/api/_utils";
import { getLatestNews } from "@/lib/crypto-news";

export const runtime = "edge";
export const revalidate = 600;

const ENDPOINT = "/api/v1/ai/research";

const SYSTEM_PROMPT = `You are an expert crypto research analyst. Produce institutional-quality research reports.

Given a topic and recent news context, provide:
{
  "topic": "Research topic",
  "executive_summary": "2-3 sentence overview",
  "key_findings": ["Finding 1", "Finding 2", ...],
  "analysis": {
    "overview": "Detailed analysis paragraph",
    "market_impact": "How this affects markets",
    "risk_factors": ["Risk 1", "Risk 2"],
    "opportunities": ["Opportunity 1", "Opportunity 2"]
  },
  "data_points": [{ "metric": "name", "value": "value", "context": "why it matters" }],
  "outlook": {
    "short_term": "1-7 day outlook",
    "medium_term": "1-3 month outlook",
    "long_term": "6-12 month outlook"
  },
  "confidence": 0-100,
  "sources_used": ["source 1", "source 2"]
}

Be thorough, objective, and data-driven. Cite specific numbers when available.`;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const topic = searchParams.get("topic") || searchParams.get("q");
  const depth = searchParams.get("depth") || "standard";

  if (!topic) {
    return NextResponse.json(
      {
        error: "Missing topic",
        message: "Provide a research topic via ?topic=your+topic",
        version: "v1",
        examples: [
          "/api/v1/ai/research?topic=ethereum+layer2+scaling",
          "/api/v1/ai/research?topic=bitcoin+etf+impact&depth=deep",
          "/api/v1/ai/research?topic=defi+lending+protocols",
        ],
      },
      { status: 400 },
    );
  }

  if (!isAIConfigured()) return aiNotConfiguredResponse();

  try {
    const contextSize = depth === "deep" ? 40 : 20;
    logger.info("AI research", { topic, depth, contextSize });

    const data = await getLatestNews(contextSize);
    const context = data.articles
      .map(
        (a, i) =>
          `[${i + 1}] "${a.title}" (${a.source})\n${a.description || ""}`,
      )
      .join("\n\n");

    const result: Record<string, unknown> = await promptAIJson(
      SYSTEM_PROMPT,
      `Research Topic: ${topic}\nDepth: ${depth}\n\nRecent News Context:\n${context}`,
    );

    return NextResponse.json(
      {
        ...result,
        depth,
        version: "v1",
        disclaimer: "AI-generated research. Not financial advice.",
        duration: Date.now() - startTime,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
        },
      },
    );
  } catch (error) {
    if (error instanceof AIAuthError) return aiAuthErrorResponse(error.message);
    logger.error("AI research error", { error });
    const apiError = ApiError.from(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code, version: "v1" },
      { status: apiError.statusCode },
    );
  }
}
