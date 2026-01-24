import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { GasTracker } from '@/components/GasTracker';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Gas Tracker | Ethereum Gas Prices',
  description:
    'Live Ethereum gas prices and transaction cost estimator. Track gas fees for ETH transfers, swaps, and smart contract interactions.',
  openGraph: {
    title: 'Gas Tracker | Ethereum Gas Prices',
    description: 'Live Ethereum gas prices and transaction cost estimator.',
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function GasPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">⛽ Gas Tracker</h1>
          <p className="text-gray-600 dark:text-slate-400">
            Live Ethereum gas prices. Estimate transaction costs before you send.
          </p>
        </div>

        <GasTracker />
      </main>
      <Footer />
    </div>
  );
}
