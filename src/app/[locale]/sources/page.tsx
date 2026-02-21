/**
 * All Sources Page
 * Browse all news sources
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getSources } from '@/lib/crypto-news';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbStructuredData } from '@/components/StructuredData';

export const metadata: Metadata = {
  title: 'Crypto News Sources | 200+ Trusted Publishers',
  description: 'Browse all 200+ crypto news sources aggregated by Free Crypto News. Trusted publishers including CoinDesk, The Block, Decrypt, Cointelegraph, and more.',
  keywords: ['crypto news sources', 'coindesk', 'cointelegraph', 'the block', 'decrypt', 'crypto publishers', 'news aggregator sources'],
  openGraph: {
    title: 'Crypto News Sources | 200+ Trusted Publishers',
    description: 'Browse 200+ crypto news sources including CoinDesk, The Block, Decrypt, and more.',
    type: 'website',
  },
  alternates: {
    canonical: '/sources',
  },
};

export const revalidate = 300;

// Source metadata for display
const sourceDetails: Record<string, {
  description: string;
  focus: string[];
  emoji: string;
  color: string;
}> = {
  coindesk: {
    description: 'The leading media platform for the crypto industry',
    focus: ['News', 'Markets', 'Research'],
    emoji: '📰',
    color: 'from-blue-500 to-blue-600',
  },
  theblock: {
    description: 'Research, analysis, and news for digital assets',
    focus: ['Research', 'Data', 'Analysis'],
    emoji: '📊',
    color: 'from-purple-500 to-purple-600',
  },
  decrypt: {
    description: 'News and educational content about crypto and Web3',
    focus: ['News', 'Learn', 'Culture'],
    emoji: '🔓',
    color: 'from-green-500 to-green-600',
  },
  cointelegraph: {
    description: 'Independent media covering blockchain and fintech',
    focus: ['News', 'Markets', 'Magazine'],
    emoji: '📡',
    color: 'from-gray-400 to-gray-600',
  },
  bitcoinmagazine: {
    description: 'The oldest and most established Bitcoin publication',
    focus: ['Bitcoin', 'Lightning', 'Culture'],
    emoji: '₿',
    color: 'from-gray-500 to-gray-700',
  },
  blockworks: {
    description: 'Financial media for institutional crypto investors',
    focus: ['Institutional', 'Markets', 'Research'],
    emoji: '🏦',
    color: 'from-indigo-500 to-indigo-600',
  },
  defiant: {
    description: 'The leading news site for DeFi and Web3',
    focus: ['DeFi', 'DAOs', 'Web3'],
    emoji: '🦾',
    color: 'from-pink-500 to-pink-600',
  },
};

export default async function SourcesPage() {
  const { sources } = await getSources();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <BreadcrumbStructuredData
        items={[
          { name: 'Home', url: 'https://cryptocurrency.cv' },
          { name: 'News Sources', url: 'https://cryptocurrency.cv/sources' },
        ]}
      />
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Page Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">📚 News Sources</h1>
            <p className="text-xl text-gray-600 dark:text-slate-400 max-w-2xl mx-auto">
              We aggregate news from the most trusted sources in crypto journalism.
              All content is fetched in real-time from official RSS feeds.
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 text-center">
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{sources.length}</p>
              <p className="text-gray-500 dark:text-slate-400">Active Sources</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 text-center">
              <p className="text-4xl font-bold text-green-600 dark:text-green-400">100%</p>
              <p className="text-gray-500 dark:text-slate-400">Free Access</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 text-center">
              <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">Real-time</p>
              <p className="text-gray-500 dark:text-slate-400">RSS Feeds</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-200 dark:border-slate-700 text-center">
              <p className="text-4xl font-bold text-gray-600 dark:text-gray-400">0</p>
              <p className="text-gray-500 dark:text-slate-400">API Keys Required</p>
            </div>
          </div>

          {/* Sources Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {sources.map(source => {
              const details = sourceDetails[source.key];
              return (
                <Link
                  key={source.key}
                  href={`/source/${source.key}`}
                  className="group bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-lg transition"
                >
                  {/* Color Banner */}
                  <div className={`h-2 bg-gradient-to-r ${details?.color || 'from-gray-400 to-gray-500'}`} />
                  
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{details?.emoji || '📰'}</span>
                        <div>
                          <h2 className="font-bold text-xl text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                            {source.name}
                          </h2>
                          <span className={`inline-flex items-center gap-1 text-xs ${
                            source.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            <span className={`w-2 h-2 rounded-full ${
                              source.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                            {source.status === 'active' ? 'Active' : 'Unavailable'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">
                      {details?.description || 'Crypto news source'}
                    </p>
                    
                    <div className="flex flex-wrap gap-2">
                      {(details?.focus || [source.category]).map(tag => (
                        <span 
                          key={tag}
                          className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 px-2 py-1 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Info Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="text-3xl mb-2">📡</div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">RSS Aggregation</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm">
                  We fetch news directly from official RSS feeds of each source, ensuring 
                  accurate and up-to-date content.
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Real-time Updates</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm">
                  New articles appear within minutes of publication. Our system 
                  continuously monitors all sources for fresh content.
                </p>
              </div>
              <div>
                <div className="text-3xl mb-2">🔗</div>
                <h3 className="font-bold mb-2 text-gray-900 dark:text-white">Direct Links</h3>
                <p className="text-gray-600 dark:text-slate-400 text-sm">
                  All articles link directly to the original source. We believe in 
                  supporting quality journalism.
                </p>
              </div>
            </div>
          </div>

          {/* API CTA */}
          <div className="mt-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white text-center">
            <h2 className="text-2xl font-bold mb-2">Build With Our API</h2>
            <p className="text-blue-100 mb-4">
              Access all these sources programmatically with our free API. No registration required.
            </p>
            <div className="flex justify-center gap-4">
              <Link 
                href="/examples"
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition"
              >
                View Examples
              </Link>
              <a 
                href="https://github.com/nirholas/free-crypto-news"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-400 transition"
              >
                GitHub →
              </a>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
