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
import {
  classifyEvent,
  isClassifierConfigured,
  quickClassify,
  type EventClassification,
} from '@/lib/event-classifier';
import {
  checkRateLimitByRequest,
  rateLimitResponse,
  addRateLimitHeaders,
} from '@/lib/ratelimit';
import { readJsonBody } from '@/lib/json-body';

export const runtime = 'edge';

interface ClassifyRequest {
  title: string;
  content: string;
}

interface ClassifyResponse {
  classification: EventClassification;
  processingTime: number;
}

interface ErrorResponse {
  error: string;
  message?: string;
  quickClassification?: string;
}

/**
 * POST /api/classify
 * Classify a crypto news event by type
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limiting
  const rateLimitResult = await checkRateLimitByRequest(request);
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  // Check if AI is configured
  if (!isClassifierConfigured()) {
    // Try to provide quick classification without AI
    try {
      const jsonBody = await readJsonBody<ClassifyRequest>(request);
      if (!jsonBody.ok) return jsonBody.response;
      const body = jsonBody.body;
      const quickType = quickClassify(body.title, body.content);

      return addRateLimitHeaders(
        NextResponse.json(
          {
            error: 'AI features not configured',
            message: 'Set GROQ_API_KEY environment variable for full classification. Get a free key at https://console.groq.com/keys',
            quickClassification: quickType,
          } as ErrorResponse,
          { status: 503 }
        ),
        rateLimitResult
      );
    } catch {
      return addRateLimitHeaders(
        NextResponse.json(
          {
            error: 'AI features not configured',
            message: 'Set GROQ_API_KEY environment variable. Get a free key at https://console.groq.com/keys',
          } as ErrorResponse,
          { status: 503 }
        ),
        rateLimitResult
      );
    }
  }

  try {
    const jsonBody2 = await readJsonBody<ClassifyRequest>(request);
    if (!jsonBody2.ok) return jsonBody2.response;
    const body = jsonBody2.body;

    // Validate request
    if (!body.title || typeof body.title !== 'string') {
      return addRateLimitHeaders(
        NextResponse.json(
          { error: 'Missing required field: title' } as ErrorResponse,
          { status: 400 }
        ),
        rateLimitResult
      );
    }

    if (!body.content || typeof body.content !== 'string') {
      return addRateLimitHeaders(
        NextResponse.json(
          { error: 'Missing required field: content' } as ErrorResponse,
          { status: 400 }
        ),
        rateLimitResult
      );
    }

    // Classify the event
    const startTime = Date.now();
    const classification = await classifyEvent(body.title, body.content);
    const processingTime = Date.now() - startTime;

    const response: ClassifyResponse = {
      classification,
      processingTime,
    };

    return addRateLimitHeaders(
      NextResponse.json(response, {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600, s-maxage=86400',
        },
      }),
      rateLimitResult
    );
  } catch (error) {
    console.error('Classification error:', error);

    return addRateLimitHeaders(
      NextResponse.json(
        {
          error: 'Classification failed',
          message: 'An unexpected error occurred',
        } as ErrorResponse,
        { status: 500 }
      ),
      rateLimitResult
    );
  }
}

/**
 * GET /api/classify
 * Return API documentation
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/classify',
    method: 'POST',
    description: 'Classify a crypto news event by type',
    request: {
      title: 'string (required) - Article title',
      content: 'string (required) - Article content',
    },
    response: {
      classification: {
        eventType: 'funding_round | hack_exploit | regulation | product_launch | partnership | listing | airdrop | network_upgrade | legal_action | market_movement | executive_change | acquisition | general',
        confidence: 'number (0-1)',
        subType: 'string (optional) - e.g., "Series B"',
        entities: {
          primary: 'string - Main entity involved',
          secondary: 'string[] - Other entities',
        },
        magnitude: {
          value: 'number (optional)',
          unit: 'string - USD, BTC, etc.',
        },
        urgency: 'breaking | important | routine',
        marketRelevance: 'high | medium | low',
      },
      processingTime: 'number (ms)',
    },
    example: {
      request: {
        title: 'Coinbase Raises $300M Series E at $8B Valuation',
        content: 'Cryptocurrency exchange Coinbase announced today that it has raised $300 million in a Series E funding round...',
      },
      response: {
        classification: {
          eventType: 'funding_round',
          confidence: 0.95,
          subType: 'Series E',
          entities: {
            primary: 'Coinbase',
            secondary: ['Tiger Global', 'a16z'],
          },
          magnitude: {
            value: 300000000,
            unit: 'USD',
          },
          urgency: 'important',
          marketRelevance: 'high',
        },
        processingTime: 234,
      },
    },
  });
}
