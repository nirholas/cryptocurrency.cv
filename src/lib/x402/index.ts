/**
 * x402 Payment Protocol Integration
 *
 * Official x402 implementation for Crypto Data Aggregator API
 * Enables micropayments via USDC on Base using the HTTP 402 protocol
 *
 * @see https://docs.x402.org
 * @see https://github.com/coinbase/x402
 *
 * @example
 * ```ts
 * // In your API route
 * import { createRoutes, x402Server } from '@/lib/x402';
 * import { paymentMiddleware } from '@x402/next';
 *
 * export const middleware = paymentMiddleware(createRoutes(), x402Server);
 * ```
 */

// Configuration
export {
  NETWORKS,
  CURRENT_NETWORK,
  FACILITATORS,
  FACILITATOR_URL,
  PAYMENT_ADDRESS,
  USDC_ADDRESS,
  USDC_ADDRESSES,
  SUPPORTED_NETWORKS,
  ACCEPTED_ASSETS,
  SOLANA_PAYMENT_ADDRESS,
  SOLANA_USDC_ADDRESSES,
  IS_PRODUCTION,
  IS_TESTNET,
  getAcceptedAssets,
  getPaymentAddress,
  isEvmNetwork,
  isSolanaNetwork,
  getNetworkDisplayName,
  type NetworkId,
  type PaymentAsset,
} from './config';

// Pricing
export {
  API_PRICING,
  API_TIERS,
  ENDPOINT_METADATA,
  getEndpointPrice,
  getEndpointMetadata,
  type PricedEndpoint,
  type ApiTier,
  type TierConfig,
  type EndpointMeta,
} from './pricing';

// Routes
export {
  createRoutes,
  createPrivateRoutes,
  PREMIUM_ROUTES,
  isPricedRoute,
  getRoutePrice,
  type RouteConfig,
} from './routes';

// Server
export {
  x402Server,
  facilitatorClient,
  isServerConfigured,
  getServerStatus,
  validateConfig,
  type ConfigValidation,
} from './server';

// Rate Limiting
export {
  checkRateLimit,
  checkTierRateLimit,
  getTierFromApiKey,
  getUsage,
  resetRateLimit,
  isValidApiKeyFormat,
  generateDemoApiKey,
  type RateLimitResult,
} from './rate-limit';

// Middleware
export {
  getPaymentMiddleware,
  hybridAuthMiddleware,
  create402Response,
  middlewareConfig,
  PROTECTED_ROUTES,
} from './middleware';

// Features (for pricing page, developer portal, etc.)
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

// Lifecycle Hooks (analytics, monitoring)
export {
  paymentHooks,
  setupVercelAnalytics,
  setupPostHogTracking,
  setupDiscordNotifications,
  type PaymentEvent,
  type VerifyEvent,
  type SettleEvent,
} from './hooks';
