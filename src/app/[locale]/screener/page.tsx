import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { setRequestLocale } from 'next-intl/server';
const Screener = dynamic(
  () => import('@/components/Screener').then(m => ({ default: m.Screener })),
  { ssr: false }
);
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchCoinGecko } from '@/lib/coingecko';
import { COINGECKO_BASE } from '@/lib/constants';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  ath: number;
  ath_change_percentage: number;
  circulating_supply: number;
  total_supply: number | null;
}

export const metadata: Metadata = {
  title: 'Crypto Screener | Filter & Discover Coins',
  description:
    'Filter cryptocurrencies by market cap, price, volume, 24h change, and distance from all-time high. Find the coins that match your criteria.',
  openGraph: {
    title: 'Crypto Screener | Filter & Discover Coins',
    description:
      'Filter cryptocurrencies by market cap, price, volume, 24h change, and distance from all-time high.',
  },
};

async function getCoins(): Promise<Coin[]> {
  const data = await fetchCoinGecko<Coin[]>(
    `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h,7d,30d`,
    { revalidate: 120 }
  );
  return data ?? [];
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function ScreenerPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const coins = await getCoins();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <Header />
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Crypto Screener
          </h1>
          <p className="text-gray-600 dark:text-slate-400">
            Filter and discover cryptocurrencies matching your criteria
          </p>
        </div>

        {coins.length > 0 ? (
          <Screener coins={coins} />
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-slate-400">
            Unable to load coin data. Please try again later.
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
