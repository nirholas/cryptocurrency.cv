import { setRequestLocale } from 'next-intl/server';
import PortfolioContent from './PortfolioContent';
import { generateSEOMetadata } from '@/lib/seo';

export const metadata = generateSEOMetadata({
  title: 'Portfolio — Track Your Crypto Holdings',
  description: 'Track and manage your cryptocurrency portfolio with real-time prices.',
  path: '/portfolio',
  noindex: true,
});

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PortfolioPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PortfolioContent />;
}
