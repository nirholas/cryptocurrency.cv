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
 * Live Price WebSocket Hook
 * 
 * Connects to real-time price feeds with:
 * - Automatic reconnection with exponential backoff
 * - Batched updates to prevent excessive re-renders
 * - Subscription management for visible coins
 */

'use client';

import { useState, useEffect } from 'react';

export interface PriceData {
  price: number;
  change24h: number;
  volume24h?: number;
  marketCap?: number;
  lastUpdate: Date;
}

export interface UseLivePriceOptions {
  coinId: string;
  initialPrice?: number;
  initialChange?: number;
  enabled?: boolean;
}

export interface UseLivePriceReturn {
  price: number | null;
  change24h: number | null;
  isLive: boolean;
  lastUpdate: Date | null;
  isConnecting: boolean;
  error: string | null;
}

// Connection states
type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting';

// Shared WebSocket connection
let sharedWs: WebSocket | null = null;
let connectionState: ConnectionState = 'disconnected';
let reconnectAttempts = 0;
let reconnectTimeout: NodeJS.Timeout | null = null;
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000;

// Subscribers map: coinId -> Set of callbacks
const subscribers = new Map<string, Set<(data: PriceData) => void>>();

// Price cache for immediate access
const priceCache = new Map<string, PriceData>();

// Batched update queue
let updateQueue: Map<string, PriceData> = new Map();
let batchTimeout: NodeJS.Timeout | null = null;
const BATCH_INTERVAL = 100; // ms

// Connection state listeners
const connectionListeners = new Set<(state: ConnectionState) => void>();

/**
 * Get WebSocket URL for price feed
 */
function getWsUrl(): string {
  // Use Binance WebSocket for live prices (free, no auth required)
  return 'wss://stream.binance.com:9443/ws';
}

/**
 * Calculate exponential backoff delay
 */
function getReconnectDelay(): number {
  return Math.min(BASE_RECONNECT_DELAY * Math.pow(2, reconnectAttempts), 30000);
}

/**
 * Notify all connection state listeners
 */
function notifyConnectionState(state: ConnectionState) {
  connectionState = state;
  connectionListeners.forEach(listener => listener(state));
}

/**
 * Process batched updates
 */
function processBatch() {
  if (updateQueue.size === 0) return;
  
  updateQueue.forEach((data, coinId) => {
    const callbacks = subscribers.get(coinId);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
    priceCache.set(coinId, data);
  });
  
  updateQueue = new Map();
  batchTimeout = null;
}

/**
 * Queue a price update for batching
 */
function queueUpdate(coinId: string, data: PriceData) {
  updateQueue.set(coinId, data);
  
  if (!batchTimeout) {
    batchTimeout = setTimeout(processBatch, BATCH_INTERVAL);
  }
}

/**
 * Map Binance symbol to CoinGecko ID
 */
function symbolToCoinId(symbol: string): string | null {
  const mapping: Record<string, string> = {
    'btcusdt': 'bitcoin',
    'ethusdt': 'ethereum',
    'bnbusdt': 'binancecoin',
    'solusdt': 'solana',
    'xrpusdt': 'ripple',
    'adausdt': 'cardano',
    'dogeusdt': 'dogecoin',
    'dotusdt': 'polkadot',
    'avaxusdt': 'avalanche-2',
    'linkusdt': 'chainlink',
    'maticusdt': 'matic-network',
    'uniusdt': 'uniswap',
    'ltcusdt': 'litecoin',
    'atomusdt': 'cosmos',
    'nearusdt': 'near',
    'arbusdt': 'arbitrum',
    'opusdt': 'optimism',
    'aptusdt': 'aptos',
    'suiusdt': 'sui',
    'injusdt': 'injective-protocol',
    'rndrusdt': 'render-token',
    'imxusdt': 'immutable-x',
    'shibusdt': 'shiba-inu',
    'trxusdt': 'tron',
    'xlmusdt': 'stellar',
    'vetusdt': 'vechain',
    'aaveusdt': 'aave',
    'mkrusdt': 'maker',
    'snxusdt': 'synthetix-network-token',
    'compusdt': 'compound-governance-token',
    'crvusdt': 'curve-dao-token',
    'sushiusdt': 'sushi',
    '1inchusdt': '1inch',
    'grtusdt': 'the-graph',
    'ftmusdt': 'fantom',
  };
  
  return mapping[symbol.toLowerCase()] || null;
}

