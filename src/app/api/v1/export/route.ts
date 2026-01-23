/**
 * Premium API v1 - Data Export Endpoint
 *
 * Exports bulk cryptocurrency data in JSON or CSV format
 * Higher priced due to data volume
 * Requires x402 payment or valid API key
 *
 * @price $0.01 per request
 */

import { NextRequest, NextResponse } from 'next/server';
import { hybridAuthMiddleware } from '@/lib/x402';

const ENDPOINT = '/api/v1/export';

export async function GET(request: NextRequest) {
  // Check authentication
  const authResponse = await hybridAuthMiddleware(request, ENDPOINT);
  if (authResponse) return authResponse;

  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'json';
  const type = searchParams.get('type') || 'coins';
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '100')));

  // Validate format
  if (!['json', 'csv'].includes(format)) {
    return NextResponse.json(
      { success: false, error: 'Invalid format. Use: json or csv' },
      { status: 400 }
    );
  }

  // Validate type
  if (!['coins', 'defi'].includes(type)) {
    return NextResponse.json(
      { success: false, error: 'Invalid type. Use: coins or defi' },
      { status: 400 }
    );
  }

  try {
    let data: Record<string, unknown>[];

    if (type === 'coins') {
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h,7d,30d`,
        {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'CryptoDataAggregator/1.0',
          },
          next: { revalidate: 300 },
        }
      );

      if (!response.ok) {
        throw new Error(`Upstream API error: ${response.status}`);
      }

      data = await response.json();
    } else if (type === 'defi') {
      const response = await fetch('https://api.llama.fi/protocols', {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'CryptoDataAggregator/1.0',
        },
        next: { revalidate: 300 },
      });

      if (!response.ok) {
        throw new Error(`Upstream API error: ${response.status}`);
      }

      const protocols = await response.json();
      data = protocols.slice(0, limit).map((p: Record<string, unknown>) => ({
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

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'X-Export-Count': data.length.toString(),
        },
      });
    }

    // Return JSON format
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
      }
    );
  } catch (error) {
    console.error('[API] /v1/export error:', error);

    return NextResponse.json({ success: false, error: 'Failed to export data' }, { status: 502 });
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
      .join(',')
  );

  return [headerRow, ...rows].join('\n');
}
