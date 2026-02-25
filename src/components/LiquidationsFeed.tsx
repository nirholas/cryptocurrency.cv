'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowTrendingDownIcon, 
  ArrowTrendingUpIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  SignalIcon,
  SignalSlashIcon,
} from '@heroicons/react/24/outline';

interface Liquidation {
  id: string;
  exchange: string;
  symbol: string;
  side: 'long' | 'short';
  amount: number;
  price: number;
  timestamp: number;
}

interface AggregatedStats {
  totalLongs: number;
  totalShorts: number;
  largestLiq: Liquidation | null;
  count: number;
  lastHourVolume: number;
}

// Coinalyze public API for liquidation data
// Note: This uses their public endpoints which may have rate limits
async function fetchLiquidationsFromCoinalyze(): Promise<Liquidation[]> {
  try {
    // Coinalyze provides aggregated liquidation data
    const symbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'XRPUSDT', 'DOGEUSDT'];
    const liquidations: Liquidation[] = [];
    
    // Fetch 24h liquidation data from CoinGlass (they have a public API)
    const response = await fetch(
      'https://open-api.coinglass.com/public/v2/liquidation_history?time_type=h1&symbol=BTC',
      { 
        cache: 'no-store',
        headers: {
          'Accept': 'application/json',
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      // Parse CoinGlass format if available
      if (data.data && Array.isArray(data.data)) {
        data.data.forEach((item: { t: number; longLiquidationUsd: number; shortLiquidationUsd: number; symbol?: string }, index: number) => {
          if (item.longLiquidationUsd > 0) {
            liquidations.push({
              id: `cg-long-${item.t}-${index}`,
              exchange: 'Aggregated',
              symbol: item.symbol || 'BTC',
              side: 'long',
              amount: item.longLiquidationUsd,
              price: 0,
              timestamp: item.t * 1000,
            });
          }
          if (item.shortLiquidationUsd > 0) {
            liquidations.push({
              id: `cg-short-${item.t}-${index}`,
              exchange: 'Aggregated',
              symbol: item.symbol || 'BTC',
              side: 'short',
              amount: item.shortLiquidationUsd,
              price: 0,
              timestamp: item.t * 1000,
            });
          }
        });
      }
    }
    
    return liquidations.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    console.error('Failed to fetch from Coinalyze:', error);
    return [];
  }
}

// Alternative: Use our server-side API proxy which calls Binance Futures
// (avoids CORS errors from calling fapi.binance.com directly from browser)
async function fetchFromBinanceFutures(): Promise<Liquidation[]> {
  try {
    const response = await fetch('/api/liquidations', { cache: 'no-store' });

    if (!response.ok) {
      console.error('Liquidations API error:', response.status);
      return [];
    }

    const data = await response.json();

    // The /api/liquidations route returns { recentEvents, bySymbol, totals, ... }
    if (data.recentEvents && Array.isArray(data.recentEvents)) {
      return data.recentEvents.map((event: Liquidation) => ({
        id: event.id,
        exchange: event.exchange,
        symbol: event.symbol,
        side: event.side,
        amount: event.amount,
        price: event.price,
        timestamp: event.timestamp,
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to fetch from liquidations API:', error);
    return [];
  }
}

// WebSocket for real-time Binance liquidations
function useBinanceLiquidationStream(
  onLiquidation: (liq: Liquidation) => void,
  enabled: boolean
): { connected: boolean; error: string | null } {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    const connect = () => {
      try {
        // Binance Futures WebSocket for force orders (liquidations)
        const ws = new WebSocket('wss://fstream.binance.com/ws/!forceOrder@arr');
        wsRef.current = ws;

        ws.onopen = () => {
          setConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.e === 'forceOrder' && data.o) {
              const order = data.o;
              const qty = parseFloat(order.q);
              const price = parseFloat(order.p);
              const usdValue = qty * price;

              if (usdValue > 5000) { // Only show liquidations > $5000
                onLiquidation({
                  id: `ws-${order.s}-${Date.now()}-${Math.random()}`,
                  exchange: 'Binance',
                  symbol: order.s.replace('USDT', '').replace('BUSD', ''),
                  side: order.S === 'SELL' ? 'long' : 'short',
                  amount: usdValue,
                  price: price,
                  timestamp: Date.now(),
                });
              }
            }
          } catch (e) {
            console.error('Failed to parse liquidation:', e);
          }
        };

        ws.onerror = () => {
          setError('WebSocket connection error');
          setConnected(false);
        };

        ws.onclose = () => {
          setConnected(false);
          // Attempt to reconnect after 5 seconds
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };
      } catch (e) {
        setError('Failed to establish WebSocket connection');
        setConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [enabled, onLiquidation]);

  return { connected, error };
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
}

function formatAmount(amount: number): string {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
  return `$${amount.toFixed(0)}`;
}

function formatPrice(price: number): string {
  if (price >= 10000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  if (price >= 100) return `$${price.toFixed(2)}`;
  if (price >= 1) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

export function LiquidationsFeed() {
  const [liquidations, setLiquidations] = useState<Liquidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'long' | 'short'>('all');
  const [minAmount, setMinAmount] = useState<number>(0);
  const [liveMode, setLiveMode] = useState(true);

  const handleNewLiquidation = useCallback((liq: Liquidation) => {
    setLiquidations(prev => {
      // Avoid duplicates
      if (prev.some(l => l.id === liq.id)) return prev;
      // Keep max 100 items
      return [liq, ...prev].slice(0, 100);
    });
  }, []);

  const { connected, error: wsError } = useBinanceLiquidationStream(
    handleNewLiquidation,
    liveMode
  );

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try Binance Futures API first
      const binanceData = await fetchFromBinanceFutures();
      
      if (binanceData.length > 0) {
        setLiquidations(binanceData);
      } else {
        // Fallback to CoinGlass if Binance fails
        const coinalyzeData = await fetchLiquidationsFromCoinalyze();
        if (coinalyzeData.length > 0) {
          setLiquidations(coinalyzeData);
        } else {
          setError('Unable to fetch liquidation data. Data sources may be temporarily unavailable.');
        }
      }
    } catch (e) {
      console.error('Failed to fetch liquidations:', e);
      setError('Failed to load liquidation data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const filteredLiquidations = liquidations.filter((liq) => {
    if (filter !== 'all' && liq.side !== filter) return false;
    if (liq.amount < minAmount) return false;
    return true;
  });

  const stats: AggregatedStats = {
    totalLongs: liquidations.filter((l) => l.side === 'long').reduce((s, l) => s + l.amount, 0),
    totalShorts: liquidations.filter((l) => l.side === 'short').reduce((s, l) => s + l.amount, 0),
    largestLiq: liquidations.reduce((max, l) => (l.amount > (max?.amount || 0) ? l : max), null as Liquidation | null),
    count: liquidations.length,
    lastHourVolume: liquidations
      .filter(l => Date.now() - l.timestamp < 3600000)
      .reduce((s, l) => s + l.amount, 0),
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
          ))}
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-200 dark:bg-slate-800 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {liveMode ? (
            connected ? (
              <>
                <SignalIcon className="w-5 h-5 text-green-500 animate-pulse" />
                <span className="text-sm text-green-600 dark:text-green-400">Live</span>
              </>
            ) : (
              <>
                <SignalSlashIcon className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-yellow-600 dark:text-yellow-400">Connecting...</span>
              </>
            )
          ) : (
            <>
              <SignalSlashIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-500">Paused</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLiveMode(!liveMode)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              liveMode 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                : 'bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            {liveMode ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={fetchInitialData}
            aria-label="Refresh liquidations"
            className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowPathIcon className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {(error || wsError) && (
        <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200">
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{error || wsError}</span>
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            <ArrowTrendingDownIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Longs Liquidated</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
            {formatAmount(stats.totalLongs)}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            <ArrowTrendingUpIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Shorts Liquidated</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
            {formatAmount(stats.totalShorts)}
          </div>
        </div>
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
            <CurrencyDollarIcon className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">Largest Liquidation</span>
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
            {stats.largestLiq ? formatAmount(stats.largestLiq.amount) : '-'}
          </div>
          {stats.largestLiq && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {stats.largestLiq.symbol} {stats.largestLiq.side}
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">Last Hour Volume</div>
          <div className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white font-mono">
            {formatAmount(stats.lastHourVolume)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {stats.count} events
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="inline-flex rounded-lg border border-gray-300 dark:border-slate-700 p-1 overflow-x-auto">
          {(['all', 'long', 'short'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                filter === f
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {f === 'all' ? 'All' : `${f}s`}
            </button>
          ))}
        </div>

        <select
          value={minAmount}
          onChange={(e) => setMinAmount(Number(e.target.value))}
          aria-label="Minimum liquidation size"
          className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
        >
          <option value={0}>All sizes</option>
          <option value={10000}>$10K+</option>
          <option value={50000}>$50K+</option>
          <option value={100000}>$100K+</option>
          <option value={500000}>$500K+</option>
          <option value={1000000}>$1M+</option>
        </select>
      </div>

      {/* Liquidations List */}
      {filteredLiquidations.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          {liquidations.length === 0 
            ? 'No liquidation data available. Waiting for market activity...'
            : 'No liquidations match your filters.'
          }
        </div>
      ) : (
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {filteredLiquidations.map((liq) => (
            <div
              key={liq.id}
              className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${
                liq.side === 'long'
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/30'
                  : 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30'
              }`}
            >
              <div
                className={`p-2 rounded-lg ${
                  liq.side === 'long'
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-green-100 dark:bg-green-900/30'
                }`}
              >
                {liq.side === 'long' ? (
                  <ArrowTrendingDownIcon className="w-5 h-5 text-red-600 dark:text-red-400" />
                ) : (
                  <ArrowTrendingUpIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">{liq.symbol}</span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded uppercase ${
                      liq.side === 'long'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    }`}
                  >
                    {liq.side}
                  </span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {liq.exchange}
                  {liq.price > 0 && <> · {formatPrice(liq.price)}</>}
                </div>
              </div>

              <div className="text-right">
                <div className="font-bold text-slate-900 dark:text-white font-mono">
                  {formatAmount(liq.amount)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {formatTime(liq.timestamp)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Source Attribution */}
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Live data from Binance Futures Force Orders. Shows liquidations above $5,000.
        {connected && ' · WebSocket connected'}
      </p>
    </div>
  );
}
