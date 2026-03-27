/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useSettings, type FontSize, type DefaultCurrency, type ArticlesPerPage } from "@/hooks/useSettings";
import {
  Settings,
  Eye,
  Bell,
  Shield,
  Download,
  Trash2,
  RotateCcw,
  Check,
  HardDrive,
  Palette,
  Newspaper,
  Volume2,
  VolumeX,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Toggle                                                             */
/* ------------------------------------------------------------------ */

function Toggle({ enabled, onChange, label, description }: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0 pr-4">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          enabled ? "bg-accent" : "bg-border"
        )}
      >
        <span className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0"
        )} />
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Select                                                             */
/* ------------------------------------------------------------------ */

function SelectOption<T extends string | number>({ label, description, value, options, onChange }: {
  label: string;
  description?: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0 pr-4">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <p className="text-xs text-text-tertiary mt-0.5">{description}</p>
        )}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-md border border-border bg-(--color-surface) px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
      >
        {options.map((opt) => (
          <option key={String(opt.value)} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function SettingsContent() {
  const { settings, updateSettings, resetSettings, exportData, clearAllData, getStorageUsage } = useSettings();
  const [showSaved, setShowSaved] = useState(false);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const handleUpdate = (partial: Parameters<typeof updateSettings>[0]) => {
    updateSettings(partial);
    setShowSaved(true);
    setTimeout(() => setShowSaved(false), 2000);
  };

  const activeSection = "all"; // Could be expanded for tab navigation

  return (
    <main id="main-content" className="container-main py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Settings className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif tracking-tight sm:text-3xl">Settings</h1>
              <p className="text-sm text-text-tertiary">
                Customize your experience — all settings are stored locally
              </p>
            </div>
          </div>
          {/* Save indicator */}
          <div className={cn(
            "flex items-center gap-1.5 text-xs font-medium text-emerald-500 transition-opacity duration-300",
            showSaved ? "opacity-100" : "opacity-0"
          )}>
            <Check className="h-3.5 w-3.5" />
            Saved
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Left — Settings Sections */}
        <div className="space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Palette className="h-4 w-4 text-purple-500" />
                Appearance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SelectOption
                label="Font Size"
                description="Adjust text size across the site"
                value={settings.fontSize}
                options={[
                  { value: "small" as FontSize, label: "Small" },
                  { value: "default" as FontSize, label: "Default" },
                  { value: "large" as FontSize, label: "Large" },
                  { value: "extra-large" as FontSize, label: "Extra Large" },
                ]}
                onChange={(v) => handleUpdate({ fontSize: v as FontSize })}
              />
              <Toggle
                label="Compact Mode"
                description="Reduce spacing and padding for denser layouts"
                enabled={settings.compactMode}
                onChange={(v) => handleUpdate({ compactMode: v })}
              />
            </CardContent>
          </Card>

          {/* Content Preferences */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-blue-500" />
                Content Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Toggle
                label="Show AI Summaries"
                description="Display AI-generated article summaries on cards"
                enabled={settings.showAISummaries}
                onChange={(v) => handleUpdate({ showAISummaries: v })}
              />
              <Toggle
                label="Show Price Changes"
                description="Display live price change indicators on articles"
                enabled={settings.showPriceChanges}
                onChange={(v) => handleUpdate({ showPriceChanges: v })}
              />
              <SelectOption
                label="Default Currency"
                description="Display prices in your preferred currency"
                value={settings.defaultCurrency}
                options={[
                  { value: "USD" as DefaultCurrency, label: "USD ($)" },
                  { value: "EUR" as DefaultCurrency, label: "EUR (€)" },
                  { value: "GBP" as DefaultCurrency, label: "GBP (£)" },
                  { value: "JPY" as DefaultCurrency, label: "JPY (¥)" },
                  { value: "BTC" as DefaultCurrency, label: "BTC (₿)" },
                ]}
                onChange={(v) => handleUpdate({ defaultCurrency: v as DefaultCurrency })}
              />
              <SelectOption
                label="Articles Per Page"
                description="Number of articles to load per page"
                value={settings.articlesPerPage}
                options={[
                  { value: 10, label: "10" },
                  { value: 20, label: "20" },
                  { value: 30, label: "30" },
                  { value: 50, label: "50" },
                ]}
                onChange={(v) => handleUpdate({ articlesPerPage: Number(v) as ArticlesPerPage })}
              />
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-amber-500" />
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Toggle
                label="Browser Notifications"
                description="Receive push notifications for important events"
                enabled={settings.browserNotifications}
                onChange={(v) => handleUpdate({ browserNotifications: v })}
              />
              <Toggle
                label="Price Alert Notifications"
                description="Get notified when your price alerts trigger"
                enabled={settings.priceAlertNotifications}
                onChange={(v) => handleUpdate({ priceAlertNotifications: v })}
              />
              <Toggle
                label="Breaking News Alerts"
                description="Push notifications for major breaking news"
                enabled={settings.breakingNewsNotifications}
                onChange={(v) => handleUpdate({ breakingNewsNotifications: v })}
              />
              <Toggle
                label="Sound Effects"
                description="Play sounds for notifications and alerts"
                enabled={settings.soundEffects}
                onChange={(v) => handleUpdate({ soundEffects: v })}
              />
            </CardContent>
          </Card>

          {/* Privacy & Cookies */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                Privacy & Cookies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Toggle
                label="Analytics Cookies"
                description="Help us understand how you use the site"
                enabled={settings.cookiePreferences.analytics}
                onChange={(v) => handleUpdate({
                  cookiePreferences: { ...settings.cookiePreferences, analytics: v },
                })}
              />
              <Toggle
                label="Marketing Cookies"
                description="Used for advertising and promotional purpose"
                enabled={settings.cookiePreferences.marketing}
                onChange={(v) => handleUpdate({
                  cookiePreferences: { ...settings.cookiePreferences, marketing: v },
                })}
              />
              <Toggle
                label="Functional Cookies"
                description="Required for features like language preference"
                enabled={settings.cookiePreferences.functional}
                onChange={(v) => handleUpdate({
                  cookiePreferences: { ...settings.cookiePreferences, functional: v },
                })}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right — Data & Storage */}
        <aside className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-text-tertiary" />
                Data & Storage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-text-secondary">Local Storage Used</span>
                <span className="text-sm font-semibold tabular-nums">{getStorageUsage()}</span>
              </div>

              <button
                onClick={exportData}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-surface-secondary transition-colors cursor-pointer"
              >
                <Download className="h-4 w-4 text-text-tertiary" />
                Export All Data
              </button>

              <button
                onClick={resetSettings}
                className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-surface-secondary transition-colors cursor-pointer"
              >
                <RotateCcw className="h-4 w-4 text-text-tertiary" />
                Reset to Defaults
              </button>

              {showConfirmClear ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <p className="text-xs text-red-400 mb-3">
                    This will permanently delete all local data including watchlist, portfolio, bookmarks, and settings.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { clearAllData(); setShowConfirmClear(false); }}
                      className="flex-1 px-3 py-1.5 rounded-md bg-red-500 text-white text-xs font-medium hover:bg-red-600 transition-colors cursor-pointer"
                    >
                      Yes, delete everything
                    </button>
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="flex-1 px-3 py-1.5 rounded-md border border-border text-xs font-medium hover:bg-surface-secondary transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg border border-red-500/30 text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear All Data
                </button>
              )}
            </CardContent>
          </Card>

          <div className="rounded-lg border border-border p-4 bg-surface-secondary">
            <p className="text-[11px] text-text-tertiary leading-relaxed">
              All settings are stored locally in your browser. No data is sent to our servers. Clearing your browser data will reset all preferences.
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
