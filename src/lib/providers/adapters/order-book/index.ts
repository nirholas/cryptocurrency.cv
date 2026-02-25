/**
 * Order Book Chain — Pre-wired provider chain for order book data
 *
 * | Provider      | Priority | Weight | Rate Limit      | Coverage    |
 * |---------------|----------|--------|-----------------|-------------|
 * | Binance       | 1        | 0.50   | 1200/min (free) | 600+ pairs  |
 * | Coinbase      | 2        | 0.45   | 600/min (free)  | Major pairs |
 *
 * @module providers/adapters/order-book
 */

import type { ProviderChainConfig, ResolutionStrategy } from '../../types';
import { ProviderChain } from '../../provider-chain';
import type { OrderBookData } from './types';
import { binanceOrderBookAdapter } from './binance-orderbook.adapter';
import { coinbaseOrderBookAdapter } from './coinbase-orderbook.adapter';
import { krakenOrderBookAdapter } from './kraken-orderbook.adapter';
import { okxOrderBookAdapter } from './okx-orderbook.adapter';
import { bybitOrderBookAdapter } from './bybit-orderbook.adapter';

export type { OrderBookData, OrderBookLevel } from './types';

export interface OrderBookChainOptions {
  strategy?: ResolutionStrategy;
  cacheTtlSeconds?: number;
  staleWhileError?: boolean;
  includeCoinbase?: boolean;
  includeKraken?: boolean;
  includeOKX?: boolean;
  includeBybit?: boolean;
}

export function createOrderBookChain(options: OrderBookChainOptions = {}): ProviderChain<OrderBookData[]> {
  const {
    strategy = 'fallback',
    cacheTtlSeconds = 5,  // Order books change fast
    staleWhileError = true,
    includeCoinbase = true,
    includeKraken = true,
    includeOKX = true,
    includeBybit = true,
  } = options;

  const config: Partial<ProviderChainConfig> = {
    strategy,
    cacheTtlSeconds,
    staleWhileError,
  };

  const chain = new ProviderChain<OrderBookData[]>('order-book', config);
  chain.addProvider(binanceOrderBookAdapter);

  if (includeCoinbase) {
    chain.addProvider(coinbaseOrderBookAdapter);
  }

  if (includeKraken) {
    chain.addProvider(krakenOrderBookAdapter);
  }

  if (includeOKX) {
    chain.addProvider(okxOrderBookAdapter);
  }

  if (includeBybit) {
    chain.addProvider(bybitOrderBookAdapter);
  }

  return chain;
}

export const orderBookChain = createOrderBookChain();

/** Consensus chain for cross-exchange order book verification */
export const orderBookConsensusChain = createOrderBookChain({
  strategy: 'consensus',
  cacheTtlSeconds: 3,
});
