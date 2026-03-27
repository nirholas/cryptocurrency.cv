/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
  Cookie,
  ChevronDown,
  ChevronUp,
  Shield,
  ExternalLink,
} from "lucide-react";

/* ─── Types & constants ─── */

const STORAGE_KEY = "fcn-cookie-consent";
const CONSENT_VERSION = 2; // bump when categories change

interface ConsentPreferences {
  version: number;
  essential: true; // always true
  analytics: boolean;
  personalization: boolean;
  timestamp: string;
}

type QuickChoice = "accept-all" | "decline-all";

function loadConsent(): ConsentPreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentPreferences;
    // Re-show if consent version changed
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(prefs: ConsentPreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* storage unavailable */
  }
}

/* ─── Component ─── */

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [personalization, setPersonalization] = useState(true);
  const bannerRef = useRef<HTMLDivElement>(null);

  /* Show banner if no consent stored */
  useEffect(() => {
    const existing = loadConsent();
    if (!existing) {
      const t = setTimeout(() => {
        setVisible(true);
        requestAnimationFrame(() => setAnimateIn(true));
      }, 1500);
      return () => clearTimeout(t);
    }
  }, []);

  /* Trap focus within banner when expanded and visible */
  useEffect(() => {
    if (!visible || !expanded) return;
    const banner = bannerRef.current;
    if (!banner) return;

    const focusable = banner.querySelectorAll<HTMLElement>(
      'button, [href], input, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setExpanded(false);
        return;
      }
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    banner.addEventListener("keydown", handleKeyDown);
    return () => banner.removeEventListener("keydown", handleKeyDown);
  }, [visible, expanded]);

  const dismiss = useCallback((prefs: ConsentPreferences) => {
    setAnimateIn(false);
    setTimeout(() => {
      saveConsent(prefs);
      setVisible(false);
    }, 300);
  }, []);

  const handleQuick = useCallback(
    (choice: QuickChoice) => {
      const all = choice === "accept-all";
      dismiss({
        version: CONSENT_VERSION,
        essential: true,
        analytics: all,
        personalization: all,
        timestamp: new Date().toISOString(),
      });
    },
    [dismiss]
  );

  const handleSavePreferences = useCallback(() => {
    dismiss({
      version: CONSENT_VERSION,
      essential: true,
      analytics,
      personalization,
      timestamp: new Date().toISOString(),
    });
  }, [analytics, personalization, dismiss]);

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out",
        animateIn ? "translate-y-0" : "translate-y-full"
      )}
      role="dialog"
      aria-label="Cookie consent"
      aria-modal="false"
    >
      <div className="border-t border-border bg-(--color-surface) shadow-2xl">
        {/* ── Main bar ── */}
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Cookie
                className="hidden size-5 shrink-0 text-accent sm:block"
                aria-hidden="true"
              />
              <p className="flex-1 text-center text-sm text-text-primary sm:text-left">
                We use cookies for analytics and to personalise your experience.{" "}
                <button
                  onClick={() => setExpanded((p) => !p)}
                  className="inline-flex items-center gap-0.5 text-accent underline underline-offset-2 hover:text-accent-hover"
                >
                  {expanded ? "Hide" : "Manage"} preferences
                  {expanded ? (
                    <ChevronUp className="inline size-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="inline size-3.5" aria-hidden="true" />
                  )}
                </button>
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuick("decline-all")}
              >
                Decline all
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleQuick("accept-all")}
              >
                Accept all
              </Button>
            </div>
          </div>
        </div>

        {/* ── Expanded preferences panel ── */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300 ease-in-out",
            expanded ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
          )}
          aria-hidden={!expanded}
        >
          <div className="mx-auto max-w-5xl border-t border-border px-4 py-4 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {/* Essential — always on */}
              <label className="flex cursor-not-allowed items-start gap-3 rounded-lg border border-border bg-surface-secondary p-3">
                <input
                  type="checkbox"
                  checked
                  disabled
                  className="mt-0.5 accent-accent"
                />
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    Essential
                  </span>
                  <p className="text-xs text-text-secondary">
                    Required for the site to function.
                  </p>
                </div>
                <Shield className="ml-auto size-4 shrink-0 text-green-500" aria-hidden="true" />
              </label>

              {/* Analytics */}
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-secondary">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                  className="mt-0.5 accent-accent"
                />
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    Analytics
                  </span>
                  <p className="text-xs text-text-secondary">
                    Help us understand how you use the app.
                  </p>
                </div>
              </label>

              {/* Personalization */}
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-surface-secondary">
                <input
                  type="checkbox"
                  checked={personalization}
                  onChange={(e) => setPersonalization(e.target.checked)}
                  className="mt-0.5 accent-accent"
                />
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    Personalization
                  </span>
                  <p className="text-xs text-text-secondary">
                    Remember your preferences and watchlists.
                  </p>
                </div>
              </label>
            </div>

            <div className="mt-3 flex items-center justify-between">
              <a
                href="/privacy"
                className="inline-flex items-center gap-1 text-xs text-text-secondary underline-offset-2 hover:text-accent hover:underline"
              >
                Privacy policy
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
              <Button variant="primary" size="sm" onClick={handleSavePreferences}>
                Save preferences
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
