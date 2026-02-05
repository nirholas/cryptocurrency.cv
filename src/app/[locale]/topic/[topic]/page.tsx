/**
 * Topic Page
 * Shows news filtered by a specific topic/tag
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Posts from '@/components/Posts';
import { searchNews } from '@/lib/crypto-news';
import type { Metadata } from 'next';
import Link from 'next/link';

// Enable on-demand ISR for topics not pre-rendered
export const dynamicParams = true;

interface Props {
  params: Promise<{ topic: string }>;
}

// Topic definitions with keywords
const topicInfo: Record<string, { 
  title: string; 
  description: string; 
  emoji: string; 
  keywords: string[];
  relatedTopics: string[];
}> = {
  'bitcoin-etf': {
    title: 'Bitcoin ETF',
    description: 'Latest news on Bitcoin ETFs, spot ETF approvals, and institutional investment products',
    emoji: '📈',
    keywords: ['bitcoin etf', 'spot etf', 'btc etf', 'blackrock', 'fidelity', 'grayscale', 'gbtc', 'ibit'],
    relatedTopics: ['bitcoin', 'institutional', 'regulation'],
  },
  'ethereum-etf': {
    title: 'Ethereum ETF',
    description: 'News about Ethereum ETF approvals, filings, and institutional Ethereum products',
    emoji: '📊',
    keywords: ['ethereum etf', 'eth etf', 'spot eth'],
    relatedTopics: ['ethereum', 'institutional', 'regulation'],
  },
  stablecoin: {
    title: 'Stablecoins',
    description: 'Stablecoin news including USDT, USDC, DAI, regulations, and depegging events',
    emoji: '💵',
    keywords: ['stablecoin', 'usdt', 'usdc', 'dai', 'tether', 'circle', 'peg', 'depeg', 'cbdc'],
    relatedTopics: ['regulation', 'defi'],
  },
  regulation: {
    title: 'Crypto Regulation',
    description: 'Cryptocurrency regulation news, SEC actions, policy updates, and legal developments',
    emoji: '⚖️',
    keywords: ['regulation', 'sec', 'cftc', 'lawsuit', 'legal', 'compliance', 'bill', 'law', 'policy', 'congress', 'senate'],
    relatedTopics: ['stablecoin', 'institutional'],
  },
  hack: {
    title: 'Crypto Hacks & Security',
    description: 'Security incidents, exchange hacks, DeFi exploits, and cybersecurity news',
    emoji: '🔓',
    keywords: ['hack', 'exploit', 'breach', 'stolen', 'vulnerability', 'security', 'attack', 'drain'],
    relatedTopics: ['defi', 'exchange'],
  },
  institutional: {
    title: 'Institutional Crypto',
    description: 'Institutional investment news, corporate Bitcoin adoption, and Wall Street developments',
    emoji: '🏦',
    keywords: ['institutional', 'blackrock', 'fidelity', 'jpmorgan', 'goldman', 'morgan stanley', 'corporate', 'treasury', 'microstrategy'],
    relatedTopics: ['bitcoin-etf', 'regulation'],
  },
  layer2: {
    title: 'Layer 2 & Scaling',
    description: 'Layer 2 scaling solutions, rollups, and blockchain scalability news',
    emoji: '🔗',
    keywords: ['layer 2', 'l2', 'rollup', 'arbitrum', 'optimism', 'base', 'zksync', 'polygon', 'scaling', 'lightning'],
    relatedTopics: ['ethereum', 'bitcoin'],
  },
  airdrop: {
    title: 'Airdrops',
    description: 'Cryptocurrency airdrop announcements, eligibility, and token distribution news',
    emoji: '🪂',
    keywords: ['airdrop', 'token distribution', 'claim', 'eligibility', 'snapshot'],
    relatedTopics: ['defi', 'layer2'],
  },
  mining: {
    title: 'Crypto Mining',
    description: 'Bitcoin mining, hashrate, mining difficulty, and proof-of-work news',
    emoji: '⛏️',
    keywords: ['mining', 'miner', 'hashrate', 'difficulty', 'pow', 'asic', 'mining pool', 'halving'],
    relatedTopics: ['bitcoin'],
  },
  ai: {
    title: 'AI & Crypto',
    description: 'Artificial intelligence and cryptocurrency intersection, AI tokens, and blockchain AI',
    emoji: '🤖',
    keywords: ['ai', 'artificial intelligence', 'machine learning', 'gpt', 'chatgpt', 'bittensor', 'render', 'fetch'],
    relatedTopics: ['defi'],
  },
  gaming: {
    title: 'Crypto Gaming',
    description: 'Blockchain gaming, play-to-earn, GameFi, and metaverse gaming news',
    emoji: '🎮',
    keywords: ['gaming', 'play-to-earn', 'p2e', 'gamefi', 'metaverse', 'axie', 'sandbox', 'decentraland'],
    relatedTopics: ['nft'],
  },
  exchange: {
    title: 'Crypto Exchanges',
    description: 'Cryptocurrency exchange news, listings, delistings, and trading platform updates',
    emoji: '🏪',
    keywords: ['exchange', 'binance', 'coinbase', 'kraken', 'okx', 'bybit', 'listing', 'delist', 'trading'],
    relatedTopics: ['regulation', 'hack'],
  },
  whale: {
    title: 'Whale Activity',
    description: 'Large cryptocurrency transactions, whale movements, and significant on-chain activity',
    emoji: '🐋',
    keywords: ['whale', 'large transaction', 'move', 'transfer', 'accumulation', 'dump'],
    relatedTopics: ['bitcoin', 'ethereum'],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { topic } = await params;
  const info = topicInfo[topic];
  
  return {
    title: info?.title || topic,
    description: info?.description || `Latest news about ${topic}`,
  };
}

export const revalidate = 300; // 5 minutes

export default async function TopicPage({ params }: Props) {
  const { topic } = await params;
  const info = topicInfo[topic];
  
  const keywords = info?.keywords.join(',') || topic;
  const data = await searchNews(keywords, 30);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Topic Header */}
          <div className="text-center mb-8">
            <span className="text-5xl mb-4 block">{info?.emoji || '📰'}</span>
            <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-white">{info?.title || topic}</h1>
            <p className="text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              {info?.description || `Latest news about ${topic}`}
            </p>
            <p className="text-sm text-gray-500 dark:text-slate-500 mt-2">
              {data.totalCount} articles found
            </p>
          </div>

          {/* Related Topics */}
          {info?.relatedTopics && info.relatedTopics.length > 0 && (
            <div className="mb-8 text-center">
              <span className="text-sm text-gray-500 dark:text-slate-500">Related: </span>
              {info.relatedTopics.map((related, index) => (
                <span key={related}>
                  <Link
                    href={`/topic/${related}`}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {topicInfo[related]?.title || related}
                  </Link>
                  {index < info.relatedTopics.length - 1 && <span className="text-gray-400 dark:text-slate-600"> • </span>}
                </span>
              ))}
            </div>
          )}

          {/* News Grid */}
          {data.articles.length > 0 ? (
            <Posts articles={data.articles} />
          ) : (
            <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
              <span className="text-5xl mb-4 block">🔍</span>
              <p className="text-gray-500 dark:text-slate-400 mb-2">No articles found for this topic.</p>
              <p className="text-sm text-gray-400 dark:text-slate-500">
                Try checking back later or browse all news.
              </p>
            </div>
          )}

          {/* All Topics Link */}
          <div className="text-center mt-8">
            <Link href="/topics" className="text-blue-600 dark:text-blue-400 hover:underline">
              View All Topics →
            </Link>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}

// Generate static paths
export async function generateStaticParams() {
  // Skip during Vercel build - use ISR instead
  if (process.env.VERCEL_ENV || process.env.CI) {
    return [];
  }
  return Object.keys(topicInfo).map((topic) => ({
    topic,
  }));
}
