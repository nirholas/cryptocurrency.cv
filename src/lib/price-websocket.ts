/**
 * Real-time Price WebSocket Provider
 *
 * Uses CoinCap WebSocket for free real-time price updates.
 * Falls back to polling DeFiLlama/CoinGecko if WebSocket fails.
 */

// =============================================================================
// TYPES
// =============================================================================

export interface PriceUpdate {
  id: string;
  price: number;
  timestamp: number;
}

export type PriceCallback = (prices: Record<string, PriceUpdate>) => void;

// =============================================================================
// COINCAP WEBSOCKET (Free, no API key needed)
// wss://ws.coincap.io/prices?assets=bitcoin,ethereum,solana
// =============================================================================

class PriceWebSocket {
  private ws: WebSocket | null = null;
  private callbacks: Set<PriceCallback> = new Set();
  private assets: Set<string> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private prices: Record<string, PriceUpdate> = {};
  private isConnecting = false;

  /**
   * Subscribe to price updates for specific assets
   */
  subscribe(assetIds: string[], callback: PriceCallback): () => void {
    // Add assets
    assetIds.forEach((id) => this.assets.add(id));
    this.callbacks.add(callback);

    // Connect or reconnect with new assets
    this.connect();

    // Return unsubscribe function
    return () => {
      this.callbacks.delete(callback);
      if (this.callbacks.size === 0) {
        this.disconnect();
      }
    };
  }

  /**
   * Get current cached prices
   */
  getPrices(): Record<string, PriceUpdate> {
    return { ...this.prices };
  }

  private connect() {
    if (this.isConnecting || this.ws?.readyState === WebSocket.OPEN) {
      // Already connected, just update assets if needed
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.reconnectWithNewAssets();
      }
      return;
    }

    if (typeof window === 'undefined') return; // SSR check

    this.isConnecting = true;
    const assetList = Array.from(this.assets).join(',');

    if (!assetList) {
      this.isConnecting = false;
      return;
    }

