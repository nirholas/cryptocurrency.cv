import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PredictionsDashboard from './PredictionsDashboard';

export const metadata: Metadata = {
  title: 'Price Predictions | Crypto Prediction Market',
  description:
    'Make crypto price predictions and compete on the leaderboard. Track your accuracy score and see top predictors.',
  openGraph: {
    title: 'Price Predictions | Crypto Prediction Market',
    description:
      'Make crypto price predictions and compete on the leaderboard.',
  },
  keywords: [
    'crypto predictions',
    'price predictions',
    'bitcoin predictions',
    'ethereum predictions',
    'crypto leaderboard',
    'prediction market',
    'accuracy score',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PredictionsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎱 Price Predictions
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Make crypto price predictions and compete on the leaderboard. Track your accuracy over time.
          </p>
        </div>

        {/* How It Works Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
            <span className="text-lg">🏆</span> How Predictions Work
          </h2>
          <div className="grid md:grid-cols-4 gap-4 text-sm text-amber-800 dark:text-amber-300">
            <div>
              <strong>1. Create:</strong> Pick an asset, target price, and timeframe.
            </div>
            <div>
              <strong>2. Wait:</strong> Your prediction is locked until the deadline.
            </div>
            <div>
              <strong>3. Resolve:</strong> Predictions are resolved automatically.
            </div>
            <div>
              <strong>4. Score:</strong> Earn points based on accuracy and confidence.
            </div>
          </div>
        </div>

        <PredictionsDashboard />
      </main>
      <Footer />
    </div>
  );
}
