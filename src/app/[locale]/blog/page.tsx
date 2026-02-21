import type { Metadata } from 'next';
import { generateSEOMetadata } from '@/lib/seo';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { getAllPostsMeta, getFeaturedPosts, CATEGORIES, type BlogCategory } from '@/lib/blog';

export function generateMetadata(): Metadata {
  return generateSEOMetadata({
    title: 'Crypto Blog & Guides',
    description: 'Cryptocurrency guides, tutorials, and analysis covering Bitcoin, DeFi, blockchain, and trading. Free educational content for all levels.',
    path: '/blog',
    tags: ['crypto blog', 'cryptocurrency guides', 'bitcoin tutorials', 'defi education', 'blockchain learning'],
  });
}

// Enable static generation
export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export default function BlogPage() {
  const allPosts = getAllPostsMeta();
  const featuredPosts = getFeaturedPosts(3);
  const recentPosts = allPosts.filter(p => !p.featured).slice(0, 6);
  
  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-blue-900/50 to-gray-900 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Crypto Blog
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Learn about cryptocurrency, blockchain, and DeFi with our comprehensive 
            guides and expert analysis. Updated for 2026.
          </p>
        </div>
      </section>
      
      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="text-yellow-500">⭐</span> Featured Articles
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredPosts.map((post) => (
              <FeaturedPostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      )}
      
      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-white mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Object.entries(CATEGORIES).map(([key, category]) => (
            <Link
              key={key}
              href={`/blog/category/${key}`}
              className="bg-gray-800 hover:bg-gray-700 rounded-xl p-4 text-center transition-colors"
            >
              <span className="text-2xl block mb-2">{category.icon}</span>
              <span className="text-white font-medium text-sm">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>
      
      {/* Recent Posts */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white mb-6">Recent Articles</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPosts.map((post) => (
            <PostCard key={post.slug} post={post} />
          ))}
        </div>
        
        {allPosts.length > 9 && (
          <div className="text-center mt-8">
            <Link
              href="/blog"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              View All Articles
            </Link>
          </div>
        )}
      </section>
      
      {/* Newsletter CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
            Stay Updated with Crypto News
          </h2>
          <p className="text-blue-100 mb-6 max-w-lg mx-auto">
            Get the latest crypto news, market analysis, and educational content 
            delivered to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/50"
            />
            <button className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      </section>
      
      {/* SEO Content */}
      <section className="max-w-4xl mx-auto px-4 py-12 text-gray-400">
        <h2 className="text-xl font-bold text-white mb-4">About Our Crypto Blog</h2>
        <div className="prose prose-invert prose-sm max-w-none">
          <p>
            Free Crypto News provides comprehensive cryptocurrency education and analysis. 
            Our blog covers everything from Bitcoin basics for beginners to advanced DeFi 
            strategies for experienced traders.
          </p>
          <p>
            Whether you&apos;re looking to understand how blockchain technology works, learn 
            technical analysis for trading, or stay updated on the latest developments in 
            decentralized finance, our expert-written guides have you covered.
          </p>
          <p>
            All content is free and regularly updated to reflect the rapidly evolving 
            crypto landscape. Bookmark this page and check back often for new articles.
          </p>
        </div>
      </section>
      <Footer />
    </div>
  );
}

// Featured post card with larger image
function FeaturedPostCard({ post }: { post: ReturnType<typeof getAllPostsMeta>[0] }) {
  const category = CATEGORIES[post.category as BlogCategory];
  
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group bg-gray-800 rounded-xl overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
    >
      {post.image ? (
        <div className="aspect-video bg-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent z-10" />
          <div className="absolute bottom-3 left-3 z-20">
            <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
              {category?.name || post.category}
            </span>
          </div>
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
          <span className="text-4xl">{category?.icon || '📰'}</span>
        </div>
      )}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
          {post.title}
        </h3>
        <p className="text-gray-400 text-sm mt-2 line-clamp-2">
          {post.description}
        </p>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
          <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>•</span>
          <span>{post.readingTime}</span>
        </div>
      </div>
    </Link>
  );
}

// Standard post card
function PostCard({ post }: { post: ReturnType<typeof getAllPostsMeta>[0] }) {
  const category = CATEGORIES[post.category as BlogCategory];
  
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group bg-gray-800 rounded-xl p-5 hover:bg-gray-750 hover:ring-1 hover:ring-gray-700 transition-all"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">{category?.icon || '📰'}</span>
        <span className="text-xs text-gray-500">{category?.name || post.category}</span>
      </div>
      <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
        {post.title}
      </h3>
      <p className="text-gray-400 text-sm mt-2 line-clamp-2">
        {post.description}
      </p>
      <div className="flex items-center gap-3 mt-4 text-xs text-gray-500">
        <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
        <span>•</span>
        <span>{post.readingTime}</span>
      </div>
    </Link>
  );
}
