"use client";

import { useState, useCallback, useMemo } from "react";

type WidgetType = "ticker" | "news" | "coin" | "market" | "fear-greed";
type ThemeOption = "dark" | "light" | "auto";
type WidthOption = "responsive" | "fixed";

interface WidgetConfig {
  type: WidgetType;
  theme: ThemeOption;
  width: WidthOption;
  fixedWidth: number;
  count: number;
  coin: string;
  showTitle: boolean;
  showBranding: boolean;
  showTimestamp: boolean;
}

const WIDGET_TYPES: { id: WidgetType; name: string; icon: string; description: string }[] = [
  { id: "ticker", name: "Price Ticker", icon: "📈", description: "Horizontal scrolling bar of live crypto prices" },
  { id: "news", name: "News Feed", icon: "📰", description: "Card list of latest cryptocurrency news" },
  { id: "coin", name: "Single Coin", icon: "🪙", description: "Detailed price card for a specific coin" },
  { id: "market", name: "Market Overview", icon: "📊", description: "Mini dashboard with top 5 coins" },
  { id: "fear-greed", name: "Fear & Greed", icon: "🎯", description: "Market sentiment gauge widget" },
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

const COUNT_OPTIONS = [5, 10, 15];

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
    showBranding: true,
    showTimestamp: true,
  });

  const [copied, setCopied] = useState<"iframe" | "script" | null>(null);

  const updateConfig = useCallback(<K extends keyof WidgetConfig>(key: K, value: WidgetConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
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
    if (!config.showTitle) params.set("title", "false");
    if (!config.showBranding) params.set("branding", "false");
    return `${BASE_URL}/embed/${config.type}?${params.toString()}`;
  }, [config]);

  const iframeHeight = useMemo(() => {
    switch (config.type) {
      case "ticker": return 48;
      case "news": return 40 + config.count * 76 + (config.showTitle ? 40 : 0) + (config.showBranding ? 32 : 0);
      case "coin": return 320;
      case "market": return 380;
      case "fear-greed": return 280;
      default: return 400;
    }
  }, [config]);

  const iframeWidth = config.width === "fixed" ? `${config.fixedWidth}px` : "100%";

  const iframeCode = `<iframe src="${embedUrl}" width="${config.width === "fixed" ? config.fixedWidth : "100%"}" height="${iframeHeight}" style="border:none;border-radius:8px;overflow:hidden;" loading="lazy" title="Free Crypto News Widget"></iframe>`;

  const scriptCode = `<script src="${BASE_URL}/widget/embed.js" data-type="${config.type}" data-theme="${config.theme}"${config.type === "news" ? ` data-count="${config.count}"` : ""}${config.type === "coin" ? ` data-coin="${config.coin}"` : ""}${!config.showTitle ? ' data-title="false"' : ""}${!config.showBranding ? ' data-branding="false"' : ""}></script>`;

  const copyToClipboard = useCallback(async (text: string, type: "iframe" | "script") => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback
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

  const currentWidget = WIDGET_TYPES.find((w) => w.id === config.type)!;

  const isDark = true; // Builder page uses app theme, but we'll style for dark bg

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Widget Builder</h1>
          <p className="text-muted-foreground text-lg">
            Create embeddable crypto widgets for your website. Configure, preview, and copy the embed code.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT: Configuration Panel */}
          <div className="space-y-6">
            {/* Widget Type Selector */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Widget Type</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {WIDGET_TYPES.map((wt) => (
                  <button
                    key={wt.id}
                    onClick={() => updateConfig("type", wt.id)}
                    className={`flex items-start gap-3 p-4 rounded-lg border text-left transition-all ${
                      config.type === wt.id
                        ? "border-blue-500 bg-blue-500/10 ring-1 ring-blue-500"
                        : "border-border hover:border-blue-500/50 hover:bg-muted/50"
                    }`}
                  >
                    <span className="text-2xl">{wt.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{wt.name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{wt.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme & Layout */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Appearance</h2>
              <div className="space-y-4">
                {/* Theme */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Theme</label>
                  <div className="flex gap-2">
                    {(["dark", "light", "auto"] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => updateConfig("theme", t)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          config.theme === t
                            ? "bg-blue-500 text-white"
                            : "bg-muted hover:bg-muted/80 text-foreground"
                        }`}
                      >
                        {t === "auto" ? "🌗 Auto" : t === "dark" ? "🌙 Dark" : "☀️ Light"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Width */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Width</label>
                  <div className="flex gap-2">
                    {(["responsive", "fixed"] as const).map((w) => (
                      <button
                        key={w}
                        onClick={() => updateConfig("width", w)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${
                          config.width === w
                            ? "bg-blue-500 text-white"
                            : "bg-muted hover:bg-muted/80 text-foreground"
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
                        onChange={(e) => updateConfig("fixedWidth", parseInt(e.target.value))}
                        className="w-full accent-blue-500"
                      />
                      <div className="text-xs text-muted-foreground mt-1">{config.fixedWidth}px</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Widget-specific Options */}
            {(config.type === "news" || config.type === "coin") && (
              <div className="rounded-xl border border-border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Widget Options</h2>
                <div className="space-y-4">
                  {config.type === "news" && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">Number of Articles</label>
                      <div className="flex gap-2">
                        {COUNT_OPTIONS.map((c) => (
                          <button
                            key={c}
                            onClick={() => updateConfig("count", c)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              config.count === c
                                ? "bg-blue-500 text-white"
                                : "bg-muted hover:bg-muted/80 text-foreground"
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
                      <label className="text-sm font-medium mb-2 block">Select Coin</label>
                      <select
                        value={config.coin}
                        onChange={(e) => updateConfig("coin", e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-border bg-muted text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {POPULAR_COINS.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show/Hide Elements */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Display Options</h2>
              <div className="space-y-3">
                {config.type !== "ticker" && (
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showTitle}
                      onChange={(e) => updateConfig("showTitle", e.target.checked)}
                      className="w-4 h-4 rounded accent-blue-500"
                    />
                    <span className="text-sm">Show title</span>
                  </label>
                )}
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showBranding}
                    onChange={(e) => updateConfig("showBranding", e.target.checked)}
                    className="w-4 h-4 rounded accent-blue-500"
                  />
                  <span className="text-sm">Show &quot;Powered by&quot; branding</span>
                </label>
              </div>
            </div>
          </div>

          {/* RIGHT: Preview + Embed Code */}
          <div className="space-y-6">
            {/* Live Preview */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Live Preview</h2>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">
                  ● Live
                </span>
              </div>
              <div
                className="rounded-lg border border-border overflow-hidden bg-muted/30"
                style={{ maxWidth: config.width === "fixed" ? config.fixedWidth : "100%" }}
              >
                <iframe
                  src={embedUrl}
                  width={iframeWidth}
                  height={iframeHeight}
                  style={{ border: "none", display: "block", maxWidth: "100%" }}
                  title="Widget Preview"
                  loading="lazy"
                />
              </div>
            </div>

            {/* Embed Code — iframe */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Embed Code (iframe)</h2>
                <button
                  onClick={() => copyToClipboard(iframeCode, "iframe")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied === "iframe"
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {copied === "iframe" ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed">
                <code>{iframeCode}</code>
              </pre>
            </div>

            {/* Embed Code — Script */}
            <div className="rounded-xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold">Embed Code (Script)</h2>
                <button
                  onClick={() => copyToClipboard(scriptCode, "script")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    copied === "script"
                      ? "bg-green-500 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                >
                  {copied === "script" ? "✓ Copied!" : "Copy"}
                </button>
              </div>
              <pre className="bg-muted rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed">
                <code>{scriptCode}</code>
              </pre>
              <p className="text-xs text-muted-foreground mt-3">
                The script tag automatically creates an iframe and handles resizing. Just paste it where you want the widget to appear.
              </p>
            </div>

            {/* Usage Tips */}
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-lg font-semibold mb-3">Usage Tips</h2>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Widgets auto-refresh data every 1–5 minutes</li>
                <li>• Use <code className="bg-muted px-1.5 py-0.5 rounded text-xs">theme=auto</code> to match your site&apos;s color scheme</li>
                <li>• Widgets are fully responsive and mobile-friendly</li>
                <li>• No API key required — free for everyone</li>
                <li>• Data powered by <a href={BASE_URL} className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Free Crypto News</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
