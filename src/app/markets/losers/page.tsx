/**
 * Top Losers Page
 * Shows cryptocurrencies with the highest 24h losses
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { getTopCoins, formatPrice, formatPercent, formatNumber } from '@/lib/market-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top Losers - Crypto Markets - Free Crypto News',
  description: 'Cryptocurrencies with the highest price losses in the last 24 hours.',
};

export const revalidate = 60;

export default async function LosersPage() {
  const coins = await getTopCoins(250);
  
  // Sort by 24h change (ascending) and filter losers
  const losers = coins
    .filter((c) => (c.price_change_percentage_24h || 0) < 0)
    .sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0))
    .slice(0, 100);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Link href="/markets" className="hover:text-blue-600 dark:hover:text-blue-400">
              Markets
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Losers</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📉 Top Losers
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Cryptocurrencies with the highest 24h price drops
            </p>
          </div>

          {/* Losers Table */}
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
                  {losers.map((coin, index) => (
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
                      <td className="p-4 text-right font-semibold text-red-600 dark:text-red-400">
                        {formatPercent(coin.price_change_percentage_24h)}
                      </td>
                      <td className={`p-4 text-right hidden md:table-cell ${
                        (coin.price_change_percentage_7d_in_currency || 0) >= 0
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

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link
              href="/markets"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to Markets
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
