/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  CalendarDays,
} from "lucide-react";

/* ---------- Types -------------------------------------------------------- */

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: "conference" | "upgrade" | "launch" | "ama" | "other";
  description?: string;
  link?: string;
  featured?: boolean;
}

type EventType = CalendarEvent["type"];

/* ---------- Helpers ------------------------------------------------------- */

const EVENT_TYPE_CONFIG: Record<
  EventType,
  { label: string; color: string; dot: string; bg: string }
> = {
  conference: {
    label: "Conference",
    color: "text-blue-500",
    dot: "bg-blue-500",
    bg: "bg-blue-500/10",
  },
  upgrade: {
    label: "Upgrade",
    color: "text-purple-500",
    dot: "bg-purple-500",
    bg: "bg-purple-500/10",
  },
  launch: {
    label: "Launch",
    color: "text-green-500",
    dot: "bg-green-500",
    bg: "bg-green-500/10",
  },
  ama: {
    label: "AMA",
    color: "text-orange-500",
    dot: "bg-orange-500",
    bg: "bg-orange-500/10",
  },
  other: {
    label: "Other",
    color: "text-text-tertiary",
    dot: "bg-text-tertiary",
    bg: "bg-surface-secondary",
  },
};

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function parseDateKey(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isThisWeek(dateStr: string): boolean {
  const now = new Date();
  const target = new Date(dateStr);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);
  return target >= startOfWeek && target < endOfWeek;
}

function getCalendarDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: { date: Date; inMonth: boolean }[] = [];

  // Pad start
  for (let i = 0; i < first.getDay(); i++) {
    const d = new Date(year, month, -first.getDay() + i + 1);
    days.push({ date: d, inMonth: false });
  }
  // Month days
  for (let i = 1; i <= last.getDate(); i++) {
    days.push({ date: new Date(year, month, i), inMonth: true });
  }
  // Pad end
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      days.push({ date: new Date(year, month + 1, i), inMonth: false });
    }
  }

  return days;
}

/* ---------- Demo data ---------------------------------------------------- */

const DEMO_EVENTS: CalendarEvent[] = [
  { id: "1", title: "Bitcoin 2026 Conference", date: "2026-03-04", type: "conference", description: "The world's largest Bitcoin conference returns with 30,000+ attendees, keynotes from industry leaders, and major product announcements.", link: "https://b.tc/conference", featured: true },
  { id: "2", title: "Ethereum Dencun v2 Upgrade", date: "2026-03-08", type: "upgrade", description: "Major Ethereum network upgrade focusing on further scaling improvements and proto-danksharding enhancements.", featured: true },
  { id: "3", title: "Solana Breakpoint", date: "2026-03-12", type: "conference", description: "Solana's annual developer and ecosystem conference featuring new product launches and partnership announcements.", featured: true },
  { id: "4", title: "Chainlink CCIP v2 Launch", date: "2026-03-06", type: "launch", description: "Cross-Chain Interoperability Protocol v2 launch with enhanced security and new chain support." },
  { id: "5", title: "Uniswap v5 Launch", date: "2026-03-10", type: "launch", description: "Next generation of the leading DEX with hooks framework and gas optimizations." },
  { id: "6", title: "Polygon zkEVM Type 1 Upgrade", date: "2026-03-14", type: "upgrade", description: "Polygon achieving full Ethereum bytecode compatibility for its zkEVM." },
  { id: "7", title: "Vitalik AMA on /r/ethereum", date: "2026-03-15", type: "ama", description: "Monthly community AMA session with Ethereum co-founder Vitalik Buterin." },
  { id: "8", title: "ETHDenver Side Events", date: "2026-03-17", type: "conference", description: "Week-long hackathon and community events in Denver, Colorado." },
  { id: "9", title: "Arbitrum Stylus Mainnet", date: "2026-03-19", type: "launch", description: "Rust and C++ smart contract support goes live on Arbitrum mainnet." },
  { id: "10", title: "Cosmos Hub v20 Upgrade", date: "2026-03-22", type: "upgrade", description: "Interchain Security v2 and Partial Set Security updates." },
  { id: "11", title: "Token2049 Dubai", date: "2026-03-25", type: "conference", description: "Premier crypto conference in Dubai with 10,000+ attendees." },
  { id: "12", title: "CZ AMA on X Spaces", date: "2026-03-26", type: "ama", description: "Changpeng Zhao discusses market outlook and future of Binance." },
  { id: "13", title: "Sui Move 2 Launch", date: "2026-03-28", type: "launch", description: "Major upgrade to the Move programming language on Sui network." },
  { id: "14", title: "zkSync Boojum Upgrade", date: "2026-03-30", type: "upgrade", description: "New proof system upgrade improving throughput and reducing costs." },
  { id: "15", title: "Aptos Community Call", date: "2026-03-20", type: "ama", description: "Monthly developer call covering ecosystem updates and roadmap." },
];

