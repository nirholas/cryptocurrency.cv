import { Suspense } from 'react';
import { setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { generateSEOMetadata } from '@/lib/seo';
import { Skeleton } from '@/components/ui';
import { Card, CardContent } from '@/components/ui';
import ScreenerTable from '@/components/ScreenerTable';
import type { Metadata } from 'next';

export const revalidate = 60;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  return generateSEOMetadata({
    title: 'Crypto Screener — Filter & Sort 100+ Coins',
    description:
      'Advanced cryptocurrency screener. Filter and sort 100+ coins by price, market cap, volume, and percentage change. Export to CSV.',
    path: '/screener',
    locale,
    tags: ['crypto screener', 'cryptocurrency filter', 'coin screener', 'crypto scanner'],
  });
}

async function fetchCoins() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const res = await fetch(`${baseUrl}/api/market/coins?type=top&limit=250`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.coins ?? [];
  } catch {
    return [];
  }
}

async function ScreenerContent() {
  const coins = await fetchCoins();

  if (!coins || coins.length === 0) {
    return (
      <div className="text-text-secondary py-20 text-center">
        <p className="text-lg">Unable to load market data right now.</p>
        <p className="mt-2 text-sm">Please try again later.</p>
      </div>
    );
  }

  return <ScreenerTable coins={coins} />;
}

function ScreenerSkeleton() {
  return (
    <Card>
      <CardContent className="space-y-3 pt-6">
        <div className="flex gap-3">
          <Skeleton className="h-9 w-56" />
          <Skeleton className="h-9 w-20" />
          <Skeleton className="h-9 w-20" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export default async function ScreenerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <Header />
      <main className="container-main py-10">
        <h1 className="text-text-primary mb-2 font-serif text-3xl font-bold md:text-4xl">
          Crypto Screener
        </h1>
        <p className="text-text-secondary mb-8 max-w-2xl">
          Filter, sort, and analyze 100+ cryptocurrencies. Use the filters to narrow down coins by
          price, market cap, volume, and price change.
        </p>

        <Suspense fallback={<ScreenerSkeleton />}>
          <ScreenerContent />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
