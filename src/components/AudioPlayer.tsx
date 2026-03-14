"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

interface AudioPlayerProps {
  src: string;
  title: string;
  subtitle?: string;
  className?: string;
  mini?: boolean;
}

const PLAYBACK_SPEEDS = [0.5, 1, 1.5, 2] as const;

function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioPlayer({
  src,
  title,
  subtitle,
  className,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showMini, setShowMini] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  // Track scroll for mini-player
  useEffect(() => {
    if (!playerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowMini(!entry.isIntersecting && isPlaying);
      },
      { threshold: 0 }
    );
    observer.observe(playerRef.current);
    return () => observer.disconnect();
  }, [isPlaying]);

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audio.currentTime = pct * duration;
    },
    [duration]
  );

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (audioRef.current) audioRef.current.volume = val;
  }, []);

  const toggleMute = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isMuted) {
      audio.volume = volume || 1;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  }, [isMuted, volume]);

  // Keyboard shortcuts: Space = play/pause, Arrow keys = seek ±10s, M = mute
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      const audio = audioRef.current;
      if (!audio) return;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "ArrowRight":
          e.preventDefault();
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
          break;
        case "ArrowLeft":
          e.preventDefault();
          audio.currentTime = Math.max(0, audio.currentTime - 10);
          break;
        case "m":
        case "M":
          toggleMute();
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [togglePlay, toggleMute]);

  const changeSpeed = useCallback((speed: number) => {
    setPlaybackRate(speed);
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Main Player */}
      <div
        ref={playerRef}
        className={cn(
          "rounded-xl border border-border bg-(--color-surface) p-5",
          className
        )}
      >
        {/* Title row */}
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={togglePlay}
            className={cn(
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-full",
              "bg-accent text-(--color-text-inverse)",
              "transition-transform hover:scale-105 active:scale-95"
            )}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-serif text-base font-bold text-text-primary">
              {title}
            </p>
            {subtitle && (
              <p className="truncate text-sm text-text-secondary">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-3 space-y-1">
          <div
            ref={progressRef}
            onClick={handleSeek}
            className="group relative h-2 w-full cursor-pointer rounded-full bg-surface-tertiary"
            role="slider"
            aria-label="Seek"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
          >
            <div
              className="absolute left-0 top-0 h-full rounded-full bg-accent transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-(--color-surface) opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
              style={{ left: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-text-tertiary">
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(duration)}</span>
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between gap-4">
          {/* Playback speed */}
          <div className="flex items-center gap-1">
            {PLAYBACK_SPEEDS.map((speed) => (
              <button
                key={speed}
                onClick={() => changeSpeed(speed)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  playbackRate === speed
                    ? "bg-accent text-(--color-text-inverse)"
                    : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
                )}
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Volume */}
          <div className="relative flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="text-text-secondary transition-colors hover:text-text-primary"
              onMouseEnter={() => setShowVolumeSlider(true)}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            {showVolumeSlider && (
              <div
                className="flex items-center gap-2"
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="h-1 w-20 cursor-pointer appearance-none rounded-full bg-surface-tertiary accent-accent"
                  aria-label="Volume"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mini player (sticky bottom) */}
      {showMini && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-(--color-surface) px-4 py-2 shadow-lg">
          <div className="container-main flex items-center gap-3">
            <button
              onClick={togglePlay}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                "bg-accent text-(--color-text-inverse)"
              )}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>
            <p className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
              {title}
            </p>
            <span className="shrink-0 text-xs text-text-tertiary">
              {formatDuration(currentTime)} / {formatDuration(duration)}
            </span>
            {/* Progress bar */}
            <div className="absolute inset-x-0 top-0 h-0.5 bg-surface-tertiary">
              <div
                className="h-full bg-accent transition-[width] duration-100"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ---- Waveform animated bars for AI briefing section ---- */

export function WaveformBars({ playing, className }: { playing: boolean; className?: string }) {
  return (
    <div className={cn("flex items-end gap-0.75", className)} aria-hidden="true">
      {Array.from({ length: 24 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "w-0.75 rounded-full bg-accent transition-all",
            playing ? "animate-waveform" : "h-1"
          )}
          style={{
            animationDelay: playing ? `${(i * 80) % 600}ms` : undefined,
            height: playing ? undefined : "4px",
          }}
        />
      ))}
    </div>
  );
}
