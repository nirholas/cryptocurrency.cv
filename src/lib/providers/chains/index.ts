/**
 * Provider Chains — Barrel export & global registry bootstrap
 *
 * This module is the single entry point for all provider chains.
 * It re-exports every chain from the category modules and provides
 * `registerAllChains()` to bootstrap the global registry on app startup.
 *
 * Usage:
 * ```ts
 * import { registerAllChains } from '@/lib/providers/chains';
 * registerAllChains(); // call once at app init
 * ```
 *
 * Or import individual chains:
 * ```ts
 * import { marketPriceChain, fundingRateChain } from '@/lib/providers/chains';
 * ```
 *
 * @module providers/chains
 */

import { registry } from '../registry';

// ---------------------------------------------------------------------------
// Re-exports: Derivatives
// ---------------------------------------------------------------------------
export {
  fundingRateChain,
  fundingRateFallbackChain,
  createFundingRateChain,
  derivativesChain,
  derivativesConsensusChain,
  createDerivativesChain,
  liquidationsChain,
  createLiquidationsChain,
} from './derivatives';

// ---------------------------------------------------------------------------
// Re-exports: DeFi
// ---------------------------------------------------------------------------
export {
  defiTvlChain,
  defiYieldsChain,
  createDefiTvlChain,
  createDefiYieldsChain,
  tvlChain,
  createTVLChain,
} from './defi';

// ---------------------------------------------------------------------------
// Re-exports: On-Chain
// ---------------------------------------------------------------------------
export {
  onChainChain,
  whaleAlertChain,
  createOnChainChain,
  createWhaleAlertChain,
  gasChain,
  gasConsensusChain,
  createGasChain,
} from './onchain';

// ---------------------------------------------------------------------------
// Re-exports: Social
// ---------------------------------------------------------------------------
export {
  socialChain,
  socialConsensusChain,
  createSocialChain,
  fearGreedChain,
  fearGreedConsensusChain,
  createFearGreedChain,
} from './social';

// ---------------------------------------------------------------------------
// Re-exports: NFT & Gaming
// ---------------------------------------------------------------------------
export {
  nftMarketChain,
  nftMarketConsensusChain,
  createNFTMarketChain,
  gamingDataChain,
  gamingDataConsensusChain,
  createGamingDataChain,
} from './nft-gaming';

// ---------------------------------------------------------------------------
// Re-exports: Macro
// ---------------------------------------------------------------------------
export {
  macroChain,
  createMacroChain,
} from './macro';

// ---------------------------------------------------------------------------
// Re-exports: Market / CEX
// ---------------------------------------------------------------------------
export {
  marketPriceChain,
  marketPriceConsensusChain,
  createMarketPriceChain,
  orderBookChain,
  orderBookConsensusChain,
  createOrderBookChain,
  ohlcvChain,
  createOHLCVChain,
} from './market';

// ---------------------------------------------------------------------------
// Re-exports: Stablecoins
// ---------------------------------------------------------------------------
export {
  stablecoinFlowsChain,
  createStablecoinFlowsChain,
} from './stablecoins';

// =============================================================================
// REGISTRY BOOTSTRAP
// =============================================================================

// Lazy-import chains to avoid circular dependency during module evaluation.
// The actual chain singletons are created on first access.

let _registered = false;

/**
 * Register all provider chains with the global `ProviderRegistry`.
 *
 * Call this **once** at application startup (e.g., in a Next.js
 * instrumentation hook or layout server component). Subsequent calls
 * are no-ops.
 *
 * ```ts
 * import { registerAllChains } from '@/lib/providers/chains';
 * registerAllChains();
 * ```
 */
