import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateSEOMetadata } from '@/lib/seo';
import type { Metadata } from 'next';

import VideosClient from './VideosClient';

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Crypto Video News & Analysis',
    description:
      'Watch the latest crypto video news, analysis, and interviews from top YouTube channels including CoinDesk, Bankless, Real Vision, and more.',
    path: '/videos',
    locale,
    tags: [
      'crypto videos',
      'bitcoin video',
      'crypto news',
      'crypto analysis',
      'blockchain education',
    ],
  });
}

export default async function VideosPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
            Crypto Video News &amp; Analysis
          </h1>
          <p className="mt-2 max-w-2xl text-base text-text-secondary md:text-lg">
            The latest video content from top crypto YouTube channels — news, education, DeFi deep
            dives, and market analysis.
          </p>
        </div>
        <VideosClient />
      </main>
      <Footer />
    </>
  );
}
