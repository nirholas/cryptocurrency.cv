/**
 * Latest News Feed - CoinDesk-inspired timeline news feed
 *
 * Displays the latest news in a compact timeline format with
 * time stamps and sentiment indicators (Positive/Negative/Neutral).
 * Inspired by CoinDesk's left-column "Latest Crypto News" timeline.
 *
 * @module components/LatestNewsFeed
 */
'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { generateArticleSlug } from '@/lib/archive-v2';

interface Article {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  timeAgo: string;
}

interface LatestNewsFeedProps {
  articles: Article[];
  maxArticles?: number;
}

/**
 * Detect simple sentiment from article title keywords
 */
function detectSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const lower = title.toLowerCase();
  const positiveWords = ['surge', 'rally', 'gain', 'rise', 'soar', 'bull', 'breakout', 'record', 'high', 'boost', 'growth', 'recover', 'launch', 'approve', 'adopt', 'partner'];
  const negativeWords = ['crash', 'drop', 'fall', 'plunge', 'bear', 'decline', 'loss', 'hack', 'scam', 'fraud', 'ban', 'reject', 'warn', 'risk', 'sell-off', 'liquidat', 'lawsuit', 'sue', 'fine'];

  const posCount = positiveWords.filter(w => lower.includes(w)).length;
  const negCount = negativeWords.filter(w => lower.includes(w)).length;

  if (posCount > negCount) return 'positive';
  if (negCount > posCount) return 'negative';
  return 'neutral';
}

const sentimentConfig = {
  positive: { color: 'bg-emerald-500', label: 'Positive', textColor: 'text-emerald-600 dark:text-emerald-400' },
  negative: { color: 'bg-red-500', label: 'Negative', textColor: 'text-red-600 dark:text-red-400' },
  neutral: { color: 'bg-amber-500', label: 'Neutral', textColor: 'text-amber-600 dark:text-amber-400' },
};

/**
 * Format pubDate into a compact time (e.g., "10:00 AM")
 */
function formatTime(pubDate: string): string {
  try {
    const date = new Date(pubDate);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return '';
  }
}

/**
 * Group articles by day ("Today", "Yesterday", or date)
 */
function groupByDay(articles: Article[]): { label: string; articles: Article[] }[] {
  const groups = new Map<string, Article[]>();
  const now = new Date();
  const today = now.toDateString();
  const yesterday = new Date(now.getTime() - 86400000).toDateString();

  for (const article of articles) {
    const date = new Date(article.pubDate);
    const dateStr = date.toDateString();
    let label: string;

    if (dateStr === today) label = 'Today';
    else if (dateStr === yesterday) label = 'Yesterday';
    else label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    if (!groups.has(label)) groups.set(label, []);
    groups.get(label)!.push(article);
  }

  return Array.from(groups.entries()).map(([label, articles]) => ({ label, articles }));
}

export default function LatestNewsFeed({ articles, maxArticles = 15 }: LatestNewsFeedProps) {
  const displayArticles = articles.slice(0, maxArticles);
  const dayGroups = groupByDay(displayArticles);

  const t = useTranslations('common');
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm dark:shadow-lg">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-brand-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <h3 className="font-bold text-gray-900 dark:text-white">Latest Crypto News</h3>
          </div>
          <Link
            href="/read"
            className="text-xs font-semibold text-brand-600 dark:text-amber-400 hover:text-brand-700 dark:hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            {t('viewAll')}
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Timeline Content */}
      <div className="max-h-[700px] overflow-y-auto scrollbar-thin">
        {dayGroups.map(group => (
          <div key={group.label}>
            {/* Day Header */}
            <div className="px-5 py-2 bg-gray-50/80 dark:bg-slate-700/30 border-b border-gray-100 dark:border-slate-700/50 sticky top-0 z-10">
              <span className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                {group.label}
              </span>
            </div>

            {/* Articles in this day */}
            <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {group.articles.map(article => {
                const sentiment = detectSentiment(article.title);
                const config = sentimentConfig[sentiment];
                const slug = generateArticleSlug(article.title, article.pubDate);
                const time = formatTime(article.pubDate);

                return (
                  <Link
                    key={article.link}
                    href={`/article/${slug}`}
                    className="group flex gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors"
                  >
                    {/* Time Column */}
                    <div className="flex-shrink-0 w-16 pt-0.5">
                      <span className="text-xs font-mono text-gray-500 dark:text-slate-400 tabular-nums">
                        {time}
                      </span>
                    </div>

                    {/* Sentiment Dot + Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${config.color} flex-shrink-0`}
                          title={config.label}
                        />
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.textColor}`}>
                          {config.label}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-slate-400 ml-auto">
                          {article.source}
                        </span>
                      </div>

                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-amber-400 transition-colors leading-snug mb-1">
                        {article.title}
                      </h4>

                      {article.description && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {article.description}
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
