import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ClaimsDashboard from './ClaimsDashboard';

export const metadata: Metadata = {
  title: 'Claims | Extracted Crypto News Claims',
  description:
    'Extract and analyze claims made in crypto news articles. AI-powered claim detection.',
  openGraph: {
    title: 'Claims | Extracted Crypto News Claims',
    description: 'Extract claims from crypto news articles.',
  },
  keywords: [
    'crypto claims',
    'claim extraction',
    'news claims',
    'prediction claims',
    'AI analysis',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ClaimsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Claim Extraction</h1>
          <p className="text-gray-400">
            AI-powered extraction of claims, predictions, and statements from crypto news.
          </p>
        </div>
        <ClaimsDashboard />
      </main>
      <Footer />
    </div>
  );
}
