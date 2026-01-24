import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CitationsDashboard from './CitationsDashboard';

export const metadata: Metadata = {
  title: 'Citations | Crypto News Source Network',
  description:
    'Explore the citation network between crypto news sources. Track information flow.',
  openGraph: {
    title: 'Citations | Crypto News Source Network',
    description: 'Explore citation networks in crypto news.',
  },
  keywords: [
    'crypto citations',
    'news network',
    'source citations',
    'information flow',
    'news sources',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CitationsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Citation Network</h1>
          <p className="text-gray-400">
            Track how information flows between crypto news sources.
          </p>
        </div>
        <CitationsDashboard />
      </main>
      <Footer />
    </div>
  );
}
