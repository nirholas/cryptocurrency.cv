"use client";

import { useState, useCallback, useMemo } from "react";

type WidgetType =
  | "ticker"
  | "news"
  | "coin"
  | "market"
  | "fear-greed"
  | "chart";
type ThemeOption = "dark" | "light" | "auto";
type WidthOption = "responsive" | "fixed";
type PreviewDevice = "desktop" | "tablet" | "mobile";
type EmbedTab = "iframe" | "script" | "react" | "vue" | "wordpress";

interface WidgetConfig {
  type: WidgetType;
  theme: ThemeOption;
  width: WidthOption;
  fixedWidth: number;
  count: number;
  coin: string;
  showTitle: boolean;
  showTimestamp: boolean;
  symbol: string;
  interval: string;
  accentColor: string;
  borderRadius: number;
  refreshInterval: number;
  transparent: boolean;
  locale: string;
}

const WIDGET_TYPES: {
  id: WidgetType;
  name: string;
  icon: string;
  description: string;
}[] = [
  {
    id: "ticker",
    name: "Price Ticker",
    icon: "📈",
    description: "Horizontal scrolling bar of live crypto prices",
  },
  {
    id: "news",
    name: "News Feed",
    icon: "📰",
    description: "Card list of latest cryptocurrency news",
  },
  {
    id: "coin",
    name: "Single Coin",
    icon: "🪙",
    description: "Detailed price card for a specific coin",
  },
  {
    id: "market",
    name: "Market Overview",
    icon: "📊",
    description: "Mini dashboard with top 5 coins",
  },
  {
    id: "fear-greed",
    name: "Fear & Greed",
    icon: "🎯",
    description: "Market sentiment gauge widget",
  },
  {
    id: "chart",
    name: "TradingView Chart",
    icon: "📉",
    description: "Interactive TradingView chart with technical analysis",
  },
];

const POPULAR_COINS = [
  { id: "bitcoin", name: "Bitcoin (BTC)" },
  { id: "ethereum", name: "Ethereum (ETH)" },
  { id: "solana", name: "Solana (SOL)" },
  { id: "binancecoin", name: "BNB" },
  { id: "cardano", name: "Cardano (ADA)" },
  { id: "ripple", name: "XRP" },
  { id: "dogecoin", name: "Dogecoin (DOGE)" },
  { id: "polkadot", name: "Polkadot (DOT)" },
  { id: "avalanche-2", name: "Avalanche (AVAX)" },
  { id: "chainlink", name: "Chainlink (LINK)" },
];

const COUNT_OPTIONS = [5, 10, 15, 20, 25];

const ACCENT_COLORS = [
  { label: "Blue", value: "#3b82f6" },
  { label: "Purple", value: "#8b5cf6" },
  { label: "Green", value: "#22c55e" },
  { label: "Orange", value: "#f97316" },
  { label: "Red", value: "#ef4444" },
  { label: "Pink", value: "#ec4899" },
  { label: "Cyan", value: "#06b6d4" },
  { label: "Yellow", value: "#eab308" },
];

const REFRESH_OPTIONS = [
  { label: "30s", value: 30 },
  { label: "1m", value: 60 },
  { label: "2m", value: 120 },
  { label: "5m", value: 300 },
  { label: "10m", value: 600 },
];

const LOCALE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Spanish", value: "es" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Portuguese", value: "pt" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Chinese", value: "zh-CN" },
];

interface QuickStartTemplate {
  name: string;
  description: string;
  icon: string;
  config: Partial<WidgetConfig>;
}

