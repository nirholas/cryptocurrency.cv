'use client';

/**
 * Trending Section Component
 * Displays trending coins and top gainers/losers
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { TrendingCoin, TokenPrice } from '@/lib/market-data';
import { formatPercent } from '@/lib/market-data';

interface TrendingSectionProps {
  trending: TrendingCoin[];
  coins: TokenPrice[];
}

type GainersLosersTab = 'gainers' | 'losers';

export default function TrendingSection({ trending, coins }: TrendingSectionProps) {
  const [activeTab, setActiveTab] = useState<GainersLosersTab>('gainers');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Sort coins by 24h change
  const sortedCoins = [...coins].sort(
    (a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0)
  );

  const topGainers = sortedCoins.slice(0, 5);
  const topLosers = sortedCoins.slice(-5).reverse();
  const displayList = activeTab === 'gainers' ? topGainers : topLosers;

  return (
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      {/* Trending Coins */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span>🔥</span>
            <span>Trending</span>
          </h2>
          <Link 
            href="/markets/trending" 
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All →
          </Link>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {trending.slice(0, 7).map((coin, index) => (
            <Link
              key={coin.id}
              href={`/coin/${coin.id}`}
              className="flex-shrink-0 flex items-center gap-2 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-3 py-2 transition-colors"
            >
              <span className="text-gray-400 text-xs font-medium">{index + 1}</span>
              <div className="relative w-6 h-6">
                {coin.thumb && (
                  <Image
                    src={coin.thumb}
                    alt={coin.name}
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                )}
              </div>
              <span className="font-medium text-sm">{coin.symbol.toUpperCase()}</span>
              {coin.market_cap_rank && (
                <span className="text-gray-400 text-xs">#{coin.market_cap_rank}</span>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Top Gainers/Losers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <span>{activeTab === 'gainers' ? '📈' : '📉'}</span>
              <span>Top {activeTab === 'gainers' ? 'Gainers' : 'Losers'}</span>
            </h2>
          </div>
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('gainers')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'gainers'
                  ? 'bg-white dark:bg-gray-600 text-green-600 dark:text-green-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Gainers
            </button>
            <button
              onClick={() => setActiveTab('losers')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'losers'
                  ? 'bg-white dark:bg-gray-600 text-red-600 dark:text-red-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Losers
            </button>
          </div>
        </div>
        <div className="space-y-2">
          {mounted && displayList.map((coin) => (
            <Link
              key={coin.id}
              href={`/coin/${coin.id}`}
              className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg px-2 py-1.5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="relative w-6 h-6">
                  {coin.image && (
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      fill
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <span className="font-medium text-sm">{coin.symbol.toUpperCase()}</span>
                <span className="text-gray-500 text-xs hidden sm:inline">{coin.name}</span>
              </div>
              <span
                className={`font-semibold text-sm ${
                  (coin.price_change_percentage_24h || 0) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatPercent(coin.price_change_percentage_24h)}
              </span>
            </Link>
          ))}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <Link
            href={activeTab === 'gainers' ? '/markets/gainers' : '/markets/losers'}
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            View All {activeTab === 'gainers' ? 'Gainers' : 'Losers'} →
          </Link>
        </div>
      </div>
    </div>
  );
}
