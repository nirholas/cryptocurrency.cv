/**
 * Premium Advanced Screener
 *
 * Powerful crypto screening with unlimited filter combinations.
 * This is what traders actually pay for!
 */

import { NextRequest, NextResponse } from 'next/server';
import { PREMIUM_PRICING } from '@/lib/x402-config';
import { getTopCoins } from '@/lib/market-data';

export const runtime = 'edge';

interface ScreenerFilter {
  field: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between' | 'in';
  value: number | number[] | string[];
}

interface ScreenerRequest {
  filters: ScreenerFilter[];
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  limit?: number;
  offset?: number;
}

// Available fields for screening
const SCREENER_FIELDS = {
  market_cap: { type: 'number', description: 'Market capitalization in USD' },
  current_price: { type: 'number', description: 'Current price in USD' },
  total_volume: { type: 'number', description: '24h trading volume' },
  price_change_percentage_24h: { type: 'number', description: '24h price change %' },
  price_change_percentage_7d: { type: 'number', description: '7d price change %' },
  price_change_percentage_30d: { type: 'number', description: '30d price change %' },
  ath_change_percentage: { type: 'number', description: 'Distance from ATH %' },
  market_cap_rank: { type: 'number', description: 'Market cap ranking' },
  circulating_supply: { type: 'number', description: 'Circulating supply' },
  total_supply: { type: 'number', description: 'Total supply' },
  // Calculated fields
  volume_to_mcap: { type: 'number', description: 'Volume/Market Cap ratio' },
  supply_ratio: { type: 'number', description: 'Circulating/Total supply ratio' },
};

/**
 * Apply a single filter to a coin
 */
function applyFilter(coin: Record<string, unknown>, filter: ScreenerFilter): boolean {
  let value: number;

  // Handle calculated fields
  if (filter.field === 'volume_to_mcap') {
    value = (coin.total_volume as number) / (coin.market_cap as number);
  } else if (filter.field === 'supply_ratio') {
    const circulating = coin.circulating_supply as number;
    const total = coin.total_supply as number;
    value = total ? circulating / total : 1;
  } else if (filter.field === 'price_change_percentage_7d') {
    value = (coin.price_change_percentage_7d_in_currency as number) || 0;
  } else if (filter.field === 'price_change_percentage_30d') {
    value = (coin.price_change_percentage_30d_in_currency as number) || 0;
  } else {
    value = coin[filter.field] as number;
  }

  if (value === undefined || value === null) return false;

  switch (filter.operator) {
    case 'gt':
      return value > (filter.value as number);
    case 'lt':
      return value < (filter.value as number);
    case 'gte':
      return value >= (filter.value as number);
    case 'lte':
      return value <= (filter.value as number);
    case 'eq':
      return value === (filter.value as number);
    case 'between':
      const [min, max] = filter.value as number[];
      return value >= min && value <= max;
    case 'in':
      return (filter.value as (string | number)[]).includes(value);
    default:
      return true;
  }
}

/**
 * Parse query string filters
 * Format: ?filter[market_cap][gt]=1000000000&filter[change24h][between]=5,20
 */
function parseFiltersFromQuery(searchParams: URLSearchParams): ScreenerFilter[] {
  const filters: ScreenerFilter[] = [];

  // Check for specific filter patterns
  const filterPatterns = [
    { param: 'minMarketCap', field: 'market_cap', operator: 'gte' as const },
    { param: 'maxMarketCap', field: 'market_cap', operator: 'lte' as const },
    { param: 'minVolume', field: 'total_volume', operator: 'gte' as const },
    { param: 'maxVolume', field: 'total_volume', operator: 'lte' as const },
    { param: 'minChange24h', field: 'price_change_percentage_24h', operator: 'gte' as const },
    { param: 'maxChange24h', field: 'price_change_percentage_24h', operator: 'lte' as const },
    { param: 'minChange7d', field: 'price_change_percentage_7d', operator: 'gte' as const },
    { param: 'maxChange7d', field: 'price_change_percentage_7d', operator: 'lte' as const },
    { param: 'minPrice', field: 'current_price', operator: 'gte' as const },
    { param: 'maxPrice', field: 'current_price', operator: 'lte' as const },
    { param: 'minRank', field: 'market_cap_rank', operator: 'gte' as const },
    { param: 'maxRank', field: 'market_cap_rank', operator: 'lte' as const },
    { param: 'minAthDistance', field: 'ath_change_percentage', operator: 'gte' as const },
    { param: 'maxAthDistance', field: 'ath_change_percentage', operator: 'lte' as const },
    { param: 'minVolumeToMcap', field: 'volume_to_mcap', operator: 'gte' as const },
    { param: 'maxVolumeToMcap', field: 'volume_to_mcap', operator: 'lte' as const },
  ];

  for (const pattern of filterPatterns) {
    const value = searchParams.get(pattern.param);
    if (value) {
      filters.push({
        field: pattern.field,
        operator: pattern.operator,
        value: parseFloat(value),
      });
    }
  }

  return filters;
}

/**
 * Preset screening strategies
 */
