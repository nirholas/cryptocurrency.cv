/**
 * Exchanges List Page
 * Shows cryptocurrency exchanges ranked by volume and trust score
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { formatNumber } from '@/lib/market-data';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cryptocurrency Exchanges - Free Crypto News',
  description: 'Browse cryptocurrency exchanges ranked by 24h trading volume and trust score.',
};

export const revalidate = 300; // 5 minutes

// Exchange data type
interface Exchange {
  id: string;
  name: string;
  year_established: number | null;
  country: string | null;
  url: string;
  image: string;
  trust_score: number;
  trust_score_rank: number;
  trade_volume_24h_btc: number;
  trade_volume_24h_btc_normalized: number;
}

// Fetch exchanges from CoinGecko
async function getExchanges(): Promise<Exchange[]> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/exchanges?per_page=100',
      { next: { revalidate: 300 } }
    );
    if (!response.ok) return [];
    return response.json();
  } catch {
    return [];
  }
}

// Trust score color mapping
function getTrustScoreColor(score: number): string {
  if (score >= 9) return 'text-green-600 dark:text-green-400';
  if (score >= 7) return 'text-lime-600 dark:text-lime-400';
  if (score >= 5) return 'text-yellow-600 dark:text-yellow-400';
  if (score >= 3) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
}

function getTrustScoreBg(score: number): string {
  if (score >= 9) return 'bg-green-100 dark:bg-green-900/30';
  if (score >= 7) return 'bg-lime-100 dark:bg-lime-900/30';
  if (score >= 5) return 'bg-yellow-100 dark:bg-yellow-900/30';
  if (score >= 3) return 'bg-orange-100 dark:bg-orange-900/30';
  return 'bg-red-100 dark:bg-red-900/30';
}

// Average BTC price for volume calculation (rough estimate)
const BTC_PRICE_ESTIMATE = 100000;

export default async function ExchangesPage() {
  const exchanges = await getExchanges();

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
            <span className="text-gray-900 dark:text-white">Exchanges</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              🏛️ Cryptocurrency Exchanges
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Top {exchanges.length} exchanges ranked by 24-hour trading volume
            </p>
          </div>

          {/* Exchanges Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-medium p-4">#</th>
                    <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-medium p-4">Exchange</th>
                    <th className="text-center text-gray-500 dark:text-gray-400 text-sm font-medium p-4">Trust Score</th>
                    <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4">24h Volume (BTC)</th>
                    <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4 hidden md:table-cell">24h Volume (USD)</th>
                    <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4 hidden lg:table-cell">Year Est.</th>
                    <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4 hidden lg:table-cell">Country</th>
                    <th className="text-center text-gray-500 dark:text-gray-400 text-sm font-medium p-4 hidden sm:table-cell">Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {exchanges.map((exchange) => (
                    <tr
                      key={exchange.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="p-4 text-gray-500 dark:text-gray-400">
                        {exchange.trust_score_rank}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/markets/exchanges/${exchange.id}`}
                          className="flex items-center gap-3"
                        >
                          <div className="relative w-8 h-8">
                            {exchange.image && (
                              <Image
                                src={exchange.image}
                                alt={exchange.name}
                                fill
                                className="rounded-full object-cover"
                                unoptimized
                              />
                            )}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                            {exchange.name}
                          </span>
                        </Link>
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium ${getTrustScoreBg(exchange.trust_score)} ${getTrustScoreColor(exchange.trust_score)}`}
                        >
                          {exchange.trust_score}/10
                        </span>
                      </td>
                      <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                        ₿ {formatNumber(exchange.trade_volume_24h_btc_normalized)}
                      </td>
                      <td className="p-4 text-right text-gray-700 dark:text-gray-300 hidden md:table-cell">
                        ${formatNumber(exchange.trade_volume_24h_btc_normalized * BTC_PRICE_ESTIMATE)}
                      </td>
                      <td className="p-4 text-right text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                        {exchange.year_established || '—'}
                      </td>
                      <td className="p-4 text-right text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                        {exchange.country || '—'}
                      </td>
                      <td className="p-4 text-center hidden sm:table-cell">
                        <a
                          href={exchange.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                          title={`Visit ${exchange.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Banner */}
          <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl">ℹ️</span>
              <div className="text-sm">
                <p className="text-blue-800 dark:text-blue-200 font-medium">
                  About Trust Score
                </p>
                <p className="text-blue-600 dark:text-blue-300">
                  Trust score is calculated based on liquidity, scale of operations, cyber security, and regulatory compliance. 
                  Volume shown is normalized to account for potential wash trading.
                </p>
              </div>
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
