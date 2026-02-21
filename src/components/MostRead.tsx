/**
 * Most Read - CoinDesk-inspired numbered most-read articles
 *
 * Displays the most popular/trending articles in a numbered list format.
 * Inspired by CoinDesk's "Most Read" section with numbered rankings
 * and publication dates.
 *
 * @module components/MostRead
 */

import { Link } from '@/i18n/navigation';
import { generateArticleSlug } from '@/lib/archive-v2';

interface Article {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  timeAgo: string;
}

interface MostReadProps {
  articles: Article[];
  maxArticles?: number;
}

const sourceColors: Record<string, string> = {
  'CoinDesk': 'text-blue-600 dark:text-blue-400',
  'The Block': 'text-purple-600 dark:text-purple-400',
  'Decrypt': 'text-emerald-600 dark:text-emerald-400',
  'CoinTelegraph': 'text-amber-600 dark:text-amber-400',
  'Bitcoin Magazine': 'text-orange-600 dark:text-orange-400',
  'Blockworks': 'text-indigo-600 dark:text-indigo-400',
  'The Defiant': 'text-pink-600 dark:text-pink-400',
  'DL News': 'text-violet-600 dark:text-violet-400',
};

/**
 * Format date for display (e.g., "Feb 15, 2026")
 */
function formatDate(pubDate: string): string {
  try {
    return new Date(pubDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function MostRead({ articles, maxArticles = 7 }: MostReadProps) {
  const items = articles.slice(0, maxArticles);

  if (items.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-1 h-8 bg-brand-500 rounded-full" />
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
          Most Read
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-x-8 gap-y-1">
        {items.map((article, index) => {
          const slug = generateArticleSlug(article.title, article.pubDate);
          const sourceColor = sourceColors[article.source] || 'text-gray-500 dark:text-slate-400';

          return (
            <Link
              key={article.link}
              href={`/article/${slug}`}
              className="group flex items-start gap-4 py-4 border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-slate-800/30 transition-colors rounded-lg px-2 -mx-2"
            >
              {/* Rank Number */}
              <span className="flex-shrink-0 text-3xl font-black text-gray-200 dark:text-slate-700 group-hover:text-brand-300 dark:group-hover:text-amber-600 transition-colors tabular-nums leading-none pt-1 w-8 text-center">
                {index + 1}
              </span>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-amber-400 transition-colors leading-snug line-clamp-2 mb-1.5">
                  {article.title}
                </h3>
                <div className="flex items-center gap-2 text-xs">
                  <span className={`font-semibold ${sourceColor}`}>
                    {article.source}
                  </span>
                  <span className="text-gray-300 dark:text-slate-600">·</span>
                  <time className="text-gray-500 dark:text-slate-400" dateTime={article.pubDate}>
                    {formatDate(article.pubDate)}
                  </time>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
