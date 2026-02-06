/**
 * x402 Features & API Tiers
 *
 * Comprehensive definition of all free and premium features
 * Used across pricing page, developer portal, and documentation
 */

// =============================================================================
// FREE API ENDPOINTS
// =============================================================================

export interface EndpointInfo {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  rateLimit: string;
  example?: string;
  parameters?: string[];
}

/**
 * All completely free API endpoints - no API key required
 */
export const FREE_ENDPOINTS: EndpointInfo[] = [
  // News Endpoints
  {
    path: '/api/news',
    method: 'GET',
    description: 'Aggregated crypto news from 130+ sources',
    rateLimit: '100/hour',
    example: '/api/news?limit=10&source=coindesk',
    parameters: ['limit', 'source', 'page', 'per_page', 'from', 'to', 'lang'],
  },
  {
    path: '/api/news/international',
    method: 'GET',
    description: 'International news from 75 sources in 18 languages',
    rateLimit: '50/hour',
    parameters: ['language', 'region', 'translate', 'limit'],
  },
  {
    path: '/api/bitcoin',
    method: 'GET',
    description: 'Bitcoin-specific news and updates',
    rateLimit: '100/hour',
    parameters: ['limit', 'page'],
  },
  {
    path: '/api/defi',
    method: 'GET',
    description: 'DeFi news and protocol updates',
    rateLimit: '100/hour',
    parameters: ['limit', 'page'],
  },
  {
    path: '/api/breaking',
    method: 'GET',
    description: 'Breaking crypto news in real-time',
    rateLimit: '200/hour',
    parameters: ['limit'],
  },
  {
    path: '/api/search',
    method: 'GET',
    description: 'Search news articles by keyword',
    rateLimit: '50/hour',
    parameters: ['q', 'limit', 'from', 'to'],
  },
  {
    path: '/api/trending',
    method: 'GET',
    description: 'Trending topics and articles',
    rateLimit: '100/hour',
    parameters: ['limit', 'timeframe'],
  },

  // AI-Powered Endpoints (Basic)
  {
    path: '/api/digest',
    method: 'GET',
    description: 'AI-generated daily news digest',
    rateLimit: '20/hour',
    parameters: ['date', 'topics'],
  },
  {
    path: '/api/sentiment',
    method: 'GET',
    description: 'Market sentiment analysis',
    rateLimit: '30/hour',
    parameters: ['coin', 'timeframe'],
  },
  {
    path: '/api/summarize',
    method: 'GET',
    description: 'AI article summarization',
    rateLimit: '20/hour',
    parameters: ['url', 'length'],
  },

  // Real-Time Endpoints
  {
    path: '/api/sse',
    method: 'GET',
    description: 'Server-sent events for live updates',
    rateLimit: '5 connections',
    parameters: ['topics'],
  },

  // Feed Formats
  {
    path: '/api/rss',
    method: 'GET',
    description: 'RSS feed of latest news',
    rateLimit: 'Unlimited',
    parameters: ['source', 'limit'],
  },
  {
    path: '/api/atom',
    method: 'GET',
    description: 'Atom feed of latest news',
    rateLimit: 'Unlimited',
    parameters: ['source', 'limit'],
  },

  // Utility Endpoints
  {
    path: '/api/sources',
    method: 'GET',
    description: 'List of all news sources',
    rateLimit: 'Unlimited',
  },
  {
    path: '/api/health',
    method: 'GET',
    description: 'API health check status',
    rateLimit: 'Unlimited',
  },
  {
    path: '/api/stats',
    method: 'GET',
    description: 'API usage statistics',
    rateLimit: '10/minute',
  },
];

// =============================================================================
// PREMIUM API ENDPOINTS (x402 / API Key Required)
// =============================================================================

export interface PremiumEndpointInfo extends EndpointInfo {
  price: string;
  category: 'market-data' | 'defi' | 'analytics' | 'ai' | 'portfolio' | 'alerts' | 'export';
}

/**
 * Premium API endpoints - require x402 payment or API key
 */
