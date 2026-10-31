/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest, NextResponse } from "next/server";
import { 
  detectAIContent, 
  detectAIContentBatch,
  quickAICheck,
  type DetectionResult
} from "@/lib/ai-content-detection";

export const runtime = "edge";
export const revalidate = 0;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    
    if (!body) {
      return NextResponse.json(
        { error: "Request body is required", code: "INVALID_REQUEST" },
        { status: 400 }
      );
    }

    const { text, texts, quick = false } = body as {
      text?: string;
      texts?: string[];
      quick?: boolean;
    };

    if (!text && (!texts || !Array.isArray(texts) || texts.length === 0)) {
      return NextResponse.json(
        { 
          error: "Provide either text for single analysis or texts array for batch analysis",
          code: "MISSING_CONTENT"
        },
        { status: 400 }
      );
    }

    if (quick && text) {
      const quickResult = quickAICheck(text);
      return NextResponse.json({
        mode: "quick",
        ...quickResult,
        timestamp: new Date().toISOString()
      });
    }

    if (texts && texts.length > 0) {
      const maxBatchSize = 50;
      if (texts.length > maxBatchSize) {
        return NextResponse.json(
          { error: "Batch size exceeds limit", code: "BATCH_TOO_LARGE" },
          { status: 400 }
        );
      }

      const batchResults: DetectionResult[] = detectAIContentBatch(texts);
      const likelyAI = batchResults.filter(r => r.isLikelyAI).length;
      const avgConfidence = batchResults.reduce((sum, r) => sum + r.confidence, 0) / batchResults.length;
      
      return NextResponse.json({
        mode: "batch",
        results: batchResults,
        summary: {
          total: texts.length,
          likelyAI,
          likelyHuman: texts.length - likelyAI,
          averageConfidence: Math.round(avgConfidence * 100) / 100
        },
        timestamp: new Date().toISOString()
      });
    }

    if (text) {
      const minLength = 100;
      if (text.length < minLength) {
        return NextResponse.json(
          { error: "Text too short", code: "TEXT_TOO_SHORT", minimum: minLength },
          { status: 400 }
        );
      }

      const result: DetectionResult = detectAIContent(text);
      
      return NextResponse.json({
        mode: "full",
        ...result,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json(
      { error: "Invalid request format", code: "INVALID_FORMAT" },
      { status: 400 }
    );

  } catch (error) {
    console.error('detect/ai-content route error:', error);
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Invalid JSON", code: "INVALID_JSON" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "Failed to analyze content",
        code: "ANALYSIS_ERROR",
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    name: "AI Content Detection API",
    version: "1.0.0",
    description: "Enterprise-grade AI content detection using statistical and linguistic analysis.",
    methods: ["POST"],
    requestBody: {
      text: "string - Text to analyze (required for single)",
      texts: "string[] - Array of texts for batch (max 50)",
      quick: "boolean - Use quick check mode"
    },
    response: {
      isLikelyAI: "boolean",
      confidence: "number (0-100)",
      verdict: "human | ai | uncertain",
      analysis: "object - Detailed breakdown",
      signals: "array - Detection signals"
    }
  });
}
