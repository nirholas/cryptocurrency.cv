/**
 * x402 Payment Protocol Integration
 *
 * SINGLE SOURCE OF TRUTH for all x402 functionality.
 * Import everything x402-related from '@/lib/x402'.
 *
 * @module lib/x402
 * @see https://docs.x402.org
 * @see https://github.com/coinbase/x402
 *
 * @example
 * ```typescript
 * // API route with hybrid auth (API key + x402)
 * import { hybridAuthMiddleware } from '@/lib/x402';
 *
 * export async function GET(request: NextRequest) {
 *   const authResult = await hybridAuthMiddleware(request, '/api/v1/coins');
 *   if (authResult) return authResult;
 *   // ... handle request
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Premium endpoint with x402 only
 * import { withX402, getRouteConfig } from '@/lib/x402';
 *
 * export const GET = withX402('/api/premium/ai/analyze', async (request) => {
 *   // ... handle request
 * });
 * ```
 */

// =============================================================================
// CONFIGURATION (from ./config.ts)
// =============================================================================
export {
  // Environment
  IS_PRODUCTION,
  IS_TESTNET,
  IS_DEVELOPMENT,
  
  // Networks
  NETWORKS,
  CURRENT_NETWORK,
  SUPPORTED_NETWORKS,
  
  // Facilitators
  FACILITATORS,
  FACILITATOR_URL,
  
  // Payment addresses
  PAYMENT_ADDRESS,
  SOLANA_PAYMENT_ADDRESS,
  
  // Token addresses
  USDC_ADDRESS,
  USDC_ADDRESSES,
  SOLANA_USDC_ADDRESSES,
  ACCEPTED_ASSETS,
  
  // Helper functions
  isX402Enabled,
  isEvmNetwork,
  isSolanaNetwork,
  getNetworkDisplayName,
  getAcceptedAssets,
  getPaymentAddress,
  getConfigSummary,
  
  // Types
  type NetworkId,
  type EvmNetworkId,
  type SolanaNetworkId,
  type FacilitatorId,
  type PaymentAsset,
} from './config';

// =============================================================================
// SERVER (from ./server.ts)
// =============================================================================
export {
  facilitatorClient,
  x402Server,
  getX402Server,
  validateConfig,
  getServerStatus,
  resetServer,
} from './server';

// =============================================================================
// PRICING (from ./pricing.ts)
// =============================================================================
export {
  // Pricing maps
  API_PRICING,
  API_TIERS,
  PREMIUM_PRICING,
  PREMIUM_CATEGORIES,
  ENDPOINT_METADATA,

  // Price format utilities
  usdToUsdc,
  usdToUsdcBigInt,
  usdStringToUsdc,
  formatPrice,
  toX402Price,

  // Price helpers
  getEndpointPrice,
  getEndpointMetadata,
  getPremiumEndpointConfig,
  getEndpointsByCategory,
  getPricingSummary,
  isPremiumEndpoint,
  isV1PricedEndpoint,
  getPremiumPricingInfo,

  // Types
  type ApiTier,
  type PricedEndpoint,
  type PremiumEndpoint,
  type EndpointMeta,
  type PremiumEndpointConfig,
  type TierConfig,
} from './pricing';

// =============================================================================
// ROUTES (from ./routes.ts)
// =============================================================================
export {
  // Route generation
  createRoutes,
  createV1Routes,
  createPremiumRoutes,
  createPrivateRoutes,
  createRoutesConfig,

  // Route utilities
  getRouteConfig,
  isPricedRoute,
  getRoutePrice,
  getProtectedRoutesForMatcher,
  isProtectedPath,
  getPriceForPath,

  // Pre-built routes
  PREMIUM_ROUTES,
  V1_ROUTES,

  // Types
  type RouteConfig,
  type Routes,
} from './routes';

// =============================================================================
// MIDDLEWARE (from ./middleware.ts)
// =============================================================================
export {
  // Core hybrid auth handler for onProtectedRequest hook
  handleProtectedRequest,
  
  // Middleware for API routes
  hybridAuthMiddleware,
  x402PremiumMiddleware,
  
  // Middleware utilities
  getPaymentMiddleware,
  withX402,
  
  // Response generators
  create402Response,
  createPaymentRequiredResponse,
  
  // Helpers
  getApiKeyRateLimitHeaders,
  getRouteConfigForEndpoint,
  
  // Constants
  PROTECTED_ROUTES,
  middlewareConfig,
  
  // Types
  type ProtectedRequestResult,
  type HybridAuthContext,
  type HybridAuthResult,
} from './middleware';

// =============================================================================
// RATE LIMITING (from ./rate-limit.ts)
// =============================================================================
export {
  checkRateLimit,
  checkTierRateLimit,
  getRateLimitHeaders,
  // Note: getTierFromApiKey removed - use validateApiKey from @/lib/api-keys instead
} from './rate-limit';

// =============================================================================
// HOOKS (from ./hooks.ts)
// =============================================================================
export {
  paymentHooks,
  setupVercelAnalytics,
  setupPostHogTracking,
  setupDiscordNotifications,
  type PaymentEvent,
  type VerifyEvent,
  type SettleEvent,
} from './hooks';

// =============================================================================
// FEATURES (from ./features.ts)
// =============================================================================
export {
  FREE_ENDPOINTS,
  PREMIUM_ENDPOINTS,
  FEATURE_COMPARISON,
  SUBSCRIPTION_TIERS,
  PAY_PER_REQUEST,
  ENDPOINT_CATEGORIES,
  getFreeEndpointCount,
  getPremiumEndpointCount,
  getPremiumEndpointsByCategory,
  getCheapestPrice,
  getMostExpensivePrice,
  type EndpointInfo,
  type PremiumEndpointInfo,
  type FeatureComparison,
  type TierInfo,
  type PayPerRequestInfo,
} from './features';

// =============================================================================
// HTTP SERVER HELPERS
// =============================================================================
export {
  httpServer,
  validateApiKeyForRequest,
  extractApiKeyFromRequest,
  validateHttpServerConfig,
} from './http-server';