    try {
      this.ws = new WebSocket(`wss://ws.coincap.io/prices?assets=${assetList}`);

      this.ws.onopen = () => {
        console.log('[PriceWS] Connected to CoinCap');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const timestamp = Date.now();

          // Update prices
          Object.entries(data).forEach(([id, price]) => {
            this.prices[id] = {
              id,
              price: parseFloat(price as string),
              timestamp,
            };
          });

          // Notify subscribers
          this.callbacks.forEach((cb) => cb(this.prices));
        } catch (e) {
          console.error('[PriceWS] Parse error:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[PriceWS] WebSocket error:', error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log('[PriceWS] Connection closed');
        this.isConnecting = false;
        this.ws = null;
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[PriceWS] Connection failed:', error);
      this.isConnecting = false;
      this.attemptReconnect();
    }
  }

  private reconnectWithNewAssets() {
    // Close and reconnect with updated asset list
    if (this.ws) {
      this.ws.close();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[PriceWS] Max reconnect attempts reached, falling back to polling');
      this.startPolling();
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`[PriceWS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => {
      if (this.callbacks.size > 0) {
        this.connect();
      }
    }, delay);
  }

  private pollingInterval: ReturnType<typeof setInterval> | null = null;

  private startPolling() {
    if (this.pollingInterval) return;

    console.log('[PriceWS] Starting fallback polling');

    const poll = async () => {
      try {
        const prices = await fetchPricesFromAPIs(Array.from(this.assets));
        const timestamp = Date.now();

        Object.entries(prices).forEach(([id, price]) => {
          this.prices[id] = { id, price, timestamp };
        });

        this.callbacks.forEach((cb) => cb(this.prices));
      } catch (error) {
        console.error('[PriceWS] Polling error:', error);
      }
    };

    poll(); // Initial fetch
    this.pollingInterval = setInterval(poll, 30000); // Poll every 30s
  }

  private disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.assets.clear();
    this.prices = {};
  }
}

// =============================================================================
// FALLBACK API FETCHERS (Multiple sources for reliability)
// =============================================================================

/**
 * Fetch prices from multiple APIs with fallback
 */
async function fetchPricesFromAPIs(assets: string[]): Promise<Record<string, number>> {
  // Try DeFiLlama first (most generous rate limits)
  try {
    const prices = await fetchFromDeFiLlama(assets);
    if (Object.keys(prices).length > 0) return prices;
  } catch (e) {
    console.warn('[PriceAPI] DeFiLlama failed:', e);
  }

  // Try CoinCap REST API
  try {
    const prices = await fetchFromCoinCap(assets);
    if (Object.keys(prices).length > 0) return prices;
  } catch (e) {
    console.warn('[PriceAPI] CoinCap failed:', e);
  }

  // Try CoinGecko as last resort
  try {
    return await fetchFromCoinGecko(assets);
  } catch (e) {
    console.warn('[PriceAPI] CoinGecko failed:', e);
    return {};
  }
}

/**
 * DeFiLlama - Very generous rate limits
 * https://coins.llama.fi/prices/current/coingecko:bitcoin,coingecko:ethereum
 */
async function fetchFromDeFiLlama(assets: string[]): Promise<Record<string, number>> {
  const coins = assets.map((a) => `coingecko:${a}`).join(',');
  const response = await fetch(`https://coins.llama.fi/prices/current/${coins}`);

  if (!response.ok) throw new Error(`DeFiLlama: ${response.status}`);

  const data = await response.json();
  const prices: Record<string, number> = {};

  Object.entries(data.coins || {}).forEach(([key, value]) => {
    const id = key.replace('coingecko:', '');
    prices[id] = (value as { price: number }).price;
  });

  return prices;
}

/**
 * CoinCap REST API - Good rate limits
 * https://api.coincap.io/v2/assets?ids=bitcoin,ethereum
 */
async function fetchFromCoinCap(assets: string[]): Promise<Record<string, number>> {
  const response = await fetch(`https://api.coincap.io/v2/assets?ids=${assets.join(',')}`);

  if (!response.ok) throw new Error(`CoinCap: ${response.status}`);

  const data = await response.json();
  const prices: Record<string, number> = {};

  (data.data || []).forEach((asset: { id: string; priceUsd: string }) => {
    prices[asset.id] = parseFloat(asset.priceUsd);
  });

  return prices;
}

/**
 * CoinGecko - Rate limited, use as fallback
 */
async function fetchFromCoinGecko(assets: string[]): Promise<Record<string, number>> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${assets.join(',')}&vs_currencies=usd`
  );

  if (!response.ok) throw new Error(`CoinGecko: ${response.status}`);

  const data = await response.json();
  const prices: Record<string, number> = {};

  Object.entries(data).forEach(([id, value]) => {
    prices[id] = (value as { usd: number }).usd;
  });

  return prices;
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

let priceWebSocket: PriceWebSocket | null = null;

/**
 * Returns the singleton PriceWebSocket instance.
 * Creates the instance on first call.
 *
 * @returns PriceWebSocket singleton instance
 *
 * @example
 * ```typescript
 * const ws = getPriceWebSocket();
 * const unsubscribe = ws.subscribe(['bitcoin'], prices => {
 *   console.log(prices.bitcoin?.price);
 * });
 * ```
 */
export function getPriceWebSocket(): PriceWebSocket {
  if (!priceWebSocket) {
    priceWebSocket = new PriceWebSocket();
  }
  return priceWebSocket;
}

// =============================================================================
// REACT HOOK
// =============================================================================

import { useState, useEffect, useCallback } from 'react';

/**
 * React hook for real-time price updates
 *
 * @example
 * const { prices, isConnected } = useLivePrices(['bitcoin', 'ethereum']);
 * console.log(prices.bitcoin?.price);
 */
export function useLivePrices(assetIds: string[]) {
  const [prices, setPrices] = useState<Record<string, PriceUpdate>>({});
  const [isConnected, setIsConnected] = useState(false);

  const handlePriceUpdate = useCallback((newPrices: Record<string, PriceUpdate>) => {
    setPrices((prev) => ({ ...prev, ...newPrices }));
    setIsConnected(true);
  }, []);

  useEffect(() => {
    if (assetIds.length === 0) return;

    const ws = getPriceWebSocket();
    const unsubscribe = ws.subscribe(assetIds, handlePriceUpdate);

    // Get initial cached prices
    const cached = ws.getPrices();
    if (Object.keys(cached).length > 0) {
      setPrices(cached);
    }

    return () => {
      unsubscribe();
      setIsConnected(false);
    };
  }, [assetIds.join(','), handlePriceUpdate]);

  return { prices, isConnected };
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Formats a price number for display with appropriate decimal places.
 * Uses fewer decimals for higher prices, more for small prices.
 *
 * @param price - Price value to format
 * @returns Formatted price string with $ prefix
 *
 * @example
 * ```typescript
 * formatLivePrice(45000);    // '$45,000.00'
 * formatLivePrice(1.5);      // '$1.50'
 * formatLivePrice(0.00005);  // '$0.00005000'
 * ```
 */
export function formatLivePrice(price: number): string {
  if (price >= 1000) {
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  } else if (price >= 1) {
    return `$${price.toFixed(2)}`;
  } else if (price >= 0.01) {
    return `$${price.toFixed(4)}`;
  } else {
    return `$${price.toFixed(8)}`;
  }
}

/**
 * Returns a CSS class name based on price direction.
 * Useful for adding green/red coloring to price displays.
 *
 * @param currentPrice - Current price value
 * @param previousPrice - Previous price to compare against
 * @returns Tailwind CSS class: 'text-green-500', 'text-red-500', or ''
 *
 * @example
 * ```typescript
 * const className = getPriceChangeClass(45100, 45000);
 * // Returns: 'text-green-500'
 * ```
 */
export function getPriceChangeClass(currentPrice: number, previousPrice: number): string {
  if (currentPrice > previousPrice) return 'text-green-500';
  if (currentPrice < previousPrice) return 'text-red-500';
  return '';
}
