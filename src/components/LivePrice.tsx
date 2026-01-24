'use client';

/**
 * Live Price Display Component
 *
 * Shows real-time price updates via WebSocket.
 * Falls back to static price if WebSocket unavailable.
 */

import { useLivePrices, formatLivePrice } from '@/lib/price-websocket';
import { useEffect, useState } from 'react';

interface LivePriceProps {
  coinId: string;
  initialPrice: number;
  className?: string;
  showChange?: boolean;
}

export function LivePrice({
  coinId,
  initialPrice,
  className = '',
  showChange = false,
}: LivePriceProps) {
  const { prices, isConnected } = useLivePrices([coinId]);
  const [previousPrice, setPreviousPrice] = useState(initialPrice);
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);

  const currentPrice = prices[coinId]?.price ?? initialPrice;

  // Flash effect on price change
  useEffect(() => {
    if (currentPrice !== previousPrice) {
      setFlash(currentPrice > previousPrice ? 'up' : 'down');
      setPreviousPrice(currentPrice);

      const timeout = setTimeout(() => setFlash(null), 500);
      return () => clearTimeout(timeout);
    }
  }, [currentPrice, previousPrice]);

  const flashClass = flash === 'up' ? 'bg-green-500/20' : flash === 'down' ? 'bg-red-500/20' : '';

  return (
    <span
      className={`transition-colors duration-300 rounded px-1 ${flashClass} ${className}`}
      title={isConnected ? 'Live price' : 'Price may be delayed'}
    >
      {formatLivePrice(currentPrice)}
      {isConnected && (
        <span
          className="inline-block w-2 h-2 ml-1 bg-green-500 rounded-full animate-pulse"
          title="Live"
        />
      )}
    </span>
  );
}

interface LivePriceTickerProps {
  coins: Array<{
    id: string;
    symbol: string;
    initialPrice: number;
  }>;
}

export function LivePriceTicker({ coins }: LivePriceTickerProps) {
  const coinIds = coins.map((c) => c.id);
  const { prices, isConnected } = useLivePrices(coinIds);

  return (
    <div className="flex items-center gap-4 text-sm">
      {isConnected && (
        <span className="flex items-center gap-1 text-green-500">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          Live
        </span>
      )}
      {coins.map((coin) => {
        const price = prices[coin.id]?.price ?? coin.initialPrice;
        return (
          <div key={coin.id} className="flex items-center gap-1">
            <span className="font-medium text-gray-600 dark:text-gray-400">
              {coin.symbol.toUpperCase()}:
            </span>
            <span className="font-mono">{formatLivePrice(price)}</span>
          </div>
        );
      })}
    </div>
  );
}

interface LivePriceCardProps {
  coinId: string;
  symbol: string;
  name: string;
  initialPrice: number;
  initialChange24h: number;
  image?: string;
}

export function LivePriceCard({
  coinId,
  symbol,
  name,
  initialPrice,
  initialChange24h,
  image,
}: LivePriceCardProps) {
  const { prices, isConnected } = useLivePrices([coinId]);
  const [previousPrice, setPreviousPrice] = useState(initialPrice);

  const currentPrice = prices[coinId]?.price ?? initialPrice;

  // Calculate live change (approximate)
  const priceChange =
    previousPrice > 0 ? ((currentPrice - previousPrice) / previousPrice) * 100 : 0;

  // Use initial 24h change if no live update yet
  const displayChange = isConnected && priceChange !== 0 ? priceChange : initialChange24h;

  return (
    <div className="flex items-center justify-between p-4 bg-white dark:bg-black rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        {image && <img src={image} alt={name} className="w-8 h-8 rounded-full" />}
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">{symbol.toUpperCase()}</div>
        </div>
      </div>

      <div className="text-right">
        <div className="font-mono font-medium flex items-center gap-1">
          {formatLivePrice(currentPrice)}
          {isConnected && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
        </div>
        <div className={`text-sm ${displayChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {displayChange >= 0 ? '+' : ''}
          {displayChange.toFixed(2)}%
        </div>
      </div>
    </div>
  );
}
