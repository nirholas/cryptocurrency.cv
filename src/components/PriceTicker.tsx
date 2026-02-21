/**
 * Live Price Ticker Bar
 * Inspired by The Block's LMAX Digital live ticker strip
 * Displays scrolling crypto prices with live indicator
 */

import Link from 'next/link';
import { getTopCoins, getFearGreedIndex, formatPrice, formatPercent, getFearGreedColor } from '@/lib/market-data';

interface PriceTickerProps {
  className?: string;
}

export default async function PriceTicker({ className = '' }: PriceTickerProps) {
  const [coins, fearGreed] = await Promise.all([
    getTopCoins(10),
    getFearGreedIndex(),
  ]);

  const tickerCoins = coins.map((coin: any) => ({
    id: coin.id,
    symbol: (coin.symbol || '').toUpperCase(),
    name: coin.name,
    image: coin.image,
    price: coin.current_price,
    change: coin.price_change_percentage_24h,
  }));

  return (
    <div 
      className={`bg-black text-white py-1.5 border-b border-gray-800 overflow-hidden ${className}`}
      role="region"
      aria-label="Cryptocurrency prices"
    >
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex items-center gap-4 text-[13px] overflow-x-auto scrollbar-hide">
          {/* Live indicator */}
          <div className="flex items-center gap-2 pr-4 border-r border-gray-700 flex-shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            <span className="text-gray-400 font-medium text-xs uppercase tracking-wider">Live</span>
          </div>

          {/* Scrolling price tickers */}
          <ul className="flex items-center gap-5 overflow-x-auto scrollbar-hide list-none" aria-label="Current prices">
            {tickerCoins.map((coin) => {
              const isPositive = (coin.change || 0) >= 0;
              return (
                <li key={coin.symbol}>
                <Link
                  href={`/coin/${coin.id}`}
                  className="flex items-center gap-1.5 whitespace-nowrap hover:opacity-80 transition-opacity"
                >
                  <span className="text-gray-500 font-semibold">{coin.symbol}USD</span>
                  <span className="font-bold text-white tabular-nums">{formatPrice(coin.price)}</span>
                  <span 
                    className={`text-xs font-semibold tabular-nums ${
                      isPositive ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {isPositive ? '+' : ''}{coin.change?.toFixed(2)}%
                  </span>
                </Link>
                </li>
              );
            })}
          </ul>

          {/* Fear & Greed Index - right side */}
          {fearGreed && (
            <div 
              className="flex items-center gap-2 whitespace-nowrap border-l border-gray-700 pl-4 ml-auto flex-shrink-0"
              aria-label={`Fear and Greed Index: ${fearGreed.value}, ${fearGreed.value_classification}`}
            >
              <span className="text-gray-500 text-xs uppercase tracking-wide font-medium">F&G</span>
              <span className={`font-bold text-sm ${getFearGreedColor(Number(fearGreed.value))}`}>
                {fearGreed.value}
              </span>
              <span className="text-gray-600 text-xs hidden sm:inline">
                {fearGreed.value_classification}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
