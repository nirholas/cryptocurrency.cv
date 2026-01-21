/**
 * Source Page - News from a specific publisher
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Posts from '@/components/Posts';
import { getLatestNews } from '@/lib/crypto-news';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Source metadata
const sourceInfo: Record<string, {
  name: string;
  description: string;
  website: string;
  twitter?: string;
  focus: string[];
  founded?: string;
}> = {
  coindesk: {
    name: 'CoinDesk',
    description: 'CoinDesk is a leading media platform for the crypto asset and blockchain technology community. Founded in 2013, CoinDesk provides news, data, events, research, and educational content.',
    website: 'https://www.coindesk.com',
    twitter: 'CoinDesk',
    focus: ['News', 'Markets', 'Research', 'Events'],
    founded: '2013',
  },
  theblock: {
    name: 'The Block',
    description: 'The Block is a leading research, analysis, and news publication in the digital asset space. Known for in-depth journalism and comprehensive market research.',
    website: 'https://www.theblock.co',
    twitter: 'TheBlock__',
    focus: ['Research', 'Analysis', 'Data', 'Enterprise'],
    founded: '2018',
  },
  decrypt: {
    name: 'Decrypt',
    description: 'Decrypt is a media company providing news, information, and educational content about cryptocurrencies, blockchain technology, and the decentralized web.',
    website: 'https://decrypt.co',
    twitter: 'decaborating',
    focus: ['News', 'Learn', 'Culture', 'Gaming'],
    founded: '2018',
  },
  cointelegraph: {
    name: 'CoinTelegraph',
    description: 'Cointelegraph is the leading independent digital media resource covering a wide range of news on blockchain technology, crypto assets, and emerging fintech trends.',
    website: 'https://cointelegraph.com',
    twitter: 'Cointelegraph',
    focus: ['News', 'Markets', 'Magazine', 'Research'],
    founded: '2013',
  },
  bitcoinmagazine: {
    name: 'Bitcoin Magazine',
    description: 'Bitcoin Magazine is the oldest and most established source of news, information and expert commentary on Bitcoin. Focused exclusively on Bitcoin and its ecosystem.',
    website: 'https://bitcoinmagazine.com',
    twitter: 'BitcoinMagazine',
    focus: ['Bitcoin', 'Lightning', 'Culture', 'Events'],
    founded: '2011',
  },
  blockworks: {
    name: 'Blockworks',
    description: 'Blockworks is a financial media brand that delivers breaking news and premium insights about digital assets to investors worldwide.',
    website: 'https://blockworks.co',
    twitter: 'Blockworks_',
    focus: ['Institutional', 'Markets', 'Research', 'Podcasts'],
    founded: '2018',
  },
  defiant: {
    name: 'The Defiant',
    description: 'The Defiant is the leading news site for DeFi and Web3. Covering decentralized finance, DAOs, NFTs, and the open financial system.',
    website: 'https://thedefiant.io',
    twitter: 'DefiantNews',
    focus: ['DeFi', 'DAOs', 'Web3', 'Tutorials'],
    founded: '2019',
  },
};

type SourceKey = keyof typeof sourceInfo;

interface PageProps {
  params: Promise<{ source: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { source } = await params;
  const info = sourceInfo[source as SourceKey];
  
  if (!info) {
    return {
      title: 'Source Not Found',
    };
  }
  
  return {
    title: `${info.name} News`,
    description: `Latest crypto news from ${info.name}. ${info.description}`,
  };
}

export function generateStaticParams() {
  return Object.keys(sourceInfo).map(source => ({ source }));
}

export const revalidate = 60;

export default async function SourcePage({ params }: PageProps) {
  const { source } = await params;
  const info = sourceInfo[source as SourceKey];
  
  if (!info) {
    notFound();
  }
  
  const newsData = await getLatestNews(50, source);
  
  // Get all sources for navigation
  const allSources = Object.entries(sourceInfo);
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Source Header */}
          <div className="bg-white rounded-xl border p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{info.name}</h1>
                <p className="text-gray-600 mb-4">{info.description}</p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {info.focus.map(tag => (
                    <span key={tag} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  {info.founded && (
                    <span>Founded: {info.founded}</span>
                  )}
                  <a 
                    href={info.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Visit Website →
                  </a>
                  {info.twitter && (
                    <a 
                      href={`https://twitter.com/${info.twitter}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      @{info.twitter}
                    </a>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Active Source
                </span>
              </div>
            </div>
          </div>

          {/* Source Navigation */}
          <div className="flex overflow-x-auto gap-2 pb-4 mb-6 scrollbar-hide">
            {allSources.map(([key, src]) => (
              <Link
                key={key}
                href={`/source/${key}`}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition ${
                  key === source
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border hover:bg-gray-50'
                }`}
              >
                {src.name}
              </Link>
            ))}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-gray-500 text-sm">Articles</p>
              <p className="text-2xl font-bold">{newsData.totalCount}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-gray-500 text-sm">Focus</p>
              <p className="text-2xl font-bold">{info.focus[0]}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-gray-500 text-sm">Since</p>
              <p className="text-2xl font-bold">{info.founded || 'N/A'}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-gray-500 text-sm">Status</p>
              <p className="text-2xl font-bold text-green-600">Active</p>
            </div>
          </div>

          {/* Articles */}
          <div className="mb-6">
            <h2 className="text-xl font-bold mb-4">
              Latest from {info.name}
            </h2>
          </div>
          
          {newsData.articles.length > 0 ? (
            <Posts articles={newsData.articles} />
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center">
              <p className="text-gray-600">No articles available at the moment.</p>
              <p className="text-gray-500 text-sm mt-2">Check back soon for updates.</p>
            </div>
          )}
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
