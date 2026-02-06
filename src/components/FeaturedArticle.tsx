/**
 * Featured Article Hero
 * CoinTelegraph-style hero section with animated gradient backgrounds
 */

import { NewsArticle } from '@/lib/crypto-news';

interface FeaturedArticleProps {
  article: NewsArticle;
}

// Source-specific gradient configurations
const sourceGradients: Record<string, {
  gradient: string;
  accent: string;
  mesh: string;
  badge: string;
}> = {
  'CoinDesk': {
    gradient: 'from-blue-900 via-blue-800 to-indigo-900',
    accent: 'bg-blue-500',
    mesh: 'radial-gradient(circle at 20% 30%, rgba(59, 130, 246, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(99, 102, 241, 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(37, 99, 235, 0.2) 0%, transparent 70%)',
    badge: 'bg-blue-500 text-white',
  },
  'CoinTelegraph': {
    gradient: 'from-gray-900 via-gray-800 to-gray-700',
    accent: 'bg-orange-500',
    mesh: 'radial-gradient(circle at 30% 20%, rgba(249, 115, 22, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 80%, rgba(239, 68, 68, 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 40%, rgba(245, 158, 11, 0.2) 0%, transparent 70%)',
    badge: 'bg-orange-500 text-white',
  },
  'The Block': {
    gradient: 'from-purple-900 via-violet-800 to-purple-900',
    accent: 'bg-purple-500',
    mesh: 'radial-gradient(circle at 25% 25%, rgba(168, 85, 247, 0.4) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(139, 92, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(124, 58, 237, 0.2) 0%, transparent 70%)',
    badge: 'bg-purple-500 text-white',
  },
  'Decrypt': {
    gradient: 'from-emerald-900 via-green-800 to-teal-900',
    accent: 'bg-emerald-500',
    mesh: 'radial-gradient(circle at 20% 40%, rgba(16, 185, 129, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(20, 184, 166, 0.3) 0%, transparent 50%), radial-gradient(circle at 45% 30%, rgba(34, 197, 94, 0.2) 0%, transparent 70%)',
    badge: 'bg-emerald-500 text-white',
  },
  'Bitcoin Magazine': {
    gradient: 'from-gray-900 via-gray-800 to-gray-700',
    accent: 'bg-gray-400',
    mesh: 'radial-gradient(circle at 30% 30%, rgba(245, 158, 11, 0.4) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(234, 179, 8, 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.2) 0%, transparent 70%)',
    badge: 'bg-gray-200 text-black',
  },
  'Blockworks': {
    gradient: 'from-indigo-900 via-blue-900 to-slate-900',
    accent: 'bg-indigo-500',
    mesh: 'radial-gradient(circle at 25% 35%, rgba(99, 102, 241, 0.4) 0%, transparent 50%), radial-gradient(circle at 75% 65%, rgba(79, 70, 229, 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(67, 56, 202, 0.2) 0%, transparent 70%)',
    badge: 'bg-indigo-500 text-white',
  },
  'The Defiant': {
    gradient: 'from-pink-900 via-rose-800 to-fuchsia-900',
    accent: 'bg-pink-500',
    mesh: 'radial-gradient(circle at 20% 30%, rgba(236, 72, 153, 0.4) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(244, 114, 182, 0.3) 0%, transparent 50%), radial-gradient(circle at 50% 50%, rgba(219, 39, 119, 0.2) 0%, transparent 70%)',
    badge: 'bg-pink-500 text-white',
  },
};

const defaultGradient = {
  gradient: 'from-gray-900 via-slate-800 to-gray-900',
  accent: 'bg-gray-500',
  mesh: 'radial-gradient(circle at 25% 25%, rgba(107, 114, 128, 0.3) 0%, transparent 50%), radial-gradient(circle at 75% 75%, rgba(75, 85, 99, 0.3) 0%, transparent 50%)',
  badge: 'bg-gray-500 text-white',
};

