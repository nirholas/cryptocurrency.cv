import { Metadata } from 'next';
import Link from 'next/link';
import { getPostsByTag, getAllTags, CATEGORIES, type BlogCategory } from '@/lib/blog';

export const dynamic = 'force-static';
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ tag: string; locale: string }>;
}

// Generate static paths for all tags
export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  
  return {
    title: `Articles tagged "${decodedTag}" | Free Crypto News Blog`,
    description: `All articles about ${decodedTag} - cryptocurrency guides, tutorials, and analysis.`,
    openGraph: {
      title: `#${decodedTag} Articles | Free Crypto News`,
      description: `All articles about ${decodedTag}`,
    },
  };
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  const posts = getPostsByTag(decodedTag);
  const allTags = getAllTags();
  
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
            <span className="text-white">Tag: {decodedTag}</span>
          </nav>
          
          <div className="flex items-center gap-3">
            <span className="text-3xl text-blue-400">#</span>
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {decodedTag}
            </h1>
          </div>
          <p className="text-gray-400 mt-2">
            {posts.length} article{posts.length !== 1 ? 's' : ''} with this tag
          </p>
        </div>
      </header>
      
      {/* Posts Grid */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No articles with this tag yet.</p>
            <Link
              href="/blog"
              className="inline-block mt-4 text-blue-400 hover:underline"
            >
              ← Back to all articles
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => {
              const category = CATEGORIES[post.category as BlogCategory];
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="block bg-gray-800 hover:bg-gray-750 rounded-xl p-6 transition-colors group"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{category?.icon || '📰'}</span>
                    <span className="text-sm text-gray-500">{category?.name || post.category}</span>
                  </div>
                  <h2 className="text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 mt-2 line-clamp-2">
                    {post.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-4">
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        className={`text-xs px-2 py-1 rounded-full ${
                          t.toLowerCase() === decodedTag.toLowerCase()
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
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
                </Link>
              );
            })}
          </div>
        )}
      </section>
      
      {/* All Tags */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-lg font-semibold text-white mb-4">All Tags</h2>
        <div className="flex flex-wrap gap-2">
          {allTags.map((t) => (
            <Link
              key={t}
              href={`/blog/tag/${encodeURIComponent(t)}`}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                t.toLowerCase() === decodedTag.toLowerCase()
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              #{t}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
