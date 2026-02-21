import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import PortfolioContent from './PortfolioContent';

export const metadata: Metadata = {
  title: 'Portfolio - Track Your Crypto Holdings',
  description: 'Track and manage your cryptocurrency portfolio with real-time prices.',
  robots: { index: false, follow: false },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PortfolioPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PortfolioContent />;
}
