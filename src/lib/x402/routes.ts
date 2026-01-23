/**
 * x402 Route Configuration
 *
 * Defines payment requirements for each API endpoint
 * Compatible with @x402/next middleware
 */

import { PAYMENT_ADDRESS, CURRENT_NETWORK } from './config';
import { API_PRICING, ENDPOINT_METADATA, getEndpointMetadata } from './pricing';

// =============================================================================
// ROUTE CONFIGURATION TYPES
// =============================================================================

export interface RouteConfig {
  payTo: `0x${string}`;
  price: string;
  network: string;
  description?: string;
  mimeType?: string;
  resource?: string;
  outputSchema?: object;
  // Bazaar discovery
  discoverable?: boolean;
}

// =============================================================================
// ROUTE GENERATION
// =============================================================================

/**
 * Generate route configuration for x402 middleware
 *
 * @example
 * ```ts
 * import { paymentMiddleware } from '@x402/next';
 * import { createRoutes } from '@/lib/x402/routes';
 *
 * export const middleware = paymentMiddleware(createRoutes(), server);
 * ```
 */
export function createRoutes(): Record<string, RouteConfig> {
  const routes: Record<string, RouteConfig> = {};

  for (const [endpoint, price] of Object.entries(API_PRICING)) {
    const meta = getEndpointMetadata(endpoint);

    // Handle dynamic routes
    const routePattern = endpoint
      .replace('/api/v1/coin', '/api/v1/coin/:coinId')
      .replace('/api/v1/historical', '/api/v1/historical/:coinId');

    routes[`GET ${routePattern}`] = {
      payTo: PAYMENT_ADDRESS,
      price,
      network: CURRENT_NETWORK,
      description: meta.description,
      mimeType: 'application/json',
      resource: endpoint,
      outputSchema: meta.outputSchema,
      discoverable: true,
    };
  }

  return routes;
}

/**
 * Generate routes without Bazaar discovery
 * Use this if you don't want endpoints listed publicly
 */
export function createPrivateRoutes(): Record<string, RouteConfig> {
  const routes = createRoutes();

  for (const key of Object.keys(routes)) {
    routes[key].discoverable = false;
  }

  return routes;
}

/**
 * Premium API routes (higher priced, advanced features)
 */
export const PREMIUM_ROUTES = {
  'GET /api/v1/export': {
    payTo: PAYMENT_ADDRESS,
    price: '$0.01',
    network: CURRENT_NETWORK,
    description: 'Bulk data export with full historical data',
    discoverable: true,
  },
  'GET /api/v1/whale-alerts': {
    payTo: PAYMENT_ADDRESS,
    price: '$0.005',
    network: CURRENT_NETWORK,
    description: 'Real-time whale transaction alerts',
    discoverable: true,
  },
  'POST /api/v1/webhooks': {
    payTo: PAYMENT_ADDRESS,
    price: '$0.002',
    network: CURRENT_NETWORK,
    description: 'Create webhook for price alerts',
    discoverable: true,
  },
} as const;

// =============================================================================
// ROUTE MATCHING
// =============================================================================

/**
 * Check if a request path matches a priced route
 */
export function isPricedRoute(method: string, path: string): boolean {
  const normalizedPath = path.split('?')[0]; // Remove query string

  // Check exact matches
  for (const endpoint of Object.keys(API_PRICING)) {
    if (normalizedPath === endpoint || normalizedPath.startsWith(endpoint + '/')) {
      return true;
    }
  }

  return false;
}

/**
 * Get price for a request
 */
export function getRoutePrice(method: string, path: string): string | null {
  const normalizedPath = path.split('?')[0];

  // Try exact match first
  if (API_PRICING[normalizedPath as keyof typeof API_PRICING]) {
    return API_PRICING[normalizedPath as keyof typeof API_PRICING];
  }

  // Try prefix match for dynamic routes
  for (const [endpoint, price] of Object.entries(API_PRICING)) {
    if (normalizedPath.startsWith(endpoint)) {
      return price;
    }
  }

  return null;
}
