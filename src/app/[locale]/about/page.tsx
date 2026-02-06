import { getTranslations, setRequestLocale } from 'next-intl/server';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Link } from '@/i18n/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About - Free Crypto News',
  description: 'Learn about Free Crypto News - 100% free crypto news API aggregating from 130+ sources.',
};

// Featured sources - highlighting key sources from 130+ total
const sources = [
  { name: 'CoinDesk', url: 'https://coindesk.com', description: 'Leading crypto news and analysis', category: 'Crypto-Native' },
  { name: 'The Block', url: 'https://theblock.co', description: 'Institutional-grade crypto research', category: 'Crypto-Native' },
  { name: 'Bloomberg', url: 'https://bloomberg.com', description: 'Global financial news leader', category: 'Mainstream' },
  { name: 'Reuters', url: 'https://reuters.com', description: 'International news agency', category: 'Mainstream' },
  { name: 'CoinTelegraph', url: 'https://cointelegraph.com', description: 'Independent crypto media', category: 'Crypto-Native' },
  { name: 'Decrypt', url: 'https://decrypt.co', description: 'Web3 and crypto news for everyone', category: 'Crypto-Native' },
  { name: 'Bitcoin Magazine', url: 'https://bitcoinmagazine.com', description: 'Original Bitcoin publication', category: 'Bitcoin' },
  { name: 'Blockworks', url: 'https://blockworks.co', description: 'Financial news meets crypto', category: 'Crypto-Native' },
  { name: 'The Defiant', url: 'https://thedefiant.io', description: 'DeFi-focused news and analysis', category: 'DeFi' },
  { name: 'CNBC', url: 'https://cnbc.com', description: 'Business and financial news', category: 'Mainstream' },
  { name: 'Forbes', url: 'https://forbes.com', description: 'Business news and insights', category: 'Mainstream' },
  { name: 'Messari', url: 'https://messari.io', description: 'Crypto research and data', category: 'Research' },
];

const sourceCategories = [
  { name: 'Crypto-Native', count: 25, description: 'CoinDesk, The Block, Decrypt, and more' },
  { name: 'Mainstream', count: 10, description: 'Bloomberg, Reuters, CNBC, Forbes' },
  { name: 'DeFi', count: 15, description: 'The Defiant, DeFi Pulse, and protocol feeds' },
  { name: 'Research', count: 12, description: 'Messari, Delphi Digital, Glassnode' },
  { name: 'Layer 2', count: 10, description: 'Optimism, Arbitrum, Base, zkSync' },
  { name: 'Bitcoin', count: 8, description: 'Bitcoin Magazine, Stacker News' },
  { name: 'Exchanges', count: 20, description: 'Binance, Coinbase, Kraken blogs' },
  { name: 'More', count: 30, description: 'VCs, podcasts, protocols, regulators' },
];

