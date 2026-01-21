import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - Free Crypto News',
  description: 'Learn about Free Crypto News - 100% free crypto news API aggregating from 7 major sources.',
};

const sources = [
  { name: 'CoinDesk', url: 'https://coindesk.com', description: 'Leading crypto news and analysis' },
  { name: 'The Block', url: 'https://theblock.co', description: 'Institutional-grade crypto research' },
  { name: 'Decrypt', url: 'https://decrypt.co', description: 'Web3 and crypto news for everyone' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com', description: 'Independent crypto media' },
  { name: 'Bitcoin Magazine', url: 'https://bitcoinmagazine.com', description: 'Original Bitcoin publication' },
  { name: 'Blockworks', url: 'https://blockworks.co', description: 'Financial news meets crypto' },
  { name: 'The Defiant', url: 'https://thedefiant.io', description: 'DeFi-focused news and analysis' },
];

const features = [
  { icon: '🆓', title: 'Completely Free', description: 'No API keys, no rate limits, no hidden costs' },
  { icon: '⚡', title: 'Real-time Updates', description: 'News aggregated every 5 minutes from all sources' },
  { icon: '🔍', title: 'Smart Search', description: 'Search across all sources with keyword matching' },
  { icon: '📊', title: 'Market Data', description: 'Live prices, fear & greed index, and market stats' },
  { icon: '🤖', title: 'AI Summaries', description: 'Get AI-powered article summaries and analysis' },
  { icon: '🔧', title: 'Developer Friendly', description: 'REST API, RSS feeds, and SDK libraries' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="px-4 py-12">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4">About Free Crypto News</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              The only 100% free crypto news aggregator API. No API keys required.
              No rate limits. Just pure, real-time crypto news from 7 major sources.
            </p>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Why Free Crypto News?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition">
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">Our Sources</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source) => (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition group"
                >
                  <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600">{source.name}</h3>
                  <p className="text-gray-600 text-sm">{source.description}</p>
                </a>
              ))}
            </div>
          </div>

          {/* API Section */}
          <div className="mb-16 bg-gray-900 rounded-2xl p-8 text-white">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">🚀 Quick Start</h2>
              <p className="text-gray-300 mb-6">
                Start fetching crypto news in seconds. No signup required.
              </p>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-400 text-sm mb-2">Get latest news:</p>
                  <code className="block bg-gray-800 p-3 rounded-lg text-green-400 text-sm overflow-x-auto">
                    curl https://free-crypto-news.vercel.app/api/news?limit=10
                  </code>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Search news:</p>
                  <code className="block bg-gray-800 p-3 rounded-lg text-green-400 text-sm overflow-x-auto">
                    curl https://free-crypto-news.vercel.app/api/search?q=bitcoin
                  </code>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Get Bitcoin news:</p>
                  <code className="block bg-gray-800 p-3 rounded-lg text-green-400 text-sm overflow-x-auto">
                    curl https://free-crypto-news.vercel.app/api/bitcoin?limit=5
                  </code>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <Link href="/examples" className="px-6 py-3 bg-white text-black rounded-full font-medium hover:bg-gray-100 transition">
                  View All Examples →
                </Link>
                <a
                  href="https://github.com/nirholas/free-crypto-news"
                  className="px-6 py-3 border border-gray-600 rounded-full font-medium hover:border-white transition"
                >
                  GitHub Docs
                </a>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8">API Endpoints</h2>
            <div className="max-w-3xl mx-auto overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Endpoint</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr><td className="px-4 py-3 font-mono text-sm">/api/news</td><td className="px-4 py-3">Latest news from all sources</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-sm">/api/search?q=</td><td className="px-4 py-3">Search news by keywords</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-sm">/api/bitcoin</td><td className="px-4 py-3">Bitcoin-specific news</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-sm">/api/defi</td><td className="px-4 py-3">DeFi news and updates</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-sm">/api/breaking</td><td className="px-4 py-3">Breaking news (last 2 hours)</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-sm">/api/trending</td><td className="px-4 py-3">Trending topics analysis</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-sm">/api/sources</td><td className="px-4 py-3">List of news sources</td></tr>
                  <tr><td className="px-4 py-3 font-mono text-sm">/api/rss</td><td className="px-4 py-3">RSS feed output</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-gray-600 mb-6">Deploy your own instance or use our free public API</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a
                href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news"
                className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition"
              >
                ▲ Deploy on Vercel
              </a>
              <a
                href="https://github.com/nirholas/free-crypto-news"
                className="px-6 py-3 border border-black rounded-full font-medium hover:bg-black hover:text-white transition"
              >
                ⭐ Star on GitHub
              </a>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
