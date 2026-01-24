/**
 * Individual Tag Page
 * Displays news articles for a specific tag with SEO optimization and pagination
 */

import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Pagination from '@/components/Pagination';
import { 
  getTagBySlug, 
  getRelatedTags, 
  getAllTags,
  generateTagStructuredData,
  extractTagsFromArticle,
  type Tag 
} from '@/lib/tags';
import { fetchNews, type NewsArticle } from '@/lib/crypto-news';

const ARTICLES_PER_PAGE = 20;

interface PageProps {
  params: Promise<{ slug: string; locale: string }>;
  searchParams: Promise<{ page?: string }>;
}

// Generate static params for all tags
export async function generateStaticParams() {
  const tags = getAllTags();
  return tags.map(tag => ({
    slug: tag.slug,
  }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = getTagBySlug(slug);
  
  if (!tag) {
    return {
      title: 'Tag Not Found',
    };
  }
  
  const keywords = [
    `${tag.name} crypto news`,
    `${tag.name} cryptocurrency`,
    ...tag.keywords.slice(0, 5),
    'crypto news',
    'cryptocurrency news',
  ].join(', ');
  
  return {
    title: `${tag.name} Crypto News | Latest ${tag.name} Updates`,
    description: tag.description,
    keywords,
    openGraph: {
      title: `${tag.name} Crypto News | Free Crypto News`,
      description: tag.description,
      type: 'website',
      url: `/tags/${tag.slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: `${tag.name} Crypto News`,
      description: tag.description,
    },
    alternates: {
      canonical: `/tags/${tag.slug}`,
    },
  };
}

// Filter articles by tag
async function getArticlesForTag(tag: Tag): Promise<NewsArticle[]> {
  const response = await fetchNews(100);
  
  // Filter articles that match this tag's keywords
  return response.articles.filter(article => {
    const articleTags = extractTagsFromArticle(article);
    return articleTags.some(t => t.slug === tag.slug);
  });
}

function ArticleCard({ article }: { article: NewsArticle }) {
  return (
    <article className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-5 hover:shadow-lg hover:border-primary/50 transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <a
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h2 className="font-semibold text-gray-900 dark:text-white hover:text-primary transition-colors line-clamp-2">
              {article.title}
            </h2>
          </a>
          {article.description && (
            <p className="text-sm text-gray-600 dark:text-slate-400 mt-2 line-clamp-2">
              {article.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-3 text-xs text-gray-500 dark:text-slate-500">
            <span className="font-medium">{article.source}</span>
            <span>•</span>
            <time dateTime={article.pubDate}>{article.timeAgo}</time>
          </div>
        </div>
      </div>
    </article>
  );
}

function RelatedTagsSection({ tags }: { tags: Tag[] }) {
  if (tags.length === 0) return null;
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">Related Tags</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map(tag => (
          <Link
            key={tag.slug}
            href={`/tags/${tag.slug}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-slate-700 rounded-full text-sm hover:bg-primary/10 hover:text-primary transition-colors"
          >
            <span>{tag.icon}</span>
            {tag.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

function TagInfo({ tag }: { tag: Tag }) {
  const categoryLabels = {
    asset: 'Cryptocurrency',
    topic: 'Topic',
    event: 'Event',
    technology: 'Technology',
    entity: 'Entity',
    sentiment: 'Sentiment',
  };
  
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <h3 className="font-bold text-gray-900 dark:text-white mb-4">About This Tag</h3>
      <p className="text-gray-600 dark:text-slate-400 text-sm mb-4">
        {tag.description}
      </p>
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
          {categoryLabels[tag.category]}
        </span>
      </div>
    </div>
  );
}

export default async function TagPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { page } = await searchParams;
  const tag = getTagBySlug(slug);
  
  if (!tag) {
    notFound();
  }
  
  const currentPage = Math.max(1, parseInt(page || '1', 10));
  const allArticles = await getArticlesForTag(tag);
  const totalPages = Math.ceil(allArticles.length / ARTICLES_PER_PAGE);
  const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
  const articles = allArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);
  
  const relatedTags = getRelatedTags(slug);
  const structuredData = generateTagStructuredData(tag, allArticles.length);
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      
      <div className="max-w-7xl mx-auto">
        <Header />
        
        <main className="px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm" aria-label="Breadcrumb">
            <ol className="flex items-center gap-2 text-gray-500 dark:text-slate-400">
              <li>
                <Link href="/" className="hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li>
                <Link href="/tags" className="hover:text-primary transition-colors">
                  Tags
                </Link>
              </li>
              <li>
                <span className="mx-2">/</span>
              </li>
              <li className="text-gray-900 dark:text-white font-medium">
                {tag.name}
              </li>
            </ol>
          </nav>
          
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-5xl">{tag.icon}</span>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                  {tag.name} News
                </h1>
                <p className="text-gray-600 dark:text-slate-400 mt-1">
                  {allArticles.length} articles • Page {currentPage} of {totalPages}
                </p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {articles.length > 0 ? (
                <div className="space-y-4">
                  {articles.map((article, index) => (
                    <ArticleCard key={`${article.link}-${index}`} article={article} />
                  ))}
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      basePath={`/tags/${tag.slug}`}
                      className="mt-8"
                    />
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-12 text-center">
                  <div className="text-4xl mb-4">📭</div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    No articles found
                  </h2>
                  <p className="text-gray-600 dark:text-slate-400 mb-6">
                    There are no recent articles matching the &quot;{tag.name}&quot; tag.
                  </p>
                  <Link
                    href="/tags"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
                  >
                    Browse All Tags
                  </Link>
                </div>
              )}
            </div>
            
            {/* Sidebar */}
            <aside className="space-y-6">
              <TagInfo tag={tag} />
              <RelatedTagsSection tags={relatedTags} />
              
              {/* All Tags Link */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">Explore More</h3>
                <div className="space-y-3">
                  <Link
                    href="/tags"
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-primary transition-colors"
                  >
                    <span>🏷️</span>
                    Browse All Tags
                  </Link>
                  <Link
                    href="/topics"
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-primary transition-colors"
                  >
                    <span>📂</span>
                    Browse Topics
                  </Link>
                  <Link
                    href="/search"
                    className="flex items-center gap-2 text-sm text-gray-600 dark:text-slate-400 hover:text-primary transition-colors"
                  >
                    <span>🔍</span>
                    Search News
                  </Link>
                </div>
              </div>
            </aside>
          </div>
          
          {/* SEO Content Footer */}
          <section className="mt-12 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              About {tag.name} News
            </h2>
            <p className="text-gray-600 dark:text-slate-400">
              Stay updated with the latest {tag.name.toLowerCase()} news from 80+ crypto news sources. 
              Our aggregator collects real-time updates about {tag.keywords.slice(0, 3).join(', ')} and more. 
              {tag.relatedTags && tag.relatedTags.length > 0 && (
                <> Related topics include {tag.relatedTags.slice(0, 3).map(slug => {
                  const related = getTagBySlug(slug);
                  return related?.name || slug;
                }).join(', ')}.</>
              )}
            </p>
          </section>
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
