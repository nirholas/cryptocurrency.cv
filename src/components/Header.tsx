'use client';

import { useState, useEffect, useRef } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { GlobalSearch } from '@/components/GlobalSearch';
import { Menu, X, Search, Sun, Moon, ChevronDown, Star, Briefcase, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationCenter from '@/components/NotificationCenter';
import PriceTickerStrip from '@/components/PriceTickerStrip';
import Logo from '@/components/Logo';

const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  {
    label: 'Markets',
    href: '/markets',
    children: [
      { label: 'Overview', href: '/markets' },
      { label: 'Trading & Charts', href: '/trading' },
      { label: 'Fear & Greed', href: '/fear-greed' },
      { label: 'Heatmap', href: '/heatmap' },
      { label: 'Screener', href: '/screener' },
      { label: 'Gas Tracker', href: '/gas' },
      { label: 'Token Unlocks', href: '/unlocks' },
      { label: 'Derivatives', href: '/derivatives' },
      { label: 'Stablecoins', href: '/stablecoins' },
      { label: 'L2 / Rollups', href: '/l2' },
      { label: 'Whales', href: '/whales' },
      { label: 'Macro', href: '/macro' },
      { label: 'Exchanges', href: '/exchanges' },
    ],
  },
  {
    label: 'News',
    href: '/category/bitcoin',
    children: [
      { label: 'Bitcoin', href: '/category/bitcoin' },
      { label: 'Ethereum', href: '/category/ethereum' },
      { label: 'DeFi', href: '/category/defi' },
      { label: 'NFTs', href: '/category/nft' },
      { label: 'Regulation', href: '/category/regulation' },
      { label: 'Altcoins', href: '/category/altcoins' },
      { label: 'Topics', href: '/tags' },
      { label: 'Podcast', href: '/podcast' },
      { label: 'Videos', href: '/videos' },
      { label: 'Press Releases', href: '/press-releases' },
      { label: 'Submit PR', href: '/submit-press-release' },
    ],
  },
  { label: 'Opinion', href: '/opinion' },
  { label: 'Intelligence', href: '/intelligence' },
  { label: 'DeFi', href: '/defi' },
  { label: 'Learn', href: '/learn' },
  {
    label: 'Tools',
    href: '/developers',
    children: [
      { label: 'API Docs', href: '/developers' },
      { label: 'Widget Builder', href: '/widgets' },
      { label: 'Calculator', href: '/calculator' },
      { label: 'Compare', href: '/compare' },
      { label: 'Gas Tracker', href: '/gas' },
      { label: 'Sources', href: '/sources' },
      { label: 'Explore', href: '/explore' },
      { label: 'Sentiment', href: '/sentiment' },
      { label: 'Archive', href: '/archive' },
    ],
  },
  {
    label: 'My',
    href: '/watchlist',
    children: [
      { label: 'Watchlist', href: '/watchlist' },
      { label: 'Portfolio', href: '/portfolio' },
      { label: 'Bookmarks', href: '/bookmarks' },
      { label: 'Alerts', href: '/alerts' },
      { label: 'Settings', href: '/settings' },
    ],
  },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Newsletters', href: '/newsletters' },
] as const;

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => {
    const cycle = {
      light: 'dark' as const,
      dark: 'midnight' as const,
      midnight: 'light' as const,
    };
    setTheme(cycle[resolvedTheme] ?? 'dark');
  };

  // Scroll-aware header: hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 10);
      if (y > lastScrollY.current && y > 100 && !mobileOpen) {
        setHeaderVisible(false);
      } else {
        setHeaderVisible(true);
      }
      lastScrollY.current = y;
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mobileOpen]);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Listen for fcn:open-search custom event (from KeyboardShortcuts `/` key)
  useEffect(() => {
    const handler = () => setSearchOpen(true);
    document.addEventListener('fcn:open-search', handler);
    return () => document.removeEventListener('fcn:open-search', handler);
  }, []);

  // Close mobile menu on window resize past lg breakpoint
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add('menu-open');
    } else {
      document.body.classList.remove('menu-open');
    }
    return () => document.body.classList.remove('menu-open');
  }, [mobileOpen]);

  // Track which mobile accordion section is open
  const [mobileAccordion, setMobileAccordion] = useState<string | null>(null);
  const toggleMobileAccordion = (label: string) => {
    setMobileAccordion((prev) => (prev === label ? null : label));
  };

  return (
    <>
      {/* Live Price Ticker */}
      <PriceTickerStrip />

      <header
        className={cn(
          'border-border sticky top-0 z-50 border-b bg-(--color-surface)/80 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300',
          scrolled && 'border-border/60 shadow-(--shadow-md)',
          !headerVisible && '-translate-y-full',
        )}
      >
        <div
          className={cn(
            'container-main flex items-center justify-between gap-4 transition-all duration-200',
            scrolled ? 'h-14' : 'h-16',
          )}
        >
          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center gap-2">
            <Logo size={scrolled ? 'sm' : 'md'} />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => ('children' in item ? setOpenDropdown(item.label) : undefined)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {'children' in item ? (
                  <button
                    type="button"
                    onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                    aria-expanded={openDropdown === item.label}
                    aria-haspopup="true"
                    className={cn(
                      'flex cursor-pointer items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      'text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 opacity-50 transition-transform duration-200',
                        openDropdown === item.label && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      'text-text-secondary hover:text-text-primary hover:bg-surface-secondary',
                    )}
                  >
                    {item.label}
                  </Link>
                )}

                {/* Dropdown with animation */}
                {'children' in item && openDropdown === item.label && (
                  <div className="absolute top-full left-0 z-50 pt-1.5" role="menu">
                    <div className="border-border animate-dropdown min-w-55 rounded-xl border bg-(--color-surface) py-1.5 shadow-(--shadow-dropdown)">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          role="menuitem"
                          className="text-text-secondary hover:text-text-primary hover:bg-surface-secondary mx-1 flex items-center gap-2 rounded-md px-4 py-2 text-sm transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            <Link
              href="/watchlist"
              className="hover:bg-surface-secondary text-text-secondary hidden rounded-md p-2 transition-colors sm:flex"
              aria-label="Watchlist"
              title="Watchlist"
            >
              <Star className="h-4.5 w-4.5" aria-hidden="true" />
            </Link>

            <Link
              href="/portfolio"
              className="hover:bg-surface-secondary text-text-secondary hidden rounded-md p-2 transition-colors md:flex"
              aria-label="Portfolio"
              title="Portfolio"
            >
              <Briefcase className="h-4.5 w-4.5" aria-hidden="true" />
            </Link>

            {/* Notification Center */}
            <div className="hidden sm:flex">
              <NotificationCenter />
            </div>

            {/* Dashboard / Sign In */}
            <Link
              href="/dashboard"
              className="bg-accent hover:bg-accent-hover hidden items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors sm:flex"
              aria-label="Dashboard"
              title="Dashboard"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>

            <div className="bg-border mx-1 hidden h-5 w-px sm:block" />

            <button
              onClick={() => setSearchOpen(true)}
              className="hover:bg-surface-secondary text-text-secondary flex cursor-pointer items-center gap-2 rounded-md p-2 transition-colors"
              aria-label="Search (Cmd+K)"
              title="Search"
            >
              <Search className="h-4.5 w-4.5" aria-hidden="true" />
              <kbd className="border-border bg-surface-secondary text-text-tertiary hidden items-center gap-0.5 rounded border px-1.5 py-0.5 font-mono text-[10px] sm:inline-flex">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={toggleTheme}
              className="hover:bg-surface-secondary text-text-secondary cursor-pointer rounded-md p-2 transition-colors"
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={resolvedTheme === 'dark' ? 'Light mode' : 'Dark mode'}
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="h-4.5 w-4.5" aria-hidden="true" />
              ) : (
                <Moon className="h-4.5 w-4.5" aria-hidden="true" />
              )}
            </button>

            {/* Mobile menu toggle */}
            <button
              onClick={() => {
                const next = !mobileOpen;
                setMobileOpen(next);
                document.body.classList.toggle('menu-open', next);
              }}
              className="hover:bg-surface-secondary text-text-secondary flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md p-2 transition-colors lg:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              <div className="relative h-5 w-5">
                <Menu
                  className={cn(
                    'absolute inset-0 h-5 w-5 transition-all duration-200',
                    mobileOpen ? 'scale-50 rotate-90 opacity-0' : 'scale-100 rotate-0 opacity-100',
                  )}
                  aria-hidden="true"
                />
                <X
                  className={cn(
                    'absolute inset-0 h-5 w-5 transition-all duration-200',
                    mobileOpen ? 'scale-100 rotate-0 opacity-100' : 'scale-50 -rotate-90 opacity-0',
                  )}
                  aria-hidden="true"
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Nav — animated slide */}
        <div
          id="mobile-nav"
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out lg:hidden',
            mobileOpen ? 'border-border max-h-[80vh] border-t opacity-100' : 'max-h-0 opacity-0',
          )}
          aria-hidden={!mobileOpen}
        >
          <div className="bg-(--color-surface)">
            {/* Mobile search bar */}
            <div className="container-main pt-3 pb-2">
              <button
                onClick={() => {
                  setSearchOpen(true);
                  setMobileOpen(false);
                  document.body.classList.remove('menu-open');
                }}
                className="border-border bg-surface-secondary text-text-tertiary flex w-full cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-sm transition-colors"
                aria-label="Search news, topics, coins"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Search news, topics, coins…
              </button>
            </div>

            <nav className="container-main space-y-0.5 py-3" aria-label="Mobile navigation">
              {NAV_ITEMS.map((item) => (
                <div key={item.label}>
                  {'children' in item ? (
                    /* Accordion-style: button toggles children visibility */
                    <button
                      onClick={() => toggleMobileAccordion(item.label)}
                      className="text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex min-h-11 w-full cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                      aria-expanded={mobileAccordion === item.label}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 opacity-60 transition-transform duration-200',
                          mobileAccordion === item.label && 'rotate-180',
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="text-text-secondary hover:text-text-primary hover:bg-surface-secondary flex min-h-11 items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors"
                    >
                      {item.label}
                    </Link>
                  )}

                  {'children' in item && (
                    <div
                      className={cn(
                        'border-border ml-4 space-y-0.5 overflow-hidden border-l-2 pl-3 transition-all duration-200',
                        mobileAccordion === item.label
                          ? 'mt-0.5 max-h-96 opacity-100'
                          : 'max-h-0 opacity-0',
                      )}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="text-text-tertiary hover:text-text-primary flex min-h-11 items-center px-3 py-2.5 text-sm transition-colors"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile-only quick links */}
              <div className="border-border mt-3 flex gap-2 border-t pt-3">
                <Link
                  href="/watchlist"
                  onClick={() => setMobileOpen(false)}
                  className="border-border text-text-secondary hover:bg-surface-secondary flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border py-2.5 text-sm transition-colors"
                >
                  <Star className="h-4 w-4" aria-hidden="true" />
                  Watchlist
                </Link>
                <Link
                  href="/portfolio"
                  onClick={() => setMobileOpen(false)}
                  className="border-border text-text-secondary hover:bg-surface-secondary flex min-h-11 flex-1 items-center justify-center gap-2 rounded-md border py-2.5 text-sm transition-colors"
                >
                  <Briefcase className="h-4 w-4" aria-hidden="true" />
                  Portfolio
                </Link>
              </div>
            </nav>
          </div>
        </div>

        {/* Dropdown animation */}
        <style jsx>{`
          @keyframes dropdown-in {
            from {
              opacity: 0;
              transform: translateY(-4px) scale(0.97);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
          .animate-dropdown {
            animation: dropdown-in 0.15s ease-out;
          }
        `}</style>
      </header>

      {/* Global Search Modal */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
