/**
 * Hero Article - Full-width featured hero for the top story
 * Inspired by CoinDesk/CoinTelegraph hero layouts
 */
'use client';

import Link from 'next/link';
import { generateArticleId } from '@/lib/archive-v2';

interface Article {
  title: string;
  link: string;
  description?: string;
  pubDate: string;
  source: string;
  timeAgo: string;
}

interface HeroArticleProps {
  article: Article;
}

const sourceColors: Record<string, { bg: string; text: string; accent: string }> = {
  'CoinDesk': { bg: 'bg-blue-600', text: 'text-blue-600', accent: 'from-blue-600/20' },
  'The Block': { bg: 'bg-purple-600', text: 'text-purple-600', accent: 'from-purple-600/20' },
  'Decrypt': { bg: 'bg-emerald-600', text: 'text-emerald-600', accent: 'from-emerald-600/20' },
  'CoinTelegraph': { bg: 'bg-orange-500', text: 'text-orange-600', accent: 'from-orange-500/20' },
  'Bitcoin Magazine': { bg: 'bg-amber-500', text: 'text-amber-600', accent: 'from-amber-500/20' },
  'Blockworks': { bg: 'bg-indigo-600', text: 'text-indigo-600', accent: 'from-indigo-600/20' },
  'The Defiant': { bg: 'bg-pink-600', text: 'text-pink-600', accent: 'from-pink-600/20' },
};

const defaultStyle = { bg: 'bg-gray-600', text: 'text-gray-600', accent: 'from-gray-600/20' };

export default function HeroArticle({ article }: HeroArticleProps) {
  const articleId = generateArticleId(article.link);
  const style = sourceColors[article.source] || defaultStyle;

  return (
    <section className="relative">
      <Link 
        href={`/article/${articleId}`}
        className="group block relative overflow-hidden bg-gray-900 rounded-none md:rounded-3xl"
      >
        {/* Background gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-r ${style.accent} via-transparent to-brand-500/10 opacity-60`} />
        
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-[0.03]" aria-hidden="true">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4zIj48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJ2LTRoMnY0em0wLTZoLTJWMTJoMnY0em0wLTZoLTJWNmgydjR6Ii8+PC9nPjwvZz48L3N2Zz4=')] bg-repeat" />
        </div>

        {/* Glow effects */}
        <div className={`absolute -top-40 -right-40 w-96 h-96 ${style.bg} rounded-full blur-[120px] opacity-30 group-hover:opacity-40 transition-opacity duration-500`} />
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-brand-500 rounded-full blur-[100px] opacity-20" />

        {/* Content */}
        <div className="relative px-6 py-16 md:px-12 md:py-20 lg:px-16 lg:py-24 min-h-[400px] md:min-h-[480px] flex flex-col justify-end">
          {/* Top badges */}
          <div className="absolute top-6 left-6 md:top-8 md:left-12 lg:left-16 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-brand-500 text-black text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wide shadow-lg">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Top Story
            </span>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full text-white ${style.bg} shadow-lg`}>
              {article.source}
            </span>
          </div>

          {/* Main content */}
          <div className="max-w-4xl">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight group-hover:text-brand-400 transition-colors duration-300 mb-4 md:mb-6">
              {article.title}
            </h1>
            
            {article.description && (
              <p className="text-gray-300 text-base md:text-lg lg:text-xl line-clamp-2 md:line-clamp-3 mb-6 leading-relaxed max-w-3xl">
                {article.description}
              </p>
            )}

            <div className="flex items-center gap-4 md:gap-6">
              <time className="text-gray-400 text-sm md:text-base" dateTime={article.pubDate}>
                {article.timeAgo}
              </time>
              <span className="inline-flex items-center text-brand-400 font-semibold text-sm md:text-base group-hover:text-brand-300 transition-colors">
                Read Full Story
                <svg 
                  className="w-5 h-5 ml-2 group-hover:translate-x-2 transition-transform duration-300" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </span>
            </div>
          </div>
        </div>

        {/* Bottom gradient for readability */}
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pointer-events-none" />
      </Link>
    </section>
  );
}
