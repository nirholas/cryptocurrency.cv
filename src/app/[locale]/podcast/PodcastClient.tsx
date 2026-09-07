/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Headphones,
  Mic,
  Play,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Radio,
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
import AudioPlayer from "@/components/AudioPlayer";

/* ---------- Types ---------- */

interface Episode {
  id: string;
  title: string;
  description: string;
  /** Streams the generated MP3. Empty when text-to-speech is not configured. */
  audioUrl: string;
  duration: number; // seconds
  date: string;
  format?: string;
  /** The generated script, read end to end. */
  transcript: string;
}

interface AIBriefing {
  id: string;
  title: string;
  audioUrl: string;
  transcript: string;
  date: string;
  duration: number;
}

/* ---------- Episode formats ---------- */

/**
 * The four shows `/api/podcast` can produce. Each is generated on demand from
 * the live news feed and market snapshot, so the library is exactly these four,
 * refreshed, rather than a stored back catalogue.
 */
const EPISODE_FORMATS = ["flash", "market-open", "deep-dive", "weekly-recap"] as const;

type EpisodeFormat = (typeof EPISODE_FORMATS)[number];

/** The script-only payload `/api/podcast?audio=false` answers with. */
interface PodcastScriptResponse {
  audioAvailable?: boolean;
  episode?: {
    id?: string;
    title?: string;
    description?: string;
    format?: string;
    duration?: number;
    generatedAt?: string;
    script?: {
      segments?: { text?: string }[];
      totalDuration?: number;
    };
  };
}

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

/**
 * Turn one `/api/podcast?audio=false` payload into an episode, or null when the
 * generator produced nothing usable. Returning null keeps an unavailable show
 * off the page instead of rendering an empty card.
 */