const QUICK_START_TEMPLATES: QuickStartTemplate[] = [
  {
    name: "Blog Sidebar",
    description: "Compact news feed for blog sidebars",
    icon: "📝",
    config: {
      type: "news",
      count: 5,
      width: "fixed",
      fixedWidth: 320,
      showTitle: true,
      theme: "auto",
      borderRadius: 12,
    },
  },
  {
    name: "Homepage Hero",
    description: "Full-width price ticker for hero sections",
    icon: "🏠",
    config: {
      type: "ticker",
      width: "responsive",
      theme: "dark",
      borderRadius: 0,
    },
  },
  {
    name: "BTC Dashboard",
    description: "Bitcoin price card with chart",
    icon: "₿",
    config: {
      type: "coin",
      coin: "bitcoin",
      theme: "dark",
      width: "fixed",
      fixedWidth: 400,
      borderRadius: 16,
      accentColor: "#f97316",
    },
  },
  {
    name: "Market Monitor",
    description: "Top coins overview widget",
    icon: "📊",
    config: {
      type: "market",
      theme: "dark",
      width: "responsive",
      showTitle: true,
      borderRadius: 12,
    },
  },
  {
    name: "Sentiment Gauge",
    description: "Fear & Greed index for analyst sites",
    icon: "🎯",
    config: {
      type: "fear-greed",
      theme: "auto",
      width: "fixed",
      fixedWidth: 360,
      showTitle: true,
      borderRadius: 16,
      accentColor: "#22c55e",
    },
  },
  {
    name: "Trading View",
    description: "Interactive chart for trading pages",
    icon: "📉",
    config: {
      type: "chart",
      symbol: "BINANCE:BTCUSDT",
      interval: "D",
      theme: "dark",
      width: "responsive",
      borderRadius: 8,
    },
  },
];

const BASE_URL = "https://cryptocurrency.cv";

