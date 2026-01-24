'use client';

import { useState, useMemo } from 'react';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
}

type TimeFrame = '24h' | '7d';
type SortBy = 'market_cap' | 'change';

interface HeatmapProps {
  coins: Coin[];
}

const getChangeValue = (coin: Coin, timeframe: TimeFrame): number => {
  if (timeframe === '7d') {
    return coin.price_change_percentage_7d_in_currency ?? coin.price_change_percentage_24h ?? 0;
  }
  return coin.price_change_percentage_24h ?? 0;
};

const getBackgroundColor = (change: number): string => {
  // Monochrome gradient: darker = more negative, lighter = more positive
  // Using opacity on black/white for smooth gradient
  const absChange = Math.min(Math.abs(change), 20); // Cap at 20% for color scaling
  const intensity = absChange / 20; // 0-1 scale

  if (change >= 0) {
    // Positive: white with varying opacity overlay
    const lightness = 95 - intensity * 40; // 95% to 55%
    return `hsl(0, 0%, ${lightness}%)`;
  } else {
    // Negative: dark with varying intensity
    const lightness = 45 - intensity * 35; // 45% to 10%
    return `hsl(0, 0%, ${lightness}%)`;
  }
};

const getTextColor = (change: number): string => {
  const absChange = Math.min(Math.abs(change), 20);
  const intensity = absChange / 20;

  if (change >= 0) {
    // On light background, use dark text
    return intensity > 0.3 ? 'text-slate-900' : 'text-slate-700';
  } else {
    // On dark background, use light text
    return 'text-white';
  }
};

const formatPercent = (pct: number): string => {
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
};

const formatPrice = (price: number): string => {
  if (price >= 1000) return `$${(price / 1000).toFixed(1)}k`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
};

const formatMarketCap = (mc: number): string => {
  if (mc >= 1e12) return `${(mc / 1e12).toFixed(1)}T`;
  if (mc >= 1e9) return `${(mc / 1e9).toFixed(1)}B`;
  if (mc >= 1e6) return `${(mc / 1e6).toFixed(1)}M`;
  return `${(mc / 1e3).toFixed(1)}K`;
};

// Calculate relative size based on market cap (square root for better visual distribution)
const getRelativeSize = (marketCap: number, maxMarketCap: number): number => {
  const minSize = 0.4;
  const ratio = Math.sqrt(marketCap) / Math.sqrt(maxMarketCap);
  return minSize + ratio * (1 - minSize);
};

