import { setRequestLocale } from 'next-intl/server';
import WatchlistContent from './WatchlistContent';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Watchlist — Monitor Your Crypto Coins',
  description: 'Monitor your favorite cryptocurrency coins with price alerts and real-time updates.',
  path: '/watchlist',
  noindex: true,
});

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function WatchlistPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WatchlistContent />;
}
