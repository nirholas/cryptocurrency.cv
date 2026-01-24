import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FundingDashboard from './FundingDashboard';

export const metadata: Metadata = {
  title: 'Funding Rates | Perpetual Futures Funding',
  description:
    'Real-time funding rates across Binance, Bybit, OKX, and Hyperliquid. Find funding rate arbitrage opportunities.',
  openGraph: {
    title: 'Funding Rates | Perpetual Futures Funding',
    description: 'Track funding rates across major crypto exchanges.',
  },
  keywords: [
    'funding rates',
    'perpetual futures',
    'crypto funding',
    'binance funding',
    'bybit funding',
    'funding arbitrage',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function FundingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Funding Rates</h1>
          <p className="text-gray-400">
            Real-time perpetual futures funding rates from major exchanges.
          </p>
        </div>
        <FundingDashboard />
      </main>
      <Footer />
    </div>
  );
}
