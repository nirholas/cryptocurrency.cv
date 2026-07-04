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
 * GET /api/v1/forecast
 *
 * Premium API v1 - Price Forecast Endpoint
 * AI-powered price predictions using news sentiment and market data.
 * Requires x402 payment or valid API key.
 *
 * @price $0.005 per request
 */

import { type NextRequest, NextResponse } from "next/server";
import { hybridAuthMiddleware } from "@/lib/x402";
import { ApiError } from "@/lib/api-error";
import { createRequestLogger } from "@/lib/logger";
import {
  generateForecast,
  generateMultiAssetForecast,
  trackNarratives,
  getCalibrationMetrics,
} from "@/lib/predictive-intelligence";
import type { ForecastHorizon } from "@/lib/predictive-intelligence";

export const runtime = 'nodejs';
export const revalidate = 300;

const ENDPOINT = "/api/v1/forecast";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const asset = searchParams.get("asset");
  const horizon = (searchParams.get("horizon") || "1d") as ForecastHorizon;
  const action = searchParams.get("action");

  try {
    // Narratives tracking
    if (action === "narratives") {
      const narratives = await trackNarratives();
      return NextResponse.json(
        {
          success: true,
          action: "narratives",
          narratives,
          version: "v1",
          duration: Date.now() - startTime,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        },
      );
    }

    // Calibration metrics
    if (action === "calibration") {
      const metrics = getCalibrationMetrics();
      return NextResponse.json(
        {
          success: true,
          action: "calibration",
          metrics,
          version: "v1",
          duration: Date.now() - startTime,
        },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=600, stale-while-revalidate=1200",
          },
        },
      );
    }

    // Multi-asset forecast
    if (!asset) {
      logger.info("Generating multi-asset forecast", { horizon });
      const defaultAssets = ["BTC", "ETH", "SOL", "BNB", "XRP"];
      const forecast = await generateMultiAssetForecast(defaultAssets, horizon);
      return NextResponse.json(
        {
          success: true,
          forecast,
          horizon,
          version: "v1",
          duration: Date.now() - startTime,
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
          },
        },
      );
    }

    // Single asset forecast
    logger.info("Generating forecast", { asset, horizon });
    const forecast = await generateForecast(asset, { horizon });

    return NextResponse.json(
      {
        success: true,
        asset,
        horizon,
        forecast,
        version: "v1",
        disclaimer: "AI-generated forecast. Not financial advice. Always DYOR.",
        duration: Date.now() - startTime,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      },
    );
  } catch (error) {
    logger.error("Forecast error", { error });
    const apiError = ApiError.from(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code, version: "v1" },
      { status: apiError.statusCode },
    );
  }
}
