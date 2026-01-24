import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, getRelatedPosts, getAllSlugs, CATEGORIES, type BlogCategory } from '@/lib/blog';

// Enable static generation
export const dynamic = 'force-static';
export const revalidate = 3600;

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
  const slugs = getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  
  if (!post) {
    return {
      title: 'Post Not Found | Free Crypto News',
    };
  }
  
  return {
    title: `${post.title} | Free Crypto News Blog`,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: post.author.name }],
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.updatedAt,
      authors: [post.author.name],
      tags: post.tags,
      images: post.image ? [post.image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: post.image ? [post.image] : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug, locale } = await params;
  const post = getPostBySlug(slug);
  
  if (!post) {
    notFound();
  }
  
  const relatedPosts = getRelatedPosts(post, 3);
  const category = CATEGORIES[post.category as BlogCategory];
  
  // Convert markdown to HTML (simple conversion)
  const htmlContent = markdownToHtml(post.content);
  
  // JSON-LD structured data for SEO
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.description,
    image: post.image,
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    author: {
      '@type': 'Person',
      name: post.author.name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Free Crypto News',
      logo: {
        '@type': 'ImageObject',
        url: 'https://freecryptonews.com/logo.png',
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://freecryptonews.com/${locale}/blog/${slug}`,
    },
  };
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <article className="min-h-screen bg-gray-900">
        {/* Header */}
        <header className="bg-gradient-to-b from-gray-800 to-gray-900 py-12 px-4">
          <div className="max-w-3xl mx-auto">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-gray-400 mb-6">
              <Link href="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
              <span>/</span>
              <Link 
                href={`/blog/category/${post.category}`}
                className="hover:text-white transition-colors"
              >
                {category?.name || post.category}
              </Link>
            </nav>
            
            {/* Category badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{category?.icon || '📰'}</span>
              <span className="text-sm text-blue-400 font-medium">
                {category?.name || post.category}
              </span>
            </div>
            
            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight">
              {post.title}
            </h1>
            
            {/* Description */}
            <p className="text-xl text-gray-300 mt-4">
              {post.description}
            </p>
            
            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-4 mt-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                {post.author.avatar ? (
                  <div className="w-8 h-8 rounded-full bg-gray-700" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {post.author.name.charAt(0)}
                  </div>
                )}
                <span className="text-white">{post.author.name}</span>
              </div>
              <span className="hidden sm:inline">•</span>
              <time dateTime={post.date}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </time>
              <span className="hidden sm:inline">•</span>
              <span>{post.readingTime}</span>
            </div>
          </div>
        </header>
        
        {/* Featured Image */}
        {post.image && (
          <div className="max-w-4xl mx-auto px-4 -mt-4">
            <div className="aspect-video bg-gray-800 rounded-xl overflow-hidden">
              {/* Image would go here */}
            </div>
          </div>
        )}
        
        {/* Content */}
        <div className="max-w-3xl mx-auto px-4 py-12">
          <div 
            className="prose prose-lg prose-invert max-w-none
              prose-headings:font-bold prose-headings:text-white
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
              prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
              prose-p:text-gray-300 prose-p:leading-relaxed
              prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-white
              prose-code:text-blue-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded
              prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
              prose-blockquote:border-l-blue-500 prose-blockquote:bg-gray-800/50 prose-blockquote:py-1
              prose-ul:text-gray-300 prose-ol:text-gray-300
              prose-li:marker:text-blue-500
              prose-table:border-collapse
              prose-th:bg-gray-800 prose-th:text-white prose-th:p-3 prose-th:border prose-th:border-gray-700
              prose-td:p-3 prose-td:border prose-td:border-gray-700"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          
          {/* Tags */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${tag}`}
                  className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-full transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          </div>
          
          {/* Share buttons */}
          <div className="mt-8 pt-8 border-t border-gray-800">
            <h3 className="text-sm font-medium text-gray-500 mb-3">Share this article</h3>
            <div className="flex gap-3">
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(`https://freecryptonews.com/blog/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                Twitter
              </a>
              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(`https://freecryptonews.com/blog/${slug}`)}&text=${encodeURIComponent(post.title)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                Telegram
              </a>
              <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`https://freecryptonews.com/blog/${slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
              >
                LinkedIn
              </a>
            </div>
          </div>
        </div>
        
        {/* Author bio */}
        <div className="max-w-3xl mx-auto px-4 pb-12">
          <div className="bg-gray-800 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold shrink-0">
                {post.author.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{post.author.name}</h3>
                {post.author.bio && (
                  <p className="text-gray-400 mt-1">{post.author.bio}</p>
                )}
                {post.author.twitter && (
                  <a
                    href={`https://twitter.com/${post.author.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 text-sm mt-2 inline-block hover:underline"
                  >
                    @{post.author.twitter}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Related posts */}
        {relatedPosts.length > 0 && (
          <section className="max-w-3xl mx-auto px-4 pb-16">
            <h2 className="text-2xl font-bold text-white mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedPosts.map((related) => {
                const relCategory = CATEGORIES[related.category as BlogCategory];
                return (
                  <Link
                    key={related.slug}
                    href={`/blog/${related.slug}`}
                    className="bg-gray-800 hover:bg-gray-750 rounded-xl p-4 transition-colors"
                  >
                    <span className="text-lg">{relCategory?.icon || '📰'}</span>
                    <h3 className="text-white font-medium mt-2 line-clamp-2">
                      {related.title}
                    </h3>
                    <p className="text-gray-500 text-sm mt-2">{related.readingTime}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
        
        {/* CTA */}
        <section className="bg-gray-800 py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">
              Stay Updated with Crypto News
            </h2>
            <p className="text-gray-400 mb-6">
              Get real-time crypto news, price alerts, and market analysis.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Explore News Feed
              </Link>
              <Link
                href="/blog"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                More Articles
              </Link>
            </div>
          </div>
        </section>
      </article>
    </>
  );
}

// Simple markdown to HTML converter (for Edge Runtime compatibility)
function markdownToHtml(markdown: string): string {
  let html = markdown;
  
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Bold and italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Code blocks
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
  
  // Blockquotes
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');
  
  // Unordered lists
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Ordered lists
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Tables (simple)
  html = html.replace(/\|(.+)\|/g, (match) => {
    const cells = match.split('|').filter(c => c.trim());
    if (cells.every(c => c.trim().match(/^[-:]+$/))) {
      return ''; // Skip separator row
    }
    const isHeader = match.includes('---');
    const tag = isHeader ? 'th' : 'td';
    const row = cells.map(c => `<${tag}>${c.trim()}</${tag}>`).join('');
    return `<tr>${row}</tr>`;
  });
  html = html.replace(/(<tr>.*<\/tr>\n?)+/g, '<table><tbody>$&</tbody></table>');
  
  // Paragraphs
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;
  
  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');
  html = html.replace(/<p>(<h[1-6]>)/g, '$1');
  html = html.replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>)/g, '$1');
  html = html.replace(/(<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<table>)/g, '$1');
  html = html.replace(/(<\/table>)<\/p>/g, '$1');
  html = html.replace(/<p>(<pre>)/g, '$1');
  html = html.replace(/(<\/pre>)<\/p>/g, '$1');
  html = html.replace(/<p>(<blockquote>)/g, '$1');
  html = html.replace(/(<\/blockquote>)<\/p>/g, '$1');
  
  return html;
}
