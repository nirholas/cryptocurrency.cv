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
 * GET /api/v1/ai/explain
 *
 * Premium API v1 - AI Explanation Endpoint
 * Provides plain-language explanations of crypto concepts, protocols, and events.
 * Requires x402 payment or valid API key.
 *
 * @price $0.003 per request
 */

import { type NextRequest, NextResponse } from "next/server";
import { hybridAuthMiddleware } from "@/lib/x402";
import { ApiError } from "@/lib/api-error";
import { createRequestLogger } from "@/lib/logger";
import { promptAIJson, isAIConfigured, AIAuthError } from "@/lib/ai-provider";
import { aiNotConfiguredResponse, aiAuthErrorResponse } from "@/app/api/_utils";

export const runtime = "edge";
export const revalidate = 3600;

const ENDPOINT = "/api/v1/ai/explain";

const SYSTEM_PROMPT = `You are a crypto education expert. Explain crypto concepts clearly for the target audience.

Respond with JSON:
{
  "term": "The concept being explained",
  "explanation": "Clear, accurate explanation",
  "analogy": "A relatable real-world analogy",
  "key_points": ["Point 1", "Point 2", "Point 3"],
  "related_concepts": ["concept1", "concept2"],
  "difficulty": "beginner|intermediate|advanced",
  "examples": ["Example 1 with numbers/data"],
  "further_reading": ["topic to explore next"]
}

Adjust complexity based on the level parameter. Be accurate and avoid jargon when possible.`;

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const term = searchParams.get("term") || searchParams.get("q");
  const level = searchParams.get("level") || "beginner";

  if (!term) {
    return NextResponse.json(
      {
        error: "Missing term",
        message: "Provide a concept to explain via ?term=your+concept",
        version: "v1",
        examples: [
          "/api/v1/ai/explain?term=impermanent+loss",
          "/api/v1/ai/explain?term=MEV&level=advanced",
          "/api/v1/ai/explain?term=proof+of+stake&level=beginner",
        ],
      },
      { status: 400 },
    );
  }

  if (!isAIConfigured()) return aiNotConfiguredResponse();

  try {
    logger.info("AI explain", { term, level });

    const result: Record<string, unknown> = await promptAIJson(
      SYSTEM_PROMPT,
      `Explain this crypto concept at a ${level} level: ${term}`,
    );

    return NextResponse.json(
      {
        ...result,
        level,
        version: "v1",
        duration: Date.now() - startTime,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      },
    );
  } catch (error) {
    if (error instanceof AIAuthError) return aiAuthErrorResponse(error.message);
    logger.error("AI explain error", { error });
    const apiError = ApiError.from(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code, version: "v1" },
      { status: apiError.statusCode },
    );
  }
}
