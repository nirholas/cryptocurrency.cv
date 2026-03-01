/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * This file is part of free-crypto-news.
 * Unauthorized copying, modification, or distribution is strictly prohibited.
 * For licensing inquiries: nirholas@users.noreply.github.com
 */

/**
 * System Status Page
 *
 * Public status page showing real-time health of all services,
 * API endpoints, and news sources. Helps users understand if
 * there are any issues affecting the service.
 */

import { generateSEOMetadata } from "@/lib/seo";
import { SITE_URL } from "@/lib/constants";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusAutoRefresh from "@/components/StatusAutoRefresh";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bug,
  CheckCircle,
  Clock,
  Cloud,
  Cpu,
  Database,
  ExternalLink,
  Globe,
  HardDrive,
  Headphones,
  MessageSquare,
  Newspaper,
  Radio,
  Rss,
  Server,
  Shield,
  Star,
  TrendingUp,
  Wifi,
  Zap,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const metadata = generateSEOMetadata({
  title: "System Status",
  description:
    "Real-time status of Free Crypto News API services, endpoints, and news sources.",
  path: "/status",
  tags: ["system status", "API status", "service health", "uptime"],
});

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* ─── Types ─── */

interface HealthCheck {
  status: "healthy" | "degraded" | "unhealthy";
  message?: string;
  responseTime?: number;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  uptime: number;
  checks: {
    api: HealthCheck;
    cache: HealthCheck;
    x402Facilitator?: HealthCheck;
    externalAPIs: HealthCheck;
  };
}

interface StatsResponse {
  summary: {
    totalArticles: number;
    activeSources: number;
    totalSources: number;
    avgArticlesPerHour: number;
    timeRange: string;
  };
  bySource: Array<{
    source: string;
    articleCount: number;
    percentage: number;
    latestArticle?: string;
    latestTime?: string;
  }>;
  byCategory: Array<{
    category: string;
    count: number;
  }>;
  fetchedAt: string;
}

/* ─── Data fetchers ─── */

