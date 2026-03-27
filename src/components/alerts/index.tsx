/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type ReactNode,
} from "react";
import { useToast } from "@/components/Toast";

/* ───────── Types ───────── */

export type AlertType =
  | "price_above"
  | "price_below"
  | "percent_change"
  | "volume_spike"
  | "recurring";

export type AlertPriority = "low" | "medium" | "high" | "critical";

export interface Alert {
  id: string;
  type: AlertType;
  coinId: string;
  coinName: string;
  target: number;
  enabled: boolean;
  createdAt: string;
  /** Optional note / label for the user */
  note: string;
  /** Priority level — affects notification style */
  priority: AlertPriority;
  /** For recurring alerts: re-enable after cooldown (ms). 0 = one-shot */
  cooldownMs: number;
  /** ISO timestamp when alert last fired (null if never) */
  lastTriggeredAt: string | null;
  /** How many times this alert has fired */
  triggerCount: number;
  /** Optional expiry date — alert auto-disables after this (ISO) */
  expiresAt: string | null;
}

export interface TriggeredAlert extends Alert {
  triggeredAt: string;
  currentPrice: number;
}

export interface AlertStats {
  total: number;
  enabled: number;
  triggered: number;
  mostTriggered: Alert | null;
}

interface AlertsContextType {
  alerts: Alert[];
  addAlert: (config: Omit<Alert, "id" | "createdAt" | "lastTriggeredAt" | "triggerCount">) => void;
  removeAlert: (id: string) => void;
  updateAlert: (id: string, updates: Partial<Alert>) => void;
  duplicateAlert: (id: string) => void;
  toggleAlert: (id: string) => void;
  bulkToggle: (ids: string[], enabled: boolean) => void;
  bulkDelete: (ids: string[]) => void;
  triggered: TriggeredAlert[];
  clearTriggered: () => void;
  removeTriggered: (index: number) => void;
  /** Live prices from last poll */
  livePrices: Record<string, { usd: number; usd_24h_change?: number; usd_24h_vol?: number }>;
  /** Computed stats */
  stats: AlertStats;
  /** Whether notification permission has been granted */
  notificationsGranted: boolean;
  /** Request notification permission */
  requestNotifications: () => Promise<boolean>;
  /** ISO timestamp of last successful price check */
  lastCheckedAt: string | null;
  /** Import/export alerts as JSON */
  exportAlerts: () => string;
  importAlerts: (json: string) => { imported: number; errors: number };
}

const AlertsContext = createContext<AlertsContextType>({
  alerts: [],
  addAlert: () => {},
  removeAlert: () => {},
  updateAlert: () => {},
  duplicateAlert: () => {},
  toggleAlert: () => {},
  bulkToggle: () => {},
  bulkDelete: () => {},
  triggered: [],
  clearTriggered: () => {},
  removeTriggered: () => {},
  livePrices: {},
  stats: { total: 0, enabled: 0, triggered: 0, mostTriggered: null },
  notificationsGranted: false,
  requestNotifications: async () => false,
  lastCheckedAt: null,
  exportAlerts: () => "[]",
  importAlerts: () => ({ imported: 0, errors: 0 }),
});

export function useAlerts() {
  return useContext(AlertsContext);
}

/* ───────── Constants ───────── */

const STORAGE_KEY = "fcn-alerts";
const TRIGGERED_KEY = "fcn-alerts-triggered";
const MAX_ALERTS = 50;
const POLL_INTERVAL = 30_000; // 30 seconds for faster response
const TRIGGERED_MAX = 100;

/* ───────── Helpers ───────── */

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — silently ignore */
  }
}

function createAlertId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const PRIORITY_LABELS: Record<AlertPriority, string> = {
  low: "🔵",
  medium: "🟡",
  high: "🟠",
  critical: "🔴",
};

/* ───────── Provider ───────── */

