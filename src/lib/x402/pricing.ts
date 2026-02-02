/**
 * x402 API Pricing Configuration
 *
 * SINGLE SOURCE OF TRUTH for all endpoint pricing.
 *
 * Pricing Philosophy:
 * - v1 API: Low-cost micropayments ($0.001-$0.01) for data access
 * - Premium API: Higher value AI/analytics features ($0.01-$0.10)
 * - Subscriptions: Monthly plans for high-volume users
 *
 * Price Format:
 * - x402 SDK expects: "$X.XXX" strings
 * - USDC has 6 decimals: $0.001 = 1000 atomic units
 *
 * @module lib/x402/pricing
 * @see https://docs.x402.org
 */

// =============================================================================
// PRICE FORMAT UTILITIES
// =============================================================================

/**
 * Convert USD value to USDC atomic units (6 decimals)
 *
 * @example
 * usdToUsdc(0.001) // Returns "1000"
 * usdToUsdc("$0.001") // Returns "1000"
 * usdToUsdc(1.50) // Returns "1500000"
 */
export function usdToUsdc(price: string | number): string {
  const numPrice = typeof price === 'string'
    ? parseFloat(price.replace('$', ''))
    : price;
  return Math.round(numPrice * 1_000_000).toString();
}

/**
 * Convert USD value to USDC as BigInt
 */
export function usdToUsdcBigInt(price: string | number): bigint {
  return BigInt(usdToUsdc(price));
}

/**
 * Format price for human-readable display
 *
 * @example
 * formatPrice(0.001) // Returns "$0.0010"
 * formatPrice("$1.50") // Returns "$1.50"
 */
export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string'
    ? parseFloat(price.replace('$', ''))
    : price;

  if (numPrice < 0.01) {
    return `$${numPrice.toFixed(4)}`;
  }
  return `$${numPrice.toFixed(2)}`;
}

/**
 * Ensure price is in x402 SDK format ("$X.XXX")
 *
 * @example
 * toX402Price(0.001) // Returns "$0.001"
 * toX402Price("$0.05") // Returns "$0.05"
 * toX402Price("0.001") // Returns "$0.001"
 */
export function toX402Price(price: string | number): string {
  if (typeof price === 'string' && price.startsWith('$')) {
    return price;
  }
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return `$${numPrice}`;
}

// =============================================================================
// ENDPOINT PRICING (v1 API - Pay-per-request)
// =============================================================================

/**
 * API v1 endpoint pricing in USD
 * Format: "$X.XXX" for x402 SDK compatibility
 * 
 * NOTE: Only routes that exist in src/app/api/v1/ should be listed here.
 * Free endpoints (assets, global, usage, x402) are NOT in this list.
 */
export const API_PRICING = {
  // Core Market Data
  '/api/v1/coins': '$0.001',
  '/api/v1/coin': '$0.002',
  '/api/v1/market-data': '$0.002',
  '/api/v1/trending': '$0.001',
  '/api/v1/gas': '$0.001',
  '/api/v1/exchanges': '$0.001',
  '/api/v1/search': '$0.001',

  // DeFi Data
  '/api/v1/defi': '$0.002',

  // Premium Data (CSV/JSON exports)
  '/api/v1/export': '$0.01',
  '/api/v1/historical': '$0.005',

  // Alerts & Notifications
  '/api/v1/alerts': '$0.001',
} as const;

// =============================================================================
// PREMIUM ENDPOINT PRICING (Premium API - Higher value features)
// =============================================================================

export interface PremiumEndpointConfig {
  price: number;
  description: string;
  category: string;
  rateLimit: number;
  features: string[];
  duration?: number; // For time-based passes (seconds)
}

/**
 * Premium API pricing configuration
 * Prices in USD - converted to USDC atomic units (6 decimals) at runtime
 * 
 * NOTE: Only routes that exist in src/app/api/premium/ should be listed here.
 * Routes not yet implemented are removed to avoid confusion.
 */
