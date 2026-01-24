import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import NarrativesDashboard from './NarrativesDashboard';

export const metadata: Metadata = {
  title: 'Market Narratives | Crypto Narrative Tracking',
  description:
    'Track emerging crypto market narratives and themes. Identify trending stories before they go mainstream.',
  openGraph: {
    title: 'Market Narratives | Crypto Narrative Tracking',
    description: 'Track emerging crypto market narratives and themes.',
  },
  keywords: [
    'crypto narratives',
    'market narratives',
    'crypto themes',
    'trending narratives',
    'narrative trading',
    'crypto trends',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function NarrativesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Market Narratives</h1>
          <p className="text-gray-400">
            Identify and track emerging crypto narratives and themes from news coverage.
          </p>
        </div>
        <NarrativesDashboard />
      </main>
      <Footer />
    </div>
  );
}
