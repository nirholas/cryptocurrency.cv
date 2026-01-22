/**
 * Newly Listed Coins Page
 * Shows recently added cryptocurrencies
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { getTopCoins, formatPrice, formatPercent, formatNumber } from '@/lib/market-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Newly Listed Coins - Crypto Markets - Free Crypto News',
  description: 'Discover newly listed cryptocurrencies and recent additions to the market.',
};

export const revalidate = 60;

export default async function NewCoinsPage() {
  const coins = await getTopCoins(250);
  
  // Sort by last_updated to get recently active coins
  // Note: In a real implementation, you'd want a dedicated "new listings" API
  const newCoins = [...coins]
    .sort((a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime())
    .slice(0, 50);

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
            <span className="text-gray-900 dark:text-white">New Listings</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🆕 Newly Listed Coins
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Recently updated cryptocurrencies on the market
            </p>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  New listing alert
                </p>
                <p className="text-blue-600 dark:text-blue-300 text-sm">
                  New cryptocurrencies can be highly volatile. Always do your own research before investing.
                </p>
              </div>
            </div>
          </div>

          {/* New Coins Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {newCoins.map((coin) => (
              <Link
                key={coin.id}
                href={`/coin/${coin.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="relative w-10 h-10">
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">
                      {coin.name}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                      {coin.symbol.toUpperCase()} • #{coin.market_cap_rank}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {formatPrice(coin.current_price)}
                  </span>
                  <span
                    className={`font-medium ${
                      (coin.price_change_percentage_24h || 0) >= 0
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {formatPercent(coin.price_change_percentage_24h)}
                  </span>
                </div>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  MCap: ${formatNumber(coin.market_cap)}
                </div>
              </Link>
            ))}
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
