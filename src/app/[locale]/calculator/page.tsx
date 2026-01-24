import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { CryptoCalculator } from '@/components/CryptoCalculator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Crypto Calculator | Convert & Calculate Profits',
  description:
    'Convert between cryptocurrencies and calculate your potential profits. Free crypto converter and profit/loss calculator.',
  openGraph: {
    title: 'Crypto Calculator | Convert & Calculate Profits',
    description: 'Convert between cryptocurrencies and calculate your potential profits.',
  },
};

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
