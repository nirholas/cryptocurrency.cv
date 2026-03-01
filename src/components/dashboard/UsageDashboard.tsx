"use client";

import { useEffect, useState } from "react";

interface KeyUsage {
  keyId: string;
  keyName: string;
  tier: string;
  today: number;
  month: number;
  allTime: number;
  daily?: Record<string, number>;
}

interface UsageData {
  totals: { today: number; month: number; allTime: number };
  keys: KeyUsage[];
  activeKeys: number;
  totalKeys: number;
}

function ProgressBar({
  value,
  max,
  label,
}: {
  value: number;
  max: number;
  label: string;
}) {
  const percent = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const colorClass =
    percent > 90
      ? "bg-red-500"
      : percent > 70
      ? "bg-yellow-500"
      : "bg-blue-500";

  return (
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">
          {value.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export default function UsageDashboard() {
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

  const TIER_LIMITS: Record<string, number> = {
    pro: 50000,
    enterprise: 500000,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Usage</h1>
        <p className="text-muted-foreground text-sm">
          Monitor your API usage across all keys.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-card p-6 animate-pulse"
            >
              <div className="h-4 w-32 bg-muted rounded mb-4" />
              <div className="h-8 w-20 bg-muted rounded" />
            </div>
          ))}
        </div>
      ) : !data ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="font-semibold mb-1">No usage data yet</h3>
          <p className="text-sm text-muted-foreground">
            Create an API key and make your first request to see usage data.
          </p>
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground mb-1">Today</div>
              <div className="text-3xl font-bold">
                {data.totals.today.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">requests</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground mb-1">
                This Month
              </div>
              <div className="text-3xl font-bold">
                {data.totals.month.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">requests</div>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <div className="text-sm text-muted-foreground mb-1">All Time</div>
              <div className="text-3xl font-bold">
                {data.totals.allTime.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground mt-1">requests</div>
            </div>
          </div>

          {/* Per-key usage */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Usage by Key</h2>
            {data.keys.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active keys.
              </p>
            ) : (
              <div className="space-y-6">
                {data.keys.map((key) => (
                  <div key={key.keyId} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {key.keyName}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                            key.tier === "enterprise"
                              ? "bg-purple-500/10 text-purple-400"
                              : "bg-blue-500/10 text-blue-400"
                          }`}
                        >
                          {key.tier}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {key.keyId}
                      </span>
                    </div>
                    <ProgressBar
                      value={key.today}
                      max={TIER_LIMITS[key.tier] || 50000}
                      label="Daily usage"
                    />
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-muted-foreground">Today</div>
                        <div className="font-semibold">
                          {key.today.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Month</div>
                        <div className="font-semibold">
                          {key.month.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">All Time</div>
                        <div className="font-semibold">
                          {key.allTime.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rate limit info */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold mb-3">Rate Limits</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">
                      Tier
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">
                      Per Day
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">
                      Per Minute
                    </th>
                    <th className="text-left py-2 text-xs font-semibold text-muted-foreground uppercase">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-2 font-medium">Pro</td>
                    <td className="py-2 text-muted-foreground">50,000</td>
                    <td className="py-2 text-muted-foreground">500</td>
                    <td className="py-2 text-muted-foreground">$29/mo</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">Enterprise</td>
                    <td className="py-2 text-muted-foreground">500,000</td>
                    <td className="py-2 text-muted-foreground">2,000</td>
                    <td className="py-2 text-muted-foreground">$99/mo</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-medium">x402 (Pay-per-use)</td>
                    <td className="py-2 text-muted-foreground">Unlimited</td>
                    <td className="py-2 text-muted-foreground">Unlimited</td>
                    <td className="py-2 text-muted-foreground">$0.001/req</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
