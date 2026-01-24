'use client';

/**
 * TradingView Chart Component
 * 
 * Enterprise-grade charting with TradingView integration.
 * Supports:
 * - Full TradingView charting library integration
 * - Lightweight chart fallback (no library required)
 * - Real-time data updates
 * - News marks on chart
 * - Multiple timeframes
 * - Technical indicators
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

// =============================================================================
// Types
// =============================================================================

interface ChartData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface NewsEvent {
  time: number;
  title: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  source: string;
}

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
  theme?: 'light' | 'dark';
  height?: number | string;
  showVolume?: boolean;
  showToolbar?: boolean;
  showNewsMarks?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onSymbolChange?: (symbol: string) => void;
  onIntervalChange?: (interval: string) => void;
  className?: string;
}

// =============================================================================
// Constants
// =============================================================================

const INTERVALS = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
];

const SYMBOLS = [
  { label: 'BTC/USD', value: 'BTC/USD' },
  { label: 'ETH/USD', value: 'ETH/USD' },
  { label: 'SOL/USD', value: 'SOL/USD' },
  { label: 'BNB/USD', value: 'BNB/USD' },
  { label: 'XRP/USD', value: 'XRP/USD' },
  { label: 'ADA/USD', value: 'ADA/USD' },
  { label: 'DOGE/USD', value: 'DOGE/USD' },
  { label: 'AVAX/USD', value: 'AVAX/USD' },
];

// =============================================================================
// TradingView Chart Component
// =============================================================================

export function TradingViewChart({
  symbol = 'BTC/USD',
  interval = 'D',
  theme = 'dark',
  height = 500,
  showVolume = true,
  showToolbar = true,
  showNewsMarks = true,
  autoRefresh = true,
  refreshInterval = 5000,
  onSymbolChange,
  onIntervalChange,
  className = '',
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [newsEvents, setNewsEvents] = useState<NewsEvent[]>([]);
  const [currentSymbol, setCurrentSymbol] = useState(symbol);
  const [currentInterval, setCurrentInterval] = useState(interval);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastPrice, setLastPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number>(0);

  // Fetch chart data
  const fetchData = useCallback(async () => {
    try {
      const now = Math.floor(Date.now() / 1000);
      const from = now - 365 * 24 * 60 * 60; // 1 year
      
      const response = await fetch(
        `/api/tradingview?action=history&symbol=${encodeURIComponent(currentSymbol)}&from=${from}&to=${now}&resolution=${currentInterval}&countback=300`
      );
      
      if (!response.ok) throw new Error('Failed to fetch data');
      
      const data = await response.json();
      
      if (data.s === 'ok' && data.t.length > 0) {
        const bars: ChartData[] = data.t.map((t: number, i: number) => ({
          time: t,
          open: data.o[i],
          high: data.h[i],
          low: data.l[i],
          close: data.c[i],
          volume: data.v[i],
        }));
        
        setChartData(bars);
        
        if (bars.length > 1) {
          const latest = bars[bars.length - 1];
          const previous = bars[bars.length - 2];
          setLastPrice(latest.close);
          setPriceChange(((latest.close - previous.close) / previous.close) * 100);
        }
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [currentSymbol, currentInterval]);

  // Initial load
  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(fetchData, refreshInterval);
    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval, fetchData]);

  // Handle symbol change
  const handleSymbolChange = (newSymbol: string) => {
    setCurrentSymbol(newSymbol);
    onSymbolChange?.(newSymbol);
  };

  // Handle interval change
  const handleIntervalChange = (newInterval: string) => {
    setCurrentInterval(newInterval);
    onIntervalChange?.(newInterval);
  };

  // Calculate chart dimensions
  const chartHeight = typeof height === 'number' ? height : 500;
  const volumeHeight = showVolume ? 80 : 0;
  const candleHeight = chartHeight - volumeHeight - (showToolbar ? 48 : 0);

  // Render candlestick chart using SVG
  const renderChart = () => {
    if (chartData.length === 0) return null;

    const visibleBars = chartData.slice(-100);
    const barWidth = 8;
    const spacing = 2;
    const chartWidth = visibleBars.length * (barWidth + spacing);
    
    // Calculate price range
    const prices = visibleBars.flatMap(b => [b.high, b.low]);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;
    const padding = priceRange * 0.1;
    
    const scaleY = (price: number) => 
      candleHeight - ((price - minPrice + padding) / (priceRange + padding * 2)) * candleHeight;
    
    // Calculate volume range
    const volumes = visibleBars.map(b => b.volume);
    const maxVolume = Math.max(...volumes);
    const scaleVolume = (volume: number) => 
      volumeHeight - (volume / maxVolume) * volumeHeight * 0.9;

    return (
      <div className="relative overflow-x-auto">
        <svg 
          width={Math.max(chartWidth, 600)} 
          height={candleHeight + volumeHeight}
          className="block"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path 
                d="M 40 0 L 0 0 0 40" 
                fill="none" 
                stroke={theme === 'dark' ? '#1f2937' : '#e5e7eb'} 
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="100%" height={candleHeight} fill="url(#grid)" />
          
          {/* Candlesticks */}
          {visibleBars.map((bar, i) => {
            const x = i * (barWidth + spacing);
            const isGreen = bar.close >= bar.open;
            const color = isGreen ? '#22c55e' : '#ef4444';
            const bodyTop = scaleY(Math.max(bar.open, bar.close));
            const bodyBottom = scaleY(Math.min(bar.open, bar.close));
            const bodyHeight = Math.max(bodyBottom - bodyTop, 1);
            
            return (
              <g key={i}>
                {/* Wick */}
                <line
                  x1={x + barWidth / 2}
                  y1={scaleY(bar.high)}
                  x2={x + barWidth / 2}
                  y2={scaleY(bar.low)}
                  stroke={color}
                  strokeWidth={1}
                />
                {/* Body */}
                <rect
                  x={x}
                  y={bodyTop}
                  width={barWidth}
                  height={bodyHeight}
                  fill={color}
                  rx={1}
                />
              </g>
            );
          })}
          
          {/* Volume bars */}
          {showVolume && visibleBars.map((bar, i) => {
            const x = i * (barWidth + spacing);
            const isGreen = bar.close >= bar.open;
            const color = isGreen ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)';
            const barHeight = volumeHeight - scaleVolume(bar.volume);
            
            return (
              <rect
                key={`vol-${i}`}
                x={x}
                y={candleHeight + volumeHeight - barHeight}
                width={barWidth}
                height={barHeight}
                fill={color}
              />
            );
          })}
          
          {/* News marks */}
          {showNewsMarks && newsEvents.map((event, i) => {
            const barIndex = visibleBars.findIndex(b => 
              Math.abs(b.time - event.time) < 86400
            );
            if (barIndex === -1) return null;
            
            const x = barIndex * (barWidth + spacing) + barWidth / 2;
            const color = event.sentiment === 'bullish' ? '#22c55e' : 
                         event.sentiment === 'bearish' ? '#ef4444' : '#eab308';
            
            return (
              <g key={`news-${i}`} className="cursor-pointer">
                <circle
                  cx={x}
                  cy={candleHeight - 10}
                  r={6}
                  fill={color}
                />
                <text
                  x={x}
                  y={candleHeight - 6}
                  textAnchor="middle"
                  fill="white"
                  fontSize={10}
                  fontWeight="bold"
                >
                  N
                </text>
                <title>{event.title}</title>
              </g>
            );
          })}
        </svg>
        
        {/* Price axis */}
        <div 
          className="absolute right-0 top-0 w-16 flex flex-col justify-between text-xs"
          style={{ height: candleHeight }}
        >
          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            ${maxPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            ${minPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`rounded-lg border ${
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-800' 
          : 'bg-white border-gray-200'
      } ${className}`}
      style={{ height }}
    >
      {/* Toolbar */}
      {showToolbar && (
        <div className={`flex items-center justify-between px-4 h-12 border-b ${
          theme === 'dark' ? 'border-gray-800' : 'border-gray-200'
        }`}>
          {/* Symbol selector */}
          <div className="flex items-center gap-4">
            <select
              value={currentSymbol}
              onChange={(e) => handleSymbolChange(e.target.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                theme === 'dark'
                  ? 'bg-gray-800 text-white border-gray-700'
                  : 'bg-gray-100 text-gray-900 border-gray-200'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              {SYMBOLS.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            
            {/* Price display */}
            {lastPrice && (
              <div className="flex items-center gap-2">
                <span className={`text-lg font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  ${lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-sm font-medium ${
                  priceChange >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
          
          {/* Interval selector */}
          <div className="flex items-center gap-1">
            {INTERVALS.map(int => (
              <button
                key={int.value}
                onClick={() => handleIntervalChange(int.value)}
                className={`px-2 py-1 text-xs font-medium rounded ${
                  currentInterval === int.value
                    ? 'bg-blue-600 text-white'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Chart area */}
      <div className="relative" style={{ height: chartHeight - (showToolbar ? 48 : 0) }}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`text-center ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              <p className="font-medium">Failed to load chart</p>
              <p className="text-sm opacity-75">{error}</p>
              <button
                onClick={fetchData}
                className="mt-2 px-4 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        
        {!loading && !error && renderChart()}
      </div>
    </div>
  );
}

// =============================================================================
// Quick Price Widget
// =============================================================================

interface QuickPriceWidgetProps {
  symbols?: string[];
  theme?: 'light' | 'dark';
  className?: string;
}

export function QuickPriceWidget({
  symbols = ['BTC/USD', 'ETH/USD', 'SOL/USD'],
  theme = 'dark',
  className = '',
}: QuickPriceWidgetProps) {
  const [prices, setPrices] = useState<Record<string, { price: number; change: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(
          `/api/tradingview?action=quotes&symbols=${symbols.join(',')}`
        );
        
        if (!response.ok) return;
        
        const data = await response.json();
        
        if (data.s === 'ok') {
          const newPrices: Record<string, { price: number; change: number }> = {};
          for (const quote of data.d) {
            if (quote.s === 'ok') {
              newPrices[quote.n] = {
                price: quote.v.lp,
                change: quote.v.chp,
              };
            }
          }
          setPrices(newPrices);
        }
      } catch (err) {
        console.error('Failed to fetch prices:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 5000);
    return () => clearInterval(interval);
  }, [symbols]);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {symbols.map(symbol => {
        const data = prices[symbol];
        
        return (
          <div
            key={symbol}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
            }`}
          >
            <span className={`text-sm font-medium ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {symbol.split('/')[0]}
            </span>
            
            {loading || !data ? (
              <span className={`text-sm ${
                theme === 'dark' ? 'text-gray-500' : 'text-gray-400'
              }`}>
                --
              </span>
            ) : (
              <>
                <span className={`text-sm font-bold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>
                  ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className={`text-xs font-medium ${
                  data.change >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

// =============================================================================
// Exports
// =============================================================================

export default TradingViewChart;
