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
 * Premium API v1 - Data Export Endpoint
 *
 * Exports bulk cryptocurrency data in JSON or CSV format
 * Higher priced due to data volume
 * Requires x402 payment or valid API key
 *
 * @price $0.01 per request
 */

import { type NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';
import { ApiError } from '@/lib/api-error';
import { createRequestLogger } from '@/lib/logger';
import { getTopCoins } from '@/lib/market-data';
import { getLlamaProtocols } from '@/lib/apis/llama-bulk';

const ENDPOINT = '/api/v1/export';
/** CoinGecko's /coins/markets returns at most 250 rows per page. */
const MAX_COINS = 250;
const MAX_ROWS = 500;
const DEFAULT_ROWS = 100;

export async function GET(request: NextRequest) {
  const logger = createRequestLogger(request);
  const startTime = Date.now();

  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'json';
  const type = searchParams.get('type') || 'coins';
  const requested = Number.parseInt(searchParams.get('limit') ?? '', 10);
  const limit = Math.min(MAX_ROWS, Math.max(1, Number.isNaN(requested) ? DEFAULT_ROWS : requested));

  // Validate format
  if (!['json', 'csv'].includes(format)) {
    return ApiError.badRequest('Invalid format. Use: json or csv');
  }

  // Validate type
  if (!['coins', 'defi'].includes(type)) {
    return ApiError.badRequest('Invalid type. Use: coins or defi');
  }

  try {
    logger.info('Exporting data', { format, type, limit });

    let data: Record<string, unknown>[];

    if (type === 'coins') {
      // Shared fetcher: demo-key header, in-process cache and CoinPaprika fallback.
      const coins = await getTopCoins(Math.min(limit, MAX_COINS));
      if (coins.length === 0) throw new Error('No market data from CoinGecko or CoinPaprika');
      data = coins.map(({ sparkline_in_7d: _sparkline, ...coin }) => ({ ...coin }));
    } else if (type === 'defi') {
      const protocols = await getLlamaProtocols();
      data = protocols.slice(0, limit).map((p) => ({
        name: p.name,
        symbol: p.symbol,
        category: p.category,
        chain: p.chain,
        tvl: p.tvl,
        change_1h: p.change_1h,
        change_1d: p.change_1d,
        change_7d: p.change_7d,
        mcap: p.mcap,
        url: p.url,
      }));
    } else {
      data = [];
    }

    // Return CSV format
    if (format === 'csv') {
      const csv = convertToCSV(data);
      const filename = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;

      logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Export-Count': data.length.toString(),
        },
      });
    }

    // Return JSON format
    logger.request(request.method, request.nextUrl.pathname, 200, Date.now() - startTime);

    return NextResponse.json(
      {
        success: true,
        data,
        meta: {
          endpoint: ENDPOINT,
          format,
          type,
          count: data.length,
          exportedAt: new Date().toISOString(),
        },
      },
      {
        headers: {
          'X-Export-Count': data.length.toString(),
        },
      },
    );
  } catch (error) {
    logger.error('Failed to export data', error, { format, type });
    return ApiError.upstream(type === 'coins' ? 'CoinGecko' : 'DefiLlama', error);
  }
}

/**
 * Convert array of objects to CSV string
 */
function convertToCSV(data: Record<string, unknown>[]): string {
  if (!data.length) return '';

  // Get all unique keys as headers
  const headers = [...new Set(data.flatMap((obj) => Object.keys(obj)))];

  // Create header row
  const headerRow = headers.join(',');

  // Create data rows
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];

        if (value === null || value === undefined) {
          return '';
        }

        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }

        const str = String(value);

        // Escape values containing comma, quote, or newline
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }

        return str;
      })
      .join(','),
  );

  return [headerRow, ...rows].join('\n');
}