export function Heatmap({ coins }: HeatmapProps) {
  const [timeframe, setTimeframe] = useState<TimeFrame>('24h');
  const [sortBy, setSortBy] = useState<SortBy>('market_cap');
  const [showTop, setShowTop] = useState<number>(100);

  const processedCoins = useMemo(() => {
    const filtered = coins.slice(0, showTop);
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'change') {
        return Math.abs(getChangeValue(b, timeframe)) - Math.abs(getChangeValue(a, timeframe));
      }
      return b.market_cap - a.market_cap;
    });
    return sorted;
  }, [coins, showTop, sortBy, timeframe]);

  const maxMarketCap = useMemo(() => {
    return Math.max(...processedCoins.map((c) => c.market_cap));
  }, [processedCoins]);

  const stats = useMemo(() => {
    const changes = processedCoins.map((c) => getChangeValue(c, timeframe));
    const positive = changes.filter((c) => c > 0).length;
    const negative = changes.filter((c) => c < 0).length;
    const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
    const maxGain = Math.max(...changes);
    const maxLoss = Math.min(...changes);
    return { positive, negative, avgChange, maxGain, maxLoss };
  }, [processedCoins, timeframe]);

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Timeframe Toggle */}
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-slate-700 p-1">
            {(['24h', '7d'] as TimeFrame[]).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  timeframe === tf
                    ? 'bg-black dark:bg-white text-white dark:text-slate-900'
                    : 'text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Sort Toggle */}
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-slate-700 p-1">
            <button
              onClick={() => setSortBy('market_cap')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                sortBy === 'market_cap'
                  ? 'bg-black dark:bg-white text-white dark:text-slate-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              By Market Cap
            </button>
            <button
              onClick={() => setSortBy('change')}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
                sortBy === 'change'
                  ? 'bg-black dark:bg-white text-white dark:text-slate-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              By Change
            </button>
          </div>

          {/* Count Selector */}
          <select
            value={showTop}
            onChange={(e) => setShowTop(Number(e.target.value))}
            className="px-3 py-2 text-sm border border-gray-300 dark:border-slate-700 rounded-lg bg-white dark:bg-black text-slate-900 dark:text-white"
          >
            <option value={25}>Top 25</option>
            <option value={50}>Top 50</option>
            <option value={100}>Top 100</option>
            <option value={200}>Top 200</option>
          </select>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <ArrowUpIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-slate-900 dark:text-white font-medium">{stats.positive}</span>
            <span className="text-gray-500">up</span>
          </div>
          <div className="flex items-center gap-2">
            <ArrowDownIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-slate-900 dark:text-white font-medium">{stats.negative}</span>
            <span className="text-gray-500">down</span>
          </div>
          <div className="text-gray-500">
            Avg:{' '}
            <span
              className={`font-medium ${stats.avgChange >= 0 ? 'text-slate-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {formatPercent(stats.avgChange)}
            </span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <span>-20%</span>
        <div className="flex h-3">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-4"
              style={{ backgroundColor: getBackgroundColor(-20 + i * 2) }}
            />
          ))}
        </div>
        <span>+20%</span>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-1">
        {processedCoins.map((coin) => {
          const change = getChangeValue(coin, timeframe);
          const bgColor = getBackgroundColor(change);
          const textColor = getTextColor(change);
          const relativeSize = getRelativeSize(coin.market_cap, maxMarketCap);

          return (
            <a
              key={coin.id}
              href={`/coin/${coin.id}`}
              className="group relative aspect-square flex flex-col items-center justify-center p-1 rounded-lg transition-transform hover:scale-105 hover:z-10 hover:shadow-lg overflow-hidden"
              style={{ backgroundColor: bgColor }}
              title={`${coin.name} (${coin.symbol.toUpperCase()})\nPrice: ${formatPrice(coin.current_price)}\nChange: ${formatPercent(change)}\nMarket Cap: $${formatMarketCap(coin.market_cap)}`}
            >
              <div
                className="flex flex-col items-center justify-center w-full h-full"
                style={{ transform: `scale(${relativeSize})` }}
              >
                <img
                  src={coin.image}
                  alt={coin.name}
                  className="w-6 h-6 rounded-full mb-0.5 opacity-90"
                />
                <span className={`text-xs font-bold uppercase ${textColor}`}>{coin.symbol}</span>
                <span className={`text-[10px] font-mono ${textColor} opacity-90`}>
                  {formatPercent(change)}
                </span>
              </div>

              {/* Hover tooltip */}
              <div className="absolute inset-0 bg-black/95 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 rounded-lg">
                <span className="text-xs font-bold truncate w-full text-center">{coin.name}</span>
                <span className="text-xs font-mono">{formatPrice(coin.current_price)}</span>
                <span className="text-xs font-mono">{formatPercent(change)}</span>
                <span className="text-[10px] text-gray-400">
                  ${formatMarketCap(coin.market_cap)}
                </span>
              </div>
            </a>
          );
        })}
      </div>

      {/* Market Mood Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-slate-700">
        <div className="text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">Biggest Gainer</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {processedCoins
              .find((c) => getChangeValue(c, timeframe) === stats.maxGain)
              ?.symbol.toUpperCase()}
          </div>
          <div className="text-sm font-mono">{formatPercent(stats.maxGain)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">Biggest Loser</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {processedCoins
              .find((c) => getChangeValue(c, timeframe) === stats.maxLoss)
              ?.symbol.toUpperCase()}
          </div>
          <div className="text-sm font-mono">{formatPercent(stats.maxLoss)}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">Up / Down Ratio</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {stats.negative > 0 ? (stats.positive / stats.negative).toFixed(2) : stats.positive}
          </div>
          <div className="text-sm text-gray-500">
            {stats.positive} / {stats.negative}
          </div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">Market Sentiment</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white">
            {stats.avgChange > 2 ? 'Bullish' : stats.avgChange < -2 ? 'Bearish' : 'Neutral'}
          </div>
          <div className="text-sm font-mono">{formatPercent(stats.avgChange)} avg</div>
        </div>
      </div>
    </div>
  );
}
