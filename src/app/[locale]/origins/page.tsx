import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import OriginsDashboard from './OriginsDashboard';

export const metadata: Metadata = {
  title: 'Origins | Find Original Crypto News Sources',
  description:
    'Discover original sources for crypto news. Track how stories propagate and find primary sources.',
  openGraph: {
    title: 'Origins | Find Original Crypto News Sources',
    description: 'Find original sources for crypto news.',
  },
  keywords: [
    'original source',
    'crypto news source',
    'primary source',
    'news propagation',
    'source tracking',
  ],
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function OriginsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-950">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Original Sources</h1>
          <p className="text-gray-400">
            Find original sources and track how crypto news stories propagate.
          </p>
        </div>
        <OriginsDashboard />
      </main>
      <Footer />
    </div>
  );
}
