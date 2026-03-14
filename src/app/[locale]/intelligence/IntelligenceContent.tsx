"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Link } from "@/i18n/navigation";
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Zap,
  Activity,
  BarChart3,
  Eye,
  Clock,
  ArrowRight,
  Shield,
  Globe,
  Layers,
  Sparkles,
  Target,
  Waves,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Signal {
  id: string;
  type: "bullish" | "bearish" | "neutral";
  strength: number;
  title: string;
  description: string;
  source: string;
  timestamp: string;
  coins: string[];
}

interface WhaleAlert {
  id: string;
  coin: string;
  symbol: string;
  amount: number;
  valueUsd: number;
  from: string;
  to: string;
  timestamp: string;
  type: "exchange_inflow" | "exchange_outflow" | "whale_transfer";
}

interface Narrative {
  id: string;
  name: string;
  trend: "rising" | "falling" | "stable";
  score: number;
  weekChange: number;
  coins: string[];
  description: string;
}

interface AnomalyEvent {
  id: string;
  type: "volume_spike" | "price_deviation" | "correlation_break" | "liquidity_shift";
  severity: "high" | "medium" | "low";
  coin: string;
  symbol: string;
  title: string;
  description: string;
  timestamp: string;
  metric: number;
}

interface MarketSentiment {
  overall: number;
  social: number;
  news: number;
  onChain: number;
  technical: number;
}

/* ------------------------------------------------------------------ */
/*  Demo data                                                          */
/* ------------------------------------------------------------------ */

const DEMO_SIGNALS: Signal[] = [
  { id: "s1", type: "bullish", strength: 82, title: "BTC Golden Cross Forming", description: "50-day MA crossing above 200-day MA — historically precedes 30-60% rallies", source: "Technical Analysis", timestamp: new Date(Date.now() - 1800000).toISOString(), coins: ["BTC"] },
  { id: "s2", type: "bearish", strength: 71, title: "ETH Funding Rate Overheated", description: "Perpetual futures funding rate at 0.08% — signals overleveraged longs and potential correction", source: "Derivatives Data", timestamp: new Date(Date.now() - 3600000).toISOString(), coins: ["ETH"] },
  { id: "s3", type: "bullish", strength: 68, title: "SOL DEX Volume Surge", description: "Solana DEX volume up 140% in 24h — on-chain activity signals growing ecosystem demand", source: "On-Chain Analytics", timestamp: new Date(Date.now() - 5400000).toISOString(), coins: ["SOL"] },
  { id: "s4", type: "neutral", strength: 55, title: "Stablecoin Supply Expanding", description: "USDT and USDC combined supply up $2.3B this week — dry powder entering the market", source: "Stablecoin Flows", timestamp: new Date(Date.now() - 7200000).toISOString(), coins: ["USDT", "USDC"] },
  { id: "s5", type: "bullish", strength: 77, title: "Institutional Accumulation", description: "Bitcoin ETF inflows hit $890M this week — strongest since March 2025", source: "Fund Flows", timestamp: new Date(Date.now() - 9000000).toISOString(), coins: ["BTC"] },
  { id: "s6", type: "bearish", strength: 63, title: "AVAX Large Unlock Approaching", description: "64M AVAX tokens unlocking in 5 days — ~4.2% of circulating supply", source: "Token Unlocks", timestamp: new Date(Date.now() - 10800000).toISOString(), coins: ["AVAX"] },
];

const DEMO_WHALE_ALERTS: WhaleAlert[] = [
  { id: "w1", coin: "Bitcoin", symbol: "BTC", amount: 2150, valueUsd: 185_000_000, from: "Unknown Wallet", to: "Coinbase", timestamp: new Date(Date.now() - 900000).toISOString(), type: "exchange_inflow" },
  { id: "w2", coin: "Ethereum", symbol: "ETH", amount: 45000, valueUsd: 142_000_000, from: "Binance", to: "Unknown Wallet", timestamp: new Date(Date.now() - 2700000).toISOString(), type: "exchange_outflow" },
  { id: "w3", coin: "Bitcoin", symbol: "BTC", amount: 5200, valueUsd: 448_000_000, from: "Unknown Wallet", to: "Unknown Wallet", timestamp: new Date(Date.now() - 4500000).toISOString(), type: "whale_transfer" },
  { id: "w4", coin: "Solana", symbol: "SOL", amount: 1200000, valueUsd: 78_000_000, from: "Kraken", to: "Unknown Wallet", timestamp: new Date(Date.now() - 6300000).toISOString(), type: "exchange_outflow" },
  { id: "w5", coin: "Ethereum", symbol: "ETH", amount: 28000, valueUsd: 88_000_000, from: "Unknown Wallet", to: "Binance", timestamp: new Date(Date.now() - 8100000).toISOString(), type: "exchange_inflow" },
];

