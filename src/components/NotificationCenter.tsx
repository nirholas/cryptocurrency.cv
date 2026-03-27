"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import {
  Bell,
  BellOff,
  X,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Trash2,
  Check,
  CheckCheck,
  Settings,
  Volume2,
  VolumeX,
  ChevronRight,
  Info,
  Newspaper,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useAlerts, type TriggeredAlert } from "@/components/alerts";
import { Link } from "@/i18n/navigation";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export type NotificationType =
  | "breaking"
  | "price_alert"
  | "market_mover"
  | "system"
  | "digest"
  | "alert_triggered"
  | "whale_move"
  | "price_milestone"
  | "market_shift";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  icon?: string;
  url?: string;
  meta?: Record<string, unknown>;
}

type GroupLabel = "Today" | "Yesterday" | "This Week" | "Earlier";

const STORAGE_KEY = "fcn-notifications";
const MAX_NOTIFICATIONS = 100;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function loadNotifications(): AppNotification[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_NOTIFICATIONS) : [];
  } catch {
    return [];
  }
}

function saveNotifications(notifications: AppNotification[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(notifications.slice(0, MAX_NOTIFICATIONS))
  );
}

function getGroup(timestamp: string): GroupLabel {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= weekAgo) return "This Week";
  return "Earlier";
}

function groupNotifications(
  notifications: AppNotification[]
): { label: GroupLabel; items: AppNotification[] }[] {
  const groups: Record<GroupLabel, AppNotification[]> = {
    Today: [],
    Yesterday: [],
    "This Week": [],
    Earlier: [],
  };

  for (const n of notifications) {
    groups[getGroup(n.timestamp)].push(n);
  }

  const order: GroupLabel[] = ["Today", "Yesterday", "This Week", "Earlier"];
  return order
    .filter((label) => groups[label].length > 0)
    .map((label) => ({ label, items: groups[label] }));
}

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

function notificationIcon(type: NotificationType): ReactNode {
  switch (type) {
    case "breaking":
      return <Zap className="h-4 w-4 text-red-500" aria-hidden="true" />;
    case "price_alert":
    case "alert_triggered":
      return <TrendingUp className="h-4 w-4 text-amber-500" aria-hidden="true" />;
    case "market_mover":
    case "market_shift":
      return <AlertTriangle className="h-4 w-4 text-orange-500" aria-hidden="true" />;
    case "whale_move":
      return <TrendingDown className="h-4 w-4 text-blue-500" aria-hidden="true" />;
    case "price_milestone":
      return <TrendingUp className="h-4 w-4 text-emerald-500" aria-hidden="true" />;
    case "digest":
      return <Newspaper className="h-4 w-4 text-accent" aria-hidden="true" />;
    case "system":
      return <Info className="h-4 w-4 text-blue-500" aria-hidden="true" />;
    default:
      return <Bell className="h-4 w-4 text-text-tertiary" aria-hidden="true" />;
  }
}

/* ------------------------------------------------------------------ */
/*  External API for adding notifications programmatically             */
/* ------------------------------------------------------------------ */

let _externalListener: ((n: AppNotification) => void) | null = null;

/**
 * Add a notification from anywhere in the app.
 * Will persist to localStorage and update the open NotificationCenter.
 */
