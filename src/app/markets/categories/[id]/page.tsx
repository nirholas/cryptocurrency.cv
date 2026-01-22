/**
 * Category Detail Page
 * Shows coins in a specific category
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { getTopCoins, formatPrice, formatPercent, formatNumber } from '@/lib/market-data';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

// Category metadata
const CATEGORY_META: Record<string, { name: string; icon: string; description: string }> = {
  defi: {
    name: 'DeFi',
    icon: '🏦',
    description: 'Decentralized Finance protocols',
  },
  nft: {
    name: 'NFT',
    icon: '🖼️',
    description: 'NFT ecosystem tokens',
  },
  gaming: {
    name: 'Gaming',
    icon: '🎮',
    description: 'Blockchain gaming tokens',
  },
  'layer-1': {
    name: 'Layer 1',
    icon: '⛓️',
    description: 'Base layer blockchains',
  },
  'layer-2': {
    name: 'Layer 2',
    icon: '📦',
    description: 'Scaling solutions',
  },
  meme: {
    name: 'Meme Coins',
    icon: '🐕',
    description: 'Community-driven meme tokens',
  },
  ai: {
    name: 'AI & Big Data',
    icon: '🤖',
    description: 'AI and data-focused projects',
  },
  exchange: {
    name: 'Exchange Tokens',
    icon: '💱',
    description: 'Cryptocurrency exchange native tokens',
  },
  stablecoin: {
    name: 'Stablecoins',
    icon: '💵',
    description: 'Price-stable cryptocurrencies',
  },
  privacy: {
    name: 'Privacy Coins',
    icon: '🔒',
    description: 'Privacy-focused cryptocurrencies',
  },
  storage: {
    name: 'Storage',
    icon: '💾',
    description: 'Decentralized storage networks',
  },
  oracle: {
    name: 'Oracles',
    icon: '🔮',
    description: 'Blockchain oracle networks',
  },
};

// Example coin mappings by category (in production, use CoinGecko categories API)
const CATEGORY_COINS: Record<string, string[]> = {
  defi: ['uniswap', 'aave', 'lido-dao', 'maker', 'curve-dao-token', 'compound-governance-token', 'sushi', 'yearn-finance', '1inch', 'pancakeswap-token'],
  nft: ['blur', 'apecoin', 'immutable-x', 'flow', 'theta-token', 'enjincoin', 'decentraland', 'the-sandbox', 'axie-infinity', 'looks-rare'],
  gaming: ['axie-infinity', 'the-sandbox', 'gala', 'illuvium', 'stepn', 'vulcan-forged', 'ultra', 'magic', 'yield-guild-games', 'merit-circle'],
  'layer-1': ['bitcoin', 'ethereum', 'solana', 'avalanche-2', 'near', 'aptos', 'sui', 'fantom', 'tron', 'cosmos'],
  'layer-2': ['matic-network', 'arbitrum', 'optimism', 'starknet', 'immutable-x', 'loopring', 'metis-token', 'mantle', 'base', 'scroll'],
  meme: ['dogecoin', 'shiba-inu', 'pepe', 'floki', 'bonk', 'dogwifcoin', 'memecoin', 'wojak', 'book-of-meme', 'brett'],
  ai: ['render-token', 'fetch-ai', 'ocean-protocol', 'singularitynet', 'numeraire', 'worldcoin-wld', 'arkham', 'bittensor', 'phala-network', 'cortex'],
  exchange: ['binancecoin', 'okb', 'kucoin-shares', 'crypto-com-chain', 'huobi-token', 'ftx-token', 'bitget-token', 'mx-token', 'bitmax-token', 'leo-token'],
  stablecoin: ['tether', 'usd-coin', 'dai', 'frax', 'trueusd', 'paxos-standard', 'paypal-usd', 'liquity-usd', 'celo-dollar', 'reserve-rights-token'],
  privacy: ['monero', 'zcash', 'dash', 'secret', 'horizen', 'verge', 'beam', 'decred', 'pivx', 'firo'],
  storage: ['filecoin', 'arweave', 'storj', 'siacoin', 'bittorent', 'internet-computer', 'crust-network', 'bluzelle', 'opacity', 'stratos'],
  oracle: ['chainlink', 'band-protocol', 'api3', 'uma', 'tellor', 'dia-data', 'pyth-network', 'flux', 'nest-protocol', 'razor-network'],
};

interface CategoryPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { id } = await params;
  const category = CATEGORY_META[id];
  if (!category) return { title: 'Category Not Found' };
  
  return {
    title: `${category.name} Cryptocurrencies - Free Crypto News`,
    description: `Browse ${category.name} cryptocurrencies. ${category.description}`,
  };
}

export function generateStaticParams() {
  return Object.keys(CATEGORY_META).map((id) => ({ id }));
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { id } = await params;
  const category = CATEGORY_META[id];
  
  if (!category) {
    notFound();
  }

  const allCoins = await getTopCoins(250);
  const categoryCoins = CATEGORY_COINS[id] || [];
  
  // Filter coins that belong to this category
  const coins = allCoins.filter((coin) => 
    categoryCoins.some((catCoin) => 
      coin.id.toLowerCase() === catCoin.toLowerCase() ||
      coin.symbol.toLowerCase() === catCoin.toLowerCase()
    )
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
            <Link href="/markets" className="hover:text-blue-600 dark:hover:text-blue-400">
              Markets
            </Link>
            <span>/</span>
            <Link href="/markets/categories" className="hover:text-blue-600 dark:hover:text-blue-400">
              Categories
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">{category.name}</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {category.icon} {category.name} Cryptocurrencies
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {category.description} • {coins.length} coins
            </p>
          </div>

          {/* Coins Table */}
          {coins.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-medium p-4">#</th>
                      <th className="text-left text-gray-500 dark:text-gray-400 text-sm font-medium p-4">Coin</th>
                      <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4">Price</th>
                      <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4">24h %</th>
                      <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4 hidden md:table-cell">7d %</th>
                      <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4 hidden lg:table-cell">Market Cap</th>
                      <th className="text-right text-gray-500 dark:text-gray-400 text-sm font-medium p-4 hidden lg:table-cell">Volume (24h)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coins.map((coin, index) => (
                      <tr
                        key={coin.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <td className="p-4 text-gray-500 dark:text-gray-400">{index + 1}</td>
                        <td className="p-4">
                          <Link href={`/coin/${coin.id}`} className="flex items-center gap-3">
                            <div className="relative w-8 h-8">
                              {coin.image && (
                                <Image
                                  src={coin.image}
                                  alt={coin.name}
                                  fill
                                  className="rounded-full object-cover"
                                  unoptimized
                                />
                              )}
                            </div>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                                {coin.name}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">
                                {coin.symbol.toUpperCase()}
                              </span>
                            </div>
                          </Link>
                        </td>
                        <td className="p-4 text-right font-medium text-gray-900 dark:text-white">
                          {formatPrice(coin.current_price)}
                        </td>
                        <td
                          className={`p-4 text-right font-medium ${
                            (coin.price_change_percentage_24h || 0) >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatPercent(coin.price_change_percentage_24h)}
                        </td>
                        <td
                          className={`p-4 text-right hidden md:table-cell ${
                            (coin.price_change_percentage_7d_in_currency || 0) >= 0
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {formatPercent(coin.price_change_percentage_7d_in_currency)}
                        </td>
                        <td className="p-4 text-right text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                          ${formatNumber(coin.market_cap)}
                        </td>
                        <td className="p-4 text-right text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                          ${formatNumber(coin.total_volume)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <span className="text-4xl mb-4 block">🔍</span>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No coins found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                No cryptocurrencies available in this category at the moment.
              </p>
            </div>
          )}

          {/* Back link */}
          <div className="mt-8 text-center flex justify-center gap-6">
            <Link
              href="/markets/categories"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← All Categories
            </Link>
            <Link
              href="/markets"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Back to Markets
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
