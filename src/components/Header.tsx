"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
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
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import NotificationCenter from "@/components/NotificationCenter";

/* ------------------------------------------------------------------ */
/*  Price Ticker Types & Data                                         */
/* ------------------------------------------------------------------ */

interface TickerCoin {
  id: string;
  name: string;
  symbol: string;
  price: number;
  prevPrice: number;
  change24h: number;
}

interface FearGreedData {
  value: number;
  classification: string;
}

const TICKER_COINS = [
  "bitcoin",
  "ethereum",
  "solana",
  "binancecoin",
  "ripple",
  "cardano",
  "dogecoin",
  "polkadot",
  "avalanche-2",
  "chainlink",
] as const;

const COIN_SYMBOLS: Record<string, string> = {
  bitcoin: "BTC",
  ethereum: "ETH",
  solana: "SOL",
  binancecoin: "BNB",
  ripple: "XRP",
  cardano: "ADA",
  dogecoin: "DOGE",
  polkadot: "DOT",
  "avalanche-2": "AVAX",
  chainlink: "LINK",
};

function formatPrice(price: number): string {
  if (price >= 1000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`;
}

function fearGreedColor(value: number): string {
  if (value <= 25) return "text-red-500";
  if (value <= 45) return "text-orange-500";
  if (value <= 55) return "text-yellow-500";
  if (value <= 75) return "text-lime-500";
  return "text-emerald-500";
}

function fearGreedBg(value: number): string {
  if (value <= 25) return "bg-red-500/10";
  if (value <= 45) return "bg-orange-500/10";
  if (value <= 55) return "bg-yellow-500/10";
  if (value <= 75) return "bg-lime-500/10";
  return "bg-emerald-500/10";
}

/* ------------------------------------------------------------------ */
/*  Ticker Skeleton (loading state)                                   */
/* ------------------------------------------------------------------ */

function TickerSkeleton() {
  return (
    <div
      className="h-[40px] overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)]"
    >
      <div className="flex h-full items-center gap-8 px-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="inline-flex items-center gap-1.5">
            <span className="h-3 w-8 rounded bg-[var(--color-border)] animate-pulse" />
            <span className="h-3 w-14 rounded bg-[var(--color-border)] animate-pulse" />
            <span className="h-3 w-10 rounded bg-[var(--color-border)] animate-pulse" />
          </span>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Price Ticker Strip (enhanced)                                     */
/* ------------------------------------------------------------------ */

function PriceTickerStrip() {
  const [coins, setCoins] = useState<TickerCoin[]>([]);
  const [fearGreed, setFearGreed] = useState<FearGreedData | null>(null);
  const [loading, setLoading] = useState(true);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const prevPricesRef = useRef<Map<string, number>>(new Map());

  const fetchPrices = useCallback(async () => {
    try {
      const res = await fetch(`/api/prices?coins=${TICKER_COINS.join(",")}`);
      if (!res.ok) return;
      const data = await res.json();

      const prevPrices = prevPricesRef.current;
      const newFlashIds = new Set<string>();

      const parsed: TickerCoin[] = TICKER_COINS.map((id) => {
        const coin = data[id];
        const price = coin?.usd ?? 0;
        const prev = prevPrices.get(id) ?? price;

        if (prev !== price && prevPrices.size > 0) {
          newFlashIds.add(id);
        }
        prevPrices.set(id, price);

        return {
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          symbol: COIN_SYMBOLS[id] || id.toUpperCase(),
          price,
          prevPrice: prev,
          change24h: coin?.usd_24h_change ?? 0,
        };
      }).filter((c) => c.price > 0);

      setCoins(parsed);
      setLoading(false);

      if (newFlashIds.size > 0) {
        setFlashIds(newFlashIds);
        setTimeout(() => setFlashIds(new Set()), 1500);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  // Fetch Fear & Greed index
  const fetchFearGreed = useCallback(async () => {
    try {
      const res = await fetch("/api/fear-greed");
      if (!res.ok) return;
      const data = await res.json();
      if (data.current) {
        setFearGreed({
          value: data.current.value,
          classification: data.current.valueClassification,
        });
      }
    } catch {
      // non-critical
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    fetchFearGreed();
    const priceInterval = setInterval(fetchPrices, 30_000);
    const fgInterval = setInterval(fetchFearGreed, 300_000);
    return () => {
      clearInterval(priceInterval);
      clearInterval(fgInterval);
    };
  }, [fetchPrices, fetchFearGreed]);

  if (loading) return <TickerSkeleton />;
  if (coins.length === 0) return null;

  // Duplicate items for seamless looping
  const tickerItems = [...coins, ...coins];

  return (
    <div
      className="h-[40px] overflow-hidden border-b border-[var(--color-border)] bg-[var(--color-surface)]"
      role="region"
      aria-label="Live cryptocurrency prices"
      aria-live="polite"
    >
      <div className="flex h-full items-center">
        {/* Fear & Greed badge (left pinned) */}
        {fearGreed && (
          <Link
            href="/fear-greed"
            className={cn(
              "hidden md:flex items-center gap-1.5 px-3 h-full border-r border-[var(--color-border)] text-xs font-medium shrink-0 transition-colors hover:bg-[var(--color-surface-secondary)]",
              fearGreedBg(fearGreed.value),
            )}
            aria-label={`Fear and Greed Index: ${fearGreed.value} — ${fearGreed.classification}`}
          >
            <Activity className={cn("h-3.5 w-3.5", fearGreedColor(fearGreed.value))} aria-hidden="true" />
            <span className={cn("font-bold tabular-nums", fearGreedColor(fearGreed.value))}>
              {fearGreed.value}
            </span>
            <span className="text-[var(--color-text-tertiary)] hidden lg:inline">
              {fearGreed.classification}
            </span>
          </Link>
        )}

        {/* Scrolling ticker */}
        <div className="group relative flex-1 flex h-full items-center overflow-hidden">
          <div className="ticker-track flex items-center gap-8 whitespace-nowrap group-hover:[animation-play-state:paused]">
            {tickerItems.map((coin, i) => {
              const isPositive = coin.change24h >= 0;
              const isFlashing = flashIds.has(coin.id);
              const flashUp = isFlashing && coin.price > coin.prevPrice;
              const flashDown = isFlashing && coin.price < coin.prevPrice;

              return (
                <Link
                  key={`${coin.id}-${i}`}
                  href={`/coin/${coin.id}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded transition-all hover:bg-[var(--color-surface-secondary)]",
                    flashUp && "ticker-flash-up",
                    flashDown && "ticker-flash-down",
                  )}
                >
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {coin.symbol}
                  </span>
                  <span className="text-[var(--color-text-secondary)] tabular-nums">
                    {formatPrice(coin.price)}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-[11px] font-mono tabular-nums",
                      isPositive ? "text-emerald-500" : "text-red-500"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3" aria-hidden="true" />
                    ) : (
                      <TrendingDown className="h-3 w-3" aria-hidden="true" />
                    )}
                    <span aria-hidden="true">{isPositive ? "▲" : "▼"}</span>
                    {Math.abs(coin.change24h).toFixed(2)}%
                    <span className="sr-only">
                      {coin.symbol} {formatPrice(coin.price)} {isPositive ? "up" : "down"} {Math.abs(coin.change24h).toFixed(2)} percent
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Marquee + flash animations */}
      <style jsx>{`
        .ticker-track {
          animation: ticker-scroll 45s linear infinite;
        }
        .ticker-track:hover {
          animation-play-state: paused;
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .ticker-flash-up {
          animation: flash-green 1.5s ease-out;
        }
        .ticker-flash-down {
          animation: flash-red 1.5s ease-out;
        }
        @keyframes flash-green {
          0%, 100% { background: transparent; }
          15% { background: rgba(16, 185, 129, 0.2); }
        }
        @keyframes flash-red {
          0%, 100% { background: transparent; }
          15% { background: rgba(239, 68, 68, 0.2); }
        }
      `}</style>
    </div>
  );
}


