/**
 * System Status Page
 * 
 * Public status page showing real-time health of all services,
 * API endpoints, and news sources. Helps users understand if
 * there are any issues affecting the service.
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'System Status | Free Crypto News',
  description: 'Real-time status of Free Crypto News API services, endpoints, and news sources.',
};

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
    x402Facilitator: HealthCheck;
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
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://news-crypto.vercel.app';
    const res = await fetch(`${baseUrl}/api/health`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function getStats(): Promise<StatsResponse | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://news-crypto.vercel.app';
    const res = await fetch(`${baseUrl}/api/stats`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: 'healthy' | 'degraded' | 'unhealthy' }) {
  const colors = {
    healthy: 'bg-green-500/20 text-green-400 border-green-500/30',
    degraded: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    unhealthy: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  
  const labels = {
    healthy: 'Operational',
    degraded: 'Degraded',
    unhealthy: 'Down',
  };
  
  return (
    <span className={`px-2 py-1 text-xs font-medium rounded border ${colors[status]}`}>
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
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold mb-4">System Status</h1>
          <div className="flex items-center justify-center gap-3">
            <div className={`w-3 h-3 rounded-full ${
              overallStatus === 'healthy' ? 'bg-green-500 animate-pulse' :
              overallStatus === 'degraded' ? 'bg-yellow-500 animate-pulse' :
              'bg-red-500 animate-pulse'
            }`} />
            <span className="text-lg">
              {overallStatus === 'healthy' && 'All Systems Operational'}
              {overallStatus === 'degraded' && 'Some Systems Degraded'}
              {overallStatus === 'unhealthy' && 'System Issues Detected'}
            </span>
          </div>
          {health && (
            <p className="text-gray-500 text-sm mt-2">
              Last checked: {new Date(health.timestamp).toLocaleString()}
            </p>
          )}
        </div>
        
        {/* Service Status */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 mb-8">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold">Service Status</h2>
          </div>
          <div className="divide-y divide-gray-800">
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
                <StatusRow
                  name="x402 Facilitator"
                  status={health.checks.x402Facilitator.status}
                  responseTime={health.checks.x402Facilitator.responseTime}
                  message={health.checks.x402Facilitator.message}
                />
              </>
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                Unable to fetch health status
              </div>
            )}
          </div>
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
        
        {/* API Endpoints */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 mb-8">
          <div className="px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-semibold">API Endpoints</h2>
          </div>
          <div className="divide-y divide-gray-800">
            <EndpointRow endpoint="/api/news" description="Latest crypto news" />
            <EndpointRow endpoint="/api/search" description="Search articles" />
            <EndpointRow endpoint="/api/bitcoin" description="Bitcoin news feed" />
            <EndpointRow endpoint="/api/market" description="Market data" />
            <EndpointRow endpoint="/api/fear-greed" description="Fear & Greed index" />
            <EndpointRow endpoint="/api/ai" description="AI analysis" />
            <EndpointRow endpoint="/api/sse" description="Real-time stream" />
          </div>
        </div>
        
        {/* Top Sources */}
        {stats && stats.bySource.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 mb-8">
            <div className="px-6 py-4 border-b border-gray-800">
              <h2 className="text-lg font-semibold">News Sources (Last 24h)</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {stats.bySource.slice(0, 10).map((source) => (
                <div key={source.source} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-medium">{source.source}</div>
                    {source.latestTime && (
                      <div className="text-sm text-gray-500">
                        Last article: {formatTimeAgo(source.latestTime)}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{source.articleCount}</div>
                    <div className="text-sm text-gray-500">{source.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>
            Having issues? Check our{' '}
            <a href="https://github.com/nirholas/free-crypto-news/issues" 
               className="text-blue-400 hover:underline"
               target="_blank"
               rel="noopener noreferrer">
              GitHub Issues
            </a>
            {' '}or{' '}
            <a href="https://github.com/nirholas/free-crypto-news/discussions" 
               className="text-blue-400 hover:underline"
               target="_blank"
               rel="noopener noreferrer">
              Discussions
            </a>
          </p>
        </div>
      </div>
    </div>
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
        <div className="font-medium">{name}</div>
        {message && <div className="text-sm text-gray-500">{message}</div>}
      </div>
      <div className="flex items-center gap-3">
        {responseTime !== undefined && (
          <span className="text-sm text-gray-500">{responseTime}ms</span>
        )}
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 text-center">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  );
}

function EndpointRow({ endpoint, description }: { endpoint: string; description: string }) {
  return (
    <div className="px-6 py-3 flex items-center justify-between">
      <div>
        <code className="text-blue-400">{endpoint}</code>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <StatusBadge status="healthy" />
    </div>
  );
}