function toEpisode(format: EpisodeFormat, body: PodcastScriptResponse): Episode | null {
  const episode = body.episode;
  const transcript = (episode?.script?.segments ?? [])
    .map((segment) => segment.text?.trim())
    .filter(Boolean)
    .join("\n\n");

  if (!episode?.title || !transcript) return null;

  const duration = episode.duration ?? episode.script?.totalDuration ?? 0;

  return {
    id: episode.id ?? `podcast-${format}`,
    title: episode.title,
    description: episode.description ?? "",
    // Same route, audio mode: it answers with the MP3 when Google TTS is
    // configured. When it is not, the route answers with JSON, so leave the
    // player unwired rather than pointing it at a request that never plays.
    audioUrl: body.audioAvailable ? `/api/podcast?format=${format}&voice=neutral` : "",
    duration,
    date: episode.generatedAt ?? new Date().toISOString(),
    format,
    transcript,
  };
}


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
  const [showTranscript, setShowTranscript] = useState(false);
  const [formatFilter, setFormatFilter] = useState<FormatFilter>("all");
  const [copiedEpisodeId, setCopiedEpisodeId] = useState<string | null>(null);
  const [showShareMenu, setShowShareMenu] = useState<string | null>(null);

  // Load one episode per show format. Each is generated on demand from the
  // live feed, so the requests run in parallel and the page renders whichever
  // ones answer; a format whose generation fails is simply absent, never
  // stood in for.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Each show is generated on demand and they finish at different times.
      // Waiting for all four left the page on a bare skeleton for six seconds
      // or more, which the health sweep read as an empty page, so each one is
      // rendered as it arrives.
      const loaded: Episode[] = [];

      await Promise.all(
        EPISODE_FORMATS.map(async (format) => {
          try {
            const res = await fetch(`/api/podcast?format=${format}&audio=false`);
            if (!res.ok) return;
            const body = (await res.json()) as PodcastScriptResponse;
            const episode = toEpisode(format, body);
            if (!episode || cancelled) return;

            loaded.push(episode);
            // Keep the library in the declared show order regardless of which
            // request answered first.
            loaded.sort(
              (a, b) =>
                EPISODE_FORMATS.indexOf(a.format as EpisodeFormat) -
                EPISODE_FORMATS.indexOf(b.format as EpisodeFormat),
            );

            setEpisodes([...loaded]);
            setActiveEpisode((current) => current ?? episode);
            setLoading(false);

            if (episode.format === "flash" && episode.transcript) {
              setBriefing({
                id: episode.id,
                title: episode.title,
                audioUrl: episode.audioUrl,
                transcript: episode.transcript,
                date: episode.date,
                duration: episode.duration,
              });
            }
          } catch {
            // A format that cannot be generated is simply absent.
          }
        }),
      );

      if (!cancelled) setLoading(false);
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
          <Headphones className="h-7 w-7 text-accent" />
          <h1 className="font-serif text-3xl font-bold text-text-primary md:text-4xl">
            Podcast &amp; AI Audio News
          </h1>
        </div>
        <p className="max-w-2xl text-text-secondary">
          Stay up to date with in-depth crypto podcasts and AI-generated daily briefings
          covering Bitcoin, Ethereum, DeFi, and the wider market.
        </p>
      </header>

      {/* ---- Empty state: generation produced nothing ---- */}
      {episodes.length === 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="h-5 w-5 text-text-tertiary" />
              No episodes available right now
            </CardTitle>
            <CardDescription>
              Every show here is written from the live news feed the moment you ask for
              it, so this page is empty only while the generator is unreachable. Try
              again in a minute, or read the same stories in text.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={() => window.location.reload()}>Try again</Button>
            <Button variant="outline" onClick={() => { window.location.href = "/"; }}>
              Read the latest news
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---- SECTION 1: Featured Episode ---- */}
      {activeEpisode && (
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl font-bold text-text-primary">
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
              <div className="flex flex-wrap items-center gap-3 text-sm text-text-secondary">
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
              {activeEpisode.audioUrl ? (
                <AudioPlayer
                  src={activeEpisode.audioUrl}
                  title={activeEpisode.title}
                  subtitle={`${formatDate(activeEpisode.date)} · ${formatDurationShort(activeEpisode.duration)}`}
                />
              ) : (
                <p className="text-text-tertiary rounded-lg border border-dashed border-border p-4 text-sm">
                  Narration is unavailable on this deployment, so this episode is
                  published as a written script. The full transcript is below.
                </p>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ---- SECTION 2: Episode List ---- */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio className="h-5 w-5 text-accent" />
          <h2 className="font-serif text-xl font-bold text-text-primary">
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
                  isActive && "ring-2 ring-accent"
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
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
                          ? "bg-accent text-text-inverse"
                          : "bg-surface-secondary text-text-secondary hover:bg-accent hover:text-text-inverse"
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
                      "text-sm text-text-secondary",
                      !isExpanded && "line-clamp-2"
                    )}
                  >
                    {ep.description}
                  </p>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                    className="mt-1 flex items-center gap-1 text-xs font-medium text-accent hover:underline"
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
            <span className="text-sm text-text-secondary">
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
            <Sparkles className="h-5 w-5 text-accent" />
            <h2 className="font-serif text-xl font-bold text-text-primary">
              AI News Briefing
            </h2>
            <Badge variant="live" className="ml-1">
              AI Generated
            </Badge>
          </div>

          <Card className="overflow-hidden border-accent/30">
            <CardHeader>
              <CardTitle>{briefing.title}</CardTitle>
              <CardDescription className="line-clamp-none">
                A concise AI-generated audio summary of today&apos;s most important crypto news.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Playback. The old control here toggled a decorative waveform
                  and never played anything; a real player replaces it, and
                  when no narration exists the section says so. */}
              {briefing.audioUrl ? (
                <AudioPlayer
                  src={briefing.audioUrl}
                  title={briefing.title}
                  subtitle={`${formatDate(briefing.date)} · ${formatDurationShort(briefing.duration)}`}
                />
              ) : (
                <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-4 text-xs text-text-tertiary">
                  <span>Written briefing. Narration is unavailable on this deployment.</span>
                  <span>{formatDate(briefing.date)}</span>
                </div>
              )}

              {/* Transcript toggle */}
              <div>
                <button
                  onClick={() => setShowTranscript((s) => !s)}
                  className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
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
                  <div className="mt-3 rounded-lg bg-surface-secondary p-4 text-sm leading-relaxed text-text-secondary whitespace-pre-line">
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
