/**
 * x402 Payment Protocol - Server Configuration
 *
 * Configures the x402 resource server for handling micropayments on premium API routes.
 * Uses the public facilitator at x402.org for payment verification and settlement.
 *
 * @module lib/x402-server
 * @see https://github.com/coinbase/x402
 *
 * @example
 * ```typescript
 * import { x402Server, premiumRoutes, getRouteConfig } from '@/lib/x402-server';
 *
 * // Use in middleware
 * export const middleware = paymentProxy(premiumRoutes, x402Server);
 *
 * // Use in API route
 * export const GET = withX402(handler, getRouteConfig('/api/premium/market/history'), x402Server);
 * ```
 */

import { x402ResourceServer, HTTPFacilitatorClient } from '@x402/core/server';
import { ExactEvmScheme } from '@x402/evm/exact/server';
import type { Address } from 'viem';

// ============================================================================
// Environment Configuration
// ============================================================================

/**
 * Payment receiving address (your wallet that receives USDC payments)
 * IMPORTANT: Set this to your actual wallet address in production!
 */
export const payToAddress: Address = (process.env.X402_PAY_TO_ADDRESS ||
  '0x0000000000000000000000000000000000000000') as Address;

/**
 * Facilitator URL for payment verification and settlement
 * Default: Public Coinbase facilitator
 */
export const facilitatorUrl = process.env.X402_FACILITATOR_URL || 'https://x402.org/facilitator';

/**
 * Network configuration
 * - eip155:84532 = Base Sepolia (testnet) - Use for development
 * - eip155:8453 = Base Mainnet - Use for production
 */
export const defaultNetwork = (process.env.X402_NETWORK || 'eip155:84532') as
  | 'eip155:84532'
  | 'eip155:8453'
  | 'eip155:1';

/**
 * Whether we're in testnet mode
 */
export const isTestnet = defaultNetwork === 'eip155:84532';

// ============================================================================
// Server Initialization
// ============================================================================

/**
 * HTTP client for communicating with the facilitator service
 */
const facilitatorClient = new HTTPFacilitatorClient({
  url: facilitatorUrl,
});

/**
 * x402 Resource Server instance
 * Handles payment verification and settlement for protected routes
 */
export const x402Server = new x402ResourceServer(facilitatorClient);

// Register EVM payment scheme (Base/Ethereum)
x402Server.register(defaultNetwork, new ExactEvmScheme());

// Also register mainnet if we're on testnet (for future-proofing)
if (isTestnet) {
  x402Server.register('eip155:8453', new ExactEvmScheme());
}

// ============================================================================
// Pricing Configuration
// ============================================================================

/**
 * Pricing tiers for different API features
 * All prices are in USD, settled in USDC
 */
export const pricing = {
  /** Basic premium API call */
  basic: '$0.001',
  /** Extended historical data */
  history: '$0.005',
  /** OHLC candlestick data */
  ohlc: '$0.005',
  /** Full DeFi protocol data */
  defi: '$0.002',
  /** Advanced analytics/screener */
  analytics: '$0.01',
  /** AI-powered analysis */
  ai: '$0.05',
  /** Bulk data export */
  export: '$0.10',
  /** Hourly access pass */
  hourlyPass: '$0.10',
  /** Daily access pass */
  dailyPass: '$1.00',
} as const;

// ============================================================================
// Route Configurations
// ============================================================================

/**
 * Configuration for a single premium route
 */
export interface PremiumRouteConfig {
  price: string;
  description: string;
  mimeType?: string;
  network?: string;
}

/**
 * All premium routes with their payment requirements
 */