export const PREMIUM_PRICING: Record<string, PremiumEndpointConfig> = {
  // =========================================================================
  // AI-POWERED ANALYSIS (Highest Value)
  // =========================================================================
  '/api/premium/ai/sentiment': {
    price: 0.02,
    description: 'AI-powered sentiment analysis of crypto news',
    category: 'ai',
    rateLimit: 60,
    features: [
      'Real-time news sentiment scoring',
      'Bullish/bearish classification',
      'Impact assessment',
      'Affected assets identification',
    ],
  },
  '/api/premium/ai/signals': {
    price: 0.05,
    description: 'AI-generated buy/sell signals based on market data',
    category: 'ai',
    rateLimit: 30,
    features: [
      'Technical analysis signals',
      'Momentum indicators',
      'Support/resistance levels',
      'Risk assessment',
    ],
  },
  '/api/premium/ai/summary': {
    price: 0.01,
    description: 'AI-generated summary for any cryptocurrency',
    category: 'ai',
    rateLimit: 120,
    features: ['Market overview', 'Recent news digest', 'Key metrics analysis', 'Investment thesis'],
  },
  '/api/premium/ai/compare': {
    price: 0.03,
    description: 'AI comparison of multiple cryptocurrencies',
    category: 'ai',
    rateLimit: 30,
    features: [
      'Side-by-side analysis',
      'Strengths/weaknesses',
      'Risk comparison',
      'Investment recommendation',
    ],
  },
  '/api/premium/ai/analyze': {
    price: 0.05,
    description: 'AI-powered market analysis and insights',
    category: 'ai',
    rateLimit: 30,
    features: ['Deep market analysis', 'Trend detection', 'Risk assessment', 'Investment insights'],
  },

  // =========================================================================
  // WHALE & SMART MONEY TRACKING
  // =========================================================================
  '/api/premium/whales/transactions': {
    price: 0.05,
    description: 'Large cryptocurrency transactions (whale movements)',
    category: 'whales',
    rateLimit: 60,
    features: [
      'Transactions >$1M',
      'Exchange inflow/outflow',
      'Whale wallet identification',
      'Historical patterns',
    ],
  },
  '/api/premium/whales/alerts': {
    price: 0.05,
    description: 'Real-time whale alert subscription',
    category: 'whales',
    rateLimit: 10,
    features: [
      'Webhook notifications',
      'Customizable thresholds',
      '24h subscription',
      'Multi-asset support',
    ],
  },
  '/api/premium/smart-money': {
    price: 0.05,
    description: 'Smart money flow and institutional movements',
    category: 'whales',
    rateLimit: 30,
    features: [
      'Institutional buying/selling',
      'VC wallet tracking',
      'Fund flow analysis',
      'Accumulation patterns',
    ],
  },

  // =========================================================================
  // ADVANCED SCREENER & SIGNALS
  // =========================================================================
  '/api/premium/screener/advanced': {
    price: 0.02,
    description: 'Advanced crypto screener with unlimited filters',
    category: 'screener',
    rateLimit: 60,
    features: [
      'Unlimited filter combinations',
      'Custom formulas',
      'Cross-exchange data',
      'Real-time updates',
    ],
  },

  // =========================================================================
  // MARKET DATA (Premium)
  // =========================================================================
  '/api/premium/market/coins': {
    price: 0.001,
    description: 'Extended coin data with full metadata (500+ coins)',
    category: 'market',
    rateLimit: 100,
    features: ['500+ coins', 'Full metadata', 'Developer stats', 'Social metrics'],
  },
  '/api/premium/market/history': {
    price: 0.005,
    description: 'Extended historical data (5 years, hourly intervals)',
    category: 'market',
    rateLimit: 60,
    features: ['5+ years data', 'Hourly intervals', 'OHLCV format', 'Adjusted for splits'],
  },

  // =========================================================================
  // DEFI DATA
  // =========================================================================
  '/api/premium/defi/protocols': {
    price: 0.002,
    description: 'All 500+ DeFi protocols with full TVL data',
    category: 'defi',
    rateLimit: 60,
    features: ['500+ protocols', 'Full TVL data', 'Chain breakdown', 'Historical TVL'],
  },

  // =========================================================================
  // DATA EXPORTS
  // =========================================================================
  '/api/premium/export/portfolio': {
    price: 0.1,
    description: 'Export portfolio data as CSV or JSON',
    category: 'data',
    rateLimit: 10,
    features: ['Portfolio data', 'Multiple formats', 'Transaction history', 'P&L included'],
  },

  // =========================================================================
  // ANALYTICS
  // =========================================================================
  '/api/premium/analytics/screener': {
    price: 0.01,
    description: 'Advanced screener with unlimited filters and sorting',
    category: 'analytics',
    rateLimit: 60,
    features: ['Unlimited filters', 'Custom sorting', 'Saved screens', 'Real-time updates'],
  },
  '/api/premium/portfolio/analytics': {
    price: 0.01,
    description: 'Advanced portfolio analytics and performance metrics',
    category: 'analytics',
    rateLimit: 60,
    features: ['Performance tracking', 'Risk metrics', 'Allocation analysis', 'Benchmarking'],
  },

  // =========================================================================
  // ALERTS
  // =========================================================================
  '/api/premium/alerts/custom': {
    price: 0.001,
    description: 'Custom price alerts with advanced conditions',
    category: 'alerts',
    rateLimit: 100,
    features: ['Custom conditions', 'Webhook delivery', 'Multi-asset', 'Complex triggers'],
  },
  '/api/premium/alerts/whales': {
    price: 0.01,
    description: 'Whale transaction alerts and notifications',
    category: 'alerts',
    rateLimit: 30,
    features: ['Whale tracking', 'Threshold alerts', 'Webhook delivery', 'Historical data'],
  },
  '/api/premium/alerts/create': {
    price: 0.01,
    description: 'Create a premium price alert with webhooks',
    category: 'alerts',
    rateLimit: 30,
    features: ['Webhook delivery', 'Complex conditions', 'Multi-asset', '7-day duration'],
  },

  // =========================================================================
  // REALTIME STREAMING
  // =========================================================================
  '/api/premium/stream/prices': {
    price: 0.05,
    description: 'Real-time price streaming via Server-Sent Events',
    category: 'realtime',
    rateLimit: 10,
    features: ['Sub-second updates', '1000+ coins', 'Low latency', 'SSE format'],
  },
  '/api/premium/ws/prices': {
    price: 0.1,
    description: '1 hour of real-time price WebSocket access',
    category: 'realtime',
    rateLimit: 5,
    duration: 3600,
    features: ['Sub-second updates', '1000+ coins', 'Low latency', 'Reconnection support'],
  },
  '/api/premium/ws/orderbook': {
    price: 0.2,
    description: '1 hour of live orderbook depth data',
    category: 'realtime',
    rateLimit: 3,
    duration: 3600,
    features: ['Real-time depth', 'Multiple exchanges', 'Low latency', 'Reconnection support'],
  },

  // =========================================================================
  // TIME-BASED PASSES
  // =========================================================================
  '/api/premium/pass/hour': {
    price: 0.25,
    description: '1 hour unlimited premium API access',
    category: 'pass',
    rateLimit: 10,
    duration: 3600,
    features: ['All premium endpoints', 'No per-request fees', 'Higher rate limits', 'Priority support'],
  },
  '/api/premium/pass/day': {
    price: 2.0,
    description: '24 hour unlimited premium API access',
    category: 'pass',
    rateLimit: 5,
    duration: 86400,
    features: ['All premium endpoints', 'No per-request fees', 'Highest rate limits', 'Priority support'],
  },
  '/api/premium/pass/week': {
    price: 10.0,
    description: '7 day unlimited premium API access',
    category: 'pass',
    rateLimit: 2,
    duration: 604800,
    features: [
      'All premium endpoints',
      'No per-request fees',
      'Highest rate limits',
      'Priority support',
      'Webhook support',
    ],
  },
} as const;

