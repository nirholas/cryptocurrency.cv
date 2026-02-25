/**
 * Market Price Chain — Pre-wired provider chain for market price data
 *
 * This module wires together all market price adapters into a ready-to-use
 * ProviderChain with the recommended configuration:
 *
 * | Provider      | Priority | Weight | Rate Limit   | Coverage     |
 * |---------------|----------|--------|--------------|--------------|
 * | CoinGecko     | 1        | 0.40   | 30/min (free)| 13,000+ coins|
 * | CoinCap       | 2        | 0.25   | 200/min      | 2,000+ coins |
 * | Binance       | 3        | 0.30   | 1200/min     | ~600 pairs   |
 *
 * Default strategy: `fallback` (try CoinGecko first, fall back through others)
 *
 * For price-critical paths, use `consensus` strategy to fuse data from
 * multiple exchanges and get the highest-confidence result.
 *
 * @example
 * ```ts
 * import { marketPriceChain } from '@/lib/providers/adapters/market-price';
 *
 * // Simple fetch — uses fallback strategy by default
 * const result = await marketPriceChain.fetch({ coinIds: ['bitcoin', 'ethereum'] });
 * console.log(result.data);              // MarketPrice[]
 * console.log(result.lineage.provider);  // 'coingecko'
 * console.log(result.lineage.confidence);// 0.95
 *
 * // Get chain health
 * const health = marketPriceChain.health();
 * console.log(health.status);    // 'healthy' | 'degraded' | 'critical'
 * console.log(health.providers); // per-provider health breakdown
 * ```
 *
 * @example
 * ```ts
 * // Create a separate consensus chain for high-value use cases
 * import { createMarketPriceChain } from '@/lib/providers/adapters/market-price';
 *
 * const consensusChain = createMarketPriceChain({
 *   strategy: 'consensus',
 *   cacheTtlSeconds: 15,
 * });
 *
 * const result = await consensusChain.fetch({ coinIds: ['bitcoin'] });
 * // result.lineage.contributors → ['coingecko', 'coincap', 'binance']
 * // result.lineage.confidence → 0.98 (high agreement between sources)
 * ```
 *
 * @module providers/adapters/market-price
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { MarketPrice } from './coingecko.adapter';
import { coingeckoAdapter } from './coingecko.adapter';
import { coincapAdapter } from './coincap.adapter';
import { binanceAdapter } from './binance.adapter';
import { coinmarketcapAdapter } from './coinmarketcap.adapter';
import { coinpaprikaAdapter } from './coinpaprika.adapter';
import { cryptocompareAdapter } from './cryptocompare.adapter';
import { coinbaseAdapter } from './coinbase.adapter';
import { krakenAdapter } from './kraken.adapter';
import { kucoinAdapter } from './kucoin.adapter';
import { mexcAdapter } from './mexc.adapter';
import { geminiAdapter } from './gemini.adapter';
import { gateioAdapter } from './gate-io.adapter';
import { messariAdapter } from './messari.adapter';

// =============================================================================
// TYPES
// =============================================================================

export type { MarketPrice } from './coingecko.adapter';

export interface MarketPriceChainOptions {
  /** Resolution strategy. Default: 'fallback' */
  strategy?: ResolutionStrategy;
  /** Cache TTL in seconds. Default: 30 */
  cacheTtlSeconds?: number;
  /** Whether to serve stale cache on total failure. Default: true */
  staleWhileError?: boolean;
  /** Maximum deviation between providers before flagging anomaly. Default: 0.03 (3%) */
  maxDeviation?: number;
  /** Whether to include Binance adapter. Default: true */
  includeBinance?: boolean;
  /** Whether to include CoinCap adapter. Default: true */
  includeCoinCap?: boolean;
  /** Whether to include CoinMarketCap adapter (requires API key). Default: true */
  includeCoinMarketCap?: boolean;
  /** Whether to include CoinPaprika adapter. Default: true */
  includeCoinPaprika?: boolean;
  /** Whether to include CryptoCompare adapter. Default: true */
  includeCryptoCompare?: boolean;
  /** Whether to include Coinbase adapter. Default: true */
  includeCoinbase?: boolean;
  /** Whether to include Kraken adapter. Default: true */
  includeKraken?: boolean;
  /** Whether to include KuCoin adapter. Default: true */
  includeKuCoin?: boolean;
  /** Whether to include MEXC adapter. Default: true */
  includeMEXC?: boolean;
  /** Whether to include Gemini adapter. Default: true */
  includeGemini?: boolean;
  /** Whether to include Gate.io adapter. Default: true */
  includeGateIO?: boolean;
  /** Whether to include Messari adapter. Default: true */
  includeMessari?: boolean;
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a new ProviderChain for market prices with custom configuration.
 *
 * Use this when you need a chain with different settings from the default,
 * e.g., consensus mode for critical pricing, or a faster cache for dashboards.
 */
export function createMarketPriceChain(
  options: MarketPriceChainOptions = {},
): ProviderChain<MarketPrice[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 30,
    staleWhileError = true,
    maxDeviation = 0.03,
    includeBinance = true,
    includeCoinCap = true,
    includeCoinMarketCap = true,
    includeCoinPaprika = true,
    includeCryptoCompare = true,
    includeCoinbase = true,
    includeKraken = true,
    includeKuCoin = true,
    includeMEXC = true,
    includeGemini = true,
    includeGateIO = true,
    includeMessari = true,
  } = options;

  const config: Partial<ProviderChainConfig> = {
    strategy,
    cacheTtlSeconds,
    staleWhileError,
    maxDeviation,
  };

  const chain = new ProviderChain<MarketPrice[]>('market-prices', config);

  // Register adapters in priority order
  chain.addProvider(coingeckoAdapter);

  if (includeCoinMarketCap) {
    chain.addProvider(coinmarketcapAdapter);
  }

  if (includeCoinCap) {
    chain.addProvider(coincapAdapter);
  }

  if (includeBinance) {
    chain.addProvider(binanceAdapter);
  }

  if (includeCoinPaprika) {
    chain.addProvider(coinpaprikaAdapter);
  }

  if (includeCryptoCompare) {
    chain.addProvider(cryptocompareAdapter);
  }

  if (includeCoinbase) {
    chain.addProvider(coinbaseAdapter);
  }

  if (includeKraken) {
    chain.addProvider(krakenAdapter);
  }

  if (includeKuCoin) {
    chain.addProvider(kucoinAdapter);
  }

  if (includeMEXC) {
    chain.addProvider(mexcAdapter);
  }

  if (includeGemini) {
    chain.addProvider(geminiAdapter);
  }

  if (includeGateIO) {
    chain.addProvider(gateioAdapter);
  }

  if (includeMessari) {
    chain.addProvider(messariAdapter);
  }

  return chain;
}

// =============================================================================
// DEFAULT INSTANCE — Singleton for common use
// =============================================================================

/**
 * Default market price chain.
 *
 * Uses fallback strategy with 30s cache. This is the recommended way
 * to fetch market prices throughout the application.
 */
export const marketPriceChain = createMarketPriceChain();

// =============================================================================
// CONVENIENCE — Pre-configured consensus chain
// =============================================================================

/**
 * Market price chain configured for consensus strategy.
 *
 * Fetches from all providers and fuses results using weighted median.
 * Higher confidence but higher latency. Use for:
 * - Price oracle / settlement calculations
 * - Display of "verified" prices
 * - Anomaly detection dashboards
 */
export const marketPriceConsensusChain = createMarketPriceChain({
  strategy: 'consensus',
  cacheTtlSeconds: 15,
  maxDeviation: 0.02,
});