const PRESETS = {
  // Momentum strategies
  'hot-gainers': [
    { field: 'price_change_percentage_24h', operator: 'gte' as const, value: 10 },
    { field: 'total_volume', operator: 'gte' as const, value: 10_000_000 },
  ],
  'momentum-leaders': [
    { field: 'price_change_percentage_7d', operator: 'gte' as const, value: 20 },
    { field: 'market_cap', operator: 'gte' as const, value: 100_000_000 },
  ],
  'oversold-bounce': [
    { field: 'price_change_percentage_24h', operator: 'lte' as const, value: -10 },
    { field: 'market_cap', operator: 'gte' as const, value: 50_000_000 },
    { field: 'volume_to_mcap', operator: 'gte' as const, value: 0.1 },
  ],

  // Value strategies
  'undervalued-gems': [
    { field: 'ath_change_percentage', operator: 'lte' as const, value: -70 },
    { field: 'market_cap', operator: 'gte' as const, value: 10_000_000 },
    { field: 'total_volume', operator: 'gte' as const, value: 1_000_000 },
  ],
  'near-ath': [
    { field: 'ath_change_percentage', operator: 'gte' as const, value: -10 },
    { field: 'market_cap', operator: 'gte' as const, value: 100_000_000 },
  ],

  // Cap-based
  'large-caps': [{ field: 'market_cap', operator: 'gte' as const, value: 10_000_000_000 }],
  'mid-caps': [
    { field: 'market_cap', operator: 'between' as const, value: [1_000_000_000, 10_000_000_000] },
  ],
  'small-caps': [
    { field: 'market_cap', operator: 'between' as const, value: [100_000_000, 1_000_000_000] },
  ],
  'micro-caps': [
    { field: 'market_cap', operator: 'between' as const, value: [10_000_000, 100_000_000] },
  ],

  // Activity-based
  'high-volume': [
    { field: 'volume_to_mcap', operator: 'gte' as const, value: 0.2 },
    { field: 'market_cap', operator: 'gte' as const, value: 50_000_000 },
  ],
};

export async function advancedScreener(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;

  // Check for preset
  const preset = searchParams.get('preset');
  let filters: ScreenerFilter[] = [];

  if (preset && PRESETS[preset as keyof typeof PRESETS]) {
    filters = PRESETS[preset as keyof typeof PRESETS];
  } else {
    filters = parseFiltersFromQuery(searchParams);
  }

  // Sort configuration
  const sortField = searchParams.get('sort') || 'market_cap';
  const sortDir = searchParams.get('order') || 'desc';

  // Pagination
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500);
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    // Fetch all coins (premium gets full access)
    const allCoins = await getTopCoins(500);

    // Apply filters
    let filteredCoins = allCoins.filter((coin) =>
      filters.every((filter) => applyFilter(coin as unknown as Record<string, unknown>, filter))
    );

    // Sort
    filteredCoins.sort((a, b) => {
      let aVal: number, bVal: number;

      if (sortField === 'volume_to_mcap') {
        aVal = a.total_volume / a.market_cap;
        bVal = b.total_volume / b.market_cap;
      } else {
        aVal = (a as unknown as Record<string, number>)[sortField] || 0;
        bVal = (b as unknown as Record<string, number>)[sortField] || 0;
      }

      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Paginate
    const paginatedCoins = filteredCoins.slice(offset, offset + limit);

    // Calculate aggregate stats
    const aggregates = {
      totalMatching: filteredCoins.length,
      avgChange24h:
        filteredCoins.reduce((sum, c) => sum + (c.price_change_percentage_24h || 0), 0) /
        filteredCoins.length,
      totalMarketCap: filteredCoins.reduce((sum, c) => sum + c.market_cap, 0),
      totalVolume: filteredCoins.reduce((sum, c) => sum + c.total_volume, 0),
      topGainer: filteredCoins.reduce(
        (max, c) =>
          (c.price_change_percentage_24h || 0) > (max?.price_change_percentage_24h || -Infinity)
            ? c
            : max,
        null as (typeof filteredCoins)[0] | null
      ),
      topLoser: filteredCoins.reduce(
        (min, c) =>
          (c.price_change_percentage_24h || 0) < (min?.price_change_percentage_24h || Infinity)
            ? c
            : min,
        null as (typeof filteredCoins)[0] | null
      ),
    };

    return NextResponse.json({
      coins: paginatedCoins.map((coin) => ({
        id: coin.id,
        symbol: coin.symbol,
        name: coin.name,
        image: coin.image,
        current_price: coin.current_price,
        market_cap: coin.market_cap,
        market_cap_rank: coin.market_cap_rank,
        total_volume: coin.total_volume,
        price_change_percentage_24h: coin.price_change_percentage_24h,
        price_change_percentage_7d: coin.price_change_percentage_7d_in_currency,
        ath: coin.ath,
        ath_change_percentage: coin.ath_change_percentage,
        circulating_supply: coin.circulating_supply,
        total_supply: coin.total_supply,
        // Calculated fields
        volume_to_mcap: coin.total_volume / coin.market_cap,
        supply_ratio: coin.total_supply ? coin.circulating_supply / coin.total_supply : null,
      })),
      aggregates: {
        ...aggregates,
        topGainer: aggregates.topGainer
          ? {
              id: aggregates.topGainer.id,
              symbol: aggregates.topGainer.symbol,
              change: aggregates.topGainer.price_change_percentage_24h,
            }
          : null,
        topLoser: aggregates.topLoser
          ? {
              id: aggregates.topLoser.id,
              symbol: aggregates.topLoser.symbol,
              change: aggregates.topLoser.price_change_percentage_24h,
            }
          : null,
      },
      pagination: {
        limit,
        offset,
        total: filteredCoins.length,
        hasMore: offset + limit < filteredCoins.length,
      },
      filters: filters.length > 0 ? filters : 'none',
      preset: preset || null,
      availablePresets: Object.keys(PRESETS),
      availableFields: SCREENER_FIELDS,
      meta: {
        fetchedAt: new Date().toISOString(),
        endpoint: '/api/premium/screener/advanced',
        price: PREMIUM_PRICING['/api/premium/screener/advanced'].price,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Screener failed', details: error instanceof Error ? error.message : 'Unknown' },
      { status: 500 }
    );
  }
}