/* ---------- Component ---------------------------------------------------- */

export default function EventCalendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setEvents(data);
          return;
        }
      }
    } catch {
      /* fall through */
    }
    setEvents(DEMO_EVENTS);
  }, []);

  useEffect(() => {
    fetchEvents().finally(() => setLoading(false));
  }, [fetchEvents]);

  /* ── Derived data ─────────────────────────────────────────── */

  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of events) {
      const key = evt.date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(evt);
    }
    return map;
  }, [events]);

  const calendarDays = useMemo(
    () => getCalendarDays(currentMonth.year, currentMonth.month),
    [currentMonth]
  );

  const featuredEvents = useMemo(
    () => events.filter((e) => e.featured && isThisWeek(e.date)).slice(0, 3),
    [events]
  );

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((e) => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 30);
  }, [events]);

  const selectedEvents = selectedDate ? eventsByDate.get(selectedDate) ?? [] : [];

  const today = toDateKey(new Date());

  /* ── Navigation ─────────────────────────────────────── */

  function prevMonth() {
    setCurrentMonth((m) => {
      const d = new Date(m.year, m.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelectedDate(null);
  }

  function nextMonth() {
    setCurrentMonth((m) => {
      const d = new Date(m.year, m.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelectedDate(null);
  }

  /* ── Loading ─────────────────────────────────────────── */

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="mb-3 h-5 w-32" />
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-[400px] w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Featured Events ─────────────────────────────────── */}
      {featuredEvents.length > 0 && (
        <section>
          <h2 className="mb-5 font-serif text-2xl font-bold tracking-tight">
            Featured This Week
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredEvents.map((evt) => {
              const cfg = EVENT_TYPE_CONFIG[evt.type];
              return (
                <Card
                  key={evt.id}
                  className="border-accent/20 transition-shadow hover:shadow-lg"
                >
                  <CardContent className="p-5">
                    <Badge
                      className={cn("mb-3 text-xs", cfg.bg, cfg.color)}
                    >
                      {cfg.label}
                    </Badge>
                    <h3 className="mb-2 font-serif text-lg font-semibold leading-snug">
                      {evt.title}
                    </h3>
                    <p className="mb-3 text-sm text-text-secondary line-clamp-2">
                      {evt.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-text-tertiary">
                        {formatDate(evt.date)}
                      </span>
                      {evt.link && (
                        <a
                          href={evt.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-accent hover:underline"
                        >
                          Details <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Calendar View ───────────────────────────────────── */}
      <section>
        <h2 className="mb-5 font-serif text-2xl font-bold tracking-tight">
          Events Calendar
        </h2>

        <Card>
          <CardContent className="p-4 sm:p-6">
            {/* Month nav */}
            <div className="mb-4 flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={prevMonth} aria-label="Previous month">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h3 className="font-serif text-lg font-semibold">
                {MONTH_NAMES[currentMonth.month]} {currentMonth.year}
              </h3>
              <Button variant="ghost" size="icon" onClick={nextMonth} aria-label="Next month">
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-px text-center text-xs font-medium text-text-tertiary">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className="py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-px">
              {calendarDays.map(({ date, inMonth }, idx) => {
                const key = toDateKey(date);
                const dayEvents = eventsByDate.get(key) ?? [];
                const isToday = key === today;
                const isSelected = key === selectedDate;

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedDate(isSelected ? null : key)}
                    className={cn(
                      "relative flex min-h-[60px] flex-col items-center rounded-md p-1.5 text-sm transition-colors sm:min-h-[72px] sm:p-2",
                      inMonth
                        ? "text-text-primary"
                        : "text-text-tertiary opacity-40",
                      isToday && "bg-accent/10 font-bold",
                      isSelected && "ring-2 ring-accent",
                      dayEvents.length > 0 && inMonth && "hover:bg-surface-secondary cursor-pointer",
                      dayEvents.length === 0 && "cursor-default"
                    )}
                    aria-label={`${formatDate(key)}${dayEvents.length > 0 ? `, ${dayEvents.length} events` : ""}`}
                  >
                    <span>{date.getDate()}</span>
                    {dayEvents.length > 0 && inMonth && (
                      <div className="mt-auto flex flex-wrap justify-center gap-0.5">
                        {dayEvents.slice(0, 3).map((evt) => (
                          <span
                            key={evt.id}
                            className={cn(
                              "inline-block h-1.5 w-1.5 rounded-full",
                              EVENT_TYPE_CONFIG[evt.type].dot
                            )}
                          />
                        ))}
                        {dayEvents.length > 3 && (
                          <span className="text-[10px] leading-none text-text-tertiary">
                            +{dayEvents.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3 text-xs text-text-secondary">
              {(Object.entries(EVENT_TYPE_CONFIG) as [EventType, typeof EVENT_TYPE_CONFIG[EventType]][]).map(
                ([type, cfg]) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <span className={cn("inline-block h-2 w-2 rounded-full", cfg.dot)} />
                    {cfg.label}
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        {/* Selected date panel */}
        {selectedDate && (
          <div className="mt-4">
            <h3 className="mb-3 font-serif text-lg font-semibold">
              Events on {formatDate(selectedDate)}
            </h3>
            {selectedEvents.length === 0 ? (
              <p className="text-sm text-text-secondary">
                No events on this date.
              </p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((evt) => {
                  const cfg = EVENT_TYPE_CONFIG[evt.type];
                  return (
                    <Card key={evt.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <Badge className={cn("mb-2 text-xs", cfg.bg, cfg.color)}>
                              {cfg.label}
                            </Badge>
                            <h4 className="font-semibold">{evt.title}</h4>
                            {evt.description && (
                              <p className="mt-1 text-sm text-text-secondary">
                                {evt.description}
                              </p>
                            )}
                          </div>
                          {evt.link && (
                            <a
                              href={evt.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="shrink-0 text-accent hover:underline"
                              aria-label={`Details for ${evt.title}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Upcoming Events List ────────────────────────────── */}
      <section>
        <h2 className="mb-5 font-serif text-2xl font-bold tracking-tight">
          Upcoming Events
        </h2>

        {upcomingEvents.length === 0 ? (
          <p className="text-text-secondary">
            No upcoming events scheduled.
          </p>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((evt) => {
              const cfg = EVENT_TYPE_CONFIG[evt.type];
              return (
                <Card
                  key={evt.id}
                  className="transition-colors hover:bg-surface-secondary"
                >
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                          cfg.bg
                        )}
                      >
                        <CalendarDays className={cn("h-5 w-5", cfg.color)} />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">{evt.title}</h3>
                          <Badge className={cn("text-xs", cfg.bg, cfg.color)}>
                            {cfg.label}
                          </Badge>
                        </div>
                        {evt.description && (
                          <p className="mt-1 text-sm text-text-secondary line-clamp-1">
                            {evt.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-3 text-sm text-text-tertiary">
                      <span>{formatDate(evt.date)}</span>
                      {evt.link && (
                        <a
                          href={evt.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-accent hover:underline"
                        >
                          Link <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
