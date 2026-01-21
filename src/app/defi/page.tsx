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
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DeFi Dashboard',
  description: 'Live DeFi data - Protocol TVL rankings, chain analytics, yield opportunities, and DeFi news.',
};

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">🏦 DeFi Dashboard</h1>
            <p className="text-gray-600">
              Live DeFi protocol rankings, chain TVL, and yield opportunities
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-gray-500 text-sm">Total DeFi TVL</p>
              <p className="text-2xl font-bold">${formatNumber(totalTVL)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-gray-500 text-sm">Top Protocols</p>
              <p className="text-2xl font-bold">{protocols.length}+</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-gray-500 text-sm">Active Chains</p>
              <p className="text-2xl font-bold">{chains.length}+</p>
            </div>
            <div className="bg-white rounded-xl p-4 border">
              <p className="text-gray-500 text-sm">Chain TVL</p>
              <p className="text-2xl font-bold">${formatNumber(totalChainTVL)}</p>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Protocols Table (2/3) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-lg">🏆 Top DeFi Protocols</h2>
                    <p className="text-sm text-gray-500">Ranked by Total Value Locked</p>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50 text-sm">
                        <th className="text-left text-gray-500 font-medium p-4">#</th>
                        <th className="text-left text-gray-500 font-medium p-4">Protocol</th>
                        <th className="text-right text-gray-500 font-medium p-4">TVL</th>
                        <th className="text-right text-gray-500 font-medium p-4 hidden sm:table-cell">1d %</th>
                        <th className="text-right text-gray-500 font-medium p-4 hidden md:table-cell">7d %</th>
                        <th className="text-left text-gray-500 font-medium p-4 hidden lg:table-cell">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {protocols.map((protocol, index) => (
                        <tr key={protocol.id} className="border-b hover:bg-gray-50 transition">
                          <td className="p-4 text-gray-500">{index + 1}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {protocol.logo && (
                                <img 
                                  src={protocol.logo} 
                                  alt={protocol.name}
                                  className="w-8 h-8 rounded-full"
                                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                                />
                              )}
                              <div>
                                <span className="font-medium">{protocol.name}</span>
                                {protocol.symbol && (
                                  <span className="text-gray-500 text-sm ml-2">{protocol.symbol}</span>
                                )}
                                <div className="text-xs text-gray-400">{protocol.chain}</div>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-medium">${formatNumber(protocol.tvl)}</td>
                          <td className={`p-4 text-right hidden sm:table-cell ${(protocol.change_1d || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(protocol.change_1d)}
                          </td>
                          <td className={`p-4 text-right hidden md:table-cell ${(protocol.change_7d || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(protocol.change_7d)}
                          </td>
                          <td className="p-4 hidden lg:table-cell">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
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
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-lg">⛓️ Chain TVL</h2>
                  <p className="text-sm text-gray-500">Total Value Locked by blockchain</p>
                </div>
                <div className="divide-y">
                  {chains.slice(0, 10).map((chain, index) => (
                    <div key={chain.name} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm w-5">{index + 1}</span>
                        <div>
                          <span className="font-medium">{chain.name}</span>
                          {chain.tokenSymbol && (
                            <span className="text-gray-500 text-xs ml-1">({chain.tokenSymbol})</span>
                          )}
                        </div>
                      </div>
                      <span className="font-medium">${formatNumber(chain.tvl)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-bold mb-3">📊 Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/category/defi" className="block text-blue-600 hover:underline">
                    DeFi News →
                  </Link>
                  <Link href="/topic/layer2" className="block text-blue-600 hover:underline">
                    Layer 2 News →
                  </Link>
                  <Link href="/topic/stablecoin" className="block text-blue-600 hover:underline">
                    Stablecoin News →
                  </Link>
                  <a href="https://defillama.com" target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                    DeFiLlama ↗
                  </a>
                </div>
              </div>

              {/* Data Source */}
              <div className="text-center text-gray-500 text-sm">
                <p>
                  Data from{' '}
                  <a href="https://defillama.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    DeFiLlama
                  </a>
                </p>
              </div>
            </div>
          </div>

          {/* DeFi News Section */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">📰 Latest DeFi News</h2>
              <Link href="/category/defi" className="text-blue-600 hover:underline">
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
