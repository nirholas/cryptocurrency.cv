import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FactcheckDashboard from './FactcheckDashboard';

export const metadata: Metadata = {
  title: 'Fact Check | Crypto Claim Verification',
  description:
    'AI-powered fact-checking of crypto news claims. Verify predictions, statements, and market claims.',
  openGraph: {
    title: 'Fact Check | Crypto Claim Verification',
    description: 'Verify crypto news claims with AI-powered analysis.',
  },
  keywords: [
    'crypto fact check',
    'claim verification',
    'crypto misinformation',
    'prediction verification',
    'news verification',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function FactcheckPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Fact Check</h1>
          <p className="text-gray-400">
            AI-powered verification of claims made in crypto news articles.
          </p>
        </div>
        <FactcheckDashboard />
      </main>
      <Footer />
    </div>
  );
}