export type PremiumEndpoint = keyof typeof PREMIUM_PRICING;

// =============================================================================
// PREMIUM CATEGORIES
// =============================================================================

export const PREMIUM_CATEGORIES = {
  ai: {
    name: 'AI Analysis',
    icon: 'brain',
    description: 'AI-powered market insights and analysis',
  },
  whales: {
    name: 'Whale Tracking',
    icon: 'whale',
    description: 'Track large holders and smart money',
  },
  screener: {
    name: 'Advanced Screener',
    icon: 'search',
    description: 'Find opportunities with powerful filters',
  },
  market: {
    name: 'Market Data',
    icon: 'chart-bar',
    description: 'Extended market data and metrics',
  },
  defi: {
    name: 'DeFi Data',
    icon: 'layers',
    description: 'DeFi protocol and chain data',
  },
  data: {
    name: 'Historical Data',
    icon: 'chart',
    description: 'Deep historical data for research',
  },
  analytics: {
    name: 'Analytics',
    icon: 'analytics',
    description: 'Advanced analytics and comparisons',
  },
  alerts: {
    name: 'Premium Alerts',
    icon: 'bell',
    description: 'Advanced alerting with webhooks',
  },
  realtime: {
    name: 'Real-Time Feeds',
    icon: 'zap',
    description: 'Live WebSocket data streams',
  },
  system: {
    name: 'System',
    icon: 'settings',
    description: 'API management features',
  },
  pass: {
    name: 'Access Passes',
    icon: 'ticket',
    description: 'Unlimited access for a time period',
  },
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
  requestsPerMinute: number;
  rateLimit: string;
  /** Display features for marketing/UI */
  features: string[];
  /** Permission scopes for access control */
  permissions: string[];
}

