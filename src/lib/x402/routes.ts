/**
 * x402 Route Configuration
 *
 * Generates route configuration for x402 middleware from pricing.
 * Compatible with @x402/next paymentProxy, withX402, and x402HTTPResourceServer.
 *
 * @module lib/x402/routes
 * @see https://docs.x402.org/extensions/bazaar
 * @see https://github.com/coinbase/x402
 */

import type { RoutesConfig } from '@x402/core/server';
import { PAYMENT_ADDRESS, CURRENT_NETWORK, NETWORKS, IS_PRODUCTION } from './config';
import {
  API_PRICING,
  PREMIUM_PRICING,
  ENDPOINT_METADATA,
  getEndpointMetadata,
  toX402Price,
  type PricedEndpoint,
  type PremiumEndpoint,
} from './pricing';

// =============================================================================
// ROUTE CONFIGURATION TYPES
// =============================================================================

/**
 * Simple route configuration (for internal use)
 */
export interface RouteConfig {
  /** Payment recipient address */
  payTo: `0x${string}`;
  /** Price in x402 format ("$0.001") */
  price: string;
  /** Network in CAIP-2 format */
  network: string;
  /** Human-readable description */
  description?: string;
  /** Response MIME type */
  mimeType?: string;
  /** Resource identifier */
  resource?: string;
  /** OpenAPI-style output schema for AI agents */
  outputSchema?: object;
  /** Whether to list in Bazaar discovery */
  discoverable?: boolean;
}

export type Routes = Record<string, RouteConfig>;

/**
 * Payment accepts configuration for x402 SDK (multi-chain support)
 */
interface PaymentAccepts {
  scheme: 'exact';
  network: string;
  payTo: string;
  price: string;
  maxTimeoutSeconds?: number;
}

/**
 * Route configuration following x402 SDK specification
 */
interface X402RouteConfig {
  accepts: PaymentAccepts | PaymentAccepts[];
  description?: string;
  mimeType?: string;
  extensions?: Record<string, unknown>;
}

// =============================================================================
// PAYMENT ACCEPTS GENERATION (Multi-Chain Support)
// =============================================================================

/**
 * Generate payment accepts for a price with multi-chain support
 *
 * In production: Accept both mainnet and testnet for developer testing
 * In development: Accept both testnet and mainnet for production testing
 */
function generateAccepts(price: string): PaymentAccepts[] {
  const accepts: PaymentAccepts[] = [];

  // Add current network
  accepts.push({
    scheme: 'exact',
    network: CURRENT_NETWORK,
    payTo: PAYMENT_ADDRESS,
    price,
    maxTimeoutSeconds: 300, // 5 minutes
  });

  // Add alternate network for flexibility
  if (IS_PRODUCTION) {
    // Production: primarily mainnet, also accept testnet for developer testing
    if (CURRENT_NETWORK !== NETWORKS.BASE_SEPOLIA) {
      accepts.push({
        scheme: 'exact',
        network: NETWORKS.BASE_SEPOLIA,
        payTo: PAYMENT_ADDRESS,
        price,
        maxTimeoutSeconds: 300,
      });
    }
  } else {
    // Development: primarily testnet, also show mainnet for production testing
    if (CURRENT_NETWORK !== NETWORKS.BASE_MAINNET) {
      accepts.push({
        scheme: 'exact',
        network: NETWORKS.BASE_MAINNET,
        payTo: PAYMENT_ADDRESS,
        price,
        maxTimeoutSeconds: 300,
      });
    }
  }

  return accepts;
}

// =============================================================================
// BAZAAR DISCOVERY EXTENSIONS
// =============================================================================

/**
 * Generate Bazaar discovery extension for an endpoint
 *
 * Bazaar is x402's resource discovery protocol that allows AI agents
 * to discover and understand available API endpoints.
 *
 * @see https://github.com/coinbase/x402/tree/main/typescript/packages/extensions
 */
function generateBazaarExtension(endpoint: string): Record<string, unknown> | undefined {
  const meta = getEndpointMetadata(endpoint);

  if (!meta.outputSchema) {
    return undefined;
  }

  return {
    bazaar: {
      input: meta.parameters
        ? {
            schema: {
              type: 'object',
              properties: Object.fromEntries(
                Object.entries(meta.parameters).map(([key, param]) => [
                  key,
                  { type: param.type, description: param.description },
                ])
              ),
              required: Object.entries(meta.parameters)
                .filter(([, param]) => param.required)
                .map(([key]) => key),
            },
          }
        : undefined,
      output: {
        schema: meta.outputSchema,
      },
    },
  };
}

// =============================================================================
// ROUTE PATTERN UTILITIES
// =============================================================================

