"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Shield,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  ShieldQuestion,
  X,
  ExternalLink,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RegulatoryStance =
  | "friendly"
  | "cautious"
  | "restrictive"
  | "banned"
  | "unknown";

interface CountryRegulation {
  code: string;
  name: string;
  flag: string;
  stance: RegulatoryStance;
  summary: string;
  recentActions: string[];
  lastUpdated: string;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const COUNTRIES: CountryRegulation[] = [
  {
    code: "US",
    name: "United States",
    flag: "🇺🇸",
    stance: "cautious",
    summary:
      "SEC and CFTC actively regulating crypto. Spot Bitcoin ETFs approved. Stablecoins regulation pending.",
    recentActions: [
      "SEC approved spot Bitcoin ETFs (Jan 2024)",
      "FIT21 Act passed House committee",
      "IRS cryptocurrency tax reporting rules finalized",
    ],
    lastUpdated: "2026-02-28",
  },
  {
    code: "EU",
    name: "European Union",
    flag: "🇪🇺",
    stance: "cautious",
    summary:
      "MiCA regulation fully in effect. Comprehensive framework for crypto-asset service providers.",
    recentActions: [
      "MiCA fully enforced (Dec 2024)",
      "DAC8 crypto tax reporting directive",
      "Travel Rule extended to crypto transfers",
    ],
    lastUpdated: "2026-02-25",
  },
  {
    code: "UK",
    name: "United Kingdom",
    flag: "🇬🇧",
    stance: "cautious",
    summary:
      "FCA regulates crypto marketing. Working on broader regulatory framework post-Brexit.",
    recentActions: [
      "FCA crypto marketing rules in effect",
      "Digital Securities Sandbox launched",
      "Stablecoin regulation framework proposed",
    ],
    lastUpdated: "2026-02-20",
  },
  {
    code: "CN",
    name: "China",
    flag: "🇨🇳",
    stance: "banned",
    summary:
      "All cryptocurrency trading and mining banned since 2021. Digital Yuan (e-CNY) CBDC in rollout.",
    recentActions: [
      "Continued crackdown on OTC trading",
      "e-CNY adoption expanding to more cities",
      "Hong Kong allowed as crypto hub exception",
    ],
    lastUpdated: "2026-01-15",
  },
  {
    code: "JP",
    name: "Japan",
    flag: "🇯🇵",
    stance: "friendly",
    summary:
      "Comprehensive crypto regulations under FSA. Licensed exchanges. Web3 national strategy.",
    recentActions: [
      "Web3 national strategy ongoing",
      "Revised fund settlement law for stablecoins",
      "Crypto tax reform discussions active",
    ],
    lastUpdated: "2026-02-22",
  },
  {
    code: "SG",
    name: "Singapore",
    flag: "🇸🇬",
    stance: "friendly",
    summary:
      "MAS provides clear licensing framework. Major crypto hub in Asia Pacific.",
    recentActions: [
      "MAS updated stablecoin regulatory framework",
      "Payment Services Act amendments",
      "Tokenization sandbox expanded",
    ],
    lastUpdated: "2026-02-18",
  },
  {
    code: "AE",
    name: "UAE",
    flag: "🇦🇪",
    stance: "friendly",
    summary:
      "VARA (Dubai) and ADGM leading regulation. Aggressively attracting crypto companies.",
    recentActions: [
      "VARA issued over 20 crypto licenses",
      "Dubai Free Zone crypto hub expansion",
      "Federal crypto framework finalized",
    ],
    lastUpdated: "2026-02-26",
  },
  {
    code: "KR",
    name: "South Korea",
    flag: "🇰🇷",
    stance: "cautious",
    summary:
      "Virtual Asset User Protection Act in effect. Strict KYC/AML requirements.",
    recentActions: [
      "Virtual Asset User Protection Act enforced",
      "Real-name trading system mandatory",
      "Institutional investment guidelines proposed",
    ],
    lastUpdated: "2026-02-10",
  },
  {
    code: "IN",
    name: "India",
    flag: "🇮🇳",
    stance: "restrictive",
    summary:
      "30% tax on crypto gains. 1% TDS on transactions. No clear regulatory framework yet.",
    recentActions: [
      "30% crypto gains tax in effect",
      "1% TDS on all crypto transactions",
      "Digital Rupee CBDC pilot expanding",
    ],
    lastUpdated: "2026-02-05",
  },
  {
    code: "BR",
    name: "Brazil",
    flag: "🇧🇷",
    stance: "friendly",
    summary:
      "Crypto legal framework passed. Central bank regulating exchanges. Drex CBDC in development.",
    recentActions: [
      "Regulatory framework law enacted",
      "Central bank licensing exchanges",
      "Drex (digital real) CBDC pilot ongoing",
    ],
    lastUpdated: "2026-02-12",
  },
  {
    code: "AU",
    name: "Australia",
    flag: "🇦🇺",
    stance: "cautious",
    summary:
      "ASIC regulating crypto assets. Token mapping consultation. Working on comprehensive framework.",
    recentActions: [
      "ASIC token mapping consultation completed",
      "Digital asset licensing framework proposed",
      "Crypto exchange registration requirements",
    ],
    lastUpdated: "2026-01-28",
  },
  {
    code: "CA",
    name: "Canada",
    flag: "🇨🇦",
    stance: "cautious",
    summary:
      "CSA regulates crypto trading platforms. Multiple registered exchanges. Clear registration process.",
    recentActions: [
      "Pre-registration undertaking process active",
      "Crypto platform registration requirements",
      "Stablecoin regulation consultation",
    ],
    lastUpdated: "2026-02-08",
  },
  {
    code: "HK",
    name: "Hong Kong",
    flag: "🇭🇰",
    stance: "friendly",
    summary:
      "SFC licensing regime for Virtual Asset Trading Platforms. Positioning as Asia crypto hub.",
    recentActions: [
      "VATP licensing regime in effect",
      "Retail trading for major coins allowed",
      "Spot crypto ETFs approved",
    ],
    lastUpdated: "2026-02-24",
  },
  {
    code: "CH",
    name: "Switzerland",
    flag: "🇨🇭",
    stance: "friendly",
    summary:
      "Crypto Valley in Zug. FINMA progressive regulation. DLT Act providing legal certainty.",
    recentActions: [
      "DLT Act fully implemented",
      "FINMA stablecoin guidance updated",
      "Canton-level crypto tax guidance harmonized",
    ],
    lastUpdated: "2026-02-15",
  },
  {
    code: "NG",
    name: "Nigeria",
    flag: "🇳🇬",
    stance: "restrictive",
    summary:
      "Central bank initially banned banks from crypto. Now working on regulation after reversing stance.",
    recentActions: [
      "SEC crypto regulation framework proposed",
      "eNaira CBDC adoption pushes",
      "Central bank reversed blanket ban on crypto",
    ],
    lastUpdated: "2026-01-20",
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const stanceConfig: Record<
  RegulatoryStance,
  { label: string; color: string; bg: string; icon: typeof ShieldCheck }
> = {
  friendly: {
    label: "Friendly",
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
    icon: ShieldCheck,
  },
  cautious: {
    label: "Cautious",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
    icon: Shield,
  },
  restrictive: {
    label: "Restrictive",
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800",
    icon: ShieldAlert,
  },
  banned: {
    label: "Banned",
    color: "text-red-800 dark:text-red-300",
    bg: "bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-700",
    icon: ShieldBan,
  },
  unknown: {
    label: "Unknown",
    color: "text-[var(--color-text-tertiary)]",
    bg: "bg-[var(--color-surface-secondary)] border-[var(--color-border)]",
    icon: ShieldQuestion,
  },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function RegulationMap() {
  const [selected, setSelected] = useState<CountryRegulation | null>(null);

  const grouped = {
    friendly: COUNTRIES.filter((c) => c.stance === "friendly"),
    cautious: COUNTRIES.filter((c) => c.stance === "cautious"),
    restrictive: COUNTRIES.filter((c) => c.stance === "restrictive"),
    banned: COUNTRIES.filter((c) => c.stance === "banned"),
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {(Object.keys(stanceConfig) as RegulatoryStance[]).map((stance) => {
          const cfg = stanceConfig[stance];
          const Icon = cfg.icon;
          return (
            <span
              key={stance}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
                cfg.bg,
                cfg.color,
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </span>
          );
        })}
      </div>

      {/* Country grid grouped by stance */}
      <div className="space-y-6">
        {(
          ["friendly", "cautious", "restrictive", "banned"] as RegulatoryStance[]
        ).map((stance) => {
          const cfg = stanceConfig[stance];
          const Icon = cfg.icon;
          const countries = grouped[stance];
          if (!countries.length) return null;

          return (
            <div key={stance}>
              <h3
                className={cn(
                  "mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider",
                  cfg.color,
                )}
              >
                <Icon className="h-4 w-4" />
                {cfg.label}
              </h3>
              <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {countries.map((country) => (
                  <button
                    key={country.code}
                    onClick={() =>
                      setSelected(
                        selected?.code === country.code ? null : country,
                      )
                    }
                    className={cn(
                      "flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-all",
                      selected?.code === country.code
                        ? cn(cfg.bg, "ring-2 ring-[var(--color-accent)]")
                        : "border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-secondary)]",
                    )}
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="font-medium text-[var(--color-text-primary)] truncate">
                      {country.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && (
        <Card className="animate-[fadeIn_0.2s_ease-out]">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selected.flag}</span>
              <div>
                <CardTitle className="font-serif text-xl">
                  {selected.name}
                </CardTitle>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-sm font-medium",
                    stanceConfig[selected.stance].color,
                  )}
                >
                  {(() => {
                    const Icon = stanceConfig[selected.stance].icon;
                    return <Icon className="h-3.5 w-3.5" />;
                  })()}
                  {stanceConfig[selected.stance].label}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelected(null)}
              aria-label="Close detail panel"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              {selected.summary}
            </p>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">
                Recent Regulatory Actions
              </h4>
              <ul className="space-y-1.5">
                {selected.recentActions.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-xs text-[var(--color-text-tertiary)]">
              Last updated: {selected.lastUpdated}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
