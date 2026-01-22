/**
 * Enhanced Coin Detail Page
 * CoinGecko/CoinMarketCap quality coin information display
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { searchNews } from '@/lib/crypto-news';
import {
  getCoinDetails,
  getCoinTickers,
  getOHLC,
  getCoinDeveloperData,
  getCoinCommunityData,
  formatPrice,
  formatNumber,
  formatPercent,
  type Ticker,
  type OHLCData,
  type DeveloperData,
  type CommunityData,
} from '@/lib/market-data';
import CoinPageClient from './CoinPageClient';

interface Props {
  params: Promise<{ coinId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

// Map of common coin IDs to their details for SEO
const coinMeta: Record<string, { name: string; symbol: string; keywords: string[] }> = {
  bitcoin: { name: 'Bitcoin', symbol: 'BTC', keywords: ['bitcoin', 'btc'] },
  ethereum: { name: 'Ethereum', symbol: 'ETH', keywords: ['ethereum', 'eth', 'vitalik'] },
  solana: { name: 'Solana', symbol: 'SOL', keywords: ['solana', 'sol'] },
  'binancecoin': { name: 'BNB', symbol: 'BNB', keywords: ['bnb', 'binance'] },
  ripple: { name: 'XRP', symbol: 'XRP', keywords: ['xrp', 'ripple'] },
  cardano: { name: 'Cardano', symbol: 'ADA', keywords: ['cardano', 'ada'] },
  dogecoin: { name: 'Dogecoin', symbol: 'DOGE', keywords: ['dogecoin', 'doge'] },
  polkadot: { name: 'Polkadot', symbol: 'DOT', keywords: ['polkadot', 'dot'] },
  avalanche: { name: 'Avalanche', symbol: 'AVAX', keywords: ['avalanche', 'avax'] },
  chainlink: { name: 'Chainlink', symbol: 'LINK', keywords: ['chainlink', 'link'] },
  polygon: { name: 'Polygon', symbol: 'MATIC', keywords: ['polygon', 'matic'] },
  tron: { name: 'TRON', symbol: 'TRX', keywords: ['tron', 'trx'] },
  litecoin: { name: 'Litecoin', symbol: 'LTC', keywords: ['litecoin', 'ltc'] },
  uniswap: { name: 'Uniswap', symbol: 'UNI', keywords: ['uniswap', 'uni'] },
  'matic-network': { name: 'Polygon', symbol: 'MATIC', keywords: ['polygon', 'matic'] },
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { coinId } = await params;
  
  try {
    const coinData = await getCoinDetails(coinId);
    
    if (!coinData) {
      return {
        title: 'Coin Not Found | Free Crypto News',
        description: 'The requested cryptocurrency could not be found.',
      };
    }

    const price = coinData.market_data?.current_price?.usd || 0;
    const change24h = coinData.market_data?.price_change_percentage_24h || 0;
    const symbol = coinData.symbol?.toUpperCase() || '';
    const name = coinData.name || coinId;

    return {
      title: `${name} (${symbol}) Price, Chart & Market Cap | Free Crypto News`,
      description: `Get ${name} (${symbol}) price, market cap, trading volume, chart, and info. ${name} is currently trading at ${formatPrice(price)} with a ${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}% change in 24h.`,
      keywords: [name.toLowerCase(), symbol.toLowerCase(), `${symbol} price`, `${name} news`, 'cryptocurrency', 'crypto'],
      openGraph: {
        title: `${name} Price: ${formatPrice(price)} | ${symbol}`,
        description: `${symbol} ${formatPercent(change24h)} in 24h. Market Cap: $${formatNumber(coinData.market_data?.market_cap?.usd)}`,
        images: coinData.image?.large ? [{ url: coinData.image.large, width: 250, height: 250, alt: name }] : [],
        type: 'website',
      },
      twitter: {
        card: 'summary',
        title: `${name} (${symbol}) - ${formatPrice(price)}`,
        description: `${symbol} ${formatPercent(change24h)} in 24h`,
        images: coinData.image?.large ? [coinData.image.large] : [],
      },
      alternates: {
        canonical: `/coin/${coinId}`,
      },
    };
  } catch {
    const meta = coinMeta[coinId];
    return {
      title: `${meta?.name || coinId} Price & News | Free Crypto News`,
      description: `Latest ${meta?.name || coinId} news, price, and market data.`,
    };
  }
}

// Revalidate every 60 seconds
export const revalidate = 60;

// Define coin data interface for type safety
interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image?: {
    large?: string;
    small?: string;
    thumb?: string;
  };
  market_cap_rank: number | null;
  categories?: string[];
  description?: { en?: string };
  links?: {
    homepage?: string[];
    blockchain_site?: string[];
    official_forum_url?: string[];
    chat_url?: string[];
    announcement_url?: string[];
    twitter_screen_name?: string;
    facebook_username?: string;
    telegram_channel_identifier?: string;
    subreddit_url?: string;
    repos_url?: {
      github?: string[];
      bitbucket?: string[];
    };
  };
  genesis_date?: string;
  hashing_algorithm?: string;
  block_time_in_minutes?: number;
  market_data?: {
    current_price?: { usd?: number; btc?: number; eth?: number };
    price_change_percentage_24h?: number;
    price_change_percentage_1h_in_currency?: { usd?: number };
    price_change_percentage_7d?: number;
    price_change_percentage_14d?: number;
    price_change_percentage_30d?: number;
    price_change_percentage_1y?: number;
    market_cap?: { usd?: number };
    total_volume?: { usd?: number };
    high_24h?: { usd?: number };
    low_24h?: { usd?: number };
    ath?: { usd?: number };
    ath_date?: { usd?: string };
    ath_change_percentage?: { usd?: number };
    atl?: { usd?: number };
    atl_date?: { usd?: string };
    atl_change_percentage?: { usd?: number };
    circulating_supply?: number;
    total_supply?: number | null;
    max_supply?: number | null;
    fully_diluted_valuation?: { usd?: number };
  };
  last_updated?: string;
}

export default async function CoinPage({ params, searchParams }: Props) {
  const { coinId } = await params;
  const { tab } = await searchParams;

  if (!coinId) {
    notFound();
  }

  const meta = coinMeta[coinId];

  // Fetch all data in parallel for performance
  const [coinData, tickersData, ohlcData, developerData, communityData, newsData] = await Promise.all([
    getCoinDetails(coinId) as Promise<CoinData | null>,
    getCoinTickers(coinId, 1).catch(() => ({ name: coinId, tickers: [] as Ticker[] })),
    getOHLC(coinId, 30).catch(() => [] as OHLCData[]),
    getCoinDeveloperData(coinId).catch(() => null as DeveloperData | null),
    getCoinCommunityData(coinId).catch(() => null as CommunityData | null),
    searchNews(meta?.keywords?.join(',') || coinId, 30).catch(() => ({ articles: [] })),
  ]);

  if (!coinData) {
    notFound();
  }

  // Extract market data with safe defaults
  const marketData = coinData.market_data || {};
  const price = marketData.current_price?.usd || 0;
  const priceInBtc = marketData.current_price?.btc;
  const priceInEth = marketData.current_price?.eth;
  const change1h = marketData.price_change_percentage_1h_in_currency?.usd;
  const change24h = marketData.price_change_percentage_24h || 0;
  const change7d = marketData.price_change_percentage_7d;
  const change14d = marketData.price_change_percentage_14d;
  const change30d = marketData.price_change_percentage_30d;
  const change1y = marketData.price_change_percentage_1y;
  const marketCap = marketData.market_cap?.usd || 0;
  const volume24h = marketData.total_volume?.usd || 0;
  const high24h = marketData.high_24h?.usd || price;
  const low24h = marketData.low_24h?.usd || price;
  const ath = marketData.ath?.usd || price;
  const athDate = marketData.ath_date?.usd || new Date().toISOString();
  const athChange = marketData.ath_change_percentage?.usd || 0;
  const atl = marketData.atl?.usd || 0;
  const atlDate = marketData.atl_date?.usd || new Date().toISOString();
  const atlChange = marketData.atl_change_percentage?.usd || 0;
  const circulatingSupply = marketData.circulating_supply || 0;
  const totalSupply = marketData.total_supply;
  const maxSupply = marketData.max_supply;
  const fdv = marketData.fully_diluted_valuation?.usd;

  // Transform news data for component (NewsArticle uses 'link' instead of 'url')
  const articles = newsData.articles.map((article, index) => ({
    id: `article-${index}`,
    title: article.title || '',
    source: article.source || 'Unknown',
    sourceUrl: undefined,
    url: article.link || '#',
    publishedAt: article.pubDate || new Date().toISOString(),
    imageUrl: undefined,
    excerpt: article.description,
    sentiment: undefined as 'bullish' | 'bearish' | 'neutral' | undefined,
    categories: article.category ? [article.category] : undefined,
  }));

  // JSON-LD Structured Data
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: coinData.name,
    description: coinData.description?.en?.replace(/<[^>]*>/g, '').slice(0, 200),
    image: coinData.image?.large,
    brand: {
      '@type': 'Brand',
      name: coinData.name,
    },
    offers: {
      '@type': 'Offer',
      price: price,
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <>
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
        <div className="max-w-7xl mx-auto">
          <Header />

          <CoinPageClient
            coinData={{
              id: coinData.id,
              name: coinData.name,
              symbol: coinData.symbol,
              image: coinData.image || {},
              market_cap_rank: coinData.market_cap_rank,
              categories: coinData.categories,
              description: coinData.description,
              links: coinData.links,
              genesis_date: coinData.genesis_date,
              hashing_algorithm: coinData.hashing_algorithm,
              block_time_in_minutes: coinData.block_time_in_minutes,
            }}
            priceData={{
              price,
              priceInBtc,
              priceInEth,
              change1h,
              change24h,
              change7d,
              change14d,
              change30d,
              change1y,
              high24h,
              low24h,
              lastUpdated: coinData.last_updated,
            }}
            marketData={{
              marketCap,
              marketCapRank: coinData.market_cap_rank,
              volume24h,
              circulatingSupply,
              totalSupply: totalSupply ?? null,
              maxSupply: maxSupply ?? null,
              fdv: fdv ?? null,
            }}
            athAtlData={{
              ath,
              athDate,
              athChange,
              atl,
              atlDate,
              atlChange,
            }}
            tickers={tickersData.tickers}
            ohlcData={ohlcData}
            developerData={developerData}
            communityData={communityData}
            articles={articles}
            initialTab={tab as 'overview' | 'markets' | 'historical' | 'news' | undefined}
          />

          <Footer />
        </div>
      </div>
    </>
  );
}

// Generate static paths for popular coins
export async function generateStaticParams() {
  return Object.keys(coinMeta).map((coinId) => ({
    coinId,
  }));
}