/**
 * Convert endpoint path to route pattern with parameters
 *
 * @example
 * convertToRoutePattern("/api/v1/coin") → "/api/v1/coin/:coinId"
 * convertToRoutePattern("/api/v1/historical") → "/api/v1/historical/:coinId"
 */
function convertToRoutePattern(endpoint: string): string {
  return endpoint
    .replace(/^\/api\/v1\/coin$/, '/api/v1/coin/:coinId')
    .replace(/^\/api\/v1\/historical$/, '/api/v1/historical/:coinId')
    .replace(/^\/api\/premium\/wallets\/analyze$/, '/api/premium/wallets/analyze/:address');
}

/**
 * Convert endpoint to x402 SDK wildcard pattern
 *
 * @example
 * convertToWildcardPattern("/api/v1/coin") → "/api/v1/coin/*"
 */
function convertToWildcardPattern(endpoint: string): string {
  const dynamicEndpoints = ['/api/v1/coin', '/api/v1/historical', '/api/v1/assets'];

  for (const dynamic of dynamicEndpoints) {
    if (endpoint === dynamic) {
      return `${endpoint}/*`;
    }
  }

  return endpoint;
}

/**
 * Check if endpoint should support POST method
 */
function shouldSupportPost(endpoint: string): boolean {
  const postEndpoints = [
    '/api/v1/webhooks',
    '/api/v1/alerts',
    '/api/v1/portfolio',
    '/api/v1/export',
    '/api/premium/alerts/create',
    '/api/premium/alerts/custom',
    '/api/premium/alerts/bulk',
  ];
  return postEndpoints.includes(endpoint);
}

// =============================================================================
// SIMPLE ROUTE GENERATION
// =============================================================================

/**
 * Generate all v1 API routes for x402 middleware
 */
export function createV1Routes(): Routes {
  const routes: Routes = {};

  for (const [endpoint, price] of Object.entries(API_PRICING)) {
    const meta = getEndpointMetadata(endpoint);
    const routePattern = convertToRoutePattern(endpoint);

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

    // Add POST for endpoints that support it
    if (shouldSupportPost(endpoint)) {
      routes[`POST ${routePattern}`] = {
        payTo: PAYMENT_ADDRESS,
        price,
        network: CURRENT_NETWORK,
        description: meta.description,
        mimeType: 'application/json',
        resource: endpoint,
        discoverable: true,
      };
    }
  }

  return routes;
}

/**
 * Generate premium API routes for x402 middleware
 */
export function createPremiumRoutes(): Routes {
  const routes: Routes = {};

  for (const [endpoint, config] of Object.entries(PREMIUM_PRICING)) {
    const routePattern = convertToRoutePattern(endpoint);
    const x402Price = toX402Price(config.price);

    routes[`GET ${routePattern}`] = {
      payTo: PAYMENT_ADDRESS,
      price: x402Price,
      network: CURRENT_NETWORK,
      description: config.description,
      mimeType: 'application/json',
      resource: endpoint,
      discoverable: true,
    };

    // Add POST for endpoints that support it
    if (shouldSupportPost(endpoint)) {
      routes[`POST ${routePattern}`] = {
        payTo: PAYMENT_ADDRESS,
        price: x402Price,
        network: CURRENT_NETWORK,
        description: config.description,
        mimeType: 'application/json',
        resource: endpoint,
        discoverable: true,
      };
    }
  }

  return routes;
}

/**
 * Generate all routes (v1 + premium) for x402 middleware
 */
export function createRoutes(): Routes {
  return {
    ...createV1Routes(),
    ...createPremiumRoutes(),
  };
}

/**
 * Generate routes without Bazaar discovery
 * Use this if you don't want endpoints listed publicly
 */
export function createPrivateRoutes(): Routes {
  const routes = createRoutes();

  for (const key of Object.keys(routes)) {
    routes[key].discoverable = false;
  }

  return routes;
}

// =============================================================================
// X402 SDK ROUTES CONFIG (for x402HTTPResourceServer)
// =============================================================================

/**
 * Create routes configuration for x402HTTPResourceServer
 *
 * This generates the official RoutesConfig format with:
 * - Multi-chain payment accepts
 * - Bazaar discovery extensions
 * - Proper x402 SDK types
 *
 * @example
 * ```typescript
 * import { x402HTTPResourceServer } from '@x402/core/server';
 * import { createRoutesConfig } from '@/lib/x402/routes';
 *
 * const httpServer = new x402HTTPResourceServer(x402Server, createRoutesConfig());
 * ```
 */
