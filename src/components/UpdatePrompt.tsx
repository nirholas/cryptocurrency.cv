/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { RefreshCw, X, Sparkles, Clock } from "lucide-react";
import { usePWA } from "@/components/PWAProvider";

/** Auto-update countdown in seconds */
const AUTO_UPDATE_DELAY = 120;

export function UpdatePrompt() {
  const { isUpdateAvailable, applyUpdate, dismissUpdate, checkForUpdate, isCheckingUpdate } =
    usePWA();
  const [animateIn, setAnimateIn] = useState(false);
  const [countdown, setCountdown] = useState(AUTO_UPDATE_DELAY);
  const [isPaused, setIsPaused] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  /* Slide-in animation */
  useEffect(() => {
    if (isUpdateAvailable) {
      requestAnimationFrame(() => setAnimateIn(true));
      setCountdown(AUTO_UPDATE_DELAY);
      setIsPaused(false);
    } else {
      setAnimateIn(false);
    }
  }, [isUpdateAvailable]);

  /* Auto-update countdown */
  useEffect(() => {
    if (!isUpdateAvailable || isPaused) return;
    if (countdown <= 0) {
      handleUpdate();
      return;
    }
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUpdateAvailable, isPaused, countdown]);

  const handleUpdate = useCallback(() => {
    setIsUpdating(true);
    // Short delay so the spinner is visible
    setTimeout(() => applyUpdate(), 300);
  }, [applyUpdate]);

  const handleDismiss = useCallback(() => {
    setAnimateIn(false);
    setTimeout(dismissUpdate, 300);
  }, [dismissUpdate]);

  if (!isUpdateAvailable) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md transition-all duration-300 sm:left-auto sm:right-4 sm:bottom-4",
        animateIn
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0"
      )}
    >
      <div className="overflow-hidden rounded-xl border border-border bg-(--color-surface) shadow-2xl">
        {/* Progress bar for auto-update countdown */}
        <div className="h-1 w-full bg-surface-secondary">
          <div
            className="h-full bg-accent transition-all duration-1000 ease-linear"
            style={{ width: `${((AUTO_UPDATE_DELAY - countdown) / AUTO_UPDATE_DELAY) * 100}%` }}
            aria-hidden="true"
          />
        </div>

        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
              <Sparkles
                className="size-5 text-accent"
                aria-hidden="true"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">
                New version available!
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                Includes bug fixes, performance improvements, and new features.
              </p>

              {/* Countdown */}
              {!isPaused && countdown > 0 && (
                <button
                  onClick={() => setIsPaused(true)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-text-tertiary hover:text-text-secondary"
                >
                  <Clock className="size-3" aria-hidden="true" />
                  Auto-updating in {minutes}:{seconds.toString().padStart(2, "0")} &middot; Pause
                </button>
              )}
              {isPaused && (
                <button
                  onClick={() => setIsPaused(false)}
                  className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-text-tertiary hover:text-text-secondary"
                >
                  <Clock className="size-3" aria-hidden="true" />
                  Auto-update paused &middot; Resume
                </button>
              )}
            </div>

            {/* Dismiss */}
            <button
              onClick={handleDismiss}
              className="shrink-0 rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary"
              aria-label="Dismiss update notification"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          {/* Actions */}
          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              className="flex-1"
              onClick={handleUpdate}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <>
                  <RefreshCw
                    className="mr-1.5 size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                  Updating…
                </>
              ) : (
                <>
                  <RefreshCw className="mr-1.5 size-3.5" aria-hidden="true" />
                  Update now
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                checkForUpdate();
              }}
              disabled={isCheckingUpdate}
            >
              {isCheckingUpdate ? "Checking…" : "Re-check"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
