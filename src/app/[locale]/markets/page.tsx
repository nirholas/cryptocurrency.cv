/**
 * Markets Page
 * Comprehensive markets dashboard for browsing, filtering, and discovering cryptocurrencies
 */

// Render dynamically to avoid CoinGecko rate limits during SSG build
export const dynamic = 'force-dynamic';

import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Suspense } from 'react';
import {
  getTopCoins,
  getTrending,
  getGlobalMarketData,
  getFearGreedIndex,
  type TokenPrice,
} from '@/lib/market-data';
import type { Metadata } from 'next';

// Components
import GlobalStatsBar from './components/GlobalStatsBar';
import TrendingSection from './components/TrendingSection';
import CategoryTabs from './components/CategoryTabs';
import SearchAndFilters from './components/SearchAndFilters';
import CoinsTable from './components/CoinsTable';
import { AnomalyAlertsBanner } from '@/components/AnomalyAlertsBanner';
import { SITE_URL } from '@/lib/constants';
import type { SortField, SortOrder } from './components/SortableHeader';

export async function generateMetadata(): Promise<Metadata> {
  // Fetch current market data for dynamic OG image
  try {
    const [global, fearGreed] = await Promise.all([
      getGlobalMarketData(),
      getFearGreedIndex(),
    ]);
    
    const btcPrice = global?.total_market_cap?.btc 
      ? `$${(global.total_market_cap.usd / global.total_market_cap.btc * 1).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
      : '$0';
    const btcChange = (global?.market_cap_change_percentage_24h_usd ?? 0).toFixed(2);
    
    const ogImageUrl = `${SITE_URL}/api/og/market?type=overview&btc=${encodeURIComponent(btcPrice)}&btc_change=${btcChange}&fear_greed=${fearGreed?.value ?? 50}&fear_greed_label=${encodeURIComponent(fearGreed?.value_classification ?? 'Neutral')}`;

    return {
      title: 'Crypto Markets - Free Crypto News',
      description: 'Live cryptocurrency prices, market data, charts, and analytics. Browse and discover cryptocurrencies.',
      openGraph: {
        title: 'Crypto Markets - Free Crypto News',
        description: 'Live cryptocurrency prices, market data, charts, and analytics.',
        images: [{
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: 'Crypto Markets Overview',
        }],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Crypto Markets - Free Crypto News',
        description: 'Live cryptocurrency prices and market data',
        images: [ogImageUrl],
      },
    };
  } catch {
    return {
      title: 'Crypto Markets - Free Crypto News',
      description: 'Live cryptocurrency prices, market data, charts, and analytics.',
    };
  }
}

export const revalidate = 60; // Revalidate every minute

// Define valid sort fields
const VALID_SORT_FIELDS: SortField[] = [
  'market_cap_rank',
  'current_price',
  'price_change_percentage_1h_in_currency',
  'price_change_percentage_24h',
  'price_change_percentage_7d_in_currency',
  'market_cap',
  'total_volume',
  'circulating_supply',
];

interface MarketsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    page?: string;
    sort?: string;
    order?: string;
    category?: string;
    search?: string;
    price?: string;
    marketCap?: string;
    change?: string;
    perPage?: string;
  }>;
}

// Filter coins based on URL params
function filterCoins(
  coins: TokenPrice[],
  params: {
    search?: string;
    price?: string;
    marketCap?: string;
    change?: string;
  }
): TokenPrice[] {
  let filtered = [...coins];

  // Search filter
  if (params.search) {
    const query = params.search.toLowerCase();
    filtered = filtered.filter(
      (coin) =>
        coin.name.toLowerCase().includes(query) ||
        coin.symbol.toLowerCase().includes(query)
    );
  }

  // Price range filter
  if (params.price && params.price !== 'all') {
    filtered = filtered.filter((coin) => {
      const price = coin.current_price;
      switch (params.price) {
        case '0-1':
          return price >= 0 && price < 1;
        case '1-10':
          return price >= 1 && price < 10;
        case '10-100':
          return price >= 10 && price < 100;
        case '100+':
          return price >= 100;
        default:
          return true;
      }
    });
  }

  // Market cap filter
  if (params.marketCap && params.marketCap !== 'all') {
    filtered = filtered.filter((coin) => {
      const cap = coin.market_cap;
      switch (params.marketCap) {
        case '1b+':
          return cap >= 1_000_000_000;
        case '100m+':
          return cap >= 100_000_000;
        case '10m+':
          return cap >= 10_000_000;
        case '<10m':
          return cap < 10_000_000;
        default:
          return true;
      }
    });
  }

  // 24h change filter
  if (params.change && params.change !== 'all') {
    filtered = filtered.filter((coin) => {
      const change = coin.price_change_percentage_24h || 0;
      switch (params.change) {
        case 'gainers':
          return change > 0;
        case 'losers':
          return change < 0;
        default:
          return true;
      }
    });
  }

  return filtered;
}

// Sort coins based on URL params
function sortCoins(
  coins: TokenPrice[],
  sortField: SortField,
  order: SortOrder
): TokenPrice[] {
  const sorted = [...coins];

  sorted.sort((a, b) => {
    let aValue: number;
    let bValue: number;

    switch (sortField) {
      case 'market_cap_rank':
        aValue = a.market_cap_rank || 9999;
        bValue = b.market_cap_rank || 9999;
        break;
      case 'current_price':
        aValue = a.current_price || 0;
        bValue = b.current_price || 0;
        break;
      case 'price_change_percentage_24h':
        aValue = a.price_change_percentage_24h || 0;
        bValue = b.price_change_percentage_24h || 0;
        break;
      case 'price_change_percentage_7d_in_currency':
        aValue = a.price_change_percentage_7d_in_currency || 0;
        bValue = b.price_change_percentage_7d_in_currency || 0;
        break;
      case 'market_cap':
        aValue = a.market_cap || 0;
        bValue = b.market_cap || 0;
        break;
      case 'total_volume':
        aValue = a.total_volume || 0;
        bValue = b.total_volume || 0;
        break;
      case 'circulating_supply':
        aValue = a.circulating_supply || 0;
        bValue = b.circulating_supply || 0;
        break;
      default:
        aValue = a.market_cap_rank || 9999;
        bValue = b.market_cap_rank || 9999;
    }

    if (order === 'asc') {
      return aValue - bValue;
    }
    return bValue - aValue;
  });

  return sorted;
}

export default async function MarketsPage({ params: pageParams, searchParams }: MarketsPageProps) {
  const { locale } = await pageParams;
  setRequestLocale(locale);
  const t = await getTranslations('markets');
  const params = await searchParams;
  
  // Parse URL params
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const sortField = (
    VALID_SORT_FIELDS.includes(params.sort as SortField) 
      ? params.sort 
      : 'market_cap_rank'
  ) as SortField;
  const sortOrder = (params.order === 'asc' ? 'asc' : 'desc') as SortOrder;
  const perPage = [20, 50, 100].includes(parseInt(params.perPage || '50', 10))
    ? parseInt(params.perPage || '50', 10)
    : 50;
  const category = params.category || 'all';

  // Fetch data in parallel
  const [allCoins, trending, global, fearGreed] = await Promise.all([
    getTopCoins(250), // Get more coins for filtering
    getTrending(),
    getGlobalMarketData(),
    getFearGreedIndex(),
  ]);

  // Apply filters
  let filteredCoins = filterCoins(allCoins, {
    search: params.search,
    price: params.price,
    marketCap: params.marketCap,
    change: params.change,
  });

  // Apply sorting
  filteredCoins = sortCoins(filteredCoins, sortField, sortOrder);

  // Pagination
  const totalCount = filteredCoins.length;
  const startIndex = (currentPage - 1) * perPage;
  const paginatedCoins = filteredCoins.slice(startIndex, startIndex + perPage);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <Header />

        {/* Global Stats Bar */}
        <GlobalStatsBar global={global} fearGreed={fearGreed} />

        <main className="px-4 py-6">
          {/* Market Anomaly Alerts */}
          <AnomalyAlertsBanner maxAlerts={2} className="mb-6" />
          
          {/* Page Header */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📊 Cryptocurrency Markets
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Live prices, charts, and market data for {totalCount.toLocaleString()} cryptocurrencies
            </p>
          </div>

          {/* Trending Section */}
          <Suspense fallback={<TrendingSectionSkeleton />}>
            <TrendingSection trending={trending} coins={allCoins} />
          </Suspense>

          {/* Category Tabs */}
          <Suspense fallback={<CategoryTabsSkeleton />}>
            <CategoryTabs activeCategory={category} />
          </Suspense>

          {/* Search and Filters */}
          <Suspense fallback={<SearchFiltersSkeleton />}>
            <SearchAndFilters coins={allCoins} />
          </Suspense>

          {/* Coins Table */}
          <Suspense fallback={<TableSkeleton />}>
            <CoinsTable
              coins={paginatedCoins}
              totalCount={totalCount}
              currentPage={currentPage}
              itemsPerPage={perPage}
              currentSort={sortField}
              currentOrder={sortOrder}
              showWatchlist={true}
            />
          </Suspense>

          {/* Data Attribution */}
          <div className="mt-8 text-center text-gray-500 dark:text-gray-400 text-sm">
            <p>
              Market data provided by{' '}
              <a
                href="https://www.coingecko.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline"
              >
                CoinGecko
              </a>
              {' • '}
              Updates every minute
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}

// Skeleton Components for Suspense
function TrendingSectionSkeleton() {
  return (
    <div className="grid md:grid-cols-2 gap-4 mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-10 w-24 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded mb-3 animate-pulse" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function CategoryTabsSkeleton() {
  return (
    <div className="flex gap-2 mb-4 overflow-hidden">
      {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
        <div
          key={i}
          className="h-10 w-24 bg-gray-100 dark:bg-gray-700 rounded-full animate-pulse flex-shrink-0"
        />
      ))}
    </div>
  );
}

function SearchFiltersSkeleton() {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <div className="h-10 w-64 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse" />
      <div className="h-10 w-32 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
      <div className="h-10 w-32 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
      <div className="h-10 w-32 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-800">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ml-auto" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse hidden sm:block" />
            <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse hidden md:block" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse hidden lg:block" />
          </div>
        ))}
      </div>
    </div>
  );
}