export function createRoutesConfig(): RoutesConfig {
  const routes: Record<string, X402RouteConfig> = {};

  // Add v1 API routes
  for (const [endpoint, price] of Object.entries(API_PRICING)) {
    const meta = getEndpointMetadata(endpoint);
    const routePattern = convertToWildcardPattern(endpoint);

    const config: X402RouteConfig = {
      accepts: generateAccepts(price),
      description: meta.description,
      mimeType: 'application/json',
    };

    // Add Bazaar discovery extension if available
    const bazaarExt = generateBazaarExtension(endpoint);
    if (bazaarExt) {
      config.extensions = bazaarExt;
    }

    routes[`GET ${routePattern}`] = config;

    if (shouldSupportPost(endpoint)) {
      routes[`POST ${routePattern}`] = config;
    }
  }

  // Add premium API routes
  for (const [endpoint, pricingConfig] of Object.entries(PREMIUM_PRICING)) {
    const routePattern = convertToWildcardPattern(endpoint);
    const x402Price = toX402Price(pricingConfig.price);

    const config: X402RouteConfig = {
      accepts: generateAccepts(x402Price),
      description: pricingConfig.description,
      mimeType: 'application/json',
    };

    routes[`GET ${routePattern}`] = config;

    if (shouldSupportPost(endpoint)) {
      routes[`POST ${routePattern}`] = config;
    }
  }

  return routes as RoutesConfig;
}

// =============================================================================
// ROUTE MATCHING UTILITIES
// =============================================================================

/**
 * Check if a request path matches a priced route
 */
export function isPricedRoute(method: string, path: string): boolean {
  const normalizedPath = path.split('?')[0]; // Remove query string

  // Check v1 pricing
  for (const endpoint of Object.keys(API_PRICING)) {
    if (normalizedPath === endpoint || normalizedPath.startsWith(endpoint + '/')) {
      return true;
    }
  }

  // Check premium pricing
  for (const endpoint of Object.keys(PREMIUM_PRICING)) {
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

  // Try exact match in v1
  if (normalizedPath in API_PRICING) {
    return API_PRICING[normalizedPath as PricedEndpoint];
  }

  // Try exact match in premium
  if (normalizedPath in PREMIUM_PRICING) {
    return toX402Price(PREMIUM_PRICING[normalizedPath as PremiumEndpoint].price);
  }

  // Try prefix match in v1
  for (const [endpoint, price] of Object.entries(API_PRICING)) {
    if (normalizedPath.startsWith(endpoint + '/')) {
      return price;
    }
  }

  // Try prefix match in premium
  for (const [endpoint, config] of Object.entries(PREMIUM_PRICING)) {
    if (normalizedPath.startsWith(endpoint + '/')) {
      return toX402Price(config.price);
    }
  }

  return null;
}

/**
 * Get route configuration for a specific endpoint
 */
export function getRouteConfig(endpoint: string): RouteConfig | null {
  const routes = createRoutes();

  // Try exact match first
  const getRoute = routes[`GET ${endpoint}`];
  if (getRoute) return getRoute;

  // Try with route patterns
  for (const [pattern, config] of Object.entries(routes)) {
    const pathPattern = pattern.replace('GET ', '').replace('POST ', '');
    if (matchesPattern(endpoint, pathPattern)) {
      return config;
    }
  }

  return null;
}

/**
 * Check if a path matches a route pattern
 */
function matchesPattern(path: string, pattern: string): boolean {
  const pathParts = path.split('/');
  const patternParts = pattern.split('/');

  if (pathParts.length !== patternParts.length) {
    // Check if pattern is prefix
    return path.startsWith(pattern.replace(/:\w+/g, ''));
  }

  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) continue; // Dynamic segment
    if (patternParts[i] !== pathParts[i]) return false;
  }

  return true;
}

/**
 * Get all protected route patterns for Next.js middleware matcher
 */
export function getProtectedRoutesForMatcher(): string[] {
  const routes = [
    ...Object.keys(API_PRICING).map((endpoint) => `${endpoint}/:path*`),
    ...Object.keys(PREMIUM_PRICING).map((endpoint) => `${endpoint}/:path*`),
  ];

  // Add explicit patterns for dynamic routes
  routes.push('/api/v1/coin/:coinId');
  routes.push('/api/v1/historical/:coinId');
  routes.push('/api/premium/wallets/analyze/:address');

  // Deduplicate
  return [...new Set(routes)];
}

/**
 * Check if a path requires payment
 */
export function isProtectedPath(path: string): boolean {
  return isPricedRoute('GET', path);
}

/**
 * Get price for a specific path
 */
export function getPriceForPath(path: string): string | null {
  return getRoutePrice('GET', path);
}

// =============================================================================
// LEGACY EXPORTS FOR BACKWARD COMPATIBILITY
// =============================================================================

/**
 * Pre-built v1 routes
 * @deprecated Use createV1Routes() instead
 */
export const V1_ROUTES = createV1Routes();

/**
 * Pre-built premium routes
 * @deprecated Use createPremiumRoutes() instead
 */
export const PREMIUM_ROUTES = createPremiumRoutes();
