'use client';

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Link from 'next/link';
import { MobileNav } from './MobileNav';
import { ThemeToggle } from './ThemeProvider';
import { SearchModal } from './SearchModal';
import { CommandPalette } from './CommandPalette';

// Lazy load PriceWidget
const PriceWidget = lazy(() => import('./PriceWidget'));

// Navigation items with mega menu content
const navItems = [
  { 
    label: 'Home', 
    href: '/',
    icon: '🏠',
  },
  { 
    label: 'Markets', 
    href: '/markets',
    icon: '📈',
    megaMenu: {
      sections: [
        {
          title: 'Market Data',
          links: [
            { label: 'Top Movers', href: '/movers', icon: '🚀' },
            { label: 'Market Overview', href: '/markets', icon: '📊' },
            { label: 'Trending', href: '/trending', icon: '🔥' },
          ],
        },
        {
          title: 'Analysis',
          links: [
            { label: 'Sentiment', href: '/sentiment', icon: '🎯' },
            { label: 'Technical', href: '/category/analysis', icon: '📉' },
          ],
        },
      ],
      featured: {
        title: 'Market Insights',
        description: 'Real-time crypto market data and analysis',
        href: '/markets',
      },
    },
  },
  { 
    label: 'DeFi', 
    href: '/defi',
    icon: '🏦',
    megaMenu: {
      sections: [
        {
          title: 'DeFi Sectors',
          links: [
            { label: 'Lending', href: '/category/defi?sector=lending', icon: '💰' },
            { label: 'DEXs', href: '/category/defi?sector=dex', icon: '🔄' },
            { label: 'Yield', href: '/category/defi?sector=yield', icon: '🌾' },
          ],
        },
        {
          title: 'Resources',
          links: [
            { label: 'DeFi Dashboard', href: '/defi', icon: '📊' },
            { label: 'Protocol News', href: '/category/defi', icon: '📰' },
          ],
        },
      ],
      featured: {
        title: 'DeFi Dashboard',
        description: 'Track TVL, yields, and protocol metrics',
        href: '/defi',
      },
    },
  },
  { 
    label: 'Bitcoin', 
    href: '/category/bitcoin',
    icon: '₿',
    megaMenu: {
      sections: [
        {
          title: 'Bitcoin News',
          links: [
            { label: 'Latest News', href: '/category/bitcoin', icon: '📰' },
            { label: 'Lightning Network', href: '/topic/lightning-network', icon: '⚡' },
            { label: 'Mining', href: '/topic/mining', icon: '⛏️' },
          ],
        },
        {
          title: 'Market',
          links: [
            { label: 'BTC Price', href: '/coin/bitcoin', icon: '💹' },
            { label: 'ETFs', href: '/topic/bitcoin-etf', icon: '📈' },
          ],
        },
      ],
      featured: {
        title: 'Bitcoin Coverage',
        description: 'The latest Bitcoin news and analysis',
        href: '/category/bitcoin',
      },
    },
  },
  { 
    label: 'Ethereum', 
    href: '/category/ethereum',
    icon: 'Ξ',
    megaMenu: {
      sections: [
        {
          title: 'Ethereum News',
          links: [
            { label: 'Latest News', href: '/category/ethereum', icon: '📰' },
            { label: 'Layer 2s', href: '/topic/layer-2', icon: '🔗' },
            { label: 'Staking', href: '/topic/staking', icon: '🥩' },
          ],
        },
        {
          title: 'Ecosystem',
          links: [
            { label: 'ETH Price', href: '/coin/ethereum', icon: '💹' },
            { label: 'Gas Tracker', href: '/defi', icon: '⛽' },
          ],
        },
      ],
      featured: {
        title: 'Ethereum Ecosystem',
        description: 'News from the Ethereum world',
        href: '/category/ethereum',
      },
    },
  },
  { 
    label: 'NFTs', 
    href: '/category/nft',
    icon: '🎨',
    megaMenu: {
      sections: [
        {
          title: 'NFT News',
          links: [
            { label: 'Latest', href: '/category/nft', icon: '📰' },
            { label: 'Collections', href: '/topic/nft-collections', icon: '🖼️' },
            { label: 'Marketplaces', href: '/topic/nft-marketplace', icon: '🏪' },
          ],
        },
      ],
      featured: {
        title: 'NFT Coverage',
        description: 'Digital collectibles and NFT market news',
        href: '/category/nft',
      },
    },
  },
  { 
    label: 'Regulation', 
    href: '/category/regulation',
    icon: '⚖️',
    megaMenu: {
      sections: [
        {
          title: 'Regulatory News',
          links: [
            { label: 'Latest', href: '/category/regulation', icon: '📰' },
            { label: 'SEC', href: '/topic/sec', icon: '🏛️' },
            { label: 'Global Policy', href: '/topic/crypto-policy', icon: '🌍' },
          ],
        },
      ],
      featured: {
        title: 'Regulatory Updates',
        description: 'Crypto regulation and policy news',
        href: '/category/regulation',
      },
    },
  },
];

