import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostsByCategory, CATEGORIES, type BlogCategory } from '@/lib/blog';

export const dynamic = 'force-static';
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ category: string; locale: string }>;
}

// Generate static paths for all categories
export async function generateStaticParams() {
  return Object.keys(CATEGORIES).map((category) => ({ category }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const categoryInfo = CATEGORIES[category as BlogCategory];
  
  if (!categoryInfo) {
    return { title: 'Category Not Found' };
  }
  
  return {
    title: `${categoryInfo.name} Articles | Free Crypto News Blog`,
    description: categoryInfo.description,
    openGraph: {
      title: `${categoryInfo.name} Articles | Free Crypto News`,
      description: categoryInfo.description,
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const categoryInfo = CATEGORIES[category as BlogCategory];
  
  if (!categoryInfo) {
    notFound();
  }
  
  const posts = getPostsByCategory(category as BlogCategory);
  
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gradient-to-b from-gray-800 to-gray-900 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
            <Link href="/blog" className="hover:text-white transition-colors">
              Blog
            </Link>
            <span>/</span>
            <span className="text-white">{categoryInfo.name}</span>
          </nav>
          
          <div className="flex items-center gap-4">
            <span className="text-5xl">{categoryInfo.icon}</span>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                {categoryInfo.name}
              </h1>
              <p className="text-gray-400 mt-2">{categoryInfo.description}</p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Posts Grid */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No articles in this category yet.</p>
            <Link
              href="/blog"
              className="inline-block mt-4 text-blue-400 hover:underline"
            >
              ← Back to all articles
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="block bg-gray-800 hover:bg-gray-750 rounded-xl p-6 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-400 mt-2 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                      <span>{post.author.name}</span>
                      <span>•</span>
                      <time dateTime={post.date}>
                        {new Date(post.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </time>
                      <span>•</span>
                      <span>{post.readingTime}</span>
                    </div>
                  </div>
                  {post.featured && (
                    <span className="text-yellow-500 text-xl" title="Featured">⭐</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
      
      {/* Other Categories */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-lg font-semibold text-white mb-4">Explore Other Categories</h2>
        <div className="flex flex-wrap gap-3">
          {Object.entries(CATEGORIES)
            .filter(([key]) => key !== category)
            .map(([key, cat]) => (
              <Link
                key={key}
                href={`/blog/category/${key}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span>{cat.icon}</span>
                <span className="text-gray-300 text-sm">{cat.name}</span>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
