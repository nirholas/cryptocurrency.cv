/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Download, X } from "lucide-react";
import { usePWA } from "@/components/PWAProvider";
import { COOKIE_CONSENT_EVENT, hasCookieConsent } from "@/components/CookieConsent";

const DISMISS_KEY = "fcn-install-dismissed";
/** How long a dismissal hides the prompt */
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

function isDismissed(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return Number.isFinite(at) && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

/**
 * Offers "Install app" once the browser fires beforeinstallprompt.
 * PWAProvider holds that event (which suppresses the browser's own banner),
 * so without this card the site would be installable but never say so.
 * It waits for the cookie banner to be answered so the two never stack.
 */
export function InstallPrompt() {
  const { canInstall, isUpdateAvailable, promptInstall } = usePWA();
  const [eligible, setEligible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [isPrompting, setIsPrompting] = useState(false);

  useEffect(() => {
    const check = () => setEligible(hasCookieConsent() && !isDismissed());
    check();
    window.addEventListener(COOKIE_CONSENT_EVENT, check);
    return () => window.removeEventListener(COOKIE_CONSENT_EVENT, check);
  }, []);

  const visible = canInstall && eligible && !isUpdateAvailable;

  useEffect(() => {
    if (!visible) {
      setAnimateIn(false);
      return;
    }
    const raf = requestAnimationFrame(() => setAnimateIn(true));
    return () => cancelAnimationFrame(raf);
  }, [visible]);

  const handleInstall = useCallback(async () => {
    setIsPrompting(true);
    try {
      await promptInstall();
    } finally {
      setIsPrompting(false);
    }
  }, [promptInstall]);

  const handleDismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage unavailable: hide for this page view only */
    }
    setEligible(false);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-labelledby="install-prompt-title"
      className={cn(
        "fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md transition-all duration-300 sm:left-auto sm:right-4 sm:bottom-4",
        animateIn ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      )}
    >
      <div className="rounded-xl border border-border bg-(--color-surface) p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
            <Download className="size-5 text-accent" aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <p id="install-prompt-title" className="text-sm font-semibold text-text-primary">
              Install Crypto Vision
            </p>
            <p className="mt-0.5 text-xs text-text-secondary">
              Open the news feed from your home screen, with recent articles kept for offline reading.
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary focus-visible:outline-2 focus-visible:outline-accent"
            aria-label="Dismiss install prompt"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            onClick={handleInstall}
            disabled={isPrompting}
          >
            <Download className="mr-1.5 size-3.5" aria-hidden="true" />
            Install app
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Not now
          </Button>
        </div>
      </div>
    </div>
  );
}