export function addNotification(
  notification: Omit<AppNotification, "id" | "timestamp" | "read">
): AppNotification {
  const full: AppNotification = {
    ...notification,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };

  const existing = loadNotifications();
  const updated = [full, ...existing].slice(0, MAX_NOTIFICATIONS);
  saveNotifications(updated);

  // Notify open component
  _externalListener?.(full);

  return full;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function NotificationCenter() {
  const t = useTranslations("notifications");
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { triggered: triggeredAlerts } = useAlerts();
  const prevTriggeredCountRef = useRef(0);

  // Load from localStorage
  useEffect(() => {
    setNotifications(loadNotifications());
    try {
      const sound = localStorage.getItem("fcn-notification-sound");
      if (sound !== null) setSoundEnabled(sound === "true");
    } catch {
      // ignore
    }
  }, []);

  // Listen for external additions
  useEffect(() => {
    _externalListener = (n: AppNotification) => {
      setNotifications((prev) => [n, ...prev].slice(0, MAX_NOTIFICATIONS));
    };
    return () => {
      _externalListener = null;
    };
  }, []);

  // Cross-tab sync via storage events
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setNotifications(loadNotifications());
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  // Persist helper
  const persist = useCallback((notifs: AppNotification[]) => {
    saveNotifications(notifs);
  }, []);

  // Sync triggered alerts → notifications
  useEffect(() => {
    if (triggeredAlerts.length > prevTriggeredCountRef.current) {
      const newAlerts = triggeredAlerts.slice(
        0,
        triggeredAlerts.length - prevTriggeredCountRef.current
      );

      const newNotifs: AppNotification[] = newAlerts.map((a: TriggeredAlert) => ({
        id: `alert-${a.id}-${a.triggeredAt}`,
        type: "price_alert" as NotificationType,
        title: `${a.coinName} Alert Triggered`,
        message: `${a.coinName} ${a.type === "price_above" ? "above" : a.type === "price_below" ? "below" : "changed"} $${a.currentPrice.toLocaleString()}`,
        timestamp: a.triggeredAt,
        read: false,
        url: "/alerts",
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
              const notif: AppNotification = {
                id,
                type: "market_mover",
                title: "Trending Now",
                message: `${topCoin.name} is trending — ${topCoin.score ? `Score: ${topCoin.score}` : "high interest"}`,
                timestamp: new Date().toISOString(),
                read: false,
                url: topCoin.id ? `/coin/${topCoin.id}` : undefined,
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
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
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

  const grouped = useMemo(() => groupNotifications(filtered), [filtered]);

  const groupLabels: Record<string, string> = {
    Today: t("today"),
    Yesterday: t("yesterday"),
    "This Week": t("thisWeek"),
    Earlier: t("earlier"),
  };

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

  const removeOne = useCallback(
    (id: string) => {
      setNotifications((prev) => {
        const updated = prev.filter((n) => n.id !== id);
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
    <div className="relative">
      {/* Bell trigger */}
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className={cn(
          "relative p-2 rounded-md transition-colors cursor-pointer",
          "hover:bg-surface-secondary text-text-secondary",
          open && "bg-surface-secondary text-text-primary"
        )}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        title="Notifications"
      >
        <Bell className="h-4.5 w-4.5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none animate-[scaleIn_0.2s_ease-out]">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className={cn(
            "absolute right-0 top-full mt-2 z-[60]",
            "w-[380px] max-h-[520px] overflow-hidden rounded-xl",
            "border border-border bg-(--color-surface) shadow-2xl",
            "flex flex-col",
            "animate-dropdown"
          )}
          role="dialog"
          aria-label="Notification Center"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-text-primary">
              {t("title")}
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center rounded-full bg-red-500/10 text-red-500 px-2 py-0.5 text-xs font-medium">
                  {unreadCount}
                </span>
              )}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={toggleSound}
                className="p-1.5 rounded-md hover:bg-surface-secondary text-text-tertiary transition-colors cursor-pointer"
                title={soundEnabled ? t("mute") : t("unmute")}
                aria-label={soundEnabled ? "Mute notifications" : "Unmute notifications"}
              >
                {soundEnabled ? (
                  <Volume2 className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </button>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="p-1.5 rounded-md hover:bg-surface-secondary text-text-tertiary transition-colors cursor-pointer"
                  title={t("markAllRead")}
                  aria-label="Mark all as read"
                >
                  <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="p-1.5 rounded-md hover:bg-surface-secondary text-text-tertiary hover:text-red-500 transition-colors cursor-pointer"
                  title={t("clearAll")}
                  aria-label="Clear all notifications"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
              <Link
                href="/notifications"
                className="p-1.5 rounded-md hover:bg-surface-secondary text-text-tertiary transition-colors"
                title={t("preferences")}
                aria-label={t("preferences")}
                onClick={() => setOpen(false)}
              >
                <Settings className="h-3.5 w-3.5" aria-hidden="true" />
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
                    ? "bg-accent text-white"
                    : "text-text-tertiary hover:bg-surface-secondary"
                )}
              >
                {f === "all" ? t("all") : t("unread", { count: unreadCount })}
              </button>
            ))}
          </div>

          {/* Notification list — grouped */}
          <div className="flex-1 overflow-y-auto overscroll-contain py-1">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BellOff className="h-10 w-10 text-text-tertiary mb-3 opacity-40" aria-hidden="true" />
                <p className="text-sm font-medium text-text-secondary">
                  {filter === "unread" ? t("noUnread") : t("empty")}
                </p>
                <p className="text-xs text-text-tertiary mt-1">
                  {t("emptyHint")}
                </p>
              </div>
            ) : (
              grouped.map((group) => (
                <div key={group.label}>
                  <div className="sticky top-0 bg-surface-secondary px-4 py-1.5 text-[10px] font-semibold text-text-tertiary uppercase tracking-wider">
                    {groupLabels[group.label] ?? group.label}
                  </div>
                  {group.items.map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onMarkRead={markRead}
                      onRemove={removeOne}
                      onClose={() => setOpen(false)}
                    />
                  ))}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2.5">
              <Link
                href="/notifications"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center gap-1 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
              >
                {t("preferences")}
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
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

/* ------------------------------------------------------------------ */
/*  Notification Item                                                  */
/* ------------------------------------------------------------------ */

function NotificationItem({
  notification,
  onMarkRead,
  onRemove,
  onClose,
}: {
  notification: AppNotification;
  onMarkRead: (id: string) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const handleClick = () => {
    if (!notification.read) onMarkRead(notification.id);
    if (notification.url) onClose();
  };

  const content = (
    <div
      className={cn(
        "group flex items-start gap-3 px-4 py-3 transition-colors",
        "hover:bg-surface-secondary",
        !notification.read && "bg-accent/5"
      )}
    >
      {/* Icon */}
      <div className="mt-0.5 flex-shrink-0">
        {notificationIcon(notification.type)}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={cn(
              "text-sm leading-snug",
              notification.read
                ? "text-text-secondary"
                : "text-text-primary font-semibold"
            )}
          >
            {notification.title}
          </p>
          {!notification.read && (
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-accent" />
          )}
        </div>
        <p className="text-xs text-text-tertiary mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-[10px] text-text-tertiary mt-1">
          {timeAgo(notification.timestamp)}
        </p>
      </div>

      {/* Hover actions */}
      <div className="flex-shrink-0 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {!notification.read && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            className="p-1 rounded text-text-tertiary hover:text-accent transition-colors cursor-pointer"
            aria-label="Mark as read"
            title="Mark as read"
          >
            <Check className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove(notification.id);
          }}
          className="p-1 rounded text-text-tertiary hover:text-red-500 transition-colors cursor-pointer"
          aria-label="Remove notification"
          title="Remove"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  if (notification.url) {
    return (
      <Link href={notification.url} onClick={handleClick} className="block">
        {content}
      </Link>
    );
  }

  return (
    <button onClick={handleClick} className="w-full text-left cursor-pointer">
      {content}
    </button>
  );
}
