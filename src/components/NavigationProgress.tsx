/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * Top-of-page progress bar for client-side route transitions.
 * Shows a subtle animated bar at the very top of the viewport during navigation.
 */
export default function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // When pathname changes, the navigation is complete — finish the animation
    setProgress(100);
    const timeout = setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 300);
    return () => clearTimeout(timeout);
  }, [pathname]);

  // Intercept link clicks to start the progress bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:")) return;
      if (target.target === "_blank") return;

      // Same page — no loading
      if (href === pathname) return;

      setLoading(true);
      setProgress(30);

      // Simulate incremental progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 200);

      // Cleanup after timeout (safety net)
      const safetyTimeout = setTimeout(() => {
        clearInterval(interval);
        setLoading(false);
        setProgress(0);
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(safetyTimeout);
      };
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname]);

  if (!loading && progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-100 h-[2px] pointer-events-none"
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page loading"
    >
      <div
        className="h-full bg-accent transition-all duration-300 ease-out shadow-[0_0_8px_var(--color-accent)]"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
        }}
      />
    </div>
  );
}
