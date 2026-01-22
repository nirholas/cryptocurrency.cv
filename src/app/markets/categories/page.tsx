/**
 * Categories List Page
 * Shows all cryptocurrency categories
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cryptocurrency Categories - Free Crypto News',
  description: 'Browse cryptocurrencies by category: DeFi, NFT, Gaming, Layer 1, Layer 2, Meme coins, and more.',
};

// Category definitions with descriptions
const CATEGORIES = [
  {
    id: 'defi',
    name: 'DeFi',
    icon: '🏦',
    description: 'Decentralized Finance protocols for lending, borrowing, and trading',
    examples: ['Uniswap', 'Aave', 'Lido'],
    color: 'from-purple-500 to-indigo-500',
  },
  {
    id: 'nft',
    name: 'NFT',
    icon: '🖼️',
    description: 'Tokens and platforms powering the NFT ecosystem',
    examples: ['Blur', 'ApeCoin', 'Immutable X'],
    color: 'from-pink-500 to-rose-500',
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    description: 'Blockchain gaming and play-to-earn platforms',
    examples: ['Axie Infinity', 'The Sandbox', 'Gala'],
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'layer-1',
    name: 'Layer 1',
    icon: '⛓️',
    description: 'Base layer blockchain networks',
    examples: ['Ethereum', 'Solana', 'Avalanche'],
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'layer-2',
    name: 'Layer 2',
    icon: '📦',
    description: 'Scaling solutions built on top of Layer 1 networks',
    examples: ['Polygon', 'Arbitrum', 'Optimism'],
    color: 'from-orange-500 to-amber-500',
  },
  {
    id: 'meme',
    name: 'Meme Coins',
    icon: '🐕',
    description: 'Community-driven tokens often inspired by memes',
    examples: ['Dogecoin', 'Shiba Inu', 'Pepe'],
    color: 'from-yellow-500 to-orange-500',
  },
  {
    id: 'ai',
    name: 'AI & Big Data',
    icon: '🤖',
    description: 'Artificial intelligence and data-focused crypto projects',
    examples: ['Render', 'Fetch.ai', 'Ocean Protocol'],
    color: 'from-violet-500 to-purple-500',
  },
  {
    id: 'exchange',
    name: 'Exchange Tokens',
    icon: '💱',
    description: 'Native tokens of cryptocurrency exchanges',
    examples: ['BNB', 'OKB', 'KCS'],
    color: 'from-red-500 to-rose-500',
  },
  {
    id: 'stablecoin',
    name: 'Stablecoins',
    icon: '💵',
    description: 'Price-stable cryptocurrencies pegged to fiat currencies',
    examples: ['USDT', 'USDC', 'DAI'],
    color: 'from-emerald-500 to-teal-500',
  },
  {
    id: 'privacy',
    name: 'Privacy Coins',
    icon: '🔒',
    description: 'Cryptocurrencies focused on transaction privacy',
    examples: ['Monero', 'Zcash', 'Secret'],
    color: 'from-gray-600 to-gray-800',
  },
  {
    id: 'storage',
    name: 'Storage',
    icon: '💾',
    description: 'Decentralized storage and file sharing networks',
    examples: ['Filecoin', 'Arweave', 'Storj'],
    color: 'from-sky-500 to-blue-500',
  },
  {
    id: 'oracle',
    name: 'Oracles',
    icon: '🔮',
    description: 'Data feeds connecting blockchains to real-world data',
    examples: ['Chainlink', 'Band Protocol', 'API3'],
    color: 'from-indigo-500 to-blue-600',
  },
];

export default function CategoriesPage() {
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
            <span className="text-gray-900 dark:text-white">Categories</span>
          </nav>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              📂 Cryptocurrency Categories
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Explore cryptocurrencies organized by their primary use case
            </p>
          </div>

          {/* Categories Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.id}
                href={`/markets/categories/${category.id}`}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all"
              >
                <div className={`h-2 bg-gradient-to-r ${category.color}`} />
                <div className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{category.icon}</span>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {category.name}
                    </h2>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {category.description}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {category.examples.map((example) => (
                      <span
                        key={example}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Back link */}
          <div className="mt-8 text-center">
            <Link
              href="/markets"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to Markets
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
