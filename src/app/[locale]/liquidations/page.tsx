import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { LiquidationsFeed } from '@/components/LiquidationsFeed';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Liquidations | Live Futures Liquidation Feed',
  description:
    'Real-time cryptocurrency futures liquidations across major exchanges. Track longs and shorts getting liquidated.',
  openGraph: {
    title: 'Liquidations | Live Futures Liquidation Feed',
    description: 'Real-time cryptocurrency futures liquidations across major exchanges.',
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function LiquidationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            💥 Liquidations Feed
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Live futures liquidations across major exchanges. See who&apos;s getting rekt in
            real-time.
          </p>
        </div>

        <LiquidationsFeed />
      </main>
      <Footer />
    </div>
  );
}
