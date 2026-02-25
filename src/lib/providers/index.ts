/**
 * Provider Framework — Public API
 *
 * Production-grade multi-source data aggregation framework with:
 * - Circuit breakers (Netflix Hystrix-style)
 * - Data fusion (weighted consensus from N sources)
 * - Anomaly detection (z-score, spike, cross-source mismatch)
 * - Health monitoring with real-time metrics
 * - Observable event system
 * - Stale-while-revalidate caching
 * - Per-provider rate limiting (token bucket)
 *
 * ## Quick Start
 *
 * ```ts
 * import {
 *   marketPriceChain,
 *   registry,
 *   ProviderChain,
 * } from '@/lib/providers';
 *
 * // 1. Direct chain usage (simplest)
 * const prices = await marketPriceChain.fetch({ coinIds: ['bitcoin'] });
 *
 * // 2. Via registry (recommended for services)
 * const result = await registry.fetch('market-price', { coinIds: ['bitcoin'] });
 *
 * // 3. Custom chain (advanced)
 * const chain = new ProviderChain('my-chain', { strategy: 'consensus' });
 * chain.addProvider(myProvider);
 * ```
 *
 * ## Architecture
 *
 * ```
 * ┌──────────────────────────────────────────────────┐
 * │                  ProviderRegistry                 │
 * │  (category → chain routing, global health view)   │
 * └──────────────┬───────────────────────────────────┘
 *                │
 *  ┌─────────────▼──────────────┐
 *  │       ProviderChain        │
 *  │  ┌──────────────────────┐  │
 *  │  │  Resolution Strategy │  │
 *  │  │  fallback | race |   │  │
 *  │  │  consensus | broadcast│ │
 *  │  └──────────┬───────────┘  │
 *  │             │              │
 *  │  ┌──────────▼───────────┐  │
 *  │  │   per-provider       │  │
 *  │  │   CircuitBreaker     │  │
 *  │  │   RateLimiter        │  │
 *  │  │   HealthMonitor      │  │
 *  │  └──────────┬───────────┘  │
 *  │             │              │
 *  │  ┌──────────▼───────────┐  │
 *  │  │   DataFusionEngine   │  │
 *  │  │   AnomalyDetector    │  │
 *  │  └──────────────────────┘  │
 *  └────────────────────────────┘
 *           │ │ │
 *     ┌─────┘ │ └─────┐
 *     ▼       ▼       ▼
 *  Adapter  Adapter  Adapter
 *  (CoinGecko)(CoinCap)(Binance)
 * ```
 *
 * @module providers
 */

// =============================================================================
// CORE — Types & Interfaces
// =============================================================================

export type {
  DataProvider,
  FetchParams,
  ProviderResponse,
  DataLineage,
  CircuitBreakerConfig,
  CircuitBreakerState,
  RateLimitConfig,
  ResolutionStrategy,
  ProviderChainConfig,
  ProviderChainInstance,
  ProviderHealth,
  ChainHealth,
  AnomalyType,
  AnomalyFlag,
  AnomalyDetectorConfig,
  DataCategory,
  RegistryEntry,
  ProviderEvent,
  ProviderEventListener,
} from './types';

export {
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  DEFAULT_CHAIN_CONFIG,
  DEFAULT_ANOMALY_CONFIG,
} from './types';

// =============================================================================
// CORE — Classes
// =============================================================================

export { CircuitBreaker, CircuitOpenError } from './circuit-breaker';
export { AnomalyDetector } from './anomaly-detector';
export {
  DataFusionEngine,
  type FusionInput,
  type FusionResult,
} from './data-fusion';
export { HealthMonitor } from './health-monitor';
export { ProviderChain, AllProvidersFailedError } from './provider-chain';
export { registry, ProviderRegistry } from './registry';

// =============================================================================
// PRE-BUILT CHAINS — Ready-to-use provider chains
// =============================================================================

export {
  marketPriceChain,
  marketPriceConsensusChain,
  createMarketPriceChain,
  type MarketPrice,
  type MarketPriceChainOptions,
} from './adapters/market-price';

// =============================================================================
// ADAPTERS — Individual provider implementations
// =============================================================================

export { coingeckoAdapter } from './adapters/market-price/coingecko.adapter';
export { coincapAdapter } from './adapters/market-price/coincap.adapter';
export { binanceAdapter } from './adapters/market-price/binance.adapter';
