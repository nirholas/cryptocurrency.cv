/**
 * Prediction Tracking API
 * 
 * Enterprise-grade prediction registry with timestamped predictions,
 * outcome tracking, accuracy scoring, and leaderboard functionality.
 * 
 * @module api/predictions
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  createPrediction,
  getPrediction,
  getUserPredictions,
  getAssetPredictions,
  resolvePrediction,
  cancelPrediction,
  getLeaderboard,
  getPredictionAnalytics,
  resolveExpiredPredictions,
  type PredictionInput,
  type PredictionType,
  type PredictionTimeframe,
  type PredictionStatus,
} from '@/lib/predictions';
import { checkRateLimit, getRateLimitErrorResponse, type RateLimitResult } from '@/lib/ratelimit';

// =============================================================================
// VALIDATION
// =============================================================================

function validatePredictionInput(body: unknown): { valid: true; data: PredictionInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const data = body as Record<string, unknown>;

  // Required fields
  if (!data.userId || typeof data.userId !== 'string') {
    return { valid: false, error: 'userId is required and must be a string' };
  }

  if (!data.type || typeof data.type !== 'string') {
    return { valid: false, error: 'type is required and must be a string' };
  }

  const validTypes: PredictionType[] = [
    'price_above', 'price_below', 'price_range', 
    'percentage_up', 'percentage_down', 'event', 
    'trend', 'dominance', 'custom'
  ];
  if (!validTypes.includes(data.type as PredictionType)) {
    return { valid: false, error: `type must be one of: ${validTypes.join(', ')}` };
  }

  if (!data.asset || typeof data.asset !== 'string') {
    return { valid: false, error: 'asset is required and must be a string' };
  }

  if (!data.targetDate || typeof data.targetDate !== 'string') {
    return { valid: false, error: 'targetDate is required and must be an ISO date string' };
  }

  // Validate target date is in the future
  const targetDate = new Date(data.targetDate);
  if (isNaN(targetDate.getTime())) {
    return { valid: false, error: 'targetDate must be a valid ISO date string' };
  }
  if (targetDate <= new Date()) {
    return { valid: false, error: 'targetDate must be in the future' };
  }

  if (!data.timeframe || typeof data.timeframe !== 'string') {
    return { valid: false, error: 'timeframe is required' };
  }

  const validTimeframes: PredictionTimeframe[] = [
    '1h', '4h', '1d', '3d', '1w', '2w', '1m', '3m', '6m', '1y'
  ];
  if (!validTimeframes.includes(data.timeframe as PredictionTimeframe)) {
    return { valid: false, error: `timeframe must be one of: ${validTimeframes.join(', ')}` };
  }

  if (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 100) {
    return { valid: false, error: 'confidence must be a number between 0 and 100' };
  }

  // Validate target values based on type
  const priceTypes: PredictionType[] = ['price_above', 'price_below', 'percentage_up', 'percentage_down'];
  if (priceTypes.includes(data.type as PredictionType)) {
    if (typeof data.targetValue !== 'number' || data.targetValue <= 0) {
      return { valid: false, error: 'targetValue is required for price predictions and must be positive' };
    }
  }

  if (data.type === 'price_range') {
    if (typeof data.targetValueMin !== 'number' || typeof data.targetValueMax !== 'number') {
      return { valid: false, error: 'targetValueMin and targetValueMax are required for range predictions' };
    }
    if (data.targetValueMin >= data.targetValueMax) {
      return { valid: false, error: 'targetValueMin must be less than targetValueMax' };
    }
  }

  return {
    valid: true,
    data: {
      userId: data.userId as string,
      userDisplayName: data.userDisplayName as string | undefined,
      type: data.type as PredictionType,
      asset: data.asset as string,
      targetValue: data.targetValue as number | undefined,
      targetValueMin: data.targetValueMin as number | undefined,
      targetValueMax: data.targetValueMax as number | undefined,
      targetDate: data.targetDate as string,
      timeframe: data.timeframe as PredictionTimeframe,
      reasoning: data.reasoning as string | undefined,
      confidence: data.confidence as number,
      isPublic: data.isPublic as boolean | undefined,
      tags: data.tags as string[] | undefined,
    },
  };
}

// =============================================================================
// GET: List predictions
// =============================================================================

/**
 * @openapi
 * /api/predictions:
 *   get:
 *     summary: List predictions with filtering
 *     parameters:
 *       - name: userId
 *         in: query
 *         schema:
 *           type: string
 *       - name: asset
 *         in: query
 *         schema:
 *           type: string
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, correct, incorrect, partially_correct, expired, cancelled]
 *       - name: view
 *         in: query
 *         schema:
 *           type: string
 *           enum: [list, leaderboard, analytics]
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 50
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const asset = searchParams.get('asset');
    const status = searchParams.get('status') as PredictionStatus | null;
    const view = searchParams.get('view') || 'list';
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const minPredictions = parseInt(searchParams.get('minPredictions') || '5');

    // Rate limiting
    const rateLimit = checkRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    // Handle different views
    switch (view) {
      case 'leaderboard': {
        const leaderboard = await getLeaderboard({ limit, minPredictions });
        return NextResponse.json({
          success: true,
          data: leaderboard,
          meta: {
            view: 'leaderboard',
            minPredictions,
            limit,
          },
        });
      }

      case 'analytics': {
        const analytics = await getPredictionAnalytics();
        return NextResponse.json({
          success: true,
          data: analytics,
          meta: {
            view: 'analytics',
          },
        });
      }

      case 'list':
      default: {
        let predictions;
        
        if (userId) {
          predictions = await getUserPredictions(userId, { 
            status: status || undefined, 
            limit 
          });
        } else if (asset) {
          predictions = await getAssetPredictions(asset, { 
            status: status || undefined, 
            limit 
          });
        } else {
          // Return public predictions
          predictions = await getAssetPredictions('', { 
            status: status || undefined, 
            limit 
          });
        }

        return NextResponse.json({
          success: true,
          data: predictions,
          meta: {
            view: 'list',
            count: predictions.length,
            limit,
            filters: {
              userId: userId || undefined,
              asset: asset || undefined,
              status: status || undefined,
            },
          },
        });
      }
    }
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch predictions' 
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST: Create or resolve prediction
// =============================================================================

/**
 * @openapi
 * /api/predictions:
 *   post:
 *     summary: Create a new prediction or resolve an existing one
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - $ref: '#/components/schemas/PredictionInput'
 *               - $ref: '#/components/schemas/ResolvePredictionInput'
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimit = checkRateLimit(request);
    if (!rateLimit.allowed) {
      return rateLimitResponse(rateLimit);
    }

    const body = await request.json();

    // Check if this is a resolution request
    if (body.action === 'resolve') {
      if (!body.predictionId) {
        return NextResponse.json(
          { success: false, error: 'predictionId is required for resolution' },
          { status: 400 }
        );
      }

      const prediction = await resolvePrediction(body.predictionId, body.manualOutcome);
      
      return NextResponse.json({
        success: true,
        data: prediction,
        message: `Prediction resolved as ${prediction.status}`,
      });
    }

    // Check if this is a cancel request
    if (body.action === 'cancel') {
      if (!body.predictionId || !body.userId) {
        return NextResponse.json(
          { success: false, error: 'predictionId and userId are required for cancellation' },
          { status: 400 }
        );
      }

      const prediction = await cancelPrediction(body.predictionId, body.userId);
      
      return NextResponse.json({
        success: true,
        data: prediction,
        message: 'Prediction cancelled',
      });
    }

    // Check if this is a batch resolution request
    if (body.action === 'resolve_expired') {
      const result = await resolveExpiredPredictions();
      
      return NextResponse.json({
        success: true,
        data: result,
        message: `Resolved ${result.resolved} predictions, ${result.failed} failed`,
      });
    }

    // Otherwise, create a new prediction
    const validation = validatePredictionInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const prediction = await createPrediction(validation.data);

    return NextResponse.json({
      success: true,
      data: prediction,
      message: 'Prediction created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error handling prediction request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process request' 
      },
      { status: 500 }
    );
  }
}

// =============================================================================
// OPTIONS: CORS support
// =============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
