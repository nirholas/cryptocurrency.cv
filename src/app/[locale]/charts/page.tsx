'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

// Dynamic imports to avoid SSR issues with TradingView widgets
const TradingViewWidget = dynamic(
  () => import('@/components/charts/TradingViewWidget'),
  { ssr: false, loading: () => <ChartSkeleton height={500} /> }
);

const TradingViewMiniChart = dynamic(
  () => import('@/components/charts/TradingViewMiniChart'),
  { ssr: false, loading: () => <ChartSkeleton height={220} /> }
);

const TradingViewTicker = dynamic(
  () => import('@/components/charts/TradingViewTicker'),
  { ssr: false, loading: () => <div className="h-12 bg-gray-200 dark:bg-gray-800 animate-pulse rounded" /> }
);

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div 
      className="bg-gray-200 dark:bg-gray-800 animate-pulse rounded-xl"
      style={{ height }}
    />
  );
}

const POPULAR_PAIRS = [
  { symbol: 'BINANCE:BTCUSDT', name: 'Bitcoin', shortName: 'BTC' },
  { symbol: 'BINANCE:ETHUSDT', name: 'Ethereum', shortName: 'ETH' },
  { symbol: 'BINANCE:SOLUSDT', name: 'Solana', shortName: 'SOL' },
  { symbol: 'BINANCE:BNBUSDT', name: 'BNB', shortName: 'BNB' },
  { symbol: 'BINANCE:XRPUSDT', name: 'XRP', shortName: 'XRP' },
  { symbol: 'BINANCE:ADAUSDT', name: 'Cardano', shortName: 'ADA' },
  { symbol: 'BINANCE:DOGEUSDT', name: 'Dogecoin', shortName: 'DOGE' },
  { symbol: 'BINANCE:AVAXUSDT', name: 'Avalanche', shortName: 'AVAX' },
];

const INTERVALS = [
  { value: '1', label: '1m' },
  { value: '5', label: '5m' },
  { value: '15', label: '15m' },
  { value: '60', label: '1H' },
  { value: '240', label: '4H' },
  { value: 'D', label: '1D' },
  { value: 'W', label: '1W' },
  { value: 'M', label: '1M' },
];

export default function ChartsPage() {
  const [selectedPair, setSelectedPair] = useState(POPULAR_PAIRS[0]);
  const [interval, setInterval] = useState('D');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Ticker Tape */}
      <div className="border-b border-gray-200 dark:border-gray-800">
        <TradingViewTicker 
          symbols={POPULAR_PAIRS.map(p => ({ proName: p.symbol, title: p.name }))}
          theme={theme} 
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              📈 TradingView Charts
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Professional trading charts with technical analysis tools
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Pair Selection */}
            <div className="flex-1">
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Trading Pair
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_PAIRS.map((pair) => (
                  <button
                    key={pair.symbol}
                    onClick={() => setSelectedPair(pair)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedPair.symbol === pair.symbol
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {pair.shortName}
                  </button>
                ))}
              </div>
            </div>

            {/* Interval Selection */}
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Interval
              </p>
              <div className="flex gap-1">
                {INTERVALS.map((int) => (
                  <button
                    key={int.value}
                    onClick={() => setInterval(int.value)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      interval === int.value
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {int.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Theme Toggle */}
            <div>
              <p className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setTheme('light')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'light'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Light
                </button>
                <button
                  onClick={() => setTheme('dark')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Dark
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {selectedPair.name} ({selectedPair.shortName}/USDT)
            </h2>
          </div>
          <TradingViewWidget
            symbol={selectedPair.symbol}
            interval={interval}
            theme={theme}
            height={600}
            allowSymbolChange={true}
          />
        </div>

        {/* Mini Charts Grid */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Overview
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {POPULAR_PAIRS.slice(0, 4).map((pair) => (
              <button
                key={pair.symbol}
                onClick={() => setSelectedPair(pair)}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:border-blue-500 transition-colors text-left w-full"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                  {pair.name}
                </div>
                <TradingViewMiniChart
                  symbol={pair.symbol}
                  theme={theme}
                  height={180}
                  dateRange="1M"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
            📊 About TradingView Charts
          </h3>
          <p className="text-blue-800 dark:text-blue-200 text-sm">
            These professional-grade charts are powered by TradingView, featuring over 100 technical indicators,
            drawing tools, and real-time data from major exchanges. Use the controls above to customize your
            view, or click on any mini chart to focus on that asset.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded text-xs">
              100+ Indicators
            </span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded text-xs">
              Drawing Tools
            </span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded text-xs">
              Real-Time Data
            </span>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded text-xs">
              Multi-Timeframe
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
