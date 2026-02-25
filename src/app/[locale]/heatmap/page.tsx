import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Heatmap } from '@/components/Heatmap';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchCoinGecko } from '@/lib/coingecko';
import { COINGECKO_BASE } from '@/lib/constants';

export const dynamic = 'force-dynamic';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
}

export const metadata: Metadata = {
  title: 'Market Heatmap | Crypto Overview',
  description:
    'Visual heatmap of the cryptocurrency market. See which coins are up or down at a glance with our interactive market visualization.',
  openGraph: {
    title: 'Market Heatmap | Crypto Overview',
    description:
      'Visual heatmap of the cryptocurrency market. See which coins are up or down at a glance.',
  },
};

async function getCoins() {
  const data = await fetchCoinGecko<Coin[]>(
    `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false&price_change_percentage=24h,7d`,
    { revalidate: 120 }
  );
  return data ?? [];
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HeatmapPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const coins = await getCoins();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Market Heatmap
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Visualize the entire crypto market at a glance. Size indicates market cap, shade
            indicates price change.
          </p>
        </div>

        {coins.length > 0 ? (
          <Heatmap coins={coins} />
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            Unable to load market data. Please try again later.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
