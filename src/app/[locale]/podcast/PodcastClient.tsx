"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Headphones,
  Mic,
  Play,
  Pause,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Radio,
  Share2,
  Link2,
  Check,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Button,
  Badge,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Skeleton,
} from "@/components/ui";
import AudioPlayer, { WaveformBars } from "@/components/AudioPlayer";

/* ---------- Types ---------- */

interface Episode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  duration: number; // seconds
  date: string;
  format?: string;
}

interface AIBriefing {
  id: string;
  title: string;
  audioUrl: string;
  transcript: string;
  date: string;
  duration: number;
}

/* ---------- Demo data (used until APIs return real data) ---------- */

const DEMO_EPISODES: Episode[] = [
  {
    id: "ep-1",
    title: "Bitcoin Breaks $120K — What's Driving the Rally?",
    description:
      "In this episode we break down the macro factors behind Bitcoin's latest all-time high, including institutional inflows, halving after-effects, and geopolitical tailwinds. We also discuss how Ethereum's Pectra upgrade is reshaping the staking landscape.",
    audioUrl: "/audio/demo-episode.mp3",
    duration: 1845,
    date: "2026-02-28",
    format: "deep-dive",
  },
  {
    id: "ep-2",
    title: "DeFi Summer 2.0? Lending Protocols Surge",
    description:
      "TVL across major DeFi protocols has surged past $250B. We explore the catalysts, major winners, and risks the market may be overlooking. Plus: a deep dive into Solana's new fee market changes.",
    audioUrl: "/audio/demo-episode.mp3",
    duration: 1320,
    date: "2026-02-25",
    format: "deep-dive",
  },
  {
    id: "ep-3",
    title: "Weekly Recap — Feb 17-23, 2026",
    description:
      "Your weekly summary of the most important crypto events: SEC regulatory updates, Solana outperformance, new L2 launches, and DAO governance battles.",
    audioUrl: "/audio/demo-episode.mp3",
    duration: 960,
    date: "2026-02-23",
    format: "weekly-recap",
  },
  {
    id: "ep-4",
    title: "Market Open Flash — Feb 21",
    description:
      "A quick 5-minute market open briefing covering overnight moves, funding rates, and key levels to watch today.",
    audioUrl: "/audio/demo-episode.mp3",
    duration: 310,
    date: "2026-02-21",
    format: "flash",
  },
  {
    id: "ep-5",
    title: "Ethereum Pectra: Everything You Need to Know",
    description:
      "We break down every EIP in the Pectra upgrade, what it means for validators, stakers, and everyday users. Plus: gas fee predictions post-upgrade.",
    audioUrl: "/audio/demo-episode.mp3",
    duration: 2100,
    date: "2026-02-18",
    format: "deep-dive",
  },
  {
    id: "ep-6",
    title: "Stablecoin Wars: USDC, USDT, and the New Challengers",
    description:
      "Circle's IPO, Tether's reserves controversy, and new entrants from TradFi — an in-depth look at the $200B stablecoin market.",
    audioUrl: "/audio/demo-episode.mp3",
    duration: 1650,
    date: "2026-02-15",
    format: "deep-dive",
  },
];

const DEMO_BRIEFING: AIBriefing = {
  id: "briefing-today",
  title: "Today's Crypto Briefing — March 1, 2026",
  audioUrl: "/audio/demo-briefing.mp3",
  duration: 180,
  transcript: `Good morning. Here's your crypto briefing for Saturday, March 1st, 2026.

Bitcoin is trading at $119,850, up 2.3% over the past 24 hours. Institutional buying remains strong with ETF inflows totaling $1.2 billion this week.

Ethereum is at $6,420 following the successful Pectra upgrade. Gas fees have dropped 40% and staking yields are stabilizing around 4.8%.

In DeFi, total value locked across all chains has reached a new record of $265 billion. Aave and MakerDAO are leading the charge with combined TVL exceeding $45 billion.

Solana is making waves with SOL trading at $340, up 5% on the week. The network processed a record 85,000 transactions per second during a memecoin frenzy yesterday.

Regulatory news: the SEC is expected to announce its decision on multiple altcoin ETF applications next week. Markets are pricing in a 70% chance of approval.

That's your briefing. Stay informed, stay safe, and we'll see you tomorrow.`,
  date: "2026-03-01",
};

