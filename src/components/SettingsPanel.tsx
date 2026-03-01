"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Settings,
  Sun,
  Moon,
  Monitor,
  Globe,
  Layout,
  Bell,
  Shield,
  AlertTriangle,
  Download,
  Trash2,
  RotateCcw,
  Search,
  Check,
  ChevronRight,
  Volume2,
  VolumeX,
  Type,
  Columns3,
  Newspaper,
  DollarSign,
  Eye,
  EyeOff,
  Sparkles,
  TrendingUp,
  Database,
  Cookie,
  HardDrive,
  Palette,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useTheme } from "@/components/ThemeProvider";
import { useRouter, usePathname } from "@/i18n/navigation";
import {
  localeNames,
  localeRegions,
  type Locale,
} from "@/i18n/config";
import {
  useSettingsProvider,
  type FontSize,
  type DefaultCurrency,
  type ArticlesPerPage,
} from "@/hooks/useSettings";

type Tab = "appearance" | "language" | "content" | "notifications" | "privacy" | "danger";

const TABS: { id: Tab; icon: React.ElementType; label: string }[] = [
  { id: "appearance", icon: Sun, label: "Appearance" },
  { id: "language", icon: Globe, label: "Language" },
  { id: "content", icon: Layout, label: "Content" },
  { id: "notifications", icon: Bell, label: "Notifications" },
  { id: "privacy", icon: Shield, label: "Data & Privacy" },
  { id: "danger", icon: AlertTriangle, label: "Danger Zone" },
];

const NEWS_CATEGORIES = [
  "all",
  "bitcoin",
  "ethereum",
  "defi",
  "nft",
  "altcoins",
  "regulation",
  "trading",
  "mining",
  "web3",
  "solana",
  "layer2",
  "stablecoins",
];

// ─── Toggle Switch ──────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer group">
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {label}
        </span>
        {description && (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            {description}
          </p>
        )}
      </div>
      <button
        role="switch"
        type="button"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
          checked
            ? "bg-[var(--color-accent)]"
            : "bg-[var(--color-surface-tertiary)]"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
    </label>
  );
}

// ─── Radio Group ────────────────────────────────────────────────

function RadioOption<T extends string>({
  value,
  selected,
  onSelect,
  icon: Icon,
  label,
}: {
  value: T;
  selected: T;
  onSelect: (v: T) => void;
  icon?: React.ElementType;
  label: string;
}) {
  const isActive = value === selected;
  return (
    <button
      type="button"
      onClick={() => onSelect(value)}
      className={cn(
        "flex items-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-all",
        isActive
          ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-tertiary)]"
      )}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {label}
      {isActive && <Check className="h-4 w-4 ml-auto" />}
    </button>
  );
}

// ─── Select Dropdown ────────────────────────────────────────────

function SelectField<T extends string>({
  value,
  onChange,
  options,
  label,
  description,
  icon: Icon,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
  description?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {Icon && (
          <Icon className="h-4 w-4 text-[var(--color-text-tertiary)] shrink-0" />
        )}
        <div>
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {label}
          </span>
          {description && (
            <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
              {description}
            </p>
          )}
        </div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] min-w-[140px]"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Section Header ─────────────────────────────────────────────

function SectionHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4">
      <h3 className="font-serif text-lg font-bold text-[var(--color-text-primary)]">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          {description}
        </p>
      )}
    </div>
  );
}

// ─── Appearance Tab ─────────────────────────────────────────────

function AppearanceTab({
  settings,
  updateSettings,
}: {
  settings: ReturnType<typeof useSettingsProvider>["settings"];
  updateSettings: ReturnType<typeof useSettingsProvider>["updateSettings"];
}) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-8">
      {/* Theme */}
      <div>
        <SectionHeader
          title="Theme"
          description="Choose how Free Crypto News looks to you."
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RadioOption
            value="light"
            selected={theme}
            onSelect={setTheme}
            icon={Sun}
            label="Light"
          />
          <RadioOption
            value="dark"
            selected={theme}
            onSelect={setTheme}
            icon={Moon}
            label="Dark"
          />
          <RadioOption
            value="midnight"
            selected={theme}
            onSelect={setTheme}
            icon={Palette}
            label="Midnight"
          />
          <RadioOption
            value="system"
            selected={theme}
            onSelect={setTheme}
            icon={Monitor}
            label="System"
          />
        </div>
      </div>

      {/* Font Size */}
      <div>
        <SectionHeader
          title="Font Size"
          description="Adjust the base text size across the site."
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { value: "small" as FontSize, label: "Small", preview: "Aa" },
              { value: "default" as FontSize, label: "Default", preview: "Aa" },
              { value: "large" as FontSize, label: "Large", preview: "Aa" },
              { value: "extra-large" as FontSize, label: "Extra Large", preview: "Aa" },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => updateSettings({ fontSize: opt.value })}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border px-4 py-3 transition-all",
                settings.fontSize === opt.value
                  ? "border-[var(--color-accent)] bg-[var(--color-accent)]/10"
                  : "border-[var(--color-border)] hover:border-[var(--color-text-tertiary)]"
              )}
            >
              <span
                className={cn(
                  "font-serif font-bold",
                  opt.value === "small" && "text-sm",
                  opt.value === "default" && "text-base",
                  opt.value === "large" && "text-lg",
                  opt.value === "extra-large" && "text-xl"
                )}
              >
                {opt.preview}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Compact Mode */}
      <div>
        <SectionHeader title="Display Density" />
        <div className="border border-[var(--color-border)] rounded-lg px-4 divide-y divide-[var(--color-border)]">
          <Toggle
            checked={settings.compactMode}
            onChange={(v) => updateSettings({ compactMode: v })}
            label="Compact Mode"
            description="Reduce padding and spacing for a denser layout"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Language Tab ───────────────────────────────────────────────

