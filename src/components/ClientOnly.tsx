/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 *
 * ClientOnly — Suppresses server-side rendering of children.
 *
 * Wrapping content in this component ensures the page source contains
 * only a minimal loading shell.  Actual UI is rendered exclusively in
 * the browser after JavaScript hydration.
 */

"use client";

import { useState, useEffect, type ReactNode } from "react";

interface ClientOnlyProps {
  children: ReactNode;
  /** Optional fallback shown in the page source / before JS loads. */
  fallback?: ReactNode;
}

/**
 * Renders `children` only on the client after mount.
 * On the server (and in View Source) only the `fallback` is emitted.
 */
export function ClientOnly({ children, fallback }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback ?? <DefaultFallback />}</>;
  }

  return <>{children}</>;
}

/** Minimal loading indicator — keeps page source lightweight. */
function DefaultFallback() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid #e5e7eb",
          borderTopColor: "#6366f1",
          borderRadius: "50%",
          animation: "cvn-spin 0.6s linear infinite",
        }}
      />
      <style>{`@keyframes cvn-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
