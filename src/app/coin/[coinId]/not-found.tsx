/**
 * 404 page for invalid coin IDs
 */

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CoinNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="px-4 py-16 flex items-center justify-center min-h-[60vh]">
          <div className="max-w-md w-full text-center">
            {/* 404 Icon */}
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-800 flex items-center justify-center">
              <span className="text-5xl">🔍</span>
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">
              Coin Not Found
            </h1>

            <p className="text-gray-400 mb-8">
              We couldn&apos;t find any cryptocurrency with that ID. The coin might
              have been delisted or the URL may be incorrect.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/markets"
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-gray-900 font-semibold rounded-xl transition-colors"
              >
                Browse All Coins
              </Link>

              <Link
                href="/"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-xl transition-colors"
              >
                Back to Home
              </Link>
            </div>

            {/* Popular coins */}
            <div className="mt-12 pt-8 border-t border-gray-800">
              <p className="text-sm text-gray-500 mb-4">
                Popular cryptocurrencies:
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {[
                  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
                  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
                  { id: 'solana', name: 'Solana', symbol: 'SOL' },
                  { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
                  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
                  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
                ].map((coin) => (
                  <Link
                    key={coin.id}
                    href={`/coin/${coin.id}`}
                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
                  >
                    {coin.symbol}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