const DEMO_NARRATIVES: Narrative[] = [
  { id: "n1", name: "AI & Compute", trend: "rising", score: 92, weekChange: 18, coins: ["RNDR", "TAO", "FET", "NEAR"], description: "AI infrastructure tokens surging on new GPU compute demand" },
  { id: "n2", name: "Real-World Assets", trend: "rising", score: 87, weekChange: 12, coins: ["ONDO", "MKR", "COMP", "MAPLE"], description: "RWA tokenization accelerating with institutional adoption" },
  { id: "n3", name: "Layer 2 Scaling", trend: "stable", score: 71, weekChange: 3, coins: ["ARB", "OP", "STRK", "ZK"], description: "L2 ecosystem maturing with growing TVL and transaction counts" },
  { id: "n4", name: "DePIN", trend: "rising", score: 79, weekChange: 15, coins: ["HNT", "IOTX", "DIMO", "WIFI"], description: "Decentralized physical infrastructure gaining real-world traction" },
  { id: "n5", name: "Memecoins", trend: "falling", score: 44, weekChange: -22, coins: ["DOGE", "SHIB", "PEPE", "WIF"], description: "Memecoin momentum fading as capital rotates to utility tokens" },
  { id: "n6", name: "Liquid Staking", trend: "stable", score: 65, weekChange: -2, coins: ["LDO", "RPL", "SWISE", "ANKR"], description: "Liquid staking derivatives stabilizing after Ethereum restaking wave" },
];

const DEMO_ANOMALIES: AnomalyEvent[] = [
  { id: "a1", type: "volume_spike", severity: "high", coin: "Chainlink", symbol: "LINK", title: "Volume 8x Average", description: "LINK 24h volume hit $2.1B — 8x the 30-day average. Last time this happened, price moved 45% in 5 days.", timestamp: new Date(Date.now() - 1200000).toISOString(), metric: 800 },
  { id: "a2", type: "correlation_break", severity: "medium", coin: "Cardano", symbol: "ADA", title: "BTC Correlation Breakdown", description: "ADA-BTC 30-day correlation dropped to 0.12 from 0.85 — unusual independent price action", timestamp: new Date(Date.now() - 3600000).toISOString(), metric: -86 },
  { id: "a3", type: "liquidity_shift", severity: "high", coin: "Bitcoin", symbol: "BTC", title: "Order Book Imbalance", description: "BTC bid depth 3x ask depth on major exchanges — strong buy-side support forming", timestamp: new Date(Date.now() - 5400000).toISOString(), metric: 300 },
  { id: "a4", type: "price_deviation", severity: "low", coin: "Polkadot", symbol: "DOT", title: "Cross-Exchange Arbitrage", description: "1.2% price spread between Binance and Kraken — arbitrage opportunity detected", timestamp: new Date(Date.now() - 7200000).toISOString(), metric: 1.2 },
];

