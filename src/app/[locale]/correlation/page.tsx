import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { CorrelationMatrix } from '@/components/CorrelationMatrix';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Correlation Matrix | Crypto Asset Correlations',
  description:
    'Analyze correlations between cryptocurrencies. See which coins move together and build a diversified portfolio.',
  openGraph: {
    title: 'Correlation Matrix | Crypto Asset Correlations',
    description: 'Analyze correlations between cryptocurrencies.',
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CorrelationPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔗 Correlation Matrix
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Analyze how cryptocurrencies move in relation to each other. Useful for portfolio
            diversification.
          </p>
        </div>

        <CorrelationMatrix />
      </main>
      <Footer />
    </div>
  );
}