export const PREMIUM_ENDPOINTS: PremiumEndpointInfo[] = [
  // Market Data
  {
    path: '/api/v1/coins',
    method: 'GET',
    description: 'List all cryptocurrencies with full market data',
    rateLimit: 'Per API tier',
    price: '$0.001',
    category: 'market-data',
    parameters: ['page', 'per_page', 'order', 'ids', 'sparkline'],
  },
  {
    path: '/api/v1/coin/:id',
    method: 'GET',
    description: 'Detailed data for a single cryptocurrency',
    rateLimit: 'Per API tier',
    price: '$0.002',
    category: 'market-data',
    parameters: ['coinId'],
  },
  {
    path: '/api/v1/market-data',
    method: 'GET',
    description: 'Global market statistics and trending coins',
    rateLimit: 'Per API tier',
    price: '$0.002',
    category: 'market-data',
  },
  {
    path: '/api/v1/trending',
    method: 'GET',
    description: 'Currently trending cryptocurrencies',
    rateLimit: 'Per API tier',
    price: '$0.001',
    category: 'market-data',
  },
  {
    path: '/api/v1/exchanges',
    method: 'GET',
    description: 'List of cryptocurrency exchanges',
    rateLimit: 'Per API tier',
    price: '$0.002',
    category: 'market-data',
    parameters: ['page', 'per_page'],
  },
  {
    path: '/api/v1/gas',
    method: 'GET',
    description: 'Real-time gas prices for EVM chains',
    rateLimit: 'Per API tier',
    price: '$0.001',
    category: 'market-data',
    parameters: ['chain'],
  },
  {
    path: '/api/v1/global',
    method: 'GET',
    description: 'Global cryptocurrency statistics',
    rateLimit: 'Per API tier',
    price: '$0.001',
    category: 'market-data',
  },

  // Historical & OHLCV
  {
    path: '/api/v1/historical/:id',
    method: 'GET',
    description: 'Historical price data for any coin',
    rateLimit: 'Per API tier',
    price: '$0.005',
    category: 'market-data',
    parameters: ['coinId', 'days', 'interval'],
  },
  {
    path: '/api/v1/ohlcv/:id',
    method: 'GET',
    description: 'OHLCV candlestick data',
    rateLimit: 'Per API tier',
    price: '$0.003',
    category: 'market-data',
    parameters: ['coinId', 'days'],
  },

  // DeFi Data
  {
    path: '/api/v1/defi',
    method: 'GET',
    description: 'DeFi protocols overview',
    rateLimit: 'Per API tier',
    price: '$0.002',
    category: 'defi',
    parameters: ['category', 'chain'],
  },
  {
    path: '/api/v1/defi/tvl',
    method: 'GET',
    description: 'Total Value Locked by protocol',
    rateLimit: 'Per API tier',
    price: '$0.002',
    category: 'defi',
    parameters: ['protocol', 'chain'],
  },
  {
    path: '/api/v1/defi/yields',
    method: 'GET',
    description: 'DeFi yield opportunities',
    rateLimit: 'Per API tier',
    price: '$0.003',
    category: 'defi',
    parameters: ['chain', 'min_apy', 'max_apy'],
  },

  // Analytics
  {
    path: '/api/v1/correlation',
    method: 'GET',
    description: 'Price correlation matrix between coins',
    rateLimit: 'Per API tier',
    price: '$0.005',
    category: 'analytics',
    parameters: ['coins', 'days'],
  },
  {
    path: '/api/v1/screener',
    method: 'GET',
    description: 'Advanced cryptocurrency screener',
    rateLimit: 'Per API tier',
    price: '$0.003',
    category: 'analytics',
    parameters: ['min_market_cap', 'max_market_cap', 'min_volume', 'min_change_24h'],
  },
  {
    path: '/api/v1/sentiment',
    method: 'GET',
    description: 'Social sentiment analysis',
    rateLimit: 'Per API tier',
    price: '$0.002',
    category: 'analytics',
    parameters: ['coin', 'source'],
  },
  {
    path: '/api/v1/whale-alerts',
    method: 'GET',
    description: 'Large transaction monitoring',
    rateLimit: 'Per API tier',
    price: '$0.005',
    category: 'analytics',
    parameters: ['coin', 'min_value'],
  },

  // AI Premium
  {
    path: '/api/premium/ai/analyze',
    method: 'POST',
    description: 'Deep AI analysis of market conditions',
    rateLimit: 'Per API tier',
    price: '$0.05',
    category: 'ai',
    parameters: ['topic', 'coins', 'depth'],
  },
  {
    path: '/api/premium/smart-money',
    method: 'GET',
    description: 'Smart money flow tracking',
    rateLimit: 'Per API tier',
    price: '$0.01',
    category: 'ai',
    parameters: ['wallet', 'timeframe'],
  },

  // Portfolio
  {
    path: '/api/v1/portfolio',
    method: 'GET',
    description: 'Portfolio tracking and analytics',
    rateLimit: 'Per API tier',
    price: '$0.002',
    category: 'portfolio',
    parameters: ['holdings'],
  },
  {
    path: '/api/v1/portfolio/sync',
    method: 'POST',
    description: 'Sync portfolio from wallet/exchange',
    rateLimit: 'Per API tier',
    price: '$0.005',
    category: 'portfolio',
    parameters: ['wallet', 'exchange'],
  },

  // Alerts & Webhooks
  {
    path: '/api/v1/alerts',
    method: 'GET',
    description: 'Price alerts management',
    rateLimit: 'Per API tier',
    price: '$0.001',
    category: 'alerts',
    parameters: ['coin', 'type'],
  },
  {
    path: '/api/v1/webhooks',
    method: 'POST',
    description: 'Webhook subscriptions',
    rateLimit: 'Per API tier',
    price: '$0.002',
    category: 'alerts',
    parameters: ['url', 'events'],
  },

  // Data Export
  {
    path: '/api/v1/export',
    method: 'GET',
    description: 'Bulk data export (JSON/CSV)',
    rateLimit: 'Per API tier',
    price: '$0.01',
    category: 'export',
    parameters: ['format', 'type', 'limit'],
  },
];