/**
 * Map CoinGecko ID to Binance symbol
 */
function coinIdToSymbol(coinId: string): string | null {
  const mapping: Record<string, string> = {
    'bitcoin': 'btcusdt',
    'ethereum': 'ethusdt',
    'binancecoin': 'bnbusdt',
    'solana': 'solusdt',
    'ripple': 'xrpusdt',
    'cardano': 'adausdt',
    'dogecoin': 'dogeusdt',
    'polkadot': 'dotusdt',
    'avalanche-2': 'avaxusdt',
    'chainlink': 'linkusdt',
    'matic-network': 'maticusdt',
    'polygon': 'maticusdt',
    'uniswap': 'uniusdt',
    'litecoin': 'ltcusdt',
    'cosmos': 'atomusdt',
    'near': 'nearusdt',
    'arbitrum': 'arbusdt',
    'optimism': 'opusdt',
    'aptos': 'aptusdt',
    'sui': 'suiusdt',
    'injective-protocol': 'injusdt',
    'render-token': 'rndrusdt',
    'immutable-x': 'imxusdt',
    'shiba-inu': 'shibusdt',
    'tron': 'trxusdt',
    'stellar': 'xlmusdt',
    'vechain': 'vetusdt',
    'aave': 'aaveusdt',
    'maker': 'mkrusdt',
    'synthetix-network-token': 'snxusdt',
    'compound-governance-token': 'compusdt',
    'curve-dao-token': 'crvusdt',
    'sushi': 'sushiusdt',
    '1inch': '1inchusdt',
    'the-graph': 'grtusdt',
    'fantom': 'ftmusdt',
  };
  
  return mapping[coinId.toLowerCase()] || null;
}

/**
 * Connect to WebSocket
 */
function connect() {
  if (sharedWs?.readyState === WebSocket.OPEN || connectionState === 'connecting') {
    return;
  }
  
  notifyConnectionState('connecting');
  
  try {
    sharedWs = new WebSocket(getWsUrl());
    
    sharedWs.onopen = () => {
      reconnectAttempts = 0;
      notifyConnectionState('connected');
      
      // Subscribe to all active symbols
      resubscribeAll();
    };
    
    sharedWs.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle 24hr ticker stream
        if (data.e === '24hrTicker') {
          const coinId = symbolToCoinId(data.s);
          if (coinId && subscribers.has(coinId)) {
            queueUpdate(coinId, {
              price: parseFloat(data.c), // Current price
              change24h: parseFloat(data.P), // Price change percent
              volume24h: parseFloat(data.v), // Volume
              lastUpdate: new Date(),
            });
          }
        }
        
        // Handle mini ticker for batch updates
        if (Array.isArray(data)) {
          data.forEach((ticker: { e?: string; s?: string; c?: string; P?: string }) => {
            if (ticker.e === '24hrMiniTicker') {
              const coinId = symbolToCoinId(ticker.s || '');
              if (coinId && subscribers.has(coinId)) {
                queueUpdate(coinId, {
                  price: parseFloat(ticker.c || '0'),
                  change24h: 0, // Mini ticker doesn't include change
                  lastUpdate: new Date(),
                });
              }
            }
          });
        }
      } catch {
        // Ignore parse errors
      }
    };
    
    sharedWs.onerror = () => {
      console.warn('WebSocket error');
    };
    
    sharedWs.onclose = () => {
      sharedWs = null;
      
      if (subscribers.size > 0 && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        notifyConnectionState('reconnecting');
        const delay = getReconnectDelay();
        reconnectAttempts++;
        
        reconnectTimeout = setTimeout(() => {
          connect();
        }, delay);
      } else {
        notifyConnectionState('disconnected');
      }
    };
  } catch (error) {
    console.error('Failed to create WebSocket:', error);
    notifyConnectionState('disconnected');
  }
}

/**
 * Resubscribe to all active symbols after reconnection
 */