export const premiumRoutes = {
  // Market Data - Extended
  '/api/premium/market/coins': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.basic,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Extended coin data with full metadata (500+ coins)',
    mimeType: 'application/json',
  },

  '/api/premium/market/history': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.history,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Extended historical data (5 years, hourly intervals)',
    mimeType: 'application/json',
  },

  '/api/premium/market/ohlc': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.ohlc,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Detailed OHLC candlestick data with custom intervals',
    mimeType: 'application/json',
  },

  '/api/premium/market/snapshot': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.basic,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Full coin snapshot with developer and social metrics',
    mimeType: 'application/json',
  },

  // DeFi Data - Full Access
  '/api/premium/defi/protocols': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.defi,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'All 500+ DeFi protocols with full TVL data',
    mimeType: 'application/json',
  },

  '/api/premium/defi/chains': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.defi,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'All blockchain TVL data with historical trends',
    mimeType: 'application/json',
  },

  // Analytics & Screener
  '/api/premium/analytics/screener': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.analytics,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Advanced screener with unlimited filters and sorting',
    mimeType: 'application/json',
  },

  '/api/premium/analytics/compare': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.analytics,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Multi-coin comparison with detailed metrics',
    mimeType: 'application/json',
  },

  // AI-Powered Features
  '/api/premium/ai/analyze': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.ai,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'AI-powered market analysis and insights',
    mimeType: 'application/json',
  },

  '/api/premium/ai/portfolio': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.ai,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'AI portfolio analysis with recommendations',
    mimeType: 'application/json',
  },

  // Export Features
  '/api/premium/export/portfolio': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.export,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Export portfolio data as CSV or JSON',
    mimeType: 'application/json',
  },

  '/api/premium/export/history': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.export,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Export historical price data as CSV',
    mimeType: 'text/csv',
  },

  // Alerts
  '/api/premium/alerts/custom': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.basic,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Custom price alerts with advanced conditions',
    mimeType: 'application/json',
  },

  '/api/premium/alerts/whales': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.analytics,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Whale transaction alerts and notifications',
    mimeType: 'application/json',
  },

  // API Keys
  '/api/premium/api-keys': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.basic,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Manage API keys for programmatic access',
    mimeType: 'application/json',
  },

  // Portfolio
  '/api/premium/portfolio/analytics': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.analytics,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Advanced portfolio analytics and performance metrics',
    mimeType: 'application/json',
  },

  // Streams
  '/api/premium/streams/prices': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.basic,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: 'Real-time price streaming via Server-Sent Events',
    mimeType: 'text/event-stream',
  },

  // Access Passes
  '/api/premium/pass/hour': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.hourlyPass,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: '1 hour of unlimited premium API access',
    mimeType: 'application/json',
  },

  '/api/premium/pass/day': {
    accepts: {
      scheme: 'exact' as const,
      price: pricing.dailyPass,
      network: defaultNetwork,
      payTo: payToAddress,
    },
    description: '24 hours of unlimited premium API access',
    mimeType: 'application/json',
  },
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get route configuration for a specific premium endpoint
 *
 * @param path - The API path (e.g., '/api/premium/market/history')
 * @returns Route configuration for use with withX402
 *
 * @example
 * ```typescript
 * const config = getRouteConfig('/api/premium/market/history');
 * export const GET = withX402(handler, config, x402Server);
 * ```
 */
export function getRouteConfig(path: keyof typeof premiumRoutes) {
  return premiumRoutes[path];
}

/**
 * Check if a path is a premium route
 *
 * @param path - The API path to check
 * @returns True if the path requires payment
 */
export function isPremiumRoute(path: string): boolean {
  return path.startsWith('/api/premium/');
}

/**
 * Get pricing for a specific feature
 *
 * @param feature - The feature key
 * @returns Price string (e.g., '$0.005')
 */
export function getPrice(feature: keyof typeof pricing): string {
  return pricing[feature];
}

/**
 * Get all available premium routes for documentation
 *
 * @returns Array of route information
 */
export function listPremiumRoutes() {
  return Object.entries(premiumRoutes).map(([path, config]) => ({
    path,
    price: config.accepts.price,
    description: config.description,
    mimeType: config.mimeType,
  }));
}

/**
 * Network display names for UI
 */
export const networkNames: Record<string, string> = {
  'eip155:84532': 'Base Sepolia (Testnet)',
  'eip155:8453': 'Base',
  'eip155:1': 'Ethereum',
};

/**
 * Get human-readable network name
 */
export function getNetworkName(network: string): string {
  return networkNames[network] || network;
}

/**
 * Validate server configuration
 * Call this at startup to catch configuration errors early
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (payToAddress === '0x0000000000000000000000000000000000000000') {
    errors.push('X402_PAY_TO_ADDRESS is not set. Payments will fail in production.');
  }

  if (!facilitatorUrl) {
    errors.push('X402_FACILITATOR_URL is not set. Using default facilitator.');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Log configuration status in development
if (process.env.NODE_ENV === 'development') {
  const { valid, errors } = validateConfig();
  if (!valid) {
    console.warn('[x402] Configuration warnings:');
    errors.forEach((e) => console.warn(`  - ${e}`));
  } else {
    console.log(`[x402] Server configured for ${getNetworkName(defaultNetwork)}`);
  }
}
