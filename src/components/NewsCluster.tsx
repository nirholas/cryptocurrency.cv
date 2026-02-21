/**
 * News Cluster Component - Google News-style multi-source story clustering
 * 
 * Groups related articles from different sources about the same story,
 * showing a primary headline with supporting perspectives from other outlets.
 * Inspired by Google News "Full Coverage" and CoinDesk multi-source layouts.
 */
'use client';

import { Link } from '@/i18n/navigation';
import { generateArticleSlug } from '@/lib/archive-v2';

interface Article {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  timeAgo?: string;
  category?: string;
}

interface Cluster {
  articles: Article[];
  similarity: number;
}

interface NewsClusterProps {
  clusters: Cluster[];
  maxClusters?: number;
}

const sourceIcons: Record<string, { color: string; abbrev: string; textColor: string }> = {
  'CoinDesk': { color: 'bg-blue-600', abbrev: 'CD', textColor: 'text-blue-600 dark:text-blue-400' },
  'The Block': { color: 'bg-purple-600', abbrev: 'TB', textColor: 'text-purple-600 dark:text-purple-400' },
  'Decrypt': { color: 'bg-emerald-600', abbrev: 'DC', textColor: 'text-emerald-600 dark:text-emerald-400' },
  'CoinTelegraph': { color: 'bg-amber-500', abbrev: 'CT', textColor: 'text-amber-600 dark:text-amber-400' },
  'Bitcoin Magazine': { color: 'bg-orange-500', abbrev: 'BM', textColor: 'text-orange-600 dark:text-orange-400' },
  'Blockworks': { color: 'bg-indigo-600', abbrev: 'BW', textColor: 'text-indigo-600 dark:text-indigo-400' },
  'The Defiant': { color: 'bg-pink-600', abbrev: 'TD', textColor: 'text-pink-600 dark:text-pink-400' },
  'Bloomberg Crypto': { color: 'bg-blue-700', abbrev: 'BG', textColor: 'text-blue-600 dark:text-blue-300' },
  'Reuters Crypto': { color: 'bg-orange-600', abbrev: 'RT', textColor: 'text-orange-600 dark:text-orange-400' },
  'CNBC Crypto': { color: 'bg-sky-600', abbrev: 'CN', textColor: 'text-sky-600 dark:text-sky-400' },
  'Forbes Crypto': { color: 'bg-red-700', abbrev: 'FC', textColor: 'text-red-600 dark:text-red-400' },
  'DL News': { color: 'bg-violet-600', abbrev: 'DL', textColor: 'text-violet-600 dark:text-violet-400' },
  'Crypto Briefing': { color: 'bg-teal-600', abbrev: 'CB', textColor: 'text-teal-600 dark:text-teal-400' },
};

const defaultSource = { color: 'bg-gray-600', abbrev: '??', textColor: 'text-gray-600 dark:text-gray-400' };

function SourceBadge({ source }: { source: string }) {
  const info = sourceIcons[source] || defaultSource;
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-white text-[8px] font-bold ${info.color} flex-shrink-0`}
      title={source}
    >
      {info.abbrev}
    </span>
  );
}

export default function NewsCluster({ clusters, maxClusters = 4 }: NewsClusterProps) {
  const displayClusters = clusters.slice(0, maxClusters);

  if (displayClusters.length === 0) return null;

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Top Stories
        </h2>
        <span className="text-xs font-medium text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
          Multi-source coverage
        </span>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {displayClusters.map((cluster) => {
          const primary = cluster.articles[0];
          const perspectives = cluster.articles.slice(1, 4);
          const remaining = cluster.articles.length - 4;
          const primarySlug = generateArticleSlug(primary.title, primary.pubDate);
          const primarySource = sourceIcons[primary.source] || defaultSource;

          return (
            <div
              key={primary.link}
              className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow duration-200"
            >
              {/* Primary article */}
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${primarySource.textColor}`}>
                    {primary.source}
                  </span>
                  <span className="text-gray-300 dark:text-slate-600">·</span>
                  <time className="text-xs text-gray-500 dark:text-slate-400">{primary.timeAgo || ''}</time>
                </div>

                <Link href={`/article/${primarySlug}`} className="group block mb-3">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors leading-snug line-clamp-2">
                    {primary.title}
                  </h3>
                </Link>

                {primary.description && (
                  <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {primary.description}
                  </p>
                )}

                {/* Source avatars row */}
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {cluster.articles.slice(0, 5).map((a) => (
                      <SourceBadge key={a.source + a.link} source={a.source} />
                    ))}
                  </div>
                  <span className="text-[11px] text-gray-500 dark:text-slate-400">
                    {cluster.articles.length} sources
                  </span>
                </div>
              </div>

              {/* Perspectives */}
              {perspectives.length > 0 && (
                <div className="border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50 divide-y divide-gray-100 dark:divide-slate-700/50">
                  {perspectives.map((article) => {
                    const slug = generateArticleSlug(article.title, article.pubDate);
                    const srcInfo = sourceIcons[article.source] || defaultSource;
                    return (
                      <Link
                        key={article.link}
                        href={`/article/${slug}`}
                        className="group flex items-start gap-3 px-5 py-3 hover:bg-gray-100/60 dark:hover:bg-slate-700/30 transition-colors"
                      >
                        <SourceBadge source={article.source} />
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-slate-300 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors line-clamp-1 leading-snug">
                            {article.title}
                          </h4>
                          <span className={`text-[11px] font-semibold ${srcInfo.textColor}`}>
                            {article.source}
                          </span>
                        </div>
                      </Link>
                    );
                  })}

                  {remaining > 0 && (
                    <div className="px-5 py-2.5">
                      <Link
                        href={`/article/${primarySlug}`}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
                      >
                        +{remaining} more perspective{remaining > 1 ? 's' : ''}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