// =============================================================================
// FEATURE COMPARISON
// =============================================================================

export interface FeatureComparison {
  feature: string;
  description: string;
  free: boolean | string;
  pro: boolean | string;
  enterprise: boolean | string;
}

/**
 * Feature comparison across tiers
 */
export const FEATURE_COMPARISON: FeatureComparison[] = [
  // Access
  {
    feature: 'Free News API',
    description: 'Access to all free news endpoints',
    free: true,
    pro: true,
    enterprise: true,
  },
  {
    feature: 'Premium Market Data API',
    description: 'Full cryptocurrency market data',
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    feature: 'AI Analysis API',
    description: 'Advanced AI-powered insights',
    free: false,
    pro: true,
    enterprise: true,
  },

  // Rate Limits
  {
    feature: 'API Requests',
    description: 'Daily API request limit',
    free: '100/day',
    pro: '10,000/day',
    enterprise: 'Unlimited',
  },
  {
    feature: 'Concurrent Connections',
    description: 'Simultaneous API connections',
    free: '5',
    pro: '50',
    enterprise: 'Unlimited',
  },

  // Data Access
  {
    feature: 'Historical Data',
    description: 'Access to historical price data',
    free: '7 days',
    pro: '1 year',
    enterprise: 'Full history',
  },
  {
    feature: 'Real-time Updates',
    description: 'Live price and news updates',
    free: '5 min delay',
    pro: 'Real-time',
    enterprise: 'Real-time',
  },
  {
    feature: 'Coins Supported',
    description: 'Number of cryptocurrencies',
    free: 'Top 100',
    pro: 'Top 1,000',
    enterprise: 'All 10,000+',
  },

  // Features
  {
    feature: 'Data Export',
    description: 'Bulk data download (CSV/JSON)',
    free: false,
    pro: '500 rows',
    enterprise: 'Unlimited',
  },
  {
    feature: 'Webhooks',
    description: 'Real-time webhook notifications',
    free: false,
    pro: '10 active',
    enterprise: 'Unlimited',
  },
  {
    feature: 'Price Alerts',
    description: 'Custom price alert notifications',
    free: '5 alerts',
    pro: '100 alerts',
    enterprise: 'Unlimited',
  },
  {
    feature: 'Portfolio Tracking',
    description: 'Track portfolio performance',
    free: '1 portfolio',
    pro: '10 portfolios',
    enterprise: 'Unlimited',
  },

  // Support
  {
    feature: 'Support',
    description: 'Customer support level',
    free: 'Community',
    pro: 'Priority email',
    enterprise: 'Dedicated account manager',
  },
  {
    feature: 'SLA',
    description: 'Service level agreement',
    free: false,
    pro: '99.5%',
    enterprise: '99.9%',
  },
  {
    feature: 'White-label',
    description: 'Custom branding options',
    free: false,
    pro: false,
    enterprise: true,
  },
];

// =============================================================================
// SUBSCRIPTION TIERS (Extended)
// =============================================================================

export interface TierInfo {
  id: string;
  name: string;
  price: number;
  priceMonthly: string;
  priceYearly: string;
  description: string;
  requestsPerDay: number;
  rateLimit: string;
  features: string[];
  highlighted?: boolean;
  cta: string;
  ctaLink: string;
}

