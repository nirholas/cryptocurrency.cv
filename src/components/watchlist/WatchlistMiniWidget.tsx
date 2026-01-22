'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ChevronRight, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useWatchlist } from './WatchlistProvider';

interface WatchlistCoin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  image?: string;
}

interface WatchlistMiniWidgetProps {
  coins?: WatchlistCoin[];
  maxItems?: number;
  className?: string;
}

export function WatchlistMiniWidget({ 
  coins = [], 
  maxItems = 5,
  className = '' 
}: WatchlistMiniWidgetProps) {
  const { watchlist, isLoaded, removeFromWatchlist } = useWatchlist();
  
  // Filter coins data to only show watchlisted coins
  const watchlistedCoins = coins.filter(coin => watchlist.includes(coin.id));
  const displayCoins = watchlistedCoins.slice(0, maxItems);
  const hasMore = watchlistedCoins.length > maxItems;
  
  if (!isLoaded) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Watchlist</h3>
        </div>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (watchlist.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Watchlist</h3>
        </div>
        <div className="text-center py-6">
          <Star className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Your watchlist is empty
          </p>
          <Link
            href="/markets"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            Browse markets →
          </Link>
        </div>
      </div>
    );
  }

  // If we have watchlist but no coin data available
  if (displayCoins.length === 0 && watchlist.length > 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Watchlist</h3>
            <span className="text-xs bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
              {watchlist.length}
            </span>
          </div>
          <Link
            href="/watchlist"
            className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-2">
          {watchlist.slice(0, maxItems).map(coinId => (
            <div key={coinId} className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                {coinId.replace(/-/g, ' ')}
              </span>
              <button
                onClick={() => removeFromWatchlist(coinId)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Watchlist</h3>
          <span className="text-xs bg-yellow-100 dark:bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 px-2 py-0.5 rounded-full">
            {watchlist.length}
          </span>
        </div>
        <Link
          href="/watchlist"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          View all <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="space-y-2">
        {displayCoins.map(coin => (
          <Link
            key={coin.id}
            href={`/coin/${coin.id}`}
            className="flex items-center justify-between py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-3">
              {coin.image ? (
                <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{coin.symbol.toUpperCase()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{coin.name}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
              </p>
              <p className={`text-xs flex items-center justify-end gap-0.5 ${
                coin.change24h >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {coin.change24h >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(coin.change24h).toFixed(2)}%
              </p>
            </div>
          </Link>
        ))}

        {hasMore && (
          <Link
            href="/watchlist"
            className="block text-center py-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
          >
            +{watchlistedCoins.length - maxItems} more coins
          </Link>
        )}
      </div>
    </div>
  );
}

export default WatchlistMiniWidget;
