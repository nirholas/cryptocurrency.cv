/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

import { type NextRequest } from 'next/server';
import {
  generateForecast,
  generateMultiAssetForecast,
  trackNarratives,
  getCalibrationMetrics,
  resolvePrediction,
} from '@/lib/predictive-intelligence';
import type { ForecastHorizon } from '@/lib/predictive-intelligence';
import { jsonResponse, errorResponse, withTiming, CACHE_CONTROL } from '@/lib/api-utils';

export const runtime = 'edge';

/**
 * GET /api/forecast
 * Get forecast for an asset or list API capabilities
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const { searchParams } = new URL(request.url);
  const asset = searchParams.get('asset');
  const horizon = (searchParams.get('horizon') || '1d') as ForecastHorizon;
  const action = searchParams.get('action');

  // Special actions
  if (action === 'narratives') {
    const narratives = await trackNarratives();
    return jsonResponse(withTiming({
      success: true,
      action: 'narratives',
      narratives,
    }, startTime), {
      cacheControl: CACHE_CONTROL.ai,
    });
  }

  if (action === 'calibration') {
    const metrics = getCalibrationMetrics();
    return jsonResponse(withTiming({
      success: true,
      action: 'calibration',
      metrics,
    }, startTime), {
      cacheControl: CACHE_CONTROL.standard,
    });
  }

  // If no asset, return API docs
  if (!asset) {
    return jsonResponse(withTiming({
      endpoint: '/api/forecast',
      description: 'AI-powered predictive intelligence engine with multi-model ensemble forecasting',
      methods: {
        GET: {
          params: {
            asset: 'Asset to forecast (e.g., BTC, ETH, SOL)',
            horizon: '1h | 4h | 1d | 3d | 1w | 2w | 1m (default: 1d)',
            action: 'narratives | calibration (special actions)',
          },
        },
        POST: {
          description: 'Multi-asset forecast or prediction resolution',
          body: {
            action: 'multi-forecast | resolve',
            assets: '(multi-forecast) Array of asset symbols',
            forecastId: '(resolve) Forecast ID to resolve',
            actualMovePct: '(resolve) Actual price move percentage',
          },
        },
      },
      models: [
        { name: 'narrative-momentum', description: 'Tracks narrative lifecycle and media saturation' },
        { name: 'sentiment-trajectory', description: 'Detects sentiment acceleration, divergences, and extremes' },
        { name: 'historical-analogue', description: 'Finds similar past periods and their outcomes' },
        { name: 'regime-detection', description: 'Classifies market regime (trending/ranging/crisis/etc.)' },
      ],
      features: [
        'Multi-model ensemble with confidence-weighted blending',
        'Transparent reasoning chains for every prediction',
        'Calibration tracking (are 70% predictions right 70% of the time?)',
        'Temporal confidence decay',
        'Catalyst identification with probability scoring',
      ],
    }, startTime), {
      cacheControl: CACHE_CONTROL.standard,
    });
  }

  // Generate forecast for single asset
  try {
    const validHorizons: ForecastHorizon[] = ['1h', '4h', '1d', '3d', '1w', '2w', '1m'];
    if (!validHorizons.includes(horizon)) {
      return errorResponse(`Invalid horizon. Must be one of: ${validHorizons.join(', ')}`, undefined, 400);
    }

    const forecast = await generateForecast(asset.toUpperCase(), { horizon });

    return jsonResponse(withTiming({
      success: true,
      forecast,
    }, startTime), {
      cacheControl: CACHE_CONTROL.ai,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Forecast generation failed';
    return errorResponse(message, undefined, 500);
  }
}

/**
 * POST /api/forecast
 * Multi-asset forecast or prediction resolution
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === 'multi-forecast') {
      const { assets, horizon } = body as { assets?: string[]; horizon?: ForecastHorizon };

      if (!assets || !Array.isArray(assets) || assets.length === 0) {
        return errorResponse('assets array is required', undefined, 400);
      }

      if (assets.length > 10) {
        return errorResponse('Maximum 10 assets per request', undefined, 400);
      }

      const forecasts = await generateMultiAssetForecast(
        assets.map((a: string) => a.toUpperCase()),
        horizon
      );

      return jsonResponse(withTiming({
        success: true,
        action: 'multi-forecast',
        forecasts: Object.fromEntries(forecasts),
        assetCount: forecasts.size,
      }, startTime), {
        cacheControl: CACHE_CONTROL.ai,
      });
    }

    if (action === 'resolve') {
      const { forecastId, actualMovePct } = body as { forecastId?: string; actualMovePct?: number };

      if (!forecastId || actualMovePct === undefined) {
        return errorResponse('forecastId and actualMovePct are required', undefined, 400);
      }

      resolvePrediction(forecastId, actualMovePct);

      return jsonResponse(withTiming({
        success: true,
        action: 'resolve',
        forecastId,
        actualMovePct,
        message: 'Prediction resolved for calibration tracking',
      }, startTime));
    }

    return errorResponse('Unknown action. Use: multi-forecast or resolve', undefined, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Request failed';
    return errorResponse(message, undefined, 500);
  }
}
