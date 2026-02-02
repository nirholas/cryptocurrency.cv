import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { SearchPageContent } from '@/components/SearchPageContent';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search - Free Crypto News',
  description: 'Search crypto news from 130+ sources. Find articles about Bitcoin, Ethereum, DeFi, and more.',
};

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SearchPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('search');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">🔍 {t('placeholder').split(',')[0]}</h1>
            <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              {t('suggestions')}
            </p>
          </div>

          <SearchPageContent />
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
