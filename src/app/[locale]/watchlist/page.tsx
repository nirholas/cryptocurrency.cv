import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import WatchlistContent from './WatchlistContent';

export const metadata: Metadata = {
  title: 'Watchlist - Monitor Your Crypto Coins',
  description: 'Monitor your favorite cryptocurrency coins with price alerts and real-time updates.',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function WatchlistPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <WatchlistContent />;
}
