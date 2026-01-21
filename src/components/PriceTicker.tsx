/**
 * Live Price Ticker Bar
 * Displays BTC, ETH, SOL prices with 24h change
 */

import { getSimplePrices, getFearGreedIndex, formatPrice, formatPercent, getFearGreedColor } from '@/lib/market-data';

interface PriceTickerProps {
  className?: string;
}

export default async function PriceTicker({ className = '' }: PriceTickerProps) {
  const [prices, fearGreed] = await Promise.all([
    getSimplePrices(),
    getFearGreedIndex(),
  ]);

  const coins = [
    { 
      symbol: 'BTC', 
      name: 'Bitcoin',
      icon: '₿',
      color: 'text-orange-400',
      price: prices.bitcoin?.usd,
      change: prices.bitcoin?.usd_24h_change,
    },
    { 
      symbol: 'ETH', 
      name: 'Ethereum',
      icon: 'Ξ',
      color: 'text-purple-400',
      price: prices.ethereum?.usd,
      change: prices.ethereum?.usd_24h_change,
    },
    { 
      symbol: 'SOL', 
      name: 'Solana',
      icon: '◎',
      color: 'text-gradient-to-r from-purple-400 to-green-400',
      price: prices.solana?.usd,
      change: prices.solana?.usd_24h_change,
    },
  ];

  return (
    <div className={`bg-gray-900 text-white py-2 overflow-hidden ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 text-sm overflow-x-auto">
          {/* Price Tickers */}
          <div className="flex items-center gap-6">
            {coins.map((coin) => (
              <div key={coin.symbol} className="flex items-center gap-2 whitespace-nowrap">
                <span className={coin.color}>{coin.icon}</span>
                <span className="text-gray-400">{coin.symbol}</span>
                <span className="font-medium">{formatPrice(coin.price)}</span>
                <span className={`text-xs ${(coin.change || 0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {formatPercent(coin.change)}
                </span>
              </div>
            ))}
          </div>

          {/* Fear & Greed Index */}
          {fearGreed && (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <span className="text-gray-400">Fear & Greed:</span>
              <span className={`font-bold ${getFearGreedColor(Number(fearGreed.value))}`}>
                {fearGreed.value}
              </span>
              <span className="text-gray-500 text-xs">
                ({fearGreed.value_classification})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
