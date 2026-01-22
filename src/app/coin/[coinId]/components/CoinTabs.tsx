/**
 * CoinTabs Component - Tab navigation for coin page sections
 */

'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export type CoinTab = 'overview' | 'markets' | 'historical' | 'news';

interface CoinTabsProps {
  activeTab: CoinTab;
  onTabChange: (tab: CoinTab) => void;
  hasMarkets?: boolean;
  hasHistorical?: boolean;
  marketsCount?: number;
}

const tabs: { id: CoinTab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'markets',
    label: 'Markets',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
      </svg>
    ),
  },
  {
    id: 'historical',
    label: 'Historical',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'news',
    label: 'News',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
      </svg>
    ),
  },
];

export default function CoinTabs({
  activeTab,
  onTabChange,
  hasMarkets = true,
  hasHistorical = true,
  marketsCount,
}: CoinTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Sync tab with URL
  useEffect(() => {
    const tabParam = searchParams.get('tab') as CoinTab | null;
    if (tabParam && tabs.some((t) => t.id === tabParam)) {
      onTabChange(tabParam);
    }
  }, [searchParams, onTabChange]);

  const handleTabClick = (tab: CoinTab) => {
    onTabChange(tab);
    // Update URL without reload
    const params = new URLSearchParams(searchParams);
    if (tab === 'overview') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl, { scroll: false });
  };

  return (
    <div className="relative">
      {/* Desktop tabs */}
      <div className="hidden sm:flex items-center gap-1 p-1 bg-gray-800/50 rounded-xl border border-gray-700/50">
        {tabs.map((tab) => {
          const isDisabled = 
            (tab.id === 'markets' && !hasMarkets) ||
            (tab.id === 'historical' && !hasHistorical);
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && handleTabClick(tab.id)}
              disabled={isDisabled}
              className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                isDisabled
                  ? 'text-gray-600 cursor-not-allowed'
                  : isActive
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gray-700 rounded-lg"
                  transition={{ type: 'spring', duration: 0.3 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {tab.icon}
                {tab.label}
                {tab.id === 'markets' && marketsCount !== undefined && (
                  <span className="px-1.5 py-0.5 text-xs bg-gray-600 rounded-md">
                    {marketsCount}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Mobile tabs - horizontal scroll */}
      <div className="sm:hidden overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 p-1 min-w-max">
          {tabs.map((tab) => {
            const isDisabled = 
              (tab.id === 'markets' && !hasMarkets) ||
              (tab.id === 'historical' && !hasHistorical);
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && handleTabClick(tab.id)}
                disabled={isDisabled}
                className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
                  isDisabled
                    ? 'text-gray-600 cursor-not-allowed bg-gray-800/30'
                    : isActive
                    ? 'text-white bg-gray-700'
                    : 'text-gray-400 bg-gray-800/50 border border-gray-700/50'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.id === 'markets' && marketsCount !== undefined && (
                  <span className="px-1 py-0.5 text-xs bg-gray-600 rounded">
                    {marketsCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
