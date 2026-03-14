import { setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateSEOMetadata } from '@/lib/seo';
import { VIDEO_SOURCES, getVideoSourceBySlug } from '@/lib/video-sources';
import { Link } from '@/i18n/navigation';
import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';

import VideosClient from '../VideosClient';

type Props = { params: Promise<{ locale: string; source: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, source: sourceSlug } = await params;
  const source = getVideoSourceBySlug(sourceSlug);
  if (!source) return {};

  return generateSEOMetadata({
    title: `${source.name} Videos — Crypto Video News`,
    description: `Watch the latest crypto video content from ${source.name}. News, analysis, and insights about Bitcoin, Ethereum, DeFi, and more.`,
    path: `/videos/${source.slug}`,
    locale,
    tags: [source.name, 'crypto videos', 'crypto news', source.category],
  });
}

export function generateStaticParams() {
  return VIDEO_SOURCES.map((source) => ({ source: source.slug }));
}

export default async function VideoSourcePage({ params }: Props) {
  const { locale, source: sourceSlug } = await params;
  setRequestLocale(locale);

  const source = getVideoSourceBySlug(sourceSlug);
  if (!source) notFound();

  return (
    <>
      <Header />
      <main className="container-main py-10">
        {/* Back link */}
        <Link
          href="/videos"
          className="text-text-secondary hover:text-accent mb-6 inline-flex items-center gap-1 text-sm transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          All Videos
        </Link>

        {/* Channel header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
            {source.name}
          </h1>
          <p className="text-text-secondary mt-2 text-base">
            {source.category.charAt(0).toUpperCase() + source.category.slice(1)} videos from{' '}
            <a
              href={source.channelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              {source.name} on YouTube
            </a>
          </p>
        </div>

        <VideosClient initialSource={source.slug} />
      </main>
      <Footer />
    </>
  );
}