/**
 * SINGLE SOURCE OF TRUTH for API tier configuration.
 * 
 * This is the canonical definition - all other tier configs should derive from this.
 * - `features`: Human-readable feature list for display
 * - `permissions`: Machine-readable scopes for access control
 */
export const API_TIERS: Record<string, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    priceDisplay: 'Free',
    requestsPerDay: 100,
    requestsPerMinute: 10,
    rateLimit: '100/day',
    features: ['Basic market data', 'Top 100 coins', 'Rate limited', 'Community support'],
    permissions: ['market:read', 'trending:read', 'search:read'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceDisplay: '$29/month',
    requestsPerDay: 10000,
    requestsPerMinute: 100,
    rateLimit: '10,000/day',
    features: [
      'All endpoints',
      'Historical data (1 year)',
      'CSV/JSON exports',
      'Webhooks (10 active)',
      'Priority support',
    ],
    permissions: ['market:read', 'market:premium', 'defi:read', 'historical:read', 'export:json'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    priceDisplay: '$99/month',
    requestsPerDay: -1,
    requestsPerMinute: 1000,
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
    permissions: ['*'], // All permissions
  },
} as const;

export type ApiTier = keyof typeof API_TIERS;

// =============================================================================
// TIER CONFIGURATION VALIDATION
// =============================================================================

/**
 * Validate tier configuration at module load time.
 * This prevents runtime failures from missing or invalid configuration.
 */
Object.entries(API_TIERS).forEach(([tierName, config]) => {
  // Critical: Ensure rate limit fields exist and are valid
  if (typeof config.requestsPerMinute !== 'number') {
    throw new Error(
      `FATAL: Tier '${tierName}' is missing requestsPerMinute. ` +
      `This will cause rate limiters to fail with NaN limits.`
    );
  }
  if (typeof config.requestsPerDay !== 'number') {
    throw new Error(
      `FATAL: Tier '${tierName}' is missing requestsPerDay. ` +
      `This will cause rate limiters to fail with NaN limits.`
    );
  }
  
  // Warn about potential configuration issues
  if (config.requestsPerDay !== -1 && config.requestsPerDay < config.requestsPerMinute) {
    console.warn(
      `[TIER CONFIG] WARNING: Tier '${tierName}' has requestsPerDay (${config.requestsPerDay}) ` +
      `less than requestsPerMinute (${config.requestsPerMinute}). This may cause issues.`
    );
  }
  
  // Ensure required string fields exist
  if (!config.id || !config.name) {
    throw new Error(`FATAL: Tier '${tierName}' is missing id or name field.`);
  }
  
  // Ensure permissions array exists
  if (!Array.isArray(config.permissions) || config.permissions.length === 0) {
    throw new Error(`FATAL: Tier '${tierName}' has invalid or empty permissions array.`);
  }
});