const features = [
  { icon: '🆓', title: 'Completely Free', description: 'No API keys, no rate limits, no hidden costs' },
  { icon: '⚡', title: 'Real-time Updates', description: 'News aggregated every 5 minutes from all sources' },
  { icon: '🔍', title: 'Smart Search', description: 'Search across all sources with keyword matching' },
  { icon: '📊', title: 'Market Data', description: 'Live prices, fear & greed index, and market stats' },
  { icon: '🤖', title: 'AI Summaries', description: 'Get AI-powered article summaries and analysis' },
  { icon: '🔧', title: 'Developer Friendly', description: 'REST API, RSS feeds, and SDK libraries' },
];

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function AboutPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('nav');

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto">
        <Header />

        <main className="px-4 py-12">
          {/* Hero */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-4 text-gray-900 dark:text-white">About Free Crypto News</h1>
            <p className="text-xl text-gray-600 dark:text-slate-400 max-w-3xl mx-auto">
              The only 100% free crypto news aggregator API. No API keys required.
              No rate limits. Just pure, real-time crypto news from 130+ sources.
            </p>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">Why Free Crypto News?</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="p-6 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition">
                  <div className="text-4xl mb-3">{feature.icon}</div>
                  <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Sources */}
          <div className="mb-16">
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">130+ Sources</h2>
            <p className="text-center text-gray-600 dark:text-slate-400 mb-8">
              News aggregated from across the crypto ecosystem
            </p>
            
            {/* Category Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
              {sourceCategories.map((cat) => (
                <div key={cat.name} className="p-4 rounded-lg bg-gray-100 dark:bg-slate-800 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{cat.count}+</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">{cat.name}</div>
                  <div className="text-xs text-gray-500 dark:text-slate-500 mt-1">{cat.description}</div>
                </div>
              ))}
            </div>

            {/* Featured Sources */}
            <h3 className="text-lg font-semibold text-center mb-4 text-gray-700 dark:text-slate-300">Featured Sources</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sources.map((source) => (
                <a
                  key={source.name}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-md transition group"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 text-gray-900 dark:text-white">{source.name}</h3>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400">{source.category}</span>
                  </div>
                  <p className="text-gray-600 dark:text-slate-400 text-sm">{source.description}</p>
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
                    curl https://cryptocurrency.cv/api/news?limit=10
                  </code>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Search news:</p>
                  <code className="block bg-gray-800 p-3 rounded-lg text-green-400 text-sm overflow-x-auto">
                    curl https://cryptocurrency.cv/api/search?q=bitcoin
                  </code>
                </div>

                <div>
                  <p className="text-gray-400 text-sm mb-2">Get Bitcoin news:</p>
                  <code className="block bg-gray-800 p-3 rounded-lg text-green-400 text-sm overflow-x-auto">
                    curl https://cryptocurrency.cv/api/bitcoin?limit=5
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
            <h2 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">API Endpoints</h2>
            <div className="max-w-3xl mx-auto overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Endpoint</th>
                    <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  <tr className="dark:bg-slate-800/50"><td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">/api/news</td><td className="px-4 py-3 text-gray-700 dark:text-slate-300">Latest news from all sources</td></tr>
                  <tr className="dark:bg-slate-800/50"><td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">/api/search?q=</td><td className="px-4 py-3 text-gray-700 dark:text-slate-300">Search news by keywords</td></tr>
                  <tr className="dark:bg-slate-800/50"><td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">/api/bitcoin</td><td className="px-4 py-3 text-gray-700 dark:text-slate-300">Bitcoin-specific news</td></tr>
                  <tr className="dark:bg-slate-800/50"><td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">/api/defi</td><td className="px-4 py-3 text-gray-700 dark:text-slate-300">DeFi news and updates</td></tr>
                  <tr className="dark:bg-slate-800/50"><td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">/api/breaking</td><td className="px-4 py-3 text-gray-700 dark:text-slate-300">Breaking news (last 2 hours)</td></tr>
                  <tr className="dark:bg-slate-800/50"><td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">/api/trending</td><td className="px-4 py-3 text-gray-700 dark:text-slate-300">Trending topics analysis</td></tr>
                  <tr className="dark:bg-slate-800/50"><td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">/api/sources</td><td className="px-4 py-3 text-gray-700 dark:text-slate-300">List of news sources</td></tr>
                  <tr className="dark:bg-slate-800/50"><td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">/api/rss</td><td className="px-4 py-3 text-gray-700 dark:text-slate-300">RSS feed output</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Ready to Get Started?</h2>
            <p className="text-gray-600 dark:text-slate-400 mb-6">Deploy your own instance or use our free public API</p>
            <div className="flex justify-center gap-4 flex-wrap">
              <a
                href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fnirholas%2Ffree-crypto-news"
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-full font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition"
              >
                ▲ Deploy on Vercel
              </a>
              <a
                href="https://github.com/nirholas/free-crypto-news"
                className="px-6 py-3 border border-black dark:border-white text-gray-900 dark:text-white rounded-full font-medium hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition"
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
