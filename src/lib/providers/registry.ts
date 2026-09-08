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
 * Provider Registry — Global catalog of all data provider chains
 *
 * The registry is the single entry point for accessing any data in the system.
 * It maps data categories to pre-configured ProviderChains, handles lazy
 * initialization, and provides discovery/introspection capabilities.
 *
 * Think of it as a service locator for data:
 *
 * ```ts
 * // Instead of:
 * import { getMarketPrices } from './market-data';
 * const prices = await getMarketPrices();
 *
 * // You write:
 * const prices = await registry.fetch('market-price', { coinIds: ['bitcoin'] });
 * ```
 *
 * Benefits:
 * - **Decoupled** — Consumers don't know which providers exist
 * - **Observable** — Global health dashboard across all chains
 * - **Testable** — Swap out real providers for mocks in tests
 * - **Extensible** — Add new data categories without changing existing code
 *
 * @module providers/registry
 */

import type {
  DataCategory,
  FetchParams,
  ProviderResponse,
  ChainHealth,
  ProviderChainInstance,
  ProviderEventListener,
} from './types';

// =============================================================================
// REGISTRY ENTRY
// =============================================================================

interface RegistryEntry<T = unknown> {
  category: DataCategory;
  name: string;
  description: string;
  chain: ProviderChainInstance<T>;
  registeredAt: number;
}

// =============================================================================
// PROVIDER REGISTRY
// =============================================================================

/**
 * Global registry of all provider chains.
 *
 * @example
 * ```ts
 * import { registry } from './providers';
 * import { marketPriceChain } from './providers/adapters/market-price';
 *
 * // Register a chain
 * registry.register('market-price', marketPriceChain, {
 *   description: 'Real-time crypto prices from CoinGecko, Binance, CoinCap',
 * });
 *
 * // Fetch from it
 * const result = await registry.fetch('market-price', {
 *   coinIds: ['bitcoin', 'ethereum'],
 * });
 *
 * // Get global health
 * const health = registry.healthCheck();
 * // { 'market-price': 'healthy', 'funding-rates': 'degraded', ... }
 * ```
 */
export class ProviderRegistry {
  private _entries: Map<DataCategory, RegistryEntry> = new Map();
  private _listeners: ProviderEventListener[] = [];

  // ===========================================================================
  // REGISTRATION
  // ===========================================================================

  /**
   * Register a provider chain for a data category.
   * Only one chain per category is allowed.
   */
  register<T>(
    category: DataCategory,
    chain: ProviderChainInstance<T>,
    options?: { description?: string },
  ): void {
    if (this._entries.has(category)) {
      console.warn(
        `[ProviderRegistry] Overwriting existing chain for category "${category}"`,
      );
    }

    const entry: RegistryEntry = {
      category,
      name: chain.name,
      description: options?.description ?? `Provider chain for ${category}`,
      chain: chain as ProviderChainInstance<unknown>,
      registeredAt: Date.now(),
    };

    this._entries.set(category, entry);
  }

  /**
   * Unregister a provider chain.
   */
  unregister(category: DataCategory): boolean {
    return this._entries.delete(category);
  }

  // ===========================================================================
  // FETCHING
  // ===========================================================================

  /**
   * Fetch data from the chain registered for a category.
   *
   * @throws {Error} if no chain is registered for the category
   */
  async fetch<T = unknown>(
    category: DataCategory,
    params: FetchParams = {},
  ): Promise<ProviderResponse<T>> {
    let entry = this._entries.get(category);
    if (!entry) {
      // The chains may not have been registered in this execution context yet.
      // Register them on demand rather than reporting an empty registry: a
      // route that reaches an unregistered chain silently drops to whatever
      // single-provider legacy path it happens to have, which is how the whole
      // multi-source framework ended up inert behind every endpoint.
      await ensureChainsRegistered();
      entry = this._entries.get(category);
    }
    if (!entry) {
      throw new Error(
        `[ProviderRegistry] No provider chain registered for category "${category}". ` +
        `Available: ${this.categories.join(', ') || 'none'}`,
      );
    }
    return entry.chain.fetch(params) as Promise<ProviderResponse<T>>;
  }