// Only log validation success once and not during build
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build' || 
  process.env.npm_lifecycle_event === 'build' ||
  process.env.CI === 'true';
const globalThisAny = globalThis as unknown as Record<string, boolean>;
if (!isBuildTime && typeof globalThis !== 'undefined' && !globalThisAny.__tierConfigLogged) {
  globalThisAny.__tierConfigLogged = true;
  console.log('[TIER CONFIG] ✅ All tier configurations validated successfully');
}

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

// =============================================================================
// ADDITIONAL HELPER FUNCTIONS
// =============================================================================

/**
 * Legacy alias for usdToUsdc with string input
 * @deprecated Use usdToUsdc() instead which handles both string and number
 */
export function usdStringToUsdc(usdPrice: string): string {
  return usdToUsdc(usdPrice);
}

/**
 * Get premium endpoint config by path
 */
export function getPremiumEndpointConfig(endpoint: string): PremiumEndpointConfig | null {
  return PREMIUM_PRICING[endpoint] || null;
}

/**
 * Get all endpoints in a category
 */
export function getEndpointsByCategory(category: string) {
  return Object.entries(PREMIUM_PRICING)
    .filter(([, config]) => config.category === category)
    .map(([endpoint, config]) => ({
      endpoint,
      ...config,
    }));
}

/**
 * Get pricing summary (for analytics)
 */
export function getPricingSummary() {
  const endpoints = Object.entries(PREMIUM_PRICING);
  const categories = [...new Set(endpoints.map(([, c]) => c.category))];

  return {
    totalEndpoints: endpoints.length,
    categories: categories.length,
    priceRange: {
      min: Math.min(...endpoints.map(([, c]) => c.price)),
      max: Math.max(...endpoints.map(([, c]) => c.price)),
      avg: endpoints.reduce((sum, [, c]) => sum + c.price, 0) / endpoints.length,
    },
    byCategory: categories.map((cat) => ({
      category: cat,
      endpoints: endpoints.filter(([, c]) => c.category === cat).length,
      avgPrice:
        endpoints.filter(([, c]) => c.category === cat).reduce((sum, [, c]) => sum + c.price, 0) /
        endpoints.filter(([, c]) => c.category === cat).length,
    })),
  };
}

/**
 * Check if an endpoint is a premium endpoint
 */
export function isPremiumEndpoint(endpoint: string): boolean {
  return endpoint in PREMIUM_PRICING;
}

/**
 * Check if an endpoint is a v1 priced endpoint
 */
export function isV1PricedEndpoint(endpoint: string): boolean {
  return endpoint in API_PRICING;
}

/**
 * Get premium pricing info for documentation/API responses
 */
export function getPremiumPricingInfo() {
  // Import dynamically to avoid circular dependency issues
  const { CURRENT_NETWORK, PAYMENT_ADDRESS, isX402Enabled } = require('./config');
  
  return {
    endpoints: Object.entries(PREMIUM_PRICING).map(([path, config]) => ({
      path,
      price: config.price,
      priceUsdc: usdToUsdc(config.price),
      description: config.description,
      category: config.category,
      features: config.features,
      rateLimit: `${config.rateLimit}/min`,
    })),
    categories: PREMIUM_CATEGORIES,
    paymentInfo: {
      protocol: 'x402',
      network: CURRENT_NETWORK,
      enabled: isX402Enabled(),
      address: PAYMENT_ADDRESS || 'Not configured',
      documentation: 'https://docs.x402.org',
    },
    documentation: {
      x402: 'https://docs.x402.org',
      api: '/api/v1',
    },
  };
}
