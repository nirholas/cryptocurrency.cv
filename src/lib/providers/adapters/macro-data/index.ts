/**
 * Macro Data Chain — Provider chain for macro/tradfi indicators
 *
 * | Provider       | Priority | Weight | Rate Limit       | Coverage                               |
 * |----------------|----------|--------|------------------|----------------------------------------|
 * | FRED           | 1        | 0.40   | 120/min (key)    | Fed funds rate, yields, CPI, DXY       |
 * | Alpha Vantage  | 2        | 0.30   | 5/min (key)      | SPY, QQQ, VIX, GLD                     |
 * | Yahoo Finance  | 3        | 0.30   | 100/min (free)   | DJI, S&P, NASDAQ, VIX, DXY, Gold, Oil  |
 *
 * Default strategy: `fallback` — try FRED first, then Alpha Vantage, then Yahoo.
 * Cache TTL: 600 s (macro data changes slowly — market hours only).
 *
 * @example
 * ```ts
 * import { macroDataChain } from '@/lib/providers/adapters/macro-data';
 *
 * const result = await macroDataChain.fetch({});
 * console.log(result.data.indicators);
 * console.log(result.lineage.provider); // 'fred'
 * ```
 *
 * @module providers/adapters/macro-data
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { MacroOverview } from './types';
import { fredAdapter } from './fred.adapter';
import { alphaVantageAdapter } from './alpha-vantage.adapter';
import { yahooFinanceAdapter } from './yahoo-finance.adapter';

export type {
  MacroOverview,
  MacroIndicator,
  CryptoMacroCorrelation,
  FedWatchData,
} from './types';

// =============================================================================
// CHAIN OPTIONS
// =============================================================================

export interface MacroDataChainOptions {
  /** Resolution strategy. Default: 'fallback' */
  strategy?: ResolutionStrategy;
  /** Cache TTL in seconds. Default: 600 (macro data is slow-moving) */
  cacheTtlSeconds?: number;
  /** Whether to serve stale cache on total failure. Default: true */
  staleWhileError?: boolean;
  /** Include FRED adapter (requires FRED_API_KEY). Default: true */
  includeFred?: boolean;
  /** Include Alpha Vantage adapter (requires ALPHA_VANTAGE_API_KEY). Default: true */
  includeAlphaVantage?: boolean;
  /** Include Yahoo Finance adapter (no key required). Default: true */
  includeYahooFinance?: boolean;
}

// =============================================================================
// FACTORY
// =============================================================================

/**
 * Create a configured macro-data provider chain.
 *
 * @param options - Override defaults (strategy, cache, provider selection)
 * @returns A ready-to-use {@link ProviderChain} for {@link MacroOverview}
 */
export function createMacroDataChain(
  options: MacroDataChainOptions = {},
): ProviderChain<MacroOverview> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 600,
    staleWhileError = true,
    includeFred = true,
    includeAlphaVantage = true,
    includeYahooFinance = true,
  } = options;

  const config: Partial<ProviderChainConfig> = {
    strategy,
    cacheTtlSeconds,
    staleWhileError,
  };

  const chain = new ProviderChain<MacroOverview>('macro-data', config);

  if (includeFred) chain.addProvider(fredAdapter);
  if (includeAlphaVantage) chain.addProvider(alphaVantageAdapter);
  if (includeYahooFinance) chain.addProvider(yahooFinanceAdapter);

  return chain;
}

// =============================================================================
// DEFAULT INSTANCE
// =============================================================================

/** Default macro-data chain with all adapters enabled */
export const macroDataChain = createMacroDataChain();
