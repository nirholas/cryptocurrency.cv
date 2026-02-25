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

// =============================================================================
// API Configuration & Status
// =============================================================================

export const API_STATUS = {
  // Free APIs
  defillama: { status: 'free', rateLimit: 'generous', cost: '$0' },
  l2beat: { status: 'free', rateLimit: 'moderate', cost: '$0' },
  geckoterminal: { status: 'free', rateLimit: '30 calls/min', cost: '$0' },
  
  // Free tier available
  messari: { status: 'freemium', rateLimit: '20 calls/min', cost: '$0-$250/mo' },
  nftMarkets: { status: 'freemium', rateLimit: '120 calls/min', cost: '$0' },
  newsFeeds: { status: 'freemium', rateLimit: '100 calls/day', cost: '$0' },
  coinglass: { status: 'freemium', rateLimit: '100 calls/day', cost: '$0-$49/mo' },
  birdeye: { status: 'freemium', rateLimit: '100 calls/min', cost: '$0-$49/mo' },
  tokenterminal: { status: 'freemium', rateLimit: '5 calls/min', cost: '$0-$325/mo' },
  dune: { status: 'freemium', rateLimit: '2500 credits/mo', cost: '$0-$349/mo' },
  
  // Paid APIs
  coinmarketcap: { status: 'paid', rateLimit: '30 calls/min', cost: '$29-299/mo' },
  lunarcrush: { status: 'paid', rateLimit: '100 calls/min', cost: '$99/mo' },
  glassnode: { status: 'paid', rateLimit: 'varies', cost: '$29-799/mo' },
  cryptoquant: { status: 'paid', rateLimit: 'varies', cost: '$49/mo' },
  thegraph: { status: 'paid', rateLimit: 'unlimited', cost: 'pay per query' },
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
 * 
 * PAID APIs:
 * - COINMARKETCAP_API_KEY: CoinMarketCap Pro
 * - LUNARCRUSH_API_KEY: LunarCrush Social
 * - GLASSNODE_API_KEY: Glassnode Analytics
 * - CRYPTOQUANT_API_KEY: CryptoQuant
 * - THEGRAPH_API_KEY: The Graph Protocol
 * 
 * LEGACY APIs (in /src/lib/):
 * - binance.ts, coincap.ts, coinpaprika.ts, groq.ts, external-apis.ts
 */
