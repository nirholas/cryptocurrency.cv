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
        
        {/* Main Content - skip link target */}
        <main id="main-content">
          {/* Categories Bar */}
          <nav 
            className="px-4 py-6 overflow-x-auto scrollbar-hide scroll-fade-x"
            aria-label="News categories"
          >
            <div className="flex gap-2 min-w-max">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap bg-white border border-gray-200 hover:border-brand-300 hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200 text-sm focus-ring ${cat.color}`}
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  <span className="text-gray-700 font-medium">{cat.name}</span>
                </Link>
              ))}
            </div>
          </nav>
        
        {/* Main Content Grid */}
          <div className="px-4 pb-8">
            <div className="grid lg:grid-cols-[1fr_320px] gap-6">
              {/* Main Column */}
              <div className="space-y-8">
                {/* Featured Article */}
                {featuredArticle && (
                  <section aria-labelledby="featured-heading">
                    <h2 id="featured-heading" className="sr-only">Featured Article</h2>
                    <FeaturedArticle article={featuredArticle} />
                  </section>
                )}
              
                {/* News Grid */}
                <section id="news" aria-labelledby="latest-heading">
                  <div className="flex items-center justify-between mb-4 px-4">
                    <h2 id="latest-heading" className="text-xl font-bold text-gray-900">
                      <span aria-hidden="true">📰</span> Latest News
                    </h2>
                    <Link 
                      href="/read" 
                      className="text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors focus-ring rounded px-2 py-1 -mr-2"
                    >
                      View All →
                    </Link>
                  </div>
                  <Posts articles={restArticles} />
                </section>
              </div>
            
              {/* Sidebar */}
              <aside className="space-y-6" aria-label="Sidebar">
                {/* Market Stats */}
                <MarketStats />
              
                {/* Quick Links */}
                <div className="bg-white rounded-2xl shadow-card p-6">
                  <h3 className="font-bold text-lg mb-4 text-gray-900">
                    <span aria-hidden="true">🔗</span> Quick Links
                  </h3>
                  <nav className="space-y-1" aria-label="Quick links">
                    <Link 
                      href="/search" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors focus-ring group"
                    >
                      <span className="text-xl" aria-hidden="true">🔍</span>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors">Search News</p>
                        <p className="text-xs text-gray-500">Find specific topics</p>
                      </div>
                    </Link>
                    <Link 
                      href="/read" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors focus-ring group"
                    >
                      <span className="text-xl" aria-hidden="true">📖</span>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors">Full Reader</p>
                        <p className="text-xs text-gray-500">AI summaries</p>
                      </div>
                    </Link>
                    <Link 
                      href="/examples" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors focus-ring group"
                    >
                      <span className="text-xl" aria-hidden="true">💻</span>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors">Code Examples</p>
                        <p className="text-xs text-gray-500">Integrate with API</p>
                      </div>
                    </Link>
                    <a 
                      href="/api/rss" 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors focus-ring group"
                    >
                      <span className="text-xl" aria-hidden="true">📡</span>
                      <div>
                        <p className="font-medium text-gray-900 group-hover:text-brand-700 transition-colors">RSS Feed</p>
                        <p className="text-xs text-gray-500">Subscribe to updates</p>
                      </div>
                    </a>
                  </nav>
                </div>
              
                {/* API Promo */}
                <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 text-white shadow-xl overflow-hidden relative">
                  {/* Glow effect */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-500/30 rounded-full blur-3xl" aria-hidden="true" />
                  <h3 className="font-bold text-lg mb-2 relative">
                    <span aria-hidden="true">🚀</span> Free API
                  </h3>
                  <p className="text-gray-300 text-sm mb-4 relative">
                    No API keys. No rate limits. Build your own crypto news app.
                  </p>
                  <Link 
                    href="/about" 
                    className="relative inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black rounded-full text-sm font-semibold hover:bg-gray-100 hover:shadow-lg active:scale-95 transition-all focus-ring"
                  >
                    Learn More
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </aside>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
