import Link from 'next/link';
import { categories } from '@/lib/categories';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white mt-12">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-4">📰 Crypto News</h3>
            <p className="text-gray-400 text-sm mb-4">
              100% free crypto news aggregator. No API keys required.
            </p>
            <div className="flex gap-3">
              <a
                href="https://github.com/nirholas/free-crypto-news"
                className="p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition"
                aria-label="GitHub"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold mb-4">Categories</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.slug}>
                  <Link href={`/category/${cat.slug}`} className="hover:text-white transition">
                    {cat.icon} {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/markets" className="hover:text-white transition">📈 Markets</Link></li>
              <li><Link href="/defi" className="hover:text-white transition">🏦 DeFi Dashboard</Link></li>
              <li><Link href="/movers" className="hover:text-white transition">🚀 Top Movers</Link></li>
              <li><Link href="/trending" className="hover:text-white transition">🔥 Trending</Link></li>
              <li><Link href="/sources" className="hover:text-white transition">📚 Sources</Link></li>
              <li><Link href="/topics" className="hover:text-white transition">🏷️ Topics</Link></li>
            </ul>
          </div>

          {/* API */}
          <div>
            <h4 className="font-semibold mb-4">API</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/api/news" className="hover:text-white transition">/api/news</a></li>
              <li><a href="/api/bitcoin" className="hover:text-white transition">/api/bitcoin</a></li>
              <li><a href="/api/defi" className="hover:text-white transition">/api/defi</a></li>
              <li><a href="/api/breaking" className="hover:text-white transition">/api/breaking</a></li>
              <li><a href="/api/sources" className="hover:text-white transition">/api/sources</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <p>MIT Licensed • Made by <a href="https://github.com/nirholas" className="text-gray-400 hover:text-white">nich</a></p>
          <p>Data from CoinDesk, The Block, Decrypt, CoinTelegraph, Bitcoin Magazine, Blockworks, The Defiant</p>
        </div>
      </div>
    </footer>
  );
}
