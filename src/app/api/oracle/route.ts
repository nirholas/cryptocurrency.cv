/**
 * The Oracle API Endpoint
 * 
 * Enterprise-grade natural language query interface for cryptocurrency intelligence.
 * Supports conversation sessions, structured responses, and comprehensive market context.
 * 
 * POST /api/oracle - Query The Oracle
 * GET /api/oracle - API info and health check
 * 
 * @example
 * ```typescript
 * const response = await fetch('/api/oracle', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     query: "What's happening with Bitcoin today?",
 *     sessionId: "optional-session-id",
 *     options: {
 *       includeMarketData: true,
 *       includeNews: true,
 *       responseFormat: 'structured'
 *     }
 *   })
 * });
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  queryOracle, 
  getOracleStats, 
  type OracleQuery, 
  type OracleOptions 
} from '@/lib/oracle';
import { isGroqConfigured } from '@/lib/groq';
import { db } from '@/lib/database';

// Use Node.js runtime since database.ts requires fs/path modules
export const runtime = 'nodejs';

// =============================================================================
// TYPES
// =============================================================================

interface OracleRequestBody {
  query: string;
  sessionId?: string;
  userId?: string;
  options?: Partial<OracleOptions>;
}

// =============================================================================
// RATE LIMITING
// =============================================================================

const RATE_LIMIT = {
  anonymous: { requests: 10, windowSeconds: 3600 }, // 10 per hour
  authenticated: { requests: 100, windowSeconds: 3600 }, // 100 per hour
};

async function checkRateLimit(
  key: string, 
  maxRequests: number, 
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetInSeconds: number; resetAt: number }> {
  const now = Date.now();
  const windowStart = now - (windowSeconds * 1000);
  const resetAt = now + (windowSeconds * 1000);
  
  // Get current count
  const countKey = `ratelimit:${key}`;
  const current = await db.get<{ count: number; windowStart: number }>(countKey);
  
  if (!current || current.windowStart < windowStart) {
    // New window
    await db.set(countKey, { count: 1, windowStart: now }, windowSeconds);
    return { allowed: true, remaining: maxRequests - 1, resetInSeconds: windowSeconds, resetAt };
  }
  
  if (current.count >= maxRequests) {
    const resetInSeconds = Math.ceil((current.windowStart + windowSeconds * 1000 - now) / 1000);
    return { allowed: false, remaining: 0, resetInSeconds, resetAt: current.windowStart + windowSeconds * 1000 };
  }
  
  // Increment
  await db.set(countKey, { count: current.count + 1, windowStart: current.windowStart }, windowSeconds);
  return { 
    allowed: true, 
    remaining: maxRequests - current.count - 1, 
    resetInSeconds: Math.ceil((current.windowStart + windowSeconds * 1000 - now) / 1000),
    resetAt: current.windowStart + windowSeconds * 1000
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

function validateRequestBody(body: unknown): { valid: boolean; error?: string; data?: OracleRequestBody } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a JSON object' };
  }

  const { query, sessionId, userId, options } = body as Record<string, unknown>;

  if (!query || typeof query !== 'string') {
    return { valid: false, error: 'Query is required and must be a string' };
  }

  if (query.trim().length === 0) {
    return { valid: false, error: 'Query cannot be empty' };
  }

  if (query.length > 2000) {
    return { valid: false, error: 'Query exceeds maximum length of 2000 characters' };
  }

  if (sessionId !== undefined && typeof sessionId !== 'string') {
    return { valid: false, error: 'sessionId must be a string' };
  }

  if (userId !== undefined && typeof userId !== 'string') {
    return { valid: false, error: 'userId must be a string' };
  }

  // Validate options if provided
  if (options !== undefined) {
    if (typeof options !== 'object') {
      return { valid: false, error: 'options must be an object' };
    }

    const validResponseFormats = ['natural', 'structured', 'brief'];
    const opts = options as Record<string, unknown>;
    
    if (opts.responseFormat && !validResponseFormats.includes(opts.responseFormat as string)) {
      return { valid: false, error: `responseFormat must be one of: ${validResponseFormats.join(', ')}` };
    }

    if (opts.temperature !== undefined) {
      const temp = opts.temperature as number;
      if (typeof temp !== 'number' || temp < 0 || temp > 2) {
        return { valid: false, error: 'temperature must be a number between 0 and 2' };
      }
    }

    if (opts.maxNewsArticles !== undefined) {
      const max = opts.maxNewsArticles as number;
      if (typeof max !== 'number' || max < 0 || max > 50) {
        return { valid: false, error: 'maxNewsArticles must be a number between 0 and 50' };
      }
    }

    if (opts.maxCoins !== undefined) {
      const max = opts.maxCoins as number;
      if (typeof max !== 'number' || max < 0 || max > 100) {
        return { valid: false, error: 'maxCoins must be a number between 0 and 100' };
      }
    }
  }

  return {
    valid: true,
    data: {
      query: query.trim(),
      sessionId: sessionId as string | undefined,
      userId: userId as string | undefined,
      options: options as Partial<OracleOptions> | undefined,
    },
  };
}

// =============================================================================
// HANDLERS
// =============================================================================

/**
 * POST - Query The Oracle
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // Check if AI is configured
    if (!isGroqConfigured()) {
      return NextResponse.json(
        {
          error: 'Service unavailable',
          message: 'AI service is not configured. The Oracle requires the GROQ_API_KEY environment variable.',
          code: 'AI_NOT_CONFIGURED',
        },
        { status: 503 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: 'Invalid request',
          message: 'Request body must be valid JSON',
          code: 'INVALID_JSON',
        },
        { status: 400 }
      );
    }

    // Validate request
    const validation = validateRequestBody(body);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: validation.error,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Check API key (optional for Oracle)
    const authHeader = request.headers.get('Authorization');
    const apiKey = authHeader?.replace('Bearer ', '');
    let isAuthenticated = false;
    let userId = validation.data.userId;

    if (apiKey && apiKey.startsWith('cda_')) {
      // Valid API key format - consider authenticated
      isAuthenticated = true;
      userId = userId || `api_${apiKey.substring(0, 12)}`;
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const rateLimitKey = isAuthenticated ? `oracle:${userId}` : `oracle:ip:${clientIp}`;
    const rateLimit = isAuthenticated ? RATE_LIMIT.authenticated : RATE_LIMIT.anonymous;

    const rateLimitResult = await checkRateLimit(rateLimitKey, rateLimit.requests, rateLimit.windowSeconds);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You have exceeded the rate limit. Please try again in ${Math.ceil(rateLimitResult.resetInSeconds)} seconds.`,
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: rateLimitResult.resetInSeconds,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil(rateLimitResult.resetInSeconds)),
            'X-RateLimit-Limit': String(rateLimit.requests),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.resetAt),
          },
        }
      );
    }

    // Build Oracle query
    const oracleQuery: OracleQuery = {
      query: validation.data.query,
      sessionId: validation.data.sessionId,
      userId,
      options: validation.data.options,
    };

    // Query The Oracle
    const response = await queryOracle(oracleQuery);

    // Build response
    return NextResponse.json(
      {
        success: true,
        data: {
          query: response.query,
          response: response.response,
          structured: response.structured,
          sessionId: validation.data.sessionId,
          metadata: {
            queryId: response.metadata.queryId,
            processingTimeMs: response.metadata.processingTimeMs,
            tokensUsed: response.metadata.tokensUsed,
            cached: response.metadata.cached,
          },
          context: {
            marketDataIncluded: response.context.marketData !== null,
            newsArticlesCount: response.context.newsArticles.length,
            conversationTurns: response.context.conversationHistory.length,
            timestamp: response.context.timestamp,
          },
          disclaimer: response.metadata.disclaimer,
        },
      },
      {
        headers: {
          'X-Query-Id': response.metadata.queryId,
          'X-Processing-Time': String(response.metadata.processingTimeMs),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        },
      }
    );
  } catch (error) {
    console.error('Oracle API error:', error);

    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    const isClientError = errorMessage.includes('required') || 
                          errorMessage.includes('must be') || 
                          errorMessage.includes('exceeds');

    return NextResponse.json(
      {
        success: false,
        error: isClientError ? 'Bad request' : 'Internal server error',
        message: errorMessage,
        code: isClientError ? 'BAD_REQUEST' : 'INTERNAL_ERROR',
        processingTimeMs: Date.now() - startTime,
      },
      { status: isClientError ? 400 : 500 }
    );
  }
}

/**
 * GET - Get Oracle stats or health check
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  try {
    // Health check
    if (action === 'health') {
      const configured = isGroqConfigured();
      return NextResponse.json({
        status: configured ? 'healthy' : 'degraded',
        configured,
        timestamp: new Date().toISOString(),
      });
    }

    // Stats (requires admin auth)
    if (action === 'stats') {
      const authHeader = request.headers.get('Authorization');
      const adminKey = process.env.ADMIN_API_KEY;

      if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
        return NextResponse.json(
          { error: 'Unauthorized', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      const stats = await getOracleStats();
      return NextResponse.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    }

    // Default: return API info
    return NextResponse.json({
      name: 'The Oracle API',
      version: '2.0.0',
      description: 'AI-powered cryptocurrency intelligence assistant',
      endpoints: {
        'POST /api/oracle': 'Query The Oracle with natural language',
        'GET /api/oracle?action=health': 'Health check',
        'GET /api/oracle?action=stats': 'Usage statistics (admin only)',
      },
      rateLimits: {
        anonymous: '10 queries per hour',
        authenticated: '100 queries per hour',
      },
      documentation: '/docs/API.md#the-oracle',
    });
  } catch (error) {
    console.error('Oracle GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
