'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  ArticleCardLarge,
  ArticleCardMedium,
  ArticleCardSmall,
  ArticleCardList,
  CardSkeletonLarge,
  CardSkeletonMedium,
  CardSkeletonSmall,
  CardSkeletonList,
} from '@/components/cards';

// Article type matching the card components
interface DemoArticle {
  id: string;
  title: string;
  description: string;
  source: string;
  timeAgo: string;
  link: string;
  pubDate: string;
  readTime: string;
  imageUrl?: string;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  readProgress: number;
  category?: string;
}

// Demo articles with different sources and sentiments
const demoArticles: DemoArticle[] = [
  {
    id: '1',
    title: 'Bitcoin Breaks $100K as Institutional Adoption Accelerates',
    description:
      'Major financial institutions continue to embrace Bitcoin, driving prices to unprecedented levels. The latest rally signals growing mainstream acceptance of cryptocurrency as a legitimate asset class.',
    source: 'CoinDesk',
    timeAgo: '2 hours ago',
    link: '#',
    pubDate: new Date().toISOString(),
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=800',
    sentiment: 'bullish',
    readProgress: 35,
  },
  {
    id: '2',
    title: 'Ethereum 2.0 Staking Reaches New Milestone',
    description:
      'Over 30 million ETH is now staked on the Ethereum network, representing a significant portion of the total supply.',
    source: 'CoinTelegraph',
    timeAgo: '4 hours ago',
    link: '#',
    pubDate: new Date().toISOString(),
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1622630998477-20aa696ecb05?w=800',
    sentiment: 'neutral',
    readProgress: 0,
  },
  {
    id: '3',
    title: 'DeFi Protocol Suffers $50M Exploit in Flash Loan Attack',
    description:
      'A major DeFi protocol was exploited through a sophisticated flash loan attack, resulting in significant losses.',
    source: 'Decrypt',
    timeAgo: '6 hours ago',
    link: '#',
    pubDate: new Date().toISOString(),
    readTime: '5 min read',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800',
    sentiment: 'bearish',
    readProgress: 65,
  },
  {
    id: '4',
    title: 'SEC Chair Signals Regulatory Framework Coming',
    description:
      'The SEC chairman outlined plans for comprehensive cryptocurrency regulation in a recent congressional hearing.',
    source: 'The Block',
    timeAgo: '8 hours ago',
    link: '#',
    pubDate: new Date().toISOString(),
    readTime: '6 min read',
    sentiment: 'neutral',
    readProgress: 0,
  },
  {
    id: '5',
    title: 'Lightning Network Capacity Doubles in 2024',
    description:
      "Bitcoin's Layer 2 scaling solution sees unprecedented growth as adoption accelerates globally.",
    source: 'Bitcoin Magazine',
    timeAgo: '12 hours ago',
    link: '#',
    pubDate: new Date().toISOString(),
    readTime: '4 min read',
    imageUrl: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?w=800',
    sentiment: 'bullish',
    readProgress: 80,
  },
  {
    id: '6',
    title: 'Solana TVL Surpasses $5 Billion Amid DeFi Surge',
    description:
      'The Solana ecosystem continues to attract DeFi protocols with its high throughput and low fees.',
    source: 'CryptoNews',
    timeAgo: '1 day ago',
    link: '#',
    pubDate: new Date().toISOString(),
    readTime: '3 min read',
    imageUrl: 'https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=800',
    sentiment: 'bullish',
    readProgress: 0,
  },
  {
    id: '7',
    title: 'Whale Alert: 10,000 BTC Moved to Exchange',
    description:
      'A large Bitcoin holder has transferred significant holdings to a major exchange, sparking selling concerns.',
    source: 'Bitcoinist',
    timeAgo: '1 day ago',
    link: '#',
    pubDate: new Date().toISOString(),
    readTime: '2 min read',
    sentiment: 'bearish',
    readProgress: 100,
  },
];

type TabType = 'large' | 'medium' | 'small' | 'list' | 'skeletons';

