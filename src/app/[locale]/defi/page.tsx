/**
 * DeFi Dashboard Page
 * Comprehensive DeFi data: protocols, yields, chains, TVL
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  getTopProtocols, 
  getTopChains,
  formatNumber, 
  formatPercent,
} from '@/lib/market-data';
import { getDefiNews } from '@/lib/crypto-news';
import Posts from '@/components/Posts';
import ProtocolImage from '@/components/ProtocolImage';
import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import Link from 'next/link';

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'DeFi Dashboard',
    description: 'Live DeFi protocol TVL rankings, chain analytics, yield opportunities, and the latest DeFi news. Track top protocols in real time.',
    path: '/defi',
    tags: ['DeFi', 'TVL', 'yield farming', 'DeFi protocols', 'blockchain analytics'],
  });
}

export const revalidate = 60; // Revalidate every minute

export default async function DefiPage() {
  const [protocols, chains, newsData] = await Promise.all([
    getTopProtocols(30),
    getTopChains(15),
    getDefiNews(10),
  ]);

  // Calculate total TVL
  const totalTVL = protocols.reduce((sum, p) => sum + (p.tvl || 0), 0);
  const totalChainTVL = chains.reduce((sum, c) => sum + (c.tvl || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-gray-900 dark:text-white">🏦 DeFi Dashboard</h1>
            <p className="text-gray-600 dark:text-slate-400">
              Live DeFi protocol rankings, chain TVL, and yield opportunities
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Total DeFi TVL</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${formatNumber(totalTVL)}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Top Protocols</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{protocols.length}+</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Active Chains</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{chains.length}+</p>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-200 dark:border-slate-700">
              <p className="text-gray-500 dark:text-slate-400 text-sm">Chain TVL</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${formatNumber(totalChainTVL)}</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Protocols Table (2/3) */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">🏆 Top DeFi Protocols</h2>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Ranked by Total Value Locked</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-sm">
                        <th className="text-left text-gray-500 dark:text-slate-400 font-medium p-4">#</th>
                        <th className="text-left text-gray-500 dark:text-slate-400 font-medium p-4">Protocol</th>
                        <th className="text-right text-gray-500 dark:text-slate-400 font-medium p-4">TVL</th>
                        <th className="text-right text-gray-500 dark:text-slate-400 font-medium p-4 hidden sm:table-cell">1d %</th>
                        <th className="text-right text-gray-500 dark:text-slate-400 font-medium p-4 hidden md:table-cell">7d %</th>
                        <th className="text-left text-gray-500 dark:text-slate-400 font-medium p-4 hidden lg:table-cell">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {protocols.map((protocol, index) => (
                        <tr key={protocol.id} className="border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                          <td className="p-4 text-gray-500 dark:text-slate-400">{index + 1}</td>
                          <td className="p-4">
                            <Link href={`/defi/protocol/${protocol.slug || protocol.id}`} className="flex items-center gap-3 hover:opacity-80 transition">
                              {protocol.logo && (
                                <ProtocolImage 
                                  src={protocol.logo} 
                                  alt={protocol.name}
                                  className="w-8 h-8 rounded-full"
                                />
                              )}
                              <div>
                                <span className="font-medium text-gray-900 dark:text-white">{protocol.name}</span>
                                {protocol.symbol && (
                                  <span className="text-gray-500 dark:text-slate-400 text-sm ml-2">{protocol.symbol}</span>
                                )}
                                <div className="text-xs text-gray-400 dark:text-slate-500">{protocol.chain}</div>
                              </div>
                            </Link>
                          </td>
                          <td className="p-4 text-right font-medium text-gray-900 dark:text-white">${formatNumber(protocol.tvl)}</td>
                          <td className={`p-4 text-right hidden sm:table-cell ${(protocol.change_1d || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatPercent(protocol.change_1d)}
                          </td>
                          <td className={`p-4 text-right hidden md:table-cell ${(protocol.change_7d || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {formatPercent(protocol.change_7d)}
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <span className="text-xs bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 px-2 py-1 rounded-full">
                              {protocol.category}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar (1/3) */}
            <div className="space-y-6">
              {/* Chains TVL */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                  <h2 className="font-bold text-lg text-gray-900 dark:text-white">⛓️ Chain TVL</h2>
                  <p className="text-sm text-gray-500 dark:text-slate-400">Total Value Locked by blockchain</p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-slate-700">
                  {chains.slice(0, 10).map((chain, index) => (
                    <Link 
                      key={chain.name} 
                      href={`/defi/chain/${chain.gecko_id || chain.name.toLowerCase()}`}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 dark:text-slate-500 text-sm w-5">{index + 1}</span>
                        <div>
                          <span className="font-medium text-gray-900 dark:text-white">{chain.name}</span>
                          {chain.tokenSymbol && (
                            <span className="text-gray-500 dark:text-slate-400 text-xs ml-1">({chain.tokenSymbol})</span>
                          )}
                        </div>
                      </div>
                      <span className="font-medium text-gray-900 dark:text-white">${formatNumber(chain.tvl)}</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-4">
                <h3 className="font-bold mb-3 text-gray-900 dark:text-white">📊 Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/category/defi" className="block text-blue-600 dark:text-blue-400 hover:underline">
                    DeFi News →
                  </Link>
                  <Link href="/topic/layer2" className="block text-blue-600 dark:text-blue-400 hover:underline">
                    Layer 2 News →
                  </Link>
                  <Link href="/topic/stablecoin" className="block text-blue-600 dark:text-blue-400 hover:underline">
                    Stablecoin News →
                  </Link>
                  <a href="https://defillama.com" target="_blank" rel="noopener noreferrer" className="block text-blue-600 dark:text-blue-400 hover:underline">
                    DeFiLlama ↗
                  </a>
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

          {/* DeFi News Section */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">📰 Latest DeFi News</h2>
              <Link href="/category/defi" className="text-blue-600 dark:text-blue-400 hover:underline">
                View All →
              </Link>
            </div>
            <Posts articles={newsData.articles} />
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
