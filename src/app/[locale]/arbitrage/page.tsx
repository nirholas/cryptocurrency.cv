import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { ArbitrageDashboard } from '@/components/ArbitrageDashboard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Arbitrage Scanner | Cross-Exchange Price Opportunities',
  description:
    'Real-time arbitrage opportunity detection across Binance, Bybit, OKX, Kraken, and more. Find price discrepancies and triangular arbitrage.',
  openGraph: {
    title: 'Arbitrage Scanner | Cross-Exchange Price Opportunities',
    description:
      'Real-time cross-exchange arbitrage detection with profit calculations.',
  },
  keywords: [
    'crypto arbitrage',
    'price arbitrage',
    'cross-exchange trading',
    'triangular arbitrage',
    'binance arbitrage',
    'bybit arbitrage',
    'price discrepancy',
    'trading opportunities',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ArbitragePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ⚡ Arbitrage Scanner
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Real-time cross-exchange arbitrage detection. Find price discrepancies and profit
            opportunities across major exchanges.
          </p>
        </div>

        {/* Disclaimer Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
            <span className="text-lg">⚠️</span> Important Disclaimer
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-amber-800 dark:text-amber-300">
            <div>
              <strong>Execution Risk:</strong> Prices change rapidly. Opportunities may disappear
              before execution.
            </div>
            <div>
              <strong>Hidden Costs:</strong> Fees, slippage, and withdrawal delays reduce real
              profits.
            </div>
            <div>
              <strong>Capital Requirements:</strong> Effective arbitrage requires capital on
              multiple exchanges.
            </div>
          </div>
        </div>

        <ArbitrageDashboard />
      </main>
      <Footer />
    </div>
  );
}
