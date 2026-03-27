/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpDown,
  Calendar,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Filter,
  Gift,
  Info,
  ShieldAlert,
  Sparkles,
  Timer,
  Wallet,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Airdrop {
  id: string;
  name: string;
  token: string;
  chain: string;
  status: "active" | "upcoming" | "ended";
  estimatedValue: string;
  difficulty: "easy" | "medium" | "hard";
  verified: boolean;
  claimDeadline?: string;
  requirements?: string[];
  description?: string;
  link?: string;
  dateRange?: string;
  confirmedOrRumored?: "confirmed" | "rumored";
  actualValue?: string;
  distributedDate?: string;
}

type SortKey = "deadline" | "value" | "newest";

/* ------------------------------------------------------------------ */
/*  Static enriched data (extends API stubs)                           */
/* ------------------------------------------------------------------ */

const ENRICHED: Record<string, Partial<Airdrop>> = {
  "1": {
    requirements: [
      "Bridge assets via LayerZero",
      "Use 3+ chains",
      "Active past 6 months",
    ],
    link: "https://layerzero.network",
    dateRange: "Q2 2026",
    confirmedOrRumored: "rumored",
  },
  "2": {
    requirements: [
      "Provide liquidity on Berachain testnet",
      "Hold BGT tokens",
      "Participate in governance",
    ],
    link: "https://berachain.com",
    dateRange: "Q3 2026",
    confirmedOrRumored: "confirmed",
  },
  "3": {
    requirements: [
      "Use Monad testnet dApps",
      "Bridge to Monad",
      "Social engagement",
    ],
    link: "https://monad.xyz",
    dateRange: "Q4 2026",
    confirmedOrRumored: "rumored",
  },
  "4": {
    requirements: [
      "Bridge to Scroll",
      "Use Scroll dApps",
      "Maintain activity for 2+ months",
    ],
    link: "https://scroll.io",
  },
  "5": {
    requirements: [
      "Trade on Hyperliquid",
      "Provide liquidity",
      "Stake HYPE tokens",
    ],
    link: "https://hyperliquid.xyz",
    dateRange: "Q2 2026",
    confirmedOrRumored: "confirmed",
  },
  "6": {
    requirements: [
      "Deploy contracts on StarkNet",
      "Use DeFi protocols",
      "Hold STRK",
    ],
    link: "https://starknet.io",
    dateRange: "Q3 2026",
    confirmedOrRumored: "rumored",
  },
};

const PAST_AIRDROPS: Airdrop[] = [
  {
    id: "p1",
    name: "Arbitrum",
    token: "ARB",
    chain: "Arbitrum",
    status: "ended",
    estimatedValue: "$1,500",
    difficulty: "easy",
    verified: true,
    actualValue: "$2,400 avg",
    distributedDate: "2023-03-23",
  },
  {
    id: "p2",
    name: "Optimism OP",
    token: "OP",
    chain: "Optimism",
    status: "ended",
    estimatedValue: "$800",
    difficulty: "easy",
    verified: true,
    actualValue: "$1,200 avg",
    distributedDate: "2022-05-31",
  },
  {
    id: "p3",
    name: "Uniswap",
    token: "UNI",
    chain: "Ethereum",
    status: "ended",
    estimatedValue: "$1,200",
    difficulty: "easy",
    verified: true,
    actualValue: "$6,400 avg",
    distributedDate: "2020-09-17",
  },
  {
    id: "p4",
    name: "dYdX",
    token: "DYDX",
    chain: "Ethereum",
    status: "ended",
    estimatedValue: "$500",
    difficulty: "medium",
    verified: true,
    actualValue: "$4,500 avg",
    distributedDate: "2021-09-08",
  },
  {
    id: "p5",
    name: "Jito",
    token: "JTO",
    chain: "Solana",
    status: "ended",
    estimatedValue: "$300",
    difficulty: "medium",
    verified: true,
    actualValue: "$1,800 avg",
    distributedDate: "2023-12-07",
  },
];

