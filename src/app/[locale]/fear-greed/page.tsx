import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FearGreedDashboard from './FearGreedDashboard';

export const metadata: Metadata = {
  title: 'Crypto Fear & Greed Index | Market Sentiment',
  description:
    'Real-time Crypto Fear & Greed Index with historical analysis. Track market sentiment and identify potential market tops and bottoms.',
  openGraph: {
    title: 'Crypto Fear & Greed Index | Market Sentiment',
    description: 'Real-time market sentiment with trend analysis.',
  },
  keywords: [
    'fear and greed index',
    'crypto sentiment',
    'market sentiment',
    'bitcoin fear greed',
    'crypto emotions',
    'market psychology',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function FearGreedPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Fear & Greed Index</h1>
          <p className="text-gray-400">
            Market sentiment indicator measuring emotions and sentiments from different sources.
          </p>
        </div>
        <FearGreedDashboard />
      </main>
      <Footer />
    </div>
  );
}
