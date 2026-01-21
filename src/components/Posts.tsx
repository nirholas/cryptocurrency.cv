import Link from 'next/link';
import { generateArticleId } from '@/lib/archive-v2';

interface Article {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  timeAgo: string;
  id?: string;
}

interface Props {
  articles: Article[];
  /** If true, links go to external source. If false (default), links to /article/[id] */
  externalLinks?: boolean;
}

const sourceColors: Record<string, { bg: string; text: string; ring: string }> = {
  'CoinDesk': { bg: 'bg-blue-50', text: 'text-blue-700', ring: 'ring-blue-200' },
  'The Block': { bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200' },
  'Decrypt': { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200' },
  'CoinTelegraph': { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
  'Bitcoin Magazine': { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200' },
  'Blockworks': { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-indigo-200' },
  'The Defiant': { bg: 'bg-pink-50', text: 'text-pink-700', ring: 'ring-pink-200' },
};

const defaultSourceStyle = { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-200' };

export default function Posts({ articles, externalLinks = false }: Props) {
  const validArticles = articles.filter(a => a && a.title && a.link && a.source);
  
  return (
    <div 
      id="news" 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 p-4 md:p-6 stagger-children"
      role="feed"
      aria-label="News articles"
    >
      {validArticles.map((article, i) => {
        const articleId = article.id || generateArticleId(article.link);
        const href = externalLinks ? article.link : `/article/${articleId}`;
        const sourceStyle = sourceColors[article.source] || defaultSourceStyle;
        
        const cardContent = (
          <div className="p-5 min-h-[180px] flex flex-col justify-between h-full">
            <div>
              <span 
                className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ring-1 ring-inset ${sourceStyle.bg} ${sourceStyle.text} ${sourceStyle.ring}`}
              >
                {article.source}
              </span>
              <h3 className="text-base font-semibold mt-3 text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-3 leading-snug">
                {article.title}
              </h3>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
              <time 
                className="text-sm text-gray-500"
                dateTime={article.pubDate}
              >
                {article.timeAgo || ''}
              </time>
              <span className="text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-sm font-medium">
                {externalLinks ? 'Open' : 'Read'}
                <svg 
                  className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24" 
                  aria-hidden="true"
                >
                  {externalLinks ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  )}
                </svg>
              </span>
            </div>
          </div>
        );
        
        if (externalLinks) {
          return (
            <article key={`${article.link}-${i}`} className="group">
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden focus-ring hover:-translate-y-1"
              >
                {cardContent}
              </a>
            </article>
          );
        }
        
        return (
          <article key={`${articleId}-${i}`} className="group">
            <Link
              href={href}
              className="block h-full bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden focus-ring hover:-translate-y-1"
            >
              {cardContent}
            </Link>
          </article>
        );
      })}
    </div>
  );
}
