import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import PricingContent from './PricingContent';

export const metadata: Metadata = {
  title: 'Pricing - API Plans & x402 Pay-Per-Request',
  description:
    'Choose your plan: Free tier, Pro subscription, or pay-per-request with x402 cryptocurrency micropayments. Access premium crypto market data, AI analysis, and more.',
  keywords: [
    'crypto API pricing',
    'x402',
    'micropayments',
    'pay per request',
    'USDC',
    'Base network',
    'API subscription',
  ],
  openGraph: {
    title: 'Pricing | Free Crypto News API',
    description:
      'Free tier with 100 requests/day. Pro plan at $29/month. Or pay-per-request with crypto micropayments.',
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
