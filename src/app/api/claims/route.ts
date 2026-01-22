import { NextRequest, NextResponse } from 'next/server';
import {
  extractClaims,
  isExtractorConfigured,
  hasSignificantClaims,
  analyzeClaimQuality,
  ClaimExtractionResult,
} from '@/lib/claim-extractor';
import {
  checkRateLimit,
  rateLimitResponse,
  addRateLimitHeaders,
} from '@/lib/rate-limit';

export const runtime = 'edge';

interface ClaimsRequest {
  title: string;
  content: string;
}

interface ClaimsResponse {
  result: ClaimExtractionResult;
  quality: {
    totalClaims: number;
    verifiableClaims: number;
    hasAttribution: number;
    qualityScore: number;
  };
  processingTime: number;
}

interface ErrorResponse {
  error: string;
  message?: string;
  hasSignificantClaims?: boolean;
}

/**
 * POST /api/claims
 * Extract verifiable claims from a crypto news article
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limiting
  const rateLimitResult = checkRateLimit(request);
  if (!rateLimitResult.allowed) {
    return rateLimitResponse(rateLimitResult);
  }

  // Check if AI is configured
  if (!isExtractorConfigured()) {
    // Provide quick hint without AI
    try {
      const body = await request.json() as ClaimsRequest;
      const significant = hasSignificantClaims(body.title, body.content);

      return addRateLimitHeaders(
        NextResponse.json(
          {
            error: 'AI features not configured',
            message: 'Set GROQ_API_KEY environment variable for claim extraction. Get a free key at https://console.groq.com/keys',
            hasSignificantClaims: significant,
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
    const body = await request.json() as ClaimsRequest;

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

    // Extract claims
    const startTime = Date.now();
    const result = await extractClaims(body.title, body.content);
    const processingTime = Date.now() - startTime;

    // Analyze quality
    const quality = analyzeClaimQuality(result);

    const response: ClaimsResponse = {
      result,
      quality,
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
    console.error('Claim extraction error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return addRateLimitHeaders(
      NextResponse.json(
        {
          error: 'Claim extraction failed',
          message: errorMessage,
        } as ErrorResponse,
        { status: 500 }
      ),
      rateLimitResult
    );
  }
}

/**
 * GET /api/claims
 * Return API documentation
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    endpoint: '/api/claims',
    method: 'POST',
    description: 'Extract verifiable claims with attribution from a crypto news article',
    request: {
      title: 'string (required) - Article title',
      content: 'string (required) - Article content',
    },
    response: {
      result: {
        claims: [
          {
            claim: 'string - The actual claim',
            attribution: {
              source: 'string - Who made the claim',
              role: 'string (optional) - Their title/role',
              organization: 'string (optional) - Their organization',
            },
            type: 'fact | opinion | prediction | announcement',
            verifiability: 'verifiable | subjective | future',
            relatedEntities: 'string[] - Entities mentioned in claim',
            timestamp: 'string (optional) - When claim was made',
          },
        ],
        primaryNarrative: 'string - Main story summary',
        conflictingClaims: 'boolean - Whether any claims contradict',
      },
      quality: {
        totalClaims: 'number - Total claims extracted',
        verifiableClaims: 'number - Claims that can be fact-checked',
        hasAttribution: 'number - Claims with proper attribution',
        qualityScore: 'number (0-100) - Overall quality score',
      },
      processingTime: 'number (ms)',
    },
    example: {
      request: {
        title: 'Bitcoin ETF Approved by SEC',
        content: 'The Securities and Exchange Commission approved the first spot Bitcoin ETF today. SEC Chair Gary Gensler stated that "this approval does not constitute an endorsement of Bitcoin." BlackRock CEO Larry Fink said the ETF will "democratize access to Bitcoin for retail investors." Analysts predict the ETF could attract $10 billion in inflows in the first year.',
      },
      response: {
        result: {
          claims: [
            {
              claim: 'SEC approved the first spot Bitcoin ETF',
              attribution: {
                source: 'article author',
                organization: 'SEC',
              },
              type: 'fact',
              verifiability: 'verifiable',
              relatedEntities: ['SEC', 'Bitcoin ETF'],
            },
            {
              claim: 'This approval does not constitute an endorsement of Bitcoin',
              attribution: {
                source: 'Gary Gensler',
                role: 'SEC Chair',
                organization: 'SEC',
              },
              type: 'announcement',
              verifiability: 'verifiable',
              relatedEntities: ['SEC', 'Bitcoin'],
            },
            {
              claim: 'The ETF will democratize access to Bitcoin for retail investors',
              attribution: {
                source: 'Larry Fink',
                role: 'CEO',
                organization: 'BlackRock',
              },
              type: 'opinion',
              verifiability: 'subjective',
              relatedEntities: ['BlackRock', 'Bitcoin ETF'],
            },
            {
              claim: 'The ETF could attract $10 billion in inflows in the first year',
              attribution: {
                source: 'Analysts',
              },
              type: 'prediction',
              verifiability: 'future',
              relatedEntities: ['Bitcoin ETF'],
            },
          ],
          primaryNarrative: 'The SEC approved the first spot Bitcoin ETF, with mixed reactions from officials and industry leaders about its implications.',
          conflictingClaims: false,
        },
        quality: {
          totalClaims: 4,
          verifiableClaims: 2,
          hasAttribution: 3,
          qualityScore: 75,
        },
        processingTime: 456,
      },
    },
  });
}
