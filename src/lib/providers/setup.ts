/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

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
 * | liquidations    | liquidationsChain      | Binance Futures                   |
 * | on-chain        | onChainChain           | Blockchain.info → Etherscan       |
 * | social-metrics  | socialChain            | LunarCrush → Santiment → CryptoPanic |
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
import { derivativesChain, liquidationsChain } from './adapters/derivatives';
import { onChainChain, whaleAlertChain } from './adapters/on-chain';
import { socialChain } from './adapters/social';
import { stablecoinFlowsChain } from './adapters/stablecoin-flows';
import { newsChain } from './adapters/news';
import { ohlcvChain } from './adapters/ohlcv';
import { orderBookChain } from './adapters/order-book';
import { nftMarketChain } from './adapters/nft-market';
import { gamingDataChain } from './adapters/gaming-data';
import { macroChain } from './adapters/macro';
import { tokenUnlocksChain } from './adapters/token-unlocks';
import { depinChain } from './adapters/depin-data';
import { stakingDataChain } from './adapters/staking-data';
import { liquidationsChain as coinglassLiquidationsChain } from './adapters/liquidations';

// =============================================================================
// REGISTER ALL CHAINS
// =============================================================================

// Market data
registry.register('market-price', marketPriceChain, {
  description: 'Real-time crypto prices from CoinGecko, CoinCap, Binance',
});

// DEX data
registry.register('dex', dexChain, {
  description: 'DEX pair data from DexScreener and GeckoTerminal',
});

// Fear & Greed Index
registry.register('fear-greed', fearGreedChain, {
  description: 'Crypto market sentiment from Alternative.me and CoinStats',
});

// Funding Rates
registry.register('funding-rate', fundingRateChain, {
  description: 'Perpetual funding rates from Binance, Bybit, OKX',
});

// Gas Fees
registry.register('gas-fees', gasChain, {
  description: 'Ethereum gas prices from Etherscan and Blocknative',
});

// TVL
registry.register('tvl', tvlChain, {
  description: 'DeFi protocol TVL from DefiLlama',
});

// DeFi Yields
registry.register('defi-yields', defiYieldsChain, {
  description: 'Yield and APY data from DefiLlama Yields',
});

// Derivatives (Open Interest)
registry.register('derivatives', derivativesChain, {
  description: 'Open interest data from Hyperliquid, CoinGlass, Bybit, OKX, and dYdX',
});

// Liquidations
registry.register('liquidations', liquidationsChain, {
  description: 'Real-time liquidation data from Binance Futures and Hyperliquid',
});

// On-chain Metrics
registry.register('on-chain', onChainChain, {
  description: 'Bitcoin and Ethereum on-chain data from Blockchain.info, Mempool.space, Etherscan',
});

// Social Metrics
registry.register('social-metrics', socialChain, {
  description: 'Social intelligence from LunarCrush, Santiment, and CryptoPanic',
});

// Stablecoin Flows
registry.register('stablecoin-flows', stablecoinFlowsChain, {
  description: 'Stablecoin supply and chain distribution from DefiLlama',
});

// News (Aggregated crypto news)
registry.register('news-aggregate', newsChain, {
  description: 'Aggregated crypto news from CryptoPanic and NewsData.io',
});

// OHLCV (Candlestick Data)
registry.register('ohlcv', ohlcvChain, {
  description: 'Historical candlestick data from Binance and CryptoCompare',
});

// Order Book Depth
registry.register('order-book', orderBookChain, {
  description: 'Real-time order book depth from Binance and Coinbase',
});

// Whale Alerts
registry.register('whale-alerts', whaleAlertChain, {
  description: 'Large transaction alerts from Whale Alert API',
});

// NFT Market
registry.register('nft-market', nftMarketChain, {
  description: 'NFT market data from OpenSea, Reservoir, and SimpleHash',
});

// Gaming Data
registry.register('gaming-data', gamingDataChain, {
  description: 'Blockchain gaming data from DappRadar, PlayToEarn, and Footprint',
});

// Macro/TradFi Data
registry.register('macro-data', macroChain, {
  description: 'Macro economic indicators from FRED, Alpha Vantage, and Twelve Data',
});

// Token Unlocks (vesting schedules)
registry.register('token-unlocks', tokenUnlocksChain, {
  description: 'Upcoming token unlock/vesting events from DefiLlama',
});

// DePIN (Decentralized Physical Infrastructure)
registry.register('depin-data', depinChain, {
  description: 'DePIN ecosystem metrics from DePINscan — devices, revenue, growth',
});

// Staking Yields
registry.register('staking-data', stakingDataChain, {
  description: 'Staking yields and validator data from StakingRewards',
});

// CoinGlass Liquidations
registry.register('coinglass-liquidations', coinglassLiquidationsChain, {
  description: 'Aggregated liquidation data from CoinGlass (long/short breakdowns)',
});

// =============================================================================
// CONVENIENCE: Export registry for re-import
// =============================================================================

export { registry };

/** Number of registered categories */
export const registeredCategories = 23;

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
    'liquidations',
    'on-chain',
    'social-metrics',
    'stablecoin-flows',
    'news-aggregate',
    'ohlcv',
    'order-book',
    'whale-alerts',
    'nft-market',
    'gaming-data',
    'macro-data',
    'token-unlocks',
    'depin-data',
    'staking-data',
    'coinglass-liquidations',
  ] as const;
}
