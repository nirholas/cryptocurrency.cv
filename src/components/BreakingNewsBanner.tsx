/**
 * Breaking News Banner
 * Premium urgent news banner with dramatic animations
 */

import { NewsArticle } from '@/lib/crypto-news';

interface BreakingNewsBannerProps {
  articles: NewsArticle[];
}

export default function BreakingNewsBanner({ articles }: BreakingNewsBannerProps) {
  const breakingArticle = articles[0];
  
  if (!breakingArticle) return null;

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
          
          {/* News headline with hover effect */}
          <a
            href={breakingArticle.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex-1 text-sm sm:text-base font-semibold text-white hover:text-white/90 truncate focus:outline-none focus:underline transition-all"
            aria-label={'Breaking news: ' + breakingArticle.title + ' (opens in new tab)'}
          >
            <span className="group-hover:underline underline-offset-2">{breakingArticle.title}</span>
          </a>
          
          {/* Time indicator with icon */}
          <span className="text-red-100 text-xs whitespace-nowrap hidden sm:flex items-center gap-1.5 bg-red-700/50 backdrop-blur-sm rounded-full px-3 py-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <time>{breakingArticle.timeAgo}</time>
          </span>
          
          {/* External link with arrow */}
          <svg 
            className="w-5 h-5 text-red-200 flex-shrink-0 hidden sm:block transform transition-transform duration-300 hover:translate-x-0.5 hover:-translate-y-0.5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </div>
      </div>
    </div>
  );
}
