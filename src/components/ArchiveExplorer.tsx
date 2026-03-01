"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { NewsCardCompact } from "@/components/NewsCard";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { NewsArticle } from "@/lib/crypto-news";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  BarChart3,
  TrendingUp,
  Clock,
  Newspaper,
  Database,
  DollarSign,
  Activity,
  AlertCircle,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ArchiveStats {
  totalArticles: number;
  dateRange: { earliest: string; latest: string };
  byYear?: Record<string, number>;
  bySource?: Record<string, number>;
  byCategory?: Record<string, number>;
}

interface MarketSnapshot {
  timestamp: string;
  btc_price: number;
  eth_price: number;
  sol_price: number;
  total_market_cap: number;
  btc_dominance: number;
  fear_greed_index: number;
}

interface ArchiveResult {
  articles: NewsArticle[];
  total: number;
  count: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const YEARS = [2021, 2022, 2023, 2024, 2025, 2026] as const;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

const NOTABLE_DATES: Record<string, string> = {
  "2021-05-19": "Bitcoin crashed 30% in a single day — the Great Crypto Crash of 2021",
  "2021-09-07": "El Salvador became the first country to adopt Bitcoin as legal tender",
  "2021-11-10": "Bitcoin hit all-time high of ~$69,000",
  "2022-05-09": "Terra/LUNA collapse began — $60B wiped out in days",
  "2022-11-11": "FTX filed for bankruptcy — Sam Bankman-Fried's empire crumbled",
  "2023-01-13": "Bitcoin rallied past $21,000; the 2023 recovery began",
  "2023-06-15": "BlackRock filed for a spot Bitcoin ETF — institutional era began",
  "2024-01-10": "SEC approved the first US spot Bitcoin ETFs",
  "2024-03-14": "Bitcoin hit new all-time high above $73,000",
  "2024-04-20": "Bitcoin's fourth halving reduced block reward to 3.125 BTC",
  "2024-07-23": "SEC approved spot Ethereum ETFs",
  "2025-01-20": "Bitcoin surpassed $109,000 — new all-time high",
  "2025-03-07": "US Strategic Bitcoin Reserve executive order signed",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  return `$${(value / 1e6).toFixed(2)}M`;
}

function formatPrice(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value > 1000 ? 0 : 2,
  }).format(value);
}

// ─── Year Selector ───────────────────────────────────────────────────────────

function YearSelector({
  selectedYear,
  onSelect,
}: {
  selectedYear: number | null;
  onSelect: (year: number) => void;
}) {
  const t = useTranslations("archive");
  return (
    <div className="space-y-2">
      <h3 className="font-serif text-sm font-medium text-[var(--color-text-secondary)]">
        {t("selectYear")}
      </h3>
      <div className="flex flex-wrap gap-2">
        {YEARS.map((year) => (
          <Button
            key={year}
            variant={selectedYear === year ? "primary" : "outline"}
            size="sm"
            onClick={() => onSelect(year)}
          >
            {year}
          </Button>
        ))}
      </div>
    </div>
  );
}

// ─── Month Grid ──────────────────────────────────────────────────────────────