export function registerAllChains(): void {
  if (_registered) return;
  _registered = true;

  // Dynamically import to break potential circular imports
   
  const deriv = require('./derivatives');
   
  const defi = require('./defi');
   
  const onchain = require('./onchain');
   
  const social = require('./social');
   
  const nftGaming = require('./nft-gaming');
   
  const macro = require('./macro');
   
  const market = require('./market');
   
  const stables = require('./stablecoins');

  // ── Derivatives ──────────────────────────────────────────────────────────
  registry.register('funding-rate', deriv.fundingRateChain, {
    description: 'Funding rates from Binance, Bybit, OKX, dYdX, Hyperliquid, CoinGlass',
  });
  registry.register('open-interest', deriv.derivativesChain, {
    description: 'Open interest from Hyperliquid + CoinGlass aggregated',
  });
  registry.register('liquidations', deriv.liquidationsChain, {
    description: 'Liquidation data from Binance Futures',
  });

  // ── DeFi ─────────────────────────────────────────────────────────────────
  registry.register('tvl', defi.tvlChain, {
    description: 'Total Value Locked from DefiLlama',
  });
  registry.register('defi-yields', defi.defiYieldsChain, {
    description: 'DeFi yields from DefiLlama, Aave, Lido',
  });

  // ── On-Chain ─────────────────────────────────────────────────────────────
  registry.register('on-chain', onchain.onChainChain, {
    description: 'On-chain metrics from Blockchain.info, Etherscan, Mempool.space',
  });
  registry.register('whale-alerts', onchain.whaleAlertChain, {
    description: 'Whale transaction alerts from Whale Alert API',
  });
  registry.register('gas-fees', onchain.gasChain, {
    description: 'Gas prices from Etherscan, Blocknative, Owlracle',
  });

  // ── Social ───────────────────────────────────────────────────────────────
  registry.register('social-metrics', social.socialChain, {
    description: 'Social metrics from LunarCrush, Santiment, CryptoPanic, Farcaster',
  });
  registry.register('fear-greed', social.fearGreedChain, {
    description: 'Fear & Greed Index from Alternative.me, CoinStats, Composite',
  });

  // ── NFT & Gaming ────────────────────────────────────────────────────────
  registry.register('nft-market', nftGaming.nftMarketChain, {
    description: 'NFT market data from OpenSea, Reservoir, SimpleHash',
  });
  registry.register('gaming-data', nftGaming.gamingDataChain, {
    description: 'Blockchain gaming data from DappRadar, PlayToEarn, Footprint',
  });

  // ── Macro ────────────────────────────────────────────────────────────────
  registry.register('macro-data', macro.macroChain, {
    description: 'Macro/TradFi indicators from FRED, Alpha Vantage, Twelve Data',
  });

  // ── Market / CEX ─────────────────────────────────────────────────────────
  registry.register('market-price', market.marketPriceChain, {
    description: 'Market prices from CoinGecko, Binance, Coinbase, Kraken + 7 more',
  });
  registry.register('order-book', market.orderBookChain, {
    description: 'Order books from Binance, Coinbase, Kraken, OKX, Bybit',
  });
  registry.register('ohlcv', market.ohlcvChain, {
    description: 'OHLCV candlestick data from Binance, CryptoCompare, CoinGecko',
  });

  // ── Stablecoins ──────────────────────────────────────────────────────────
  registry.register('stablecoin-flows', stables.stablecoinFlowsChain, {
    description: 'Stablecoin flows from DefiLlama, Glassnode, Artemis, CryptoQuant, Dune',
  });

  // ── DEX ──────────────────────────────────────────────────────────────────
  // DEX chain is registered from the DEX adapters barrel export
  // Import only if available to avoid hard dependency
  try {
     
    const dex = require('../adapters/dex');
    if (dex.dexChain) {
      registry.register('dex', dex.dexChain, {
        description: 'DEX data from DexScreener, GeckoTerminal',
      });
    }
  } catch {
    // DEX chain not available — skip
  }

  // ── Derivatives (secondary) ──────────────────────────────────────────────
  // The 'derivatives' category maps to the open-interest chain for backwards compat
  registry.register('derivatives', deriv.derivativesConsensusChain, {
    description: 'Derivatives consensus chain (OI from Hyperliquid + CoinGlass)',
  });
}
