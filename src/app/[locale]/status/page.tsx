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

export const metadata = generateSEOMetadata({
  title: 'System Status',
  description: 'Real-time status of Crypto Vision News API services, endpoints, and news sources.',
  path: '/status',
  tags: ['system status', 'API status', 'service health', 'uptime'],
});

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${colors[status]}`}>
      {labels[status]}
    </span>
  );
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
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

export default async function StatusPage() {
  const [health, stats] = await Promise.all([getHealth(), getStats()]);
  
  const overallStatus = health?.status || 'unhealthy';
  
  return (
    <>
      <Header />
      <StatusAutoRefresh intervalMs={30000} />
      <main className="container-main py-10">
        {/* Overall Status Banner */}
        <div className="mb-10 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className={`h-4 w-4 rounded-full ${
              overallStatus === 'healthy' ? 'bg-green-500 animate-pulse' :
              overallStatus === 'degraded' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500 animate-pulse'
            }`} />
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-[var(--color-text-primary)]">
              {overallStatus === 'healthy' && 'All Systems Operational'}
              {overallStatus === 'degraded' && 'Some Systems Degraded'}
              {overallStatus === 'unhealthy' && 'System Issues Detected'}
            </h1>
          </div>
          {health && (
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Last checked: {new Date(health.timestamp).toLocaleString()} · Auto-refreshes every 30s
            </p>
          )}
        </div>
        
        {/* System Metrics */}
        {health && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <MetricCard label="Version" value={health.version} />
            <MetricCard label="Uptime" value={formatUptime(health.uptime)} />
            <MetricCard 
              label="Active Sources" 
              value={stats?.summary.activeSources.toString() || '-'} 
            />
            <MetricCard 
              label="Articles (24h)" 
              value={stats?.summary.totalArticles.toString() || '-'} 
            />
          </div>
        )}

        {/* Performance Metrics */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <MetricCard
              label="Avg Articles/Hour"
              value={stats.summary.avgArticlesPerHour?.toFixed(1) || '-'}
            />
            <MetricCard
              label="Total Sources"
              value={stats.summary.totalSources?.toString() || '-'}
            />
            <MetricCard
              label="Time Range"
              value={stats.summary.timeRange || '24h'}
            />
          </div>
        )}

        {/* Service Status */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
            <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)]">Service Status</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {health ? (
              <>
                <StatusRow
                  name="API Server"
                  status={health.checks.api.status}
                  responseTime={health.checks.api.responseTime}
                />
                <StatusRow
                  name="Cache (Vercel KV)"
                  status={health.checks.cache.status}
                  responseTime={health.checks.cache.responseTime}
                  message={health.checks.cache.message}
                />
                <StatusRow
                  name="External APIs"
                  status={health.checks.externalAPIs.status}
                  responseTime={health.checks.externalAPIs.responseTime}
                  message={health.checks.externalAPIs.message}
                />
                {health.checks.x402Facilitator && (
                  <StatusRow
                    name="x402 Facilitator"
                    status={health.checks.x402Facilitator.status}
                    responseTime={health.checks.x402Facilitator.responseTime}
                    message={health.checks.x402Facilitator.message}
                  />
                )}
              </>
            ) : (
              <div className="px-6 py-8 text-center text-[var(--color-text-tertiary)]">
                Unable to fetch health status
              </div>
            )}
          </div>
        </div>
        
        {/* API Endpoints */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] mb-8 overflow-hidden">
          <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)]">
            <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)]">API Endpoints</h2>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {(() => {
              const apiStatus = health?.checks.api.status;
              return (
                <>
                  <EndpointRow endpoint="/api/news" description="Latest crypto news" apiStatus={apiStatus} />
                  <EndpointRow endpoint="/api/search" description="Search articles" apiStatus={apiStatus} />
                  <EndpointRow endpoint="/api/bitcoin" description="Bitcoin news feed" apiStatus={apiStatus} />
                  <EndpointRow endpoint="/api/market" description="Market data" apiStatus={apiStatus} />
                  <EndpointRow endpoint="/api/fear-greed" description="Fear & Greed index" apiStatus={apiStatus} />
                  <EndpointRow endpoint="/api/ai" description="AI analysis" apiStatus={apiStatus} />
                  <EndpointRow endpoint="/api/sse" description="Real-time stream" apiStatus={apiStatus} />
                </>
              );
            })()}
          </div>
        </div>
        
        {/* Top Sources */}
        {stats && stats.bySource.length > 0 && (
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] mb-8 overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-secondary)] flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold text-[var(--color-text-primary)]">News Sources (Last 24h)</h2>
              <span className="text-sm text-[var(--color-text-tertiary)]">Top 10 of {stats.summary.activeSources}</span>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {stats.bySource.slice(0, 10).map((source) => (
                <div key={source.source} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[var(--color-text-primary)]">{source.source}</div>
                    {source.latestTime && (
                      <div className="text-sm text-[var(--color-text-tertiary)]">
                        Last article: {formatTimeAgo(source.latestTime)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-[var(--color-text-primary)]">{source.articleCount}</div>
                    <div className="text-sm text-[var(--color-text-tertiary)]">{source.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer Links */}
        <div className="text-center text-[var(--color-text-tertiary)] text-sm py-4">
          <p>
            Having issues? Check our{' '}
            <a href="https://github.com/nirholas/free-crypto-news/issues" 
               className="text-[var(--color-accent)] hover:underline"
               target="_blank"
               rel="noopener noreferrer">
              GitHub Issues
            </a>
            {' '}or{' '}
            <a href="https://github.com/nirholas/free-crypto-news/discussions" 
               className="text-[var(--color-accent)] hover:underline"
               target="_blank"
               rel="noopener noreferrer">
              Discussions
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatusRow({ 
  name, 
  status, 
  responseTime,
  message 
}: { 
  name: string; 
  status: HealthCheck['status'];
  responseTime?: number;
  message?: string;
}) {
  return (
    <div className="px-6 py-4 flex items-center justify-between">
      <div>
        <div className="font-medium text-[var(--color-text-primary)]">{name}</div>
        {message && <div className="text-sm text-[var(--color-text-tertiary)]">{message}</div>}
      </div>
      <div className="flex items-center gap-3">
        {responseTime !== undefined && (
          <span className="text-sm text-[var(--color-text-tertiary)]">{responseTime}ms</span>
        )}
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center transition-shadow hover:shadow-md">
      <div className="text-2xl font-bold text-[var(--color-text-primary)]">{value}</div>
      <div className="text-sm text-[var(--color-text-tertiary)] mt-1">{label}</div>
    </div>
  );
}

function EndpointRow({ endpoint, description, apiStatus }: { endpoint: string; description: string; apiStatus?: 'healthy' | 'degraded' | 'unhealthy' }) {
  return (
    <div className="px-6 py-3 flex items-center justify-between">
      <div>
        <code className="text-[var(--color-accent)] text-sm font-mono">{endpoint}</code>
        <div className="text-sm text-[var(--color-text-tertiary)]">{description}</div>
      </div>
      {apiStatus ? (
        <StatusBadge status={apiStatus} />
      ) : (
        <span className="text-xs text-[var(--color-text-tertiary)]">—</span>
      )}
    </div>
  );
}
