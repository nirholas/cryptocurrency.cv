/**
 * MarketMoversTable — shared table for gainers, losers, and new listings pages.
 */

import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, formatPercent, formatNumber } from '@/lib/market-data';

interface Coin {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  current_price: number;
  market_cap: number;
  total_volume: number;
  price_change_percentage_24h?: number | null;
  price_change_percentage_7d_in_currency?: number | null;
}

interface MarketMoversTableProps {
  coins: Coin[];
  /** CSS class for the 24h change column (e.g. text-green-600 or text-red-600) */
  changeColorClass?: string;
}

export default function MarketMoversTable({ coins, changeColorClass }: MarketMoversTableProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-medium p-4">#</th>
              <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-medium p-4">Coin</th>
              <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4">Price</th>
              <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4">24h Change</th>
              <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4 hidden md:table-cell">7d Change</th>
              <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4 hidden lg:table-cell">Market Cap</th>
              <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4 hidden lg:table-cell">Volume (24h)</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin, index) => (
              <tr
                key={coin.id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <td className="p-4 text-gray-500 dark:text-gray-400">{index + 1}</td>
                <td className="p-4">
                  <Link href={`/coin/${coin.id}`} className="flex items-center gap-3">
                    <div className="relative w-8 h-8">
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
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                        {coin.name}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                        {coin.symbol.toUpperCase()}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                  {formatPrice(coin.current_price)}
                </td>
                <td className={`p-4 text-right font-semibold ${changeColorClass ?? ((coin.price_change_percentage_24h ?? 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}`}>
                  {formatPercent(coin.price_change_percentage_24h)}
                </td>
                <td className={`p-4 text-right hidden md:table-cell ${
                  (coin.price_change_percentage_7d_in_currency ?? 0) >= 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatPercent(coin.price_change_percentage_7d_in_currency)}
                </td>
                <td className="p-4 text-right text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                  ${formatNumber(coin.market_cap)}
                </td>
                <td className="p-4 text-right text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                  ${formatNumber(coin.total_volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
