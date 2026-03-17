'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/ThemeProvider';
import { Button } from '@/components/ui';
import { ChevronDown, Maximize2, Minimize2 } from 'lucide-react';

// ---------- Types & Constants ------------------------------------------------

const SYMBOLS = [
  { id: 'BINANCE:BTCUSDT', label: 'BTC / USDT' },
  { id: 'BINANCE:ETHUSDT', label: 'ETH / USDT' },
  { id: 'BINANCE:SOLUSDT', label: 'SOL / USDT' },
  { id: 'BINANCE:XRPUSDT', label: 'XRP / USDT' },
  { id: 'BINANCE:ADAUSDT', label: 'ADA / USDT' },
  { id: 'BINANCE:DOGEUSDT', label: 'DOGE / USDT' },
  { id: 'BINANCE:AVAXUSDT', label: 'AVAX / USDT' },
  { id: 'BINANCE:BNBUSDT', label: 'BNB / USDT' },
  { id: 'BINANCE:DOTUSDT', label: 'DOT / USDT' },
  { id: 'BINANCE:MATICUSDT', label: 'MATIC / USDT' },
  { id: 'BINANCE:LINKUSDT', label: 'LINK / USDT' },
  { id: 'BINANCE:NEARUSDT', label: 'NEAR / USDT' },
] as const;

const INTERVALS = [
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '1H', value: '60' },
  { label: '4H', value: '240' },
  { label: '1D', value: 'D' },
  { label: '1W', value: 'W' },
  { label: '1M', value: 'M' },
] as const;

const CHART_STYLES: { label: string; value: string }[] = [
  { label: 'Candles', value: '1' },
  { label: 'Bars', value: '0' },
  { label: 'Line', value: '2' },
  { label: 'Area', value: '3' },
  { label: 'Heikin Ashi', value: '8' },
  { label: 'Hollow', value: '9' },
];

// ---------- Props ------------------------------------------------------------

interface TradingViewChartProps {
  initialSymbol?: string;
  initialInterval?: string;
  height?: number;
  className?: string;
  allowSymbolChange?: boolean;
  showToolbar?: boolean;
}

// ---------- Component --------------------------------------------------------

export default function TradingViewChart({
  initialSymbol = 'BINANCE:BTCUSDT',
  initialInterval = 'D',
  height = 500,
  className,
  allowSymbolChange = true,
  showToolbar = true,
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [symbol, setSymbol] = useState(initialSymbol);
  const [interval, setInterval] = useState(initialInterval);
  const [chartStyle, setChartStyle] = useState('1');
  const [symbolOpen, setSymbolOpen] = useState(false);
  const [styleOpen, setStyleOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const theme = resolvedTheme === 'dark' || resolvedTheme === 'midnight' ? 'dark' : 'light';

  // ---- Build the widget -----------------------------------------------------

  const renderWidget = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous content
    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';

    const innerDiv = document.createElement('div');
    innerDiv.className = 'tradingview-widget-container__widget';
    innerDiv.style.height = '100%';
    innerDiv.style.width = '100%';
    widgetDiv.appendChild(innerDiv);

    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: 'Etc/UTC',
      theme,
      style: chartStyle,
      locale: 'en',
      allow_symbol_change: allowSymbolChange,
      calendar: false,
      support_host: 'https://www.tradingview.com',
      hide_top_toolbar: !showToolbar,
      hide_legend: false,
      save_image: true,
      hide_volume: false,
      withdateranges: true,
      details: true,
      hotlist: false,
      studies: ['STD;RSI', 'STD;MACD'],
    });

    widgetDiv.appendChild(script);
  }, [symbol, interval, theme, chartStyle, allowSymbolChange, showToolbar]);

  useEffect(() => {
    renderWidget();
  }, [renderWidget]);

  // ---- Fullscreen -----------------------------------------------------------

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current?.parentElement;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const onFSChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFSChange);
    return () => document.removeEventListener('fullscreenchange', onFSChange);
  }, []);

  // ---- Render ---------------------------------------------------------------

  return (
    <div
      className={cn(
        'border-border overflow-hidden rounded-xl border bg-(--color-surface)',
        className,
      )}
    >
      {/* Toolbar */}
      <div className="border-border bg-surface-secondary flex flex-wrap items-center gap-2 border-b px-3 py-2">
        {/* Symbol picker */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSymbolOpen(!symbolOpen);
              setStyleOpen(false);
            }}
            className="gap-1 text-xs font-semibold"
          >
            {SYMBOLS.find((s) => s.id === symbol)?.label || symbol}
            <ChevronDown className="h-3 w-3" />
          </Button>

          {symbolOpen && (
            <div className="border-border absolute top-full left-0 z-50 mt-1 max-h-64 w-48 overflow-y-auto rounded-lg border bg-(--color-surface) shadow-lg">
              {SYMBOLS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    setSymbol(s.id);
                    setSymbolOpen(false);
                  }}
                  className={cn(
                    'hover:bg-surface-secondary block w-full px-3 py-2 text-left text-xs transition-colors',
                    symbol === s.id ? 'text-accent font-bold' : 'text-text-primary',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Interval buttons */}
        <div className="bg-surface-tertiary flex items-center gap-0.5 rounded-lg p-0.5">
          {INTERVALS.map((i) => (
            <button
              key={i.value}
              onClick={() => setInterval(i.value)}
              className={cn(
                'rounded-md px-2 py-1 text-[11px] font-medium transition-colors',
                interval === i.value
                  ? 'bg-accent text-white'
                  : 'text-text-secondary hover:text-text-primary',
              )}
            >
              {i.label}
            </button>
          ))}
        </div>

        {/* Chart style picker */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStyleOpen(!styleOpen);
              setSymbolOpen(false);
            }}
            className="gap-1 text-xs"
          >
            {CHART_STYLES.find((s) => s.value === chartStyle)?.label || 'Candles'}
            <ChevronDown className="h-3 w-3" />
          </Button>

          {styleOpen && (
            <div className="border-border absolute top-full right-0 z-50 mt-1 w-36 rounded-lg border bg-(--color-surface) shadow-lg">
              {CHART_STYLES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => {
                    setChartStyle(s.value);
                    setStyleOpen(false);
                  }}
                  className={cn(
                    'hover:bg-surface-secondary block w-full px-3 py-2 text-left text-xs transition-colors',
                    chartStyle === s.value ? 'text-accent font-bold' : 'text-text-primary',
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Fullscreen toggle */}
        <Button variant="ghost" size="sm" onClick={toggleFullscreen} className="p-1">
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Chart container */}
      <div
        ref={containerRef}
        style={{ height: isFullscreen ? 'calc(100vh - 48px)' : height }}
        className="w-full"
      />
    </div>
  );
}
