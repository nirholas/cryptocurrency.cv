"use client";

import { useState, useEffect, useRef } from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { GlobalSearch } from "@/components/GlobalSearch";
import {
  Menu,
  X,
  Search,
  Sun,
  Moon,
  ChevronDown,
  Star,
  Briefcase,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationCenter from "@/components/NotificationCenter";
import PriceTickerStrip from "@/components/PriceTickerStrip";
import Logo from "@/components/Logo";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  {
    label: "Markets",
    href: "/markets",
    children: [
      { label: "Overview", href: "/markets" },
      { label: "Trading & Charts", href: "/trading" },
      { label: "Fear & Greed", href: "/fear-greed" },
      { label: "Heatmap", href: "/heatmap" },
      { label: "Screener", href: "/screener" },
      { label: "Gas Tracker", href: "/gas" },
      { label: "Token Unlocks", href: "/unlocks" },
      { label: "Derivatives", href: "/derivatives" },
      { label: "Stablecoins", href: "/stablecoins" },
      { label: "L2 / Rollups", href: "/l2" },
      { label: "Whales", href: "/whales" },
      { label: "Macro", href: "/macro" },
      { label: "Exchanges", href: "/exchanges" },
    ],
  },
  {
    label: "News",
    href: "/category/bitcoin",
    children: [
      { label: "Bitcoin", href: "/category/bitcoin" },
      { label: "Ethereum", href: "/category/ethereum" },
      { label: "DeFi", href: "/category/defi" },
      { label: "NFTs", href: "/category/nft" },
      { label: "Regulation", href: "/category/regulation" },
      { label: "Altcoins", href: "/category/altcoins" },
    ],
  },
  { label: "Intelligence", href: "/intelligence" },
  { label: "DeFi", href: "/defi" },
  { label: "Learn", href: "/learn" },
  {
    label: "Tools",
    href: "/developers",
    children: [
      { label: "API Docs", href: "/developers" },
      { label: "Widget Builder", href: "/widgets" },
      { label: "Calculator", href: "/calculator" },
      { label: "Compare", href: "/compare" },
      { label: "Gas Tracker", href: "/gas" },
      { label: "Sources", href: "/sources" },
      { label: "Explore", href: "/explore" },
      { label: "Sentiment", href: "/sentiment" },
      { label: "Archive", href: "/archive" },
    ],
  },
  {
    label: "My",
    href: "/watchlist",
    children: [
      { label: "Watchlist", href: "/watchlist" },
      { label: "Portfolio", href: "/portfolio" },
      { label: "Bookmarks", href: "/bookmarks" },
      { label: "Alerts", href: "/alerts" },
      { label: "Settings", href: "/settings" },
    ],
  },
  { label: "Pricing", href: "/pricing" },
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
      light: "dark" as const,
      dark: "midnight" as const,
      midnight: "light" as const,
    };
    setTheme(cycle[resolvedTheme] ?? "dark");
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
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [mobileOpen]);

  // Cmd+K / Ctrl+K global shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Listen for fcn:open-search custom event (from KeyboardShortcuts `/` key)
  useEffect(() => {
    const handler = () => setSearchOpen(true);
    document.addEventListener("fcn:open-search", handler);
    return () => document.removeEventListener("fcn:open-search", handler);
  }, []);

  // Close mobile menu on window resize past lg breakpoint
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Body scroll lock when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("menu-open");
    } else {
      document.body.classList.remove("menu-open");
    }
    return () => document.body.classList.remove("menu-open");
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
          "sticky top-0 z-50 border-b border-border bg-(--color-surface)/80 backdrop-blur-xl backdrop-saturate-150 transition-all duration-300",
          scrolled &&
            "shadow-(--shadow-md) border-border/60",
          !headerVisible && "-translate-y-full",
        )}
      >
        <div
          className={cn(
            "container-main flex items-center justify-between gap-4 transition-all duration-200",
            scrolled ? "h-14" : "h-16",
          )}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0 group">
            <Logo size={scrolled ? "sm" : "md"} />
          </Link>

          {/* Desktop Nav */}
          <nav
            className="hidden lg:flex items-center gap-0.5"
            aria-label="Main navigation"
          >
            {NAV_ITEMS.map((item) => (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() =>
                  "children" in item ? setOpenDropdown(item.label) : undefined
                }
                onMouseLeave={() => setOpenDropdown(null)}
              >
                {"children" in item ? (
                  <button
                    type="button"
                    onClick={() =>
                      setOpenDropdown(
                        openDropdown === item.label ? null : item.label,
                      )
                    }
                    aria-expanded={openDropdown === item.label}
                    aria-haspopup="true"
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                      "text-text-secondary hover:text-text-primary hover:bg-surface-secondary",
                    )}
                  >
                    {item.label}
                    <ChevronDown
                      className={cn(
                        "h-3.5 w-3.5 opacity-50 transition-transform duration-200",
                        openDropdown === item.label && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      "text-text-secondary hover:text-text-primary hover:bg-surface-secondary",
                    )}
                  >
                    {item.label}
                  </Link>
                )}

                {/* Dropdown with animation */}
                {"children" in item && openDropdown === item.label && (
                  <div
                    className="absolute top-full left-0 pt-1.5 z-50"
                    role="menu"
                  >
                    <div className="bg-(--color-surface) border border-border rounded-xl shadow-(--shadow-dropdown) py-1.5 min-w-55 animate-dropdown">
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          role="menuitem"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors rounded-md mx-1"
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
              className="hidden sm:flex p-2 rounded-md hover:bg-surface-secondary text-text-secondary transition-colors"
              aria-label="Watchlist"
              title="Watchlist"
            >
              <Star className="h-4.5 w-4.5" aria-hidden="true" />
            </Link>

            <Link
              href="/portfolio"
              className="hidden md:flex p-2 rounded-md hover:bg-surface-secondary text-text-secondary transition-colors"
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
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-accent text-white text-sm font-medium hover:bg-accent-hover transition-colors"
              aria-label="Dashboard"
              title="Dashboard"
            >
              <User className="h-4 w-4" aria-hidden="true" />
              <span className="hidden md:inline">Dashboard</span>
            </Link>

            <div className="hidden sm:block w-px h-5 bg-border mx-1" />

            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-surface-secondary text-text-secondary transition-colors cursor-pointer"
              aria-label="Search (Cmd+K)"
              title="Search"
            >
              <Search className="h-4.5 w-4.5" aria-hidden="true" />
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-surface-secondary px-1.5 py-0.5 text-[10px] font-mono text-text-tertiary">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-md hover:bg-surface-secondary text-text-secondary transition-colors cursor-pointer"
              aria-label={
                resolvedTheme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
              title={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
            >
              {resolvedTheme === "dark" ? (
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
                document.body.classList.toggle("menu-open", next);
              }}
              className="lg:hidden p-2 rounded-md hover:bg-surface-secondary text-text-secondary transition-colors cursor-pointer min-h-11 min-w-11 flex items-center justify-center"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav"
            >
              <div className="relative h-5 w-5">
                <Menu
                  className={cn(
                    "absolute inset-0 h-5 w-5 transition-all duration-200",
                    mobileOpen
                      ? "opacity-0 rotate-90 scale-50"
                      : "opacity-100 rotate-0 scale-100",
                  )}
                  aria-hidden="true"
                />
                <X
                  className={cn(
                    "absolute inset-0 h-5 w-5 transition-all duration-200",
                    mobileOpen
                      ? "opacity-100 rotate-0 scale-100"
                      : "opacity-0 -rotate-90 scale-50",
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
            "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
            mobileOpen
              ? "max-h-[80vh] opacity-100 border-t border-border"
              : "max-h-0 opacity-0",
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
                  document.body.classList.remove("menu-open");
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-border bg-surface-secondary text-sm text-text-tertiary transition-colors cursor-pointer"
                aria-label="Search news, topics, coins"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                Search news, topics, coins…
              </button>
            </div>

            <nav
              className="container-main py-3 space-y-0.5"
              aria-label="Mobile navigation"
            >
              {NAV_ITEMS.map((item) => (
                <div key={item.label}>
                  {"children" in item ? (
                    /* Accordion-style: button toggles children visibility */
                    <button
                      onClick={() => toggleMobileAccordion(item.label)}
                      className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors cursor-pointer min-h-11"
                      aria-expanded={mobileAccordion === item.label}
                    >
                      {item.label}
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 opacity-60 transition-transform duration-200",
                          mobileAccordion === item.label && "rotate-180",
                        )}
                        aria-hidden="true"
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors min-h-11"
                    >
                      {item.label}
                    </Link>
                  )}

                  {"children" in item && (
                    <div
                      className={cn(
                        "ml-4 space-y-0.5 border-l-2 border-border pl-3 overflow-hidden transition-all duration-200",
                        mobileAccordion === item.label
                          ? "max-h-96 mt-0.5 opacity-100"
                          : "max-h-0 opacity-0",
                      )}
                    >
                      {item.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => setMobileOpen(false)}
                          className="block px-3 py-2.5 text-sm text-text-tertiary hover:text-text-primary transition-colors min-h-11 flex items-center"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Mobile-only quick links */}
              <div className="pt-3 mt-3 border-t border-border flex gap-2">
                <Link
                  href="/watchlist"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border border-border text-sm text-text-secondary hover:bg-surface-secondary transition-colors min-h-11"
                >
                  <Star className="h-4 w-4" aria-hidden="true" />
                  Watchlist
                </Link>
                <Link
                  href="/portfolio"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border border-border text-sm text-text-secondary hover:bg-surface-secondary transition-colors min-h-11"
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
