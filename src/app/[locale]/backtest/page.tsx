import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BacktestDashboard from './BacktestDashboard';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Backtest | News-Based Trading Strategy Testing',
  description: 'Backtest trading strategies based on crypto news signals. Historical performance analysis.',
  path: '/backtest',
  tags: ['crypto backtest', 'trading strategy', 'news trading', 'historical analysis', 'strategy testing'],
  noindex: true,
});

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function BacktestPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Strategy Backtest</h1>
          <p className="text-gray-400">
            Test news-based trading strategies against historical data.
          </p>
        </div>
        <BacktestDashboard />
      </main>
      <Footer />
    </div>
  );
}
