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

// Market Prices (CoinGecko → CoinCap → Binance)
export {
  marketPriceChain,
  marketPriceConsensusChain,
  createMarketPriceChain,
  type MarketPrice,
  type MarketPriceChainOptions,
} from './adapters/market-price';

// DEX Pairs (DexScreener → GeckoTerminal)
export {
  dexChain,
  createDexChain,
  type DexPair,
  type DexChainOptions,
} from './adapters/dex';

// Fear & Greed Index
export {
  fearGreedChain,
  fearGreedConsensusChain,
  createFearGreedChain,
} from './adapters/fear-greed';

// Funding Rates (Binance → Bybit → OKX)
export {
  fundingRateChain,
  fundingRateFallbackChain,
  createFundingRateChain,
} from './adapters/funding-rate';

// Gas Fees (Etherscan → Blocknative)
export {
  gasChain,
  gasConsensusChain,
  createGasChain,
} from './adapters/gas';

// TVL (DefiLlama)
export {
  tvlChain,
  createTVLChain,
} from './adapters/tvl';

// DeFi TVL + Yields (DefiLlama)
export {
  defiTvlChain,
  defiYieldsChain,
  createDefiTvlChain,
  createDefiYieldsChain,
  type ProtocolTvl,
  type YieldPool,
} from './adapters/defi';

// Derivatives — Open Interest & Liquidations (Hyperliquid → CoinGlass)
export {
  derivativesChain,
  derivativesConsensusChain,
  createDerivativesChain,
  type OpenInterest,
  type LiquidationSummary,
} from './adapters/derivatives';

// On-Chain Metrics (Blockchain.info / Mempool.space → Etherscan)
export {
  onChainChain,
  createOnChainChain,
  type OnChainMetric,
  type WhaleAlert,
  type NetworkStats,
} from './adapters/on-chain';

// Social Metrics (LunarCrush)
export {
  socialChain,
  createSocialChain,
  type SocialMetric,
} from './adapters/social';

// Stablecoin Flows (DefiLlama Stablecoins)
export {
  stablecoinFlowsChain,
  createStablecoinFlowsChain,
  type StablecoinFlow,
} from './adapters/stablecoin-flows';

// =============================================================================
// REGISTRY SETUP — Import to wire all chains into global registry
// =============================================================================

export {
  listRegisteredCategories,
  registeredCategories,
} from './setup';

// =============================================================================
// ADAPTERS — Individual provider implementations
// =============================================================================

export { coingeckoAdapter } from './adapters/market-price/coingecko.adapter';
export { coincapAdapter } from './adapters/market-price/coincap.adapter';
export { binanceAdapter } from './adapters/market-price/binance.adapter';