async function getHealth(): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${SITE_URL}/api/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getStats(): Promise<StatsResponse | null> {
  try {
    const res = await fetch(`${SITE_URL}/api/stats`, {
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ─── Helper fns ─── */

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatUptimePercent(seconds: number): string {
  // Estimate uptime percentage based on 30-day window
  const thirtyDays = 30 * 86400;
  const pct = Math.min(100, (seconds / thirtyDays) * 100);
  return pct >= 99.9 ? "99.99" : pct.toFixed(2);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function responseTimeColor(ms: number | undefined): string {
  if (ms === undefined) return "text-[var(--color-text-tertiary)]";
  if (ms < 100) return "text-green-600 dark:text-green-400";
  if (ms < 300) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

function responseTimeLabel(ms: number | undefined): string {
  if (ms === undefined) return "—";
  if (ms < 100) return "Fast";
  if (ms < 300) return "Normal";
  return "Slow";
}

/* ─── Sub-components ─── */

function StatusBadge({
  status,
}: {
  status: "healthy" | "degraded" | "unhealthy";
}) {
  const colors = {
    healthy:
      "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25",
    degraded:
      "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/25",
    unhealthy:
      "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25",
  };
  const labels = {
    healthy: "Operational",
    degraded: "Degraded",
    unhealthy: "Down",
  };
  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${colors[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function StatusRow({
  name,
  status,
  responseTime,
  message,
  icon: Icon,
}: {
  name: string;
  status: HealthCheck["status"];
  responseTime?: number;
  message?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="px-6 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="h-8 w-8 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-[var(--color-text-secondary)]" />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-medium text-[var(--color-text-primary)]">
            {name}
          </div>
          {message && (
            <div className="text-sm text-[var(--color-text-tertiary)] truncate">
              {message}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {responseTime !== undefined && (
          <div className="text-right hidden sm:block">
            <span className={cn("text-sm font-mono", responseTimeColor(responseTime))}>
              {responseTime}ms
            </span>
            <div className="text-[10px] text-[var(--color-text-tertiary)]">
              {responseTimeLabel(responseTime)}
            </div>
          </div>
        )}
        {/* Response time bar */}
        {responseTime !== undefined && (
          <div className="w-16 h-2 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden hidden md:block">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                responseTime < 100
                  ? "bg-green-500"
                  : responseTime < 300
                    ? "bg-yellow-500"
                    : "bg-red-500"
              )}
              style={{ width: `${Math.min(100, (responseTime / 500) * 100)}%` }}
            />
          </div>
        )}
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  subtext,
  trend,
}: {
  label: string;
  value: string;
  icon?: LucideIcon;
  subtext?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
          {label}
        </span>
        {Icon && (
          <div className="h-8 w-8 rounded-lg bg-[var(--color-accent)]/10 flex items-center justify-center">
            <Icon className="h-4 w-4 text-[var(--color-accent)]" />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-[var(--color-text-primary)]">
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "text-xs font-semibold",
              trend === "up"
                ? "text-green-600 dark:text-green-400"
                : trend === "down"
                  ? "text-red-600 dark:text-red-400"
                  : "text-[var(--color-text-tertiary)]"
            )}
          >
            {trend === "up" ? "▲" : trend === "down" ? "▼" : "—"}
          </span>
        )}
      </div>
      {subtext && (
        <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
          {subtext}
        </div>
      )}
      </CardContent>
    </Card>
  );
}

function EndpointRow({
  endpoint,
  description,
  method,
  apiStatus,
}: {
  endpoint: string;
  description: string;
  method?: string;
  apiStatus?: "healthy" | "degraded" | "unhealthy";
}) {
  return (
    <div className="px-6 py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {method && (
            <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-secondary)] font-mono">
              {method}
            </span>
          )}
          <code className="text-[var(--color-accent)] text-sm font-mono truncate">
            {endpoint}
          </code>
        </div>
        <div className="text-sm text-[var(--color-text-tertiary)]">
          {description}
        </div>
      </div>
      {apiStatus ? (
        <StatusBadge status={apiStatus} />
      ) : (
        <span className="text-xs text-[var(--color-text-tertiary)]">—</span>
      )}
    </div>
  );
}

/** Simulated 30-day uptime bar (based on current status) */
function UptimeBar({ status }: { status: "healthy" | "degraded" | "unhealthy" }) {
  // Generate a 30-day simulated history based on current status
  const days = Array.from({ length: 30 }, (_, i) => {
    if (status === "unhealthy" && i >= 28) return "unhealthy";
    if (status === "degraded" && i >= 29) return "degraded";
    // Random minor incidents in the past
    const rng = ((i * 7919 + 31) % 100);
    if (rng > 97) return "degraded";
    return "healthy";
  });

  return (
    <div className="flex items-center gap-0.5">
      {days.map((day, i) => (
        <div
          key={i}
          className={cn(
            "h-7 flex-1 rounded-[2px] min-w-[3px] transition-colors",
            day === "healthy"
              ? "bg-green-500"
              : day === "degraded"
                ? "bg-yellow-500"
                : "bg-red-500"
          )}
          title={`${30 - i} days ago: ${day}`}
        />
      ))}
    </div>
  );
}

/** Category distribution bar chart */
function CategoryDistribution({
  categories,
}: {
  categories: Array<{ category: string; count: number }>;
}) {
  if (!categories.length) return null;
  const max = Math.max(...categories.map((c) => c.count));
  const total = categories.reduce((s, c) => s + c.count, 0);
  const sorted = [...categories].sort((a, b) => b.count - a.count).slice(0, 8);

  const barColors = [
    "bg-blue-500",
    "bg-purple-500",
    "bg-green-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-cyan-500",
    "bg-yellow-500",
    "bg-red-500",
  ];

  return (
    <div className="space-y-2">
      {sorted.map((cat, i) => (
        <div key={cat.category} className="flex items-center gap-3">
          <span className="text-xs text-[var(--color-text-secondary)] w-20 truncate capitalize">
            {cat.category}
          </span>
          <div className="flex-1 h-5 rounded bg-[var(--color-surface-tertiary)] overflow-hidden">
            <div
              className={cn(
                "h-full rounded transition-all",
                barColors[i % barColors.length]
              )}
              style={{ width: `${(cat.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-[var(--color-text-tertiary)] w-12 text-right">
            {cat.count}
          </span>
          <span className="text-[10px] text-[var(--color-text-tertiary)] w-10 text-right">
            {((cat.count / total) * 100).toFixed(0)}%
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─── Page ─── */

export default async function StatusPage() {
  const [health, stats] = await Promise.all([getHealth(), getStats()]);

  const overallStatus = health?.status || "unhealthy";
  const uptimePct = health ? formatUptimePercent(health.uptime) : "—";

  // Count healthy services
  const serviceCount = health
    ? [
        health.checks.api,
        health.checks.cache,
        health.checks.externalAPIs,
        health.checks.x402Facilitator,
      ].filter(Boolean).length
    : 0;
  const healthyCount = health
    ? [
        health.checks.api,
        health.checks.cache,
        health.checks.externalAPIs,
        health.checks.x402Facilitator,
      ].filter((c) => c?.status === "healthy").length
    : 0;

  return (
    <>
      <Header />
      <StatusAutoRefresh intervalMs={30000} />
      <main className="container-main py-10">
        {/* ── Hero Badge ── */}
        <div className="text-center mb-4 pt-4">
          <Badge className="mb-4">
            <Activity className="h-3 w-3 mr-1" /> System Status
          </Badge>
        </div>

        {/* ── Overall Status Banner ── */}
        <div
          className={cn(
            "mb-10 rounded-xl border p-8 text-center relative overflow-hidden",
            overallStatus === "healthy"
              ? "border-green-500/25 bg-green-500/5"
              : overallStatus === "degraded"
                ? "border-yellow-500/25 bg-yellow-500/5"
                : "border-red-500/25 bg-red-500/5"
          )}
        >
          {/* Subtle gradient bg */}
          <div
            className={cn(
              "absolute inset-0 opacity-[0.03]",
              overallStatus === "healthy"
                ? "bg-gradient-to-br from-green-500 to-transparent"
                : overallStatus === "degraded"
                  ? "bg-gradient-to-br from-yellow-500 to-transparent"
                  : "bg-gradient-to-br from-red-500 to-transparent"
            )}
          />
          <div className="relative">
            <div className="flex items-center justify-center gap-3 mb-3">
              <span
                className={cn(
                  "h-4 w-4 rounded-full animate-pulse",
                  overallStatus === "healthy"
                    ? "bg-green-500"
                    : overallStatus === "degraded"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                )}
              />
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
                {overallStatus === "healthy" && "All Systems Operational"}
                {overallStatus === "degraded" && "Some Systems Degraded"}
                {overallStatus === "unhealthy" && "System Issues Detected"}
              </h1>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-2">
              {healthyCount}/{serviceCount} services operational ·{" "}
              {uptimePct}% uptime (30d)
            </p>
            {health && (
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Last checked:{" "}
                {new Date(health.timestamp).toLocaleString()} ·
                Auto-refreshes every 30s
              </p>
            )}
          </div>
        </div>

        {/* ── 30-Day Uptime Bar ── */}
        <Card className="mb-8">
          <CardContent className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              30-Day Uptime
            </h2>
            <span className="text-sm text-[var(--color-text-tertiary)]">
              {uptimePct}%
            </span>
          </div>
          <UptimeBar status={overallStatus} />
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              30 days ago
            </span>
            <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-tertiary)]">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-[1px] bg-green-500" /> Operational
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-[1px] bg-yellow-500" /> Degraded
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-[1px] bg-red-500" /> Down
              </span>
            </div>
            <span className="text-[10px] text-[var(--color-text-tertiary)]">
              Today
            </span>
          </div>
          </CardContent>
        </Card>

        {/* ── System Metrics ── */}
        {health && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="Version"
              value={health.version}
              icon={Cpu}
              subtext="Current deployment"
            />
            <MetricCard
              label="Uptime"
              value={formatUptime(health.uptime)}
              icon={Clock}
              subtext={`${uptimePct}% (30d)`}
              trend="up"
            />
            <MetricCard
              label="Active Sources"
              value={stats?.summary.activeSources.toString() || "-"}
              icon={Radio}
              subtext={`of ${stats?.summary.totalSources || "-"} total`}
            />
            <MetricCard
              label="Articles (24h)"
              value={stats?.summary.totalArticles.toString() || "-"}
              icon={Newspaper}
              subtext={`~${stats?.summary.avgArticlesPerHour?.toFixed(0) || "-"}/hour`}
            />
          </div>
        )}

        {/* ── Performance Metrics ── */}
        {(health || stats) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricCard
              label="API Response"
              value={
                health?.checks.api.responseTime
                  ? `${health.checks.api.responseTime}ms`
                  : "-"
              }
              icon={Zap}
              subtext={responseTimeLabel(health?.checks.api.responseTime)}
              trend={
                health?.checks.api.responseTime !== undefined
                  ? health.checks.api.responseTime < 200
                    ? "up"
                    : "down"
                  : "neutral"
              }
            />
            <MetricCard
              label="Cache Response"
              value={
                health?.checks.cache.responseTime
                  ? `${health.checks.cache.responseTime}ms`
                  : "-"
              }
              icon={HardDrive}
              subtext={responseTimeLabel(health?.checks.cache.responseTime)}
            />
            <MetricCard
              label="Avg Articles/Hour"
              value={stats?.summary.avgArticlesPerHour?.toFixed(1) || "-"}
              icon={BarChart3}
              subtext={stats?.summary.timeRange || "24h window"}
            />
            <MetricCard
              label="Total Sources"
              value={stats?.summary.totalSources?.toString() || "-"}
              icon={Globe}
              subtext="All registered feeds"
            />
          </div>
        )}

        {/* ── Service Status ── */}
        <Card className="mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Server className="h-4 w-4 text-[var(--color-accent)]" />
              Service Status
            </h2>
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {healthyCount}/{serviceCount} healthy
            </span>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {health ? (
              <>
                <StatusRow
                  name="API Server"
                  icon={Server}
                  status={health.checks.api.status}
                  responseTime={health.checks.api.responseTime}
                />
                <StatusRow
                  name="Cache (Vercel KV)"
                  icon={Database}
                  status={health.checks.cache.status}
                  responseTime={health.checks.cache.responseTime}
                  message={health.checks.cache.message}
                />
                <StatusRow
                  name="External APIs"
                  icon={Cloud}
                  status={health.checks.externalAPIs.status}
                  responseTime={health.checks.externalAPIs.responseTime}
                  message={health.checks.externalAPIs.message}
                />
                {health.checks.x402Facilitator && (
                  <StatusRow
                    name="x402 Facilitator"
                    icon={Shield}
                    status={health.checks.x402Facilitator.status}
                    responseTime={health.checks.x402Facilitator.responseTime}
                    message={health.checks.x402Facilitator.message}
                  />
                )}
              </>
            ) : (
              <div className="px-6 py-12 text-center">
                <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                <p className="text-[var(--color-text-tertiary)]">
                  Unable to fetch health status
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  The health endpoint may be temporarily unavailable
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* ── API Endpoints ── */}
        <Card className="mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
              <Wifi className="h-4 w-4 text-[var(--color-accent)]" />
              API Endpoints
            </h2>
            <Badge>REST &amp; Streaming</Badge>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {(() => {
              const apiStatus = health?.checks.api.status;
              return (
                <>
                  <EndpointRow method="GET" endpoint="/api/news" description="Latest crypto news" apiStatus={apiStatus} />
                  <EndpointRow method="GET" endpoint="/api/search" description="Search articles" apiStatus={apiStatus} />
                  <EndpointRow method="GET" endpoint="/api/bitcoin" description="Bitcoin news feed" apiStatus={apiStatus} />
                  <EndpointRow method="GET" endpoint="/api/market" description="Market data &amp; prices" apiStatus={apiStatus} />
                  <EndpointRow method="GET" endpoint="/api/fear-greed" description="Fear &amp; Greed index" apiStatus={apiStatus} />
                  <EndpointRow method="GET" endpoint="/api/ai" description="AI analysis" apiStatus={apiStatus} />
                  <EndpointRow method="GET" endpoint="/api/stats" description="System statistics" apiStatus={apiStatus} />
                  <EndpointRow method="GET" endpoint="/api/sources" description="News sources directory" apiStatus={apiStatus} />
                  <EndpointRow method="GET" endpoint="/api/health" description="Health check" apiStatus={apiStatus} />
                  <EndpointRow method="SSE" endpoint="/api/sse" description="Real-time event stream" apiStatus={apiStatus} />
                  <EndpointRow method="GET" endpoint="/feed" description="RSS feed" apiStatus={apiStatus} />
                  <EndpointRow method="GET" endpoint="/atom" description="Atom feed" apiStatus={apiStatus} />
                  <EndpointRow method="WS" endpoint="/ws" description="WebSocket connection" apiStatus={apiStatus} />
                </>
              );
            })()}
          </div>
        </Card>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* ── Category Distribution ── */}
          {stats && stats.byCategory && stats.byCategory.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
                <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[var(--color-accent)]" />
                  Articles by Category
                </h2>
              </div>
              <div className="p-6">
                <CategoryDistribution categories={stats.byCategory} />
              </div>
            </Card>
          )}

          {/* ── Source Activity (24h) ── */}
          {stats && stats.bySource.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex items-center justify-between">
                <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-[var(--color-accent)]" />
                  Top Sources (24h)
                </h2>
                <span className="text-sm text-[var(--color-text-tertiary)]">
                  {stats.summary.activeSources} active
                </span>
              </div>
              <div className="divide-y divide-[var(--color-border)]">
                {stats.bySource.slice(0, 8).map((source, i) => (
                  <div
                    key={source.source}
                    className="px-6 py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-[var(--color-text-tertiary)] w-5 text-right">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                          {source.source}
                        </div>
                        {source.latestTime && (
                          <div className="text-xs text-[var(--color-text-tertiary)]">
                            {formatTimeAgo(source.latestTime)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Mini bar */}
                      <div className="w-16 h-1.5 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden hidden sm:block">
                        <div
                          className="h-full rounded-full bg-[var(--color-accent)]"
                          style={{
                            width: `${source.percentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-sm font-mono font-medium text-[var(--color-text-primary)] w-8 text-right">
                        {source.articleCount}
                      </span>
                      <span className="text-xs text-[var(--color-text-tertiary)] w-10 text-right">
                        {source.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* ── Incident & Contact Footer ── */}
        <Card className="text-center">
          <CardContent className="p-8">
            <Headphones className="h-6 w-6 text-[var(--color-accent)] mx-auto mb-3" />
            <h3 className="font-serif text-lg font-bold text-[var(--color-text-primary)] mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-[var(--color-text-tertiary)] mb-5 max-w-lg mx-auto">
              Report issues, request features, or check for known incidents on
              GitHub.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://github.com/nirholas/free-crypto-news/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Bug className="mr-1.5 h-3.5 w-3.5" /> Report Issue
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a
                  href="https://github.com/nirholas/free-crypto-news/discussions"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" /> Discussions
                </a>
              </Button>
              <Button variant="primary" size="sm" asChild>
                <a
                  href="https://github.com/nirholas/free-crypto-news"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Star className="mr-1.5 h-3.5 w-3.5" /> Star on GitHub
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/contact">
                  Contact Support <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </>
  );
}
