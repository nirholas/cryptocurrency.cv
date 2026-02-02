/**
 * Trending Stories Sidebar Widget
 * Top trending articles from different sources based on reputation and recency
 */

import Link from 'next/link';
import { generateArticleId, generateArticleSlug } from '@/lib/archive-v2';

interface Article {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  timeAgo: string;
  id?: string;
}

interface EditorsPicksProps {
  articles: Article[];
}

const sourceColors: Record<string, { dot: string; bg: string }> = {
  'CoinDesk': { dot: 'bg-blue-500', bg: 'bg-blue-500/10' },
  'The Block': { dot: 'bg-purple-500', bg: 'bg-purple-500/10' },
  'Decrypt': { dot: 'bg-emerald-500', bg: 'bg-emerald-500/10' },
  'CoinTelegraph': { dot: 'bg-orange-500', bg: 'bg-orange-500/10' },
  'Bitcoin Magazine': { dot: 'bg-amber-500', bg: 'bg-amber-500/10' },
  'Blockworks': { dot: 'bg-indigo-500', bg: 'bg-indigo-500/10' },
  'The Defiant': { dot: 'bg-pink-500', bg: 'bg-pink-500/10' },
};

// Get articles from different sources for variety
function getVariedArticles(articles: Article[], count: number): Article[] {
  const seen = new Set<string>();
  const result: Article[] = [];
  
  for (const article of articles) {
    if (!seen.has(article.source) && result.length < count) {
      result.push(article);
      seen.add(article.source);
    }
  }
  
  // If we couldn't get enough unique sources, fill with remaining articles
  if (result.length < count) {
    for (const article of articles) {
      if (!result.includes(article) && result.length < count) {
        result.push(article);
      }
    }
  }
  
  return result;
}

export default function EditorsPicks({ articles }: EditorsPicksProps) {
  const picks = getVariedArticles(articles, 3);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-card dark:shadow-none dark:border dark:border-gray-800 p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <span className="text-xl" aria-hidden="true">🔥</span>
        <h3 className="font-bold text-lg text-gray-900 dark:text-white">
          Trending
        </h3>
      </div>

      {/* Picks List */}
      <div className="space-y-4" role="list" aria-label="Trending stories">
        {picks.map((article, index) => {
          const articleId = article.id || generateArticleId(article.link);
          const articleSlug = generateArticleSlug(article.title, article.pubDate);
          const colors = sourceColors[article.source] || { dot: 'bg-gray-500', bg: 'bg-gray-500/10' };
          
          return (
            <Link
              key={articleId}
              href={`/article/${articleSlug}`}
              className="group block p-4 -mx-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all duration-200 focus-ring"
              role="listitem"
            >
              {/* Source Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span 
                  className={`w-2 h-2 rounded-full ${colors.dot}`} 
                  aria-hidden="true" 
                />
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} text-gray-700 dark:text-gray-300`}>
                  {article.source}
                </span>
                {index === 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-500/20 text-brand-700 dark:text-brand-400">
                    Top Pick
                  </span>
                )}
              </div>

              {/* Title */}
              <h4 className="text-base font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug">
                {article.title}
              </h4>

              {/* Meta */}
              <div className="flex items-center justify-between mt-2">
                <time 
                  className="text-xs text-gray-500 dark:text-gray-400"
                  dateTime={article.pubDate}
                >
                  {article.timeAgo}
                </time>
                <span className="text-brand-500 dark:text-brand-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-medium">
                  Read
                  <svg 
                    className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Divider */}
      <div className="border-t border-gray-100 dark:border-gray-800 mt-4 pt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Curated by our editorial team
        </p>
      </div>
    </div>
  );
}