// Calculate reading time estimate
function getReadingTime(text: string): number {
  const wordsPerMinute = 200;
  const words = text?.split(/\s+/).length || 0;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// Get category from article (simplified extraction)
function getCategory(article: NewsArticle): string {
  const title = article.title.toLowerCase();
  if (title.includes('bitcoin') || title.includes('btc')) return 'Bitcoin';
  if (title.includes('ethereum') || title.includes('eth')) return 'Ethereum';
  if (title.includes('defi')) return 'DeFi';
  if (title.includes('nft')) return 'NFTs';
  if (title.includes('regulation') || title.includes('sec') || title.includes('law')) return 'Regulation';
  if (title.includes('market') || title.includes('price')) return 'Markets';
  return 'Breaking';
}

export default function FeaturedArticle({ article }: FeaturedArticleProps) {
  const sourceStyle = sourceGradients[article.source] || defaultGradient;
  const readingTime = getReadingTime(article.description || article.title);
  const category = getCategory(article);
  
  return (
    <article className="group relative">
      <a
        href={article.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-500 focus-visible:ring-offset-4 focus-visible:ring-offset-white rounded-3xl"
        aria-label={`Read featured article: ${article.title}`}
      >
        <div 
          className={`
            relative min-h-[400px] md:min-h-[500px] rounded-3xl overflow-hidden
            bg-gradient-to-br ${sourceStyle.gradient}
            transform transition-all duration-500 ease-out
            group-hover:scale-[1.01] group-hover:shadow-2xl
            motion-reduce:transition-none motion-reduce:group-hover:scale-100
          `}
        >
          {/* Animated Gradient Mesh Background */}
          <div 
            className="absolute inset-0 opacity-60 group-hover:opacity-80 transition-opacity duration-700 motion-reduce:transition-none"
            style={{ background: sourceStyle.mesh }}
            aria-hidden="true"
          />
          
          {/* Animated floating orbs */}
          <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
            <div 
              className={`
                absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl
                ${sourceStyle.accent} opacity-20
                animate-[pulse_8s_ease-in-out_infinite]
                motion-reduce:animate-none
              `}
            />
            <div 
              className={`
                absolute -bottom-20 -left-20 w-96 h-96 rounded-full blur-3xl
                ${sourceStyle.accent} opacity-15
                animate-[pulse_10s_ease-in-out_infinite_2s]
                motion-reduce:animate-none
              `}
            />
            <div 
              className={`
                absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full blur-3xl
                bg-white opacity-5
                animate-[pulse_6s_ease-in-out_infinite_1s]
                motion-reduce:animate-none
              `}
            />
          </div>
          
          {/* Grid pattern overlay */}
          <div 
            className="absolute inset-0 opacity-[0.03] bg-[length:40px_40px]"
            style={{
              backgroundImage: `
                linear-gradient(to right, white 1px, transparent 1px),
                linear-gradient(to bottom, white 1px, transparent 1px)
              `,
            }}
            aria-hidden="true"
          />
          
          {/* Gradient overlay for text readability */}
          <div 
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"
            aria-hidden="true"
          />
          
          {/* Content Container */}
          <div className="relative h-full min-h-[400px] md:min-h-[500px] flex flex-col justify-end p-6 sm:p-8 md:p-10 lg:p-12">
            
            {/* Top Row: Category + Source */}
            <div className="absolute top-6 sm:top-8 md:top-10 lg:top-12 left-6 sm:left-8 md:left-10 lg:left-12 right-6 sm:right-8 md:right-10 lg:right-12">
              <div className="flex flex-wrap items-center gap-3">
                {/* Category Badge */}
                <span className="inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                  <span className={`w-2 h-2 rounded-full ${sourceStyle.accent}`} aria-hidden="true" />
                  {category}
                </span>
                
                {/* Source Badge */}
                <span className={`text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm ${sourceStyle.badge}`}>
                  {article.source}
                </span>
              </div>
            </div>
            
            {/* Main Content */}
            <div className="space-y-4 md:space-y-5">
              {/* Headline */}
              <h2 
                className="
                  text-3xl sm:text-4xl md:text-5xl lg:text-6xl 
                  font-extrabold text-white leading-[1.1]
                  [text-shadow:0_2px_20px_rgba(0,0,0,0.5)]
                  group-hover:text-brand-300 transition-colors duration-300
                  motion-reduce:transition-none
                  line-clamp-3
                "
              >
                {article.title}
              </h2>
              
              {/* Description */}
              {article.description && (
                <p className="
                  text-base sm:text-lg md:text-xl 
                  text-gray-200 leading-relaxed
                  line-clamp-2 max-w-4xl
                  [text-shadow:0_1px_10px_rgba(0,0,0,0.3)]
                ">
                  {article.description}
                </p>
              )}
              
              {/* Meta Row: Time + Reading Time + CTA */}
              <div className="flex flex-wrap items-center gap-4 pt-2 md:pt-4">
                {/* Time Info */}
                <div className="flex items-center gap-4 text-gray-300 text-sm">
                  <time 
                    dateTime={article.pubDate} 
                    className="flex items-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {article.timeAgo}
                  </time>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {readingTime} min read
                  </span>
                </div>
                
                {/* Spacer */}
                <div className="flex-1 hidden sm:block" />
                
                {/* CTA Button */}
                <span className="
                  inline-flex items-center gap-2 
                  bg-white text-gray-900 
                  px-5 py-2.5 sm:px-6 sm:py-3 
                  rounded-full font-bold text-sm sm:text-base
                  shadow-lg hover:shadow-xl
                  transform transition-all duration-300
                  group-hover:bg-brand-400 group-hover:text-black
                  motion-reduce:transition-none
                ">
                  Read More
                  <svg 
                    className="w-4 h-4 sm:w-5 sm:h-5 transform transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          </div>
          
          {/* Featured Badge - Floating */}
          <div className="absolute top-6 sm:top-8 md:top-10 lg:top-12 right-6 sm:right-8 md:right-10 lg:right-12">
            <span className="
              inline-flex items-center gap-1.5 
              bg-brand-500 text-black 
              text-xs font-bold 
              px-3 py-1.5 
              rounded-full 
              uppercase tracking-wider
              shadow-lg shadow-brand-500/30
              animate-[pulse_3s_ease-in-out_infinite]
              motion-reduce:animate-none
            ">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured
            </span>
          </div>
        </div>
      </a>
    </article>
  );
}