const ELIGIBILITY_CRITERIA = [
  { id: "wallet-age", label: "Wallet age > 6 months", icon: Wallet },
  { id: "on-chain", label: "Active on-chain history", icon: Sparkles },
  { id: "token-holder", label: "Token holder", icon: Gift },
  { id: "bridge-user", label: "Bridge user", icon: ArrowUpDown },
  { id: "defi-user", label: "DeFi protocol user", icon: Filter },
];

/* ------------------------------------------------------------------ */
/*  Countdown helper                                                   */
/* ------------------------------------------------------------------ */

function useCountdown(deadline?: string) {
  const [remaining, setRemaining] = useState("");

  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) {
        setRemaining("Expired");
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${d}d ${h}h ${m}m`);
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [deadline]);

  return remaining;
}

function CountdownBadge({ deadline }: { deadline?: string }) {
  const remaining = useCountdown(deadline);
  if (!remaining) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
      <Timer className="h-3 w-3" />
      {remaining}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: Airdrop["status"] }) {
  const map: Record<
    string,
    { label: string; cls: string }
  > = {
    active: {
      label: "Active",
      cls: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    },
    upcoming: {
      label: "Upcoming",
      cls: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
    },
    ended: {
      label: "Ended",
      cls: "bg-neutral-200 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400",
    },
  };
  const { label, cls } = map[status] ?? map.ended;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold uppercase tracking-wider",
        cls,
      )}
    >
      {label}
    </span>
  );
}

function DifficultyDot({ difficulty }: { difficulty: Airdrop["difficulty"] }) {
  const colors: Record<string, string> = {
    easy: "bg-green-500",
    medium: "bg-amber-500",
    hard: "bg-red-500",
  };
  return (
    <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
      <span className={cn("h-2 w-2 rounded-full", colors[difficulty])} />
      {difficulty}
    </span>
  );
}

function ChainBadge({ chain }: { chain: string }) {
  return (
    <Badge className="text-[10px]">{chain}</Badge>
  );
}

/* ------------------------------------------------------------------ */
/*  Airdrop Card                                                       */
/* ------------------------------------------------------------------ */

function AirdropCard({ airdrop }: { airdrop: Airdrop }) {
  const enriched = { ...airdrop, ...ENRICHED[airdrop.id] };
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold leading-snug">
              {enriched.name}
              {enriched.verified && (
                <Check className="ml-1 inline h-4 w-4 text-green-500" />
              )}
            </CardTitle>
            <p className="text-xs text-text-tertiary">
              ${enriched.token}
            </p>
          </div>
          <StatusBadge status={enriched.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ChainBadge chain={enriched.chain} />
          <DifficultyDot difficulty={enriched.difficulty} />
          {enriched.claimDeadline && (
            <CountdownBadge deadline={enriched.claimDeadline} />
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-sm">
        <div className="flex items-center gap-2 text-text-primary">
          <Gift className="h-4 w-4 text-accent" />
          <span className="font-medium">Est. value:</span>
          <span>{enriched.estimatedValue}</span>
        </div>

        {enriched.requirements && enriched.requirements.length > 0 && (
          <ul className="space-y-1">
            {enriched.requirements.map((r) => (
              <li
                key={r}
                className="flex items-start gap-2 text-xs text-text-secondary"
              >
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {enriched.link && (
        <CardFooter className="pt-0">
          <a
            href={enriched.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
          >
            Learn More <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardFooter>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export default function AirdropCards() {
  const [airdrops, setAirdrops] = useState<Airdrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("deadline");
  const [filterChain, setFilterChain] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showPast, setShowPast] = useState(false);
  const [checkedCriteria, setCheckedCriteria] = useState<Set<string>>(
    new Set(),
  );

  /* Fetch ---------------------------------------------------------- */
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/airdrops");
        const data = await res.json();
        setAirdrops(
          (data.airdrops as Airdrop[]).map((a) => ({
            ...a,
            ...ENRICHED[a.id],
          })),
        );
      } catch {
        /* use empty list on failure */
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* Derived data --------------------------------------------------- */
  const chains = useMemo(
    () => ["all", ...new Set(airdrops.map((a) => a.chain))],
    [airdrops],
  );

  const sorted = useMemo(() => {
    let list = [...airdrops];

    if (filterChain !== "all")
      list = list.filter((a) => a.chain === filterChain);
    if (filterStatus !== "all")
      list = list.filter((a) => a.status === filterStatus);

    switch (sortKey) {
      case "deadline":
        list.sort(
          (a, b) =>
            new Date(a.claimDeadline ?? "9999").getTime() -
            new Date(b.claimDeadline ?? "9999").getTime(),
        );
        break;
      case "value":
        list.sort((a, b) => {
          const num = (v: string) =>
            parseInt(v.replace(/[^0-9]/g, ""), 10) || 0;
          return num(b.estimatedValue) - num(a.estimatedValue);
        });
        break;
      case "newest":
        list.reverse();
        break;
    }
    return list;
  }, [airdrops, sortKey, filterChain, filterStatus]);

  const active = useMemo(
    () => sorted.filter((a) => a.status === "active"),
    [sorted],
  );
  const upcoming = useMemo(
    () => sorted.filter((a) => a.status === "upcoming"),
    [sorted],
  );

  const toggleCriteria = useCallback((id: string) => {
    setCheckedCriteria((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  /* Loading state -------------------------------------------------- */
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-6 space-y-3">
              <div className="skeleton h-5 w-32" />
              <div className="skeleton h-4 w-20" />
              <div className="skeleton h-4 w-full" />
              <div className="skeleton h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  return (
    <div className="space-y-12">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Sort */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <ArrowUpDown className="h-4 w-4" />
          <span className="font-medium">Sort:</span>
          {(["deadline", "value", "newest"] as SortKey[]).map((k) => (
            <Button
              key={k}
              variant={sortKey === k ? "primary" : "outline"}
              size="sm"
              onClick={() => setSortKey(k)}
            >
              {k === "deadline"
                ? "Deadline"
                : k === "value"
                  ? "Est. Value"
                  : "Newest"}
            </Button>
          ))}
        </div>

        {/* Chain filter */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <Filter className="h-4 w-4" />
          <select
            value={filterChain}
            onChange={(e) => setFilterChain(e.target.value)}
            className="rounded-md border border-border bg-(--color-surface) px-2 py-1 text-sm text-text-primary"
          >
            {chains.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? "All Chains" : c}
              </option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-md border border-border bg-(--color-surface) px-2 py-1 text-sm text-text-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="upcoming">Upcoming</option>
          </select>
        </div>
      </div>

      {/* ============================================================ */}
      {/*  Section 1 — Active Airdrops                                  */}
      {/* ============================================================ */}
      <section>
        <h2 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2 text-text-primary">
          <Sparkles className="h-5 w-5 text-green-500" />
          Active Airdrops
        </h2>
        {active.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No active airdrops match your filters.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {active.map((a) => (
              <AirdropCard key={a.id} airdrop={a} />
            ))}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/*  Section 2 — Upcoming Airdrops (Timeline)                     */}
      {/* ============================================================ */}
      <section>
        <h2 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2 text-text-primary">
          <Calendar className="h-5 w-5 text-blue-500" />
          Upcoming Airdrops
        </h2>

        {upcoming.length === 0 ? (
          <p className="text-sm text-text-secondary">
            No upcoming airdrops match your filters.
          </p>
        ) : (
          <div className="relative border-l-2 border-border pl-6 space-y-8">
            {upcoming.map((a) => {
              const enriched = { ...a, ...ENRICHED[a.id] };
              return (
                <div key={a.id} className="relative">
                  {/* Timeline dot */}
                  <span className="absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-border bg-(--color-surface)">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                  </span>

                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base font-semibold">
                          {a.name}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <ChainBadge chain={a.chain} />
                          {enriched.confirmedOrRumored === "confirmed" ? (
                            <span className="inline-flex items-center rounded-sm bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-green-700 dark:bg-green-900/40 dark:text-green-400">
                              Confirmed
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-sm bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
                              Rumored
                            </span>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2">
                      {enriched.dateRange && (
                        <p className="flex items-center gap-2 text-text-secondary">
                          <Clock className="h-3.5 w-3.5" />
                          Expected: {enriched.dateRange}
                        </p>
                      )}
                      <p className="flex items-center gap-2 text-text-primary">
                        <Gift className="h-3.5 w-3.5 text-accent" />
                        Est. value: {a.estimatedValue}
                      </p>
                      {enriched.requirements &&
                        enriched.requirements.length > 0 && (
                          <ul className="space-y-1 mt-1">
                            {enriched.requirements.map((r) => (
                              <li
                                key={r}
                                className="flex items-start gap-2 text-xs text-text-secondary"
                              >
                                <Check className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/*  Section 3 — Past Airdrops (Collapsed)                        */}
      {/* ============================================================ */}
      <section>
        <button
          onClick={() => setShowPast((p) => !p)}
          className="flex items-center gap-2 font-serif text-2xl font-bold text-text-primary hover:text-accent transition-colors"
        >
          <Clock className="h-5 w-5 text-neutral-500" />
          Past Airdrops
          {showPast ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </button>

        {showPast && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-text-tertiary">
                  <th className="pb-2 pr-4">Project</th>
                  <th className="pb-2 pr-4">Token</th>
                  <th className="pb-2 pr-4">Chain</th>
                  <th className="pb-2 pr-4">Actual Value</th>
                  <th className="pb-2">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {PAST_AIRDROPS.map((a) => (
                  <tr key={a.id}>
                    <td className="py-2 pr-4 font-medium text-text-primary">
                      {a.name}
                    </td>
                    <td className="py-2 pr-4 text-text-secondary">
                      ${a.token}
                    </td>
                    <td className="py-2 pr-4">
                      <ChainBadge chain={a.chain} />
                    </td>
                    <td className="py-2 pr-4 text-green-600 dark:text-green-400 font-medium">
                      {a.actualValue}
                    </td>
                    <td className="py-2 text-text-secondary">
                      {a.distributedDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ============================================================ */}
      {/*  Section 4 — Eligibility Checker                              */}
      {/* ============================================================ */}
      <section>
        <h2 className="font-serif text-2xl font-bold mb-4 flex items-center gap-2 text-text-primary">
          <Info className="h-5 w-5 text-accent" />
          Eligibility Checker
        </h2>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-text-secondary mb-4">
              Most airdrops share common eligibility criteria. Check off items
              below to see how well you might qualify.
            </p>
            <div className="space-y-3">
              {ELIGIBILITY_CRITERIA.map(({ id, label, icon: Icon }) => (
                <label
                  key={id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border px-4 py-3 transition-colors hover:bg-surface-secondary"
                >
                  <input
                    type="checkbox"
                    checked={checkedCriteria.has(id)}
                    onChange={() => toggleCriteria(id)}
                    className="h-4 w-4 rounded border-border accent-accent"
                  />
                  <Icon className="h-4 w-4 text-text-secondary" />
                  <span className="text-sm text-text-primary">
                    {label}
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-4 text-xs text-text-tertiary">
              {checkedCriteria.size} / {ELIGIBILITY_CRITERIA.length} criteria
              met — This is purely informational and does not guarantee
              eligibility.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* ============================================================ */}
      {/*  Section 5 — Safety Disclaimer                                */}
      {/* ============================================================ */}
      <Card className="border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
        <CardContent className="pt-6 flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
          <div className="space-y-1">
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              Safety Warning
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Never share your private keys or seed phrases. Legitimate airdrops
              will never ask for your seed phrase, private key, or require you to
              send funds first. Always verify airdrop announcements through
              official project channels.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
