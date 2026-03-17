import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateSEOMetadata } from '@/lib/seo';
import { Skeleton } from '@/components/ui';
import type { Metadata } from 'next';
import PumpScreenerClient from '@/components/PumpScreenerClient';

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Pump Screener — Detect Crypto Pump Patterns in Real-Time',
    description:
      'Detect and analyze cryptocurrency pump patterns in real-time. Monitor price surges, volume spikes, and unusual activity across major exchanges.',
    path: '/pump-screener',
    locale,
    tags: [
      'pump screener',
      'crypto pump detector',
      'volume spike',
      'pump and dump',
      'crypto scanner',
      'pump alert',
      'whale detection',
      'crypto trading signals',
    ],
  });
}

function PumpScreenerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-6 w-96" />
      <Skeleton className="h-48 w-full" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    </div>
  );
}

export default async function PumpScreenerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <Suspense fallback={<PumpScreenerSkeleton />}>
          <PumpScreenerClient />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
