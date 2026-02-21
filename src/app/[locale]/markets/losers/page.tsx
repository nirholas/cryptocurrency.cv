/**
 * Top Losers Page
 * Shows cryptocurrencies with the highest 24h losses
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { getTopCoins } from '@/lib/market-data';
import MarketMoversTable from '../components/MarketMoversTable';
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
          <MarketMoversTable coins={losers} changeColorClass="text-red-600 dark:text-red-400" />

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
