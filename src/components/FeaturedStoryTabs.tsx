/**
 * Featured Story Tabs - CoinDesk-inspired tabbed featured stories
 *
 * Displays featured articles with filterable topic tabs (All, Bitcoin,
 * Ethereum, DeFi, etc.) so users can quickly find coverage by category.
 * Inspired by CoinDesk's tabbed "Featured Stories" section.
 *
 * @module components/FeaturedStoryTabs
 */
'use client';

import { useState, useMemo } from 'react';
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

interface FeaturedStoryTabsProps {
  articles: Article[];
  maxArticles?: number;
}

const tabs = [
  { id: 'all', label: 'All', keywords: [] as string[] },
  { id: 'bitcoin', label: '₿ Bitcoin', keywords: ['bitcoin', 'btc', 'satoshi', 'lightning network', 'mining'] },
  { id: 'ethereum', label: 'Ξ Ethereum', keywords: ['ethereum', 'eth', 'vitalik', 'layer 2', 'l2', 'rollup'] },
  { id: 'defi', label: '🔗 DeFi', keywords: ['defi', 'decentralized finance', 'yield', 'liquidity', 'lending', 'dex', 'amm', 'uniswap', 'aave'] },
  { id: 'regulation', label: '⚖️ Regulation', keywords: ['sec', 'regulation', 'regulatory', 'congress', 'ban', 'law', 'compliance', 'etf', 'cftc'] },
  { id: 'solana', label: '◎ Solana', keywords: ['solana', 'sol'] },
];

function matchesTab(article: Article, keywords: string[]): boolean {
  if (keywords.length === 0) return true;
  const text = `${article.title} ${article.description || ''}`.toLowerCase();
  return keywords.some(kw => text.includes(kw));
}

const sourceColors: Record<string, string> = {
  'CoinDesk': 'bg-blue-600',
  'The Block': 'bg-purple-600',
  'Decrypt': 'bg-emerald-600',
  'CoinTelegraph': 'bg-amber-500',
  'Bitcoin Magazine': 'bg-orange-500',
  'Blockworks': 'bg-indigo-600',
  'The Defiant': 'bg-pink-600',
  'DL News': 'bg-violet-600',
  'Bloomberg Crypto': 'bg-blue-700',
};

export default function FeaturedStoryTabs({ articles, maxArticles = 6 }: FeaturedStoryTabsProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredArticles = useMemo(() => {
    const tab = tabs.find(t => t.id === activeTab);
    if (!tab) return articles.slice(0, maxArticles);
    return articles
      .filter(a => matchesTab(a, tab.keywords))
      .slice(0, maxArticles);
  }, [articles, activeTab, maxArticles]);

  // First article is the hero, rest are listed
  const hero = filteredArticles[0];
  const rest = filteredArticles.slice(1);

  if (!hero) return null;

  const heroSlug = generateArticleSlug(hero.title, hero.pubDate);
  const heroColor = sourceColors[hero.source] || 'bg-gray-600';

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 bg-brand-500 rounded-full" />
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Featured Stories
          </h2>
        </div>
        <Link
          href="/read"
          className="text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex items-center gap-1"
        >
          See all
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Topic Tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-1" role="tablist">
        {tabs.map(tab => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md'
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Grid: Hero left + List right (CoinDesk layout) */}
      <div className="grid md:grid-cols-[1.2fr_1fr] gap-6">
        {/* Hero Featured Article */}
        <Link
          href={`/article/${heroSlug}`}
          className="group block"
        >
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden h-full hover:shadow-xl dark:hover:shadow-2xl hover:border-gray-300 dark:hover:border-slate-500 transition-all duration-300">
            <div className="p-6 md:p-8 flex flex-col h-full">
              {/* Source & Category */}
              <div className="flex items-center gap-3 mb-4">
                <span className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 text-white ${heroColor} uppercase tracking-wider rounded-sm`}>
                  {hero.source}
                </span>
                <time className="text-xs text-gray-400 dark:text-slate-500" dateTime={hero.pubDate}>
                  {hero.timeAgo}
                </time>
              </div>

              {/* Headline */}
              <h3 className="text-xl md:text-2xl lg:text-[1.75rem] font-black text-gray-900 dark:text-white leading-snug group-hover:text-brand-700 dark:group-hover:text-amber-400 transition-colors mb-4 flex-grow">
                {hero.title}
              </h3>

              {/* Description */}
              {hero.description && (
                <p className="text-gray-500 dark:text-slate-400 text-sm line-clamp-3 leading-relaxed mb-4">
                  {hero.description}
                </p>
              )}

              {/* Read more */}
              <div className="flex items-center gap-2 text-brand-600 dark:text-amber-400 font-semibold text-sm group-hover:gap-3 transition-all">
                Read Full Story
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Article List */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-slate-700">
            {rest.map((article, i) => {
              const slug = generateArticleSlug(article.title, article.pubDate);
              const color = sourceColors[article.source] || 'bg-gray-600';
              return (
                <Link
                  key={article.link}
                  href={`/article/${slug}`}
                  className="group flex items-start gap-4 p-5 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  {/* Number */}
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 font-bold text-sm flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-amber-900/30 group-hover:text-brand-600 dark:group-hover:text-amber-400 transition-colors">
                    {i + 2}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${color} flex-shrink-0`} />
                      <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                        {article.source}
                      </span>
                      <span className="text-gray-300 dark:text-slate-600">·</span>
                      <time className="text-xs text-gray-400 dark:text-slate-500" dateTime={article.pubDate}>
                        {article.timeAgo}
                      </time>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-brand-700 dark:group-hover:text-amber-400 transition-colors line-clamp-2 leading-snug">
                      {article.title}
                    </h4>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
