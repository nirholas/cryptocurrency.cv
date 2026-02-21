import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ClaimsDashboard from '@/app/[locale]/claims/ClaimsDashboard';

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'Crypto News Claims',
    description: 'Extract and analyze claims made in crypto news articles. AI-powered detection of predictions, statements, and verifiable claims from 130+ sources.',
    path: '/claims',
    tags: ['crypto claims', 'claim extraction', 'news claims', 'prediction claims', 'AI analysis'],
  });
}

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
