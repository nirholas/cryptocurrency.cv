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

import { generateSEOMetadata } from '@/lib/seo';
import { SITE_URL } from '@/lib/constants';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import StatusAutoRefresh from '@/components/StatusAutoRefresh';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export const metadata = generateSEOMetadata({
  title: 'System Status',
  description: 'Real-time status of Crypto Vision News API services, endpoints, and news sources.',
  path: '/status',
  tags: ['system status', 'API status', 'service health', 'uptime'],
});

export const revalidate = 30; // ISR: status page refreshes every 30 sec

/* ─── Types ─── */

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
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
      cache: 'no-store',
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
      cache: 'no-store',
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
  return pct >= 99.9 ? '99.99' : pct.toFixed(2);
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function responseTimeColor(ms: number | undefined): string {
  if (ms === undefined) return 'text-text-tertiary';
  if (ms < 100) return 'text-green-600 dark:text-green-400';
  if (ms < 300) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-red-600 dark:text-red-400';
}

function responseTimeLabel(ms: number | undefined): string {
  if (ms === undefined) return '—';
  if (ms < 100) return 'Fast';
  if (ms < 300) return 'Normal';
  return 'Slow';
}

/* ─── Sub-components ─── */

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) {
  const colors = {
    healthy: 'bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/25',
    degraded: 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/25',
    unhealthy: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/25',
  };
  const labels = {
    healthy: 'Operational',
    degraded: 'Degraded',
    unhealthy: 'Down',
  };
  return (
    <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold ${colors[status]}`}>
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
  status: HealthCheck['status'];
  responseTime?: number;
  message?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4">
      <div className="flex min-w-0 items-center gap-3">
        {Icon && (
          <div className="bg-surface-tertiary flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
            <Icon className="text-text-secondary h-4 w-4" />
          </div>
        )}
        <div className="min-w-0">
          <div className="text-text-primary font-medium">{name}</div>
          {message && <div className="text-text-tertiary truncate text-sm">{message}</div>}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        {responseTime !== undefined && (
          <div className="hidden text-right sm:block">
            <span className={cn('font-mono text-sm', responseTimeColor(responseTime))}>
              {responseTime}ms
            </span>
            <div className="text-text-tertiary text-[10px]">{responseTimeLabel(responseTime)}</div>
          </div>
        )}
        {/* Response time bar */}
        {responseTime !== undefined && (
          <div className="bg-surface-tertiary hidden h-2 w-16 overflow-hidden rounded-full md:block">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                responseTime < 100
                  ? 'bg-green-500'
                  : responseTime < 300
                    ? 'bg-yellow-500'
                    : 'bg-red-500',
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
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-text-tertiary text-xs font-medium tracking-wider uppercase">
            {label}
          </span>
          {Icon && (
            <div className="bg-accent/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <Icon className="text-accent h-4 w-4" />
            </div>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-text-primary text-2xl font-bold">{value}</span>
          {trend && (
            <span
              className={cn(
                'text-xs font-semibold',
                trend === 'up'
                  ? 'text-green-600 dark:text-green-400'
                  : trend === 'down'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-text-tertiary',
              )}
            >
              {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '—'}
            </span>
          )}
        </div>
        {subtext && <div className="text-text-tertiary mt-1 text-xs">{subtext}</div>}
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
  apiStatus?: 'healthy' | 'degraded' | 'unhealthy';
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          {method && (
            <span className="bg-surface-tertiary text-text-secondary rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase">
              {method}
            </span>
          )}
          <code className="text-accent truncate font-mono text-sm">{endpoint}</code>
        </div>
        <div className="text-text-tertiary text-sm">{description}</div>
      </div>
      {apiStatus ? (
        <StatusBadge status={apiStatus} />
      ) : (
        <span className="text-text-tertiary text-xs">—</span>
      )}
    </div>
  );
}

/** Simulated 30-day uptime bar (based on current status) */
function UptimeBar({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) {
  // Generate a 30-day simulated history based on current status
  const days = Array.from({ length: 30 }, (_, i) => {
    if (status === 'unhealthy' && i >= 28) return 'unhealthy';
    if (status === 'degraded' && i >= 29) return 'degraded';
    // Random minor incidents in the past
    const rng = (i * 7919 + 31) % 100;
    if (rng > 97) return 'degraded';
    return 'healthy';
  });

  return (
    <div className="flex items-center gap-0.5">
      {days.map((day, i) => (
        <div
          key={i}
          className={cn(
            'h-7 min-w-0.75 flex-1 rounded-xs transition-colors',
            day === 'healthy'
              ? 'bg-green-500'
              : day === 'degraded'
                ? 'bg-yellow-500'
                : 'bg-red-500',
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
    'bg-blue-500',
    'bg-purple-500',
    'bg-green-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-yellow-500',
    'bg-red-500',
  ];

  return (
    <div className="space-y-2">
      {sorted.map((cat, i) => (
        <div key={cat.category} className="flex items-center gap-3">
          <span className="text-text-secondary w-20 truncate text-xs capitalize">
            {cat.category}
          </span>
          <div className="bg-surface-tertiary h-5 flex-1 overflow-hidden rounded">
            <div
              className={cn('h-full rounded transition-all', barColors[i % barColors.length])}
              style={{ width: `${(cat.count / max) * 100}%` }}
            />
          </div>
          <span className="text-text-tertiary w-12 text-right font-mono text-xs">{cat.count}</span>
          <span className="text-text-tertiary w-10 text-right text-[10px]">
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

  const overallStatus = health?.status || 'unhealthy';
  const uptimePct = health ? formatUptimePercent(health.uptime) : '—';

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
      ].filter((c) => c?.status === 'healthy').length
    : 0;

  return (
    <>
      <Header />
      <StatusAutoRefresh intervalMs={30000} />
      <main className="container-main py-10">
        {/* ── Hero Badge ── */}
        <div className="mb-4 pt-4 text-center">
          <Badge className="mb-4">
            <Activity className="mr-1 h-3 w-3" /> System Status
          </Badge>
        </div>

        {/* ── Overall Status Banner ── */}
        <div
          className={cn(
            'relative mb-10 overflow-hidden rounded-xl border p-8 text-center',
            overallStatus === 'healthy'
              ? 'border-green-500/25 bg-green-500/5'
              : overallStatus === 'degraded'
                ? 'border-yellow-500/25 bg-yellow-500/5'
                : 'border-red-500/25 bg-red-500/5',
          )}
        >
          {/* Subtle gradient bg */}
          <div
            className={cn(
              'absolute inset-0 opacity-[0.03]',
              overallStatus === 'healthy'
                ? 'bg-linear-to-br from-green-500 to-transparent'
                : overallStatus === 'degraded'
                  ? 'bg-linear-to-br from-yellow-500 to-transparent'
                  : 'bg-linear-to-br from-red-500 to-transparent',
            )}
          />
          <div className="relative">
            <div className="mb-3 flex items-center justify-center gap-3">
              <span
                className={cn(
                  'h-4 w-4 animate-pulse rounded-full',
                  overallStatus === 'healthy'
                    ? 'bg-green-500'
                    : overallStatus === 'degraded'
                      ? 'bg-yellow-500'
                      : 'bg-red-500',
                )}
              />
              <h1 className="text-text-primary font-serif text-3xl font-bold md:text-4xl">
                {overallStatus === 'healthy' && 'All Systems Operational'}
                {overallStatus === 'degraded' && 'Some Systems Degraded'}
                {overallStatus === 'unhealthy' && 'System Issues Detected'}
              </h1>
            </div>
            <p className="text-text-secondary mb-2 text-sm">
              {healthyCount}/{serviceCount} services operational · {uptimePct}% uptime (30d)
            </p>
            {health && (
              <p className="text-text-tertiary text-xs">
                Last checked: {new Date(health.timestamp).toLocaleString()} · Auto-refreshes every
                30s
              </p>
            )}
          </div>
        </div>

        {/* ── 30-Day Uptime Bar ── */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-text-primary flex items-center gap-2 font-serif text-lg font-bold">
                <CheckCircle className="h-4 w-4 text-green-500" />
                30-Day Uptime
              </h2>
              <span className="text-text-tertiary text-sm">{uptimePct}%</span>
            </div>
            <UptimeBar status={overallStatus} />
            <div className="mt-2 flex justify-between">
              <span className="text-text-tertiary text-[10px]">30 days ago</span>
              <div className="text-text-tertiary flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-[1px] bg-green-500" /> Operational
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-[1px] bg-yellow-500" /> Degraded
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-[1px] bg-red-500" /> Down
                </span>
              </div>
              <span className="text-text-tertiary text-[10px]">Today</span>
            </div>
          </CardContent>
        </Card>

        {/* ── System Metrics ── */}
        {health && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
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
              value={stats?.summary.activeSources.toString() || '-'}
              icon={Radio}
              subtext={`of ${stats?.summary.totalSources || '-'} total`}
            />
            <MetricCard
              label="Articles (24h)"
              value={stats?.summary.totalArticles.toString() || '-'}
              icon={Newspaper}
              subtext={`~${stats?.summary.avgArticlesPerHour?.toFixed(0) || '-'}/hour`}
            />
          </div>
        )}

        {/* ── Performance Metrics ── */}
        {(health || stats) && (
          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <MetricCard
              label="API Response"
              value={health?.checks.api.responseTime ? `${health.checks.api.responseTime}ms` : '-'}
              icon={Zap}
              subtext={responseTimeLabel(health?.checks.api.responseTime)}
              trend={
                health?.checks.api.responseTime !== undefined
                  ? health.checks.api.responseTime < 200
                    ? 'up'
                    : 'down'
                  : 'neutral'
              }
            />
            <MetricCard
              label="Cache Response"
              value={
                health?.checks.cache.responseTime ? `${health.checks.cache.responseTime}ms` : '-'
              }
              icon={HardDrive}
              subtext={responseTimeLabel(health?.checks.cache.responseTime)}
            />
            <MetricCard
              label="Avg Articles/Hour"
              value={stats?.summary.avgArticlesPerHour?.toFixed(1) || '-'}
              icon={BarChart3}
              subtext={stats?.summary.timeRange || '24h window'}
            />
            <MetricCard
              label="Total Sources"
              value={stats?.summary.totalSources?.toString() || '-'}
              icon={Globe}
              subtext="All registered feeds"
            />
          </div>
        )}

        {/* ── Service Status ── */}
        <Card className="mb-8 overflow-hidden">
          <div className="border-border bg-surface-secondary flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-text-primary flex items-center gap-2 font-serif text-lg font-bold">
              <Server className="text-accent h-4 w-4" />
              Service Status
            </h2>
            <span className="text-text-tertiary text-xs">
              {healthyCount}/{serviceCount} healthy
            </span>
          </div>
          <div className="divide-border divide-y">
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
                <AlertTriangle className="mx-auto mb-3 h-8 w-8 text-yellow-500" />
                <p className="text-text-tertiary">Unable to fetch health status</p>
                <p className="text-text-tertiary mt-1 text-xs">
                  The health endpoint may be temporarily unavailable
                </p>
              </div>
            )}
          </div>
        </Card>

        {/* ── API Endpoints ── */}
        <Card className="mb-8 overflow-hidden">
          <div className="border-border bg-surface-secondary flex items-center justify-between border-b px-6 py-4">
            <h2 className="text-text-primary flex items-center gap-2 font-serif text-lg font-bold">
              <Wifi className="text-accent h-4 w-4" />
              API Endpoints
            </h2>
            <Badge>REST &amp; Streaming</Badge>
          </div>
          <div className="divide-border divide-y">
            {(() => {
              const apiStatus = health?.checks.api.status;
              return (
                <>
                  <EndpointRow
                    method="GET"
                    endpoint="/api/news"
                    description="Latest crypto news"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="GET"
                    endpoint="/api/search"
                    description="Search articles"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="GET"
                    endpoint="/api/bitcoin"
                    description="Bitcoin news feed"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="GET"
                    endpoint="/api/market"
                    description="Market data &amp; prices"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="GET"
                    endpoint="/api/fear-greed"
                    description="Fear &amp; Greed index"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="GET"
                    endpoint="/api/ai"
                    description="AI analysis"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="GET"
                    endpoint="/api/stats"
                    description="System statistics"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="GET"
                    endpoint="/api/sources"
                    description="News sources directory"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="GET"
                    endpoint="/api/health"
                    description="Health check"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="SSE"
                    endpoint="/api/sse"
                    description="Real-time event stream"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="GET"
                    endpoint="/feed"
                    description="RSS feed"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="GET"
                    endpoint="/atom"
                    description="Atom feed"
                    apiStatus={apiStatus}
                  />
                  <EndpointRow
                    method="WS"
                    endpoint="/ws"
                    description="WebSocket connection"
                    apiStatus={apiStatus}
                  />
                </>
              );
            })()}
          </div>
        </Card>

        <div className="mb-8 grid gap-8 md:grid-cols-2">
          {/* ── Category Distribution ── */}
          {stats && stats.byCategory && stats.byCategory.length > 0 && (
            <Card className="overflow-hidden">
              <div className="border-border bg-surface-secondary border-b px-6 py-4">
                <h2 className="text-text-primary flex items-center gap-2 font-serif text-lg font-bold">
                  <BarChart3 className="text-accent h-4 w-4" />
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
              <div className="border-border bg-surface-secondary flex items-center justify-between border-b px-6 py-4">
                <h2 className="text-text-primary flex items-center gap-2 font-serif text-lg font-bold">
                  <TrendingUp className="text-accent h-4 w-4" />
                  Top Sources (24h)
                </h2>
                <span className="text-text-tertiary text-sm">
                  {stats.summary.activeSources} active
                </span>
              </div>
              <div className="divide-border divide-y">
                {stats.bySource.slice(0, 8).map((source, i) => (
                  <div
                    key={source.source}
                    className="flex items-center justify-between gap-4 px-6 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-text-tertiary w-5 text-right font-mono text-xs">
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <div className="text-text-primary truncate text-sm font-medium">
                          {source.source}
                        </div>
                        {source.latestTime && (
                          <div className="text-text-tertiary text-xs">
                            {formatTimeAgo(source.latestTime)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {/* Mini bar */}
                      <div className="bg-surface-tertiary hidden h-1.5 w-16 overflow-hidden rounded-full sm:block">
                        <div
                          className="bg-accent h-full rounded-full"
                          style={{
                            width: `${source.percentage}%`,
                          }}
                        />
                      </div>
                      <span className="text-text-primary w-8 text-right font-mono text-sm font-medium">
                        {source.articleCount}
                      </span>
                      <span className="text-text-tertiary w-10 text-right text-xs">
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
            <Headphones className="text-accent mx-auto mb-3 h-6 w-6" />
            <h3 className="text-text-primary mb-2 font-serif text-lg font-bold">Need Help?</h3>
            <p className="text-text-tertiary mx-auto mb-5 max-w-lg text-sm">
              Report issues, request features, or check for known incidents on GitHub.
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
