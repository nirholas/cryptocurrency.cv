import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { OrderBookDashboard } from '@/components/OrderBookDashboard';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Order Book | Multi-Exchange Liquidity Aggregator',
  description:
    'Real-time aggregated order book across Binance, Bybit, OKX, Kraken, KuCoin, and Coinbase. Analyze depth, slippage, and arbitrage opportunities.',
  openGraph: {
    title: 'Order Book | Multi-Exchange Liquidity Aggregator',
    description:
      'Real-time aggregated order book with liquidity analysis and slippage estimation.',
  },
  keywords: [
    'order book',
    'crypto liquidity',
    'aggregated depth',
    'slippage calculator',
    'binance depth',
    'bybit depth',
    'crypto arbitrage',
    'market depth',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OrderBookPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            📚 Order Book
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Multi-exchange aggregated order book with liquidity analysis, slippage estimation, and
            arbitrage detection.
          </p>
        </div>

        {/* Educational Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
            <span className="text-lg">💡</span> Understanding Liquidity
          </h2>
          <div className="grid md:grid-cols-4 gap-4 text-sm text-blue-800 dark:text-blue-300">
            <div>
              <strong>Spread:</strong> Difference between best bid and ask. Tighter = more liquid.
            </div>
            <div>
              <strong>Depth:</strong> Total volume available at each price level.
            </div>
            <div>
              <strong>Slippage:</strong> Price movement caused by your order size.
            </div>
            <div>
              <strong>Imbalance:</strong> Ratio of buy vs sell pressure in the book.
            </div>
          </div>
        </div>

        <OrderBookDashboard />
      </main>
      <Footer />
    </div>
  );
}
