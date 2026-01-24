import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import DeveloperPortalContent from './DeveloperPortalContent';

export const metadata: Metadata = {
  title: 'Developer Portal - API Keys & Documentation',
  description:
    'Get your API key, manage usage, and access comprehensive documentation for the Free Crypto News API. Start building in minutes.',
  keywords: [
    'crypto API',
    'developer portal',
    'API key',
    'documentation',
    'x402',
    'REST API',
    'cryptocurrency data',
  ],
  openGraph: {
    title: 'Developer Portal | Free Crypto News API',
    description:
      'Get your API key and start building. Access real-time crypto news, market data, and AI-powered analytics.',
    type: 'website',
  },
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DevelopersPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Header />
      <main className="pt-16">
        <DeveloperPortalContent />
      </main>
      <Footer />
    </div>
  );
}
