import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingContent from './PricingContent';

export const metadata: Metadata = {
  title: 'Pricing - Free API & x402 Pay-Per-Request',
  description:
    'Free tier with unlimited access to news endpoints. Premium endpoints available via x402 pay-per-request USDC micropayments. No subscriptions needed.',
  keywords: [
    'crypto API pricing',
    'x402',
    'micropayments',
    'pay per request',
    'USDC',
    'Base network',
    'free crypto API',
  ],
  openGraph: {
    title: 'Pricing | Free Crypto News API',
    description:
      'Free tier for everyone. Pay-per-request with USDC for premium endpoints. No subscriptions.',
    type: 'website',
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function PricingPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations('common');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main className="pt-16">
        <PricingContent />
      </main>
      <Footer />
    </div>
  );
}
