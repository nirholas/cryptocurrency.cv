/**
 * Premium API - Advanced Screener
 *
 * POST /api/premium/analytics/screener
 *
 * Advanced coin screener with unlimited filters, custom sorting,
 * and technical indicators.
 *
 * Price: $0.01 per query
 *
 * @module api/premium/analytics/screener
 */

import { NextRequest, NextResponse } from 'next/server';
import { withX402 } from '@/lib/x402';
import { getTopCoins, TokenPrice } from '@/lib/market-data';

export const runtime = 'nodejs';

interface ScreenerFilter {
  field: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between' | 'contains';
  value: number | string | [number, number];
}

interface ScreenerRequest {
  filters?: ScreenerFilter[];
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

interface ScreenerResponse {
  results: TokenPrice[];
  total: number;
  filtered: number;
  query: ScreenerRequest;
  premium: true;
  executionTime: number;
}

/**
 * Apply a single filter to a coin
 */
function applyFilter(coin: TokenPrice, filter: ScreenerFilter): boolean {
  const coinData = coin as unknown as Record<string, unknown>;
  const value = coinData[filter.field];

  if (value === undefined || value === null) return false;

  switch (filter.operator) {
    case 'gt':
      return typeof value === 'number' && value > (filter.value as number);
    case 'lt':
      return typeof value === 'number' && value < (filter.value as number);
    case 'gte':
      return typeof value === 'number' && value >= (filter.value as number);
    case 'lte':
      return typeof value === 'number' && value <= (filter.value as number);
    case 'eq':
      return value === filter.value;
    case 'between':
      if (typeof value === 'number' && Array.isArray(filter.value)) {
        return value >= filter.value[0] && value <= filter.value[1];
      }
      return false;
    case 'contains':
      return typeof value === 'string' && value.toLowerCase().includes(String(filter.value).toLowerCase());
    default:
      return true;
  }
}

/**
 * Handler for advanced screener
 */
async function handler(request: NextRequest): Promise<NextResponse<ScreenerResponse | { error: string }>> {
  const startTime = Date.now();

  try {
    const body: ScreenerRequest = await request.json();
    const { filters = [], sort, limit = 100, offset = 0 } = body;

    // Fetch all coins (premium gets up to 500)
    const allCoins = await getTopCoins(500);

    // Apply filters
    let filteredCoins = allCoins;
    for (const filter of filters) {
      filteredCoins = filteredCoins.filter((coin) => applyFilter(coin, filter));
    }

    // Apply sorting
    if (sort) {
      filteredCoins.sort((a, b) => {
        const aData = a as unknown as Record<string, unknown>;
        const bData = b as unknown as Record<string, unknown>;
        const aVal = aData[sort.field];
        const bVal = bData[sort.field];

        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sort.direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return 0;
      });
    }

    // Apply pagination
    const totalFiltered = filteredCoins.length;
    const paginatedCoins = filteredCoins.slice(offset, offset + limit);

    return NextResponse.json({
      results: paginatedCoins,
      total: allCoins.length,
      filtered: totalFiltered,
      query: body,
      premium: true,
      executionTime: Date.now() - startTime,
    });
  } catch (error) {
    console.error('Error in screener:', error);
    return NextResponse.json({ error: 'Failed to execute screener query' }, { status: 500 });
  }
}

/**
 * POST /api/premium/analytics/screener
 *
 * Premium endpoint - requires x402 payment ($0.01)
 *
 * Request body:
 * {
 *   "filters": [
 *     { "field": "market_cap", "operator": "gt", "value": 1000000000 },
 *     { "field": "price_change_percentage_24h", "operator": "between", "value": [5, 20] }
 *   ],
 *   "sort": { "field": "total_volume", "direction": "desc" },
 *   "limit": 50,
 *   "offset": 0
 * }
 *
 * Available operators:
 * - gt, lt, gte, lte: Greater/less than (equal)
 * - eq: Exact match
 * - between: Value between [min, max]
 * - contains: String contains (case-insensitive)
 */
export const POST = withX402('/api/premium/analytics/screener', handler);