function LanguageTab({ currentLocale }: { currentLocale: string }) {
  const [search, setSearch] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const filteredRegions = useMemo(() => {
    const q = search.toLowerCase().trim();
    const result: Record<string, Locale[]> = {};

    for (const [region, codes] of Object.entries(localeRegions)) {
      const filtered = (codes as readonly string[]).filter((code) => {
        const name = localeNames[code as Locale] || code;
        return (
          name.toLowerCase().includes(q) || code.toLowerCase().includes(q)
        );
      }) as Locale[];
      if (filtered.length > 0) {
        result[region] = filtered;
      }
    }
    return result;
  }, [search]);

  const handleLocaleChange = useCallback(
    (locale: Locale) => {
      router.replace(pathname, { locale });
    },
    [router, pathname]
  );

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Language"
        description="Choose your preferred language. Content will be displayed in the selected language where available."
      />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-tertiary)]" />
        <input
          type="text"
          placeholder="Search languages..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
      </div>

      {/* Language List */}
      <div className="max-h-[480px] overflow-y-auto space-y-6 pr-1">
        {Object.entries(filteredRegions).map(([region, codes]) => (
          <div key={region}>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
              {region}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
              {codes.map((code) => {
                const isActive = code === currentLocale;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleLocaleChange(code)}
                    className={cn(
                      "flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-colors text-left",
                      isActive
                        ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)] font-medium"
                        : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]"
                    )}
                  >
                    <span>{localeNames[code]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {code}
                      </span>
                      {isActive && <Check className="h-4 w-4" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {Object.keys(filteredRegions).length === 0 && (
          <p className="text-sm text-[var(--color-text-tertiary)] text-center py-8">
            No languages match your search.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Content Preferences Tab ────────────────────────────────────

function ContentTab({
  settings,
  updateSettings,
}: {
  settings: ReturnType<typeof useSettingsProvider>["settings"];
  updateSettings: ReturnType<typeof useSettingsProvider>["updateSettings"];
}) {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Content Preferences"
        description="Customize what content you see and how it's displayed."
      />

      <div className="border border-[var(--color-border)] rounded-lg px-4 divide-y divide-[var(--color-border)]">
        <SelectField
          value={settings.defaultCategory}
          onChange={(v) => updateSettings({ defaultCategory: v })}
          options={NEWS_CATEGORIES.map((c) => ({
            value: c,
            label: c.charAt(0).toUpperCase() + c.slice(1),
          }))}
          label="Default News Category"
          description="Category shown when you open the news feed"
          icon={Newspaper}
        />

        <SelectField
          value={settings.defaultCurrency}
          onChange={(v) => updateSettings({ defaultCurrency: v as DefaultCurrency })}
          options={[
            { value: "USD", label: "USD ($)" },
            { value: "EUR", label: "EUR (€)" },
            { value: "GBP", label: "GBP (£)" },
            { value: "JPY", label: "JPY (¥)" },
            { value: "BTC", label: "BTC (₿)" },
          ]}
          label="Default Currency"
          description="Currency used for price display"
          icon={DollarSign}
        />

        <SelectField
          value={String(settings.articlesPerPage) as string}
          onChange={(v) =>
            updateSettings({ articlesPerPage: Number(v) as ArticlesPerPage })
          }
          options={[
            { value: "10", label: "10 articles" },
            { value: "20", label: "20 articles" },
            { value: "30", label: "30 articles" },
            { value: "50", label: "50 articles" },
          ]}
          label="Articles Per Page"
          description="Number of articles loaded at a time"
          icon={Columns3}
        />
      </div>

      <div className="border border-[var(--color-border)] rounded-lg px-4 divide-y divide-[var(--color-border)]">
        <Toggle
          checked={settings.showAISummaries}
          onChange={(v) => updateSettings({ showAISummaries: v })}
          label="Show AI Summaries"
          description="Display AI-generated article summaries"
        />
        <Toggle
          checked={settings.showPriceChanges}
          onChange={(v) => updateSettings({ showPriceChanges: v })}
          label="Show Price Changes"
          description="Display price movements alongside news articles"
        />
      </div>
    </div>
  );
}

// ─── Notifications Tab ──────────────────────────────────────────

function NotificationsTab({
  settings,
  updateSettings,
}: {
  settings: ReturnType<typeof useSettingsProvider>["settings"];
  updateSettings: ReturnType<typeof useSettingsProvider>["updateSettings"];
}) {
  const [permissionState, setPermissionState] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  const requestPermission = useCallback(async () => {
    if (typeof Notification === "undefined") return;
    const permission = await Notification.requestPermission();
    setPermissionState(permission);
    if (permission === "granted") {
      updateSettings({ browserNotifications: true });
    }
  }, [updateSettings]);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Notifications"
        description="Control how and when you receive notifications."
      />

      {/* Browser Notification Permission */}
      <div className="border border-[var(--color-border)] rounded-lg p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-[var(--color-text-tertiary)]" />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                Browser Notifications
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {permissionState === "granted"
                  ? "Notifications are enabled"
                  : permissionState === "denied"
                    ? "Notifications are blocked in your browser"
                    : "Allow notifications to stay updated"}
              </p>
            </div>
          </div>
          {permissionState !== "granted" && (
            <Button
              variant="outline"
              size="sm"
              onClick={requestPermission}
              disabled={permissionState === "denied"}
            >
              {permissionState === "denied" ? "Blocked" : "Enable"}
            </Button>
          )}
          {permissionState === "granted" && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
              <Check className="h-3.5 w-3.5" /> Enabled
            </span>
          )}
        </div>
      </div>

      {/* Notification Types */}
      <div className="border border-[var(--color-border)] rounded-lg px-4 divide-y divide-[var(--color-border)]">
        <Toggle
          checked={settings.priceAlertNotifications}
          onChange={(v) => updateSettings({ priceAlertNotifications: v })}
          label="Price Alert Notifications"
          description="Get notified when price targets are hit"
        />
        <Toggle
          checked={settings.breakingNewsNotifications}
          onChange={(v) => updateSettings({ breakingNewsNotifications: v })}
          label="Breaking News Notifications"
          description="Receive alerts for major breaking news"
        />
      </div>

      {/* Sound */}
      <div className="border border-[var(--color-border)] rounded-lg px-4 divide-y divide-[var(--color-border)]">
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-3">
            {settings.soundEffects ? (
              <Volume2 className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            ) : (
              <VolumeX className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            )}
            <div>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                Sound Effects
              </span>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                Play sounds for notifications and interactions
              </p>
            </div>
          </div>
          <button
            role="switch"
            type="button"
            aria-checked={settings.soundEffects}
            onClick={() =>
              updateSettings({ soundEffects: !settings.soundEffects })
            }
            className={cn(
              "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2",
              settings.soundEffects
                ? "bg-[var(--color-accent)]"
                : "bg-[var(--color-surface-tertiary)]"
            )}
          >
            <span
              className={cn(
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform",
                settings.soundEffects ? "translate-x-5" : "translate-x-0"
              )}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Privacy Tab ────────────────────────────────────────────────

function PrivacyTab({
  settings,
  updateSettings,
  exportData,
  clearAllData,
  getStorageUsage,
}: {
  settings: ReturnType<typeof useSettingsProvider>["settings"];
  updateSettings: ReturnType<typeof useSettingsProvider>["updateSettings"];
  exportData: () => void;
  clearAllData: () => void;
  getStorageUsage: () => string;
}) {
  const [confirmClear, setConfirmClear] = useState(false);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Data & Privacy"
        description="Manage your data and privacy preferences."
      />

      {/* Storage Info */}
      <div className="border border-[var(--color-border)] rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <HardDrive className="h-5 w-5 text-[var(--color-text-tertiary)]" />
          <div>
            <p className="text-sm font-medium text-[var(--color-text-primary)]">
              Local Storage Usage
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              {getStorageUsage()} used
            </p>
          </div>
        </div>
        <div className="h-2 rounded-full bg-[var(--color-surface-tertiary)] overflow-hidden">
          <div
            className="h-full rounded-full bg-[var(--color-accent)] transition-all"
            style={{ width: "12%" }}
          />
        </div>
      </div>

      {/* Export / Clear */}
      <div className="border border-[var(--color-border)] rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Download className="h-4 w-4 text-[var(--color-text-tertiary)]" />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                Export Data
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Download all your local data as JSON
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
        <div className="border-t border-[var(--color-border)]" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trash2 className="h-4 w-4 text-red-500" />
            <div>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                Clear All Data
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Remove all locally stored data (cannot be undone)
              </p>
            </div>
          </div>
          {!confirmClear ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmClear(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  clearAllData();
                  setConfirmClear(false);
                }}
              >
                Confirm
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Cookie Preferences */}
      <div>
        <h4 className="font-serif text-base font-bold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
          <Cookie className="h-4 w-4" /> Cookie Preferences
        </h4>
        <div className="border border-[var(--color-border)] rounded-lg px-4 divide-y divide-[var(--color-border)]">
          <div className="flex items-center justify-between py-3">
            <div>
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                Essential Cookies
              </span>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                Required for basic site functionality
              </p>
            </div>
            <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
              Always On
            </span>
          </div>
          <Toggle
            checked={settings.cookiePreferences.functional}
            onChange={(v) =>
              updateSettings({
                cookiePreferences: { ...settings.cookiePreferences, functional: v },
              })
            }
            label="Functional Cookies"
            description="Remember your preferences and settings"
          />
          <Toggle
            checked={settings.cookiePreferences.analytics}
            onChange={(v) =>
              updateSettings({
                cookiePreferences: { ...settings.cookiePreferences, analytics: v },
              })
            }
            label="Analytics Cookies"
            description="Help us understand how visitors use the site"
          />
          <Toggle
            checked={settings.cookiePreferences.marketing}
            onChange={(v) =>
              updateSettings({
                cookiePreferences: { ...settings.cookiePreferences, marketing: v },
              })
            }
            label="Marketing Cookies"
            description="Used for targeted advertising"
          />
        </div>
      </div>
    </div>
  );
}

// ─── Danger Zone Tab ────────────────────────────────────────────

function DangerTab({
  resetSettings,
}: {
  resetSettings: () => void;
}) {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Danger Zone"
        description="Irreversible actions. Proceed with caution."
      />

      <div className="border border-red-200 dark:border-red-900/50 rounded-lg p-4 bg-red-50/50 dark:bg-red-950/20">
        <div className="flex items-start gap-4">
          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-red-700 dark:text-red-400">
              Reset All Settings
            </h4>
            <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
              This will reset all your preferences to their default values.
              Your bookmarks, watchlist, and portfolio data will not be
              affected.
            </p>
            <div className="mt-4">
              {!confirmReset ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setConfirmReset(true)}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset All Settings
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-red-600 dark:text-red-400">
                    Are you sure?
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmReset(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      resetSettings();
                      setConfirmReset(false);
                    }}
                  >
                    Yes, Reset Everything
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Panel ─────────────────────────────────────────────────

export default function SettingsPanel({
  locale,
}: {
  locale: string;
}) {
  const [activeTab, setActiveTab] = useState<Tab>("appearance");
  const {
    settings,
    updateSettings,
    resetSettings,
    exportData,
    clearAllData,
    getStorageUsage,
  } = useSettingsProvider();

  return (
    <main className="container-main py-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-[var(--color-text-primary)]">
          Settings
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-2">
          Customize your Free Crypto News experience
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <nav className="lg:w-56 shrink-0" aria-label="Settings navigation">
          <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] hover:text-[var(--color-text-primary)]",
                    tab.id === "danger" &&
                      !isActive &&
                      "text-red-500 hover:text-red-600"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {tab.label}
                  {isActive && (
                    <ChevronRight className="h-3.5 w-3.5 ml-auto hidden lg:block" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          <Card>
            <CardContent className="p-6">
              {activeTab === "appearance" && (
                <AppearanceTab
                  settings={settings}
                  updateSettings={updateSettings}
                />
              )}
              {activeTab === "language" && (
                <LanguageTab currentLocale={locale} />
              )}
              {activeTab === "content" && (
                <ContentTab
                  settings={settings}
                  updateSettings={updateSettings}
                />
              )}
              {activeTab === "notifications" && (
                <NotificationsTab
                  settings={settings}
                  updateSettings={updateSettings}
                />
              )}
              {activeTab === "privacy" && (
                <PrivacyTab
                  settings={settings}
                  updateSettings={updateSettings}
                  exportData={exportData}
                  clearAllData={clearAllData}
                  getStorageUsage={getStorageUsage}
                />
              )}
              {activeTab === "danger" && (
                <DangerTab resetSettings={resetSettings} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
