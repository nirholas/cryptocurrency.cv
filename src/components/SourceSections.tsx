/**
 * Source Section - "More from [Source]" article rows
 * Groups articles by news source for the bottom section
 */

import Link from 'next/link';
import NewsCard from '@/components/NewsCard';

interface Article {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  timeAgo: string;
}

interface SourceSectionProps {
  articles: Article[];
  maxSources?: number;
  articlesPerSource?: number;
}

const sourceInfo: Record<string, { slug: string; color: string; darkColor: string; bgGradient: string }> = {
  'CoinDesk': { slug: 'coindesk', color: 'text-blue-600', darkColor: 'dark:text-blue-400', bgGradient: 'from-blue-600' },
  'The Block': { slug: 'theblock', color: 'text-purple-600', darkColor: 'dark:text-purple-400', bgGradient: 'from-purple-600' },
  'Decrypt': { slug: 'decrypt', color: 'text-emerald-600', darkColor: 'dark:text-emerald-400', bgGradient: 'from-emerald-600' },
  'CoinTelegraph': { slug: 'cointelegraph', color: 'text-orange-500', darkColor: 'dark:text-orange-400', bgGradient: 'from-orange-500' },
  'Bitcoin Magazine': { slug: 'bitcoinmagazine', color: 'text-amber-500', darkColor: 'dark:text-amber-400', bgGradient: 'from-amber-500' },
  'Blockworks': { slug: 'blockworks', color: 'text-indigo-600', darkColor: 'dark:text-indigo-400', bgGradient: 'from-indigo-600' },
  'The Defiant': { slug: 'defiant', color: 'text-pink-600', darkColor: 'dark:text-pink-400', bgGradient: 'from-pink-600' },
};

export default function SourceSections({ 
  articles, 
  maxSources = 3, 
  articlesPerSource = 4 
}: SourceSectionProps) {
  // Group articles by source
  const groupedBySource = articles.reduce((acc, article) => {
    if (!acc[article.source]) {
      acc[article.source] = [];
    }
    acc[article.source].push(article);
    return acc;
  }, {} as Record<string, Article[]>);

  // Get sources with most articles
  const sortedSources = Object.entries(groupedBySource)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, maxSources)
    .filter(([, articles]) => articles.length >= 2); // Only show sources with 2+ articles

  if (sortedSources.length === 0) return null;

  return (
    <section className="py-12 border-t border-gray-100 dark:border-slate-800">
      <div className="space-y-12">
        {sortedSources.map(([source, sourceArticles]) => {
          const info = sourceInfo[source] || { slug: source.toLowerCase().replace(/\s+/g, ''), color: 'text-gray-600', darkColor: 'dark:text-gray-400', bgGradient: 'from-gray-600' };
          const displayArticles = sourceArticles.slice(0, articlesPerSource);

          return (
            <div key={source}>
              {/* Section Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-6 bg-gradient-to-b ${info.bgGradient} to-transparent rounded-full`} />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    More from{' '}
                    <span className={`${info.color} ${info.darkColor}`}>{source}</span>
                  </h2>
                </div>
                <Link 
                  href={`/source/${info.slug}`}
                  className="text-sm font-semibold text-gray-500 dark:text-slate-400 hover:text-brand-600 dark:hover:text-amber-400 transition-colors flex items-center gap-1"
                >
                  View all
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>

              {/* Articles Grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {displayArticles.map((article) => (
                  <NewsCard
                    key={article.link}
                    article={article}
                    showDescription={false}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
