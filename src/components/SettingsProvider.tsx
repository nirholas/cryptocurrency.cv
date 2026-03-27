/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import type { ReactNode } from "react";
import {
  SettingsContext,
  useSettingsProvider,
} from "@/hooks/useSettings";

/**
 * Global settings provider that wraps the app.
 * Uses `useSettingsProvider()` to manage settings state in localStorage
 * and exposes it via React context so any component can call `useSettings()`.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const value = useSettingsProvider();

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}