const DEMO_SENTIMENT: MarketSentiment = {
  overall: 68, social: 72, news: 61, onChain: 75, technical: 64,
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatUsd(v: number): string {
  if (v >= 1e9) return `$${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function sentimentLabel(v: number): string {
  if (v <= 25) return "Very Bearish";
  if (v <= 40) return "Bearish";
  if (v <= 60) return "Neutral";
  if (v <= 75) return "Bullish";
  return "Very Bullish";
}

function sentimentColor(v: number): string {
  if (v <= 25) return "text-red-500";
  if (v <= 40) return "text-orange-500";
  if (v <= 60) return "text-yellow-500";
  if (v <= 75) return "text-emerald-500";
  return "text-green-600";
}

function sentimentBg(v: number): string {
  if (v <= 25) return "bg-red-500";
  if (v <= 40) return "bg-orange-500";
  if (v <= 60) return "bg-yellow-500";
  if (v <= 75) return "bg-emerald-500";
  return "bg-green-600";
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function SentimentMeter({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="shrink-0 text-text-tertiary">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-text-secondary">{label}</span>
          <span className={cn("text-xs font-bold tabular-nums", sentimentColor(value))}>{value}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-border overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700", sentimentBg(value))} style={{ width: `${value}%` }} />
        </div>
      </div>
    </div>
  );
}

function SignalCard({ signal }: { signal: Signal }) {
  const typeConfig = {
    bullish: { icon: <TrendingUp className="h-4 w-4" />, color: "text-emerald-500", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    bearish: { icon: <TrendingDown className="h-4 w-4" />, color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    neutral: { icon: <Activity className="h-4 w-4" />, color: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
  };
  const config = typeConfig[signal.type];

  return (
    <div className={cn("rounded-lg border p-4 transition-all hover:shadow-md", config.border, config.bg)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={config.color}>{config.icon}</span>
          <span className={cn("text-xs font-bold uppercase tracking-wide", config.color)}>{signal.type}</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-1.5 w-12 rounded-full bg-border overflow-hidden">
            <div className={cn("h-full rounded-full", signal.strength >= 70 ? "bg-emerald-500" : signal.strength >= 50 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${signal.strength}%` }} />
          </div>
          <span className="text-[10px] tabular-nums text-text-tertiary">{signal.strength}%</span>
        </div>
      </div>
      <h4 className="mt-2 text-sm font-semibold">{signal.title}</h4>
      <p className="mt-1 text-xs text-text-secondary leading-relaxed">{signal.description}</p>
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {signal.coins.map((c) => (<Badge key={c} className="text-[10px] px-1.5 py-0">{c}</Badge>))}
        </div>
        <div className="flex items-center gap-2 text-[10px] text-text-tertiary">
          <span>{signal.source}</span>
          <span>·</span>
          <span>{timeAgo(signal.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}

function WhaleAlertCard({ alert }: { alert: WhaleAlert }) {
  const typeConfig = {
    exchange_inflow: { icon: <AlertTriangle className="h-4 w-4" />, label: "Exchange Inflow", color: "text-red-400", hint: "Potential selling pressure" },
    exchange_outflow: { icon: <Shield className="h-4 w-4" />, label: "Exchange Outflow", color: "text-emerald-400", hint: "Moving to cold storage" },
    whale_transfer: { icon: <Waves className="h-4 w-4" />, label: "Whale Transfer", color: "text-blue-400", hint: "Large OTC or wallet reorg" },
  };
  const config = typeConfig[alert.type];

  return (
    <div className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
      <div className={cn("shrink-0", config.color)}>{config.icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{formatUsd(alert.valueUsd)}</span>
          <Badge className="text-[10px] px-1.5 py-0">{alert.symbol}</Badge>
          <span className={cn("text-[10px] font-medium", config.color)}>{config.label}</span>
        </div>
        <p className="text-xs text-text-tertiary mt-0.5 truncate">{alert.from} → {alert.to}</p>
      </div>
      <span className="text-[10px] text-text-tertiary shrink-0">{timeAgo(alert.timestamp)}</span>
    </div>
  );
}

function NarrativeRow({ narrative }: { narrative: Narrative }) {
  const trendConfig = {
    rising: { icon: <TrendingUp className="h-3.5 w-3.5" />, color: "text-emerald-500" },
    falling: { icon: <TrendingDown className="h-3.5 w-3.5" />, color: "text-red-500" },
    stable: { icon: <Activity className="h-3.5 w-3.5" />, color: "text-yellow-500" },
  };
  const trend = trendConfig[narrative.trend];

  return (
    <div className="py-3 border-b border-border last:border-b-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={trend.color}>{trend.icon}</span>
          <span className="text-sm font-semibold">{narrative.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={cn("text-xs font-bold tabular-nums", narrative.weekChange > 0 ? "text-emerald-500" : narrative.weekChange < 0 ? "text-red-500" : "text-text-tertiary")}>
            {narrative.weekChange > 0 ? "+" : ""}{narrative.weekChange}%
          </span>
          <div className="h-1.5 w-16 rounded-full bg-border overflow-hidden">
            <div className={cn("h-full rounded-full", narrative.score >= 70 ? "bg-emerald-500" : narrative.score >= 50 ? "bg-yellow-500" : "bg-red-500")} style={{ width: `${narrative.score}%` }} />
          </div>
        </div>
      </div>
      <p className="mt-1 text-xs text-text-secondary">{narrative.description}</p>
      <div className="mt-2 flex gap-1">
        {narrative.coins.map((c) => (<Badge key={c} className="text-[10px] px-1.5 py-0">{c}</Badge>))}
      </div>
    </div>
  );
}

function AnomalyCard({ anomaly }: { anomaly: AnomalyEvent }) {
  const sevConfig = {
    high: { color: "text-red-500", bg: "bg-red-500/10", border: "border-red-500/20" },
    medium: { color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    low: { color: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  };
  const typeIcons: Record<string, React.ReactNode> = {
    volume_spike: <BarChart3 className="h-4 w-4" />,
    price_deviation: <Target className="h-4 w-4" />,
    correlation_break: <Layers className="h-4 w-4" />,
    liquidity_shift: <Waves className="h-4 w-4" />,
  };
  const config = sevConfig[anomaly.severity];

  return (
    <div className={cn("rounded-lg border p-3", config.border, config.bg)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={config.color}>{typeIcons[anomaly.type]}</span>
          <Badge className="text-[10px]">{anomaly.symbol}</Badge>
          <span className={cn("text-[10px] font-bold uppercase", config.color)}>{anomaly.severity}</span>
        </div>
        <span className="text-[10px] text-text-tertiary">{timeAgo(anomaly.timestamp)}</span>
      </div>
      <h4 className="mt-2 text-sm font-semibold">{anomaly.title}</h4>
      <p className="mt-1 text-xs text-text-secondary leading-relaxed">{anomaly.description}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function IntelligenceContent() {
  const [signals] = useState<Signal[]>(DEMO_SIGNALS);
  const [whaleAlerts] = useState<WhaleAlert[]>(DEMO_WHALE_ALERTS);
  const [narratives] = useState<Narrative[]>(DEMO_NARRATIVES);
  const [anomalies] = useState<AnomalyEvent[]>(DEMO_ANOMALIES);
  const [sentiment] = useState<MarketSentiment>(DEMO_SENTIMENT);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"signals" | "whales" | "narratives" | "anomalies">("signals");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      setLastUpdated(new Date());
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const tabs = [
    { key: "signals" as const, label: "AI Signals", icon: <Zap className="h-4 w-4" />, count: signals.length },
    { key: "whales" as const, label: "Whale Alerts", icon: <Eye className="h-4 w-4" />, count: whaleAlerts.length },
    { key: "narratives" as const, label: "Narratives", icon: <Globe className="h-4 w-4" />, count: narratives.length },
    { key: "anomalies" as const, label: "Anomalies", icon: <AlertTriangle className="h-4 w-4" />, count: anomalies.length },
  ];

  const bullishSignals = signals.filter((s) => s.type === "bullish").length;
  const bearishSignals = signals.filter((s) => s.type === "bearish").length;
  const avgStrength = Math.round(signals.reduce((sum, s) => sum + s.strength, 0) / (signals.length || 1));

  return (
    <div className="container-main py-8">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
              <Brain className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-serif tracking-tight sm:text-3xl">Market Intelligence</h1>
              <p className="text-sm text-text-tertiary">AI-powered signals, whale tracking, narrative analysis & anomaly detection</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-text-tertiary">
            <Clock className="h-3.5 w-3.5" />
            Updated {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* ── Overview Cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-text-secondary">Sentiment</span>
            </div>
            <div className={cn("text-2xl font-bold tabular-nums", sentimentColor(sentiment.overall))}>{sentiment.overall}</div>
            <span className={cn("text-xs font-medium", sentimentColor(sentiment.overall))}>{sentimentLabel(sentiment.overall)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs font-medium text-text-secondary">Bullish</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-emerald-500">{bullishSignals}</div>
            <span className="text-xs text-text-tertiary">Avg strength {avgStrength}%</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="text-xs font-medium text-text-secondary">Bearish</span>
            </div>
            <div className="text-2xl font-bold tabular-nums text-red-500">{bearishSignals}</div>
            <span className="text-xs text-text-tertiary">of {signals.length} total</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-blue-500" />
              <span className="text-xs font-medium text-text-secondary">Whale Activity</span>
            </div>
            <div className="text-2xl font-bold tabular-nums">{formatUsd(whaleAlerts.reduce((sum, a) => sum + a.valueUsd, 0))}</div>
            <span className="text-xs text-text-tertiary">{whaleAlerts.length} movements</span>
          </CardContent>
        </Card>
      </div>

      {/* ── Main Grid ────────────────────────────────────────── */}
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left — Tabbed */}
        <div>
          <div className="flex items-center gap-1 mb-6 p-1 rounded-lg bg-surface-secondary border border-border overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap cursor-pointer",
                  activeTab === tab.key
                    ? "bg-(--color-surface) text-text-primary shadow-sm"
                    : "text-text-tertiary hover:text-text-secondary"
                )}
              >
                {tab.icon}
                {tab.label}
                <span className="text-[10px] tabular-nums opacity-60">({tab.count})</span>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-28 w-full rounded-lg" />))}
            </div>
          ) : (
            <>
              {activeTab === "signals" && (
                <div className="space-y-4">{signals.map((s) => (<SignalCard key={s.id} signal={s} />))}</div>
              )}
              {activeTab === "whales" && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4 text-blue-500" />Recent Whale Movements</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4">{whaleAlerts.map((a) => (<WhaleAlertCard key={a.id} alert={a} />))}</CardContent>
                </Card>
              )}
              {activeTab === "narratives" && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-purple-500" />Trending Narratives</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4">{narratives.map((n) => (<NarrativeRow key={n.id} narrative={n} />))}</CardContent>
                </Card>
              )}
              {activeTab === "anomalies" && (
                <div className="space-y-4">{anomalies.map((a) => (<AnomalyCard key={a.id} anomaly={a} />))}</div>
              )}
            </>
          )}
        </div>

        {/* Right — Sentiment + Links */}
        <aside className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-accent" />
                Sentiment Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <SentimentMeter label="Social Media" value={sentiment.social} icon={<Globe className="h-3.5 w-3.5" />} />
              <SentimentMeter label="News Sentiment" value={sentiment.news} icon={<Sparkles className="h-3.5 w-3.5" />} />
              <SentimentMeter label="On-Chain" value={sentiment.onChain} icon={<Layers className="h-3.5 w-3.5" />} />
              <SentimentMeter label="Technical" value={sentiment.technical} icon={<BarChart3 className="h-3.5 w-3.5" />} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Related Tools</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "Fear & Greed Index", href: "/fear-greed", icon: <Activity className="h-4 w-4" /> },
                { label: "Market Heatmap", href: "/heatmap", icon: <BarChart3 className="h-4 w-4" /> },
                { label: "Token Unlocks", href: "/unlocks", icon: <Clock className="h-4 w-4" /> },
                { label: "DeFi Dashboard", href: "/defi", icon: <Layers className="h-4 w-4" /> },
                { label: "Price Screener", href: "/screener", icon: <Target className="h-4 w-4" /> },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-secondary transition-colors group">
                  <span className="text-text-tertiary group-hover:text-accent transition-colors">{item.icon}</span>
                  <span className="text-sm font-medium flex-1">{item.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </CardContent>
          </Card>

          <div className="rounded-lg border border-border p-4 bg-surface-secondary">
            <p className="text-[11px] text-text-tertiary leading-relaxed">
              <strong>Disclaimer:</strong> Intelligence data is for informational purposes only and not financial advice. Signals are algorithmically generated. Always DYOR.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
