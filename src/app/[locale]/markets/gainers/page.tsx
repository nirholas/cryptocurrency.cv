/**
 * Top Gainers Page
 * Shows cryptocurrencies with the highest 24h gains
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getTopCoins } from '@/lib/market-data';
import MarketMoversTable from '../components/MarketMoversTable';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top Gainers - Crypto Markets - Free Crypto News',
  description: 'Cryptocurrencies with the highest price gains in the last 24 hours.',
};

export const revalidate = 60;

export default async function GainersPage() {
  const coins = await getTopCoins(250);
  
  // Sort by 24h change (descending) and filter gainers
  const gainers = coins
    .filter((c) => (c.price_change_percentage_24h || 0) > 0)
    .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
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
            <span className="text-gray-900 dark:text-white">Gainers</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📈 Top Gainers
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Cryptocurrencies with the highest 24h price gains
            </p>
          </div>

          {/* Gainers Table */}
          <MarketMoversTable coins={gainers} changeColorClass="text-green-600 dark:text-green-400" />

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