export default function CardsShowcasePage() {
  const [activeTab, setActiveTab] = useState<TabType>('large');
  const [showFeatures, setShowFeatures] = useState({
    bookmark: true,
    share: true,
    sentiment: true,
    progress: true,
    rank: true,
  });

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'large', label: 'Large Cards', icon: '🎯' },
    { id: 'medium', label: 'Medium Cards', icon: '📰' },
    { id: 'small', label: 'Small Cards', icon: '📋' },
    { id: 'list', label: 'List Cards', icon: '📝' },
    { id: 'skeletons', label: 'Skeletons', icon: '💀' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-16 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 via-transparent to-transparent" />
          <div className="absolute top-20 left-1/4 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />

          <div className="relative max-w-6xl mx-auto text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 text-brand-400 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-brand-400 rounded-full animate-pulse" />
              Component Library
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Article Card Components
            </h1>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Premium card components for displaying crypto news with source-specific
              styling, sentiment indicators, and interactive features.
            </p>
          </div>
        </section>

        {/* Controls */}
        <section className="px-4 pb-8">
          <div className="max-w-6xl mx-auto">
            {/* Tabs */}
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/25'
                      : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Feature Toggles */}
            <div className="flex flex-wrap justify-center gap-4 mb-8 p-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeatures.bookmark}
                  onChange={(e) =>
                    setShowFeatures((f) => ({ ...f, bookmark: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500"
                />
                Bookmark
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeatures.share}
                  onChange={(e) =>
                    setShowFeatures((f) => ({ ...f, share: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500"
                />
                Share
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeatures.sentiment}
                  onChange={(e) =>
                    setShowFeatures((f) => ({ ...f, sentiment: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500"
                />
                Sentiment
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeatures.progress}
                  onChange={(e) =>
                    setShowFeatures((f) => ({ ...f, progress: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500"
                />
                Progress
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFeatures.rank}
                  onChange={(e) =>
                    setShowFeatures((f) => ({ ...f, rank: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500"
                />
                Rank Numbers
              </label>
            </div>
          </div>
        </section>

        {/* Card Showcase */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            {/* Large Cards */}
            {activeTab === 'large' && (
              <div className="space-y-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Large Cards (Editor&apos;s Picks)
                  </h2>
                  <p className="text-slate-400">
                    Premium horizontal cards for featured content. 320px height with
                    animated mesh gradients.
                  </p>
                </div>
                <div className="space-y-6">
                  {demoArticles.slice(0, 3).map((article) => (
                    <ArticleCardLarge
                      key={article.id}
                      article={article}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Medium Cards */}
            {activeTab === 'medium' && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Medium Cards (Grid Layout)
                  </h2>
                  <p className="text-slate-400">
                    Vertical grid cards with 200px image area. Perfect for news feeds.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {demoArticles.map((article) => (
                    <ArticleCardMedium
                      key={article.id}
                      article={article}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Small Cards */}
            {activeTab === 'small' && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Small Cards (Trending List)
                  </h2>
                  <p className="text-slate-400">
                    Compact sidebar cards for trending lists with optional rank numbers.
                  </p>
                </div>
                <div className="max-w-md mx-auto space-y-3">
                  {demoArticles.map((article, idx) => (
                    <ArticleCardSmall
                      key={article.id}
                      article={article}
                      rank={showFeatures.rank ? idx + 1 : undefined}
                      showRank={showFeatures.rank}
                      showBookmark={showFeatures.bookmark}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* List Cards */}
            {activeTab === 'list' && (
              <div>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    List Cards (More Stories)
                  </h2>
                  <p className="text-slate-400">
                    Full-width horizontal cards with thumbnails and reading progress.
                  </p>
                </div>
                <div className="space-y-4 max-w-3xl mx-auto">
                  {demoArticles.map((article) => (
                    <ArticleCardList
                      key={article.id}
                      article={article}
                      showBookmark={showFeatures.bookmark}
                      showShare={showFeatures.share}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Skeleton States */}
            {activeTab === 'skeletons' && (
              <div className="space-y-12">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">Loading Skeletons</h2>
                  <p className="text-slate-400">
                    Animated loading states for each card variant.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Large Skeleton</h3>
                  <CardSkeletonLarge />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">
                    Medium Skeletons
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <CardSkeletonMedium />
                    <CardSkeletonMedium />
                    <CardSkeletonMedium />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Small Skeletons</h3>
                  <div className="max-w-md mx-auto space-y-3">
                    <CardSkeletonSmall />
                    <CardSkeletonSmall />
                    <CardSkeletonSmall />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">List Skeletons</h3>
                  <div className="space-y-4 max-w-3xl mx-auto">
                    <CardSkeletonList />
                    <CardSkeletonList />
                    <CardSkeletonList />
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Source Colors Reference */}
        <section className="px-4 pb-16">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">
              Source Color Reference
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { name: 'CoinDesk', color: 'bg-amber-500' },
                { name: 'CoinTelegraph', color: 'bg-blue-500' },
                { name: 'Decrypt', color: 'bg-purple-500' },
                { name: 'The Block', color: 'bg-cyan-500' },
                { name: 'Bitcoin Magazine', color: 'bg-orange-500' },
                { name: 'CryptoNews', color: 'bg-green-500' },
                { name: 'Bitcoinist', color: 'bg-rose-500' },
              ].map((source) => (
                <div
                  key={source.name}
                  className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-center"
                >
                  <div className={`w-12 h-12 ${source.color} rounded-lg mx-auto mb-2`} />
                  <p className="text-sm text-slate-300">{source.name}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Usage Code */}
        <section className="px-4 pb-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-white text-center mb-8">Quick Start</h2>
            <div className="bg-slate-900/80 rounded-xl border border-slate-800 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/50 border-b border-slate-700">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="ml-2 text-sm text-slate-400">page.tsx</span>
              </div>
              <pre className="p-4 overflow-x-auto text-sm">
                <code className="text-slate-300">
                  {`import {
  ArticleCardLarge,
  ArticleCardMedium,
  ArticleCardSmall,
  ArticleCardList,
} from '@/components/cards';

export default function NewsPage({ articles }) {
  return (
    <div>
      {/* Featured Article */}
      <ArticleCardLarge
        article={articles[0]}
        showBookmark
        showShare
        showSentiment
      />

      {/* Grid Layout */}
      <div className="grid grid-cols-3 gap-4">
        {articles.map((article) => (
          <ArticleCardMedium
            key={article.id}
            article={article}
            showBookmark
          />
        ))}
      </div>

      {/* Trending Sidebar */}
      <div className="space-y-2">
        {articles.slice(0, 5).map((article, idx) => (
          <ArticleCardSmall
            key={article.id}
            article={article}
            rank={idx + 1}
          />
        ))}
      </div>
    </div>
  );
}`}
                </code>
              </pre>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
