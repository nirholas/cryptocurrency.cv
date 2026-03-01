"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { WifiOff, Wifi, Signal, RefreshCw } from "lucide-react";
import { usePWA } from "@/components/PWAProvider";

type Status = "online" | "offline" | "back-online";

/** How long to show the green "Back online!" flash */
const BACK_ONLINE_DURATION = 3000;

export function OfflineIndicator() {
  const [status, setStatus] = useState<Status>("online");
  const [offlineSince, setOfflineSince] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState("");
  const [retrying, setRetrying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined);
  const backOnlineRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const { networkQuality, cacheStatus } = usePWA();

  /* ── Online/offline listeners ── */
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!navigator.onLine) {
      setStatus("offline");
      setOfflineSince(Date.now());
    }

    const goOffline = () => {
      setStatus("offline");
      setOfflineSince(Date.now());
    };

    const goOnline = () => {
      setStatus("back-online");
      setOfflineSince(null);
      backOnlineRef.current = setTimeout(
        () => setStatus("online"),
        BACK_ONLINE_DURATION
      );
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);

    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
      if (backOnlineRef.current) clearTimeout(backOnlineRef.current);
    };
  }, []);

  /* ── Elapsed offline timer ── */
  useEffect(() => {
    if (status !== "offline" || !offlineSince) {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed("");
      return;
    }

    const update = () => {
      const diff = Math.floor((Date.now() - offlineSince) / 1000);
      if (diff < 60) setElapsed(`${diff}s`);
      else if (diff < 3600) setElapsed(`${Math.floor(diff / 60)}m`);
      else setElapsed(`${Math.floor(diff / 3600)}h`);
    };
    update();
    timerRef.current = setInterval(update, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, offlineSince]);

  /* ── Manual retry ── */
  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      // Ping a tiny endpoint to test connectivity
      await fetch("/api/health", { cache: "no-store", signal: AbortSignal.timeout(5000) });
      // If successful, force the online event
      window.dispatchEvent(new Event("online"));
    } catch {
      // Still offline
    } finally {
      setRetrying(false);
    }
  }, []);

  if (status === "online") return null;

  const isBackOnline = status === "back-online";
  const cachedCount = cacheStatus?.totalEntries ?? 0;
  const isSlowNetwork = networkQuality === "2g" || networkQuality === "slow-2g";

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        "animate-in slide-in-from-top"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center gap-2 px-4 py-1.5 text-center text-sm font-medium",
          isBackOnline
            ? "bg-green-500 text-white"
            : "bg-amber-500 text-amber-950"
        )}
      >
        {isBackOnline ? (
          <>
            <Wifi className="size-4" aria-hidden="true" />
            <span>Back online!</span>
          </>
        ) : (
          <>
            <WifiOff className="size-4 shrink-0" aria-hidden="true" />
            <span className="truncate">
              You are offline
              {elapsed && <span className="opacity-75"> ({elapsed})</span>}
              {cachedCount > 0 && (
                <span className="hidden opacity-75 sm:inline">
                  {" "}
                  &middot; {cachedCount} cached items available
                </span>
              )}
            </span>
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="ml-1 inline-flex items-center gap-1 rounded border border-amber-700/30 bg-amber-600/20 px-2 py-0.5 text-xs font-semibold transition-colors hover:bg-amber-600/30 disabled:opacity-50"
              aria-label="Retry connection"
            >
              <RefreshCw
                className={cn("size-3", retrying && "animate-spin")}
                aria-hidden="true"
              />
              Retry
            </button>
          </>
        )}
      </div>

      {/* Slow network sub-banner */}
      {!isBackOnline && isSlowNetwork && (
        <div className="flex items-center justify-center gap-1.5 bg-amber-400 px-4 py-1 text-xs text-amber-900">
          <Signal className="size-3" aria-hidden="true" />
          Slow connection detected ({networkQuality}). Pages may load slowly.
        </div>
      )}
    </div>
  );
}
