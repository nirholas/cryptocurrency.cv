/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CookieConsent } from "@/components/CookieConsent";
import { BottomNav } from "@/components/BottomNav";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { UpdatePrompt } from "@/components/UpdatePrompt";

/* ─── Network quality detection ─── */

type NetworkQuality = "4g" | "3g" | "2g" | "slow-2g" | "offline" | "unknown";

interface CacheStatus {
  totalEntries: number;
  caches: Record<string, number>;
  version: string;
}

/* ─── Context type ─── */

export interface PWAContextValue {
  /** Whether the app is installed as a standalone PWA */
  isInstalled: boolean;
  /** Whether a deferred A2HS prompt is available */
  canInstall: boolean;
  /** Whether a new SW version is installed and waiting */
  isUpdateAvailable: boolean;
  /** Whether the device is currently online */
  isOnline: boolean;
  /** Detected network quality via Network Information API */
  networkQuality: NetworkQuality;
  /** Whether notifications are permitted */
  notificationPermission: NotificationPermission | "unsupported";
  /** Trigger the A2HS install prompt */
  promptInstall: () => Promise<boolean>;
  /** Tell the waiting SW to skipWaiting + reload */
  applyUpdate: () => void;
  /** Dismiss the update prompt (snooze for this session) */
  dismissUpdate: () => void;
  /** Request notification permission */
  requestNotifications: () => Promise<boolean>;
  /** Clear all SW caches */
  clearCache: () => Promise<void>;
  /** Current SW cache status (lazy-loaded) */
  cacheStatus: CacheStatus | null;
  /** Force-check for a new SW update */
  checkForUpdate: () => Promise<void>;
  /** Whether an update check is in progress */
  isCheckingUpdate: boolean;
}

const PWAContext = createContext<PWAContextValue>({
  isInstalled: false,
  canInstall: false,
  isUpdateAvailable: false,
  isOnline: true,
  networkQuality: "unknown",
  notificationPermission: "unsupported",
  promptInstall: async () => false,
  applyUpdate: () => {},
  dismissUpdate: () => {},
  requestNotifications: async () => false,
  clearCache: async () => {},
  cacheStatus: null,
  checkForUpdate: async () => {},
  isCheckingUpdate: false,
});

export function usePWA() {
  return useContext(PWAContext);
}

/* ─── Helpers ─── */

function getNetworkQuality(): NetworkQuality {
  if (typeof navigator === "undefined") return "unknown";
  if (!navigator.onLine) return "offline";
  const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
  if (conn?.effectiveType) return conn.effectiveType as NetworkQuality;
  return "unknown";
}

/** Communicate with the SW via MessageChannel for a response */
async function sendSWMessage<T>(msg: Record<string, unknown>): Promise<T | null> {
  const reg = await navigator.serviceWorker?.ready;
  if (!reg?.active) return null;
  return new Promise((resolve) => {
    const ch = new MessageChannel();
    const t = setTimeout(() => resolve(null), 3000);
    ch.port1.onmessage = (e) => {
      clearTimeout(t);
      resolve(e.data as T);
    };
    reg.active!.postMessage(msg, [ch.port2]);
  });
}

/* ─── Auto-update interval (check every 60 min) ─── */

const UPDATE_CHECK_INTERVAL = 60 * 60 * 1000;