const NAV_ITEMS = [
  { label: "Home", href: "/" },
  {
    label: "Markets",
    href: "/markets",
    children: [
      { label: "Overview", href: "/markets" },
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
    const cycle = { light: "dark" as const, dark: "midnight" as const, midnight: "light" as const };
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
    const handler = () => { if (window.innerWidth >= 1024) setMobileOpen(false); };
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
          "sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-sm transition-all duration-300",
          scrolled && "shadow-sm",
          !headerVisible && "-translate-y-full",
        )}
      >
      <div className={cn(
        "container-main flex items-center justify-between gap-4 transition-all duration-200",
        scrolled ? "h-14" : "h-16",
      )}>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group">
          <span className={cn(
            "font-bold tracking-tight transition-all duration-200",
            scrolled ? "text-lg" : "text-xl",
          )}>
            <span className="text-[#f7931a] group-hover:text-[#e8850f] transition-colors">C</span>
            <span>V</span>
          </span>
          <span className="hidden sm:block text-xs font-medium text-[var(--color-text-tertiary)] border-l border-[var(--color-border)] pl-2 ml-1">
            Crypto Vision News
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5" aria-label="Main navigation">
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
                  onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                  aria-expanded={openDropdown === item.label}
                  aria-haspopup="true"
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer",
                    "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]"
                  )}
                >
                  {item.label}
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 opacity-50 transition-transform duration-200",
                    openDropdown === item.label && "rotate-180",
                  )} aria-hidden="true" />
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                    "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]"
                  )}
                >
                  {item.label}
                </Link>
              )}

              {/* Dropdown with animation */}
              {"children" in item && openDropdown === item.label && (
                <div className="absolute top-full left-0 pt-1 z-50" role="menu">
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 min-w-[200px] animate-dropdown">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        role="menuitem"
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
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
            className="hidden sm:flex p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors"
            aria-label="Watchlist"
            title="Watchlist"
          >
            <Star className="h-4.5 w-4.5" aria-hidden="true" />
          </Link>

          <Link
            href="/portfolio"
            className="hidden md:flex p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors"
            aria-label="Portfolio"
            title="Portfolio"
          >
            <Briefcase className="h-4.5 w-4.5" aria-hidden="true" />
          </Link>

          {/* Notification Center */}
          <div className="hidden sm:flex">
            <NotificationCenter />
          </div>

          <div className="hidden sm:block w-px h-5 bg-[var(--color-border)] mx-1" />

          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            aria-label="Search (Cmd+K)"
            title="Search"
          >
            <Search className="h-4.5 w-4.5" aria-hidden="true" />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-tertiary)]">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            aria-label={resolvedTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
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
            className="lg:hidden p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
          >
            <div className="relative h-5 w-5">
              <Menu className={cn(
                "absolute inset-0 h-5 w-5 transition-all duration-200",
                mobileOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100",
              )} aria-hidden="true" />
              <X className={cn(
                "absolute inset-0 h-5 w-5 transition-all duration-200",
                mobileOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50",
              )} aria-hidden="true" />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Nav — animated slide */}
      <div
        id="mobile-nav"
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileOpen ? "max-h-[80vh] opacity-100 border-t border-[var(--color-border)]" : "max-h-0 opacity-0",
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="bg-[var(--color-surface)]">
          {/* Mobile search bar */}
          <div className="container-main pt-3 pb-2">
            <button
              onClick={() => { setSearchOpen(true); setMobileOpen(false); document.body.classList.remove("menu-open"); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-sm text-[var(--color-text-tertiary)] transition-colors cursor-pointer"
              aria-label="Search news, topics, coins"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Search news, topics, coins…
            </button>
          </div>

          <nav className="container-main py-3 space-y-0.5" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => (
              <div key={item.label}>
                {"children" in item ? (
                  /* Accordion-style: button toggles children visibility */
                  <button
                    onClick={() => toggleMobileAccordion(item.label)}
                    className="flex items-center justify-between w-full px-3 py-2.5 text-sm font-medium rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer min-h-[44px]"
                    aria-expanded={mobileAccordion === item.label}
                  >
                    {item.label}
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 opacity-60 transition-transform duration-200",
                      mobileAccordion === item.label && "rotate-180",
                    )} aria-hidden="true" />
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors min-h-[44px]"
                  >
                    {item.label}
                  </Link>
                )}
                {"children" in item && (
                  <div className={cn(
                    "ml-4 space-y-0.5 border-l-2 border-[var(--color-border)] pl-3 overflow-hidden transition-all duration-200",
                    mobileAccordion === item.label ? "max-h-96 mt-0.5 opacity-100" : "max-h-0 opacity-0",
                  )}>
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2.5 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] flex items-center"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Mobile-only quick links */}
            <div className="pt-3 mt-3 border-t border-[var(--color-border)] flex gap-2">
              <Link
                href="/watchlist"
                onClick={() => setMobileOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors min-h-[44px]"
              >
                <Star className="h-4 w-4" aria-hidden="true" />
                Watchlist
              </Link>
              <Link
                href="/portfolio"
                onClick={() => setMobileOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors min-h-[44px]"
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
          from { opacity: 0; transform: translateY(-4px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
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
