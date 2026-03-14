"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface ActivityEvent {
  id: string;
  type: "whale" | "liquidation" | "volume_spike" | "price_alert" | "listing" | "governance";
  title: string;
  description: string;
  timestamp: string;
  amount?: string;
  coin?: string;
  direction?: "in" | "out" | "up" | "down";
  link?: string;
}

/* ------------------------------------------------------------------ */
/*  Event type config                                                 */
/* ------------------------------------------------------------------ */

const EVENT_CONFIG: Record<ActivityEvent["type"], { icon: string; color: string; label: string }> = {
  whale: { icon: "🐋", color: "border-l-blue-500", label: "Whale Move" },
  liquidation: { icon: "💥", color: "border-l-red-500", label: "Liquidation" },
  volume_spike: { icon: "📊", color: "border-l-purple-500", label: "Volume Spike" },
  price_alert: { icon: "🔔", color: "border-l-yellow-500", label: "Price Alert" },
  listing: { icon: "🆕", color: "border-l-green-500", label: "New Listing" },
  governance: { icon: "🏛️", color: "border-l-indigo-500", label: "Governance" },
};

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

function useLiveActivity() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const prevEventsRef = useRef<string[]>([]);
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());

  const fetchActivity = useCallback(async () => {
    try {
      // Try whale alerts endpoint first, fallback to generating from market data
      const [whaleRes, trendingRes] = await Promise.allSettled([
        fetch("/api/whale-alerts?limit=5").then((r) => r.ok ? r.json() : null),
        fetch("/api/trending?limit=5").then((r) => r.ok ? r.json() : null),
      ]);

      const activityEvents: ActivityEvent[] = [];

      // Whale alerts
      if (whaleRes.status === "fulfilled" && whaleRes.value?.alerts) {
        for (const alert of whaleRes.value.alerts.slice(0, 5)) {
          activityEvents.push({
            id: `whale-${alert.hash || alert.id || Math.random()}`,
            type: "whale",
            title: `${alert.symbol || "BTC"} Whale Transfer`,
            description: `${alert.amount_usd ? `$${Number(alert.amount_usd).toLocaleString()}` : alert.amount} moved ${alert.from ? `from ${alert.from.slice(0, 8)}...` : ""} ${alert.to ? `to ${alert.to.slice(0, 8)}...` : ""}`,
            timestamp: alert.timestamp || new Date().toISOString(),
            amount: alert.amount_usd ? `$${Number(alert.amount_usd).toLocaleString()}` : undefined,
            coin: alert.symbol,
            direction: "out",
          });
        }
      }

      // Trending items as market events
      if (trendingRes.status === "fulfilled") {
        const tData = trendingRes.value;
        const articles = tData?.articles || tData?.coins || [];
        for (const item of articles.slice(0, 3)) {
          const itemObj = item?.item || item;
          activityEvents.push({
            id: `trend-${itemObj.id || itemObj.title || Math.random()}`,
            type: "volume_spike",
            title: itemObj.name || itemObj.title || "Trending",
            description: itemObj.description || `${itemObj.name || "Asset"} is trending with high volume`,
            timestamp: itemObj.pubDate || itemObj.timestamp || new Date().toISOString(),
            coin: itemObj.symbol,
            direction: "up",
          });
        }
      }

      // Detect new events
      const currentIds = activityEvents.map((e) => e.id);
      const newIds = currentIds.filter((id) => !prevEventsRef.current.includes(id));
      if (newIds.length > 0) {
        setNewEventIds(new Set(newIds));
        // Clear animation after 3 seconds
        setTimeout(() => setNewEventIds(new Set()), 3000);
      }
      prevEventsRef.current = currentIds;

      setEvents(activityEvents);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 60_000); // every 60s
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return { events, loading, newEventIds };
}

/* ------------------------------------------------------------------ */
/*  Time ago helper                                                   */
/* ------------------------------------------------------------------ */

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

/* ------------------------------------------------------------------ */
/*  LiveActivityFeed component                                        */
/* ------------------------------------------------------------------ */

export function LiveActivityFeed({
  className,
  maxItems,
  compact = false,
}: {
  className?: string;
  maxItems?: number;
  compact?: boolean;
}) {
  const { events: allEvents, loading, newEventIds } = useLiveActivity();
  const events = maxItems ? allEvents.slice(0, maxItems) : allEvents;
  const [paused, setPaused] = useState(false);

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center gap-2 mb-3">
          <span className="live-dot" />
          <span className="text-xs font-semibold text-text-tertiary">Live Activity</span>
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="animate-pulse border-l-2 border-border pl-3 py-2">
            <div className="h-3 w-32 bg-surface-tertiary rounded mb-1" />
            <div className="h-2.5 w-48 bg-surface-tertiary rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className={cn("", className)}>
        <div className="flex items-center gap-2 mb-3">
          <span className="live-dot" />
          <span className="text-xs font-semibold text-text-tertiary">Live Activity</span>
        </div>
        <p className="text-xs text-text-tertiary text-center py-6">
          No recent activity detected
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn("", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("live-dot", paused && "opacity-50")} />
          <span className="text-xs font-semibold text-text-tertiary">
            Live Activity
          </span>
        </div>
        {paused && (
          <span className="text-[10px] text-text-tertiary">Paused</span>
        )}
      </div>

      <div className="space-y-1">
        {events.map((event) => {
          const config = EVENT_CONFIG[event.type];
          const isNew = newEventIds.has(event.id);

          return (
            <div
              key={event.id}
              className={cn(
                "border-l-2 pl-3 py-2 transition-all duration-500",
                config.color,
                isNew && "bg-accent/5 animate-pulse",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm" aria-hidden="true">{config.icon}</span>
                  <span className="text-xs font-semibold text-text-primary">
                    {event.title}
                  </span>
                </div>
                <span className="text-[10px] text-text-tertiary shrink-0">
                  {timeAgo(event.timestamp)}
                </span>
              </div>
              <p className={cn("text-[11px] text-text-tertiary mt-0.5 line-clamp-1", compact && "hidden")}>
                {event.description}
              </p>
              {event.amount && (
                <span className="inline-block mt-1 text-[10px] font-semibold text-text-secondary bg-surface-tertiary px-1.5 py-0.5 rounded">
                  {event.amount}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LiveActivityFeed;