const EPISODES_PER_PAGE = 4;

const FORMAT_FILTERS = [
  { value: "all", label: "All" },
  { value: "flash", label: "Flash" },
  { value: "deep-dive", label: "Deep Dive" },
  { value: "market-open", label: "Market Open" },
  { value: "weekly-recap", label: "Weekly Recap" },
] as const;

type FormatFilter = (typeof FORMAT_FILTERS)[number]["value"];

/* ---------- Helpers ---------- */

function formatDurationShort(seconds: number) {
  const m = Math.floor(seconds / 60);
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return `${h}h ${r}m`;
  }
  return `${m} min`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* ---------- Component ---------- */

export default function PodcastClient() {
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [briefing, setBriefing] = useState<AIBriefing | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeEpisode, setActiveEpisode] = useState<Episode | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [briefingPlaying, setBriefingPlaying] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");
  const [copiedEpisodeId, setCopiedEpisodeId] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);

  // Fetch episodes
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/podcast");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && Array.isArray(data?.episodes) && data.episodes.length > 0) {
            setEpisodes(data.episodes);
            setActiveEpisode(data.episodes[0]);
            setLoading(false);
            return;
          }
        }
      } catch {
        // API unavailable — use demo data
      }
      if (!cancelled) {
        setEpisodes(DEMO_EPISODES);
        setActiveEpisode(DEMO_EPISODES[0]);
      }

      try {
        const res = await fetch("/api/ai-anchor");
        if (res.ok) {
          const data = await res.json();
          if (!cancelled && data) {
            setBriefing(data);
            setLoading(false);
            return;
          }
        }
      } catch {
        // API unavailable — use demo data
      }
      if (!cancelled) {
        setBriefing(DEMO_BRIEFING);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredEpisodes =
    formatFilter === "all"
      ? episodes
      : episodes.filter((ep) => ep.format === formatFilter);

  const totalPages = Math.ceil(filteredEpisodes.length / EPISODES_PER_PAGE);
  const paginatedEpisodes = filteredEpisodes.slice(
    page * EPISODES_PER_PAGE,
    (page + 1) * EPISODES_PER_PAGE
  );

  // Reset page when filter changes
  useEffect(() => {
    setPage(0);
  }, [formatFilter]);

  const selectEpisode = useCallback((ep: Episode) => {
    setActiveEpisode(ep);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const copyEpisodeLink = useCallback((ep: Episode) => {
    const url = `${window.location.origin}/podcast?episode=${ep.id}`;
    navigator.clipboard.writeText(url);
    setCopiedEpisodeId(ep.id);
    setTimeout(() => setCopiedEpisodeId(null), 2000);
  }, []);

  const shareEpisode = useCallback((ep: Episode, platform: "x" | "telegram") => {
    const url = `${window.location.origin}/podcast?episode=${ep.id}`;
    const text = encodeURIComponent(ep.title);
    const encodedUrl = encodeURIComponent(url);
    const shareUrl =
      platform === "x"
        ? `https://x.com/intent/tweet?text=${text}&url=${encodedUrl}`
        : `https://t.me/share/url?url=${encodedUrl}&text=${text}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
    setShowShareMenu(null);
  }, []);

  /* ---------- Skeleton loader ---------- */
  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {/* ---- Page header ---- */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <Headphones className="h-7 w-7 text-[var(--color-accent)]" />
          <h1 className="font-serif text-3xl font-bold text-[var(--color-text-primary)] md:text-4xl">
            Podcast &amp; AI Audio News
          </h1>
        </div>
        <p className="max-w-2xl text-[var(--color-text-secondary)]">
          Stay up to date with in-depth crypto podcasts and AI-generated daily briefings
          covering Bitcoin, Ethereum, DeFi, and the wider market.
        </p>
      </header>

      {/* ---- SECTION 1: Featured Episode ---- */}
      {activeEpisode && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)]">
              Now Playing
            </h2>
            {activeEpisode.format && (
              <Badge variant="default" className="ml-2 capitalize">
                {activeEpisode.format.replace("-", " ")}
              </Badge>
            )}
          </div>

          <Card className="overflow-hidden">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  {formatDate(activeEpisode.date)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {formatDurationShort(activeEpisode.duration)}
                </span>
              </div>
              <CardTitle className="text-2xl">{activeEpisode.title}</CardTitle>
              <CardDescription className="line-clamp-none">
                {activeEpisode.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AudioPlayer
                src={activeEpisode.audioUrl}
                title={activeEpisode.title}
                subtitle={`${formatDate(activeEpisode.date)} · ${formatDurationShort(activeEpisode.duration)}`}
              />
            </CardContent>
          </Card>
        </section>
      )}

      {/* ---- SECTION 2: Episode List ---- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-[var(--color-accent)]" />
          <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)]">
            All Episodes
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {paginatedEpisodes.map((ep) => {
            const isExpanded = expandedId === ep.id;
            const isActive = activeEpisode?.id === ep.id;
            return (
              <Card
                key={ep.id}
                className={cn(
                  "transition-colors",
                  isActive && "ring-2 ring-[var(--color-accent)]"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(ep.date)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDurationShort(ep.duration)}
                        </span>
                        {ep.format && (
                          <Badge variant="default" className="capitalize text-[10px]">
                            {ep.format.replace("-", " ")}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base">{ep.title}</CardTitle>
                    </div>
                    <button
                      onClick={() => selectEpisode(ep)}
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-110",
                        isActive
                          ? "bg-[var(--color-accent)] text-[var(--color-text-inverse)]"
                          : "bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-text-inverse)]"
                      )}
                      aria-label={`Play ${ep.title}`}
                    >
                      <Play className="h-4 w-4 ml-0.5" />
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p
                    className={cn(
                      "text-sm text-[var(--color-text-secondary)]",
                      !isExpanded && "line-clamp-2"
                    )}
                  >
                    {ep.description}
                  </p>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                    className="mt-1 flex items-center gap-1 text-xs font-medium text-[var(--color-accent)] hover:underline"
                  >
                    {isExpanded ? (
                      <>
                        Show less <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        Read more <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm text-[var(--color-text-secondary)]">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </section>

      {/* ---- SECTION 3: AI News Briefing ---- */}
      {briefing && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--color-accent)]" />
            <h2 className="font-serif text-xl font-bold text-[var(--color-text-primary)]">
              AI News Briefing
            </h2>
            <Badge variant="live" className="ml-1">
              AI Generated
            </Badge>
          </div>

          <Card className="overflow-hidden border-[var(--color-accent)]/30">
            <CardHeader>
              <CardTitle>{briefing.title}</CardTitle>
              <CardDescription className="line-clamp-none">
                A concise AI-generated audio summary of today&apos;s most important crypto news.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Waveform + play */}
              <div className="flex items-center gap-4 rounded-lg bg-[var(--color-surface-secondary)] p-4">
                <button
                  onClick={() => setBriefingPlaying((p) => !p)}
                  className={cn(
                    "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
                    "bg-[var(--color-accent)] text-[var(--color-text-inverse)]",
                    "transition-transform hover:scale-105 active:scale-95"
                  )}
                  aria-label={briefingPlaying ? "Pause briefing" : "Play briefing"}
                >
                  {briefingPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5 ml-0.5" />
                  )}
                </button>

                <div className="flex-1 space-y-1">
                  <WaveformBars playing={briefingPlaying} className="h-8" />
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-tertiary)]">
                    <span>{formatDate(briefing.date)}</span>
                    <span>{formatDurationShort(briefing.duration)}</span>
                  </div>
                </div>
              </div>

              {/* Transcript toggle */}
              <div>
                <button
                  onClick={() => setShowTranscript((s) => !s)}
                  className="flex items-center gap-1 text-sm font-medium text-[var(--color-accent)] hover:underline"
                >
                  {showTranscript ? (
                    <>
                      Hide Transcript <ChevronUp className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Show Transcript <ChevronDown className="h-4 w-4" />
                    </>
                  )}
                </button>
                {showTranscript && (
                  <div className="mt-3 rounded-lg bg-[var(--color-surface-secondary)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">
                    {briefing.transcript}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
