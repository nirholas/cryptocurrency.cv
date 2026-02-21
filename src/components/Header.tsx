'use client';

import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { MobileNav } from './MobileNav';

import { SearchModal } from './SearchModal';
import { CommandPalette } from './CommandPalette';
import { LanguageSwitcher } from './LanguageSwitcher';

// Lazy load MarketWidget
const MarketWidget = lazy(() => import('./MarketWidget'));

// Navigation items with mega menu content - consolidated for better UX
const navItems = [
  { 
    label: 'Home', 
    href: '/',
  },
  { 
    label: 'Markets', 
    href: '/markets',
    megaMenu: {
      sections: [
        {
          title: 'Market Data',
          links: [
            { label: 'Market Overview', href: '/markets' },
            { label: 'Top Gainers', href: '/markets/gainers' },
            { label: 'Top Losers', href: '/markets/losers' },
            { label: 'Trending', href: '/trending' },
            { label: 'Exchanges', href: '/markets/exchanges' },
            { label: 'Categories', href: '/markets/categories' },
          ],
        },
        {
          title: 'Top Assets',
          links: [
            { label: 'Bitcoin', href: '/category/bitcoin' },
            { label: 'Ethereum', href: '/category/ethereum' },
            { label: 'NFTs', href: '/category/nft' },
            { label: 'BTC Price', href: '/coin/bitcoin' },
            { label: 'ETH Price', href: '/coin/ethereum' },
          ],
        },
        {
          title: 'Analysis',
          links: [
            { label: 'Fear & Greed', href: '/sentiment' },
            { label: 'Screener', href: '/screener' },
            { label: 'Heatmap', href: '/heatmap' },
            { label: 'Dominance', href: '/dominance' },
            { label: 'Calculator', href: '/calculator' },
          ],
        },
      ],
      featured: {
        title: 'Fear & Greed Index',
        description: 'Track market sentiment with real-time Fear & Greed data',
        href: '/sentiment',
        icon: '→',
      },
    },
  },
  { 
    label: 'News', 
    href: '/',
    megaMenu: {
      sections: [
        {
          title: 'Categories',
          links: [
            { label: 'Bitcoin News', href: '/category/bitcoin' },
            { label: 'Ethereum News', href: '/category/ethereum' },
            { label: 'DeFi News', href: '/category/defi' },
            { label: 'NFT News', href: '/category/nft' },
            { label: 'Regulation', href: '/category/regulation' },
          ],
        },
        {
          title: 'Bitcoin',
          links: [
            { label: 'Lightning Network', href: '/topic/lightning-network' },
            { label: 'Mining', href: '/topic/mining' },
            { label: 'Bitcoin ETFs', href: '/topic/bitcoin-etf' },
          ],
        },
        {
          title: 'Ethereum',
          links: [
            { label: 'Layer 2s', href: '/topic/layer-2' },
            { label: 'Staking', href: '/topic/staking' },
            { label: 'Gas Tracker', href: '/gas' },
          ],
        },
        {
          title: 'Regulatory',
          links: [
            { label: 'SEC News', href: '/topic/sec' },
            { label: 'Global Policy', href: '/topic/crypto-policy' },
            { label: 'Regulatory Dashboard', href: '/regulatory' },
          ],
        },
      ],
      featured: {
        title: 'Breaking News',
        description: 'Latest crypto news from 12+ sources',
        href: '/',
        icon: '→',
      },
    },
  },
  { 
    label: 'DeFi', 
    href: '/defi',
    megaMenu: {
      sections: [
        {
          title: 'DeFi Sectors',
          links: [
            { label: 'Lending', href: '/category/defi?sector=lending' },
            { label: 'DEXs', href: '/category/defi?sector=dex' },
            { label: 'Yield', href: '/category/defi?sector=yield' },
            { label: 'By Chain', href: '/defi/chain/ethereum' },
          ],
        },
        {
          title: 'Tools',
          links: [
            { label: 'DeFi Dashboard', href: '/defi' },
            { label: 'Gas Tracker', href: '/gas' },
            { label: 'Liquidations', href: '/liquidations' },
            { label: 'Calculator', href: '/calculator' },
          ],
        },
      ],
      featured: {
        title: 'DeFi Dashboard',
        description: 'Track TVL, yields, and protocol metrics',
        href: '/defi',
        icon: '→',
      },
    },
  },
  { 
    label: 'AI', 
    href: '/ai/oracle',
    megaMenu: {
      sections: [
        {
          title: 'AI Products',
          links: [
            { label: 'AI Hub', href: '/ai' },
            { label: 'The Oracle', href: '/ai/oracle' },
            { label: 'The Brief', href: '/ai/brief' },
            { label: 'The Debate', href: '/ai/debate' },
            { label: 'The Counter', href: '/ai/counter' },
          ],
        },
        {
          title: 'Analysis',
          links: [
            { label: 'Sentiment', href: '/sentiment' },
            { label: 'AI Digest', href: '/digest' },
            { label: 'AI Market Agent', href: '/ai-agent' },
            { label: 'Fact Check', href: '/factcheck' },
            { label: 'Clickbait Detector', href: '/clickbait' },
            { label: 'Entity Explorer', href: '/entities' },
          ],
        },
      ],
      featured: {
        title: 'Ask The Oracle',
        description: 'Natural language queries over all crypto data',
        href: '/ai/oracle',
        icon: '→',
      },
    },
  },
  {
    label: 'Tools',
    href: '/orderbook',
    megaMenu: {
      sections: [
        {
          title: 'Trading',
          links: [
            { label: 'Order Book', href: '/orderbook' },
            { label: 'Whale Alerts', href: '/whales' },
            { label: 'Liquidations', href: '/liquidations' },
            { label: 'Options Flow', href: '/options' },
            { label: 'Arbitrage Scanner', href: '/arbitrage' },
          ],
        },
        {
          title: 'Analytics',
          links: [
            { label: 'Analytics Hub', href: '/analytics' },
            { label: 'Headline Tracker', href: '/analytics/headlines' },
            { label: 'Protocol Health', href: '/protocol-health' },
            { label: 'Coverage Gaps', href: '/coverage-gap' },
            { label: 'Influencer Tracker', href: '/influencers' },
            { label: 'Narratives', href: '/narratives' },
          ],
        },
        {
          title: 'Portfolio',
          links: [
            { label: 'Portfolio Tracker', href: '/portfolio' },
            { label: 'Watchlist', href: '/watchlist' },
            { label: 'Saved Articles', href: '/saved' },
            { label: 'Predictions', href: '/predictions' },
            { label: 'Backtest', href: '/backtest' },
          ],
        },
      ],
      featured: {
        title: 'Trading Intelligence',
        description: 'Real-time order books, whale tracking, and arbitrage opportunities',
        href: '/orderbook',
        icon: '→',
      },
    },
  },
  {
    label: 'Learn',
    href: '/blog',
    megaMenu: {
      sections: [
        {
          title: 'Guides',
          links: [
            { label: 'Crypto Blog', href: '/blog' },
            { label: 'Bitcoin Guide', href: '/blog/what-is-bitcoin' },
            { label: 'Ethereum vs Bitcoin', href: '/blog/ethereum-vs-bitcoin' },
            { label: 'DeFi Guide', href: '/blog/defi-beginners-guide' },
            { label: 'About Us', href: '/about' },
          ],
        },
        {
          title: 'Tutorials',
          links: [
            { label: 'Technical Analysis', href: '/blog/how-to-read-crypto-charts' },
            { label: 'Security Guide', href: '/blog/crypto-security-guide' },
            { label: 'Layer 2 Explained', href: '/blog/layer-2-explained' },
          ],
        },
        {
          title: 'Research Tools',
          links: [
            { label: 'Citations', href: '/citations' },
            { label: 'Claims Tracker', href: '/claims' },
            { label: 'Story Origins', href: '/origins' },
            { label: 'Funding Rounds', href: '/funding' },
          ],
        },
      ],
      featured: {
        title: 'Crypto Education',
        description: 'Free guides and tutorials for beginners and experts',
        href: '/blog',
        icon: '→',
      },
    },
  },
  {
    label: 'API',
    href: '/developers',
    megaMenu: {
      sections: [
        {
          title: 'API & Tools',
          links: [
            { label: 'Developer Portal', href: '/developers' },
            { label: 'API Documentation', href: '/examples' },
            { label: 'News Sources', href: '/sources' },
          ],
        },
        {
          title: 'Account',
          links: [
            { label: 'Billing Dashboard', href: '/billing' },
            { label: 'Settings', href: '/settings' },
            { label: 'Install App', href: '/install' },
          ],
        },
      ],
      featured: {
        title: 'Free Crypto News API',
        description: 'Access real-time crypto news, market data, and AI analysis via REST API',
        href: '/developers',
        icon: '→',
      },
    },
  },
  {
    label: 'Pricing',
    href: '/pricing',
    megaMenu: {
      sections: [
        {
          title: 'Plans',
          links: [
            { label: 'Free Tier', href: '/pricing' },
            { label: 'Pro Plan', href: '/pricing#pro' },
            { label: 'Enterprise', href: '/pricing#enterprise' },
          ],
        },
        {
          title: 'Payment',
          links: [
            { label: 'x402 Crypto Pay', href: '/pricing/upgrade' },
            { label: 'Billing Dashboard', href: '/billing' },
          ],
        },
      ],
      featured: {
        title: 'x402 Crypto Payments',
        description: 'Pay for API access with USDC on Base network. Instant upgrades, no credit card needed.',
        href: '/pricing/upgrade',
        icon: '→',
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
        className={`relative bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-xl overflow-hidden ${
          hasMultipleSections ? 'min-w-[480px]' : 'min-w-[320px]'
        }`}
        style={{
          animation: 'menuFadeIn 150ms ease-out forwards',
        }}
      >
        <div className="flex">
          {/* Links Section */}
          <div className={`${hasMultipleSections ? 'flex-1 p-3' : 'p-3'}`}>
            <div className={hasMultipleSections ? 'grid grid-cols-2 gap-3' : ''}>
              {item.megaMenu.sections.map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-[10px] font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 px-2">
                    {section.title}
                  </h3>
                  <ul className="space-y-px">
                    {section.links.map((link, linkIdx) => (
                      <li key={linkIdx}>
                        <Link
                          href={link.href}
                          className="flex items-center px-2 py-1.5 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors duration-100"
                          role="menuitem"
                        >
                          <span className="text-[13px] font-medium">{link.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Featured Card - Right side */}
          <div className="w-44 bg-gray-900 dark:bg-slate-900 p-4 flex flex-col justify-between border-l border-gray-200 dark:border-slate-700">
            <div>
              <h4 className="font-semibold text-white text-sm mb-1">
                {item.megaMenu.featured.title}
              </h4>
              <p className="text-gray-400 text-xs leading-relaxed">
                {item.megaMenu.featured.description}
              </p>
            </div>
            <Link
              href={item.megaMenu.featured.href}
              className="inline-flex items-center gap-1 text-xs font-medium text-gray-300 hover:text-white transition-colors mt-3 group"
              role="menuitem"
            >
              Explore
              <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const tA11y = useTranslations('a11y');
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
        {tA11y('skipToContent')}
      </a>

      <header 
        ref={headerRef}
        className={`sticky top-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 transition-all duration-300 w-full max-w-full ${
          isScrolled ? 'shadow-sm' : ''
        }`}
        style={{
          height: isScrolled ? '56px' : '64px',
        }}
      >
        <div 
          className="flex justify-between items-center px-4 lg:px-6 max-w-[1400px] mx-auto h-full transition-all duration-300"
        >
          {/* Logo - The Block inspired bold wordmark */}
          <div className="flex items-center flex-shrink-0">
            <Link 
              href="/" 
              className="flex items-center gap-2.5 focus-ring px-1 py-1 -mx-1"
            >
              <span
                className="font-black uppercase leading-none select-none"
                style={{ letterSpacing: '-0.05em', fontSize: '1.6rem' }}
              >
                <span style={{ color: '#F7931A' }}>F</span>
                <span className="text-gray-900 dark:text-white">CN</span>
              </span>
            </Link>
          </div>

          {/* Main Navigation - Desktop */}
          <nav 
            className="hidden lg:flex items-center gap-0 flex-shrink min-w-0 overflow-hidden" 
            aria-label="Main navigation"
            role="menubar"
          >
            {navItems.map((item) => (
              <div
                key={item.label}
                role="group"
                className="relative"
                onMouseEnter={() => handleMenuEnter(item.label)}
                onMouseLeave={handleMenuLeave}
              >
                <Link 
                  href={item.href}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-colors duration-100 focus-ring whitespace-nowrap ${
                    activeMenu === item.label
                      ? 'text-gray-900 dark:text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                  role="menuitem"
                  aria-haspopup={item.megaMenu ? 'true' : undefined}
                  aria-expanded={item.megaMenu ? activeMenu === item.label : undefined}
                  onKeyDown={(e) => handleNavKeyDown(e, item)}
                >
                  <span>{item.label}</span>
                  {item.megaMenu && (
                    <svg 
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${activeMenu === item.label ? 'rotate-180' : ''}`} 
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
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Market Widget - Desktop only (2xl+ to avoid crowding nav) */}
            <div className="hidden 2xl:flex items-center mr-2">
              <div className="w-px h-5 bg-gray-200 dark:bg-slate-700 mr-3" />
              <Suspense fallback={<div className="w-48 h-6 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />}>
                <MarketWidget />
              </Suspense>
            </div>

            {/* Search Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-all duration-200 focus-ring"
              aria-label={`${tCommon('search')} (⌘K)`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden md:flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 rounded text-[10px] font-medium">⌘K</kbd>
              </span>
            </button>



            {/* Language Switcher */}
            <div className="hidden sm:block">
              <LanguageSwitcher variant="compact" />
            </div>

            {/* GitHub Link - Clean CTA */}
            <a
              href="https://github.com/nirholas/free-crypto-news"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 ml-1 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-[13px] font-bold hover:bg-gray-700 dark:hover:bg-gray-100 active:scale-[0.98] transition-all duration-100 focus-ring rounded-sm"
              aria-label="Star on GitHub"
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
