"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Bell,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Trash2,
  Check,
  Settings,
  Volume2,
  VolumeX,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAlerts, type TriggeredAlert } from "@/components/alerts";
import { Link } from "@/i18n/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | "alert_triggered"
  | "whale_move"
  | "price_milestone"
  | "market_shift"
  | "system";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon?: string;
  href?: string;
  meta?: Record<string, unknown>;
}

const STORAGE_KEY = "fcn-notifications";
const MAX_NOTIFICATIONS = 100;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function notificationIcon(type: NotificationType) {
  switch (type) {
    case "alert_triggered":
      return <Zap className="h-4 w-4 text-amber-500" />;
    case "whale_move":
      return <AlertTriangle className="h-4 w-4 text-blue-500" />;
    case "price_milestone":
      return <TrendingUp className="h-4 w-4 text-emerald-500" />;
    case "market_shift":
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    case "system":
      return <Bell className="h-4 w-4 text-[var(--color-text-tertiary)]" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const { triggeredAlerts } = useAlerts();
  const prevTriggeredCountRef = useRef(0);

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
      const sound = localStorage.getItem("fcn-notification-sound");
      if (sound !== null) setSoundEnabled(sound === "true");
    } catch {
      // ignore
    }
  }, []);

  // Persist to localStorage
  const persist = useCallback((notifs: Notification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(notifs.slice(0, MAX_NOTIFICATIONS)));
    } catch {
      // ignore
    }
  }, []);

  // Sync triggered alerts → notifications
  useEffect(() => {
    if (triggeredAlerts.length > prevTriggeredCountRef.current) {
      const newAlerts = triggeredAlerts.slice(
        0,
        triggeredAlerts.length - prevTriggeredCountRef.current
      );

      const newNotifs: Notification[] = newAlerts.map((a: TriggeredAlert) => ({
        id: `alert-${a.id}-${a.triggeredAt}`,
        type: "alert_triggered" as NotificationType,
        title: `${a.coinName} Alert Triggered`,
        message: `${a.coinName} ${a.type === "price_above" ? "above" : a.type === "price_below" ? "below" : "changed"} $${a.currentPrice.toLocaleString()}`,
        timestamp: a.triggeredAt,
        read: false,
        href: "/alerts",
        meta: { coinId: a.coinId, price: a.currentPrice },
      }));

      if (newNotifs.length > 0) {
        setNotifications((prev) => {
          const updated = [...newNotifs, ...prev].slice(0, MAX_NOTIFICATIONS);
          persist(updated);
          return updated;
        });
      }
    }
    prevTriggeredCountRef.current = triggeredAlerts.length;
  }, [triggeredAlerts, persist]);

  // Fetch market milestones periodically
  useEffect(() => {
    let cancelled = false;

    async function checkMarketMilestones() {
      try {
        const res = await fetch("/api/trending");
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const coins = data?.coins || data?.trending || [];

        if (coins.length > 0) {
          const topCoin = coins[0]?.item || coins[0];
          if (topCoin?.name) {
            const id = `trending-${topCoin.id || topCoin.name}-${new Date().toISOString().slice(0, 13)}`;
            setNotifications((prev) => {
              if (prev.some((n) => n.id === id)) return prev;
              const notif: Notification = {
                id,
                type: "market_shift",
                title: "Trending Now",
                message: `${topCoin.name} is trending — ${topCoin.score ? `Score: ${topCoin.score}` : "high interest"}`,
                timestamp: new Date().toISOString(),
                read: false,
                href: topCoin.id ? `/coin/${topCoin.id}` : undefined,
              };
              const updated = [notif, ...prev].slice(0, MAX_NOTIFICATIONS);
              persist(updated);
              return updated;
            });
          }
        }
      } catch {
        // non-critical
      }
    }

    checkMarketMilestones();
    const interval = setInterval(checkMarketMilestones, 600_000); // every 10 min
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [persist]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const filtered = useMemo(
    () =>
      filter === "unread"
        ? notifications.filter((n) => !n.read)
        : notifications,
    [notifications, filter]
  );

  const markAllRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      persist(updated);
      return updated;
    });
  }, [persist]);

  const markRead = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.map((n) =>
          n.id === id ? { ...n, read: true } : n
        );
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
    persist([]);
  }, [persist]);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("fcn-notification-sound", String(next));
      return next;
    });
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] transition-colors cursor-pointer"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        title="Notifications"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-[380px] max-h-[520px] bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-2xl z-[60] flex flex-col animate-dropdown overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-bold">Notifications</h3>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] transition-colors cursor-pointer"
                title={soundEnabled ? "Mute" : "Unmute"}
              >
                {soundEnabled ? (
                  <Volume2 className="h-3.5 w-3.5" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" />
                )}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] transition-colors cursor-pointer"
                  title="Mark all read"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] transition-colors cursor-pointer"
                  title="Clear all"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <Link
                href="/settings"
                className="p-1.5 rounded-md hover:bg-[var(--color-surface-secondary)] text-[var(--color-text-tertiary)] transition-colors"
                title="Settings"
                onClick={() => setOpen(false)}
              >
                <Settings className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          {/* Filter tabs */}
          <div className="flex px-4 pt-2 gap-2">
            {(["all", "unread"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full transition-colors cursor-pointer",
                  filter === f
                    ? "bg-[var(--color-accent)] text-white"
                    : "text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-secondary)]"
                )}
              >
                {f === "all" ? "All" : `Unread (${unreadCount})`}
              </button>
            ))}
          </div>

          {/* Notification list */}
          <div className="flex-1 overflow-y-auto py-2">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className="h-8 w-8 text-[var(--color-text-tertiary)] mb-3 opacity-40" />
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  {filter === "unread" ? "No unread notifications" : "No notifications yet"}
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Set up alerts to get notified
                </p>
              </div>
            ) : (
              filtered.map((notif) => {
                const inner = (
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors cursor-pointer",
                      !notif.read
                        ? "bg-[var(--color-accent)]/5 hover:bg-[var(--color-accent)]/10"
                        : "hover:bg-[var(--color-surface-secondary)]"
                    )}
                    onClick={() => markRead(notif.id)}
                  >
                    <div className="shrink-0 mt-0.5">
                      {notificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={cn(
                          "text-sm truncate",
                          !notif.read ? "font-semibold" : "font-medium"
                        )}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-[var(--color-accent)] shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                        {timeAgo(notif.timestamp)}
                      </p>
                    </div>
                    {notif.href && (
                      <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)] shrink-0 self-center" />
                    )}
                  </div>
                );

                return notif.href ? (
                  <Link
                    key={notif.id}
                    href={notif.href}
                    onClick={() => {
                      markRead(notif.id);
                      setOpen(false);
                    }}
                    className="block"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={notif.id}>{inner}</div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-[var(--color-border)] px-4 py-2.5">
              <Link
                href="/alerts"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] transition-colors"
              >
                Manage Alerts
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes dropdown-in {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-dropdown {
          animation: dropdown-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
