import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EntitiesDashboard from './EntitiesDashboard';

export const metadata: Metadata = {
  title: 'Entities | Crypto News Entity Extraction',
  description:
    'Track people, companies, protocols, and tickers mentioned in crypto news. Entity relationship mapping.',
  openGraph: {
    title: 'Entities | Crypto News Entity Extraction',
    description: 'Track entities mentioned in crypto news.',
  },
  keywords: [
    'crypto entities',
    'entity extraction',
    'crypto people',
    'crypto companies',
    'ticker mentions',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function EntitiesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Entity Tracker</h1>
          <p className="text-gray-400">
            Extracted people, companies, protocols, and tickers from crypto news.
          </p>
        </div>
        <EntitiesDashboard />
      </main>
      <Footer />
    </div>
  );
}
