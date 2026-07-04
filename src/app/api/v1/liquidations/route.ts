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
 * GET /api/v1/liquidations
 *
 * Premium API v1 - Liquidations Endpoint
 * Tracks leveraged position liquidations across major exchanges.
 * Requires x402 payment or valid API key.
 *
 * @price $0.003 per request
 */

import { type NextRequest, NextResponse } from "next/server";
import { hybridAuthMiddleware } from "@/lib/x402";
import { ApiError } from "@/lib/api-error";
import { createRequestLogger } from "@/lib/logger";

export const runtime = 'nodejs';
export const revalidate = 60;

const ENDPOINT = "/api/v1/liquidations";

interface LiquidationData {
  symbol: string;
  longLiquidationUsd: number;
  shortLiquidationUsd: number;
  totalLiquidationUsd: number;
}

async function fetchLiquidationData(): Promise<LiquidationData[]> {
  try {
    const response = await fetch(
      "https://open-api.coinglass.com/public/v2/liquidation_history?time_type=h24",
      {
        headers: { Accept: "application/json" },
        next: { revalidate: 60 },
      },
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (data.code !== "0" || !data.data) return [];

    return data.data.map(
      (item: {
        symbol: string;
        longLiquidationUsd: number;
        shortLiquidationUsd: number;
      }) => ({
        symbol: item.symbol,
        longLiquidationUsd: item.longLiquidationUsd || 0,
        shortLiquidationUsd: item.shortLiquidationUsd || 0,
        totalLiquidationUsd:
          (item.longLiquidationUsd || 0) + (item.shortLiquidationUsd || 0),
      }),
    );
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const symbol = searchParams.get("symbol")?.toUpperCase();
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
  const minValue = parseFloat(searchParams.get("min_value") || "0");

  try {
    logger.info("Fetching liquidations", { symbol, limit });

    let liquidations = await fetchLiquidationData();

    if (symbol) {
      liquidations = liquidations.filter((l) => l.symbol === symbol);
    }

    if (minValue > 0) {
      liquidations = liquidations.filter(
        (l) => l.totalLiquidationUsd >= minValue,
      );
    }

    liquidations = liquidations
      .sort((a, b) => b.totalLiquidationUsd - a.totalLiquidationUsd)
      .slice(0, limit);

    const totalLongs = liquidations.reduce(
      (s, l) => s + l.longLiquidationUsd,
      0,
    );
    const totalShorts = liquidations.reduce(
      (s, l) => s + l.shortLiquidationUsd,
      0,
    );

    return NextResponse.json(
      {
        liquidations,
        summary: {
          totalLongsUsd: totalLongs,
          totalShortsUsd: totalShorts,
          totalUsd: totalLongs + totalShorts,
          longShortRatio:
            totalShorts > 0
              ? Math.round((totalLongs / totalShorts) * 100) / 100
              : 0,
          dominantSide: totalLongs > totalShorts ? "longs" : "shorts",
        },
        period: "24h",
        count: liquidations.length,
        version: "v1",
        duration: Date.now() - startTime,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    logger.error("Liquidations error", { error });
    const apiError = ApiError.from(error);
    return NextResponse.json(
      { error: apiError.message, code: apiError.code, version: "v1" },
      { status: apiError.statusCode },
    );
  }
}
