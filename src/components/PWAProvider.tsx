"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CookieConsent } from "@/components/CookieConsent";
import { BottomNav } from "@/components/BottomNav";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { UpdatePrompt } from "@/components/UpdatePrompt";

interface PWAContextValue {
  isInstalled: boolean;
  isUpdateAvailable: boolean;
  promptInstall: () => Promise<void>;
  applyUpdate: () => void;
}

const PWAContext = createContext<PWAContextValue>({
  isInstalled: false,
  isUpdateAvailable: false,
  promptInstall: async () => {},
  applyUpdate: () => {},
});

export function usePWA() {
  return useContext(PWAContext);
}

export function PWAProvider({ children }: { children: ReactNode }) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    any | null
  >(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(
    null
  );

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    // Check if already installed as PWA
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsInstalled(
      mq.matches || ("standalone" in navigator && !!(navigator as unknown as { standalone: boolean }).standalone)
    );
    const handleDisplayChange = (e: MediaQueryListEvent) =>
      setIsInstalled(e.matches);
    mq.addEventListener("change", handleDisplayChange);

    // Capture A2HS prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("appinstalled", handleAppInstalled);

    // Register service worker
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Check for waiting worker on load
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          setIsUpdateAvailable(true);
        }

        // Listen for new updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // New version installed but waiting
              setWaitingWorker(newWorker);
              setIsUpdateAvailable(true);
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[PWA] Service worker registration failed:", err);
      });

    // Reload when the new SW takes over
    let refreshing = false;
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange
    );

    return () => {
      mq.removeEventListener("change", handleDisplayChange);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange
      );
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  const applyUpdate = useCallback(() => {
    if (!waitingWorker) return;
    waitingWorker.postMessage({ type: "SKIP_WAITING" });
    setIsUpdateAvailable(false);
    setWaitingWorker(null);
  }, [waitingWorker]);

  const value = useMemo<PWAContextValue>(
    () => ({ isInstalled, isUpdateAvailable, promptInstall, applyUpdate }),
    [isInstalled, isUpdateAvailable, promptInstall, applyUpdate]
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
