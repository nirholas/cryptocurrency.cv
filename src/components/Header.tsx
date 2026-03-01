"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
          >
            <Activity className={cn("h-3.5 w-3.5", fearGreedColor(fearGreed.value))} />
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
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(coin.change24h).toFixed(2)}%
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
    ],
  },
  { label: "Pricing", href: "/pricing" },
] as const;

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () =>
    setTheme(resolvedTheme === "dark" ? "light" : "dark");

  // Scroll-aware header
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  return (
    <>
      {/* Live Price Ticker */}
      <PriceTickerStrip />

      <header
        className={cn(
          "sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-sm transition-all duration-200",
          scrolled && "shadow-sm",
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
            <span className="text-[#f7931a] group-hover:text-[#e8850f] transition-colors">F</span>
            <span>CN</span>
          </span>
          <span className="hidden sm:block text-xs font-medium text-[var(--color-text-tertiary)] border-l border-[var(--color-border)] pl-2 ml-1">
            Free Crypto News
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-0.5">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className="relative"
              onMouseEnter={() =>
                "children" in item ? setOpenDropdown(item.label) : undefined
              }
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]"
                )}
              >
                {item.label}
                {"children" in item && (
                  <ChevronDown className={cn(
                    "h-3.5 w-3.5 opacity-50 transition-transform duration-200",
                    openDropdown === item.label && "rotate-180",
                  )} />
                )}
              </Link>

              {/* Dropdown with animation */}
              {"children" in item && openDropdown === item.label && (
                <div className="absolute top-full left-0 pt-1 z-50">
                  <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg py-1 min-w-[200px] animate-dropdown">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
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
            <Star className="h-4.5 w-4.5" />
          </Link>

          <Link
            href="/portfolio"
            className="hidden md:flex p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors"
            aria-label="Portfolio"
            title="Portfolio"
          >
            <Briefcase className="h-4.5 w-4.5" />
          </Link>

          <div className="hidden sm:block w-px h-5 bg-[var(--color-border)] mx-1" />

          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            aria-label="Search (Cmd+K)"
            title="Search"
          >
            <Search className="h-4.5 w-4.5" />
            <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-surface-secondary)] px-1.5 py-0.5 text-[10px] font-mono text-[var(--color-text-tertiary)]">
              ⌘K
            </kbd>
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            aria-label="Toggle theme"
            title={resolvedTheme === "dark" ? "Light mode" : "Dark mode"}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="h-4.5 w-4.5" />
            ) : (
              <Moon className="h-4.5 w-4.5" />
            )}
          </button>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
            aria-label="Toggle menu"
          >
            <div className="relative h-5 w-5">
              <Menu className={cn(
                "absolute inset-0 h-5 w-5 transition-all duration-200",
                mobileOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100",
              )} />
              <X className={cn(
                "absolute inset-0 h-5 w-5 transition-all duration-200",
                mobileOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50",
              )} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Nav — animated slide */}
      <div
        className={cn(
          "lg:hidden overflow-hidden transition-all duration-300 ease-in-out",
          mobileOpen ? "max-h-[80vh] opacity-100 border-t border-[var(--color-border)]" : "max-h-0 opacity-0",
        )}
      >
        <div className="bg-[var(--color-surface)]">
          {/* Mobile search bar */}
          <div className="container-main pt-3 pb-2">
            <button
              onClick={() => { setSearchOpen(true); setMobileOpen(false); }}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-sm text-[var(--color-text-tertiary)] transition-colors cursor-pointer"
            >
              <Search className="h-4 w-4" />
              Search news, topics, coins…
            </button>
          </div>

          <nav className="container-main py-3 space-y-0.5">
            {NAV_ITEMS.map((item) => (
              <div key={item.label}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-md text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                >
                  {item.label}
                  {"children" in item && (
                    <ChevronDown className="h-3.5 w-3.5 opacity-40" />
                  )}
                </Link>
                {"children" in item && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l-2 border-[var(--color-border)] pl-3">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        className="block px-3 py-2 text-sm text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
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
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
              >
                <Star className="h-4 w-4" />
                Watchlist
              </Link>
              <Link
                href="/portfolio"
                onClick={() => setMobileOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md border border-[var(--color-border)] text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-colors"
              >
                <Briefcase className="h-4 w-4" />
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