function resubscribeAll() {
  if (sharedWs?.readyState !== WebSocket.OPEN) return;
  
  const symbols = Array.from(subscribers.keys())
    .map(coinId => coinIdToSymbol(coinId))
    .filter(Boolean) as string[];
  
  if (symbols.length === 0) return;
  
  // Subscribe to 24hr tickers for all symbols
  const subscribeMsg = {
    method: 'SUBSCRIBE',
    params: symbols.map(s => `${s}@ticker`),
    id: Date.now(),
  };
  
  sharedWs.send(JSON.stringify(subscribeMsg));
}

/**
 * Subscribe to a coin's price updates
 */
function subscribe(coinId: string, callback: (data: PriceData) => void): () => void {
  const normalizedId = coinId.toLowerCase();
  
  if (!subscribers.has(normalizedId)) {
    subscribers.set(normalizedId, new Set());
    
    // Subscribe on WebSocket if connected
    const symbol = coinIdToSymbol(normalizedId);
    if (symbol && sharedWs?.readyState === WebSocket.OPEN) {
      sharedWs.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [`${symbol}@ticker`],
        id: Date.now(),
      }));
    }
  }
  
  subscribers.get(normalizedId)!.add(callback);
  
  // Start connection if not already
  if (!sharedWs || sharedWs.readyState === WebSocket.CLOSED) {
    connect();
  }
  
  // Return cached data immediately if available
  const cached = priceCache.get(normalizedId);
  if (cached) {
    setTimeout(() => callback(cached), 0);
  }
  
  // Return unsubscribe function
  return () => {
    const callbacks = subscribers.get(normalizedId);
    if (callbacks) {
      callbacks.delete(callback);
      
      if (callbacks.size === 0) {
        subscribers.delete(normalizedId);
        
        // Unsubscribe from WebSocket
        const symbol = coinIdToSymbol(normalizedId);
        if (symbol && sharedWs?.readyState === WebSocket.OPEN) {
          sharedWs.send(JSON.stringify({
            method: 'UNSUBSCRIBE',
            params: [`${symbol}@ticker`],
            id: Date.now(),
          }));
        }
      }
    }
    
    // Close connection if no subscribers
    if (subscribers.size === 0 && sharedWs) {
      sharedWs.close();
      sharedWs = null;
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
    }
  };
}

/**
 * Hook for live price updates
 */
export function useLivePrice({
  coinId,
  initialPrice,
  initialChange,
  enabled = true,
}: UseLivePriceOptions): UseLivePriceReturn {
  const [price, setPrice] = useState<number | null>(initialPrice ?? null);
  const [change24h, setChange24h] = useState<number | null>(initialChange ?? null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !coinId) return;
    
    const handleUpdate = (data: PriceData) => {
      setPrice(data.price);
      if (data.change24h !== 0) {
        setChange24h(data.change24h);
      }
      setLastUpdate(data.lastUpdate);
      setIsLive(true);
      setError(null);
    };
    
    const handleConnectionState = (state: ConnectionState) => {
      setIsConnecting(state === 'connecting' || state === 'reconnecting');
      setIsLive(state === 'connected');
      if (state === 'disconnected') {
        setError('Connection lost');
      }
    };
    
    connectionListeners.add(handleConnectionState);
    const unsubscribe = subscribe(coinId, handleUpdate);
    
    return () => {
      connectionListeners.delete(handleConnectionState);
      unsubscribe();
    };
  }, [coinId, enabled]);

  return {
    price,
    change24h,
    isLive,
    lastUpdate,
    isConnecting,
    error,
  };
}

/**
 * Hook to get current connection state
 */
export function useConnectionState(): ConnectionState {
  const [state, setState] = useState<ConnectionState>(connectionState);
  
  useEffect(() => {
    const handleState = (newState: ConnectionState) => {
      setState(newState);
    };
    
    connectionListeners.add(handleState);
    return () => {
      connectionListeners.delete(handleState);
    };
  }, []);
  
  return state;
}

/**
 * Manually reconnect
 */
export function reconnect() {
  if (sharedWs) {
    sharedWs.close();
    sharedWs = null;
  }
  reconnectAttempts = 0;
  connect();
}

export default useLivePrice;
