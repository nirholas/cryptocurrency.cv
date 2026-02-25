/**
 * Provider Registry Setup — Wires all provider chains into the global registry
 *
 * Import this module once at app startup (e.g., in _app.ts, layout.tsx, or
 * middleware.ts) to make all data categories accessible via the registry:
 *
 * ```ts
 * import '@/lib/providers/setup';
 * import { registry } from '@/lib/providers';
 *
 * const prices = await registry.fetch('market-price', { coinIds: ['bitcoin'] });
 * const tvl    = await registry.fetch('tvl', { limit: 10 });
 * const social = await registry.fetch('social-metrics', { limit: 50 });
 * ```
 *
 * ## Registered Categories
 *
 * | Category         | Chain                  | Providers                         |
 * |-----------------|------------------------|-----------------------------------|
 * | market-price    | marketPriceChain       | CoinGecko → CoinCap → Binance    |
 * | dex             | dexChain               | DexScreener → GeckoTerminal       |
 * | fear-greed      | fearGreedChain         | Alternative.me → CoinStats        |
 * | funding-rate    | fundingRateChain       | Binance → Bybit → OKX            |
 * | gas-fees        | gasChain               | Etherscan → Blocknative           |
 * | tvl             | tvlChain               | DefiLlama                        |
 * | defi-yields     | defiYieldsChain        | DefiLlama Yields                  |
 * | derivatives     | derivativesChain       | Hyperliquid → CoinGlass           |
 * | on-chain        | onChainChain           | Blockchain.info → Etherscan       |
 * | social-metrics  | socialChain            | LunarCrush                        |
 * | stablecoin-flows| stablecoinFlowsChain   | DefiLlama Stablecoins            |
 *
 * @module providers/setup
 */

import { registry } from './registry';

// Pre-built chains
import { marketPriceChain } from './adapters/market-price';
import { dexChain } from './adapters/dex';
import { fearGreedChain } from './adapters/fear-greed';
import { fundingRateChain } from './adapters/funding-rate';
import { gasChain } from './adapters/gas';
import { tvlChain } from './adapters/tvl';
import { defiYieldsChain } from './adapters/defi';
import { derivativesChain } from './adapters/derivatives';
import { onChainChain } from './adapters/on-chain';
import { socialChain } from './adapters/social';
import { stablecoinFlowsChain } from './adapters/stablecoin-flows';

// =============================================================================
// REGISTER ALL CHAINS
// =============================================================================

// Market data
registry.register('market-price', {
  category: 'market-price',
  name: 'Market Prices',
  description: 'Real-time crypto prices from CoinGecko, CoinCap, Binance',
  chain: marketPriceChain,
});

// DEX data
registry.register('dex', {
  category: 'dex',
  name: 'DEX Pairs',
  description: 'DEX pair data from DexScreener and GeckoTerminal',
  chain: dexChain,
});

// Fear & Greed Index
registry.register('fear-greed', {
  category: 'fear-greed',
  name: 'Fear & Greed Index',
  description: 'Crypto market sentiment from Alternative.me and CoinStats',
  chain: fearGreedChain,
});

// Funding Rates
registry.register('funding-rate', {
  category: 'funding-rate',
  name: 'Funding Rates',
  description: 'Perpetual funding rates from Binance, Bybit, OKX',
  chain: fundingRateChain,
});

// Gas Fees
registry.register('gas-fees', {
  category: 'gas-fees',
  name: 'Gas Fees',
  description: 'Ethereum gas prices from Etherscan and Blocknative',
  chain: gasChain,
});

// TVL
registry.register('tvl', {
  category: 'tvl',
  name: 'Total Value Locked',
  description: 'DeFi protocol TVL from DefiLlama',
  chain: tvlChain,
});

// DeFi Yields
registry.register('defi-yields', {
  category: 'defi-yields',
  name: 'DeFi Yields',
  description: 'Yield and APY data from DefiLlama Yields',
  chain: defiYieldsChain,
});

// Derivatives (Open Interest, Liquidations)
registry.register('derivatives', {
  category: 'derivatives',
  name: 'Derivatives',
  description: 'Open interest and liquidation data from Hyperliquid and CoinGlass',
  chain: derivativesChain,
});

// On-chain Metrics
registry.register('on-chain', {
  category: 'on-chain',
  name: 'On-Chain Metrics',
  description: 'Bitcoin and Ethereum on-chain data from Blockchain.info, Mempool.space, Etherscan',
  chain: onChainChain,
});

// Social Metrics
registry.register('social-metrics', {
  category: 'social-metrics',
  name: 'Social Metrics',
  description: 'Social intelligence from LunarCrush (Galaxy Score, sentiment, social volume)',
  chain: socialChain,
});

// Stablecoin Flows
registry.register('stablecoin-flows', {
  category: 'stablecoin-flows',
  name: 'Stablecoin Flows',
  description: 'Stablecoin supply and chain distribution from DefiLlama',
  chain: stablecoinFlowsChain,
});

// =============================================================================
// CONVENIENCE: Export registry for re-import
// =============================================================================

export { registry };

/** Number of registered categories */
export const registeredCategories = 11;

/** List all registered categories */
export function listRegisteredCategories() {
  return [
    'market-price',
    'dex',
    'fear-greed',
    'funding-rate',
    'gas-fees',
    'tvl',
    'defi-yields',
    'derivatives',
    'on-chain',
    'social-metrics',
    'stablecoin-flows',
  ] as const;
}