export const SUBSCRIPTION_TIERS: TierInfo[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    priceMonthly: 'Free',
    priceYearly: 'Free',
    description: 'Perfect for exploring the API and personal projects',
    requestsPerDay: 100,
    rateLimit: '100 requests/day',
    features: [
      'All free news endpoints',
      'RSS/Atom feeds',
      'Basic sentiment analysis',
      'Top 100 cryptocurrencies',
      '7 days historical data',
      'Community support',
    ],
    cta: 'Get Started',
    ctaLink: '/developers',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceMonthly: '$29/month',
    priceYearly: '$290/year',
    description: 'For developers and small businesses building crypto apps',
    requestsPerDay: 10000,
    rateLimit: '10,000 requests/day',
    features: [
      'Everything in Free',
      'All premium market data endpoints',
      'Full historical data (1 year)',
      'CSV/JSON bulk exports',
      'AI-powered analysis',
      'Webhooks (10 active)',
      '100 price alerts',
      'Priority email support',
      '99.5% SLA',
    ],
    highlighted: true,
    cta: 'Subscribe with Crypto',
    ctaLink: '/pricing#subscribe',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    priceMonthly: '$99/month',
    priceYearly: '$990/year',
    description: 'For trading firms, institutions, and high-volume applications',
    requestsPerDay: -1,
    rateLimit: 'Unlimited',
    features: [
      'Everything in Pro',
      'Unlimited API requests',
      'Full historical data (all time)',
      'Unlimited webhooks & alerts',
      'Custom endpoints available',
      'Dedicated account manager',
      'White-label options',
      '99.9% SLA guarantee',
      'Custom integrations',
    ],
    cta: 'Contact Sales',
    ctaLink: 'mailto:enterprise@cryptocurrency.cv',
  },
];

// =============================================================================
// PAY-PER-REQUEST (x402)
// =============================================================================

export interface PayPerRequestInfo {
  title: string;
  description: string;
  benefits: string[];
  howItWorks: string[];
}

export const PAY_PER_REQUEST: PayPerRequestInfo = {
  title: 'Pay-Per-Request with x402',
  description:
    'No subscription needed! Pay only for what you use with cryptocurrency micropayments. Perfect for occasional users and AI agents.',
  benefits: [
    'No monthly commitment',
    'Pay in USDC on Base network',
    'Prices as low as $0.001 per request',
    'Perfect for AI agents and bots',
    'Instant access - no signup required',
    'Supports x402 HTTP protocol',
  ],
  howItWorks: [
    'Make a request to any premium endpoint',
    'Receive a 402 Payment Required response with price',
    "Include x402 payment header with your wallet's signature",
    'Request is processed and you receive your data',
  ],
};

// =============================================================================
// CATEGORIES
// =============================================================================

export const ENDPOINT_CATEGORIES = {
  'market-data': {
    name: 'Market Data',
    icon: '📊',
    description: 'Real-time and historical cryptocurrency market data',
  },
  defi: {
    name: 'DeFi',
    icon: '🔗',
    description: 'Decentralized finance protocols and yields',
  },
  analytics: {
    name: 'Analytics',
    icon: '📈',
    description: 'Advanced market analysis and insights',
  },
  ai: {
    name: 'AI',
    icon: '🤖',
    description: 'AI-powered analysis and predictions',
  },
  portfolio: {
    name: 'Portfolio',
    icon: '💼',
    description: 'Portfolio tracking and management',
  },
  alerts: {
    name: 'Alerts',
    icon: '🔔',
    description: 'Price alerts and webhook notifications',
  },
  export: {
    name: 'Export',
    icon: '📦',
    description: 'Bulk data export and downloads',
  },
} as const;

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get total count of free endpoints
 */
export function getFreeEndpointCount(): number {
  return FREE_ENDPOINTS.length;
}

/**
 * Get total count of premium endpoints
 */
export function getPremiumEndpointCount(): number {
  return PREMIUM_ENDPOINTS.length;
}

/**
 * Get premium endpoints by category
 */
export function getPremiumEndpointsByCategory(
  category: PremiumEndpointInfo['category']
): PremiumEndpointInfo[] {
  return PREMIUM_ENDPOINTS.filter((e) => e.category === category);
}

/**
 * Get cheapest premium endpoint price
 */
export function getCheapestPrice(): string {
  const prices = PREMIUM_ENDPOINTS.map((e) => parseFloat(e.price.replace('$', '')));
  return `$${Math.min(...prices).toFixed(3)}`;
}

/**
 * Get most expensive premium endpoint price
 */
export function getMostExpensivePrice(): string {
  const prices = PREMIUM_ENDPOINTS.map((e) => parseFloat(e.price.replace('$', '')));
  return `$${Math.max(...prices).toFixed(2)}`;
}
