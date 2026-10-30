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
 * Unified API Exports
 * 
 * Central export point for all NEW external API integrations.
 * Legacy APIs remain in /src/lib/ directory.
 * 
 * Using namespaced imports to avoid naming conflicts between modules.
 * 
 * Usage:
 *   import { coinmarketcap, defillama, glassnode } from '@/lib/apis';
 *   const data = await coinmarketcap.getMarketSummary();
 * 
 * @module lib/apis
 */

// =============================================================================
// Namespaced Exports (avoid naming conflicts between modules)
// =============================================================================

// Market Data - CoinMarketCap ($29-299/mo)
import * as coinmarketcap from './coinmarketcap';
export { coinmarketcap };

// DeFi TVL & Yields - DefiLlama (Free)
import * as defillama from './defillama';
export { defillama };

// DeFi Subgraphs - The Graph (Pay per query)
import * as thegraph from './thegraph';
export { thegraph };

// On-Chain Analytics - Glassnode ($29-799/mo)
import * as glassnode from './glassnode';
export { glassnode };

// Exchange Flows - CryptoQuant ($49/mo)
import * as cryptoquant from './cryptoquant';
export { cryptoquant };

// Layer 2 Analytics - L2Beat (Free)
import * as l2beat from './l2beat';
export { l2beat };

// Chain Fees - growthepie (Free)
import * as growthepie from './growthepie';
export { growthepie };

// Social Intelligence - LunarCrush ($99/mo)
import * as lunarcrush from './lunarcrush';
export { lunarcrush };

// Research Data - Messari (Free tier available)
import * as messari from './messari';
export { messari };

// NFT Markets - OpenSea & Reservoir (Free tiers)
import * as nftMarkets from './nft-markets';
export { nftMarkets };

// News & Regulatory - CryptoPanic & NewsAPI (Free tiers)
import * as newsFeeds from './news-feeds';
export { newsFeeds };

// DEX Pool Analytics - GeckoTerminal (Free, by CoinGecko)
import * as geckoterminal from './geckoterminal';
export { geckoterminal };

// Derivatives / Liquidations - CoinGlass (Free tier available)
import * as coinglass from './coinglass';
export { coinglass };

// Solana & Multi-Chain DeFi - Birdeye (Free tier available)
import * as birdeye from './birdeye';
export { birdeye };

// Protocol Revenue & Earnings - Token Terminal (Free tier available)
import * as tokenterminal from './tokenterminal';
export { tokenterminal };

// SQL On-Chain Analytics - Dune Analytics (Free tier available)
import * as dune from './dune';
export { dune };

// Comprehensive Market Data - CryptoCompare (Free: 100K calls/mo)
import * as cryptocompare from './cryptocompare';
export { cryptocompare };

// Solana Deep Data - Helius (Free tier: 100k req/day)
import * as helius from './helius';
export { helius };

// Solana DeFi & Parsing - Shyft (Free tier: 1M calls/mo)
import * as shyft from './shyft';
export { shyft };

// Sui L1 Blockchain - Public RPC (Free, no key required)
import * as sui from './sui';
export { sui };

// Aptos L1 Blockchain - Public REST API (Free, no key required)
import * as aptos from './aptos';
export { aptos };

// On-Chain Intelligence - Arkham Intelligence (Paid)
import * as arkham from './arkham';
export { arkham };

// Smart Money Analytics - Nansen (Paid)
import * as nansen from './nansen';
export { nansen };

// DEX Aggregation & Prices - 1inch (Paid)
import * as oneinch from './oneinch';
export { oneinch };

// Cross-Chain Bridges - DefiLlama Bridges (Free)
import * as bridges from './bridges';
export { bridges };

// DEX Volumes - DefiLlama DEXs (Free)
import * as dexes from './dexes';
export { dexes };

// Token Unlocks - Token Unlocks API (requires TOKEN_UNLOCKS_API_KEY)
import * as tokenunlocks from './tokenunlocks';
export { tokenunlocks };

// Ethereum Validators - Rated Network (Free)
import * as rated from './rated';
export { rated };

// =============================================================================
// API Configuration & Status
// =============================================================================