/* ─── Provider ─── */

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [isUpdateDismissed, setIsUpdateDismissed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>("unknown");
  const [notificationPermission, setNotificationPermission] = useState<
    NotificationPermission | "unsupported"
  >("unsupported");
  const [cacheStatus, setCacheStatus] = useState<CacheStatus | null>(null);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const deferredPromptRef = useRef<any>(null);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);

  /* ── Online / network quality ── */
  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    setNetworkQuality(getNetworkQuality());

    const handleOnline = () => {
      setIsOnline(true);
      setNetworkQuality(getNetworkQuality());
    };
    const handleOffline = () => {
      setIsOnline(false);
      setNetworkQuality("offline");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for effectiveType changes
    const conn = (navigator as Navigator & { connection?: EventTarget }).connection;
    const handleConnectionChange = () => setNetworkQuality(getNetworkQuality());
    conn?.addEventListener?.("change", handleConnectionChange);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      conn?.removeEventListener?.("change", handleConnectionChange);
    };
  }, []);

  /* ── Notification permission ── */
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  /* ── Main SW + install logic ── */
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    // Standalone detection
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(
      mq.matches ||
        ("standalone" in navigator &&
          !!(navigator as unknown as { standalone: boolean }).standalone)
    );
    const handleDisplayChange = (e: MediaQueryListEvent) => setIsInstalled(e.matches);
    mq.addEventListener("change", handleDisplayChange);

    // A2HS prompt capture
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPromptRef.current = e;
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    const handleAppInstalled = () => {
      setIsInstalled(true);
      deferredPromptRef.current = null;
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        registrationRef.current = registration;

        // Check for waiting worker on load
        if (registration.waiting) {
          waitingWorkerRef.current = registration.waiting;
          setIsUpdateAvailable(true);
        }

        // Listen for new updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              waitingWorkerRef.current = newWorker;
              setIsUpdateAvailable(true);
              setIsUpdateDismissed(false);
            }
          });
        });

        // Fetch cache status lazily
        sendSWMessage<CacheStatus>({ type: "GET_CACHE_STATUS" }).then((s) => {
          if (s) setCacheStatus(s);
        });
      })
      .catch((err) => console.warn("[PWA] SW registration failed:", err));

    // Periodic update checks
    const interval = setInterval(() => {
      registrationRef.current?.update().catch(() => {});
    }, UPDATE_CHECK_INTERVAL);

    // Reload on controller change
    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      clearInterval(interval);
      mq.removeEventListener("change", handleDisplayChange);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      navigator.serviceWorker.removeEventListener("controllerchange", handleControllerChange);
    };
  }, []);

  /* ── Actions ── */

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return false;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    deferredPromptRef.current = null;
    if (outcome === "accepted") {
      setIsInstalled(true);
      return true;
    }
    return false;
  }, []);

  const applyUpdate = useCallback(() => {
    const worker = waitingWorkerRef.current;
    if (!worker) return;
    worker.postMessage({ type: "SKIP_WAITING" });
    setIsUpdateAvailable(false);
    waitingWorkerRef.current = null;
  }, []);

  const dismissUpdate = useCallback(() => {
    setIsUpdateDismissed(true);
  }, []);

  const requestNotifications = useCallback(async (): Promise<boolean> => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    return permission === "granted";
  }, []);

  const clearCache = useCallback(async () => {
    await sendSWMessage({ type: "CLEAR_CACHE" });
    setCacheStatus(null);
    const s = await sendSWMessage<CacheStatus>({ type: "GET_CACHE_STATUS" });
    if (s) setCacheStatus(s);
  }, []);

  const checkForUpdate = useCallback(async () => {
    if (!registrationRef.current) return;
    setIsCheckingUpdate(true);
    try {
      await registrationRef.current.update();
    } catch {
      /* network error during update check */
    } finally {
      setIsCheckingUpdate(false);
    }
  }, []);

  /* ── Memoised context value ── */

  const value = useMemo<PWAContextValue>(
    () => ({
      isInstalled,
      canInstall: !!deferredPromptRef.current,
      isUpdateAvailable: isUpdateAvailable && !isUpdateDismissed,
      isOnline,
      networkQuality,
      notificationPermission,
      promptInstall,
      applyUpdate,
      dismissUpdate,
      requestNotifications,
      clearCache,
      cacheStatus,
      checkForUpdate,
      isCheckingUpdate,
    }),
    [
      isInstalled,
      isUpdateAvailable,
      isUpdateDismissed,
      isOnline,
      networkQuality,
      notificationPermission,
      promptInstall,
      applyUpdate,
      dismissUpdate,
      requestNotifications,
      clearCache,
      cacheStatus,
      checkForUpdate,
      isCheckingUpdate,
    ]
  );

  return (
    <PWAContext.Provider value={value}>
      {children}
      <OfflineIndicator />
      <UpdatePrompt />
      <CookieConsent />
      <BottomNav />
    </PWAContext.Provider>
  );
}
