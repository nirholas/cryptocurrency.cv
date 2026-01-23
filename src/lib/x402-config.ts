/**
 * x402 Configuration - Premium API Pricing & Routes
 *
 * Centralized configuration for all paid endpoints.
 * Prices are in USD, paid via USDC on Base.
 */

// USDC on Base Mainnet
export const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// USDC on Base Sepolia (testnet)
export const USDC_BASE_SEPOLIA = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';

// Payment networks supported
export const SUPPORTED_NETWORKS = {
  base: 'eip155:8453',
  baseSepolia: 'eip155:84532',
  ethereum: 'eip155:1',
  polygon: 'eip155:137',
  solana: 'solana:mainnet',
} as const;

export type NetworkId = keyof typeof SUPPORTED_NETWORKS;

/**
 * Premium API Pricing Configuration
 * Prices in USD - converted to USDC atomic units (6 decimals)
 */
export const PREMIUM_PRICING = {
  // =========================================================================
  // AI-POWERED ANALYSIS (Highest Value)
  // =========================================================================
  '/api/premium/ai/sentiment': {
    price: 0.02,
    description: 'AI-powered sentiment analysis of crypto news',
    category: 'ai',
    rateLimit: 60, // per minute
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
    features: [
      'Market overview',
      'Recent news digest',
      'Key metrics analysis',
      'Investment thesis',
    ],
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
  '/api/premium/ai/explain': {
    price: 0.01,
    description: 'AI explanation of market events and terminology',
    category: 'ai',
    rateLimit: 120,
    features: [
      'Plain English explanations',
      'Market event analysis',
      'Technical term definitions',
      'Beginner-friendly insights',
    ],
  },

  // =========================================================================
  // WHALE & SMART MONEY TRACKING (Unique Data)
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
  '/api/premium/wallets/analyze': {
    price: 0.1,
    description: 'Deep analysis of any wallet address',
    category: 'whales',
    rateLimit: 20,
    features: ['Holdings breakdown', 'Transaction history', 'PnL estimation', 'Related wallets'],
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
  // ADVANCED SCREENER & SIGNALS (Power Users)
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
  '/api/premium/breakouts': {
    price: 0.03,
    description: 'Coins breaking out of technical patterns',
    category: 'screener',
    rateLimit: 30,
    features: [
      'Pattern detection',
      'Volume confirmation',
      'Breakout strength score',
      'Historical accuracy',
    ],
  },
  '/api/premium/undervalued': {
    price: 0.03,
    description: 'Potentially undervalued coins based on fundamentals',
    category: 'screener',
    rateLimit: 30,
    features: ['Fundamental analysis', 'TVL vs market cap', 'Developer activity', 'Growth metrics'],
  },
  '/api/premium/momentum': {
    price: 0.02,
    description: 'Momentum leaders and laggards',
    category: 'screener',
    rateLimit: 60,
    features: ['Multi-timeframe momentum', 'RSI analysis', 'MACD signals', 'Volume analysis'],
  },

  // =========================================================================
  // HISTORICAL DATA (Traders/Researchers)
  // =========================================================================
  '/api/premium/history/full': {
    price: 0.05,
    description: 'Complete historical price data (5+ years)',
    category: 'data',
    rateLimit: 20,
    features: [
      'Daily/hourly/minute data',
      'OHLCV format',
      '5+ years history',
      'Adjusted for splits',
    ],
  },
  '/api/premium/correlations': {
    price: 0.03,
    description: 'Cross-asset correlation matrix',
    category: 'data',
    rateLimit: 30,
    features: ['Rolling correlations', 'Multiple timeframes', 'Crypto vs TradFi', 'Heatmap data'],
  },
  '/api/premium/backtest': {
    price: 0.1,
    description: 'Strategy backtesting data and results',
    category: 'data',
    rateLimit: 10,
    features: [
      'Historical simulation',
      'Performance metrics',
      'Drawdown analysis',
      'Risk-adjusted returns',
    ],
  },
  '/api/premium/export/full': {
    price: 0.15,
    description: 'Full database export (CSV/JSON)',
    category: 'data',
    rateLimit: 5,
    features: [
      'All coins data',
      'Multiple formats',
      'Historical included',
      'Commercial use license',
    ],
  },

  // =========================================================================
  // REAL-TIME WEBSOCKET (Algo Traders)
  // =========================================================================
  '/api/premium/ws/prices': {
    price: 0.1,
    description: '1 hour of real-time price WebSocket access',
    category: 'realtime',
    rateLimit: 5,
    duration: 3600, // 1 hour in seconds
    features: ['Sub-second updates', '1000+ coins', 'Low latency', 'Reconnection support'],
  },
  '/api/premium/ws/orderbook': {
    price: 0.2,
    description: '1 hour of live orderbook depth data',
    category: 'realtime',
    rateLimit: 3,
    duration: 3600,
    features: ['Top exchanges', 'Full depth', 'Real-time updates', 'Aggregated view'],
  },
  '/api/premium/ws/trades': {
    price: 0.15,
    description: '1 hour of live trade feed',
    category: 'realtime',
    rateLimit: 3,
    duration: 3600,
    features: ['All exchanges', 'Trade-by-trade', 'Buyer/seller info', 'Volume analysis'],
  },

  // =========================================================================
  // ALERTS & NOTIFICATIONS (Convenience)
  // =========================================================================
  '/api/premium/alerts/create': {
    price: 0.01,
    description: 'Create a premium price alert with webhooks',
    category: 'alerts',
    rateLimit: 30,
    features: ['Webhook delivery', 'Complex conditions', 'Multi-asset', '7-day duration'],
  },
  '/api/premium/alerts/bulk': {
    price: 0.05,
    description: 'Create up to 50 alerts at once',
    category: 'alerts',
    rateLimit: 5,
    features: ['Bulk creation', 'CSV import', 'Template support', 'Portfolio coverage'],
  },

  // =========================================================================
  // TIME-BASED PASSES (Power Users)
  // =========================================================================
  '/api/premium/pass/hour': {
    price: 0.25,
    description: '1 hour unlimited premium API access',
    category: 'pass',
    rateLimit: 10,
    duration: 3600,
    features: [
      'All premium endpoints',
      'No per-request fees',
      'Higher rate limits',
      'Priority support',
    ],
  },
  '/api/premium/pass/day': {
    price: 2.0,
    description: '24 hour unlimited premium API access',
    category: 'pass',
    rateLimit: 5,
    duration: 86400,
    features: [
      'All premium endpoints',
      'No per-request fees',
      'Highest rate limits',
      'Priority support',
    ],
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

/**
 * Convert USD price to USDC atomic units (6 decimals)
 */
export function usdToUsdc(usdPrice: number): string {
  return Math.round(usdPrice * 1_000_000).toString();
}

/**
 * Get x402 payment requirements for an endpoint
 */
export function getPaymentRequirements(
  endpoint: PremiumEndpoint,
  payToAddress: string,
  network: NetworkId = 'base'
) {
  const config = PREMIUM_PRICING[endpoint];
  const isTestnet = network === 'baseSepolia';

  return {
    x402Version: 2,
    accepts: [
      {
        scheme: 'exact' as const,
        network: SUPPORTED_NETWORKS[network],
        asset: isTestnet ? USDC_BASE_SEPOLIA : USDC_BASE,
        payTo: payToAddress,
        maxAmountRequired: usdToUsdc(config.price),
        resource: endpoint,
        description: config.description,
        mimeType: 'application/json',
        maxTimeoutSeconds: 60,
      },
    ],
  };
}

/**
 * Categories for organizing premium endpoints
 */
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
  data: {
    name: 'Historical Data',
    icon: 'chart',
    description: 'Deep historical data for research',
  },
  realtime: {
    name: 'Real-Time Feeds',
    icon: 'zap',
    description: 'Live WebSocket data streams',
  },
  alerts: {
    name: 'Premium Alerts',
    icon: 'bell',
    description: 'Advanced alerting with webhooks',
  },
  pass: {
    name: 'Access Passes',
    icon: 'ticket',
    description: 'Unlimited access for a time period',
  },
} as const;

/**
 * Get all endpoints in a category
 */
export function getEndpointsByCategory(category: string) {
  return Object.entries(PREMIUM_PRICING)
    .filter(([_, config]) => config.category === category)
    .map(([endpoint, config]) => ({
      endpoint,
      ...config,
    }));
}

/**
 * Get total revenue potential (for analytics)
 */
export function getPricingSummary() {
  const endpoints = Object.entries(PREMIUM_PRICING);
  const categories = [...new Set(endpoints.map(([_, c]) => c.category))];

  return {
    totalEndpoints: endpoints.length,
    categories: categories.length,
    priceRange: {
      min: Math.min(...endpoints.map(([_, c]) => c.price)),
      max: Math.max(...endpoints.map(([_, c]) => c.price)),
      avg: endpoints.reduce((sum, [_, c]) => sum + c.price, 0) / endpoints.length,
    },
    byCategory: categories.map((cat) => ({
      category: cat,
      endpoints: endpoints.filter(([_, c]) => c.category === cat).length,
      avgPrice:
        endpoints.filter(([_, c]) => c.category === cat).reduce((sum, [_, c]) => sum + c.price, 0) /
        endpoints.filter(([_, c]) => c.category === cat).length,
    })),
  };
}
