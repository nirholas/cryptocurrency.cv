/**
 * DeFi Chain Detail Page
 * Shows chain-specific TVL, top protocols on that chain, and related news
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  getChainBySlug, 
  getTopProtocols,
  getTopChains,
  formatNumber, 
} from '@/lib/market-data';
import { searchNews } from '@/lib/crypto-news';
import Posts from '@/components/Posts';
import ProtocolImage from '@/components/ProtocolImage';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';

// Enable on-demand ISR for chains not pre-rendered
export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const chain = await getChainBySlug(slug);
  
  if (!chain) {
    return {
      title: 'Chain Not Found',
      description: 'The requested blockchain could not be found.',
    };
  }
  
  return {
    title: `${chain.name} DeFi - TVL & Protocols`,
    description: `${chain.name} blockchain DeFi ecosystem with $${formatNumber(chain.tvl)} Total Value Locked. Explore top protocols, analytics, and news.`,
    openGraph: {
      title: `${chain.name} DeFi - TVL & Protocols`,
      description: `${chain.name} blockchain DeFi analytics and news`,
      type: 'website',
    },
  };
}

export const revalidate = 300; // Revalidate every 5 minutes

/**
 * Generate static params for all locale + chain combinations
 */
export async function generateStaticParams() {
  // Skip during Vercel build - use ISR instead
  if (process.env.VERCEL_ENV || process.env.CI) {
    return [];
  }
  const chains = await getTopChains(30);
  
  return locales.flatMap((locale) =>
    chains.map((chain) => ({
      locale,
      slug: chain.gecko_id || chain.name.toLowerCase().replace(/\s+/g, '-'),
    }))
  );
}

export default async function ChainPage({ params }: Props) {
  const { slug } = await params;
  const [chain, allProtocols] = await Promise.all([
    getChainBySlug(slug),
    getTopProtocols(100),
  ]);
  
  if (!chain) {
    notFound();
  }
  
  // Get protocols on this chain
  const chainProtocols = allProtocols
    .filter(p => 
      p.chain?.toLowerCase() === chain.name.toLowerCase() ||
      p.chains?.some(c => c.toLowerCase() === chain.name.toLowerCase())
    )
    .slice(0, 20);
  
  // Get related news
  const newsData = await searchNews(chain.name, 10);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 text-sm">
            <ol className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-gray-900 dark:hover:text-white transition-colors">Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/defi" className="hover:text-gray-900 dark:hover:text-white transition-colors">DeFi</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-gray-900 dark:text-white">{chain.name}</li>
            </ol>
          </nav>

          {/* Chain Header */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 md:p-8 mb-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  ⛓️ {chain.name}
                </h1>
                {chain.tokenSymbol && (
                  <p className="text-gray-500 dark:text-slate-400 mt-1 font-medium">{chain.tokenSymbol}</p>
                )}
              </div>
              
              {/* Quick Stats */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-4 md:ml-auto md:max-w-lg">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-500 dark:text-slate-400 text-sm">Total TVL</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">${formatNumber(chain.tvl)}</p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                  <p className="text-gray-500 dark:text-slate-400 text-sm">Protocols</p>
                  <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{chainProtocols.length}+</p>
                </div>
                {chain.chainId && (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-center">
                    <p className="text-gray-500 dark:text-slate-400 text-sm">Chain ID</p>
                    <p className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">{chain.chainId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Protocols on Chain (2/3) */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">🏆 Top Protocols on {chain.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Ranked by TVL on this chain</p>
                </div>
                
                {chainProtocols.length > 0 ? (
                  <div className="divide-y divide-gray-200 dark:divide-slate-700">
                    {chainProtocols.map((protocol, index) => (
                      <Link 
                        key={protocol.id} 
                        href={`/defi/protocol/${protocol.slug || protocol.id}`}
                        className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-gray-400 dark:text-slate-500 w-6 text-sm">{index + 1}</span>
                          {protocol.logo && (
                            <ProtocolImage 
                              src={protocol.logo} 
                              alt={protocol.name}
                              className="w-10 h-10 rounded-full"
                            />
                          )}
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{protocol.name}</span>
                            <div className="text-xs text-gray-500 dark:text-slate-400">{protocol.category}</div>
                          </div>
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">${formatNumber(protocol.tvl)}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                    No protocols found for this chain yet.
                  </div>
                )}
              </div>

              {/* Chain News */}
              {newsData.articles.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-bold text-xl text-gray-900 dark:text-white mb-4">📰 Latest {chain.name} News</h2>
                  <Posts articles={newsData.articles} />
                </div>
              )}
            </div>

            {/* Sidebar (1/3) */}
            <div className="space-y-6">
              {/* Chain Info */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">ℹ️ Chain Info</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-slate-400">Name</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">{chain.name}</dd>
                  </div>
                  {chain.tokenSymbol && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-slate-400">Native Token</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">{chain.tokenSymbol}</dd>
                    </div>
                  )}
                  {chain.chainId && (
                    <div className="flex justify-between">
                      <dt className="text-gray-500 dark:text-slate-400">Chain ID</dt>
                      <dd className="font-medium text-gray-900 dark:text-white">{chain.chainId}</dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-gray-500 dark:text-slate-400">TVL</dt>
                    <dd className="font-medium text-gray-900 dark:text-white">${formatNumber(chain.tvl)}</dd>
                  </div>
                </dl>
              </div>

              {/* External Links */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">🔗 External Links</h3>
                <div className="space-y-2">
                  <a
                    href={`https://defillama.com/chain/${chain.name}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    DeFiLlama ↗
                  </a>
                  {chain.gecko_id && (
                    <a
                      href={`https://www.coingecko.com/en/coins/${chain.gecko_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-blue-600 dark:text-blue-400 hover:underline text-sm"
                    >
                      CoinGecko ↗
                    </a>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">📊 Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/defi" className="block text-blue-600 dark:text-blue-400 hover:underline">
                    ← Back to DeFi Dashboard
                  </Link>
                  <Link href="/category/defi" className="block text-blue-600 dark:text-blue-400 hover:underline">
                    All DeFi News →
                  </Link>
                </div>
              </div>

              {/* Data Source */}
              <div className="text-center text-gray-500 dark:text-slate-400 text-sm">
                <p>
                  Data from{' '}
                  <a href="https://defillama.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
                    DeFiLlama
                  </a>
                </p>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
