import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import { setRequestLocale } from 'next-intl/server';
import { DominanceChart } from '@/components/DominanceChart';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchCoinGecko } from '@/lib/coingecko';
import { COINGECKO_BASE } from '@/lib/constants';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  market_cap: number;
}

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'Market Dominance',
    description: 'Visualize cryptocurrency market dominance and market share. Track Bitcoin dominance, Ethereum, and altcoin market cap percentages in real time.',
    path: '/dominance',
    tags: ['bitcoin dominance', 'crypto market share', 'market cap distribution', 'altcoin dominance', 'BTC dominance'],
  });
}

async function getCoins(): Promise<Coin[]> {
  const data = await fetchCoinGecko<Coin[]>(
    `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`,
    { revalidate: 300 }
  );
  return Array.isArray(data) ? data : [];
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function DominancePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const coins = await getCoins();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Market Dominance
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Visualize market share across the crypto ecosystem. See how BTC and ETH compare to
            altcoins.
          </p>
        </div>

        <DominanceChart coins={coins} />
      </main>
      <Footer />
    </div>
  );
}
