import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { setRequestLocale } from 'next-intl/server';
import { CryptoCalculator } from '@/components/CryptoCalculator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'Crypto Calculator',
    description: 'Convert between cryptocurrencies and calculate profit and loss. Free crypto converter supporting Bitcoin, Ethereum, and hundreds of altcoins.',
    path: '/calculator',
    tags: ['crypto calculator', 'crypto converter', 'profit calculator', 'bitcoin converter', 'cryptocurrency calculator'],
  });
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CalculatorPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🧮 Crypto Calculator
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Convert between cryptocurrencies and calculate your potential profits or losses.
          </p>
        </div>

        <CryptoCalculator />
      </main>
      <Footer />
    </div>
  );
}
