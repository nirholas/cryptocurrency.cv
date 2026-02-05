/**
 * Category Page - Dynamic route for news categories
 * Shows filtered news by category (bitcoin, defi, markets, etc.)
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Posts from '@/components/Posts';
import CategoryNav from '@/components/CategoryNav';
import { getNewsByCategory } from '@/lib/crypto-news';
import type { Metadata } from 'next';

// Enable on-demand ISR for categories not pre-rendered
export const dynamicParams = true;

interface Props {
  params: Promise<{ category: string }>;
}

const categoryInfo: Record<string, { title: string; description: string; emoji: string }> = {
  bitcoin: {
    title: 'Bitcoin News',
    description: 'Latest Bitcoin news, price analysis, and BTC updates',
    emoji: '₿',
  },
  ethereum: {
    title: 'Ethereum News', 
    description: 'Latest Ethereum news, ETH updates, and ecosystem developments',
    emoji: 'Ξ',
  },
  defi: {
    title: 'DeFi News',
    description: 'Decentralized finance news, protocols, and yield updates',
    emoji: '🏦',
  },
  nft: {
    title: 'NFT News',
    description: 'Non-fungible token news, collections, and marketplace updates',
    emoji: '🎨',
  },
  regulation: {
    title: 'Crypto Regulation',
    description: 'Cryptocurrency regulation, policy, and legal news',
    emoji: '⚖️',
  },
  markets: {
    title: 'Market News',
    description: 'Cryptocurrency market analysis, trading, and price movements',
    emoji: '📈',
  },
  mining: {
    title: 'Mining News',
    description: 'Cryptocurrency mining news, hashrate, and industry updates',
    emoji: '⛏️',
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const info = categoryInfo[category] || {
    title: `${category} News`,
    description: `Latest ${category} cryptocurrency news`,
    emoji: '📰',
  };

  return {
    title: `${info.title} - Free Crypto News`,
    description: info.description,
  };
}

export const revalidate = 300; // 5 minutes

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const info = categoryInfo[category] || {
    title: `${category?.charAt(0)?.toUpperCase() || ''}${category?.slice(1) || ''} News`,
    description: `Latest ${category} news`,
    emoji: '📰',
  };

  // Get news filtered by category
  const data = await getNewsByCategory(category, 50);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <Header />
        <CategoryNav activeCategory={category} />
        
        <main className="px-4 py-8">
          {/* Category Header */}
          <div className="text-center mb-8">
            <span className="text-5xl mb-4 block">{info.emoji}</span>
            <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">{info.title}</h1>
            <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              {info.description}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">
              {data.articles.length} articles
            </p>
          </div>

          {/* News Grid */}
          {data.articles.length > 0 ? (
            <Posts articles={data.articles} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-slate-400">No articles found in this category.</p>
              <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">
                Try checking back later or browse all news.
              </p>
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

// Generate static paths for common categories
export async function generateStaticParams() {
  // Skip during Vercel build - use ISR instead
  if (process.env.VERCEL_ENV || process.env.CI) {
    return [];
  }
  return Object.keys(categoryInfo).map((category) => ({
    category,
  }));
}
