/**
 * MarketMoversTable — pure black & white
 * Shared table for gainers, losers, and new listings pages.
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
  /** CSS class for the 24h change column — ignored, always white */
  changeColorClass?: string;
}

export default function MarketMoversTable({ coins }: MarketMoversTableProps) {
  return (
    <div className="bg-black rounded-xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/10">
              <th className="text-left text-white/40 text-sm font-medium p-4">#</th>
              <th className="text-left text-white/40 text-sm font-medium p-4">Coin</th>
              <th className="text-right text-white/40 text-sm font-medium p-4">Price</th>
              <th className="text-right text-white/40 text-sm font-medium p-4">24h Change</th>
              <th className="text-right text-white/40 text-sm font-medium p-4 hidden md:table-cell">7d Change</th>
              <th className="text-right text-white/40 text-sm font-medium p-4 hidden lg:table-cell">Market Cap</th>
              <th className="text-right text-white/40 text-sm font-medium p-4 hidden lg:table-cell">Volume (24h)</th>
            </tr>
          </thead>
          <tbody>
            {coins.map((coin, index) => (
              <tr
                key={coin.id}
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="p-4 text-white/40">{index + 1}</td>
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
                      <span className="font-medium text-white">
                        {coin.name}
                      </span>
                      <span className="text-white/40 text-sm ml-2">
                        {coin.symbol.toUpperCase()}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="p-4 text-right font-medium text-white">
                  {formatPrice(coin.current_price)}
                </td>
                <td className="p-4 text-right font-semibold text-white/70">
                  {formatPercent(coin.price_change_percentage_24h)}
                </td>
                <td className="p-4 text-right hidden md:table-cell text-white/70">
                  {formatPercent(coin.price_change_percentage_7d_in_currency)}
                </td>
                <td className="p-4 text-right text-white/60 hidden lg:table-cell">
                  ${formatNumber(coin.market_cap)}
                </td>
                <td className="p-4 text-right text-white/60 hidden lg:table-cell">
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
