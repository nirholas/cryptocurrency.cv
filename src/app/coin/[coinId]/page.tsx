/**
 * Individual Coin Page
 * Shows news related to a specific cryptocurrency + market data
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Posts from '@/components/Posts';
import { searchNews } from '@/lib/crypto-news';
import { getCoinDetails, getTopCoins, formatPrice, formatNumber, formatPercent } from '@/lib/market-data';
import type { Metadata } from 'next';
import Link from 'next/link';

interface Props {
  params: Promise<{ coinId: string }>;
}

// Map of common coin IDs to their details
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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { coinId } = await params;
  const meta = coinMeta[coinId];
  const name = meta?.name || coinId;
  
  return {
    title: `${name} News & Price`,
    description: `Latest ${name} news, price, and market data. Real-time updates and analysis.`,
  };
}

export const revalidate = 60; // Revalidate every minute

export default async function CoinPage({ params }: Props) {
  const { coinId } = await params;
  
  if (!coinId) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Header />
          <main className="px-4 py-16 text-center">
            <span className="text-6xl mb-4 block">🔍</span>
            <h1 className="text-2xl font-bold mb-2">Coin Not Found</h1>
            <p className="text-gray-600 mb-6">Invalid coin ID</p>
            <Link href="/markets" className="text-blue-600 hover:underline">
              ← Back to Markets
            </Link>
          </main>
          <Footer />
        </div>
      </div>
    );
  }
  
  const meta = coinMeta[coinId];
  
  // Fetch coin data and news in parallel
  const [coinData, topCoins, newsData] = await Promise.all([
    getCoinDetails(coinId),
    getTopCoins(100),
    searchNews(meta?.keywords?.join(',') || coinId, 20),
  ]);

  // Find the coin in top coins for sparkline
  const coinFromList = topCoins.find(c => c.id === coinId);

  if (!coinData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Header />
          <main className="px-4 py-16 text-center">
            <span className="text-6xl mb-4 block">🔍</span>
            <h1 className="text-2xl font-bold mb-2">Coin Not Found</h1>
            <p className="text-gray-600 mb-6">We couldn't find data for "{coinId}"</p>
            <Link href="/markets" className="text-blue-600 hover:underline">
              ← Back to Markets
            </Link>
          </main>
          <Footer />
        </div>
      </div>
    );
  }

  const price = coinData.market_data?.current_price?.usd;
  const change24h = coinData.market_data?.price_change_percentage_24h;
  const change7d = coinData.market_data?.price_change_percentage_7d;
  const change30d = coinData.market_data?.price_change_percentage_30d;
  const marketCap = coinData.market_data?.market_cap?.usd;
  const volume = coinData.market_data?.total_volume?.usd;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Coin Header */}
          <div className="bg-white rounded-xl border p-6 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                {coinData.image?.large && (
                  <img 
                    src={coinData.image.large} 
                    alt={coinData.name} 
                    className="w-16 h-16 rounded-full"
                  />
                )}
                <div>
                  <h1 className="text-3xl font-bold">{coinData.name}</h1>
                  <p className="text-gray-500">{coinData.symbol?.toUpperCase()}</p>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-3xl font-bold">{formatPrice(price)}</p>
                <p className={`text-lg ${(change24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(change24h)} (24h)
                </p>
              </div>
            </div>

            {/* Price Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div>
                <p className="text-gray-500 text-sm">Market Cap</p>
                <p className="font-semibold">${formatNumber(marketCap)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">24h Volume</p>
                <p className="font-semibold">${formatNumber(volume)}</p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">7d Change</p>
                <p className={`font-semibold ${(change7d || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(change7d)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 text-sm">30d Change</p>
                <p className={`font-semibold ${(change30d || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(change30d)}
                </p>
              </div>
            </div>

            {/* 7-Day Sparkline */}
            {coinFromList?.sparkline_in_7d?.price && (
              <div className="mt-6 pt-6 border-t">
                <p className="text-gray-500 text-sm mb-2">7-Day Price Chart</p>
                <SparklineChart data={coinFromList.sparkline_in_7d.price} positive={(change7d || 0) >= 0} />
              </div>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t">
              {coinData.links?.homepage?.[0] && (
                <a
                  href={coinData.links.homepage[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition"
                >
                  🌐 Website
                </a>
              )}
              {coinData.links?.blockchain_site?.[0] && (
                <a
                  href={coinData.links.blockchain_site[0]}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition"
                >
                  🔗 Explorer
                </a>
              )}
              {coinData.links?.twitter_screen_name && (
                <a
                  href={`https://twitter.com/${coinData.links.twitter_screen_name}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 transition"
                >
                  🐦 Twitter
                </a>
              )}
            </div>
          </div>

          {/* Description */}
          {coinData.description?.en && (
            <div className="bg-white rounded-xl border p-6 mb-6">
              <h2 className="font-bold text-lg mb-3">About {coinData.name}</h2>
              <div 
                className="text-gray-600 prose max-w-none"
                dangerouslySetInnerHTML={{ 
                  __html: coinData.description.en.split('. ').slice(0, 3).join('. ') + '.'
                }}
              />
            </div>
          )}

          {/* Related News */}
          <div className="mb-6">
            <h2 className="font-bold text-xl mb-4">📰 {coinData.name} News</h2>
            {newsData.articles.length > 0 ? (
              <Posts articles={newsData.articles} />
            ) : (
              <div className="bg-white rounded-xl border p-8 text-center">
                <p className="text-gray-500">No recent news found for {coinData.name}</p>
              </div>
            )}
          </div>

          {/* Back Link */}
          <div className="text-center">
            <Link href="/markets" className="text-blue-600 hover:underline">
              ← Back to Markets
            </Link>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

// Simple sparkline component
function SparklineChart({ data, positive }: { data: number[]; positive: boolean }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg viewBox="0 0 100 50" className="w-full h-16" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={positive ? '#22c55e' : '#ef4444'}
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

// Generate static paths for popular coins
export async function generateStaticParams() {
  return Object.keys(coinMeta).map((coinId) => ({
    coinId,
  }));
}