// Mega Menu Component - Refined design
function MegaMenu({ item, isOpen }: { item: typeof navItems[0]; isOpen: boolean }) {
  if (!item.megaMenu || !isOpen) return null;

  const sectionCount = item.megaMenu.sections.length;
  const hasMultipleSections = sectionCount > 1;

  return (
    <div 
      className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50"
      role="menu"
      aria-label={`${item.label} submenu`}
    >
      {/* Arrow pointer */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-white dark:bg-slate-800 border-l border-t border-gray-200 dark:border-slate-700" />
      
      <div 
        className={`relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-2xl overflow-hidden ${
          hasMultipleSections ? 'min-w-[480px]' : 'min-w-[320px]'
        }`}
        style={{
          animation: 'menuFadeIn 200ms ease-out forwards',
        }}
      >
        <div className="flex">
          {/* Links Section */}
          <div className={`${hasMultipleSections ? 'flex-1 p-4' : 'p-4'}`}>
            <div className={hasMultipleSections ? 'grid grid-cols-2 gap-4' : ''}>
              {item.megaMenu.sections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-[11px] font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2 px-2">
                    {section.title}
                  </h3>
                  <ul className="space-y-0.5">
                    {section.links.map((link, linkIdx) => (
                      <li key={linkIdx}>
                        <Link
                          href={link.href}
                          className="flex items-center gap-2.5 px-2 py-2 text-gray-700 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg transition-all duration-150 group"
                          role="menuitem"
                        >
                          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-slate-700 group-hover:bg-brand-100 dark:group-hover:bg-brand-900/30 group-hover:scale-105 transition-all duration-150 text-base">
                            {link.icon}
                          </span>
                          <span className="font-medium text-sm">{link.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Card - Right side */}
          <div className="w-48 bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 p-4 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                <span className="text-xl text-white">{item.icon}</span>
              </div>
              <h4 className="font-semibold text-white text-sm mb-1">
                {item.megaMenu.featured.title}
              </h4>
              <p className="text-white/80 text-xs leading-relaxed">
                {item.megaMenu.featured.description}
              </p>
            </div>
            <Link
              href={item.megaMenu.featured.href}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-white/90 transition-colors mt-3 group"
              role="menuitem"
            >
              Explore
              <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle scroll for shrinking header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard shortcuts: Cmd/Ctrl+K for search, Cmd/Ctrl+Shift+P for command palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !e.shiftKey) {
        e.preventDefault();
        setIsSearchOpen(true);
        setIsCommandPaletteOpen(false);
      }
      // Cmd/Ctrl + Shift + P for command palette
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'p') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
        setIsSearchOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle mega menu hover with delay
  const handleMenuEnter = (label: string) => {
    if (menuTimeoutRef.current) {
      clearTimeout(menuTimeoutRef.current);
    }
    setActiveMenu(label);
  };

  const handleMenuLeave = () => {
    menuTimeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 150);
  };

  // Handle keyboard navigation for mega menu
  const handleNavKeyDown = (e: React.KeyboardEvent, item: typeof navItems[0]) => {
    if (e.key === 'Enter' || e.key === ' ') {
      if (item.megaMenu) {
        e.preventDefault();
        setActiveMenu(activeMenu === item.label ? null : item.label);
      }
    } else if (e.key === 'Escape') {
      setActiveMenu(null);
    }
  };

  return (
    <>
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="skip-link focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
      >
        Skip to main content
      </a>

      <header 
        ref={headerRef}
        className={`sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-gray-100 dark:border-slate-800 transition-all duration-300 ${
          isScrolled ? 'shadow-md' : 'shadow-sm'
        }`}
        style={{
          height: isScrolled ? '64px' : '80px',
        }}
      >
        <div 
          className="flex justify-between items-center px-4 lg:px-6 max-w-7xl mx-auto h-full transition-all duration-300"
        >
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              href="/" 
              className="text-xl font-bold flex items-center gap-2.5 focus-ring rounded-lg px-2 py-1 -mx-2"
            >
              <span 
                className={`transition-all duration-300 ${isScrolled ? 'text-xl' : 'text-2xl'}`} 
                aria-hidden="true"
              >
                📰
              </span>
              <span className="hidden sm:inline bg-gradient-to-r from-brand-600 to-brand-500 dark:from-amber-400 dark:to-amber-500 bg-clip-text text-transparent">
                Crypto News
              </span>
            </Link>
          </div>

          {/* Main Navigation - Desktop */}
          <nav 
            className="hidden lg:flex items-center gap-1" 
            aria-label="Main navigation"
            role="menubar"
          >
            {navItems.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => handleMenuEnter(item.label)}
                onMouseLeave={handleMenuLeave}
              >
                <Link 
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus-ring ${
                    activeMenu === item.label
                      ? 'text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30'
                      : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800'
                  }`}
                  role="menuitem"
                  aria-haspopup={item.megaMenu ? 'true' : undefined}
                  aria-expanded={item.megaMenu ? activeMenu === item.label : undefined}
                  onKeyDown={(e) => handleNavKeyDown(e, item)}
                >
                  <span className="hidden xl:inline" aria-hidden="true">{item.icon}</span>
                  <span>{item.label}</span>
                  {item.megaMenu && (
                    <svg 
                      className={`w-4 h-4 transition-transform duration-200 ${activeMenu === item.label ? 'rotate-180' : ''}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </Link>
                
                {/* Mega Menu */}
                <MegaMenu item={item} isOpen={activeMenu === item.label} />
              </div>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Price Widget - Desktop only */}
            <div className="hidden xl:block mr-2">
              <Suspense fallback={<div className="w-48 h-6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
                <PriceWidget variant="compact" />
              </Suspense>
            </div>

            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 focus-ring"
              aria-label="Search (⌘K)"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden md:flex items-center gap-1 text-xs text-gray-400 dark:text-slate-500">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 rounded text-[10px] font-medium">⌘K</kbd>
              </span>
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* GitHub Link */}
            <a
              href="https://github.com/nirholas/free-crypto-news"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-2 ml-1 px-4 py-2 bg-gray-900 dark:bg-slate-700 text-white rounded-full hover:bg-gray-800 dark:hover:bg-slate-600 hover:shadow-lg active:scale-95 transition-all duration-200 text-sm font-medium focus-ring"
              aria-label="View on GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              <span className="hidden md:inline">Star</span>
            </a>

            {/* Mobile Nav Toggle */}
            <MobileNav />
          </div>
        </div>
      </header>

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      {/* Command Palette */}
      <CommandPalette 
        isOpen={isCommandPaletteOpen} 
        onClose={() => setIsCommandPaletteOpen(false)} 
      />
    </>
  );
}
