/**
 * x402 API Pricing Configuration
 *
 * Defines pricing for all premium API endpoints
 * Prices are in USD string format (e.g., "$0.001")
 */

// =============================================================================
// ENDPOINT PRICING
// =============================================================================

/**
 * API endpoint pricing in USD
 * Format: "$X.XXX" for x402 SDK compatibility
 */
export const API_PRICING = {
  // Core Market Data
  '/api/v1/coins': '$0.001',
  '/api/v1/coin': '$0.002',
  '/api/v1/market-data': '$0.002',
  '/api/v1/trending': '$0.001',

  // DeFi Data
  '/api/v1/defi': '$0.002',
  '/api/v1/defi/tvl': '$0.002',
  '/api/v1/defi/yields': '$0.003',

  // Premium Data
  '/api/v1/export': '$0.01',
  '/api/v1/historical': '$0.005',
  '/api/v1/ohlcv': '$0.003',

  // Alerts & Notifications
  '/api/v1/alerts': '$0.001',
  '/api/v1/webhooks': '$0.002',

  // Analytics
  '/api/v1/correlation': '$0.005',
  '/api/v1/screener': '$0.003',
  '/api/v1/sentiment': '$0.002',
  '/api/v1/whale-alerts': '$0.005',

  // Portfolio
  '/api/v1/portfolio': '$0.002',
  '/api/v1/portfolio/sync': '$0.005',
} as const;

export type PricedEndpoint = keyof typeof API_PRICING;

/**
 * Get price for an endpoint
 */
export function getEndpointPrice(endpoint: string): string {
  return API_PRICING[endpoint as PricedEndpoint] || '$0.001';
}

// =============================================================================
// SUBSCRIPTION TIERS
// =============================================================================

export interface TierConfig {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  requestsPerDay: number;
  rateLimit: string;
  features: string[];
}

export const API_TIERS: Record<string, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceDisplay: 'Free',
    requestsPerDay: 100,
    rateLimit: '100/day',
    features: ['Basic market data', 'Top 100 coins', 'Rate limited', 'Community support'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceDisplay: '$29/month',
    requestsPerDay: 10000,
    rateLimit: '10,000/day',
    features: [
      'All endpoints',
      'Historical data (1 year)',
      'CSV/JSON exports',
      'Webhooks (10 active)',
      'Priority support',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    priceDisplay: '$99/month',
    requestsPerDay: -1,
    rateLimit: 'Unlimited',
    features: [
      'Unlimited requests',
      'Full historical data',
      'Custom endpoints',
      'Unlimited webhooks',
      'SLA guarantee (99.9%)',
      'Dedicated support',
      'White-label options',
    ],
  },
} as const;

export type ApiTier = keyof typeof API_TIERS;

// =============================================================================
// ENDPOINT METADATA
// =============================================================================

export interface EndpointMeta {
  description: string;
  parameters?: Record<
    string,
    {
      type: string;
      description: string;
      required?: boolean;
      default?: string;
    }
  >;
  outputSchema?: object;
}

/**
 * Comprehensive endpoint metadata for Bazaar discovery
 */
export const ENDPOINT_METADATA: Record<string, EndpointMeta> = {
  '/api/v1/coins': {
    description: 'List all cryptocurrencies with market data. Supports pagination and sorting.',
    parameters: {
      page: { type: 'number', description: 'Page number for pagination', default: '1' },
      per_page: { type: 'number', description: 'Results per page (max 250)', default: '100' },
      order: { type: 'string', description: 'Sort order', default: 'market_cap_desc' },
      ids: { type: 'string', description: 'Comma-separated coin IDs to filter' },
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              symbol: { type: 'string' },
              name: { type: 'string' },
              current_price: { type: 'number' },
              market_cap: { type: 'number' },
              market_cap_rank: { type: 'number' },
              total_volume: { type: 'number' },
              price_change_percentage_24h: { type: 'number' },
              price_change_percentage_7d: { type: 'number' },
            },
          },
        },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            perPage: { type: 'number' },
            total: { type: 'number' },
          },
        },
      },
    },
  },

  '/api/v1/coin': {
    description: 'Get detailed data for a single cryptocurrency by ID.',
    parameters: {
      coinId: { type: 'string', description: 'Coin ID (e.g., bitcoin, ethereum)', required: true },
    },
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            symbol: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string' },
            market_data: { type: 'object' },
            links: { type: 'object' },
            categories: { type: 'array' },
          },
        },
      },
    },
  },

  '/api/v1/market-data': {
    description: 'Global cryptocurrency market statistics and trending coins.',
    outputSchema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            global: {
              type: 'object',
              properties: {
                total_market_cap: { type: 'object' },
                total_volume: { type: 'object' },
                market_cap_percentage: { type: 'object' },
                market_cap_change_percentage_24h_usd: { type: 'number' },
              },
            },
            trending: { type: 'array' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  },

  '/api/v1/export': {
    description: 'Bulk data export in JSON or CSV format.',
    parameters: {
      format: { type: 'string', description: 'Export format: json or csv', default: 'json' },
      type: {
        type: 'string',
        description: 'Data type: coins, defi, or historical',
        default: 'coins',
      },
      limit: { type: 'number', description: 'Number of records (max 500)', default: '100' },
    },
  },

  '/api/v1/historical': {
    description: 'Historical price data for a cryptocurrency.',
    parameters: {
      coinId: { type: 'string', description: 'Coin ID', required: true },
      days: { type: 'number', description: 'Number of days (1-365)', default: '30' },
      interval: { type: 'string', description: 'Data interval: hourly or daily', default: 'daily' },
    },
  },

  '/api/v1/correlation': {
    description: 'Correlation matrix showing price correlation between top cryptocurrencies.',
    parameters: {
      coins: { type: 'string', description: 'Comma-separated coin IDs (default: top 10)' },
      days: { type: 'number', description: 'Lookback period in days', default: '30' },
    },
  },

  '/api/v1/screener': {
    description: 'Advanced cryptocurrency screener with customizable filters.',
    parameters: {
      min_market_cap: { type: 'number', description: 'Minimum market cap in USD' },
      max_market_cap: { type: 'number', description: 'Maximum market cap in USD' },
      min_volume: { type: 'number', description: 'Minimum 24h volume in USD' },
      min_change_24h: { type: 'number', description: 'Minimum 24h price change %' },
      max_change_24h: { type: 'number', description: 'Maximum 24h price change %' },
      sort: { type: 'string', description: 'Sort field', default: 'market_cap' },
      order: { type: 'string', description: 'Sort order: asc or desc', default: 'desc' },
    },
  },
};

/**
 * Get metadata for an endpoint
 */
export function getEndpointMetadata(endpoint: string): EndpointMeta {
  return ENDPOINT_METADATA[endpoint] || { description: `API endpoint: ${endpoint}` };
}