export const API_STATUS = {
  // Free APIs
  defillama: { status: 'free', rateLimit: 'generous', cost: '$0' },
  l2beat: { status: 'free', rateLimit: 'moderate', cost: '$0' },
  growthepie: { status: 'free', rateLimit: 'moderate', cost: '$0' },
  geckoterminal: { status: 'free', rateLimit: '30 calls/min', cost: '$0' },
  
  // Free tier available
  messari: { status: 'freemium', rateLimit: '20 calls/min', cost: '$0-$250/mo' },
  nftMarkets: { status: 'freemium', rateLimit: '120 calls/min', cost: '$0' },
  newsFeeds: { status: 'freemium', rateLimit: '100 calls/day', cost: '$0' },
  coinglass: { status: 'freemium', rateLimit: '100 calls/day', cost: '$0-$49/mo' },
  birdeye: { status: 'freemium', rateLimit: '100 calls/min', cost: '$0-$49/mo' },
  tokenterminal: { status: 'freemium', rateLimit: '5 calls/min', cost: '$0-$325/mo' },
  dune: { status: 'freemium', rateLimit: '2500 credits/mo', cost: '$0-$349/mo' },
  bridges: { status: 'free', rateLimit: 'generous', cost: '$0' },
  dexes: { status: 'free', rateLimit: 'generous', cost: '$0' },
  tokenunlocks: { status: 'freemium', rateLimit: 'varies', cost: '$0+' },
  rated: { status: 'free', rateLimit: 'moderate', cost: '$0' },
  helius: { status: 'freemium', rateLimit: '100k req/day', cost: '$0-$49/mo' },
  shyft: { status: 'freemium', rateLimit: '100 req/min', cost: '$0-$49/mo' },
  sui: { status: 'free', rateLimit: 'moderate', cost: '$0' },
  aptos: { status: 'free', rateLimit: 'moderate', cost: '$0' },
  
  // Paid APIs
  coinmarketcap: { status: 'paid', rateLimit: '30 calls/min', cost: '$29-299/mo' },
  lunarcrush: { status: 'paid', rateLimit: '100 calls/min', cost: '$99/mo' },
  glassnode: { status: 'paid', rateLimit: 'varies', cost: '$29-799/mo' },
  cryptoquant: { status: 'paid', rateLimit: 'varies', cost: '$49/mo' },
  thegraph: { status: 'paid', rateLimit: 'unlimited', cost: 'pay per query' },
  arkham: { status: 'paid', rateLimit: 'varies', cost: 'paid' },
  nansen: { status: 'paid', rateLimit: 'varies', cost: 'paid' },
  oneinch: { status: 'paid', rateLimit: 'varies', cost: 'paid' },
} as const;

export type ApiProvider = keyof typeof API_STATUS;

// =============================================================================
// Environment Variables Reference
// =============================================================================

/**
 * Environment variables required for full functionality:
 * 
 * FREE APIs (no key required or very generous free tier):
 * - DefiLlama: No key required
 * - L2Beat: No key required
 * - GeckoTerminal: No key required
 * - DefiLlama Bridges: No key required
 * - DefiLlama DEXs: No key required
 * - Rated Network: No key required
 * - Sui: No key required (fullnode.mainnet.sui.io)
 * - Aptos: No key required (fullnode.mainnet.aptoslabs.com/v1)
 * 
 * FREEMIUM APIs (free tier with limits):
 * - MESSARI_API_KEY: Messari Research
 * - OPENSEA_API_KEY: OpenSea NFT data
 * - RESERVOIR_API_KEY: Reservoir NFT aggregator
 * - CRYPTOPANIC_API_KEY: CryptoPanic news
 * - NEWSAPI_API_KEY: NewsAPI
 * - COINGLASS_API_KEY: CoinGlass derivatives data
 * - BIRDEYE_API_KEY: Birdeye Solana & multi-chain DeFi
 * - TOKENTERMINAL_API_KEY: Token Terminal protocol revenue
 * - DUNE_API_KEY: Dune Analytics on-chain SQL
 * - TOKEN_UNLOCKS_API_KEY: Token Unlocks vesting/unlock schedules
 * - HELIUS_API_KEY: Helius Solana RPC & DAS (100k req/day free)
 * - SHYFT_API_KEY: Shyft Solana DeFi & parsing (1M calls/mo free)
 * 
 * FREE APIs (alt L1s, no key required):
 * - Sui: Public fullnode RPC (fullnode.mainnet.sui.io)
 * - Aptos: Public REST API (fullnode.mainnet.aptoslabs.com/v1)
 * 
 * PAID APIs:
 * - COINMARKETCAP_API_KEY: CoinMarketCap Pro
 * - LUNARCRUSH_API_KEY: LunarCrush Social
 * - GLASSNODE_API_KEY: Glassnode Analytics
 * - CRYPTOQUANT_API_KEY: CryptoQuant
 * - THEGRAPH_API_KEY: The Graph Protocol
 * - ARKHAM_API_KEY: Arkham Intelligence on-chain intelligence
 * - NANSEN_API_KEY: Nansen smart money analytics
 * - ONEINCH_API_KEY: 1inch DEX aggregation & prices
 * - TOKEN_TERMINAL_API_KEY: Token Terminal protocol revenue (alt: TOKENTERMINAL_API_KEY)
 * 
 * LEGACY APIs (in /src/lib/):
 * - binance.ts, coincap.ts, coinpaprika.ts, groq.ts, external-apis.ts
 */
