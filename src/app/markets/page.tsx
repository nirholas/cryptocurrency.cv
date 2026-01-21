/**
 * Markets Page
 * Full market data dashboard with prices, charts, and DeFi data
 */

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  getTopCoins, 
  getTrending, 
  getGlobalMarketData, 
  getFearGreedIndex,
  getTopProtocols,
  formatPrice, 
  formatNumber, 
  formatPercent,
  getFearGreedColor,
  getFearGreedBgColor,
} from '@/lib/market-data';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Crypto Markets - Free Crypto News',
  description: 'Live cryptocurrency prices, market data, DeFi protocols, and market analysis.',
};

export const revalidate = 60; // Revalidate every minute

export default async function MarketsPage() {
  const [coins, trending, global, fearGreed, protocols] = await Promise.all([
    getTopCoins(50),
    getTrending(),
    getGlobalMarketData(),
    getFearGreedIndex(),
    getTopProtocols(20),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2">📊 Crypto Markets</h1>
            <p className="text-gray-600">
              Live cryptocurrency prices and market data
            </p>
          </div>

          {/* Global Stats */}
          {global && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-4 border">
                <p className="text-gray-500 text-sm">Total Market Cap</p>
                <p className="text-xl font-bold">${formatNumber(global.total_market_cap?.usd)}</p>
                <p className={`text-sm ${global.market_cap_change_percentage_24h_usd >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(global.market_cap_change_percentage_24h_usd)} (24h)
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border">
                <p className="text-gray-500 text-sm">24h Volume</p>
                <p className="text-xl font-bold">${formatNumber(global.total_volume?.usd)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border">
                <p className="text-gray-500 text-sm">BTC Dominance</p>
                <p className="text-xl font-bold">{global.market_cap_percentage?.btc?.toFixed(1)}%</p>
              </div>
              {fearGreed && (
                <div className="bg-white rounded-xl p-4 border">
                  <p className="text-gray-500 text-sm">Fear & Greed</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-xl font-bold ${getFearGreedColor(Number(fearGreed.value))}`}>
                      {fearGreed.value}
                    </span>
                    <span className="text-sm text-gray-500">({fearGreed.value_classification})</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full ${getFearGreedBgColor(Number(fearGreed.value))}`}
                      style={{ width: `${fearGreed.value}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trending Section */}
          {trending.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4">🔥 Trending</h2>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {trending.slice(0, 7).map((coin) => (
                  <div
                    key={coin.id}
                    className="flex-shrink-0 bg-white border rounded-lg p-3 flex items-center gap-3"
                  >
                    <img src={coin.thumb} alt={coin.name} className="w-8 h-8 rounded-full" />
                    <div>
                      <span className="font-medium">{coin.symbol.toUpperCase()}</span>
                      <span className="text-gray-500 text-sm ml-2">#{coin.market_cap_rank}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Coins Table (2/3 width) */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-lg">Top Cryptocurrencies</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left text-gray-500 text-sm font-medium p-4">#</th>
                        <th className="text-left text-gray-500 text-sm font-medium p-4">Coin</th>
                        <th className="text-right text-gray-500 text-sm font-medium p-4">Price</th>
                        <th className="text-right text-gray-500 text-sm font-medium p-4 hidden sm:table-cell">24h</th>
                        <th className="text-right text-gray-500 text-sm font-medium p-4 hidden md:table-cell">7d</th>
                        <th className="text-right text-gray-500 text-sm font-medium p-4 hidden lg:table-cell">Market Cap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coins.map((coin) => (
                        <tr key={coin.id} className="border-b hover:bg-gray-50 transition">
                          <td className="p-4 text-gray-500">{coin.market_cap_rank}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              {coin.image && (
                                <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                              )}
                              <div>
                                <span className="font-medium">{coin.name}</span>
                                <span className="text-gray-500 text-sm ml-2">{coin.symbol.toUpperCase()}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-medium">{formatPrice(coin.current_price)}</td>
                          <td className={`p-4 text-right hidden sm:table-cell ${coin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(coin.price_change_percentage_24h)}
                          </td>
                          <td className={`p-4 text-right hidden md:table-cell ${(coin.price_change_percentage_7d_in_currency || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(coin.price_change_percentage_7d_in_currency)}
                          </td>
                          <td className="p-4 text-right text-gray-500 hidden lg:table-cell">${formatNumber(coin.market_cap)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Sidebar (1/3 width) */}
            <div className="space-y-6">
              {/* DeFi Protocols */}
              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="p-4 border-b">
                  <h2 className="font-bold text-lg">🏦 Top DeFi Protocols</h2>
                  <p className="text-gray-500 text-sm">By Total Value Locked</p>
                </div>
                <div className="divide-y">
                  {protocols.slice(0, 10).map((protocol, index) => (
                    <div key={protocol.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-400 text-sm w-5">{index + 1}</span>
                        {protocol.logo && (
                          <img src={protocol.logo} alt={protocol.name} className="w-6 h-6 rounded-full" />
                        )}
                        <div>
                          <span className="font-medium">{protocol.name}</span>
                          <span className="text-gray-500 text-xs block">{protocol.category}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-medium">${formatNumber(protocol.tvl)}</span>
                        {protocol.change_1d && (
                          <span className={`text-xs block ${protocol.change_1d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(protocol.change_1d)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Links */}
              <div className="bg-white rounded-xl border p-4">
                <h3 className="font-bold mb-3">📰 Related News</h3>
                <div className="space-y-2">
                  <Link href="/category/markets" className="block text-blue-600 hover:underline">
                    Market Analysis →
                  </Link>
                  <Link href="/category/defi" className="block text-blue-600 hover:underline">
                    DeFi News →
                  </Link>
                  <Link href="/category/bitcoin" className="block text-blue-600 hover:underline">
                    Bitcoin News →
                  </Link>
                </div>
              </div>

              {/* Data Attribution */}
              <div className="text-center text-gray-500 text-sm">
                <p>
                  Market data from{' '}
                  <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    CoinGecko
                  </a>
                </p>
                <p className="mt-1">
                  DeFi data from{' '}
                  <a href="https://defillama.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
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
