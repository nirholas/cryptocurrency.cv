"use client";

import { useEffect, useState } from "react";

interface UsageData {
  totals: { today: number; month: number; allTime: number };
  activeKeys: number;
  totalKeys: number;
}

function StatCard({
  icon,
  label,
  value,
  subtitle,
}: {
  icon: string;
  label: string;
  value: string | number;
  subtitle?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-xl">{icon}</span>
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
      {subtitle && (
        <div className="text-xs text-muted-foreground mt-1">{subtitle}</div>
      )}
    </div>
  );
}

export default function DashboardOverview() {
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsage() {
      try {
        const res = await fetch("/api/dashboard/usage");
        if (res.ok) {
          setData(await res.json());
        }
      } catch {
        // Fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchUsage();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">
          Your API usage overview and quick actions.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-5 animate-pulse"
            >
              <div className="h-4 w-24 bg-muted rounded mb-3" />
              <div className="h-8 w-16 bg-muted rounded" />
            </div>
          ))
        ) : (
          <>
            <StatCard
              icon="📡"
              label="Requests Today"
              value={data?.totals.today?.toLocaleString() ?? "0"}
            />
            <StatCard
              icon="📊"
              label="Requests This Month"
              value={data?.totals.month?.toLocaleString() ?? "0"}
            />
            <StatCard
              icon="🔑"
              label="Active Keys"
              value={data?.activeKeys ?? 0}
              subtitle={`${data?.totalKeys ?? 0} total`}
            />
            <StatCard
              icon="🌐"
              label="Total Requests"
              value={data?.totals.allTime?.toLocaleString() ?? "0"}
              subtitle="All time"
            />
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <a
            href="keys"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-blue-500/50 hover:bg-muted/50 transition-all"
          >
            <span className="text-2xl">🔑</span>
            <div>
              <div className="font-semibold text-sm">Create API Key</div>
              <div className="text-xs text-muted-foreground">
                Generate a new key
              </div>
            </div>
          </a>
          <a
            href="/en/docs"
            target="_blank"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-blue-500/50 hover:bg-muted/50 transition-all"
          >
            <span className="text-2xl">📖</span>
            <div>
              <div className="font-semibold text-sm">View Docs</div>
              <div className="text-xs text-muted-foreground">
                API reference
              </div>
            </div>
          </a>
          <a
            href="/en/pricing"
            className="flex items-center gap-3 p-4 rounded-lg border border-border hover:border-blue-500/50 hover:bg-muted/50 transition-all"
          >
            <span className="text-2xl">⬆️</span>
            <div>
              <div className="font-semibold text-sm">Upgrade Plan</div>
              <div className="text-xs text-muted-foreground">
                Get more requests
              </div>
            </div>
          </a>
        </div>
      </div>

      {/* Getting Started */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Getting Started</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="bg-blue-500/10 text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
              1
            </span>
            <div>
              <div className="font-medium">Create an API key</div>
              <div className="text-muted-foreground">
                Go to <a href="keys" className="text-blue-500 hover:underline">API Keys</a> and create your first key.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-blue-500/10 text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
              2
            </span>
            <div>
              <div className="font-medium">Make your first request</div>
              <div className="text-muted-foreground">
                Include your key as <code className="bg-muted px-1 py-0.5 rounded text-xs">X-API-Key</code> header.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="bg-blue-500/10 text-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shrink-0">
              3
            </span>
            <div>
              <div className="font-medium">Monitor usage</div>
              <div className="text-muted-foreground">
                Track requests and rate limits on <a href="usage" className="text-blue-500 hover:underline">Usage</a>.
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border">
          <div className="text-xs font-semibold text-muted-foreground mb-2">
            Example Request
          </div>
          <pre className="text-xs font-mono overflow-x-auto">
{`curl -H "X-API-Key: YOUR_KEY" \\
  https://cryptocurrency.cv/api/prices?limit=10`}
          </pre>
        </div>
      </div>
    </div>
  );
}
