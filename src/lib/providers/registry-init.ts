/**
 * Provider Registry Initialization
 *
 * Centralized registration of all provider chains into the global registry.
 * Call `initProviders()` once at application startup to wire everything.
 *
 * Only enables adapters for chains that have at least one provider.
 * Logs active providers to stdout for startup diagnostics.
 *
 * @module providers/registry-init
 */

import { registry } from './registry';
import type { DataCategory } from './types';
import { logger } from '@/lib/logger';

// Category chain imports
import { marketPriceChain } from './adapters/market-price';
import { fundingRateChain } from './adapters/funding-rate';
import { onChainChain, whaleAlertChain } from './adapters/on-chain';
import { socialChain } from './adapters/social';
import { gasChain } from './adapters/gas';
import { fearGreedChain } from './adapters/fear-greed';
import { dexChain } from './adapters/dex';
import { derivativesChain } from './adapters/derivatives';
import { ohlcvChain } from './adapters/ohlcv';
import { orderBookChain } from './adapters/order-book';
import { stablecoinFlowsChain } from './adapters/stablecoin-flows';
import { tvlChain } from './adapters/tvl';
import { defiYieldsChain } from './adapters/defi-yields';
import { nftMarketChain } from './adapters/nft-market';
import { gamingDataChain } from './adapters/gaming-data';
import { macroChain } from './adapters/macro';
import { solanaChain } from './adapters/solana-ecosystem';
import { predictionMarketsChain } from './adapters/prediction-markets';
import { governanceChain } from './adapters/governance';
import { protocolRevenueChain } from './adapters/protocol-revenue';
import { l2DataChain } from './adapters/l2-data';
import { mevChain } from './adapters/mev';
import { bridgesChain } from './adapters/bridges';
import { btcETFChain } from './adapters/btc-etf';
import { miningChain } from './adapters/mining';

// ---------------------------------------------------------------------------
// Chain map: DataCategory → pre-wired ProviderChain
// ---------------------------------------------------------------------------

 
const CHAINS: Array<{ category: DataCategory; chain: any; label: string }> = [
  { category: 'market-price', chain: marketPriceChain, label: 'Market Prices' },
  { category: 'funding-rate', chain: fundingRateChain, label: 'Funding Rates' },
  { category: 'on-chain', chain: onChainChain, label: 'On-Chain Metrics' },
  { category: 'whale-alerts', chain: whaleAlertChain, label: 'Whale Alerts' },
  { category: 'social-metrics', chain: socialChain, label: 'Social Metrics' },
  { category: 'gas-fees', chain: gasChain, label: 'Gas Fees' },
  { category: 'fear-greed', chain: fearGreedChain, label: 'Fear & Greed' },
  { category: 'dex', chain: dexChain, label: 'DEX Pairs' },
  { category: 'derivatives', chain: derivativesChain, label: 'Derivatives' },
  { category: 'ohlcv', chain: ohlcvChain, label: 'OHLCV' },
  { category: 'order-book', chain: orderBookChain, label: 'Order Book' },
  { category: 'stablecoin-flows', chain: stablecoinFlowsChain, label: 'Stablecoin Flows' },
  { category: 'tvl', chain: tvlChain, label: 'TVL' },
  { category: 'defi-yields', chain: defiYieldsChain, label: 'DeFi Yields' },
  { category: 'nft-market', chain: nftMarketChain, label: 'NFT Market' },
  { category: 'gaming-data', chain: gamingDataChain, label: 'Gaming Data' },
  { category: 'macro-data', chain: macroChain, label: 'Macro Data' },
  { category: 'solana-ecosystem', chain: solanaChain, label: 'Solana Ecosystem' },
  { category: 'prediction-markets', chain: predictionMarketsChain, label: 'Prediction Markets' },
  { category: 'governance', chain: governanceChain, label: 'Governance' },
  { category: 'protocol-revenue', chain: protocolRevenueChain, label: 'Protocol Revenue' },
  { category: 'l2-data', chain: l2DataChain, label: 'L2 Data' },
  { category: 'mev', chain: mevChain, label: 'MEV' },
  { category: 'bridges', chain: bridgesChain, label: 'Bridges' },
  { category: 'btc-etf', chain: btcETFChain, label: 'BTC ETF Flows' },
  { category: 'mining', chain: miningChain, label: 'Mining Stats' },
];

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

let _initialized = false;

/**
 * Register all provider chains with the global registry.
 *
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export function initProviders(): void {
  if (_initialized) return;
  _initialized = true;

  const registered: string[] = [];

  for (const { category, chain, label } of CHAINS) {
    try {
      registry.register(category, chain);
      registered.push(label);
    } catch (err) {
       
      logger.warn(`[providers] Failed to register "${label}"`, err instanceof Error ? err : undefined);
    }
  }

   
  logger.info(
    `[providers] Initialized ${registered.length}/${CHAINS.length} chains: ${registered.join(', ')}`,
  );
}

/**
 * Check whether providers have been initialized.
 */
export function isProvidersInitialized(): boolean {
  return _initialized;
}

/**
 * Get a summary of all registered provider chains and their health.
 */
export async function getProvidersSummary(): Promise<ProviderSummary[]> {
  const overview = registry.statusOverview();
  return overview.map((entry) => ({
    category: entry.category,
    name: entry.name,
    status: entry.status,
    providerCount: entry.providers,
    available: entry.available > 0,
  }));
}

export interface ProviderSummary {
  category: string;
  name: string;
  status: string;
  providerCount: number;
  available: boolean;
}
