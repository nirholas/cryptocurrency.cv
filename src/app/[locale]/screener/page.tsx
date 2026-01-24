import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';
import { Screener } from '@/components/Screener';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

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

async function getCoins() {
  try {
    const res = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=false&price_change_percentage=24h,7d,30d',
      {
        next: { revalidate: 120 },
        headers: {
          Accept: 'application/json',
        },
      }
    );

    if (!res.ok) {
      console.error('Failed to fetch coins:', res.status);
      return [];
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching coins:', error);
    return [];
  }
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