export default function WidgetBuilder() {
  const [config, setConfig] = useState<WidgetConfig>({
    type: "ticker",
    theme: "dark",
    width: "responsive",
    fixedWidth: 400,
    count: 10,
    coin: "bitcoin",
    showTitle: true,
    showTimestamp: true,
    symbol: "BINANCE:BTCUSDT",
    interval: "D",
    accentColor: "#3b82f6",
    borderRadius: 8,
    refreshInterval: 60,
    transparent: false,
    locale: "en",
  });

  const [copied, setCopied] = useState<string | null>(null);
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>("desktop");
  const [embedTab, setEmbedTab] = useState<EmbedTab>("iframe");
  const [showTemplates, setShowTemplates] = useState(true);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const updateConfig = useCallback(
    <K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => {
      setConfig((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const applyTemplate = useCallback((template: QuickStartTemplate) => {
    setConfig((prev) => ({ ...prev, ...template.config }));
    setShowTemplates(false);
  }, []);

  const embedUrl = useMemo(() => {
    const params = new URLSearchParams();
    params.set("theme", config.theme);
    if (config.type === "news") {
      params.set("count", config.count.toString());
    }
    if (config.type === "coin") {
      params.set("coin", config.coin);
    }
    if (config.type === "chart") {
      params.set("symbol", config.symbol);
      params.set("interval", config.interval);
    }
    if (!config.showTitle) params.set("title", "false");
    if (config.accentColor !== "#3b82f6")
      params.set("accent", config.accentColor.replace("#", ""));
    if (config.borderRadius !== 8)
      params.set("radius", config.borderRadius.toString());
    if (config.refreshInterval !== 60)
      params.set("refresh", config.refreshInterval.toString());
    if (config.transparent) params.set("transparent", "true");
    if (config.locale !== "en") params.set("locale", config.locale);
    return `${BASE_URL}/embed/${config.type}?${params.toString()}`;
  }, [config]);

  const iframeHeight = useMemo(() => {
    switch (config.type) {
      case "ticker":
        return 48;
      case "news":
        return 40 + config.count * 76 + (config.showTitle ? 40 : 0) + 32;
      case "coin":
        return 320;
      case "market":
        return 380;
      case "fear-greed":
        return 280;
      case "chart":
        return 500;
      default:
        return 400;
    }
  }, [config]);

  const iframeWidth =
    config.width === "fixed" ? `${config.fixedWidth}px` : "100%";

  const iframeCode = `<iframe src="${embedUrl}" width="${config.width === "fixed" ? config.fixedWidth : "100%"}" height="${iframeHeight}" style="border:none;border-radius:${config.borderRadius}px;overflow:hidden;" loading="lazy" title="Crypto Vision News Widget"></iframe>`;

  const scriptCode = `<script src="${BASE_URL}/widget/embed.js" data-type="${config.type}" data-theme="${config.theme}"${config.type === "news" ? ` data-count="${config.count}"` : ""}${config.type === "coin" ? ` data-coin="${config.coin}"` : ""}${config.type === "chart" ? ` data-symbol="${config.symbol}" data-interval="${config.interval}"` : ""}${!config.showTitle ? ' data-title="false"' : ""}${config.accentColor !== "#3b82f6" ? ` data-accent="${config.accentColor.replace("#", "")}"` : ""}${config.borderRadius !== 8 ? ` data-radius="${config.borderRadius}"` : ""}><\/script>`;

  const reactCode = `import { CryptoWidget } from '@nicholasgriffintn/crypto-widget-react';

export default function MyWidget() {
  return (
    <CryptoWidget
      type="${config.type}"
      theme="${config.theme}"${config.type === "news" ? `\n      count={${config.count}}` : ""}${config.type === "coin" ? `\n      coin="${config.coin}"` : ""}${config.type === "chart" ? `\n      symbol="${config.symbol}"\n      interval="${config.interval}"` : ""}${!config.showTitle ? "\n      showTitle={false}" : ""}${config.accentColor !== "#3b82f6" ? `\n      accentColor="${config.accentColor}"` : ""}${config.borderRadius !== 8 ? `\n      borderRadius={${config.borderRadius}}` : ""}
    />
  );
}`;

  const vueCode = `<template>
  <crypto-widget
    type="${config.type}"
    theme="${config.theme}"${config.type === "news" ? `\n    :count="${config.count}"` : ""}${config.type === "coin" ? `\n    coin="${config.coin}"` : ""}${config.type === "chart" ? `\n    symbol="${config.symbol}"\n    interval="${config.interval}"` : ""}${!config.showTitle ? '\n    :show-title="false"' : ""}${config.accentColor !== "#3b82f6" ? `\n    accent-color="${config.accentColor}"` : ""}${config.borderRadius !== 8 ? `\n    :border-radius="${config.borderRadius}"` : ""}
  />
</template>

<script setup>
import { CryptoWidget } from '@nicholasgriffintn/crypto-widget-vue';
<\/script>`;

  const wordpressCode = `[crypto_widget type="${config.type}" theme="${config.theme}"${config.type === "news" ? ` count="${config.count}"` : ""}${config.type === "coin" ? ` coin="${config.coin}"` : ""}${config.type === "chart" ? ` symbol="${config.symbol}" interval="${config.interval}"` : ""}${!config.showTitle ? ' title="false"' : ""}${config.accentColor !== "#3b82f6" ? ` accent="${config.accentColor.replace("#", "")}"` : ""}${config.borderRadius !== 8 ? ` radius="${config.borderRadius}"` : ""}]`;

  const getEmbedCode = () => {
    switch (embedTab) {
      case "iframe":
        return iframeCode;
      case "script":
        return scriptCode;
      case "react":
        return reactCode;
      case "vue":
        return vueCode;
      case "wordpress":
        return wordpressCode;
    }
  };

  const copyToClipboard = useCallback(async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  const previewWidth =
    previewDevice === "mobile"
      ? 375
      : previewDevice === "tablet"
        ? 768
        : undefined;

  const currentWidget =
    WIDGET_TYPES.find((w) => w.id === config.type) ?? WIDGET_TYPES[0];

  const toggleSection = (section: string) => {
    setActiveSection((prev) => (prev === section ? null : section));
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xl">
              ⚡
            </div>
            <div>
              <h1 className="text-3xl font-bold">Widget Builder</h1>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Create free embeddable crypto widgets for any website
              </p>
            </div>
          </div>
          <p className="text-[var(--color-text-tertiary)] text-sm mt-3 max-w-2xl">
            Configure your widget, preview it live, and grab the embed code.
            Works everywhere — WordPress, React, Vue, static HTML, and more. No
            API key required.
          </p>
        </div>

        {/* Quick Start Templates */}
        {showTemplates && (
          <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Quick Start Templates</h2>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
                  Choose a pre-configured template or start from scratch
                </p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors px-3 py-1.5 rounded-lg hover:bg-[var(--color-surface-secondary)]"
              >
                Skip →
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {QUICK_START_TEMPLATES.map((template) => (
                <button
                  key={template.name}
                  onClick={() => applyTemplate(template)}
                  className="flex items-start gap-3 p-4 rounded-lg border border-[var(--color-border)] hover:border-blue-500/50 hover:bg-blue-500/5 text-left transition-all group"
                >
                  <span className="text-2xl mt-0.5 group-hover:scale-110 transition-transform">
                    {template.icon}
                  </span>
                  <div>
                    <div className="font-semibold text-sm">{template.name}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                      {template.description}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Configuration Panel */}
          <div className="space-y-4">
            {/* Widget Type Selector */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-lg font-semibold mb-4">Widget Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WIDGET_TYPES.map((wt) => (
                  <button
                    key={wt.id}
                    onClick={() => updateConfig("type", wt.id)}
                    className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                      config.type === wt.id
                        ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500"
                        : "border-[var(--color-border)] hover:border-blue-500/50 hover:bg-[var(--color-surface-secondary)]"
                    }`}
                  >
                    <span className="text-2xl">{wt.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{wt.name}</div>
                      <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                        {wt.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme & Layout */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <div className="space-y-5">
                {/* Theme */}
                <div>
                  <span className="text-sm font-medium mb-2 block text-[var(--color-text-secondary)]">
                    Theme
                  </span>
                  <div className="flex gap-2">
                    {(["dark", "light", "auto"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => updateConfig("theme", t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          config.theme === t
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                            : "bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-secondary)]/80 text-[var(--color-text-primary)]"
                        }`}
                      >
                        {t === "auto"
                          ? "🌗 Auto"
                          : t === "dark"
                            ? "🌙 Dark"
                            : "☀️ Light"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <span className="text-sm font-medium mb-2 block text-[var(--color-text-secondary)]">
                    Accent Color
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ACCENT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => updateConfig("accentColor", color.value)}
                        title={color.label}
                        className={`w-8 h-8 rounded-full transition-all ${
                          config.accentColor === color.value
                            ? "ring-2 ring-offset-2 ring-offset-[var(--color-surface)] scale-110"
                            : "hover:scale-110"
                        }`}
                        style={{ backgroundColor: color.value }}
                      />
                    ))}
                    <label
                      title="Custom color"
                      className="relative w-8 h-8 rounded-full border-2 border-dashed border-[var(--color-border)] hover:border-[var(--color-text-tertiary)] cursor-pointer flex items-center justify-center transition-all hover:scale-110"
                    >
                      <span className="text-xs">🎨</span>
                      <input
                        type="color"
                        value={config.accentColor}
                        onChange={(e) =>
                          updateConfig("accentColor", e.target.value)
                        }
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </label>
                  </div>
                </div>

                {/* Border Radius */}
                <div>
                  <span className="text-sm font-medium mb-2 block text-[var(--color-text-secondary)]">
                    Border Radius: {config.borderRadius}px
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={24}
                    value={config.borderRadius}
                    onChange={(e) =>
                      updateConfig("borderRadius", parseInt(e.target.value))
                    }
                    className="w-full accent-blue-500"
                  />
                  <div className="flex justify-between text-[10px] text-[var(--color-text-tertiary)] mt-1">
                    <span>Square</span>
                    <span>Rounded</span>
                  </div>
                </div>

                {/* Width */}
                <div>
                  <span className="text-sm font-medium mb-2 block text-[var(--color-text-secondary)]">
                    Width
                  </span>
                  <div className="flex gap-2">
                    {(["responsive", "fixed"] as const).map((w) => (
                      <button
                        key={w}
                        onClick={() => updateConfig("width", w)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          config.width === w
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                            : "bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-secondary)]/80 text-[var(--color-text-primary)]"
                        }`}
                      >
                        {w}
                      </button>
                    ))}
                  </div>
                  {config.width === "fixed" && (
                    <div className="mt-3">
                      <input
                        type="range"
                        min={280}
                        max={800}
                        value={config.fixedWidth}
                        onChange={(e) =>
                          updateConfig("fixedWidth", parseInt(e.target.value))
                        }
                        className="w-full accent-blue-500"
                      />
                      <div className="text-xs text-[var(--color-text-tertiary)] mt-1">
                        {config.fixedWidth}px
                      </div>
                    </div>
                  )}
                </div>

                {/* Transparent Background */}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.transparent}
                    onChange={(e) =>
                      updateConfig("transparent", e.target.checked)
                    }
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    Transparent background
                  </span>
                </label>
              </div>
            </div>

            {/* Widget-specific Options */}
            {(config.type === "news" ||
              config.type === "coin" ||
              config.type === "chart") && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <h2 className="text-lg font-semibold mb-4">Widget Options</h2>
                <div className="space-y-4">
                  {config.type === "news" && (
                    <div>
                      <span className="text-sm font-medium mb-2 block text-[var(--color-text-secondary)]">
                        Number of Articles
                      </span>
                      <div className="flex gap-2">
                        {COUNT_OPTIONS.map((c) => (
                          <button
                            key={c}
                            onClick={() => updateConfig("count", c)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              config.count === c
                                ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                : "bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-secondary)]/80 text-[var(--color-text-primary)]"
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {config.type === "coin" && (
                    <div>
                      <span className="text-sm font-medium mb-2 block text-[var(--color-text-secondary)]">
                        Select Coin
                      </span>
                      <select
                        value={config.coin}
                        onChange={(e) => updateConfig("coin", e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {POPULAR_COINS.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {config.type === "chart" && (
                    <>
                      <div>
                        <span className="text-sm font-medium mb-2 block text-[var(--color-text-secondary)]">
                          Trading Pair
                        </span>
                        <select
                          value={config.symbol}
                          onChange={(e) =>
                            updateConfig("symbol", e.target.value)
                          }
                          className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="BINANCE:BTCUSDT">BTC / USDT</option>
                          <option value="BINANCE:ETHUSDT">ETH / USDT</option>
                          <option value="BINANCE:SOLUSDT">SOL / USDT</option>
                          <option value="BINANCE:XRPUSDT">XRP / USDT</option>
                          <option value="BINANCE:ADAUSDT">ADA / USDT</option>
                          <option value="BINANCE:DOGEUSDT">DOGE / USDT</option>
                          <option value="BINANCE:AVAXUSDT">AVAX / USDT</option>
                          <option value="BINANCE:BNBUSDT">BNB / USDT</option>
                          <option value="BINANCE:DOTUSDT">DOT / USDT</option>
                          <option value="BINANCE:LINKUSDT">LINK / USDT</option>
                        </select>
                      </div>
                      <div>
                        <span className="text-sm font-medium mb-2 block text-[var(--color-text-secondary)]">
                          Default Interval
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { label: "1m", value: "1" },
                            { label: "5m", value: "5" },
                            { label: "15m", value: "15" },
                            { label: "1H", value: "60" },
                            { label: "4H", value: "240" },
                            { label: "1D", value: "D" },
                            { label: "1W", value: "W" },
                          ].map((i) => (
                            <button
                              key={i.value}
                              onClick={() => updateConfig("interval", i.value)}
                              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                config.interval === i.value
                                  ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                                  : "bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-secondary)]/80 text-[var(--color-text-primary)]"
                              }`}
                            >
                              {i.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Display & Behavior Options */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <h2 className="text-lg font-semibold mb-4">
                Display &amp; Behavior
              </h2>
              <div className="space-y-4">
                <div className="space-y-3">
                  {config.type !== "ticker" && (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.showTitle}
                        onChange={(e) =>
                          updateConfig("showTitle", e.target.checked)
                        }
                        className="w-4 h-4 rounded accent-blue-500"
                      />
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        Show title
                      </span>
                    </label>
                  )}
                </div>

                {/* Auto-refresh */}
                <div>
                  <span className="text-sm font-medium mb-2 block text-[var(--color-text-secondary)]">
                    Auto-refresh Interval
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {REFRESH_OPTIONS.map((r) => (
                      <button
                        key={r.value}
                        onClick={() => updateConfig("refreshInterval", r.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          config.refreshInterval === r.value
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/25"
                            : "bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-secondary)]/80 text-[var(--color-text-primary)]"
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Locale */}
                <div>
                  <span className="text-sm font-medium mb-2 block text-[var(--color-text-secondary)]">
                    Language
                  </span>
                  <select
                    value={config.locale}
                    onChange={(e) => updateConfig("locale", e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {LOCALE_OPTIONS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {l.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Reset / Show Templates */}
            <div className="flex gap-3">
              {!showTemplates && (
                <button
                  onClick={() => setShowTemplates(true)}
                  className="flex-1 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-all"
                >
                  ← Browse Templates
                </button>
              )}
              <button
                onClick={() =>
                  setConfig({
                    type: "ticker",
                    theme: "dark",
                    width: "responsive",
                    fixedWidth: 400,
                    count: 10,
                    coin: "bitcoin",
                    showTitle: true,
                    showTimestamp: true,
                    symbol: "BINANCE:BTCUSDT",
                    interval: "D",
                    accentColor: "#3b82f6",
                    borderRadius: 8,
                    refreshInterval: 60,
                    transparent: false,
                    locale: "en",
                  })
                }
                className="flex-1 py-2.5 rounded-lg border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-secondary)] transition-all"
              >
                Reset to Defaults
              </button>
            </div>
          </div>

          {/* RIGHT: Preview + Embed Code */}
          <div className="space-y-4">
            {/* Live Preview */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 lg:sticky lg:top-20">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold">Live Preview</h2>
                  <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium animate-pulse">
                    ● Live
                  </span>
                </div>
                {/* Device Preview Toggle */}
                <div className="flex items-center gap-1 bg-[var(--color-surface-secondary)] rounded-lg p-0.5">
                  {[
                    { id: "desktop" as const, label: "🖥️", title: "Desktop" },
                    { id: "tablet" as const, label: "📱", title: "Tablet" },
                    { id: "mobile" as const, label: "📲", title: "Mobile" },
                  ].map((device) => (
                    <button
                      key={device.id}
                      onClick={() => setPreviewDevice(device.id)}
                      title={device.title}
                      className={`px-2 py-1 rounded-md text-sm transition-all ${
                        previewDevice === device.id
                          ? "bg-[var(--color-surface)] shadow-sm"
                          : "hover:bg-[var(--color-surface)]/50"
                      }`}
                    >
                      {device.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview container with device frame */}
              <div className="flex justify-center">
                <div
                  className="rounded-lg border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface-secondary)]/30 transition-all duration-300"
                  style={{
                    width: previewWidth ? `${previewWidth}px` : "100%",
                    maxWidth: "100%",
                  }}
                >
                  <iframe
                    src={embedUrl}
                    width={
                      previewWidth
                        ? Math.min(
                            previewWidth,
                            parseInt(iframeWidth) || previewWidth,
                          )
                        : iframeWidth
                    }
                    height={iframeHeight}
                    style={{
                      border: "none",
                      display: "block",
                      maxWidth: "100%",
                      borderRadius: `${config.borderRadius}px`,
                    }}
                    title="Widget Preview"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* Widget info bar */}
              <div className="mt-4 flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                <div className="flex items-center gap-3">
                  <span>
                    {currentWidget.icon} {currentWidget.name}
                  </span>
                  <span>•</span>
                  <span>
                    {config.width === "fixed"
                      ? `${config.fixedWidth}px`
                      : "Responsive"}{" "}
                    × {iframeHeight}px
                  </span>
                </div>
                <span>
                  Refreshes every{" "}
                  {config.refreshInterval < 60
                    ? `${config.refreshInterval}s`
                    : `${config.refreshInterval / 60}m`}
                </span>
              </div>
            </div>

            {/* Embed Code with Tabs */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Embed Code</h2>
                <button
                  onClick={() => copyToClipboard(getEmbedCode(), embedTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied === embedTab
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                  }`}
                >
                  {copied === embedTab ? "✓ Copied!" : "Copy Code"}
                </button>
              </div>

              {/* Tab bar */}
              <div className="flex flex-wrap gap-1 mb-4 bg-[var(--color-surface-secondary)] rounded-lg p-1">
                {[
                  { id: "iframe" as const, label: "HTML" },
                  { id: "script" as const, label: "Script" },
                  { id: "react" as const, label: "React" },
                  { id: "vue" as const, label: "Vue" },
                  { id: "wordpress" as const, label: "WordPress" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setEmbedTab(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                      embedTab === tab.id
                        ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm"
                        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative">
                <pre className="bg-[var(--color-surface-secondary)] rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed text-[var(--color-text-secondary)] max-h-64 overflow-y-auto">
                  <code>{getEmbedCode()}</code>
                </pre>
              </div>

              {embedTab === "script" && (
                <p className="text-xs text-[var(--color-text-tertiary)] mt-3">
                  The script tag automatically creates an iframe and handles
                  resizing. Just paste it where you want the widget to appear.
                </p>
              )}
              {embedTab === "react" && (
                <p className="text-xs text-[var(--color-text-tertiary)] mt-3">
                  Install:{" "}
                  <code className="bg-[var(--color-surface-secondary)] px-1.5 py-0.5 rounded text-xs">
                    npm install @nicholasgriffintn/crypto-widget-react
                  </code>
                </p>
              )}
              {embedTab === "vue" && (
                <p className="text-xs text-[var(--color-text-tertiary)] mt-3">
                  Install:{" "}
                  <code className="bg-[var(--color-surface-secondary)] px-1.5 py-0.5 rounded text-xs">
                    npm install @nicholasgriffintn/crypto-widget-vue
                  </code>
                </p>
              )}
              {embedTab === "wordpress" && (
                <p className="text-xs text-[var(--color-text-tertiary)] mt-3">
                  Paste this shortcode into any post or page. Requires the
                  Crypto Vision News WordPress plugin.
                </p>
              )}
            </div>

            {/* Usage Tips */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <button
                onClick={() => toggleSection("tips")}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-lg font-semibold">Usage Tips</h2>
                <svg
                  className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform ${activeSection === "tips" ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {activeSection === "tips" && (
                <ul className="text-sm text-[var(--color-text-secondary)] space-y-2 mt-4">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Widgets auto-refresh data based on your interval setting
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Use{" "}
                    <code className="bg-[var(--color-surface-secondary)] px-1.5 py-0.5 rounded text-xs">
                      theme=auto
                    </code>{" "}
                    to match your site&apos;s color scheme
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Widgets are fully responsive and mobile-friendly
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    No API key required — free for everyone
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Customize accent colors to match your brand
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>8 languages
                    supported for international audiences
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500 mt-0.5">✓</span>
                    Data powered by{" "}
                    <a
                      href={BASE_URL}
                      className="text-blue-500 hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Crypto Vision News
                    </a>
                  </li>
                </ul>
              )}
            </div>

            {/* FAQ */}
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <button
                onClick={() => toggleSection("faq")}
                className="flex items-center justify-between w-full text-left"
              >
                <h2 className="text-lg font-semibold">
                  Frequently Asked Questions
                </h2>
                <svg
                  className={`w-4 h-4 text-[var(--color-text-tertiary)] transition-transform ${activeSection === "faq" ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {activeSection === "faq" && (
                <div className="space-y-4 mt-4">
                  <div>
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                      Is this really free?
                    </h3>
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                      Yes! All widgets are completely free with no API key
                      required. The &quot;Powered by&quot; branding is required
                      and always displayed on all widgets.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                      Can I use these on commercial sites?
                    </h3>
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                      Absolutely. Widgets are free for both personal and
                      commercial use.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                      How often does the data update?
                    </h3>
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                      Widgets auto-refresh based on your configured interval (30
                      seconds to 10 minutes). Price data is sourced from major
                      exchanges in real-time.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                      Can I customize the styling further?
                    </h3>
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                      Yes — theme, accent color, border radius, and transparency
                      are all configurable. For advanced CSS customization, use
                      the script embed which gives more control.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
                      Do widgets work on mobile?
                    </h3>
                    <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                      Yes, all widgets are fully responsive. Use the preview
                      device toggle above to see how they look on different
                      screen sizes.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
