"use client";

import { useState } from "react";
import {
  BarChart3,
  Layers,
  Briefcase,
  Fuel,
  Calculator,
  Code2,
  ArrowRight,
  BookOpen,
  Newspaper,
  Gauge,
  Sparkles,
  Flame,
  Star,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

type ToolItem = {
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: "new" | "popular" | "beta";
  color: string;
  stat?: string;
};

const TOOLS: ToolItem[] = [
  {
    title: "Markets",
    description: "Real-time prices, charts, and market data for thousands of cryptocurrencies.",
    href: "/markets",
    icon: BarChart3,
    badge: "popular",
    color: "from-blue-500 to-cyan-500",
    stat: "10K+ coins tracked",
  },
  {
    title: "DeFi Dashboard",
    description: "Track DeFi protocols, TVL, yields, and decentralized exchange volumes.",
    href: "/defi",
    icon: Layers,
    color: "from-purple-500 to-pink-500",
    stat: "500+ protocols",
  },
  {
    title: "Portfolio",
    description: "Monitor your portfolio, track PnL, and view allocation breakdowns.",
    href: "/portfolio",
    icon: Briefcase,
    badge: "new",
    color: "from-emerald-500 to-teal-500",
  },
  {
    title: "Gas Tracker",
    description: "Live gas fees for Ethereum, BSC, Polygon, and other EVM chains.",
    href: "/gas",
    icon: Fuel,
    color: "from-orange-500 to-red-500",
    stat: "Live gas prices",
  },
  {
    title: "Calculator",
    description: "Convert between cryptocurrencies and fiat currencies instantly.",
    href: "/calculator",
    icon: Calculator,
    color: "from-amber-500 to-yellow-500",
  },
  {
    title: "API Docs",
    description: "Free REST API, RSS feeds, GraphQL, and WebSocket for developers.",
    href: "/developers",
    icon: Code2,
    badge: "popular",
    color: "from-slate-500 to-zinc-500",
    stat: "100% free",
  },
  {
    title: "Learn",
    description: "Crypto education hub with guides, glossary, and tutorials for beginners.",
    href: "/learn",
    icon: BookOpen,
    color: "from-green-500 to-lime-500",
  },
  {
    title: "News Sources",
    description: "Browse our 300+ verified crypto news sources with reliability ratings.",
    href: "/sources",
    icon: Newspaper,
    color: "from-indigo-500 to-violet-500",
    stat: "300+ sources",
  },
  {
    title: "Fear & Greed",
    description: "Market sentiment index based on volatility, momentum, and social signals.",
    href: "/fear-greed",
    icon: Gauge,
    badge: "new",
    color: "from-rose-500 to-pink-500",
  },
];

const BADGE_CONFIG = {
  new: { label: "New", icon: Sparkles, className: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  popular: { label: "Popular", icon: Flame, className: "bg-orange-500/10 text-orange-600 border-orange-500/20" },
  beta: { label: "Beta", icon: Star, className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
} as const;

export default function ExploreMore() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <section className="container-main py-12 lg:py-16">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-1.5 bg-[var(--color-surface-secondary)] rounded-full px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)] mb-3 border border-[var(--color-border)]">
          <Sparkles className="h-3 w-3 text-[var(--color-accent)]" />
          All tools free — No limits
        </div>
        <h2 className="text-2xl md:text-3xl font-bold font-serif mb-2">Explore More</h2>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-lg mx-auto">
          Powerful tools, real-time data, and intelligent insights to help you navigate the crypto market.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map((tool, index) => {
          const Icon = tool.icon;
          const isHovered = hoveredIndex === index;
          const badge = tool.badge ? BADGE_CONFIG[tool.badge] : null;

          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={cn(
                "group relative flex items-start gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5",
                "hover:shadow-lg hover:border-[var(--color-accent)]/50 transition-all duration-300",
                "hover:-translate-y-0.5"
              )}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Gradient glow on hover */}
              <div
                className={cn(
                  "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none",
                  `bg-gradient-to-br ${tool.color}`
                )}
                style={{ opacity: isHovered ? 0.04 : 0 }}
              />

              {/* Icon */}
              <div
                className={cn(
                  "relative shrink-0 flex items-center justify-center h-11 w-11 rounded-xl transition-all duration-300",
                  "bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]",
                  `group-hover:bg-gradient-to-br group-hover:${tool.color} group-hover:text-white group-hover:shadow-md`
                )}
              >
                <Icon className="h-5 w-5" />
              </div>

              {/* Content */}
              <div className="relative flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                    {tool.title}
                  </h3>
                  {badge && (
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                      badge.className
                    )}>
                      <badge.icon className="h-2.5 w-2.5" />
                      {badge.label}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-2">
                  {tool.description}
                </p>
                <div className="flex items-center justify-between">
                  {tool.stat && (
                    <span className="text-[10px] text-[var(--color-text-tertiary)] font-medium">
                      {tool.stat}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                    Explore
                    <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 text-center">
        <Link
          href="/developers"
          className={cn(
            "inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2.5",
            "text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-all"
          )}
        >
          <Code2 className="h-4 w-4" />
          Build with our Free API
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}
