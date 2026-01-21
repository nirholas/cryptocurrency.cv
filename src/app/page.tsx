import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Posts from '@/components/Posts';
import Footer from '@/components/Footer';
import PriceTicker from '@/components/PriceTicker';
import BreakingNewsBanner from '@/components/BreakingNewsBanner';
import FeaturedArticle from '@/components/FeaturedArticle';
import MarketStats from '@/components/MarketStats';
import { getLatestNews, getBreakingNews } from '@/lib/crypto-news';
import { categories } from '@/lib/categories';
import Link from 'next/link';

export const revalidate = 300; // Revalidate every 5 minutes

export default async function Home() {
  const [newsData, breakingData] = await Promise.all([
    getLatestNews(30),
    getBreakingNews(5),
  ]);

  const featuredArticle = newsData.articles[0];
  const restArticles = newsData.articles.slice(1);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Price Ticker */}
      <PriceTicker />
      
      {/* Breaking News Banner */}
      <BreakingNewsBanner articles={breakingData.articles} />
      
      <div className="max-w-7xl mx-auto">
        <Header />
        
        {/* Hero */}
        <Hero />
        
        {/* Categories Bar */}
        <div className="px-4 py-6 overflow-x-auto">
          <div className="flex gap-2">
            {categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/category/${cat.slug}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm transition text-sm ${cat.color}`}
              >
                <span>{cat.icon}</span>
                <span className="text-gray-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
        
        {/* Main Content Grid */}
        <div className="px-4 pb-8">
          <div className="grid lg:grid-cols-[1fr_320px] gap-6">
            {/* Main Column */}
            <div>
              {/* Featured Article */}
              {featuredArticle && (
                <div className="mb-6">
                  <FeaturedArticle article={featuredArticle} />
                </div>
              )}
              
              {/* News Grid */}
              <div id="news">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">📰 Latest News</h2>
                  <Link href="/read" className="text-sm text-blue-600 hover:underline">
                    View All →
                  </Link>
                </div>
                <Posts articles={restArticles} />
              </div>
            </div>
            
            {/* Sidebar */}
            <aside className="space-y-6">
              {/* Market Stats */}
              <MarketStats />
              
              {/* Quick Links */}
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="font-bold text-lg mb-4">🔗 Quick Links</h3>
                <div className="space-y-2">
                  <Link href="/search" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <span className="text-xl">🔍</span>
                    <div>
                      <p className="font-medium">Search News</p>
                      <p className="text-xs text-gray-500">Find specific topics</p>
                    </div>
                  </Link>
                  <Link href="/read" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <span className="text-xl">📖</span>
                    <div>
                      <p className="font-medium">Full Reader</p>
                      <p className="text-xs text-gray-500">AI summaries</p>
                    </div>
                  </Link>
                  <Link href="/examples" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <span className="text-xl">💻</span>
                    <div>
                      <p className="font-medium">Code Examples</p>
                      <p className="text-xs text-gray-500">Integrate with API</p>
                    </div>
                  </Link>
                  <a href="/api/rss" className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <span className="text-xl">📡</span>
                    <div>
                      <p className="font-medium">RSS Feed</p>
                      <p className="text-xs text-gray-500">Subscribe to updates</p>
                    </div>
                  </a>
                </div>
              </div>
              
              {/* API Promo */}
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white">
                <h3 className="font-bold text-lg mb-2">🚀 Free API</h3>
                <p className="text-gray-300 text-sm mb-4">
                  No API keys. No rate limits. Build your own crypto news app.
                </p>
                <Link 
                  href="/about" 
                  className="inline-block px-4 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-gray-100 transition"
                >
                  Learn More →
                </Link>
              </div>
            </aside>
          </div>
        </div>
        
        <Footer />
      </div>
    </div>
  );
}
