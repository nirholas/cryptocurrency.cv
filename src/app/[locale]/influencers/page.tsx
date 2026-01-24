import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { InfluencersDashboard } from './InfluencersDashboard';

export const metadata: Metadata = {
  title: 'Influencer Reliability | Crypto Influencer Tracking',
  description:
    'Track crypto influencer predictions and trading calls. See accuracy scores and reliability ratings.',
  openGraph: {
    title: 'Influencer Reliability | Crypto Influencer Tracking',
    description:
      'Track crypto influencer predictions and see who actually gets it right.',
  },
  keywords: [
    'crypto influencers',
    'influencer tracking',
    'prediction accuracy',
    'trading calls',
    'crypto twitter',
    'influencer reliability',
    'call tracking',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function InfluencersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            👤 Influencer Reliability
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Track crypto influencer predictions and trading calls. See who gets it right.
          </p>
        </div>

        {/* Scoring Explanation */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-xl p-4 mb-6">
          <h2 className="font-semibold text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
            <span className="text-lg">📊</span> How Reliability Scores Work
          </h2>
          <div className="grid md:grid-cols-4 gap-4 text-sm text-purple-800 dark:text-purple-300">
            <div>
              <strong>Prediction Tracking:</strong> We monitor trading calls from influencers.
            </div>
            <div>
              <strong>Auto Resolution:</strong> Calls are scored based on price movement.
            </div>
            <div>
              <strong>Recency Weight:</strong> Recent calls impact score more heavily.
            </div>
            <div>
              <strong>Confidence Factor:</strong> High-conviction calls are weighted more.
            </div>
          </div>
        </div>

        <InfluencersDashboard />
      </main>
      <Footer />
    </div>
  );
}
