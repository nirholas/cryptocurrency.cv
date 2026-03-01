"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type FontSize = "small" | "default" | "large" | "extra-large";
export type DefaultCurrency = "USD" | "EUR" | "GBP" | "JPY" | "BTC";
export type ArticlesPerPage = 10 | 20 | 30 | 50;

export interface Settings {
  // Appearance
  fontSize: FontSize;
  compactMode: boolean;

  // Content Preferences
  defaultCategory: string;
  showAISummaries: boolean;
  showPriceChanges: boolean;
  defaultCurrency: DefaultCurrency;
  articlesPerPage: ArticlesPerPage;

  // Notifications
  browserNotifications: boolean;
  priceAlertNotifications: boolean;
  breakingNewsNotifications: boolean;
  soundEffects: boolean;

  // Privacy
  cookiePreferences: {
    analytics: boolean;
    marketing: boolean;
    functional: boolean;
  };
}

const DEFAULT_SETTINGS: Settings = {
  fontSize: "default",
  compactMode: false,
  defaultCategory: "all",
  showAISummaries: true,
  showPriceChanges: true,
  defaultCurrency: "USD",
  articlesPerPage: 20,
  browserNotifications: false,
  priceAlertNotifications: false,
  breakingNewsNotifications: false,
  soundEffects: false,
  cookiePreferences: {
    analytics: true,
    marketing: false,
    functional: true,
  },
};

const STORAGE_KEY = "fcn-settings";

interface SettingsContextType {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
  resetSettings: () => void;
  exportData: () => void;
  clearAllData: () => void;
  getStorageUsage: () => string;
}

export const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {},
  resetSettings: () => {},
  exportData: () => {},
  clearAllData: () => {},
  getStorageUsage: () => "0 KB",
});

export function useSettings() {
  return useContext(SettingsContext);
}

function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage might be full
  }
}

function applyFontSize(size: FontSize) {
  const root = document.documentElement;
  root.classList.remove("font-size-small", "font-size-large", "font-size-extra-large");
  if (size !== "default") {
    root.classList.add(`font-size-${size}`);
  }
}

function applyCompactMode(compact: boolean) {
  document.documentElement.classList.toggle("compact-mode", compact);
}

export function useSettingsProvider() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loaded = loadSettings();
    setSettings(loaded);
    applyFontSize(loaded.fontSize);
    applyCompactMode(loaded.compactMode);
    setMounted(true);
  }, []);

  const updateSettings = useCallback((partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);

      if (partial.fontSize !== undefined) {
        applyFontSize(partial.fontSize);
      }
      if (partial.compactMode !== undefined) {
        applyCompactMode(partial.compactMode);
      }

      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    saveSettings(DEFAULT_SETTINGS);
    applyFontSize(DEFAULT_SETTINGS.fontSize);
    applyCompactMode(DEFAULT_SETTINGS.compactMode);
  }, []);

  const exportData = useCallback(() => {
    const allData: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        allData[key] = localStorage.getItem(key) ?? "";
      }
    }
    const blob = new Blob([JSON.stringify(allData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `crypto-vision-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const clearAllData = useCallback(() => {
    localStorage.clear();
    setSettings(DEFAULT_SETTINGS);
    applyFontSize(DEFAULT_SETTINGS.fontSize);
    applyCompactMode(DEFAULT_SETTINGS.compactMode);
  }, []);

  const getStorageUsage = useCallback((): string => {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key) ?? "";
        total += key.length + value.length;
      }
    }
    const bytes = total * 2; // UTF-16
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }, []);

  return {
    settings: mounted ? settings : DEFAULT_SETTINGS,
    updateSettings,
    resetSettings,
    exportData,
    clearAllData,
    getStorageUsage,
  };
}

export { DEFAULT_SETTINGS };
