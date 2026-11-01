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
import { generateCounterArguments, isAIConfigured, type CounterInput } from '@/lib/ai-counter';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'edge';

interface CounterRequestBody {
  claim: string;
  context?: string;
}

/**
 * POST /api/ai/counter
 * Generate counter-arguments for a claim
 * 
 * Request Body:
 * - claim: string - The claim to challenge (required)
 * - context: string - Additional context (optional)
 */
export async function POST(request: NextRequest) {
  try {
    // Check if AI is configured
    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          error: 'AI not configured',
          message: 'No AI provider API key found. Set OPENAI_API_KEY, ANTHROPIC_API_KEY, GROQ_API_KEY, or OPENROUTER_API_KEY',
        },
        { status: 503 }
      );
    }

    const jsonBody = await readJsonBody<CounterRequestBody>(request);
    if (!jsonBody.ok) return jsonBody.response;
    const body = jsonBody.body;
    const { claim, context } = body;

    // Validate input
    if (!claim || typeof claim !== 'string' || claim.trim().length === 0) {
      return NextResponse.json(
        { error: 'Claim is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate context if provided
    if (context !== undefined && typeof context !== 'string') {
      return NextResponse.json(
        { error: 'Context must be a string if provided' },
        { status: 400 }
      );
    }

    const input: CounterInput = {
      claim: claim.trim(),
      context: context?.trim(),
    };

    const counter = await generateCounterArguments(input);

    return NextResponse.json({
      success: true,
      counter,
    });
  } catch (error) {
    console.error('Counter-arguments generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate counter-arguments',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/ai/counter
 * Returns usage information for the counter endpoint
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/ai/counter',
    method: 'POST',
    description: 'Generate counter-arguments for a claim',
    configured: isAIConfigured(),
    usage: {
      body: {
        claim: {
          type: 'string',
          description: 'The claim to challenge (required)',
          example: 'Bitcoin will replace the US dollar by 2030',
        },
        context: {
          type: 'string',
          description: 'Additional context for the claim (optional)',
          example: 'Article discusses hyperbitcoinization theory',
        },
      },
    },
    response: {
      counter: {
        originalClaim: 'string',
        counterArguments: [
          {
            argument: 'string',
            type: 'factual | logical | contextual | alternative',
            strength: 'strong | moderate | weak',
            source: 'string (optional)',
          },
        ],
        assumptions: [
          {
            assumption: 'string',
            challenge: 'string',
          },
        ],
        alternativeInterpretations: 'string[]',
        missingContext: 'string[]',
        overallAssessment: {
          claimStrength: 'strong | moderate | weak',
          mainVulnerability: 'string',
        },
        generatedAt: 'ISO timestamp',
      },
    },
  });
}