function MonthGrid({
  year,
  selectedMonth,
  onSelect,
}: {
  year: number;
  selectedMonth: number | null;
  onSelect: (month: number) => void;
}) {
  const t = useTranslations("archive");
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  return (
    <div className="space-y-2">
      <h3 className="font-serif text-sm font-medium text-[var(--color-text-secondary)]">
        {t("selectMonth")} — {year}
      </h3>
      <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {MONTHS.map((label, i) => {
          const month = i + 1;
          const isFuture = year > currentYear || (year === currentYear && month > currentMonth);
          return (
            <Button
              key={month}
              variant={selectedMonth === month ? "primary" : "outline"}
              size="sm"
              onClick={() => onSelect(month)}
              disabled={isFuture}
              className="w-full"
            >
              {label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Day Calendar ────────────────────────────────────────────────────────────

function DayCalendar({
  year,
  month,
  selectedDay,
  onSelect,
}: {
  year: number;
  month: number;
  selectedDay: number | null;
  onSelect: (day: number) => void;
}) {
  const t = useTranslations("archive");
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const now = new Date();
  const today = now.getDate();
  const todayMonth = now.getMonth() + 1;
  const todayYear = now.getFullYear();

  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className="space-y-2">
      <h3 className="font-serif text-sm font-medium text-[var(--color-text-secondary)]">
        {t("selectDay")} — {MONTHS[month - 1]} {year}
      </h3>
      <div className="grid grid-cols-7 gap-1">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-[var(--color-text-tertiary)] py-1">
            {d}
          </div>
        ))}
        {Array.from({ length: firstDay }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const isFuture =
            year > todayYear ||
            (year === todayYear && month > todayMonth) ||
            (year === todayYear && month === todayMonth && day > today);
          const isToday = year === todayYear && month === todayMonth && day === today;
          const dateStr = formatDate(year, month, day);
          const hasNotable = dateStr in NOTABLE_DATES;

          return (
            <button
              key={day}
              onClick={() => onSelect(day)}
              disabled={isFuture}
              className={cn(
                "rounded-md p-1.5 text-sm transition-colors relative",
                selectedDay === day
                  ? "bg-[var(--color-brand)] text-white font-bold"
                  : "hover:bg-[var(--color-surface-hover)]",
                isToday && selectedDay !== day && "ring-1 ring-[var(--color-brand)]",
                isFuture && "opacity-30 cursor-not-allowed",
                hasNotable && "font-semibold"
              )}
              title={hasNotable ? NOTABLE_DATES[dateStr] : undefined}
            >
              {day}
              {hasNotable && (
                <span className="absolute top-0.5 right-0.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Market Context Panel ────────────────────────────────────────────────────

function MarketContext({
  year,
  month,
  day,
  market,
  loading,
}: {
  year: number;
  month: number;
  day: number | null;
  market: MarketSnapshot | null;
  loading: boolean;
}) {
  const t = useTranslations("archive");
  const dateStr = day ? formatDate(year, month, day) : null;
  const notable = dateStr ? NOTABLE_DATES[dateStr] : null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t("marketContext")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-5 w-2/3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {t("marketContext")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {market ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
                <p className="text-xs text-[var(--color-text-secondary)]">BTC</p>
                <p className="text-lg font-bold text-amber-500">{formatPrice(market.btc_price)}</p>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
                <p className="text-xs text-[var(--color-text-secondary)]">ETH</p>
                <p className="text-lg font-bold text-blue-400">{formatPrice(market.eth_price)}</p>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
                <p className="text-xs text-[var(--color-text-secondary)]">SOL</p>
                <p className="text-lg font-bold text-purple-400">{formatPrice(market.sol_price)}</p>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-elevated)] p-3">
                <p className="text-xs text-[var(--color-text-secondary)]">{t("marketCap")}</p>
                <p className="text-lg font-bold">{formatMarketCap(market.total_market_cap)}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-[var(--color-text-secondary)]">{t("btcDominance")}:</span>
              <span className="font-semibold">{market.btc_dominance.toFixed(1)}%</span>
              <span className="text-[var(--color-text-secondary)]">{t("fearGreed")}:</span>
              <Badge variant={market.fear_greed_index < 30 ? "destructive" : market.fear_greed_index > 70 ? "default" : "default"}>
                {market.fear_greed_index}
              </Badge>
            </div>
          </>
        ) : (
          <p className="text-sm text-[var(--color-text-tertiary)] italic">
            {t("noMarketData")}
          </p>
        )}

        {notable && (
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-xs font-semibold text-amber-500 mb-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("onThisDay")}
            </p>
            <p className="text-sm">{notable}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Statistics Dashboard ────────────────────────────────────────────────────

function StatsDashboard({
  stats,
  loading,
}: {
  stats: ArchiveStats | null;
  loading: boolean;
}) {
  const t = useTranslations("archive");

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t("statistics")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  const yearData = stats.byYear || {};
  const maxArticles = Math.max(...Object.values(yearData), 1);
  const topSources = stats.bySource
    ? Object.entries(stats.bySource)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
    : [];
  const topCategories = stats.byCategory
    ? Object.entries(stats.byCategory)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 6)
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {t("statistics")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Total articles */}
        <div className="flex items-center gap-3">
          <Database className="h-5 w-5 text-[var(--color-brand)]" />
          <div>
            <p className="text-2xl font-bold">{stats.totalArticles.toLocaleString()}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{t("totalArticles")}</p>
          </div>
          {stats.dateRange && (
            <div className="ml-auto text-right text-xs text-[var(--color-text-tertiary)]">
              <p>{stats.dateRange.earliest}</p>
              <p>{t("to")} {stats.dateRange.latest}</p>
            </div>
          )}
        </div>

        {/* Year bar chart */}
        {Object.keys(yearData).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">{t("articlesPerYear")}</h4>
            <div className="space-y-1.5">
              {Object.entries(yearData)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([year, count]) => (
                  <div key={year} className="flex items-center gap-2 text-sm">
                    <span className="w-10 shrink-0 font-mono text-xs">{year}</span>
                    <div className="flex-1 h-5 rounded bg-[var(--color-surface-elevated)] overflow-hidden">
                      <div
                        className="h-full rounded bg-[var(--color-brand)] transition-all duration-500"
                        style={{ width: `${(count / maxArticles) * 100}%` }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right text-xs font-mono text-[var(--color-text-secondary)]">
                      {count.toLocaleString()}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Top sources */}
        {topSources.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">{t("topSources")}</h4>
            <div className="flex flex-wrap gap-1.5">
              {topSources.map(([source, count]) => (
                <Badge key={source} variant="default">
                  {source} ({count.toLocaleString()})
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Top categories */}
        {topCategories.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-[var(--color-text-secondary)]">{t("topCategories")}</h4>
            <div className="flex flex-wrap gap-1.5">
              {topCategories.map(([cat, count]) => (
                <Badge key={cat} variant="default">
                  {cat} ({count.toLocaleString()})
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Archive Search ──────────────────────────────────────────────────────────

function ArchiveSearch({
  onSearch,
  loading,
}: {
  onSearch: (query: string, startDate: string, endDate: string) => void;
  loading: boolean;
}) {
  const t = useTranslations("archive");
  const [query, setQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    onSearch(query.trim(), startDate, endDate);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-serif text-lg flex items-center gap-2">
          <Search className="h-5 w-5" />
          {t("searchArchive")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">
                {t("startDate")}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">
                {t("endDate")}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
              />
            </div>
          </div>
          <Button type="submit" variant="primary" size="sm" disabled={loading || !query.trim()}>
            {loading ? t("searching") : t("searchButton")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main ArchiveExplorer ────────────────────────────────────────────────────

export default function ArchiveExplorer() {
  const t = useTranslations("archive");
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL-synced state
  const urlYear = searchParams.get("year");
  const urlMonth = searchParams.get("month");
  const urlDay = searchParams.get("day");

  const [selectedYear, setSelectedYear] = useState<number | null>(
    urlYear ? parseInt(urlYear) : null
  );
  const [selectedMonth, setSelectedMonth] = useState<number | null>(
    urlMonth ? parseInt(urlMonth) : null
  );
  const [selectedDay, setSelectedDay] = useState<number | null>(
    urlDay ? parseInt(urlDay) : null
  );

  // Data states
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<ArchiveStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [market, setMarket] = useState<MarketSnapshot | null>(null);
  const [marketLoading, setMarketLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<NewsArticle[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // ── URL sync ───────────────────────────────────────────────────────────────

  const updateUrl = useCallback(
    (year: number | null, month: number | null, day: number | null) => {
      const params = new URLSearchParams();
      if (year) params.set("year", String(year));
      if (month) params.set("month", String(month));
      if (day) params.set("day", String(day));
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname]
  );

  // ── Selection handlers ─────────────────────────────────────────────────────

  const handleYearSelect = useCallback(
    (year: number) => {
      setSelectedYear(year);
      setSelectedMonth(null);
      setSelectedDay(null);
      setArticles([]);
      setSearchResults(null);
      updateUrl(year, null, null);
    },
    [updateUrl]
  );

  const handleMonthSelect = useCallback(
    (month: number) => {
      setSelectedMonth(month);
      setSelectedDay(null);
      setArticles([]);
      setSearchResults(null);
      updateUrl(selectedYear, month, null);
    },
    [selectedYear, updateUrl]
  );

  const handleDaySelect = useCallback(
    (day: number) => {
      setSelectedDay(day);
      setSearchResults(null);
      updateUrl(selectedYear, selectedMonth, day);
    },
    [selectedYear, selectedMonth, updateUrl]
  );

  // ── Day navigation ─────────────────────────────────────────────────────────

  const navigateDay = useCallback(
    (direction: -1 | 1) => {
      if (!selectedYear || !selectedMonth || !selectedDay) return;
      const current = new Date(selectedYear, selectedMonth - 1, selectedDay);
      current.setDate(current.getDate() + direction);

      const now = new Date();
      if (current > now) return;

      const newYear = current.getFullYear();
      const newMonth = current.getMonth() + 1;
      const newDay = current.getDate();

      setSelectedYear(newYear);
      setSelectedMonth(newMonth);
      setSelectedDay(newDay);
      setSearchResults(null);
      updateUrl(newYear, newMonth, newDay);
    },
    [selectedYear, selectedMonth, selectedDay, updateUrl]
  );

  // ── Fetch articles ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedYear) return;

    const fetchArticles = async () => {
      setLoading(true);
      try {
        let startDate: string;
        let endDate: string;

        if (selectedDay && selectedMonth) {
          // Specific day
          startDate = formatDate(selectedYear, selectedMonth, selectedDay);
          endDate = startDate;
        } else if (selectedMonth) {
          // Full month
          startDate = formatDate(selectedYear, selectedMonth, 1);
          const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
          endDate = formatDate(selectedYear, selectedMonth, daysInMonth);
        } else {
          // Full year
          startDate = `${selectedYear}-01-01`;
          endDate = `${selectedYear}-12-31`;
        }

        const params = new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
          format: "simple",
          limit: "100",
        });

        const res = await fetch(`/api/archive?${params}`);
        const data = await res.json();

        if (data.success) {
          setArticles(data.articles || []);
          setTotal(data.total || data.count || 0);
        } else {
          setArticles([]);
          setTotal(0);
        }
      } catch {
        setArticles([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    fetchArticles();
  }, [selectedYear, selectedMonth, selectedDay]);

  // ── Fetch stats ────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchStats = async () => {
      setStatsLoading(true);
      try {
        const res = await fetch("/api/archive?stats=true");
        const data = await res.json();
        if (data.success && data.stats) {
          setStats(data.stats);
        }
      } catch {
        /* ignore */
      } finally {
        setStatsLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ── Fetch market data ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedYear || !selectedMonth) {
      setMarket(null);
      return;
    }

    const fetchMarket = async () => {
      setMarketLoading(true);
      try {
        const monthStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;
        const res = await fetch(`/api/archive?market=${monthStr}`);
        const data = await res.json();

        if (data.success && data.history?.length > 0) {
          if (selectedDay) {
            // Find closest market snapshot to selected day
            const targetDate = formatDate(selectedYear, selectedMonth, selectedDay);
            const match = data.history.find((h: MarketSnapshot) =>
              h.timestamp.startsWith(targetDate)
            );
            setMarket(match || data.history[data.history.length - 1]);
          } else {
            // Use latest snapshot for the month
            setMarket(data.history[data.history.length - 1]);
          }
        } else {
          setMarket(null);
        }
      } catch {
        setMarket(null);
      } finally {
        setMarketLoading(false);
      }
    };

    fetchMarket();
  }, [selectedYear, selectedMonth, selectedDay]);

  // ── Search handler ─────────────────────────────────────────────────────────

  const handleSearch = useCallback(
    async (query: string, startDate: string, endDate: string) => {
      setSearchLoading(true);
      try {
        const params = new URLSearchParams({
          q: query,
          format: "simple",
          limit: "100",
        });
        if (startDate) params.set("start_date", startDate);
        if (endDate) params.set("end_date", endDate);

        const res = await fetch(`/api/archive?${params}`);
        const data = await res.json();

        if (data.success) {
          setSearchResults(data.articles || []);
        } else {
          setSearchResults([]);
        }
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    []
  );

  // ── Current period label ───────────────────────────────────────────────────

  const periodLabel = useMemo(() => {
    if (!selectedYear) return t("selectPeriod");
    if (selectedDay && selectedMonth) {
      return `${MONTHS[selectedMonth - 1]} ${selectedDay}, ${selectedYear}`;
    }
    if (selectedMonth) {
      return `${MONTHS[selectedMonth - 1]} ${selectedYear}`;
    }
    return String(selectedYear);
  }, [selectedYear, selectedMonth, selectedDay, t]);

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">{t("subtitle")}</p>
      </div>

      {/* Date navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="font-serif text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("dateNavigation")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <YearSelector selectedYear={selectedYear} onSelect={handleYearSelect} />

          {selectedYear && (
            <MonthGrid
              year={selectedYear}
              selectedMonth={selectedMonth}
              onSelect={handleMonthSelect}
            />
          )}

          {selectedYear && selectedMonth && (
            <DayCalendar
              year={selectedYear}
              month={selectedMonth}
              selectedDay={selectedDay}
              onSelect={handleDaySelect}
            />
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — articles */}
        <div className="lg:col-span-2 space-y-4">
          {/* Day nav header */}
          {selectedYear && (
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-semibold">{periodLabel}</h2>
                {total > 0 && (
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {total.toLocaleString()} {t("articlesFound")}
                  </p>
                )}
              </div>
              {selectedDay && selectedMonth && (
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" onClick={() => navigateDay(-1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon" onClick={() => navigateDay(1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-20 w-28 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Articles grid */}
          {!loading && articles.length > 0 && !searchResults && (
            <div className="space-y-3">
              {articles.map((article, i) => (
                <NewsCardCompact key={`${article.link}-${i}`} article={article} />
              ))}
            </div>
          )}

          {/* No results */}
          {!loading && articles.length === 0 && selectedYear && !searchResults && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Newspaper className="h-12 w-12 text-[var(--color-text-tertiary)] mb-3" />
              <p className="text-[var(--color-text-secondary)]">{t("noArticles")}</p>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                {t("noArticlesHint")}
              </p>
            </div>
          )}

          {/* Search results */}
          {searchResults !== null && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-xl font-semibold">{t("searchResults")}</h2>
                <Button variant="ghost" size="sm" onClick={() => setSearchResults(null)}>
                  {t("clearSearch")}
                </Button>
              </div>
              {searchResults.length > 0 ? (
                searchResults.map((article, i) => (
                  <NewsCardCompact key={`search-${article.link}-${i}`} article={article} />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <AlertCircle className="h-10 w-10 text-[var(--color-text-tertiary)] mb-3" />
                  <p className="text-[var(--color-text-secondary)]">{t("noSearchResults")}</p>
                </div>
              )}
            </div>
          )}

          {/* Welcome state */}
          {!selectedYear && !searchResults && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Activity className="h-16 w-16 text-[var(--color-brand)] mb-4 opacity-50" />
              <h2 className="font-serif text-2xl font-semibold mb-2">{t("welcomeTitle")}</h2>
              <p className="text-[var(--color-text-secondary)] max-w-md">
                {t("welcomeDescription")}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar — market + search + stats */}
        <div className="space-y-6">
          {selectedYear && selectedMonth && (
            <MarketContext
              year={selectedYear}
              month={selectedMonth}
              day={selectedDay}
              market={market}
              loading={marketLoading}
            />
          )}

          <ArchiveSearch onSearch={handleSearch} loading={searchLoading} />

          <StatsDashboard stats={stats} loading={statsLoading} />
        </div>
      </div>
    </div>
  );
}
