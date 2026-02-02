/**
 * Breaking News Banner
 * Premium urgent news banner with dramatic animations
 * Links to internal article pages for better user engagement and SEO
 */

import Link from 'next/link';
import { NewsArticle } from '@/lib/crypto-news';
import { generateArticleSlug } from '@/lib/archive-v2';

interface BreakingNewsBannerProps {
  articles: NewsArticle[];
}

export default function BreakingNewsBanner({ articles }: BreakingNewsBannerProps) {
  const breakingArticle = articles[0];
  
  if (!breakingArticle) return null;

  const articleSlug = generateArticleSlug(breakingArticle.title, breakingArticle.pubDate);

  return (
    <div 
      className="relative overflow-hidden bg-gradient-to-r from-red-600 via-red-500 to-red-600"
      role="alert"
      aria-live="polite"
    >
      {/* Animated background pulse */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-red-700 via-red-500 to-red-700 animate-[pulse_2s_ease-in-out_infinite] motion-reduce:animate-none opacity-50"
        aria-hidden="true"
      />
      
      {/* Animated shine sweep */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-[shimmer_2s_infinite] motion-reduce:animate-none"
        aria-hidden="true"
      />
      
      {/* Urgency indicator lines */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30 animate-[pulse_1s_ease-in-out_infinite] motion-reduce:animate-none" aria-hidden="true" />
      <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/30 animate-[pulse_1s_ease-in-out_infinite_0.5s] motion-reduce:animate-none" aria-hidden="true" />
      
      <div className="max-w-7xl mx-auto px-4 py-3 relative">
        <div className="flex items-center gap-4">
          {/* Breaking badge with enhanced ping */}
          <span className="relative flex-shrink-0">
            <span className="absolute inset-0 bg-white rounded-lg animate-ping opacity-40 motion-reduce:animate-none" aria-hidden="true" />
            <span className="relative bg-white text-red-600 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 animate-[pulse_1s_ease-in-out_infinite] motion-reduce:animate-none" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              Breaking
            </span>
          </span>
          
          {/* News headline - links to internal article page */}
          <Link
            href={`/article/${articleSlug}`}
            className="group flex-1 text-sm sm:text-base font-semibold text-white hover:text-white/90 truncate focus:outline-none focus:underline transition-all"
            aria-label={`Breaking news: ${breakingArticle.title}`}
          >
            <span className="group-hover:underline underline-offset-2">{breakingArticle.title}</span>
          </Link>
          
          {/* Time indicator with icon */}
          <span className="text-red-100 text-xs whitespace-nowrap hidden sm:flex items-center gap-1.5 bg-red-700/50 backdrop-blur-sm rounded-full px-3 py-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <time>{breakingArticle.timeAgo}</time>
          </span>
          
          {/* Arrow indicator for internal link */}
          <svg 
            className="w-5 h-5 text-red-200 flex-shrink-0 hidden sm:block" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