  /**
   * Check if a category has a registered chain.
   */
  has(category: DataCategory): boolean {
    return this._entries.has(category);
  }

  /**
   * Get all registered categories.
   */
  get categories(): DataCategory[] {
    return Array.from(this._entries.keys());
  }

  /**
   * Get the chain for a specific category (for advanced usage).
   */
  getChain<T = unknown>(category: DataCategory): ProviderChainInstance<T> | null {
    const entry = this._entries.get(category);
    return entry ? (entry.chain as ProviderChainInstance<T>) : null;
  }

  // ===========================================================================
  // HEALTH & MONITORING
  // ===========================================================================

  /**
   * Get health status for all registered chains.
   */
  healthCheck(): Record<DataCategory, ChainHealth> {
    const result: Partial<Record<DataCategory, ChainHealth>> = {};
    for (const [category, entry] of this._entries) {
      result[category] = entry.chain.getHealth();
    }
    return result as Record<DataCategory, ChainHealth>;
  }

  /**
   * Get a quick status overview.
   */
  statusOverview(): Array<{
    category: DataCategory;
    name: string;
    status: 'healthy' | 'degraded' | 'critical';
    providers: number;
    available: number;
  }> {
    return Array.from(this._entries.entries()).map(([category, entry]) => {
      const health = entry.chain.getHealth();
      return {
        category,
        name: entry.name,
        status: health.status,
        providers: health.totalProviders,
        available: health.availableProviders,
      };
    });
  }

  /**
   * Print a formatted status report.
   */
  report(): string {
    const overview = this.statusOverview();
    if (overview.length === 0) return '[ProviderRegistry] No chains registered.';

    const lines = ['Provider Registry Status:', '─'.repeat(60)];

    for (const item of overview) {
      const statusIcon = item.status === 'healthy' ? '●'
        : item.status === 'degraded' ? '◐'
        : '○';
      lines.push(
        `  ${statusIcon} ${item.category.padEnd(20)} ${item.name.padEnd(25)} ` +
        `${item.available}/${item.providers} providers`,
      );
    }

    lines.push('─'.repeat(60));
    return lines.join('\n');
  }

  /**
   * Subscribe to events from ALL chains.
   * Returns an unsubscribe function.
   */
  on(listener: ProviderEventListener): () => void {
    this._listeners.push(listener);
    return () => {
      this._listeners = this._listeners.filter(l => l !== listener);
    };
  }

  /**
   * Clear all registrations (useful for testing).
   */
  clear(): void {
    this._entries.clear();
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Global provider registry instance.
 * Import this from the barrel export.
 *
 * Parked on `globalThis` rather than held in module scope. Next.js bundles
 * `instrumentation.ts` and each route into separate module graphs, so a plain
 * module-scoped singleton gives the startup hook one registry and every route
 * handler another, empty one. That is why `registry.fetch` reported
 * `Available: none` at request time even though setup registers 23 chains.
 */
const REGISTRY_KEY = Symbol.for('cryptocurrency.cv.providerRegistry');

type RegistryGlobal = typeof globalThis & {
  [REGISTRY_KEY]?: ProviderRegistry;
};

const registryGlobal = globalThis as RegistryGlobal;

export const registry: ProviderRegistry =
  registryGlobal[REGISTRY_KEY] ?? (registryGlobal[REGISTRY_KEY] = new ProviderRegistry());

/**
 * Import the provider setup module once, registering every chain.
 *
 * Dynamic so `setup.ts` (which imports this module) does not create an
 * evaluation cycle, and memoised so concurrent requests share one import.
 */
let setupPromise: Promise<unknown> | null = null;

export function ensureChainsRegistered(): Promise<unknown> {
  if (!setupPromise) {
    setupPromise = import('./setup').catch((err) => {
      setupPromise = null;
      throw err;
    });
  }
  return setupPromise;
}