export function AlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<Alert[]>(() =>
    loadFromStorage<Alert[]>(STORAGE_KEY, []),
  );
  const [triggered, setTriggered] = useState<TriggeredAlert[]>(() =>
    loadFromStorage<TriggeredAlert[]>(TRIGGERED_KEY, []),
  );
  const [livePrices, setLivePrices] = useState<
    Record<string, { usd: number; usd_24h_change?: number; usd_24h_vol?: number }>
  >({});
  const [notificationsGranted, setNotificationsGranted] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);

  const { addToast } = useToast();
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  /* Check initial notification permission */
  useEffect(() => {
    if (typeof Notification !== "undefined") {
      setNotificationsGranted(Notification.permission === "granted");
    }
  }, []);

  /* Persist alerts */
  useEffect(() => {
    saveToStorage(STORAGE_KEY, alerts);
  }, [alerts]);

  /* Persist triggered */
  useEffect(() => {
    saveToStorage(TRIGGERED_KEY, triggered);
  }, [triggered]);

  /* Auto-expire alerts */
  useEffect(() => {
    const now = new Date().toISOString();
    const expired = alerts.filter(
      (a) => a.expiresAt && a.enabled && a.expiresAt < now,
    );
    if (expired.length > 0) {
      setAlerts((prev) =>
        prev.map((a) =>
          expired.some((e) => e.id === a.id) ? { ...a, enabled: false } : a,
        ),
      );
      for (const e of expired) {
        addToast(`Alert for ${e.coinName} expired`, "info");
      }
    }
  }, [alerts, addToast]);

  /* ── Stats ── */
  const stats = useMemo<AlertStats>(() => {
    const mostTriggered =
      alerts.length > 0
        ? alerts.reduce((best, a) => (a.triggerCount > best.triggerCount ? a : best), alerts[0])
        : null;
    return {
      total: alerts.length,
      enabled: alerts.filter((a) => a.enabled).length,
      triggered: triggered.length,
      mostTriggered: mostTriggered && mostTriggered.triggerCount > 0 ? mostTriggered : null,
    };
  }, [alerts, triggered]);

  /* ── Mutators ── */

  const addAlert = useCallback(
    (config: Omit<Alert, "id" | "createdAt" | "lastTriggeredAt" | "triggerCount">) => {
      setAlerts((prev) => {
        if (prev.length >= MAX_ALERTS) return prev;
        const alert: Alert = {
          ...config,
          id: createAlertId(),
          createdAt: new Date().toISOString(),
          lastTriggeredAt: null,
          triggerCount: 0,
        };
        return [...prev, alert];
      });
    },
    [],
  );

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const updateAlert = useCallback((id: string, updates: Partial<Alert>) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    );
  }, []);

  const duplicateAlert = useCallback((id: string) => {
    setAlerts((prev) => {
      if (prev.length >= MAX_ALERTS) return prev;
      const source = prev.find((a) => a.id === id);
      if (!source) return prev;
      const dup: Alert = {
        ...source,
        id: createAlertId(),
        createdAt: new Date().toISOString(),
        lastTriggeredAt: null,
        triggerCount: 0,
        note: source.note ? `${source.note} (copy)` : "(copy)",
      };
      return [...prev, dup];
    });
  }, []);

  const toggleAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );
  }, []);

  const bulkToggle = useCallback((ids: string[], enabled: boolean) => {
    setAlerts((prev) =>
      prev.map((a) => (ids.includes(a.id) ? { ...a, enabled } : a)),
    );
  }, []);

  const bulkDelete = useCallback((ids: string[]) => {
    setAlerts((prev) => prev.filter((a) => !ids.includes(a.id)));
  }, []);

  const clearTriggered = useCallback(() => {
    setTriggered([]);
  }, []);

  const removeTriggered = useCallback((index: number) => {
    setTriggered((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const requestNotifications = useCallback(async () => {
    if (typeof Notification === "undefined") return false;
    try {
      const result = await Notification.requestPermission();
      const granted = result === "granted";
      setNotificationsGranted(granted);
      if (granted) addToast("Notifications enabled!", "success");
      return granted;
    } catch {
      return false;
    }
  }, [addToast]);

  const exportAlerts = useCallback(() => {
    return JSON.stringify({ alerts, triggered, exportedAt: new Date().toISOString() }, null, 2);
  }, [alerts, triggered]);

  const importAlerts = useCallback(
    (json: string): { imported: number; errors: number } => {
      try {
        const data = JSON.parse(json);
        const incoming: Alert[] = Array.isArray(data.alerts) ? data.alerts : Array.isArray(data) ? data : [];
        let imported = 0;
        let errors = 0;
        setAlerts((prev) => {
          const existing = new Set(prev.map((a) => a.id));
          const newAlerts = [];
          for (const a of incoming) {
            if (prev.length + newAlerts.length >= MAX_ALERTS) break;
            if (!a.id || !a.coinId || !a.type) { errors++; continue; }
            if (existing.has(a.id)) { errors++; continue; }
            newAlerts.push({ ...a, id: createAlertId() }); // new ID to avoid conflicts
            imported++;
          }
          return [...prev, ...newAlerts];
        });
        return { imported, errors };
      } catch {
        return { imported: 0, errors: 1 };
      }
    },
    [],
  );

  /* ── Background polling ── */

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;

    async function check() {
      const current = alertsRef.current;
      const enabled = current.filter((a) => a.enabled);
      if (enabled.length === 0) return;

      const coinIds = [...new Set(enabled.map((a) => a.coinId))];

      try {
        const res = await fetch(`/api/prices?coins=${coinIds.join(",")}`);
        if (!res.ok) return;
        const data: Record<
          string,
          { usd?: number; usd_24h_change?: number; usd_24h_vol?: number }
        > = await res.json();

        setLastCheckedAt(new Date().toISOString());
        // Store live prices for UI display
        setLivePrices((prev) => ({ ...prev, ...data } as typeof prev));

        const nowTriggered: TriggeredAlert[] = [];
        const now = Date.now();

        for (const alert of enabled) {
          const coin = data[alert.coinId];
          if (!coin?.usd) continue;

          // Cooldown check — skip if still in cooldown window
          if (
            alert.cooldownMs > 0 &&
            alert.lastTriggeredAt &&
            now - new Date(alert.lastTriggeredAt).getTime() < alert.cooldownMs
          ) {
            continue;
          }

          let fired = false;
          if (alert.type === "price_above" && coin.usd >= alert.target) {
            fired = true;
          } else if (alert.type === "price_below" && coin.usd <= alert.target) {
            fired = true;
          } else if (
            alert.type === "percent_change" &&
            coin.usd_24h_change != null &&
            Math.abs(coin.usd_24h_change) >= alert.target
          ) {
            fired = true;
          } else if (
            alert.type === "volume_spike" &&
            coin.usd_24h_vol != null &&
            coin.usd_24h_vol >= alert.target
          ) {
            fired = true;
          }

          if (fired) {
            nowTriggered.push({
              ...alert,
              triggeredAt: new Date().toISOString(),
              currentPrice: coin.usd,
            });
          }
        }

        if (nowTriggered.length > 0) {
          setAlerts((prev) =>
            prev.map((a) => {
              const t = nowTriggered.find((tr) => tr.id === a.id);
              if (!t) return a;

              // Recurring alert: keep enabled, update metadata
              if (a.cooldownMs > 0) {
                return {
                  ...a,
                  lastTriggeredAt: new Date().toISOString(),
                  triggerCount: a.triggerCount + 1,
                };
              }
              // One-shot: disable
              return {
                ...a,
                enabled: false,
                lastTriggeredAt: new Date().toISOString(),
                triggerCount: a.triggerCount + 1,
              };
            }),
          );

          setTriggered((prev) => [...nowTriggered, ...prev].slice(0, TRIGGERED_MAX));

          for (const t of nowTriggered) {
            const emoji = PRIORITY_LABELS[t.priority] ?? "🔔";
            const label =
              t.type === "price_above"
                ? `above $${t.target.toLocaleString()}`
                : t.type === "price_below"
                  ? `below $${t.target.toLocaleString()}`
                  : t.type === "volume_spike"
                    ? `volume $${t.target.toLocaleString()}`
                    : `${t.target}% change`;

            const msg = `${emoji} ${t.coinName} hit ${label} — now $${t.currentPrice.toLocaleString()}`;
            addToast(msg, t.priority === "critical" ? "error" : "success");

            /* Browser notification */
            if (
              typeof Notification !== "undefined" &&
              Notification.permission === "granted"
            ) {
              try {
                new Notification(`${emoji} Price Alert: ${t.coinName}`, {
                  body: `${t.coinName} hit ${label}\nCurrent: $${t.currentPrice.toLocaleString()}`,
                  tag: `alert-${t.id}`,
                  icon: "/icons/icon-192x192.png",
                });
              } catch {
                /* ignore */
              }
            }

            /* Play sound for critical alerts */
            if (t.priority === "critical" && typeof Audio !== "undefined") {
              try {
                const audio = new Audio("/sounds/alert.mp3");
                audio.volume = 0.3;
                audio.play().catch(() => {});
              } catch {
                /* ignore */
              }
            }
          }
        }
      } catch {
        /* network error — silently retry next tick */
      }
    }

    check();
    timer = setInterval(check, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [addToast]);

  return (
    <AlertsContext
      value={{
        alerts,
        addAlert,
        removeAlert,
        updateAlert,
        duplicateAlert,
        toggleAlert,
        bulkToggle,
        bulkDelete,
        triggered,
        clearTriggered,
        removeTriggered,
        livePrices,
        stats,
        notificationsGranted,
        requestNotifications,
        lastCheckedAt,
        exportAlerts,
        importAlerts,
      }}
    >
      {children}
    </AlertsContext>
  );
}

